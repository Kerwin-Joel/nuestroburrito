export interface TouristUser {
  id: string
  name: string
  email: string
  avatarColor: string
  createdAt: string
}

export interface Reminder {
  id: string
  userId: string
  itineraryId: string
  stopIndex: number
  stopName: string
  remindAt: string // ISO string
  minutesBefore: number
  channel: 'push' | 'whatsapp' | 'email'
  sent: boolean
}
