import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Check, X, Star, GraduationCap, MapPin } from 'lucide-react'
import { MOCK_CHURRES, MOCK_SPOTS } from '../../lib/mockData'
import StatusBadge from '../../components/admin/StatusBadge'
import ChurreInviteModal from '../../components/admin/ChurreInviteModal'
import { useUIStore } from '../../stores/useUIStore'

export default function AdminChurresPage() {
  const { addToast } = useUIStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'todos' | 'verificados' | 'pendientes'>('todos')
  const [churres, setChurres] = useState(MOCK_CHURRES)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const updateStatus = (id: string, isVerified: boolean) => {
    setChurres(prev => prev.map(c => c.id === id ? { ...c, isVerified } : c))
    addToast({ 
      type: isVerified ? 'success' : 'info', 
      message: isVerified ? 'Churre verificado correctamente' : 'Estado de churre actualizado' 
    })
  }

  const handleEdit = (churre: any) => {
    addToast({ type: 'info', message: `Edición de perfil (${churre.name}): Módulo en desarrollo` })
  }

  const filtered = churres.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (c.university?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'todos' || 
                       (activeTab === 'verificados' && c.isVerified) ||
                       (activeTab === 'pendientes' && !c.isVerified)
    return matchesSearch && matchesTab
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>Churres ({churres.length})</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--gray)', margin: 0 }}>Administra los guías locales y su estado de verificación</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsInviteModalOpen(true)}>
          <Plus size={18} /> Invitar churre
        </button>
      </header>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'var(--card2)',
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        gap: '20px'
      }} className="filter-bar">
        <div style={{ display: 'flex', gap: '4px', background: 'var(--dim)', padding: '4px', borderRadius: '10px' }}>
          {['todos', 'verificados', 'pendientes'].map((tab) => (
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
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} color="var(--gray)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o universidad..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', background: 'var(--dim)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 10px 10px 40px', color: 'white', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '20px' 
      }}>
        {filtered.map(churre => (
          <div key={churre.id} style={{
            background: 'var(--card2)',
            border: '1px solid var(--border)',
            borderLeft: `4px solid ${churre.isVerified ? '#22c55e' : 'var(--amber)'}`,
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                background: `linear-gradient(45deg, ${churre.avatarColor}, var(--orange))`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 800,
                color: 'white',
                boxShadow: `0 4px 15px ${churre.avatarColor}44`
              }}>
                {churre.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', margin: 0 }}>{churre.name}</h3>
                  <StatusBadge status={churre.isVerified ? 'verified' : 'pending'} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <GraduationCap size={14} color="var(--gray)" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)', textTransform: 'uppercase' }}>{churre.university || 'Sin universidad'}</span>
                </div>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                {churre.bio}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {churre.zones.map(zone => (
                <span key={zone} style={{ fontSize: '10px', background: 'var(--dim)', color: 'var(--gray)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>{zone}</span>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--white)' }}>{churre.toursCount}</p>
                <p style={{ margin: 0, fontSize: '10px', color: 'var(--gray)', textTransform: 'uppercase' }}>Tours</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={12} fill="var(--yellow)" color="var(--yellow)" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--white)' }}>{churre.rating}</span>
                </div>
                <p style={{ margin: 0, fontSize: '10px', color: 'var(--gray)', textTransform: 'uppercase' }}>Rating</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} color="var(--orange)" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--white)' }}>{MOCK_SPOTS.filter(s => s.churreId === churre.id).length}</span>
                </div>
                <p style={{ margin: 0, fontSize: '10px', color: 'var(--gray)', textTransform: 'uppercase' }}>Spots</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {!churre.isVerified ? (
                <>
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ flex: 1, justifyContent: 'center', background: '#22c55e' }}
                    onClick={() => updateStatus(churre.id, true)}
                  >
                    <Check size={16} /> Verificar
                  </button>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ flex: 1, justifyContent: 'center', color: '#ef4444' }}
                    onClick={() => updateStatus(churre.id, false)}
                  >
                    <X size={16} /> Rechazar
                  </button>
                </>
              ) : (
                <button 
                  className="btn btn-ghost btn-sm" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleEdit(churre)}
                >
                  <Edit size={16} /> Editar perfil
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ChurreInviteModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
      />
    </motion.div>
  )
}
