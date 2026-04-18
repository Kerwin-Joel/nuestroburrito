import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  AuthUser,
  LoginCredentials,
  RegisterTouristData,
  RegisterChurreData,
  UserRole
} from '../types/auth'
import { authService } from '../services/auth'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  initialize: () => Promise<void>
  login: (credentials: LoginCredentials) => Promise<UserRole>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  registerTourist: (data: RegisterTouristData) => Promise<void>
  registerChurre: (data: RegisterChurreData) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true })
          const session = await authService.getSession()
          if (session) {
            set({ user: session, isAuthenticated: true, isLoading: false })
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false })
          }

          // ← ESTO ES LO QUE FALTABA
          // Escucha cambios de sesión incluyendo
          // el callback de Google OAuth
          authService.onAuthStateChange((event: string, session: any) => {

            // ← Ignora INITIAL_SESSION, ya lo maneja el initialize()
            if (event === 'INITIAL_SESSION') return

            if (event === 'SIGNED_IN' && session) {
              authService.getSession().then((user: any) => {
                if (user) {
                  set({ user, isAuthenticated: true, isLoading: false })
                }
              })
            }
            if (event === 'SIGNED_OUT') {
              set({ user: null, isAuthenticated: false, isLoading: false })
            }
          })

        } catch (err) {
          console.error('Auth initialization error:', err)
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const user = await authService.login(credentials)
          set({ user, isAuthenticated: true, isLoading: false })
          return user.profile.role
        } catch (err: any) {
          const message = err.message || 'Error al iniciar sesión. Intenta de nuevo.'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true, error: null })
        try {
          await authService.signInWithGoogle()
          // Note: Redirect happens, so state update isn't strictly needed here 
          // but we set loading just in case.
        } catch (err: any) {
          set({ error: err.message, isLoading: false })
          throw err
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await authService.logout()
          set({ user: null, isAuthenticated: false, isLoading: false, error: null })
        } catch (err) {
          set({ isLoading: false })
        }
      },

      registerTourist: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const user = await authService.registerTourist(data)
          set({ user, isAuthenticated: true, isLoading: false })
        } catch (err: any) {
          set({ error: err.message, isLoading: false })
          throw err
        }
      },

      registerChurre: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const user = await authService.registerChurre(data)
          set({ user, isAuthenticated: true, isLoading: false })
        } catch (err: any) {
          set({ error: err.message, isLoading: false })
          throw err
        }
      },

      resetPassword: async (email) => {
        set({ isLoading: true, error: null })
        try {
          await authService.resetPassword(email)
          set({ isLoading: false })
        } catch (err: any) {
          set({ error: err.message, isLoading: false })
          throw err
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'burrito-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)
