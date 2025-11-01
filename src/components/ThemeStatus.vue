<template>
  <div class="theme-status" v-if="showStatus">
    <div class="status-indicator">
      <div class="status-icon">
        <svg v-if="isDark" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        <svg v-else width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      </div>
      <span class="status-text">{{ currentThemeLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { theme, isDark } = useTheme()

const props = defineProps<{
  showStatus?: boolean
}>()

const currentThemeLabel = computed(() => {
  switch (theme.value) {
    case 'light': return 'Tema Claro'
    case 'dark': return 'Tema Oscuro'
    case 'auto': return 'Automático'
    default: return 'Automático'
  }
})
</script>

<style scoped>
.theme-status {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  pointer-events: none;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(10px);
  opacity: 0.9;
  transition: all var(--transition-normal);
}

.status-icon {
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-soft);
}

@media (max-width: 640px) {
  .theme-status {
    top: 0.5rem;
    right: 0.5rem;
  }
  
  .status-indicator {
    padding: 0.375rem 0.5rem;
    gap: 0.375rem;
  }
  
  .status-icon {
    width: 14px;
    height: 14px;
  }
  
  .status-text {
    font-size: 0.7rem;
  }
}
</style>
