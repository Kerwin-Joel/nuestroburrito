import { NavLink, useLocation } from 'react-router-dom'
import { Home, Map, User, Calendar, type LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useNavPreferencesStore } from '../../stores/useNavPreferencesStore'
import { useUIStore } from '../../stores/useUIStore'
import { useFlyToBarStore } from '../../stores/useFlyToBarStore'
import { CUSTOM_TAB_OPTIONS } from '../../lib/customTabs'

/** Índice del 4º lugar (configurable) dentro de `tabs` — Inicio, Explorar, Mi día, [custom], Perfil. */
const CUSTOM_SLOT_IDX = 3

interface TabItem {
  to?: string
  action?: string
  icon: LucideIcon
  label: string
}

const FIXED_LEFT: TabItem[] = [
  { to: '/app',             icon: Home,     label: 'Inicio'  },
  { to: '/app/explorar',   icon: Map,      label: 'Explorar'},
  { to: '/app/itinerario', icon: Calendar, label: 'Mi día'  },
]
const FIXED_RIGHT: TabItem = { to: '/app/perfil', icon: User, label: 'Perfil' }

export function TouristBottomTabBar() {
  const location = useLocation()
  const customTab = useNavPreferencesStore(s => s.customTab)
  const { openModal } = useUIStore()
  const setSlotBounds = useFlyToBarStore(s => s.setSlotBounds)
  const landings = useFlyToBarStore(s => s.landings)
  const [activeIdx, setActiveIdx] = useState(0)
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 })
  const tabRefs = useRef<(HTMLDivElement | null)[]>([])
  const navRef = useRef<HTMLDivElement>(null)

  // El 4º lugar es configurable desde Perfil — espejo de CustomTab.kt.
  const customOption = CUSTOM_TAB_OPTIONS.find(o => o.id === customTab) ?? CUSTOM_TAB_OPTIONS[0]
  const tabs: TabItem[] = [
    ...FIXED_LEFT,
    { to: customOption.to, action: customOption.action, icon: customOption.icon, label: customOption.label },
    FIXED_RIGHT,
  ]

  useEffect(() => {
    const reversed = [...tabs].reverse()
    const reversedIdx = reversed.findIndex((t) =>
      !t.to ? false :
      t.to === '/app'
        ? location.pathname === '/app' || location.pathname === '/app/'
        : location.pathname.startsWith(t.to)
    )
    const idx = reversedIdx === -1 ? 0 : tabs.length - 1 - reversedIdx
    setActiveIdx(idx)
  }, [location.pathname, customTab])

  useEffect(() => {
    const el = tabRefs.current[activeIdx]
    const nav = navRef.current
    if (!el || !nav) return
    const eRect = el.getBoundingClientRect()
    const nRect = nav.getBoundingClientRect()
    setPillStyle({ left: eRect.left - nRect.left, width: eRect.width })
  }, [activeIdx])

  // Le dice a FlyToBarOverlay dónde está el botón configurable — espejo de
  // slotBounds en FlyToBarState (nativo), que el overlay usa como destino del vuelo.
  useEffect(() => {
    const el = tabRefs.current[CUSTOM_SLOT_IDX]
    if (!el) return
    const update = () => setSlotBounds(el.getBoundingClientRect())
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [customTab, setSlotBounds])

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

        {tabs.map(({ to, action, icon: Icon, label }, idx) => {
          const content = (isActive: boolean) => (
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
                key={idx === CUSTOM_SLOT_IDX ? `icon-${landings}` : 'icon'}
                initial={idx === CUSTOM_SLOT_IDX && landings > 0 ? { scale: 1.65 } : false}
                animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                transition={idx === CUSTOM_SLOT_IDX && landings > 0
                  ? { type: 'spring', stiffness: 280, damping: 11 }
                  : { type: 'spring', stiffness: 500, damping: 30 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
              >
                {idx === CUSTOM_SLOT_IDX && (
                  <motion.span
                    key={`ring-${landings}`}
                    initial={{ opacity: landings > 0 ? 0.55 : 0, scale: 0.6 }}
                    animate={{ opacity: 0, scale: 2.1 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', inset: '-10px', borderRadius: '50%',
                      border: '2px solid var(--orange)', pointerEvents: 'none',
                    }}
                  />
                )}
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
          )

          // Las 3 acciones (armar IA / escanear / emergencias) no navegan a
          // ningún lado: abren su modal desde donde el usuario esté, igual
          // que route = null en CustomTab.kt.
          if (action) {
            return (
              <button
                key={`action-${action}`}
                onClick={() => openModal(action)}
                style={{ flex: 1, background: 'none', border: 'none', padding: 0, display: 'flex', justifyContent: 'center', zIndex: 1 }}
              >
                {content(false)}
              </button>
            )
          }

          return (
            <NavLink
              key={to}
              to={to!}
              end={to === '/app'}
              style={{ flex: 1, textDecoration: 'none', display: 'flex', justifyContent: 'center', zIndex: 1 }}
            >
              {({ isActive }) => content(isActive)}
            </NavLink>
          )
        })}
      </motion.nav>
    </div>
  )
}
