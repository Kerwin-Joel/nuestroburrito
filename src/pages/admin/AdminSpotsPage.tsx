import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Edit, Trash2, Check, X, Filter, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MOCK_SPOTS } from '../../lib/mockData'
import AdminTable, { Column } from '../../components/admin/AdminTable'
import StatusBadge from '../../components/admin/StatusBadge'
import SpotFormModal from '../../components/shared/SpotFormModal'
import { CATEGORY_LABELS } from '../../lib/constants'
import { useUIStore } from '../../stores/useUIStore'
import type { Spot } from '../../types/spot'
import { spotsService } from '../../services/spots'

export default function AdminSpotsPage() {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'todos' | 'verificados' | 'pendientes' | 'rechazados'>('todos')
  const [spots, setSpots] = useState<Spot[]>([])
  const [loadingSpots, setLoadingSpots] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null)

  useEffect(() => {
    const loadSpots = async () => {
      try {
        setLoadingSpots(true)
        const data = await spotsService.getAllSpots()
        setSpots(data)
      } catch (err) {
        addToast({ type: 'error', message: 'Error cargando spots' })
      } finally {
        setLoadingSpots(false)
      }
    }
    loadSpots()
  }, [])

  const filteredSpots = useMemo(() => {
    return spots.filter(spot => {
      const matchesSearch = spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spot.address.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesTab = activeTab === 'todos' ||
        (activeTab === 'verificados' && spot.status === 'verified') ||
        (activeTab === 'pendientes' && spot.status === 'pending') ||
        (activeTab === 'rechazados' && spot.status === 'rejected')

      return matchesSearch && matchesTab
    })
  }, [searchTerm, activeTab, spots])

  const columns: Column<Spot>[] = [
    {
      header: 'Spot',
      accessor: (spot) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={spot.photoUrl}
            alt={spot.name}
            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
          />
          <div>
            <p style={{ fontWeight: 600, color: 'var(--white)', margin: 0 }}>{spot.name}</p>
            <span style={{ fontSize: '11px', color: 'var(--gray)' }}>{CATEGORY_LABELS[spot.category]?.label}</span>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Status',
      accessor: (spot) => <StatusBadge status={spot.status} />,
      sortable: true
    },
    {
      header: 'Rating',
      accessor: (spot) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--yellow)', fontWeight: 700 }}>{spot.rating}</span>
          <span style={{ color: 'var(--gray)', fontSize: '11px' }}>({spot.reviewCount})</span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Videos',
      accessor: (spot) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--amber)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{spot.tiktokUrls.length}</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.59-1.01V15.5c0 1.28-.2 2.62-1.03 3.67-.83 1.05-2.13 1.63-3.41 1.63-1.44 0-2.81-.58-3.64-1.63-.83-1.05-1.03-2.39-1.03-3.67 0-1.28.2-2.62 1.03-3.67.83-1.05 2.13-1.63 3.41-1.63.12 0 .23.01.35.02v4.03c-.12-.01-.23-.02-.35-.02-1.44 0-2.81.58-3.64 1.63-.83 1.05-1.03 2.39-1.03 3.67s.2 2.62 1.03 3.67c.83 1.05 2.13 1.63 3.41 1.63 1.44 0 2.81-.58 3.64-1.63.83-1.05 1.03-2.39 1.03-3.67V.02z" /></svg>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Acciones',
      accessor: (spot) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-ghost btn-xs"
            title="Editar"
            onClick={(e) => { e.stopPropagation(); openEditModal(spot); }}
          >
            <Edit size={14} />
          </button>
          {spot.status === 'pending' && (
            <>
              <button
                className="btn btn-ghost btn-xs"
                style={{ color: '#22c55e' }}
                title="Aprobar"
                onClick={(e) => { e.stopPropagation(); updateStatus(spot.id, 'verified'); }}
              >
                <Check size={14} />
              </button>
              <button
                className="btn btn-ghost btn-xs"
                style={{ color: '#ef4444' }}
                title="Rechazar"
                onClick={(e) => { e.stopPropagation(); updateStatus(spot.id, 'rejected'); }}
              >
                <X size={14} />
              </button>
            </>
          )}
          <button
            className="btn btn-ghost btn-xs"
            style={{ color: 'var(--gray)' }}
            title="Ver en app"
            onClick={(e) => { e.stopPropagation(); navigate(`/app/explorar?spotId=${spot.id}`); }}
          >
            <ExternalLink size={14} />
          </button>
        </div>
      )
    }
  ]

  const updateStatus = async (id: string, status: Spot['status']) => {
    try {
      await spotsService.updateStatus(id, status)
      setSpots(prev => prev.map(s => s.id === id ? { ...s, status } : s))
      addToast({
        type: 'success',
        message: `Spot ${status === 'verified' ? 'aprobado ✓' : 'rechazado'}`
      })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error' })
    }
  }

  const openAddModal = () => {
    setEditingSpot(null)
    setIsModalOpen(true)
  }

  const openEditModal = (spot: Spot) => {
    setEditingSpot(spot)
    setIsModalOpen(true)
  }

  const handleSave = async (data: any) => {
    try {
      if (editingSpot) {
        const updated = await spotsService.updateSpot(editingSpot.id, data)
        setSpots(prev => prev.map(s => s.id === editingSpot.id ? updated : s))
        addToast({ type: 'success', message: 'Spot actualizado ✓' })
      } else {
        const newSpot = await spotsService.createSpot({
          churreId: 'admin',
          ...data,
          status: 'verified',
          tiktokUrls: data.tiktokUrls ?? [],
        })
        setSpots(prev => [newSpot, ...prev])
        addToast({ type: 'success', message: 'Spot creado ✓' })
      }
      setIsModalOpen(false)
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error guardando spot' })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>
            Spots ({filteredSpots.length})
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--gray)', margin: 0 }}>
            Administra los lugares sugeridos por los churres
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Nuevo spot
        </button>
      </div>

      {/* Filters & Search */}
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
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--dim)', padding: '4px', borderRadius: '10px' }}>
          {['todos', 'verificados', 'pendientes', 'rechazados'].map((tab) => (
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

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} color="var(--gray)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar spot por nombre o zona..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--dim)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '10px 10px 10px 40px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--white)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--card2)',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        <AdminTable columns={columns} data={filteredSpots} />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .filter-bar { flex-direction: column; align-items: stretch !important; }
        }
      `}</style>
      <SpotFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingSpot}
      />
    </motion.div>
  )
}
