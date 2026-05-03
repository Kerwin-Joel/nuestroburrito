import { useCallback } from 'react'
import { useItineraryStore } from '../stores/useItineraryStore'
import { useAuthStore } from '../stores/useAuthStore'
import { claudeService } from '../services/claude'
import { itinerariesService } from '../services/itineraries'
import { useUIStore } from '../stores/useUIStore'
import type { ItineraryPreferences } from '../types/itinerary'

export const useItinerary = () => {
  const { current, isGenerating, setGenerating, setCurrent, loadDemo, clear } = useItineraryStore()
  const { user } = useAuthStore()
  const { addToast } = useUIStore()

  const generate = useCallback(async (prefs: ItineraryPreferences) => {
    setGenerating(true)
    try {
      const itinerary = await claudeService.generateItinerary(prefs)
      setCurrent(itinerary)
    } catch (e) {
      addToast({ type: 'error', message: 'No se pudo generar el itinerario.' })
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }, [setGenerating, setCurrent, addToast])

  const save = useCallback(async () => {
    if (!current || !user) return
    try {
      // Si ya tiene id real (no es el demo) → UPDATE
      if (current.id &&
        current.id !== 'itinerary-demo' &&
        !current.id.startsWith('new-')) {
        await itinerariesService.update(current.id, {
          title: current.title,
          preferences: current.preferences,
          stops: current.stops,
          status: current.status,
        })
        clear()
        addToast({
          type: 'success',
          message: '✓ Itinerario actualizado en tu perfil.'
        })
      } else {
        // No tiene id → INSERT nuevo
        await itinerariesService.save({
          userId: user.id,
          title: current.title,
          preferences: current.preferences,
          stops: current.stops,
          generatedBy: current.generatedBy,
          isSaved: true,
          status: current.status ?? 'in_progress',
        })
        clear()
        addToast({
          type: 'success',
          message: '¡Itinerario guardado! Lo encuentras en tu perfil.'
        })
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.message ?? 'Error guardando itinerario'
      })
    }
  }, [current, user, clear, addToast])

  const generateFromSpots = useCallback(async (
    prefs: ItineraryPreferences,
    realStops: any[]
  ) => {
    setGenerating(true)
    try {
      const timeMap: Record<string, string> = {
        '4h': 'Tarde rápida', '6h': 'Medio día',
        'full': 'Día completo', 'wknd': 'Fin de semana',
      }
      const groupMap: Record<string, string> = {
        solo: 'en solitario', couple: 'en pareja',
        family: 'en familia', friends: 'con amigos',
      }
      const title = `${timeMap[prefs.time] ?? 'Mi día'} ${groupMap[prefs.group] ?? ''} en Piura`.trim()

      const itinerary = {
        id: `new-${Date.now()}`,
        userId: user?.id ?? 'anonymous',  // ← agrega esto
        title,
        preferences: prefs,
        stops: realStops,
        generatedBy: 'ai' as const,
        isSaved: false,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
      }
      setCurrent(itinerary)
    } catch (e) {
      addToast({ type: 'error', message: 'No se pudo generar el itinerario.' })
    } finally {
      setGenerating(false)
    }
  }, [setGenerating, setCurrent, addToast, user])

  return { current, isGenerating, generate, generateFromSpots, save, loadDemo }
}