import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface Props {
  password?: string
}

export default function PasswordStrengthBar({ password = '' }: Props) {
  const strength = useMemo(() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score += 2
    if (/[A-Z]/.test(password)) score += 3
    if (/[0-9]/.test(password)) score += 3
    if (/[^A-Za-z0-9]/.test(password)) score += 2
    return score
  }, [password])

  const config = useMemo(() => {
    if (!password) return { segments: 0, color: '#2a2318', label: '' }
    if (strength <= 3) return { segments: 1, color: '#ef4444', label: 'Débil' }
    if (strength <= 6) return { segments: 2, color: '#FFAA3B', label: 'Regular' }
    if (strength <= 9) return { segments: 3, color: '#22c55e', label: 'Buena' }
    return { segments: 4, color: '#22c55e', label: 'Fuerte ✓' }
  }, [password, strength])

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', gap: '4px', flex: 1, marginRight: '16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              style={{
                flex: 1,
                height: '4px',
                background: '#2a2318',
                borderRadius: '2px',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <motion.div
                initial={false}
                animate={{
                  width: i <= config.segments ? '100%' : '0%'
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: config.color
                }}
              />
            </div>
          ))}
        </div>
        <span style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '11px', 
          color: config.segments > 0 ? config.color : 'var(--gray)',
          whiteSpace: 'nowrap'
        }}>
          {config.label}
        </span>
      </div>
    </div>
  )
}
