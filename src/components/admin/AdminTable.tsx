import { useState, useMemo, useEffect } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

export interface Column<T> {
  header: React.ReactNode
  accessor: keyof T | ((item: T) => React.ReactNode)
  sortable?: boolean
  /** Valor para ordenar cuando `accessor` es una función (si no, no hay cómo ordenar). */
  sortValue?: (item: T) => string | number
  width?: string
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
  pageSize?: number
  rowKey?: (item: T) => string
  /** Resalta filas (p. ej. las seleccionadas). */
  isRowHighlighted?: (item: T) => boolean
  emptyMessage?: React.ReactNode
}

export default function AdminTable<T>({ columns, data, onRowClick, pageSize = 10, rowKey, isRowHighlighted, emptyMessage }: Props<T>) {
  const [sortConfig, setSortConfig] = useState<{ col: number; direction: 'asc' | 'desc' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const valueOf = (col: Column<T>, item: T): unknown =>
    col.sortValue ? col.sortValue(item)
      : typeof col.accessor === 'function' ? undefined
        : item[col.accessor]

  const isSortable = (col: Column<T>) =>
    !!col.sortable && (!!col.sortValue || typeof col.accessor !== 'function')

  const sortedData = useMemo(() => {
    if (!sortConfig) return data
    const col = columns[sortConfig.col]
    if (!col) return data
    const dir = sortConfig.direction === 'asc' ? 1 : -1
    return [...data].sort((a, b) => {
      const av = valueOf(col, a) ?? ''
      const bv = valueOf(col, b) ?? ''
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv, 'es') * dir
      if ((av as any) < (bv as any)) return -dir
      if ((av as any) > (bv as any)) return dir
      return 0
    })
    // columns se recrea en cada render del padre; el índice basta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sortConfig])

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))

  // Si un filtro achica la lista, no quedarse en una página que ya no existe.
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const requestSort = (col: number) => {
    setSortConfig(prev =>
      prev?.col === col
        ? prev.direction === 'asc' ? { col, direction: 'desc' } : null
        : { col, direction: 'asc' })
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
            {columns.map((col, i) => {
              const sortable = isSortable(col)
              const active = sortConfig?.col === i
              return (
                <th
                  key={i}
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    color: active ? 'var(--orange)' : 'var(--gray)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    width: col.width,
                    cursor: sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => sortable && requestSort(i)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {col.header}
                    {sortable && (
                      <div style={{ display: 'flex', flexDirection: 'column', opacity: active ? 1 : 0.4 }}>
                        <ChevronUp size={10} color={active && sortConfig?.direction === 'asc' ? 'var(--orange)' : 'currentColor'} />
                        <ChevronDown size={10} color={active && sortConfig?.direction === 'desc' ? 'var(--orange)' : 'currentColor'} />
                      </div>
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((item, rowIndex) => {
            const highlighted = isRowHighlighted?.(item)
            return (
              <tr
                key={rowKey ? rowKey(item) : rowIndex}
                onClick={() => onRowClick?.(item)}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: highlighted ? 'rgba(255,85,0,0.08)' : 'transparent',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                }}
                className="table-row"
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                    {typeof col.accessor === 'function'
                      ? col.accessor(item)
                      : (item[col.accessor] as any)}
                  </td>
                ))}
              </tr>
            )
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--gray)', fontSize: '14px' }}>
                {emptyMessage ?? 'No hay resultados'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--gray)'
        }}>
          <div>
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, data.length)} de {data.length}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="btn btn-ghost btn-sm"
              aria-label="Página anterior"
            >
              <ChevronLeft size={14} />
            </button>
            <span>{currentPage} / {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="btn btn-ghost btn-sm"
              aria-label="Página siguiente"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .table-row:hover {
          background: rgba(255,85,0,0.05) !important;
        }
      `}</style>
    </div>
  )
}
