-- =====================================================================
--  ShockArmor — Seed de démonstration (Supabase)
--  À exécuter dans l'éditeur SQL APRÈS docs/supabase-schema.sql.
--  Idempotent : ré-exécutable sans erreur (ON CONFLICT DO NOTHING).
--  Voir CLAUDE.md §8 (tâche 2). Données dérivées de SEED_* dans src/App.jsx.
-- =====================================================================

-- ------------------------------------------------------------------
--  Wilayas (58) + grille de frais par zone
--    Centre 400/250 · Est 600/350 · Ouest 600/350
--    Hauts 700/400 · Sud 900/500 · GrandSud 1200/700
-- ------------------------------------------------------------------
insert into wilayas (code, name_fr, name_ar, zone, fee_home, fee_desk) values
  (1,  'Adrar',               'أدرار',        'GrandSud', 1200, 700),
  (2,  'Chlef',               'الشلف',        'Ouest',     600, 350),
  (3,  'Laghouat',            'الأغواط',      'Sud',       900, 500),
  (4,  'Oum El Bouaghi',      'أم البواقي',   'Hauts',     700, 400),
  (5,  'Batna',               'باتنة',        'Hauts',     700, 400),
  (6,  'Béjaïa',              'بجاية',        'Centre',    400, 250),
  (7,  'Biskra',              'بسكرة',        'Sud',       900, 500),
  (8,  'Béchar',              'بشار',         'GrandSud', 1200, 700),
  (9,  'Blida',               'البليدة',      'Centre',    400, 250),
  (10, 'Bouira',              'البويرة',      'Centre',    400, 250),
  (11, 'Tamanrasset',         'تمنراست',      'GrandSud', 1200, 700),
  (12, 'Tébessa',             'تبسة',         'Est',       600, 350),
  (13, 'Tlemcen',             'تلمسان',       'Ouest',     600, 350),
  (14, 'Tiaret',              'تيارت',        'Hauts',     700, 400),
  (15, 'Tizi Ouzou',          'تيزي وزو',     'Centre',    400, 250),
  (16, 'Alger',               'الجزائر',      'Centre',    400, 250),
  (17, 'Djelfa',              'الجلفة',       'Sud',       900, 500),
  (18, 'Jijel',               'جيجل',         'Est',       600, 350),
  (19, 'Sétif',               'سطيف',         'Hauts',     700, 400),
  (20, 'Saïda',               'سعيدة',        'Ouest',     600, 350),
  (21, 'Skikda',              'سكيكدة',       'Est',       600, 350),
  (22, 'Sidi Bel Abbès',      'سيدي بلعباس',  'Ouest',     600, 350),
  (23, 'Annaba',              'عنابة',        'Est',       600, 350),
  (24, 'Guelma',              'قالمة',        'Est',       600, 350),
  (25, 'Constantine',         'قسنطينة',      'Est',       600, 350),
  (26, 'Médéa',               'المدية',       'Centre',    400, 250),
  (27, 'Mostaganem',          'مستغانم',      'Ouest',     600, 350),
  (28, 'M''Sila',             'المسيلة',      'Hauts',     700, 400),
  (29, 'Mascara',             'معسكر',        'Ouest',     600, 350),
  (30, 'Ouargla',             'ورقلة',        'Sud',       900, 500),
  (31, 'Oran',                'وهران',        'Ouest',     600, 350),
  (32, 'El Bayadh',           'البيض',        'Sud',       900, 500),
  (33, 'Illizi',              'إليزي',        'GrandSud', 1200, 700),
  (34, 'Bordj Bou Arréridj',  'برج بوعريريج', 'Hauts',     700, 400),
  (35, 'Boumerdès',           'بومرداس',      'Centre',    400, 250),
  (36, 'El Tarf',             'الطارف',       'Est',       600, 350),
  (37, 'Tindouf',             'تندوف',        'GrandSud', 1200, 700),
  (38, 'Tissemsilt',          'تيسمسيلت',     'Hauts',     700, 400),
  (39, 'El Oued',             'الوادي',       'Sud',       900, 500),
  (40, 'Khenchela',           'خنشلة',        'Hauts',     700, 400),
  (41, 'Souk Ahras',          'سوق أهراس',    'Est',       600, 350),
  (42, 'Tipaza',              'تيبازة',       'Centre',    400, 250),
  (43, 'Mila',                'ميلة',         'Est',       600, 350),
  (44, 'Aïn Defla',           'عين الدفلى',   'Centre',    400, 250),
  (45, 'Naâma',               'النعامة',      'Sud',       900, 500),
  (46, 'Aïn Témouchent',      'عين تموشنت',   'Ouest',     600, 350),
  (47, 'Ghardaïa',            'غرداية',       'Sud',       900, 500),
  (48, 'Relizane',            'غليزان',       'Ouest',     600, 350),
  (49, 'El M''Ghair',         'المغير',       'Sud',       900, 500),
  (50, 'El Meniaa',           'المنيعة',      'GrandSud', 1200, 700),
  (51, 'Ouled Djellal',       'أولاد جلال',   'Sud',       900, 500),
  (52, 'Bordj Badji Mokhtar', 'برج باجي مختار','GrandSud',1200, 700),
  (53, 'Béni Abbès',          'بني عباس',     'GrandSud', 1200, 700),
  (54, 'Timimoun',            'تيميمون',      'GrandSud', 1200, 700),
  (55, 'Touggourt',           'تقرت',         'Sud',       900, 500),
  (56, 'Djanet',              'جانت',         'GrandSud', 1200, 700),
  (57, 'In Salah',            'عين صالح',     'GrandSud', 1200, 700),
  (58, 'In Guezzam',          'عين قزام',     'GrandSud', 1200, 700)
on conflict (code) do nothing;

-- ------------------------------------------------------------------
--  Gammes (catégories) — UUID fixes pour pouvoir référencer les produits
-- ------------------------------------------------------------------
insert into categories (id, name_fr, name_en, name_ar, art, active) values
  ('11111111-1111-1111-1111-111111111111', 'Coques antichoc',     'Shockproof cases',  'أغطية مضادة للصدمات', 'case',   true),
  ('22222222-2222-2222-2222-222222222222', 'Protections d''écran', 'Screen protectors', 'حماية الشاشة',        'glass',  true),
  ('33333333-3333-3333-3333-333333333333', 'Bumpers & coins',     'Bumpers & corners', 'إطارات وزوايا',       'bumper', true),
  ('44444444-4444-4444-4444-444444444444', 'Housses & sacoches',  'Sleeves & pouches', 'أغلفة وحقائب',        'sleeve', true)
on conflict (id) do nothing;

-- ------------------------------------------------------------------
--  Produits de démo (FK category_id vers les UUID ci-dessus)
--  Note: le champ `rating` du proto n'existe pas dans le schéma → ignoré.
-- ------------------------------------------------------------------
insert into products
  (category_id, sku, brand, model, name_fr, name_en, name_ar, desc_fr, desc_en, desc_ar,
   price, compare_price, stock, drop_test, featured, active)
values
  ('11111111-1111-1111-1111-111111111111', 'ARM-360', 'Armorix', 'AX-360',
   'Coque Armor 360', 'Armor 360 case', 'غطاء أرمور 360',
   'Double couche TPU + polycarbonate, coins renforcés.', 'Dual-layer TPU + polycarbonate, reinforced corners.', 'طبقتان TPU وبولي كربونات، زوايا معززة.',
   2200, 2900, 24, 2.4, true, true),

  ('11111111-1111-1111-1111-111111111111', 'DEF-RGD', 'Defender', 'DF-RGD',
   'Coque Rugged Defender', 'Rugged Defender case', 'غطاء ديفندر القوي',
   'Protection militaire, résiste aux chutes de 3 m.', 'Military-grade, survives 3 m drops.', 'حماية عسكرية، يتحمل السقوط من 3 أمتار.',
   3400, null, 12, 3.0, true, true),

  ('11111111-1111-1111-1111-111111111111', 'SLM-SHK', 'Armorix', 'AX-Slim',
   'Coque Slim Shock', 'Slim Shock case', 'غطاء سليم شوك',
   'Fine et légère, absorbe les chocs du quotidien.', 'Thin and light, absorbs everyday shocks.', 'رقيق وخفيف، يمتص الصدمات اليومية.',
   1800, null, 40, 1.8, false, true),

  ('22222222-2222-2222-2222-222222222222', 'GLS-9H', 'GlassPro', 'FG-9H',
   'Verre trempé Full Glue 9H', 'Full Glue 9H glass', 'زجاج مقوى فول غلو 9H',
   'Dureté 9H, adhésif total, anti-traces.', '9H hardness, full adhesive, smudge-resistant.', 'صلابة 9H، لاصق كامل، مقاوم للبصمات.',
   900, 1200, 60, null, true, true),

  ('22222222-2222-2222-2222-222222222222', 'GLS-PRV', 'GlassPro', 'PRV-Edge',
   'Verre trempé Privacy', 'Privacy glass', 'زجاج الخصوصية',
   'Filtre anti-espion, vision protégée de côté.', 'Anti-spy filter, side view blocked.', 'فلتر ضد التجسس، يحجب الرؤية الجانبية.',
   1500, null, 18, null, false, true),

  ('33333333-3333-3333-3333-333333333333', 'BMP-CRN', 'BumperX', 'BX-Corner',
   'Bumper Corner Guard', 'Corner Guard bumper', 'واقي الزوايا',
   'Coins en silicone absorbants, ultra-discrets.', 'Absorbing silicone corners, ultra-discreet.', 'زوايا سيليكون ماصة، خفية جدًا.',
   700, null, 35, 2.0, false, true),

  ('33333333-3333-3333-3333-333333333333', 'BMP-CRB', 'BumperX', 'BX-Carbon',
   'Bumper Carbon Edge', 'Carbon Edge bumper', 'إطار كاربون إيدج',
   'Cadre fibre de carbone, rigide et léger.', 'Carbon fiber frame, rigid and light.', 'إطار ألياف كربون، صلب وخفيف.',
   1300, null, 9, 2.2, false, true),

  ('44444444-4444-4444-4444-444444444444', 'SLV-NEO', 'CarryFit', 'CF-Neo10',
   'Housse Néoprène Tablette', 'Neoprene tablet sleeve', 'غلاف نيوبرين للوحي',
   'Rembourrage néoprène, fermeture zip renforcée.', 'Neoprene padding, reinforced zip.', 'حشوة نيوبرين، سحاب معزز.',
   2600, null, 7, null, false, true),

  ('11111111-1111-1111-1111-111111111111', 'MAG-ASK', 'Armorix', 'AX-Mag',
   'Coque MagSafe Antichoc', 'MagSafe Shock case', 'غطاء ماغ سايف مضاد للصدمات',
   'Compatible MagSafe, aimants intégrés.', 'MagSafe compatible, built-in magnets.', 'متوافق مع ماغ سايف، مغناطيس مدمج.',
   3100, null, 0, 2.6, false, true)
on conflict (sku) do nothing;
