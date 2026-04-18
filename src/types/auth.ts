export type UserRole = 'tourist' | 'churre' | 'admin'
export type UserStatus = 'active' | 'pending' | 'rejected'

export interface Profile {
  id: string
  role: UserRole
  name: string
  avatarUrl: string | null
  status: UserStatus
  createdAt: string
  // Churre specific fields
  university?: 'UDEP' | 'UNP' | 'UCV' | 'Independiente' | null
  bio?: string
  zones?: string[]
  specialties?: string[]
}

export interface AuthUser {
  id: string
  email: string
  profile: Profile
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterTouristData {
  name: string
  email: string
  password: string
}

export interface RegisterChurreData {
  name: string
  email: string
  password: string
  university: 'UDEP' | 'UNP' | 'UCV' | 'Independiente' | null
  bio: string
  zones: string[]
  specialties: string[]
  avatarFile?: File
}
