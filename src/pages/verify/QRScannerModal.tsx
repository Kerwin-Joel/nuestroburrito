import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, QrCode, Loader2 } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

interface Props {
    isOpen: boolean
    onClose: () => void
    onScan: (code: string) => void
}

export default function QRScannerModal({ isOpen, onClose, onScan }: Props) {
    const [error, setError] = useState<string | null>(null)
    const [starting, setStarting] = useState(true)
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const hasScanned = useRef(false)

    useEffect(() => {
        if (!isOpen) return

        hasScanned.current = false
        setError(null)
        setStarting(true)

        const scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner

        const timer = setTimeout(() => {
            scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 220, height: 220 } },
                (decodedText) => {
                    if (hasScanned.current) return
                    hasScanned.current = true

                    // Extrae el code del URL si es una URL de burrito
                    let code = decodedText
                    try {
                        const url = new URL(decodedText)
                        const param = url.searchParams.get('code')
                        if (param) code = param
                    } catch {
                        // no es URL, usa el texto directo
                    }

                    stopScanner()
                    onScan(code)
                },
                () => { } // error silencioso por frame
            )
                .then(() => setStarting(false))
                .catch((err: any) => {
                    setError('No se pudo acceder a la cámara. Verifica los permisos.')
                    setStarting(false)
                    console.error(err)
                })
        }, 300)

        return () => {
            clearTimeout(timer)
            stopScanner()
        }
    }, [isOpen])

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.stop().catch(() => { })
            scannerRef.current = null
        }
    }

    const handleClose = () => {
        stopScanner()
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={handleClose}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(4,3,2,0.95)', backdropFilter: 'blur(8px)', zIndex: 700 }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        style={{
                            position: 'fixed', bottom: '10vh', left: 0, right: 0, zIndex: 701,
                            background: 'var(--card)',
                            borderRadius: '24px 24px 0 0',
                            border: '1px solid var(--border)',
                            padding: '16px 20px 40px',  // ← menos padding
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
                            maxHeight: '70vh',  // ← limita la altura
                        }}
                    >
                        {/* Handle */}
                        <div style={{ width: '36px', height: '4px', background: 'var(--dim)', borderRadius: '2px', margin: '-8px auto 0' }} />

                        {/* Header */}
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--orange)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    Verificar visita
                                </div>
                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--white)', margin: 0, letterSpacing: '-0.5px' }}>
                                    Escanea el QR del local
                                </h3>
                            </div>
                            <button
                                onClick={handleClose}
                                style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Scanner area */}
                        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                            {/* QR reader div */}
                            <div
                                id="qr-reader"
                                style={{
                                    width: '100%', borderRadius: '16px', overflow: 'hidden',
                                    background: 'var(--card2)',
                                    minHeight: '220px',  // ← era 280px
                                    maxHeight: '45vh',  // ← agrega esto
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            />

                            {/* Corner decorations */}
                            {!error && (
                                <>
                                    {[
                                        { top: 8, left: 8, borderTop: '3px solid var(--orange)', borderLeft: '3px solid var(--orange)' },
                                        { top: 8, right: 8, borderTop: '3px solid var(--orange)', borderRight: '3px solid var(--orange)' },
                                        { bottom: 8, left: 8, borderBottom: '3px solid var(--orange)', borderLeft: '3px solid var(--orange)' },
                                        { bottom: 8, right: 8, borderBottom: '3px solid var(--orange)', borderRight: '3px solid var(--orange)' },
                                    ].map((style, i) => (
                                        <div key={i} style={{ position: 'absolute', width: '20px', height: '20px', borderRadius: '2px', ...style, pointerEvents: 'none' }} />
                                    ))}
                                </>
                            )}

                            {/* Loading overlay */}
                            {starting && !error && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '16px' }}>
                                    <Loader2 size={32} color="var(--orange)" className="animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {error ? (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '14px 16px', textAlign: 'center', width: '100%' }}>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#ef4444', margin: 0 }}>{error}</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <QrCode size={16} color="var(--muted)" />
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
                                    Apunta la cámara al código QR del local
                                </p>
                            </div>
                        )}

                        <button onClick={handleClose} className="btn btn-ghost" style={{ width: '100%' }}>
                            Cancelar
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}