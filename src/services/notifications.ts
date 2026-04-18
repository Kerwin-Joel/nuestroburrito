import { MOCK_DELAY_MS } from '../lib/constants'
import type { Reminder } from '../types/user'

const STORAGE_KEY = 'burrito-reminders'
const delay = () => new Promise((r) => setTimeout(r, MOCK_DELAY_MS))

const load = (): Reminder[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}
const save = (reminders: Reminder[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders))
}

export const notificationsService = {
  async scheduleReminder(reminder: Reminder): Promise<void> {
    await delay()
    const all = load()
    const existing = all.findIndex((r) => r.id === reminder.id)
    if (existing >= 0) all[existing] = reminder
    else all.push(reminder)
    save(all)
  },

  async cancelReminder(id: string): Promise<void> {
    await delay()
    save(load().filter((r) => r.id !== id))
  },

  async getActiveReminders(userId: string): Promise<Reminder[]> {
    await delay()
    return load().filter((r) => r.userId === userId && !r.sent)
  },
}
