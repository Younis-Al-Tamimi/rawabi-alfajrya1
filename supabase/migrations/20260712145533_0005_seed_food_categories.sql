-- Seed Rawabi Al Fajrya food categories
INSERT INTO categories (name_en, name_ar, slug, sort_order) VALUES
  ('Nuts', 'مكسرات', 'nuts', 1),
  ('Dried Fruits', 'فواكه مجففة', 'dried-fruits', 2),
  ('Honey', 'عسل', 'honey', 3),
  ('Chocolates', 'شوكولاتة', 'chocolates', 4),
  ('Arabic Sweets', 'حلويات عربية', 'arabic-sweets', 5),
  ('Coffee', 'قهوة', 'coffee', 6),
  ('Tea', 'شاي', 'tea', 7),
  ('Spices', 'بهارات', 'spices', 8),
  ('Snacks', 'وجبات خفيفة', 'snacks', 9),
  ('Natural Products', 'منتجات طبيعية', 'natural-products', 10),
  ('Gift Boxes', 'صناديق هدايا', 'gift-boxes', 11),
  ('Seasonal Offers', 'عروض موسمية', 'seasonal-offers', 12)
ON CONFLICT (slug) DO NOTHING;
