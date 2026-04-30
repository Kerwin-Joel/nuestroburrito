import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Save, BookOpen, Loader2, X, Map, List, Plus } from 'lucide-react'
import Timeline from '../../components/tourist/Timeline'
import ReminderPanel from '../../components/tourist/ReminderPanel'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { useItinerary } from '../../hooks/useItinerary'
import { useUIStore } from '../../stores/useUIStore'
import { whatsappService } from '../../services/whatsapp'
import { itinerariesService } from '../../services/itineraries'
import { lazy, Suspense } from 'react'
import { useAutoSave } from '../../hooks/useAutoSave'
import SaveFAB from '../../components/tourist/SaveFAB'
import CreateItineraryModal from './CreateItineraryModal'
import { useAuthStore } from '../../stores/useAuthStore'
import BurritoDonkey from '../../components/shared/Burritodonkey'


export default function ItinerarioPage() {
  const { current, loadDemo, setCurrent, clear } = useItineraryStore()
  const { status: autoSaveStatus } = useAutoSave()
  const { setSelectingSpot } = useItineraryStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [discarded, setDiscarded] = useState(false)
  const { user } = useAuthStore()

  const isNew = !current?.id || current.id === 'itinerary-demo'
  const ItineraryMapView = lazy(
    () => import('../../components/tourist/ItineraryMapView')
  )

  const { save } = useItinerary()
  const { addToast } = useUIStore()
  const navigate = useNavigate()

  const [saving, setSaving] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(current?.title || '')
  const [editingMeta, setEditingMeta] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [showMap, setShowMap] = useState(false)

  const isReadOnly = current?.status === 'completed' || current?.status === 'in_progress'

  const handleCancel = () => {
    clear()
    sessionStorage.setItem('burrito-discarded', 'true')
    // navigate('/app') // ← faltaba esto
  }
  // Auto-completar cuando todos los spots están visitados
  useEffect(() => {
    if (!current || current.status !== 'in_progress') return
    if (current.stops.length === 0) return

    const allVisited = current.stops.every(s => s.visited)
    if (!allVisited) return

    const autoComplete = async () => {
      try {
        if (current.id && current.id !== 'itinerary-demo') {
          await itinerariesService.updateStatus(current.id, 'completed')
        }
        setCurrent({ ...current, status: 'completed' })
        addToast({ type: 'success', message: '🫏 ¡Piura conquistada! Itinerario completado' })
      } catch (err: any) {
        addToast({ type: 'error', message: err.message ?? 'Error' })
      }
    }

    autoComplete()
  }, [current?.stops])

  useEffect(() => {
    const wasDiscarded = sessionStorage.getItem('burrito-discarded')
    if (!current && user?.id && !wasDiscarded) {
      itinerariesService.getByUser(user.id).then(itineraries => {
        const inProgress = itineraries.find(i => i.status === 'in_progress')
        if (inProgress) setCurrent(inProgress)
      })
    }
  }, []) // ← solo al montar, sin dependencias

  const handleTitleSave = () => {
    if (!current || !titleInput.trim()) return
    setCurrent({ ...current, title: titleInput.trim() })
    setEditingTitle(false)
  }

  const handleWhatsApp = async () => {
    if (!current) return

    const text = `🫔 *${current.title}*\n\n` +
      current.stops.map((s, i) =>
        `${i + 1}. *${s.time}* — ${s.spotName}${s.localTip ? `\n   💡 ${s.localTip}` : ''}`
      ).join('\n\n') +
      `\n\n_Generado con Burrito · La guía piurana_ 🫏`

    // Sin número → el usuario elige con quién compartir
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')

    addToast({ type: 'info', message: '📱 Abriendo WhatsApp...' })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await save()
      navigate('/app/perfil')
    } catch {
      // Error manejado en el hook
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    if (!current) return
    setCompleting(true)
    try {
      if (current.id && current.id !== 'itinerary-demo') {
        await itinerariesService.updateStatus(current.id, 'in_progress')
      }
      setCurrent({ ...current, status: 'in_progress' })
      addToast({ type: 'success', message: '🫏 ¡A recorrer Piura!' })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error' })
    } finally {
      setCompleting(false)
    }
  }

  // Reemplaza el empty state
  if (!current) {
    return (
      <div style={{
        height: '100%',           // ← cambia 100dvh por 100%
        minHeight: '60vh',        // ← fallback por si acaso
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '24px',
      }}>
        {/* Burrito 3D en vez del emoji */}
        <div style={{ width: '200px', height: '200px' }}>
          <BurritoDonkey autoRotate />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '26px',
            fontWeight: 800, color: 'var(--white)',
            letterSpacing: '-1px', margin: '0 0 8px'
          }}>
            Tu día piurano te espera
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
            Crea tu ruta o genera una con IA
          </p>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: '10px',
          width: '100%', maxWidth: '320px', paddingBottom: '100px'
        }}>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ width: '100%', padding: '16px' }}
          >
            ✏️ Crear mi propia ruta
          </button>
          <Link to="/app" className="btn btn-ghost"
            style={{ width: '100%', padding: '16px', textAlign: 'center' }}>
            🤖 Generar con IA
          </Link>
        </div>

        <CreateItineraryModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '140px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link to="/app" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: 'var(--muted)', textDecoration: 'none',
            fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '16px'
          }}>
            <ArrowLeft size={16} /> Volver
          </Link>

          {/* Título editable */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {editingTitle ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleTitleSave()
                    if (e.key === 'Escape') setEditingTitle(false)
                  }}
                  autoFocus
                  className="input"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '28px',
                    fontWeight: 800,
                    letterSpacing: '-1.5px',
                    color: 'var(--white)',
                    background: 'var(--card2)',
                    border: '1px solid var(--orange)',
                    borderRadius: '10px',
                    padding: '6px 14px',
                    maxWidth: '340px',
                  }}
                />
                <button onClick={handleTitleSave} className="btn btn-primary btn-sm">✓</button>
                <button onClick={() => setEditingTitle(false)} className="btn btn-ghost btn-sm">✕</button>
              </div>
            ) : (
              <h1
                onClick={() => {
                  if (isReadOnly) return
                  setTitleInput(current.title)
                  setEditingTitle(true)
                }}
                title="Click para editar"
                style={{
                  cursor: isReadOnly ? 'default' : 'pointer',
                  fontFamily: 'var(--font-display)',
                  fontSize: '32px',
                  fontWeight: 800,
                  letterSpacing: '-1.5px',
                  color: 'var(--white)',
                  margin: 0,
                  borderBottom: isReadOnly
                    ? 'none'
                    : '2px dashed rgba(255,85,0,0.3)',
                  paddingBottom: '2px',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--orange)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
              >
                {current.title}
              </h1>
            )}
            <span className="badge badge-orange">
              <BookOpen size={10} /> {current.stops.length} PARADAS
            </span>
            <button
              onClick={handleCancel}
              className="btn btn-ghost btn-sm"
              style={{
                marginLeft: 'auto',
                color: 'var(--muted)',
                fontSize: '12px',
              }}
            >
              <X size={14} /> Descartar
            </button>
          </div>

          {/* Meta editable (grupo + tiempo) */}
          <div style={{ marginTop: '6px', marginBottom: '20px' }}>
            {editingMeta ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  value={current.preferences.group}
                  onChange={e => setCurrent({
                    ...current,
                    preferences: { ...current.preferences, group: e.target.value as any }
                  })}
                  className="input"
                  style={{ fontSize: '13px', padding: '6px 12px', height: 'auto', width: 'auto' }}
                >
                  <option value="solo">Solo/a</option>
                  <option value="couple">En pareja</option>
                  <option value="family">Familia</option>
                  <option value="friends">Amigos</option>
                </select>
                <select
                  value={current.preferences.time}
                  onChange={e => setCurrent({
                    ...current,
                    preferences: { ...current.preferences, time: e.target.value as any }
                  })}
                  className="input"
                  style={{ fontSize: '13px', padding: '6px 12px', height: 'auto', width: 'auto' }}
                >
                  <option value="4h">Visita rápida</option>
                  <option value="6h">Medio día</option>
                  <option value="full">Día completo</option>
                  <option value="weekend">Fin de semana</option>
                </select>
                <button onClick={() => setEditingMeta(false)} className="btn btn-primary btn-sm">✓</button>
              </div>
            ) : (
              <div
                onClick={() => {
                  if (isReadOnly) return
                  setEditingMeta(true)
                }}
                title="Click para editar"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: 'var(--muted)',
                  cursor: isReadOnly ? 'default' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderBottom: '1px dashed var(--border-hover)',
                  paddingBottom: '1px',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--orange)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
              >
                {current.preferences.group === 'solo' ? 'Solo/a' :
                  current.preferences.group === 'couple' ? 'En pareja' :
                    current.preferences.group === 'family' ? 'Familia' : 'Amigos'} ·{' '}
                {current.preferences.time === '4h' ? 'Visita rápida' :
                  current.preferences.time === '6h' ? 'Medio día' :
                    current.preferences.time === 'full' ? 'Día completo' : 'Fin de semana'}
                {!isReadOnly && <span style={{ fontSize: '12px' }}>✏️</span>}
              </div>
            )}
          </div>

          {/* Botones — debajo del meta */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>

            <button
              onClick={() => setShowMap(!showMap)}
              className="btn btn-ghost btn-sm"
              style={{
                flex: 1,
                borderColor: showMap ? 'var(--orange)' : undefined,
                color: showMap ? 'var(--orange)' : undefined,
              }}
            >
              {showMap ? <List size={14} /> : <Map size={14} />}
              {showMap ? 'Lista' : 'Mapa'}
            </button>

            <button
              onClick={handleWhatsApp}
              className="btn btn-ghost btn-sm"
              style={{ flex: 1 }}
            >
              <MessageCircle size={14} /> Compartir
            </button>

            {(!current.status || current.status === 'draft') ? (
              <button
                onClick={handleComplete}
                disabled={completing || current.stops.length === 0}
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, borderColor: 'var(--orange)', color: 'var(--orange)', fontWeight: 700 }}
              >
                {completing ? <Loader2 size={14} className="animate-spin" /> : '🫏'}
                {completing ? 'Iniciando...' : '¡A montar!'}
              </button>
            ) : current.status === 'in_progress' ? (
              <div style={{
                flex: 1, display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'var(--border)',
                border: '1px solid var(--border-hover)',
                color: 'var(--orange)',
                fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600
              }}>
                🫏 En marcha
              </div>
            ) : (
              <div style={{
                flex: 1, display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: '#22c55e',
                fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600
              }}>
                ✓ Completado
              </div>
            )}
          </div>

        </div>

        {/* Barra de progreso */}
        {isReadOnly && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '8px'
            }}>
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: '13px',
                color: 'var(--muted)', fontWeight: 600,
              }}>
                Progreso del itinerario
              </span>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '18px',
                fontWeight: 800, color: 'var(--orange)',
              }}>
                {Math.round(
                  (current.stops.filter(s => s.visited).length / current.stops.length) * 100
                )}%
              </span>
            </div>
            <div style={{
              height: '6px', background: 'var(--card2)',
              borderRadius: '99px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(current.stops.filter(s => s.visited).length / current.stops.length) * 100}%`,
                background: 'var(--orange)',
                borderRadius: '99px',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: '12px',
              color: 'var(--muted)', marginTop: '6px',
            }}>
              {current.stops.filter(s => s.visited).length} de {current.stops.length} spots visitados
            </div>
          </div>
        )}

        {/* Reminders */}
        <ReminderPanel />

        {!isReadOnly && (
          <button
            onClick={() => {
              setSelectingSpot(true)
              navigate('/app/explorar')
            }}
            style={{
              width: '100%',
              padding: '14px',
              marginBottom: '16px',
              background: 'transparent',
              border: '2px dashed var(--border-hover)',
              borderRadius: '12px',
              cursor: 'pointer',
              color: 'var(--orange)',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--orange)'
              e.currentTarget.style.background = 'var(--border)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-hover)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <Plus size={16} /> Añadir spot al itinerario
          </button>
        )}

        {/* Timeline */}
        <Timeline
          readOnly={isReadOnly}        // bloquea edición
          canVisit={current.status === 'in_progress'}  // permite marcar visitado
        />

      </div>
      {/* Mapa de itinerario */}
      {showMap && (
        <Suspense fallback={null}>
          <ItineraryMapView onClose={() => setShowMap(false)} />
        </Suspense>
      )}
      {/* FAB de guardado */}
      <SaveFAB
        status={autoSaveStatus}
        isNew={isNew}
        onSave={handleSave}
        disabled={isReadOnly}
      />
    </div>

  )
}