<script setup lang="ts">
interface FilterChipOption {
  value: string
  label: string
  title?: string
}

const props = withDefaults(
  defineProps<{
    options: FilterChipOption[]
    modelValue?: string[]
    multiple?: boolean
  }>(),
  {
    modelValue: () => [],
    multiple: true,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  change: [value: string[]]
}>()

function isSelected(value: string): boolean {
  return props.modelValue.includes(value)
}

function toggle(value: string) {
  let next: string[]
  if (props.multiple) {
    next = isSelected(value)
      ? props.modelValue.filter((v) => v !== value)
      : [...props.modelValue, value]
  } else {
    next = isSelected(value) ? [] : [value]
  }
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<template>
  <div class="filter-chip-group" role="group">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="filter-chip"
      :class="{ 'filter-chip--active': isSelected(option.value) }"
      :title="option.title || option.label"
      :aria-pressed="isSelected(option.value)"
      @click="toggle(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.filter-chip-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-soft);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color var(--transition-normal),
    border-color var(--transition-normal),
    color var(--transition-normal);
}

.filter-chip:hover {
  border-color: color-mix(in srgb, var(--color-heading) 35%, var(--color-border));
  color: var(--color-heading);
}

.filter-chip--active {
  background: color-mix(in srgb, var(--color-heading) 12%, var(--color-background));
  border-color: color-mix(in srgb, var(--color-heading) 40%, var(--color-border));
  color: var(--color-heading);
  font-weight: 600;
}

.filter-chip--active:hover {
  background: color-mix(in srgb, var(--color-heading) 18%, var(--color-background));
  color: var(--color-heading);
}
</style>
