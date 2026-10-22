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

/** Hasta dónde se busca otra calle para llegar (un pin puede caer sobre la calzada equivocada). */
const SNAP_RADIUS_M = 60;
/** Velocidad a pie para comparar "llegar en auto a otra calle + caminar hasta el pin". */
const WALK_MPS = 1.4;

/**
 * Punto de llegada más conveniente cerca de `to`. Si el pin cae encima de una
 * calzada de un solo sentido, OSRM lo pega ahí y da una vuelta enorme para
 * entrar en su sentido (p. ej. Av. Sullana Oeste junto al Óvalo Grau: 2.5 km
 * en vez de 1.1 km). Se prueban las calles vecinas (máx. 60 m) con una sola
 * consulta de tiempos y se elige la de menor "manejo + caminata hasta el pin".
 * Si algo falla, se usa el punto tal cual.
 */
async function bestArrival(base: string, from: P, to: P): Promise<P> {
  try {
    const near = await fetch(`${base}/nearest/v1/driving/${to.lng},${to.lat}?number=6`, { signal: AbortSignal.timeout(3000) });
    if (!near.ok) return to;
    const n = await near.json() as { waypoints?: { location: [number, number]; distance: number; name: string }[] };
    const seen = new Set<string>();
    const cands = (n.waypoints ?? [])
      .filter(w => w.distance <= SNAP_RADIUS_M)
      .filter(w => {
        const key = `${w.name}|${w.location[0].toFixed(4)},${w.location[1].toFixed(4)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 4);
    if (cands.length <= 1) return to;

    const coords = [[from.lng, from.lat], ...cands.map(w => w.location)].map(c => c.join(",")).join(";");
    const table = await fetch(`${base}/table/v1/driving/${coords}?sources=0&annotations=duration`, { signal: AbortSignal.timeout(3000) });
    if (!table.ok) return to;
    const t = await table.json() as { durations?: (number | null)[][] };
    const row = t.durations?.[0];
    if (!row) return to;
    let best = -1;
    let bestCost = Infinity;
    cands.forEach((w, i) => {
      const drive = row[i + 1];
      if (drive == null) return;
      const cost = drive + w.distance / WALK_MPS;
      if (cost < bestCost) { bestCost = cost; best = i; }
    });
    return best < 0 ? to : { lat: cands[best].location[1], lng: cands[best].location[0] };
  } catch {
    return to;
  }
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
  const arrival = await bestArrival(base, from, to);
  const url = `${base}/route/v1/driving/${from.lng},${from.lat};${arrival.lng},${arrival.lat}?overview=full&geometries=geojson`;

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
