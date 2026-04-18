import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface StatCard {
  label: string
  value: string | number
  sub: string
  subColor?: string
}

interface Props {
  stats: StatCard[]
}

export default function StatsGrid({ stats }: Props) {
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return
      const valueEl = el.querySelector('.stat-value')
      if (!valueEl) return
      const endVal = parseFloat(String(stats[i].value).replace(/[^0-9.]/g, ''))
      if (isNaN(endVal)) return
      const prefix = String(stats[i].value).startsWith('S/') ? 'S/ ' : ''
      const suffix = String(stats[i].value).includes('⭐') ? ' ⭐' : ''
      gsap.fromTo({ val: 0 }, { val: endVal, duration: 1.5, delay: i * 0.12, ease: 'power2.out',
        onUpdate: function () {
          if (valueEl) valueEl.textContent = `${prefix}${Math.round(this.targets()[0].val)}${suffix}`
        },
      }, { val: endVal })
    })
    // fade in cards
    gsap.fromTo(refs.current.filter(Boolean),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power2.out' }
    )
  }, [stats])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
    }}>
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          ref={(el) => { refs.current[i] = el }}
          className="card"
          style={{
            padding: '20px',
            borderTop: '3px solid var(--orange)',
          }}
        >
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
            {stat.label}
          </p>
          <p className="stat-value" style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: 800,
            color: 'var(--yellow)',
            letterSpacing: '-2px',
            lineHeight: 1,
            marginBottom: '8px',
          }}>
            {stat.value}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: stat.subColor || '#25D366' }}>
            {stat.sub}
          </p>
        </div>
      ))}
    </div>
  )
}
