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
  { to: '/app',             icon: Home,     label: 'Inicio'  },
  { to: '/app/explorar',   icon: Map,      label: 'Explorar'},
  { to: '/app/itinerario', icon: Calendar, label: 'Mi día'  },
  { to: '/app/perfil',     icon: User,     label: 'Perfil'  },
]

export function TouristBottomTabBar() {
  const location = useLocation()
  const [activeIdx, setActiveIdx] = useState(0)
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 })
  const tabRefs = useRef<(HTMLDivElement | null)[]>([])
  const navRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const el = tabRefs.current[activeIdx]
    const nav = navRef.current
    if (!el || !nav) return
    const eRect = el.getBoundingClientRect()
    const nRect = nav.getBoundingClientRect()
    setPillStyle({ left: eRect.left - nRect.left, width: eRect.width })
  }, [activeIdx])

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      width: 'calc(100% - 32px)',
      maxWidth: '380px',
      pointerEvents: 'none',
    }}>
      <motion.nav
        ref={navRef}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28, delay: 0.15 }}
        style={{
          background: 'var(--card)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border)',
          borderRadius: '32px',
          display: 'flex',
          padding: '5px 6px',
          boxShadow: 'var(--shadow-card), 0 0 0 1px var(--border) inset',
          pointerEvents: 'auto',
          position: 'relative',
        }}
      >
        {/* Active pill — slides under active tab */}
        <motion.div
          animate={{ left: pillStyle.left, width: pillStyle.width }}
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
          style={{
            position: 'absolute',
            top: '5px',
            height: 'calc(100% - 10px)',
            borderRadius: '26px',
            background: 'var(--orange)',
            boxShadow: 'var(--shadow-glow)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {TOURIST_TABS.map(({ to, icon: Icon, label }, idx) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            style={{ flex: 1, textDecoration: 'none', display: 'flex', justifyContent: 'center', zIndex: 1 }}
          >
            {({ isActive }) => (
              <div
                ref={el => { tabRefs.current[idx] = el }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '9px 6px 8px',
                  borderRadius: '26px',
                  cursor: 'pointer',
                  minWidth: '62px',
                  position: 'relative',
                  userSelect: 'none',
                }}
              >
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    color={isActive ? '#FDFAF4' : 'var(--muted)'}
                  />
                </motion.div>

                <motion.span
                  animate={{
                    color: isActive ? '#FDFAF4' : 'var(--muted)',
                    fontWeight: isActive ? 700 : 500,
                  }}
                  transition={{ duration: 0.2 }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    lineHeight: 1,
                  }}
                >
                  {label}
                </motion.span>
              </div>
            )}
          </NavLink>
        ))}
      </motion.nav>
    </div>
  )
}