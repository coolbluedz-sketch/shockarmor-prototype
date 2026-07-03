-- =====================================================================
--  Migration 02 — Durcissement RLS : réserver l'admin au rôle `admin`
--  (app_metadata.role = 'admin'), au lieu de « tout utilisateur authentifié ».
--  À exécuter UNE FOIS dans le SQL Editor si le schéma initial a déjà été
--  appliqué. Aligne la base sur l'Edge Function Cloudinary (même critère).
--
--  ⚠️ Après cette migration, un compte SANS `app_metadata.role='admin'`
--     ne peut plus rien lire/écrire côté admin (commandes, etc.).
--     Définir le rôle : voir docs/cloudinary-setup.md (§ Compte admin).
-- =====================================================================

create or replace function is_admin() returns boolean
language sql stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- Remplacer les politiques "admin all" basées sur auth.role()='authenticated'.
drop policy if exists "admin all wilayas"     on wilayas;
drop policy if exists "admin all categories"  on categories;
drop policy if exists "admin all products"    on products;
drop policy if exists "admin all orders"      on orders;
drop policy if exists "admin all order_items" on order_items;

create policy "admin all wilayas"     on wilayas     for all
  using (is_admin()) with check (is_admin());
create policy "admin all categories"  on categories  for all
  using (is_admin()) with check (is_admin());
create policy "admin all products"    on products    for all
  using (is_admin()) with check (is_admin());
create policy "admin all orders"      on orders      for all
  using (is_admin()) with check (is_admin());
create policy "admin all order_items" on order_items for all
  using (is_admin()) with check (is_admin());
