import { ref, computed } from 'vue'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import supabase from '@/supabase/supabase'

// Estado reactivo
const user = ref<User | null>(null)
const session = ref<Session | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

export const useAuth = () => {
  // Computed properties
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.user_metadata?.role === 'admin')

  // Inicializar sesión
  const initAuth = async () => {
    try {
      loading.value = true
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user
      }

      // Escuchar cambios de autenticación
      supabase.auth.onAuthStateChange((_event, newSession) => {
        session.value = newSession
        user.value = newSession?.user ?? null
        loading.value = false
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error de autenticación'
    } finally {
      loading.value = false
    }
  }

  // Sign Up
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: undefined // No enviar email de confirmación
        }
      })

      if (authError) throw authError
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en el registro'
      error.value = errorMessage
      return { data: null, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  // Sign In
  const signIn = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en el login'
      error.value = errorMessage
      return { data: null, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  // Sign Out
  const signOut = async () => {
    try {
      loading.value = true
      error.value = null
      
      const { error: authError } = await supabase.auth.signOut()
      if (authError) throw authError
      
      user.value = null
      session.value = null
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cerrar sesión'
      error.value = errorMessage
      return { error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  // Reset Password
  const resetPassword = async (email: string) => {
    try {
      loading.value = true
      error.value = null
      
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email)
      if (authError) throw authError
      
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al resetear contraseña'
      error.value = errorMessage
      return { error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  // Limpiar errores
  const clearError = () => {
    error.value = null
  }

  return {
    // Estado
    user: computed(() => user.value),
    session: computed(() => session.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    isAuthenticated,
    isAdmin,
    
    // Métodos
    initAuth,
    signUp,
    signIn,
    signOut,
    resetPassword,
    clearError
  }
}

export default supabase
