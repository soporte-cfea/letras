import { ref, computed, watch, onMounted } from 'vue'
import { themeStorage, type ThemePreference } from '@/utils/persistence'

export type Theme = ThemePreference

const theme = ref<Theme>('auto')
const isDark = ref(false)

export function useTheme() {
  // Detectar preferencia del sistema
  const prefersDark = computed(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Computed para determinar si el tema actual es oscuro
  const currentIsDark = computed(() => {
    if (theme.value === 'auto') {
      return prefersDark.value
    }
    return theme.value === 'dark'
  })

  // Aplicar tema al documento
  const applyTheme = (newTheme: Theme) => {
    theme.value = newTheme
    const root = document.documentElement
    
    if (newTheme === 'auto') {
      root.removeAttribute('data-theme')
      isDark.value = prefersDark.value
    } else {
      root.setAttribute('data-theme', newTheme)
      isDark.value = newTheme === 'dark'
    }
    
    // Guardar preferencia
    themeStorage.set(newTheme)
  }

  // Inicializar tema
  const initializeTheme = () => {
    const saved = themeStorage.get()
    if (saved) {
      applyTheme(saved)
    } else {
      applyTheme('auto')
    }
  }

  // Toggle entre temas
  const toggleTheme = () => {
    if (theme.value === 'light') {
      applyTheme('dark')
    } else if (theme.value === 'dark') {
      applyTheme('auto')
    } else {
      applyTheme('light')
    }
  }

  // Escuchar cambios en la preferencia del sistema
  const setupSystemThemeListener = () => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme.value === 'auto') {
        isDark.value = mediaQuery.matches
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }

  // Watcher para cambios de tema
  watch(currentIsDark, (newValue) => {
    isDark.value = newValue
  })

  // Inicializar al montar
  onMounted(() => {
    initializeTheme()
    setupSystemThemeListener()
  })

  return {
    theme: computed(() => theme.value),
    isDark: computed(() => isDark.value),
    applyTheme,
    toggleTheme,
    initializeTheme
  }
}
