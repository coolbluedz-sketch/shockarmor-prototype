# CLAUDE.md — Guide de reprise du développement

> Ce fichier est destiné à **Claude Code** (et à toute personne reprenant le projet).
> Il décrit l'état actuel, les décisions, les règles métier et les prochaines étapes.
> **À lire en entier avant de coder.**

---

## 1. Contexte & objectif

Boutique e-commerce pour la vente d'**accessoires de protection antichoc** pour smartphones et tablettes
(coques renforcées, verres trempés, bumpers/coins, housses) sur le **marché algérien**.

Caractéristiques imposées par le métier :
- **Paiement à la livraison (COD) uniquement.** Aucun paiement en ligne, pas de SATIM.
- **Trilingue FR / EN / AR**, avec **RTL** complet pour l'arabe.
- **Livraison sur les 58 wilayas**, avec une grille de tarifs par wilaya (domicile + stop-desk).
- Notification de nouvelle commande : tableau de bord admin **+ lien WhatsApp** prérempli.

⚠️ **« ShockArmor » est un nom PROVISOIRE.** À remplacer partout par le vrai nom de la boutique
(texte du logo, messages WhatsApp `waMsg`, e-mail de login de démo, `<title>`...).

---

## 2. État actuel du projet

Ce repo est un **monorepo** (npm workspaces) de **deux apps React/Vite** — `apps/boutique` (public)
et `apps/admin` (privé) — partageant `packages/shared`, branchées sur **Supabase** (données + Auth)
et **Cloudinary** (images). Voir §3 et §7.

> Sans `.env.local` (Supabase non configuré), chaque app tourne en **mode démo** sur des données en
> mémoire (`SEED_*` dans `packages/shared/src/core.jsx`), réinitialisées à chaque rechargement, avec
> login admin factice. Dès que `.env.local` est renseigné, les apps lisent/écrivent dans Supabase.

### Déjà implémenté

**Boutique (public)**
- Accueil : hero, gammes (carrousel horizontal avec flèches sur mobile), meilleures ventes.
- Catalogue : filtres par gamme, recherche.
- Fiche produit (modale) : prix, prix barré, description, marque/modèle, SKU, hauteur de chute testée, stock.
- Panier (drawer) : ajout, quantités, suppression.
- Checkout COD : nom, téléphone, wilaya, commune, adresse, type de livraison (domicile/stop-desk),
  calcul automatique des frais selon la wilaya, validation des champs (dont regex téléphone DZ).
- Confirmation de commande + lien WhatsApp prérempli.

**Admin (protégé par un login factice)**
- Dashboard : KPIs (CA livré, nb commandes, nouvelles, ruptures), graphe par statut, bloc alertes WhatsApp.
- Produits : CRUD complet (FR/EN/AR, marque, modèle, prix, stock, chute).
- Gammes : CRUD.
- Commandes : filtres par statut, détail, changement de statut, **décompte du stock à la confirmation**.
- Clients : agrégés par numéro de téléphone.
- Livraison : grille éditable des 58 wilayas (frais domicile + stop-desk).

**Transversal**
- Trilingue FR/EN/AR + RTL ; sélecteur de langue (menu compact) à côté du panier.
- Marque + modèle par produit.
- Animations sobres (cascade du hero, dégradé animé du hero, zoom au survol des visuels,
  pop du compteur panier, apparition décalée des cartes, glissement du panier, pop des modales)
  — toutes désactivées si `prefers-reduced-motion`.
- **Logo original** (composant `Logo`). ⚠️ Ne **jamais** utiliser le logo Coolblue (marque déposée).

---

## 3. Stack & commandes

- **Monorepo npm workspaces** : `apps/boutique` (public), `apps/admin` (privé),
  `packages/shared` (commun). Chaque app est un **Vite + React 18** (JS, pas TS).
- Icônes : **lucide-react**.
- Styles : **un seul bloc CSS** (`CSS` dans `packages/shared/src/core.jsx`) injecté via
  `<style>` par chaque root d'app, scoping sous la classe `.bx`. **Pas de Tailwind.**
  Couleurs = **variables CSS** dans `.bx` (`--blue`, `--orange`, ...) dérivées de la constante `C`.
- Les apps importent le commun via l'alias Vite **`@shared`** (→ `packages/shared/src/index.js`).
  `.env.local` (racine) est partagé par les deux apps (`envDir` dans chaque `vite.config.js`).

```bash
npm install              # installe tout le monorepo (workspaces)
npm run dev:boutique     # boutique en dev (http://localhost:5173)
npm run dev:admin        # admin en dev (http://localhost:5173, lancer séparément)
npm run build            # build des deux apps
npm run build:boutique   # build boutique seule
npm run build:admin      # build admin seule
npm run test:cloudinary  # test end-to-end Cloudinary (voir docs/cloudinary-setup.md)
```
> ⚠️ Les deux apps utilisent le port 5173 par défaut : lancer l'une **ou** l'autre,
> ou fixer un port (`vite --port`).

---

## 4. Design system

Constante `C` dans `App.jsx` :

| Rôle            | Valeur     |
|-----------------|------------|
| Bleu (marque)   | `#0090E3`  |
| Bleu foncé      | `#0077C2`  |
| Orange (action) | `#FF6600`  |
| Orange foncé    | `#E65C00`  |
| Encre (texte)   | `#0F2233`  |
| Fond app        | `#F6F9FC`  |
| Teinte claire   | `#EFF7FE`  |
| Bordure         | `#E5EDF4`  |
| Vert            | `#14B86A`  |
| Rouge           | `#F0453A`  |

**Règle d'usage des couleurs (à respecter) :**
- **Bleu** = marque, navigation, liens, éléments secondaires.
- **Orange** = **uniquement** les actions d'achat (ajouter au panier, passer commande) et les promos.
- **Encre** = texte.

Autres conventions :
- Polices **système** ; chiffres en `tabular-nums` (classe `.mono`).
- Cartes : coins arrondis ~20px, ombres douces, lift au survol.
- **Logo** : composant `Logo({ variant, size, wordmark })` (SVG pastille orange + bouclier + éclair + wordmark deux tons).
- Statuts commande → couleurs : `STATUS_COLOR` (new=orange, confirmed=bleu, shipped=violet, delivered=vert, cancelled=rouge).

---

## 5. Modèle de données (à matérialiser dans Supabase)

Voir `docs/supabase-schema.sql` pour le schéma SQL complet. Résumé des entités :

- **wilayas** : `code`, `name_fr`, `name_ar`, `zone`, `fee_home`, `fee_desk`.
- **categories** (gammes) : `id`, `name_fr/en/ar`, `art` (variante d'illustration), `active`.
- **products** : `id`, `category_id`, `sku`, `brand`, `model`, `name_fr/en/ar`, `desc_fr/en/ar`,
  `price` (DZD), `compare_price`, `stock`, `drop_test`, `images[]`, `active`, `featured`.
  ⚠️ Les images sont hébergées sur **Cloudinary** (pas Supabase Storage — voir §8 tâche 5 et
  `docs/cloudinary-setup.md`). Pour pouvoir **supprimer** un asset côté Cloudinary il faut son
  `public_id` : `products.images` est donc une colonne **`jsonb`** = `[{ url, publicId }]`
  (et non `text[]`). Si le schéma a été appliqué avant ce changement, exécuter
  `docs/supabase-migration-01-images-jsonb.sql`.
- **orders** : `id`, `order_no`, `customer_name`, `phone`, `wilaya_code`, `commune`, `address`,
  `delivery_type` ('home'|'desk'), `note`, `subtotal`, `delivery_fee`, `total`, `status`.
- **order_items** : `id`, `order_id`, `product_id`, `name`, `price`, `qty` (snapshot au moment de l'achat).

Dans le prototype, ces structures existent déjà en mémoire : voir `SEED_PRODUCTS`, `SEED_CATS`,
`SEED_ORDERS`, `WILAYAS` et l'état `fees` dans `App.jsx`. Elles servent de référence pour le seed.

---

## 6. Règles métier (IMPORTANT — déjà respectées dans le proto, à conserver)

1. **COD uniquement** : aucune intégration de paiement en ligne.
2. **Décompte du stock à la CONFIRMATION** par l'admin (passage `new` → `confirmed`),
   **pas** à la création de la commande. (Dans le proto : fonction `changeStatus`. En base : RPC `confirm_order`.)
3. **Frais de livraison** = grille par wilaya, deux tarifs : `home` (domicile) et `desk` (stop-desk).
   Le total = `subtotal + delivery_fee`.
4. **Statuts** : `new` → `confirmed` → `shipped` → `delivered`, ou `cancelled`.
5. **Téléphone DZ** validé par regex : `/^0?[567]\d{8}$/`.
6. **Notification WhatsApp** : actuellement un lien `wa.me` prérempli (clic manuel par l'admin),
   construit par `waLink` + `waMsg`. La vraie notification **automatique** nécessite un backend (voir §8, tâche 6).
7. **Trilingue** : les libellés UI sont dans l'objet `T` (clés `fr`/`en`/`ar`).
   Les contenus (produits, gammes) ont des champs `*_fr`/`*_en`/`*_ar`.
   L'arabe passe le conteneur racine en `dir="rtl"`.

---

## 7. Architecture (✅ monorepo en place)

**Deux applications React + Vite séparées**, partageant **un backend Supabase** :

- **`apps/boutique`** (public, ex. `boutique.domaine.dz`) : lecture du catalogue actif + création de commandes.
- **`apps/admin`** (privé, ex. `admin.domaine.dz`) : protégé par **Supabase Auth**, gestion complète.
- **Supabase** (données + Auth) + **Cloudinary** (images).

Structure réelle (npm workspaces) :
```
/packages/shared/src   # commun, importé via l'alias @shared
   core.jsx            # C, CSS, T, WILAYAS/ZONE_FEE, SEED_*, STATUS, helpers, ProductArt, Logo, LangSwitch, ProductVisual
   supabaseClient.js · api.js · mappers.js · useCloudinaryUpload.js · ImageUploader.jsx
   index.js            # barrel : re-exporte tout (dont `api` en namespace)
/apps/boutique/src     # App (root) + Shop.jsx (Shop, ProductCard, ProductModal, Checkout)
/apps/admin/src        # App (root) + Admin.jsx (Admin, Login, AdminShell, Dashboard, *Admin, waMsg...)
```
Chaque app a son `index.html`, `main.jsx`, `vite.config.js` (alias `@shared` + `envDir` racine).
Le CSS et l'i18n restent **communs** : toute nouvelle chaîne passe toujours par `T` (fr/en/ar).

---

## 8. Prochaines étapes (tâches, dans l'ordre)

1. **Créer le projet Supabase** et appliquer `docs/supabase-schema.sql` (tables + RLS + RPC `confirm_order`).
2. **Seed** : insérer les 58 wilayas + tarifs (depuis `WILAYAS` et `ZONE_FEE`), les gammes et quelques produits de démo.
3. **Client Supabase** : ajouter `@supabase/supabase-js`, créer un module `supabaseClient` (URL + clé anon via variables d'env `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).
4. **Boutique → Supabase** — ✅ **implémenté** (couche `src/lib/api.js` + `src/lib/mappers.js`) :
   - Chargement du catalogue actif (`categories`, `products`) + grille `wilayas` au montage de `App`
     (fallback seeds en mémoire si Supabase non configuré ; refetch à la connexion/déconnexion admin).
   - Checkout : insertion `orders` + `order_items` via `api.createOrder`.
   - ⚠️ `order_no` et l'`id` sont générés **côté client** (l'anon ne peut pas relire la ligne via RLS).
     Amélioration future : un RPC `place_order` **SECURITY DEFINER** (n° séquentiel serveur, total recalculé
     et validé côté serveur pour éviter la falsification du prix/frais).
5. **Admin → Supabase** :
   - **Auth** : login email/mot de passe (Supabase Auth), protéger toutes les vues admin.
     ⚠️ Le rôle **admin** doit être porté par `app_metadata.role === "admin"` (exigé par l'Edge Function
     Cloudinary). Penser à désactiver l'inscription publique.
   - CRUD produits/gammes, avec **upload/suppression des photos via Cloudinary** (signature serveur —
     Edge Function `cloudinary-sign`). ✅ **Déjà implémenté** : composant `ImageUploader` branché dans
     `ProductEditor`, hook `useCloudinaryUpload`, secret Cloudinary confiné côté Edge Function.
     Voir `docs/cloudinary-setup.md`. (Le bucket Supabase Storage `product-images` n'est plus utilisé.)
   - Commandes : update statut ✅ ; pour `new` → `confirmed`, appel de la **RPC `confirm_order`** ✅
     (décompte stock atomique) — via `api.confirmOrder` / `api.setOrderStatus`.
   - Grille de livraison : update des `fee_home`/`fee_desk` par wilaya ✅ (`api.setWilayaFee`, sur `blur`).
   - CRUD produits/gammes = ✅ persisté (`api.saveProduct`/`saveCategory`/`deleteProduct`/`deleteCategory`,
     suppression de gammes incluse).
   - ✅ **RLS durcie** : accès admin réservé au rôle `admin` via la fonction SQL `is_admin()`
     (`app_metadata.role='admin'`), même critère que l'Edge Function Cloudinary. Migration existante :
     `docs/supabase-migration-02-admin-rls.sql`. ⚠️ Un compte sans ce rôle ne peut plus rien côté admin.
6. **Notification WhatsApp automatique** (à la création d'une commande) — ✅ **implémenté** (option a) :
   - Edge Function [`notify-order`](supabase/functions/notify-order/index.ts) déclenchée par un
     **Database Webhook** sur `INSERT` dans `orders` ; envoie via l'**API WhatsApp Business Cloud (Meta)**.
     Protégée par un secret partagé (`x-webhook-secret`). Voir `docs/whatsapp-setup.md`.
   - Reste **à ta charge** (hors code) : compte Meta Business + numéro + token, définir les secrets,
     créer le webhook. ⚠️ Message texte limité à la fenêtre 24 h → **template approuvé** pour le hors-fenêtre.
   - **(b)** Alternative Twilio/360dialog : remplacer `sendWhatsAppText`, le reste est identique.
   - Le lien `wa.me` **manuel** reste fonctionnel en complément.
7. **Séparer en deux apps Vite** + package `shared` — ✅ **fait** (monorepo, voir §7).
8. **Renommer** le placeholder « ShockArmor » → vrai nom partout — ⏳ **reporté** (nom définitif non arrêté).
   Emplacements : wordmark du composant `Logo` (`core.jsx`), `waMsg` (`apps/admin/src/Admin.jsx`),
   email de démo du `Login`, `<title>` des deux `index.html`, docs.

---

## 9. Contraintes & pièges

- ⚠️ **Ne jamais utiliser le logo ni l'identité de Coolblue** (marque déposée). Le logo fourni est original ; le garder ou en créer un autre, mais propre à la boutique.
- **Décompte du stock = à la confirmation**, jamais à la commande (déjà respecté — ne pas casser).
- **RTL** : tester chaque nouvel écran en arabe (mise en page, alignements, icônes directionnelles).
- **RLS** : le public (clé anon) ne doit pouvoir que **LIRE le catalogue actif** et **INSÉRER des commandes** ;
  toute lecture/écriture des commandes, produits, etc. est réservée aux **admins authentifiés**.
- Les **prix sont en DZD entiers** (pas de centimes).
- Le proto réinitialise tout au refresh ; ne pas confondre avec un état persistant.
- **Cloudinary** : le `CLOUDINARY_API_SECRET` (et l'API key) restent **exclusivement** dans l'Edge
  Function `cloudinary-sign` ; côté client, seul `VITE_CLOUDINARY_CLOUD_NAME` est public. Upload et
  delete passent **toujours** par une signature serveur, réservée au rôle `admin`, et restreinte au
  dossier `products`. Ne jamais exposer le secret ni retirer le contrôle de rôle/périmètre.
  ⚠️ La suppression d'une image dans `ImageUploader` détruit **immédiatement** l'asset Cloudinary
  (même si l'édition du produit est ensuite annulée).

---

## 10. Conventions de code

- Composants **fonctionnels + hooks**.
- Conserver la **séparation boutique / admin**.
- **i18n** : toute nouvelle chaîne d'UI passe par l'objet `T` avec les **3 langues** (fr/en/ar) ;
  tout nouveau champ de contenu a ses variantes `*_fr`/`*_en`/`*_ar`.
- **Couleurs** : utiliser les variables CSS (`var(--blue)`...) ou la constante `C` ; éviter les hex en dur dispersés.
- Garder les **animations sobres** et toujours sous `@media (prefers-reduced-motion: no-preference)`.
- Le composant `ProductArt` génère des illustrations SVG (pas d'assets externes) ; les vraies photos
  produits viendront du Storage Supabase (champ `products.images`).
