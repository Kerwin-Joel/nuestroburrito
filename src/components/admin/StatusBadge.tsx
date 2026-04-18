interface Props {
  status: string
}

export default function StatusBadge({ status }: Props) {
  const s = status.toLowerCase()
  
  const getStyles = () => {
    if (['verified', 'confirmado', 'aprobado', 'activo', 'completado'].includes(s)) {
      return { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e', label: status.toUpperCase() }
    }
    if (['pending', 'pendiente', 'en revisión'].includes(s)) {
      return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', label: status.toUpperCase() }
    }
    if (['rejected', 'rechazado', 'cancelado', 'error'].includes(s)) {
      return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', label: status.toUpperCase() }
    }
    return { bg: 'rgba(107, 96, 85, 0.1)', text: 'var(--gray)', label: status.toUpperCase() }
  }

  const styles = getStyles()

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '10px',
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      background: styles.bg,
      color: styles.text,
      letterSpacing: '0.5px'
    }}>
      {styles.label}
    </span>
  )
}
