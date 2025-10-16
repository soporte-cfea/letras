import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/authSupabase'
import supabase from '@/supabase/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.user_metadata?.role === 'admin')
  const userEmail = computed(() => user.value?.email || '')
  const userName = computed(() => user.value?.user_metadata?.name || '')
  const userId = computed(() => user.value?.id || '')
  const userRole = computed(() => user.value?.user_metadata?.role || 'user')
  const userPermissions = computed(() => user.value?.user_metadata?.permissions || [])

  // Composable de autenticación
  const auth = useAuth()

  // Acciones
  const initializeAuth = async () => {
    if (isInitialized.value) return
    
    try {
      loading.value = true
      await auth.initAuth()
      
      // Sincronizar estado
      user.value = auth.user.value
      session.value = auth.session.value
      isInitialized.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al inicializar autenticación'
    } finally {
      loading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = null
      
      const result = await auth.signIn(email, password)
      
      if (result.error) {
        error.value = result.error
        return { success: false, error: result.error }
      }

      // Actualizar estado local
      user.value = auth.user.value
      session.value = auth.session.value
      
      return { success: true, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en el login'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  const register = async (email: string, password: string, metadata?: any) => {
    try {
      loading.value = true
      error.value = null
      
      const result = await auth.signUp(email, password, metadata)
      
      if (result.error) {
        error.value = result.error
        return { success: false, error: result.error }
      }

      return { success: true, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en el registro'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      loading.value = true
      error.value = null
      
      const result = await auth.signOut()
      
      if (result.error) {
        error.value = result.error
        return { success: false, error: result.error }
      }

      // Limpiar estado local
      user.value = null
      session.value = null
      
      return { success: true, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cerrar sesión'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (email: string) => {
    try {
      loading.value = true
      error.value = null
      
      const result = await auth.resetPassword(email)
      
      if (result.error) {
        error.value = result.error
        return { success: false, error: result.error }
      }

      return { success: true, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al resetear contraseña'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const updateUser = (newUser: User | null) => {
    user.value = newUser
  }

  const updateSession = (newSession: Session | null) => {
    session.value = newSession
  }

  // Actualizar perfil del usuario
  const updateUserProfile = async (profileData: { name?: string }) => {
    try {
      loading.value = true
      error.value = null
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name: profileData.name
        }
      })

      if (updateError) {
        throw updateError
      }

      // Actualizar estado local
      if (user.value) {
        user.value.user_metadata = {
          ...user.value.user_metadata,
          name: profileData.name
        }
      }

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el perfil'
      error.value = errorMessage
      return { error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  // Refrescar sesión del usuario actual
  const refreshUserSession = async () => {
    try {
      loading.value = true
      error.value = null
      
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        throw refreshError
      }

      if (newSession) {
        session.value = newSession
        user.value = newSession.user
      }

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al refrescar la sesión'
      error.value = errorMessage
      return { error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  return {
    // Estado
    user: computed(() => user.value),
    session: computed(() => session.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    isInitialized: computed(() => isInitialized.value),
    
    // Getters
    isAuthenticated,
    isAdmin,
    userEmail,
    userName,
    userId,
    userRole,
    userPermissions,
    
    // Acciones
    initializeAuth,
    login,
    register,
    logout,
    resetPassword,
    clearError,
    updateUser,
    updateSession,
    updateUserProfile,
    refreshUserSession
  }
})
