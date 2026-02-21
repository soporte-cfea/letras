<template>
  <section class="perfil-view">
    <div class="view-header">
      <BackButton />
      <h1 class="view-title">Mi Perfil</h1>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Cargando...</p>
    </div>

    <div v-else class="perfil-content">
      <!-- Header del perfil -->
      <div class="perfil-header">
        <div class="avatar-container">
          <div class="avatar-wrapper" @click="showAvatarStyles = !showAvatarStyles">
            <div class="avatar" :class="{ 'has-avatar': avatarUrl }">
              <img v-if="avatarUrl" :src="avatarUrl" :alt="userName || userEmail" class="avatar-image" />
              <span v-else class="avatar-text">{{ userInitials }}</span>
            </div>
            <div class="avatar-edit-overlay">
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>Cambiar</span>
            </div>
          </div>
        </div>
        <div class="user-info">
          <h2 class="user-name">{{ userName || userEmail }}</h2>
          <p v-if="userName" class="user-email">{{ userEmail }}</p>
        </div>
      </div>

      <!-- Editar Avatar (solo visible cuando se hace clic en el avatar) -->
      <div v-if="showAvatarStyles" class="section">
        <h3 class="section-title">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
            <path d="M12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"></path>
          </svg>
          Elegir Estilo de Avatar
        </h3>
        
        <div class="avatar-editor">
          <p class="avatar-description">Selecciona un estilo para tu avatar</p>
          <div class="avatar-styles-grid">
            <button
              v-for="style in avatarStyles"
              :key="style.id"
              @click="selectAvatarStyle(style.id)"
              :class="['avatar-style-option', { active: currentAvatarStyle === style.id }]"
              :disabled="updatingAvatar"
            >
              <img :src="getAvatarUrl(style.id, {})" :alt="style.name" class="avatar-preview" />
              <span class="avatar-style-name">{{ style.name }}</span>
              <svg v-if="currentAvatarStyle === style.id" class="check-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </button>
          </div>

          <!-- Botón de personalización (solo aparece si el avatar seleccionado se puede personalizar) -->
          <div v-if="currentAvatarStyle && hasCustomizationOptions(currentAvatarStyle)" class="personalize-prompt">
            <button 
              @click="showAvatarCustomization = !showAvatarCustomization"
              class="personalize-button"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="13.5" cy="6.5" r=".5"></circle>
                <circle cx="17.5" cy="10.5" r=".5"></circle>
                <circle cx="8.5" cy="7.5" r=".5"></circle>
                <circle cx="6.5" cy="12.5" r=".5"></circle>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.688-.464-1.125-.464-.437 0-.835.175-1.125.464-.258.29-.437.688-.437 1.125 0 .942.722 1.688 1.648 1.688 4.14 0 7.5-3.36 7.5-7.5C19.5 6.36 16.14 2 12 2z"></path>
              </svg>
              {{ showAvatarCustomization ? 'Ocultar personalización' : 'Personalizar colores' }}
            </button>
          </div>
        </div>

        <!-- Panel de Personalización (solo visible cuando showAvatarCustomization es true) -->
        <div v-if="showAvatarCustomization && currentAvatarStyle && hasCustomizationOptions(currentAvatarStyle)" class="avatar-customization">
            <div class="customization-layout">
              <!-- Preview siempre visible -->
              <div class="customization-preview">
                <div class="avatar-preview-large">
                  <img :src="getCustomizedAvatarUrl()" :alt="currentAvatarStyle" class="preview-image" />
                </div>
                <div class="preview-actions">
                  <button 
                    @click="saveAvatarCustomization"
                    :disabled="updatingAvatar"
                    class="save-button"
                  >
                    <span v-if="updatingAvatar">Guardando...</span>
                    <span v-else>Guardar</span>
                  </button>
                  <button 
                    @click="resetAvatarCustomization"
                    :disabled="updatingAvatar"
                    class="reset-button"
                  >
                    Restablecer
                  </button>
                </div>
              </div>

              <!-- Controles de colores -->
              <div class="customization-controls">
                <div v-if="showColorOptions" class="color-controls-panel">
                    <!-- Fondo -->
                    <div v-if="supportsOption('backgroundColor')" class="color-control-compact">
                      <label class="color-label">Fondo</label>
                      <div class="color-control-row">
                        <div class="color-palette-compact">
                          <button
                            v-for="color in colorPalettes.background"
                            :key="color"
                            @click="setColor('backgroundColor', color)"
                            :class="['color-swatch-small', { active: avatarConfig.backgroundColor === color }]"
                            :style="{ backgroundColor: color }"
                            :title="color"
                          ></button>
                        </div>
                        <input 
                          type="color" 
                          v-model="avatarConfig.backgroundColor" 
                          @input="updateAvatarPreview"
                          class="color-input-small"
                        />
                      </div>
                    </div>

                    <!-- Piel -->
                    <div v-if="supportsOption('skinColor')" class="color-control-compact">
                      <label class="color-label">Piel</label>
                      <div class="color-control-row">
                        <div class="color-palette-compact">
                          <button
                            v-for="color in colorPalettes.skin"
                            :key="color"
                            @click="setColor('skinColor', color)"
                            :class="['color-swatch-small', { active: avatarConfig.skinColor === color }]"
                            :style="{ backgroundColor: color }"
                            :title="color"
                          ></button>
                        </div>
                        <input 
                          type="color" 
                          v-model="avatarConfig.skinColor" 
                          @input="updateAvatarPreview"
                          class="color-input-small"
                        />
                      </div>
                    </div>

                    <!-- Cabello -->
                    <div v-if="supportsOption('hairColor')" class="color-control-compact">
                      <label class="color-label">Cabello</label>
                      <div class="color-control-row">
                        <div class="color-palette-compact">
                          <button
                            v-for="color in colorPalettes.hair"
                            :key="color"
                            @click="setColor('hairColor', color)"
                            :class="['color-swatch-small', { active: avatarConfig.hairColor === color }]"
                            :style="{ backgroundColor: color }"
                            :title="color"
                          ></button>
                        </div>
                        <input 
                          type="color" 
                          v-model="avatarConfig.hairColor" 
                          @input="updateAvatarPreview"
                          class="color-input-small"
                        />
                      </div>
                    </div>

                    <!-- Ropa -->
                    <div v-if="supportsOption('clothingColor')" class="color-control-compact">
                      <label class="color-label">Ropa</label>
                      <div class="color-control-row">
                        <div class="color-palette-compact">
                          <button
                            v-for="color in colorPalettes.clothing"
                            :key="color"
                            @click="setColor('clothingColor', color)"
                            :class="['color-swatch-small', { active: avatarConfig.clothingColor === color }]"
                            :style="{ backgroundColor: color }"
                            :title="color"
                          ></button>
                        </div>
                        <input 
                          type="color" 
                          v-model="avatarConfig.clothingColor" 
                          @input="updateAvatarPreview"
                          class="color-input-small"
                        />
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </div>

        <div v-if="avatarMessage" 
             :class="avatarMessage.type === 'success' ? 'avatar-message success' : 'avatar-message error'">
          {{ avatarMessage.text }}
        </div>
      </div>


      <!-- Información de Cuenta -->
      <div class="section">
        <h3 class="section-title">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Información de Cuenta
        </h3>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">Correo electrónico</span>
            <span class="info-value">{{ userEmail }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Fecha de registro</span>
            <span class="info-value">{{ formattedCreatedAt }}</span>
          </div>
          <div v-if="lastSignInAt" class="info-item">
            <span class="info-label">Última actividad</span>
            <span class="info-value">{{ formattedLastSignIn }}</span>
          </div>
        </div>
      </div>

      <!-- Cambio de Contraseña -->
      <div class="section">
        <h3 class="section-title">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Cambiar Contraseña
        </h3>
        <div class="password-section">
          <div class="password-input-wrapper">
            <input 
              type="password" 
              v-model="newPassword"
              placeholder="Nueva contraseña"
              class="password-input"
              @keyup.enter="changePassword"
            />
            <button 
              @click="changePassword"
              :disabled="changingPassword || !newPassword"
              class="password-button"
            >
              <span v-if="changingPassword">Cambiando...</span>
              <span v-else>Cambiar</span>
            </button>
          </div>
          <div v-if="passwordMessage" 
               :class="passwordMessage.type === 'success' ? 'password-message success' : 'password-message error'">
            {{ passwordMessage.text }}
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BackButton from '@/components/BackButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const newPassword = ref('')
const changingPassword = ref(false)
const passwordMessage = ref<{ type: 'success' | 'error', text: string } | null>(null)
const updatingAvatar = ref(false)
const avatarMessage = ref<{ type: 'success' | 'error', text: string } | null>(null)
const showAvatarStyles = ref(false)
const showAvatarCustomization = ref(false)
const avatarConfig = ref<Record<string, any>>({
  backgroundColor: '#ffffff',
  skinColor: '#fdbcb4',
  hairColor: '#4a3120',
  clothingColor: '#3c4f5c'
})

// Paletas de colores predefinidas
const colorPalettes = {
  skin: ['#fdbcb4', '#d08b5b', '#ae5d29', '#614335', '#ffdbac', '#f1c27d', '#e0ac69'],
  hair: ['#4a3120', '#6b4423', '#8b4513', '#a0522d', '#d2691e', '#cd853f', '#daa520', '#ffd700', '#000000', '#ffffff'],
  clothing: ['#3c4f5c', '#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#ecf0f1', '#e74c3c', '#3498db', '#2ecc71', '#f39c12'],
  background: ['#ffffff', '#f0f0f0', '#e0e0e0', '#d0d0d0', '#c0c0c0', '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6']
}

// Estilos de avatar disponibles
const avatarStyles = [
  // Personas/Realistas
  { id: 'avataaars', name: 'Avataaars' },
  { id: 'personas', name: 'Personas' },
  { id: 'adventurer', name: 'Aventurero' },
  { id: 'big-ears', name: 'Orejas Grandes' },
  { id: 'big-smile', name: 'Gran Sonrisa' },
  { id: 'croodles', name: 'Croodles' },
  { id: 'fun', name: 'Divertido' },
  { id: 'lorelei', name: 'Lorelei' },
  { id: 'micah', name: 'Micah' },
  { id: 'miniavs', name: 'Mini Avatares' },
  { id: 'open-peeps', name: 'Open Peeps' },
  { id: 'thumbs', name: 'Thumbs' },
  // Robots/Tecnológicos
  { id: 'bottts', name: 'Robots' },
  { id: 'bottts-neutral', name: 'Robots Neutral' },
  // Abstractos/Geométricos
  { id: 'identicon', name: 'Geométrico' },
  { id: 'initials', name: 'Iniciales' },
  { id: 'shapes', name: 'Formas' },
  { id: 'rings', name: 'Anillos' },
  // Pixel Art
  { id: 'pixel-art', name: 'Pixel Art' },
  { id: 'pixel-art-neutral', name: 'Pixel Art Neutral' },
  // Otros
  { id: 'notionists', name: 'Notionists' },
  { id: 'icons', name: 'Iconos' }
]

// Computed
const userEmail = computed(() => authStore.userEmail || '')
const userName = computed(() => authStore.userName || '')
const userId = computed(() => authStore.userId || '')
const user = computed(() => authStore.user)

const currentAvatarStyle = computed(() => {
  return user.value?.user_metadata?.avatar_style || null
})

const currentAvatarConfig = computed(() => {
  return user.value?.user_metadata?.avatar_config || {}
})

const avatarUrl = computed(() => {
  if (currentAvatarStyle.value) {
    return getCustomizedAvatarUrl()
  }
  return null
})

// Verificar si hay opciones de color disponibles para el estilo actual
const showColorOptions = computed(() => {
  if (!currentAvatarStyle.value) return false
  // Verificar si al menos una opción de color está disponible
  return supportsOption('backgroundColor') || 
         supportsOption('skinColor') || 
         supportsOption('hairColor') || 
         supportsOption('clothingColor')
})


const userInitials = computed(() => {
  if (userName.value) {
    return userName.value
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return userEmail.value.charAt(0).toUpperCase()
})

const formattedCreatedAt = computed(() => {
  if (!user.value?.created_at) return 'No disponible'
  const date = new Date(user.value.created_at)
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})

const lastSignInAt = computed(() => {
  return user.value?.last_sign_in_at || null
})

const formattedLastSignIn = computed(() => {
  if (!lastSignInAt.value) return 'No disponible'
  const date = new Date(lastSignInAt.value)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})

// Methods
// Filtrar configuración según el estilo (solo opciones válidas)
// IMPORTANTE: Solo incluir opciones que realmente soporta cada estilo según DiceBear API
const filterConfigForStyle = (style: string, config: Record<string, any>): Record<string, any> => {
  const filtered: Record<string, any> = {}
  
  // Mapeo conservador de opciones válidas por estilo
  // Solo opciones de color para evitar errores
  const validOptions: Record<string, string[]> = {
    // Avataaars: solo colores
    avataaars: ['backgroundColor', 'skinColor', 'hairColor', 'clothingColor'],
    // Personas: solo colores
    personas: ['backgroundColor', 'skinColor', 'hairColor', 'clothingColor'],
    // Adventurer: solo colores
    adventurer: ['backgroundColor', 'skinColor', 'hairColor', 'clothingColor'],
    // Lorelei: solo colores básicos
    lorelei: ['backgroundColor', 'hairColor', 'clothingColor'],
    // Bottts: solo background
    bottts: ['backgroundColor'],
    // Pixel art: solo colores
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

const getAvatarUrl = (style: string, config?: Record<string, any>) => {
  const seed = userEmail.value || userId.value || 'default'
  const baseUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`
  const params = new URLSearchParams()
  
  // Aplicar configuración personalizada si existe y filtrarla según el estilo
  const rawConfig = config !== undefined ? config : (currentAvatarConfig.value || {})
  const finalConfig = filterConfigForStyle(style, rawConfig)
  
  // Agregar parámetros solo si están en la configuración filtrada (ya validados)
  // Background color - siempre agregar, por defecto transparent
  if (finalConfig.backgroundColor) {
    const bgColor = finalConfig.backgroundColor.replace('#', '')
    if (bgColor && /^[0-9a-fA-F]{6}$/.test(bgColor)) {
      params.append('backgroundColor', bgColor)
    } else {
      params.append('backgroundColor', 'transparent')
    }
  } else {
    params.append('backgroundColor', 'transparent')
  }
  
  // Skin color - solo si está en la config filtrada
  if (finalConfig.skinColor) {
    const skinColor = finalConfig.skinColor.replace('#', '')
    if (skinColor && /^[0-9a-fA-F]{6}$/.test(skinColor)) {
      params.append('skinColor', skinColor)
    }
  }
  
  // Hair color - solo si está en la config filtrada
  if (finalConfig.hairColor) {
    const hairColor = finalConfig.hairColor.replace('#', '')
    if (hairColor && /^[0-9a-fA-F]{6}$/.test(hairColor)) {
      params.append('hairColor', hairColor)
    }
  }
  
  // Clothing color - solo si está en la config filtrada
  if (finalConfig.clothingColor) {
    const clothingColor = finalConfig.clothingColor.replace('#', '')
    if (clothingColor && /^[0-9a-fA-F]{6}$/.test(clothingColor)) {
      params.append('clothingColor', clothingColor)
    }
  }
  
  // NO incluir accesorios ni otras opciones - solo colores
  
  return `${baseUrl}&${params.toString()}`
}

const getCustomizedAvatarUrl = () => {
  if (!currentAvatarStyle.value) return ''
  return getAvatarUrl(currentAvatarStyle.value, avatarConfig.value)
}

const hasCustomizationOptions = (style: string) => {
  return ['avataaars', 'personas', 'adventurer', 'lorelei', 'bottts', 'pixel-art', 'pixel-art-neutral'].includes(style)
}

const supportsOption = (option: string) => {
  if (!currentAvatarStyle.value) return false
  const style = currentAvatarStyle.value
  
  // Mapeo conservador de opciones por estilo
  // Solo opciones de color
  const optionMap: Record<string, string[]> = {
    avataaars: ['backgroundColor', 'skinColor', 'hairColor', 'clothingColor'],
    personas: ['backgroundColor', 'skinColor', 'hairColor', 'clothingColor'],
    adventurer: ['backgroundColor', 'skinColor', 'hairColor', 'clothingColor'],
    lorelei: ['backgroundColor', 'hairColor', 'clothingColor'],
    bottts: ['backgroundColor'],
    'pixel-art': ['backgroundColor', 'skinColor', 'hairColor', 'clothingColor'],
    'pixel-art-neutral': ['backgroundColor', 'skinColor', 'hairColor', 'clothingColor']
  }
  
  return optionMap[style]?.includes(option) || false
}


const formatOptionName = (option: string): string => {
  const names: Record<string, string> = {
    round: 'Redondas',
    square: 'Cuadradas',
    none: 'Ninguno',
    beard: 'Barba',
    mustache: 'Bigote',
    beanie: 'Gorro',
    cap: 'Gorra',
    short: 'Corto',
    medium: 'Medio',
    long: 'Largo',
    curly: 'Rizado',
    straight: 'Liso',
    shirt: 'Camisa',
    hoodie: 'Sudadera',
    sweater: 'Suéter',
    blazer: 'Blazer',
    dress: 'Vestido',
    blouse: 'Blusa'
  }
  return names[option] || option.charAt(0).toUpperCase() + option.slice(1)
}

const setColor = (key: string, color: string) => {
  avatarConfig.value[key] = color
  updateAvatarPreview()
}

const updateAvatarPreview = () => {
  // El preview se actualiza automáticamente con computed
}

const resetAvatarCustomization = () => {
  avatarConfig.value = {
    backgroundColor: '#ffffff',
    skinColor: '#fdbcb4',
    hairColor: '#4a3120',
    clothingColor: '#3c4f5c'
  }
  updateAvatarPreview()
}

const saveAvatarCustomization = async () => {
  if (updatingAvatar.value || !currentAvatarStyle.value) return

  updatingAvatar.value = true
  avatarMessage.value = null

  try {
    // Verificar que el usuario esté autenticado
    if (!authStore.isAuthenticated) {
      avatarMessage.value = {
        type: 'error',
        text: 'Debes estar autenticado para guardar la personalización'
      }
      return
    }

    // Refrescar la sesión antes de actualizar para evitar errores 403
    await authStore.refreshUserSession()

    // Filtrar y limpiar valores: solo opciones válidas para el estilo actual
    const filteredConfig = filterConfigForStyle(currentAvatarStyle.value, avatarConfig.value)
    
    // Limpiar valores vacíos o inválidos
    const cleanConfig: Record<string, any> = {}
    Object.keys(filteredConfig).forEach(key => {
      const value = filteredConfig[key]
      // Solo incluir si tiene valor válido
      if (value !== undefined && value !== null && value !== '') {
        // Para colores, asegurar formato correcto
        if (['backgroundColor', 'skinColor', 'hairColor', 'clothingColor'].includes(key)) {
          if (typeof value === 'string' && value.startsWith('#')) {
            cleanConfig[key] = value
          }
        } else {
          cleanConfig[key] = value
        }
      }
    })

    const result = await authStore.updateUserProfile({
      avatar_style: currentAvatarStyle.value,
      avatar_config: cleanConfig
    })
    
    if (result.error) {
      avatarMessage.value = {
        type: 'error',
        text: result.error || 'Error al guardar la personalización. Intenta de nuevo.'
      }
    } else {
      avatarMessage.value = {
        type: 'success',
        text: 'Avatar personalizado guardado correctamente'
      }
      
      setTimeout(() => {
        avatarMessage.value = null
      }, 3000)
    }
  } catch (err) {
    avatarMessage.value = {
      type: 'error',
      text: 'Error al guardar personalización'
    }
  } finally {
    updatingAvatar.value = false
  }
}

const selectAvatarStyle = async (styleId: string) => {
  if (updatingAvatar.value || currentAvatarStyle.value === styleId) return

  updatingAvatar.value = true
  avatarMessage.value = null

  try {
    // Verificar que el usuario esté autenticado
    if (!authStore.isAuthenticated) {
      avatarMessage.value = {
        type: 'error',
        text: 'Debes estar autenticado para cambiar el avatar'
      }
      return
    }

    // Refrescar la sesión antes de actualizar para evitar errores 403
    await authStore.refreshUserSession()
    
    // Filtrar la configuración existente para solo mantener opciones válidas del nuevo estilo
    const existingConfig = currentAvatarConfig.value || {}
    const filteredConfig = filterConfigForStyle(styleId, existingConfig)
    
    const result = await authStore.updateUserProfile({
      avatar_style: styleId,
      avatar_config: filteredConfig
    })
    
    if (result.error) {
      avatarMessage.value = {
        type: 'error',
        text: result.error || 'Error al actualizar el avatar. Intenta de nuevo.'
      }
    } else {
      
      // Cargar la configuración filtrada o inicializar
      if (filteredConfig && Object.keys(filteredConfig).length > 0) {
        // Asegurar formato correcto de colores
        const normalizedConfig = { ...filteredConfig }
        if (normalizedConfig.backgroundColor && !normalizedConfig.backgroundColor.startsWith('#')) {
          normalizedConfig.backgroundColor = `#${normalizedConfig.backgroundColor}`
        }
        if (normalizedConfig.skinColor && !normalizedConfig.skinColor.startsWith('#')) {
          normalizedConfig.skinColor = `#${normalizedConfig.skinColor}`
        }
        if (normalizedConfig.hairColor && !normalizedConfig.hairColor.startsWith('#')) {
          normalizedConfig.hairColor = `#${normalizedConfig.hairColor}`
        }
        if (normalizedConfig.clothingColor && !normalizedConfig.clothingColor.startsWith('#')) {
          normalizedConfig.clothingColor = `#${normalizedConfig.clothingColor}`
        }
        
        // Resetear primero y luego aplicar la config filtrada
        resetAvatarCustomization()
        avatarConfig.value = { ...avatarConfig.value, ...normalizedConfig }
      } else {
        resetAvatarCustomization()
      }
      
      // Si el nuevo avatar se puede personalizar, mostrar automáticamente el botón de personalización
      if (hasCustomizationOptions(styleId)) {
        // No abrir automáticamente, pero asegurar que el botón esté visible
        // El botón aparecerá automáticamente porque currentAvatarStyle cambió
      }
      
      avatarMessage.value = {
        type: 'success',
        text: 'Avatar actualizado correctamente'
      }
      
      setTimeout(() => {
        avatarMessage.value = null
      }, 3000)
    }
  } catch (err) {
    avatarMessage.value = {
      type: 'error',
      text: 'Error al actualizar avatar'
    }
  } finally {
    updatingAvatar.value = false
  }
}

const changePassword = async () => {
  if (!newPassword.value) return

  changingPassword.value = true
  passwordMessage.value = null

  try {
    const result = await authStore.changePassword(newPassword.value)
    
    if (result.error) {
      passwordMessage.value = {
        type: 'error',
        text: result.error
      }
    } else {
      passwordMessage.value = {
        type: 'success',
        text: 'Contraseña actualizada correctamente'
      }
      newPassword.value = ''
      
      setTimeout(() => {
        passwordMessage.value = null
      }, 3000)
    }
  } catch (err) {
    passwordMessage.value = {
      type: 'error',
      text: 'Error al cambiar contraseña'
    }
  } finally {
    changingPassword.value = false
  }
}

onMounted(async () => {
  try {
    loading.value = true
    
    // Asegurar que la autenticación esté inicializada
    if (!authStore.isInitialized) {
      await authStore.initializeAuth()
    }

    // Cargar configuración de avatar existente
    if (currentAvatarConfig.value && Object.keys(currentAvatarConfig.value).length > 0) {
      // Asegurar que los colores tengan formato válido
      const loadedConfig = { ...currentAvatarConfig.value }
      if (loadedConfig.backgroundColor && !loadedConfig.backgroundColor.startsWith('#')) {
        loadedConfig.backgroundColor = `#${loadedConfig.backgroundColor}`
      }
      if (loadedConfig.skinColor && !loadedConfig.skinColor.startsWith('#')) {
        loadedConfig.skinColor = `#${loadedConfig.skinColor}`
      }
      if (loadedConfig.hairColor && !loadedConfig.hairColor.startsWith('#')) {
        loadedConfig.hairColor = `#${loadedConfig.hairColor}`
      }
      if (loadedConfig.clothingColor && !loadedConfig.clothingColor.startsWith('#')) {
        loadedConfig.clothingColor = `#${loadedConfig.clothingColor}`
      }
      avatarConfig.value = { ...avatarConfig.value, ...loadedConfig }
    }
  } catch (err) {
    console.error('Error loading profile:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.perfil-view {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
  min-height: 100vh;
}

.view-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.view-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-soft);
}

.perfil-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Header del perfil */
.perfil-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background-card);
}

.avatar-container {
  flex-shrink: 0;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  width: 80px;
  height: 80px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--cf-navy), var(--cf-navy-light));
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-border);
  overflow: hidden;
  position: relative;
  transition: all 0.2s;
}

.avatar-wrapper:hover .avatar {
  border-color: var(--cf-navy);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-edit-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.avatar-wrapper:hover .avatar-edit-overlay {
  opacity: 1;
}

.avatar-edit-overlay svg {
  width: 20px;
  height: 20px;
}

.avatar.has-avatar {
  background: transparent;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  font-size: 2rem;
  font-weight: bold;
  color: white;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.25rem 0;
}

.user-email {
  color: var(--color-text-soft);
  font-size: 0.95rem;
  margin: 0;
}

/* Secciones */
.section {
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background-card);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.section-title svg {
  color: var(--cf-navy);
}

/* Información de cuenta */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.95rem;
  color: var(--color-text-soft);
}

.info-value {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text);
  text-align: right;
}

/* Cambio de contraseña */
.password-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.password-input-wrapper {
  display: flex;
  gap: 0.75rem;
}

.password-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.95rem;
}

.password-input:focus {
  outline: none;
  border-color: var(--cf-navy);
}

.password-button {
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--cf-navy);
  border-radius: 8px;
  background: var(--cf-navy);
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.password-button:hover:not(:disabled) {
  background: var(--cf-navy-dark);
  border-color: var(--cf-navy-dark);
}

.password-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.password-message {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.password-message.success {
  background: rgba(34, 197, 94, 0.1);
  color: rgb(22, 163, 74);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.password-message.error {
  background: rgba(239, 68, 68, 0.1);
  color: rgb(220, 38, 38);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Editor de Avatar */
.personalize-prompt {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: center;
}

.personalize-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--cf-navy);
  border-radius: 8px;
  background: var(--cf-navy);
  color: var(--cf-navy);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
}

.personalize-button:hover {
  background: var(--cf-navy);
  color: white;
}

.personalize-button svg {
  flex-shrink: 0;
}

.avatar-editor {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.avatar-description {
  color: var(--color-text-soft);
  font-size: 0.95rem;
  margin: 0;
}

.avatar-styles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.avatar-style-option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 140px;
}

.avatar-style-option:hover:not(:disabled) {
  border-color: var(--cf-navy);
  background: var(--color-background-mute);
  transform: translateY(-2px);
}

.avatar-style-option.active {
  border-color: var(--cf-navy);
  background: rgba(var(--cf-navy-rgb, 30, 58, 138), 0.1);
}

.avatar-style-option:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  object-fit: cover;
}

.avatar-style-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  text-align: center;
}

.check-icon {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: var(--cf-navy);
  background: white;
  border-radius: 50%;
  padding: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar-message {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.avatar-message.success {
  background: rgba(34, 197, 94, 0.1);
  color: rgb(22, 163, 74);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.avatar-message.error {
  background: rgba(239, 68, 68, 0.1);
  color: rgb(220, 38, 38);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Personalización de Avatar */
.avatar-customization {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background-mute);
}

.customization-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 2rem;
  align-items: start;
}

.customization-preview {
  position: sticky;
  top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.avatar-preview-large {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  overflow: hidden;
  background: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.customization-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.color-controls-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Controles compactos */
.color-control-compact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.color-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.color-control-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-palette-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  flex: 1;
}

.color-swatch-small {
  width: 32px;
  height: 32px;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  flex-shrink: 0;
}

.color-swatch-small:hover {
  transform: scale(1.15);
  border-color: var(--cf-navy);
}

.color-swatch-small.active {
  border-color: var(--cf-navy);
  border-width: 3px;
  box-shadow: 0 0 0 2px rgba(var(--cf-navy-rgb, 30, 58, 138), 0.2);
}

.color-input-small {
  width: 50px;
  height: 36px;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  background: var(--color-background);
  padding: 0;
  flex-shrink: 0;
}

.color-input-small:focus {
  outline: none;
  border-color: var(--cf-navy);
}



.styled-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

.styled-select:focus {
  outline: none;
  border-color: var(--cf-navy);
  box-shadow: 0 0 0 3px rgba(var(--cf-navy-rgb, 30, 58, 138), 0.1);
}

.styled-select:hover {
  border-color: var(--cf-navy);
}

.preview-actions .save-button,
.preview-actions .reset-button {
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  width: 100%;
}

.preview-actions .save-button {
  background: var(--cf-navy);
  color: white;
}

.preview-actions .save-button:hover:not(:disabled) {
  background: var(--cf-navy-dark);
}

.preview-actions .reset-button {
  background: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.preview-actions .reset-button:hover:not(:disabled) {
  background: var(--color-background-mute);
}

.preview-actions .save-button:disabled,
.preview-actions .reset-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .perfil-view {
    padding: 1rem;
  }

  .perfil-header {
    flex-direction: column;
    text-align: center;
  }

  .password-input-wrapper {
    flex-direction: column;
  }

  .password-button {
    width: 100%;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .info-value {
    text-align: left;
  }

  .avatar-styles-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.75rem;
  }

  .avatar-style-option {
    min-height: 120px;
    padding: 0.75rem;
  }

  .avatar-preview {
    width: 60px;
    height: 60px;
  }

  .customization-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .customization-layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .customization-preview {
    position: static;
    order: -1;
  }

  .avatar-preview-large {
    width: 120px;
    height: 120px;
  }

  .preview-actions {
    flex-direction: row;
    width: 100%;
  }

  .preview-actions .save-button,
  .preview-actions .reset-button {
    flex: 1;
  }

  .color-palette-compact {
    gap: 0.3rem;
  }

  .color-swatch-small {
    width: 28px;
    height: 28px;
  }
}
</style>
