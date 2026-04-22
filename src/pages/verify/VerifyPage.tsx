import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/useAuthStore'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { itinerariesService } from '../../services/itineraries'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

type State = 'loading' | 'success' | 'error' | 'no_itinerary' | 'already_visited'

export default function VerifyPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { current, setCurrent } = useItineraryStore()
    const [state, setState] = useState<State>('loading')
    const [spotName, setSpotName] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        const code = searchParams.get('code')
        if (!code) { setState('error'); setErrorMsg('Código QR inválido'); return }
        if (!user) { navigate(`/login?redirect=/verify?code=${code}`); return }

        verify(code)
    }, [])

    const verify = async (code: string) => {
        try {
            // 1. Busca el QR en Supabase
            const { data: qr, error: qrError } = await supabase
                .from('spot_qr_codes')
                .select('*, spots(name)')
                .eq('code', code)
                .eq('active', true)
                .single()

            if (qrError || !qr) {
                setState('error')
                setErrorMsg('Este código QR no es válido o ya no está activo')
                return
            }

            const name = (qr.spots as any)?.name ?? 'este spot'
            setSpotName(name)

            // 2. Busca el itinerario activo del usuario
            if (!user?.id) { setState('no_itinerary'); return }

            const itineraries = await itinerariesService.getByUser(user.id)
            const active = itineraries.find(i => i.status === 'in_progress')

            if (!active) { setState('no_itinerary'); return }

            // 3. Busca el stop correspondiente al spot
            const stop = active.stops.find(s => s.spotId === qr.spot_id)

            if (!stop) {
                setState('error')
                setErrorMsg(`${name} no está en tu itinerario activo`)
                return
            }

            if (stop.visited) { setState('already_visited'); return }

            // 4. Marca como visitado en el store
            const updatedStops = active.stops.map(s =>
                s.id === stop.id ? { ...s, visited: true } : s
            )
            const updated = { ...active, stops: updatedStops }
            setCurrent(updated)
            // 4.1 Guardar la visita del spot por qr
            await supabase.from('spot_visits').insert({
                spot_id: qr.spot_id,
                user_id: user.id,
                qr_code: code,
                itinerary_id: active.id,
            })

            // 5. Guarda en Supabase
            await itinerariesService.update(active.id, { stops: updatedStops })

            setState('success')

            // 6. Redirige al itinerario después de 3 segundos
            setTimeout(() => navigate('/app/itinerario'), 3000)

        } catch (err: any) {
            setState('error')
            setErrorMsg(err.message ?? 'Error verificando visita')
        }
    }

    return (
        <div style={{
            minHeight: '100dvh', background: 'var(--bg)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px 24px', textAlign: 'center',
        }}>
            {/* Logo */}
            <div style={{ marginBottom: '48px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '28px', color: 'var(--white)', letterSpacing: '-1px' }}>
                    burri<span style={{ color: 'var(--orange)' }}>to</span>
                </span>
            </div>

            {state === 'loading' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <Loader2 size={48} color="var(--orange)" className="animate-spin" />
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--muted)' }}>
                        Verificando tu visita...
                    </p>
                </motion.div>
            )}

            {state === 'success' && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
                >
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 20 }}
                    >
                        <CheckCircle size={80} color="#22c55e" />
                    </motion.div>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--white)', letterSpacing: '-1px', margin: '0 0 8px' }}>
                            ¡Visita verificada!
                        </h2>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--muted)', margin: 0 }}>
                            {spotName} marcado como visitado 🫏
                        </p>
                    </div>
                    <div style={{
                        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                        borderRadius: '14px', padding: '14px 20px',
                    }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#22c55e', margin: 0, letterSpacing: '1px' }}>
                            VOLVIENDO A TU ITINERARIO...
                        </p>
                    </div>
                </motion.div>
            )}

            {state === 'error' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <XCircle size={80} color="#ef4444" />
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', letterSpacing: '-1px', margin: '0 0 8px' }}>
                            QR inválido
                        </h2>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
                            {errorMsg}
                        </p>
                    </div>
                    <button onClick={() => navigate('/app/itinerario')} className="btn btn-primary">
                        Volver al itinerario
                    </button>
                </motion.div>
            )}

            {state === 'no_itinerary' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '64px' }}>🫏</div>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', letterSpacing: '-1px', margin: '0 0 8px' }}>
                            Sin itinerario activo
                        </h2>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
                            Necesitas tener un itinerario en marcha para verificar tu visita
                        </p>
                    </div>
                    <button onClick={() => navigate('/app/itinerario')} className="btn btn-primary">
                        Crear itinerario
                    </button>
                </motion.div>
            )}

            {state === 'already_visited' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '64px' }}>✅</div>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', letterSpacing: '-1px', margin: '0 0 8px' }}>
                            Ya visitaste este spot
                        </h2>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
                            {spotName} ya está marcado como visitado en tu itinerario
                        </p>
                    </div>
                    <button onClick={() => navigate('/app/itinerario')} className="btn btn-primary">
                        Ver itinerario
                    </button>
                </motion.div>
            )}
        </div>
    )
}