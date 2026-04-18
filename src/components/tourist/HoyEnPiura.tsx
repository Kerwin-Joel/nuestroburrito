import { Sun, Music, AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'
import { useWeather } from '../../hooks/useWeather'

export default function HoyEnPiura() {
  const { weather, loading, load } = useWeather()

  useEffect(() => { load() }, [load])

  return (
    <div style={{ marginBottom: '48px' }}>
      <p className="section-label" style={{ marginBottom: '16px' }}>HOY EN PIURA</p>
      <div className="scroll-row">
        {/* Weather Card */}
        <InfoCard
          icon={<Sun size={20} color="var(--amber)" />}
          title={loading ? '...' : `${weather?.emoji} ${weather?.temp}°C · ${weather?.condition}`}
          subtitle={loading ? 'Cargando clima...' : weather?.tip || ''}
          accent="var(--amber)"
        />
        {/* Event Card */}
        <InfoCard
          icon={<Music size={20} color="#c084fc" />}
          title="🎵 Feria de Catacaos"
          subtitle="Hoy hasta las 8pm · Artesanías y comida típica"
          accent="#c084fc"
        />
        {/* Tip Card */}
        <InfoCard
          icon={<AlertTriangle size={20} color="var(--orange)" />}
          title="⚠️ Tip del día"
          subtitle='El Chalán cierra a las 2pm los domingos. ¡No llegues tarde!'
          accent="var(--orange)"
        />
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
