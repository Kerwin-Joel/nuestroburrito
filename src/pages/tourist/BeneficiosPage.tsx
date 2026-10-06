import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Ticket, Lock, Copy, Check } from 'lucide-react'
import { benefitsService } from '../../services/benefits'
import { useSpots } from '../../hooks/useSpots'
import { useAuthStore } from '../../stores/useAuthStore'
import type { SpotBenefit } from '../../types/benefit'
import { PageHeader, EmptyBlock } from '../../components/tourist/ExtrasHeader'
import SpotBottomSheet from '../../components/tourist/SpotBottomSheet'

const SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
function formatShortDate(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d} ${SHORT_MONTHS[(m - 1 + 12) % 12]}`
}

/** Espejo de ui/extras/BenefitsScreen.kt: cupones con forma de ticket, desbloqueados al visitar el spot con QR. */
export default function BeneficiosPage() {
  const { user } = useAuthStore()
  const { spots, selectSpot, load } = useSpots()
  const [benefits, setBenefits] = useState<SpotBenefit[] | null>(null)
  const [visited, setVisited] = useState<Set<string>>(new Set())

  useEffect(() => { load() }, [load])
  useEffect(() => { benefitsService.getActive().then(setBenefits) }, [])
  useEffect(() => { if (user) benefitsService.getVisitedSpotIds(user.id).then(setVisited) }, [user])

  const spotsById = useMemo(() => new Map(spots.map(s => [s.id, s])), [spots])
  const sorted = useMemo(() => {
    if (!benefits) return []
    return [...benefits].sort((a, b) => Number(b.spotId != null && visited.has(b.spotId)) - Number(a.spotId != null && visited.has(a.spotId)))
  }, [benefits, visited])
  const unlockedCount = sorted.filter(b => b.spotId != null && visited.has(b.spotId)).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '110px' }}>
      <PageHeader icon={<Ticket size={16} color="var(--orange)" />} eyebrow="Tus beneficios" title={<>Tus<br /><span style={{ color: 'var(--orange)' }}>beneficios</span></>} subtitle="Visita spots con QR y desbloquea descuentos de verdad." />

      <div className="page-container">
        {!benefits ? (
          <div className="skeleton" style={{ height: '300px', borderRadius: '18px' }} />
        ) : sorted.length === 0 ? (
          <EmptyBlock emoji="🎟️" title="Pronto habrá cupones" subtitle="Los spots aliados están preparando descuentos para quienes los visiten." />
        ) : (
          <>
            <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🎟️</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', color: 'var(--white)' }}>Desbloqueaste {unlockedCount} de {sorted.length}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12.5px', color: 'var(--muted)' }}>
                    {unlockedCount < sorted.length ? 'Cada spot que visitas con QR abre sus cupones.' : '¡Los tienes todos, churre!'}
                  </div>
                </div>
              </div>
              <div style={{ height: '6px', background: 'var(--card2)', borderRadius: '99px', overflow: 'hidden', marginTop: '12px' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${sorted.length ? (unlockedCount / sorted.length) * 100 : 0}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} style={{ height: '100%', background: 'var(--orange)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sorted.map(benefit => {
                const spot = benefit.spotId ? spotsById.get(benefit.spotId) : undefined
                return (
                  <BenefitTicket
                    key={benefit.id}
                    benefit={benefit}
                    spotName={spot?.name}
                    unlocked={!!benefit.spotId && visited.has(benefit.spotId)}
                    onClick={spot ? () => selectSpot(spot) : undefined}
                  />
                )
              })}
            </div>
          </>
        )}
      </div>
      <SpotBottomSheet />
    </div>
  )
}

function BenefitTicket({ benefit, spotName, unlocked, onClick }: { benefit: SpotBenefit; spotName?: string; unlocked: boolean; onClick?: () => void }) {
  const [copied, setCopied] = useState(false)
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!benefit.code) return
    navigator.clipboard?.writeText(benefit.code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }
  return (
    <div className="card" onClick={onClick} style={{ display: 'flex', overflow: 'hidden', opacity: unlocked ? 1 : 0.78, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{
        width: '84px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '14px 0',
        background: unlocked ? 'var(--orange)' : 'var(--card2)',
      }}>
        {unlocked ? <span style={{ fontSize: '24px' }}>🎟️</span> : <Lock size={20} color="var(--muted)" />}
        {benefit.discountPct != null && (
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '17px', color: unlocked ? '#fff' : 'var(--muted)' }}>-{benefit.discountPct}%</span>
        )}
      </div>
      <div style={{ width: '1px', backgroundImage: 'repeating-linear-gradient(to bottom, var(--border) 0 6px, transparent 6px 12px)' }} />
      <div style={{ flex: 1, minWidth: 0, padding: '14px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14.5px', color: 'var(--white)' }}>{benefit.title}</div>
        {benefit.description && <p style={{ fontFamily: 'var(--font-body)', fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>{benefit.description}</p>}
        <div style={{ marginTop: '8px' }}>
          {unlocked ? (
            benefit.code && (
              <button onClick={copy} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '10px', border: '1px solid rgba(255,85,0,0.4)', background: 'transparent', cursor: 'pointer' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: 'var(--orange)' }}>{benefit.code}</span>
                {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} color="var(--orange)" />}
              </button>
            )
          ) : (
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '12px', color: 'var(--orange)' }}>Visita {spotName ?? 'el spot'} para desbloquearlo</span>
          )}
        </div>
        {benefit.validUntil && <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>Vence {formatShortDate(benefit.validUntil)}</p>}
      </div>
    </div>
  )
}
