import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Tag, Map as MapIcon, Edit, Trash2, X } from 'lucide-react'
import { CATEGORY_LABELS } from '../../lib/constants'

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState(
    Object.entries(CATEGORY_LABELS).map(([id, cat]) => ({ id, ...cat }))
  )
  
  const [zones, setZones] = useState([
    'Piura', 'Catacaos', 'Paita', 'Colán', 'Yacila', 'Talara', 
    'Lobitos', 'Canchaque', 'Chulucanas', 'Sechura', 'Sullana'
  ])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      <header>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>Categorías y Zonas</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--gray)', margin: 0 }}>Estructura principal de búsqueda de la plataforma</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }} className="categories-grid">
        
        {/* Categorías Section */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', margin: 0 }}>Categorías</h3>
            <button className="btn btn-ghost btn-sm"><Plus size={16} /> Nueva</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map((cat) => (
              <div key={cat.id} style={{
                background: 'var(--card2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>{cat.emoji}</span>
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', margin: 0 }}>{cat.label}</p>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray)' }}>{cat.id.toUpperCase()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn btn-ghost btn-xs"><Edit size={14} /></button>
                  <button className="btn btn-ghost btn-xs" style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Zonas Section */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', margin: 0 }}>Zonas de Piura</h3>
            <button className="btn btn-ghost btn-sm"><Plus size={16} /> Nueva zona</button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {zones.map(zone => (
              <div key={zone} style={{
                background: 'rgba(255,85,0,0.05)',
                border: '1px solid rgba(255,85,0,0.2)',
                borderRadius: '20px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--white)', fontWeight: 600 }}>{zone}</span>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--gray)', cursor: 'pointer', padding: 0 }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .categories-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  )
}
