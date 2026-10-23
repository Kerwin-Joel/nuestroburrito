import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Car, AlertTriangle, CheckCircle2, Clock, RefreshCw, Phone, Check, Ban, RotateCcw, Wifi, Wallet, Route, Star,
} from 'lucide-react'
import AdminStatCard from '../../components/admin/AdminStatCard'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import StatusBadge from '../../components/admin/StatusBadge'
import { supabase } from '../../lib/supabase'
import { useUIStore } from '../../stores/useUIStore'

/*
 * Taxi Burrito desde el admin: aprobar o suspender conductores, atender las
 * alertas (SOS, desvíos) y ver los viajes recientes. Todo sale de la RPC
 * taxi_admin_overview (solo admins); las acciones también son RPC.
 */

interface Driver {
  id: string
  full_name: string
  phone: string
  email: string | null
  vehicle_plate: string
  vehicle_model: string | null
  vehicle_color: string | null
  license_number: string | null
  photo_url: string | null
  status: 'pending_review' | 'approved' | 'suspended'
  is_online: boolean
  rating_avg: number | null
  rating_count: number
  rides_done: number
  last_seen: string | null
  created_at: string
}

interface Ride {
  id: string
  status: string
  pickup_address: string | null
  dropoff_address: string | null
  distance_km: number | null
  recommended_fare: number | null
  offered_fare: number | null
  final_fare: number | null
  boarding_method: string | null
  boarding_confidence: string | null
  cancelled_by: string | null
  cancel_reason: string | null
  requested_at: string
  completed_at: string | null
  passenger_name: string | null
  driver_name: string | null
  vehicle_plate: string | null
}

interface Alert {
  id: number
  ride_id: string
  kind: string
  data: Record<string, unknown> | null
  created_at: string
  resolved_at: string | null
  raised_by_name: string | null
  ride_status: string | null
  pickup_address: string | null
  dropoff_address: string | null
  driver_name: string | null
  vehicle_plate: string | null
  driver_phone: string | null
}

interface Overview {
  stats: {
    online_now: number
    pending_drivers: number
    approved_drivers: number
    rides_today: number
    completed_today: number
    active_now: number
    revenue_today: number
    open_alerts: number
  }
  drivers: Driver[]
  rides: Ride[]
  alerts: Alert[]
}

type Tab = 'conductores' | 'alertas' | 'viajes'

const DRIVER_STATUS: Record<Driver['status'], string> = {
  pending_review: 'Pendiente',
  approved: 'Aprobado',
  suspended: 'Suspendido',
}

const RIDE_STATUS: Record<string, string> = {
  requested: 'Buscando',
  accepted: 'En camino',
  arrived: 'Esperando',
  in_progress: 'En viaje',
  completed: 'Completado',
  cancelled: 'Cancelado',
  expired: 'Expirado',
}

const ALERT_KIND: Record<string, string> = {
  sos: 'SOS',
  boarding_mismatch: 'Abordaje dudoso',
  pin_locked: 'PIN bloqueado',
}

const soles = (v: number | null | undefined) => (v == null ? '—' : `S/ ${Number(v).toFixed(2).replace(/\.00$/, '')}`)

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'nunca'
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  if (min < 1440) return `hace ${Math.floor(min / 60)} h`
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}

const fetchOverview = () => supabase.rpc('taxi_admin_overview')

const card: React.CSSProperties = {
  background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px',
}

export default function AdminTaxiPage() {
  const { addToast } = useUIStore()
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('conductores')
  const [driverFilter, setDriverFilter] = useState<'todos' | Driver['status']>('todos')
  const [busy, setBusy] = useState<string | null>(null)

  const firstLoad = useRef(true)
  // El estado se toca en el callback de la respuesta, no de forma síncrona en el efecto.
  const apply = useCallback((res: Awaited<ReturnType<typeof fetchOverview>>) => {
    if (res.error) addToast({ type: 'error', message: 'No se pudo cargar el taxi' })
    else {
      const o = res.data as Overview
      setData(o)
      // Las alertas abiertas mandan: si hay, se abre esa pestaña primero.
      if (firstLoad.current && o.stats.open_alerts > 0) setTab('alertas')
      firstLoad.current = false
    }
    setLoading(false)
  }, [addToast])

  useEffect(() => {
    let alive = true
    fetchOverview().then(res => { if (alive) apply(res) })
    return () => { alive = false }
  }, [apply])
  const reload = () => { setLoading(true); fetchOverview().then(apply) }

  const setDriverStatus = async (d: Driver, status: Driver['status']) => {
    setBusy(d.id)
    const { error } = await supabase.rpc('taxi_admin_set_driver_status', { p_driver: d.id, p_status: status })
    setBusy(null)
    if (error) return addToast({ type: 'error', message: 'No se pudo actualizar al conductor' })
    addToast({ type: 'success', message: `${d.full_name}: ${DRIVER_STATUS[status].toLowerCase()}` })
    reload()
  }

  const resolveAlert = async (a: Alert) => {
    setBusy(`a${a.id}`)
    const { error } = await supabase.rpc('taxi_admin_resolve_alert', { p_alert: a.id })
    setBusy(null)
    if (error) return addToast({ type: 'error', message: 'No se pudo cerrar la alerta' })
    addToast({ type: 'success', message: 'Alerta marcada como atendida' })
    reload()
  }

  const drivers = useMemo(() => {
    const list = data?.drivers ?? []
    const filtered = driverFilter === 'todos' ? list : list.filter(d => d.status === driverFilter)
    // Pendientes primero: son los que esperan una respuesta.
    return [...filtered].sort((a, b) => Number(b.status === 'pending_review') - Number(a.status === 'pending_review'))
  }, [data, driverFilter])

  const s = data?.stats

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="adm-page">
      <header className="adm-page-header">
        <div>
          <h1 className="adm-title">Taxi Burrito</h1>
          <p className="adm-subtitle">
            Conductores, alertas de seguridad y viajes
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reload} disabled={loading} style={{ gap: '6px' }}>
          <RefreshCw size={15} className={loading ? 'spin' : undefined} /> Actualizar
        </button>
      </header>

      {s && (
        <div className="adm-stats">
          <AdminStatCard icon={AlertTriangle} value={s.open_alerts} label="Alertas abiertas" subType={s.open_alerts > 0 ? 'danger' : 'success'} sub={s.open_alerts > 0 ? 'Atender ahora' : 'Todo en calma'} />
          <AdminStatCard icon={Clock} value={s.pending_drivers} label="Conductores por aprobar" subType={s.pending_drivers > 0 ? 'warning' : 'neutral'} sub={`${s.approved_drivers} aprobados`} />
          <AdminStatCard icon={Wifi} value={s.online_now} label="Conectados ahora" sub={`${s.active_now} en viaje`} />
          <AdminStatCard icon={Route} value={s.rides_today} label="Viajes hoy" sub={`${s.completed_today} completados`} subType="success" />
          <AdminStatCard icon={Wallet} value={soles(s.revenue_today)} label="Movido hoy" sub="Pagado al conductor" />
        </div>
      )}

      <div className="adm-tabs" role="group" aria-label="Secciones">
        {([
          ['conductores', `Conductores${s ? ` (${data!.drivers.length})` : ''}`],
          ['alertas', `Alertas${s && s.open_alerts ? ` · ${s.open_alerts}` : ''}`],
          ['viajes', 'Viajes'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            style={tab === key && key === 'alertas' && s?.open_alerts ? { color: '#ef4444' } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && !data && <p style={{ color: 'var(--gray)' }}>Cargando…</p>}

      {data && tab === 'conductores' && (
        <>
          <div className="adm-pills">
            {(['todos', 'pending_review', 'approved', 'suspended'] as const).map(f => (
              <button
                key={f}
                onClick={() => setDriverFilter(f)}
                className="btn btn-sm"
                style={{
                  background: driverFilter === f ? 'var(--orange)' : 'var(--dim)',
                  color: driverFilter === f ? 'white' : 'var(--gray)', border: 'none',
                }}
              >
                {f === 'todos' ? 'Todos' : DRIVER_STATUS[f]}
              </button>
            ))}
          </div>
          {drivers.length === 0 ? (
            <AdminEmptyState icon={Car} title="Sin conductores aquí" subtitle="Los conductores se registran desde la app, en Taxi → Conducir." />
          ) : (
            <div className="adm-cards">
              {drivers.map(d => (
                <div key={d.id} style={{
                  ...card, display: 'flex', flexDirection: 'column', gap: '14px',
                  borderLeft: `4px solid ${d.status === 'approved' ? '#22c55e' : d.status === 'suspended' ? '#ef4444' : 'var(--amber)'}`,
                }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    {d.photo_url ? (
                      <img src={d.photo_url} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(45deg, var(--amber), var(--orange))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 20,
                      }}>{d.full_name[0]}</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--white)', margin: 0 }}>{d.full_name}</h3>
                        <StatusBadge status={DRIVER_STATUS[d.status]} />
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gray)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.email ?? 'sin correo'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: 13 }}>
                    <Field label="Placa" value={d.vehicle_plate} mono />
                    <Field label="Auto" value={[d.vehicle_model, d.vehicle_color].filter(Boolean).join(' · ') || '—'} />
                    <Field label="Licencia" value={d.license_number || '—'} mono />
                    <Field label="Teléfono" value={d.phone} mono />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--gray)' }}>
                    <span><strong style={{ color: 'var(--white)' }}>{d.rides_done}</strong> viajes</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={12} fill="var(--yellow)" color="var(--yellow)" />
                      <strong style={{ color: 'var(--white)' }}>{d.rating_count ? Number(d.rating_avg).toFixed(1) : '—'}</strong>
                    </span>
                    <span style={{ color: d.is_online ? '#22c55e' : undefined }}>{d.is_online ? '● conectado' : `visto ${timeAgo(d.last_seen)}`}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {d.status !== 'approved' && (
                      <button className="btn btn-primary btn-sm" disabled={busy === d.id} onClick={() => setDriverStatus(d, 'approved')}
                        style={{ flex: 1, justifyContent: 'center', background: '#22c55e' }}>
                        {d.status === 'suspended' ? <RotateCcw size={15} /> : <Check size={15} />} {d.status === 'suspended' ? 'Reactivar' : 'Aprobar'}
                      </button>
                    )}
                    {d.status !== 'suspended' && (
                      <button className="btn btn-ghost btn-sm" disabled={busy === d.id} onClick={() => setDriverStatus(d, 'suspended')}
                        style={{ flex: 1, justifyContent: 'center', color: '#ef4444' }}>
                        <Ban size={15} /> {d.status === 'pending_review' ? 'Rechazar' : 'Suspender'}
                      </button>
                    )}
                    <a className="btn btn-ghost btn-sm" href={`https://wa.me/51${d.phone.replace(/\D/g, '').slice(-9)}`} target="_blank" rel="noreferrer"
                      style={{ justifyContent: 'center' }} title="Escribir por WhatsApp">
                      <Phone size={15} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {data && tab === 'alertas' && (
        data.alerts.length === 0 ? (
          <AdminEmptyState icon={CheckCircle2} title="Sin alertas" subtitle="Aquí aparecen los SOS, los abordajes dudosos y los PIN bloqueados por intentos fallidos." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.alerts.map(a => {
              const open = !a.resolved_at
              return (
                <div key={a.id} style={{
                  ...card, display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap',
                  borderLeft: `4px solid ${open ? (a.kind === 'sos' ? '#ef4444' : 'var(--amber)') : 'var(--border)'}`,
                  opacity: open ? 1 : 0.6,
                }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, color: a.kind === 'sos' ? '#ef4444' : 'var(--amber)', fontFamily: 'var(--font-display)' }}>
                        {ALERT_KIND[a.kind] ?? a.kind}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--gray)' }}>{timeAgo(a.created_at)} · por {a.raised_by_name ?? 'el sistema'}</span>
                      {a.ride_status && <StatusBadge status={RIDE_STATUS[a.ride_status] ?? a.ride_status} />}
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--white)' }}>
                      {a.pickup_address ?? 'Recojo'} → {a.dropoff_address ?? 'Destino'}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--gray)' }}>
                      Conductor: {a.driver_name ?? '—'} {a.vehicle_plate ? `· ${a.vehicle_plate}` : ''}
                    </p>
                    {a.data && typeof a.data.lat === 'number' && (
                      <a href={`https://www.google.com/maps?q=${a.data.lat},${a.data.lng}`} target="_blank" rel="noreferrer"
                        style={{ fontSize: 12, color: 'var(--orange)', display: 'inline-block', marginTop: 6 }}>
                        Ver ubicación del aviso →
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {a.driver_phone && (
                      <a className="btn btn-ghost btn-sm" href={`tel:${a.driver_phone}`}><Phone size={15} /> Llamar</a>
                    )}
                    {open ? (
                      <button className="btn btn-primary btn-sm" disabled={busy === `a${a.id}`} onClick={() => resolveAlert(a)}>
                        <Check size={15} /> Atendida
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--gray)', alignSelf: 'center' }}>Atendida {timeAgo(a.resolved_at)}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {data && tab === 'viajes' && (
        data.rides.length === 0 ? (
          <AdminEmptyState icon={Route} title="Todavía no hay viajes" subtitle="Los viajes pedidos desde la app aparecen aquí." />
        ) : (
          <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
            <table className="adm-table adm-table-wide" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--gray)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {['Pedido', 'Pasajero', 'Conductor', 'Ruta', 'Km', 'Precio', 'Abordaje', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rides.map(r => (
                  <tr key={r.id} className="table-row" style={{ color: 'var(--white)' }}>
                    <td style={td} data-label="Pedido">{timeAgo(r.requested_at)}</td>
                    <td style={td} data-label="Pasajero">{r.passenger_name ?? '—'}</td>
                    <td style={td} data-label="Conductor">{r.driver_name ? `${r.driver_name} · ${r.vehicle_plate}` : '—'}</td>
                    <td style={{ ...td, maxWidth: 260 }} data-label="Ruta" data-m="full">
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.pickup_address ?? 'Recojo'} → {r.dropoff_address ?? 'Destino'}
                      </span>
                      {r.cancel_reason && <span style={{ fontSize: 11, color: 'var(--gray)' }}>{r.cancel_reason}</span>}
                    </td>
                    <td style={td} data-label="Km">{r.distance_km != null ? Number(r.distance_km).toFixed(1) : '—'}</td>
                    <td style={td} data-label="Precio">
                      {soles(r.final_fare ?? r.offered_fare)}
                      {r.recommended_fare != null && <span style={{ display: 'block', fontSize: 11, color: 'var(--gray)' }}>sug. {soles(r.recommended_fare)}</span>}
                    </td>
                    <td style={td} data-label="Abordaje">{r.boarding_method ? `${r.boarding_method === 'pin' ? 'PIN' : r.boarding_method}${r.boarding_confidence ? ` · ${r.boarding_confidence}` : ''}` : '—'}</td>
                    <td style={td} data-label="Estado"><StatusBadge status={RIDE_STATUS[r.status] ?? r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </motion.div>
  )
}

const td: React.CSSProperties = { padding: '12px 14px', borderBottom: '1px solid var(--border)', verticalAlign: 'top' }

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: 0, color: 'var(--white)', fontFamily: mono ? 'var(--font-mono)' : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
    </div>
  )
}
