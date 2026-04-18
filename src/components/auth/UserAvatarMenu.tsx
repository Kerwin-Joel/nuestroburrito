import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, LogOut, Settings, Shield } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'

export function UserAvatar({ size = 36, isOpen = false }: { size?: number, isOpen?: boolean }) {
  const { user } = useAuthStore()
  if (!user) return null

  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: user.profile.avatarUrl 
        ? `url(${user.profile.avatarUrl}) center/cover` 
        : 'linear-gradient(135deg, var(--orange), var(--hot))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: isOpen ? '0 0 0 2px var(--orange)' : 'none',
      transition: 'all 0.2s',
      overflow: 'hidden',
      flexShrink: 0
    }}>
      {!user.profile.avatarUrl && (
        <span style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: `${size * 0.45}px`, 
          fontWeight: 700, 
          color: 'white',
          textTransform: 'uppercase'
        }}>
          {user.profile.name.charAt(0)}
        </span>
      )}
    </div>
  )
}

export default function UserAvatarMenu({ align = 'right', children }: { align?: 'left' | 'right', children?: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    setIsOpen(false)
    navigate('/login')
  }

  const roleLabels = {
    tourist: { label: 'Turista', color: 'var(--gray)' },
    churre: { label: 'Churre', color: 'var(--amber)' },
    admin: { label: 'Admin', color: 'var(--orange)' },
  }

  const { label: roleLabel, color: roleColor } = roleLabels[user.profile.role]

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: children ? '16px' : '0',
          textAlign: 'left',
          width: children ? '100%' : 'auto',
          borderRadius: children ? '12px' : '50%',
        }}
        className={children ? "user-menu-trigger-mobile" : ""}
      >
        {children ? (
          children
        ) : (
          <UserAvatar isOpen={isOpen} />
        )}
      </button>

      <style>{`
        .user-menu-trigger-mobile {
          transition: background 0.2s;
          padding: 8px !important;
          margin: -8px;
        }
        .user-menu-trigger-mobile:active {
          background: rgba(255,255,255,0.05);
        }
      `}</style>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10, x: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 12px)',
              [align]: 0,
              minWidth: '220px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '8px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              zIndex: 2000,
            }}
          >
            {/* Header */}
            <div style={{ padding: '12px 14px', marginBottom: '4px' }}>
              <p style={{ 
                fontFamily: 'var(--font-body)', 
                fontSize: '14px', 
                fontWeight: 700, 
                color: 'var(--white)',
                margin: 0
              }}>
                {user.profile.name}
              </p>
              <p style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '11px', 
                color: 'var(--gray)',
                margin: '2px 0 8px 0',
                wordBreak: 'break-all'
              }}>
                {user.email}
              </p>
              <div style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${roleColor}22`,
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 600,
                color: roleColor,
                textTransform: 'uppercase'
              }}>
                {roleLabel}
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,120,30,0.1)', margin: '4px 8px' }} />

            {/* Menu Items */}
            <MenuItem 
              to={user.profile.role === 'tourist' ? '/app/perfil' : `/${user.profile.role}s/perfil`} 
              icon={<User size={16} />} 
              label="Mi Perfil" 
              onClick={() => setIsOpen(false)}
            />
            
            {user.profile.role === 'admin' && (
              <MenuItem 
                to="/admin/dashboard" 
                icon={<Shield size={16} />} 
                label="Panel Admin" 
                onClick={() => setIsOpen(false)}
              />
            )}

            <div style={{ height: '1px', background: 'rgba(255,120,30,0.1)', margin: '4px 8px' }} />

            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              className="menu-item-logout"
            >
              <LogOut size={16} color="#ef4444" />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#ef4444', fontWeight: 600 }}>
                Cerrar sesión
              </span>
            </button>

            <style>{`
              .menu-item-logout:hover { background: rgba(239, 68, 68, 0.08); }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuItem({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: '10px',
        textDecoration: 'none',
        transition: 'all 0.2s',
      }}
      className="menu-item"
    >
      <span style={{ color: 'var(--gray)' }}>{icon}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)' }}>
        {label}
      </span>
      <style>{`
        .menu-item:hover { background: rgba(255, 85, 0, 0.06); }
        .menu-item:hover span { color: var(--orange) !important; }
      `}</style>
    </Link>
  )
}
