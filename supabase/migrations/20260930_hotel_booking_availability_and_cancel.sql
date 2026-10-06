-- El comprador puede cancelar (o actualizar) su propio pedido.
drop policy if exists "comprador cancela su pedido" on public.orders;
create policy "comprador cancela su pedido" on public.orders for update
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

-- Disponibilidad real: ¿esa habitación ya tiene una reserva activa que se
-- cruza con estas fechas? SECURITY DEFINER porque solo devuelve un booleano
-- (nunca datos de otros huéspedes) — así no hace falta abrir RLS de orders
-- para que cualquiera pueda consultar disponibilidad.
create or replace function public.room_is_available(p_item_id uuid, p_check_in date, p_check_out date)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.orders o,
         jsonb_array_elements(o.items) as item
    where o.status in ('pendiente_confirmacion', 'confirmado')
      and (item->>'item_id') = p_item_id::text
      and (item->>'check_in') is not null
      and (item->>'check_out') is not null
      and daterange((item->>'check_in')::date, (item->>'check_out')::date, '[)')
          && daterange(p_check_in, p_check_out, '[)')
  );
$$;

grant execute on function public.room_is_available(uuid, date, date) to anon, authenticated;
