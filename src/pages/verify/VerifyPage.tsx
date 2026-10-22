import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, XCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { itinerariesService } from '../../services/itineraries'
import { benefitsService } from '../../services/benefits'
import { checkInMessage, passportService, type CheckInResult } from '../../services/passport'
import { CheckInCelebration, CheckInSheet } from '../../components/passport/PassportParts'

/**
 * Lo que abre un QR de Burrito (impreso en el local o el del panel del dueño).
 * Un solo escaneo hace las dos cosas:
 *  • suma la visita al pasaporte (y al premio del local, si tiene), y
 *  • si el spot está en tu itinerario en curso, marca la asistencia a esa parada.
 * La validación es del servidor (visit_check_in): el cliente no ve los códigos.
 */
export default function VerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { setCurrent } = useItineraryStore()
  // Sin código en el enlace no hay nada que verificar.
  const [state, setState] = useState<'loading' | 'error' | 'done'>(() => (searchParams.get('code') ? 'loading' : 'error'))
  const [errorMsg, setErrorMsg] = useState(() => (searchParams.get('code') ? '' : 'Código QR inválido'))
  const [pinFor, setPinFor] = useState<{ spotId: string; spotName: string } | null>(null)
  const [celebrate, setCelebrate] = useState<Extract<CheckInResult, { ok: true }> | null>(null)
  const [attended, setAttended] = useState(false)
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const started = useRef(false)


  /** Itinerario en curso del usuario (para la asistencia). */
  const activeItinerary = async () => {
    if (!user) return null
    const list = await itinerariesService.getByUser(user.id).catch(() => [])
    return list.find(i => i.status === 'in_progress') ?? null
  }

  const run = async (code: string) => {
    const active = await activeItinerary()
    setActiveId(active?.id)
    try {
      const r = await passportService.checkIn({ code, itineraryId: active?.id })
      if (!r.ok) {
        // El local valida con PIN: se pide ahí mismo.
        if (r.reason === 'PIN_REQUIRED' && r.spot_id) { setPinFor({ spotId: r.spot_id, spotName: r.spot_name ?? '' }); return }
        setState('error'); setErrorMsg(checkInMessage(r)); return
      }
      await onOk(r)
    } catch {
      setState('error'); setErrorMsg('No se pudo verificar tu visita. Revisa tu conexión.')
    }
  }

  const onOk = async (r: Extract<CheckInResult, { ok: true }>) => {
    if (user) benefitsService.invalidateVisited(user.id)
    // Asistencia: la parada del spot en el itinerario en curso queda marcada.
    const active = await activeItinerary()
    const stop = active?.stops.find(s => s.spotId === r.spot_id)
    if (active && stop && !stop.visited) {
      const stops = active.stops.map(s => (s.id === stop.id ? { ...s, visited: true } : s))
      setCurrent({ ...active, stops })
      await itinerariesService.update(active.id, { stops }).catch(() => {})
      setAttended(true)
    }
    setState('done')
    setCelebrate(r)
  }

  useEffect(() => {
    if (started.current) return
    started.current = true
    const code = searchParams.get('code')
    if (!code) return
    if (!user) { navigate(`/login?redirect=${encodeURIComponent(`/app/verify?code=${code}`)}`); return }
    // La verificación es asíncrona: el estado cambia cuando responde el servidor.
    void Promise.resolve(code).then(run)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    const r = celebrate
    setCelebrate(null)
    if (attended) navigate('/app/itinerario')
    else if (r?.summary.loyalty) navigate(`/app/pasaporte/${r.spot_id}`)
    else navigate('/app/pasaporte')
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
      <div style={{ marginBottom: '48px' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '28px', color: 'var(--white)', letterSpacing: '-1px' }}>
          burri<span style={{ color: 'var(--orange)' }}>to</span>
        </span>
      </div>

      {(state === 'loading' || state === 'done') && !pinFor && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <Loader2 size={48} color="var(--orange)" className="animate-spin" />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--muted)' }}>Verificando tu visita…</p>
        </motion.div>
      )}

      {state === 'error' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <XCircle size={80} color="#ef4444" />
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', letterSpacing: '-1px', margin: '0 0 8px' }}>No pudimos marcar tu visita</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', margin: 0 }}>{errorMsg}</p>
          </div>
          <button onClick={() => navigate('/app/pasaporte')} className="btn btn-primary">Ir a mi pasaporte</button>
        </motion.div>
      )}

      <CheckInSheet
        open={!!pinFor} onClose={() => { setPinFor(null); navigate('/app/pasaporte') }}
        spotId={pinFor?.spotId} spotName={pinFor?.spotName} validation="pin" itineraryId={activeId}
        onResult={r => { setPinFor(null); onOk(r) }}
      />
      <CheckInCelebration result={celebrate} onClose={close} />
    </div>
  )
}
