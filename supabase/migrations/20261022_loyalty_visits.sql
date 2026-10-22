-- ============================================================================
-- Pasaporte · Visitas y premios por spot
--
-- • spot_loyalty: cada spot decide si da premio por visitas, cuántas pide,
--   qué regala y cómo se valida la visita (QR impreso o PIN del dueño).
-- • spot_pins: PIN secreto de 4 dígitos que solo conoce el dueño (lo ve en
--   su panel /local/<token>). Se renueva CADA vez que se usa.
-- • loyalty_rewards: premios ganados y canjeados (el canje pide el PIN).
-- • visit_check_in(): ÚNICA puerta para marcar una visita — sirve para el
--   pasaporte y para la asistencia del itinerario (mismo QR / PIN).
--
-- Además se cierran permisos que estaban abiertos: los códigos QR ya no se
-- pueden leer desde el cliente (se validan en el servidor), las visitas
-- solo las ve su dueño y QR / beneficios solo los edita un admin.
-- ============================================================================

-- ── Configuración por spot ──────────────────────────────────────────────────
create table if not exists public.spot_loyalty (
  spot_id            uuid primary key references public.spots (id) on delete cascade,
  enabled            boolean not null default false,
  visits_required    int not null default 5 check (visits_required between 2 and 30),
  reward_title       text check (char_length(reward_title) <= 80),
  reward_description text check (char_length(reward_description) <= 300),
  reward_emoji       text not null default '🎁' check (char_length(reward_emoji) <= 8),
  -- 'qr': vale el QR impreso del local · 'pin': solo PIN del dueño (o su QR dinámico)
  validation         text not null default 'qr' check (validation in ('qr', 'pin')),
  -- Una misma persona suma como máximo una visita cada N horas en el mismo spot.
  cooldown_hours     int not null default 8 check (cooldown_hours between 0 and 168),
  owner_token        uuid not null default gen_random_uuid() unique,
  updated_at         timestamptz not null default now()
);
alter table public.spot_loyalty enable row level security;

do $$ begin
  create policy spot_loyalty_read on public.spot_loyalty for select using (true);
exception when duplicate_object then null; end $$;
-- El token del panel del dueño nunca sale por la API pública.
revoke all on public.spot_loyalty from anon, authenticated;
grant select (spot_id, enabled, visits_required, reward_title, reward_description, reward_emoji, validation, cooldown_hours)
  on public.spot_loyalty to anon, authenticated;

-- ── PIN rotativo (sin políticas: ningún cliente lo puede leer) ──────────────
create table if not exists public.spot_pins (
  spot_id    uuid primary key references public.spots (id) on delete cascade,
  pin        text not null check (pin ~ '^[0-9]{4}$'),
  uses       int not null default 0,
  rotated_at timestamptz not null default now()
);
alter table public.spot_pins enable row level security;
revoke all on public.spot_pins from anon, authenticated;

-- Intentos fallidos de PIN (freno a la fuerza bruta: 5 cada 10 min por spot).
create table if not exists public.spot_pin_attempts (
  id      bigint generated always as identity primary key,
  user_id uuid not null,
  spot_id uuid not null,
  at      timestamptz not null default now()
);
create index if not exists spot_pin_attempts_idx on public.spot_pin_attempts (user_id, spot_id, at desc);
alter table public.spot_pin_attempts enable row level security;
revoke all on public.spot_pin_attempts from anon, authenticated;

-- ── Premios ─────────────────────────────────────────────────────────────────
create table if not exists public.loyalty_rewards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  spot_id     uuid not null references public.spots (id) on delete cascade,
  title       text not null,
  description text,
  emoji       text not null default '🎁',
  earned_at   timestamptz not null default now(),
  redeemed_at timestamptz
);
create index if not exists loyalty_rewards_user_idx on public.loyalty_rewards (user_id, spot_id, earned_at desc);
alter table public.loyalty_rewards enable row level security;
do $$ begin
  create policy loyalty_rewards_read on public.loyalty_rewards for select
    using (user_id = auth.uid() or public.market_is_admin());
exception when duplicate_object then null; end $$;
revoke insert, update, delete on public.loyalty_rewards from anon, authenticated;
grant select on public.loyalty_rewards to authenticated;

-- ── Visitas: más contexto ───────────────────────────────────────────────────
-- Las visitas por PIN no traen QR.
alter table public.spot_visits alter column qr_code drop not null;
alter table public.spot_visits add column if not exists method text not null default 'qr';
alter table public.spot_visits add column if not exists source text not null default 'itinerary';
create index if not exists spot_visits_user_spot_idx on public.spot_visits (user_id, spot_id, visited_at desc);

-- ── Permisos que estaban abiertos ───────────────────────────────────────────
alter policy "public read" on public.spot_qr_codes using (public.market_is_admin());
alter policy "admin insert" on public.spot_qr_codes with check (public.market_is_admin());
alter policy "admin update" on public.spot_qr_codes using (public.market_is_admin());
alter policy "admin read all" on public.spot_visits using (user_id = auth.uid() or public.market_is_admin());
alter policy "users insert own" on public.spot_visits with check (false);
alter policy "admin insert" on public.spot_benefits with check (public.market_is_admin());
alter policy "admin update" on public.spot_benefits using (public.market_is_admin());

-- ── Utilidades ──────────────────────────────────────────────────────────────
create or replace function public.loyalty_new_pin(p_old text default null)
returns text language plpgsql volatile set search_path = public as $$
declare v text;
begin
  loop
    v := lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when v is distinct from p_old and v not in ('0000', '1234', '1111');
  end loop;
  return v;
end $$;

/** Progreso hacia el próximo premio: visitas desde el último premio ganado. */
create or replace function public.loyalty_progress(p_user uuid, p_spot uuid)
returns int language sql stable set search_path = public as $$
  select count(*)::int from spot_visits v
  where v.user_id = p_user and v.spot_id = p_spot
    and v.visited_at > coalesce(
      (select max(earned_at) from loyalty_rewards r where r.user_id = p_user and r.spot_id = p_spot),
      '-infinity'::timestamptz);
$$;

/** Resumen de un spot para un usuario (visitas, programa, progreso, premios). */
create or replace function public.passport_spot_json(p_user uuid, p_spot uuid)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'spot_id', p_spot,
    'visits', (select count(*) from spot_visits v where v.user_id = p_user and v.spot_id = p_spot),
    'last_visit', (select max(visited_at) from spot_visits v where v.user_id = p_user and v.spot_id = p_spot),
    'loyalty', (
      select jsonb_build_object(
        'enabled', l.enabled, 'visits_required', l.visits_required, 'reward_title', l.reward_title,
        'reward_description', l.reward_description, 'reward_emoji', l.reward_emoji,
        'validation', l.validation, 'cooldown_hours', l.cooldown_hours)
      from spot_loyalty l where l.spot_id = p_spot and l.enabled),
    'progress', loyalty_progress(p_user, p_spot),
    'rewards', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'title', r.title, 'description', r.description,
        'emoji', r.emoji, 'earned_at', r.earned_at, 'redeemed_at', r.redeemed_at) order by r.earned_at desc)
      from loyalty_rewards r where r.user_id = p_user and r.spot_id = p_spot), '[]'::jsonb)
  );
$$;

-- ── Marcar visita (pasaporte + asistencia del itinerario) ───────────────────
-- p_code: lo que trae el QR. Puede ser el QR impreso del local (spot_qr_codes)
--         o el QR dinámico del panel del dueño: 'BPIN:<spot_id>:<pin>'.
-- p_spot + p_pin: el PIN que dicta el personal.
-- p_itinerary: si viene del itinerario (solo se guarda como referencia).
-- Devuelve { ok, reason?, spot_id, spot_name, already, method, summary, reward_earned }.
create or replace function public.visit_check_in(
  p_code text default null, p_spot uuid default null, p_pin text default null, p_itinerary uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_code text := nullif(trim(p_code), '');
  v_spot uuid := p_spot;
  v_pin text := nullif(trim(p_pin), '');
  v_method text;
  v_loyalty spot_loyalty;
  v_name text;
  v_last timestamptz;
  v_already boolean := false;
  v_pin_row spot_pins;
  v_fails int;
  v_reward loyalty_rewards;
  v_parts text[];
begin
  if v_uid is null then raise exception 'VISIT:AUTH'; end if;

  -- 1. ¿Qué spot y con qué método?
  if v_code is not null and v_code like 'BPIN:%' then
    v_parts := string_to_array(v_code, ':');
    begin
      v_spot := v_parts[2]::uuid;
    exception when others then
      return jsonb_build_object('ok', false, 'reason', 'INVALID_CODE');
    end;
    v_pin := v_parts[3];
    v_method := 'pin';
  elsif v_code is not null then
    select q.spot_id into v_spot from spot_qr_codes q where q.code = v_code and q.active;
    if v_spot is null then return jsonb_build_object('ok', false, 'reason', 'INVALID_CODE'); end if;
    v_method := 'qr';
  elsif v_spot is not null and v_pin is not null then
    v_method := 'pin';
  else
    return jsonb_build_object('ok', false, 'reason', 'INVALID_CODE');
  end if;

  select name into v_name from spots where id = v_spot;
  if v_name is null then return jsonb_build_object('ok', false, 'reason', 'INVALID_CODE'); end if;
  select * into v_loyalty from spot_loyalty where spot_id = v_spot;

  -- 2. Validación según lo que pide el spot.
  if v_method = 'qr' and v_loyalty.validation = 'pin' then
    return jsonb_build_object('ok', false, 'reason', 'PIN_REQUIRED', 'spot_id', v_spot, 'spot_name', v_name);
  end if;
  if v_method = 'pin' then
    select count(*) into v_fails from spot_pin_attempts
      where user_id = v_uid and spot_id = v_spot and at > now() - interval '10 minutes';
    if v_fails >= 5 then
      return jsonb_build_object('ok', false, 'reason', 'TOO_MANY_ATTEMPTS', 'spot_id', v_spot, 'spot_name', v_name);
    end if;
    select * into v_pin_row from spot_pins where spot_id = v_spot for update;
    if v_pin_row.spot_id is null or v_pin_row.pin is distinct from v_pin then
      insert into spot_pin_attempts (user_id, spot_id) values (v_uid, v_spot);
      return jsonb_build_object('ok', false, 'reason', 'WRONG_PIN', 'spot_id', v_spot, 'spot_name', v_name,
        'attempts_left', greatest(0, 4 - v_fails));
    end if;
    -- El PIN se renueva cada vez que se usa.
    update spot_pins set pin = loyalty_new_pin(pin), uses = uses + 1, rotated_at = now() where spot_id = v_spot;
  end if;

  -- 3. Una visita cada N horas por persona y spot.
  select max(visited_at) into v_last from spot_visits where user_id = v_uid and spot_id = v_spot;
  v_already := v_last is not null and v_last > now() - make_interval(hours => coalesce(v_loyalty.cooldown_hours, 8));

  if not v_already then
    insert into spot_visits (spot_id, user_id, qr_code, itinerary_id, method, source)
    values (v_spot, v_uid, case when v_method = 'qr' then v_code end, p_itinerary, v_method,
            case when p_itinerary is null then 'passport' else 'itinerary' end);

    -- 4. ¿Completó la tarjeta? → premio.
    if v_loyalty.enabled and loyalty_progress(v_uid, v_spot) >= v_loyalty.visits_required then
      insert into loyalty_rewards (user_id, spot_id, title, description, emoji)
      values (v_uid, v_spot, coalesce(v_loyalty.reward_title, 'Premio del local'), v_loyalty.reward_description, v_loyalty.reward_emoji)
      returning * into v_reward;
    end if;
  end if;

  return jsonb_build_object(
    'ok', true, 'spot_id', v_spot, 'spot_name', v_name, 'already', v_already, 'method', v_method,
    'summary', passport_spot_json(v_uid, v_spot),
    'reward_earned', case when v_reward.id is null then null else jsonb_build_object(
      'id', v_reward.id, 'title', v_reward.title, 'description', v_reward.description, 'emoji', v_reward.emoji,
      'earned_at', v_reward.earned_at) end
  );
end $$;

-- ── Canjear un premio: lo confirma el personal con el PIN (que se renueva) ──
create or replace function public.loyalty_redeem(p_reward uuid, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_reward loyalty_rewards;
  v_pin_row spot_pins;
  v_fails int;
begin
  if v_uid is null then raise exception 'VISIT:AUTH'; end if;
  select * into v_reward from loyalty_rewards where id = p_reward and user_id = v_uid for update;
  if v_reward.id is null then return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND'); end if;
  if v_reward.redeemed_at is not null then return jsonb_build_object('ok', false, 'reason', 'ALREADY_REDEEMED'); end if;

  select count(*) into v_fails from spot_pin_attempts
    where user_id = v_uid and spot_id = v_reward.spot_id and at > now() - interval '10 minutes';
  if v_fails >= 5 then return jsonb_build_object('ok', false, 'reason', 'TOO_MANY_ATTEMPTS'); end if;

  select * into v_pin_row from spot_pins where spot_id = v_reward.spot_id for update;
  if v_pin_row.spot_id is null or v_pin_row.pin is distinct from trim(p_pin) then
    insert into spot_pin_attempts (user_id, spot_id) values (v_uid, v_reward.spot_id);
    return jsonb_build_object('ok', false, 'reason', 'WRONG_PIN', 'attempts_left', greatest(0, 4 - v_fails));
  end if;

  update spot_pins set pin = loyalty_new_pin(pin), uses = uses + 1, rotated_at = now() where spot_id = v_reward.spot_id;
  update loyalty_rewards set redeemed_at = now() where id = p_reward;
  return jsonb_build_object('ok', true, 'redeemed_at', now());
end $$;

-- ── Lecturas del pasaporte ──────────────────────────────────────────────────
/** Todo lo del usuario: spots visitados + spots con programa de premios. */
create or replace function public.passport_summary()
returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(passport_spot_json(auth.uid(), s.spot_id)), '[]'::jsonb)
  from (
    select distinct spot_id from spot_visits where user_id = auth.uid()
    union
    select spot_id from spot_loyalty where enabled
  ) s;
$$;

/** Detalle de un spot para la pantalla de visitas: resumen + historial. */
create or replace function public.passport_spot(p_spot uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select passport_spot_json(auth.uid(), p_spot) || jsonb_build_object(
    'history', coalesce((
      select jsonb_agg(jsonb_build_object('visited_at', v.visited_at, 'method', v.method, 'source', v.source) order by v.visited_at desc)
      from spot_visits v where v.user_id = auth.uid() and v.spot_id = p_spot), '[]'::jsonb));
$$;

-- ── Panel del dueño (enlace secreto, sin cuenta) ────────────────────────────
create or replace function public.loyalty_owner_panel(p_token uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_loyalty spot_loyalty;
  v_pin spot_pins;
  v_today timestamptz := date_trunc('day', now() at time zone 'America/Lima') at time zone 'America/Lima';
begin
  select * into v_loyalty from spot_loyalty where owner_token = p_token;
  if v_loyalty.spot_id is null then return null; end if;
  select * into v_pin from spot_pins where spot_id = v_loyalty.spot_id;
  if v_pin.spot_id is null then
    insert into spot_pins (spot_id, pin) values (v_loyalty.spot_id, loyalty_new_pin()) returning * into v_pin;
  end if;
  return (
    select jsonb_build_object(
      'spot_id', s.id, 'spot_name', s.name, 'photo_url', s.photo_url,
      'pin', v_pin.pin, 'qr_payload', 'BPIN:' || s.id || ':' || v_pin.pin, 'rotated_at', v_pin.rotated_at,
      'validation', v_loyalty.validation, 'enabled', v_loyalty.enabled,
      'visits_required', v_loyalty.visits_required, 'reward_title', v_loyalty.reward_title, 'reward_emoji', v_loyalty.reward_emoji,
      'visits_today', (select count(*) from spot_visits v where v.spot_id = s.id and v.visited_at >= v_today),
      'rewards_redeemed_today', (select count(*) from loyalty_rewards r where r.spot_id = s.id and r.redeemed_at >= v_today))
    from spots s where s.id = v_loyalty.spot_id);
end $$;

-- ── Admin ───────────────────────────────────────────────────────────────────
create or replace function public.loyalty_admin_list()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not market_is_admin() then raise exception 'VISIT:FORBIDDEN'; end if;
  return (select coalesce(jsonb_agg(x order by x.enabled desc nulls last, x.visits_30d desc, x.name), '[]'::jsonb) from (
    select s.id as spot_id, s.name, s.category, s.photo_url,
           l.enabled, l.visits_required, l.reward_title, l.reward_description, l.reward_emoji,
           coalesce(l.validation, 'qr') as validation, coalesce(l.cooldown_hours, 8) as cooldown_hours, l.owner_token,
           p.pin, p.rotated_at, p.uses as pin_uses,
           (select count(*) from spot_qr_codes q where q.spot_id = s.id and q.active) as qr_codes,
           (select count(*) from spot_visits v where v.spot_id = s.id) as visits_total,
           (select count(*) from spot_visits v where v.spot_id = s.id and v.visited_at > now() - interval '30 days') as visits_30d,
           (select count(*) from loyalty_rewards r where r.spot_id = s.id) as rewards_earned,
           (select count(*) from loyalty_rewards r where r.spot_id = s.id and r.redeemed_at is not null) as rewards_redeemed
    from spots s
    left join spot_loyalty l on l.spot_id = s.id
    left join spot_pins p on p.spot_id = s.id
    where s.status = 'verified'
  ) x);
end $$;

create or replace function public.loyalty_admin_save(
  p_spot uuid, p_enabled boolean, p_visits_required int, p_reward_title text, p_reward_description text,
  p_reward_emoji text, p_validation text, p_cooldown_hours int
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not market_is_admin() then raise exception 'VISIT:FORBIDDEN'; end if;
  if p_enabled and nullif(trim(p_reward_title), '') is null then raise exception 'VISIT:REWARD_REQUIRED'; end if;
  insert into spot_loyalty (spot_id, enabled, visits_required, reward_title, reward_description, reward_emoji, validation, cooldown_hours, updated_at)
  values (p_spot, p_enabled, p_visits_required, nullif(trim(p_reward_title), ''), nullif(trim(p_reward_description), ''),
          coalesce(nullif(trim(p_reward_emoji), ''), '🎁'), p_validation, p_cooldown_hours, now())
  on conflict (spot_id) do update set
    enabled = excluded.enabled, visits_required = excluded.visits_required, reward_title = excluded.reward_title,
    reward_description = excluded.reward_description, reward_emoji = excluded.reward_emoji,
    validation = excluded.validation, cooldown_hours = excluded.cooldown_hours, updated_at = now();
  -- Todo spot configurado tiene su PIN (para validar con PIN o para canjear premios).
  insert into spot_pins (spot_id, pin) values (p_spot, loyalty_new_pin()) on conflict (spot_id) do nothing;
end $$;

create or replace function public.loyalty_admin_rotate_pin(p_spot uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare v text;
begin
  if not market_is_admin() then raise exception 'VISIT:FORBIDDEN'; end if;
  insert into spot_pins (spot_id, pin) values (p_spot, loyalty_new_pin())
  on conflict (spot_id) do update set pin = loyalty_new_pin(spot_pins.pin), rotated_at = now()
  returning pin into v;
  return v;
end $$;

/** Nuevo enlace del panel del dueño (el anterior deja de funcionar). */
create or replace function public.loyalty_admin_new_owner_link(p_spot uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  if not market_is_admin() then raise exception 'VISIT:FORBIDDEN'; end if;
  insert into spot_loyalty (spot_id) values (p_spot) on conflict (spot_id) do nothing;
  update spot_loyalty set owner_token = gen_random_uuid(), updated_at = now() where spot_id = p_spot returning owner_token into v;
  return v;
end $$;

-- ── Permisos de ejecución ───────────────────────────────────────────────────
revoke all on function public.loyalty_new_pin(text) from public, anon, authenticated;
revoke all on function public.loyalty_progress(uuid, uuid) from public, anon, authenticated;
revoke all on function public.passport_spot_json(uuid, uuid) from public, anon, authenticated;
revoke all on function public.visit_check_in(text, uuid, text, uuid) from public, anon;
revoke all on function public.loyalty_redeem(uuid, text) from public, anon;
revoke all on function public.passport_summary() from public, anon;
revoke all on function public.passport_spot(uuid) from public, anon;
revoke all on function public.loyalty_admin_list() from public, anon;
revoke all on function public.loyalty_admin_save(uuid, boolean, int, text, text, text, text, int) from public, anon;
revoke all on function public.loyalty_admin_rotate_pin(uuid) from public, anon;
revoke all on function public.loyalty_admin_new_owner_link(uuid) from public, anon;
grant execute on function public.visit_check_in(text, uuid, text, uuid) to authenticated;
grant execute on function public.loyalty_redeem(uuid, text) to authenticated;
grant execute on function public.passport_summary() to authenticated;
grant execute on function public.passport_spot(uuid) to authenticated;
grant execute on function public.loyalty_owner_panel(uuid) to anon, authenticated;
grant execute on function public.loyalty_admin_list() to authenticated;
grant execute on function public.loyalty_admin_save(uuid, boolean, int, text, text, text, text, int) to authenticated;
grant execute on function public.loyalty_admin_rotate_pin(uuid) to authenticated;
grant execute on function public.loyalty_admin_new_owner_link(uuid) to authenticated;
