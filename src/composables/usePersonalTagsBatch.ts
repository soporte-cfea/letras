import { ref, computed } from 'vue'
import { PersonalTagsService } from '@/api/personalTags'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable para cargar etiquetas personales de múltiples canciones
 * Útil para vistas que muestran listas de canciones
 */
export function usePersonalTagsBatch() {
  const authStore = useAuthStore()
  const loading = ref(false)
  const error = ref<string | null>(null)
  const personalTagsMap = ref<Map<string, string[]>>(new Map())

  /**
   * Cargar etiquetas personales para múltiples canciones
   */
  const loadPersonalTagsForSongs = async (songIds: string[]) => {
    if (!authStore.isAuthenticated || !authStore.userId || songIds.length === 0) {
      personalTagsMap.value = new Map()
      return
    }

    try {
      loading.value = true
      error.value = null
      personalTagsMap.value = await PersonalTagsService.getPersonalTagsBySongs(songIds, authStore.userId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar etiquetas personales'
      error.value = errorMessage
      console.error('Error loading personal tags for songs:', err)
      personalTagsMap.value = new Map()
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener etiquetas personales para una canción específica
   */
  const getPersonalTagsForSong = (songId: string): string[] => {
    return personalTagsMap.value.get(songId) || []
  }

  /**
   * Limpiar el mapa de etiquetas
   */
  const clearPersonalTags = () => {
    personalTagsMap.value = new Map()
  }

  return {
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    personalTagsMap: computed(() => personalTagsMap.value),
    loadPersonalTagsForSongs,
    getPersonalTagsForSong,
    clearPersonalTags
  }
}

