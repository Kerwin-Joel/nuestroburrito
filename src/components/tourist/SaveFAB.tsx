import { motion, AnimatePresence } from 'framer-motion'
import { Save, Check, Loader2, AlertCircle } from 'lucide-react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
    status: SaveStatus
    isNew: boolean        // true = itinerario sin id (primer guardado)
    onSave: () => void
    disabled?: boolean
}

export default function SaveFAB({ status, isNew, onSave, disabled }: Props) {

    const getConfig = () => {
        if (isNew) return {
            label: 'Guardar itinerario',
            icon: <Save size={18} />,
            bg: 'var(--orange)',
            pulse: true,
        }
        switch (status) {
            case 'saving': return {
                label: 'Guardando...',
                icon: <Loader2 size={18} className="animate-spin" />,
                bg: 'var(--orange)',
                pulse: false,
            }
            case 'saved': return {
                label: '✓ Guardado',
                icon: <Check size={18} />,
                bg: '#22c55e',
                pulse: false,
            }
            case 'error': return {
                label: 'Error — reintentar',
                icon: <AlertCircle size={18} />,
                bg: '#ef4444',
                pulse: false,
            }
            default: return null // idle + no nuevo → no muestra nada
        }
    }

    const config = getConfig()

    return (
        <AnimatePresence>
            {config && (
                <motion.button
                    key={status + isNew}
                    initial={{ y: 80, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 80, opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    onClick={onSave}
                    disabled={disabled || status === 'saving'}
                    style={{
                        position: 'fixed',
                        bottom: '90px', // encima del tab bar
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 400,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '14px 28px',
                        borderRadius: '100px',
                        border: 'none',
                        background: config.bg,
                        color: 'white',
                        fontFamily: 'var(--font-body)',
                        fontSize: '15px',
                        fontWeight: 700,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        boxShadow: `0 8px 32px ${config.bg}66`,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {/* Pulse ring para itinerario nuevo */}
                    {config.pulse && (
                        <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '100px',
                                background: 'var(--orange)',
                                zIndex: -1,
                            }}
                        />
                    )}
                    {config.icon}
                    {config.label}
                </motion.button>
            )}
        </AnimatePresence>
    )
}