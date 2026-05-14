import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { QrCode, RefreshCw, Search, Eye, EyeOff } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../lib/supabase'
import { useUIStore } from '../../stores/useUIStore'
import QRPrintCard from '../../components/admin/QRPrintCard'

interface QREntry {
    id: string
    spot_id: string
    code: string
    active: boolean
    created_at: string
    spots: { name: string; category: string }
}

const APP_URL = 'https://www.nuestroburrito.com'

export default function AdminQRPage() {
    const { addToast } = useUIStore()
    const [entries, setEntries] = useState<QREntry[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedEntry, setSelectedEntry] = useState<QREntry | null>(null)
    const [visitsToday, setVisitsToday] = useState<Record<string, number>>({})

    // ← ELIMINADO: printRef (ya vive dentro de QRPrintCard)
    // ← ELIMINADO: handlePrint   (ya vive dentro de QRPrintCard)

    useEffect(() => {
        loadQRs()
    }, [])

    const loadQRs = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('spot_qr_codes')
                .select('*, spots(name, category)')
                .order('created_at', { ascending: false })

            if (error) {
                addToast({ type: 'error', message: 'Error cargando QR codes' })
            } else {
                setEntries((data ?? []) as QREntry[])
            }

            const today = new Date().toISOString().split('T')[0]
            const { data: visits } = await supabase
                .from('spot_visits')
                .select('spot_id')
                .gte('visited_at', `${today}T00:00:00`)
                .lte('visited_at', `${today}T23:59:59`)

            const counts: Record<string, number> = {}
            visits?.forEach(v => {
                counts[v.spot_id] = (counts[v.spot_id] ?? 0) + 1
            })
            setVisitsToday(counts)
        } catch {
            addToast({ type: 'error', message: 'Error cargando datos' })
        } finally {
            setLoading(false)
        }
    }

    const toggleActive = async (entry: QREntry) => {
        const { error } = await supabase
            .from('spot_qr_codes')
            .update({ active: !entry.active })
            .eq('id', entry.id)

        if (error) {
            addToast({ type: 'error', message: 'Error actualizando QR' })
        } else {
            setEntries(prev =>
                prev.map(e => e.id === entry.id ? { ...e, active: !e.active } : e)
            )
            // Actualiza selectedEntry también si es el mismo
            if (selectedEntry?.id === entry.id) {
                setSelectedEntry(prev => prev ? { ...prev, active: !prev.active } : null)
            }
            addToast({ type: 'success', message: entry.active ? 'QR desactivado' : 'QR activado ✓' })
        }
    }

    const regenerate = async (entry: QREntry) => {
        const newCode = `BURRITO-${entry.spots.name.toUpperCase().replace(/\s+/g, '-')}-${Date.now().toString(36).toUpperCase()}`
        const { error } = await supabase
            .from('spot_qr_codes')
            .update({ code: newCode })
            .eq('id', entry.id)

        if (error) {
            addToast({ type: 'error', message: 'Error regenerando QR' })
        } else {
            setEntries(prev =>
                prev.map(e => e.id === entry.id ? { ...e, code: newCode } : e)
            )
            if (selectedEntry?.id === entry.id) {
                setSelectedEntry(prev => prev ? { ...prev, code: newCode } : null)
            }
            addToast({ type: 'success', message: 'QR regenerado ✓' })
        }
    }

    const filtered = entries.filter(e =>
        e.spots.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.code.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalVisitsToday = Object.values(visitsToday).reduce((a, b) => a + b, 0)

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{
                        fontFamily: 'var(--font-display)', fontSize: '24px',
                        fontWeight: 800, color: 'var(--white)', margin: 0,
                    }}>
                        Códigos QR
                    </h1>
                    <p style={{
                        fontFamily: 'var(--font-body)', fontSize: '14px',
                        color: 'var(--gray)', margin: 0,
                    }}>
                        Genera e imprime los QR para tus locales aliados
                    </p>
                </div>
                <button onClick={loadQRs} className="btn btn-ghost btn-sm">
                    <RefreshCw size={14} /> Recargar
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                    { label: 'QR activos', value: entries.filter(e => e.active).length, color: '#22c55e' },
                    { label: 'QR totales', value: entries.length, color: 'var(--orange)' },
                    { label: 'Escaneos hoy', value: totalVisitsToday, color: 'var(--amber)' },
                ].map(stat => (
                    <div key={stat.label} style={{
                        background: 'var(--card2)', border: '1px solid var(--border)',
                        borderRadius: '14px', padding: '16px',
                    }}>
                        <div style={{
                            fontFamily: 'var(--font-display)', fontSize: '28px',
                            fontWeight: 800, color: stat.color, marginBottom: '4px',
                        }}>
                            {stat.value}
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-mono)', fontSize: '10px',
                            color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px',
                        }}>
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Grid lista + panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>

                {/* ── Lista ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Buscador */}
                    <div style={{ position: 'relative' }}>
                        <Search
                            size={16}
                            color="var(--gray)"
                            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                            type="text"
                            placeholder="Buscar por spot o código..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'var(--card2)',
                                border: '1px solid var(--border)',
                                borderRadius: '10px',
                                padding: '10px 10px 10px 38px',
                                fontFamily: 'var(--font-body)',
                                fontSize: '14px',
                                color: 'var(--white)',
                                outline: 'none',
                            }}
                        />
                    </div>

                    {/* Tabla */}
                    <div style={{
                        background: 'var(--card2)', borderRadius: '16px',
                        border: '1px solid var(--border)', overflow: 'hidden',
                    }}>
                        {loading ? (
                            <div style={{
                                padding: '48px', textAlign: 'center',
                                color: 'var(--muted)', fontFamily: 'var(--font-body)',
                            }}>
                                Cargando...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: '48px', textAlign: 'center' }}>
                                <QrCode size={40} color="var(--muted)" style={{ marginBottom: '12px' }} />
                                <p style={{
                                    fontFamily: 'var(--font-body)', fontSize: '14px',
                                    color: 'var(--muted)', margin: 0,
                                }}>
                                    No hay QR codes aún — crea un spot para generar uno
                                </p>
                            </div>
                        ) : (
                            filtered.map((entry, idx) => (
                                <motion.div
                                    key={entry.id}
                                    onClick={() => setSelectedEntry(entry)}
                                    whileHover={{ backgroundColor: 'rgba(255,85,0,0.04)' }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        padding: '14px 16px',
                                        borderBottom: idx < filtered.length - 1
                                            ? '1px solid var(--border)' : 'none',
                                        cursor: 'pointer',
                                        background: selectedEntry?.id === entry.id
                                            ? 'rgba(255,85,0,0.06)' : 'transparent',
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    {/* Mini QR */}
                                    <div style={{ flexShrink: 0, opacity: entry.active ? 1 : 0.35 }}>
                                        <QRCodeSVG
                                            value={`${APP_URL}/verify?code=${entry.code}`}
                                            size={44}
                                            bgColor="transparent"
                                            fgColor={selectedEntry?.id === entry.id ? '#FF5500' : '#ffffff'}
                                            level="M"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontFamily: 'var(--font-display)', fontSize: '15px',
                                            fontWeight: 700,
                                            color: entry.active ? 'var(--white)' : 'var(--muted)',
                                            marginBottom: '2px',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {entry.spots.name}
                                        </div>
                                        <div style={{
                                            fontFamily: 'var(--font-mono)', fontSize: '10px',
                                            color: 'var(--muted)', letterSpacing: '0.5px',
                                        }}>
                                            {entry.code}
                                        </div>
                                    </div>

                                    {/* Badges y acciones */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        {visitsToday[entry.spot_id] > 0 && (
                                            <span style={{
                                                fontFamily: 'var(--font-mono)', fontSize: '10px',
                                                fontWeight: 700, color: 'var(--orange)',
                                                padding: '3px 8px', borderRadius: '100px',
                                                background: 'rgba(255,85,0,0.10)',
                                                border: '1px solid rgba(255,85,0,0.2)',
                                            }}>
                                                {visitsToday[entry.spot_id]} hoy
                                            </span>
                                        )}

                                        <span style={{
                                            fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                                            padding: '3px 8px', borderRadius: '100px',
                                            background: entry.active
                                                ? 'rgba(34,197,94,0.12)' : 'rgba(107,96,85,0.15)',
                                            color: entry.active ? '#22c55e' : 'var(--muted)',
                                            border: `1px solid ${entry.active
                                                ? 'rgba(34,197,94,0.25)' : 'rgba(107,96,85,0.25)'}`,
                                        }}>
                                            {entry.active ? 'ACTIVO' : 'INACTIVO'}
                                        </span>

                                        <button
                                            onClick={e => { e.stopPropagation(); toggleActive(entry) }}
                                            className="btn btn-ghost btn-xs"
                                            title={entry.active ? 'Desactivar' : 'Activar'}
                                            style={{ color: entry.active ? '#22c55e' : 'var(--muted)' }}
                                        >
                                            {entry.active ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>

                                        <button
                                            onClick={e => { e.stopPropagation(); regenerate(entry) }}
                                            className="btn btn-ghost btn-xs"
                                            title="Regenerar código"
                                            style={{ color: 'var(--muted)' }}
                                        >
                                            <RefreshCw size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Panel derecho: QRPrintCard ── */}
                <div style={{ position: 'sticky', top: '80px' }}>
                    {/* ← REEMPLAZADO: todo el bloque del panel anterior
                        por este único componente                         */}
                    <QRPrintCard
                        entry={selectedEntry}
                        visitsToday={selectedEntry ? (visitsToday[selectedEntry.spot_id] ?? 0) : 0}
                        onToggleActive={toggleActive}
                        onRegenerate={regenerate}
                    />
                </div>
            </div>
        </motion.div>
    )
}