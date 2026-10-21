// node --test supabase/functions/generar-itinerario/optimizer.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  type Request, type Spot, estimateMatrix, haversineM, MIDDAY, parseHHMM, planItinerary, toHHMM,
} from "./optimizer.ts";

const h = parseHHMM;
const PLAZA = { lat: -5.19449, lng: -80.63282 };

// Spots de prueba en el centro de Piura, con las categorías REALES del
// catálogo (playa, sierra, mercados, gastronomia, relax, aventura, cultura —
// no existen "naturaleza" ni "compras" en producción, ver diagnóstico Fase 1).
const SPOTS: Spot[] = [
  { id: "catedral", name: "Catedral de Piura", lat: -5.19468, lng: -80.63269, category: "cultura", rating: 4.6, visitMin: 30, openMin: h("07:00"), closeMin: h("19:00"), middayOk: true, isFood: false },
  { id: "casa-grau", name: "Casa Museo Grau", lat: -5.19698, lng: -80.63141, category: "cultura", rating: 4.7, visitMin: 45, openMin: h("08:00"), closeMin: h("17:00"), middayOk: true, isFood: false },
  { id: "vicus", name: "Museo Vicús", lat: -5.19021, lng: -80.63006, category: "cultura", rating: 4.4, visitMin: 60, openMin: h("09:00"), closeMin: h("17:00"), middayOk: true, isFood: false },
  { id: "carmen", name: "Iglesia del Carmen", lat: -5.19747, lng: -80.62992, category: "cultura", rating: 4.3, visitMin: 20, openMin: h("08:00"), closeMin: h("18:00"), middayOk: true, isFood: false },
  { id: "malecon", name: "Malecón Eguiguren", lat: -5.19817, lng: -80.62822, category: "relax", rating: 4.2, visitMin: 40, openMin: null, closeMin: null, middayOk: false, isFood: false },
  { id: "puente", name: "Puente Viejo", lat: -5.19935, lng: -80.62763, category: "relax", rating: 4.0, visitMin: 20, openMin: null, closeMin: null, middayOk: false, isFood: false },
  { id: "mercado", name: "Mercado Central", lat: -5.18980, lng: -80.62651, category: "mercados", rating: 3.9, visitMin: 45, openMin: h("06:00"), closeMin: h("15:00"), middayOk: true, isFood: false },
  { id: "picanteria", name: "Picantería La Santitos", lat: -5.19389, lng: -80.63052, category: "gastronomia", rating: 4.6, visitMin: 75, openMin: h("11:30"), closeMin: h("17:00"), middayOk: true, isFood: true },
  { id: "cevicheria", name: "Cevichería del centro", lat: -5.19253, lng: -80.63402, category: "gastronomia", rating: 4.4, visitMin: 60, openMin: h("10:00"), closeMin: h("16:00"), middayOk: true, isFood: true },
  { id: "noche", name: "Mirador nocturno", lat: -5.19600, lng: -80.62700, category: "relax", rating: 4.8, visitMin: 30, openMin: h("18:00"), closeMin: h("23:00"), middayOk: true, isFood: false },
  { id: "catacaos", name: "Catacaos artesanal", lat: -5.26614, lng: -80.67535, category: "mercados", rating: 4.8, visitMin: 120, openMin: h("09:00"), closeMin: h("18:00"), middayOk: true, isFood: false },
];

const req = (over: Partial<Request> = {}): Request => ({
  ...PLAZA, startMin: h("09:00"), availableMin: 240, mode: "a_pie", interests: [], returnToStart: false, ...over,
});

function assertFeasible(r: Request, plan: ReturnType<typeof planItinerary>) {
  assert.ok(plan.totalMin <= r.availableMin, `duración ${plan.totalMin} > ${r.availableMin}`);
  let prevDepart = r.startMin;
  for (const s of plan.stops) {
    assert.ok(s.arriveMin >= prevDepart, "llegadas en orden");
    if (s.spot.openMin != null) assert.ok(s.arriveMin >= s.spot.openMin, `${s.spot.id} antes de abrir`);
    if (s.spot.closeMin != null) assert.ok(s.departMin <= s.spot.closeMin, `${s.spot.id} después de cerrar`);
    assert.equal(s.departMin - s.arriveMin, s.spot.visitMin);
    prevDepart = s.departMin;
  }
  assert.equal(new Set(plan.stops.map((s) => s.spot.id)).size, plan.stops.length, "sin repetidos");
}

test("matriz estimada: caminar ~4 km/h con desvío urbano", () => {
  const m = estimateMatrix(PLAZA, SPOTS, "a_pie");
  const km = haversineM(PLAZA.lat, PLAZA.lng, SPOTS[1].lat, SPOTS[1].lng) / 1000;
  assert.ok(Math.abs(m[0][2] - Math.round((km * 1.3) / 4 * 60)) <= 1);
  assert.equal(m[3][3], 0);
});

test("mañana de 4 h a pie: factible, respeta horarios y presupuesto", () => {
  const r = req();
  const plan = planItinerary(r, SPOTS);
  assertFeasible(r, plan);
  assert.ok(plan.stops.length >= 3, `solo ${plan.stops.length} paradas`);
  assert.ok(!plan.stops.some((s) => s.spot.id === "noche"), "el mirador abre de noche");
  assert.ok(!plan.stops.some((s) => s.spot.id === "catacaos"), "Catacaos no cabe a pie en 4 h");
});

test("intereses: cambian qué spots entran", () => {
  const r = req({ startMin: h("15:00"), availableMin: 150 });
  const ids = (interests: string[]) => planItinerary({ ...r, interests }, SPOTS).stops.map((s) => s.spot);
  const cultura = ids(["cultura"]), relax = ids(["relax"]);
  const count = (xs: Spot[], c: string) => xs.filter((s) => s.category === c).length;
  assert.ok(count(cultura, "cultura") > count(relax, "cultura"), cultura.map((s) => s.id).join(","));
  assert.ok(count(relax, "relax") > count(cultura, "relax"), relax.map((s) => s.id).join(","));
});

test("día que cruza el almuerzo: una parada de comida entre 12:00 y 14:30", () => {
  const r = req({ startMin: h("10:00"), availableMin: 360 });
  const plan = planItinerary(r, SPOTS);
  assertFeasible(r, plan);
  const food = plan.stops.filter((s) => s.spot.isFood);
  assert.equal(food.length, 1, plan.stops.map((s) => `${s.spot.id}@${toHHMM(s.arriveMin)}`).join(" "));
  assert.ok(food[0].arriveMin >= h("12:00") && food[0].arriveMin <= h("14:30"), toHHMM(food[0].arriveMin));
});

test("gastronomía permite hasta 2 paradas de comida", () => {
  const plan = planItinerary(req({ startMin: h("10:00"), availableMin: 420, interests: ["gastronomia"] }), SPOTS);
  assert.ok(plan.stops.filter((s) => s.spot.isFood).length <= 2);
});

test("calor de mediodía: los spots al aire libre quedan fuera de 12:00–15:00", () => {
  const r = req({ startMin: h("10:00"), availableMin: 420 });
  const plan = planItinerary(r, SPOTS);
  for (const s of plan.stops.filter((x) => !x.spot.middayOk)) {
    const inHeat = s.arriveMin < MIDDAY.to && s.departMin > MIDDAY.from;
    assert.ok(!inHeat, `${s.spot.id} a las ${toHHMM(s.arriveMin)}`);
  }
});

test("volver al inicio: el regreso cuenta en el presupuesto", () => {
  const r = req({ availableMin: 150, returnToStart: true });
  const plan = planItinerary(r, SPOTS);
  assertFeasible(r, plan);
  assert.ok(plan.returnTravelMin > 0);
  assert.equal(plan.totalMin, plan.endMin - r.startMin);
});

test("en auto sí llega a Catacaos si interesa mercados y hay tiempo", () => {
  const r = req({ mode: "auto", availableMin: 360, interests: ["mercados"] });
  const plan = planItinerary(r, SPOTS);
  assertFeasible(r, plan);
  assert.ok(plan.stops.some((s) => s.spot.id === "catacaos"), plan.stops.map((s) => s.spot.id).join(","));
});

test("el orden final no tiene cruces que 2-opt pueda mejorar", () => {
  const r = req({ availableMin: 300 });
  const plan = planItinerary(r, SPOTS);
  const m = estimateMatrix(r, SPOTS, r.mode);
  const idx = plan.stops.map((s) => SPOTS.indexOf(s.spot) + 1);
  const cost = (o: number[]) => o.reduce((acc, v, i) => acc + m[i === 0 ? 0 : o[i - 1]][v], 0);
  const base = cost(idx);
  for (let i = 0; i < idx.length - 1; i++) {
    for (let k = i + 1; k < idx.length; k++) {
      const alt = [...idx.slice(0, i), ...idx.slice(i, k + 1).reverse(), ...idx.slice(k + 1)];
      // Una inversión puede ser más corta solo si rompe un horario: verificamos que no sea más corta y válida.
      if (cost(alt) < base) {
        let t = r.startMin, prev = 0, ok = true;
        for (const v of alt) {
          const sp = SPOTS[v - 1];
          t += m[prev][v];
          if (sp.openMin != null && t < sp.openMin) t = sp.openMin;
          if (sp.closeMin != null && t + sp.visitMin > sp.closeMin) ok = false;
          t += sp.visitMin; prev = v;
        }
        const heatSensitive = alt.some((v) => !SPOTS[v - 1].middayOk);
        assert.ok(!ok || heatSensitive, `2-opt pendiente: ${alt.join(",")} (${cost(alt)} < ${base})`);
      }
    }
  }
});

test("determinista y descartados por horario", () => {
  const r = req({ startMin: h("09:00"), availableMin: 180 });
  const a = planItinerary(r, SPOTS), b = planItinerary(r, SPOTS);
  assert.deepEqual(a.stops.map((s) => s.spot.id), b.stops.map((s) => s.spot.id));
  assert.equal(a.discardedByHours, 2); // mirador nocturno y picantería (abre 11:30, no caben 75 min antes de 12:00)
});

test("sin candidatos o sin tiempo devuelve itinerario vacío", () => {
  assert.equal(planItinerary(req(), []).stops.length, 0);
  assert.equal(planItinerary(req({ availableMin: 10 }), SPOTS).stops.length, 0);
});

test("horas HH:mm", () => {
  assert.equal(parseHHMM("09:05"), 545);
  assert.equal(toHHMM(545), "09:05");
  assert.throws(() => parseHHMM("25:00"));
});
