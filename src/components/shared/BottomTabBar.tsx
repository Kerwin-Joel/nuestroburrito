import { NavLink } from 'react-router-dom'
import { Home, Map, User, Calendar, type LucideIcon } from 'lucide-react'

interface TabItem {
  to: string
  icon: LucideIcon
  label: string
}

const TOURIST_TABS: TabItem[] = [
  { to: '/app',            icon: Home,     label: 'Inicio' },
  { to: '/app/explorar',   icon: Map,      label: 'Explorar' },
  { to: '/app/itinerario', icon: Calendar, label: 'Mi día' },
  { to: '/app/perfil',     icon: User,     label: 'Perfil' },
]

export function TouristBottomTabBar() {
  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      width: 'calc(100% - 32px)',
      maxWidth: '400px',
      pointerEvents: 'none'
    }}>
      <nav style={{
        background: 'rgba(17, 16, 9, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 120, 30, 0.2)',
        borderRadius: '24px',
        display: 'flex',
        padding: '8px 12px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        pointerEvents: 'auto'
      }}>
        {TOURIST_TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            style={{ 
              flex: 1, 
              textDecoration: 'none',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            {({ isActive }) => (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '16px',
                color: isActive ? 'var(--orange)' : 'var(--gray)',
                background: isActive ? 'rgba(255, 85, 0, 0.08)' : 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minWidth: '60px'
              }}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '9px', 
                  fontWeight: isActive ? 700 : 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {label}
                </span>
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'var(--orange)',
                    boxShadow: '0 0 8px var(--orange)'
                  }} />
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
