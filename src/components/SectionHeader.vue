<template>
  <div class="section-header" :style="{ borderLeftColor: section.color }">
    <h3 class="section-name">{{ section.name }}</h3>
    <div
      v-if="showReorderControls"
      class="section-reorder"
      @click.stop
    >
      <button
        type="button"
        class="section-reorder-btn"
        :disabled="!canMoveUp || reorderBusy"
        title="Subir sección"
        aria-label="Subir sección"
        @click="$emit('moveUp')"
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      </button>
      <button
        type="button"
        class="section-reorder-btn"
        :disabled="!canMoveDown || reorderBusy"
        title="Bajar sección"
        aria-label="Bajar sección"
        @click="$emit('moveDown')"
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CollectionSection } from '../api/sections';

interface Props {
  section: CollectionSection;
  showReorderControls?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  reorderBusy?: boolean;
}

withDefaults(defineProps<Props>(), {
  showReorderControls: false,
  canMoveUp: false,
  canMoveDown: false,
  reorderBusy: false
});

defineEmits<{
  moveUp: [];
  moveDown: [];
}>();
</script>

<style scoped>
.section-header {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  box-shadow: none;
  transition: all var(--transition-normal);
}

.section-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--transition-normal);
  flex: 1;
  min-width: 0;
}

.section-reorder {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  flex-shrink: 0;
}

.section-reorder-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text-mute);
  cursor: pointer;
  transition: color var(--transition-normal), border-color var(--transition-normal), background var(--transition-normal);
}

.section-reorder-btn:hover:not(:disabled) {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background: var(--color-background-hover);
}

.section-reorder-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .section-header {
    padding: 0.1rem 0;
  }
  
  .section-name {
    font-size: 0.9rem;
  }
}

/* Media queries específicas para teléfonos */
@media (max-width: 480px) {
  .section-header {
    padding: 0.075rem 0;
  }
  
  .section-name {
    font-size: 0.85rem;
  }
}

/* Media query adicional para teléfonos muy pequeños */
@media (max-width: 360px) {
  .section-header {
    padding: 0.05rem 0;
  }
  
  .section-name {
    font-size: 0.8rem;
  }
}
</style>
