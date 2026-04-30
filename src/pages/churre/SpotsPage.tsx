import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import Topbar from '../../components/churre/Topbar'
import SpotFormModal from '../../components/shared/SpotFormModal'
import { MOCK_SPOTS } from '../../lib/mockData'
import { CATEGORY_LABELS } from '../../lib/constants'
import { useUIStore } from '../../stores/useUIStore'
import { spotsService } from '../../services/spots'
import type { Spot, SpotStatus } from '../../types/spot'

const TABS: { label: string; status: SpotStatus | null }[] = [
  { label: 'Todos', status: null },
  { label: 'Verificados', status: 'verified' },
  { label: 'Pendientes', status: 'pending' },
]

const STATUS_BADGE: Record<SpotStatus, { cls: string; icon: string }> = {
  verified: { cls: 'badge-green', icon: '✓' },
  pending:  { cls: 'badge-amber', icon: '⏳' },
  rejected: { cls: 'badge-red',   icon: '✕' },
}

export default function SpotsPage() {
  const [activeTab, setActiveTab] = useState<SpotStatus | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editSpot, setEditSpot] = useState<Spot | null>(null)
  const [spots, setSpots] = useState<Spot[]>(MOCK_SPOTS.filter(s => s.churreId === 'churre-1'))
  const [saving, setSaving] = useState(false)
  const { addToast } = useUIStore()

  // Load real spots from Supabase on mount
  useEffect(() => {
    spotsService.getAllSpots().then(data => {
      if (data.length > 0) setSpots(data)
    }).catch(() => {/* keep mock */})
  }, [])

  const filtered = activeTab ? spots.filter(s => s.status === activeTab) : spots

  const handleDelete = (id: string) => {
    setSpots(prev => prev.filter(s => s.id !== id))
    addToast({ type: 'info', message: 'Spot eliminado' })
  }

  const handleSave = async (data: any) => {
    setSaving(true)
    try {
      if (editSpot) {
        const updated = await spotsService.updateSpot(editSpot.id, {
          name: data.name,
          description: data.description,
          localTip: data.localTip || '',
          category: data.category,
          photoUrl: data.photoUrl || editSpot.photoUrl,
          photos: data.photos ?? editSpot.photos ?? [],
          address: data.address,
          lat: data.lat,
          lng: data.lng,
          schedule: data.schedule ?? editSpot.schedule,
          priceRange: data.price_range ?? editSpot.priceRange,
          rating: data.rating ?? editSpot.rating,
          reviewCount: data.review_count ?? editSpot.reviewCount,
          socialLinks: data.socialLinks ?? editSpot.socialLinks,
        } as any)
        setSpots(prev => prev.map(s => s.id === editSpot.id ? updated : s))
        addToast({ type: 'success', message: `${data.name} actualizado` })
      } else {
        const created = await spotsService.createSpot({
          churreId: 'churre-1',
          name: data.name,
          description: data.description,
          localTip: data.localTip || '',
          category: data.category,
          photoUrl: data.photoUrl || '',
          photos: data.photos ?? [],
          address: data.address,
          lat: data.lat,
          lng: data.lng,
          schedule: data.schedule ?? {},
          priceRange: data.price_range ?? 'low',
          status: 'pending',
          rating: data.rating ?? 0,
          reviewCount: data.review_count ?? 0,
          tiktokUrls: [],
          socialLinks: data.socialLinks,
        } as any)
        setSpots(prev => [created, ...prev])
        addToast({ type: 'success', message: `${data.name} creado` })
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Error al guardar el spot' })
      console.error(err)
    } finally {
      setSaving(false)
      setModalOpen(false)
      setEditSpot(null)
    }
  }

  return (
    <div style={{ flex: 1 }}>
        <Topbar
          title={`Mis Spots (${spots.length})`}
          action={
            <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={14} /> Nuevo spot
            </button>
          }
        />

        <div style={{ padding: '28px 32px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--card2)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
            {TABS.map(tab => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.status)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '13px',
                  background: activeTab === tab.status ? 'var(--orange)' : 'transparent',
                  color: activeTab === tab.status ? 'white' : 'var(--muted)',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div style={{ border: '2px dashed rgba(255,85,0,0.3)', borderRadius: '16px', padding: '64px', textAlign: 'center' }}>
              <p style={{ fontSize: '48px', marginBottom: '12px' }}>🗺️</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--white)', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                Sube tu primer spot local
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', marginBottom: '20px' }}>
                Los mejores lugares de Piura, contados por ti.
              </p>
              <button onClick={() => setModalOpen(true)} className="btn btn-primary">
                <Plus size={16} /> Subir primer spot
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {filtered.map(spot => {
                const cat = CATEGORY_LABELS[spot.category]
                const st = STATUS_BADGE[spot.status]
                return (
                  <motion.div key={spot.id} className="card" whileHover={{ y: -4 }} style={{ overflow: 'hidden' }}>
                    {/* Photo */}
                    <div style={{ position: 'relative' }}>
                      <img
                        src={spot.photoUrl}
                        alt={spot.name}
                        style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                        loading="lazy"
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,16,9,0.7) 0%, transparent 60%)' }} />
                      <span className={`badge ${st.cls}`} style={{ position: 'absolute', top: '10px', right: '10px' }}>
                        {st.icon} {spot.status === 'verified' ? 'Verificado' : spot.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                      </span>
                      <span className="badge badge-orange" style={{ position: 'absolute', top: '10px', left: '10px' }}>
                        {cat?.emoji} {cat?.label}
                      </span>
                    </div>
                    {/* Info */}
                    <div style={{ padding: '14px 16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--white)', letterSpacing: '-0.5px', marginBottom: '6px' }}>
                        {spot.name}
                      </h3>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.4, marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {spot.description}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--yellow)' }}>⭐ {spot.rating || '—'}</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            aria-label="Editar"
                            className="btn btn-ghost btn-icon"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => { setEditSpot(spot); setModalOpen(true) }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(spot.id)} aria-label="Eliminar" className="btn btn-danger btn-icon" style={{ width: '32px', height: '32px' }}><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
        <SpotFormModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditSpot(null) }}
          onSave={handleSave}
          initialData={editSpot}
        />
    </div>
  )
}
