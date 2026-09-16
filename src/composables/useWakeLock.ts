import { ref, onUnmounted } from 'vue'

type WakeLockSentinelLike = {
  released: boolean
  release: () => Promise<void>
  addEventListener: (type: 'release', listener: () => void) => void
}

/**
 * Mantiene la pantalla encendida (Screen Wake Lock API) mientras esté activo.
 * Se re-adquiere al volver a la pestaña si el modo ensayo sigue activo.
 */
export function useWakeLock() {
  const isSupported = ref(
    typeof navigator !== 'undefined' && 'wakeLock' in navigator
  )
  const isActive = ref(false)
  const wantActive = ref(false)

  let sentinel: WakeLockSentinelLike | null = null

  async function request(): Promise<boolean> {
    wantActive.value = true
    if (!isSupported.value || typeof document === 'undefined') return false
    if (document.visibilityState !== 'visible') return false

    try {
      const nav = navigator as Navigator & {
        wakeLock: { request: (type: 'screen') => Promise<WakeLockSentinelLike> }
      }
      const lock = await nav.wakeLock.request('screen')
      sentinel = lock
      isActive.value = true
      lock.addEventListener('release', () => {
        isActive.value = false
        sentinel = null
      })
      return true
    } catch (err) {
      // NotAllowedError, etc. — falla en silencio (batería baja, política, etc.)
      console.warn('Wake Lock no disponible:', err)
      isActive.value = false
      sentinel = null
      return false
    }
  }

  async function release(): Promise<void> {
    wantActive.value = false
    if (!sentinel) {
      isActive.value = false
      return
    }
    try {
      await sentinel.release()
    } catch {
      // ignore
    } finally {
      sentinel = null
      isActive.value = false
    }
  }

  /** Activa o libera según `active`. */
  async function setEnabled(active: boolean): Promise<void> {
    if (active) await request()
    else await release()
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && wantActive.value && !isActive.value) {
      void request()
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    void release()
  })

  return {
    isSupported,
    isActive,
    request,
    release,
    setEnabled
  }
}
