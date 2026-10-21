// =============================================================================
// Burrito · Optimizador de itinerarios (Orienteering Problem with Time Windows)
//
// TypeScript puro, sin dependencias: corre igual en Deno (Edge Function) y en
// Node (tests). La Edge Function le pasa los candidatos y una matriz de tiempos.
//
// Heurística:
//   1. Puntuar cada spot (intereses, rating) → "beneficio".
//   2. Inserción greedy: en cada paso se inserta el spot/posición con mejor
//      beneficio² / minutos agregados, respetando horarios y presupuesto de tiempo.
//   3. 2-opt sobre el orden para recortar traslados y, con el tiempo liberado,
//      se vuelve a intentar insertar. Se repite hasta que no mejora.
//
// Reglas de Piura:
//   - Calor de mediodía (12:00–15:00): un spot al aire libre visitado en esa
//     franja vale 40% de su beneficio, así el algoritmo prefiere moverlo o
//     reemplazarlo por uno techado.
//   - Almuerzo: si el día cruza 12:30–14:30, un spot de comida con llegada en
//     12:00–14:30 recibe un bono fuerte. Máximo 1 parada de comida (2 si el
//     usuario eligió gastronomía).
// =============================================================================

export type Mode = "a_pie" | "auto";

export interface Spot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;          // categorías reales de Burrito: playa, sierra, mercados, gastronomia, relax, aventura, cultura
  rating: number | null;     // 0–5
  visitMin: number;          // duración típica de la visita
  openMin: number | null;    // minuto del día en que abre (null = sin horario)
  closeMin: number | null;   // minuto del día en que cierra
  middayOk: boolean;         // techado o tolerable con el calor del mediodía
  isFood: boolean;
}

export interface Request {
  lat: number;
  lng: number;
  startMin: number;          // minuto del día de inicio
  availableMin: number;
  mode: Mode;
  interests: string[];
  returnToStart: boolean;
}

/** travel[i][j] en minutos. Índice 0 = punto de inicio; i ≥ 1 = spots[i-1]. */
export type TravelMatrix = number[][];

export interface Stop {
  spot: Spot;
  arriveMin: number;
  departMin: number;
  waitMin: number;
  travelFromPrevMin: number;
}

export interface Plan {
  stops: Stop[];
  totalMin: number;          // de la salida al fin (incluye regreso si aplica)
  endMin: number;
  travelMin: number;
  returnTravelMin: number;
  discardedByHours: number;  // candidatos imposibles por horario en la ventana del usuario
  score: number;
}

export const MIDDAY = { from: 12 * 60, to: 15 * 60, factor: 0.4 };
export const LUNCH = { from: 12 * 60, to: 14 * 60 + 30, mustCover: [12 * 60 + 30, 14 * 60 + 30] as const, bonus: 2.0 };

// ---------------------------------------------------------------------------
// Distancias y matriz de respaldo (si no hay OSRM)
// ---------------------------------------------------------------------------

export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(a)));
}

const SPEED = {
  a_pie: { kmh: 4.0, detour: 1.3, overheadMin: 0 },   // caminando con calor
  auto: { kmh: 22, detour: 1.4, overheadMin: 3 },     // tráfico urbano + estacionar
};

/** Matriz estimada: línea recta × factor de desvío / velocidad media. */
export function estimateMatrix(start: { lat: number; lng: number }, spots: Spot[], mode: Mode): TravelMatrix {
  const pts = [start, ...spots];
  const s = SPEED[mode];
  return pts.map((a, i) =>
    pts.map((b, j) => {
      if (i === j) return 0;
      const km = (haversineM(a.lat, a.lng, b.lat, b.lng) / 1000) * s.detour;
      return Math.max(1, Math.round((km / s.kmh) * 60 + s.overheadMin));
    })
  );
}

// ---------------------------------------------------------------------------
// Puntuación
// ---------------------------------------------------------------------------

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function baseScore(spot: Spot, interests: string[]): number {
  const wanted = interests.map(norm);
  const match = wanted.length === 0 ? 0.5 : wanted.includes(norm(spot.category)) ? 1 : 0;
  const rating = spot.rating == null ? 0.6 : Math.max(0, Math.min(5, spot.rating)) / 5;
  return 0.4 + 1.2 * match + 0.6 * rating;
}

function overlaps(a0: number, a1: number, b0: number, b1: number) {
  return a0 < b1 && b0 < a1;
}

/** Beneficio efectivo según a qué hora se visita. */
function effectiveScore(spot: Spot, base: number, arrive: number, depart: number, lunchActive: boolean): number {
  let v = base;
  if (!spot.middayOk && overlaps(arrive, depart, MIDDAY.from, MIDDAY.to)) v *= MIDDAY.factor;
  if (spot.isFood && lunchActive && arrive >= LUNCH.from && arrive <= LUNCH.to) v += LUNCH.bonus;
  return v;
}

// ---------------------------------------------------------------------------
// Simulación de una ruta (orden de índices de spots, 1-based en la matriz)
// ---------------------------------------------------------------------------

interface Sim {
  ok: boolean;
  stops: { idx: number; arrive: number; depart: number; wait: number; travel: number }[];
  end: number;
  travel: number;
  returnTravel: number;
  score: number;
}

function simulate(order: number[], ctx: Ctx): Sim {
  const { req, spots, m, base, lunchActive } = ctx;
  let t = req.startMin;
  let prev = 0;
  let travel = 0;
  let score = 0;
  const stops: Sim["stops"] = [];
  for (const idx of order) {
    const sp = spots[idx - 1];
    const tr = m[prev][idx];
    t += tr;
    travel += tr;
    let wait = 0;
    if (sp.openMin != null && t < sp.openMin) {
      wait = sp.openMin - t;
      t = sp.openMin;
    }
    const arrive = t;
    const depart = t + sp.visitMin;
    if (sp.closeMin != null && depart > sp.closeMin) return { ok: false, stops, end: t, travel, returnTravel: 0, score };
    score += effectiveScore(sp, base[idx - 1], arrive, depart, lunchActive);
    stops.push({ idx, arrive, depart, wait, travel: tr });
    t = depart;
    prev = idx;
  }
  const returnTravel = req.returnToStart && order.length > 0 ? m[prev][0] : 0;
  t += returnTravel;
  const ok = t - req.startMin <= req.availableMin;
  return { ok, stops, end: t, travel: travel + returnTravel, returnTravel, score };
}

interface Ctx {
  req: Request;
  spots: Spot[];
  m: TravelMatrix;
  base: number[];
  lunchActive: boolean;
  maxFood: number;
}

const foodCount = (order: number[], spots: Spot[]) => order.filter((i) => spots[i - 1].isFood).length;

// ---------------------------------------------------------------------------
// Inserción greedy
// ---------------------------------------------------------------------------

function insertGreedy(order: number[], ctx: Ctx): number[] {
  const route = [...order];
  for (;;) {
    const cur = simulate(route, ctx);
    const curDuration = cur.end - ctx.req.startMin;
    let best: { idx: number; pos: number; ratio: number } | null = null;
    const food = foodCount(route, ctx.spots);

    for (let idx = 1; idx <= ctx.spots.length; idx++) {
      if (route.includes(idx)) continue;
      if (ctx.spots[idx - 1].isFood && food >= ctx.maxFood) continue;
      for (let pos = 0; pos <= route.length; pos++) {
        const cand = [...route.slice(0, pos), idx, ...route.slice(pos)];
        const sim = simulate(cand, ctx);
        if (!sim.ok) continue;
        const gain = sim.score - cur.score;
        if (gain <= 0) continue;
        const added = Math.max(1, sim.end - ctx.req.startMin - curDuration);
        const ratio = (gain * gain) / added;
        // desempate determinista por id
        if (!best || ratio > best.ratio + 1e-9 ||
            (Math.abs(ratio - best.ratio) <= 1e-9 && ctx.spots[idx - 1].id < ctx.spots[best.idx - 1].id)) {
          best = { idx, pos, ratio };
        }
      }
    }
    if (!best) return route;
    route.splice(best.pos, 0, best.idx);
  }
}

// ---------------------------------------------------------------------------
// 2-opt: invierte tramos si reduce el tiempo total sin perder beneficio
// ---------------------------------------------------------------------------

function twoOpt(order: number[], ctx: Ctx): number[] {
  let route = [...order];
  let improved = true;
  while (improved) {
    improved = false;
    const cur = simulate(route, ctx);
    for (let i = 0; i < route.length - 1 && !improved; i++) {
      for (let k = i + 1; k < route.length && !improved; k++) {
        const cand = [...route.slice(0, i), ...route.slice(i, k + 1).reverse(), ...route.slice(k + 1)];
        const sim = simulate(cand, ctx);
        if (sim.ok && sim.end < cur.end && sim.score >= cur.score - 1e-9) {
          route = cand;
          improved = true;
        }
      }
    }
  }
  return route;
}

// ---------------------------------------------------------------------------
// API principal
// ---------------------------------------------------------------------------

export function planItinerary(req: Request, spots: Spot[], matrix?: TravelMatrix): Plan {
  const m = matrix ?? estimateMatrix(req, spots, req.mode);
  const windowEnd = req.startMin + req.availableMin;
  const lunchActive = req.startMin <= LUNCH.mustCover[0] && windowEnd >= LUNCH.mustCover[1];
  const wantsFood = req.interests.map(norm).includes("gastronomia");
  const ctx: Ctx = {
    req, spots, m,
    base: spots.map((s) => baseScore(s, req.interests)),
    lunchActive,
    maxFood: wantsFood ? 2 : 1,
  };

  // Imposibles por horario: no hay forma de hacer la visita completa dentro de la ventana.
  const discardedByHours = spots.filter((s) => {
    const open = Math.max(s.openMin ?? 0, req.startMin);
    const close = Math.min(s.closeMin ?? 24 * 60, windowEnd);
    return close - open < s.visitMin;
  }).length;

  let route = insertGreedy([], ctx);
  for (let round = 0; round < 5; round++) {
    const before = route.join(",");
    route = insertGreedy(twoOpt(route, ctx), ctx);
    if (route.join(",") === before) break;
  }

  const sim = simulate(route, ctx);
  return {
    stops: sim.stops.map((s) => ({
      spot: spots[s.idx - 1],
      arriveMin: s.arrive,
      departMin: s.depart,
      waitMin: s.wait,
      travelFromPrevMin: s.travel,
    })),
    totalMin: route.length ? sim.end - req.startMin : 0,
    endMin: sim.end,
    travelMin: sim.travel,
    returnTravelMin: sim.returnTravel,
    discardedByHours,
    score: Math.round(sim.score * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Utilidades de hora
// ---------------------------------------------------------------------------

export function parseHHMM(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) throw new Error(`Hora inválida: ${s}`);
  const h = Number(m[1]), min = Number(m[2]);
  if (h > 23 || min > 59) throw new Error(`Hora inválida: ${s}`);
  return h * 60 + min;
}

export function toHHMM(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
