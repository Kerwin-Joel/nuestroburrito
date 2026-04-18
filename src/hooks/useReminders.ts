import { useState, useCallback } from 'react'
import { notificationsService } from '../services/notifications'
import type { Reminder } from '../types/user'

export const useReminders = (userId: string) => {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await notificationsService.getActiveReminders(userId)
      setReminders(data)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const schedule = async (reminder: Reminder) => {
    await notificationsService.scheduleReminder(reminder)
    setReminders((prev) => [...prev.filter((r) => r.id !== reminder.id), reminder])
  }

  const cancel = async (id: string) => {
    await notificationsService.cancelReminder(id)
    setReminders((prev) => prev.filter((r) => r.id !== id))
  }

  return { reminders, loading, load, schedule, cancel }
}
