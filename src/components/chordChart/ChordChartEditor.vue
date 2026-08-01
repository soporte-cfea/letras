<template>
  <div class="chord-chart-editor">
    <label class="chord-chart-editor__label" for="chordpro-source">ChordPro</label>
    <textarea
      id="chordpro-source"
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
      <code>{start_of_chorus}</code>, <code>{start_of_bridge}</code>,
      <code>{start_of_prechorus}</code>. Atajos:
      <code>{soc}</code>/<code>{eoc}</code>. Marcador libre:
      <code>{comment: Intro}</code>.
    </p>
    <div class="chord-chart-editor__preview-label">Vista previa</div>
    <ChordChartView :chart="previewChart" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { parseChordPro } from '@/chordChart'
import ChordChartView from './ChordChartView.vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const previewChart = computed(() => parseChordPro(props.modelValue || ''))

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
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
    font-size: 16px; /* evita zoom iOS */
  }
}
</style>
