import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { LucideIcon } from 'lucide-react'

interface Props {
  value: number | string
  label: string
  sub?: string
  subType?: 'success' | 'warning' | 'neutral' | 'danger'
  icon: LucideIcon
}

export default function AdminStatCard({ value, label, sub, subType = 'neutral', icon: Icon }: Props) {
  const valueRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (typeof value === 'number' && valueRef.current) {
      gsap.fromTo(valueRef.current, 
        { innerText: 0 },
        { 
          innerText: value, 
          duration: 1.5, 
          ease: 'power3.out',
          snap: { innerText: 1 },
          scrollTrigger: valueRef.current
        }
      )
    }
  }, [value])

  const subColors = {
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    neutral: 'var(--gray)'
  }

  return (
    <div className="stat-card" style={{
      background: 'var(--card2)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ 
          fontFamily: 'var(--font-body)', 
          fontSize: '14px', 
          color: 'var(--gray)', 
          margin: 0,
          fontWeight: 500
        }}>
          {label}
        </p>
        <div style={{ 
          width: '36px', 
          height: '36px', 
          borderRadius: '10px', 
          background: 'rgba(255,85,0,0.1)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--orange)'
        }}>
          <Icon size={20} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span 
          ref={valueRef}
          style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '32px', 
            fontWeight: 800, 
            color: 'var(--white)',
            letterSpacing: '-1px'
          }}
        >
          {value}
        </span>
      </div>

      {sub && (
        <p style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '11px', 
          color: subColors[subType], 
          margin: 0,
          fontWeight: 600
        }}>
          {sub}
        </p>
      )}

      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        background: 'radial-gradient(circle, rgba(255,85,0,0.05) 0%, transparent 70%)',
        zIndex: 0
      }} />
    </div>
  )
}
