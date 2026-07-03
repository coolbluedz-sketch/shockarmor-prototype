-- =====================================================================
--  Migration 01 — products.images : text[]  →  jsonb  [{url, publicId}]
--  À exécuter UNE FOIS dans le SQL Editor si le schéma initial a déjà été
--  appliqué avec `images text[]`. Nécessaire pour persister le public_id
--  Cloudinary (indispensable à la suppression). Voir CLAUDE.md §5.
-- =====================================================================

alter table products
  alter column images drop default;

alter table products
  alter column images type jsonb
  using to_jsonb(images);   -- convertit l'ancien text[] (URLs) en tableau JSON

alter table products
  alter column images set default '[]'::jsonb;

alter table products
  alter column images set not null;

-- ------------------------------------------------------------------
--  Normalisation des lignes existantes.
--  `to_jsonb(text[])` ne transforme PAS les éléments : si la colonne text[]
--  contenait des objets sérialisés en chaîne (cas des enregistrements faits
--  avant la migration : ['{"url":...,"publicId":...}']), on obtient un tableau
--  de CHAÎNES jsonb, pas d'objets. On les reconvertit ici :
--    - chaîne JSON '{"url":...}'  → objet
--    - URL nue "https://..."       → { "url": ... }
-- ------------------------------------------------------------------
update products
set images = coalesce((
  select jsonb_agg(
    case
      when jsonb_typeof(elem) = 'string' and left(btrim(elem #>> '{}'), 1) = '{'
        then (elem #>> '{}')::jsonb
      when jsonb_typeof(elem) = 'string'
        then jsonb_build_object('url', elem #>> '{}')
      else elem
    end
  )
  from jsonb_array_elements(images) elem
), '[]'::jsonb)
where jsonb_typeof(images) = 'array' and jsonb_array_length(images) > 0;

-- Après migration, `products.images` contient des objets : [{ "url": ..., "publicId": ... }]
