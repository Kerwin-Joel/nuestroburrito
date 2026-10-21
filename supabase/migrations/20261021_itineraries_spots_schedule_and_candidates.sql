-- =============================================================================
-- Burrito · Itinerarios inteligentes — Fase 2
-- Columnas en spots, horarios relacionales (con backfill desde el schedule
-- jsonb existente), vista contrato itin_spots, RPC itin_candidates,
-- y tabla ai_itinerary_runs (historial de generaciones, base del freemium).
--
-- Decisiones de esta migración:
--  - PostGIS NO se activa: el proyecto tiene 50 spots hoy; Haversine +
--    bounding box (ver itin_candidates) rinde igual a esta escala y evita
--    mantener una columna geography sincronizada. Si el catálogo crece mucho,
--    se puede migrar después sin tocar el contrato de itin_candidates.
--  - spot_horarios arranca con un backfill desde spots.schedule (jsonb
--    existente), no vacía: así no se pierden los horarios reales que ya
--    cargaron las churres. Las claves de día llegaron mezcladas (inglés
--    abreviado / español con y sin tilde, a veces ambas a la vez) y algunos
--    valores traen dos tramos separados por "//"; se descartan los tramos
--    que no parsean, los "abre = cierra" (placeholder, no horario real) y
--    los que cruzan medianoche (pocos casos; quedan como "sin horario
--    conocido" = abierto siempre, igual que hoy).
--  - La tabla de historial de IA se llama ai_itinerary_runs, no "itinerarios":
--    evita la colisión con la tabla itineraries ya existente (los
--    itinerarios que arma y guarda el turista, otra cosa).
-- =============================================================================

-- 1. Columnas aditivas en spots -------------------------------------------------
alter table public.spots add column if not exists duracion_visita_min int not null default 45;
alter table public.spots add column if not exists apto_mediodia boolean not null default true;
alter table public.spots add column if not exists es_comida boolean not null default false;

comment on column public.spots.duracion_visita_min is 'Minutos típicos de visita (itinerarios)';
comment on column public.spots.apto_mediodia is 'Techado o tolerable con el calor de 12:00 a 15:00';
comment on column public.spots.es_comida is 'Restaurante / picantería: candidato para el almuerzo';

update public.spots set es_comida = true where category = 'gastronomia' and not es_comida;

-- 2. Horarios por día ------------------------------------------------------------
create table if not exists public.spot_horarios (
  spot_id     uuid not null references public.spots(id) on delete cascade,
  dia_semana  smallint not null check (dia_semana between 0 and 6),
  abre        time not null,
  cierra      time not null check (cierra > abre),
  primary key (spot_id, dia_semana, abre)
);
alter table public.spot_horarios enable row level security;
drop policy if exists spot_horarios_lectura on public.spot_horarios;
create policy spot_horarios_lectura on public.spot_horarios for select using (true);
grant select on public.spot_horarios to anon, authenticated;

do $$
declare
  s record;
  d record;
  tramo text;
  m text[];
  v_dow smallint;
  v_abre time;
  v_cierra time;
begin
  for s in select id, schedule from public.spots where coalesce(schedule, '{}'::jsonb) <> '{}'::jsonb
  loop
    for d in select key as dia, value as rango from jsonb_each_text(s.schedule)
    loop
      v_dow := case lower(trim(d.dia))
        when 'sun' then 0 when 'domingo' then 0
        when 'mon' then 1 when 'lunes' then 1
        when 'tue' then 2 when 'martes' then 2
        when 'wed' then 3 when 'miércoles' then 3 when 'miercoles' then 3
        when 'thu' then 4 when 'jueves' then 4
        when 'fri' then 5 when 'viernes' then 5
        when 'sat' then 6 when 'sábado' then 6 when 'sabado' then 6
        else null
      end;
      if v_dow is null then continue; end if;

      foreach tramo in array regexp_split_to_array(d.rango, '//')
      loop
        m := regexp_match(trim(tramo), '^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$');
        if m is null then continue; end if;
        begin
          v_abre := make_time(m[1]::int, m[2]::int, 0);
          v_cierra := make_time(m[3]::int, m[4]::int, 0);
        exception when others then continue;
        end;
        if v_cierra <= v_abre then continue; end if;

        insert into public.spot_horarios (spot_id, dia_semana, abre, cierra)
        values (s.id, v_dow, v_abre, v_cierra)
        on conflict (spot_id, dia_semana, abre) do nothing;
      end loop;
    end loop;
  end loop;
end $$;

-- 3. Vista contrato: el único punto acoplado a los nombres reales de spots -------
create or replace view public.itin_spots
with (security_invoker = true) as
select
  s.id,
  s.name,
  s.lat::double precision as lat,
  s.lng::double precision as lng,
  coalesce(s.category, 'otros') as category,
  s.rating,
  s.duracion_visita_min as visit_min,
  s.apto_mediodia as midday_ok,
  s.es_comida as is_food
from public.spots s
where s.status = 'verified'
  and s.category <> 'hoteles'
  and s.lat is not null and s.lng is not null;

grant select on public.itin_spots to anon, authenticated;

-- 4. Distancia + candidatos (Haversine) ------------------------------------------
create or replace function public.geo_distance_m(
  lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable parallel safe as $$
  select 2 * 6371000 * asin(least(1, sqrt(
           power(sin(radians(lat2 - lat1) / 2), 2) +
           cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2))));
$$;

create or replace function public.itin_candidates(
  p_lat double precision, p_lng double precision,
  p_radius_m int, p_dow smallint, p_limit int default 40)
returns table (
  id uuid, name text, lat double precision, lng double precision, category text,
  rating numeric, visit_min int, midday_ok boolean, is_food boolean,
  open_min int, close_min int, distance_m int)
language sql stable security invoker set search_path = public as $$
  with near as (
    select v.*, geo_distance_m(p_lat, p_lng, v.lat, v.lng) as d
      from itin_spots v
     where v.lat between p_lat - p_radius_m / 111320.0 and p_lat + p_radius_m / 111320.0
       and v.lng between p_lng - p_radius_m / (111320.0 * cos(radians(p_lat)))
                     and p_lng + p_radius_m / (111320.0 * cos(radians(p_lat)))
  ),
  horario as (
    select distinct on (h.spot_id) h.spot_id,
           (extract(hour from h.abre) * 60 + extract(minute from h.abre))::int as open_min,
           (extract(hour from h.cierra) * 60 + extract(minute from h.cierra))::int as close_min
      from spot_horarios h
     where h.dia_semana = p_dow
     order by h.spot_id, (h.cierra - h.abre) desc
  )
  select n.id, n.name, n.lat, n.lng, n.category, n.rating, n.visit_min, n.midday_ok, n.is_food,
         h.open_min, h.close_min, round(n.d)::int
    from near n
    left join horario h on h.spot_id = n.id
   where n.d <= p_radius_m
     and (h.spot_id is not null or not exists (select 1 from spot_horarios x where x.spot_id = n.id))
   order by n.d
   limit greatest(1, least(p_limit, 80));
$$;

grant execute on function public.geo_distance_m(double precision, double precision, double precision, double precision) to anon, authenticated;
grant execute on function public.itin_candidates(double precision, double precision, int, smallint, int) to anon, authenticated;

-- 5. Historial de itinerarios generados por IA (base del freemium) --------------
create table if not exists public.ai_itinerary_runs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  solicitud   jsonb not null,
  resultado   jsonb not null,
  guardado    boolean not null default false,
  creado_en   timestamptz not null default now()
);
create index if not exists ai_itinerary_runs_usuario on public.ai_itinerary_runs (user_id, creado_en desc);
alter table public.ai_itinerary_runs enable row level security;
drop policy if exists ai_itinerary_runs_propios on public.ai_itinerary_runs;
create policy ai_itinerary_runs_propios on public.ai_itinerary_runs
  for select to authenticated using (user_id = auth.uid());
drop policy if exists ai_itinerary_runs_guardar on public.ai_itinerary_runs;
create policy ai_itinerary_runs_guardar on public.ai_itinerary_runs
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.ai_itinerary_runs from anon, authenticated;
grant select, update (guardado) on public.ai_itinerary_runs to authenticated;
