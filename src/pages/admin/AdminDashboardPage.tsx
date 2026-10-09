import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin, Clock, Users, UserCheck, Map as MapIcon, ShoppingBag, RefreshCw, Check, ChevronRight,
  CalendarDays, Star, AlertTriangle, Image as ImageIcon, CheckCircle2, Inbox,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatusBadge from '../../components/admin/StatusBadge'
import { loadDashboard, type DashboardData } from '../../services/adminStats'
import { categoriesService, type Category } from '../../services/categories'
import { spotsService } from '../../services/spots'
import { getSpotHealth, getSpotScore, spotPhotos, SPOT_ISSUE_LABELS, type SpotIssue } from '../../lib/spotHealth'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUIStore } from '../../stores/useUIStore'
import type { Spot } from '../../types/spot'

const DAY = 86_400_000
const STATUS_LABEL: Record<Spot['status'], string> = { verified: 'Publicado', pending: 'Pendiente', rejected: 'Oculto' }

const within = (iso: string | null | undefined, days: number) =>
  !!iso && Date.now() - new Date(iso).getTime() <= days * DAY

const todayKey = () => new Date().toISOString().slice(0, 10)

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (min < 60) return `hace ${Math.max(1, min)} min`
  if (min < 1440) return `hace ${Math.floor(min / 60)} h`
  const d = Math.floor(min / 1440)
  return d < 30 ? `hace ${d} d` : new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}

/** Cuenta por día los últimos `days` días (incluye días en cero). */
function perDay(dates: string[], days: number) {
  const buckets = new Map<string, number>()
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(new Date(Date.now() - i * DAY).toISOString().slice(0, 10), 0)
  }
  dates.forEach(d => {
    const k = d.slice(0, 10)
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1)
  })
  return [...buckets.entries()].map(([date, value]) => ({
    date,
    label: new Date(`${date}T12:00:00`).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }),
    value,
  }))
}

const fmtDate = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })

export default function AdminDashboardPage() {
  const user = useAuthStore(s => s.user)
  const { addToast } = useUIStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadedAt, setLoadedAt] = useState<Date | null>(null)
  const [series, setSeries] = useState<'itinerarios' | 'usuarios'>('itinerarios')
  const [range, setRange] = useState<7 | 14 | 30>(14)
  const [approving, setApproving] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [d, cats] = await Promise.all([loadDashboard(), categoriesService.getAll().catch(() => [] as Category[])])
    setData(d)
    setCategories(cats)
    setLoadedAt(new Date())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const spots = data?.spots ?? []
  const published = spots.filter(s => s.status === 'verified')
  const pending = spots.filter(s => s.status === 'pending')
  const profiles = data?.profiles ?? null
  const tourists = profiles?.filter(p => p.role === 'tourist') ?? []
  const churres = profiles?.filter(p => p.role === 'churre') ?? []
  const pendingChurres = churres.filter(p => p.status === 'pending')
  const orders = data?.orders ?? null
  const pendingOrders = orders?.filter(o => o.status === 'pendiente_confirmacion') ?? []

  const today = todayKey()
  const expiredEvents = published.filter(s => {
    const end = (s.eventDateEnd || s.eventDate)?.slice(0, 10)
    return !!end && end < today
  })
  const upcomingEvents = spots
    .filter(s => s.status !== 'rejected' && s.eventDate && (s.eventDateEnd || s.eventDate)!.slice(0, 10) >= today)
    .sort((a, b) => (a.eventDate ?? '').localeCompare(b.eventDate ?? ''))
    .slice(0, 5)

  // Calidad: solo lo publicado, que es lo que ve el turista.
  const quality = useMemo(() => {
    if (published.length === 0) return null
    const avg = Math.round(published.reduce((a, s) => a + getSpotScore(s), 0) / published.length)
    const complete = published.filter(s => getSpotScore(s) >= 75).length
    const issues = (Object.keys(SPOT_ISSUE_LABELS) as SpotIssue[])
      .map(id => ({ id, label: SPOT_ISSUE_LABELS[id], count: published.filter(s => !getSpotHealth(s).find(c => c.id === id)?.ok).length }))
      .filter(i => i.count > 0)
      .sort((a, b) => b.count - a.count)
    return { avg, complete, issues }
  }, [published])

  const byCategory = useMemo(() => {
    const counts = new Map<string, number>()
    published.forEach(s => counts.set(s.category, (counts.get(s.category) ?? 0) + 1))
    return [...counts.entries()]
      .map(([id, count]) => {
        const c = categories.find(x => x.id === id)
        return { id, label: c ? `${c.emoji} ${c.label}` : id, count }
      })
      .sort((a, b) => b.count - a.count)
  }, [published, categories])

  const chartData = useMemo(() => {
    const dates = series === 'itinerarios'
      ? (data?.itineraryDates ?? [])
      : (tourists.map(t => t.created_at).filter(Boolean) as string[])
    return perDay(dates, range)
  }, [series, range, data, tourists])
  const chartTotal = chartData.reduce((a, d) => a + d.value, 0)
  const chartUnavailable = series === 'itinerarios' ? data?.itineraryDates == null : profiles == null

  const approve = async (spot: Spot) => {
    setApproving(spot.id)
    try {
      await spotsService.updateStatus(spot.id, 'verified')
      setData(d => d && d.spots ? { ...d, spots: d.spots.map(s => s.id === spot.id ? { ...s, status: 'verified' } : s) } : d)
      addToast({ type: 'success', message: `"${spot.name}" publicado ✓` })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'No se pudo publicar' })
    } finally {
      setApproving(null)
    }
  }

  const firstName = (user?.profile.name ?? '').split(' ')[0]
  const todo = pending.length + pendingChurres.length + pendingOrders.length + expiredEvents.length
  const rawDate = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1)

  const kpis = [
    {
      label: 'Spots publicados', icon: MapPin, to: '/admin/spots?estado=publicados',
      value: data?.spots ? published.length : null,
      sub: `+${spots.filter(s => within(s.createdAt, 7)).length} nuevos en 7 días`, tone: 'up',
    },
    {
      label: 'Por revisar', icon: Clock, to: '/admin/spots?estado=pendientes',
      value: data?.spots ? pending.length : null,
      sub: pending.length ? 'Sugeridos por churres' : 'Todo al día', tone: pending.length ? 'warn' : undefined,
    },
    {
      label: 'Turistas', icon: Users, to: '/admin/usuarios',
      value: profiles ? tourists.length : null,
      sub: `+${tourists.filter(t => within(t.created_at, 7)).length} en 7 días`, tone: 'up',
    },
    {
      label: 'Churres', icon: UserCheck, to: '/admin/churres',
      value: profiles ? churres.length : null,
      sub: pendingChurres.length ? `${pendingChurres.length} por verificar` : 'Todos verificados', tone: pendingChurres.length ? 'warn' : undefined,
    },
    {
      label: 'Itinerarios', icon: MapIcon, to: null,
      value: data?.itineraryTotal ?? null,
      sub: `${(data?.itineraryDates ?? []).filter(d => within(d, 7)).length} en 7 días`,
    },
    {
      label: 'Pedidos (30 d)', icon: ShoppingBag, to: null,
      value: orders ? orders.length : null,
      sub: pendingOrders.length ? `${pendingOrders.length} por confirmar` : `S/ ${(orders ?? []).filter(o => o.status !== 'cancelado').reduce((a, o) => a + (Number(o.total) || 0), 0).toFixed(0)} en ventas`,
      tone: pendingOrders.length ? 'warn' : undefined,
    },
  ]

  const maxCat = Math.max(1, ...byCategory.map(c => c.count))
  const maxIssue = Math.max(1, ...(quality?.issues.map(i => i.count) ?? [1]))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="adm-dash">
      {/* Encabezado */}
      <div className="adm-page-header" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="adm-title">{firstName ? `Hola, ${firstName}` : 'Centro de control'}</h1>
          <p className="adm-subtitle" style={{ textTransform: 'none' }}>
            {dateLabel}
            {' · '}
            {loading ? 'Cargando…' : todo ? `${todo} cosa${todo > 1 ? 's' : ''} esperan tu revisión` : 'No hay nada pendiente'}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading} title={loadedAt ? `Actualizado ${loadedAt.toLocaleTimeString('es-PE')}` : undefined}>
          <RefreshCw size={14} className={loading ? 'adm-spin' : undefined} /> Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="adm-kpis">
        {kpis.map(k => {
          const body = (
            <>
              <div className="adm-kpi-top">
                <span className="adm-kpi-label">{k.label}</span>
                <span className="adm-kpi-icon"><k.icon size={15} /></span>
              </div>
              {loading
                ? <div className="adm-skeleton" style={{ height: '28px', width: '60%' }} />
                : <span className="adm-kpi-value">{k.value ?? '—'}</span>}
              <span className="adm-kpi-sub" data-tone={k.value == null ? undefined : k.tone}>
                {loading ? ' ' : k.value == null ? 'Sin acceso a estos datos' : k.sub}
              </span>
            </>
          )
          return k.to
            ? <Link key={k.label} to={k.to} className="adm-kpi">{body}</Link>
            : <div key={k.label} className="adm-kpi">{body}</div>
        })}
      </div>

      <div className="adm-dash-grid">
        {/* Actividad */}
        <section className="adm-panel adm-col-8">
          <div className="adm-card-head" style={{ flexWrap: 'wrap' }}>
            <div>
              <h2 className="adm-card-title">{series === 'itinerarios' ? 'Itinerarios generados' : 'Turistas nuevos'}</h2>
              <p className="adm-card-sub">
                {chartUnavailable ? 'Sin acceso a estos datos' : `${chartTotal} en los últimos ${range} días`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div className="adm-segtabs" role="group" aria-label="Métrica">
                <button aria-pressed={series === 'itinerarios'} onClick={() => setSeries('itinerarios')}>Itinerarios</button>
                <button aria-pressed={series === 'usuarios'} onClick={() => setSeries('usuarios')}>Turistas</button>
              </div>
              <div className="adm-segtabs" role="group" aria-label="Rango">
                {([7, 14, 30] as const).map(r => (
                  <button key={r} aria-pressed={range === r} onClick={() => setRange(r)}>{r}d</button>
                ))}
              </div>
            </div>
          </div>
          <div className="adm-card-body" style={{ height: '240px' }}>
            {loading ? (
              <div className="adm-skeleton" style={{ height: '100%' }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} interval={Math.ceil(range / 7) - 1}
                    tick={{ fill: 'var(--gray)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40}
                    tick={{ fill: 'var(--gray)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,85,0,0.06)' }}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '12px' }}
                    labelStyle={{ color: 'var(--gray)' }}
                    itemStyle={{ color: 'var(--white)' }}
                    formatter={(v) => [v, series === 'itinerarios' ? 'Itinerarios' : 'Turistas']}
                  />
                  <Bar dataKey="value" fill="var(--orange)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Bandeja de trabajo */}
        <section className="adm-panel adm-col-4">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title"><Inbox size={16} color="var(--orange)" /> Bandeja de trabajo</h2>
              <p className="adm-card-sub">Lo que necesita una decisión tuya</p>
            </div>
          </div>
          <div className="adm-list">
            {loading && <div className="adm-empty"><div className="adm-skeleton" style={{ height: '60px' }} /></div>}
            {!loading && pending.slice(0, 4).map(s => (
              <div key={s.id} className="adm-list-row">
                <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', background: 'var(--dim)', flexShrink: 0 }}>
                  {spotPhotos(s)[0]
                    ? <img src={spotPhotos(s)[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div className="adm-noimg"><ImageIcon size={14} /></div>}
                </div>
                <div className="adm-list-main">
                  <div className="adm-list-title">{s.name}</div>
                  <div className="adm-list-meta">Spot sugerido · {timeAgo(s.createdAt)}</div>
                </div>
                <button className="adm-icon-btn" data-tone="ok" title="Publicar" disabled={approving === s.id} onClick={() => approve(s)}>
                  <Check size={15} />
                </button>
                <Link className="adm-icon-btn" title="Revisar" to={`/admin/spots?editar=${s.id}`}><ChevronRight size={15} /></Link>
              </div>
            ))}
            {!loading && pending.length > 4 && (
              <div className="adm-list-row"><Link className="adm-link" to="/admin/spots?estado=pendientes">Ver los {pending.length} spots pendientes <ChevronRight size={13} /></Link></div>
            )}
            {!loading && pendingChurres.length > 0 && (
              <Link to="/admin/churres" className="adm-list-row" style={{ textDecoration: 'none' }}>
                <span className="adm-cmdk-icon"><UserCheck size={15} /></span>
                <div className="adm-list-main">
                  <div className="adm-list-title">{pendingChurres.length} churre{pendingChurres.length > 1 ? 's' : ''} por verificar</div>
                  <div className="adm-list-meta">{pendingChurres.slice(0, 3).map(c => c.name ?? 'Sin nombre').join(', ')}</div>
                </div>
                <ChevronRight size={15} color="var(--gray)" />
              </Link>
            )}
            {!loading && expiredEvents.length > 0 && (
              <Link to="/admin/spots?estado=publicados" className="adm-list-row" style={{ textDecoration: 'none' }}>
                <span className="adm-cmdk-icon" style={{ color: '#d97706' }}><AlertTriangle size={15} /></span>
                <div className="adm-list-main">
                  <div className="adm-list-title">{expiredEvents.length} evento{expiredEvents.length > 1 ? 's' : ''} ya pasaron y siguen publicados</div>
                  <div className="adm-list-meta">{expiredEvents.slice(0, 3).map(e => e.name).join(', ')}</div>
                </div>
                <ChevronRight size={15} color="var(--gray)" />
              </Link>
            )}
            {!loading && pendingOrders.length > 0 && (
              <div className="adm-list-row">
                <span className="adm-cmdk-icon"><ShoppingBag size={15} /></span>
                <div className="adm-list-main">
                  <div className="adm-list-title">{pendingOrders.length} pedido{pendingOrders.length > 1 ? 's' : ''} sin confirmar</div>
                  <div className="adm-list-meta">Los negocios aún no responden</div>
                </div>
              </div>
            )}
            {!loading && todo === 0 && (
              <div className="adm-empty"><CheckCircle2 size={20} color="#22c55e" /><br />Nada pendiente. ¡Todo al día!</div>
            )}
          </div>
        </section>

        {/* Calidad del catálogo */}
        <section className="adm-panel adm-col-4">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Calidad del catálogo</h2>
              <p className="adm-card-sub">Fichas publicadas que ve el turista</p>
            </div>
            <Link className="adm-link" to="/admin/spots?contenido=incompletos">Mejorar <ChevronRight size={13} /></Link>
          </div>
          <div className="adm-card-body">
            {loading ? <div className="adm-skeleton" style={{ height: '160px' }} /> : !quality ? (
              <p className="adm-card-sub">Aún no hay spots publicados.</p>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
                  <span className="adm-kpi-value">{quality.avg}%</span>
                  <span className="adm-kpi-sub">{quality.complete} de {published.length} fichas completas</span>
                </div>
                <div className="adm-barlist">
                  {quality.issues.slice(0, 6).map(i => (
                    <Link key={i.id} to={`/admin/spots?contenido=${i.id}`} className="adm-barlist-row">
                      <span className="adm-barlist-label">{i.label}</span>
                      <span className="adm-barlist-value">{i.count}</span>
                      <span className="adm-barlist-track"><span style={{ width: `${(i.count / maxIssue) * 100}%` }} /></span>
                    </Link>
                  ))}
                  {quality.issues.length === 0 && <p className="adm-card-sub">Todas las fichas están completas 🎉</p>}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Por categoría */}
        <section className="adm-panel adm-col-4">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Spots por categoría</h2>
              <p className="adm-card-sub">Publicados · detecta categorías flojas</p>
            </div>
            <Link className="adm-link" to="/admin/categorias">Gestionar <ChevronRight size={13} /></Link>
          </div>
          <div className="adm-card-body">
            {loading ? <div className="adm-skeleton" style={{ height: '160px' }} /> : byCategory.length === 0 ? (
              <p className="adm-card-sub">Sin datos todavía.</p>
            ) : (
              <div className="adm-barlist">
                {byCategory.slice(0, 8).map(c => (
                  <Link key={c.id} to={`/admin/spots?categoria=${c.id}`} className="adm-barlist-row">
                    <span className="adm-barlist-label">{c.label}</span>
                    <span className="adm-barlist-value">{c.count}</span>
                    <span className="adm-barlist-track"><span style={{ width: `${(c.count / maxCat) * 100}%` }} /></span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Eventos */}
        <section className="adm-panel adm-col-4">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title"><CalendarDays size={16} color="var(--orange)" /> Próximos eventos</h2>
              <p className="adm-card-sub">Spots con fecha de evento</p>
            </div>
          </div>
          <div className="adm-list">
            {loading ? <div className="adm-empty"><div className="adm-skeleton" style={{ height: '60px' }} /></div>
              : upcomingEvents.length === 0 ? <div className="adm-empty">No hay eventos próximos.</div>
                : upcomingEvents.map(e => (
                  <Link key={e.id} to={`/admin/spots?editar=${e.id}`} className="adm-list-row" style={{ textDecoration: 'none' }}>
                    <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--orange)', lineHeight: 1 }}>
                        {new Date(`${e.eventDate!.slice(0, 10)}T12:00:00`).getDate()}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>
                        {new Date(`${e.eventDate!.slice(0, 10)}T12:00:00`).toLocaleDateString('es-PE', { month: 'short' })}
                      </div>
                    </div>
                    <div className="adm-list-main">
                      <div className="adm-list-title">{e.name}</div>
                      <div className="adm-list-meta">{fmtDate(e.eventDate!)}{e.eventDateEnd ? ` → ${fmtDate(e.eventDateEnd)}` : ''}</div>
                    </div>
                    {e.status === 'pending' && <StatusBadge status="Pendiente" />}
                  </Link>
                ))}
          </div>
        </section>

        {/* Reseñas */}
        <section className="adm-panel adm-col-6">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Últimas reseñas</h2>
              <p className="adm-card-sub">{data?.reviewTotal != null ? `${data.reviewTotal} en total` : 'Sin acceso a estos datos'}</p>
            </div>
            <Link className="adm-link" to="/admin/resenas">Moderar <ChevronRight size={13} /></Link>
          </div>
          <div className="adm-list">
            {loading ? <div className="adm-empty"><div className="adm-skeleton" style={{ height: '60px' }} /></div>
              : !data?.reviews?.length ? <div className="adm-empty">Todavía no hay reseñas.</div>
                : data.reviews.map(r => (
                  <div key={r.id} className="adm-list-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, width: 44 }}>
                      <Star size={13} fill="var(--yellow)" color="var(--yellow)" />
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.rating ?? '—'}</strong>
                    </div>
                    <div className="adm-list-main">
                      <div className="adm-list-title">{r.spot_name ?? 'Spot'}</div>
                      <div className="adm-list-meta">{r.liked || r.improve || 'Sin comentario'}</div>
                    </div>
                    <span className="adm-list-meta" style={{ flexShrink: 0 }}>{timeAgo(r.created_at)}</span>
                  </div>
                ))}
          </div>
        </section>

        {/* Últimos spots */}
        <section className="adm-panel adm-col-6">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Agregados recientemente</h2>
              <p className="adm-card-sub">Últimos spots en el catálogo</p>
            </div>
            <Link className="adm-link" to="/admin/spots">Ver todos <ChevronRight size={13} /></Link>
          </div>
          <div className="adm-list">
            {loading ? <div className="adm-empty"><div className="adm-skeleton" style={{ height: '60px' }} /></div>
              : spots.length === 0 ? <div className="adm-empty">Aún no hay spots.</div>
                : spots.slice(0, 6).map(s => (
                  <Link key={s.id} to={`/admin/spots?editar=${s.id}`} className="adm-list-row" style={{ textDecoration: 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', background: 'var(--dim)', flexShrink: 0 }}>
                      {spotPhotos(s)[0]
                        ? <img src={spotPhotos(s)[0]} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div className="adm-noimg"><ImageIcon size={14} /></div>}
                    </div>
                    <div className="adm-list-main">
                      <div className="adm-list-title">{s.name}</div>
                      <div className="adm-list-meta">{s.address || 'Sin dirección'} · {timeAgo(s.createdAt)}</div>
                    </div>
                    <StatusBadge status={STATUS_LABEL[s.status]} />
                  </Link>
                ))}
          </div>
        </section>
      </div>
    </motion.div>
  )
}
