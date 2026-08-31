INSERT INTO content_sections
  (section_key, section_type, title, subtitle, body, image_url, cta_label, cta_url, sort_order, status, published_at)
VALUES
  ('about_hero', 'hero', 'Considered essentials.', 'Built around proportion, weight and repetition.', '', '/images/bone-editorial.png', '', '', 10, 'published', unixepoch()),
  ('about_standard', 'standard', 'Pieces worn most
should be made best.', 'P&R / THE STANDARD', 'P&R is built around considered everyday clothing—designed with attention to proportion, fabric weight and repeat wear.

The collection is designed in India around an easy, unisex point of view.', NULL, '', '', 20, 'published', unixepoch()),
  ('about_fit', 'fit', 'Room to move.
Enough structure to
hold its form.', 'FIT PHILOSOPHY', 'Dropped shoulders and deliberate volume shape the silhouette. Each piece should feel relaxed without losing structure.', '/products/literally-just-a-girl-tee/closeup-fabric.jpg', 'VIEW SIZE GUIDE', '/shop', 30, 'published', unixepoch()),
  ('about_build', 'build', '', 'THE BUILD', '240 GSM COTTON
UNISEX PROPORTIONS
DESIGNED FOR REPEAT WEAR', NULL, '', '', 40, 'published', unixepoch()),
  ('about_contact', 'contact', 'Questions about fit, product or an order?', 'STUDIO / CONTACT', '', NULL, 'CUSTOMER SUPPORT', '/account', 50, 'published', unixepoch())
ON CONFLICT(section_key) DO NOTHING;
