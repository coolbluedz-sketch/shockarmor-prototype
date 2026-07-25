-- =====================================================================
--  Produit d'EXEMPLE configurable (marque → modèle → couleur).
--  À exécuter dans le SQL Editor APRÈS la migration 03 (colonnes compat/colors).
--  Ré-exécutable (ON CONFLICT sur le sku).
--
--  category_id = « Coques antichoc » (UUID fixe du seed, docs/supabase-seed.sql).
--  Les couleurs n'ont pas d'image ici (url vide) : la boutique affiche alors une
--  pastille de couleur (champ hex). Tu pourras ajouter de vraies photos par couleur
--  depuis l'admin (éditeur produit → Couleurs).
-- =====================================================================

insert into products
  (category_id, sku, brand, model, name_fr, name_en, name_ar,
   desc_fr, desc_en, desc_ar,
   price, compare_price, stock, drop_test, featured, active, compat, colors)
values (
  '11111111-1111-1111-1111-111111111111',
  'DEMO-FLEX', 'Armorix', 'AX-Flex',
  'Coque Flex Multi-Modèles', 'Flex Multi-Model Case', 'غطاء فليكس متعدد الموديلات',
  'Coque antichoc compatible avec de nombreux modèles. Choisissez votre téléphone puis votre couleur.',
  'Shockproof case compatible with many phone models. Pick your phone then your color.',
  'غطاء مضاد للصدمات متوافق مع عدة موديلات. اختر هاتفك ثم لونك.',
  1990, 2600, 50, 2.4, true, true,
  -- compat : marque → modèles, chaque modèle ayant SES couleurs (nom + hex + image).
  '[
    {"brand":"Samsung","models":[
      {"name":"Galaxy S23","colors":[{"name":"Noir","hex":"#111827","url":"","publicId":""},{"name":"Bleu","hex":"#1E5FD0","url":"","publicId":""}]},
      {"name":"Galaxy S24","colors":[{"name":"Noir","hex":"#111827","url":"","publicId":""},{"name":"Vert","hex":"#14B86A","url":"","publicId":""}]},
      {"name":"Galaxy A54","colors":[]}
    ]},
    {"brand":"iPhone","models":[
      {"name":"iPhone 15","colors":[{"name":"Noir","hex":"#111827","url":"","publicId":""},{"name":"Bleu","hex":"#1E5FD0","url":"","publicId":""},{"name":"Rouge","hex":"#E0342B","url":"","publicId":""}]},
      {"name":"iPhone 15 Pro","colors":[{"name":"Titane","hex":"#8A8D8F","url":"","publicId":""},{"name":"Noir","hex":"#111827","url":"","publicId":""}]}
    ]},
    {"brand":"Xiaomi","models":[
      {"name":"Redmi Note 13","colors":[]},
      {"name":"13T Pro","colors":[]}
    ]}
  ]'::jsonb,
  -- colors : couleurs globales, utilisées uniquement si le produit n'a AUCUNE marque.
  '[]'::jsonb
)
on conflict (sku) do nothing;
