import type { ItineraryStop } from '../types/itinerary'

// Fórmula Haversine — distancia entre 2 puntos en metros
export function haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Ordena paradas por proximidad desde un punto de inicio
// Algoritmo greedy: siempre elige la parada más cercana
export function optimizeRoute(
    stops: ItineraryStop[],
    startLat: number,
    startLng: number
): ItineraryStop[] {
    if (stops.length <= 1) return stops

    const remaining = [...stops]
    const ordered: ItineraryStop[] = []
    let currentLat = startLat
    let currentLng = startLng

    while (remaining.length > 0) {
        // Encuentra la parada más cercana al punto actual
        let nearestIdx = 0
        let nearestDist = Infinity

        remaining.forEach((stop, idx) => {
            // Solo optimiza stops con coordenadas válidas
            if (stop.lat === 0 && stop.lng === 0) return
            const dist = haversineDistance(
                currentLat, currentLng,
                stop.lat, stop.lng
            )
            if (dist < nearestDist) {
                nearestDist = dist
                nearestIdx = idx
            }
        })

        const nearest = remaining.splice(nearestIdx, 1)[0]
        ordered.push(nearest)
        currentLat = nearest.lat
        currentLng = nearest.lng
    }

    return ordered
}

// Formatea distancia en metros o km
export function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
}