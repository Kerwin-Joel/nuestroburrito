import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUIStore } from '../../stores/useUIStore'
import { itinerariesService } from '../../services/itineraries'
import { useNavigate } from 'react-router-dom'

const GROUP_OPTIONS = [
    { id: 'solo', emoji: '👤', label: 'Solo/a' },
    { id: 'couple', emoji: '👫', label: 'En pareja' },
    { id: 'family', emoji: '👨‍👩‍👧', label: 'Familia' },
    { id: 'friends', emoji: '👯', label: 'Amigos' },
]

const TIME_OPTIONS = [
    { id: '4h', emoji: '⚡', label: 'Visita rápida', sub: 'Menos de 4h' },
    { id: '6h', emoji: '🌅', label: 'Medio día', sub: '4–6 horas' },
    { id: 'full', emoji: '☀️', label: 'Día completo', sub: '6+ horas' },
    { id: 'weekend', emoji: '📅', label: 'Fin de semana', sub: '2 días' },
]

const PLACEHOLDERS = [
    'Mi ruta piurana 🌶️',
    'Playa + ceviche 🐟',
    'Aventura en Piura 🏔️',
    'Día en el norte ☀️',
    'Catacaos y más 🧵',
]

interface Props {
    isOpen: boolean
    onClose: () => void
}

export default function CreateItineraryModal({ isOpen, onClose }: Props) {
    const { setCurrent } = useItineraryStore()
    const { user } = useAuthStore()
    const { addToast } = useUIStore()
    const navigate = useNavigate()

    const [title, setTitle] = useState('')
    const [group, setGroup] = useState('couple')
    const [time, setTime] = useState('full')
    const [creating, setCreating] = useState(false)

    const placeholder = PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]

    const handleCreate = async () => {
        if (!title.trim() || !user) return
        setCreating(true)
        try {
            const saved = await itinerariesService.save({
                userId: user.id,
                title: title.trim(),
                preferences: {
                    interests: [],
                    time: time as any,
                    group: group as any,
                    budget: 'mid',
                },
                stops: [],
                generatedBy: 'manual',
                isSaved: true,
                status: 'in_progress',
            })
            setCurrent(saved)
            onClose()
            navigate('/app/itinerario')
        } catch (err: any) {
            addToast({ type: 'error', message: 'Error creando itinerario' })
        } finally {
            setCreating(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(5,4,3,0.88)', backdropFilter: 'blur(8px)' }}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 60 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 501 }}
                    >
                        <div style={{
                            background: 'var(--card)', borderRadius: '24px 24px 0 0',
                            border: '1px solid var(--border)', padding: '24px',
                            display: 'flex', flexDirection: 'column', gap: '20px',
                        }}>
                            <div style={{ width: '36px', height: '4px', background: 'var(--dim)', borderRadius: '2px', margin: '0 auto' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--orange)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        Nueva ruta
                                    </p>
                                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: 'var(--white)', margin: 0, letterSpacing: '-0.5px' }}>
                                        ¿A dónde vamos?
                                    </h2>
                                </div>
                                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div>
                                <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                                    Ponle nombre a tu ruta
                                </label>
                                <input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                    placeholder={placeholder}
                                    autoFocus
                                    maxLength={40}
                                    className="input"
                                    style={{ fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 700 }}
                                />
                            </div>

                            <div>
                                <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', display: 'block', marginBottom: '10px', fontWeight: 600 }}>
                                    ¿Con quién vas?
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                    {GROUP_OPTIONS.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setGroup(opt.id)}
                                            style={{
                                                padding: '10px 6px', borderRadius: '12px', border: 'none',
                                                background: group === opt.id ? 'rgba(255,85,0,0.12)' : 'var(--card2)',
                                                outline: group === opt.id ? '1.5px solid var(--orange)' : '1.5px solid transparent',
                                                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', gap: '4px', transition: 'all 0.15s',
                                            }}
                                        >
                                            <span style={{ fontSize: '20px' }}>{opt.emoji}</span>
                                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, color: group === opt.id ? 'var(--orange)' : 'var(--muted)' }}>
                                                {opt.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', display: 'block', marginBottom: '10px', fontWeight: 600 }}>
                                    ¿Cuánto tiempo tienes?
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                    {TIME_OPTIONS.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setTime(opt.id)}
                                            style={{
                                                padding: '12px', borderRadius: '12px', border: 'none',
                                                background: time === opt.id ? 'rgba(255,85,0,0.12)' : 'var(--card2)',
                                                outline: time === opt.id ? '1.5px solid var(--orange)' : '1.5px solid transparent',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                gap: '10px', transition: 'all 0.15s', textAlign: 'left',
                                            }}
                                        >
                                            <span style={{ fontSize: '20px' }}>{opt.emoji}</span>
                                            <div>
                                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: time === opt.id ? 'var(--orange)' : 'var(--white)', margin: 0 }}>
                                                    {opt.label}
                                                </p>
                                                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray)', margin: 0 }}>
                                                    {opt.sub}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={!title.trim() || creating}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '16px', opacity: !title.trim() ? 0.5 : 1 }}
                            >
                                {creating
                                    ? <Loader2 size={16} className="animate-spin" />
                                    : 'Crear mi ruta →'
                                }
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}