import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const DATA = [
  { stars: '5★', count: 28 },
  { stars: '4★', count: 3 },
  { stars: '3★', count: 1 },
  { stars: '2★', count: 0 },
  { stars: '1★', count: 0 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--yellow)' }}>{label}: {payload[0].value} reseñas</p>
      </div>
    )
  }
  return null
}

export default function RatingChart() {
  return (
    <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
      <p className="section-label" style={{ marginBottom: '16px' }}>DISTRIBUCIÓN DE ESTRELLAS</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={DATA} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="stars"
            tick={{ fontFamily: 'IBM Plex Mono', fontSize: 12, fill: '#FFD166' }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,85,0,0.05)' }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {DATA.map((_, i) => (
              <Cell
                key={i}
                fill={i === 0 ? '#FF5500' : i === 1 ? '#FF8C00' : '#2a2318'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
