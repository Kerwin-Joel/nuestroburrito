import { useEffect, useMemo, useState } from 'react'
import { BookMarked, Check } from 'lucide-react'
import { benefitsService } from '../../services/benefits'
import { useSpots } from '../../hooks/useSpots'
import { useAuthStore } from '../../stores/useAuthStore'
import { PageHeader } from '../../components/tourist/ExtrasHeader'
import SpotBottomSheet from '../../components/tourist/SpotBottomSheet'

/** Espejo de PassportScreen (PassportFavorites.kt): niveles que crecen con los spots visitados con QR. */
const LEVELS = [
  { min: 0, emoji: '🧳', name: 'Forastero' },
  { min: 1, emoji: '🎒', name: 'Visitante curioso' },
  { min: 5, emoji: '🧡', name: 'Piurano de corazón' },
  { min: 12, emoji: '🧢', name: 'Churre honorario' },
  { min: 24, emoji: '🏆', name: 'Leyenda de Piura' },
]

export default function PasaportePage() {
  const { user } = useAuthStore()
  const { spots, selectSpot, load } = useSpots()
  const [visited, setVisited] = useState<Set<string> | null>(null)

  useEffect(() => { load() }, [load])
  useEffect(() => { if (user) benefitsService.getVisitedSpotIds(user.id).then(setVisited) }, [user])

  const stamps = useMemo(() => [...spots].sort((a, b) => Number(visited?.has(b.id)) - Number(visited?.has(a.id))), [spots, visited])
  const count = visited ? stamps.filter(s => visited.has(s.id)).length : 0
  const level = [...LEVELS].reverse().find(l => count >= l.min)!
  const next = LEVELS.find(l => l.min > count)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '110px' }}>
      <PageHeader icon={<BookMarked size={16} color="var(--orange)" />} eyebrow="Tu pasaporte" title={<>Tu pasaporte<br /><span style={{ color: 'var(--orange)' }}>piurano</span></>} subtitle="Cada spot que visitas con QR es un sello nuevo." />

      <div className="page-container">
        {visited === null ? (
          <div className="skeleton" style={{ height: '300px', borderRadius: '18px' }} />
        ) : (
          <>
            <div className="card" style={{ padding: '18px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,85,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>{level.emoji}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '17px', color: 'var(--white)' }}>{level.name}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12.5px', color: 'var(--muted)' }}>{count} de {stamps.length} spots visitados</div>
                </div>
              </div>
              <div style={{ height: '6px', background: 'var(--card2)', borderRadius: '99px', overflow: 'hidden', margin: '14px 0 8px' }}>
                <div style={{ height: '100%', width: `${next ? ((count - level.min) / (next.min - level.min)) * 100 : 100}%`, background: 'var(--orange)', transition: 'width 0.6s ease' }} />
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '12.5px', color: 'var(--orange)' }}>
                {next ? `Te faltan ${next.min - count} para ser ${next.emoji} ${next.name}` : 'Llegaste a lo más alto. ¡Piura es tuya!'}
              </p>
            </div>

            <p className="section-label" style={{ marginBottom: '14px' }}>Sellos</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: '16px' }}>
              {stamps.map(spot => {
                const earned = visited.has(spot.id)
                return (
                  <button key={spot.id} onClick={() => selectSpot(spot)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden',
                        border: earned ? '3px solid var(--orange)' : '1.5px solid var(--border)',
                        opacity: earned ? 1 : 0.5,
                      }}>
                        <img src={spot.photoUrl} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: earned ? 'none' : 'grayscale(1)' }} />
                      </div>
                      {earned && (
                        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--orange)', border: '2px solid var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={12} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: earned ? 700 : 400, color: earned ? 'var(--white)' : 'var(--muted)', textAlign: 'center', lineHeight: 1.3 }}>{spot.name}</span>
                  </button>
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
