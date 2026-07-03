# ShockArmor — Prototype

Prototype de **boutique e-commerce d'accessoires de protection antichoc** (coques, verres trempés, bumpers, housses) pour le marché algérien.
**Paiement à la livraison (COD)** uniquement, **trilingue FR / EN / AR** (avec RTL pour l'arabe), plus une **interface d'administration** complète.

> ⚠️ « ShockArmor » est un **nom provisoire** à remplacer par le vrai nom de la boutique.

## Démarrer

Monorepo (npm workspaces) : deux apps séparées + un package partagé.

```bash
npm install            # installe tout le monorepo
npm run dev:boutique   # boutique publique  (http://localhost:5173)
npm run dev:admin      # admin (lancer séparément ; même port par défaut)
npm run build          # build des deux apps
```

- **Boutique** : catalogue + panier + checkout COD.
- **Admin** : login (Supabase Auth ; **compte de rôle `admin` requis** — voir `docs/cloudinary-setup.md`),
  gestion produits/gammes/commandes/livraison, upload d'images.

Sans `.env.local` (Supabase non configuré), les apps tournent en **mode démo** (données en mémoire,
login admin factice). Avec `.env.local` renseigné, elles lisent/écrivent dans Supabase.

## Important

- **Persistance** : via Supabase (catalogue, commandes, frais) + Cloudinary (images). En mode démo, tout est réinitialisé au rechargement.
- Le **logo est original** : ne jamais utiliser le logo Coolblue (marque déposée).

## Continuer le développement

- **`CLAUDE.md`** — contexte complet, design system, modèle de données, règles métier, architecture et **avancement**. À lire en premier.
- **`docs/`** — `supabase-schema.sql` + migrations, `supabase-setup.md`, `cloudinary-setup.md`, `whatsapp-setup.md`.

## Structure (monorepo npm workspaces)

```
.
├── CLAUDE.md · README.md
├── package.json                 # racine (workspaces + scripts dev/build)
├── docs/                        # schéma SQL, migrations, guides Supabase/Cloudinary/WhatsApp
├── scripts/test-cloudinary.mjs  # test end-to-end de la chaîne Cloudinary
├── supabase/
│   ├── config.toml
│   └── functions/               # cloudinary-sign, notify-order (Edge Functions)
├── packages/shared/src/         # commun (importé via l'alias @shared)
│   ├── core.jsx                 # C, CSS, T, WILAYAS, SEED_*, ProductArt, Logo, LangSwitch, ProductVisual
│   ├── supabaseClient.js · api.js · mappers.js
│   ├── useCloudinaryUpload.js · ImageUploader.jsx
│   └── index.js                 # barrel
└── apps/
    ├── boutique/                # app publique (App.jsx + Shop.jsx)
    └── admin/                   # app privée  (App.jsx + Admin.jsx)
```
