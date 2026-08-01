<template>
  <div class="chord-chart-editor">
    <label class="chord-chart-editor__label" for="chordpro-source">ChordPro</label>
    <div class="chord-chart-editor__snippets" aria-label="Insertar sección">
      <button
        v-for="snip in SNIPPETS"
        :key="snip.id"
        type="button"
        class="chord-chart-editor__snip"
        :title="snip.title"
        @click="insertSnippet(snip.text)"
      >
        {{ snip.label }}
      </button>
    </div>
    <textarea
      id="chordpro-source"
      ref="textareaRef"
      class="chord-chart-editor__textarea"
      :value="modelValue"
      spellcheck="false"
      placeholder="{key: C}&#10;{start_of_verse}&#10;[Am]Ejemplo…&#10;{end_of_verse}"
      @input="onInput"
    />
    <p class="chord-chart-editor__hint">
      Acordes: <code>[Am]</code>. Tonalidad: <code>{key: C}</code> o
      <code>{key: Am}</code>. Secciones:
      <code>{start_of_verse}</code> / <code>{end_of_verse}</code>,
      <code>{start_of_chorus}</code>, <code>{start_of_bridge}</code>.
      Atajos: <code>{soc}</code>/<code>{eoc}</code>.
    </p>
    <div class="chord-chart-editor__preview-label">Vista previa</div>
    <ChordChartView :chart="previewChart" :show-key="true" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { parseChordPro } from '@/chordChart'
import ChordChartView from './ChordChartView.vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const SNIPPETS = [
  {
    id: 'verse',
    label: 'Verso',
    title: 'Insertar verso',
    text: '{start_of_verse}\n\n{end_of_verse}\n'
  },
  {
    id: 'chorus',
    label: 'Coro',
    title: 'Insertar coro',
    text: '{start_of_chorus}\n\n{end_of_chorus}\n'
  },
  {
    id: 'prechorus',
    label: 'Precoro',
    title: 'Insertar precoro',
    text: '{start_of_prechorus}\n\n{end_of_prechorus}\n'
  },
  {
    id: 'bridge',
    label: 'Puente',
    title: 'Insertar puente',
    text: '{start_of_bridge}\n\n{end_of_bridge}\n'
  },
  {
    id: 'intro',
    label: 'Intro',
    title: 'Insertar intro',
    text: '{start_of_intro}\n\n{end_of_intro}\n'
  },
  {
    id: 'comment',
    label: 'Nota',
    title: 'Insertar comentario',
    text: '{comment: }\n'
  }
] as const

const previewChart = computed(() => parseChordPro(props.modelValue || ''))

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

function insertSnippet(text: string) {
  const ta = textareaRef.value
  const current = props.modelValue || ''
  if (!ta) {
    emit('update:modelValue', current + (current && !current.endsWith('\n') ? '\n' : '') + text)
    return
  }
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const next = current.slice(0, start) + text + current.slice(end)
  emit('update:modelValue', next)
  requestAnimationFrame(() => {
    const pos = start + text.length
    ta.focus()
    ta.setSelectionRange(pos, pos)
  })
}
</script>

<style scoped>
.chord-chart-editor {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chord-chart-editor__label,
.chord-chart-editor__preview-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-soft);
}

.chord-chart-editor__snippets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.chord-chart-editor__snip {
  padding: 0.3rem 0.55rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.chord-chart-editor__snip:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.chord-chart-editor__textarea {
  width: 100%;
  min-height: 220px;
  box-sizing: border-box;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.95rem;
  line-height: 1.4;
  resize: vertical;
  tab-size: 2;
}

.chord-chart-editor__textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 20%, transparent);
}

.chord-chart-editor__hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-soft);
}

.chord-chart-editor__hint code {
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.85em;
}

@media (max-width: 768px) {
  .chord-chart-editor__textarea {
    min-height: 180px;
    font-size: 16px;
  }
}
</style>
