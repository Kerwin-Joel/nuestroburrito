import { Sun, Music, AlertTriangle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useWeather } from '../../hooks/useWeather'
import { supabase } from '../../lib/supabase'

interface HoyItem {
  id: string
  tipo: 'evento' | 'tip' | 'alerta'
  titulo: string
  subtitulo: string
}

const TIPO_CONFIG = {
  evento: { icon: <Music size={20} color="#c084fc" />, accent: '#c084fc' },
  tip: { icon: <AlertTriangle size={20} color="var(--orange)" />, accent: 'var(--orange)' },
  alerta: { icon: <AlertTriangle size={20} color="#ef4444" />, accent: '#ef4444' },
}

export default function HoyEnPiura() {
  const { weather, loading, load } = useWeather()
  const [items, setItems] = useState<HoyItem[]>([])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    supabase
      .from('hoy_en_piura')
      .select('*')
      .eq('activo', true)
      .eq('fecha', today)
      .order('created_at', { ascending: true })
      .then(({ data }) => setItems((data ?? []) as HoyItem[]))
  }, [])

  return (
    <div style={{ marginBottom: '48px' }}>
      <p className="section-label" style={{ marginBottom: '16px' }}>HOY EN PIURA</p>
      <div className="scroll-row">
        {/* Clima — siempre primero */}
        <InfoCard
          icon={loading ? <Loader2 size={20} color="var(--amber)" className="animate-spin" /> : <Sun size={20} color="var(--amber)" />}
          title={loading ? 'Cargando...' : `${weather?.emoji} ${weather?.temp}°C · ${weather?.condition}`}
          subtitle={loading ? '' : weather?.tip || ''}
          accent="var(--amber)"
        />
        {/* Items dinámicos de Supabase */}
        {items.map(item => {
          const cfg = TIPO_CONFIG[item.tipo]
          return (
            <InfoCard
              key={item.id}
              icon={cfg.icon}
              title={item.titulo}
              subtitle={item.subtitulo}
              accent={cfg.accent}
            />
          )
        })}
        {/* Fallback si no hay items */}
        {items.length === 0 && (
          <InfoCard
            icon={<Music size={20} color="#c084fc" />}
            title="🎵 Feria de Catacaos"
            subtitle="Hoy hasta las 8pm · Artesanías y comida típica"
            accent="#c084fc"
          />
        )}
      </div>
    </div>
  )
}

function InfoCard({ icon, title, subtitle, accent }: {
  icon: React.ReactNode; title: string; subtitle: string; accent: string
}) {
  return (
    <div style={{
      background: 'var(--card)',
      border: `1px solid var(--border)`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: '12px',
      padding: '16px 20px',
      minWidth: '240px',
      maxWidth: '280px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', color: 'var(--white)' }}>
          {title}
        </span>
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.4 }}>
        {subtitle}
      </p>
    </div>
  )
}
