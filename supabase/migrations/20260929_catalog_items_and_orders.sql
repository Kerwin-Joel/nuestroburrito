-- Agrupar sedes del mismo negocio y mostrar su QR de cobro
alter table public.spots
  add column if not exists brand_name text,
  add column if not exists payment_qr_url text,
  add column if not exists payment_note text,
  add column if not exists checkin_time text,
  add column if not exists checkout_time text;

-- El catálogo vendible: habitación, plato, producto o tour
create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  kind text not null default 'producto', -- 'habitacion' | 'plato' | 'producto' | 'tour'
  name text not null,
  description text,
  price numeric not null,
  unit_label text,                       -- "por noche", "por persona", "por unidad"
  images text[] not null default '{}',
  variants jsonb not null default '[]',  -- [{"nombre":"Talla","opciones":["S","M","L"]}]
  capacity int,                          -- personas (habitaciones, tours)
  stock_status text not null default 'disponible', -- 'disponible' | 'pocas_unidades' | 'agotado'
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.catalog_items enable row level security;
drop policy if exists "catalog visible" on public.catalog_items;
create policy "catalog visible" on public.catalog_items for select using (active = true);
drop policy if exists "churre administra su catalogo" on public.catalog_items;
create policy "churre administra su catalogo" on public.catalog_items for all
  using (spot_id in (select id from public.spots where churre_id = auth.uid()::text))
  with check (spot_id in (select id from public.spots where churre_id = auth.uid()::text));

-- El pedido: nunca toca dinero, solo registra y espera confirmación manual
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles(id),
  spot_id uuid not null references public.spots(id),
  items jsonb not null,       -- snapshot: [{"item_id","name","qty","price"}]
  total numeric not null,
  status text not null default 'pendiente_confirmacion', -- 'pendiente_confirmacion' | 'confirmado' | 'entregado' | 'cancelado'
  payment_method text not null default 'yape_plin',
  note text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
alter table public.orders enable row level security;
drop policy if exists "comprador ve sus pedidos" on public.orders;
create policy "comprador ve sus pedidos" on public.orders for select using (buyer_id = auth.uid());
drop policy if exists "comprador crea su pedido" on public.orders;
create policy "comprador crea su pedido" on public.orders for insert with check (buyer_id = auth.uid());
drop policy if exists "churre ve y confirma pedidos de su spot" on public.orders;
create policy "churre ve y confirma pedidos de su spot" on public.orders for all
  using (spot_id in (select id from public.spots where churre_id = auth.uid()::text));
