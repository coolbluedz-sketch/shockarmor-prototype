// =====================================================================
//  Test end-to-end ISOLÉ de la chaîne Cloudinary (sans l'app React).
//
//  Exerce la vraie chaîne réelle :
//    1. connexion admin (Supabase Auth)
//    2. appel de l'Edge Function DÉPLOYÉE `cloudinary-sign` (signature upload)
//    3. upload réel d'une image 1x1 vers Cloudinary
//    4. signature delete via la fonction, puis destroy Cloudinary
//
//  Le secret Cloudinary n'est JAMAIS lu par ce script : il reste côté fonction.
//
//  Prérequis :
//    - .env.local rempli (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY /
//      VITE_CLOUDINARY_CLOUD_NAME)
//    - Edge Function déployée : npx supabase functions deploy cloudinary-sign
//    - Un compte admin existe (Authentication → Users) avec
//      app_metadata.role = "admin"
//
//  Lancer depuis la racine du projet (PowerShell) :
//    $env:ADMIN_EMAIL="admin@exemple.dz"; $env:ADMIN_PASSWORD="motdepasse"
//    node scripts/test-cloudinary.mjs
//  (ou : node scripts/test-cloudinary.mjs admin@exemple.dz motdepasse)
// =====================================================================
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ok = (m) => console.log(`\x1b[32m✓\x1b[0m ${m}`);
const info = (m) => console.log(`\x1b[36m•\x1b[0m ${m}`);
const fail = (m) => console.error(`\x1b[31m✗\x1b[0m ${m}`);

// 1x1 PNG transparent (data URI) — image de test minimale.
const TEST_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function parseEnvFile(path) {
  const out = {};
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return out;
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

async function callSign(supabaseUrl, anonKey, accessToken, body) {
  const res = await fetch(`${supabaseUrl}/functions/v1/cloudinary-sign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* réponse non-JSON */
  }
  if (!res.ok) {
    const hint =
      res.status === 401
        ? "Session non reconnue par la fonction (token/verify_jwt)."
        : res.status === 403
        ? "Connecté mais PAS admin → définis app_metadata.role='admin' (voir docs/cloudinary-setup.md)."
        : res.status === 404
        ? "Fonction non déployée → npx supabase functions deploy cloudinary-sign."
        : res.status >= 500
        ? "Erreur serveur → secrets Cloudinary manquants ? (npx supabase secrets list)."
        : "";
    throw new Error(
      `Edge Function HTTP ${res.status} : ${json?.error || text || "(vide)"}${hint ? "\n   → " + hint : ""}`
    );
  }
  return json;
}

async function cloudinaryUpload(cloud, sign) {
  const form = new FormData();
  form.append("file", TEST_IMAGE);
  form.append("api_key", sign.apiKey);
  form.append("signature", sign.signature);
  for (const [k, v] of Object.entries(sign.params)) form.append(k, String(v));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      `Cloudinary upload HTTP ${res.status} : ${json?.error?.message || "(illisible)"}` +
        "\n   → Vérifie VITE_CLOUDINARY_CLOUD_NAME et les secrets API_KEY/API_SECRET."
    );
  }
  return json;
}

async function cloudinaryDestroy(cloud, sign, publicId) {
  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("signature", sign.signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, {
    method: "POST",
    body: form,
  });
  return res.json().catch(() => null);
}

async function main() {
  const env = parseEnvFile("./.env.local");
  const SUPABASE_URL = env.VITE_SUPABASE_URL;
  const ANON = env.VITE_SUPABASE_ANON_KEY;
  const CLOUD = env.VITE_CLOUDINARY_CLOUD_NAME;
  const email = process.argv[2] || process.env.ADMIN_EMAIL;
  const password = process.argv[3] || process.env.ADMIN_PASSWORD;

  info(`Supabase URL : ${SUPABASE_URL || "(manquant)"}`);
  info(`Cloudinary cloud : ${CLOUD || "(manquant)"}`);

  const missing = [];
  if (!SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
  if (!ANON) missing.push("VITE_SUPABASE_ANON_KEY");
  if (!CLOUD) missing.push("VITE_CLOUDINARY_CLOUD_NAME");
  if (missing.length) throw new Error(`.env.local incomplet : ${missing.join(", ")}`);
  if (!email || !password)
    throw new Error(
      "Identifiants admin manquants.\n" +
        '   PowerShell : $env:ADMIN_EMAIL="..."; $env:ADMIN_PASSWORD="..."; node scripts/test-cloudinary.mjs'
    );

  // 1) Connexion admin
  const supabase = createClient(SUPABASE_URL, ANON);
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
  if (authErr || !auth?.session) {
    throw new Error(
      `Connexion échouée : ${authErr?.message || "pas de session"}` +
        "\n   → Vérifie l'email/mot de passe et que l'utilisateur existe (Authentication → Users)."
    );
  }
  ok(`Connecté en tant que ${auth.user.email}`);
  const token = auth.session.access_token;

  // 2) Signature upload via la fonction déployée
  const upSign = await callSign(SUPABASE_URL, ANON, token, { mode: "upload", params: { folder: "products" } });
  ok(`Signature upload obtenue (folder="${upSign.params?.folder}", ts=${upSign.timestamp})`);

  // 3) Upload réel vers Cloudinary
  const uploaded = await cloudinaryUpload(CLOUD, upSign);
  ok(`Upload Cloudinary OK`);
  info(`   public_id : ${uploaded.public_id}`);
  info(`   URL       : ${uploaded.secure_url}`);

  // 4) Signature delete + destroy
  const delSign = await callSign(SUPABASE_URL, ANON, token, { mode: "delete", publicId: uploaded.public_id });
  ok(`Signature delete obtenue`);
  const destroyed = await cloudinaryDestroy(CLOUD, delSign, uploaded.public_id);
  if (destroyed?.result === "ok") ok(`Suppression Cloudinary OK (result="ok")`);
  else throw new Error(`Destroy inattendu : ${JSON.stringify(destroyed)}`);

  console.log("\n\x1b[32m✓ Chaîne complète validée : auth → signature → upload → delete.\x1b[0m");
  await supabase.auth.signOut();
}

main().catch((e) => {
  fail(e.message);
  process.exit(1);
});
