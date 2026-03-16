<template>
  <div
    v-if="show"
    class="modal-overlay fixed inset-0 z-[1100] flex items-center justify-center p-2 sm:p-4"
    :class="{ 'modal-overlay-transparent': transparentOverlay }"
    @click.self="$emit('close')"
  >
    <div class="modal-content rounded-xl shadow-lg w-full max-w-md mx-2 p-6 sm:p-8 relative animate-fade-in max-h-[90vh] overflow-y-auto" @click.stop>
      <button @click="$emit('close')" class="modal-close-btn absolute top-3 right-3 text-xl font-bold z-10">&times;</button>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ show: boolean; transparentOverlay?: boolean }>(),
  { transparentOverlay: false }
);
</script>

<style scoped>
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-overlay.modal-overlay-transparent {
  background: transparent !important;
  backdrop-filter: none !important;
}

.modal-content {
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-xl);
}

.modal-close-btn {
  color: var(--color-text-mute);
  transition: all var(--transition-normal);
}

.modal-close-btn:hover {
  color: var(--color-error);
  background: var(--color-background-hover);
  border-radius: 4px;
  padding: 0.25rem;
}

@keyframes fade-in {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fade-in {
  animation: fade-in 0.18s;
}
</style>

<script lang="ts">
export default {
  name: 'Modal'
}
</script> 