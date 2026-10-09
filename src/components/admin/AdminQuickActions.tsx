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
    { label: 'Nuevo spot', icon: MapPin, path: '/admin/spots?nuevo=1', color: 'var(--orange)' },
    { label: 'Invitar churre', icon: UserPlus, path: '/admin/churres', color: 'var(--amber)' },
    { label: 'Agregar TikTok', icon: Image, path: '/admin/tiktoks', color: '#ff0050' },
  ]

  const handleAction = (path: string) => {
    navigate(path)
    setIsOpen(false)
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-primary btn-sm adm-new-btn"
        aria-label="Crear nuevo"
      >
        <Plus size={16} />
        <span className="adm-hide-sm">Nuevo</span>
        <ChevronDown size={14} className="adm-hide-sm" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="adm-popover"
            style={{ width: '210px', padding: '6px' }}
          >
            {actions.map(a => (
              <button
                key={a.label}
                onClick={() => handleAction(a.path)}
                className="adm-menu-item"
              >
                <a.icon size={16} color={a.color} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--white)', fontWeight: 600 }}>
                  {a.label}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
