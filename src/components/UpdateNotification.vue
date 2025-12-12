<template>
  <Transition name="slide-down">
    <div v-if="show" class="update-notification">
      <div class="update-notification-content">
        <div class="update-notification-icon">🔄</div>
        <div class="update-notification-text">
          <h4 class="update-notification-title">Hay actualizaciones disponibles</h4>
          <p class="update-notification-message">
            <span v-if="hasSongsUpdates && hasCollectionsUpdates">
              Se han actualizado canciones y colecciones
            </span>
            <span v-else-if="hasSongsUpdates">
              Se han actualizado canciones
            </span>
            <span v-else-if="hasCollectionsUpdates">
              Se han actualizado colecciones
            </span>
          </p>
        </div>
      </div>
      <div class="update-notification-actions">
        <button 
          class="update-button update-button-primary" 
          @click="handleUpdate"
          :disabled="updating"
        >
          <span v-if="updating">Actualizando...</span>
          <span v-else>Actualizar ahora</span>
        </button>
        <button 
          class="update-button update-button-secondary" 
          @click="handleDismiss"
          :disabled="updating"
        >
          Más tarde
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUpdateChecker, saveSongsUpdateTimestamp, saveCollectionsUpdateTimestamp } from '@/composables/useUpdateChecker'
import { useCancionesStore } from '@/stores/canciones'
import { useColeccionesStore } from '@/stores/colecciones'
import { SongsService } from '@/api/songs'
import { CollectionsService } from '@/api/collections'

const {
  hasSongsUpdates,
  hasCollectionsUpdates,
  hasUpdates,
  checking,
  dismissNotification,
  clearDismissedState
} = useUpdateChecker()

const cancionesStore = useCancionesStore()
const coleccionesStore = useColeccionesStore()

const updating = ref(false)

const show = computed(() => {
  return hasUpdates() && !checking.value
})

async function handleUpdate() {
  updating.value = true
  clearDismissedState()

  try {
    // Actualizar canciones si hay actualizaciones
    if (hasSongsUpdates.value) {
      await cancionesStore.loadCanciones(true) // forceRefresh = true
      // El timestamp se guarda automáticamente en el store al cargar
    }

    // Actualizar colecciones si hay actualizaciones
    if (hasCollectionsUpdates.value) {
      await coleccionesStore.loadColecciones(true) // forceRefresh = true
      // El timestamp se guarda automáticamente en el store al cargar
    }
  } catch (error) {
    console.error('Error updating data:', error)
  } finally {
    updating.value = false
  }
}

function handleDismiss() {
  dismissNotification()
}
</script>

<style scoped>
.update-notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  background: var(--color-background);
  border: 2px solid var(--color-primary, #3b82f6);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 20px;
  max-width: 500px;
  width: calc(100% - 40px);
  margin: 0 20px;
}

.update-notification-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.update-notification-icon {
  font-size: 24px;
  flex-shrink: 0;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.update-notification-text {
  flex: 1;
}

.update-notification-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.update-notification-message {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary, #666);
}

.update-notification-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.update-button {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.update-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.update-button-primary {
  background: var(--color-primary, #3b82f6);
  color: white;
}

.update-button-primary:hover:not(:disabled) {
  background: var(--color-primary-dark, #2563eb);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.update-button-secondary {
  background: var(--color-background-secondary, #f3f4f6);
  color: var(--color-text);
  border: 1px solid var(--color-border, #e5e7eb);
}

.update-button-secondary:hover:not(:disabled) {
  background: var(--color-background-tertiary, #e5e7eb);
}

/* Animación de entrada/salida */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

@media (max-width: 640px) {
  .update-notification {
    width: calc(100% - 20px);
    margin: 0 10px;
    padding: 16px;
  }

  .update-notification-actions {
    flex-direction: column;
  }

  .update-button {
    width: 100%;
  }
}
</style>

