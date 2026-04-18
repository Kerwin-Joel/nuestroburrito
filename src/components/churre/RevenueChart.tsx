import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart, ResponsiveContainer } from 'recharts'

const DATA = [
  { week: 'Feb W1', ingresos: 120 },
  { week: 'Feb W2', ingresos: 80 },
  { week: 'Feb W3', ingresos: 200 },
  { week: 'Feb W4', ingresos: 150 },
  { week: 'Mar W1', ingresos: 320 },
  { week: 'Mar W2', ingresos: 280 },
  { week: 'Mar W3', ingresos: 400 },
  { week: 'Mar W4', ingresos: 480 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--card)',
        border: '1px solid rgba(255,85,0,0.3)',
        borderRadius: '10px',
        padding: '10px 14px',
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>{label}</p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--yellow)' }}>
          S/ {payload[0].value}
        </p>
      </div>
    )
  }
  return null
}

export default function RevenueChart() {
  return (
    <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p className="section-label" style={{ marginBottom: '4px' }}>INGRESOS</p>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--white)', letterSpacing: '-0.5px' }}>
            Últimas 8 semanas
          </h3>
        </div>
        <span className="badge badge-green">+71% vs anterior</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="ingresosGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF5500" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FF5500" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,120,30,0.08)" />
          <XAxis
            dataKey="week"
            tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#6b6055' }}
            axisLine={{ stroke: 'rgba(255,120,30,0.12)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#6b6055' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="ingresos"
            stroke="#FF5500"
            strokeWidth={2.5}
            fill="url(#ingresosGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
