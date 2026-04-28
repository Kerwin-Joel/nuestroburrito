import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { UserRole } from '../../types/auth'
import { ReactNode, useState, useEffect } from 'react'
import SolBurrito from '../shared/SolBurrito'

interface Props {
  allowedRoles: UserRole[]
  children: ReactNode
}

function FullPageLoader() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 95) { clearInterval(iv); return 95 }
        return p + (p < 60 ? 3 : p < 85 ? 1.5 : 0.5)
      })
    }, 80)
    return () => clearInterval(iv)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080705',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <SolBurrito progress={progress} message="Armando tu día..." size={200} />
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
