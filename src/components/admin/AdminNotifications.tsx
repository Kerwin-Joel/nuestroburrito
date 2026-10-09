import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bell, MapPin, UserPlus, ShoppingBag, CheckCircle2 } from 'lucide-react'
import type { AdminInbox } from '../../services/adminStats'

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (min < 60) return `hace ${Math.max(1, min)} min`
  if (min < 1440) return `hace ${Math.floor(min / 60)} h`
  return `hace ${Math.floor(min / 1440)} d`
}

/** Campana del topbar: lo que está esperando una acción del admin. */
export default function AdminNotifications({ inbox }: { inbox: AdminInbox | null }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    if (isOpen) document.addEventListener('mousedown', click)
    return () => document.removeEventListener('mousedown', click)
  }, [isOpen])

  const items = [
    ...(inbox?.pendingSpots ?? []).slice(0, 5).map(s => ({
      key: `s-${s.id}`, icon: MapPin, label: <>Spot por revisar: <strong>{s.name}</strong></>,
      time: timeAgo(s.created_at), path: `/admin/spots?editar=${s.id}`,
    })),
    ...(inbox?.pendingChurres ?? []).slice(0, 3).map(c => ({
      key: `c-${c.id}`, icon: UserPlus, label: <>Churre por verificar: <strong>{c.name ?? 'Sin nombre'}</strong></>,
      time: timeAgo(c.created_at), path: '/admin/churres',
    })),
    ...(inbox && inbox.pendingOrders > 0 ? [{
      key: 'orders', icon: ShoppingBag,
      label: <><strong>{inbox.pendingOrders}</strong> pedido{inbox.pendingOrders > 1 ? 's' : ''} esperando confirmación del negocio</>,
      time: '', path: '/admin/dashboard',
    }] : []),
  ]
  const total = (inbox?.pendingSpots.length ?? 0) + (inbox?.pendingChurres.length ?? 0) + (inbox?.pendingOrders ?? 0)

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="adm-icon-btn adm-topbar-btn" aria-label={`Notificaciones${total ? ` (${total})` : ''}`}>
        <Bell size={18} />
        {total > 0 && <span className="adm-dot-badge">{total > 9 ? '9+' : total}</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="adm-popover" style={{ width: 'min(340px, calc(100vw - 24px))' }}
          >
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--white)', fontFamily: 'var(--font-body)' }}>Pendientes</h4>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>{total}</span>
            </div>
            {items.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--gray)', fontFamily: 'var(--font-body)', fontSize: '13px' }}>
                <CheckCircle2 size={22} color="#22c55e" style={{ marginBottom: '6px' }} /><br />
                Nada pendiente. ¡Todo al día!
              </div>
            ) : (
              <div style={{ padding: '6px', maxHeight: '360px', overflowY: 'auto' }}>
                {items.map(n => (
                  <button key={n.key} className="adm-menu-item" onClick={() => { navigate(n.path); setIsOpen(false) }}>
                    <span className="adm-cmdk-icon"><n.icon size={15} /></span>
                    <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <span style={{ display: 'block', fontSize: '13px', color: 'var(--white)', lineHeight: 1.4 }}>{n.label}</span>
                      {n.time && <span style={{ fontSize: '11px', color: 'var(--gray)' }}>{n.time}</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
