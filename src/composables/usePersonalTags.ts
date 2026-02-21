import { ref, computed } from 'vue'
import { PersonalTagsService } from '@/api/personalTags'
import type { PersonalTag, PersonalTagInput } from '@/types/personalTags'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable para manejar etiquetas personales de canciones
 */
export function usePersonalTags() {
  const authStore = useAuthStore()
  const loading = ref(false)
  const error = ref<string | null>(null)
  const personalTags = ref<PersonalTag[]>([])
  const uniqueTags = ref<string[]>([])

  /**
   * Cargar etiquetas personales para una canción
   */
  const loadPersonalTags = async (songId: string) => {
    if (!authStore.isAuthenticated || !authStore.userId) {
      personalTags.value = []
      return
    }

    try {
      loading.value = true
      error.value = null
      personalTags.value = await PersonalTagsService.getPersonalTagsBySong(songId, authStore.userId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar etiquetas personales'
      error.value = errorMessage
      console.error('Error loading personal tags:', err)
      personalTags.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Cargar todas las etiquetas únicas del usuario (para sugerencias)
   */
  const loadUniqueTags = async () => {
    if (!authStore.isAuthenticated || !authStore.userId) {
      uniqueTags.value = []
      return
    }

    try {
      uniqueTags.value = await PersonalTagsService.getUniquePersonalTags(authStore.userId)
    } catch (err) {
      console.error('Error loading unique tags:', err)
      uniqueTags.value = []
    }
  }

  /**
   * Agregar una etiqueta personal
   */
  const addPersonalTag = async (songId: string, tagName: string) => {
    if (!authStore.isAuthenticated || !authStore.userId) {
      throw new Error('Debes estar autenticado para agregar etiquetas personales')
    }

    if (!tagName || !tagName.trim()) {
      throw new Error('El nombre de la etiqueta no puede estar vacío')
    }

    try {
      loading.value = true
      error.value = null

      const input: PersonalTagInput = {
        song_id: songId,
        tag_name: tagName.trim()
      }

      const newTag = await PersonalTagsService.addPersonalTag(input, authStore.userId)
      
      // Agregar a la lista local
      personalTags.value = [newTag, ...personalTags.value]
      
      // Actualizar lista de etiquetas únicas
      if (!uniqueTags.value.includes(newTag.tag_name)) {
        uniqueTags.value = [...uniqueTags.value, newTag.tag_name].sort()
      }

      return newTag
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al agregar etiqueta personal'
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Eliminar una etiqueta personal
   */
  const removePersonalTag = async (tagId: string) => {
    if (!authStore.isAuthenticated || !authStore.userId) {
      throw new Error('Debes estar autenticado para eliminar etiquetas personales')
    }

    try {
      loading.value = true
      error.value = null

      await PersonalTagsService.removePersonalTag(tagId, authStore.userId)
      
      // Remover de la lista local
      personalTags.value = personalTags.value.filter(tag => tag.id !== tagId)

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar etiqueta personal'
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener nombres de etiquetas personales
   */
  const tagNames = computed(() => {
    return personalTags.value.map(tag => tag.tag_name)
  })

  return {
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    personalTags: computed(() => personalTags.value),
    tagNames,
    uniqueTags: computed(() => uniqueTags.value),
    loadPersonalTags,
    loadUniqueTags,
    addPersonalTag,
    removePersonalTag
  }
}

