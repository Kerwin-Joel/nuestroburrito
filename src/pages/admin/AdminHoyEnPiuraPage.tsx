import { motion } from 'framer-motion'
import { Plus, Sun, Music, AlertTriangle, Lightbulb, Edit, Trash2, Calendar, Check } from 'lucide-react'
import StatusBadge from '../../components/admin/StatusBadge'
import FeedEntryModal from '../../components/admin/FeedEntryModal'
import { useUIStore } from '../../stores/useUIStore'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'


interface FeedEntry {
  id: string
  type: 'clima' | 'evento' | 'alerta' | 'tip'
  title: string
  description: string
  emoji: string
  publishDate: string // ISO date
  active: boolean
}

const MOCK_FEED: FeedEntry[] = [
  { id: '1', type: 'clima', title: '28°C · Soleado', description: 'Cielo despejado todo el día. Índice UV alto.', emoji: '☀️', publishDate: new Date().toISOString().split('T')[0], active: true },
  { id: '2', type: 'evento', title: 'Feria de Catacaos', description: 'Gastronomía y artesanía en la plaza principal.', emoji: '🎵', publishDate: new Date().toISOString().split('T')[0], active: true },
  { id: '3', type: 'alerta', title: 'El Chalán cierra temprano', description: 'Por mantenimiento, cierran a las 2pm.', emoji: '⚠️', publishDate: new Date().toISOString().split('T')[0], active: true }
]

export default function AdminHoyEnPiuraPage() {
  const [feed, setFeed] = useState<FeedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<FeedEntry | null>(null)

  const handleOpenAdd = () => {
    setEditingEntry(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (entry: FeedEntry) => {
    setEditingEntry(entry)
    setIsModalOpen(true)
  }
  const { addToast } = useUIStore()

  useEffect(() => {
    loadFeed()
  }, [])

  const loadFeed = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('hoy_en_piura')
      .select('*')
      .order('created_at', { ascending: false })

    // Mapear snake_case de Supabase a camelCase del componente
    const mapped = (data ?? []).map((item: any) => ({
      id: item.id,
      type: item.tipo,
      title: item.titulo,
      description: item.subtitulo,
      emoji: item.emoji ?? '📌',
      publishDate: item.fecha,
      active: item.activo,
    }))

    setFeed(mapped as FeedEntry[])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta entrada?')) return
    await supabase.from('hoy_en_piura').delete().eq('id', id)
    setFeed(prev => prev.filter(e => e.id !== id))
    addToast({ type: 'info', message: 'Entrada eliminada' })
  }

  const handleSave = async (data: any) => {
    const payload = {
      tipo: data.type,
      titulo: data.title,
      subtitulo: data.description,
      emoji: data.emoji ?? '📌',
      activo: data.active ?? true,
      fecha: data.publishDate ?? new Date().toISOString().split('T')[0],
    }

    if (editingEntry) {
      await supabase.from('hoy_en_piura').update(payload).eq('id', editingEntry.id)
    } else {
      await supabase.from('hoy_en_piura').insert(payload)
    }

    await loadFeed()
    setIsModalOpen(false)
    addToast({ type: 'success', message: editingEntry ? 'Actualizado ✓' : 'Creado ✓' })
  }

  const handlePublishNow = async (id: string) => {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('hoy_en_piura').update({ fecha: today }).eq('id', id)
    await loadFeed()
    addToast({ type: 'success', message: 'Publicado para hoy ✓' })
  }

  const today = new Date().toISOString().split('T')[0]
  const todayEntries = feed.filter(e => e.publishDate <= today)
  const upcomingEntries = feed.filter(e => e.publishDate > today)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>Hoy en Piura</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--gray)', margin: 0 }}>Gestiona las alertas y eventos del feed diario para turistas</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Nueva entrada
        </button>
      </header>

      {/* Active Section */}
      <section>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', marginBottom: '16px' }}>Publicados para hoy</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {todayEntries.map(entry => (
            <div key={entry.id} style={{
              background: 'var(--card2)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '20px',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '24px' }}>{entry.emoji}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost btn-xs" onClick={() => handleOpenEdit(entry)}><Edit size={14} /></button>
                  <button className="btn btn-ghost btn-xs" style={{ color: '#ef4444' }} onClick={() => handleDelete(entry.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--white)', margin: '0 0 4px 0' }}>{entry.title}</h4>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                {entry.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={12} color="var(--gray)" />
                  <span style={{ fontSize: '11px', color: 'var(--gray)', fontFamily: 'var(--font-mono)' }}>{entry.publishDate === today ? 'Hoy' : entry.publishDate}</span>
                </div>
                <StatusBadge status={entry.active ? 'activo' : 'inactivo'} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Scheduled/Past */}
      <section>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', marginBottom: '16px' }}>Próximos / Programados</h3>
        {upcomingEntries.length === 0 ? (
          <div style={{ background: 'var(--card2)', borderRadius: '20px', border: '1px solid var(--border)', padding: '40px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--gray)', margin: 0 }}>No hay entradas programadas para fechas futuras.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {upcomingEntries.map(entry => (
              <div key={entry.id} style={{
                background: 'var(--card2)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '20px',
                position: 'relative',
                opacity: 0.8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '24px' }}>{entry.emoji}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-xs" onClick={() => handleOpenEdit(entry)}><Edit size={14} /></button>
                    <button className="btn btn-ghost btn-xs" style={{ color: '#ef4444' }} onClick={() => handleDelete(entry.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--white)', margin: '0 0 4px 0' }}>{entry.title}</h4>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  {entry.description}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} color="var(--orange)" />
                      <span style={{ fontSize: '11px', color: 'var(--orange)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Programado: {entry.publishDate}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePublishNow(entry.id)}
                    className="btn btn-ghost btn-xs"
                    style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,85,0,0.1)', color: 'var(--orange)' }}
                  >
                    🚀 Publicar ahora
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <FeedEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingEntry}
      />
    </motion.div>
  )
}
