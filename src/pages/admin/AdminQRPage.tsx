import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { QrCode, Download, RefreshCw, Search, Eye, EyeOff } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../lib/supabase'
import { useUIStore } from '../../stores/useUIStore'

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
    const printRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadQRs()
    }, [])

    const loadQRs = async () => {
        setLoading(true)
        try {
            // Cargar QR codes
            const { data, error } = await supabase
                .from('spot_qr_codes')
                .select('*, spots(name, category)')
                .order('created_at', { ascending: false })

            if (error) {
                addToast({ type: 'error', message: 'Error cargando QR codes' })
            } else {
                setEntries((data ?? []) as QREntry[])
            }

            // Cargar visitas de hoy
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

        } catch (err) {
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
            setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, active: !e.active } : e))
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
            setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, code: newCode } : e))
            if (selectedEntry?.id === entry.id) setSelectedEntry({ ...entry, code: newCode })
            addToast({ type: 'success', message: 'QR regenerado ✓' })
        }
    }

    const handlePrint = () => {
        if (!selectedEntry) return
        const printContents = printRef.current?.innerHTML
        if (!printContents) return
        const win = window.open('', '_blank')
        if (!win) return
        win.document.write(`
      <html><head><title>QR — ${selectedEntry.spots.name}</title>
      <style>
        body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; background: white; }
        .print-card { text-align: center; padding: 32px; border: 2px solid #FF5500; border-radius: 16px; max-width: 320px; }
      </style>
      </head><body>${printContents}</body></html>
    `)
        win.document.close()
        win.print()
    }

    const filtered = entries.filter(e =>
        e.spots.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.code.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Total visitas hoy
    const totalVisitsToday = Object.values(visitsToday).reduce((a, b) => a + b, 0)

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>
                        Códigos QR
                    </h1>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--gray)', margin: 0 }}>
                        Genera e imprime los QR para tus locales aliados
                    </p>
                </div>
                <button onClick={loadQRs} className="btn btn-ghost btn-sm">
                    <RefreshCw size={14} /> Recargar
                </button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                    { label: 'QR activos', value: entries.filter(e => e.active).length, color: '#22c55e' },
                    { label: 'QR totales', value: entries.length, color: 'var(--orange)' },
                    { label: 'Escaneos hoy', value: totalVisitsToday, color: 'var(--amber)' },
                ].map(stat => (
                    <div key={stat.label} style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: stat.color, marginBottom: '4px' }}>
                            {stat.value}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>

                {/* Lista */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search size={16} color="var(--gray)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text" placeholder="Buscar por spot o código..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 10px 10px 38px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', outline: 'none' }}
                        />
                    </div>

                    {/* Table */}
                    <div style={{ background: 'var(--card2)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        {loading ? (
                            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                                Cargando...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: '48px', textAlign: 'center' }}>
                                <QrCode size={40} color="var(--muted)" style={{ marginBottom: '12px' }} />
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
                                    No hay QR codes aún — crea un spot para generar uno
                                </p>
                            </div>
                        ) : (
                            filtered.map((entry, idx) => (
                                <div
                                    key={entry.id}
                                    onClick={() => setSelectedEntry(entry)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        padding: '14px 16px',
                                        borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                                        cursor: 'pointer',
                                        background: selectedEntry?.id === entry.id ? 'rgba(255,85,0,0.06)' : 'transparent',
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    {/* Mini QR preview */}
                                    <div style={{ flexShrink: 0, opacity: entry.active ? 1 : 0.4 }}>
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
                                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: entry.active ? 'var(--white)' : 'var(--muted)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {entry.spots.name}
                                        </div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.5px' }}>
                                            {entry.code}
                                        </div>
                                    </div>

                                    {/* Visitas hoy */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        {visitsToday[entry.spot_id] > 0 && (
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                padding: '3px 8px', borderRadius: '100px',
                                                background: 'rgba(255,85,0,0.10)',
                                                border: '1px solid rgba(255,85,0,0.2)',
                                            }}>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--orange)' }}>
                                                    {visitsToday[entry.spot_id]} hoy
                                                </span>
                                            </div>
                                        )}

                                        {/* Status badge */}
                                        <span style={{
                                            fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                                            padding: '3px 8px', borderRadius: '100px',
                                            background: entry.active ? 'rgba(34,197,94,0.12)' : 'rgba(107,96,85,0.15)',
                                            color: entry.active ? '#22c55e' : 'var(--muted)',
                                            border: `1px solid ${entry.active ? 'rgba(34,197,94,0.25)' : 'rgba(107,96,85,0.25)'}`,
                                        }}>
                                            {entry.active ? 'ACTIVO' : 'INACTIVO'}
                                        </span>

                                        {/* Acciones */}
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
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Preview + Print */}
                <div style={{ position: 'sticky', top: '80px' }}>
                    {selectedEntry ? (
                        <div style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
                            {/* Preview header */}
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <QrCode size={16} color="var(--orange)" />
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--orange)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        Vista previa
                                    </span>
                                </div>
                                {/* Visitas hoy del spot seleccionado */}
                                {visitsToday[selectedEntry.spot_id] > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--orange)' }}>
                                            {visitsToday[selectedEntry.spot_id]}
                                        </span>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '1px' }}>
                                            ESCANEOS HOY
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Print card preview */}
                            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
                                <div
                                    ref={printRef}
                                    className="print-card"
                                    style={{
                                        background: 'white', borderRadius: '16px',
                                        border: '2px solid #FF5500', padding: '28px 24px',
                                        textAlign: 'center', width: '260px',
                                    }}
                                >
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#111', marginBottom: '4px' }}>
                                        burri<span style={{ color: '#FF5500' }}>to</span>
                                    </div>
                                    <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#888', marginBottom: '16px', letterSpacing: '1px' }}>
                                        LA GUÍA PIURANA
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                                        <QRCodeSVG
                                            value={`${APP_URL}/verify?code=${selectedEntry.code}`}
                                            size={180}
                                            bgColor="#ffffff"
                                            fgColor="#000000"
                                            level="H"
                                            includeMargin
                                        />
                                    </div>
                                    <div style={{ fontFamily: 'sans-serif', fontSize: '18px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>
                                        {selectedEntry.spots.name}
                                    </div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#aaa', marginBottom: '12px' }}>
                                        {selectedEntry.code}
                                    </div>
                                    <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#555', lineHeight: 1.5 }}>
                                        Escanea para verificar tu visita<br />y obtener beneficios exclusivos 🫏
                                    </div>
                                </div>
                            </div>

                            {/* URL del QR */}
                            <div style={{ margin: '0 20px 16px', padding: '10px 14px', background: 'rgba(255,85,0,0.06)', border: '1px solid rgba(255,85,0,0.15)', borderRadius: '10px' }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)', marginBottom: '4px', letterSpacing: '1px' }}>URL DEL QR</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--orange)', wordBreak: 'break-all' }}>
                                    {APP_URL}/verify?code={selectedEntry.code}
                                </div>
                            </div>

                            {/* Botón imprimir */}
                            <div style={{ padding: '0 20px 20px' }}>
                                <button onClick={handlePrint} className="btn btn-primary" style={{ width: '100%' }}>
                                    <Download size={16} /> Imprimir QR
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ background: 'var(--card2)', border: '2px dashed rgba(255,85,0,0.2)', borderRadius: '20px', padding: '48px 24px', textAlign: 'center' }}>
                            <QrCode size={40} color="var(--muted)" style={{ marginBottom: '12px' }} />
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
                                Selecciona un spot para ver su QR
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}