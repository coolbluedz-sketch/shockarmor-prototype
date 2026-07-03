-- =====================================================================
--  ShockArmor — Schéma Supabase (proposition de départ)
--  À exécuter dans l'éditeur SQL de Supabase.
--  Voir CLAUDE.md §5 et §8 pour le contexte.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------
--  Wilayas + grille de frais de livraison
-- ------------------------------------------------------------------
create table if not exists wilayas (
  code      int  primary key,
  name_fr   text not null,
  name_ar   text not null,
  zone      text not null,
  fee_home  int  not null default 0,   -- frais livraison à domicile (DZD)
  fee_desk  int  not null default 0    -- frais stop-desk (DZD)
);

-- ------------------------------------------------------------------
--  Gammes (catégories)
-- ------------------------------------------------------------------
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  name_fr     text not null,
  name_en     text not null,
  name_ar     text not null,
  art         text not null default 'case',   -- variante d'illustration: case|glass|bumper|sleeve
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------
--  Produits
-- ------------------------------------------------------------------
create table if not exists products (
  id            uuid primary key default uuid_generate_v4(),
  category_id   uuid references categories(id) on delete set null,
  sku           text unique,
  brand         text,
  model         text,
  name_fr       text not null,
  name_en       text not null,
  name_ar       text not null,
  desc_fr       text,
  desc_en       text,
  desc_ar       text,
  price         int  not null,            -- DZD
  compare_price int,                      -- prix barré (optionnel)
  stock         int  not null default 0,
  drop_test     numeric,                  -- hauteur de chute testée en m (optionnel)
  images        jsonb  not null default '[]'::jsonb,  -- [{url, publicId}] hébergés sur Cloudinary
  active        boolean not null default true,
  featured      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------------
--  Commandes
-- ------------------------------------------------------------------
create sequence if not exists order_no_seq start 100001;

create table if not exists orders (
  id            uuid primary key default uuid_generate_v4(),
  order_no      text unique not null default ('CMD-' || nextval('order_no_seq')),
  customer_name text not null,
  phone         text not null,
  wilaya_code   int  references wilayas(code),
  commune       text not null,
  address       text not null,
  delivery_type text not null check (delivery_type in ('home','desk')),
  note          text,
  subtotal      int  not null,
  delivery_fee  int  not null,
  total         int  not null,
  status        text not null default 'new'
                 check (status in ('new','confirmed','shipped','delivered','cancelled')),
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------------
--  Lignes de commande (snapshot nom/prix au moment de l'achat)
-- ------------------------------------------------------------------
create table if not exists order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  name        text not null,
  price       int  not null,
  qty         int  not null
);

-- =====================================================================
--  RLS (Row Level Security)
-- =====================================================================
alter table wilayas     enable row level security;
alter table categories  enable row level security;
alter table products    enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;

-- Lecture publique : wilayas + catalogue ACTIF uniquement
create policy "public read wilayas"    on wilayas    for select using (true);
create policy "public read categories" on categories for select using (active = true);
create policy "public read products"   on products   for select using (active = true);

-- Le public peut CRÉER une commande et ses lignes (mais pas les lire ni les modifier)
create policy "public insert orders"      on orders      for insert with check (true);
create policy "public insert order_items" on order_items for insert with check (true);

-- Rôle admin : basé sur app_metadata.role = 'admin' (non modifiable par
-- l'utilisateur, contrairement à user_metadata). Même critère que l'Edge
-- Function Cloudinary. Pensez à désactiver l'inscription publique.
create or replace function is_admin() returns boolean
language sql stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- Seuls les ADMINS ont tous les droits (lecture commandes incluse).
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

-- =====================================================================
--  RPC : confirmer une commande = décrémenter le stock (atomique)
--  À appeler côté admin lors du passage new -> confirmed.
-- =====================================================================
create or replace function confirm_order(p_order_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update products p
     set stock = greatest(0, p.stock - oi.qty)
    from order_items oi
   where oi.order_id = p_order_id
     and oi.product_id = p.id;

  update orders
     set status = 'confirmed'
   where id = p_order_id
     and status = 'new';
end;
$$;

-- =====================================================================
--  (Optionnel) Storage : créer un bucket public pour les photos produits
--  depuis le dashboard Supabase -> Storage -> New bucket: "product-images".
-- =====================================================================
