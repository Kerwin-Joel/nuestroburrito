import { useState, useEffect, useCallback } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Search, ExternalLink, LogOut, PanelLeftClose, PanelLeftOpen, ChevronRight, X } from 'lucide-react'
import { ADMIN_MODULES, ADMIN_GROUPS } from '../lib/adminModules'
import { UserAvatar } from '../components/auth/UserAvatarMenu'
import AdminNotifications from '../components/admin/AdminNotifications'
import AdminQuickActions from '../components/admin/AdminQuickActions'
import AdminCommandPalette from '../components/admin/AdminCommandPalette'
import { useAuthStore } from '../stores/useAuthStore'
import { loadInbox, type AdminInbox } from '../services/adminStats'
import '../styles/admin.css'
import '../styles/admin-shell.css'

const COLLAPSE_KEY = 'burrito-admin-sidebar-collapsed'

function readCollapsed(): boolean {
  try { return localStorage.getItem(COLLAPSE_KEY) === '1' } catch { return false }
}

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [inbox, setInbox] = useState<AdminInbox | null>(null)

  const activeModule = ADMIN_MODULES.find(m => location.pathname.startsWith(m.path)) || ADMIN_MODULES[0]

  // Se refresca al navegar: aprobar un spot en una página baja el badge al cambiar de vista.
  useEffect(() => { loadInbox().then(setInbox) }, [location.pathname])

  // Cerrar el menú móvil al cambiar de ruta.
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggleCollapsed = () => setCollapsed(c => {
    try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1') } catch { /* solo esta sesión */ }
    return !c
  })

  const logout = useCallback(() => {
    useAuthStore.getState().logout()
    navigate('/login')
  }, [navigate])

  const badgeFor = (id: string) =>
    id === 'spots' ? inbox?.pendingSpots.length
      : id === 'churres' ? inbox?.pendingChurres.length
        : undefined

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  const sidebar = (compact: boolean) => (
    <div className="adm-sidebar-inner" data-compact={compact}>
      <div className="adm-brand">
        <Link to="/admin/dashboard" className="adm-brand-link" title="burrito admin">
          <span className="adm-brand-mark">b</span>
          {!compact && (
            <span className="adm-brand-text">burrito<span className="adm-brand-pill">admin</span></span>
          )}
        </Link>
      </div>

      <nav className="adm-nav" aria-label="Módulos">
        {ADMIN_GROUPS.map(group => {
          const modules = ADMIN_MODULES.filter(m => m.enabled && m.group === group)
          if (modules.length === 0) return null
          return (
            <div key={group} className="adm-nav-group">
              {!compact && <div className="adm-nav-label">{group}</div>}
              {modules.map(module => {
                const isActive = location.pathname.startsWith(module.path)
                const Icon = module.icon
                const badge = badgeFor(module.id)
                return (
                  <Link key={module.id} to={module.path} className="adm-nav-item" aria-current={isActive ? 'page' : undefined}
                    title={compact ? module.label : undefined}>
                    <Icon size={18} />
                    {!compact && <span className="adm-nav-text">{module.label}</span>}
                    {!!badge && <span className="adm-nav-badge">{badge}</span>}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="adm-sidebar-footer">
        <button className="adm-nav-item" onClick={() => navigate('/app')} title={compact ? 'Ver app turista' : undefined}>
          <ExternalLink size={18} />
          {!compact && <span className="adm-nav-text">Ver app turista</span>}
        </button>
        <div className="adm-user">
          <UserAvatar size={32} />
          {!compact && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="adm-user-name">{user?.profile.name || 'Administrador'}</div>
              <div className="adm-user-mail">{user?.email}</div>
            </div>
          )}
          <button className="adm-icon-btn" data-tone="danger" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="adm-shell" data-collapsed={collapsed}>
      {/* Sidebar de escritorio */}
      <aside className="adm-sidebar">{sidebar(collapsed)}</aside>

      {/* Menú móvil */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="adm-drawer-backdrop" onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside className="adm-drawer"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <button className="adm-icon-btn adm-drawer-close" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú"><X size={18} /></button>
              {sidebar(false)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="adm-main">
        <header className="adm-topbar">
          <button className="adm-icon-btn adm-topbar-btn adm-only-mobile" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
            <Menu size={20} />
          </button>
          <button className="adm-icon-btn adm-topbar-btn adm-only-desktop" onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'} title={collapsed ? 'Expandir menú' : 'Contraer menú'}>
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          <nav className="adm-breadcrumb" aria-label="Ruta">
            <span className="adm-hide-sm">Admin</span>
            <ChevronRight size={14} className="adm-hide-sm" />
            <strong>{activeModule.label}</strong>
          </nav>

          <button className="adm-search-trigger" onClick={() => setPaletteOpen(true)} aria-label="Buscar">
            <Search size={15} />
            <span className="adm-hide-sm">Buscar spots, módulos…</span>
            <kbd className="adm-hide-sm">{isMac ? '⌘' : 'Ctrl'} K</kbd>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AdminNotifications inbox={inbox} />
            <AdminQuickActions />
          </div>
        </header>

        <main className="adm-content">
          <Outlet />
        </main>
      </div>

      <AdminCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
