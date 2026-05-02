import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ToastContainer from './components/shared/ToastContainer'
import { useAuthStore } from './stores/useAuthStore'
import ProtectedRoute from './components/auth/ProtectedRoute'
import SolBurrito from './components/shared/SolBurrito'
import { useThemeStore } from './stores/useThemeStore'

// Auth pages (lazy)
const AuthLayout = lazy(() => import('./layouts/AuthLayout'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const ChurreRegisterPage = lazy(() => import('./pages/auth/ChurreRegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const WaitingApprovalPage = lazy(() => import('./pages/auth/WaitingApprovalPage'))

// Tourist pages (lazy)
const TouristLayout = lazy(() => import('./layouts/TouristLayout'))
const HomePage = lazy(() => import('./pages/tourist/HomePage'))
const ItinerarioPage = lazy(() => import('./pages/tourist/ItinerarioPage'))
const ExplorarPage = lazy(() => import('./pages/tourist/ExplorarPage'))
const PerfilTourist = lazy(() => import('./pages/tourist/PerfilPage'))
const HistoriaPage = lazy(() => import('./pages/tourist/HistoriaPage'))

// Churre pages (lazy)
const ChurreLayout = lazy(() => import('./layouts/ChurreLayout'))
const DashboardPage = lazy(() => import('./pages/churre/DashboardPage'))
const SpotsPage = lazy(() => import('./pages/churre/SpotsPage'))
const ToursPage = lazy(() => import('./pages/churre/ToursPage'))
const ResenasPage = lazy(() => import('./pages/churre/ResenasPage'))
const PerfilChurre = lazy(() => import('./pages/churre/PerfilPage'))
const VerifyPage = lazy(() => import('./pages/verify/VerifyPage'))

// Admin pages
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminSpotsPage = lazy(() => import('./pages/admin/AdminSpotsPage'))
const AdminTiktoksPage = lazy(() => import('./pages/admin/AdminTiktoksPage'))
const AdminChurresPage = lazy(() => import('./pages/admin/AdminChurresPage'))
const AdminUsuariosPage = lazy(() => import('./pages/admin/AdminUsuariosPage'))
const AdminHoyEnPiuraPage = lazy(() => import('./pages/admin/AdminHoyEnPiuraPage'))
const AdminResenasPage = lazy(() => import('./pages/admin/AdminResenasPage'))
const AdminCategoriasPage = lazy(() => import('./pages/admin/AdminCategoriasPage'))
const AdminConfigPage = lazy(() => import('./pages/admin/AdminConfigPage'))
const AuthCallbackPage = lazy(() => import('./pages/auth/AuthCallbackPage'))
const AdminQRPage = lazy(() => import('./pages/admin/AdminQRPage'))
const AdminHistoriaPage = lazy(() => import('./pages/admin/AdminHistoriaPage'))


// Landing page
const LandingPage = lazy(() => import('./pages/LandingPage'))


function PageLoader() {
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
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <SolBurrito progress={progress} message="Armando tu día..." size={200} />
    </div>
  )
}

export default function App() {
  const initializeAuth = useAuthStore(state => state.initialize)
  const { computedTheme, updateComputedTheme } = useThemeStore()

  useEffect(() => {
    initializeAuth()
  }, [])

  // Setup theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', computedTheme)
  }, [computedTheme])

  // Check auto theme every minute
  useEffect(() => {
    updateComputedTheme() // Init
    const interval = setInterval(() => {
      updateComputedTheme()
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <BrowserRouter>
      <Suspense fallback={
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />
      }>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/landing" element={<LandingPage />} />
          <Route
            path="/auth/callback"
            element={<AuthCallbackPage />}
          />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/churre" element={<ChurreRegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route path="/waiting-approval" element={<WaitingApprovalPage />} />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Tourist routes (Protected) */}
          <Route path="/app" element={
            <ProtectedRoute allowedRoles={['tourist', 'admin']}>
              <TouristLayout />
            </ProtectedRoute>
          }>
            <Route index element={<HomePage />} />
            <Route path="itinerario" element={<ItinerarioPage />} />
            <Route path="explorar" element={<ExplorarPage />} />
            <Route path="historia" element={<HistoriaPage />} />
            <Route path="perfil" element={<PerfilTourist />} />
            <Route path="verify" element={<VerifyPage />} />
          </Route>

          {/* Churre routes (Protected) */}
          <Route path="/churres" element={
            <ProtectedRoute allowedRoles={['churre', 'admin']}>
              <ChurreLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/churres/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="spots" element={<SpotsPage />} />
            <Route path="tours" element={<ToursPage />} />
            <Route path="resenas" element={<ResenasPage />} />
            <Route path="perfil" element={<PerfilChurre />} />
          </Route>

          {/* Admin Routes (Protected) */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="spots" element={<AdminSpotsPage />} />
            <Route path="tiktoks" element={<AdminTiktoksPage />} />
            <Route path="churres" element={<AdminChurresPage />} />
            <Route path="usuarios" element={<AdminUsuariosPage />} />
            <Route path="hoy-en-piura" element={<AdminHoyEnPiuraPage />} />
            <Route path="resenas" element={<AdminResenasPage />} />
            <Route path="categorias" element={<AdminCategoriasPage />} />
            <Route path="configuracion" element={<AdminConfigPage />} />
            <Route path="qr" element={<AdminQRPage />} />
            <Route path="historia" element={<AdminHistoriaPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>

      {/* Global UI */}
      <ToastContainer />
    </BrowserRouter>
  )
}
