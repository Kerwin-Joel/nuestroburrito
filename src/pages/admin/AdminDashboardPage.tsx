import { motion } from 'framer-motion'
import { 
  MapPin, 
  Users, 
  Map as MapIcon, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react'
import AdminStatCard from '../../components/admin/AdminStatCard'
import AdminTable from '../../components/admin/AdminTable'
import StatusBadge from '../../components/admin/StatusBadge'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart 
} from 'recharts'

const CHART_DATA = [
  { name: 'Lun', itinerarios: 45 },
  { name: 'Mar', itinerarios: 52 },
  { name: 'Mié', itinerarios: 48 },
  { name: 'Jue', itinerarios: 70 },
  { name: 'Vie', itinerarios: 90 },
  { name: 'Sáb', itinerarios: 120 },
  { name: 'Dom', itinerarios: 110 },
]

const ACTIVITY = [
  { id: 1, type: 'spot', user: 'Carlos Ríos', action: 'subió "Playa Yacila"', time: 'hace 2h', status: 'pending' },
  { id: 2, type: 'user', user: 'Ana Flores', action: 'solicitó verificación', time: 'hace 3h', status: 'pending' },
  { id: 3, type: 'review', user: 'María G.', action: 'dejó reseña 5★ en tour #23', time: 'hace 5h', status: 'approved' },
  { id: 4, type: 'tiktok', user: 'Admin', action: 'añadió video a Catacaos', time: 'hace 1d', status: 'approved' },
]

export default function AdminDashboardPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
    >
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        <AdminStatCard 
          label="Total Spots" 
          value={12} 
          sub="3 pendientes de aprobación" 
          subType="warning" 
          icon={MapPin} 
        />
        <AdminStatCard 
          label="Total Churres" 
          value={3} 
          sub="1 pendiente de verificación" 
          subType="warning" 
          icon={Users} 
        />
        <AdminStatCard 
          label="Turistas Registrados" 
          value={128} 
          sub="+12 esta semana" 
          subType="success" 
          icon={TrendingUp} 
        />
        <AdminStatCard 
          label="Itinerarios Generados" 
          value={847} 
          sub="Promedio: 120/sem" 
          subType="neutral" 
          icon={MapIcon} 
        />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '32px' 
      }} className="dashboard-grid">
        
        {/* Left Column: Activity & Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Chart Section */}
          <section style={{
            background: 'var(--card2)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '24px',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', marginBottom: '20px' }}>
              Itinerarios generados por semana
            </h3>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA}>
                  <defs>
                    <linearGradient id="colorItin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--orange)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--orange)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--gray)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontFamily: 'var(--font-mono)' }}
                  />
                  <YAxis 
                    stroke="var(--gray)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontFamily: 'var(--font-mono)' }}
                  />
                  <Tooltip 
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--orange)', fontFamily: 'var(--font-mono)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="itinerarios" 
                    stroke="var(--orange)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorItin)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Activity Logs */}
          <section style={{
            background: 'var(--card2)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '24px',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', marginBottom: '20px' }}>
              Actividad reciente
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ACTIVITY.map(item => (
                <div key={item.id} style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      background: 'rgba(255,85,0,0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'var(--orange)'
                    }}>
                      <Clock size={16} />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', margin: 0 }}>
                        <strong>{item.user}</strong> {item.action}
                      </p>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>{item.time}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {item.status === 'pending' ? (
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }}>Revisar</button>
                    ) : (
                      <CheckCircle2 size={16} color="var(--gray)" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Pending Approvals & Quick Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <section style={{
            background: 'var(--card2)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <AlertCircle size={20} color="var(--amber)" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', margin: 0 }}>
                Pendientes <span style={{ color: 'var(--amber)', fontSize: '14px' }}>⚠️</span>
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Spots por aprobar', count: 3 },
                { label: 'Churres por verificar', count: 1 },
                { label: 'Reseñas por moderar', count: 0 },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '12px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--gray)' }}>{item.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '14px', 
                      fontWeight: 700, 
                      color: item.count > 0 ? 'var(--orange)' : 'var(--gray)'
                    }}>
                      {item.count}
                    </span>
                    {item.count > 0 && <button className="btn btn-ghost btn-xs">Ver →</button>}
                    {item.count === 0 && <CheckCircle2 size={14} color="#22c55e" />}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  )
}
