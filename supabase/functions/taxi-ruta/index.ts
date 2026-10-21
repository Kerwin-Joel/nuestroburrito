// =============================================================================
// Edge Function: taxi-ruta
//
// POST { "from": { "lat", "lng" }, "to": { "lat", "lng" } }
// →    { "distance_km", "duration_min", "points": [[lat, lng], ...] }
//
// Ruta real por calles (OSRM) para dibujar en el mapa y para cotizar con los
// km reales. Por defecto usa el servidor público de OSRM; con el secret
// OSRM_URL se apunta a uno propio sin publicar otra versión de la app.
// =============================================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

interface P { lat: number; lng: number }

const valid = (p: unknown): p is P => {
  const q = p as P;
  return typeof q?.lat === "number" && typeof q?.lng === "number" &&
    q.lat >= -90 && q.lat <= 90 && q.lng >= -180 && q.lng <= 180;
};

/** Reduce la polilínea a ~300 puntos: suficiente para dibujar, liviano para el móvil. */
function thin(points: [number, number][], max = 300): [number, number][] {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  const out: [number, number][] = [];
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)]);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Usa POST" });

  let body: { from?: unknown; to?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "JSON inválido" });
  }
  if (!valid(body.from) || !valid(body.to)) return json(400, { error: "from/to inválidos" });
  const { from, to } = body as { from: P; to: P };

  const base = (Deno.env.get("OSRM_URL") ?? "https://router.project-osrm.org").replace(/\/$/, "");
  const url = `${base}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return json(502, { error: "Servicio de rutas no disponible" });
    const data = await res.json() as {
      code?: string;
      routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
    };
    const route = data.routes?.[0];
    if (data.code !== "Ok" || !route) return json(404, { error: "No hay ruta entre esos puntos" });

    return json(200, {
      distance_km: Math.round(route.distance / 10) / 100,
      duration_min: Math.max(1, Math.round(route.duration / 60)),
      // OSRM devuelve [lng, lat]; la app trabaja con [lat, lng].
      points: thin(route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])),
    });
  } catch {
    return json(504, { error: "El servicio de rutas tardó demasiado" });
  }
});
