import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2, Eye, Trash2, BookOpen, X, Loader2, BookMarked, Store, Ticket, Heart, Luggage, Hotel, ChevronRight,
  Pencil, Share, LifeBuoy, LogOut,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useProfileStore } from '../../stores/useProfileStore'
import { useReminders } from '../../hooks/useReminders'
import { itinerariesService } from '../../services/itineraries'
import { benefitsService } from '../../services/benefits'
import { useUIStore } from '../../stores/useUIStore'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { formatDate, formatDistance, timeUntil, initials } from '../../lib/formatters'
import type { Itinerary } from '../../types/itinerary'
import { supabase } from '../../lib/supabase'
import { cachedFetch } from '../../lib/sessionCache'
import ThemeSwitcher from '../../components/shared/ThemeSwitcher'

/** "Tu menú": mismo abanico de opciones que CustomTab.kt en la app nativa. */
const MENU_OPTIONS = [
  { to: '/app/historia', icon: BookOpen, title: 'Historia de Piura', sub: 'Relatos y lugares con historia' },
  { to: '/app/tienda', icon: Store, title: 'Tienda Burrito', sub: 'Merch, tours y hecho en Piura' },
  { to: '/app/pasaporte', icon: BookMarked, title: 'Pasaporte', sub: 'Tus sellos de spots visitados' },
  { to: '/app/beneficios', icon: Ticket, title: 'Mis beneficios', sub: 'Descuentos que desbloqueas' },
  { to: '/app/servicios', icon: Luggage, title: 'Servicios turísticos', sub: 'Transporte, dinero, salud y guías' },
  { to: '/app/hoteles', icon: Hotel, title: 'Hoteles en Piura', sub: 'Reserva tu habitación' },
  { to: '/app/favoritos', icon: Heart, title: 'Favoritos', sub: 'Los spots que guardaste' },
]

/** Espejo de ProfileTabs en ProfileParts.kt: filtra la lista por estado. */
const STATUS_TABS = [
  { id: 'in_progress', label: 'En curso' },
  { id: 'completed', label: 'Completados' },
  { id: 'saved', label: 'Guardados' },
] as const

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
function formatMemberSince(iso?: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function PerfilTouristPage() {

  const { user, logout, updateName } = useAuthStore()
  const { addToast } = useUIStore()
  const { setCurrent, clear, current } = useItineraryStore()
  const navigate = useNavigate()

  const { itineraries, setItineraries, removeItinerary } = useProfileStore()
  const [loading, setLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [visitedCount, setVisitedCount] = useState<number | null>(null)
  const [statusTab, setStatusTab] = useState<typeof STATUS_TABS[number]['id']>('in_progress')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Itinerary | null>(null)

  const { reminders, load: loadReminders, cancel } = useReminders(
    user?.id || 'tourist-demo'
  )

  const userIdRef = useRef(user?.id)
  const itinerariesRef = useRef(itineraries)

  useEffect(() => { userIdRef.current = user?.id }, [user?.id])
  useEffect(() => { itinerariesRef.current = itineraries }, [itineraries])

  // itinerariesService.getByUser ya tiene su propia caché de sesión (ver
  // itineraries.ts) — acá solo queda pedirlo, sin manejar TTL a mano.
  const loadItineraries = useCallback(async () => {
    if (!userIdRef.current) return
    if (itinerariesRef.current.length === 0) setLoading(true)
    try {
      const data = await itinerariesService.getByUser(userIdRef.current)
      setItineraries(data)
    } catch {
      addToast({ type: 'error', message: 'Error cargando itinerarios' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // El avatar de OAuth no cambia a media sesión — se pedía de nuevo cada
    // vez que se entraba a Perfil.
    if (!user?.id) return
    cachedFetch(`auth:avatar:${user.id}`, () => supabase.auth.getUser()).then(({ data }) => {
      const url = data.user?.user_metadata?.avatar_url
        || data.user?.user_metadata?.picture
      if (url) setAvatarUrl(url)
    })
  }, [user?.id])

  useEffect(() => {
    loadItineraries()
    loadReminders()
  }, [])

  useEffect(() => {
    if (user) benefitsService.getVisitedSpotIds(user.id).then(ids => setVisitedCount(ids.size))
  }, [user])

  // Espejo de DeleteItineraryDialog: antes un toque en la papelera borraba
  // el itinerario sin vuelta atrás.
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    const { id } = deleteTarget
    setDeleteTarget(null)
    try {
      await itinerariesService.softDelete(id)
      removeItinerary(id)
      if (current?.id === id) clear()
      addToast({ type: 'success', message: 'Itinerario eliminado' })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message ?? 'Error' })
    }
  }

  // Ver itinerario
  const handleView = async (itinerary: Itinerary) => {
    try {
      // Recarga datos frescos de Supabase
      const fresh = await itinerariesService.getById(itinerary.id)
      setCurrent(fresh)
    } catch {
      // Si falla, usa el que tiene
      setCurrent(itinerary)
    }
    navigate('/app/itinerario')
  }

  const handleSaveName = async () => {
    const clean = nameInput.trim()
    if (!clean) return
    setEditingName(false)
    try {
      await updateName(clean)
    } catch {
      addToast({ type: 'error', message: 'No se pudo actualizar tu nombre' })
    }
  }

  const handleShareApp = async () => {
    const text = 'Descubre el Piura real con Burrito — la guía hecha por piuranos 🧡'
    const url = window.location.origin
    if (navigator.share) {
      try { await navigator.share({ text, url }) } catch { /* el usuario canceló */ }
      return
    }
    await navigator.clipboard?.writeText(`${text} ${url}`)
    addToast({ type: 'success', message: '🔗 Enlace copiado al portapapeles' })
  }

  const handleReport = () => {
    window.location.href = `mailto:hola@burritopiura.com?subject=${encodeURIComponent('Burrito · reporte desde la web')}`
  }

  const inProgress = itineraries.filter(i => i.status === 'in_progress')
  const completed = itineraries.filter(i => i.status === 'completed')
  const saved = itineraries.filter(i => i.status !== 'in_progress' && i.status !== 'completed')
  const shown = statusTab === 'in_progress' ? inProgress : statusTab === 'completed' ? completed : saved

  // Solo se suman los kilómetros de los días terminados: uno a medias
  // todavía no se ha recorrido entero.
  const totalMeters = completed.reduce((sum, it) => {
    let m = 0
    for (let i = 0; i < it.stops.length - 1; i++) {
      const a = it.stops[i], b = it.stops[i + 1]
      if (a.lat && b.lat) m += distanceMeters(a.lat, a.lng, b.lat, b.lng)
    }
    return sum + m
  }, 0)

  const memberSince = formatMemberSince(user?.profile?.createdAt)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '100px' }}>

        {/* Identity card — espejo de ProfileIdentityCard en ProfileParts.kt */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px', marginBottom: '16px' }}>
          <div style={{
            width: '68px', height: '68px', borderRadius: '50%',
            overflow: 'hidden', flexShrink: 0,
            border: '2px solid var(--border-hover)',
          }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.profile?.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, var(--orange) 0%, var(--hot) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '26px', color: 'white',
              }}>
                {initials(user?.profile?.name || 'V')}
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <p style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: '19px', color: 'var(--white)', letterSpacing: '-0.5px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.profile?.name || 'Sin nombre'}
              </p>
              <button
                onClick={() => { setNameInput(user?.profile?.name || ''); setEditingName(true) }}
                aria-label="Editar nombre"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px', flexShrink: 0 }}
              >
                <Pencil size={13} />
              </button>
            </div>
            {user?.email && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </p>
            )}
            {memberSince && (
              <span style={{
                display: 'inline-block', marginTop: '8px',
                padding: '4px 10px', borderRadius: '100px',
                background: 'var(--card2)', color: 'var(--muted)',
                fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700,
              }}>
                Piurano desde {memberSince}
              </span>
            )}
          </div>
        </div>

        {/* Stats row — Lugares / Días / Recorrido, igual que StatsRow en la app */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '32px' }}>
          {[
            { label: 'Lugares', value: visitedCount ?? '—' },
            { label: 'Días', value: completed.length },
            { label: 'Recorrido', value: totalMeters > 0 ? formatDistance(totalMeters) : '—' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 8px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '19px', fontWeight: 800, color: 'var(--orange)', letterSpacing: '-0.5px' }}>{s.value}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Mis itinerarios + pestañas de estado */}
        <p className="section-label" style={{ marginBottom: '12px' }}>MIS ITINERARIOS</p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {STATUS_TABS.map(tab => {
            const count = tab.id === 'in_progress' ? inProgress.length : tab.id === 'completed' ? completed.length : saved.length
            const active = statusTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id)}
                style={{
                  padding: '8px 13px', borderRadius: '100px', cursor: 'pointer',
                  border: active ? '1px solid transparent' : '1px solid var(--border)',
                  background: active ? 'var(--orange)' : 'var(--card)',
                  color: active ? '#fff' : 'var(--muted)',
                  fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700,
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {tab.label} {count}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
            <Loader2 size={32} color="var(--orange)" className="animate-spin" />
          </div>
        ) : shown.length === 0 ? (
          <div style={{ border: '2px dashed var(--border-hover)', borderRadius: '16px', padding: '40px 24px', textAlign: 'center', marginBottom: '8px' }}>
            <img src="/imagotipo.png" alt="burrito" style={{ height: '70px', width: 'auto', display: 'block', margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--white)', letterSpacing: '-0.5px' }}>
              {statusTab === 'in_progress' ? 'Ningún día en curso' : statusTab === 'completed' ? 'Todavía no completas ninguno' : 'Aún no tienes itinerarios'}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', margin: '6px 0 18px' }}>
              Crea tu primer día piurano
            </p>
            <Link to="/app" className="btn btn-primary">Crear mi itinerario</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {shown.map(it => (
              <motion.div key={it.id} className="card" whileHover={{ y: -4 }} style={{ padding: '18px' }}>

                {/* Header de la card */}
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', letterSpacing: '-0.5px' }}>
                    {it.title}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span className="badge badge-orange">
                      <BookOpen size={9} /> {it.stops.length}
                    </span>
                    {/* Badge de status */}
                    {it.status === 'completed' ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '2px 8px', borderRadius: '100px',
                        background: 'rgba(34,197,94,0.12)',
                        border: '1px solid rgba(34,197,94,0.25)',
                        color: '#22c55e',
                        fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                        letterSpacing: '0.5px', textTransform: 'uppercase'
                      }}>
                        ✓ Completado
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '2px 8px', borderRadius: '100px',
                        background: 'var(--border)',
                        border: '1px solid var(--border-hover)',
                        color: 'var(--text-brand)',
                        fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                        letterSpacing: '0.5px', textTransform: 'uppercase'
                      }}>
                        ● En progreso
                      </span>
                    )}
                  </div>
                </div>

                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                  {formatDate(it.createdAt)}
                </p>
                {it.stops[0] && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)' }}>
                    Empieza en {it.stops[0].spotName}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    onClick={() => handleView(it)}
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    onClick={() => {
                      const text = `🫔 *${it.title}*\n\n` +
                        it.stops.map((s, i) =>
                          `${i + 1}. *${s.time}* — ${s.spotName}${s.localTip ? `\n   💡 ${s.localTip}` : ''}`
                        ).join('\n\n') +
                        `\n\n_Generado con Burrito · La guía piurana_ 🫏`
                      const url = `https://wa.me/?text=${encodeURIComponent(text)}`
                      window.open(url, '_blank')
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Share2 size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(it)}
                    className="btn btn-danger btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tu menú — mismo abanico de opciones que en la app nativa */}
        <div style={{ marginTop: '40px', marginBottom: '32px' }}>
          <p className="section-label" style={{ marginBottom: '14px' }}>TU MENÚ</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
            {MENU_OPTIONS.map(({ to, icon: Icon, title, sub }) => (
              <Link key={to} to={to} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', textDecoration: 'none' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,85,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color="var(--orange)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13.5px', color: 'var(--white)' }}>{title}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '11.5px', color: 'var(--muted)' }}>{sub}</div>
                </div>
                <ChevronRight size={15} color="var(--muted)" />
              </Link>
            ))}
          </div>
        </div>

        {/* Theme settings */}
        <div style={{ marginBottom: '32px' }}>
          <ThemeSwitcher />
        </div>

        {/* Active reminders */}
        {reminders.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <p className="section-label" style={{ marginBottom: '14px' }}>🔔 RECORDATORIOS ACTIVOS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reminders.map(r => (
                <div key={r.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--orange)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', fontWeight: 600 }}>{r.stopName}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>{timeUntil(r.remindAt)}</p>
                  </div>
                  <button onClick={() => cancel(r.id)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '12px' }}>
                    <X size={12} /> Cancelar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ajustes — espejo de SettingsGroup/SettingRow en ProfileParts.kt */}
        <p className="section-label" style={{ marginBottom: '12px' }}>AJUSTES</p>
        <div className="card" style={{ padding: '4px', marginBottom: '10px' }}>
          <SettingRow icon={Share} title="Compartir Burrito" onClick={handleShareApp} />
          <SettingDivider />
          <SettingRow icon={LifeBuoy} title="Reportar un problema" onClick={handleReport} />
        </div>
        <div className="card" style={{ padding: '4px' }}>
          <SettingRow icon={LogOut} title="Cerrar sesión" danger onClick={() => logout()} />
        </div>
      </div>

      {/* Editar nombre */}
      <AnimatePresence>
        {editingName && (
          <ConfirmDialog
            title="¿Cómo te llamas?"
            onDismiss={() => setEditingName(false)}
            confirmLabel="Guardar"
            onConfirm={handleSaveName}
          >
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              autoFocus
              className="input"
              style={{ marginTop: '4px' }}
            />
          </ConfirmDialog>
        )}
      </AnimatePresence>

      {/* Confirmar borrado */}
      <AnimatePresence>
        {deleteTarget && (
          <ConfirmDialog
            title="¿Eliminar este día?"
            onDismiss={() => setDeleteTarget(null)}
            confirmLabel="Eliminar"
            confirmDanger
            onConfirm={handleDeleteConfirm}
          >
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)' }}>
              "{deleteTarget.title}" se borrará de tus itinerarios guardados.
            </p>
          </ConfirmDialog>
        )}
      </AnimatePresence>
    </div>
  )
}

function SettingRow({ icon: Icon, title, danger, onClick }: {
  icon: typeof Share
  title: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '13px 12px', background: 'none', border: 'none', cursor: 'pointer',
        borderRadius: '12px', textAlign: 'left',
      }}
    >
      <Icon size={17} color={danger ? '#ff4040' : 'var(--muted)'} />
      <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: '14px', color: danger ? '#ff4040' : 'var(--white)' }}>{title}</span>
      {!danger && <ChevronRight size={16} color="var(--muted)" />}
    </button>
  )
}

function SettingDivider() {
  return <div style={{ height: '1px', background: 'var(--card2)', margin: '0 12px 0 42px' }} />
}

/** Diálogo chico genérico — espejo visual de EditNameDialog/DeleteItineraryDialog. */
function ConfirmDialog({ title, children, onDismiss, onConfirm, confirmLabel, confirmDanger }: {
  title: string
  children: React.ReactNode
  onDismiss: () => void
  onConfirm: () => void
  confirmLabel: string
  confirmDanger?: boolean
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onDismiss}
        style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(5,4,3,0.55)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 1301, width: 'min(90vw, 360px)',
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px',
          padding: '22px',
        }}
      >
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '17px', color: 'var(--white)', marginBottom: '10px' }}>
          {title}
        </h3>
        {children}
        <div style={{ display: 'flex', gap: '10px', marginTop: '18px', justifyContent: 'flex-end' }}>
          <button onClick={onDismiss} className="btn btn-ghost btn-sm">Cancelar</button>
          <button
            onClick={onConfirm}
            className={confirmDanger ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </>
  )
}
