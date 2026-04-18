import { LucideIcon, Plus } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  subtitle: string
  ctaLabel?: string
  onCta?: () => void
}

export default function AdminEmptyState({ 
  icon: Icon, 
  title, 
  subtitle, 
  ctaLabel, 
  onCta 
}: Props) {
  return (
    <div style={{
      border: '2px dashed var(--dim)',
      borderRadius: '20px',
      padding: '64px 32px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      background: 'rgba(255,255,255,0.01)',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'rgba(255,85,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--gray)',
        marginBottom: '20px'
      }}>
        <Icon size={32} />
      </div>

      <h3 style={{ 
        fontFamily: 'var(--font-display)', 
        fontSize: '20px', 
        color: 'var(--white)', 
        margin: '0 0 8px 0',
        letterSpacing: '-0.5px'
      }}>
        {title}
      </h3>
      
      <p style={{ 
        fontFamily: 'var(--font-body)', 
        fontSize: '14px', 
        color: 'var(--gray)', 
        maxWidth: '300px',
        lineHeight: 1.5,
        margin: '0 0 24px 0'
      }}>
        {subtitle}
      </p>

      {ctaLabel && onCta && (
        <button 
          onClick={onCta}
          className="btn btn-primary btn-sm"
          style={{ gap: '8px' }}
        >
          <Plus size={16} /> {ctaLabel}
        </button>
      )}
    </div>
  )
}
