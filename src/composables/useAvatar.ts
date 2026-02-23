import { computed } from 'vue'
import type { User } from '@supabase/supabase-js'

/**
 * Genera la URL del avatar de DiceBear basándose en el estilo y configuración del usuario
 */
export const getAvatarUrl = (
  style: string | null | undefined,
  config: Record<string, any> | null | undefined,
  seed: string
): string | null => {
  if (!style) return null

  const baseUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`
  const params = new URLSearchParams()

  // Filtrar configuración según el estilo (solo opciones válidas)
  const filteredConfig = filterConfigForStyle(style, config || {})

  // Background color - siempre agregar, por defecto transparent
  if (filteredConfig.backgroundColor) {
    const bgColor = filteredConfig.backgroundColor.replace('#', '')
    if (bgColor && /^[0-9a-fA-F]{6}$/.test(bgColor)) {
      params.append('backgroundColor', bgColor)
    } else {
      params.append('backgroundColor', 'transparent')
    }
  } else {
    params.append('backgroundColor', 'transparent')
  }

  // Skin color - solo si está en la config filtrada
  if (filteredConfig.skinColor) {
    const skinColor = filteredConfig.skinColor.replace('#', '')
    if (skinColor && /^[0-9a-fA-F]{6}$/.test(skinColor)) {
      params.append('skinColor', skinColor)
    }
  }

  // Hair color - solo si está en la config filtrada
  if (filteredConfig.hairColor) {
    const hairColor = filteredConfig.hairColor.replace('#', '')
    if (hairColor && /^[0-9a-fA-F]{6}$/.test(hairColor)) {
      params.append('hairColor', hairColor)
    }
  }

  // Clothing color - solo si está en la config filtrada
  if (filteredConfig.clothingColor) {
    const clothingColor = filteredConfig.clothingColor.replace('#', '')
    if (clothingColor && /^[0-9a-fA-F]{6}$/.test(clothingColor)) {
      params.append('clothingColor', clothingColor)
    }
  }

  return `${baseUrl}&${params.toString()}`
}

/**
 * Filtra la configuración del avatar para solo incluir opciones válidas para el estilo
 */
const filterConfigForStyle = (style: string, config: Record<string, any>): Record<string, any> => {
  const filtered: Record<string, any> = {}
  
  // Mapeo conservador de opciones válidas por estilo
  // Solo opciones de color para evitar errores
  const validOptions: Record<string, string[]> = {
    avataaars: ['backgroundColor', 'skinColor', 'hairColor', 'clothingColor'],
    personas: ['backgroundColor', 'skinColor', 'hairColor', 'clothingColor'],
    adventurer: ['backgroundColor', 'skinColor', 'hairColor', 'clothingColor'],
    lorelei: ['backgroundColor', 'hairColor', 'clothingColor'],
    bottts: ['backgroundColor'],
    'pixel-art': ['backgroundColor', 'skinColor', 'hairColor', 'clothingColor'],
    'pixel-art-neutral': ['backgroundColor', 'skinColor', 'hairColor', 'clothingColor']
  }
  
  const allowedKeys = validOptions[style] || []
  
  // Solo incluir opciones válidas para este estilo
  allowedKeys.forEach(key => {
    const value = config[key]
    // Validar que el valor existe y es válido
    if (value !== undefined && value !== null && value !== '') {
      // Para colores, validar formato
      if (['backgroundColor', 'skinColor', 'hairColor', 'clothingColor'].includes(key)) {
        if (typeof value === 'string' && (value.startsWith('#') || /^[0-9a-fA-F]{6}$/.test(value))) {
          filtered[key] = value
        }
      } else {
        // Para otros parámetros, solo strings no vacíos
        if (typeof value === 'string' && value.trim() !== '') {
          filtered[key] = value
        }
      }
    }
  })
  
  return filtered
}

/**
 * Obtiene el avatar de un usuario (puede ser el usuario autenticado o cualquier usuario)
 */
export const getUserAvatar = (
  user: User | { 
    user_metadata?: { 
      avatar_style?: string
      avatar_config?: Record<string, any>
      name?: string
    }
    email?: string
    id?: string
  } | null | undefined
): string | null => {
  if (!user) return null

  const avatarStyle = user.user_metadata?.avatar_style
  const avatarConfig = user.user_metadata?.avatar_config
  const seed = user.user_metadata?.name || (user as any).email || (user as any).id || 'default'

  return getAvatarUrl(avatarStyle, avatarConfig, seed)
}

/**
 * Obtiene las iniciales del usuario como fallback
 */
export const getUserInitials = (user: { name?: string; email?: string } | null | undefined): string => {
  if (!user) return '?'
  
  if (user.name) {
    return user.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  
  if (user.email) {
    return user.email.charAt(0).toUpperCase()
  }
  
  return '?'
}

