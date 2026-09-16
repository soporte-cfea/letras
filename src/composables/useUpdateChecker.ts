/**
 * Composable para verificar actualizaciones de canciones/colecciones.
 * Estado compartido a nivel de módulo para que el banner y App.vue vean lo mismo.
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { SongsService } from '@/api/songs'
import { CollectionsService } from '@/api/collections'
import {
  lastSongsUpdateStorage,
  lastCollectionsUpdateStorage,
  updateNotificationDismissedStorage,
} from '@/utils/persistence'

const hasSongsUpdates = ref(false)
const hasCollectionsUpdates = ref(false)
const checking = ref(false)
const lastCheck = ref<Date | null>(null)
const notificationDismissed = ref(false)

let visibilityListenerAttached = false
let subscriberCount = 0

export function saveSongsUpdateTimestamp(timestamp: string | null) {
  if (timestamp) {
    lastSongsUpdateStorage.set(timestamp)
    hasSongsUpdates.value = false
  }
}

export function saveCollectionsUpdateTimestamp(timestamp: string | null) {
  if (timestamp) {
    lastCollectionsUpdateStorage.set(timestamp)
    hasCollectionsUpdates.value = false
  }
}

function loadDismissedState() {
  const dismissed = updateNotificationDismissedStorage.get()
  if (!dismissed) {
    notificationDismissed.value = false
    return
  }
  const dismissedTime = new Date(dismissed)
  const oneHour = 60 * 60 * 1000
  if (Date.now() - dismissedTime.getTime() > oneHour) {
    notificationDismissed.value = false
    updateNotificationDismissedStorage.remove()
  } else {
    notificationDismissed.value = true
  }
}

async function checkForUpdates() {
  if (checking.value) return
  if (notificationDismissed.value) return
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  checking.value = true
  lastCheck.value = new Date()

  try {
    const lastSongsUpdate = lastSongsUpdateStorage.get()
    // Sin baseline: no avisar (la carga inicial la hacen los stores)
    hasSongsUpdates.value = lastSongsUpdate
      ? await SongsService.checkForUpdates(lastSongsUpdate)
      : false

    const lastCollectionsUpdate = lastCollectionsUpdateStorage.get()
    hasCollectionsUpdates.value = lastCollectionsUpdate
      ? await CollectionsService.checkForUpdates(lastCollectionsUpdate)
      : false
  } catch (error) {
    console.error('Error checking for updates:', error)
  } finally {
    checking.value = false
  }
}

function dismissNotification() {
  notificationDismissed.value = true
  updateNotificationDismissedStorage.set(new Date().toISOString())
}

function clearDismissedState() {
  notificationDismissed.value = false
  updateNotificationDismissedStorage.remove()
}

function hasUpdates() {
  return hasSongsUpdates.value || hasCollectionsUpdates.value
}

function handleVisibilityChange() {
  if (document.hidden) return

  if (lastCheck.value) {
    const timeSinceLastCheck = Date.now() - lastCheck.value.getTime()
    if (timeSinceLastCheck < 30_000) return
  }

  void checkForUpdates()
}

export function useUpdateChecker() {
  onMounted(() => {
    loadDismissedState()
    subscriberCount += 1
    if (!visibilityListenerAttached) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      visibilityListenerAttached = true
      // Primera verificación al montar (p. ej. al abrir la app)
      void checkForUpdates()
    }
  })

  onUnmounted(() => {
    subscriberCount = Math.max(0, subscriberCount - 1)
    if (subscriberCount === 0 && visibilityListenerAttached) {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      visibilityListenerAttached = false
    }
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
    saveSongsUpdateTimestamp,
    saveCollectionsUpdateTimestamp
  }
}
