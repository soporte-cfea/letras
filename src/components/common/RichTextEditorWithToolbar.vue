<template>
  <div class="rich-text-editor-with-toolbar">
    <div v-if="editor" class="toolbar">
      <!-- Formato de texto -->
      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor.isActive('bold') }"
          class="toolbar-btn"
          title="Negrita"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2v12h4.5c1.38 0 2.5-1.12 2.5-2.5 0-1.12-.73-2.07-1.75-2.41.42-.34.75-.84.75-1.41 0-1.38-1.12-2.5-2.5-2.5H4zm1.5 1.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm0 4.5h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5H5.5V8z"/>
          </svg>
        </button>
        <button
          @click="editor.chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor.isActive('italic') }"
          class="toolbar-btn"
          title="Cursiva"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5.5 2h5l-1 1h-2.5l-2 8h2.5l-1 1h-5l1-1h2.5l2-8H6.5l1-1z"/>
          </svg>
        </button>
        <button
          @click="editor.chain().focus().toggleUnderline().run()"
          :class="{ 'is-active': editor.isActive('underline') }"
          class="toolbar-btn"
          title="Subrayado"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5.313 3.136h-1.23V9.54c0 2.105 1.47 3.623 4.005 3.623s4.005-1.518 4.005-3.623V3.136h-1.23v6.323c0 1.49-.978 2.57-2.775 2.57-1.797 0-2.775-1.08-2.775-2.57V3.136z"/>
            <path d="M12.5 15h-9v-1h9v1z"/>
          </svg>
        </button>
        <button
          @click="editor.chain().focus().toggleStrike().run()"
          :class="{ 'is-active': editor.isActive('strike') }"
          class="toolbar-btn"
          title="Tachado"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 8h12M3 4h10M3 12h10"/>
          </svg>
        </button>
        <button
          @click="editor.chain().focus().toggleHighlight().run()"
          :class="{ 'is-active': editor.isActive('highlight') }"
          class="toolbar-btn"
          title="Resaltar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 2v4h10V2H3zm0 5v4h10V7H3zm0 5v4h10v-4H3z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Encabezados -->
      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
          class="toolbar-btn"
          title="Título 1"
        >
          H1
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
          class="toolbar-btn"
          title="Título 2"
        >
          H2
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
          class="toolbar-btn"
          title="Título 3"
        >
          H3
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Listas -->
      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          class="toolbar-btn"
          title="Lista con viñetas"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="2" cy="4" r="1"/>
            <circle cx="2" cy="8" r="1"/>
            <circle cx="2" cy="12" r="1"/>
            <path d="M5 4h10M5 8h10M5 12h10"/>
          </svg>
        </button>
        <button
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          class="toolbar-btn"
          title="Lista numerada"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2h1v1H2V2zm0 3h1v1H2V5zm0 3h1v1H2V8zm0 3h1v1h-1v-1zm3-9h10v1H5V2zm0 3h10v1H5V5zm0 3h10v1H5V8zm0 3h10v1H5v-1z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Otros -->
      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleBlockquote().run()"
          :class="{ 'is-active': editor.isActive('blockquote') }"
          class="toolbar-btn"
          title="Cita"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 2v8h3v-3h2V2H3zm8 0v8h3v-3h-2V2h-1z"/>
          </svg>
        </button>
        <button
          @click="editor.chain().focus().toggleCode().run()"
          :class="{ 'is-active': editor.isActive('code') }"
          class="toolbar-btn"
          title="Código inline"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5.854 4.146a.5.5 0 1 0-.708.708L7.293 8l-2.147 2.146a.5.5 0 0 0 .708.708l2.5-2.5a.5.5 0 0 0 0-.708l-2.5-2.5zm4.292 0a.5.5 0 0 1 .708.708L8.707 8l2.147 2.146a.5.5 0 0 1-.708.708l-2.5-2.5a.5.5 0 0 1 0-.708l2.5-2.5z"/>
          </svg>
        </button>
        <button
          @click="editor.chain().focus().toggleCodeBlock().run()"
          :class="{ 'is-active': editor.isActive('codeBlock') }"
          class="toolbar-btn"
          title="Bloque de código"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.5 2h7a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5zM5 3v10h6V3H5z"/>
            <path d="M6.5 5h3v1h-3V5zm0 2h3v1h-3V7zm0 2h2v1h-2V9z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Enlaces -->
      <div class="toolbar-group">
        <button
          @click="setLink"
          :class="{ 'is-active': editor.isActive('link') }"
          class="toolbar-btn"
          title="Insertar enlace"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.879 9.934a.5.5 0 1 1-.758-.652l2.5-2.9a.5.5 0 1 1 .758.652l-2.5 2.9z"/>
            <path d="M4.5 3a3.5 3.5 0 1 1 7 0v1h-1V3a2.5 2.5 0 1 0-5 0v1h-1V3zM11.5 13a3.5 3.5 0 1 1-7 0v-1h1v1a2.5 2.5 0 1 0 5 0v-1h1v1z"/>
            <path d="M3 6.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-3z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Acciones -->
      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
          class="toolbar-btn"
          title="Deshacer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
          </svg>
        </button>
        <button
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
          class="toolbar-btn"
          title="Rehacer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192l-2.36 1.966c-.12.1-.12.284 0 .384L7.59 4.658A.25.25 0 0 0 8 4.466z"/>
          </svg>
        </button>
      </div>
    </div>
    <RichTextEditor
      ref="editorRef"
      :model-value="modelValue"
      :placeholder="placeholder"
      :editable="editable"
      :min-height="minHeight"
      :max-height="maxHeight"
      @update:model-value="handleUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import RichTextEditor from './RichTextEditor.vue'

export interface RichTextEditorWithToolbarProps {
  modelValue: string
  placeholder?: string
  editable?: boolean
  minHeight?: string
  maxHeight?: string
}

const props = withDefaults(defineProps<RichTextEditorWithToolbarProps>(), {
  placeholder: 'Escribe aquí...',
  editable: true,
  minHeight: '200px',
  maxHeight: 'none'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref<InstanceType<typeof RichTextEditor> | null>(null)
const editorInstance = ref<any>(null)

// Observar cuando el editor esté disponible
watchEffect(() => {
  if (editorRef.value?.editor) {
    editorInstance.value = editorRef.value.editor
  }
})

function handleUpdate(value: string) {
  emit('update:modelValue', value)
}

function setLink() {
  if (!editorInstance.value) return

  const previousUrl = editorInstance.value.getAttributes('link').href
  const url = window.prompt('URL del enlace', previousUrl)

  if (url === null) {
    return
  }

  if (url === '') {
    editorInstance.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  editorInstance.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

// Computed para acceder al editor de forma reactiva
const editor = computed(() => editorInstance.value)
</script>

<style scoped>
.rich-text-editor-with-toolbar {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  gap: 0.125rem;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
  margin: 0 0.25rem;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: #374151;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background: #e5e7eb;
  color: #111827;
}

.toolbar-btn.is-active {
  background: #3b82f6;
  color: white;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-btn svg {
  width: 16px;
  height: 16px;
}
</style>

