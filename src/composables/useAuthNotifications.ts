import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

export const useAuthNotifications = () => {
  const authStore = useAuthStore()
  
  // Estado de notificaciones
  const notifications = ref<Array<{
    id: string
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
    duration?: number
  }>>([])

  // Métodos para mostrar notificaciones
  const showSuccess = (message: string, duration = 3000) => {
    const id = Date.now().toString()
    notifications.value.push({
      id,
      type: 'success',
      message,
      duration
    })
    
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration)
    }
  }

  const showError = (message: string, duration = 5000) => {
    const id = Date.now().toString()
    notifications.value.push({
      id,
      type: 'error',
      message,
      duration
    })
    
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration)
    }
  }

  const showInfo = (message: string, duration = 3000) => {
    const id = Date.now().toString()
    notifications.value.push({
      id,
      type: 'info',
      message,
      duration
    })
    
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration)
    }
  }

  const showWarning = (message: string, duration = 4000) => {
    const id = Date.now().toString()
    notifications.value.push({
      id,
      type: 'warning',
      message,
      duration
    })
    
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration)
    }
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAllNotifications = () => {
    notifications.value = []
  }

  // Métodos específicos para autenticación
  const handleLoginSuccess = () => {
    showSuccess('¡Bienvenido! Has iniciado sesión correctamente.')
  }

  const handleLoginError = (error: string) => {
    showError(`Error al iniciar sesión: ${error}`)
  }

  const handleRegisterSuccess = () => {
    showSuccess('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.')
  }

  const handleRegisterError = (error: string) => {
    showError(`Error en el registro: ${error}`)
  }

  const handleLogoutSuccess = () => {
    showInfo('Has cerrado sesión correctamente.')
  }

  const handleLogoutError = (error: string) => {
    showError(`Error al cerrar sesión: ${error}`)
  }

  const handlePasswordResetSuccess = () => {
    showSuccess('Se ha enviado un enlace de recuperación a tu email.')
  }

  const handlePasswordResetError = (error: string) => {
    showError(`Error al enviar el email de recuperación: ${error}`)
  }

  // Métodos para manejar errores del store
  const handleAuthError = () => {
    if (authStore.error) {
      showError(authStore.error)
      authStore.clearError()
    }
  }

  return {
    // Estado
    notifications: computed(() => notifications.value),
    
    // Métodos generales
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeNotification,
    clearAllNotifications,
    
    // Métodos específicos de auth
    handleLoginSuccess,
    handleLoginError,
    handleRegisterSuccess,
    handleRegisterError,
    handleLogoutSuccess,
    handleLogoutError,
    handlePasswordResetSuccess,
    handlePasswordResetError,
    handleAuthError
  }
}
