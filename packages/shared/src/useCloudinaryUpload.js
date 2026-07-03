// =====================================================================
//  useCloudinaryUpload — upload & suppression d'images via Cloudinary,
//  avec signature générée par l'Edge Function `cloudinary-sign`
//  (le secret Cloudinary n'est JAMAIS exposé au client).
//
//  Renvoie : { uploadImage, deleteImage, loading, error, progress, reset }
//    uploadImage(file, folder) -> { url, publicId, raw }
//    deleteImage(publicId)     -> { result: "ok" | "not found" }
// =====================================================================
import { useCallback, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

// Appelle l'Edge Function pour obtenir une signature serveur.
async function getSignature(body) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      "Supabase n'est pas configuré (voir .env.local) — signature Cloudinary indisponible."
    );
  }
  const { data, error } = await supabase.functions.invoke("cloudinary-sign", { body });
  if (error) {
    // error.message est souvent générique ; on tente de lire le corps renvoyé.
    let detail = error.message || "Échec de la signature Cloudinary.";
    try {
      const ctx = await error.context?.json?.();
      if (ctx?.error) detail = ctx.error;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useCloudinaryUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setProgress(0);
  }, []);

  const uploadImage = useCallback(async (file, folder) => {
    if (!CLOUD_NAME) throw new Error("VITE_CLOUDINARY_CLOUD_NAME manquant (voir .env.local).");
    if (!file) throw new Error("Aucun fichier fourni.");

    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      const { signature, apiKey, params } = await getSignature({
        mode: "upload",
        params: folder ? { folder } : {},
      });

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("signature", signature);
      // Tous les params signés (timestamp, folder, ...) doivent être envoyés tels quels.
      for (const [k, v] of Object.entries(params)) form.append(k, String(v));

      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          let body;
          try {
            body = JSON.parse(xhr.responseText);
          } catch {
            reject(new Error("Réponse Cloudinary illisible."));
            return;
          }
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(body);
          } else {
            reject(new Error(body?.error?.message || `Upload échoué (HTTP ${xhr.status}).`));
          }
        };
        xhr.onerror = () => reject(new Error("Erreur réseau pendant l'upload."));
        xhr.onabort = () => reject(new Error("Upload annulé."));
        xhr.send(form);
      });

      setProgress(100);
      return { url: result.secure_url, publicId: result.public_id, raw: result };
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteImage = useCallback(async (publicId) => {
    if (!CLOUD_NAME) throw new Error("VITE_CLOUDINARY_CLOUD_NAME manquant (voir .env.local).");
    if (!publicId) throw new Error("publicId manquant.");

    setLoading(true);
    setError(null);
    setProgress(0); // delete n'a pas de progression : évite un 100% périmé d'un upload précédent
    try {
      const { signature, timestamp, apiKey } = await getSignature({
        mode: "delete",
        publicId,
      });

      const form = new FormData();
      form.append("public_id", publicId);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
        { method: "POST", body: form }
      );
      let body;
      try {
        body = await res.json();
      } catch {
        throw new Error(`Suppression échouée (HTTP ${res.status}).`);
      }
      // "ok" = supprimé, "not found" = déjà absent (on considère le delete réussi).
      if (body.result !== "ok" && body.result !== "not found") {
        throw new Error(body?.error?.message || `Suppression échouée (${body.result ?? res.status}).`);
      }
      return body;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { uploadImage, deleteImage, loading, error, progress, reset };
}
