-- ============================================================================
-- Panel del local: quién vino y cuántas veces.
--
-- El dueño ve sus clientes del pasaporte (nombre + inicial del apellido y
-- foto, nunca correo ni otros datos), cuántas veces vino cada uno, su avance
-- hacia el premio y los premios pendientes/canjeados, más un feed de las
-- últimas visitas. Sigue entrando solo con su enlace secreto.
-- ============================================================================

/** "Kerwin Joel López" → "Kerwin L." (lo mínimo para reconocer a un cliente). */
create or replace function public.loyalty_display_name(p_name text)
returns text language sql immutable set search_path = public as $$
  select case
    when coalesce(trim(p_name), '') = '' then 'Cliente'
    else initcap(split_part(trim(p_name), ' ', 1)) ||
      coalesce(' ' || upper(left(nullif(split_part(trim(p_name), ' ', 2), ''), 1)) || '.', '')
  end;
$$;

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
      'rewards_redeemed_today', (select count(*) from loyalty_rewards r where r.spot_id = s.id and r.redeemed_at >= v_today),
      'visits_total', (select count(*) from spot_visits v where v.spot_id = s.id),
      'customers_total', (select count(distinct user_id) from spot_visits v where v.spot_id = s.id),
      'customers_returning', (select count(*) from (select user_id from spot_visits v where v.spot_id = s.id group by user_id having count(*) >= 2) x),
      -- Clientes: los más recientes primero.
      'customers', coalesce((
        select jsonb_agg(c order by c->>'last_visit' desc)
        from (
          select jsonb_build_object(
            'name', loyalty_display_name(p.name),
            'avatar_url', p.avatar_url,
            'visits', count(*),
            'visits_today', count(*) filter (where v.visited_at >= v_today),
            'first_visit', min(v.visited_at),
            'last_visit', max(v.visited_at),
            'progress', loyalty_progress(v.user_id, s.id),
            'rewards_ready', (select count(*) from loyalty_rewards r where r.user_id = v.user_id and r.spot_id = s.id and r.redeemed_at is null),
            'rewards_redeemed', (select count(*) from loyalty_rewards r where r.user_id = v.user_id and r.spot_id = s.id and r.redeemed_at is not null)
          ) as c
          from spot_visits v
          left join profiles p on p.id = v.user_id
          where v.spot_id = s.id
          group by v.user_id, p.name, p.avatar_url
          order by max(v.visited_at) desc
          limit 200
        ) t), '[]'::jsonb),
      -- Últimas visitas (y canjes) en orden.
      'recent', coalesce((
        select jsonb_agg(e order by e->>'at' desc) from (
          select e from (
            select jsonb_build_object('kind', 'visit', 'at', v.visited_at, 'method', v.method, 'source', v.source,
                                      'name', loyalty_display_name(p.name), 'avatar_url', p.avatar_url) as e, v.visited_at as at
            from spot_visits v left join profiles p on p.id = v.user_id
            where v.spot_id = s.id
            union all
            select jsonb_build_object('kind', 'redeem', 'at', r.redeemed_at, 'title', r.title, 'emoji', r.emoji,
                                      'name', loyalty_display_name(p.name), 'avatar_url', p.avatar_url), r.redeemed_at
            from loyalty_rewards r left join profiles p on p.id = r.user_id
            where r.spot_id = s.id and r.redeemed_at is not null
          ) u order by at desc limit 30
        ) t), '[]'::jsonb)
    )
    from spots s where s.id = v_loyalty.spot_id);
end $$;

revoke all on function public.loyalty_display_name(text) from public, anon, authenticated;
grant execute on function public.loyalty_owner_panel(uuid) to anon, authenticated;
