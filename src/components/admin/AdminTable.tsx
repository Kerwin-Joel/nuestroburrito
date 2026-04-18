import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react'

export interface Column<T> {
  header: string
  accessor: keyof T | ((item: T) => React.ReactNode)
  sortable?: boolean
  width?: string
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
  pageSize?: number
}

export default function AdminTable<T>({ columns, data, onRowClick, pageSize = 10 }: Props<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | string; direction: 'asc' | 'desc' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const sortedData = useMemo(() => {
    let sortableItems = [...data]
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = typeof sortConfig.key === 'string' && typeof (a as any)[sortConfig.key] === 'undefined' ? '' : (a as any)[sortConfig.key]
        const bValue = typeof sortConfig.key === 'string' && typeof (b as any)[sortConfig.key] === 'undefined' ? '' : (b as any)[sortConfig.key]

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [data, sortConfig])

  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(data.length / pageSize)

  const requestSort = (key: keyof T | string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  return (
    <div className="admin-table-container" style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse', 
        fontFamily: 'var(--font-body)',
        color: 'var(--white)',
        fontSize: '14px',
      }}>
        <thead>
          <tr style={{ background: 'var(--card2)', borderBottom: '1px solid var(--border)' }}>
            {columns.map((col, i) => (
              <th 
                key={i} 
                style={{ 
                  textAlign: 'left', 
                  padding: '16px', 
                  color: 'var(--gray)',
                  fontWeight: 600,
                  width: col.width,
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none'
                }}
                onClick={() => col.sortable && typeof col.accessor === 'string' && requestSort(col.accessor)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {col.header}
                  {col.sortable && (
                    <div style={{ display: 'flex', flexDirection: 'column', opacity: 0.5 }}>
                      <ChevronUp size={10} color={sortConfig?.key === col.accessor && sortConfig.direction === 'asc' ? 'var(--orange)' : 'currentColor'} />
                      <ChevronDown size={10} color={sortConfig?.key === col.accessor && sortConfig.direction === 'desc' ? 'var(--orange)' : 'currentColor'} />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((item, rowIndex) => (
            <tr 
              key={rowIndex} 
              onClick={() => onRowClick?.(item)}
              style={{ 
                borderBottom: '1px solid var(--border)',
                background: rowIndex % 2 === 0 ? 'transparent' : 'rgba(255,120,30,0.02)',
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background 0.2s',
              }}
              className="table-row"
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} style={{ padding: '16px' }}>
                  {typeof col.accessor === 'function' 
                    ? col.accessor(item) 
                    : (item[col.accessor] as any)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px',
          borderTop: '1px solid var(--border)',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--gray)'
        }}>
          <div>Página {currentPage} de {totalPages}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="btn btn-ghost btn-sm"
            >
              Anterior
            </button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="btn btn-ghost btn-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <style>{`
        .table-row:hover {
          background: rgba(255,85,0,0.06) !important;
        }
      `}</style>
    </div>
  )
}
