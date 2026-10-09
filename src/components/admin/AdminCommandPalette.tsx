import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, MapPin, CornerDownLeft, ExternalLink } from 'lucide-react'
import { ADMIN_MODULES } from '../../lib/adminModules'
import { supabase } from '../../lib/supabase'

interface Item {
  id: string
  label: string
  hint: string
  icon: React.ReactNode
  section: 'Acciones' | 'Ir a' | 'Spots'
  run: () => void
}

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Buscador global del admin (Ctrl/⌘ K): módulos, acciones rápidas y spots por nombre. */
export default function AdminCommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [spots, setSpots] = useState<{ id: string; name: string; status: string; address: string | null }[] | null>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  // Los spots se piden recién al abrir (la mayoría de las veces no se usa), y en
  // un efecto aparte: que lleguen no debe borrar lo que el admin ya escribió.
  useEffect(() => {
    if (!open || spots) return
    supabase.from('spots').select('id, name, status, address').order('name')
      .then(({ data }) => setSpots(data ?? []))
  }, [open, spots])

  const go = (path: string) => { navigate(path); onClose() }

  const items = useMemo<Item[]>(() => {
    const q = normalize(query.trim())
    const actions: Item[] = [
      { id: 'new-spot', label: 'Nuevo spot', hint: 'Crear un lugar', icon: <Plus size={15} />, section: 'Acciones', run: () => go('/admin/spots?nuevo=1') },
      { id: 'review', label: 'Revisar spots pendientes', hint: 'Sugeridos por churres', icon: <MapPin size={15} />, section: 'Acciones', run: () => go('/admin/spots?estado=pendientes') },
      { id: 'weak', label: 'Ver fichas incompletas', hint: 'Contenido por mejorar', icon: <MapPin size={15} />, section: 'Acciones', run: () => go('/admin/spots?contenido=incompletos') },
      { id: 'app', label: 'Abrir app turista', hint: 'Ver como turista', icon: <ExternalLink size={15} />, section: 'Acciones', run: () => go('/app') },
    ]
    const modules: Item[] = ADMIN_MODULES.filter(m => m.enabled).map(m => {
      const Icon = m.icon
      return { id: `m-${m.id}`, label: m.label, hint: m.description, icon: <Icon size={15} />, section: 'Ir a', run: () => go(m.path) }
    })
    const match = (i: Item) => !q || normalize(`${i.label} ${i.hint}`).includes(q)
    const base = [...actions.filter(match), ...modules.filter(match)]
    if (!q || !spots) return base
    const spotItems: Item[] = spots
      .filter(s => normalize(`${s.name} ${s.address ?? ''}`).includes(q))
      .slice(0, 8)
      .map(s => ({
        id: `s-${s.id}`, label: s.name,
        hint: s.status === 'pending' ? 'Pendiente de revisión' : s.status === 'rejected' ? 'Oculto' : (s.address ?? 'Publicado'),
        icon: <MapPin size={15} />, section: 'Spots',
        run: () => go(`/admin/spots?editar=${s.id}`),
      }))
    return [...base, ...spotItems]
    // go/navigate son estables para este propósito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, spots])

  useEffect(() => { setActive(0) }, [query])

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); items[active]?.run() }
    else if (e.key === 'Escape') onClose()
  }

  let lastSection = ''

  return createPortal(
    <div className="adm-cmdk-backdrop" onMouseDown={onClose}>
      <div className="adm-cmdk" role="dialog" aria-label="Buscador" onMouseDown={e => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="adm-cmdk-input">
          <Search size={17} />
          <input ref={inputRef} autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Busca un spot, módulo o acción…" aria-label="Buscar" />
          <kbd>Esc</kbd>
        </div>
        <div className="adm-cmdk-list" ref={listRef}>
          {items.length === 0 && <div className="adm-cmdk-empty">Sin resultados para “{query}”</div>}
          {items.map((item, idx) => {
            const header = item.section !== lastSection ? item.section : null
            lastSection = item.section
            return (
              <div key={item.id}>
                {header && <div className="adm-cmdk-section">{header}</div>}
                <button data-idx={idx} className="adm-cmdk-item" aria-selected={idx === active}
                  onMouseMove={() => setActive(idx)} onClick={item.run}>
                  <span className="adm-cmdk-icon">{item.icon}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="adm-cmdk-label">{item.label}</span>
                    <span className="adm-cmdk-hint">{item.hint}</span>
                  </span>
                  {idx === active && <CornerDownLeft size={14} style={{ color: 'var(--gray)' }} />}
                </button>
              </div>
            )
          })}
        </div>
        <div className="adm-cmdk-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> moverse</span>
          <span><kbd>↵</kbd> abrir</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
