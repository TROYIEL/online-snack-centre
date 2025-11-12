-- Create orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_number text not null unique,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled')),
  payment_method text not null check (payment_method in ('stripe', 'mtn_mobile_money', 'airtel_money', 'cash_on_delivery')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  subtotal decimal(10, 2) not null,
  delivery_fee decimal(10, 2) not null default 0,
  total decimal(10, 2) not null,
  delivery_address_id uuid references public.delivery_addresses(id),
  delivery_notes text,
  stripe_payment_intent_id text,
  mobile_money_transaction_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create order items table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  price decimal(10, 2) not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Users can view their own orders
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can create their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Admins and delivery personnel can view all orders
create policy "Staff can view all orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'delivery_personnel')
    )
  );

-- Admins can update orders
create policy "Admins can update orders"
  on public.orders for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Order items policies
create policy "Users can view their order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where id = order_id and user_id = auth.uid()
    )
  );

create policy "Users can create order items for their orders"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where id = order_id and user_id = auth.uid()
    )
  );

create policy "Staff can view all order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'delivery_personnel')
    )
  );
