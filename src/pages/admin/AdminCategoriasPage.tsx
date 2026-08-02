import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, X, Check, Loader2, AlertTriangle } from 'lucide-react'
import { categoriesService, type Category, type Zone } from '../../services/categories'
import { useUIStore } from '../../stores/useUIStore'

// ─── Category Form Modal ─────────────────────────────────
interface CategoryFormProps {
  isOpen: boolean
  initial?: Category | null
  onClose: () => void
  onSave: (data: { id: string; label: string; emoji: string; color: string }) => Promise<void>
}

function CategoryFormModal({ isOpen, initial, onClose, onSave }: CategoryFormProps) {
  const [id, setId] = useState('')
  const [label, setLabel] = useState('')
  const [emoji, setEmoji] = useState('📌')
  const [color, setColor] = useState('#ff5500')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setId(initial.id)
      setLabel(initial.label)
      setEmoji(initial.emoji)
      setColor(initial.color)
    } else {
      setId('')
      setLabel('')
      setEmoji('📌')
      setColor('#ff5500')
    }
  }, [initial, isOpen])

  const handleSubmit = async () => {
    if (!label.trim()) return
    const finalId = initial ? initial.id : (id.trim() || label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_'))
    setSaving(true)
    try {
      await onSave({ id: finalId, label: label.trim(), emoji, color })
      onClose()
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
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px',
            display: 'flex', flexDirection: 'column', gap: '20px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--white)', margin: 0 }}>
              {initial ? 'Editar categoría' : 'Nueva categoría'}
            </h3>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--gray)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* ID (solo para nueva) */}
          {!initial && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ID (slug)
              </label>
              <input
                value={id} onChange={e => setId(e.target.value)}
                placeholder="ej: gastronomia"
                style={{
                  background: 'var(--dim)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '10px 14px', color: 'var(--white)',
                  fontFamily: 'var(--font-mono)', fontSize: '13px', outline: 'none'
                }}
              />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)' }}>
                Se genera automáticamente si lo dejas vacío
              </span>
            </div>
          )}

          {/* Label */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Nombre
            </label>
            <input
              value={label} onChange={e => setLabel(e.target.value)}
              placeholder="ej: Gastronomía"
              style={{
                background: 'var(--dim)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '10px 14px', color: 'var(--white)',
                fontFamily: 'var(--font-body)', fontSize: '14px', outline: 'none'
              }}
            />
          </div>

          {/* Emoji + Color */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Emoji
              </label>
              <input
                value={emoji} onChange={e => setEmoji(e.target.value)}
                placeholder="🏖️"
                style={{
                  background: 'var(--dim)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '10px 14px', color: 'var(--white)',
                  fontFamily: 'var(--font-body)', fontSize: '20px', outline: 'none',
                  textAlign: 'center'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Color
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color" value={color} onChange={e => setColor(e.target.value)}
                  style={{
                    width: '42px', height: '42px', border: '1px solid var(--border)',
                    borderRadius: '10px', cursor: 'pointer', background: 'var(--dim)',
                    padding: '2px'
                  }}
                />
                <input
                  value={color} onChange={e => setColor(e.target.value)}
                  style={{
                    flex: 1, background: 'var(--dim)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '10px 14px', color: 'var(--white)',
                    fontFamily: 'var(--font-mono)', fontSize: '13px', outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div style={{
            background: 'var(--dim)', borderRadius: '12px', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: '12px',
            border: `1px solid ${color}22`
          }}>
            <span style={{ fontSize: '24px' }}>{emoji}</span>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', margin: 0, fontWeight: 600 }}>
                {label || 'Vista previa'}
              </p>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color }}>
                {(initial?.id || id || 'slug').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button onClick={onClose} className="btn btn-ghost">Cancelar</button>
            <button
              onClick={handleSubmit}
              disabled={!label.trim() || saving}
              className="btn btn-primary"
              style={{ opacity: !label.trim() || saving ? 0.5 : 1 }}
            >
              {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
              {initial ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Delete Confirmation Modal ───────────────────────────
interface DeleteConfirmProps {
  isOpen: boolean
  itemName: string
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirmModal({ isOpen, itemName, onConfirm, onCancel }: DeleteConfirmProps) {
  if (!isOpen) return null
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9999, padding: '20px'
      }}
    >
      <motion.div
        initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '400px',
          display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <AlertTriangle size={28} color="#ef4444" />
          </div>
        </div>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', margin: '0 0 8px' }}>
            ¿Eliminar "{itemName}"?
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--gray)', margin: 0 }}>
            Esta acción no se puede deshacer. Los spots asociados mantendrán su categoría actual.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onCancel} className="btn btn-ghost">Cancelar</button>
          <button onClick={onConfirm} className="btn" style={{
            background: '#ef4444', color: 'white', border: 'none',
            padding: '8px 20px', borderRadius: '10px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '13px'
          }}>
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Zone Input ──────────────────────────────────────────
function ZoneInput({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim())
      setValue('')
      setIsAdding(false)
    }
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="btn btn-ghost btn-sm"
      >
        <Plus size={16} /> Nueva zona
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setIsAdding(false); setValue('') } }}
        placeholder="Nombre de zona..."
        style={{
          background: 'var(--dim)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '6px 12px', color: 'var(--white)',
          fontFamily: 'var(--font-body)', fontSize: '13px', outline: 'none',
          width: '160px'
        }}
      />
      <button onClick={handleAdd} className="btn btn-ghost btn-xs" style={{ color: '#22c55e' }}>
        <Check size={14} />
      </button>
      <button onClick={() => { setIsAdding(false); setValue('') }} className="btn btn-ghost btn-xs" style={{ color: '#ef4444' }}>
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────
export default function AdminCategoriasPage() {
  const { addToast } = useUIStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'zone'; id: string; name: string } | null>(null)

  // ── Load data ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [cats, zns] = await Promise.all([
        categoriesService.getAll(),
        categoriesService.getAllZones(),
      ])
      setCategories(cats)
      setZones(zns)
    } catch (err: any) {
      addToast({ type: 'error', message: 'Error cargando datos: ' + (err.message ?? 'Error desconocido') })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { loadData() }, [loadData])

  // ── Category CRUD ──────────────────────────────────────
  const handleSaveCategory = async (data: { id: string; label: string; emoji: string; color: string }) => {
    try {
      if (editingCategory) {
        const updated = await categoriesService.update(editingCategory.id, {
          label: data.label,
          emoji: data.emoji,
          color: data.color,
        })
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? updated : c))
        addToast({ type: 'success', message: `Categoría "${data.label}" actualizada ✓` })
      } else {
        const created = await categoriesService.create({
          id: data.id,
          label: data.label,
          emoji: data.emoji,
          color: data.color,
        })
        setCategories(prev => [...prev, created])
        addToast({ type: 'success', message: `Categoría "${data.label}" creada ✓` })
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error guardando categoría' })
      throw err
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'category') {
        await categoriesService.delete(deleteTarget.id)
        setCategories(prev => prev.filter(c => c.id !== deleteTarget.id))
      } else {
        await categoriesService.deleteZone(deleteTarget.id)
        setZones(prev => prev.filter(z => z.id !== deleteTarget.id))
      }
      addToast({ type: 'success', message: `"${deleteTarget.name}" eliminado ✓` })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error eliminando' })
    } finally {
      setDeleteTarget(null)
    }
  }

  // ── Zone CRUD ──────────────────────────────────────────
  const handleAddZone = async (name: string) => {
    try {
      const created = await categoriesService.createZone(name, zones.length + 1)
      setZones(prev => [...prev, created])
      addToast({ type: 'success', message: `Zona "${name}" agregada ✓` })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error creando zona' })
    }
  }

  const openAdd = () => { setEditingCategory(null); setIsFormOpen(true) }
  const openEdit = (cat: Category) => { setEditingCategory(cat); setIsFormOpen(true) }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      <header>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>Categorías y Zonas</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--gray)', margin: 0 }}>Estructura principal de búsqueda de la plataforma</p>
      </header>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '60px 0', color: 'var(--gray)' }}>
          <Loader2 size={24} className="spin" />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}>Cargando...</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }} className="categories-grid">

          {/* Categorías Section */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', margin: 0 }}>Categorías</h3>
              <button className="btn btn-ghost btn-sm" onClick={openAdd}><Plus size={16} /> Nueva</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map((cat) => (
                <motion.div
                  key={cat.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    background: 'var(--card2)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = cat.color + '44')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{cat.emoji}</span>
                    <div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', margin: 0 }}>{cat.label}</p>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray)' }}>{cat.id.toUpperCase()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-ghost btn-xs" onClick={() => openEdit(cat)} title="Editar">
                      <Edit size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-xs"
                      style={{ color: '#ef4444' }}
                      onClick={() => setDeleteTarget({ type: 'category', id: cat.id, name: cat.label })}
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}

              {categories.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '40px 20px',
                  color: 'var(--gray)', fontFamily: 'var(--font-body)', fontSize: '14px'
                }}>
                  No hay categorías. Crea la primera.
                </div>
              )}
            </div>
          </section>

          {/* Zonas Section */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', margin: 0 }}>Zonas de Piura</h3>
              <ZoneInput onAdd={handleAddZone} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <AnimatePresence>
                {zones.map(zone => (
                  <motion.div
                    key={zone.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    style={{
                      background: 'rgba(255,85,0,0.05)',
                      border: '1px solid rgba(255,85,0,0.2)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--white)', fontWeight: 600 }}>{zone.name}</span>
                    <button
                      onClick={() => setDeleteTarget({ type: 'zone', id: zone.id, name: zone.name })}
                      style={{ background: 'transparent', border: 'none', color: 'var(--gray)', cursor: 'pointer', padding: 0, display: 'flex' }}
                      title="Eliminar zona"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {zones.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '40px 20px', width: '100%',
                  color: 'var(--gray)', fontFamily: 'var(--font-body)', fontSize: '14px'
                }}>
                  No hay zonas. Agrega la primera.
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={isFormOpen}
        initial={editingCategory}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveCategory}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name ?? ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <style>{`
        @media (max-width: 1024px) {
          .categories-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </motion.div>
  )
}
