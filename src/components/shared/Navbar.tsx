import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Menu, X, ArrowRight, Heart, LogOut } from 'lucide-react'
import UserAvatarMenu, { UserAvatar } from '../auth/UserAvatarMenu'
import { useAuthStore } from '../../stores/useAuthStore'
import { useThemeStore } from '../../stores/useThemeStore'

export default function Navbar() {
  const { logout } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const location = useLocation()
  const { computedTheme } = useThemeStore()

  useEffect(() => {
    const main = document.querySelector('main')
    const target = main ?? window
    const onScroll = () => {
      const scrollTop = main ? main.scrollTop : window.scrollY
      setScrolled(scrollTop > 40)
    }
    target.addEventListener('scroll', onScroll)
    return () => target.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  // Reset logo loaded state when theme changes for smooth crossfade
  useEffect(() => {
    setLogoLoaded(false)
    const t = setTimeout(() => setLogoLoaded(true), 50)
    return () => clearTimeout(t)
  }, [computedTheme])

  const logoSrc = computedTheme === 'light' ? '/imagotipo_dark.png' : '/imagotipo_white.png'

  const staggerContainer = {
    open: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
    closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
  } as any

  const fadeUp = {
    open: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 380, damping: 28 } },
    closed: { y: 24, opacity: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
  } as any

  return (
    <>
      <motion.nav
        animate={{
          paddingTop: scrolled ? '8px' : '10px',
          paddingBottom: scrolled ? '8px' : '10px',
        }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: scrolled ? 'var(--nav-bg-scrolled)' : 'var(--nav-bg)',
          borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
          transition: 'background 0.4s ease, border-color 0.4s ease',
        }}
      >
        {/* Scrolled progress line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: scrolled ? 1 : 0, opacity: scrolled ? 1 : 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '2px',
            background: 'linear-gradient(to right, var(--orange), var(--amber))',
            transformOrigin: 'left',
            borderRadius: '0 2px 2px 0',
          }}
        />

        <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo with crossfade on theme change */}
          <Link to="/app" style={{ textDecoration: 'none', zIndex: 1100, flexShrink: 0 }}>
            <motion.div
              animate={{
                scale: scrolled ? 0.88 : 1,
              }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              whileHover={{ scale: scrolled ? 0.94 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ transformOrigin: 'left center' }}
            >
              <motion.img
                key={logoSrc}
                src={logoSrc}
                alt="Burrito"
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: logoLoaded ? 1 : 0, filter: logoLoaded ? 'blur(0px)' : 'blur(4px)' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                onLoad={() => setLogoLoaded(true)}
                style={{
                  height: '90px',
                  width: 'auto',
                  display: 'block',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(255,85,0,0.15))',
                }}
              />
            </motion.div>
          </Link>

          {/* Desktop Nav */}
          <div
            style={{ display: 'flex', gap: '32px', alignItems: 'center', marginLeft: 'auto', marginRight: '32px' }}
            className="hidden-mobile"
          >
            <NavLink to="/app/explorar" label="Explorar" current={location.pathname} />
            <UserAvatarMenu />
          </div>

          {/* CTA Desktop */}
          <motion.div
            className="hidden-mobile"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link to="/app/itinerario" className="btn btn-primary btn-sm">
              Armar mi día <ArrowRight size={14} style={{ marginLeft: '4px' }} />
            </Link>
          </motion.div>

          {/* Hamburger */}
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="show-mobile"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            style={{
              zIndex: 10000,
              background: isOpen ? 'var(--orange)' : 'var(--card)',
              border: '1px solid var(--border)',
              color: isOpen ? 'white' : 'var(--white)',
              cursor: 'pointer',
              padding: '0',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '14px',
              transition: 'background 0.25s ease, color 0.25s ease',
              boxShadow: isOpen ? '0 0 20px rgba(255,85,0,0.3)' : '0 2px 8px var(--border)',
            }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={22} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop blur */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                zIndex: 8999,
              }}
            />

            {/* Menu panel — slide from right */}
            <motion.div
              key="mobile-menu"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{
                position: 'fixed',
                top: 0, right: 0, bottom: 0,
                width: 'min(85vw, 360px)',
                backgroundColor: 'var(--bg)',
                zIndex: 9000,
                display: 'flex',
                flexDirection: 'column',
                padding: '24px',
                boxShadow: '-8px 0 40px rgba(0,0,0,0.25)',
                borderLeft: '1px solid var(--border)',
                overflow: 'hidden',
              }}
            >
              {/* Glow accent top */}
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: '200px', height: '200px',
                background: 'radial-gradient(circle, rgba(255,85,0,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800, fontSize: '22px',
                    letterSpacing: '-1px', color: 'var(--white)',
                  }}
                >
                  burri<span style={{ color: 'var(--orange)' }}>to</span>
                </motion.span>

                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.08, background: 'var(--orange)' }}
                  whileTap={{ scale: 0.92 }}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--white)',
                    cursor: 'pointer',
                    width: '40px', height: '40px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '12px',
                    transition: 'background 0.2s ease, color 0.2s ease',
                  }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Nav links */}
              <motion.div
                variants={staggerContainer}
                initial="closed"
                animate="open"
                exit="closed"
                style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}
              >
                <motion.span
                  variants={fadeUp}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '9px',
                    color: 'var(--orange)', textTransform: 'uppercase',
                    letterSpacing: '4px', fontWeight: 700, marginBottom: '8px',
                  }}
                >
                  NAVEGACIÓN
                </motion.span>

                <motion.div variants={fadeUp}>
                  <Link to="/app/explorar" className="mobile-premium-link">
                    <div className="icon-circ"><Search size={20} /></div>
                    <div className="text-group">
                      <span className="title">Explorar</span>
                      <span className="subtitle">La guía definitiva de Piura</span>
                    </div>
                  </Link>
                </motion.div>

                <motion.div variants={fadeUp} style={{ marginTop: '8px' }}>
                  <UserAvatarMenu align="left">
                    <UserAvatar />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--white)' }}>
                        Mi Cuenta
                      </span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--gray)' }}>
                        Ajustes y perfil
                      </span>
                    </div>
                  </UserAvatarMenu>
                </motion.div>

                {/* Divider */}
                <motion.div
                  variants={fadeUp}
                  style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }}
                />

                {/* CTAs */}
                <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Link
                    to="/app/itinerario"
                    className="btn btn-primary"
                    style={{
                      width: '100%', height: '56px', fontSize: '16px',
                      borderRadius: '16px', justifyContent: 'center',
                      boxShadow: 'var(--shadow-glow-lg)',
                    }}
                  >
                    Armar mi día <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                  </Link>

                  <motion.button
                    onClick={() => { logout(); window.location.href = '/login' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn btn-ghost"
                    style={{
                      width: '100%', height: '50px', fontSize: '15px',
                      borderRadius: '16px', justifyContent: 'center',
                      color: 'var(--red)',
                    }}
                  >
                    <LogOut size={16} style={{ marginRight: '8px' }} /> Cerrar sesión
                  </motion.button>
                </motion.div>
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ textAlign: 'center', paddingTop: '16px' }}
              >
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  Piura, Perú <Heart size={12} color="var(--orange)" fill="var(--orange)" /> 2026
                </p>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .hidden-mobile { display: flex; }
        .show-mobile { display: none; }

        .mobile-premium-link {
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          border-radius: 14px;
          transition: background 0.2s ease;
        }
        .mobile-premium-link:hover { background: var(--card2); }

        .mobile-premium-link .icon-circ {
          width: 46px; height: 46px;
          background: var(--card2);
          border: 1px solid var(--border);
          border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          color: var(--orange);
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .mobile-premium-link:active .icon-circ {
          transform: scale(0.9);
          background: var(--orange);
          color: white;
        }
        .mobile-premium-link .text-group {
          display: flex; flex-direction: column;
        }
        .mobile-premium-link .title {
          font-family: var(--font-display);
          font-size: 20px; font-weight: 800;
          color: var(--white); letter-spacing: -0.5px; line-height: 1.1;
        }
        .mobile-premium-link .subtitle {
          font-family: var(--font-body);
          font-size: 12px; color: var(--gray); margin-top: 2px;
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
        fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px',
        color: active ? 'var(--orange)' : 'var(--white)',
        textDecoration: 'none',
        transition: 'color 0.2s ease, opacity 0.2s ease',
        opacity: active ? 1 : 0.8,
        position: 'relative', padding: '4px 0',
      }}
    >
      {label}
      {active && (
        <motion.div
          layoutId="nav-under"
          style={{
            position: 'absolute', bottom: -6, left: 0, right: 0,
            height: '2px',
            background: 'linear-gradient(to right, var(--orange), var(--amber))',
            borderRadius: '4px',
          }}
        />
      )}
    </Link>
  )
}