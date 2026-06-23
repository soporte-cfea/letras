import { ref } from 'vue'

async function fallbackCopyTextToClipboard(text: string): Promise<void> {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    const successful = document.execCommand('copy')
    if (!successful) {
      throw new Error('Fallback: No se pudo copiar el texto')
    }
  } finally {
    document.body.removeChild(textArea)
  }
}

export function useCopyToClipboard(resetMs = 2000) {
  const copyState = ref<'idle' | 'copied'>('idle')
  let resetTimeout: ReturnType<typeof setTimeout> | null = null

  async function copyText(text: string): Promise<boolean> {
    if (!text.trim()) return false

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        await fallbackCopyTextToClipboard(text)
      }

      copyState.value = 'copied'

      if (resetTimeout) clearTimeout(resetTimeout)
      resetTimeout = setTimeout(() => {
        copyState.value = 'idle'
      }, resetMs)

      return true
    } catch {
      return false
    }
  }

  return { copyState, copyText }
}
