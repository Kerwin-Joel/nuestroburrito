import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Menu, X, ArrowRight, Heart, LogOut } from 'lucide-react'
import UserAvatarMenu, { UserAvatar } from '../auth/UserAvatarMenu'
import { useAuthStore } from '../../stores/useAuthStore'

export default function Navbar() {
  const { logout } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  const staggerContainer = {
    open: {
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    },
    closed: {
      transition: { staggerChildren: 0.05, staggerDirection: -1 }
    }
  } as any

  const fadeUp = {
    open: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } },
    closed: { y: 20, opacity: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
  } as any

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: scrolled ? 'rgba(8,7,5,0.92)' : 'rgba(8,7,5,0.6)',
          borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
          transition: 'all 0.4s ease',
          padding: scrolled ? '10px 0' : '18px 0',
        }}
      >
        <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/app" style={{ textDecoration: 'none', zIndex: 1100 }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '24px',
              letterSpacing: '-1.5px',
              color: 'var(--white)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              burri<span style={{ color: 'var(--orange)' }}>to</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center', marginLeft: 'auto', marginRight: '32px' }} className="hidden-mobile">
            <NavLink to="/app/explorar" label="Explorar" current={location.pathname} />
            <UserAvatarMenu />
          </div>

          {/* CTA Desktop */}
          <Link to="/app/itinerario" className="btn btn-primary btn-sm hidden-mobile">
            Armar mi día <ArrowRight size={14} style={{ marginLeft: '4px' }} />
          </Link>

          {/* Hamburger Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="show-mobile"
            style={{
              zIndex: 10000, // Very high to stay above everything
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--white)',
              cursor: 'pointer',
              padding: '8px',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              transition: 'all 0.3s'
            }}
          >
            {isOpen ? <X size={24} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay - rendered outside nav to avoid stacking context issues */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: '#080705', // PURE SOLID BACKGROUND
              zIndex: 9000,
              display: 'flex',
              flexDirection: 'column',
              padding: '100px 32px 40px',
              overflow: 'hidden'
            }}
          >
            {/* Header in Menu */}
            <div style={{ position: 'absolute', top: '18px', left: '24px', pointerEvents: 'none' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '24px',
                letterSpacing: '-1.5px',
                color: 'var(--white)',
              }}>
                burri<span style={{ color: 'var(--orange)' }}>to</span>
              </span>
            </div>

            {/* Close Button Inside Menu */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '24px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--white)',
                cursor: 'pointer',
                padding: '8px',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                zIndex: 10001
              }}
            >
              <X size={24} />
            </button>

            <motion.div
              variants={staggerContainer}
              initial="closed"
              animate="open"
              exit="closed"
              style={{ display: 'flex', flexDirection: 'column', gap: '28px', flex: 1, justifyContent: 'center' }}
            >
              <motion.span
                variants={fadeUp}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--orange)',
                  textTransform: 'uppercase',
                  letterSpacing: '5px',
                  fontWeight: 700,
                  marginBottom: '4px'
                }}
              >
                NAVEGACIÓN
              </motion.span>

              <motion.div variants={fadeUp}>
                <Link to="/app/explorar" className="mobile-premium-link">
                  <div className="icon-circ"><Search size={22} /></div>
                  <div className="text-group">
                    <span className="title">Explorar</span>
                    <span className="subtitle">La guía definitiva de Piura</span>
                  </div>
                </Link>
              </motion.div>

              <motion.div variants={fadeUp}>
                <UserAvatarMenu align="left">
                  <UserAvatar />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--white)' }}>Mi Cuenta</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--gray)' }}>Ajustes y perfil</span>
                  </div>
                </UserAvatarMenu>
              </motion.div>

              <motion.div variants={fadeUp} style={{ marginTop: '20px' }}>
                <Link to="/app/itinerario" className="btn btn-primary" style={{
                  width: '100%',
                  height: '64px',
                  fontSize: '17px',
                  borderRadius: '18px',
                  justifyContent: 'center',
                  boxShadow: '0 12px 40px rgba(255,85,0,0.3)',
                }}>
                  Armar mi día <ArrowRight size={20} style={{ marginLeft: '12px' }} />
                </Link>

                <button
                  onClick={() => {
                    logout()
                    window.location.href = '/login'
                  }}
                  className="btn btn-ghost"
                  style={{
                    width: '100%',
                    height: '56px',
                    fontSize: '16px',
                    borderRadius: '18px',
                    justifyContent: 'center',
                    color: 'var(--red)',
                    marginTop: '8px'
                  }}
                >
                  <LogOut size={18} style={{ marginRight: '8px' }} /> Cerrar sesión
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="closed"
              animate="open"
              style={{
                marginTop: 'auto',
                textAlign: 'center',
                opacity: 0.6
              }}
            >
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--gray)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                Piura, Perú <Heart size={14} color="var(--orange)" fill="var(--orange)" /> 2026
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .hidden-mobile { display: flex; }
        .show-mobile { display: none; }
        
        .mobile-premium-link {
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .mobile-premium-link .icon-circ {
          width: 50px;
          height: 50px;
          background: #111009;
          border: 1px solid var(--border);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--orange);
          transition: all 0.3s ease;
        }

        .mobile-premium-link .text-group {
          display: flex;
          flex-direction: column;
        }

        .mobile-premium-link .title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 800;
          color: var(--white);
          letter-spacing: -0.5px;
          line-height: 1.1;
        }

        .mobile-premium-link .subtitle {
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--gray);
          margin-top: 2px;
        }

        .mobile-premium-link:active .icon-circ {
          transform: scale(0.92);
          background: var(--orange);
          color: white;
        }

        @media (max-width: 860px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </>
  )
}

function NavLink({ to, label, current }: { to: string; label: string; current: string }) {
  const active = current === to
  return (
    <Link
      to={to}
      style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: '14px',
        color: active ? 'var(--orange)' : 'var(--white)',
        textDecoration: 'none',
        transition: '0.3s',
        opacity: active ? 1 : 0.8,
        position: 'relative',
        padding: '4px 0'
      }}
    >
      {label}
      {active && (
        <motion.div
          layoutId="nav-under"
          style={{
            position: 'absolute',
            bottom: -6,
            left: 0,
            right: 0,
            height: '2px',
            background: 'var(--orange)',
            borderRadius: '4px'
          }}
        />
      )}
    </Link>
  )
}
