import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { X, Star, Plus, ExternalLink, ChevronUp, Lightbulb } from 'lucide-react'
import { useSpotsStore } from '../../stores/useSpotsStore'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { useUIStore } from '../../stores/useUIStore'
import { CATEGORY_LABELS } from '../../lib/constants'
import SpotTiktokSection from '../shared/SpotTiktokSection'
import type { ItineraryStop } from '../../types/itinerary'

export default function SpotBottomSheet() {
  const { selectedSpot, sheetOpen, sheetExpanded, setSheetOpen, setSheetExpanded, selectSpot } = useSpotsStore()
  const { addStop } = useItineraryStore()
  const { addToast } = useUIStore()
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sheetRef.current) return
    if (sheetOpen) {
      gsap.fromTo(sheetRef.current,
        { y: '100%' },
        { y: '0%', duration: 0.4, ease: 'power3.out' }
      )
    } else {
      gsap.to(sheetRef.current, { y: '100%', duration: 0.3, ease: 'power2.in' })
    }
  }, [sheetOpen])

  const close = () => {
    setSheetOpen(false)
    setTimeout(() => selectSpot(null), 300)
  }

  const handleAddToItinerary = () => {
    if (!selectedSpot) return
    const stop: ItineraryStop = {
      id: `stop-${Date.now()}`,
      spotId: selectedSpot.id,
      spotName: selectedSpot.name,
      time: '12:00',
      description: selectedSpot.description,
      localTip: selectedSpot.localTip,
      travelToNext: '',
      photoUrl: selectedSpot.photoUrl,
      lat: selectedSpot.lat,
      lng: selectedSpot.lng,
      visited: false,
    }
    addStop(stop)
    addToast({ type: 'success', message: `${selectedSpot.name} añadido a tu día 🌯` })
    close()
  }

  if (!selectedSpot) return null

  const cat = CATEGORY_LABELS[selectedSpot.category]
  const mapsUrl = `https://maps.google.com/?q=${selectedSpot.lat},${selectedSpot.lng}`

  return (
    <>
      {/* Backdrop */}
      {sheetOpen && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 4000,
            background: 'rgba(5,4,3,0.6)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 4001,
          background: 'var(--card)',
          borderRadius: '20px 20px 0 0',
          border: '1px solid rgba(255,120,30,0.18)',
          borderBottom: 'none',
          transform: 'translateY(100%)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '36px', height: '4px', background: 'var(--dim)', borderRadius: '2px' }} />
        </div>

        {/* Photo */}
        <div style={{ position: 'relative' }}>
          <img
            src={selectedSpot.photoUrl}
            alt={selectedSpot.name}
            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            loading="lazy"
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,16,9,0.8) 0%, transparent 60%)' }} />
          <span className="badge badge-orange" style={{ position: 'absolute', top: '12px', left: '12px' }}>
            {cat?.emoji} {cat?.label}
          </span>
          <button
            onClick={close}
            aria-label="Cerrar"
            style={{
              position: 'absolute', top: '12px', right: '12px',
              background: 'rgba(8,7,5,0.7)', border: 'none', borderRadius: '50%',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--white)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Name */}
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, letterSpacing: '-1px', color: 'var(--white)', marginBottom: '8px' }}>
            {selectedSpot.name}
          </h2>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} color="var(--yellow)" fill={i < Math.round(selectedSpot.rating) ? 'var(--yellow)' : 'transparent'} />
            ))}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--yellow)', fontWeight: 700 }}>{selectedSpot.rating}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gray)' }}>({selectedSpot.reviewCount} reseñas)</span>
          </div>

          {/* Tip */}
          <div style={{
            display: 'flex', gap: '10px',
            background: 'rgba(255,170,59,0.08)',
            border: '1px solid rgba(255,170,59,0.2)',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '16px',
          }}>
            <Lightbulb size={16} color="var(--amber)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--amber)', lineHeight: 1.5 }}>
              {selectedSpot.localTip}
            </p>
          </div>

          {/* Expanded info */}
          {sheetExpanded && (
            <>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--muted)', lineHeight: 1.65, marginBottom: '16px' }}>
                {selectedSpot.description}
              </p>

              {/* Schedule */}
              <div style={{ marginBottom: '16px' }}>
                <p className="section-label" style={{ marginBottom: '10px' }}>HORARIOS</p>
                {Object.entries(selectedSpot.schedule).map(([day, hours]) => (
                  <div key={day} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)' }}>{day}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--white)', fontWeight: 500 }}>{hours}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Toggle expand */}
          <button
            onClick={() => setSheetExpanded(!sheetExpanded)}
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', marginBottom: '12px', justifyContent: 'center', gap: '6px' }}
          >
            <ChevronUp size={14} style={{ transform: sheetExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            {sheetExpanded ? 'Ver menos' : 'Ver detalles completos'}
          </button>

          {/* TikTok Section */}
          <SpotTiktokSection spot={selectedSpot} />

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {sheetExpanded && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <ExternalLink size={14} /> Cómo llegar
              </a>
            )}
            <button
              onClick={handleAddToItinerary}
              className="btn btn-primary btn-sm"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Plus size={14} /> Añadir a mi itinerario
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
