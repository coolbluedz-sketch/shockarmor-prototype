# Mise en route Supabase

Procédure pour brancher le prototype sur un vrai backend Supabase.
Voir aussi `CLAUDE.md` §5 (modèle de données) et §8 (étapes).

## 1. Créer le projet (à faire par vous — nécessite votre compte)

1. Aller sur https://supabase.com → **New project**.
2. Choisir une région proche (ex. *West EU*), définir un mot de passe Postgres.
3. Attendre la fin du provisioning (~2 min).

## 2. Appliquer le schéma puis le seed

Dans le dashboard → **SQL Editor** → *New query*, exécuter **dans cet ordre** :

1. Coller le contenu de [`supabase-schema.sql`](supabase-schema.sql) → **Run**
   (tables + RLS + RPC `confirm_order`).
2. Coller le contenu de [`supabase-seed.sql`](supabase-seed.sql) → **Run**
   (58 wilayas + tarifs, 4 gammes, 9 produits de démo). Ré-exécutable sans erreur.

> Vérification rapide : `select count(*) from wilayas;` doit renvoyer **58**,
> `select count(*) from products;` doit renvoyer **9**.

## 3. Récupérer les clés API

Dashboard → **Project Settings → API** :
- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** key → `VITE_SUPABASE_ANON_KEY`

Copier `.env.example` en **`.env.local`** et renseigner ces deux valeurs.
`.env.local` est ignoré par git ; ne jamais committer de vraies clés, et ne
**jamais** mettre la clé `service_role` dans le front-end.

## 4. Compte admin

Dashboard → **Authentication → Users → Add user** : créer l'e-mail/mot de passe
qui servira à se connecter à l'interface admin (le login factice actuel sera
remplacé par Supabase Auth — voir §8 tâche 5).

## 5. Storage (photos produits) — quand on branchera l'admin

Dashboard → **Storage → New bucket** : nom `product-images`, accès **public**
(lecture). Les URLs des photos seront stockées dans `products.images[]`.

---

## État de l'intégration (avancement §8)

- [x] **2.** Seed SQL généré (`docs/supabase-seed.sql`).
- [x] **3.** Module client (`src/lib/supabaseClient.js`) + `.env.example` + dépendance
  `@supabase/supabase-js`. Tant que `.env.local` n'est pas renseigné, le proto
  tourne en mémoire (`isSupabaseConfigured === false`).
- [ ] **4.** Boutique → Supabase (lecture catalogue, insertion commandes).
- [ ] **5.** Admin → Supabase (Auth, CRUD, Storage, RPC `confirm_order`).
- [ ] **6.** Notification WhatsApp automatique (Edge Function).
- [ ] **7.** Séparation en deux apps + package `shared`.
- [ ] **8.** Renommage « ShockArmor ».
