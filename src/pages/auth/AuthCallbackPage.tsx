import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../stores/useAuthStore'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { initialize } = useAuthStore()

  useEffect(() => {
    const redirect = async () => {
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
        navigate(status === 'pending' ? '/waiting-approval' : '/churres', { replace: true })
      } else {
        navigate('/app', { replace: true })
      }
    }

    redirect()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
      }}
    >
      <motion.img
        src="/imagotipo.png"
        alt="Burrito"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ height: '64px', width: 'auto', filter: 'drop-shadow(0 12px 24px rgba(255,85,0,0.3))' }}
      />
      <div style={{ display: 'flex', gap: '6px' }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
            style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--orange)' }}
          />
        ))}
      </div>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        color: 'var(--muted)',
        letterSpacing: '1px',
      }}>
        Verificando acceso...
      </p>
    </motion.div>
  )
}
