<template>
  <div class="rich-text-editor" :class="{ 'editor-focused': isFocused }">
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

export interface RichTextEditorAdvancedBaseProps {
  modelValue: string
  placeholder?: string
  editable?: boolean
  minHeight?: string
  maxHeight?: string
}

const props = withDefaults(defineProps<RichTextEditorAdvancedBaseProps>(), {
  placeholder: 'Escribe aquí...',
  editable: true,
  minHeight: '200px',
  maxHeight: 'none'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isFocused = ref(false)

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6]
      },
      link: false,
      underline: false
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 hover:text-blue-800 underline'
      }
    }),
    Underline,
    Highlight.configure({
      multicolor: true
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'border-collapse border border-gray-300'
      }
    }),
    TableRow.configure({
      HTMLAttributes: {
        class: 'border border-gray-300'
      }
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: 'border border-gray-300 bg-gray-100 font-bold p-2'
      }
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: 'border border-gray-300 p-2'
      }
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded'
      }
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    TaskList.configure({
      HTMLAttributes: {
        class: 'list-none pl-0'
      }
    }),
    TaskItem.configure({
      nested: true,
      HTMLAttributes: {
        class: 'flex items-start'
      }
    })
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  onFocus: () => {
    isFocused.value = true
  },
  onBlur: () => {
    isFocused.value = false
  },
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none px-4 py-3'
    }
  }
})

watch(() => props.modelValue, (value) => {
  const isSame = editor.value?.getHTML() === value
  if (!isSame) {
    editor.value?.commands.setContent(value || '')
  }
})

watch(() => props.editable, (value) => {
  editor.value?.setEditable(value)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

defineExpose({
  editor
})
</script>

<style scoped>
.rich-text-editor {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  transition: border-color 0.2s;
}

.rich-text-editor.editor-focused {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

:deep(.ProseMirror) {
  min-height: v-bind(minHeight);
  max-height: v-bind(maxHeight);
  overflow-y: auto;
  outline: none;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: #9ca3af;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.ProseMirror h1) {
  font-size: 2em;
  font-weight: bold;
  margin-top: 0.67em;
  margin-bottom: 0.67em;
}

:deep(.ProseMirror h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin-top: 0.83em;
  margin-bottom: 0.83em;
}

:deep(.ProseMirror h3) {
  font-size: 1.17em;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 1em;
}

:deep(.ProseMirror ul:not([data-type="taskList"])) {
  list-style-type: disc !important;
  padding-left: 1.5em;
  margin: 1em 0;
}

:deep(.ProseMirror ol) {
  list-style-type: decimal !important;
  padding-left: 1.5em;
  margin: 1em 0;
}

:deep(.ProseMirror li:not([data-type="taskItem"])) {
  display: list-item !important;
  margin: 0.5em 0;
  padding-left: 0.25em;
}

:deep(.ProseMirror blockquote) {
  border-left: 4px solid #e5e7eb;
  padding-left: 1em;
  margin: 1em 0;
  color: #6b7280;
  font-style: italic;
}

:deep(.ProseMirror code) {
  background-color: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

:deep(.ProseMirror pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1em;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1em 0;
}

:deep(.ProseMirror pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
}

:deep(.ProseMirror mark) {
  background-color: #fef08a;
  padding: 0.1em 0.2em;
  border-radius: 0.2em;
}

:deep(.ProseMirror u) {
  text-decoration: underline;
}

/* Estilos para tablas */
:deep(.ProseMirror table) {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
}

:deep(.ProseMirror table td),
:deep(.ProseMirror table th) {
  border: 1px solid #d1d5db;
  padding: 0.5em;
  min-width: 1em;
}

:deep(.ProseMirror table th) {
  background-color: #f3f4f6;
  font-weight: bold;
}

:deep(.ProseMirror table .selectedCell:after) {
  z-index: 2;
  position: absolute;
  content: "";
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(200, 200, 255, 0.4);
  pointer-events: none;
}

:deep(.ProseMirror table .column-resize-handle) {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: -2px;
  width: 4px;
  background-color: #3b82f6;
  pointer-events: none;
}

/* Estilos para imágenes */
:deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1em 0;
}

:deep(.ProseMirror img.ProseMirror-selectednode) {
  outline: 3px solid #3b82f6;
}

/* Estilos para alineación de texto */
:deep(.ProseMirror [style*="text-align: left"]) {
  text-align: left;
}

:deep(.ProseMirror [style*="text-align: center"]) {
  text-align: center;
}

:deep(.ProseMirror [style*="text-align: right"]) {
  text-align: right;
}

:deep(.ProseMirror [style*="text-align: justify"]) {
  text-align: justify;
}

/* Estilos para lista de tareas */
:deep(.ProseMirror ul[data-type="taskList"]) {
  list-style: none !important;
  list-style-type: none !important;
  padding-left: 0 !important;
  margin: 1em 0;
}

:deep(.ProseMirror ul[data-type="taskList"] li),
:deep(.ProseMirror li[data-type="taskItem"]) {
  display: flex !important;
  align-items: flex-start;
  margin: 0.5em 0;
  list-style: none !important;
  list-style-type: none !important;
  padding-left: 0 !important;
}

:deep(.ProseMirror ul[data-type="taskList"] li > label) {
  flex: 0 0 auto;
  margin-right: 0.5rem;
  user-select: none;
}

:deep(.ProseMirror ul[data-type="taskList"] li > div) {
  flex: 1 1 auto;
}
</style>

