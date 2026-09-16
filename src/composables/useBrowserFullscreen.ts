import { ref, onUnmounted } from 'vue'

/**
 * Fullscreen nativo del navegador (Fullscreen API).
 * Complementa el modo CSS `content-fullscreen` de la app.
 */
export function useBrowserFullscreen() {
  const isSupported = ref(
    typeof document !== 'undefined' &&
      (!!document.documentElement.requestFullscreen ||
        !!(document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void })
          .webkitRequestFullscreen)
  )
  const isFullscreen = ref(false)

  let syncingFromApi = false

  type DocWithWebkit = Document & {
    webkitFullscreenElement?: Element | null
    webkitExitFullscreen?: () => void
  }

  type ElWithWebkit = HTMLElement & {
    webkitRequestFullscreen?: () => void
  }

  function readFullscreenElement(): Element | null {
    if (typeof document === 'undefined') return null
    const doc = document as DocWithWebkit
    return document.fullscreenElement || doc.webkitFullscreenElement || null
  }

  function syncState() {
    isFullscreen.value = !!readFullscreenElement()
  }

  async function enter(element?: HTMLElement | null): Promise<boolean> {
    if (typeof document === 'undefined') return false
    const el = (element ?? document.documentElement) as ElWithWebkit
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen()
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen()
      } else {
        return false
      }
      isFullscreen.value = true
      return true
    } catch (err) {
      console.warn('Fullscreen no disponible:', err)
      return false
    }
  }

  async function exit(): Promise<void> {
    if (typeof document === 'undefined') return
    if (!readFullscreenElement()) {
      isFullscreen.value = false
      return
    }
    const doc = document as DocWithWebkit
    try {
      syncingFromApi = true
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen()
      }
    } catch {
      // ignore
    } finally {
      isFullscreen.value = false
      setTimeout(() => {
        syncingFromApi = false
      }, 0)
    }
  }

  async function setFullscreen(active: boolean, element?: HTMLElement | null): Promise<void> {
    if (active) await enter(element)
    else await exit()
  }

  function handleFullscreenChange() {
    const was = isFullscreen.value
    syncState()
    if (was && !isFullscreen.value && !syncingFromApi) {
      onExternalExit?.()
    }
  }

  let onExternalExit: (() => void) | null = null

  /** Se llama cuando el usuario sale del fullscreen nativo (Esc / gesto), no vía `exit()`. */
  function onExit(cb: () => void) {
    onExternalExit = cb
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  }

  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
    onExternalExit = null
    void exit()
  })

  return {
    isSupported,
    isFullscreen,
    enter,
    exit,
    setFullscreen,
    onExit
  }
}
