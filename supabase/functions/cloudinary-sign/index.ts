// =====================================================================
//  Edge Function : cloudinary-sign
//  Génère des signatures Cloudinary SIGNÉES côté serveur, sans jamais
//  exposer CLOUDINARY_API_SECRET au client.
//
//  - mode "upload" : signe (timestamp + folder + params autorisés)
//  - mode "delete" : signe (public_id + timestamp) pour l'API destroy
//
//  Sécurité :
//   - Exige un utilisateur Supabase AUTHENTIFIÉ ET de rôle "admin"
//     (app_metadata.role === "admin"). Voir docs/cloudinary-setup.md.
//   - Le périmètre upload/delete est limité au dossier CLOUDINARY_FOLDER
//     (défaut "products") : impossible de toucher des assets hors de ce dossier.
//   - Le bypass d'auth n'est possible qu'en test local explicite
//     (REQUIRE_AUTH=false ET LOCAL_DEV=1).
//
//  Déploiement :  supabase functions deploy cloudinary-sign
//  Secrets     :  voir supabase/functions/.env.example et docs/cloudinary-setup.md
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2";

// Paramètres que le client est autorisé à faire signer pour un upload.
// NB: `public_id` est volontairement EXCLU pour empêcher l'écrasement d'un
// asset arbitraire ; Cloudinary génère alors un public_id dans le dossier.
const ALLOWED_UPLOAD_PARAMS = ["tags", "context", "eager", "transformation"];

const DEFAULT_FOLDER = "products";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// SHA-1 hex via Web Crypto (disponible dans le runtime Deno de Supabase).
async function sha1Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Chaîne à signer Cloudinary : params triés alpha, "k=v" joints par "&".
// Les valeurs vides/nulles sont exclues (et ne doivent donc PAS être envoyées).
//
// INVARIANT CRITIQUE : l'ensemble des champs signés ici DOIT être strictement
// identique à l'ensemble envoyé dans le form-data côté client (hors file,
// api_key, signature, cloud_name, resource_type), avec la même sérialisation.
function signableString(params: Record<string, unknown>): string {
  return Object.keys(params)
    .filter((k) => {
      const v = params[k];
      return v !== undefined && v !== null && v !== "";
    })
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
}

// Dossier autorisé (sans slash final). Tout upload/delete doit rester dedans.
function baseFolder(): string {
  return (Deno.env.get("CLOUDINARY_FOLDER") ?? DEFAULT_FOLDER).replace(/\/+$/, "");
}

// Valide qu'un dossier demandé reste dans le périmètre autorisé.
function isFolderInScope(folder: string, base: string): boolean {
  return folder === base || folder.startsWith(base + "/");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Garde-fou global : toute exception inattendue renvoie une 500 AVEC CORS
  // (sinon le navigateur voit une erreur opaque au lieu du vrai message).
  try {
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
    if (!apiKey || !apiSecret) {
      return json({ error: "Cloudinary secrets non configurés sur le serveur" }, 500);
    }

    // --- Sécurité : utilisateur authentifié + rôle admin obligatoires. ---
    // Bypass possible UNIQUEMENT en test local explicite (les deux marqueurs).
    const bypassAuth =
      Deno.env.get("REQUIRE_AUTH") === "false" && Deno.env.get("LOCAL_DEV") === "1";

    if (!bypassAuth) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (!supabaseUrl || !anonKey) {
        return json({ error: "Environnement Supabase manquant" }, 500);
      }
      const supabase = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      let user;
      try {
        const { data, error } = await supabase.auth.getUser();
        user = data?.user;
        if (error || !user) return json({ error: "Non autorisé" }, 401);
      } catch {
        // getUser peut rejeter (réseau/DNS/timeout) → échec fermé en 401.
        return json({ error: "Non autorisé" }, 401);
      }

      // Vérification du rôle admin (app_metadata est contrôlé côté serveur,
      // non modifiable par l'utilisateur). Voir docs pour l'alternative table `admins`.
      const role = (user.app_metadata as Record<string, unknown> | undefined)?.role;
      if (role !== "admin") {
        return json({ error: "Accès réservé aux administrateurs" }, 403);
      }
    }

    let payload: { mode?: string; params?: Record<string, unknown>; publicId?: string };
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Corps JSON invalide" }, 400);
    }

    const mode = payload?.mode;
    const timestamp = Math.round(Date.now() / 1000);
    const base = baseFolder();

    // ----- UPLOAD -----
    if (mode === "upload") {
      const requested = payload?.params ?? {};

      // Le dossier est contraint au périmètre autorisé (défaut = base).
      let folder = base;
      if (requested.folder !== undefined && requested.folder !== null && requested.folder !== "") {
        folder = String(requested.folder).replace(/\/+$/, "");
        if (!isFolderInScope(folder, base)) {
          return json({ error: "folder hors périmètre autorisé" }, 403);
        }
      }

      const params: Record<string, unknown> = { folder, timestamp };
      for (const key of ALLOWED_UPLOAD_PARAMS) {
        const v = requested[key];
        if (v !== undefined && v !== null && v !== "") {
          params[key] = v;
        }
      }
      const signature = await sha1Hex(signableString(params) + apiSecret);
      // `params` contient EXACTEMENT les champs signés : le client doit les
      // renvoyer tels quels à l'upload (ne rien ajouter/retirer).
      return json({ signature, timestamp, apiKey, params });
    }

    // ----- DELETE (destroy) -----
    if (mode === "delete") {
      const publicId = payload?.publicId;
      if (!publicId || typeof publicId !== "string") {
        return json({ error: "publicId requis" }, 400);
      }
      // Périmètre : on ne signe que la destruction d'assets du dossier géré.
      if (!publicId.startsWith(base + "/")) {
        return json({ error: "public_id hors périmètre autorisé" }, 403);
      }
      const params = { public_id: publicId, timestamp };
      const signature = await sha1Hex(signableString(params) + apiSecret);
      return json({ signature, timestamp, apiKey, publicId });
    }

    return json({ error: "mode invalide (attendu 'upload' ou 'delete')" }, 400);
  } catch (e) {
    console.error("cloudinary-sign erreur non gérée:", e);
    return json({ error: "Erreur interne" }, 500);
  }
});
