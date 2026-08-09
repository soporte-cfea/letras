<template>
  <section class="chord-pad">
    <header class="chord-pad__header">
      <button
        type="button"
        class="chord-pad__back"
        title="Volver"
        @click="goBack"
      >
        ←
      </button>
      <div class="chord-pad__titles">
        <h1 class="chord-pad__title">Transportar acordes</h1>
        <p class="chord-pad__subtitle">
          Anota una progresión y pásala a otra tonalidad. No se guarda en ninguna canción.
        </p>
      </div>
    </header>

    <div class="chord-pad__body">
      <label class="chord-pad__label" for="chord-pad-input">Acordes (origen)</label>
      <textarea
        id="chord-pad-input"
        v-model="input"
        class="chord-pad__textarea"
        rows="4"
        spellcheck="false"
        placeholder="Ej: Am F C G&#10;o: Am, F | C G"
      />

      <div class="chord-pad__keys">
        <KeySelector
          v-model="fromKey"
          label="De (tonalidad original)"
        />
        <KeySelector
          v-model="toKey"
          label="A (tonalidad destino)"
        />
      </div>

      <div class="chord-pad__stepper" role="group" aria-label="Ajuste fino">
        <button
          type="button"
          class="chord-pad__step"
          title="Bajar semitono"
          @click="nudge(-1)"
        >
          −
        </button>
        <span class="chord-pad__offset" :title="offsetTitle">
          {{ offsetLabel }}
        </span>
        <button
          type="button"
          class="chord-pad__step"
          title="Subir semitono"
          @click="nudge(1)"
        >
          +
        </button>
        <button
          type="button"
          class="chord-pad__ghost"
          :disabled="semitones === 0 && !input.trim()"
          @click="resetAll"
        >
          Limpiar
        </button>
      </div>

      <div class="chord-pad__result-block">
        <div class="chord-pad__result-head">
          <span class="chord-pad__label">Resultado</span>
          <button
            type="button"
            class="chord-pad__copy"
            :disabled="!output"
            @click="copyOutput"
          >
            Copiar
          </button>
        </div>
        <div
          class="chord-pad__result"
          :class="{ 'chord-pad__result--empty': !output }"
          aria-live="polite"
        >
          {{ output || 'Escribe acordes arriba para ver el resultado.' }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import KeySelector from '@/components/common/KeySelector.vue'
import { useNotifications } from '@/composables/useNotifications'
import {
  semitonesBetweenKeys,
  transposeChordSequence,
  transposeKeyLabel
} from '@/tools/chordPad'

const router = useRouter()
const { success, error: showError } = useNotifications()

const input = ref('')
const fromKey = ref<string | null>(null)
const toKey = ref<string | null>(null)
/** Offset manual cuando no hay par de tonalidades. */
const manualOffset = ref(0)

const keyDistance = computed(() =>
  semitonesBetweenKeys(fromKey.value, toKey.value)
)

const semitones = computed(() => {
  if (keyDistance.value !== null) return keyDistance.value
  return manualOffset.value
})

/** Etiqueta legible (−5 … +6) sin cambiar el resultado musical. */
const displaySemitones = computed(() => {
  const n = semitones.value
  if (n > 6) return n - 12
  return n
})

const offsetLabel = computed(() => {
  const n = displaySemitones.value
  if (n === 0) return '0'
  return n > 0 ? `+${n}` : `${n}`
})

const offsetTitle = computed(() => {
  if (fromKey.value && toKey.value) {
    return `${fromKey.value} → ${toKey.value}`
  }
  return `Desplazamiento: ${offsetLabel.value}`
})

const output = computed(() => {
  const raw = input.value.trim()
  if (!raw) return ''
  return transposeChordSequence(input.value, semitones.value)
})

watch([fromKey, toKey], () => {
  if (fromKey.value && toKey.value) {
    manualOffset.value = 0
  }
})

function nudge(delta: number) {
  if (fromKey.value && toKey.value) {
    toKey.value = transposeKeyLabel(toKey.value, delta)
    return
  }
  if (fromKey.value && !toKey.value) {
    toKey.value = transposeKeyLabel(fromKey.value, delta)
    return
  }
  if (toKey.value && !fromKey.value) {
    toKey.value = transposeKeyLabel(toKey.value, delta)
  }
  let next = manualOffset.value + delta
  if (next > 11) next -= 12
  if (next < -11) next += 12
  manualOffset.value = next
}

function resetAll() {
  input.value = ''
  fromKey.value = null
  toKey.value = null
  manualOffset.value = 0
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push({ name: 'mas' })
  }
}

async function copyOutput() {
  if (!output.value) return
  try {
    await navigator.clipboard.writeText(output.value)
    success('Copiado', 'Progresión copiada al portapapeles.')
  } catch {
    showError('Error', 'No se pudo copiar al portapapeles.')
  }
}
</script>

<style scoped>
.chord-pad {
  min-height: 100vh;
  background: var(--color-background);
  padding-bottom: 5rem;
}

.chord-pad__header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.15rem 0.85rem;
  border-bottom: 1px solid var(--color-border);
}

.chord-pad__back {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  margin-top: 0.1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-card);
  color: var(--color-text);
  font-size: 1.15rem;
  cursor: pointer;
}

.chord-pad__back:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.chord-pad__title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-heading, var(--color-text));
}

.chord-pad__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
  line-height: 1.35;
}

.chord-pad__body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.1rem 1.15rem;
  max-width: 40rem;
}

.chord-pad__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-soft);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.chord-pad__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background-card);
  color: var(--color-text);
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1.45;
  letter-spacing: 0.02em;
  resize: vertical;
  font-family: inherit;
}

.chord-pad__textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.chord-pad__keys {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.chord-pad__stepper {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.chord-pad__step {
  width: 2.6rem;
  height: 2.6rem;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-background-card);
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 600;
  cursor: pointer;
}

.chord-pad__step:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.chord-pad__offset {
  min-width: 2.75rem;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-accent);
}

.chord-pad__ghost {
  margin-left: 0.35rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-soft);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.chord-pad__ghost:hover:not(:disabled) {
  color: var(--color-text);
  border-color: var(--color-text-soft);
}

.chord-pad__ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chord-pad__result-block {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-top: 0.35rem;
}

.chord-pad__result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.chord-pad__copy {
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 8px;
  background: var(--color-accent);
  color: var(--color-text-inverse, #fff);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.chord-pad__copy:hover:not(:disabled) {
  filter: brightness(1.06);
}

.chord-pad__copy:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.chord-pad__result {
  min-height: 5.5rem;
  padding: 1rem 1.1rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-accent) 8%, var(--color-background-card));
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: 0.02em;
  word-break: break-word;
  white-space: pre-wrap;
}

.chord-pad__result--empty {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-soft);
  background: var(--color-background-card);
}

@media (max-width: 560px) {
  .chord-pad__keys {
    grid-template-columns: 1fr;
  }

  .chord-pad__textarea,
  .chord-pad__result {
    font-size: 1.2rem;
  }
}
</style>
