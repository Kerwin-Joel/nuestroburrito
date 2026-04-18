import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'

export default function AuthCallbackPage() {
    const navigate = useNavigate()
    const { user, isLoading, initialize } = useAuthStore()

    useEffect(() => {
        const redirect = async () => {
            // Espera que initialize termine
            await initialize()

            const currentUser = useAuthStore.getState().user

            if (!currentUser) {
                navigate('/login', { replace: true })
                return
            }

            const role = currentUser.profile.role
            const status = currentUser.profile.status

            if (role === 'admin') {
                navigate('/admin/dashboard', { replace: true })
            } else if (role === 'churre') {
                if (status === 'pending') {
                    navigate('/waiting-approval', { replace: true })
                } else {
                    navigate('/churres', { replace: true })
                }
            } else {
                navigate('/app', { replace: true })
            }
        }

        redirect()
    }, [])

    return (
        <div style={{
            minHeight: '100vh',
            background: '#080705',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px'
        }}>
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#FF5500',
                boxShadow: '0 0 24px rgba(255,85,0,0.4)',
                animation: 'pulse 1s ease-in-out infinite'
            }} />
            <p style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: '13px',
                color: '#6b6055',
                letterSpacing: '1px'
            }}>
                Verificando acceso...
            </p>
            <style>{`
        @keyframes pulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
        }
      `}</style>
        </div>
    )
}