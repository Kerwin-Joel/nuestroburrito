import { useEffect, useRef } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { LayoutDashboard, MapPin, CalendarDays, Star, User, ExternalLink, LogOut } from 'lucide-react'
import { initials } from '../../lib/formatters'
import { useAuthStore } from '../../stores/useAuthStore'
import UserAvatarMenu from '../auth/UserAvatarMenu'

const NAV_ITEMS = [
  { to: '/churres/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/churres/spots',     icon: MapPin,          label: 'Mis Spots' },
  { to: '/churres/tours',     icon: CalendarDays,    label: 'Mis Tours' },
  { to: '/churres/resenas',   icon: Star,            label: 'Reseñas' },
  { to: '/churres/perfil',    icon: User,            label: 'Mi Perfil' },
]


export default function Sidebar() {
  const { user } = useAuthStore()
  const churre = user?.profile
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current,
        { x: -260, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
      )
    }
  }, [])

  return (
    <aside ref={ref} className="churre-sidebar" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '240px',
      height: '100vh',
      background: 'var(--card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <Link to="/app" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', letterSpacing: '-1px', color: 'var(--yellow)' }}>
            burri<span style={{ color: 'var(--orange)' }}>to</span>
          </span>
        </Link>
        <div style={{ marginTop: '4px' }}>
          <span className="badge badge-orange" style={{ fontSize: '9px' }}>PANEL CHURRE</span>
        </div>
      </div>

      {/* Churre avatar */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <UserAvatarMenu />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '14px', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {churre?.name || 'Churre'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={11} fill="var(--yellow)" color="var(--yellow)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--yellow)' }}>4.9</span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 12px',
                borderRadius: '8px',
                marginBottom: '2px',
                background: isActive ? 'rgba(255,85,0,0.08)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--orange)' : '3px solid transparent',
                color: isActive ? 'var(--orange)' : 'var(--muted)',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}>
                <Icon size={17} />
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: isActive ? 700 : 500, fontSize: '14px' }}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom link */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link to="/app" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', gap: '6px', fontSize: '13px' }}>
          <ExternalLink size={13} /> Ver app turista
        </Link>
        <button 
          onClick={() => {
            useAuthStore.getState().logout()
            window.location.href = '/login'
          }}
          className="btn btn-ghost btn-sm" 
          style={{ width: '100%', justifyContent: 'center', gap: '6px', fontSize: '13px', color: 'var(--red)' }}
        >
          <LogOut size={13} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
