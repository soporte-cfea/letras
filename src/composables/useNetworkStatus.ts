import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable para manejar el estado de conexión a internet
 */
export function useNetworkStatus() {
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const wasOffline = ref(false)

  function updateOnlineStatus() {
    const online = navigator.onLine
    const previousStatus = isOnline.value
    
    isOnline.value = online
    
    // Si estaba offline y ahora está online, marcar que hubo un cambio
    if (!previousStatus && online) {
      wasOffline.value = true
    }
  }

  function handleOnline() {
    updateOnlineStatus()
  }

  function handleOffline() {
    updateOnlineStatus()
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      // Verificar estado inicial
      updateOnlineStatus()
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  })

  return {
    isOnline,
    wasOffline,
    // Función para resetear el flag de "estaba offline"
    resetWasOffline: () => {
      wasOffline.value = false
    }
  }
}

