import { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Plus, Edit, Check, X, ExternalLink, Eye, EyeOff, Copy, Trash2,
  LayoutGrid, List, MapPin, Clock, CheckCircle2, AlertTriangle, Loader2, Image as ImageIcon, Star,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AdminTable, { Column } from '../../components/admin/AdminTable'
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog'
import StatusBadge from '../../components/admin/StatusBadge'
import SpotFormModal from '../../components/shared/SpotFormModal'
import { CATEGORY_LABELS } from '../../lib/constants'
import { getSpotHealth, getSpotScore, scoreColor, spotPhotos, SPOT_ISSUE_LABELS, type SpotIssue } from '../../lib/spotHealth'
import { useUIStore } from '../../stores/useUIStore'
import type { Spot } from '../../types/spot'
import { spotsService } from '../../services/spots'
import { categoriesService, type Category } from '../../services/categories'
import { supabase } from '../../lib/supabase'

type StatusTab = 'todos' | 'publicados' | 'pendientes' | 'ocultos'
type ViewMode = 'tabla' | 'grilla'

const TAB_STATUS: Record<Exclude<StatusTab, 'todos'>, Spot['status']> = {
  publicados: 'verified',
  pendientes: 'pending',
  ocultos: 'rejected',
}

// En el admin, "rejected" funciona como "oculto para turistas".
const STATUS_LABEL: Record<Spot['status'], string> = {
  verified: 'Publicado',
  pending: 'Pendiente',
  rejected: 'Oculto',
}

const VIEW_KEY = 'burrito-admin-spots-view'
// Por debajo de esto una ficha cuenta como "incompleta".
const HEALTHY_SCORE = 75

function readView(): ViewMode {
  // Sin preferencia guardada: tarjetas en teléfono (la tabla obliga a desplazarse de lado).
  const fallback: ViewMode = window.innerWidth < 768 ? 'grilla' : 'tabla'
  try {
    const v = localStorage.getItem(VIEW_KEY)
    return v === 'grilla' || v === 'tabla' ? v : fallback
  } catch { return fallback }
}

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (!Number.isFinite(days)) return '—'
  if (days < 1) return 'hoy'
  if (days < 30) return `hace ${days}d`
  if (days < 365) return `hace ${Math.floor(days / 30)}m`
  return `hace ${Math.floor(days / 365)}a`
}

export default function AdminSpotsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { addToast } = useUIStore()
  const searchRef = useRef<HTMLInputElement>(null)

  const [spots, setSpots] = useState<Spot[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingSpots, setLoadingSpots] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<StatusTab>(() => {
    const p = searchParams.get('estado')
    return p === 'publicados' || p === 'pendientes' || p === 'ocultos' ? p : 'todos'
  })
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('categoria') ?? '')
  const [issueFilter, setIssueFilter] = useState<SpotIssue | 'incompletos' | ''>(() => {
    const c = searchParams.get('contenido')
    return c && (c === 'incompletos' || c in SPOT_ISSUE_LABELS) ? c as SpotIssue | 'incompletos' : ''
  })
  const [view, setView] = useState<ViewMode>(readView)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Spot[] | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const loadSpots = async () => {
      try {
        setLoadingSpots(true)
        const [data, cats] = await Promise.all([
          spotsService.getAllSpots(),
          categoriesService.getAll().catch(() => [] as Category[]),
        ])
        setSpots(data)
        setCategories(cats)
      } catch (err) {
        addToast({ type: 'error', message: 'Error cargando spots' })
      } finally {
        setLoadingSpots(false)
      }
    }
    loadSpots()
  }, [])

  // Enlaces desde el dashboard, notificaciones y el buscador (Ctrl K):
  // ?estado= / ?categoria= / ?contenido= filtran; ?editar=<id> y ?nuevo=1 abren el formulario.
  useEffect(() => {
    const estado = searchParams.get('estado')
    if (estado === 'publicados' || estado === 'pendientes' || estado === 'ocultos' || estado === 'todos') setActiveTab(estado)
    const cat = searchParams.get('categoria')
    if (cat !== null) setCategoryFilter(cat)
    const c = searchParams.get('contenido')
    if (c && (c === 'incompletos' || c in SPOT_ISSUE_LABELS)) setIssueFilter(c as SpotIssue | 'incompletos')

    const editId = searchParams.get('editar')
    const isNew = searchParams.get('nuevo') === '1'
    if (isNew) {
      setEditingSpot(null)
      setIsModalOpen(true)
    } else if (editId) {
      if (loadingSpots) return  // esperar la lista para encontrar el spot
      const spot = spots.find(s => s.id === editId)
      if (spot) { setEditingSpot(spot); setIsModalOpen(true) }
      else addToast({ type: 'error', message: 'Ese spot ya no existe' })
    }
    if (isNew || editId) {
      const next = new URLSearchParams(searchParams)
      next.delete('editar'); next.delete('nuevo')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loadingSpots])

  // "/" enfoca el buscador, como en la mayoría de paneles.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !isModalOpen) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isModalOpen])

  const changeView = (v: ViewMode) => {
    setView(v)
    try { localStorage.setItem(VIEW_KEY, v) } catch { /* sin storage: solo esta sesión */ }
  }

  const categoryInfo = (id: string) => {
    const dyn = categories.find(c => c.id === id)
    if (dyn) return { label: dyn.label, emoji: dyn.emoji, color: dyn.color }
    return CATEGORY_LABELS[id] ?? { label: id || 'Sin categoría', emoji: '📌', color: 'var(--gray)' }
  }

  // Puntaje de contenido por spot, calculado una vez por lista.
  const scores = useMemo(() => {
    const m = new Map<string, number>()
    spots.forEach(s => m.set(s.id, getSpotScore(s)))
    return m
  }, [spots])

  const counts = useMemo(() => ({
    todos: spots.length,
    publicados: spots.filter(s => s.status === 'verified').length,
    pendientes: spots.filter(s => s.status === 'pending').length,
    ocultos: spots.filter(s => s.status === 'rejected').length,
    incompletos: spots.filter(s => (scores.get(s.id) ?? 0) < HEALTHY_SCORE).length,
  }), [spots, scores])

  const filteredSpots = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return spots.filter(spot => {
      const matchesSearch = !q ||
        spot.name.toLowerCase().includes(q) ||
        (spot.address ?? '').toLowerCase().includes(q) ||
        (spot.brandName ?? '').toLowerCase().includes(q)
      const matchesTab = activeTab === 'todos' || spot.status === TAB_STATUS[activeTab]
      const matchesCategory = !categoryFilter || spot.category === categoryFilter
      const matchesIssue =
        !issueFilter ||
        (issueFilter === 'incompletos'
          ? (scores.get(spot.id) ?? 0) < HEALTHY_SCORE
          : !getSpotHealth(spot).find(c => c.id === issueFilter)?.ok)
      return matchesSearch && matchesTab && matchesCategory && matchesIssue
    })
  }, [searchTerm, activeTab, categoryFilter, issueFilter, spots, scores])

  // La selección solo vive sobre lo que se ve: al filtrar se descarta lo oculto.
  useEffect(() => {
    setSelected(prev => {
      const visible = new Set(filteredSpots.map(s => s.id))
      const next = new Set([...prev].filter(id => visible.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [filteredSpots])

  const hasFilters = !!(searchTerm || activeTab !== 'todos' || categoryFilter || issueFilter)
  const clearFilters = () => { setSearchTerm(''); setActiveTab('todos'); setCategoryFilter(''); setIssueFilter('') }

  // ── Acciones ──────────────────────────────────────────
  const updateStatus = async (ids: string[], status: Spot['status']) => {
    if (ids.length === 0) return
    setBusy(true)
    try {
      await Promise.all(ids.map(id => spotsService.updateStatus(id, status)))
      setSpots(prev => prev.map(s => ids.includes(s.id) ? { ...s, status } : s))
      const n = ids.length > 1 ? `${ids.length} spots` : 'Spot'
      addToast({
        type: 'success',
        message: status === 'verified'
          ? `${n} publicado${ids.length > 1 ? 's' : ''} — visible para turistas ✓`
          : status === 'rejected'
            ? `${n} oculto${ids.length > 1 ? 's' : ''} para turistas`
            : 'Estado actualizado',
      })
      setSelected(new Set())
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error' })
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const ids = deleteTarget.map(s => s.id)
    setBusy(true)
    try {
      await Promise.all(ids.map(id => spotsService.deleteSpot(id)))
      setSpots(prev => prev.filter(s => !ids.includes(s.id)))
      setSelected(new Set())
      addToast({ type: 'success', message: ids.length > 1 ? `${ids.length} spots eliminados` : 'Spot eliminado' })
    } catch (err: any) {
      // Lo más común: tiene reseñas, QR o beneficios que lo referencian.
      addToast({ type: 'error', message: `No se pudo eliminar: ${err.message ?? 'error'}. Prueba ocultarlo.` })
    } finally {
      setBusy(false)
      setDeleteTarget(null)
    }
  }

  const duplicateSpot = async (spot: Spot) => {
    try {
      const copy = await spotsService.createSpot({
        ...spot, // mapToRow ignora id y createdAt: la copia sale con id nuevo
        name: `${spot.name} (copia)`,
        status: 'pending',
        rating: 0,
        reviewCount: 0,
        review_count: 0,
      } as any)
      setSpots(prev => [copy, ...prev])
      addToast({ type: 'success', message: 'Copia creada como pendiente — edítala antes de publicar' })
      setEditingSpot(copy)
      setIsModalOpen(true)
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error duplicando' })
    }
  }

  const openAddModal = () => { setEditingSpot(null); setIsModalOpen(true) }
  const openEditModal = (spot: Spot) => { setEditingSpot(spot); setIsModalOpen(true) }

  const handleSave = async (data: any) => {
    try {
      let spotId: string
      if (editingSpot) {
        const updated = await spotsService.updateSpot(editingSpot.id, data)
        setSpots(prev => prev.map(s => s.id === editingSpot.id ? updated : s))
        spotId = editingSpot.id
      } else {
        const newSpot = await spotsService.createSpot({
          churreId: 'admin', ...data, status: 'verified', tiktokUrls: [],
        })
        setSpots(prev => [newSpot, ...prev])
        spotId = newSpot.id

        // generacion de codido QR
        const qrCode = `BURRITO-${newSpot.name.toUpperCase().replace(/\s+/g, '-')}-${Date.now().toString(36).toUpperCase()}`
        await supabase.from('spot_qr_codes').insert({
          spot_id: newSpot.id,
          code: qrCode,
          active: true,
        })
      }

      // Beneficios quitados en el formulario: antes solo desaparecían de la vista.
      const removedIds: string[] = data.removedBenefitIds ?? []
      if (removedIds.length > 0) {
        const { error } = await supabase.from('spot_benefits').delete().in('id', removedIds)
        if (error) throw error
      }

      const newBenefits = (data.benefits ?? []).filter((b: any) => b.id?.startsWith('new-'))
      if (newBenefits.length > 0) {
        await supabase.from('spot_benefits').insert(
          newBenefits.map((b: any) => ({
            spot_id: spotId,
            type: b.type,
            title: b.title,
            description: b.description,
            code: b.code,
            discount_pct: b.discount_pct,
            valid_until: b.valid_until || null,
            active: true,
          }))
        )
      }

      addToast({ type: 'success', message: editingSpot ? 'Spot actualizado ✓' : 'Spot creado ✓' })
      setIsModalOpen(false)
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error' })
    }
  }

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const allVisibleSelected = filteredSpots.length > 0 && filteredSpots.every(s => selected.has(s.id))
  const toggleSelectAll = () =>
    setSelected(allVisibleSelected ? new Set() : new Set(filteredSpots.map(s => s.id)))

  // ── Piezas reutilizadas por tabla y grilla ───────────
  const categoryChip = (id: string) => {
    const c = categoryInfo(id)
    return (
      <span className="adm-chip" style={{ color: c.color, borderColor: `${c.color}33`, background: `${c.color}10` }}>
        {c.emoji} {c.label}
      </span>
    )
  }

  const healthMeter = (spot: Spot) => {
    const score = scores.get(spot.id) ?? 0
    const missing = getSpotHealth(spot).filter(c => !c.ok)
    return (
      <div title={missing.length ? `Falta: ${missing.map(m => m.label.toLowerCase()).join(', ')}` : 'Ficha completa'}
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="adm-meter"><span style={{ width: `${score}%`, background: scoreColor(score) }} /></div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: scoreColor(score), minWidth: '30px' }}>{score}%</span>
      </div>
    )
  }

  const rowActions = (spot: Spot) => (
    <div style={{ display: 'flex', gap: '2px' }} onClick={e => e.stopPropagation()}>
      <button className="adm-icon-btn" title="Editar" onClick={() => openEditModal(spot)}><Edit size={15} /></button>
      {spot.status === 'pending' && (
        <>
          <button className="adm-icon-btn" data-tone="ok" title="Aprobar y publicar" style={{ color: '#22c55e' }}
            disabled={busy} onClick={() => updateStatus([spot.id], 'verified')}><Check size={15} /></button>
          <button className="adm-icon-btn" data-tone="danger" title="Rechazar (ocultar)" style={{ color: '#ef4444' }}
            disabled={busy} onClick={() => updateStatus([spot.id], 'rejected')}><X size={15} /></button>
        </>
      )}
      {spot.status === 'verified' && (
        <button className="adm-icon-btn" title="Ocultar para turistas" disabled={busy}
          onClick={() => updateStatus([spot.id], 'rejected')}><EyeOff size={15} /></button>
      )}
      {spot.status === 'rejected' && (
        <button className="adm-icon-btn" data-tone="ok" title="Publicar — visible para turistas" disabled={busy}
          onClick={() => updateStatus([spot.id], 'verified')}><Eye size={15} /></button>
      )}
      <button className="adm-icon-btn" title="Duplicar (p. ej. otra sede)" onClick={() => duplicateSpot(spot)}><Copy size={15} /></button>
      <button className="adm-icon-btn" title="Ver en app" onClick={() => navigate(`/app/explorar?spotId=${spot.id}`)}><ExternalLink size={15} /></button>
      <button className="adm-icon-btn" data-tone="danger" title="Eliminar" onClick={() => setDeleteTarget([spot])}><Trash2 size={15} /></button>
    </div>
  )

  const thumb = (spot: Spot, size = 44) => {
    const src = spotPhotos(spot)[0]
    return (
      <div style={{ width: size, height: size, borderRadius: '10px', overflow: 'hidden', background: 'var(--dim)', flexShrink: 0 }}>
        {src
          ? <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div className="adm-noimg" style={{ fontSize: '16px' }}><ImageIcon size={16} /></div>}
      </div>
    )
  }

  const columns: Column<Spot>[] = [
    {
      header: (
        <input type="checkbox" className="adm-checkbox" aria-label="Seleccionar todos"
          checked={allVisibleSelected} onChange={toggleSelectAll} onClick={e => e.stopPropagation()} />
      ),
      width: '36px',
      accessor: (spot) => (
        <input type="checkbox" className="adm-checkbox" aria-label={`Seleccionar ${spot.name}`}
          checked={selected.has(spot.id)} onChange={() => toggleSelect(spot.id)} onClick={e => e.stopPropagation()} />
      ),
    },
    {
      header: 'Spot',
      sortable: true,
      sortValue: (spot) => spot.name.toLowerCase(),
      accessor: (spot) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
          {thumb(spot)}
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 600, color: 'var(--white)', margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '260px' }}>{spot.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {categoryChip(spot.category)}
              {spot.address && (
                <span style={{ fontSize: '11px', color: 'var(--gray)', display: 'inline-flex', alignItems: 'center', gap: '2px', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <MapPin size={10} />{spot.address}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Estado',
      sortable: true,
      sortValue: (spot) => STATUS_LABEL[spot.status],
      accessor: (spot) => <StatusBadge status={STATUS_LABEL[spot.status]} />,
    },
    {
      header: 'Contenido',
      sortable: true,
      sortValue: (spot) => scores.get(spot.id) ?? 0,
      accessor: (spot) => healthMeter(spot),
    },
    {
      header: 'Rating',
      sortable: true,
      sortValue: (spot) => spot.rating || 0,
      accessor: (spot) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Star size={12} fill="var(--yellow)" color="var(--yellow)" />
          <span style={{ fontWeight: 700 }}>{spot.rating ? spot.rating.toFixed(1) : '—'}</span>
          <span style={{ color: 'var(--gray)', fontSize: '11px' }}>({spot.reviewCount ?? 0})</span>
        </div>
      ),
    },
    {
      header: 'Creado',
      sortable: true,
      sortValue: (spot) => spot.createdAt ?? '',
      accessor: (spot) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gray)' }}
          title={spot.createdAt ? new Date(spot.createdAt).toLocaleString('es-PE') : ''}>
          {spot.createdAt ? timeAgo(spot.createdAt) : '—'}
        </span>
      ),
    },
    { header: '', accessor: (spot) => rowActions(spot) },
  ]

  const statTiles: { key: StatusTab | 'incompletos'; label: string; value: number; hint: string; icon: React.ReactNode }[] = [
    { key: 'publicados', label: 'Publicados', value: counts.publicados, hint: 'Visibles para turistas', icon: <CheckCircle2 size={12} color="#22c55e" /> },
    { key: 'pendientes', label: 'Por revisar', value: counts.pendientes, hint: counts.pendientes ? 'Sugeridos por churres' : 'Todo al día', icon: <Clock size={12} color="#f59e0b" /> },
    { key: 'ocultos', label: 'Ocultos', value: counts.ocultos, hint: 'Rechazados o pausados', icon: <EyeOff size={12} /> },
    { key: 'incompletos', label: 'Fichas flojas', value: counts.incompletos, hint: `Contenido < ${HEALTHY_SCORE}%`, icon: <AlertTriangle size={12} color="#ef4444" /> },
  ]

  const onStatClick = (key: StatusTab | 'incompletos') => {
    if (key === 'incompletos') {
      setIssueFilter(f => f === 'incompletos' ? '' : 'incompletos')
    } else {
      setActiveTab(t => t === key ? 'todos' : key)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="adm-page">

      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-title">Spots</h1>
          <p className="adm-subtitle">
            {loadingSpots ? 'Cargando…' : `${counts.todos} lugares · ${counts.pendientes} por revisar`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Nuevo spot
        </button>
      </div>

      {/* Resumen — cada tarjeta filtra la lista */}
      <div className="adm-stats">
        {statTiles.map(t => (
          <button key={t.key} className="adm-stat" onClick={() => onStatClick(t.key)}
            data-active={t.key === 'incompletos' ? issueFilter === 'incompletos' : activeTab === t.key}>
            <span className="adm-stat-label">{t.icon}{t.label}</span>
            <span className="adm-stat-value">{loadingSpots ? '—' : t.value}</span>
            <span className="adm-stat-hint">{t.hint}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="adm-panel adm-toolbar">
        <div className="adm-search">
          <Search size={16} />
          <input ref={searchRef} type="text" className="adm-input" placeholder="Buscar por nombre, dirección o marca…"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          {!searchTerm && <kbd>/</kbd>}
        </div>

        <div className="adm-seg" role="group" aria-label="Filtrar por estado">
          {(['todos', 'publicados', 'pendientes', 'ocultos'] as StatusTab[]).map(tab => (
            <button key={tab} aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)}>
              <span style={{ textTransform: 'capitalize' }}>{tab}</span>
              <span className="adm-count">{counts[tab]}</span>
            </button>
          ))}
        </div>

        <select className="adm-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.emoji} {c.label} ({spots.filter(s => s.category === c.id).length})</option>
          ))}
        </select>

        <select className="adm-select" value={issueFilter} onChange={e => setIssueFilter(e.target.value as any)} aria-label="Contenido">
          <option value="">Cualquier contenido</option>
          <option value="incompletos">⚠️ Fichas flojas</option>
          {(Object.keys(SPOT_ISSUE_LABELS) as SpotIssue[]).map(k => (
            <option key={k} value={k}>{SPOT_ISSUE_LABELS[k]}</option>
          ))}
        </select>

        <div className="adm-seg" role="group" aria-label="Vista">
          <button aria-pressed={view === 'tabla'} onClick={() => changeView('tabla')} title="Vista tabla"><List size={15} /></button>
          <button aria-pressed={view === 'grilla'} onClick={() => changeView('grilla')} title="Vista tarjetas"><LayoutGrid size={15} /></button>
        </div>
      </div>

      {hasFilters && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '-8px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--gray)' }}>
          Mostrando {filteredSpots.length} de {spots.length}
          <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ padding: '4px 10px', fontSize: '12px' }}>
            <X size={12} /> Limpiar filtros
          </button>
        </div>
      )}

      {/* Acciones en lote */}
      {selected.size > 0 && (
        <div className="adm-bulk">
          <strong>{selected.size} seleccionado{selected.size > 1 ? 's' : ''}</strong>
          <span style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => updateStatus([...selected], 'verified')}>
            <Eye size={14} /> Publicar
          </button>
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => updateStatus([...selected], 'rejected')}>
            <EyeOff size={14} /> Ocultar
          </button>
          <button className="btn btn-ghost btn-sm" disabled={busy} style={{ color: '#ef4444' }}
            onClick={() => setDeleteTarget(spots.filter(s => selected.has(s.id)))}>
            <Trash2 size={14} /> Eliminar
          </button>
          <button className="adm-icon-btn" title="Quitar selección" onClick={() => setSelected(new Set())}><X size={15} /></button>
        </div>
      )}

      {/* Lista */}
      {loadingSpots ? (
        <div className="adm-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '64px 0', color: 'var(--gray)' }}>
          <Loader2 size={20} className="adm-spin" /> Cargando spots…
        </div>
      ) : view === 'tabla' ? (
        <div className="adm-panel" style={{ overflow: 'hidden' }}>
          <AdminTable
            columns={columns}
            data={filteredSpots}
            pageSize={15}
            rowKey={s => s.id}
            onRowClick={openEditModal}
            isRowHighlighted={s => selected.has(s.id)}
            emptyMessage={hasFilters ? 'Ningún spot coincide con los filtros' : 'Aún no hay spots. Crea el primero.'}
          />
        </div>
      ) : filteredSpots.length === 0 ? (
        <div className="adm-panel" style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--gray)', fontFamily: 'var(--font-body)' }}>
          {hasFilters ? 'Ningún spot coincide con los filtros' : 'Aún no hay spots. Crea el primero.'}
        </div>
      ) : (
        <div className="adm-grid">
          {filteredSpots.map(spot => {
            const photos = spotPhotos(spot)
            const missing = getSpotHealth(spot).filter(c => !c.ok)
            return (
              <div key={spot.id} className="adm-spot-card" data-selected={selected.has(spot.id)}>
                <div className="adm-spot-cover" onClick={() => openEditModal(spot)}>
                  {photos[0]
                    ? <img src={photos[0]} alt={spot.name} loading="lazy" />
                    : <div className="adm-noimg"><ImageIcon size={26} /></div>}
                  <input type="checkbox" className="adm-checkbox adm-check" aria-label={`Seleccionar ${spot.name}`}
                    checked={selected.has(spot.id)} onChange={() => toggleSelect(spot.id)} onClick={e => e.stopPropagation()} />
                  <span className="adm-cover-badge"><StatusBadge status={STATUS_LABEL[spot.status]} /></span>
                  {photos.length > 0 && <span className="adm-photo-count">{photos.length} 📷</span>}
                </div>
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', color: 'var(--white)', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.name}</p>
                    {categoryChip(spot.category)}
                  </div>
                  {healthMeter(spot)}
                  {missing.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {missing.slice(0, 3).map(m => <span key={m.id} className="adm-chip" data-tone="warn">{m.label}</span>)}
                      {missing.length > 3 && <span className="adm-chip">+{missing.length - 3}</span>}
                    </div>
                  )}
                </div>
                <div className="adm-spot-actions">{rowActions(spot)}</div>
              </div>
            )
          })}
        </div>
      )}

      <SpotFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingSpot}
      />

      <AdminConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        variant="danger"
        confirmLabel="Eliminar"
        title={deleteTarget && deleteTarget.length > 1 ? `¿Eliminar ${deleteTarget.length} spots?` : `¿Eliminar "${deleteTarget?.[0]?.name ?? ''}"?`}
        description="Se borra de forma permanente junto con su ficha. Si solo quieres que no aparezca en la app, mejor ocúltalo."
      />
    </motion.div>
  )
}
