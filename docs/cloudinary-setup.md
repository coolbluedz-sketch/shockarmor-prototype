# Cloudinary — upload & suppression d'images (signés)

Intégration d'upload **et** de suppression d'images via **Cloudinary**, avec
signature générée côté serveur par l'Edge Function Supabase `cloudinary-sign`.
Le **secret Cloudinary n'est jamais exposé au client**.

> ℹ️ Le `CLAUDE.md` §8 mentionnait Supabase Storage pour les photos produits ;
> ce module Cloudinary le remplace pour la gestion d'images. Les URLs Cloudinary
> peuvent toujours être stockées dans `products.images[]`.

## Pièces livrées

| Fichier | Rôle |
|---|---|
| [`supabase/functions/cloudinary-sign/index.ts`](../supabase/functions/cloudinary-sign/index.ts) | Signe `upload` et `delete` (SHA-1) sans exposer le secret |
| [`src/hooks/useCloudinaryUpload.js`](../src/hooks/useCloudinaryUpload.js) | `uploadImage(file, folder) → {url, publicId, raw}`, `deleteImage(publicId)`, état `loading/error/progress` + `reset` |
| [`src/components/ImageUploader.jsx`](../src/components/ImageUploader.jsx) | Drag & drop, aperçu, suppression, barre de progression |
| [`.env.example`](../.env.example) | Variable **client** (`VITE_CLOUDINARY_CLOUD_NAME`) |
| [`supabase/functions/.env.example`](../supabase/functions/.env.example) | Secrets **serveur** (`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) |

## Variables d'environnement

**Client (Vite)** — `.env.local` à la racine :
```
VITE_CLOUDINARY_CLOUD_NAME=votre_cloud_name
```
Seul le *cloud name* est public. Tout ce qui est préfixé `VITE_` est inclus dans
le bundle front-end : n'y mettez **jamais** l'API key ni le secret.

**Serveur (Edge Function)** — secrets Supabase, jamais dans le bundle :
```
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
REQUIRE_AUTH=true
```

## Configurer les secrets sur Supabase

### Option A — CLI (recommandé)
```bash
# Lier le projet (une seule fois)
supabase link --project-ref VOTRE_REF_PROJET

# Définir les secrets de l'Edge Function
supabase secrets set CLOUDINARY_API_KEY=xxxxxxxx
supabase secrets set CLOUDINARY_API_SECRET=yyyyyyyy
supabase secrets set REQUIRE_AUTH=true

# (ou en lot depuis un fichier)
supabase secrets set --env-file ./supabase/functions/.env

# Vérifier
supabase secrets list
```

### Option B — Dashboard
**Project Settings → Edge Functions → Secrets** → *Add secret* pour chacune des
variables ci-dessus.

> `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont fournis automatiquement à la
> fonction par la plateforme : inutile de les déclarer.

## Compte admin (rôle requis)

La fonction n'accepte que les utilisateurs Supabase **de rôle `admin`**
(`app_metadata.role === "admin"`). Après avoir créé le compte admin
(Authentication → Users), définissez son rôle :

- **Dashboard** : Authentication → Users → (l'utilisateur) → *User Metadata* →
  **App Metadata** → ajouter `{ "role": "admin" }`.
- **Ou via l'Admin API** (clé `service_role`, côté serveur) :
  `supabase.auth.admin.updateUserById(id, { app_metadata: { role: "admin" } })`.

> `app_metadata` n'est pas modifiable par l'utilisateur (contrairement à
> `user_metadata`) : c'est l'endroit sûr pour un rôle. Alternative possible :
> une table `admins(user_id)` interrogée via la clé `service_role` (auto-injectée).
> Pensez aussi à **désactiver l'inscription publique** (Authentication → Providers
> → Email → *Enable sign-ups*) pour éviter la création de comptes non maîtrisés.

## Déployer l'Edge Function
```bash
supabase functions deploy cloudinary-sign
```
La vérification du JWT est **épinglée** dans [`supabase/config.toml`](../supabase/config.toml)
(`verify_jwt = true`). En plus de cette couche plateforme, la fonction exige un
utilisateur **authentifié ET admin** (`REQUIRE_AUTH=true` par défaut).

Pour un test local **sans aucune authentification**, il faut désactiver la
vérification JWT de la passerelle **en plus** du contrôle applicatif :
```bash
supabase functions serve cloudinary-sign --no-verify-jwt --env-file ./supabase/functions/.env
# avec, dans ce fichier (TEST UNIQUEMENT) : REQUIRE_AUTH=false ET LOCAL_DEV=1
```
> `REQUIRE_AUTH=false` n'est lu qu'**à l'intérieur** du handler : il ne désactive
> pas la passerelle JWT (qui s'exécute avant). Sans `--no-verify-jwt`, un appel
> local sans en-tête `Authorization` valide est rejeté en 401 avant d'atteindre
> la fonction. Par sécurité, le bypass exige les **deux** marqueurs
> (`REQUIRE_AUTH=false` ET `LOCAL_DEV=1`) : un `REQUIRE_AUTH=false` déployé par
> erreur en prod reste donc sans effet.

## Utilisation côté React

```jsx
import { useState } from "react";
import ImageUploader from "./components/ImageUploader";

function ProductImages() {
  // images = [{ url, publicId }]
  const [images, setImages] = useState([]);
  return (
    <ImageUploader
      images={images}
      onChange={setImages}
      folder="products"
      max={6}
    />
  );
}
```

Ou directement via le hook :
```js
const { uploadImage, deleteImage, loading, error, progress, reset } = useCloudinaryUpload();
// raw = réponse Cloudinary brute (width, height, format, bytes, ...)
const { url, publicId, raw } = await uploadImage(file, "products");
await deleteImage(publicId);
reset(); // remet loading=false, error=null, progress=0
```

> Le `folder` est **contraint côté serveur** au dossier `CLOUDINARY_FOLDER`
> (défaut `products`) et à ses sous-dossiers ; une valeur hors périmètre est
> rejetée (403). Le `public_id` envoyé au delete doit lui aussi commencer par ce
> dossier.

### Brancher dans l'admin (ProductEditor)
Le composant `ProductEditor` de `src/App.jsx` gère le champ `images` du produit.
Pour l'intégrer : remplacer la saisie d'URL par
`<ImageUploader images={...} onChange={...} folder="products" />`, en mappant
`{ url, publicId }` vers/depuis `products.images[]`. (Penser à conserver le
`publicId` pour pouvoir supprimer côté Cloudinary.)

## Sécurité — points clés

- Le secret Cloudinary reste **exclusivement** dans l'Edge Function.
- L'upload **et** le delete utilisent une signature **générée par le serveur** :
  le client ne peut pas forger de requête sans passer par la fonction.
- **Auth + rôle** : la fonction rejette les appels non authentifiés (401) **et**
  les utilisateurs non-admin (403). Seul un utilisateur Supabase de rôle `admin`
  obtient une signature.
- **Périmètre** : upload et delete sont restreints au dossier `CLOUDINARY_FOLDER`
  (défaut `products`) → impossible d'écraser/supprimer un asset hors de ce dossier.
- La fonction ne signe que des **paramètres whitelistés** pour l'upload
  (`tags`, `context`, `eager`, `transformation`) ; `folder` est contraint au
  périmètre et `public_id` n'est **pas** signable à l'upload (anti-écrasement).
- `verify_jwt = true` est épinglé dans `supabase/config.toml` (défense en profondeur).

### Invariant de signature (à ne jamais casser)
L'ensemble des paramètres **signés** par l'Edge Function doit rester
**strictement identique** à l'ensemble **envoyé** dans le form-data à Cloudinary
(hors `file`, `api_key`, `signature`, et `cloud_name`/`resource_type` qui sont
hors signature). Concrètement :
- À l'upload, le client renvoie l'objet `params` retourné par la fonction **tel
  quel** (mêmes clés, même sérialisation), sans rien ajouter ni retirer.
- N'ajoutez jamais un `form.append(...)` d'un champ signable sans l'ajouter à
  `ALLOWED_UPLOAD_PARAMS` **et** le faire signer (et inversement) — sinon
  Cloudinary renvoie « Invalid Signature », difficile à diagnostiquer.
- Sérialisation cohérente : le serveur signe via `${k}=${v}`, le client envoie
  `String(v)`. Pour un futur param non scalaire (array/objet), aligner
  explicitement la sérialisation des deux côtés.
