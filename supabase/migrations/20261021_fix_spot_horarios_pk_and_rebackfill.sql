-- =============================================================================
-- Burrito · Fix: spot_horarios perdía tramos más largos con la misma hora de
-- apertura
--
-- El PK (spot_id, dia_semana, abre) no incluía `cierra`. Varios spots tienen
-- el mismo día escrito dos veces con distinta ortografía ("wed" 8:00-21:00 y
-- "Miércoles" 8:00-22:00, por ejemplo) — ambos abren a las 8:00, así que el
-- "on conflict (spot_id, dia_semana, abre) do nothing" del backfill original
-- descartaba en silencio el segundo tramo (el más largo), quedándose con el
-- que llegaba primero en el orden de jsonb_each_text, no con el más largo.
--
-- Esto ensancha el PK para que quepan ambos tramos — itin_candidates ya elige
-- el más largo al leer ("order by (cierra - abre) desc"), así que no hace
-- falta tocar esa función — y vuelve a correr el backfill para recuperar los
-- tramos que se habían perdido.
-- =============================================================================

alter table public.spot_horarios drop constraint if exists spot_horarios_pkey;
alter table public.spot_horarios add primary key (spot_id, dia_semana, abre, cierra);

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
        on conflict (spot_id, dia_semana, abre, cierra) do nothing;
      end loop;
    end loop;
  end loop;
end $$;
