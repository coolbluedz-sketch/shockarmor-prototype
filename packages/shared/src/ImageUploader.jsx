// =====================================================================
//  ImageUploader — composant réutilisable d'upload d'images Cloudinary.
//  - Drag & drop OU input file classique
//  - Aperçu avant (local) / après (URL Cloudinary)
//  - Bouton supprimer sur chaque image (appelle le destroy signé)
//  - Barre de progression pendant l'envoi
//
//  Modèle contrôlé :
//    images   : tableau d'objets { url, publicId }
//    onChange : (nextImages) => void
//
//  Couleurs : variables CSS du design system (.bx) avec valeurs de repli,
//  donc utilisable aussi bien dans l'admin qu'isolément.
// =====================================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, X, AlertCircle, Loader2 } from "lucide-react";
import { useCloudinaryUpload } from "./useCloudinaryUpload";

// Keyframes de rotation injectées une seule fois (composant auto-suffisant,
// indépendant du bloc CSS de App.jsx).
function ensureSpinKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById("cldz-spin-style")) return;
  const el = document.createElement("style");
  el.id = "cldz-spin-style";
  el.textContent =
    "@keyframes cldz-spin{to{transform:rotate(360deg)}}" +
    ".cldz-spin{animation:cldz-spin 1s linear infinite}" +
    "@media (prefers-reduced-motion: reduce){.cldz-spin{animation:none}}";
  document.head.appendChild(el);
}

const DEFAULT_LABELS = {
  drop: "Glissez des images ici, ou cliquez pour parcourir",
  hint: "PNG, JPG, WEBP — plusieurs fichiers possibles",
  uploading: "Envoi…",
  remove: "Supprimer l'image",
  maxReached: "Nombre maximum d'images atteint",
  notImage: "Fichier ignoré (type non accepté)",
};

// Construit un prédicat d'acceptation à partir de l'attribut `accept`.
// "image/*" (défaut) => toute image. Sinon respecte la liste (MIME + extensions),
// y compris pour le drag & drop (où l'attribut accept de l'<input> ne s'applique pas).
function makeAcceptMatcher(accept) {
  const spec = (accept || "image/*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (spec.length === 0 || spec.includes("*/*") || spec.includes("image/*")) {
    return (f) => f.type.startsWith("image/");
  }
  return (f) =>
    spec.some((rule) => {
      if (rule.startsWith(".")) return f.name.toLowerCase().endsWith(rule.toLowerCase());
      if (rule.endsWith("/*")) return f.type.startsWith(rule.slice(0, -1));
      return f.type === rule;
    });
}

export default function ImageUploader({
  images = [],
  onChange,
  folder = "products",
  max = 6,
  accept = "image/*",
  labels = {},
  disabled = false,
}) {
  const L = { ...DEFAULT_LABELS, ...labels };
  const { uploadImage, deleteImage, error, progress } = useCloudinaryUpload();
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [pending, setPending] = useState(null); // { previewUrl } en cours d'upload
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    ensureSpinKeyframes();
  }, []);

  // Révoque l'object URL du tile "pending" au démontage.
  useEffect(() => {
    return () => {
      if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    };
  }, [pending]);

  const atMax = images.length >= max;
  const interactionsLocked = disabled || busy;

  const handleFiles = useCallback(
    async (fileList) => {
      setLocalError(null);
      const all = Array.from(fileList || []);
      const accepts = makeAcceptMatcher(accept);
      const files = all.filter(accepts);
      if (files.length < all.length) setLocalError(L.notImage);
      if (files.length === 0) return;

      setBusy(true);
      // On part de l'état courant et on l'enrichit au fur et à mesure.
      let current = images.slice();
      let failures = 0;
      try {
        for (const file of files) {
          if (current.length >= max) {
            setLocalError(L.maxReached);
            break;
          }
          const previewUrl = URL.createObjectURL(file);
          setPending({ previewUrl });
          try {
            const { url, publicId } = await uploadImage(file, folder);
            current = [...current, { url, publicId }];
            onChange?.(current);
          } catch {
            // échec d'UN fichier : on le compte et on poursuit avec les suivants
            failures++;
          } finally {
            URL.revokeObjectURL(previewUrl);
            setPending(null);
          }
        }
      } finally {
        setBusy(false);
      }
      if (failures > 0) setLocalError(`${failures} image(s) n'ont pas pu être envoyées.`);
    },
    [images, max, folder, accept, uploadImage, onChange, L.maxReached, L.notImage]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (interactionsLocked || atMax) return;
    handleFiles(e.dataTransfer.files);
  };

  const onInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = ""; // permet de re-sélectionner le même fichier
  };

  const onRemove = async (img) => {
    if (interactionsLocked) return;
    setLocalError(null);
    setBusy(true); // verrou global : sérialise delete/upload → pas de last-write-wins
    setDeletingId(img.publicId || img.url);
    try {
      if (img.publicId) await deleteImage(img.publicId);
      onChange?.(images.filter((x) => x !== img));
    } catch {
      /* erreur exposée via le hook */
    } finally {
      setDeletingId(null);
      setBusy(false);
    }
  };

  const openPicker = () => {
    if (!interactionsLocked && !atMax) inputRef.current?.click();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  return (
    <div style={S.wrap}>
      {/* Zone de dépôt */}
      {!atMax && (
        <div
          role="button"
          tabIndex={interactionsLocked ? -1 : 0}
          aria-disabled={interactionsLocked}
          onClick={openPicker}
          onKeyDown={onKeyDown}
          onDragOver={(e) => {
            e.preventDefault();
            if (!interactionsLocked) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            ...S.dropzone,
            ...(dragOver ? S.dropzoneActive : null),
            ...(interactionsLocked ? S.dropzoneDisabled : null),
          }}
        >
          <UploadCloud size={28} aria-hidden style={{ color: "var(--blue, #0090E3)" }} />
          <div style={S.dropText}>{L.drop}</div>
          <div style={S.hint}>{L.hint}</div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            onChange={onInputChange}
            disabled={interactionsLocked}
            style={{ display: "none" }}
          />
        </div>
      )}

      {/* Barre de progression — uniquement pendant un upload (pas pendant un delete) */}
      {pending && (
        <div style={S.progressRow} aria-live="polite">
          <Loader2 size={16} className="cldz-spin" aria-hidden />
          <div style={S.progressTrack}>
            <div style={{ ...S.progressBar, width: `${progress}%` }} />
          </div>
          <span style={S.progressPct}>
            {L.uploading} {progress}%
          </span>
        </div>
      )}

      {/* Erreurs */}
      {(error || localError) && (
        <div style={S.error} role="alert">
          <AlertCircle size={15} aria-hidden />
          <span>{localError || error}</span>
        </div>
      )}

      {/* Galerie : images déjà uploadées + tile en cours */}
      {(images.length > 0 || pending) && (
        <div style={S.grid}>
          {images.map((img, i) => {
            const id = img.publicId || img.url;
            const isDeleting = deletingId === id;
            return (
              <figure key={id} style={S.tile}>
                <img src={img.url} alt={`Image ${i + 1}`} style={S.img} />
                <button
                  type="button"
                  onClick={() => onRemove(img)}
                  disabled={interactionsLocked || isDeleting}
                  aria-label={`${L.remove} ${i + 1}`}
                  title={`${L.remove} ${i + 1}`}
                  style={S.removeBtn}
                >
                  {isDeleting ? (
                    <Loader2 size={14} className="cldz-spin" aria-hidden />
                  ) : (
                    <X size={14} aria-hidden />
                  )}
                </button>
              </figure>
            );
          })}

          {pending && (
            <figure style={{ ...S.tile, ...S.tilePending }}>
              <img src={pending.previewUrl} alt="" style={{ ...S.img, opacity: 0.55 }} />
              <div style={S.pendingOverlay}>
                <Loader2 size={18} className="cldz-spin" aria-hidden />
                <span style={S.pendingPct}>{progress}%</span>
              </div>
            </figure>
          )}
        </div>
      )}
    </div>
  );
}

const S = {
  wrap: { display: "flex", flexDirection: "column", gap: 12 },
  dropzone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "22px 16px",
    border: "2px dashed var(--line, #E5EDF4)",
    borderRadius: 16,
    background: "var(--mist, #EFF7FE)",
    cursor: "pointer",
    textAlign: "center",
    transition: "border-color .15s, background .15s",
    outline: "none",
  },
  dropzoneActive: {
    borderColor: "var(--blue, #0090E3)",
    background: "rgba(0,144,227,.08)",
  },
  dropzoneDisabled: { opacity: 0.6, cursor: "not-allowed" },
  dropText: { fontWeight: 600, color: "var(--ink, #0F2233)", fontSize: 14 },
  hint: { fontSize: 12, color: "var(--muted, #637588)" },
  progressRow: { display: "flex", alignItems: "center", gap: 8 },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    background: "var(--line, #E5EDF4)",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    background: "var(--blue, #0090E3)",
    transition: "width .2s ease",
  },
  progressPct: { fontSize: 12, color: "var(--muted, #637588)", whiteSpace: "nowrap" },
  error: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "var(--red, #F0453A)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
    gap: 10,
  },
  tile: {
    position: "relative",
    margin: 0,
    aspectRatio: "1 / 1",
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid var(--line, #E5EDF4)",
    background: "var(--paper, #FFFFFF)",
  },
  tilePending: { borderStyle: "dashed" },
  img: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    display: "grid",
    placeItems: "center",
    borderRadius: 999,
    border: "none",
    background: "rgba(15,34,51,.72)",
    color: "#fff",
    cursor: "pointer",
  },
  pendingOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    color: "var(--ink, #0F2233)",
  },
  pendingPct: { fontSize: 12, fontWeight: 600 },
};
