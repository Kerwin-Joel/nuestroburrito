import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'

/**
 * Panel del local (nuestroburrito.com/local/<token>): lo abre el dueño o su
 * personal, sin cuenta, con el enlace que le da el equipo Burrito. Muestra el
 * PIN vigente y un QR con ese mismo PIN; los dos cambian cada vez que alguien
 * los usa (para marcar una visita o canjear un premio).
 */
interface Panel {
  spot_id: string
  spot_name: string
  photo_url: string | null
  pin: string
  qr_payload: string
  rotated_at: string
  validation: 'qr' | 'pin'
  enabled: boolean
  visits_required: number
  reward_title: string | null
  reward_emoji: string
  visits_today: number
  rewards_redeemed_today: number
}

export default function LocalPanelPage() {
  const { token = '' } = useParams()
  const [panel, setPanel] = useState<Panel | null>(null)
  const [missing, setMissing] = useState(false)
  const [justUsed, setJustUsed] = useState(false)
  const lastPin = useRef<string | null>(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const { data, error } = await supabase.rpc('loyalty_owner_panel', { p_token: token })
      if (!alive) return
      if (error || !data) { setMissing(true); return }
      const p = data as Panel
      // El PIN cambió: alguien lo acaba de usar.
      if (lastPin.current && lastPin.current !== p.pin) {
        setJustUsed(true)
        setTimeout(() => setJustUsed(false), 3500)
      }
      lastPin.current = p.pin
      setMissing(false)
      setPanel(p)
    }
    load()
    const id = setInterval(load, 4000)
    return () => { alive = false; clearInterval(id) }
  }, [token])

  const qrUrl = panel ? `${window.location.origin}/app/verify?code=${encodeURIComponent(panel.qr_payload)}` : ''

  return (
    <div style={{ minHeight: '100dvh', background: '#FDF8EF', color: '#1A120A', fontFamily: 'var(--font-body)', padding: '24px 18px 40px' }}>
      <div style={{ maxWidth: 440, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <span style={{ font: '800 24px var(--font-display)', letterSpacing: '-1px' }}>burri<span style={{ color: '#E8920A' }}>to</span></span>
          <div style={{ font: '700 11px var(--font-mono)', letterSpacing: 2, color: '#A08060', marginTop: 2 }}>PANEL DEL LOCAL</div>
        </div>

        {missing && (
          <div style={{ textAlign: 'center', padding: 30, borderRadius: 24, background: '#FFFCF5' }}>
            <div style={{ fontSize: 40 }}>🔒</div>
            <h2 style={{ font: '800 20px var(--font-display)', margin: '8px 0 4px' }}>Enlace no válido</h2>
            <p style={{ margin: 0, color: '#7A6550', fontSize: 14 }}>Pide un enlace nuevo al equipo de Burrito.</p>
          </div>
        )}

        {panel && (
          <>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              {panel.photo_url && <img src={panel.photo_url} alt="" style={{ width: 54, height: 54, borderRadius: 16, objectFit: 'cover' }} />}
              <div style={{ minWidth: 0 }}>
                <div style={{ font: '800 20px var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{panel.spot_name.trim()}</div>
                <div style={{ fontSize: 13, color: '#7A6550' }}>
                  {panel.enabled && panel.reward_title ? `${panel.reward_emoji} ${panel.reward_title} cada ${panel.visits_required} visitas` : 'Visitas del pasaporte'}
                </div>
              </div>
            </motion.div>

            {/* PIN vigente */}
            <div style={{ position: 'relative', borderRadius: 28, background: '#1A120A', color: '#fff', padding: '22px 18px', textAlign: 'center', overflow: 'hidden' }}>
              <AnimatePresence>
                {justUsed && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ position: 'absolute', top: 12, left: 0, right: 0, font: '700 12px var(--font-body)', color: '#7CE0A3' }}>
                    ✓ PIN usado · ya hay uno nuevo
                  </motion.div>
                )}
              </AnimatePresence>
              <div style={{ font: '700 12px var(--font-mono)', letterSpacing: 2, opacity: 0.7, marginTop: 8 }}>PIN DE HOY</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12 }}>
                {panel.pin.split('').map((d, i) => (
                  <AnimatePresence key={i} mode="popLayout" initial={false}>
                    <motion.span key={`${d}-${panel.rotated_at}`}
                      initial={{ rotateX: -90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} exit={{ rotateX: 90, opacity: 0 }}
                      transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 22 }}
                      style={{ width: 62, height: 78, borderRadius: 16, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 44px var(--font-display)' }}>
                      {d}
                    </motion.span>
                  </AnimatePresence>
                ))}
              </div>
              <p style={{ margin: '14px 0 0', fontSize: 13, opacity: 0.75 }}>Díctalo al cliente o escríbelo en su celular. Cambia apenas se usa.</p>
            </div>

            {/* QR con el mismo PIN */}
            <div style={{ marginTop: 16, borderRadius: 28, background: '#FFFCF5', padding: 20, textAlign: 'center', border: '1px solid rgba(160,100,20,.14)' }}>
              <motion.div key={panel.qr_payload} initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                style={{ display: 'inline-block', padding: 12, background: '#fff', borderRadius: 18 }}>
                <QRCodeSVG value={qrUrl} size={210} fgColor="#1A120A" level="M" />
              </motion.div>
              <p style={{ margin: '12px 0 0', fontSize: 13, color: '#7A6550' }}>O que escaneen este QR desde la app de Burrito.</p>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <Stat value={panel.visits_today} label="Visitas hoy" />
              <Stat value={panel.rewards_redeemed_today} label="Premios canjeados hoy" />
            </div>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#A08060', marginTop: 18 }}>
              No compartas este enlace: quien lo tenga ve el PIN de tu local.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ flex: 1, borderRadius: 20, background: '#FFFCF5', border: '1px solid rgba(160,100,20,.14)', padding: '14px 12px', textAlign: 'center' }}>
      <div style={{ font: '800 26px var(--font-display)' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#7A6550' }}>{label}</div>
    </div>
  )
}
