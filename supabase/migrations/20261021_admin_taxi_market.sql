-- ============================================================================
-- Panel admin: Taxi y Tienda
--
-- El admin (profiles.role = 'admin') lee y modera desde la web con estas RPC.
-- La Tienda ya se modera con market_review_product / market_verify_seller y
-- el admin lee market_* por RLS (market_is_admin). Aquí: resumen del taxi,
-- aprobar/suspender conductores, resolver alertas y un resumen de la Tienda.
-- ============================================================================

create or replace function public.taxi_admin_overview()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_today timestamptz := date_trunc('day', now() at time zone 'America/Lima') at time zone 'America/Lima';
  v jsonb;
begin
  if not market_is_admin() then raise exception 'TAXI:FORBIDDEN'; end if;
  select jsonb_build_object(
    'stats', jsonb_build_object(
      'online_now', (select count(*) from taxi_drivers d join taxi_driver_locations l on l.driver_id = d.id
                     where d.is_online and l.updated_at > now() - interval '2 minutes'),
      'pending_drivers', (select count(*) from taxi_drivers where status = 'pending_review'),
      'approved_drivers', (select count(*) from taxi_drivers where status = 'approved'),
      'rides_today', (select count(*) from taxi_rides where requested_at >= v_today),
      'completed_today', (select count(*) from taxi_rides where status = 'completed' and completed_at >= v_today),
      'active_now', (select count(*) from taxi_rides where status in ('accepted', 'arrived', 'in_progress')),
      'revenue_today', (select coalesce(sum(coalesce(final_fare, offered_fare)), 0) from taxi_rides
                        where status = 'completed' and completed_at >= v_today),
      'open_alerts', (select count(*) from taxi_ride_alerts where resolved_at is null)
    ),
    'drivers', (select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) from (
      select d.id, d.full_name, d.phone, d.vehicle_plate, d.vehicle_model, d.vehicle_color, d.license_number,
             d.photo_url, d.status, d.is_online, d.rating_avg, d.rating_count, d.created_at,
             u.email, l.updated_at as last_seen,
             (select count(*) from taxi_rides r where r.driver_id = d.id and r.status = 'completed') as rides_done
      from taxi_drivers d
      left join auth.users u on u.id = d.id
      left join taxi_driver_locations l on l.driver_id = d.id
    ) x),
    'rides', (select coalesce(jsonb_agg(x order by x.requested_at desc), '[]'::jsonb) from (
      select r.id, r.status, r.pickup_address, r.dropoff_address, r.distance_km,
             r.recommended_fare, r.offered_fare, r.final_fare, r.boarding_method, r.boarding_confidence,
             r.cancelled_by, r.cancel_reason, r.requested_at, r.accepted_at, r.completed_at, r.cancelled_at,
             p.name as passenger_name, d.full_name as driver_name, d.vehicle_plate
      from taxi_rides r
      left join profiles p on p.id = r.passenger_id
      left join taxi_drivers d on d.id = r.driver_id
      order by r.requested_at desc
      limit 60
    ) x),
    'alerts', (select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) from (
      select a.id, a.ride_id, a.kind, a.data, a.created_at, a.resolved_at,
             p.name as raised_by_name, r.status as ride_status, r.pickup_address, r.dropoff_address,
             d.full_name as driver_name, d.vehicle_plate, d.phone as driver_phone
      from taxi_ride_alerts a
      left join profiles p on p.id = a.raised_by
      left join taxi_rides r on r.id = a.ride_id
      left join taxi_drivers d on d.id = r.driver_id
      order by a.created_at desc
      limit 60
    ) x)
  ) into v;
  return v;
end $$;

create or replace function public.taxi_admin_set_driver_status(p_driver uuid, p_status text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not market_is_admin() then raise exception 'TAXI:FORBIDDEN'; end if;
  update taxi_drivers set
    status = p_status::taxi_driver_status,
    is_online = case when p_status = 'approved' then is_online else false end
  where id = p_driver;
  if not found then raise exception 'TAXI:NOT_FOUND'; end if;
end $$;

create or replace function public.taxi_admin_resolve_alert(p_alert bigint)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not market_is_admin() then raise exception 'TAXI:FORBIDDEN'; end if;
  update taxi_ride_alerts set resolved_at = coalesce(resolved_at, now()) where id = p_alert;
end $$;

-- Tienda: vendedores con su correo y conteos (el correo no es visible por RLS).
create or replace function public.market_admin_sellers()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not market_is_admin() then raise exception 'MARKET:FORBIDDEN'; end if;
  return (select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) from (
    select s.*, u.email,
           (select count(*) from market_products p where p.seller_id = s.id and p.status = 'published') as published,
           (select count(*) from market_products p where p.seller_id = s.id and p.status = 'pending_review') as pending
    from market_sellers s
    left join auth.users u on u.id = s.id
  ) x);
end $$;

revoke all on function public.taxi_admin_overview() from public, anon;
revoke all on function public.taxi_admin_set_driver_status(uuid, text) from public, anon;
revoke all on function public.taxi_admin_resolve_alert(bigint) from public, anon;
revoke all on function public.market_admin_sellers() from public, anon;
grant execute on function public.taxi_admin_overview() to authenticated;
grant execute on function public.taxi_admin_set_driver_status(uuid, text) to authenticated;
grant execute on function public.taxi_admin_resolve_alert(bigint) to authenticated;
grant execute on function public.market_admin_sellers() to authenticated;
