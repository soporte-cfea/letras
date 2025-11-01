<template>
  <div class="help-icon-wrapper" ref="containerRef">
    <button
      ref="iconRef"
      type="button"
      class="help-icon-btn"
      @click.stop="toggleTooltip"
      :aria-label="title || 'Ayuda'"
      :aria-expanded="showTooltip"
      :title="title || 'Ver ayuda'"
    >
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <path d="M12 17h.01"/>
      </svg>
    </button>

    <!-- Tooltip/Popover -->
    <Transition name="tooltip">
      <div
        v-if="showTooltip"
        ref="tooltipRef"
        class="help-tooltip"
        :style="tooltipStyle"
        @click.stop
      >
        <div class="tooltip-header">
          <h4 class="tooltip-title">{{ title || 'Ayuda' }}</h4>
          <button
            type="button"
            class="tooltip-close"
            @click.stop="showTooltip = false"
            aria-label="Cerrar ayuda"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="tooltip-content">
          <slot />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';

interface Props {
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Ayuda',
});

const iconRef = ref<HTMLButtonElement | null>(null);
const tooltipRef = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);

const showTooltip = ref(false);
const tooltipStyle = ref<Record<string, string>>({});

function toggleTooltip() {
  showTooltip.value = !showTooltip.value;
  if (showTooltip.value) {
    nextTick(() => {
      positionTooltip();
    });
  }
}

function positionTooltip() {
  if (!iconRef.value || !tooltipRef.value || !showTooltip.value) {
    return;
  }

  nextTick(() => {
    requestAnimationFrame(() => {
      if (!tooltipRef.value || !iconRef.value || !showTooltip.value) return;

      const iconRect = iconRef.value.getBoundingClientRect();
      const tooltipRect = tooltipRef.value.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 8;

      // Intentar posicionar a la derecha del icono
      let left = iconRect.right + 8;
      let top = iconRect.top;

      // Si no cabe a la derecha, ponerlo a la izquierda
      if (left + tooltipRect.width > viewportWidth - margin) {
        left = iconRect.left - tooltipRect.width - 8;
      }

      // Si no cabe a la izquierda, centrarlo
      if (left < margin) {
        left = (viewportWidth - tooltipRect.width) / 2;
      }

      // Ajustar verticalmente si no cabe
      if (top + tooltipRect.height > viewportHeight - margin) {
        top = viewportHeight - tooltipRect.height - margin;
      }

      if (top < margin) {
        top = margin;
      }

      tooltipStyle.value = {
        top: `${top}px`,
        left: `${left}px`,
      };
    });
  });
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;
  if (showTooltip.value && tooltipRef.value && !tooltipRef.value.contains(target) && 
      iconRef.value && !iconRef.value.contains(target)) {
    showTooltip.value = false;
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && showTooltip.value) {
    showTooltip.value = false;
    iconRef.value?.focus();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscape);
  window.addEventListener('resize', positionTooltip);
  window.addEventListener('scroll', positionTooltip, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscape);
  window.removeEventListener('resize', positionTooltip);
  window.removeEventListener('scroll', positionTooltip, true);
});
</script>

<style scoped>
.help-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.help-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--color-text-soft);
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
  flex-shrink: 0;
  /* Aumentar área clickeable */
  min-width: 24px;
  min-height: 24px;
}

.help-icon-btn:hover {
  color: var(--color-text);
  background: var(--color-background-hover);
}

.help-icon-btn:active {
  transform: scale(0.95);
}

.help-icon-btn:focus-visible {
  outline: 2px solid var(--color-info);
  outline-offset: 2px;
}

.help-icon-btn svg {
  width: 18px;
  height: 18px;
  stroke-width: 2.5;
}

.help-tooltip {
  position: fixed;
  z-index: 9999;
  min-width: 280px;
  max-width: 400px;
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.tooltip-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.tooltip-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--color-text-soft);
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
}

.tooltip-close:hover {
  color: var(--color-text);
  background: var(--color-background-hover);
}

.tooltip-close svg {
  width: 14px;
  height: 14px;
  stroke-width: 2;
}

.tooltip-content {
  padding: 1rem;
}

/* Estilos para contenido del tooltip (secciones, etc.) */
.tooltip-content :deep(.tooltip-section) {
  margin-bottom: 1rem;
}

.tooltip-content :deep(.tooltip-section:last-child) {
  margin-bottom: 0;
}

/* Transiciones */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}

.tooltip-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}

.tooltip-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}
</style>

