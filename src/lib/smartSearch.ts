/**
 * Buscador "inteligente" para listas de spots — espejo de passport/SmartSearch.kt.
 *
 * • Sin tildes ni mayúsculas: "cafeteria mania" encuentra "Cafetería Manía 8".
 * • Tolera errores de tipeo (1 letra en palabras de 4+ letras): "cevicheria" ≈ "cebicheria".
 * • Entiende intenciones: "comida", "almuerzo" → gastronomía; "café", "postre" →
 *   relax; "regalo", "premio" → spots con premio; etc.
 * • Todas las palabras tienen que calzar en algo (nombre, categoría, dirección,
 *   premio); el resultado se ordena por relevancia (el nombre pesa más).
 */

export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim()

/** Palabra de búsqueda → categorías o etiquetas que también calzan. */
const INTENTS: Record<string, string[]> = {
  comida: ['gastronomia'], comer: ['gastronomia'], restaurante: ['gastronomia'], restaurant: ['gastronomia'],
  almuerzo: ['gastronomia'], almorzar: ['gastronomia'], cena: ['gastronomia'], cenar: ['gastronomia'],
  ceviche: ['gastronomia'], cebiche: ['gastronomia'], picanteria: ['gastronomia'], chifa: ['gastronomia'],
  pollo: ['gastronomia'], parrilla: ['gastronomia'], marisco: ['gastronomia'], mariscos: ['gastronomia'],
  cafe: ['relax'], cafeteria: ['relax'], cafeterias: ['relax'], postre: ['relax', 'gastronomia'],
  postres: ['relax', 'gastronomia'], dulce: ['relax', 'gastronomia'], helado: ['relax', 'gastronomia'],
  bar: ['relax'], trago: ['relax'], tragos: ['relax'], cerveza: ['relax'], noche: ['relax'], juegos: ['relax'],
  relajo: ['relax'], descanso: ['relax'], spa: ['relax'],
  playa: ['playa'], mar: ['playa'], surf: ['playa'], sol: ['playa'], arena: ['playa'], olas: ['playa'],
  museo: ['cultura'], iglesia: ['cultura'], historia: ['cultura'], arte: ['cultura'], catedral: ['cultura'],
  plaza: ['cultura'], cultura: ['cultura'], cultural: ['cultura'],
  mercado: ['mercados'], compras: ['mercados'], artesania: ['mercados'], artesanias: ['mercados'], tienda: ['mercados'],
  aventura: ['aventura'], deporte: ['aventura'], deportes: ['aventura'], tubing: ['aventura'], kayak: ['aventura'],
  sierra: ['sierra'], montana: ['sierra'], campo: ['sierra'], cerro: ['sierra'],
  hotel: ['hoteles'], hospedaje: ['hoteles'], dormir: ['hoteles'], hostal: ['hoteles'],
  premio: ['@premio'], premios: ['@premio'], regalo: ['@premio'], regalos: ['@premio'], gratis: ['@premio'],
  descuento: ['@premio'], promo: ['@premio'],
}

const CATEGORY_WORDS: Record<string, string> = {
  playa: 'playa playas', gastronomia: 'gastronomia comida restaurante', cultura: 'cultura cultural',
  sierra: 'sierra', aventura: 'aventura', mercados: 'mercados mercado', relax: 'relax', hoteles: 'hoteles hotel',
}

/** Distancia de edición (Levenshtein) con corte temprano. */
function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      best = Math.min(best, cur[j])
    }
    if (best > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

/** Calce exacto o por prefijo / contenido (0 = no calza). */
function strictScore(token: string, text: string): number {
  if (!text) return 0
  const words = text.split(' ')
  if (words.some(w => w === token)) return 3
  if (words.some(w => w.startsWith(token))) return 2.4
  if (text.includes(token)) return 1.6
  return 0
}

/** Dos letras vecinas intercambiadas ("alra" ↔ "arla"). */
function isSwap(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const diff = [...a].map((c, i) => (c === b[i] ? -1 : i)).filter(i => i >= 0)
  return diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]]
}

/** Calce aproximado (errores de tipeo), solo como respaldo. */
function fuzzyScore(token: string, text: string): number {
  if (!text || token.length < 4) return 0
  const words = text.split(' ').filter(w => w.length >= token.length - 1)
  if (token.length === 4) return words.some(w => isSwap(token, w.slice(0, 4))) ? 1.1 : 0
  const tol = token.length >= 7 ? 2 : 1
  // Contra el inicio de cada palabra del mismo largo: tolera el error mientras se escribe.
  return words.some(w => distance(token, w.slice(0, token.length), tol) <= tol) ? 1.1 : 0
}

export interface SearchFields {
  name: string
  category?: string | null
  address?: string | null
  extra?: string | null
  /** Tiene premio por visitas (para "regalo", "premio"…). */
  hasReward?: boolean
}

/** Filtra y ordena por relevancia. Sin búsqueda devuelve la lista tal cual. */
export function smartSearch<T>(items: T[], query: string, fields: (item: T) => SearchFields): T[] {
  const tokens = normalize(query).split(' ').filter(t => t.length > 0)
  if (tokens.length === 0) return items
  const prepared = items.map((item, i) => {
    const f = fields(item)
    const cat = f.category ?? ''
    return {
      item, i, cat, hasReward: !!f.hasReward,
      texts: [
        [normalize(f.name), 3],
        [normalize(`${cat} ${CATEGORY_WORDS[cat] ?? ''}`), 2],
        [normalize(f.extra ?? ''), 2],
        [normalize(f.address ?? ''), 1],
      ] as [string, number][],
    }
  })
  const scores = new Map<number, number>(prepared.map(p => [p.i, 0]))
  for (const t of tokens) {
    const intents = INTENTS[t] ?? (t.length >= 5 ? Object.entries(INTENTS).find(([k]) => distance(t, k, 1) <= 1)?.[1] : undefined)
    const strict = prepared.map(p => {
      let best = Math.max(...p.texts.map(([txt, w]) => strictScore(t, txt) * w))
      if (intents?.includes(p.cat)) best = Math.max(best, 4)
      if (intents?.includes('@premio') && p.hasReward) best = Math.max(best, 4)
      return best
    })
    // Los errores de tipeo solo cuentan si nada calza de verdad con esa palabra.
    const anyStrict = strict.some(v => v > 0)
    prepared.forEach((p, k) => {
      if (!scores.has(p.i)) return
      const v = anyStrict ? strict[k] : Math.max(...p.texts.map(([txt, w]) => fuzzyScore(t, txt) * w))
      if (v === 0) scores.delete(p.i) // cada palabra tiene que calzar en algo
      else scores.set(p.i, scores.get(p.i)! + v)
    })
  }
  return prepared.filter(p => scores.has(p.i)).sort((a, b) => scores.get(b.i)! - scores.get(a.i)! || a.i - b.i).map(p => p.item)
}
