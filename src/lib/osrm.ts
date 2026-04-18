// OSRM — OpenStreetMap Routing Machine
// Gratuito, sin API key, rutas reales por calles

export interface OSRMRoute {
    coordinates: [number, number][] // [lat, lng][]
    distance: number                // metros
    duration: number                // segundos
}

// Obtiene ruta real entre múltiples puntos
export async function getRoute(
    points: { lat: number; lng: number }[]
): Promise<OSRMRoute | null> {
    if (points.length < 2) return null

    try {
        // OSRM espera coordenadas en formato lng,lat
        const coords = points
            .map(p => `${p.lng},${p.lat}`)
            .join(';')

        const url =
            `https://router.project-osrm.org/route/v1/driving/${coords}` +
            `?overview=full&geometries=geojson&steps=false`

        const res = await fetch(url)
        if (!res.ok) throw new Error('OSRM request failed')

        const data = await res.json()
        if (!data.routes?.length) return null

        const route = data.routes[0]

        // GeoJSON coordinates son [lng, lat] → convertir a [lat, lng]
        const coordinates: [number, number][] =
            route.geometry.coordinates.map(
                ([lng, lat]: [number, number]) => [lat, lng]
            )

        return {
            coordinates,
            distance: route.distance,
            duration: route.duration,
        }
    } catch (err) {
        console.error('OSRM error:', err)
        return null
    }
}

// Formatea duración en minutos u horas
export function formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}