-- Insert sample categories
INSERT INTO public.categories (name, description, image_url) VALUES
  ('Food & Beverages', 'Fresh food, snacks, and drinks', '/placeholder.svg?height=200&width=200'),
  ('Stationery', 'Books, pens, notebooks, and school supplies', '/placeholder.svg?height=200&width=200'),
  ('Electronics', 'Phones, chargers, earphones, and accessories', '/placeholder.svg?height=200&width=200'),
  ('Personal Care', 'Toiletries, cosmetics, and hygiene products', '/placeholder.svg?height=200&width=200'),
  ('Clothing', 'T-shirts, shoes, and fashion accessories', '/placeholder.svg?height=200&width=200')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO public.products (name, description, category_id, price, image_url, stock_quantity, is_available)
SELECT 
  'Rolex (Chapati Roll)', 
  'Delicious chapati rolled with eggs and vegetables',
  (SELECT id FROM public.categories WHERE name = 'Food & Beverages' LIMIT 1),
  3000,
  '/placeholder.svg?height=300&width=300',
  50,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Rolex (Chapati Roll)');

INSERT INTO public.products (name, description, category_id, price, image_url, stock_quantity, is_available)
SELECT 
  'Mineral Water 500ml', 
  'Fresh bottled water',
  (SELECT id FROM public.categories WHERE name = 'Food & Beverages' LIMIT 1),
  1000,
  '/placeholder.svg?height=300&width=300',
  100,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Mineral Water 500ml');

INSERT INTO public.products (name, description, category_id, price, image_url, stock_quantity, is_available)
SELECT 
  'A4 Notebook', 
  '100 pages ruled notebook',
  (SELECT id FROM public.categories WHERE name = 'Stationery' LIMIT 1),
  5000,
  '/placeholder.svg?height=300&width=300',
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'A4 Notebook');

INSERT INTO public.products (name, description, category_id, price, image_url, stock_quantity, is_available)
SELECT 
  'USB-C Charging Cable', 
  '1.5m fast charging cable',
  (SELECT id FROM public.categories WHERE name = 'Electronics' LIMIT 1),
  8000,
  '/placeholder.svg?height=300&width=300',
  25,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'USB-C Charging Cable');

INSERT INTO public.products (name, description, category_id, price, image_url, stock_quantity, is_available)
SELECT 
  'Hand Sanitizer 100ml', 
  'Antibacterial hand sanitizer',
  (SELECT id FROM public.categories WHERE name = 'Personal Care' LIMIT 1),
  4000,
  '/placeholder.svg?height=300&width=300',
  40,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Hand Sanitizer 100ml');

INSERT INTO public.products (name, description, category_id, price, image_url, stock_quantity, is_available)
SELECT 
  'Bugema University T-Shirt', 
  'Official university branded t-shirt',
  (SELECT id FROM public.categories WHERE name = 'Clothing' LIMIT 1),
  25000,
  '/placeholder.svg?height=300&width=300',
  15,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Bugema University T-Shirt');
