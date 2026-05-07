import { Sun, Music, AlertTriangle, Loader2, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useWeather } from '../../hooks/useWeather'
import { supabase } from '../../lib/supabase'

interface HoyItem {
  id: string
  tipo: 'evento' | 'tip' | 'alerta'
  titulo: string
  subtitulo: string
}

interface ProximoEvento {
  id: string
  name: string
  event_date: string
  event_date_end: string | null
  category: string
  address: string
}

const TIPO_CONFIG = {
  evento: { icon: <Music size={20} color="#c084fc" />, accent: '#c084fc' },
  tip: { icon: <AlertTriangle size={20} color="var(--orange)" />, accent: 'var(--orange)' },
  alerta: { icon: <AlertTriangle size={20} color="#ef4444" />, accent: '#ef4444' },
}

function formatEventDate(eventDate: string, eventDateEnd: string | null): string {
  const now = new Date()
  const start = new Date(eventDate + 'T00:00:00')
  const end = eventDateEnd ? new Date(eventDateEnd + 'T00:00:00') : null

  const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Está pasando hoy o en el rango
  if (diffDays <= 0 && (!end || end >= now)) {
    if (end && end > start) {
      return `Hasta el ${end.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })}`
    }
    return 'Hoy'
  }

  if (diffDays === 1) return 'Mañana'
  if (diffDays <= 7) return `En ${diffDays} días · ${start.toLocaleDateString('es-PE', { weekday: 'long' })}`

  return start.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })
}

export default function HoyEnPiura() {
  const { weather, loading, load } = useWeather()
  const [items, setItems] = useState<HoyItem[]>([])
  const [proximoEvento, setProximoEvento] = useState<ProximoEvento | null>(null)

  useEffect(() => { load() }, [load])

  // Carga items de hoy_en_piura
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

  // Carga el evento más cercano de spots
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    supabase
      .from('spots')
      .select('id, name, event_date, event_date_end, category, address')
      .eq('status', 'verified')
      .not('event_date', 'is', null)
      .gte('event_date', today) // solo eventos futuros o de hoy
      .order('event_date', { ascending: true })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setProximoEvento(data as ProximoEvento)
      })
  }, [])

  return (
    <div style={{ marginBottom: '48px' }}>
      <p className="section-label" style={{ marginBottom: '16px' }}>HOY EN PIURA</p>
      <div className="scroll-row">

        {/* Clima — siempre primero */}
        <InfoCard
          icon={loading
            ? <Loader2 size={20} color="var(--amber)" className="animate-spin" />
            : <Sun size={20} color="var(--amber)" />
          }
          title={loading ? 'Cargando...' : `${weather?.emoji} ${weather?.temp}°C · ${weather?.condition}`}
          subtitle={loading ? '' : weather?.tip || ''}
          accent="var(--amber)"
        />

        {/* Próximo evento desde spots */}
        {proximoEvento && (
          <InfoCard
            icon={<Calendar size={20} color="#c084fc" />}
            title={`📅 ${proximoEvento.name}`}
            subtitle={`${formatEventDate(proximoEvento.event_date, proximoEvento.event_date_end)}${proximoEvento.address ? ` · ${proximoEvento.address}` : ''}`}
            accent="#c084fc"
            badge={formatEventDate(proximoEvento.event_date, proximoEvento.event_date_end) === 'Hoy' ? 'HOY' : undefined}
          />
        )}

        {/* Items dinámicos de hoy_en_piura */}
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

        {/* Fallback si no hay items ni evento */}
        {items.length === 0 && !proximoEvento && (
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

function InfoCard({ icon, title, subtitle, accent, badge }: {
  icon: React.ReactNode
  title: string
  subtitle: string
  accent: string
  badge?: string
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
      position: 'relative',
    }}>
      {/* Badge HOY */}
      {badge && (
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          background: 'rgba(192,132,252,0.15)',
          border: '1px solid rgba(192,132,252,0.3)',
          borderRadius: '6px', padding: '2px 7px',
          fontFamily: 'var(--font-mono)', fontSize: '9px',
          fontWeight: 700, color: '#c084fc', letterSpacing: '1px',
        }}>
          {badge}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        <span style={{
          fontFamily: 'var(--font-body)', fontWeight: 600,
          fontSize: '14px', color: 'var(--white)',
          paddingRight: badge ? '40px' : '0',
        }}>
          {title}
        </span>
      </div>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: '13px',
        color: 'var(--muted)', lineHeight: 1.4,
      }}>
        {subtitle}
      </p>
    </div>
  )
}