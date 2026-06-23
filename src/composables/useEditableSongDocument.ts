import { reactive, computed } from 'vue'
import { useNotifications } from '@/composables/useNotifications'
import { docBodyHasMeaningfulText } from '@/utils/songDocument'

export interface UseEditableSongDocumentOptions {
  load: (songId: string, forceRefresh?: boolean) => Promise<string | null>
  save: (songId: string, content: string) => Promise<void>
  transformOnLoad?: (content: string) => string
  transformOnSave?: (content: string) => string
  loadErrorMessage?: string
  saveErrorMessage?: string
  saveSuccessMessage?: string
}

export function useEditableSongDocument(options: UseEditableSongDocumentOptions) {
  const { success, error: showError } = useNotifications()

  const state = reactive({
    content: '',
    loading: false,
    saving: false,
    error: null as string | null,
    editing: false,
    originalContent: ''
  })

  const hasContent = computed(() => docBodyHasMeaningfulText(state.content))

  async function load(songId: string, forceRefresh = false) {
    state.loading = true
    state.error = null

    try {
      const text = await options.load(songId, forceRefresh)
      state.content = options.transformOnLoad?.(text || '') ?? (text || '')
    } catch (err) {
      state.error = err instanceof Error
        ? err.message
        : (options.loadErrorMessage ?? 'Error al cargar el documento')
      console.error('Error loading song document:', err)
    } finally {
      state.loading = false
    }
  }

  function retry(songId: string) {
    return load(songId, true)
  }

  function startEdit() {
    state.originalContent = state.content
    state.editing = true
  }

  function cancelEdit() {
    state.content = state.originalContent
    state.editing = false
  }

  async function save(songId: string, canEdit: boolean): Promise<boolean> {
    if (!canEdit) return false

    state.saving = true

    try {
      const processed = options.transformOnSave?.(state.content) ?? state.content
      await options.save(songId, processed)
      state.content = processed
      state.originalContent = processed
      state.editing = false

      if (options.saveSuccessMessage) {
        success('Éxito', options.saveSuccessMessage)
      }

      return true
    } catch (err) {
      console.error('Error saving song document:', err)
      showError(
        'Error',
        options.saveErrorMessage ?? 'No se pudo guardar. Inténtalo de nuevo.'
      )
      return false
    } finally {
      state.saving = false
    }
  }

  return {
    state,
    hasContent,
    load,
    retry,
    startEdit,
    cancelEdit,
    save
  }
}
