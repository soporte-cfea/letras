/**
 * Composable para verificar actualizaciones disponibles
 * Verifica cuando el usuario vuelve a la pestaña (visibilitychange)
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { SongsService } from '@/api/songs'
import { CollectionsService } from '@/api/collections'
import {
  lastSongsUpdateStorage,
  lastCollectionsUpdateStorage,
  updateNotificationDismissedStorage,
} from '@/utils/persistence'

// Funciones utilitarias que pueden ser usadas desde stores
export function saveSongsUpdateTimestamp(timestamp: string | null) {
  if (timestamp) {
    lastSongsUpdateStorage.set(timestamp)
  }
}

export function saveCollectionsUpdateTimestamp(timestamp: string | null) {
  if (timestamp) {
    lastCollectionsUpdateStorage.set(timestamp)
  }
}

export function useUpdateChecker() {
  const hasSongsUpdates = ref(false)
  const hasCollectionsUpdates = ref(false)
  const checking = ref(false)
  const lastCheck = ref<Date | null>(null)
  const notificationDismissed = ref(false)

  // Cargar estado de notificación descartada
  const loadDismissedState = () => {
    const dismissed = updateNotificationDismissedStorage.get()
    if (dismissed) {
      const dismissedTime = new Date(dismissed)
      const now = new Date()
      // Si se descartó hace más de 1 hora, permitir mostrar de nuevo
      const oneHour = 60 * 60 * 1000
      if (now.getTime() - dismissedTime.getTime() > oneHour) {
        notificationDismissed.value = false
        updateNotificationDismissedStorage.remove()
      } else {
        notificationDismissed.value = true
      }
    }
  }

  // Guardar timestamp de última actualización de canciones (actualiza estado reactivo)
  function saveSongsUpdateTimestampInternal(timestamp: string | null) {
    if (timestamp) {
      lastSongsUpdateStorage.set(timestamp)
      hasSongsUpdates.value = false
    }
  }

  // Guardar timestamp de última actualización de colecciones (actualiza estado reactivo)
  function saveCollectionsUpdateTimestampInternal(timestamp: string | null) {
    if (timestamp) {
      lastCollectionsUpdateStorage.set(timestamp)
      hasCollectionsUpdates.value = false
    }
  }

  // Obtener timestamp guardado de canciones
  function getLastSongsUpdate(): string | null {
    return lastSongsUpdateStorage.get()
  }

  // Obtener timestamp guardado de colecciones
  function getLastCollectionsUpdate(): string | null {
    return lastCollectionsUpdateStorage.get()
  }

  // Verificar actualizaciones
  async function checkForUpdates() {
    if (checking.value) return
    if (notificationDismissed.value) return

    checking.value = true
    lastCheck.value = new Date()

    try {
      // Verificar canciones
      const lastSongsUpdate = getLastSongsUpdate()
      const songsHasUpdates = await SongsService.checkForUpdates(lastSongsUpdate)
      hasSongsUpdates.value = songsHasUpdates

      // Verificar colecciones
      const lastCollectionsUpdate = getLastCollectionsUpdate()
      const collectionsHasUpdates = await CollectionsService.checkForUpdates(lastCollectionsUpdate)
      hasCollectionsUpdates.value = collectionsHasUpdates
    } catch (error) {
      console.error('Error checking for updates:', error)
    } finally {
      checking.value = false
    }
  }

  // Descartar notificación temporalmente
  function dismissNotification() {
    notificationDismissed.value = true
    updateNotificationDismissedStorage.set(new Date().toISOString())
  }

  // Limpiar estado de descarte (cuando se actualiza)
  function clearDismissedState() {
    notificationDismissed.value = false
    updateNotificationDismissedStorage.remove()
  }

  // Verificar si hay actualizaciones disponibles
  const hasUpdates = () => {
    return hasSongsUpdates.value || hasCollectionsUpdates.value
  }

  // Manejar cambio de visibilidad de la pestaña
  function handleVisibilityChange() {
    if (document.hidden) return // Si la pestaña está oculta, no hacer nada
    
    // Verificar actualizaciones cuando el usuario vuelve a la pestaña
    // Solo si no se verificó hace menos de 30 segundos
    if (lastCheck.value) {
      const timeSinceLastCheck = new Date().getTime() - lastCheck.value.getTime()
      const thirtySeconds = 30 * 1000
      if (timeSinceLastCheck < thirtySeconds) {
        return // Evitar verificaciones muy frecuentes
      }
    }

    checkForUpdates()
  }

  onMounted(() => {
    loadDismissedState()
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return {
    hasSongsUpdates,
    hasCollectionsUpdates,
    hasUpdates,
    checking,
    lastCheck,
    notificationDismissed,
    checkForUpdates,
    dismissNotification,
    clearDismissedState,
    saveSongsUpdateTimestamp: saveSongsUpdateTimestampInternal,
    saveCollectionsUpdateTimestamp: saveCollectionsUpdateTimestampInternal
  }
}

