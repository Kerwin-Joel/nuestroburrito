import { useEffect, useRef } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, type LucideIcon } from 'lucide-react'
import { useUIStore, type Toast, type ToastType } from '../../stores/useUIStore'
import { gsap } from 'gsap'

const ICONS: Record<ToastType, LucideIcon> = {
  success: CheckCircle,
  error:   AlertCircle,
  info:    Info,
  warning: AlertTriangle,
}
const COLORS: Record<ToastType, string> = {
  success: '#25D366',
  error:   '#ff4040',
  info:    'var(--orange)',
  warning: 'var(--amber)',
}

function ToastItem({ toast }: { toast: Toast }) {
  const ref = useRef<HTMLDivElement>(null)
  const { removeToast } = useUIStore()
  const Icon = ICONS[toast.type]
  const color = COLORS[toast.type]

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current,
        { x: '100%', opacity: 0 },
        { x: '0%', opacity: 1, duration: 0.35, ease: 'power3.out' }
      )
    }
  }, [])

  const dismiss = () => {
    if (ref.current) {
      gsap.to(ref.current, {
        x: '110%', opacity: 0, duration: 0.25, ease: 'power2.in',
        onComplete: () => removeToast(toast.id),
      })
    }
  }

  return (
    <div ref={ref} style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderLeft: `4px solid ${color}`,
      borderRadius: '12px',
      padding: '14px 16px',
      maxWidth: '360px',
      minWidth: '280px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      position: 'relative',
    }}>
      <Icon size={18} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', lineHeight: 1.4 }}>
          {toast.message}
        </p>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            style={{ marginTop: 6, fontFamily: 'var(--font-body)', fontSize: '13px', color, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700 }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={dismiss}
        aria-label="Cerrar notificación"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', padding: 0, flexShrink: 0, marginTop: 1 }}
      >
        <X size={15} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts } = useUIStore()
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none',
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}
