import { motion } from 'framer-motion'

/** Cabecera compartida por las pantallas "extra" (Beneficios, Pasaporte, Favoritos, Tienda) — mismo lenguaje visual que Servicios/Hoteles. */
export function PageHeader({ icon, eyebrow, title, subtitle }: { icon: React.ReactNode; eyebrow: string; title: React.ReactNode; subtitle: string }) {
  return (
    <div style={{ padding: '24px 20px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,85,0,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,85,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,85,0,0.3)' }}>{icon}</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--orange)', letterSpacing: '2px', textTransform: 'uppercase' }}>{eyebrow}</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 900, color: 'var(--white)', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: '8px' }}>{title}</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5 }}>{subtitle}</p>
      </motion.div>
    </div>
  )
}

export function EmptyBlock({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <p style={{ fontSize: '40px', marginBottom: '10px' }}>{emoji}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: 'var(--white)' }}>{title}</p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>{subtitle}</p>
    </div>
  )
}
