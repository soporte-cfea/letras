import { ref, onMounted } from 'vue'

/**
 * Detecta una nueva versión del Service Worker (vite-plugin-pwa)
 * y permite al usuario recargar cuando quiera.
 */
export function usePwaUpdate() {
  const needRefresh = ref(false)
  const offlineReady = ref(false)
  const updating = ref(false)

  let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null

  onMounted(async () => {
    try {
      const { registerSW } = await import('virtual:pwa-register')
      updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          needRefresh.value = true
        },
        onOfflineReady() {
          offlineReady.value = true
        }
      })
    } catch (err) {
      // En dev sin SW o si el módulo virtual no está disponible
      console.warn('PWA register no disponible:', err)
    }
  })

  async function applyUpdate() {
    if (!updateSW) {
      window.location.reload()
      return
    }
    updating.value = true
    try {
      await updateSW(true)
    } catch (err) {
      console.error('Error al actualizar PWA:', err)
      window.location.reload()
    } finally {
      updating.value = false
    }
  }

  function dismiss() {
    needRefresh.value = false
  }

  return {
    needRefresh,
    offlineReady,
    updating,
    applyUpdate,
    dismiss
  }
}
