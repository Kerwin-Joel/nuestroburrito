import { useThemeStore, ThemeMode } from '../../stores/useThemeStore'
import { Sun, Moon, Sunset, Settings2 } from 'lucide-react'

const options: { id: ThemeMode; label: string; Icon: React.ElementType }[] = [
  { id: 'light',    label: 'Día',    Icon: Sun      },
  { id: 'twilight', label: 'Tarde',  Icon: Sunset   },
  { id: 'dark',     label: 'Noche',  Icon: Moon     },
  { id: 'auto',     label: 'Auto',   Icon: Settings2 },
]

function optLabel(mode: ThemeMode) {
  switch (mode) {
    case 'light':    return 'Día'
    case 'twilight': return 'Tarde'
    case 'dark':     return 'Noche'
    default:         return ''
  }
}

export default function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Label */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: 'var(--muted)',
      }}>
        Apariencia
      </span>

      {/* Pill selector */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '4px',
        background: 'var(--card2)',
        padding: '4px',
        borderRadius: '14px',
        border: '1px solid var(--border)',
      }}>
        {options.map(({ id, label, Icon }) => {
          const isSelected = theme === id
          return (
            <button
              key={id}
              onClick={() => setTheme(id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '10px 4px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                background: isSelected ? 'var(--orange)' : 'transparent',
                color: isSelected ? '#FDFAF4' : 'var(--muted)',
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <Icon size={15} />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Helper text */}
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: 'var(--muted)',
        lineHeight: 1.5,
        margin: 0,
      }}>
        {theme === 'auto'
          ? 'El tema cambia automáticamente según la hora del día.'
          : `Tema ${optLabel(theme)} seleccionado permanentemente.`}
      </p>
    </div>
  )
}
