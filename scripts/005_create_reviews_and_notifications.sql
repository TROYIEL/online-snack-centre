-- Create reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in ('order', 'delivery', 'payment', 'system')),
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

-- Reviews policies
create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

create policy "Users can create reviews for their orders"
  on public.reviews for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.orders
      where id = order_id and user_id = auth.uid() and status = 'delivered'
    )
  );

-- Notifications policies
create policy "Users can view their notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Admins can create notifications
create policy "Admins can create notifications"
  on public.notifications for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
