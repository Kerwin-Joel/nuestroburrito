import { useState } from 'react'
import { Bell, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { useReminders } from '../../hooks/useReminders'
import { useUIStore } from '../../stores/useUIStore'
import type { Reminder } from '../../types/user'

export default function ReminderPanel() {
  const [open, setOpen] = useState(false)
  const { current } = useItineraryStore()
  const { reminders, schedule } = useReminders('tourist-demo')
  const { addToast } = useUIStore()

  if (!current) return null

  const handleSchedule = async (stopIdx: number, stopName: string, minutesBefore: number) => {
    const remindAt = new Date()
    remindAt.setHours(remindAt.getHours() + 1)
    const reminder: Reminder = {
      id: `reminder-${stopIdx}-${Date.now()}`,
      userId: 'tourist-demo',
      itineraryId: current.id,
      stopIndex: stopIdx,
      stopName,
      remindAt: remindAt.toISOString(),
      minutesBefore,
      channel: 'push',
      sent: false,
    }
    await schedule(reminder)
    addToast({ type: 'info', message: `🔔 Recordatorio activado para ${stopName}` })
  }

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '16px',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'var(--card)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--white)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={16} color="var(--orange)" />
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '14px' }}>Activar recordatorios</span>
          {reminders.length > 0 && (
            <span className="badge badge-orange">{reminders.length}</span>
          )}
        </div>
        <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--gray)' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '4px 16px 16px', background: 'var(--card)' }}>
              {current.stops.map((stop, idx) => {
                const hasReminder = reminders.some(r => r.stopIndex === idx)
                return (
                  <div key={stop.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: idx < current.stops.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', fontWeight: 600 }}>
                        {stop.spotName}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>
                        {stop.time}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSchedule(idx, stop.spotName, 30)}
                      className={`btn btn-sm ${hasReminder ? 'btn-ghost' : 'btn-ghost'}`}
                      style={{
                        borderColor: hasReminder ? 'rgba(255,85,0,0.4)' : undefined,
                        color: hasReminder ? 'var(--orange)' : undefined,
                        fontSize: '12px',
                      }}
                    >
                      {hasReminder ? '✓ Activado' : '+ Recordar'}
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
