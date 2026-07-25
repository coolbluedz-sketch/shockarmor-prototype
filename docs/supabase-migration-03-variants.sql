-- =====================================================================
--  Migration 03 — Variantes produit : compatibilité (marques/modèles) + couleurs
--  À exécuter UNE FOIS dans le SQL Editor.
--
--  Un produit (ex. coque antichoc) est vendu pour plusieurs marques/modèles
--  de téléphone et en plusieurs couleurs, au lieu d'une fiche par modèle.
--  Les COULEURS sont rattachées à CHAQUE MODÈLE (chaque modèle a sa propre gamme) :
--    compat : [{ "brand": "Samsung", "models": [
--                 { "name": "S23", "colors": [{ "name":"Noir", "hex":"#111", "url":"...", "publicId":"..." }] },
--                 { "name": "S24", "colors": [] }
--               ]}, ...]
--    colors : couleurs GLOBALES, utilisées seulement si le produit n'a aucune marque
--             (ex. verre trempé) : [{ "name":"Noir", "hex":"#111", "url":"...", "publicId":"..." }, ...]
--  (Rétrocompat : un modèle stocké en simple chaîne "S23" est lu comme { name:"S23", colors:[] }.)
-- =====================================================================

alter table products
  add column if not exists compat jsonb not null default '[]'::jsonb;

alter table products
  add column if not exists colors jsonb not null default '[]'::jsonb;
