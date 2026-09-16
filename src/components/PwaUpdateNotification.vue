<template>
  <Transition name="slide-down">
    <div v-if="needRefresh" class="pwa-update-notification">
      <div class="pwa-update-content">
        <div class="pwa-update-icon">✨</div>
        <div class="pwa-update-text">
          <h4 class="pwa-update-title">Nueva versión de la app</h4>
          <p class="pwa-update-message">Hay una actualización lista. Recarga para aplicarla.</p>
        </div>
      </div>
      <div class="pwa-update-actions">
        <button
          class="pwa-button pwa-button-primary"
          :disabled="updating"
          @click="applyUpdate"
        >
          <span v-if="updating">Recargando...</span>
          <span v-else>Recargar</span>
        </button>
        <button
          class="pwa-button pwa-button-secondary"
          :disabled="updating"
          @click="dismiss"
        >
          Más tarde
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { usePwaUpdate } from '@/composables/usePwaUpdate'

const { needRefresh, updating, applyUpdate, dismiss } = usePwaUpdate()
</script>

<style scoped>
.pwa-update-notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10001;
  background: var(--color-background);
  border: 2px solid var(--color-primary, #3b82f6);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 20px;
  max-width: 500px;
  width: calc(100% - 40px);
  margin: 0 20px;
}

.pwa-update-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.pwa-update-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.pwa-update-text {
  flex: 1;
}

.pwa-update-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.pwa-update-message {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary, #666);
}

.pwa-update-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.pwa-button {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.pwa-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pwa-button-primary {
  background: var(--color-primary, #3b82f6);
  color: white;
}

.pwa-button-primary:hover:not(:disabled) {
  background: var(--color-primary-dark, #2563eb);
}

.pwa-button-secondary {
  background: var(--color-background-secondary, #f3f4f6);
  color: var(--color-text);
  border: 1px solid var(--color-border, #e5e7eb);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

@media (max-width: 640px) {
  .pwa-update-notification {
    width: calc(100% - 20px);
    margin: 0 10px;
    padding: 16px;
  }

  .pwa-update-actions {
    flex-direction: column;
  }

  .pwa-button {
    width: 100%;
  }
}
</style>
