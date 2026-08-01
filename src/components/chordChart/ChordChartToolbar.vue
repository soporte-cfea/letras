<template>
  <div class="chord-chart-toolbar">
    <div class="chord-chart-toolbar__key">
      <span class="chord-chart-toolbar__label">Tonalidad</span>
      <strong>{{ displayKey || '—' }}</strong>
      <span v-if="modeLabel" class="chord-chart-toolbar__mode">{{ modeLabel }}</span>
      <span v-if="transposeSemitones !== 0" class="chord-chart-toolbar__offset">
        ({{ transposeSemitones > 0 ? '+' : '' }}{{ transposeSemitones }})
      </span>
    </div>
    <div class="chord-chart-toolbar__actions">
      <button
        type="button"
        class="chord-chart-toolbar__btn"
        title="Reducir texto"
        @click="$emit('font-delta', -1)"
      >
        A−
      </button>
      <button
        type="button"
        class="chord-chart-toolbar__btn"
        title="Aumentar texto"
        @click="$emit('font-delta', 1)"
      >
        A+
      </button>
      <button type="button" class="chord-chart-toolbar__btn" title="Bajar semitono (−)" @click="$emit('transpose', -1)">
        −1
      </button>
      <button type="button" class="chord-chart-toolbar__btn" title="Subir semitono (+)" @click="$emit('transpose', 1)">
        +1
      </button>
      <button
        type="button"
        class="chord-chart-toolbar__btn"
        title="Restablecer tonalidad guardada"
        :disabled="transposeSemitones === 0"
        @click="$emit('reset')"
      >
        Reset
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { parseKey } from '@/chordChart'

const props = defineProps<{
  displayKey?: string
  transposeSemitones: number
}>()

defineEmits<{
  transpose: [delta: number]
  reset: []
  'font-delta': [delta: number]
}>()

const modeLabel = computed(() => {
  const parsed = parseKey(props.displayKey)
  if (!parsed) return ''
  return parsed.mode === 'minor' ? 'menor' : 'mayor'
})
</script>

<style scoped>
.chord-chart-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.25rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 0.75rem;
}

.chord-chart-toolbar__key {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  font-size: 0.95rem;
  color: var(--color-text);
}

.chord-chart-toolbar__label {
  color: var(--color-text-soft);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.chord-chart-toolbar__mode {
  color: var(--color-text-soft);
  font-size: 0.85rem;
  font-weight: 500;
}

.chord-chart-toolbar__offset {
  color: var(--color-text-soft);
  font-size: 0.85rem;
  font-weight: 500;
}

.chord-chart-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.chord-chart-toolbar__btn {
  min-width: 2.5rem;
  min-height: 2.5rem;
  padding: 0.4rem 0.55rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background-card);
  color: var(--color-text);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}

.chord-chart-toolbar__btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.chord-chart-toolbar__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .chord-chart-toolbar__btn {
    min-width: 2.75rem;
    min-height: 2.75rem;
  }
}
</style>
