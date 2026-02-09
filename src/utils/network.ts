/**
 * Utilidades para detectar y manejar errores de red
 */

/**
 * Verifica si un error es un error de red (sin conexión, timeout, etc.)
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false

  // Error de fetch (sin conexión)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }

  // Error de red en el objeto error
  if (error.name === 'NetworkError' || error.name === 'TypeError') {
    return true
  }

  // Error de timeout
  if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
    return true
  }

  // Error de conexión rechazada
  if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
    return true
  }

  // Verificar si navigator.onLine está disponible y es false
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true
  }

  return false
}

/**
 * Verifica si hay conexión a internet
 * Más confiable que solo usar navigator.onLine
 */
export async function checkNetworkConnection(): Promise<boolean> {
  // Primero verificar navigator.onLine (rápido)
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false
  }

  // Intentar hacer un fetch pequeño para verificar realmente la conexión
  try {
    // Usar un endpoint pequeño o un favicon para verificar conexión
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 segundos timeout

    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache'
    })

    clearTimeout(timeoutId)
    return true
  } catch (error) {
    // Si falla, probablemente no hay conexión
    return false
  }
}

