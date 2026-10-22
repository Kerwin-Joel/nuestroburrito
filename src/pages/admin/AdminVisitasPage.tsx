import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Copy, Eye, EyeOff, Gift, KeyRound, Link2, MessageCircle, QrCode, RefreshCw, Search, Stamp } from 'lucide-react'
import AdminStatCard from '../../components/admin/AdminStatCard'
import StatusBadge from '../../components/admin/StatusBadge'
import { supabase } from '../../lib/supabase'
import { useUIStore } from '../../stores/useUIStore'

/*
 * Visitas y premios por spot. Cada spot decide si da un premio al completar N
 * visitas y cómo se valida la visita: el QR impreso del local o el PIN que solo
 * conoce el dueño (lo ve en su panel /local/<token>, que se le comparte desde
 * aquí). El PIN cambia cada vez que se usa. Todo por RPC loyalty_admin_*.
 */

interface Row {
  spot_id: string
  name: string
  category: string
  photo_url: string | null
  enabled: boolean | null
  visits_required: number | null
  reward_title: string | null
  reward_description: string | null
  reward_emoji: string | null
  validation: 'qr' | 'pin'
  cooldown_hours: number
  owner_token: string | null
  pin: string | null
  rotated_at: string | null
  pin_uses: number | null
  qr_codes: number
  visits_total: number
  visits_30d: number
  rewards_earned: number
  rewards_redeemed: number
}

const fetchList = () => supabase.rpc('loyalty_admin_list')
const EMOJIS = ['🎁', '☕', '🍰', '🍦', '🍹', '🍽️', '🥤', '🍪', '🧁', '🏷️', '⭐', '🎟️']
const COOLDOWNS = [0, 4, 8, 12, 24, 48]

export default function AdminVisitasPage() {
  const { addToast } = useUIStore()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [onlyEnabled, setOnlyEnabled] = useState(false)
  const [open, setOpen] = useState<string | null>(null)

  const apply = useCallback((res: Awaited<ReturnType<typeof fetchList>>) => {
    if (res.error) addToast({ type: 'error', message: 'No se pudo cargar visitas y premios' })
    else setRows(res.data as Row[])
    setLoading(false)
  }, [addToast])
  useEffect(() => {
    let alive = true
    fetchList().then(r => { if (alive) apply(r) })
    return () => { alive = false }
  }, [apply])
  const reload = () => fetchList().then(apply)

  const list = useMemo(() => rows
    .filter(r => !onlyEnabled || r.enabled)
    .filter(r => !query || r.name.toLowerCase().includes(query.toLowerCase())), [rows, query, onlyEnabled])

  const totals = useMemo(() => ({
    enabled: rows.filter(r => r.enabled).length,
    visits: rows.reduce((a, r) => a + Number(r.visits_30d), 0),
    earned: rows.reduce((a, r) => a + Number(r.rewards_earned), 0),
    redeemed: rows.reduce((a, r) => a + Number(r.rewards_redeemed), 0),
  }), [rows])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--white)', margin: 0 }}>Visitas y premios</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray)', margin: 0 }}>
            Premios por visitas del pasaporte y cómo valida cada local (QR o PIN)
          </p>
        </div>
        <Link to="/admin/qr" className="btn btn-ghost btn-sm" style={{ gap: 6 }}><QrCode size={15} /> Imprimir QR de locales</Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
        <AdminStatCard icon={Gift} value={totals.enabled} label="Spots con premio" />
        <AdminStatCard icon={Stamp} value={totals.visits} label="Visitas (30 días)" />
        <AdminStatCard icon={Gift} value={totals.earned} label="Premios ganados" sub={`${totals.redeemed} canjeados`} subType="success" />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 420 }}>
          <Search size={17} color="var(--gray)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar spot…"
            style={{ width: '100%', background: 'var(--dim)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 10px 10px 38px', color: 'var(--white)', outline: 'none' }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray)', fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={onlyEnabled} onChange={e => setOnlyEnabled(e.target.checked)} /> Solo con premio
        </label>
      </div>

      {loading ? <p style={{ color: 'var(--gray)' }}>Cargando…</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(r => (
            <SpotRow key={r.spot_id} r={r} open={open === r.spot_id} onToggle={() => setOpen(o => (o === r.spot_id ? null : r.spot_id))} onSaved={reload} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

function SpotRow({ r, open, onToggle, onSaved }: { r: Row; open: boolean; onToggle: () => void; onSaved: () => void }) {
  const { addToast } = useUIStore()
  const [enabled, setEnabled] = useState(!!r.enabled)
  const [visits, setVisits] = useState(r.visits_required ?? 5)
  const [title, setTitle] = useState(r.reward_title ?? '')
  const [desc, setDesc] = useState(r.reward_description ?? '')
  const [emoji, setEmoji] = useState(r.reward_emoji ?? '🎁')
  const [validation, setValidation] = useState<'qr' | 'pin'>(r.validation)
  const [cooldown, setCooldown] = useState(r.cooldown_hours)
  const [saving, setSaving] = useState(false)
  const [showPin, setShowPin] = useState(false)

  const save = async () => {
    if (enabled && !title.trim()) return addToast({ type: 'error', message: 'Escribe el premio antes de activarlo' })
    setSaving(true)
    const { error } = await supabase.rpc('loyalty_admin_save', {
      p_spot: r.spot_id, p_enabled: enabled, p_visits_required: visits, p_reward_title: title, p_reward_description: desc,
      p_reward_emoji: emoji, p_validation: validation, p_cooldown_hours: cooldown,
    })
    setSaving(false)
    if (error) return addToast({ type: 'error', message: 'No se pudo guardar' })
    addToast({ type: 'success', message: `${r.name.trim()}: guardado` })
    onSaved()
  }

  const rotatePin = async () => {
    const { error } = await supabase.rpc('loyalty_admin_rotate_pin', { p_spot: r.spot_id })
    if (error) return addToast({ type: 'error', message: 'No se pudo cambiar el PIN' })
    setShowPin(true); onSaved()
  }

  const newLink = async () => {
    if (r.owner_token && !confirm('El enlace actual dejará de funcionar. ¿Generar uno nuevo?')) return
    const { error } = await supabase.rpc('loyalty_admin_new_owner_link', { p_spot: r.spot_id })
    if (error) return addToast({ type: 'error', message: 'No se pudo generar el enlace' })
    addToast({ type: 'success', message: 'Enlace del local listo' }); onSaved()
  }

  const link = r.owner_token ? `${window.location.origin}/local/${r.owner_token}` : null
  const share = link ? `Hola 👋 Este es el panel de ${r.name.trim()} en Burrito. Ahí ves el PIN para marcar visitas y canjear premios (cambia cada vez que se usa). No lo compartas:\n${link}` : ''

  return (
    <div style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', borderLeft: `4px solid ${r.enabled ? 'var(--orange)' : 'var(--border)'}` }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        {r.photo_url ? <img src={r.photo_url} alt="" style={{ width: 46, height: 46, borderRadius: 12, objectFit: 'cover' }} /> : <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--dim)' }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--white)' }}>{r.name.trim()}</div>
          <div style={{ fontSize: 12, color: 'var(--gray)' }}>
            {r.enabled ? `${r.reward_emoji} ${r.reward_title} · ${r.visits_required} visitas` : 'Solo cuenta visitas'} · {r.validation === 'pin' ? 'PIN del dueño' : 'QR impreso'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--gray)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span><strong style={{ color: 'var(--white)' }}>{r.visits_30d}</strong> visitas 30d</span>
          <span><strong style={{ color: 'var(--white)' }}>{r.rewards_earned}</strong> premios</span>
          <StatusBadge status={r.enabled ? 'activo' : 'inactivo'} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 32 }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, padding: '4px 16px 18px', borderTop: '1px solid var(--border)' }}>
              {/* ── Premio ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--white)', fontWeight: 600, cursor: 'pointer' }}>
                  <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} /> Dar premio por visitas
                </label>
                <div style={{ opacity: enabled ? 1 : 0.45, pointerEvents: enabled ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Visitas para ganar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setVisits(v => Math.max(2, v - 1))}>−</button>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--white)', minWidth: 32, textAlign: 'center' }}>{visits}</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => setVisits(v => Math.min(30, v + 1))}>+</button>
                    </div>
                  </Field>
                  <Field label="Ícono">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => setEmoji(e)} style={{ width: 36, height: 36, borderRadius: 10, fontSize: 18, cursor: 'pointer', border: emoji === e ? '2px solid var(--orange)' : '1px solid var(--border)', background: 'var(--dim)' }}>{e}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Premio">
                    <input value={title} maxLength={80} onChange={e => setTitle(e.target.value)} placeholder="Ej. Un café gratis" style={input} />
                  </Field>
                  <Field label="Detalle (opcional)">
                    <input value={desc} maxLength={300} onChange={e => setDesc(e.target.value)} placeholder="Ej. Válido de lunes a jueves" style={input} />
                  </Field>
                </div>
              </div>

              {/* ── Validación ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 14 }}>
                <Field label="¿Cómo se valida la visita?">
                  <div style={{ display: 'flex', gap: 4, background: 'var(--dim)', padding: 4, borderRadius: 10 }}>
                    {(['qr', 'pin'] as const).map(v => (
                      <button key={v} onClick={() => setValidation(v)} style={{
                        flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                        background: validation === v ? 'var(--card2)' : 'transparent', color: validation === v ? 'var(--orange)' : 'var(--gray)',
                      }}>{v === 'qr' ? 'QR impreso' : 'PIN del dueño'}</button>
                    ))}
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--gray)' }}>
                    {validation === 'qr'
                      ? `Vale el QR del local (${r.qr_codes} activo${r.qr_codes === 1 ? '' : 's'}). El PIN igual sirve para canjear premios.`
                      : 'Solo vale el PIN (o el QR del panel del dueño). Cambia cada vez que se usa.'}
                  </p>
                </Field>
                <Field label="Una visita cada">
                  <select value={cooldown} onChange={e => setCooldown(Number(e.target.value))} style={input}>
                    {COOLDOWNS.map(h => <option key={h} value={h}>{h === 0 ? 'Sin límite' : `${h} horas`}</option>)}
                  </select>
                </Field>

                <div style={{ padding: 12, borderRadius: 12, background: 'var(--dim)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <KeyRound size={16} color="var(--orange)" />
                    <span style={{ fontSize: 13, color: 'var(--gray)' }}>PIN vigente</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--white)', letterSpacing: 4 }}>
                      {r.pin ? (showPin ? r.pin : '••••') : '—'}
                    </span>
                    {r.pin && <button onClick={() => setShowPin(s => !s)} className="btn btn-ghost btn-sm" aria-label="Ver PIN">{showPin ? <EyeOff size={15} /> : <Eye size={15} />}</button>}
                    <button onClick={rotatePin} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', gap: 4 }}><RefreshCw size={14} /> {r.pin ? 'Cambiar' : 'Crear'}</button>
                  </div>
                  {r.pin_uses != null && <span style={{ fontSize: 11, color: 'var(--gray)' }}>Usado {r.pin_uses} veces · se renueva solo en cada uso</span>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Link2 size={16} color="var(--orange)" />
                    <span style={{ fontSize: 13, color: 'var(--gray)' }}>Panel del dueño</span>
                    {link ? (
                      <>
                        <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={() => { navigator.clipboard.writeText(link); addToast({ type: 'success', message: 'Enlace copiado' }) }}><Copy size={14} /> Copiar</button>
                        <a className="btn btn-ghost btn-sm" style={{ gap: 4 }} href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a>
                        <button className="btn btn-ghost btn-sm" onClick={newLink}>Nuevo enlace</button>
                      </>
                    ) : <button className="btn btn-ghost btn-sm" onClick={newLink}>Generar enlace</button>}
                  </div>
                </div>

                <button className="btn btn-primary" disabled={saving} onClick={save} style={{ justifyContent: 'center' }}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const input: React.CSSProperties = { width: '100%', background: 'var(--dim)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--white)', outline: 'none', fontFamily: 'var(--font-body)' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      {children}
    </div>
  )
}
