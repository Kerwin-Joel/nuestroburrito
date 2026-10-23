import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react'
import { spotsService } from '../../services/spots'
import { useTiktokEmbed } from '../../hooks/useTiktokEmbed'
import { useUIStore } from '../../stores/useUIStore'
import type { Spot } from '../../types/spot'

function TiktokPreview({ url }: { url: string }) {
  const { data, loading, error } = useTiktokEmbed(url)
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'var(--dim)', borderRadius: '8px' }}>
      <Loader2 size={16} className="animate-spin" color="var(--orange)" />
      <span style={{ fontSize: '11px', color: 'var(--gray)' }}>Cargando preview...</span>
    </div>
  )
  if (error || !data) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'rgba(255,85,0,0.05)', borderRadius: '8px', border: '1px solid rgba(255,85,0,0.1)' }}>
      <img src={data.thumbnail_url} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
      <div style={{ overflow: 'hidden' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--white)', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{data.title}</p>
        <p style={{ fontSize: '10px', color: 'var(--gray)', margin: 0 }}>@{data.author_name}</p>
      </div>
    </div>
  )
}

export default function AdminTiktoksPage() {
  const { addToast } = useUIStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSpotId, setExpandedSpotId] = useState<string | null>(null)
  const [newUrl, setNewUrl] = useState('')
  const [debouncedUrl, setDebouncedUrl] = useState('')
  const [savingSpotId, setSavingSpotId] = useState<string | null>(null)

  // Carga spots desde Supabase
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await spotsService.getAllSpots()
        setSpots(data)
      } catch (err) {
        addToast({ type: 'error', message: 'Error cargando spots' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUrl(newUrl), 500)
    return () => clearTimeout(timer)
  }, [newUrl])

  const filteredSpots = spots.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const spotsWithoutVideos = spots.filter(s => s.tiktokUrls.length === 0)

  // Guarda en Supabase
  const handleAddVideo = async (spotId: string) => {
    if (!newUrl) return
    const spot = spots.find(s => s.id === spotId)
    if (!spot) return

    try {
      setSavingSpotId(spotId)
      const updatedUrls = [...spot.tiktokUrls, newUrl]
      await spotsService.updateSpot(spotId, { tiktokUrls: updatedUrls })
      setSpots(prev => prev.map(s =>
        s.id === spotId ? { ...s, tiktokUrls: updatedUrls } : s
      ))
      setNewUrl('')
      addToast({ type: 'success', message: 'Video guardado ✓' })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error guardando video' })
    } finally {
      setSavingSpotId(null)
    }
  }

  // Elimina en Supabase
  const handleDeleteVideo = async (spotId: string, index: number) => {
    const spot = spots.find(s => s.id === spotId)
    if (!spot) return

    try {
      const updatedUrls = spot.tiktokUrls.filter((_, i) => i !== index)
      await spotsService.updateSpot(spotId, { tiktokUrls: updatedUrls })
      setSpots(prev => prev.map(s =>
        s.id === spotId ? { ...s, tiktokUrls: updatedUrls } : s
      ))
      addToast({ type: 'success', message: 'Video eliminado' })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error eliminando video' })
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
      <Loader2 size={32} className="animate-spin" color="var(--orange)" />
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="adm-page">
      <header>
        <h1 className="adm-title">TikToks por spot</h1>
        <p className="adm-subtitle">
          {spots.reduce((acc, s) => acc + s.tiktokUrls.length, 0)} videos totales · {spots.length} spots
        </p>
      </header>

      {spotsWithoutVideos.length > 0 && (
        <div style={{ background: 'rgba(255,170,59,0.1)', border: '1px solid rgba(255,170,59,0.2)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 220px', minWidth: 0 }}>
            <AlertCircle color="var(--amber)" size={20} />
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', fontWeight: 600, margin: 0 }}>
                {spotsWithoutVideos.length} spots sin videos de TikTok
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--gray)', margin: 0 }}>
                Añade videos para enriquecer la experiencia
              </p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setSearchTerm(spotsWithoutVideos[0].name)}>
            Ver spots sin videos
          </button>
        </div>
      )}

      <div className="adm-search" style={{ minWidth: 0 }}>
        <Search size={16} />
        <input type="text" className="adm-input" placeholder="Buscar spot..." style={{ padding: '11px 12px 11px 36px' }}
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredSpots.map(spot => (
          <div key={spot.id} style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
            <div
              onClick={() => setExpandedSpotId(expandedSpotId === spot.id ? null : spot.id)}
              style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <img src={spot.photoUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--white)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.name}</h3>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: spot.tiktokUrls.length > 0 ? 'var(--amber)' : '#ef4444' }}>
                    {spot.tiktokUrls.length > 0 ? `${spot.tiktokUrls.length} videos 🎬` : 'Sin videos ⚠️'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation(); setExpandedSpotId(spot.id) }} aria-label="Añadir video">
                  <Plus size={14} /> <span className="adm-hide-sm">Añadir video</span>
                </button>
                {expandedSpotId === spot.id ? <ChevronUp size={18} color="var(--gray)" /> : <ChevronDown size={18} color="var(--gray)" />}
              </div>
            </div>

            <AnimatePresence>
              {expandedSpotId === spot.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid var(--border)' }}
                >
                  <div style={{ padding: 'clamp(14px, 3vw, 20px)' }}>
                    <div className="adm-cards" style={{ ['--adm-card-min' as string]: '200px', marginBottom: '24px' }}>
                      {spot.tiktokUrls.map((url, i) => (
                        <div key={i} style={{ background: 'var(--card)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative' }}>
                          <button
                            onClick={() => handleDeleteVideo(spot.id, i)}
                            style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', borderRadius: '50%', background: '#ef4444', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <Trash2 size={12} />
                          </button>
                          <TiktokPreview url={url} />
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--gray)', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {url}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: 'var(--card)', border: '1px dashed var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '12px' }}>URL de TikTok</p>
                      <div style={{ display: 'flex', gap: '10px 12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="https://www.tiktok.com/@user/video/..."
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          className="adm-input"
                          style={{ flex: '1 1 220px', width: 'auto', minWidth: 0 }}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAddVideo(spot.id)}
                          disabled={!newUrl || savingSpotId === spot.id}
                        >
                          {savingSpotId === spot.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : 'Guardar video'}
                        </button>
                      </div>
                      <AnimatePresence>
                        {debouncedUrl && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <TiktokPreview url={debouncedUrl} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  )
}