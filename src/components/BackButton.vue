<template>
  <button 
    @click="handleClick" 
    class="back-btn"
    :title="title"
  >
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
    <span v-if="showLabel" class="back-label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

interface Props {
  to?: string
  label?: string
  showLabel?: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  to: undefined,
  label: 'Volver',
  showLabel: false,
  title: 'Volver atrás'
})

const router = useRouter()

function handleClick() {
  if (props.to) {
    router.push(props.to)
  } else {
    router.back()
  }
}
</script>

<style scoped>
.back-btn {
  background: none;
  border: none;
  color: var(--color-text-mute);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.back-btn:hover {
  background: var(--color-background-hover);
  color: var(--color-text);
}

.back-label {
  font-size: 0.9rem;
  font-weight: 500;
}
</style>

