-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.delivery_addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.delivery_addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON public.delivery_addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.delivery_addresses;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can view deliveries for their orders" ON public.deliveries;
DROP POLICY IF EXISTS "Delivery personnel can update their deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies

-- Profiles: Allow all reads, restrict writes to own profile
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Delivery addresses: Users manage their own addresses
CREATE POLICY "addresses_select_policy" ON public.delivery_addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "addresses_insert_policy" ON public.delivery_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_update_policy" ON public.delivery_addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "addresses_delete_policy" ON public.delivery_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Categories: Public read access
CREATE POLICY "categories_select_policy" ON public.categories
  FOR SELECT USING (true);

-- Products: Public read access
CREATE POLICY "products_select_policy" ON public.products
  FOR SELECT USING (true);

-- Orders: Users manage their own orders
CREATE POLICY "orders_select_policy" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_policy" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_policy" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Order items: Access through orders
CREATE POLICY "order_items_select_policy" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_insert_policy" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Deliveries: Users and delivery personnel can view
CREATE POLICY "deliveries_select_policy" ON public.deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = deliveries.order_id
      AND orders.user_id = auth.uid()
    )
    OR auth.uid() = delivery_person_id
  );

CREATE POLICY "deliveries_update_policy" ON public.deliveries
  FOR UPDATE USING (auth.uid() = delivery_person_id);

-- Reviews: Public read, users manage their own
CREATE POLICY "reviews_select_policy" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_policy" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_update_policy" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "reviews_delete_policy" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications: Users view their own
CREATE POLICY "notifications_select_policy" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_policy" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
