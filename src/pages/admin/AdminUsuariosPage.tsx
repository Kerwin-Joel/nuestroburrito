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
      mobile: 'full',
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
      mobile: 'actions',
      accessor: () => (
        <button className="btn btn-ghost btn-xs">
          <MoreVertical size={16} />
        </button>
      )
    }
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="adm-page">
      <header className="adm-page-header">
        <div>
          <h1 className="adm-title">Usuarios (131)</h1>
          <p className="adm-subtitle">Gestión de cuentas y accesos</p>
        </div>
      </header>

      <div className="adm-panel adm-toolbar">
        <div className="adm-tabs" role="group" aria-label="Filtrar por tipo">
          {['todos', 'turistas', 'churres'].map((tab) => (
            <button key={tab} aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab as any)} style={{ textTransform: 'capitalize' }}>
              {tab}
            </button>
          ))}
        </div>

        <div className="adm-search">
          <Search size={16} />
          <input type="text" className="adm-input" placeholder="Buscar por nombre o email..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div style={{ background: 'var(--card2)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <AdminTable columns={columns} data={filtered} />
      </div>
    </motion.div>
  )
}
