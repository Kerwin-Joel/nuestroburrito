import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { UserRole } from '../../types/auth'

interface Props {
  allowedRoles: UserRole[]
  children: ReactNode
}

function FullPageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'var(--orange)',
        boxShadow: '0 0 20px rgba(255,85,0,0.4)',
        animation: 'pulse-dot 1s ease-in-out infinite'
      }} />
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        color: 'var(--gray)',
        letterSpacing: '1px'
      }}>
        Cargando...
      </span>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default function ProtectedRoute({ allowedRoles, children }: Props) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) return <FullPageLoader />

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const userRole = user.profile.role

  if (!allowedRoles.includes(userRole)) {
    // ← Fix: redirige al área correcta según rol
    if (userRole === 'admin')
      return <Navigate to="/admin/dashboard" replace />
    if (userRole === 'churre')
      return <Navigate to="/churres" replace />
    if (userRole === 'tourist')
      return <Navigate to="/app" replace />
  }

  if (userRole === 'churre' && user.profile.status === 'pending') {
    if (location.pathname !== '/waiting-approval') {
      return <Navigate to="/waiting-approval" replace />
    }
  }

  return <>{children}</>
}
