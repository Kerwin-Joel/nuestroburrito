import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Clock, DollarSign, Star, ExternalLink, Tag, Gift, Percent, Zap, Upload, Camera, ChevronRight, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { ItineraryStop } from '../../types/itinerary'

interface SpotBenefit {
    id: string
    type: 'discount' | 'gift' | 'experience' | 'priority'
    title: string
    description: string
    code?: string
    discount_pct?: number
    valid_until?: string
    active: boolean
}

interface SpotDetail {
    id: string
    name: string
    description: string
    address: string
    lat: number
    lng: number
    local_tip?: string
    category?: string
    photo_url?: string
    schedule?: Record<string, string>
    price_range?: string
    rating?: number
    review_count?: number
}

interface Props {
    stop: ItineraryStop | null
    onClose: () => void
}

const BENEFIT_ICONS = { discount: Percent, gift: Gift, experience: Zap, priority: Star }
const BENEFIT_COLORS = {
    discount: { bg: 'rgba(255,85,0,0.10)', border: 'rgba(255,85,0,0.25)', color: 'var(--orange)' },
    gift: { bg: 'rgba(255,209,102,0.10)', border: 'rgba(255,209,102,0.25)', color: 'var(--amber)' },
    experience: { bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.25)', color: '#22c55e' },
    priority: { bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.25)', color: '#8b5cf6' },
}
const BENEFIT_LABELS = { discount: 'Descuento', gift: 'Regalo', experience: 'Experiencia', priority: 'Acceso VIP' }

const DAY_LABELS: Record<string, string> = {
    mon: 'Lun', tue: 'Mar', wed: 'Mié',
    thu: 'Jue', fri: 'Vie', sat: 'Sáb', sun: 'Dom',
}

const PRICE_LABELS: Record<string, string> = {
    '$': 'Económico · menos de S/20',
    '$$': 'Moderado · S/20–S/60',
    '$$$': 'Premium · más de S/60',
}

export default function SpotDrawer({ stop, onClose }: Props) {
    const [spot, setSpot] = useState<SpotDetail | null>(null)
    const [benefits, setBenefits] = useState<SpotBenefit[]>([])
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState<string | null>(null)

    useEffect(() => {
        console.log('spotId:', stop?.spotId)  // ← agrega esto temporalmente
        if (!stop?.spotId) { setSpot(null); setBenefits([]); return }

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stop.spotId)
        console.log('isUUID:', isUUID)  // ← y esto
        if (!isUUID) { setSpot(null); setBenefits([]); return }

        setLoading(true)
        Promise.all([
            supabase.from('spots').select('*').eq('id', stop.spotId).single(),
            supabase.from('spot_benefits').select('*').eq('spot_id', stop.spotId).eq('active', true),
        ]).then(([{ data: spotData }, { data: bData }]) => {
            if (spotData) setSpot(spotData as SpotDetail)
            setBenefits((bData ?? []) as SpotBenefit[])
        }).finally(() => setLoading(false))
    }, [stop?.spotId])

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        setCopied(code)
        setTimeout(() => setCopied(null), 2000)
    }

    const mapsUrl = spot
        ? `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`
        : ''

    return (
        <AnimatePresence>
            {stop && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 600,
                            background: 'rgba(5,4,3,0.85)', backdropFilter: 'blur(6px)',
                        }}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        style={{
                            position: 'fixed', bottom: 10, left: 0, right: 0,
                            zIndex: 601, maxHeight: '70vh', overflowY: 'auto',
                            background: 'var(--card)',
                            borderRadius: '24px 24px 0 0',
                            border: '1px solid var(--border)',
                        }}
                    >
                        {/* Handle */}
                        <div style={{
                            width: '36px', height: '4px', background: 'var(--dim)',
                            borderRadius: '2px', margin: '12px auto 0',
                        }} />

                        {/* Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                            padding: '16px 20px 0',
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {spot?.category && (
                                    <div style={{
                                        fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
                                        color: 'var(--orange)', letterSpacing: '2px',
                                        textTransform: 'uppercase', marginBottom: '4px',
                                    }}>
                                        {spot.category}
                                    </div>
                                )}
                                <h2 style={{
                                    fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800,
                                    color: 'var(--white)', margin: 0, letterSpacing: '-0.5px',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                    {stop.spotName}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'var(--card2)', border: 'none', borderRadius: '50%',
                                    width: '32px', height: '32px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)',
                                    flexShrink: 0, marginLeft: '12px',
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                                Cargando info del spot...
                            </div>
                        ) : (
                            <div style={{ padding: '16px 20px 100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Foto */}
                                {spot?.photo_url && (
                                    <div style={{
                                        width: '100%', height: '180px', borderRadius: '14px', overflow: 'hidden',
                                        background: 'var(--card2)',
                                    }}>
                                        <img
                                            src={spot.photo_url} alt={spot.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                )}

                                {/* Rating + precio */}
                                {(spot?.rating || spot?.price_range) && (
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        {spot.rating && (
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '6px 12px', borderRadius: '100px',
                                                background: 'rgba(255,209,102,0.10)',
                                                border: '1px solid rgba(255,209,102,0.2)',
                                            }}>
                                                <Star size={13} color="var(--amber)" fill="var(--amber)" />
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--amber)' }}>
                                                    {spot.rating.toFixed(1)}
                                                </span>
                                                {spot.review_count && (
                                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)' }}>
                                                        ({spot.review_count})
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {spot.price_range && (
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '6px 12px', borderRadius: '100px',
                                                background: 'rgba(255,255,255,0.04)',
                                                border: '1px solid var(--border)',
                                            }}>
                                                <DollarSign size={13} color="var(--muted)" />
                                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)' }}>
                                                    {PRICE_LABELS[spot.price_range] ?? spot.price_range}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Descripción */}
                                {(spot?.description || stop.description) && (
                                    <div>
                                        <div style={{
                                            fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
                                            color: 'var(--muted)', letterSpacing: '1.5px',
                                            textTransform: 'uppercase', marginBottom: '8px',
                                        }}>
                                            Sobre el lugar
                                        </div>
                                        <p style={{
                                            fontFamily: 'var(--font-body)', fontSize: '14px',
                                            color: 'var(--muted)', lineHeight: 1.65, margin: 0,
                                        }}>
                                            {spot?.description ?? stop.description}
                                        </p>
                                    </div>
                                )}

                                {/* Local tip */}
                                {(spot?.local_tip || stop.localTip) && (
                                    <div style={{
                                        display: 'flex', gap: '10px', alignItems: 'flex-start',
                                        background: 'rgba(255,170,59,0.08)',
                                        border: '1px solid rgba(255,170,59,0.2)',
                                        borderRadius: '12px', padding: '14px',
                                    }}>
                                        <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
                                        <div>
                                            <div style={{
                                                fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
                                                color: 'var(--amber)', letterSpacing: '1.5px',
                                                textTransform: 'uppercase', marginBottom: '4px',
                                            }}>
                                                Tip Burrito
                                            </div>
                                            <p style={{
                                                fontFamily: 'var(--font-body)', fontSize: '13px',
                                                color: 'var(--amber)', lineHeight: 1.55, margin: 0,
                                            }}>
                                                {spot?.local_tip ?? stop.localTip}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Horarios */}
                                {spot?.schedule && Object.keys(spot.schedule).length > 0 && (
                                    <div>
                                        <div style={{
                                            fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
                                            color: 'var(--muted)', letterSpacing: '1.5px',
                                            textTransform: 'uppercase', marginBottom: '10px',
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                        }}>
                                            <Clock size={12} /> Horarios
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {Object.entries(spot.schedule).map(([day, hours]) => (
                                                <div key={day} style={{
                                                    display: 'flex', justifyContent: 'space-between',
                                                    fontFamily: 'var(--font-body)', fontSize: '13px',
                                                    padding: '6px 0',
                                                    borderBottom: '1px solid var(--border)',
                                                }}>
                                                    <span style={{ color: 'var(--muted)' }}>{DAY_LABELS[day] ?? day}</span>
                                                    <span style={{ color: 'var(--white)', fontWeight: 600 }}>{hours}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Beneficios */}
                                {benefits.length > 0 && (
                                    <div>
                                        <div style={{
                                            fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
                                            color: 'var(--orange)', letterSpacing: '1.5px',
                                            textTransform: 'uppercase', marginBottom: '10px',
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                        }}>
                                            <Tag size={12} /> Beneficios exclusivos Burrito
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {benefits.map(b => {
                                                const Icon = BENEFIT_ICONS[b.type]
                                                const colors = BENEFIT_COLORS[b.type]
                                                return (
                                                    <div key={b.id} style={{
                                                        background: colors.bg,
                                                        border: `1px solid ${colors.border}`,
                                                        borderRadius: '14px', padding: '16px',
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                            <div style={{
                                                                width: '28px', height: '28px', borderRadius: '8px',
                                                                background: colors.bg, border: `1px solid ${colors.border}`,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            }}>
                                                                <Icon size={14} color={colors.color} />
                                                            </div>
                                                            <div>
                                                                <div style={{
                                                                    fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                                                                    color: colors.color, letterSpacing: '1.5px', textTransform: 'uppercase',
                                                                }}>
                                                                    {BENEFIT_LABELS[b.type]}
                                                                    {b.discount_pct ? ` · ${b.discount_pct}% OFF` : ''}
                                                                </div>
                                                                <div style={{
                                                                    fontFamily: 'var(--font-display)', fontSize: '15px',
                                                                    fontWeight: 800, color: 'var(--white)', letterSpacing: '-0.3px',
                                                                }}>
                                                                    {b.title}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p style={{
                                                            fontFamily: 'var(--font-body)', fontSize: '13px',
                                                            color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 12px',
                                                        }}>
                                                            {b.description}
                                                        </p>
                                                        {b.code && (
                                                            <button
                                                                onClick={() => copyCode(b.code!)}
                                                                style={{
                                                                    width: '100%', padding: '10px 14px',
                                                                    background: 'var(--card2)',
                                                                    border: `1.5px dashed ${colors.border}`,
                                                                    borderRadius: '10px', cursor: 'pointer',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                    transition: 'all 0.2s',
                                                                }}
                                                            >
                                                                <span style={{
                                                                    fontFamily: 'var(--font-mono)', fontSize: '15px',
                                                                    fontWeight: 700, color: colors.color, letterSpacing: '2px',
                                                                }}>
                                                                    {b.code}
                                                                </span>
                                                                <span style={{
                                                                    fontFamily: 'var(--font-body)', fontSize: '12px',
                                                                    color: copied === b.code ? '#22c55e' : 'var(--muted)',
                                                                    fontWeight: 600,
                                                                }}>
                                                                    {copied === b.code ? '✓ Copiado' : 'Tocar para copiar'}
                                                                </span>
                                                            </button>
                                                        )}
                                                        {b.valid_until && (
                                                            <div style={{
                                                                fontFamily: 'var(--font-mono)', fontSize: '10px',
                                                                color: 'var(--muted)', marginTop: '8px', textAlign: 'right',
                                                            }}>
                                                                Válido hasta {new Date(b.valid_until).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Dirección + Cómo llegar */}
                                {spot?.address && (
                                    <div style={{
                                        background: 'var(--card2)', border: '1px solid var(--border)',
                                        borderRadius: '14px', padding: '16px',
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                    }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '10px',
                                            background: 'rgba(255,85,0,0.10)', border: '1px solid rgba(255,85,0,0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <MapPin size={16} color="var(--orange)" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
                                                color: 'var(--muted)', letterSpacing: '1.5px',
                                                textTransform: 'uppercase', marginBottom: '2px',
                                            }}>
                                                Dirección
                                            </div>
                                            <div style={{
                                                fontFamily: 'var(--font-body)', fontSize: '13px',
                                                color: 'var(--white)', fontWeight: 600,
                                            }}>
                                                {spot.address}
                                            </div>
                                        </div>
                                        <a
                                            href={mapsUrl} target="_blank" rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                padding: '8px 12px', borderRadius: '8px',
                                                background: 'var(--orange)', color: 'var(--bg)',
                                                fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700,
                                                textDecoration: 'none', flexShrink: 0,
                                            }}
                                        >
                                            Ir <ExternalLink size={11} />
                                        </a>
                                    </div>
                                )}

                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}