-- Create deliveries table
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  delivery_person_id uuid references public.profiles(id),
  qr_code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed')),
  current_latitude decimal(10, 8),
  current_longitude decimal(11, 8),
  estimated_delivery_time timestamptz,
  actual_delivery_time timestamptz,
  delivery_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.deliveries enable row level security;

-- Users can view deliveries for their orders
create policy "Users can view their deliveries"
  on public.deliveries for select
  using (
    exists (
      select 1 from public.orders
      where id = order_id and user_id = auth.uid()
    )
  );

-- Delivery personnel can view assigned deliveries
create policy "Delivery personnel can view assigned deliveries"
  on public.deliveries for select
  using (
    auth.uid() = delivery_person_id or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'delivery_personnel')
    )
  );

-- Delivery personnel can update their deliveries
create policy "Delivery personnel can update deliveries"
  on public.deliveries for update
  using (
    auth.uid() = delivery_person_id or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can manage all deliveries
create policy "Admins can manage deliveries"
  on public.deliveries for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
