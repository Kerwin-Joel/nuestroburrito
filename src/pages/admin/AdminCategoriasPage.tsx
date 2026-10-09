import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, X, Check, Loader2, AlertTriangle, ArrowUp, ArrowDown, MapPin, ChevronRight } from 'lucide-react'
import { categoriesService, type Category, type Zone } from '../../services/categories'
import { spotsService } from '../../services/spots'
import { useUIStore } from '../../stores/useUIStore'

const EMOJI_PRESETS = ['🏖️', '🍽️', '🎨', '⛰️', '🧗', '🛍️', '🧘', '🏨', '🍹', '🎉', '⛪', '🌿', '🐟', '🎶', '☕', '📸']
const COLOR_PRESETS = ['#FF5500', '#e63946', '#f59e0b', '#22c55e', '#00b4d8', '#3b82f6', '#7209b7', '#ec4899', '#8b5a2b', '#64748b']

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s_]/g, '').trim().replace(/\s+/g, '_')

// ─── Category Form Modal ─────────────────────────────────
interface CategoryFormProps {
  isOpen: boolean
  initial?: Category | null
  existingIds: string[]
  onClose: () => void
  onSave: (data: { id: string; label: string; emoji: string; color: string }) => Promise<void>
}

function CategoryFormModal({ isOpen, initial, existingIds, onClose, onSave }: CategoryFormProps) {
  const [id, setId] = useState('')
  const [label, setLabel] = useState('')
  const [emoji, setEmoji] = useState('📌')
  const [color, setColor] = useState('#FF5500')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setId(initial?.id ?? '')
    setLabel(initial?.label ?? '')
    setEmoji(initial?.emoji ?? '📌')
    setColor(initial?.color ?? '#FF5500')
  }, [initial, isOpen])

  const finalId = initial ? initial.id : (slugify(id) || slugify(label))
  const duplicate = !initial && !!finalId && existingIds.includes(finalId)
  const canSave = !!label.trim() && !!finalId && !duplicate && !saving

  const handleSubmit = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({ id: finalId, label: label.trim(), emoji, color })
      onClose()
    } catch {
      // el padre ya mostró el toast; el modal queda abierto para corregir
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') handleSubmit() }}
          style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '460px',
            display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '92vh', overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--white)', margin: 0 }}>
              {initial ? 'Editar categoría' : 'Nueva categoría'}
            </h3>
            <button className="adm-icon-btn" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
          </div>

          {/* Preview: así se ve el chip en la app */}
          <div style={{
            borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px',
            background: `${color}12`, border: `1px solid ${color}40`,
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
              {emoji}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>
                {label || 'Nombre de la categoría'}
              </p>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color }}>
                {finalId || 'slug'}
              </span>
            </div>
          </div>

          <Field label="Nombre">
            <input autoFocus className="adm-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="ej: Gastronomía" />
          </Field>

          {!initial && (
            <Field label="ID (slug)" hint={duplicate ? undefined : 'Se usa en los spots y no se puede cambiar después. Se genera del nombre si lo dejas vacío.'}
              error={duplicate ? `Ya existe una categoría con el id "${finalId}"` : undefined}>
              <input className="adm-input" value={id} onChange={e => setId(e.target.value)}
                placeholder={slugify(label) || 'ej: gastronomia'} style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }} />
            </Field>
          )}

          <Field label="Emoji">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {EMOJI_PRESETS.map(e => (
                <button key={e} type="button" className="adm-emoji-btn" aria-pressed={emoji === e} onClick={() => setEmoji(e)}>{e}</button>
              ))}
              <input className="adm-input" value={emoji} onChange={e => setEmoji(e.target.value)} aria-label="Otro emoji"
                style={{ width: '58px', textAlign: 'center', fontSize: '18px', padding: '5px' }} />
            </div>
          </Field>

          <Field label="Color">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {COLOR_PRESETS.map(c => (
                <button key={c} type="button" className="adm-swatch" aria-label={c} aria-pressed={color.toLowerCase() === c.toLowerCase()}
                  onClick={() => setColor(c)} style={{ background: c }} />
              ))}
              <input type="color" value={color} onChange={e => setColor(e.target.value)} aria-label="Color personalizado"
                style={{ width: '32px', height: '30px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: 'transparent', padding: '1px' }} />
            </div>
          </Field>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button onClick={onClose} className="btn btn-ghost">Cancelar</button>
            <button onClick={handleSubmit} disabled={!canSave} className="btn btn-primary" style={{ opacity: canSave ? 1 : 0.5 }}>
              {saving ? <Loader2 size={16} className="adm-spin" /> : <Check size={16} />}
              {initial ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
        {label}
      </label>
      {children}
      {error
        ? <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#ef4444' }}>{error}</span>
        : hint && <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)' }}>{hint}</span>}
    </div>
  )
}

// ─── Delete Modal (con reasignación de spots) ────────────
interface DeleteTarget { type: 'category' | 'zone'; id: string; name: string }

function DeleteModal({ target, spotCount, categories, onConfirm, onCancel }: {
  target: DeleteTarget | null
  spotCount: number
  categories: Category[]
  onConfirm: (reassignTo: string | null) => Promise<void>
  onCancel: () => void
}) {
  const [reassignTo, setReassignTo] = useState('')
  const [working, setWorking] = useState(false)
  useEffect(() => { setReassignTo('') }, [target])
  if (!target) return null

  const needsReassign = target.type === 'category' && spotCount > 0
  const others = categories.filter(c => c.id !== target.id)

  const run = async () => {
    setWorking(true)
    try { await onConfirm(needsReassign ? reassignTo : null) } finally { setWorking(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9999, padding: '20px'
      }}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px',
          display: 'flex', flexDirection: 'column', gap: '18px'
        }}
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={22} color="#ef4444" />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', margin: '0 0 6px' }}>
              ¿Eliminar "{target.name}"?
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--gray)', margin: 0, lineHeight: 1.5 }}>
              {needsReassign
                ? <><strong style={{ color: 'var(--white)' }}>{spotCount} spot{spotCount > 1 ? 's' : ''}</strong> usan esta categoría. Elige a dónde moverlos para que no queden huérfanos en Explorar.</>
                : 'Esta acción no se puede deshacer.'}
            </p>
          </div>
        </div>

        {needsReassign && (
          <select className="adm-select" style={{ width: '100%' }} value={reassignTo} onChange={e => setReassignTo(e.target.value)}>
            <option value="">Mover los spots a…</option>
            {others.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn btn-ghost">Cancelar</button>
          <button onClick={run} disabled={working || (needsReassign && !reassignTo)} className="btn btn-danger"
            style={{ opacity: working || (needsReassign && !reassignTo) ? 0.5 : 1 }}>
            {working ? <Loader2 size={14} className="adm-spin" /> : <Trash2 size={14} />}
            {needsReassign ? 'Mover y eliminar' : 'Eliminar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Zone chip (renombrar con doble clic) ────────────────
function ZoneChip({ zone, onRename, onDelete }: { zone: Zone; onRename: (name: string) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(zone.name)
  useEffect(() => { setValue(zone.name) }, [zone.name])

  const commit = () => {
    setEditing(false)
    if (value.trim() && value.trim() !== zone.name) onRename(value.trim())
    else setValue(zone.name)
  }

  return (
    <motion.div
      layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
      className="adm-chip"
      style={{ padding: '6px 6px 6px 12px', borderRadius: '20px', fontSize: '13px', color: 'var(--white)', background: 'rgba(255,85,0,0.05)', borderColor: 'rgba(255,85,0,0.2)', gap: '6px' }}
    >
      <MapPin size={12} color="var(--orange)" />
      {editing ? (
        <input autoFocus value={value} onChange={e => setValue(e.target.value)} onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setValue(zone.name); setEditing(false) } }}
          style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, width: `${Math.max(6, value.length + 1)}ch` }} />
      ) : (
        <span onDoubleClick={() => setEditing(true)} title="Doble clic para renombrar" style={{ cursor: 'text' }}>{zone.name}</span>
      )}
      <button className="adm-icon-btn" style={{ width: '22px', height: '22px' }} onClick={() => setEditing(true)} title="Renombrar"><Edit size={11} /></button>
      <button className="adm-icon-btn" data-tone="danger" style={{ width: '22px', height: '22px' }} onClick={onDelete} title="Eliminar zona"><X size={12} /></button>
    </motion.div>
  )
}

function ZoneInput({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState('')

  const handleAdd = () => {
    const parts = value.split(',').map(v => v.trim()).filter(Boolean)
    parts.forEach(onAdd)
    setValue('')
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        placeholder="Agregar zonas (separa varias con coma)…"
        className="adm-input"
      />
      <button onClick={handleAdd} disabled={!value.trim()} className="btn btn-ghost btn-sm" style={{ opacity: value.trim() ? 1 : 0.5 }}>
        <Plus size={16} /> Agregar
      </button>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────
export default function AdminCategoriasPage() {
  const { addToast } = useUIStore()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [spotCounts, setSpotCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [cats, zns, spots] = await Promise.all([
        categoriesService.getAll(),
        categoriesService.getAllZones(),
        spotsService.getAllSpots().catch(() => []),
      ])
      setCategories(cats)
      setZones(zns)
      const counts: Record<string, number> = {}
      spots.forEach(s => { counts[s.category] = (counts[s.category] ?? 0) + 1 })
      setSpotCounts(counts)
    } catch (err: any) {
      addToast({ type: 'error', message: 'Error cargando datos: ' + (err.message ?? 'Error desconocido') })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { loadData() }, [loadData])

  // Spots cuya categoría ya no existe: quedan invisibles en los filtros de Explorar.
  const orphanCount = useMemo(() => {
    const ids = new Set(categories.map(c => c.id))
    return Object.entries(spotCounts).filter(([id]) => !ids.has(id)).reduce((a, [, n]) => a + n, 0)
  }, [categories, spotCounts])

  // ── Category CRUD ──────────────────────────────────────
  const handleSaveCategory = async (data: { id: string; label: string; emoji: string; color: string }) => {
    try {
      if (editingCategory) {
        const updated = await categoriesService.update(editingCategory.id, {
          label: data.label, emoji: data.emoji, color: data.color,
        })
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? updated : c))
        addToast({ type: 'success', message: `Categoría "${data.label}" actualizada ✓` })
      } else {
        const nextOrder = Math.max(0, ...categories.map(c => c.sortOrder ?? 0)) + 1
        const created = await categoriesService.create({ ...data, sortOrder: nextOrder })
        setCategories(prev => [...prev, created])
        addToast({ type: 'success', message: `Categoría "${data.label}" creada ✓` })
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error guardando categoría' })
      throw err
    }
  }

  // Intercambia con la vecina y renumera todo: los sort_order viejos pueden venir repetidos.
  const moveCategory = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= categories.length) return
    const reordered = [...categories]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    const withOrder = reordered.map((c, i) => ({ ...c, sortOrder: i + 1 }))
    const previous = categories
    setCategories(withOrder)
    try {
      const changed = withOrder.filter(c => previous.find(p => p.id === c.id)?.sortOrder !== c.sortOrder)
      await Promise.all(changed.map(c => categoriesService.update(c.id, { sortOrder: c.sortOrder })))
    } catch (err: any) {
      setCategories(previous)
      addToast({ type: 'error', message: err.message ?? 'No se pudo reordenar' })
    }
  }

  const handleDeleteConfirm = async (reassignTo: string | null) => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'category') {
        if (reassignTo) {
          await categoriesService.reassignSpots(deleteTarget.id, reassignTo)
          setSpotCounts(prev => ({
            ...prev,
            [reassignTo]: (prev[reassignTo] ?? 0) + (prev[deleteTarget.id] ?? 0),
            [deleteTarget.id]: 0,
          }))
        }
        await categoriesService.delete(deleteTarget.id)
        setCategories(prev => prev.filter(c => c.id !== deleteTarget.id))
      } else {
        await categoriesService.deleteZone(deleteTarget.id)
        setZones(prev => prev.filter(z => z.id !== deleteTarget.id))
      }
      addToast({ type: 'success', message: `"${deleteTarget.name}" eliminado ✓` })
      setDeleteTarget(null)
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error eliminando' })
    }
  }

  // ── Zone CRUD ──────────────────────────────────────────
  const handleAddZone = async (name: string) => {
    if (zones.some(z => z.name.toLowerCase() === name.toLowerCase())) {
      addToast({ type: 'error', message: `La zona "${name}" ya existe` })
      return
    }
    try {
      const created = await categoriesService.createZone(name, zones.length + 1)
      setZones(prev => [...prev, created])
      addToast({ type: 'success', message: `Zona "${name}" agregada ✓` })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error creando zona' })
    }
  }

  const handleRenameZone = async (zone: Zone, name: string) => {
    try {
      const updated = await categoriesService.updateZone(zone.id, { name })
      setZones(prev => prev.map(z => z.id === zone.id ? updated : z))
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error renombrando zona' })
    }
  }

  const openAdd = () => { setEditingCategory(null); setIsFormOpen(true) }
  const openEdit = (cat: Category) => { setEditingCategory(cat); setIsFormOpen(true) }

  const maxCount = Math.max(1, ...categories.map(c => spotCounts[c.id] ?? 0))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-title">Categorías y zonas</h1>
          <p className="adm-subtitle">El orden de aquí es el orden de los filtros en Explorar</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Nueva categoría</button>
      </div>

      {orphanCount > 0 && (
        <div role="alert" className="adm-panel" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.06)', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--white)' }}>
          <AlertTriangle size={16} color="#f59e0b" />
          <span style={{ flex: 1 }}><strong>{orphanCount} spot{orphanCount > 1 ? 's' : ''}</strong> tienen una categoría que ya no existe y no aparecen en los filtros.</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/spots')}>Revisar <ChevronRight size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="adm-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '60px 0', color: 'var(--gray)' }}>
          <Loader2 size={20} className="adm-spin" /> Cargando…
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }} className="categories-grid">

          {/* Categorías */}
          <section className="adm-panel" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--white)', margin: 0 }}>Categorías</h3>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>{categories.length} en total</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map((cat, i) => {
                const count = spotCounts[cat.id] ?? 0
                return (
                  <motion.div key={cat.id} layout className="adm-cat-row" style={{ background: 'var(--card)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <button className="adm-icon-btn" style={{ width: '22px', height: '18px' }} disabled={i === 0}
                        onClick={() => moveCategory(i, -1)} aria-label={`Subir ${cat.label}`}><ArrowUp size={12} /></button>
                      <button className="adm-icon-btn" style={{ width: '22px', height: '18px' }} disabled={i === categories.length - 1}
                        onClick={() => moveCategory(i, 1)} aria-label={`Bajar ${cat.label}`}><ArrowDown size={12} /></button>
                    </div>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${cat.color}1f`, border: `1px solid ${cat.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                      {cat.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--white)', margin: 0 }}>{cat.label}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <div className="adm-meter" style={{ width: '90px' }}>
                          <span style={{ width: `${(count / maxCount) * 100}%`, background: cat.color }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray)' }}>
                          {count} spot{count !== 1 ? 's' : ''} · {cat.id}
                        </span>
                      </div>
                    </div>
                    <div className="adm-cat-actions">
                      <button className="adm-icon-btn" onClick={() => openEdit(cat)} title="Editar"><Edit size={14} /></button>
                      <button className="adm-icon-btn" data-tone="danger" title="Eliminar"
                        onClick={() => setDeleteTarget({ type: 'category', id: cat.id, name: cat.label })}><Trash2 size={14} /></button>
                    </div>
                  </motion.div>
                )
              })}

              {categories.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                  No hay categorías. Crea la primera.
                </div>
              )}
            </div>
          </section>

          {/* Zonas */}
          <section className="adm-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--white)', margin: 0 }}>Zonas de Piura</h3>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>{zones.length} zonas</span>
            </div>
            <ZoneInput onAdd={handleAddZone} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <AnimatePresence>
                {zones.map(zone => (
                  <ZoneChip key={zone.id} zone={zone}
                    onRename={name => handleRenameZone(zone, name)}
                    onDelete={() => setDeleteTarget({ type: 'zone', id: zone.id, name: zone.name })} />
                ))}
              </AnimatePresence>
              {zones.length === 0 && (
                <div style={{ textAlign: 'center', padding: '28px 12px', width: '100%', color: 'var(--gray)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                  No hay zonas. Agrega la primera.
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <CategoryFormModal
        isOpen={isFormOpen}
        initial={editingCategory}
        existingIds={categories.map(c => c.id)}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveCategory}
      />

      <DeleteModal
        target={deleteTarget}
        spotCount={deleteTarget?.type === 'category' ? (spotCounts[deleteTarget.id] ?? 0) : 0}
        categories={categories}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <style>{`
        @media (max-width: 1024px) {
          .categories-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  )
}
