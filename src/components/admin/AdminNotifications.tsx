import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, MapPin, Star, UserPlus } from 'lucide-react'

const MOCK_NOTIFS = [
  { id: 1, type: 'spot', label: 'Nuevo spot sugerido: Playa Yacila', time: '12m', icon: MapPin, color: 'var(--orange)' },
  { id: 2, type: 'review', label: 'Reseña pendiente en Paita Sea Food', time: '1h', icon: Star, color: 'var(--yellow)' },
  { id: 3, type: 'churre', label: 'Nuevo churre registrado: Juan Pérez', time: '4h', icon: UserPlus, color: 'var(--amber)' },
]

export default function AdminNotifications() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    if (isOpen) document.addEventListener('mousedown', click)
    return () => document.removeEventListener('mousedown', click)
  }, [isOpen])

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-sm" 
        style={{ padding: '8px', background: isOpen ? 'rgba(255,255,255,0.05)' : 'transparent' }}
      >
        <div style={{ position: 'relative' }}>
          <Bell size={18} />
          <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '8px', height: '8px', background: 'var(--orange)', borderRadius: '50%', border: '2px solid var(--bg)' }} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '12px',
              width: '320px', background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', zIndex: 1000
            }}
          >
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--white)' }}>Notificaciones</h4>
            </div>
            {MOCK_NOTIFS.map(n => (
              <div key={n.id} style={{ display: 'flex', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer' }} className="notif-item">
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${n.color}11`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <n.icon size={16} color={n.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--white)', lineHeight: 1.4 }}>{n.label}</p>
                  <span style={{ fontSize: '11px', color: 'var(--gray)' }}>Hace {n.time}</span>
                </div>
              </div>
            ))}
            <div style={{ padding: '8px 4px 4px' }}>
              <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}>Ver todas</button>
            </div>
            <style>{`.notif-item:hover { background: rgba(255,120,30,0.05); }`}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
