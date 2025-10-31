<template>
  <button
    @click="toggleTheme"
    class="theme-toggle"
    :title="`Cambiar a tema ${nextTheme}`"
    aria-label="Cambiar tema"
  >
    <div class="theme-toggle-icon">
      <!-- Icono de sol (tema claro) -->
      <svg 
        v-if="isDark" 
        class="theme-icon sun-icon"
        width="20" 
        height="20" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
      
      <!-- Icono de luna (tema oscuro) -->
      <svg 
        v-else 
        class="theme-icon moon-icon"
        width="20" 
        height="20" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </div>
    
    <!-- Indicador de estado -->
    <div class="theme-indicator">
      <span class="theme-label">{{ currentThemeLabel }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { theme, isDark, toggleTheme } = useTheme()

const currentThemeLabel = computed(() => {
  switch (theme.value) {
    case 'light': return 'Claro'
    case 'dark': return 'Oscuro'
    case 'auto': return 'Auto'
    default: return 'Auto'
  }
})

const nextTheme = computed(() => {
  switch (theme.value) {
    case 'light': return 'oscuro'
    case 'dark': return 'automático'
    case 'auto': return 'claro'
    default: return 'claro'
  }
})
</script>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-normal);
  font-size: 0.875rem;
  font-weight: 500;
  min-width: 100px;
  justify-content: center;
}

.theme-toggle:hover {
  background: var(--color-background-hover);
  border-color: var(--color-border-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.theme-toggle:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.theme-toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.theme-icon {
  transition: all var(--transition-normal);
  color: var(--color-accent);
}

.sun-icon {
  animation: rotate 0.5s ease-in-out;
}

.moon-icon {
  animation: fadeIn 0.3s ease-in-out;
}

.theme-indicator {
  display: flex;
  align-items: center;
}

.theme-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-soft);
  transition: color var(--transition-normal);
}

.theme-toggle:hover .theme-label {
  color: var(--color-text);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Versión compacta para móviles */
@media (max-width: 640px) {
  .theme-toggle {
    padding: 0.375rem 0.5rem;
    min-width: 80px;
    gap: 0.375rem;
  }
  
  .theme-toggle-icon {
    width: 18px;
    height: 18px;
  }
  
  .theme-icon {
    width: 18px;
    height: 18px;
  }
  
  .theme-label {
    font-size: 0.7rem;
  }
}

/* Versión solo icono */
.theme-toggle.icon-only {
  min-width: auto;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
  justify-content: center;
}

.theme-toggle.icon-only .theme-indicator {
  display: none;
}

@media (max-width: 480px) {
  .theme-toggle.icon-only {
    width: 36px;
    height: 36px;
  }
}
</style>
