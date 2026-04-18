import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Shield, Zap, Globe, Save, RefreshCw, Trash2, Info } from 'lucide-react'
import { FEATURES } from '../../lib/constants'

export default function AdminConfigPage() {
  const [flags, setFlags] = useState(FEATURES)

  const toggleFlag = (key: keyof typeof FEATURES) => {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      <header>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>Configuración</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--gray)', margin: 0 }}>Ajustes globales y parámetros del sistema</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '48px' }} className="config-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          {/* App Info */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <Info size={18} color="var(--orange)" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', margin: 0 }}>Información de la App</h3>
            </div>
            
            <div style={{ 
              background: 'var(--card2)', 
              border: '1px solid var(--border)', 
              borderRadius: '20px', 
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--gray)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>Nombre de la App</label>
                <input 
                  type="text" 
                  defaultValue="Burrito"
                  style={{ width: '100%', background: 'var(--dim)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'white', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--gray)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>Ciudad Principal</label>
                <input 
                  type="text" 
                  value="Piura, Perú"
                  disabled
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'var(--gray)', cursor: 'not-allowed' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--gray)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>Versión</label>
                  <input type="text" value="1.0.0 MVP" disabled style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'var(--gray)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--gray)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>Ambiente</label>
                  <input type="text" value="Development" disabled style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'var(--gray)' }} />
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: 'fit-content' }}>
                <Save size={16} /> Guardar cambios
              </button>
            </div>
          </section>

          {/* Feature Flags */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <Zap size={18} color="var(--orange)" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', margin: 0 }}>Feature Flags</h3>
            </div>

            <div style={{ 
              background: 'var(--card2)', 
              border: '1px solid var(--border)', 
              borderRadius: '20px', 
              padding: '8px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {(Object.keys(flags) as Array<keyof typeof FEATURES>).map((key) => (
                <div key={key} style={{ 
                  padding: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--white)', margin: 0, textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--gray)', margin: 0 }}>Habilitar funcionalidad de {key}</p>
                  </div>
                  <button 
                    onClick={() => toggleFlag(key)}
                    style={{
                      width: '40px',
                      height: '20px',
                      borderRadius: '10px',
                      background: flags[key] ? 'var(--orange)' : 'var(--dim)',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: flags[key] ? '22px' : '2px',
                      transition: 'left 0.2s'
                    }} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {/* Danger Zone */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <Shield size={18} color="#ef4444" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#ef4444', margin: 0 }}>Zona de Peligro</h3>
            </div>
            
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.05)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              borderRadius: '20px', 
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: '#ef4444', padding: '12px' }}>
                <RefreshCw size={16} /> Resetear datos mock
              </button>
              <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: '#ef4444', padding: '12px' }}>
                <Trash2 size={16} /> Limpiar caché de la plataforma
              </button>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .config-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  )
}
