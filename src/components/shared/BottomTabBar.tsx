import { NavLink, useLocation } from 'react-router-dom'
import { Home, Map, User, Calendar, type LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface TabItem {
  to: string
  icon: LucideIcon
  label: string
}

const TOURIST_TABS: TabItem[] = [
  { to: '/app', icon: Home, label: 'Inicio' },
  { to: '/app/explorar', icon: Map, label: 'Explorar' },
  { to: '/app/itinerario', icon: Calendar, label: 'Mi día' },
  { to: '/app/perfil', icon: User, label: 'Perfil' },
]

export function TouristBottomTabBar() {
  const location = useLocation()
  const [activeIdx, setActiveIdx] = useState(0)
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 })
  const tabRefs = useRef<(HTMLDivElement | null)[]>([])
  const navRef = useRef<HTMLDivElement>(null)

  // Find active index
  useEffect(() => {
    const reversed = [...TOURIST_TABS].reverse()
    const reversedIdx = reversed.findIndex((t: TabItem) =>
      t.to === '/app'
        ? location.pathname === '/app' || location.pathname === '/app/'
        : location.pathname.startsWith(t.to)
    )
    const idx = reversedIdx === -1 ? 0 : TOURIST_TABS.length - 1 - reversedIdx
    setActiveIdx(idx)
  }, [location.pathname])

  // Measure pill position
  useEffect(() => {
    const el = tabRefs.current[activeIdx]
    const nav = navRef.current
    if (!el || !nav) return
    const eRect = el.getBoundingClientRect()
    const nRect = nav.getBoundingClientRect()
    setPillStyle({
      left: eRect.left - nRect.left,
      width: eRect.width,
    })
  }, [activeIdx])

  return (
    <div style={{
      position: 'fixed', bottom: '16px', left: '50%',
      transform: 'translateX(-50%)', zIndex: 1000,
      width: 'calc(100% - 32px)', maxWidth: '400px',
      pointerEvents: 'none',
    }}>
      <motion.nav
        ref={navRef}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32, delay: 0.1 }}
        style={{
          background: 'rgba(12, 10, 7, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,85,0,0.18)',
          borderRadius: '28px',
          display: 'flex',
          padding: '6px 8px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,85,0,0.06) inset',
          pointerEvents: 'auto',
          position: 'relative',
        }}
      >
        {/* Sliding pill background */}
        <motion.div
          animate={{ left: pillStyle.left, width: pillStyle.width }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          style={{
            position: 'absolute',
            top: '6px', height: 'calc(100% - 12px)',
            borderRadius: '20px',
            background: 'rgba(255,85,0,0.10)',
            border: '1px solid rgba(255,85,0,0.22)',
            boxShadow: '0 0 20px rgba(255,85,0,0.12)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {TOURIST_TABS.map(({ to, icon: Icon, label }, idx) => (
          <NavLink
            key={to} to={to} end={to === '/app'}
            style={{ flex: 1, textDecoration: 'none', display: 'flex', justifyContent: 'center', zIndex: 1 }}
          >
            {({ isActive }) => (
              <div
                ref={el => { tabRefs.current[idx] = el }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '3px', padding: '7px 10px', borderRadius: '20px',
                  cursor: 'pointer', minWidth: '58px', position: 'relative',
                  userSelect: 'none',
                }}
              >
                {/* Icon with scale + color animation */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    color={isActive ? 'var(--orange)' : 'rgba(160,148,136,0.7)'}
                    style={{ transition: 'color 0.25s, stroke-width 0.25s' }}
                  />

                  {/* Glow ring when active */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        key="glow"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                          position: 'absolute',
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'radial-gradient(circle, rgba(255,85,0,0.25) 0%, transparent 70%)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Label */}
                <motion.span
                  animate={{
                    color: isActive ? 'var(--orange)' : 'rgba(140,128,118,0.65)',
                    fontWeight: isActive ? 700 : 500,
                    y: isActive ? 0 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8.5px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    lineHeight: 1,
                  }}
                >
                  {label}
                </motion.span>

                {/* Active dot */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      key="dot"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                      style={{
                        width: '3px', height: '3px', borderRadius: '50%',
                        background: 'var(--orange)',
                        boxShadow: '0 0 6px var(--orange)',
                        position: 'absolute', bottom: '-1px',
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </NavLink>
        ))}
      </motion.nav>
    </div>
  )
}