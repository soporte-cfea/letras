<template>
  <button 
    @click="handleClick" 
    class="refresh-btn"
    :class="{ refreshing: refreshing }"
    :title="title"
    :disabled="disabled"
  >
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M1 4v6h6M23 20v-6h-6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  onClick: () => Promise<void> | void
  title?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Recargar',
  disabled: false
})

const refreshing = ref(false)

async function handleClick() {
  if (refreshing.value || props.disabled) return
  
  refreshing.value = true
  try {
    await props.onClick()
  } catch (err) {
    console.error('Error in refresh action:', err)
  } finally {
    refreshing.value = false
  }
}
</script>

<style scoped>
.refresh-btn {
  background: transparent;
  color: var(--color-text-mute);
  border: 1px solid transparent;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  opacity: 0.7;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-background-hover);
  color: var(--color-text);
  border-color: var(--color-border);
  opacity: 1;
}

.refresh-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-btn.refreshing {
  animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  opacity: 1;
  color: var(--color-accent, #3b82f6);
}

.refresh-btn.refreshing:hover {
  background: var(--color-background-hover);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

