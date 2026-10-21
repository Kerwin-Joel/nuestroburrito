import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface SharedRide {
  status: 'accepted' | 'arrived' | 'in_progress' | 'completed'
  pickup_address: string | null
  dropoff_address: string | null
  boarded_at: string | null
  completed_at: string | null
  driver_first_name: string | null
  vehicle_plate: string | null
  vehicle_model: string | null
  vehicle_color: string | null
  last_position: { lat: number; lng: number; at: string } | null
}

const STATUS_LABEL: Record<SharedRide['status'], string> = {
  accepted: 'El conductor va en camino al recojo',
  arrived: 'El conductor llegó al punto de recojo',
  in_progress: 'En viaje',
  completed: 'Viaje terminado',
}

/**
 * Link de "compartir viaje" (nuestroburrito.com/viaje/<token>): lo abre un
 * contacto de confianza del pasajero, sin cuenta. Solo lee taxi_get_shared_ride,
 * que expone lo mínimo (primer nombre, auto, placa, última posición) y deja de
 * responder 30 min después de terminado el viaje.
 */
export default function SharedRidePage() {
  const { token } = useParams<{ token: string }>()
  const [ride, setRide] = useState<SharedRide | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const load = async () => {
      const { data, error } = await supabase.rpc('taxi_get_shared_ride', { p_token: token })
      if (cancelled) return
      if (error || !data) { setMissing(true); return }
      setMissing(false)
      setRide(data as SharedRide)
    }
    load()
    const id = setInterval(load, 10_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [token])

  const pos = ride?.last_position
  const mapUrl = pos
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${pos.lng - 0.006},${pos.lat - 0.004},${pos.lng + 0.006},${pos.lat + 0.004}&layer=mapnik&marker=${pos.lat},${pos.lng}`
    : null

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', padding: '24px 16px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: 'var(--white)', marginBottom: '4px' }}>
          burri<span style={{ color: 'var(--orange)' }}>to</span> · viaje compartido
        </p>

        {missing && !ride && (
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)', marginTop: '24px' }}>
            Este enlace ya no está activo o el viaje terminó hace más de 30 minutos.
          </p>
        )}

        {ride && (
          <>
            <div className="card" style={{ padding: '18px', marginTop: '16px' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '17px', color: 'var(--white)' }}>
                {STATUS_LABEL[ride.status]}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', marginTop: '6px' }}>
                {ride.pickup_address ?? 'Recojo'} → {ride.dropoff_address ?? 'Destino'}
              </p>
              {ride.driver_first_name && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', marginTop: '12px' }}>
                  {ride.driver_first_name} · {ride.vehicle_model} {ride.vehicle_color} ·{' '}
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{ride.vehicle_plate}</strong>
                </p>
              )}
            </div>

            {mapUrl && (
              <div className="card" style={{ marginTop: '12px', overflow: 'hidden', padding: 0 }}>
                <iframe title="Ubicación del auto" src={mapUrl} style={{ width: '100%', height: '300px', border: 'none', display: 'block' }} />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', padding: '8px 12px' }}>
                  Última posición: {new Date(pos!.at).toLocaleTimeString('es-PE', { timeZone: 'America/Lima' })} · se actualiza cada 10 s
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
