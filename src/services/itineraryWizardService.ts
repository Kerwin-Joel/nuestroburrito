import { supabase } from '../lib/supabase'

interface WizardPrefs {
    who: string
    group: string
    time: string       // '4h' | '6h' | 'full' | 'wknd'
    budget: string     // 'low' | 'mid' | 'high'
    interests: string[]
    userLat?: number
    userLng?: number
    _geminiTitle?: string
}

interface GeneratedStop {
    time: string
    place: string
    desc: string
    tip: string
    spotId?: string
    category?: string
    distanceKm?: number
    travelToNext?: string
    eventDate?: string | null
    eventDateEnd?: string | null
}

// ─── Constantes ────────────────────────────────────────────────────────────

const BUDGET_TO_PRICE: Record<string, string[]> = {
    low: ['free', 'low'],
    mid: ['free', 'low', 'mid'],
    high: ['free', 'low', 'mid', 'high'],
}

const TIME_TO_MINUTES: Record<string, number> = {
    '4h': 240, '6h': 360, 'full': 600, 'wknd': 1440, 'weekend': 1440,
}

// Duración promedio por spot (minutos) — más compacto para generar más paradas
const CATEGORY_DURATION: Record<string, number> = {
    playa: 60, gastronomia: 45, cultura: 45, naturaleza: 60,
    sierra: 90, aventura: 90, mercados: 40, relax: 45,
}

// Buffer mínimo entre spots (minutos)
const TRAVEL_BUFFER_MINS = 5
// Máximo de holgura total entre un spot y el siguiente (minutos)
const MAX_GAP_MINS = 60

// ─── Helpers geográficos ───────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function travelMinutes(distKm: number): number {
    const speed = distKm > 20 ? 60 : 40
    return Math.max(5, Math.round((distKm / speed) * 60)) // mínimo 5 min
}

function formatTravel(minutes: number): string {
    if (minutes < 5) return 'A pie · 5 min'
    if (minutes < 60) return `${minutes} min en auto`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}min en auto` : `${h}h en auto`
}

function addMinutesToTime(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number)
    const total = h * 60 + m + minutes
    const newH = Math.floor(total / 60) % 24
    const newM = total % 60
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
}

// ─── Parser de horarios de schedule ────────────────────────────────────────
// Formatos comunes: "08:00 - 22:00", "8:00–18:00", "8.00 - 22.00"

const DAY_NAMES: Record<number, string> = {
    0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
    4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
}

interface TimeWindow {
    openMins: number   // apertura en minutos desde medianoche
    closeMins: number  // cierre en minutos desde medianoche
}

function getSpotTimeWindow(spot: any): TimeWindow | null {
    // 1. Si es evento con fecha, revisar si aplica hoy
    if (spot.event_date) {
        const today = new Date().toISOString().split('T')[0]
        const start = spot.event_date
        const end = spot.event_date_end ?? spot.event_date
        // Si el evento no aplica hoy, no lo incluyas
        if (today < start || today > end) return null
    }

    // 2. Parse el schedule para hoy
    const schedule = spot.schedule
    if (!schedule || typeof schedule !== 'object') return null

    const todayIdx = new Date().getDay()
    const todayName = DAY_NAMES[todayIdx]
    const hoursStr = schedule[todayName] as string | undefined

    if (!hoursStr || hoursStr.toLowerCase() === 'cerrado') return null

    // Parse "HH:MM - HH:MM" / "H:MM–H:MM" / con punto decimal
    const match = hoursStr.match(/(\d{1,2})[:\.](\d{2})\s*[-–—]\s*(\d{1,2})[:\.](\d{2})/)
    if (!match) return null

    const openMins = parseInt(match[1]) * 60 + parseInt(match[2])
    const closeMins = parseInt(match[3]) * 60 + parseInt(match[4])

    return { openMins, closeMins }
}

// Determina el horario óptimo para visitar un spot
function getVisitTime(spot: any, earliestArrival: string): string {
    const window = getSpotTimeWindow(spot)
    const arrivalMins = timeToMinutes(earliestArrival)

    if (!window) {
        // Sin horario conocido — usa la hora de llegada
        return earliestArrival
    }

    // Si el spot abre después de nuestra hora de llegada, esperar a que abra
    if (arrivalMins < window.openMins) {
        return `${String(Math.floor(window.openMins / 60)).padStart(2, '0')}:${String(window.openMins % 60).padStart(2, '0')}`
    }

    // Si ya cerró o va a cerrar en < 30min, no aplica
    const duration = CATEGORY_DURATION[spot.category] ?? 60
    if (arrivalMins + duration > window.closeMins) {
        // Intenta llegar justo a tiempo para alcanzar
        const idealStart = window.closeMins - duration
        if (idealStart > arrivalMins - 30) {
            return `${String(Math.floor(idealStart / 60)).padStart(2, '0')}:${String(idealStart % 60).padStart(2, '0')}`
        }
        return earliestArrival // ya no se puede, pero se intenta
    }

    return earliestArrival
}

// Verifica si un spot está abierto a una hora dada
function isOpenAt(spot: any, timeMins: number): boolean {
    const window = getSpotTimeWindow(spot)
    if (!window) return true // Sin horario = asumir abierto
    const duration = CATEGORY_DURATION[spot.category] ?? 60
    return timeMins >= window.openMins && (timeMins + duration) <= window.closeMins
}

// ─── Algoritmos de selección ───────────────────────────────────────────────

function sortByProximity(spots: any[], startLat?: number, startLng?: number): any[] {
    if (!startLat || !startLng || spots.length <= 1) return spots

    const remaining = [...spots]
    const sorted: any[] = []
    let curLat = startLat
    let curLng = startLng

    while (remaining.length > 0) {
        let minDist = Infinity
        let minIdx = 0
        remaining.forEach((spot, i) => {
            const dist = haversineKm(curLat, curLng, parseFloat(spot.lat), parseFloat(spot.lng))
            if (dist < minDist) { minDist = dist; minIdx = i }
        })
        const next = remaining.splice(minIdx, 1)[0]
        next._distFromPrev = minDist
        sorted.push(next)
        curLat = parseFloat(next.lat)
        curLng = parseFloat(next.lng)
    }
    return sorted
}

function fitInTime(spots: any[], totalMinutes: number, startLat?: number, startLng?: number): any[] {
    let usedMinutes = 0
    const result: any[] = []
    let prevLat = startLat
    let prevLng = startLng

    for (const spot of spots) {
        const duration = CATEGORY_DURATION[spot.category] ?? 45
        let travel = 0
        if (prevLat && prevLng) {
            const dist = haversineKm(prevLat, prevLng, parseFloat(spot.lat), parseFloat(spot.lng))
            travel = Math.min(travelMinutes(dist) + TRAVEL_BUFFER_MINS, MAX_GAP_MINS)
        }
        const needed = duration + travel
        if (usedMinutes + needed <= totalMinutes) {
            spot._travelMins = travel
            spot._durationMins = duration
            result.push(spot)
            usedMinutes += needed
            prevLat = parseFloat(spot.lat)
            prevLng = parseFloat(spot.lng)
        }
        if (result.length >= 12) break
    }
    return result
}

// ─── Construcción de paradas — fallback sin IA ────────────────────────────
function buildStops(fitted: any[]): GeneratedStop[] {
    const START_HOUR = '08:30'
    const stops: GeneratedStop[] = []
    let currentTime = START_HOUR

    fitted.forEach((spot, i) => {
        // Suma traslado
        if (i > 0 && spot._travelMins > 0) {
            currentTime = addMinutesToTime(currentTime, spot._travelMins)
        }

        // Ajusta al horario real del spot
        currentTime = getVisitTime(spot, currentTime)

        stops.push({
            time: currentTime,
            place: spot.name,
            desc: spot.description ?? '',
            tip: spot.local_tip ?? '',
            spotId: spot.id,
            category: spot.category,
            distanceKm: Math.round((spot._distFromPrev ?? 0) * 10) / 10,
            travelToNext: i < fitted.length - 1
                ? formatTravel(fitted[i + 1]?._travelMins ?? 0)
                : undefined,
            eventDate: spot.event_date ?? null,
            eventDateEnd: spot.event_date_end ?? null,
        })

        currentTime = addMinutesToTime(currentTime, spot._durationMins ?? 75)
    })

    return stops
}

// ─── Integración con Gemini ───────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const WHO_LABEL: Record<string, string> = {
    tourist: 'Turista de otra ciudad',
    local: 'Piurano local que quiere redescubrir su ciudad',
    transit: 'De paso, pocas horas disponibles',
}
const GROUP_LABEL: Record<string, string> = {
    solo: 'Viaja solo',
    couple: 'En pareja',
    family: 'En familia con niños',
    friends: 'Con grupo de amigos',
}
const TIME_LABEL: Record<string, string> = {
    '4h': 'Menos de 4 horas (visita rápida)',
    '6h': 'Medio día (4-6 horas)',
    'full': 'Día completo (6+ horas)',
    'wknd': 'Fin de semana (2 días)',
    'weekend': 'Fin de semana (2 días)',
}
const BUDGET_LABEL: Record<string, string> = {
    low: 'Económico — hasta S/50',
    mid: 'Moderado — S/50 a S/150',
    high: 'Sin límite — lo mejor de Piura',
}

async function generateWithGemini(prefs: WizardPrefs, fitted: any[]): Promise<GeneratedStop[]> {
    if (!GEMINI_API_KEY) throw new Error('VITE_GEMINI_API_KEY no configurado en .env')

    // Prepara info de horarios para Gemini
    const spotsInfo = fitted.map((s, i) => {
        const window = getSpotTimeWindow(s)
        const scheduleInfo = window
            ? `Horario hoy: ${String(Math.floor(window.openMins / 60)).padStart(2, '0')}:${String(window.openMins % 60).padStart(2, '0')} - ${String(Math.floor(window.closeMins / 60)).padStart(2, '0')}:${String(window.closeMins % 60).padStart(2, '0')}`
            : 'Horario: no especificado'
        const isEvent = !!s.event_date
        return `${i + 1}. ID:"${s.id}" | "${s.name}" | ${s.category}${isEvent ? ' [EVENTO]' : ''} | ${scheduleInfo} | Desc: ${(s.description ?? '').slice(0, 120)}`
    }).join('\n')

    const prompt = `Eres un experto en turismo de Piura, Perú — conoces cada rincón de la región como un churre (local piurano).
Analiza este perfil de turista y estos spots candidatos, y crea un itinerario personalizado.
Responde ÚNICAMENTE con JSON válido, sin markdown, sin backticks, sin texto adicional.

PERFIL DEL TURISTA:
- Tipo de visitante: ${WHO_LABEL[prefs.who] ?? prefs.who}
- Grupo: ${GROUP_LABEL[prefs.group] ?? prefs.group}
- Tiempo disponible: ${TIME_LABEL[prefs.time] ?? prefs.time}
- Presupuesto: ${BUDGET_LABEL[prefs.budget] ?? prefs.budget}
- Intereses: ${prefs.interests.length > 0 ? prefs.interests.join(', ') : 'Variado — abierto a todo'}

SPOTS CANDIDATOS (ya ordenados por proximidad):
${spotsInfo}

REGLAS CRÍTICAS DE HORARIOS:
1. RESPETAR los horarios de apertura/cierre. Un restaurante que abre a las 12:00 NO se puede visitar a las 08:30.
2. Los EVENTOS tienen horario fijo — DEBEN programarse dentro de su ventana horaria real.
3. Dejar al menos 15-20 minutos entre spots para traslados.
4. Los horarios empiezan desde las 08:30 (o más tarde si el primer spot abre después).
5. No agendar restaurantes fuera de horarios de comida razonables (almuerzo: 12:00-15:00, cena: 19:00-22:00).
6. MANTÉN la descripción y el tip EXACTAMENTE como vienen de la base de datos. NO los modifiques ni los reescribas.

El título debe ser creativo, en español, con sabor piurano (ej: "Un día churre en Piura").

Devuelve exactamente este JSON:
{
  "titulo": "nombre creativo del itinerario",
  "stops": [
    {
      "id": "id exacto del spot de la lista de candidatos",
      "time": "HH:MM"
    }
  ]
}`

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 65536,
                    responseMimeType: 'application/json',
                },
            }),
        }
    )

    if (!response.ok) {
        const errBody = await response.text()
        throw new Error(`Gemini HTTP ${response.status}: ${errBody}`)
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]
    const finishReason = candidate?.finishReason

    // Check if response was truncated
    if (finishReason === 'MAX_TOKENS') {
        console.warn('⚠️ Gemini truncó la respuesta (MAX_TOKENS)')
    }

    const raw = candidate?.content?.parts?.[0]?.text ?? ''
    const clean = raw.replace(/```json|```/g, '').trim()

    let parsed: any
    try {
        parsed = JSON.parse(clean)
    } catch {
        throw new Error(`Gemini devolvió JSON inválido: ${clean.slice(0, 300)}`)
    }

    if (!parsed.stops?.length) throw new Error('Gemini devolvió stops vacíos')

    prefs._geminiTitle = parsed.titulo

    // Mapea con datos REALES de Supabase (desc y tip originales)
    const mappedStops: GeneratedStop[] = parsed.stops
        .map((gs: any, i: number) => {
            const spotData = fitted.find(s => s.id === gs.id) ?? fitted[i]
            if (!spotData) return null

            // Valida el horario propuesto por Gemini
            let time = gs.time ?? addMinutesToTime('08:30', i * 90)
            const window = getSpotTimeWindow(spotData)
            if (window) {
                const proposedMins = timeToMinutes(time)
                // Si Gemini lo puso fuera de horario, corregir
                if (proposedMins < window.openMins) {
                    time = `${String(Math.floor(window.openMins / 60)).padStart(2, '0')}:${String(window.openMins % 60).padStart(2, '0')}`
                }
            }

            const nextGS = parsed.stops[i + 1]
            const nextSpotData = nextGS ? (fitted.find(s => s.id === nextGS.id) ?? fitted[i + 1]) : null
            let travelToNext: string | undefined
            if (nextSpotData) {
                const dist = haversineKm(
                    parseFloat(spotData.lat), parseFloat(spotData.lng),
                    parseFloat(nextSpotData.lat), parseFloat(nextSpotData.lng)
                )
                travelToNext = formatTravel(travelMinutes(dist))
            }

            return {
                time,
                place: spotData.name,
                desc: spotData.description ?? '',
                tip: spotData.local_tip ?? '',
                spotId: spotData.id,
                category: spotData.category,
                distanceKm: Math.round((spotData._distFromPrev ?? 0) * 10) / 10,
                travelToNext,
                eventDate: spotData.event_date ?? null,
                eventDateEnd: spotData.event_date_end ?? null,
            } as GeneratedStop
        })
        .filter(Boolean) as GeneratedStop[]

    return mappedStops
}

// ─── Función principal ────────────────────────────────────────────────────
export async function generateItineraryFromSpots(
    prefs: WizardPrefs,
    onProgress?: (pct: number) => void
): Promise<GeneratedStop[]> {
    onProgress?.(5)

    // 1. Mapea intereses a categorías de Supabase
    let categories: string[] = []
    if (prefs.interests.length > 0) {
        categories = [...new Set(prefs.interests)]
        if (categories.includes('foto')) {
            categories = categories.filter(c => c !== 'foto')
            categories.push('cultura', 'sierra', 'playa')
            categories = [...new Set(categories)]
        }
        if (categories.includes('relax')) {
            categories = categories.filter(c => c !== 'relax')
            categories.push('gastronomia')
            categories = [...new Set(categories)]
        }
    }

    const priceRanges = BUDGET_TO_PRICE[prefs.budget] ?? ['free', 'low', 'mid', 'high']
    const totalMinutes = TIME_TO_MINUTES[prefs.time] ?? 360

    onProgress?.(15)

    // 2. Consulta Supabase — incluye event_date_end
    let query = supabase
        .from('spots')
        .select('id, name, description, local_tip, category, address, price_range, rating, lat, lng, schedule, event_date, event_date_end')
        .eq('status', 'verified')
        .in('price_range', priceRanges)
        .order('rating', { ascending: false })
        .limit(50)

    if (categories.length > 0) query = query.in('category', categories)
    if (prefs.group === 'family') query = query.neq('category', 'aventura')

    let { data: spots } = await query

    onProgress?.(30)

    // Fallback si no hay suficientes spots
    if (!spots?.length || spots.length < 2) {
        const { data: fallback } = await supabase
            .from('spots')
            .select('id, name, description, local_tip, category, address, price_range, rating, lat, lng, schedule, event_date, event_date_end')
            .eq('status', 'verified')
            .order('rating', { ascending: false })
            .limit(50)
        spots = fallback ?? []
    }

    if (!spots?.length) return []

    onProgress?.(40)

    // Complementa si hay muy pocos spots
    if (spots.length < 3) {
        const { data: extra } = await supabase
            .from('spots')
            .select('id, name, description, local_tip, category, address, price_range, rating, lat, lng, schedule, event_date, event_date_end')
            .eq('status', 'verified')
            .not('id', 'in', `(${spots.map(s => s.id).join(',')})`)
            .order('rating', { ascending: false })
            .limit(20)
        spots = [...spots, ...(extra ?? [])]
    }

    onProgress?.(50)

    // 3. Ordena por proximidad y filtra por tiempo disponible
    const sorted = sortByProximity(spots, prefs.userLat, prefs.userLng)
    const fitted = fitInTime(sorted, totalMinutes, prefs.userLat, prefs.userLng)

    if (!fitted.length) return []

    onProgress?.(60)

    // 4. Gemini personaliza — fallback al algoritmo local si falla
    try {
        console.log(`🤖 Generando con Gemini (${fitted.length} spots candidatos)...`)
        onProgress?.(65)

        // Start smooth progress animation during Gemini call
        let animPct = 65
        const animInterval = setInterval(() => {
            // Smooth logarithmic slowdown: fast at start, slow near 92%
            const remaining = 92 - animPct
            animPct += remaining * 0.06
            onProgress?.(Math.min(92, Math.round(animPct)))
        }, 300)

        const geminiStops = await generateWithGemini(prefs, fitted)
        clearInterval(animInterval)
        onProgress?.(95)
        console.log(`✅ Gemini: ${geminiStops.length} paradas. Título: "${prefs._geminiTitle}"`)
        return geminiStops
    } catch (e) {
        console.warn('⚠️ Gemini falló, usando algoritmo local como fallback:', e)
        onProgress?.(90)
        const localStops = buildStops(fitted)
        onProgress?.(95)
        return localStops
    }
}

export type { WizardPrefs }