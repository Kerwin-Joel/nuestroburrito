import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, Eye, EyeOff, GripVertical } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUIStore } from '../../stores/useUIStore'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const CATEGORIAS = [
    { id: 'all', label: 'Todo', emoji: '🌊' },
    { id: 'origenes', label: 'Orígenes', emoji: '🏺' },
    { id: 'colonial', label: 'Colonial', emoji: '⛪' },
    { id: 'heroes', label: 'Héroes', emoji: '⚓' },
    { id: 'tradicion', label: 'Tradiciones', emoji: '🎶' },
    { id: 'gastronomia', label: 'Gastro', emoji: '🍽️' },
    { id: 'piuranadas', label: 'Piuranadas', emoji: '💬' },
    { id: 'naturaleza', label: 'Naturaleza', emoji: '🌵' },
]

interface HistoriaItem {
    id: string
    cat: string
    año: string
    emoji: string
    titulo: string
    resumen: string
    datos: string[]
    imagenes: string[]
    descripcion_larga?: string
    sabias_que: string[]
    lugares_relacionados: { nombre: string; distancia: string; tipo: string }[]
    horario?: string
    entrada?: string
    rating?: number
    activo: boolean
    orden: number
}

// ── Modal Form ──
function HistoriaModal({ item, onClose, onSave }: {
    item: HistoriaItem | null
    onClose: () => void
    onSave: () => void
}) {
    const isEdit = !!item
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        cat: item?.cat ?? 'origenes',
        año: item?.año ?? '',
        emoji: item?.emoji ?? '🏺',
        titulo: item?.titulo ?? '',
        resumen: item?.resumen ?? '',
        datos: (item?.datos ?? []).join('\n'),
        imagenes: (item?.imagenes ?? []).join('\n'),
        descripcion_larga: item?.descripcion_larga ?? '',
        sabias_que: (item?.sabias_que ?? []).join('\n'),
        horario: item?.horario ?? '',
        entrada: item?.entrada ?? '',
        rating: item?.rating?.toString() ?? '',
        activo: item?.activo ?? true,
        orden: item?.orden?.toString() ?? '0',
    })

    const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

    const handleSave = async () => {
        if (!form.titulo || !form.resumen) return
        setSaving(true)
        const payload = {
            cat: form.cat,
            año: form.año,
            emoji: form.emoji,
            titulo: form.titulo,
            resumen: form.resumen,
            datos: form.datos.split('\n').map(s => s.trim()).filter(Boolean),
            imagenes: form.imagenes.split('\n').map(s => s.trim()).filter(Boolean),
            descripcion_larga: form.descripcion_larga || null,
            sabias_que: form.sabias_que.split('\n').map(s => s.trim()).filter(Boolean),
            horario: form.horario || null,
            entrada: form.entrada || null,
            rating: form.rating ? parseFloat(form.rating) : null,
            activo: form.activo,
            orden: parseInt(form.orden) || 0,
        }
        if (isEdit) {
            await supabase.from('historia_piura').update(payload).eq('id', item!.id)
        } else {
            await supabase.from('historia_piura').insert(payload)
        }
        setSaving(false)
        onSave()
        onClose()
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: '13px',
        padding: '10px 12px', outline: 'none', boxSizing: 'border-box',
    }
    const labelStyle: React.CSSProperties = {
        fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
        color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase',
        display: 'block', marginBottom: '6px',
    }

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#0e0c09', border: '1px solid rgba(255,85,0,0.2)', borderRadius: '20px', width: '100%', maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--orange)', letterSpacing: '2px', marginBottom: '2px' }}>
                            {isEdit ? 'EDITAR' : 'NUEVA'} ENTRADA
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>
                            {isEdit ? item!.titulo : 'Historia de Piura'}
                        </h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                        <X size={15} />
                    </button>
                </div>

                {/* Form */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Fila: emoji + categoria + año */}
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px', gap: '12px' }}>
                        <div>
                            <label style={labelStyle}>Emoji</label>
                            <input value={form.emoji} onChange={e => set('emoji', e.target.value)} style={inputStyle} placeholder="🏺" />
                        </div>
                        <div>
                            <label style={labelStyle}>Categoría</label>
                            <select value={form.cat} onChange={e => set('cat', e.target.value)}
                                style={{ ...inputStyle, cursor: 'pointer' }}>
                                {CATEGORIAS.filter(c => c.id !== 'all').map(c => (
                                    <option key={c.id} value={c.id} style={{ background: '#0e0c09' }}>{c.emoji} {c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Año / Época</label>
                            <input value={form.año} onChange={e => set('año', e.target.value)} style={inputStyle} placeholder="1532" />
                        </div>
                    </div>

                    {/* Título */}
                    <div>
                        <label style={labelStyle}>Título *</label>
                        <input value={form.titulo} onChange={e => set('titulo', e.target.value)} style={inputStyle} placeholder="Los Tallanes: Los Primeros Piuranos" />
                    </div>

                    {/* Resumen */}
                    <div>
                        <label style={labelStyle}>Resumen *</label>
                        <textarea value={form.resumen} onChange={e => set('resumen', e.target.value)}
                            style={{ ...inputStyle, height: '80px', resize: 'none' }}
                            placeholder="Breve descripción que aparece en la card..." />
                    </div>

                    {/* Descripción larga */}
                    <div>
                        <label style={labelStyle}>Descripción larga (modal)</label>
                        <textarea value={form.descripcion_larga} onChange={e => set('descripcion_larga', e.target.value)}
                            style={{ ...inputStyle, height: '100px', resize: 'none' }}
                            placeholder="Texto completo que aparece al abrir el detalle..." />
                    </div>

                    {/* Datos clave */}
                    <div>
                        <label style={labelStyle}>Datos clave (uno por línea)</label>
                        <textarea value={form.datos} onChange={e => set('datos', e.target.value)}
                            style={{ ...inputStyle, height: '80px', resize: 'none', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                            placeholder={'Primera cultura de la costa norte\nNavegantes del Pacífico'} />
                    </div>

                    {/* Sabías que */}
                    <div>
                        <label style={labelStyle}>¿Sabías que...? (uno por línea)</label>
                        <textarea value={form.sabias_que} onChange={e => set('sabias_que', e.target.value)}
                            style={{ ...inputStyle, height: '80px', resize: 'none', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                            placeholder={'Los Tallanes construyeron complejos de adobe...\nSu lengua, el Sec, aún tiene palabras...'} />
                    </div>

                    {/* Imágenes */}
                    <div>
                        <label style={labelStyle}>URLs de imágenes (una por línea)</label>
                        <textarea value={form.imagenes} onChange={e => set('imagenes', e.target.value)}
                            style={{ ...inputStyle, height: '64px', resize: 'none', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                            placeholder={'https://ejemplo.com/foto1.jpg\nhttps://ejemplo.com/foto2.jpg'} />
                    </div>

                    {/* Info práctica */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '12px' }}>
                        <div>
                            <label style={labelStyle}>Horario</label>
                            <input value={form.horario} onChange={e => set('horario', e.target.value)} style={inputStyle} placeholder="Mar-Dom 9am-5pm" />
                        </div>
                        <div>
                            <label style={labelStyle}>Entrada</label>
                            <input value={form.entrada} onChange={e => set('entrada', e.target.value)} style={inputStyle} placeholder="S/ 5.00" />
                        </div>
                        <div>
                            <label style={labelStyle}>Rating</label>
                            <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => set('rating', e.target.value)} style={inputStyle} placeholder="4.5" />
                        </div>
                    </div>

                    {/* Orden + activo */}
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px', alignItems: 'center' }}>
                        <div>
                            <label style={labelStyle}>Orden</label>
                            <input type="number" value={form.orden} onChange={e => set('orden', e.target.value)} style={inputStyle} placeholder="0" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '20px' }}>
                            <button type="button" onClick={() => set('activo', !form.activo)}
                                style={{ width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', background: form.activo ? 'var(--orange)' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                                <div style={{ position: 'absolute', top: '3px', left: form.activo ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                            </button>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: form.activo ? 'var(--white)' : 'var(--muted)' }}>
                                {form.activo ? 'Visible para turistas' : 'Oculto'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px', flexShrink: 0, background: '#0e0c09' }}>
                    <button onClick={onClose}
                        style={{ flex: 1, padding: '11px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={saving || !form.titulo || !form.resumen}
                        style={{ flex: 2, padding: '11px', borderRadius: '10px', background: 'var(--orange)', border: 'none', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                        {saving ? 'Guardando...' : isEdit ? 'Guardar cambios ✓' : 'Crear entrada →'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

// ── Página principal ──
export default function AdminHistoriaPage() {
    const [items, setItems] = useState<HistoriaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')
    const [catActiva, setCatActiva] = useState('all')
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<HistoriaItem | null>(null)
    const { addToast } = useUIStore()

    useEffect(() => { loadItems() }, [])

    const loadItems = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('historia_piura')
            .select('*')
            .order('orden', { ascending: true })
        setItems((data ?? []) as HistoriaItem[])
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta entrada?')) return
        await supabase.from('historia_piura').delete().eq('id', id)
        setItems(p => p.filter(i => i.id !== id))
        addToast({ type: 'info', message: 'Entrada eliminada' })
    }

    const handleToggle = async (item: HistoriaItem) => {
        await supabase.from('historia_piura').update({ activo: !item.activo }).eq('id', item.id)
        setItems(p => p.map(i => i.id === item.id ? { ...i, activo: !i.activo } : i))
        addToast({ type: 'success', message: item.activo ? 'Entrada ocultada' : 'Entrada visible' })
    }

    const openAdd = () => { setEditing(null); setModalOpen(true) }
    const openEdit = (item: HistoriaItem) => { setEditing(item); setModalOpen(true) }

    const filtered = items.filter(i => {
        const matchCat = catActiva === 'all' || i.cat === catActiva
        const matchQ = !query || i.titulo.toLowerCase().includes(query.toLowerCase())
        return matchCat && matchQ
    })

    const catConfig: Record<string, { label: string; emoji: string }> = Object.fromEntries(
        CATEGORIAS.map(c => [c.id, { label: c.label, emoji: c.emoji }])
    )

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>
                        Biblioteca del Churre
                    </h1>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--gray)', margin: 0 }}>
                        {items.length} entradas · {items.filter(i => i.activo).length} visibles
                    </p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={18} /> Nueva entrada
                </button>
            </header>

            {/* Search + Filtros */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por título..."
                        style={{ width: '100%', height: '40px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0 12px 0 36px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--white)', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {CATEGORIAS.map(cat => (
                        <button key={cat.id} onClick={() => setCatActiva(cat.id)}
                            style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${catActiva === cat.id ? 'transparent' : 'var(--border)'}`, background: catActiva === cat.id ? 'var(--orange)' : 'var(--card)', color: catActiva === cat.id ? '#fff' : 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                            {cat.emoji} {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    Cargando...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
                    <p style={{ fontSize: '32px', margin: '0 0 8px' }}>🔍</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--white)', fontWeight: 700 }}>Sin resultados</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                        {items.length === 0 ? 'Crea tu primera entrada de historia' : 'Prueba con otro filtro'}
                    </p>
                    {items.length === 0 && (
                        <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: '16px' }}>
                            <Plus size={16} /> Crear primera entrada
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <AnimatePresence>
                        {filtered.map(item => {
                            const cat = catConfig[item.cat] ?? { label: item.cat, emoji: '📌' }
                            return (
                                <motion.div key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                    style={{
                                        background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '14px',
                                        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px',
                                        opacity: item.activo ? 1 : 0.5,
                                    }}>
                                    {/* Emoji */}
                                    <div style={{ fontSize: '28px', flexShrink: 0, width: '40px', textAlign: 'center' }}>{item.emoji}</div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800, color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {item.titulo}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--orange)', background: 'rgba(255,85,0,0.1)', padding: '2px 6px', borderRadius: '6px' }}>
                                                {cat.emoji} {cat.label}
                                            </span>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)' }}>{item.año}</span>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)' }}>#{item.orden}</span>
                                            {!item.activo && (
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6b7280', background: 'rgba(107,114,128,0.1)', padding: '2px 6px', borderRadius: '6px' }}>
                                                    Oculto
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.resumen}
                                        </p>
                                    </div>

                                    {/* Acciones */}
                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                        <button onClick={() => handleToggle(item)} title={item.activo ? 'Ocultar' : 'Mostrar'}
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.activo ? '#22c55e' : 'var(--muted)' }}>
                                            {item.activo ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                        <button onClick={() => openEdit(item)}
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)' }}>
                                            <Edit size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)}
                                            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <HistoriaModal
                        item={editing}
                        onClose={() => setModalOpen(false)}
                        onSave={() => { loadItems(); addToast({ type: 'success', message: editing ? 'Entrada actualizada ✓' : 'Entrada creada ✓' }) }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    )
}