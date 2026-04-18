import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Phone, ArrowLeft, MessageCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'

export default function WaitingApprovalPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background blobs */}
      <div style={{ 
        position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(255,85,0,0.08) 0%, transparent 70%)', borderRadius: '50%'
      }} />
      <div style={{ 
        position: 'absolute', bottom: '-10%', left: '-10%', width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(255,170,59,0.05) 0%, transparent 70%)', borderRadius: '50%'
      }} />

      {/* Logo top left */}
      <div style={{ position: 'absolute', top: '40px', left: '40px' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '28px',
          letterSpacing: '-1.5px',
          color: 'var(--white)',
        }}>
          burri<span style={{ color: 'var(--orange)' }}>to</span>
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '32px',
          padding: '48px 40px',
          textAlign: 'center',
          boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,170,59,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px',
            color: 'var(--amber)', fontSize: '40px'
          }}
        >
          ⏳
        </motion.div>

        <h1 style={{ 
          fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, 
          color: 'var(--white)', margin: '0 0 16px 0', letterSpacing: '-1px'
        }}>
          ¡Solicitud enviada! 🌯
        </h1>
        
        <p style={{ 
          fontFamily: 'var(--font-body)', color: 'var(--gray)', fontSize: '16px', 
          lineHeight: 1.7, margin: '0 0 32px 0'
        }}>
          Estamos revisando tu perfil de guía local.<br/>
          El equipo de Burrito verificará tu información en las próximas <b>24–48 horas</b>.
        </p>

        {/* Info Card */}
        <div style={{
          background: 'var(--card2)',
          borderLeft: '4px solid var(--amber)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'left',
          marginBottom: '32px'
        }}>
          <p style={{ 
            fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--amber)', 
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px'
          }}>
            ¿QUÉ SIGUE AHORA?
          </p>
          <ul style={{ 
            listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <InfoItem text="Preparar fotos de tus spots favoritos" />
            <InfoItem text="Pensar en los tips locales que conoces" />
            <InfoItem text="Contactarnos si tienes alguna duda" />
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a 
            href="https://wa.me/51999999999" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn"
            style={{ 
              width: '100%', height: '54px', fontSize: '16px', fontWeight: 700,
              background: 'linear-gradient(135deg, #25D366, #1aad54)', color: 'white',
              border: 'none'
            }}
          >
            <MessageCircle size={20} style={{ marginRight: '10px' }} /> Contactar por WhatsApp
          </a>

          <Link 
            to="/" 
            className="btn btn-ghost" 
            style={{ width: '100%', height: '54px', fontSize: '15px' }}
          >
             Volver al inicio
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

function InfoItem({ text }: { text: string }) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--orange)' }} />
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', opacity: 0.9 }}>
        {text}
      </span>
    </li>
  )
}
