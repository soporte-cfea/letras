<template>
  <Transition name="slide-down">
    <div v-if="!isOnline" class="network-status-bar">
      <div class="color-indicator"></div>
      <div class="status-content">
        <span class="status-text">Sin conexión</span>
        <span class="status-subtext">Modo offline</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const { isOnline } = useNetworkStatus()
</script>

<style scoped>
.network-status-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-soft);
  font-size: 0.875rem;
  transition: all var(--transition-normal);
  width: 100%;
}

.color-indicator {
  width: 4px;
  height: 100%;
  min-height: 24px;
  background: var(--color-error);
  border-radius: 2px;
  flex-shrink: 0;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.status-text {
  font-weight: 500;
  color: var(--color-text);
}

.status-subtext {
  color: var(--color-text-mute);
  font-size: 0.8125rem;
}

/* Mobile-first */
@media (max-width: 900px) {
  .network-status-bar {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }
  
  .status-subtext {
    font-size: 0.75rem;
  }
  
  .color-indicator {
    min-height: 20px;
  }
}

/* Desktop: ajustar para sidebar */
@media (min-width: 901px) {
  .network-status-bar {
    margin-left: 80px;
    width: calc(100% - 80px);
  }
}

/* Animación */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: max-height var(--transition-normal), opacity var(--transition-normal), padding var(--transition-normal), margin var(--transition-normal);
  max-height: 60px;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin: 0;
}
</style>

