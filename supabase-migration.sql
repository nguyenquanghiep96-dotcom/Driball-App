-- =============================================
-- Driball Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  tag text NOT NULL DEFAULT 'PLAY',
  fabric_type text DEFAULT '',
  production jsonb DEFAULT '{}',
  prices jsonb DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Product colors table
CREATE TABLE IF NOT EXISTS product_colors (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  thumbnail_url text DEFAULT '',
  sort_order int DEFAULT 0
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  customer_name text NOT NULL DEFAULT '',
  shipping_address text DEFAULT '',
  product_id text REFERENCES products(id) ON DELETE SET NULL,
  color_id text DEFAULT '',
  quantity int DEFAULT 1,
  print_cost int DEFAULT 0,
  logo3d_cost int DEFAULT 0,
  outsource_cost int DEFAULT 0,
  override_unit_price int,
  override_prod_cost int,
  deposit int DEFAULT 0,
  deposit_date date,
  status text DEFAULT 'demo',
  source text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Brand costs table
CREATE TABLE IF NOT EXISTS brand_costs (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  unit text DEFAULT '',
  quantity int DEFAULT 0,
  unit_price int DEFAULT 0,
  supplier text DEFAULT '',
  notes text DEFAULT ''
);

-- Operating costs table (monthly)
CREATE TABLE IF NOT EXISTS operating_costs (
  month text PRIMARY KEY,
  costs jsonb DEFAULT '{}'
);

-- =============================================
-- Storage: Create bucket for product images
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow public reads
CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Storage policy: allow authenticated and anon uploads
CREATE POLICY "Allow uploads to product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

-- Storage policy: allow deletes
CREATE POLICY "Allow deletes from product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');

-- Storage policy: allow updates
CREATE POLICY "Allow updates to product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images');

-- =============================================
-- RLS: Enable Row Level Security but allow all
-- (No auth for now - single user app)
-- =============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_costs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon (no auth)
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on product_colors" ON product_colors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on brand_costs" ON brand_costs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on operating_costs" ON operating_costs FOR ALL USING (true) WITH CHECK (true);
