import { useEffect, useRef, useState } from 'react'
import { useItineraryStore } from '../stores/useItineraryStore'
import { useAuthStore } from '../stores/useAuthStore'
import { itinerariesService } from '../services/itineraries'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useAutoSave(delay = 2000) {
    const { current, setCurrent } = useItineraryStore()
    const { user } = useAuthStore()
    const [status, setStatus] = useState<SaveStatus>('idle')
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const prevCurrentRef = useRef(current)

    useEffect(() => {
        // Si no hay itinerario o es nuevo (sin id real) → no auto-guarda
        if (!current || !user) return
        if (!current.id || current.id === 'itinerary-demo' || current.id.startsWith('new-')) return

        // Si no cambió nada → no auto-guarda
        if (prevCurrentRef.current === current) return
        prevCurrentRef.current = current

        // Cancela el timer anterior
        if (timerRef.current) clearTimeout(timerRef.current)

        setStatus('idle')

        // Espera X ms sin cambios antes de guardar
        timerRef.current = setTimeout(async () => {
            try {
                setStatus('saving')
                console.log('Auto-saving id:', current.id) // ← agrega
                await itinerariesService.update(current.id, {
                    title: current.title,
                    preferences: current.preferences,
                    stops: current.stops,
                    status: current.status,
                })
                setStatus('saved')
                setTimeout(() => setStatus('idle'), 3000)
            } catch (err) {
                console.error('Auto-save error:', err) // ← agrega
                setStatus('error')
                setTimeout(() => setStatus('idle'), 3000)
            }
        }, delay)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [current, user])

    return { status }
}