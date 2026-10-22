import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookMarked, Check, QrCode } from 'lucide-react'
import { useSpots } from '../../hooks/useSpots'
import { useAuthStore } from '../../stores/useAuthStore'
import { PageHeader } from '../../components/tourist/ExtrasHeader'
import { CheckInCelebration, CheckInSheet, ProgressRing } from '../../components/passport/PassportParts'
import { passportService, type CheckInResult, type SpotPassport } from '../../services/passport'
import { benefitsService } from '../../services/benefits'
import type { Spot } from '../../types/spot'

/**
 * Pasaporte — espejo de PassportScreen.kt. Cada spot visitado (QR o PIN) es un
 * sello. Los spots con premio por visitas muestran su avance y abren su
 * tarjeta de sellos; los demás solo cuentan visitas y no abren nada.
 */
const LEVELS = [
  { min: 0, emoji: '🧳', name: 'Forastero' },
  { min: 1, emoji: '🎒', name: 'Visitante curioso' },
  { min: 5, emoji: '🧡', name: 'Piurano de corazón' },
  { min: 12, emoji: '🧢', name: 'Churre honorario' },
  { min: 24, emoji: '🏆', name: 'Leyenda de Piura' },
]

export default function PasaportePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { spots, load } = useSpots()
  const [summary, setSummary] = useState<Map<string, SpotPassport> | null>(null)
  const [checkIn, setCheckIn] = useState(false)
  const [celebrate, setCelebrate] = useState<Extract<CheckInResult, { ok: true }> | null>(null)

  const refresh = useCallback(() => {
    passportService.summary()
      .then(list => setSummary(new Map(list.map(s => [s.spot_id, s]))))
      .catch(() => setSummary(new Map()))
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { refresh() }, [refresh])

  const visits = (id: string) => summary?.get(id)?.visits ?? 0
  const stamps = [...spots].sort((a, b) => visits(b.id) - visits(a.id))
  const cards = useMemo(() => spots
    .map(s => ({ spot: s, p: summary?.get(s.id) }))
    .filter((x): x is { spot: Spot; p: SpotPassport } => !!x.p?.loyalty)
    .sort((a, b) => (b.p.rewards.some(r => !r.redeemed_at) ? 1 : 0) - (a.p.rewards.some(r => !r.redeemed_at) ? 1 : 0)
      || b.p.progress / b.p.loyalty!.visits_required - a.p.progress / a.p.loyalty!.visits_required), [spots, summary])

  const count = stamps.filter(s => visits(s.id) > 0).length
  const level = [...LEVELS].reverse().find(l => count >= l.min)!
  const next = LEVELS.find(l => l.min > count)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '110px' }}>
      <PageHeader icon={<BookMarked size={16} color="var(--orange)" />} eyebrow="Tu pasaporte" title={<>Tu pasaporte<br /><span style={{ color: 'var(--orange)' }}>piurano</span></>} subtitle="Cada spot que visitas con QR o PIN es un sello nuevo." />

      <div className="page-container">
        {summary === null ? (
          <div className="skeleton" style={{ height: '300px', borderRadius: '18px' }} />
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '18px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,85,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>{level.emoji}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '17px', color: 'var(--white)' }}>{level.name}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12.5px', color: 'var(--muted)' }}>{count} de {stamps.length} spots visitados</div>
                </div>
              </div>
              <div style={{ height: '6px', background: 'var(--card2)', borderRadius: '99px', overflow: 'hidden', margin: '14px 0 8px' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${next ? ((count - level.min) / (next.min - level.min)) * 100 : 100}%` }}
                  transition={{ type: 'spring', stiffness: 60, damping: 16, delay: 0.2 }} style={{ height: '100%', background: 'var(--orange)' }} />
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '12.5px', color: 'var(--orange)', margin: 0 }}>
                {next ? `Te faltan ${next.min - count} para ser ${next.emoji} ${next.name}` : 'Llegaste a lo más alto. ¡Piura es tuya!'}
              </p>
            </motion.div>

            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setCheckIn(true)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', marginBottom: 24, borderRadius: 18, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #FF9A3C, #E8590C)', color: '#fff', textAlign: 'left', boxShadow: 'var(--shadow-glow)',
            }}>
              <span style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><QrCode size={22} /></span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', font: '700 15.5px var(--font-body)' }}>Registrar visita</span>
                <span style={{ display: 'block', font: '12.5px var(--font-body)', opacity: 0.9 }}>Escanea el QR del local y suma tu sello</span>
              </span>
            </motion.button>

            {cards.length > 0 && (
              <>
                <p className="section-label" style={{ marginBottom: 12 }}>🎁 Premios por visitas</p>
                <div className="scroll-row" style={{ marginBottom: 24, paddingBottom: 6 }}>
                  {cards.map(({ spot, p }, i) => <LoyaltyCard key={spot.id} spot={spot} p={p} index={i} onClick={() => navigate(`/app/pasaporte/${spot.id}`)} />)}
                </div>
              </>
            )}

            <p className="section-label" style={{ marginBottom: '14px' }}>Sellos</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: '18px 12px' }}>
              {stamps.map((spot, i) => (
                <StampTile key={spot.id} spot={spot} p={summary.get(spot.id)} index={i} onOpen={() => navigate(`/app/pasaporte/${spot.id}`)} />
              ))}
            </div>
          </>
        )}
      </div>

      <CheckInSheet open={checkIn} onClose={() => setCheckIn(false)} onResult={r => { setCheckIn(false); setCelebrate(r); refresh(); if (user) benefitsService.invalidateVisited(user.id) }} />
      <CheckInCelebration result={celebrate} onClose={() => {
        const r = celebrate
        setCelebrate(null)
        // Si el spot tiene premios, se abre su tarjeta para ver el avance.
        if (r?.summary.loyalty) navigate(`/app/pasaporte/${r.spot_id}`)
      }} />
    </div>
  )
}

function LoyaltyCard({ spot, p, index, onClick }: { spot: Spot; p: SpotPassport; index: number; onClick: () => void }) {
  const l = p.loyalty!
  const ready = p.rewards.filter(r => !r.redeemed_at).length
  return (
    <motion.button
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06, type: 'spring', stiffness: 260, damping: 24 }}
      whileTap={{ scale: 0.97 }} onClick={onClick}
      style={{ position: 'relative', width: 250, height: 150, borderRadius: 22, overflow: 'hidden', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow-card)' }}>
      <img src={spot.photoUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(0,0,0,.15), rgba(26,18,10,.88))' }} />
      {ready > 0 && (
        <span className="pp-shine" style={{ position: 'absolute', top: 10, right: 10, padding: '4px 10px', borderRadius: 99, background: '#2E9E5B', color: '#fff', font: '700 11px var(--font-body)' }}>
          {ready === 1 ? '¡Premio listo!' : `${ready} premios listos`}
        </span>
      )}
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, color: '#fff' }}>
        <div style={{ font: '800 16px var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.name.trim()}</div>
        <div style={{ font: '12px var(--font-body)', opacity: 0.85, marginBottom: 8 }}>{l.reward_emoji} {l.reward_title}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: l.visits_required }, (_, i) => (
            <motion.span key={i} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2 + i * 0.04 }}
              style={{ flex: 1, height: 6, borderRadius: 99, transformOrigin: 'left', background: i < p.progress ? '#FFB347' : 'rgba(255,255,255,.25)' }} />
          ))}
        </div>
        <div style={{ font: '700 11.5px var(--font-body)', marginTop: 6, opacity: 0.9 }}>{p.progress} de {l.visits_required} visitas</div>
      </div>
    </motion.button>
  )
}

function StampTile({ spot, p, index, onOpen }: { spot: Spot; p: SpotPassport | undefined; index: number; onOpen: () => void }) {
  const visits = p?.visits ?? 0
  const earned = visits > 0
  const loyalty = p?.loyalty ?? null
  const img = (
    <img src={spot.photoUrl} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: earned ? 'none' : 'grayscale(1)', opacity: earned ? 1 : 0.55 }} />
  )
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(index, 18) * 0.025, type: 'spring', stiffness: 300, damping: 22 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {/* Solo los spots con premio abren su tarjeta; los demás solo muestran sus visitas. */}
      <motion.button
        whileTap={loyalty ? { scale: 0.92 } : { rotate: [0, -6, 6, 0] }} onClick={loyalty ? onOpen : undefined}
        aria-label={loyalty ? `Ver visitas y premio de ${spot.name}` : spot.name}
        style={{ position: 'relative', background: 'none', border: 'none', padding: 0, cursor: loyalty ? 'pointer' : 'default' }}>
        {loyalty ? (
          <ProgressRing size={80} value={p!.progress / loyalty.visits_required}>{img}</ProgressRing>
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: earned ? '3px solid var(--orange)' : '1.5px solid var(--border)' }}>{img}</div>
        )}
        {loyalty ? (
          <span style={{ position: 'absolute', bottom: -4, right: -6, padding: '2px 7px', borderRadius: 99, background: 'var(--white)', color: 'var(--bg)', font: '700 10.5px var(--font-body)', border: '2px solid var(--bg)', whiteSpace: 'nowrap' }}>
            {loyalty.reward_emoji} {p!.progress}/{loyalty.visits_required}
          </span>
        ) : earned && (
          <span style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: '50%', background: 'var(--orange)', border: '2px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-14deg)' }}>
            <Check size={13} color="#fff" strokeWidth={3} />
          </span>
        )}
      </motion.button>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: earned ? 700 : 400, color: earned ? 'var(--white)' : 'var(--muted)', textAlign: 'center', lineHeight: 1.3 }}>{spot.name.trim()}</span>
      {earned && <span style={{ fontFamily: 'var(--font-body)', fontSize: '10.5px', color: 'var(--muted)', marginTop: -4 }}>{visits === 1 ? '1 visita' : `${visits} visitas`}</span>}
    </motion.div>
  )
}
