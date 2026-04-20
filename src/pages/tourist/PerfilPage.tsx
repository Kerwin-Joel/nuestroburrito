import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Share2, Eye, Trash2, BookOpen, Bell, X, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useProfileStore } from '../../stores/useProfileStore'
import { useReminders } from '../../hooks/useReminders'
import { itinerariesService } from '../../services/itineraries'
import { useUIStore } from '../../stores/useUIStore'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { formatDate, timeUntil, initials } from '../../lib/formatters'
import type { Itinerary } from '../../types/itinerary'

export default function PerfilTouristPage() {
  const { user } = useAuthStore()
  const { addToast } = useUIStore()
  const { setCurrent } = useItineraryStore()
  const navigate = useNavigate()

  const { itineraries, lastFetchAt, setItineraries, removeItinerary } = useProfileStore()
  const [loading, setLoading] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(user?.profile?.name || '')
  const [refreshKey, setRefreshKey] = useState(0)
  const CACHE_TTL = 5 * 1000 // 5 segundos
  const { reminders, load: loadReminders, cancel } = useReminders(
    user?.id || 'tourist-demo'
  )

  // Carga itinerarios desde Supabase
  const loadItineraries = useCallback(async (force = false) => {
    if (!user?.id) return

    const isStale = !lastFetchAt || (Date.now() - lastFetchAt) > CACHE_TTL

    // Si hay datos frescos y no se fuerza → no fetch
    if (!force && !isStale && itineraries.length > 0) return

    // Solo muestra spinner si no hay datos previos
    if (itineraries.length === 0) setLoading(true)

    try {
      const data = await itinerariesService.getByUser(user.id)
      setItineraries(data)
    } catch {
      addToast({ type: 'error', message: 'Error cargando itinerarios' })
    } finally {
      setLoading(false)
    }
  }, [user?.id, lastFetchAt, itineraries.length])

  useEffect(() => {
    loadItineraries()
  }, [])

  useEffect(() => {
    loadItineraries()
    loadReminders()
  }, [loadItineraries, loadReminders, refreshKey])

  useEffect(() => {
    const onFocus = () => setRefreshKey(k => k + 1)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Soft delete
  const handleDelete = async (id: string) => {
    try {
      await itinerariesService.softDelete(id)
      removeItinerary(id) // ← actualiza el store directamente
      addToast({ type: 'success', message: 'Itinerario eliminado' })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error' })
    }
  }

  // Ver itinerario
  const handleView = async (itinerary: Itinerary) => {
    try {
      // Recarga datos frescos de Supabase
      const fresh = await itinerariesService.getById(itinerary.id)
      setCurrent(fresh)
    } catch {
      // Si falla, usa el que tiene
      setCurrent(itinerary)
    }
    navigate('/app/itinerario')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-container" style={{ paddingTop: '40px', paddingBottom: '100px' }}>

        {/* Profile header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--orange) 0%, var(--hot) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '28px', color: 'white',
            marginBottom: '16px',
            boxShadow: '0 8px 32px rgba(255,85,0,0.3)',
          }}>
            {initials(user?.profile?.name || 'V')}
          </div>

          <p style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: '22px', color: 'var(--white)', letterSpacing: '-0.5px'
          }}>
            {user?.profile?.name}
          </p>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', marginTop: '6px' }}>
            {itineraries.length} itinerario{itineraries.length !== 1 ? 's' : ''} guardado{itineraries.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '40px' }}>
          {[
            { label: 'Itinerarios', value: itineraries.length, emoji: '🗓️' },
            { label: 'Spots visitados', value: 12, emoji: '📍' },
            { label: 'Ciudad favorita', value: 'Piura', emoji: '🌊' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '24px', marginBottom: '6px' }}>{s.emoji}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--yellow)', letterSpacing: '-0.5px' }}>{s.value}</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Active reminders */}
        {reminders.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <p className="section-label" style={{ marginBottom: '14px' }}>🔔 RECORDATORIOS ACTIVOS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reminders.map(r => (
                <div key={r.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--orange)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', fontWeight: 600 }}>{r.stopName}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>{timeUntil(r.remindAt)}</p>
                  </div>
                  <button onClick={() => cancel(r.id)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '12px' }}>
                    <X size={12} /> Cancelar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved itineraries */}
        <p className="section-label" style={{ marginBottom: '16px' }}>MIS ITINERARIOS</p>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
            <Loader2 size={32} color="var(--orange)" className="animate-spin" />
          </div>
        ) : itineraries.length === 0 ? (
          <div style={{ border: '2px dashed rgba(255,85,0,0.3)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>🌯</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--white)', letterSpacing: '-0.5px' }}>
              Aún no tienes itinerarios
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', margin: '8px 0 20px' }}>
              Crea tu primer día piurano
            </p>
            <Link to="/app" className="btn btn-primary">Crear mi itinerario</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {itineraries.map(it => (
              <motion.div key={it.id} className="card" whileHover={{ y: -4 }} style={{ padding: '18px' }}>

                {/* Header de la card */}
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', letterSpacing: '-0.5px' }}>
                    {it.title}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span className="badge badge-orange">
                      <BookOpen size={9} /> {it.stops.length}
                    </span>
                    {/* Badge de status */}
                    {it.status === 'completed' ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '2px 8px', borderRadius: '100px',
                        background: 'rgba(34,197,94,0.12)',
                        border: '1px solid rgba(34,197,94,0.25)',
                        color: '#22c55e',
                        fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                        letterSpacing: '0.5px', textTransform: 'uppercase'
                      }}>
                        ✓ Completado
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '2px 8px', borderRadius: '100px',
                        background: 'rgba(255,170,59,0.12)',
                        border: '1px solid rgba(255,170,59,0.25)',
                        color: 'var(--amber)',
                        fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                        letterSpacing: '0.5px', textTransform: 'uppercase'
                      }}>
                        ● En progreso
                      </span>
                    )}
                  </div>
                </div>

                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                  {formatDate(it.createdAt)}
                </p>
                {it.stops[0] && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)' }}>
                    Empieza en {it.stops[0].spotName}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    onClick={() => handleView(it)}
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    onClick={() => {
                      const text = `🌯 *${it.title}*\n\n` +
                        it.stops.map((s, i) =>
                          `${i + 1}. *${s.time}* — ${s.spotName}${s.localTip ? `\n   💡 ${s.localTip}` : ''}`
                        ).join('\n\n') +
                        `\n\n_Generado con Burrito · La guía piurana_ 🫏`
                      const url = `https://wa.me/?text=${encodeURIComponent(text)}`
                      window.open(url, '_blank')
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Share2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(it.id)}
                    className="btn btn-danger btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}