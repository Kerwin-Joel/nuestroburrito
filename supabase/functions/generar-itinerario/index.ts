// =============================================================================
// Edge Function: generar-itinerario
//
// POST /functions/v1/generar-itinerario
// {
//   "lat": -5.1945, "lng": -80.6328,
//   "hora_inicio": "09:00", "minutos_disponibles": 240,
//   "modo": "a_pie" | "auto",
//   "intereses": ["cultura", "gastronomia"],
//   "volver_al_inicio": false,
//   "fecha": "2026-10-21"            // opcional; por defecto hoy en Lima
// }
//
// Secrets opcionales (supabase secrets set …):
//   GEMINI_API_KEY   → narrativa en tono piurano (si falta, narrativa = null)
//   GEMINI_MODEL     → por defecto gemini-2.5-flash
//   OSRM_URL         → servidor OSRM propio para tiempos reales en auto
// =============================================================================
import { createClient } from "npm:@supabase/supabase-js@2";
import { estimateMatrix, type Mode, parseHHMM, type Plan, planItinerary, type Spot, toHHMM, type TravelMatrix } from "./optimizer.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RADIUS_M: Record<Mode, number> = { a_pie: 2500, auto: 25000 };
const MAX_CANDIDATES = 40;

interface Body {
  lat: number;
  lng: number;
  hora_inicio: string;
  minutos_disponibles: number;
  modo: Mode;
  intereses: string[];
  volver_al_inicio: boolean;
  fecha?: string;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function validate(raw: unknown): Body {
  const b = raw as Partial<Body>;
  const fail = (m: string): never => { throw new Error(m); };
  if (typeof b?.lat !== "number" || b.lat < -90 || b.lat > 90) fail("lat inválida");
  if (typeof b?.lng !== "number" || b.lng < -180 || b.lng > 180) fail("lng inválida");
  if (typeof b?.hora_inicio !== "string") fail("hora_inicio requerida (HH:mm)");
  parseHHMM(b!.hora_inicio!);
  if (typeof b?.minutos_disponibles !== "number" || b.minutos_disponibles < 30 || b.minutos_disponibles > 720) {
    fail("minutos_disponibles debe estar entre 30 y 720");
  }
  if (b?.modo !== "a_pie" && b?.modo !== "auto") fail("modo debe ser a_pie o auto");
  const intereses = Array.isArray(b?.intereses) ? b!.intereses!.filter((x) => typeof x === "string").slice(0, 10) : [];
  if (b?.fecha != null && !/^\d{4}-\d{2}-\d{2}$/.test(b.fecha)) fail("fecha debe ser YYYY-MM-DD");
  return { ...(b as Body), intereses, volver_al_inicio: b?.volver_al_inicio === true };
}

/** Día de la semana (0 = domingo) en hora de Lima. */
function dayOfWeek(fecha?: string): number {
  if (fecha) return new Date(`${fecha}T12:00:00-05:00`).getUTCDay();
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", weekday: "short" }).format(new Date());
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}

/** Tiempos reales en auto con OSRM (si está configurado); si falla, estimación. */
async function travelMatrix(start: { lat: number; lng: number }, spots: Spot[], mode: Mode): Promise<TravelMatrix> {
  const estimate = estimateMatrix(start, spots, mode);
  const osrm = Deno.env.get("OSRM_URL");
  if (!osrm || mode !== "auto" || spots.length === 0) return estimate;
  try {
    const coords = [start, ...spots].map((p) => `${p.lng},${p.lat}`).join(";");
    const res = await fetch(`${osrm.replace(/\/$/, "")}/table/v1/driving/${coords}?annotations=duration`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return estimate;
    const data = await res.json() as { durations?: (number | null)[][] };
    if (!data.durations) return estimate;
    return data.durations.map((row, i) =>
      row.map((sec, j) => (i === j ? 0 : sec == null ? estimate[i][j] : Math.max(1, Math.round(sec / 60) + 3)))
    );
  } catch {
    return estimate;
  }
}

/** Gemini SOLO narra la ruta ya calculada. Nunca cambia orden ni horas. */
async function narrate(plan: Plan, body: Body): Promise<string | null> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key || plan.stops.length === 0) return null;
  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
  const lines = plan.stops.map((s, i) =>
    `${i + 1}. ${toHHMM(s.arriveMin)}–${toHHMM(s.departMin)} ${s.spot.name} (${s.spot.category}), ` +
    `${s.travelFromPrevMin} min ${body.modo === "a_pie" ? "caminando" : "en auto"} desde el punto anterior`
  ).join("\n");
  const prompt = [
    "Eres Burrito, guía local de Piura, Perú. Escribe una narrativa breve (máx. 120 palabras), cálida y con toques piuranos, para este itinerario.",
    "Reglas: respeta EXACTAMENTE el orden y las horas; no agregues lugares, precios ni datos que no estén en la lista; no inventes distancias.",
    "Si hay parada de comida, invítalo a probar algo típico sin nombrar platos específicos del local.",
    `Itinerario (${body.modo === "a_pie" ? "a pie" : "en auto"}):`,
    lines,
  ].join("\n");
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("").trim();
    return text || null;
  } catch {
    return null;   // la narrativa nunca bloquea el itinerario
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Usa POST" });

  let body: Body;
  try {
    body = validate(await req.json());
  } catch (e) {
    return json(400, { error: (e as Error).message });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data: rows, error } = await admin.rpc("itin_candidates", {
    p_lat: body.lat,
    p_lng: body.lng,
    p_radius_m: RADIUS_M[body.modo],
    p_dow: dayOfWeek(body.fecha),
    p_limit: MAX_CANDIDATES,
  });
  if (error) return json(500, { error: "No se pudieron leer los spots", detalle: error.message });

  const spots: Spot[] = (rows ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    name: String(r.name),
    lat: Number(r.lat),
    lng: Number(r.lng),
    category: String(r.category ?? "otros"),
    rating: r.rating == null ? null : Number(r.rating),
    visitMin: Number(r.visit_min ?? 45),
    openMin: r.open_min == null ? null : Number(r.open_min),
    closeMin: r.close_min == null ? null : Number(r.close_min),
    middayOk: r.midday_ok !== false,
    isFood: r.is_food === true,
  }));

  const start = { lat: body.lat, lng: body.lng };
  const matrix = await travelMatrix(start, spots, body.modo);
  const plan = planItinerary({
    ...start,
    startMin: parseHHMM(body.hora_inicio),
    availableMin: body.minutos_disponibles,
    mode: body.modo,
    interests: body.intereses,
    returnToStart: body.volver_al_inicio,
  }, spots, matrix);

  const narrativa = await narrate(plan, body);

  // Descripción y tip del spot — aparte de itin_candidates para no tocar su
  // forma (los usa también el optimizador, que no necesita estos campos).
  const notes = new Map<string, { description: string | null; local_tip: string | null }>();
  if (plan.stops.length > 0) {
    const { data: notesRows } = await admin.rpc("itin_spot_notes", {
      p_ids: plan.stops.map((s) => s.spot.id),
    });
    for (const n of notesRows ?? []) notes.set(n.id, { description: n.description, local_tip: n.local_tip });
  }

  const resultado = {
    itinerario: plan.stops.map((s) => ({
      spot_id: s.spot.id,
      nombre: s.spot.name,
      lat: s.spot.lat,
      lng: s.spot.lng,
      categoria: s.spot.category,
      es_comida: s.spot.isFood,
      descripcion: notes.get(s.spot.id)?.description ?? null,
      tip: notes.get(s.spot.id)?.local_tip ?? null,
      llegada: toHHMM(s.arriveMin),
      salida: toHHMM(s.departMin),
      minutos_viaje_desde_anterior: s.travelFromPrevMin,
      minutos_espera: s.waitMin,
    })),
    minutos_totales: plan.totalMin,
    minutos_regreso: plan.returnTravelMin,
    narrativa,
    descartados_por_horario: plan.discardedByHours,
    tiempos: Deno.env.get("OSRM_URL") && body.modo === "auto" ? "osrm" : "estimados",
  };

  // Guardar en el historial si el usuario está autenticado.
  let id: string | null = null;
  const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (jwt) {
    const { data: u } = await admin.auth.getUser(jwt);
    if (u?.user) {
      const { data: saved } = await admin.from("ai_itinerary_runs")
        .insert({ user_id: u.user.id, solicitud: body, resultado })
        .select("id").single();
      id = saved?.id ?? null;
    }
  }

  return json(200, { id, ...resultado });
});
