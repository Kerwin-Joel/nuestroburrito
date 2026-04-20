import { supabase } from '../lib/supabase'
import {
  AuthUser,
  LoginCredentials,
  RegisterTouristData,
  RegisterChurreData,
  Profile
} from '../types/auth'

export const authService = {

  login: async ({ email, password }: LoginCredentials): Promise<AuthUser> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    if (!data.user) throw new Error('No se pudo obtener el usuario')

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) throw profileError

    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email!,
      profile: profile as Profile
    }

    return authUser
  },

  onAuthStateChange: (callback: Function) => {
    return supabase.auth.onAuthStateChange(
      (event, session) => callback(event, session)
    )
  },

  signInWithGoogle: async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  },

  registerTourist: async (data: RegisterTouristData): Promise<AuthUser> => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
          role: 'tourist'
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Error al crear usuario')

    // Profile creation is usually handled by a Supabase trigger, 
    // but we'll fetch it here to confirm
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) throw profileError

    return {
      id: authData.user.id,
      email: authData.user.email!,
      profile: profile as Profile
    }
  },

  registerChurre: async (data: RegisterChurreData): Promise<AuthUser> => {
    // 1. Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
          role: 'churre'
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Error al crear usuario')

    // 2. Upload avatar if exists
    let avatarUrl = null
    if (data.avatarFile) {
      const fileExt = data.avatarFile.name.split('.').pop()
      const fileName = `${authData.user.id}-${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, data.avatarFile)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)
        avatarUrl = publicUrl
      }
    }

    // 3. Update profile with churre specific info
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        university: data.university,
        bio: data.bio,
        zones: data.zones,
        specialties: data.specialties,
        avatarUrl,
        status: 'pending'
      })
      .eq('id', authData.user.id)

    if (updateError) throw updateError

    // 4. Fetch updated profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) throw profileError

    return {
      id: authData.user.id,
      email: authData.user.email!,
      profile: profile as Profile
    }
  },

  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    if (error) throw error
  },

  getSession: async (): Promise<AuthUser | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!profile) return null

    return {
      id: session.user.id,
      email: session.user.email!,
      profile: profile as Profile
    }
  },

  resetPassword: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },
}
