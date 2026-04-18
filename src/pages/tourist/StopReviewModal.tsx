import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star } from 'lucide-react'
import type { ItineraryStop, StopReview } from '../../types/itinerary'

interface Props {
    stop: ItineraryStop | null
    onClose: () => void
    onSave: (stopId: string, review: StopReview) => void
}

export default function StopReviewModal({ stop, onClose, onSave }: Props) {
    const [rating, setRating] = useState(0)
    const [hovered, setHoveredRating] = useState(0)
    const [liked, setLiked] = useState('')
    const [improve, setImprove] = useState('')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!stop || rating === 0) return
        setSaving(true)
        try {
            const review: StopReview = {
                rating,
                liked,
                improve,
                createdAt: new Date().toISOString(),
            }
            await onSave(stop.id, review)
            onClose()
        } finally {
            setSaving(false)
        }
    }

    return (
        <AnimatePresence>
            {stop && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 500,
                            background: 'rgba(5,4,3,0.88)',
                            backdropFilter: 'blur(8px)',
                        }}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 501,
                            padding: '16px',
                            pointerEvents: 'none',
                        }}
                    >
                        <div style={{
                            width: '100%',
                            maxWidth: '480px',
                            pointerEvents: 'auto',
                            background: 'var(--card)',
                            border: '1px solid rgba(255,120,30,0.18)',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            boxShadow: '0 40px 120px rgba(0,0,0,0.7)',
                        }}>
                            {/* Header */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', padding: '20px 24px',
                                borderBottom: '1px solid var(--border)',
                            }}>
                                <div>
                                    <p style={{
                                        fontFamily: 'var(--font-mono)', fontSize: '10px',
                                        color: 'var(--orange)', letterSpacing: '2px',
                                        textTransform: 'uppercase', marginBottom: '4px'
                                    }}>
                                        Calificar visita
                                    </p>
                                    <h3 style={{
                                        fontFamily: 'var(--font-display)', fontSize: '18px',
                                        fontWeight: 800, color: 'var(--white)',
                                        letterSpacing: '-0.5px', margin: 0
                                    }}>
                                        {stop.spotName}
                                    </h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: 'var(--muted)', cursor: 'pointer',
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Stars */}
                                <div>
                                    <p style={{
                                        fontFamily: 'var(--font-body)', fontSize: '14px',
                                        color: 'var(--muted)', marginBottom: '12px', fontWeight: 600
                                    }}>
                                        ¿Cómo fue tu experiencia?
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoveredRating(star)}
                                                onMouseLeave={() => setHoveredRating(0)}
                                                style={{
                                                    background: 'none', border: 'none',
                                                    cursor: 'pointer', padding: '4px',
                                                    transition: 'transform 0.15s',
                                                    transform: (hovered || rating) >= star ? 'scale(1.2)' : 'scale(1)',
                                                }}
                                            >
                                                <Star
                                                    size={36}
                                                    fill={(hovered || rating) >= star ? '#FFD166' : 'transparent'}
                                                    color={(hovered || rating) >= star ? '#FFD166' : 'var(--dim)'}
                                                    strokeWidth={1.5}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    {rating > 0 && (
                                        <p style={{
                                            fontFamily: 'var(--font-mono)', fontSize: '11px',
                                            color: 'var(--amber)', marginTop: '8px'
                                        }}>
                                            {rating === 1 ? 'Muy malo' :
                                                rating === 2 ? 'Regular' :
                                                    rating === 3 ? 'Bueno' :
                                                        rating === 4 ? 'Muy bueno' : '¡Excelente! 🌯'}
                                        </p>
                                    )}
                                </div>

                                {/* Liked */}
                                <div>
                                    <label style={{
                                        fontFamily: 'var(--font-body)', fontSize: '14px',
                                        color: 'var(--muted)', display: 'block',
                                        marginBottom: '8px', fontWeight: 600
                                    }}>
                                        😍 ¿Qué te gustó?
                                    </label>
                                    <textarea
                                        value={liked}
                                        onChange={e => setLiked(e.target.value)}
                                        placeholder="El ceviche estaba increíble, la atención fue..."
                                        maxLength={300}
                                        className="input"
                                        style={{ height: '80px', resize: 'none' }}
                                    />
                                </div>

                                {/* Improve */}
                                <div>
                                    <label style={{
                                        fontFamily: 'var(--font-body)', fontSize: '14px',
                                        color: 'var(--muted)', display: 'block',
                                        marginBottom: '8px', fontWeight: 600
                                    }}>
                                        🛠️ ¿Qué mejorarías?
                                    </label>
                                    <textarea
                                        value={improve}
                                        onChange={e => setImprove(e.target.value)}
                                        placeholder="Podría mejorar el tiempo de espera..."
                                        maxLength={300}
                                        className="input"
                                        style={{ height: '80px', resize: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{
                                padding: '16px 24px',
                                borderTop: '1px solid var(--border)',
                                display: 'flex', gap: '10px', flexDirection: 'column-reverse'
                            }}>
                                <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={rating === 0 || saving}
                                    className="btn btn-primary"
                                    style={{ flex: 2 }}
                                >
                                    {saving ? 'Guardando...' : '⭐ Guardar calificación'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}