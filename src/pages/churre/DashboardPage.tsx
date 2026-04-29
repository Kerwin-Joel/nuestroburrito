import { Link } from 'react-router-dom'
import { Plus, Calendar, BarChart2, ArrowRight } from 'lucide-react'
import Topbar from '../../components/churre/Topbar'
import StatsGrid from '../../components/churre/StatsGrid'
import RevenueChart from '../../components/churre/RevenueChart'
import { MOCK_TOURS } from '../../lib/mockData'
import { formatShortDate, statusLabel, initials } from '../../lib/formatters'

const STATUS_COLOR: Record<string, string> = {
  pending: 'badge-amber', confirmed: 'badge-green', completed: 'badge-orange', cancelled: 'badge-red',
}

const STATS = [
  { label: 'Tours este mes', value: '12', sub: '+3 vs mes anterior' },
  { label: 'Ingresos',       value: 'S/ 480', sub: 'Próximo pago: viernes' },
  { label: 'Rating',         value: '4.9 ⭐', sub: 'Top 3% de Churres', subColor: 'var(--amber)' },
  { label: 'Spots activos',  value: '8', sub: '2 pendientes de verificación', subColor: 'var(--muted)' },
]

export default function DashboardPage() {
  const recent = MOCK_TOURS.slice(0, 5)

  return (
    <div style={{ flex: 1 }}>
        <Topbar
          title="Hola Carlos 👋"
          subtitle="Aquí va tu resumen de enero"
          action={
            <Link to="/churres/spots" className="btn btn-primary btn-sm">
              <Plus size={14} /> Nuevo spot
            </Link>
          }
        />

        <div style={{ padding: '28px 32px' }}>
          {/* Stats */}
          <StatsGrid stats={STATS} />

          {/* Revenue chart */}
          <RevenueChart />

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
            <Link to="/churres/spots" className="btn btn-primary btn-sm">
              <Plus size={14} /> Subir nuevo spot
            </Link>
            <Link to="/churres/tours" className="btn btn-ghost btn-sm">
              <Calendar size={14} /> Ver agenda
            </Link>
            <Link to="/churres/resenas" className="btn btn-ghost btn-sm">
              <BarChart2 size={14} /> Ver reseñas
            </Link>
          </div>

          {/* Recent activity */}
          <div className="card" style={{ padding: '20px' }}>
            <p className="section-label" style={{ marginBottom: '16px' }}>ACTIVIDAD RECIENTE</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {recent.map(tour => (
                <div key={tour.id} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--orange) 0%, var(--amber) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px', color: 'white',
                    flexShrink: 0,
                  }}>
                    {tour.touristAvatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', color: 'var(--white)' }}>
                      {tour.touristName}
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
                      {tour.type === 'half_day' ? 'Medio día' : 'Día completo'} · {formatShortDate(tour.date)}
                    </p>
                  </div>
                  <span className={`badge ${STATUS_COLOR[tour.status]}`}>{statusLabel[tour.status]}</span>
                  <ArrowRight size={14} color="var(--gray)" />
                </div>
              ))}
            </div>
          </div>
        </div>

      <style>{`
        @media (max-width: 860px) {
          .churre-sidebar { display: none !important; }
          div[style*="margin-left: 240px"] { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
