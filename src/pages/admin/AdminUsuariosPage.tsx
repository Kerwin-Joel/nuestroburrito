import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, MoreVertical, Shield, User as UserIcon, Mail } from 'lucide-react'
import AdminTable, { Column } from '../../components/admin/AdminTable'
import StatusBadge from '../../components/admin/StatusBadge'

interface UserRecord {
  id: string
  name: string
  email: string
  role: 'turista' | 'churre' | 'admin'
  itinerarios: number
  registro: string
  status: 'activo' | 'inactivo'
}

const MOCK_USERS: UserRecord[] = [
  ...Array.from({ length: 10 }).map((_, i) => ({
    id: `u-${i}`,
    name: `Usuario ${i + 1}`,
    email: `usuario${i}@gmail.com`,
    role: i === 0 ? 'admin' : i < 3 ? 'churre' : 'turista' as any,
    itinerarios: Math.floor(Math.random() * 20),
    registro: '2024-03-12',
    status: 'activo' as any
  }))
]

export default function AdminUsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'todos' | 'turistas' | 'churres'>('todos')

  const filtered = MOCK_USERS.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'todos' || (activeTab === 'turistas' && u.role === 'turista') || (activeTab === 'churres' && u.role === 'churre')
    return matchesSearch && matchesTab
  })

  const columns: Column<UserRecord>[] = [
    {
      header: 'Usuario',
      accessor: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: 'var(--dim)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--gray)'
          }}>
            <UserIcon size={16} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--white)', margin: 0 }}>{u.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={10} color="var(--gray)" />
              <span style={{ fontSize: '11px', color: 'var(--gray)', fontFamily: 'var(--font-mono)' }}>{u.email}</span>
            </div>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Rol',
      accessor: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {u.role === 'admin' && <Shield size={12} color="var(--orange)" />}
          <span style={{ 
            fontSize: '11px', 
            fontFamily: 'var(--font-mono)', 
            color: u.role === 'admin' ? 'var(--orange)' : 'var(--white)',
            textTransform: 'uppercase',
            fontWeight: 700
          }}>
            {u.role}
          </span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Itinerarios',
      accessor: 'itinerarios',
      sortable: true
    },
    {
      header: 'Registro',
      accessor: 'registro',
      sortable: true
    },
    {
      header: 'Status',
      accessor: (u) => <StatusBadge status={u.status} />,
      sortable: true
    },
    {
      header: '',
      accessor: () => (
        <button className="btn btn-ghost btn-xs">
          <MoreVertical size={16} />
        </button>
      )
    }
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>Usuarios (131)</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--gray)', margin: 0 }}>Gestión de cuentas y accesos</p>
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
      }}>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--dim)', padding: '4px', borderRadius: '10px' }}>
          {['todos', 'turistas', 'churres'].map((tab) => (
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
            placeholder="Buscar por nombre o email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', background: 'var(--dim)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 10px 10px 40px', color: 'white', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ background: 'var(--card2)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <AdminTable columns={columns} data={filtered} />
      </div>
    </motion.div>
  )
}
