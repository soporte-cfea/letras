<template>
  <div class="song-document-editor" :class="{ 'song-document-editor--monospace': variant === 'monospace' }">
    <div v-if="loading" class="song-document-editor__state">
      <div class="loading-spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <div v-else-if="error" class="song-document-editor__state song-document-editor__state--error">
      <div class="error-icon">⚠️</div>
      <h3>{{ errorTitle }}</h3>
      <p>{{ error }}</p>
      <button type="button" class="retry-btn" @click="$emit('retry')">Reintentar</button>
    </div>

    <div
      v-else-if="showEmptyPlaceholder"
      class="song-document-editor__state song-document-editor__state--empty"
    >
      <div class="placeholder-icon">{{ emptyIcon }}</div>
      <h3>{{ emptyTitle }}</h3>
      <p>{{ emptyMessage }}</p>
    </div>

    <div v-else class="song-document-editor__wrapper">
      <div class="song-document-editor__actions">
        <button
          v-if="showCopyButton"
          type="button"
          class="copy-button"
          :class="{ copied: copyState === 'copied' }"
          :title="copyState === 'copied' ? '¡Copiado!' : copyLabel"
          @click="handleCopy"
        >
          <svg v-if="copyState === 'idle'" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          <svg v-else width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <span v-if="copyState === 'copied'" class="copy-text">¡Copiado!</span>
        </button>

        <template v-if="editable">
          <button
            v-if="!editing"
            type="button"
            class="floating-edit-btn"
            :title="editTitle"
            @click="$emit('start-edit')"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>

          <div v-else class="floating-edit-actions">
            <button
              type="button"
              class="floating-save-btn"
              :disabled="saving"
              title="Guardar"
              @click="$emit('save')"
            >
              <svg v-if="!saving" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7"/>
              </svg>
              <span v-else class="loading-spinner-small"></span>
            </button>
            <button
              type="button"
              class="floating-cancel-btn"
              :disabled="saving"
              title="Cancelar"
              @click="$emit('cancel-edit')"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </template>
      </div>

      <RichTextContent
        v-if="!editable || !editing"
        :content="modelValue || ''"
      />
      <RichTextEditorAdvanced
        v-else
        :model-value="modelValue"
        :editable="true"
        :placeholder="placeholder"
        @update:model-value="$emit('update:modelValue', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RichTextContent from '@/components/common/RichTextContent.vue'
import RichTextEditorAdvanced from '@/components/common/RichTextEditorAdvanced.vue'
import { useCopyToClipboard } from '@/composables/useCopyToClipboard'
import { useNotifications } from '@/composables/useNotifications'
import { docBodyHasMeaningfulText, htmlToPlainText } from '@/utils/songDocument'

export interface SongDocumentEditorProps {
  modelValue: string
  loading?: boolean
  saving?: boolean
  error?: string | null
  editing?: boolean
  editable?: boolean
  hasContent?: boolean
  loadingMessage?: string
  errorTitle?: string
  editTitle?: string
  placeholder?: string
  emptyTitle?: string
  emptyMessage?: string
  emptyIcon?: string
  copyLabel?: string
  enableCopy?: boolean
  variant?: 'default' | 'monospace'
}

const props = withDefaults(defineProps<SongDocumentEditorProps>(), {
  loading: false,
  saving: false,
  error: null,
  editing: false,
  editable: false,
  hasContent: false,
  loadingMessage: 'Cargando...',
  errorTitle: 'Error al cargar',
  editTitle: 'Editar',
  placeholder: 'Escribe aquí...',
  emptyTitle: 'Contenido no disponible',
  emptyMessage: 'Este documento no está disponible aún.',
  emptyIcon: '📝',
  copyLabel: 'Copiar',
  enableCopy: true,
  variant: 'default'
})

defineEmits<{
  'update:modelValue': [value: string]
  'start-edit': []
  'cancel-edit': []
  save: []
  retry: []
}>()

const { copyState, copyText } = useCopyToClipboard()
const { error: showError } = useNotifications()

const showEmptyPlaceholder = computed(() => {
  return !props.editable && !props.hasContent && !props.loading && !props.error
})

const showCopyButton = computed(() => {
  return (
    props.enableCopy &&
    !props.editing &&
    props.hasContent &&
    !props.loading &&
    !props.error
  )
})

async function handleCopy() {
  const plainText = htmlToPlainText(props.modelValue)
  if (!docBodyHasMeaningfulText(plainText)) return

  const copied = await copyText(plainText)
  if (!copied) {
    showError('Error', `No se pudo copiar. Inténtalo de nuevo.`)
  }
}
</script>

<style scoped>
.song-document-editor {
  flex: 1;
  background: var(--color-background-card);
  border-radius: 12px;
  padding: 0.75rem;
  min-height: 400px;
}

.song-document-editor__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
  min-height: 400px;
}

.song-document-editor__state .loading-spinner {
  margin-bottom: 1rem;
}

.song-document-editor__state--error .error-icon,
.song-document-editor__state--empty .placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.song-document-editor__state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.song-document-editor__state p {
  color: var(--color-text-soft);
  margin-bottom: 1rem;
}

.song-document-editor__wrapper {
  position: relative;
}

.song-document-editor__actions {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.copy-button {
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
}

.copy-button:hover {
  background: var(--color-background-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.copy-button.copied {
  background: var(--color-success);
  color: var(--color-text-inverse);
  border-color: var(--color-success);
  transform: scale(1.05);
}

.copy-button.copied:hover {
  background: var(--color-success-hover);
  transform: scale(1.05);
}

.copy-text {
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.floating-edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background-card);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
}

.floating-edit-btn:hover {
  background: var(--color-background-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.floating-edit-actions {
  display: flex;
  gap: 0.5rem;
}

.floating-save-btn,
.floating-cancel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
}

.floating-save-btn {
  background: var(--color-success);
  color: var(--color-text-inverse);
  border-color: var(--color-success);
}

.floating-save-btn:hover:not(:disabled) {
  background: var(--color-success-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.floating-save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.floating-cancel-btn {
  background: var(--color-background-card);
  color: var(--color-text);
  border-color: var(--color-border);
}

.floating-cancel-btn:hover:not(:disabled) {
  background: var(--color-background-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.floating-cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.retry-btn {
  background: var(--color-info);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Variante monoespaciada (acordes) */
.song-document-editor--monospace .song-document-editor__wrapper {
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
}

.song-document-editor--monospace :deep(.rich-text-content) {
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.15;
  white-space: pre-wrap;
}

.song-document-editor--monospace :deep(.rich-text-content p) {
  margin: 0 0 0.5rem 0;
  line-height: 1.15;
}

.song-document-editor--monospace :deep(.rich-text-content p:last-child) {
  margin-bottom: 0;
}

.song-document-editor--monospace :deep(.ProseMirror) {
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.15;
  padding: 0.5rem 0.75rem !important;
}

.song-document-editor--monospace :deep(.ProseMirror p) {
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
  margin: 0 0 0.5rem 0;
  padding: 0;
  white-space: pre-wrap;
  line-height: 1.15;
}

.song-document-editor--monospace :deep(.ProseMirror p:last-child) {
  margin-bottom: 0;
}

.song-document-editor--monospace :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
}

@media (max-width: 768px) {
  .song-document-editor__actions {
    top: 0.75rem;
    right: 0.75rem;
  }

  .copy-button {
    padding: 0.4rem;
    font-size: 0.8rem;
  }

  .copy-text {
    font-size: 0.75rem;
  }

  .floating-edit-btn,
  .floating-save-btn,
  .floating-cancel-btn {
    padding: 0.4rem;
  }
}
</style>
