import { Bell } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  action?: React.ReactNode
  notifCount?: number
}

export default function Topbar({ title, subtitle, action, notifCount = 2 }: Props) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 32px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
    }}>
      <div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '26px',
          letterSpacing: '-1px',
          color: 'var(--white)',
          lineHeight: 1,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {action}
        <button
          aria-label={`${notifCount} notificaciones`}
          style={{
            position: 'relative',
            background: 'var(--card2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--muted)',
          }}
        >
          <Bell size={18} />
          {notifCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              background: 'var(--orange)',
              borderRadius: '50%',
              border: '2px solid var(--bg)',
            }} />
          )}
        </button>
      </div>
    </header>
  )
}
