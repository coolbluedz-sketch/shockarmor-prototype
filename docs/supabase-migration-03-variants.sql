-- =====================================================================
--  Migration 03 — Variantes produit : compatibilité (marques/modèles) + couleurs
--  À exécuter UNE FOIS dans le SQL Editor.
--
--  Un produit (ex. coque antichoc) est vendu pour plusieurs marques/modèles
--  de téléphone et en plusieurs couleurs, au lieu d'une fiche par modèle.
--  Les COULEURS sont rattachées à CHAQUE MODÈLE, et le STOCK est par modèle/couleur :
--    compat : [{ "brand": "Samsung", "models": [
--                 { "name": "S23", "colors": [{ "name":"Noir", "hex":"#111", "stock":12, "url":"...", "publicId":"..." }] },
--                 { "name": "A54", "stock": 20, "colors": [] }   -- modèle sans couleur : stock sur le modèle
--               ]}, ...]
--    colors : couleurs GLOBALES (repli si le produit n'a aucune marque, ex. verre trempé) :
--             [{ "name":"Noir", "hex":"#111", "stock":30, "url":"...", "publicId":"..." }, ...]
--  Un stock non renseigné retombe sur products.stock (rétrocompat). Un modèle stocké en
--  simple chaîne "S23" est lu comme { name:"S23", colors:[] } (stock = products.stock).
-- =====================================================================

alter table products
  add column if not exists compat jsonb not null default '[]'::jsonb;

alter table products
  add column if not exists colors jsonb not null default '[]'::jsonb;
