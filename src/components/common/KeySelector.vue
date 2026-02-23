<template>
  <div class="key-selector">
    <label v-if="label" class="key-selector-label">{{ label }}</label>
    <div class="key-selector-wrapper">
      <select
        :value="modelValue"
        @change="handleChange"
        :disabled="disabled"
        class="key-select"
        :class="{ 'has-value': modelValue, 'disabled': disabled }"
      >
        <option value="">Sin tonalidad</option>
        <optgroup label="Mayor">
          <option v-for="key in majorKeys" :key="`major-${key.value}`" :value="key.value">
            {{ key.label }}
          </option>
        </optgroup>
        <optgroup label="Menor">
          <option v-for="key in minorKeys" :key="`minor-${key.value}`" :value="key.value">
            {{ key.label }}
          </option>
        </optgroup>
      </select>
      <div class="key-selector-icon">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string | null
  label?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

// Tonalidades en formato: "C" (Do Mayor), "Cm" (Do Menor), etc.
const majorKeys = [
  { value: 'C', label: 'Do (C)' },
  { value: 'C#', label: 'Do# (C#)' },
  { value: 'Db', label: 'Re♭ (Db)' },
  { value: 'D', label: 'Re (D)' },
  { value: 'D#', label: 'Re# (D#)' },
  { value: 'Eb', label: 'Mi♭ (Eb)' },
  { value: 'E', label: 'Mi (E)' },
  { value: 'F', label: 'Fa (F)' },
  { value: 'F#', label: 'Fa# (F#)' },
  { value: 'Gb', label: 'Sol♭ (Gb)' },
  { value: 'G', label: 'Sol (G)' },
  { value: 'G#', label: 'Sol# (G#)' },
  { value: 'Ab', label: 'La♭ (Ab)' },
  { value: 'A', label: 'La (A)' },
  { value: 'A#', label: 'La# (A#)' },
  { value: 'Bb', label: 'Si♭ (Bb)' },
  { value: 'B', label: 'Si (B)' }
]

const minorKeys = [
  { value: 'Cm', label: 'Do menor (Cm)' },
  { value: 'C#m', label: 'Do# menor (C#m)' },
  { value: 'Dbm', label: 'Re♭ menor (Dbm)' },
  { value: 'Dm', label: 'Re menor (Dm)' },
  { value: 'D#m', label: 'Re# menor (D#m)' },
  { value: 'Ebm', label: 'Mi♭ menor (Ebm)' },
  { value: 'Em', label: 'Mi menor (Em)' },
  { value: 'Fm', label: 'Fa menor (Fm)' },
  { value: 'F#m', label: 'Fa# menor (F#m)' },
  { value: 'Gbm', label: 'Sol♭ menor (Gbm)' },
  { value: 'Gm', label: 'Sol menor (Gm)' },
  { value: 'G#m', label: 'Sol# menor (G#m)' },
  { value: 'Abm', label: 'La♭ menor (Abm)' },
  { value: 'Am', label: 'La menor (Am)' },
  { value: 'A#m', label: 'La# menor (A#m)' },
  { value: 'Bbm', label: 'Si♭ menor (Bbm)' },
  { value: 'Bm', label: 'Si menor (Bm)' }
]

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const value = target.value || null
  emit('update:modelValue', value)
}
</script>

<style scoped>
.key-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.key-selector-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-soft);
}

.key-selector-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.key-select {
  width: 100%;
  padding: 0.625rem 2.5rem 0.625rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-card);
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.key-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(var(--cf-navy-rgb, 30, 58, 138), 0.1);
}

.key-select.has-value {
  background: rgba(var(--cf-navy-rgb, 30, 58, 138), 0.05);
  border-color: rgba(var(--cf-navy-rgb, 30, 58, 138), 0.3);
  color: var(--cf-navy);
  font-weight: 600;
}

.key-selector-icon {
  position: absolute;
  right: 2.5rem;
  pointer-events: none;
  color: var(--color-text-mute);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.key-select.has-value ~ .key-selector-icon {
  color: var(--cf-navy);
}

/* Estilo para el dropdown arrow personalizado */
.key-selector-wrapper::after {
  content: '';
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid var(--color-text-mute);
  pointer-events: none;
  z-index: 1;
}

.key-select.has-value ~ .key-selector-wrapper::after {
  border-top-color: var(--cf-navy);
}

.key-select.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--color-background-soft);
}
</style>

