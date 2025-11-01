<template>
  <span 
    :class="['tag', variantClass, sizeClass]"
    :title="tag"
  >
    {{ tag }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  tag: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}>();

const variantClass = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'tag--primary';
    case 'secondary':
      return 'tag--secondary';
    case 'accent':
      return 'tag--accent';
    default:
      return 'tag--default';
  }
});

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'tag--sm';
    case 'lg':
      return 'tag--lg';
    default:
      return 'tag--md';
  }
});
</script>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  font-weight: 400;
  transition: all var(--transition-normal);
  white-space: nowrap;
}

/* Variantes */
.tag--default {
  background: var(--color-background-soft);
  color: var(--color-text-soft);
  border: 1px solid var(--color-border);
}

.tag--primary {
  background: var(--color-background-card);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.tag--secondary {
  background: var(--color-background-mute);
  color: var(--color-text-mute);
  border: 1px solid var(--color-border);
}

.tag--accent {
  background: var(--color-background-soft);
  color: var(--color-text-soft);
  border: 1px solid var(--color-border);
}

/* Tamaños */
.tag--sm {
  padding: 0.125rem 0.375rem;
  font-size: 0.6875rem;
}

.tag--md {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.tag--lg {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

/* Estados hover */
.tag--default:hover,
.tag--primary:hover,
.tag--secondary:hover {
  background: var(--color-background-hover);
  border-color: var(--color-border);
  color: var(--color-text);
}

.tag--accent:hover {
  background: var(--color-background-hover);
  border-color: var(--color-border);
  color: var(--color-text);
}
</style>
