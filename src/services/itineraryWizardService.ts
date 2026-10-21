import { supabase } from '../lib/supabase'

interface WizardPrefs {
    who: string
    group: string
    time: string       // '4h' | '6h' | 'full' | 'weekend'
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

// Fase 4: genera-itinerario ya no corre en el cliente ni expone la key de
// Gemini en el bundle — llama a la Edge Function `generar-itinerario`
// (algoritmo Orienteering con ventanas de horario, ver Fase 2/3).

const TIME_TO_MINUTES: Record<string, number> = {
    '4h': 240, '6h': 360, 'full': 600, 'wknd': 720, 'weekend': 720,
}

// Centro de Piura (Plaza de Armas) — punto de partida si no hay geolocalización.
const DEFAULT_ORIGIN = { lat: -5.1945, lng: -80.6328 }

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generar-itinerario`

function nowHHMM(): string {
    const parts = new Intl.DateTimeFormat('es-PE', {
        timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date())
    const h = parts.find(p => p.type === 'hour')?.value ?? '09'
    const m = parts.find(p => p.type === 'minute')?.value ?? '00'
    return `${h}:${m}`
}

function formatTravel(minutes: number): string {
    if (minutes < 5) return 'A pie · 5 min'
    if (minutes < 60) return `${minutes} min en auto`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}min en auto` : `${h}h en auto`
}

interface EdgeStop {
    spot_id: string
    nombre: string
    lat: number
    lng: number
    categoria: string
    es_comida: boolean
    descripcion: string | null
    tip: string | null
    llegada: string
    salida: string
    minutos_viaje_desde_anterior: number
    minutos_espera: number
}

interface EdgeResponse {
    id: string | null
    itinerario: EdgeStop[]
    minutos_totales: number
    minutos_regreso: number
    narrativa: string | null
    descartados_por_horario: number
    error?: string
}

// ─── Función principal ────────────────────────────────────────────────────
export async function generateItineraryFromSpots(
    prefs: WizardPrefs,
    onProgress?: (pct: number) => void
): Promise<GeneratedStop[]> {
    onProgress?.(10)

    // "foto" no es una categoría real del catálogo — se traduce a las que sí lo son.
    const intereses = new Set(prefs.interests)
    if (intereses.has('foto')) {
        intereses.delete('foto')
        intereses.add('cultura'); intereses.add('sierra'); intereses.add('playa')
    }

    const { data: { session } } = await supabase.auth.getSession()

    onProgress?.(25)

    let res: Response
    try {
        res = await fetch(EDGE_FN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({
                lat: prefs.userLat ?? DEFAULT_ORIGIN.lat,
                lng: prefs.userLng ?? DEFAULT_ORIGIN.lng,
                hora_inicio: nowHHMM(),
                minutos_disponibles: TIME_TO_MINUTES[prefs.time] ?? 360,
                modo: 'auto',
                intereses: [...intereses],
                volver_al_inicio: false,
            }),
        })
    } catch (e) {
        console.error('No se pudo contactar a generar-itinerario:', e)
        return []
    }

    onProgress?.(75)

    const data: EdgeResponse = await res.json().catch(() => ({ itinerario: [] }) as any)
    if (!res.ok) {
        console.error('generar-itinerario falló:', data.error)
        return []
    }

    onProgress?.(95)

    const stops: GeneratedStop[] = data.itinerario.map((s, i) => {
        const next = data.itinerario[i + 1]
        return {
            time: s.llegada,
            place: s.nombre,
            desc: s.descripcion ?? '',
            tip: s.tip ?? '',
            spotId: s.spot_id,
            category: s.categoria,
            travelToNext: next ? formatTravel(next.minutos_viaje_desde_anterior) : undefined,
            eventDate: null,
            eventDateEnd: null,
        }
    })

    return stops
}

export type { WizardPrefs }
