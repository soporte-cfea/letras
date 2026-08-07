<template>
  <div class="chord-chart-toolbar">
    <div class="chord-chart-toolbar__transpose" role="group" aria-label="Transponer">
      <button
        type="button"
        class="chord-chart-toolbar__step"
        title="Bajar semitono (−)"
        @click="$emit('transpose', -1)"
      >
        −
      </button>
      <strong class="chord-chart-toolbar__key-value" :title="displayKey || 'Sin tonalidad'">
        {{ displayKey || '—' }}
      </strong>
      <button
        type="button"
        class="chord-chart-toolbar__step"
        title="Subir semitono (+)"
        @click="$emit('transpose', 1)"
      >
        +
      </button>
      <span
        v-if="transposeSemitones !== 0"
        class="chord-chart-toolbar__offset"
        :title="`Desplazamiento: ${transposeSemitones > 0 ? '+' : ''}${transposeSemitones}`"
      >
        {{ transposeSemitones > 0 ? '+' : '' }}{{ transposeSemitones }}
      </span>
      <button
        type="button"
        class="chord-chart-toolbar__reset"
        title="Restablecer tonalidad guardada"
        :disabled="transposeSemitones === 0"
        @click="$emit('reset')"
      >
        ↻
      </button>
      <button
        v-if="canPersist && transposeSemitones !== 0"
        type="button"
        class="chord-chart-toolbar__persist"
        title="Guardar chart en esta tonalidad"
        :disabled="persistDisabled"
        @click="$emit('persist')"
      >
        Guardar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  displayKey?: string
  transposeSemitones: number
  /** Mostrar acción para persistir el transpose en el chart. */
  canPersist?: boolean
  persistDisabled?: boolean
}>()

defineEmits<{
  transpose: [delta: number]
  reset: []
  persist: []
}>()
</script>

<style scoped>
.chord-chart-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0.35rem 0.15rem 0.65rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 0.65rem;
}

.chord-chart-toolbar__transpose {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.15rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-background-card);
}

.chord-chart-toolbar__step {
  width: 2.6rem;
  height: 2.6rem;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}

.chord-chart-toolbar__step:hover {
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
  color: var(--color-accent);
}

.chord-chart-toolbar__key-value {
  min-width: 2.75rem;
  padding: 0 0.35rem;
  text-align: center;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--color-text);
}

.chord-chart-toolbar__offset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.6rem;
  padding: 0.1rem 0.35rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-accent) 16%, transparent);
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 700;
}

.chord-chart-toolbar__reset {
  width: 2.35rem;
  height: 2.35rem;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--color-text-soft);
  font-size: 1.15rem;
  line-height: 1;
  cursor: pointer;
}

.chord-chart-toolbar__reset:hover:not(:disabled) {
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
}

.chord-chart-toolbar__reset:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.chord-chart-toolbar__persist {
  margin-left: 0.2rem;
  padding: 0.35rem 0.7rem;
  border: none;
  border-radius: 9px;
  background: var(--color-accent);
  color: var(--color-text-inverse, #fff);
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;
  white-space: nowrap;
}

.chord-chart-toolbar__persist:hover:not(:disabled) {
  filter: brightness(1.06);
}

.chord-chart-toolbar__persist:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .chord-chart-toolbar__step {
    width: 2.85rem;
    height: 2.85rem;
  }

  .chord-chart-toolbar__key-value {
    min-width: 3rem;
    font-size: 1.2rem;
  }
}
</style>
