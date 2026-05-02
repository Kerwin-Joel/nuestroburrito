import { motion } from 'framer-motion'

/* ── Pulso base ── */
const pulse = {
    animate: { opacity: [0.4, 0.75, 0.4] },
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' as const },
}

function SkeletonBox({ w = '100%', h = 16, radius = 8, delay = 0 }: {
    w?: string | number; h?: number; radius?: number; delay?: number
}) {
    return (
        <motion.div
            animate={pulse.animate}
            transition={{ ...pulse.transition, delay }}
            style={{
                width: w, height: h, borderRadius: radius,
                background: 'var(--card2)',
                border: '1px solid var(--border)',
                flexShrink: 0,
            }}
        />
    )
}

/* ── Card skeleton (vista lista) ── */
function SpotCardSkeleton({ idx }: { idx: number }) {
    const delay = idx * 0.08
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.35 }}
            style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                gap: 0,
            }}
        >
            {/* Imagen izquierda */}
            <SkeletonBox w={110} h={110} radius={0} delay={delay} />

            {/* Contenido derecho */}
            <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                {/* Badge categoría */}
                <SkeletonBox w={72} h={18} radius={20} delay={delay + 0.05} />
                {/* Título */}
                <SkeletonBox w="85%" h={16} radius={6} delay={delay + 0.08} />
                {/* Subtítulo */}
                <SkeletonBox w="60%" h={12} radius={6} delay={delay + 0.11} />
                {/* Footer row */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <SkeletonBox w={44} h={12} radius={6} delay={delay + 0.14} />
                    <SkeletonBox w={64} h={12} radius={6} delay={delay + 0.16} />
                </div>
            </div>
        </motion.div>
    )
}

/* ── Chip skeleton (filtros) ── */
function ChipSkeleton({ w, delay }: { w: number; delay: number }) {
    return <SkeletonBox w={w} h={32} radius={100} delay={delay} />
}

/* ── Vista lista skeleton ── */
export function ExplorarListSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
                <SpotCardSkeleton key={i} idx={i} />
            ))}
        </div>
    )
}

/* ── Vista mapa skeleton ── */
export function ExplorarMapSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                height: 'calc(100vh - 140px)',
                width: '100%',
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--card)',
            }}
        >
            {/* Fondo del mapa */}
            <motion.div
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', inset: 0,
                    background: `
            linear-gradient(rgba(255,85,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,85,0,0.03) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Pins fake */}
            {[
                { top: '28%', left: '38%', delay: 0 },
                { top: '44%', left: '55%', delay: 0.2 },
                { top: '60%', left: '30%', delay: 0.4 },
                { top: '35%', left: '65%', delay: 0.15 },
                { top: '70%', left: '48%', delay: 0.35 },
                { top: '20%', left: '52%', delay: 0.55 },
            ].map(({ top, left, delay }, i) => (
                <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.05, 0.9] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', top, left,
                        width: '28px', height: '28px',
                        borderRadius: '50% 50% 50% 0',
                        transform: 'rotate(-45deg)',
                        background: 'var(--orange)',
                        opacity: 0.35,
                    }}
                />
            ))}

            {/* Texto central */}
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '10px',
            }}>
                <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ fontSize: '32px' }}
                >
                    🗺️
                </motion.div>
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: 0.2, ease: 'easeInOut' }}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '2px' }}
                >
                    CARGANDO MAPA...
                </motion.div>
            </div>

            {/* Controles fake */}
            <div style={{ position: 'absolute', bottom: '80px', right: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <SkeletonBox w={36} h={36} radius={10} />
                <SkeletonBox w={36} h={36} radius={10} delay={0.1} />
            </div>
        </motion.div>
    )
}

/* ── Filtros skeleton ── */
export function ExplorarFilterSkeleton() {
    const widths = [52, 68, 80, 72, 60, 84, 70, 76, 64]
    return (
        <div style={{
            background: 'var(--card)',
            borderBottom: '1px solid var(--border)',
            padding: '10px 16px 8px',
        }}>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'hidden' }}>
                {widths.map((w, i) => (
                    <ChipSkeleton key={i} w={w} delay={i * 0.04} />
                ))}
            </div>
            {/* Contador */}
            <div style={{ paddingTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border)' }} />
                <SkeletonBox w={80} h={10} radius={4} />
            </div>
        </div>
    )
}

/* ── Export principal ── */
export default function ExplorarSkeleton({ viewMode = 'list' }: { viewMode?: 'map' | 'list' }) {
    return (
        <div style={{ background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
            <ExplorarFilterSkeleton />
            <div style={{ flex: 1, position: 'relative' }}>
                {viewMode === 'map' ? (
                    <ExplorarMapSkeleton />
                ) : (
                    <div className="page-container" style={{ paddingTop: '16px', paddingBottom: '120px' }}>
                        <ExplorarListSkeleton />
                    </div>
                )}
            </div>
        </div>
    )
}