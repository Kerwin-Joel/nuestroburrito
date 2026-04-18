import { useState } from 'react'
import { Camera, X, Plus } from 'lucide-react'
import Topbar from '../../components/churre/Topbar'
import { MOCK_CHURRES } from '../../lib/mockData'
import { CATEGORY_LABELS, ZONES } from '../../lib/constants'
import { useUIStore } from '../../stores/useUIStore'
import { initials } from '../../lib/formatters'
import type { SpotCategory } from '../../types/spot'

const churre = { ...MOCK_CHURRES[0] }

export default function PerfilChurrePage() {
  const { addToast } = useUIStore()
  const [name, setName] = useState(churre.name)
  const [bio, setBio] = useState(churre.bio)
  const [zones, setZones] = useState<string[]>(churre.zones)
  const [specs, setSpecs] = useState<SpotCategory[]>(churre.specialties)
  const [showZoneDropdown, setShowZoneDropdown] = useState(false)
  const [showSpecDropdown, setShowSpecDropdown] = useState(false)
  const bioMax = 280

  const removeZone = (z: string) => setZones(prev => prev.filter(x => x !== z))
  const addZone = (z: string) => { if (!zones.includes(z)) setZones(prev => [...prev, z]); setShowZoneDropdown(false) }
  const removeSpec = (s: SpotCategory) => setSpecs(prev => prev.filter(x => x !== s))
  const addSpec = (s: SpotCategory) => { if (!specs.includes(s)) setSpecs(prev => [...prev, s]); setShowSpecDropdown(false) }

  const handleSave = () => {
    addToast({ type: 'success', message: '✓ Perfil actualizado correctamente' })
  }

  return (
    <div style={{ flex: 1 }}>
        <Topbar title="Mi Perfil" action={
          <button onClick={handleSave} className="btn btn-primary btn-sm">Guardar cambios →</button>
        } />

        <div style={{ padding: '28px 32px', maxWidth: '640px' }}>
          {/* Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${churre.avatarColor} 0%, var(--hot) 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '36px', color: 'white',
                border: '3px solid var(--border)',
              }}>
                {initials(name)}
              </div>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              >
                <Camera size={20} color="white" />
              </div>
            </div>

            {/* Name editable */}
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
              aria-label="Tu nombre"
              style={{ marginTop: '14px', textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px', maxWidth: '260px' }}
            />

            {/* Badges */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {churre.isVerified && <span className="badge badge-green">✓ Churre verificado</span>}
              {churre.university && <span className="badge badge-amber">{churre.university}</span>}
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '28px' }}>
            <p className="section-label" style={{ marginBottom: '10px' }}>SOBRE MÍ</p>
            <div style={{ position: 'relative' }}>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, bioMax))}
                className="input"
                aria-label="Sobre mí"
                style={{ height: '100px', paddingBottom: '28px' }}
                placeholder="Cuéntanos sobre ti y lo que haces en Piura..."
              />
              <span style={{
                position: 'absolute', bottom: '8px', right: '12px',
                fontFamily: 'var(--font-mono)', fontSize: '11px', color: bio.length >= bioMax ? '#ff4040' : 'var(--gray)',
              }}>
                {bio.length}/{bioMax}
              </span>
            </div>
          </div>

          {/* Zones */}
          <div style={{ marginBottom: '28px' }}>
            <p className="section-label" style={{ marginBottom: '10px' }}>ZONAS QUE CUBRO</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {zones.map(z => (
                <span key={z} className="chip selected" style={{ fontSize: '13px' }}>
                  {z}
                  <button onClick={() => removeZone(z)} aria-label={`Quitar ${z}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--orange)', padding: '0 0 0 4px', display: 'flex' }}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowZoneDropdown(!showZoneDropdown)} className="chip" style={{ fontSize: '13px' }}>
                  <Plus size={12} /> Añadir
                </button>
                {showZoneDropdown && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, zIndex: 100,
                    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px',
                    padding: '6px', minWidth: '160px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    maxHeight: '200px', overflowY: 'auto',
                  }}>
                    {ZONES.filter(z => !zones.includes(z)).map(z => (
                      <button key={z} onClick={() => addZone(z)} style={{
                        width: '100%', padding: '8px 12px', background: 'none', border: 'none',
                        cursor: 'pointer', color: 'var(--white)', textAlign: 'left',
                        fontFamily: 'var(--font-body)', fontSize: '13px',
                        borderRadius: '6px', transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,85,0,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div style={{ marginBottom: '32px' }}>
            <p className="section-label" style={{ marginBottom: '10px' }}>MIS ESPECIALIDADES</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {specs.map(s => {
                const cat = CATEGORY_LABELS[s]
                return (
                  <span key={s} className="chip selected" style={{ fontSize: '13px' }}>
                    {cat?.emoji} {cat?.label}
                    <button onClick={() => removeSpec(s)} aria-label={`Quitar ${cat?.label}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--orange)', padding: '0 0 0 4px', display: 'flex' }}>
                      <X size={12} />
                    </button>
                  </span>
                )
              })}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowSpecDropdown(!showSpecDropdown)} className="chip" style={{ fontSize: '13px' }}>
                  <Plus size={12} /> Añadir
                </button>
                {showSpecDropdown && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, zIndex: 100,
                    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px',
                    padding: '6px', minWidth: '180px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}>
                    {(Object.entries(CATEGORY_LABELS) as [SpotCategory, any][]).filter(([id]) => !specs.includes(id)).map(([id, cat]) => (
                      <button key={id} onClick={() => addSpec(id)} style={{
                        width: '100%', padding: '8px 12px', background: 'none', border: 'none',
                        cursor: 'pointer', color: 'var(--white)', textAlign: 'left',
                        fontFamily: 'var(--font-body)', fontSize: '13px',
                        borderRadius: '6px', transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,85,0,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        {cat.emoji} {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
            {[
              { label: 'Tours completados', value: churre.toursCount },
              { label: 'Rating promedio', value: `${churre.rating} ⭐` },
              { label: 'Años activo', value: 1 },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--yellow)', letterSpacing: '-1px' }}>{s.value}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Save button */}
          <button onClick={handleSave} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Guardar cambios →
          </button>
        </div>
    </div>
  )
}
