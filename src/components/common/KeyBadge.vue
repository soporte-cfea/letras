<template>
  <span 
    :class="['key-badge', sizeClass]"
    :title="formattedKey"
  >
    <span class="key-badge-text">{{ displayKey }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatKeyForDisplay } from '@/utils/keyUtils'

const props = defineProps<{
  keyValue: string
  size?: 'sm' | 'md' | 'lg'
}>()

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'key-badge--sm'
    case 'lg':
      return 'key-badge--lg'
    default:
      return 'key-badge--md'
  }
})

const formattedKey = computed(() => formatKeyForDisplay(props.keyValue))

const displayKey = computed(() => {
  // Mostrar solo la notación corta (C, Am, F#, etc.)
  return props.keyValue
})
</script>

<style scoped>
.key-badge {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(var(--cf-navy-rgb, 30, 58, 138), 0.1), rgba(var(--cf-navy-rgb, 30, 58, 138), 0.05));
  color: var(--cf-navy);
  border: 1px solid rgba(var(--cf-navy-rgb, 30, 58, 138), 0.2);
  border-radius: 8px;
  font-weight: 600;
  transition: all var(--transition-normal);
  white-space: nowrap;
}

.key-badge:hover {
  background: linear-gradient(135deg, rgba(var(--cf-navy-rgb, 30, 58, 138), 0.15), rgba(var(--cf-navy-rgb, 30, 58, 138), 0.1));
  border-color: rgba(var(--cf-navy-rgb, 30, 58, 138), 0.3);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(var(--cf-navy-rgb, 30, 58, 138), 0.1);
}

.key-badge-text {
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
  letter-spacing: 0.5px;
}

/* Tamaños */
.key-badge--sm {
  padding: 0.125rem 0.5rem;
  font-size: 0.6875rem;
}

.key-badge--md {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
}

.key-badge--lg {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}
</style>

