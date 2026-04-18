import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, MessageSquare, Check, EyeOff, Trash2, Filter } from 'lucide-react'
import { MOCK_REVIEWS } from '../../lib/mockData'
import StatusBadge from '../../components/admin/StatusBadge'

export default function AdminResenasPage() {
  const [reviews, setReviews] = useState(MOCK_REVIEWS.map(r => ({ ...r, status: 'aprobada' })))
  const [activeTab, setActiveTab] = useState<'todas' | 'pendientes' | 'aprobadas' | 'ocultas'>('todas')

  const stats = {
    promedio: 4.9,
    total: reviews.length,
    pendientes: 2
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>Moderación de Reseñas</h1>
        <div style={{ display: 'flex', gap: '32px', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star color="var(--yellow)" fill="var(--yellow)" size={16} />
            <span style={{ fontSize: '14px', color: 'var(--white)' }}>Rating promedio: <strong>{stats.promedio}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare color="var(--orange)" size={16} />
            <span style={{ fontSize: '14px', color: 'var(--white)' }}>Total reseñas: <strong>{stats.total}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status="pendiente" />
            <span style={{ fontSize: '14px', color: 'var(--white)' }}>Por moderar: <strong>{stats.pendientes}</strong></span>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '4px', background: 'var(--dim)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {['todas', 'pendientes', 'aprobadas', 'ocultas'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab ? 'var(--card2)' : 'transparent',
              color: activeTab === tab ? 'var(--orange)' : 'var(--gray)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reviews.map(rev => (
          <div key={rev.id} style={{
            background: 'var(--card2)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill={i < rev.rating ? 'var(--yellow)' : 'transparent'} color="var(--yellow)" />
                  ))}
                </div>
                <span style={{ fontWeight: 600, color: 'var(--white)' }}>{rev.touristName}</span>
                <span style={{ fontSize: '12px', color: 'var(--gray)', fontFamily: 'var(--font-mono)' }}>{rev.createdAt}</span>
              </div>
              <StatusBadge status={rev.status} />
            </div>
            
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--orange)', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
              {rev.tourType}
            </p>
            
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              "{rev.comment}"
            </p>

            <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button className="btn btn-ghost btn-sm" style={{ color: '#22c55e', gap: '6px' }}><Check size={14} /> Aprobar</button>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--amber)', gap: '6px' }}><EyeOff size={14} /> Ocultar</button>
              <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444', gap: '6px' }}><Trash2 size={14} /> Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
