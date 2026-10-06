import { Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../../stores/useAuthStore'
import { UserRole } from '../../types/auth'
import { ReactNode } from 'react'
import AppSplash from '../shared/AppSplash'

interface Props {
  allowedRoles: UserRole[]
  children: ReactNode
}

export default function ProtectedRoute({ allowedRoles, children }: Props) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()
  // Una vez que la apertura termina de desvanecerse (onDone), ya no se vuelve
  // a montar aunque isLoading vuelva a ponerse en true en esta misma vista:
  // la apertura de la app se ve una vez por arranque, no cada vez que se
  // revalida la sesión.
  const [splashDone, setSplashDone] = useState(false)

  if (isLoading || !splashDone) {
    return <AppSplash waitFor={isLoading} onDone={() => setSplashDone(true)} />
  }

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
