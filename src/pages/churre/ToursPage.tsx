import { useState, useEffect } from 'react'
import Topbar from '../../components/churre/Topbar'
import TourCard from '../../components/churre/TourCard'
import { useTours } from '../../hooks/useTours'
import type { TourStatus } from '../../types/tour'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const STATUS_FILTERS: { label: string; value: TourStatus | null }[] = [
  { label: 'Todos', value: null },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Confirmados', value: 'confirmed' },
  { label: 'Completados', value: 'completed' },
]
const CURRENT_MONTH = new Date().getMonth()

export default function ToursPage() {
  const [activeMonth, setActiveMonth] = useState(CURRENT_MONTH)
  const [statusFilter, setStatusFilter] = useState<TourStatus | null>(null)
  const { tours, loading, load, updateStatus } = useTours('churre-1')

  useEffect(() => { load() }, [load])

  const filtered = statusFilter ? tours.filter(t => t.status === statusFilter) : tours

  return (
    <div style={{ flex: 1 }}>
        <Topbar title="Mis Tours" />

        <div style={{ padding: '28px 32px' }}>
          {/* Month tabs */}
          <div className="scroll-row" style={{ marginBottom: '20px' }}>
            {MONTHS.map((m, i) => (
              <button
                key={m}
                onClick={() => setActiveMonth(i)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '100px',
                  border: `1px solid ${activeMonth === i ? 'var(--orange)' : 'rgba(255,120,30,0.15)'}`,
                  background: activeMonth === i ? 'rgba(255,85,0,0.1)' : 'var(--card2)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '12px',
                  color: activeMonth === i ? 'var(--orange)' : 'var(--muted)',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Status filters */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(f => (
              <button
                key={f.label}
                onClick={() => setStatusFilter(f.value)}
                className={`chip ${statusFilter === f.value ? 'selected' : ''}`}
                style={{ fontSize: '13px' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Tours list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>Cargando tours...</div>
          ) : filtered.length === 0 ? (
            <div style={{ border: '2px dashed rgba(255,85,0,0.3)', borderRadius: '16px', padding: '64px', textAlign: 'center' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>🌊</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--white)', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                {statusFilter === 'pending' ? 'No tienes tours pendientes' : 'No hay tours aquí'}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)' }}>
                Comparte tu perfil para recibir reservas
              </p>
            </div>
          ) : (
            <div>
              {filtered.map(tour => (
                <TourCard key={tour.id} tour={tour} onUpdateStatus={updateStatus} />
              ))}
            </div>
          )}
        </div>
    </div>
  )
}
