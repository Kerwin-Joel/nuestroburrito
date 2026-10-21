-- ============================================================================
-- Tienda Burrito · Marketplace de artesanos y emprendedores turísticos
--
-- Un vendedor (artesano / emprendedor) sube fotos y videos de su producto.
-- La IA (Edge Function market-ai) redacta título, descripción, historia y
-- precio sugerido, y genera un video corto del producto. El vendedor revisa,
-- edita y lo envía a revisión; el equipo Burrito (profiles.role = 'admin')
-- lo aprueba y recién ahí se publica en la Tienda.
--
-- Los clientes solo LEEN tablas (RLS) y ESCRIBEN vía RPC SECURITY DEFINER.
-- Los campos de IA solo los escribe la Edge Function con service role.
-- ============================================================================

do $$ begin
  create type market_product_status as enum ('draft', 'pending_review', 'published', 'rejected', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type market_ai_status as enum ('idle', 'running', 'done', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists public.market_sellers (
  id            uuid primary key references auth.users (id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 80),
  owner_name    text not null check (char_length(owner_name) between 2 and 80),
  -- Solo dígitos, con código de país: 51 9XXXXXXXX
  whatsapp      text not null check (whatsapp ~ '^519[0-9]{8}$'),
  district      text check (char_length(district) <= 60),
  craft         text check (char_length(craft) <= 60),
  bio           text check (char_length(bio) <= 500),
  -- Lo marca el equipo cuando conoce al vendedor (insignia "Verificado").
  verified      boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists public.market_products (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references public.market_sellers (id) on delete cascade,
  status          market_product_status not null default 'draft',
  title           text check (char_length(title) <= 90),
  tagline         text check (char_length(tagline) <= 120),
  description     text check (char_length(description) <= 1500),
  story           text check (char_length(story) <= 1500),
  category        text check (category in ('artesania', 'textil', 'ceramica', 'joyeria', 'gastronomia', 'decoracion', 'experiencia', 'otros')),
  materials       text[] not null default '{}',
  tags            text[] not null default '{}',
  price_pen       numeric(10, 2) check (price_pen is null or price_pen between 1 and 99999),
  stock           int check (stock is null or stock between 0 and 100000),
  -- [{ "path": "<uid>/<producto>/x.jpg", "type": "image" | "video" }], el primero image = portada
  media           jsonb not null default '[]'::jsonb,
  -- IA de texto
  ai_text_status  market_ai_status not null default 'idle',
  ai_text_error   text,
  ai_suggestion   jsonb,            -- { price_min, price_max, ... } solo como guía para el vendedor
  -- IA de video
  ai_video_status market_ai_status not null default 'idle',
  ai_video_path   text,
  ai_video_error  text,
  ai_video_count  int not null default 0,
  ai_video_started_at timestamptz,
  -- Revisión
  review_note     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  published_at    timestamptz
);

create index if not exists market_products_status_idx on public.market_products (status, published_at desc);
create index if not exists market_products_seller_idx on public.market_products (seller_id, updated_at desc);

alter table public.market_sellers enable row level security;
alter table public.market_products enable row level security;

create or replace function public.market_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Lectura: productos publicados para todos; los propios para su dueño; todo para admin.
do $$ begin
  create policy market_products_read on public.market_products for select
    using (status = 'published' or seller_id = auth.uid() or public.market_is_admin());
exception when duplicate_object then null; end $$;

-- Vendedores: visibles si tienen algo publicado (su WhatsApp es para recibir pedidos), o uno mismo, o admin.
do $$ begin
  create policy market_sellers_read on public.market_sellers for select
    using (
      id = auth.uid() or public.market_is_admin()
      or exists (select 1 from public.market_products p where p.seller_id = market_sellers.id and p.status = 'published')
    );
exception when duplicate_object then null; end $$;

grant select on public.market_products to anon, authenticated;
grant select on public.market_sellers to anon, authenticated;

-- ── Storage: market-media (público para leer; cada uno escribe en su carpeta) ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('market-media', 'market-media', true, 52428800,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$ begin
  create policy market_media_insert_own on storage.objects for insert to authenticated
    with check (bucket_id = 'market-media' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy market_media_delete_own on storage.objects for delete to authenticated
    using (bucket_id = 'market-media' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;

-- ── RPCs ────────────────────────────────────────────────────────────────────

create or replace function public.market_upsert_seller(
  p_business_name text, p_owner_name text, p_whatsapp text,
  p_district text default null, p_craft text default null, p_bio text default null
) returns public.market_sellers
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_phone text := regexp_replace(coalesce(p_whatsapp, ''), '[^0-9]', '', 'g');
  v_row market_sellers;
begin
  if v_uid is null then raise exception 'MARKET:AUTH'; end if;
  if char_length(v_phone) = 9 then v_phone := '51' || v_phone; end if;
  if v_phone !~ '^519[0-9]{8}$' then raise exception 'MARKET:WHATSAPP'; end if;
  insert into market_sellers (id, business_name, owner_name, whatsapp, district, craft, bio)
  values (v_uid, trim(p_business_name), trim(p_owner_name), v_phone,
          nullif(trim(p_district), ''), nullif(trim(p_craft), ''), nullif(trim(p_bio), ''))
  on conflict (id) do update set
    business_name = excluded.business_name, owner_name = excluded.owner_name,
    whatsapp = excluded.whatsapp, district = excluded.district,
    craft = excluded.craft, bio = excluded.bio
  returning * into v_row;
  return v_row;
end $$;

-- Valida la lista de medios: rutas propias, 1–8 fotos, hasta 2 videos.
create or replace function public.market_check_media(p_media jsonb, p_uid uuid)
returns void language plpgsql immutable set search_path = public as $$
declare
  v_item jsonb;
  v_images int := 0;
  v_videos int := 0;
begin
  if jsonb_typeof(p_media) <> 'array' then raise exception 'MARKET:MEDIA'; end if;
  for v_item in select * from jsonb_array_elements(p_media) loop
    if (v_item->>'path') is null or split_part(v_item->>'path', '/', 1) <> p_uid::text then
      raise exception 'MARKET:MEDIA';
    end if;
    case v_item->>'type'
      when 'image' then v_images := v_images + 1;
      when 'video' then v_videos := v_videos + 1;
      else raise exception 'MARKET:MEDIA';
    end case;
  end loop;
  if v_images + v_videos = 0 then raise exception 'MARKET:MEDIA_EMPTY'; end if;
  if v_images > 8 or v_videos > 2 then raise exception 'MARKET:MEDIA_LIMIT'; end if;
end $$;

create or replace function public.market_create_product(p_id uuid, p_media jsonb)
returns public.market_products
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_row market_products;
begin
  if v_uid is null then raise exception 'MARKET:AUTH'; end if;
  if not exists (select 1 from market_sellers where id = v_uid) then raise exception 'MARKET:NO_SELLER'; end if;
  if (select count(*) from market_products where seller_id = v_uid and status <> 'archived') >= 60 then
    raise exception 'MARKET:TOO_MANY';
  end if;
  perform market_check_media(p_media, v_uid);
  insert into market_products (id, seller_id, media) values (coalesce(p_id, gen_random_uuid()), v_uid, p_media)
  returning * into v_row;
  return v_row;
end $$;

create or replace function public.market_update_product(
  p_id uuid,
  p_title text, p_tagline text, p_description text, p_story text,
  p_category text, p_materials text[], p_tags text[],
  p_price numeric, p_stock int, p_media jsonb
) returns public.market_products
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_row market_products;
begin
  select * into v_row from market_products where id = p_id and seller_id = v_uid for update;
  if not found then raise exception 'MARKET:NOT_FOUND'; end if;
  if v_row.status = 'archived' then raise exception 'MARKET:ARCHIVED'; end if;
  perform market_check_media(p_media, v_uid);
  update market_products set
    title = nullif(trim(p_title), ''), tagline = nullif(trim(p_tagline), ''),
    description = nullif(trim(p_description), ''), story = nullif(trim(p_story), ''),
    category = nullif(p_category, ''), materials = coalesce(p_materials, '{}'), tags = coalesce(p_tags, '{}'),
    price_pen = p_price, stock = p_stock, media = p_media,
    -- Un publicado que se edita vuelve a revisión.
    status = case when status = 'published' then 'pending_review'::market_product_status else status end,
    updated_at = now()
  where id = p_id
  returning * into v_row;
  return v_row;
end $$;

create or replace function public.market_submit_product(p_id uuid)
returns public.market_products
language plpgsql security definer set search_path = public as $$
declare
  v_row market_products;
begin
  select * into v_row from market_products where id = p_id and seller_id = auth.uid() for update;
  if not found then raise exception 'MARKET:NOT_FOUND'; end if;
  if v_row.status not in ('draft', 'rejected') then raise exception 'MARKET:BAD_STATE'; end if;
  if v_row.title is null or v_row.description is null or v_row.price_pen is null then
    raise exception 'MARKET:INCOMPLETE';
  end if;
  if not exists (select 1 from jsonb_array_elements(v_row.media) m where m->>'type' = 'image') then
    raise exception 'MARKET:NEED_PHOTO';
  end if;
  update market_products set status = 'pending_review', review_note = null, updated_at = now()
  where id = p_id returning * into v_row;
  return v_row;
end $$;

create or replace function public.market_archive_product(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update market_products set status = 'archived', updated_at = now()
  where id = p_id and seller_id = auth.uid();
  if not found then raise exception 'MARKET:NOT_FOUND'; end if;
end $$;

-- Equipo Burrito: aprobar / rechazar con nota.
create or replace function public.market_review_product(p_id uuid, p_approve boolean, p_note text default null)
returns public.market_products
language plpgsql security definer set search_path = public as $$
declare
  v_row market_products;
begin
  if not market_is_admin() then raise exception 'MARKET:FORBIDDEN'; end if;
  update market_products set
    status = case when p_approve then 'published'::market_product_status else 'rejected'::market_product_status end,
    review_note = nullif(trim(p_note), ''),
    published_at = case when p_approve then coalesce(published_at, now()) else published_at end,
    updated_at = now()
  where id = p_id and status = 'pending_review'
  returning * into v_row;
  if not found then raise exception 'MARKET:BAD_STATE'; end if;
  return v_row;
end $$;

create or replace function public.market_verify_seller(p_seller uuid, p_verified boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not market_is_admin() then raise exception 'MARKET:FORBIDDEN'; end if;
  update market_sellers set verified = p_verified where id = p_seller;
end $$;

revoke all on function public.market_upsert_seller(text, text, text, text, text, text) from public, anon;
revoke all on function public.market_create_product(uuid, jsonb) from public, anon;
revoke all on function public.market_update_product(uuid, text, text, text, text, text, text[], text[], numeric, int, jsonb) from public, anon;
revoke all on function public.market_submit_product(uuid) from public, anon;
revoke all on function public.market_archive_product(uuid) from public, anon;
revoke all on function public.market_review_product(uuid, boolean, text) from public, anon;
revoke all on function public.market_verify_seller(uuid, boolean) from public, anon;
revoke all on function public.market_check_media(jsonb, uuid) from public, anon, authenticated;
grant execute on function public.market_upsert_seller(text, text, text, text, text, text) to authenticated;
grant execute on function public.market_create_product(uuid, jsonb) to authenticated;
grant execute on function public.market_update_product(uuid, text, text, text, text, text, text[], text[], numeric, int, jsonb) to authenticated;
grant execute on function public.market_submit_product(uuid) to authenticated;
grant execute on function public.market_archive_product(uuid) to authenticated;
grant execute on function public.market_review_product(uuid, boolean, text) to authenticated;
grant execute on function public.market_verify_seller(uuid, boolean) to authenticated;
