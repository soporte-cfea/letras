/**
 * Utilidades para manejar tonalidades musicales
 */

// Prefijo para identificar etiquetas de tonalidad
export const KEY_TAG_PREFIX = 'key:'

// Lista de todas las tonalidades válidas
export const VALID_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm'
]

/**
 * Extrae la tonalidad de un array de etiquetas
 * @param tags Array de etiquetas
 * @returns La tonalidad encontrada o null
 */
export function extractKeyFromTags(tags: string[]): string | null {
  if (!tags || tags.length === 0) return null
  
  // Buscar etiqueta con prefijo "key:"
  const keyTag = tags.find(tag => tag.startsWith(KEY_TAG_PREFIX))
  if (keyTag) {
    const key = keyTag.substring(KEY_TAG_PREFIX.length)
    if (VALID_KEYS.includes(key)) {
      return key
    }
  }
  
  return null
}

/**
 * Crea una etiqueta de tonalidad
 * @param key La tonalidad (ej: "C", "Am", "F#")
 * @returns La etiqueta formateada (ej: "key:C")
 */
export function createKeyTag(key: string | null): string | null {
  if (!key || !VALID_KEYS.includes(key)) return null
  return `${KEY_TAG_PREFIX}${key}`
}

/**
 * Remueve la etiqueta de tonalidad de un array de etiquetas
 * @param tags Array de etiquetas
 * @returns Array sin la etiqueta de tonalidad
 */
export function removeKeyTagFromTags(tags: string[]): string[] {
  if (!tags || tags.length === 0) return tags
  return tags.filter(tag => !tag.startsWith(KEY_TAG_PREFIX))
}

/**
 * Agrega o actualiza la tonalidad en un array de etiquetas
 * @param tags Array de etiquetas existentes
 * @param key La tonalidad a agregar/actualizar
 * @returns Array de etiquetas con la tonalidad actualizada
 */
export function setKeyInTags(tags: string[], key: string | null): string[] {
  // Remover cualquier tonalidad existente
  const tagsWithoutKey = removeKeyTagFromTags(tags)
  
  // Si hay una nueva tonalidad, agregarla
  if (key) {
    const keyTag = createKeyTag(key)
    if (keyTag) {
      return [...tagsWithoutKey, keyTag]
    }
  }
  
  return tagsWithoutKey
}

/**
 * Formatea una tonalidad para mostrar (ej: "C" -> "Do (C)")
 */
export function formatKeyForDisplay(key: string): string {
  const keyMap: Record<string, string> = {
    'C': 'Do (C)',
    'C#': 'Do# (C#)',
    'Db': 'Re♭ (Db)',
    'D': 'Re (D)',
    'D#': 'Re# (D#)',
    'Eb': 'Mi♭ (Eb)',
    'E': 'Mi (E)',
    'F': 'Fa (F)',
    'F#': 'Fa# (F#)',
    'Gb': 'Sol♭ (Gb)',
    'G': 'Sol (G)',
    'G#': 'Sol# (G#)',
    'Ab': 'La♭ (Ab)',
    'A': 'La (A)',
    'A#': 'La# (A#)',
    'Bb': 'Si♭ (Bb)',
    'B': 'Si (B)',
    'Cm': 'Do menor (Cm)',
    'C#m': 'Do# menor (C#m)',
    'Dbm': 'Re♭ menor (Dbm)',
    'Dm': 'Re menor (Dm)',
    'D#m': 'Re# menor (D#m)',
    'Ebm': 'Mi♭ menor (Ebm)',
    'Em': 'Mi menor (Em)',
    'Fm': 'Fa menor (Fm)',
    'F#m': 'Fa# menor (F#m)',
    'Gbm': 'Sol♭ menor (Gbm)',
    'Gm': 'Sol menor (Gm)',
    'G#m': 'Sol# menor (G#m)',
    'Abm': 'La♭ menor (Abm)',
    'Am': 'La menor (Am)',
    'A#m': 'La# menor (A#m)',
    'Bbm': 'Si♭ menor (Bbm)',
    'Bm': 'Si menor (Bm)'
  }
  
  return keyMap[key] || key
}

