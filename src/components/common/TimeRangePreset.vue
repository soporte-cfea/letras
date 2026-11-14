<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import DateRangeFilter from './DateRangeFilter.vue'
import {
  TIME_PRESET_OPTIONS,
  getPresetLabel,
  getRangeForPreset,
  type DateRangeValue,
  type TimePresetId,
} from '@/utils/dateRange'

const props = withDefaults(
  defineProps<{
    modelValue?: DateRangeValue
    preset?: TimePresetId
  }>(),
  {
    modelValue: null,
    preset: 'next-30',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: DateRangeValue]
  'update:preset': [value: TimePresetId]
  change: [payload: { preset: TimePresetId; range: DateRangeValue }]
}>()

const menuOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const dateFilterRef = ref<{ openPicker: () => void } | null>(null)

const activePreset = computed({
  get: () => props.preset,
  set: (val: TimePresetId) => emit('update:preset', val),
})

const range = computed({
  get: () => props.modelValue,
  set: (val: DateRangeValue) => emit('update:modelValue', val),
})

const triggerLabel = computed(() =>
  getPresetLabel(activePreset.value, range.value)
)

const presetChoices = TIME_PRESET_OPTIONS.filter((o) => o.id !== 'custom')

function emitChange(preset: TimePresetId, nextRange: DateRangeValue) {
  emit('change', { preset, range: nextRange })
}

function isInsidePickerPopper(target: Node): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest('.el-picker__popper') ||
      target.closest('.el-date-range-picker') ||
      target.closest('.el-picker-panel') ||
      target.closest('.el-popper')
  )
}

function selectPreset(id: Exclude<TimePresetId, 'custom'>) {
  activePreset.value = id
  const next = getRangeForPreset(id)
  range.value = next
  emitChange(id, next)
  menuOpen.value = false
}

async function selectCustom() {
  // Solo abre el datepicker; el preset pasa a custom al confirmar un rango
  menuOpen.value = false
  if (!range.value) {
    range.value = getRangeForPreset('next-30')
  }
  await nextTick()
  dateFilterRef.value?.openPicker()
}

function onCustomRangeChange(val: DateRangeValue) {
  if (!val) return
  activePreset.value = 'custom'
  range.value = val
  emitChange('custom', val)
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function onDocPointerDown(event: PointerEvent) {
  const target = event.target as Node | null
  if (!target || !rootRef.value) return
  if (rootRef.value.contains(target)) return
  if (isInsidePickerPopper(target)) return
  menuOpen.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') menuOpen.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, true)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="rootRef" class="time-range-preset">
    <button
      type="button"
      class="time-range-preset__trigger"
      :aria-expanded="menuOpen"
      aria-haspopup="listbox"
      @click="toggleMenu"
    >
      <svg
        class="time-range-preset__icon"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span class="time-range-preset__label">{{ triggerLabel }}</span>
      <svg
        class="time-range-preset__caret"
        :class="{ 'time-range-preset__caret--open': menuOpen }"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <!-- Ancla del datepicker: fuera del menú, no se desmonta al cerrarlo -->
    <div class="time-range-preset__picker-anchor">
      <DateRangeFilter
        ref="dateFilterRef"
        :model-value="range"
        :clearable="false"
        @update:model-value="onCustomRangeChange"
      />
    </div>

    <div
      v-if="menuOpen"
      class="time-range-preset__menu"
      role="listbox"
      :aria-activedescendant="`preset-${activePreset}`"
    >
      <button
        v-for="option in presetChoices"
        :id="`preset-${option.id}`"
        :key="option.id"
        type="button"
        role="option"
        class="time-range-preset__option"
        :class="{ 'time-range-preset__option--active': activePreset === option.id }"
        :aria-selected="activePreset === option.id"
        @click="selectPreset(option.id)"
      >
        {{ option.label }}
      </button>

      <div class="time-range-preset__divider" />

      <button
        id="preset-custom"
        type="button"
        role="option"
        class="time-range-preset__option"
        :class="{ 'time-range-preset__option--active': activePreset === 'custom' }"
        :aria-selected="activePreset === 'custom'"
        @click="selectCustom"
      >
        Rango personalizado
      </button>
    </div>
  </div>
</template>

<style scoped>
.time-range-preset {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  max-width: 100%;
}

.time-range-preset__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  max-width: 100%;
  height: 32px;
  padding: 0 0.55rem 0 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-background-card);
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color var(--transition-normal),
    background-color var(--transition-normal),
    color var(--transition-normal);
}

.time-range-preset__trigger:hover {
  border-color: color-mix(in srgb, var(--color-heading) 30%, var(--color-border));
  background: var(--color-background-soft);
}

.time-range-preset__icon,
.time-range-preset__caret {
  flex-shrink: 0;
  color: var(--color-text-mute);
}

.time-range-preset__caret {
  transition: transform 0.15s ease;
}

.time-range-preset__caret--open {
  transform: rotate(180deg);
}

.time-range-preset__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 11.5rem;
}

.time-range-preset__picker-anchor {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: -1;
}

.time-range-preset__menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 40;
  min-width: 13.5rem;
  padding: 0.35rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background-card);
  box-shadow: var(--shadow-md);
}

.time-range-preset__option {
  display: flex;
  width: 100%;
  align-items: center;
  padding: 0.45rem 0.6rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text);
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;
}

.time-range-preset__option:hover {
  background: var(--color-background-soft);
}

.time-range-preset__option--active {
  background: color-mix(in srgb, var(--color-heading) 10%, var(--color-background));
  color: var(--color-heading);
  font-weight: 600;
}

.time-range-preset__divider {
  height: 1px;
  margin: 0.3rem 0.35rem;
  background: var(--color-border);
}
</style>
