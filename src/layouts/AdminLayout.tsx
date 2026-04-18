import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { 
  Menu, 
  X, 
  Bell, 
  Plus, 
  ExternalLink,
  LogOut
} from 'lucide-react'
import { ADMIN_MODULES } from '../lib/adminModules'
import UserAvatarMenu from '../components/auth/UserAvatarMenu'
import AdminNotifications from '../components/admin/AdminNotifications'
import AdminQuickActions from '../components/admin/AdminQuickActions'
import { useAuthStore } from '../stores/useAuthStore'

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const activeModule = ADMIN_MODULES.find(m => location.pathname.startsWith(m.path)) || ADMIN_MODULES[0]

  useEffect(() => {
    // GSAP sidebar entrance
    gsap.from('.admin-sidebar', {
      x: -260,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    })
  }, [])

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 16px' }}>
      {/* Logo */}
      <div style={{ padding: '0 8px 32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', letterSpacing: '-1.5px' }}>
          burrito<span style={{ color: 'var(--orange)' }}>Admin</span>
        </h1>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          v1.0.0 MVP
        </span>
      </div>

      {/* Admin User */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '12px', 
        background: 'var(--card)', 
        borderRadius: '12px',
        marginBottom: '24px',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <UserAvatarMenu />
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--white)', margin: 0 }}>Admin Root</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray)', margin: 0 }}>Superusuario</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {ADMIN_MODULES.filter(m => m.enabled).map((module) => {
          const isActive = location.pathname.startsWith(module.path)
          const Icon = module.icon
          
          return (
            <Link
              key={module.id}
              to={module.path}
              onClick={closeMobileMenu}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? 'var(--orange)' : 'var(--gray)',
                background: isActive ? 'rgba(255,85,0,0.08)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--orange)' : '3px solid transparent',
                transition: 'all 0.2s ease',
              }}
              className="nav-item"
            >
              <Icon size={18} />
              <span style={{ 
                fontFamily: 'var(--font-body)', 
                fontSize: '14px', 
                fontWeight: isActive ? 600 : 400,
                flex: 1
              }}>
                {module.label}
              </span>
              {module.badge && module.badge > 0 && (
                <span style={{
                  background: 'var(--orange)',
                  color: 'white',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  {module.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Links */}
      <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={() => navigate('/app')}
          className="btn btn-ghost btn-sm" 
          style={{ justifyContent: 'flex-start', fontSize: '12px', color: 'var(--gray)' }}
        >
          <ExternalLink size={14} /> Ver app turista
        </button>
        <button 
          onClick={() => {
            useAuthStore.getState().logout()
            navigate('/login')
          }}
          className="btn btn-ghost btn-sm" 
          style={{ justifyContent: 'flex-start', fontSize: '12px', color: 'var(--red)' }}
        >
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>
      {/* Desktop Sidebar */}
      <aside 
        className="admin-sidebar"
        style={{
          width: '260px',
          height: '100vh',
          background: 'var(--card2)',
          borderRight: '1px solid var(--border)',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 100,
          display: 'none', // Overwritten by media query
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(4px)',
                zIndex: 200,
              }}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: '280px',
                background: 'var(--card2)',
                zIndex: 201,
                boxShadow: '20px 0 50px rgba(0,0,0,0.5)',
              }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        marginLeft: 'var(--sidebar-width)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}>
        {/* Topbar */}
        <header style={{
          height: '72px',
          background: 'rgba(8,7,5,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 90,
        }} className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="show-mobile"
              onClick={() => setIsMobileMenuOpen(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--white)', cursor: 'pointer' }}
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>
                {activeModule.label}
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--gray)', margin: 0 }}>
                {activeModule.description}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AdminNotifications />
            <AdminQuickActions />
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: '32px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        :root {
          --sidebar-width: 260px;
        }
        @media (max-width: 1024px) {
          :root { --sidebar-width: 0px; }
          .admin-sidebar { display: none !important; }
          .admin-topbar { padding: 0 16px; }
        }
        @media (min-width: 1025px) {
          .admin-sidebar { display: block !important; }
          .show-mobile { display: none !important; }
        }
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
        }
        .nav-item:hover {
          background: rgba(255,85,0,0.04) !important;
          color: var(--white) !important;
        }
      `}</style>
    </div>
  )
}
