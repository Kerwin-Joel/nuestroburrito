import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUIStore } from '../../stores/useUIStore'
import { itinerariesService } from '../../services/itineraries'
import { GROUP_OPTIONS, TIME_OPTIONS } from '../../lib/constants'
import type { ItineraryPreferences } from '../../types/itinerary'

/**
 * Espejo de ui/wizard/CreateRouteSheet.kt: aparece cuando se toca "+" en un
 * spot sin tener una ruta abierta (o con la anterior ya completada). Crea la
 * ruta y agrega ese spot de una vez, sin sacar al usuario de donde estaba.
 *
 * Vive en TouristLayout para que funcione desde cualquier pantalla (Explorar,
 * la ficha del spot, Inicio). De paso recupera la ruta abierta del usuario al
 * entrar a la app — si no, tras recargar `current` quedaba vacío hasta pasar
 * por "Mi día" y el "+" ofrecía crear una ruta nueva teniendo una abierta.
 */
export default function CreateRouteSheet() {
  const { current, pendingStop, setCurrent, resolvePendingStop, cancelPendingStop } = useItineraryStore()
  const { user } = useAuthStore()
  const { addToast } = useUIStore()

  const [title, setTitle] = useState('')
  const [group, setGroup] = useState<ItineraryPreferences['group']>('couple')
  const [time, setTime] = useState<ItineraryPreferences['time']>('full')
  const [creating, setCreating] = useState(false)
  const dragControls = useDragControls()

  useEffect(() => {
    if (!pendingStop) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !creating) cancelPendingStop() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pendingStop, creating, cancelPendingStop])

  useEffect(() => {
    if (current || !user?.id || sessionStorage.getItem('burrito-discarded')) return
    itinerariesService.getByUser(user.id).then(list => {
      if (useItineraryStore.getState().current) return
      const open = list.find(i => i.status === 'in_progress') ?? list.find(i => i.status === 'draft')
      if (open) setCurrent(open)
    }).catch(() => {})
    // Solo al entrar: después la ruta la manejan las propias acciones del store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    if (pendingStop) {
      setTitle('')
      setGroup('couple')
      setTime('full')
    }
  }, [pendingStop])

  const previousCompleted = current?.status === 'completed'

  const handleCreate = async () => {
    if (!pendingStop || !user || creating) return
    setCreating(true)
    try {
      const saved = await itinerariesService.save({
        userId: user.id,
        title: title.trim() || pendingStop.spotName,
        preferences: { interests: [], time, group, budget: 'mid' },
        stops: [],
        generatedBy: 'manual',
        isSaved: true,
        status: 'draft',
      })
      sessionStorage.removeItem('burrito-discarded')
      setCurrent(saved)
      resolvePendingStop()
    } catch (err) {
      console.error('Error creando la ruta:', err)
      addToast({ type: 'error', message: 'No se pudo crear la ruta. Intenta de nuevo.' })
    } finally {
      setCreating(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      {pendingStop && (
        <>
          <motion.div
            key="route-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !creating && cancelPendingStop()}
            style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(20,12,4,0.45)' }}
          />
          <motion.div
            key="route-sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            // Se arrastra desde la manija, no desde todo el sheet: así el
            // contenido puede hacer scroll en pantallas bajas sin pelear
            // con el gesto de cerrar.
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (!creating && (info.offset.y > 110 || info.velocity.y > 700)) cancelPendingStop() }}
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1201,
              maxWidth: '560px', margin: '0 auto',
              background: 'var(--card)', borderRadius: '28px 28px 0 0',
              border: '1px solid var(--border)', borderBottom: 'none',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.18)',
              padding: '0 20px calc(24px + env(safe-area-inset-bottom))',
              maxHeight: '88dvh', overflowY: 'auto',
            }}
          >
            <div
              onPointerDown={e => dragControls.start(e)}
              style={{ padding: '10px 0 16px', cursor: 'grab', touchAction: 'none' }}
            >
              <div style={{ width: '32px', height: '4px', borderRadius: '99px', background: 'var(--muted)', opacity: 0.4, margin: '0 auto' }} />
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '24px', color: 'var(--white)', letterSpacing: '-0.5px' }}>
              {previousCompleted ? '¡Ruta completada! 🎉' : 'Aún no tienes una ruta'}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', marginTop: '6px' }}>
              {previousCompleted
                ? <>Arma tu siguiente ruta para agregar "{pendingStop.spotName}" — toma 10 segundos.</>
                : <>Crea una para agregar "{pendingStop.spotName}" — toma 10 segundos.</>}
            </p>

            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Ponle nombre a tu ruta"
              maxLength={40}
              className="input"
              style={{ marginTop: '20px', fontSize: '16px' }}
            />

            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--white)', marginTop: '18px', marginBottom: '8px' }}>¿Con quién vas?</p>
            <ChipRow options={GROUP_OPTIONS} value={group} onChange={v => setGroup(v as ItineraryPreferences['group'])} />

            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--white)', marginTop: '18px', marginBottom: '8px' }}>¿Cuánto tiempo tienes?</p>
            <ChipRow options={TIME_OPTIONS} value={time} onChange={v => setTime(v as ItineraryPreferences['time'])} />

            <motion.button
              onClick={handleCreate}
              disabled={creating}
              whileTap={{ scale: 0.97 }}
              className="btn btn-primary"
              style={{ width: '100%', height: '52px', marginTop: '24px', justifyContent: 'center', fontSize: '15px', borderRadius: '99px' }}
            >
              {creating ? <Loader2 size={18} className="animate-spin" /> : 'Crear ruta y agregar spot →'}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function ChipRow({ options, value, onChange }: {
  options: readonly { id: string; emoji: string; label: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {options.map(opt => {
        const selected = opt.id === value
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            style={{
              padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
              border: selected ? '1px solid transparent' : '1px solid var(--border)',
              background: selected ? 'var(--orange)' : 'transparent',
              color: selected ? '#fff' : 'var(--white)',
              fontFamily: 'var(--font-body)', fontSize: '13.5px', fontWeight: 600,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {opt.emoji} {opt.label}
          </button>
        )
      })}
    </div>
  )
}
