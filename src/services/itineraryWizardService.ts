import { supabase } from '../lib/supabase'

interface WizardPrefs {
    who: string
    group: string
    time: string       // '4h' | '6h' | 'full' | 'wknd'
    budget: string     // 'low' | 'mid' | 'high'
    interests: string[]
    userLat?: number   // ubicación del usuario (opcional)
    userLng?: number
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
}

// const INTEREST_TO_CATEGORY: Record<string, string[]> = {
//     beach: ['playa'],
//     food: ['gastronomia'],
//     nature: ['naturaleza', 'sierra'],
//     culture: ['cultura'],
//     adventure: ['aventura'],
//     markets: ['mercados'],
//     photo: ['cultura', 'naturaleza', 'playa'],
//     relax: ['relax', 'gastronomia'],
// }

const BUDGET_TO_PRICE: Record<string, string[]> = {
    low: ['free', 'low'],
    mid: ['free', 'low', 'mid'],
    high: ['free', 'low', 'mid', 'high'],
}

// 3. Fix TIME_TO_STOPS — agrega 'weekend' además de 'wknd':
const TIME_TO_STOPS: Record<string, number> = {
    '4h': 2,
    '6h': 3,
    'full': 4,
    'wknd': 8,
    'weekend': 8,  // ← agrega esto
}

// 4. Fix TIME_TO_MINUTES — igual:
const TIME_TO_MINUTES: Record<string, number> = {
    '4h': 240,
    '6h': 360,
    'full': 600,
    'wknd': 1440,
    'weekend': 1440,  // ← agrega esto
}

// Tiempo promedio en cada spot según categoría (minutos)
const CATEGORY_DURATION: Record<string, number> = {
    playa: 120,
    gastronomia: 60,
    cultura: 75,
    naturaleza: 90,
    sierra: 120,
    aventura: 120,
    mercados: 60,
    relax: 75,
}

// Distancia haversine en km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Velocidad promedio en Piura: 40 km/h en ciudad, 60 km/h en carretera
function travelMinutes(distKm: number): number {
    const speed = distKm > 20 ? 60 : 40
    return Math.round((distKm / speed) * 60)
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

// Algoritmo greedy: selecciona el spot más cercano al anterior (nearest neighbor)
function sortByProximity(spots: any[], startLat?: number, startLng?: number): any[] {
    if (!startLat || !startLng || spots.length <= 1) return spots

    const remaining = [...spots]
    const sorted: any[] = []
    let curLat = startLat
    let curLng = startLng

    while (remaining.length > 0) {
        // Encuentra el más cercano al punto actual
        let minDist = Infinity
        let minIdx = 0

        remaining.forEach((spot, i) => {
            const dist = haversineKm(curLat, curLng, parseFloat(spot.lat), parseFloat(spot.lng))
            if (dist < minDist) {
                minDist = dist
                minIdx = i
            }
        })

        const next = remaining.splice(minIdx, 1)[0]
        next._distFromPrev = minDist
        sorted.push(next)
        curLat = parseFloat(next.lat)
        curLng = parseFloat(next.lng)
    }

    return sorted
}

// Filtra spots que caben en el tiempo disponible
function fitInTime(
    spots: any[],
    totalMinutes: number,
    startLat?: number,
    startLng?: number
): any[] {
    let usedMinutes = 0
    const result: any[] = []
    let prevLat = startLat
    let prevLng = startLng

    for (const spot of spots) {
        const duration = CATEGORY_DURATION[spot.category] ?? 75

        // Tiempo de traslado desde punto anterior
        let travel = 0
        if (prevLat && prevLng) {
            const dist = haversineKm(prevLat, prevLng, parseFloat(spot.lat), parseFloat(spot.lng))
            travel = travelMinutes(dist)
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

        // Si ya tenemos suficientes paradas, para
        if (result.length >= 6) break
    }

    return result
}

export async function generateItineraryFromSpots(prefs: WizardPrefs): Promise<GeneratedStop[]> {
    // 1. Categorías según intereses
    let categories: string[] = []
    if (prefs.interests.length > 0) {
        // Los IDs ya son las categorías — úsalos directo
        categories = [...new Set(prefs.interests)]

        // 'foto' no es una categoría de spot, mapéala a cultura y naturaleza
        if (categories.includes('foto')) {
            categories = categories.filter(c => c !== 'foto')
            categories.push('cultura', 'sierra', 'playa')
            categories = [...new Set(categories)]
        }
        // 'relax' tampoco existe como categoría en spots, mapéala
        if (categories.includes('relax')) {
            categories = categories.filter(c => c !== 'relax')
            categories.push('gastronomia')
            categories = [...new Set(categories)]
        }
    }

    const priceRanges = BUDGET_TO_PRICE[prefs.budget] ?? ['free', 'low', 'mid', 'high']
    const totalMinutes = TIME_TO_MINUTES[prefs.time] ?? 360

    // 2. Consulta Supabase — incluye lat/lng para calcular distancias
    let query = supabase
        .from('spots')
        .select('id, name, description, local_tip, category, address, price_range, rating, lat, lng, schedule, event_date')
        .eq('status', 'verified')
        .in('price_range', priceRanges)
        .order('rating', { ascending: false })

    if (categories.length > 0) {
        query = query.in('category', categories)
    }

    if (prefs.group === 'family') {
        query = query.neq('category', 'aventura')
    }

    let { data: spots } = await query

    // Fallback si no hay suficientes
    if (!spots?.length || spots.length < 2) {
        const { data: fallback } = await supabase
            .from('spots')
            .select('id, name, description, local_tip, category, address, price_range, rating, lat, lng, schedule, event_date') // ← agrega schedule y event_date
            .eq('status', 'verified')
            .order('rating', { ascending: false })
        spots = fallback ?? []
    }

    if (!spots?.length) return []

    // 3. Complementa con otros spots si hay pocos de las categorías pedidas
    if (spots.length < 3) {
        const { data: extra } = await supabase
            .from('spots')
            .select('id, name, description, local_tip, category, address, price_range, rating, lat, lng, schedule, event_date') // ← igual aquí
            .eq('status', 'verified')
            .not('id', 'in', `(${spots.map(s => s.id).join(',')})`)
            .order('rating', { ascending: false })
        spots = [...spots, ...(extra ?? [])]
    }

    // 4. Ordena por proximidad (nearest neighbor desde ubicación del usuario)
    const sorted = sortByProximity(spots, prefs.userLat, prefs.userLng)

    // 5. Filtra los que caben en el tiempo disponible
    const fitted = fitInTime(sorted, totalMinutes, prefs.userLat, prefs.userLng)

    // 6. Construye las paradas con horarios reales
    const START_HOUR = '08:30'
    const stops: GeneratedStop[] = []
    let currentTime = START_HOUR

    fitted.forEach((spot, i) => {
        // Suma el tiempo de traslado antes de llegar
        if (i > 0 && spot._travelMins > 0) {
            currentTime = addMinutesToTime(currentTime, spot._travelMins)
        }

        const distFromPrev = spot._distFromPrev ?? 0
        const travelMins = spot._travelMins ?? 0

        stops.push({
            time: currentTime,
            place: spot.name,
            desc: spot.description ?? '',
            tip: spot.local_tip ?? '',
            spotId: spot.id,
            category: spot.category,
            distanceKm: Math.round(distFromPrev * 10) / 10,
            travelToNext: i < fitted.length - 1
                ? formatTravel(fitted[i + 1]?._travelMins ?? 0)
                : undefined,
        })

        // Suma duración en el spot
        currentTime = addMinutesToTime(currentTime, spot._durationMins ?? 75)
    })

    return stops
}