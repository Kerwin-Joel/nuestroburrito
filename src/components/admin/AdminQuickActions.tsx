import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MapPin, UserPlus, Image, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AdminQuickActions() {
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

  const actions = [
    { label: 'Nuevo Spot', icon: MapPin, path: '/admin/spots', color: 'var(--orange)' },
    { label: 'Invitar Churre', icon: UserPlus, path: '/admin/churres', color: 'var(--amber)' },
    { label: 'Nuevo TikTok', icon: Image, path: '/admin/tiktoks', color: '#ff0050' },
  ]

  const handleAction = (path: string) => {
    navigate(path)
    setIsOpen(false)
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-primary btn-sm"
        style={{ gap: '8px', padding: '10px 16px' }}
      >
        <Plus size={16} /> 
        <span className="hide-mobile">Nuevo registro</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '12px',
              width: '200px', background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', zIndex: 1000
            }}
          >
            {actions.map(a => (
              <button
                key={a.label}
                onClick={() => handleAction(a.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '10px', border: 'none',
                  background: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                }}
                className="action-item"
              >
                <a.icon size={16} color={a.color} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--white)', fontWeight: 600 }}>
                  {a.label}
                </span>
              </button>
            ))}
            <style>{`.action-item:hover { background: rgba(255,120,30,0.05); }`}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
