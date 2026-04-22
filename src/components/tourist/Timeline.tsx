import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ChevronUp, ChevronDown, X, Plus, Lightbulb, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUIStore } from '../../stores/useUIStore'
import type { ItineraryStop, StopReview } from '../../types/itinerary'
import StopReviewModal from '../../pages/tourist/StopReviewModal'
import { reviewsService } from '../../services/reviews'
import { itinerariesService } from '../../services/itineraries'
import SpotDrawer from './SpotDrawer'
import { supabase } from '../../lib/supabase'
import QRScannerModal from '../../pages/verify/QRScannerModal'


export default function Timeline({ readOnly = false,
  canVisit = false, }: {
    readOnly?: boolean
    canVisit?: boolean
  }) {
  const { current, removeStop, reorderStops, addStop, setCurrent } = useItineraryStore()
  const { user } = useAuthStore()
  const { addToast } = useUIStore()
  const lineRef = useRef<HTMLDivElement>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newStop, setNewStop] = useState({ time: '', spotName: '', localTip: '' })
  const [reviewStop, setReviewStop] = useState<ItineraryStop | null>(null)
  const [selectedStop, setSelectedStop] = useState<ItineraryStop | null>(null)
  const [scanningStop, setScanningStop] = useState<ItineraryStop | null>(null)


  useEffect(() => {
    if (lineRef.current) {
      gsap.fromTo(lineRef.current,
        { scaleY: 0, transformOrigin: 'top' },
        { scaleY: 1, duration: 1.2, ease: 'power2.out', delay: 0.3 }
      )
    }
  }, [current?.stops.length])

  if (!current) return null

  const handleAdd = () => {
    if (!newStop.time || !newStop.spotName) return
    const stop: ItineraryStop = {
      id: `stop-${Date.now()}`,
      spotId: '',
      spotName: newStop.spotName,
      time: newStop.time,
      description: '',
      localTip: newStop.localTip,
      travelToNext: '',
      photoUrl: '',
      lat: 0,
      lng: 0,
      visited: false,
    }
    addStop(stop)
    setNewStop({ time: '', spotName: '', localTip: '' })
    setShowAddForm(false)
  }

  const handleVisited = (stop: ItineraryStop) => {
    if (stop.visited) return
    setReviewStop(stop)
  }

  const handleSaveReview = async (stopId: string, review: StopReview) => {
    try {
      if (user && current.id && current.id !== 'itinerary-demo') {
        await reviewsService.save({
          userId: user.id,
          spotId: current.stops.find(s => s.id === stopId)?.spotId || stopId,
          spotName: current.stops.find(s => s.id === stopId)?.spotName || '',
          itineraryId: current.id,
          review,
        })
      }
      setCurrent({
        ...current,
        stops: current.stops.map(s =>
          s.id === stopId ? { ...s, visited: true, review } : s
        )
      })
      addToast({ type: 'success', message: '⭐ ¡Gracias por tu calificación!' })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error guardando review' })
    }
  }

  const handleRemoveStop = async (stopId: string) => {
    removeStop(stopId)
    if (current.id && current.id !== 'itinerary-demo' && !current.id.startsWith('new-')) {
      try {
        const fresh = await itinerariesService.getById(current.id)
        await itinerariesService.update(current.id, {
          stops: fresh.stops.filter((s: any) => s.id !== stopId),
        })
      } catch (err) {
        console.error('Error eliminando stop:', err)
      }
    }
  }

  const handleQRScan = async (code: string) => {
    setScanningStop(null)
    if (!scanningStop) return

    try {
      const { data: qr } = await supabase
        .from('spot_qr_codes')
        .select('spot_id')
        .eq('code', code)
        .eq('active', true)
        .single()

      if (!qr || qr.spot_id !== scanningStop.spotId) {
        addToast({ type: 'error', message: 'Este QR no corresponde a este spot' })
        return
      }

      // QR válido → abre el modal de reseña
      setReviewStop(scanningStop)
    } catch {
      addToast({ type: 'error', message: 'QR inválido o no reconocido' })
    }
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '40px' }}>
      {/* Vertical orange line */}
      <div ref={lineRef} style={{
        position: 'absolute', left: '15px', top: '24px', bottom: '24px',
        width: '2px',
        background: 'linear-gradient(to bottom, var(--orange), var(--amber))',
        borderRadius: '2px',
      }} />

      {current.stops.map((stop, idx) => (
        <motion.div
          key={stop.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.08, duration: 0.4 }}
          style={{ marginBottom: idx === current.stops.length - 1 ? 0 : '32px', position: 'relative' }}
        >
          {/* Orange dot */}
          <div style={{
            position: 'absolute', left: '-32px', top: '18px',
            width: '12px', height: '12px',
            background: stop.visited ? '#22c55e' : 'var(--orange)',
            borderRadius: '50%',
            boxShadow: stop.visited ? '0 0 12px rgba(34,197,94,0.5)' : '0 0 12px rgba(255,85,0,0.5)',
            border: '2px solid var(--bg)', transition: 'all 0.3s',
          }} />

          {/* Time label */}
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
            color: stop.visited ? '#22c55e' : 'var(--orange)',
            marginBottom: '8px', transition: 'color 0.3s',
          }}>
            {stop.time}
          </div>

          {/* Stop card */}
          <div
            className="card"
            onClick={() => setSelectedStop(stop)}
            style={{
              padding: '16px 18px',
              cursor: 'pointer',
              borderColor: stop.visited ? 'rgba(34,197,94,0.2)' : undefined,
              transition: 'border-color 0.3s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-display)', fontSize: '18px',
                    fontWeight: 800, color: 'var(--white)',
                    letterSpacing: '-0.5px', margin: 0
                  }}>
                    {stop.spotName}
                  </h3>
                  {stop.visited ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '2px 8px', borderRadius: '100px',
                      background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                      color: '#22c55e', fontFamily: 'var(--font-mono)', fontSize: '9px',
                      fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                    }}>
                      ✓ Visitado
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '2px 8px', borderRadius: '100px',
                      background: 'rgba(107,96,85,0.15)', border: '1px solid rgba(107,96,85,0.25)',
                      color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '9px',
                      fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                    }}>
                      ● Sin visitar
                    </span>
                  )}
                </div>

                {stop.description && (
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: '14px',
                    color: 'var(--muted)', marginBottom: '10px', lineHeight: 1.5
                  }}>
                    {stop.description}
                  </p>
                )}

                {stop.localTip && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                    background: 'rgba(255,170,59,0.08)', border: '1px solid rgba(255,170,59,0.2)',
                    borderRadius: '8px', padding: '10px 12px',
                    marginBottom: stop.visited && stop.review ? '10px' : '0',
                  }}>
                    <Lightbulb size={14} color="var(--amber)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--amber)', lineHeight: 1.4 }}>
                      {stop.localTip}
                    </span>
                  </div>
                )}

                {stop.visited && stop.review && (
                  <div style={{
                    marginTop: '10px', padding: '10px 12px',
                    background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
                    borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px'
                  }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} style={{ fontSize: '14px', color: s <= stop.review!.rating ? '#FFD166' : 'var(--dim)' }}>★</span>
                      ))}
                    </div>
                    {stop.review.liked && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                        😍 {stop.review.liked}
                      </p>
                    )}
                  </div>
                )}

                {canVisit && !stop.visited && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setScanningStop(stop) }}
                    style={{
                      marginTop: '12px',
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '7px 14px', borderRadius: '8px',
                      background: 'transparent', border: '1px solid rgba(255,85,0,0.3)',
                      color: 'var(--orange)', fontFamily: 'var(--font-body)',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,85,0,0.08)'
                      e.currentTarget.style.borderColor = 'var(--orange)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = 'rgba(255,85,0,0.3)'
                    }}
                  >
                    <MapPin size={13} /> Marcar como visitado
                  </button>
                )}
              </div>

              {/* Action buttons */}
              {!readOnly && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      idx > 0 && reorderStops(idx, idx - 1)
                    }}
                    disabled={idx === 0}
                    aria-label="Mover arriba"
                    className="btn btn-icon"
                    style={{ opacity: idx === 0 ? 0.3 : 1, background: 'var(--card2)', color: 'var(--muted)' }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => idx < current.stops.length - 1 && reorderStops(idx, idx + 1)}
                    disabled={idx === current.stops.length - 1}
                    aria-label="Mover abajo"
                    className="btn btn-icon"
                    style={{ opacity: idx === current.stops.length - 1 ? 0.3 : 1, background: 'var(--card2)', color: 'var(--muted)' }}
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={() => handleRemoveStop(stop.id)}
                    aria-label="Eliminar parada"
                    className="btn btn-icon"
                    style={{ background: 'rgba(255,64,64,0.08)', color: '#ff4040', border: '1px solid rgba(255,64,64,0.2)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {stop.travelToNext && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              marginTop: '10px', padding: '5px 12px',
              background: 'var(--dim)', borderRadius: '100px',
              fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)',
            }}>
              {stop.travelToNext}
            </div>
          )}
        </motion.div>
      ))}

      {!readOnly && (
        <div style={{ marginTop: '24px' }}>
          <AnimatePresence>
            {showAddForm ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="card"
                style={{ padding: '16px', overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="time"
                      value={newStop.time}
                      onChange={e => setNewStop(s => ({ ...s, time: e.target.value }))}
                      className="input"
                      style={{ width: '120px' }}
                      aria-label="Hora de la parada"
                    />
                    <input
                      type="text"
                      placeholder="Nombre del lugar"
                      value={newStop.spotName}
                      onChange={e => setNewStop(s => ({ ...s, spotName: e.target.value }))}
                      className="input"
                      aria-label="Nombre del lugar"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Tip local (opcional)"
                    value={newStop.localTip}
                    onChange={e => setNewStop(s => ({ ...s, localTip: e.target.value }))}
                    className="input"
                    aria-label="Tip local"
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowAddForm(false)} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                      Cancelar
                    </button>
                    <button onClick={handleAdd} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                      Añadir parada
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                aria-label="Añadir parada"
                style={{
                  width: '100%', padding: '16px', background: 'transparent',
                  border: '2px dashed rgba(255,85,0,0.3)', borderRadius: '12px',
                  cursor: 'pointer', color: 'var(--orange)',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <Plus size={16} /> Añadir parada
              </button>
            )}
          </AnimatePresence>
        </div>
      )}

      {current.status === 'completed' && (
        <div style={{
          marginTop: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '12px', background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px',
          color: '#22c55e', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
        }}>
          🫏 ¡Piura conquistada! Itinerario completado
        </div>
      )}
      <SpotDrawer
        stop={selectedStop}
        onClose={() => setSelectedStop(null)}
      />
      <QRScannerModal
        isOpen={!!scanningStop}
        onClose={() => setScanningStop(null)}
        onScan={handleQRScan}
      />
      <StopReviewModal
        stop={reviewStop}
        onClose={() => setReviewStop(null)}
        onSave={handleSaveReview}
      />
    </div>
  )
}