-- Seed catalog data (safe to re-run: clears then inserts).
-- Run AFTER 006_products_catalog.sql and AFTER selecting the DB (USE sneheal;)

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE products;
TRUNCATE TABLE categories;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO categories (name, slug, image_url, offer_label, sort_order, is_active) VALUES
('Skin Care', 'skin-care', NULL, NULL, 1, 1),
('Sexual Wellness', 'sexual-wellness', NULL, NULL, 2, 1),
('Oral Care', 'oral-care', NULL, NULL, 3, 1),
('Hair Care', 'hair-care', NULL, NULL, 4, 1),
('Feminine Hygiene', 'feminine-hygiene', NULL, NULL, 5, 1),
('Diaper & Wipes', 'diaper-wipes', NULL, NULL, 6, 1),
('Feeding Essentials', 'feeding-essentials', NULL, NULL, 7, 1),
('Baby Skin & Bath', 'baby-skin-bath', NULL, NULL, 8, 1),
('Fitness Essentials', 'fitness-essentials', NULL, NULL, 9, 1),
('Vitamins & Minerals', 'vitamins-minerals', NULL, NULL, 10, 1),
('Nutritional Drinks', 'nutritional-drinks', NULL, NULL, 11, 1),
('Ayurveda Essentials', 'ayurveda-essentials', NULL, NULL, 12, 1),
('Health Devices', 'health-devices', NULL, NULL, 13, 1),
('Home Essentials', 'home-essentials', NULL, NULL, 14, 1),
('Pain Relief', 'pain-relief', NULL, NULL, 15, 1),
('Fever & Cold', 'fever-cold', NULL, NULL, 16, 1);

SET @highlights = JSON_ARRAY(
  JSON_OBJECT('icon', 'shield-checkmark-outline', 'label', '100% Genuine'),
  JSON_OBJECT('icon', 'flash-outline', 'label', 'Fast Delivery'),
  JSON_OBJECT('icon', 'sync-outline', 'label', 'Easy Returns')
);

INSERT INTO products (
  name, manufacturer, brand_name, generic_name, strength, form,
  image_url, price, original_price, unit, rating, reviews,
  uses, description, highlights, category_id,
  prescription_required, is_featured, is_active
) VALUES
(
  'Daily Multivitamin Capsules', 'Sneheal Medtech Pvt. Ltd.', 'Sneheal Multi', 'Multivitamin', NULL, 'capsule',
  NULL, 12.49, 16.65, '60 capsules', 4.60, 1284,
  JSON_ARRAY('Fills daily nutritional gaps', 'Supports energy and immunity', 'Promotes healthy skin and hair'),
  'A complete blend of essential vitamins and minerals to support your everyday health. Helps maintain energy levels, strengthens immunity and keeps you active through the day.',
  @highlights, (SELECT id FROM categories WHERE slug = 'vitamins-minerals' LIMIT 1), 0, 1, 1
),
(
  'Pediacare Super Immune Plus', 'NutriCare Labs', 'Pediacare', 'Nutritional drink mix', NULL, 'syrup',
  NULL, 15.99, 18.15, '400 ml', 4.50, 842,
  JSON_ARRAY('Boosts childhood immunity', 'Supports healthy growth', 'Rich in DHA and protein'),
  'A nutritious health drink designed for growing children. Packed with protein, DHA and 24 vital nutrients to support immunity, brain development and overall growth.',
  @highlights, (SELECT id FROM categories WHERE slug = 'nutritional-drinks' LIMIT 1), 0, 1, 1
),
(
  'Fever & Cold Relief Syrup', 'MediCure Pharma', 'MediCure Cold', 'Paracetamol', '125 mg/5 ml', 'syrup',
  NULL, 6.99, NULL, '100 ml', 4.30, 510,
  JSON_ARRAY('Relieves fever and body ache', 'Eases cold and congestion', 'Soothes sore throat'),
  'Fast-acting relief from the common cold, fever and mild body pain. Gentle formula suitable for the whole family to help you recover comfortably.',
  @highlights, (SELECT id FROM categories WHERE slug = 'fever-cold' LIMIT 1), 0, 1, 1
),
(
  'Pain Relief Tablets', 'MediCure Pharma', 'MediCure Pain', 'Paracetamol', '500 mg', 'tablet',
  NULL, 4.99, 6.99, '10 tablets', 4.70, 2043,
  JSON_ARRAY('Relieves headache and migraine', 'Reduces muscle and joint pain', 'Brings down fever'),
  'Effective and quick relief from everyday aches and pains. Trusted formula for headaches, body pain and fever with gentle action on the stomach.',
  @highlights, (SELECT id FROM categories WHERE slug = 'pain-relief' LIMIT 1), 0, 1, 1
),
(
  'Ayurvedic Immunity Booster', 'Vedic Roots Ayurveda', 'Vedic Roots', 'Ashwagandha Giloy Tulsi', NULL, 'tablet',
  NULL, 22.99, NULL, '90 tablets', 4.40, 673,
  JSON_ARRAY('Strengthens natural immunity', 'Improves stamina and vitality', 'Made with pure herbal extracts'),
  'A time-tested Ayurvedic formulation crafted from potent herbs like Ashwagandha, Giloy and Tulsi. Builds resilience naturally and keeps you energised.',
  @highlights, (SELECT id FROM categories WHERE slug = 'ayurveda-essentials' LIMIT 1), 0, 1, 1
),
(
  'Dietary Supplement Health Products', 'FitLife Nutrition', 'FitLife', 'Protein supplement', NULL, 'powder',
  NULL, 18.99, NULL, '500 g', 4.20, 389,
  JSON_ARRAY('Supports muscle recovery', 'Aids balanced nutrition', 'Fuels active lifestyles'),
  'A premium dietary supplement to complement your fitness journey. Provides quality protein and nutrients to support recovery, strength and daily wellbeing.',
  @highlights, (SELECT id FROM categories WHERE slug = 'fitness-essentials' LIMIT 1), 0, 1, 1
),
(
  'Oral Care Essentials', 'DentaFresh', 'DentaFresh', 'Oral care kit', NULL, 'kit',
  NULL, 9.99, 14.99, 'Combo pack', 4.50, 921,
  JSON_ARRAY('Fights cavities and plaque', 'Freshens breath', 'Strengthens enamel'),
  'A complete oral care kit for a healthy, confident smile. Helps fight plaque, prevent cavities and keep your breath fresh all day long.',
  @highlights, (SELECT id FROM categories WHERE slug = 'oral-care' LIMIT 1), 0, 1, 1
),
(
  'Biotin Hair Growth Support', 'GlowVita', 'GlowVita Biotin', 'Biotin', '10000 mcg', 'tablet',
  NULL, 14.99, NULL, '60 tablets', 4.60, 1567,
  JSON_ARRAY('Reduces hair fall', 'Promotes stronger hair', 'Supports nails and skin'),
  'High-potency Biotin supplement that nourishes hair from within. Helps reduce hair fall, promotes thicker growth and supports healthy skin and nails.',
  @highlights, (SELECT id FROM categories WHERE slug = 'hair-care' LIMIT 1), 0, 1, 1
);
