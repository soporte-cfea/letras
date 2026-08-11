<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="bottom-sheet"
      :class="{ 'bottom-sheet--fullscreen': elevated }"
    >
      <div class="bottom-sheet__backdrop" @click="$emit('close')" />
      <div
        class="bottom-sheet__panel"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @click.stop
      >
        <div class="bottom-sheet__handle" aria-hidden="true" />
        <header v-if="title" class="bottom-sheet__header">
          <h2 class="bottom-sheet__title">{{ title }}</h2>
          <button
            type="button"
            class="bottom-sheet__close"
            title="Cerrar"
            aria-label="Cerrar"
            @click="$emit('close')"
          >
            ✕
          </button>
        </header>
        <div class="bottom-sheet__body">
          <slot />
        </div>
        <footer class="bottom-sheet__footer">
          <button type="button" class="bottom-sheet__done" @click="$emit('close')">
            Listo
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  title?: string
  /** z-index alto (p. ej. sobre content-fullscreen). */
  elevated?: boolean
}>()

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.bottom-sheet {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bottom-sheet--fullscreen {
  z-index: 10070;
}

.bottom-sheet__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
}

.bottom-sheet__panel {
  position: relative;
  z-index: 1;
  width: min(100%, 28rem);
  max-height: min(78vh, 36rem);
  display: flex;
  flex-direction: column;
  border-radius: 16px 16px 0 0;
  background: var(--color-background-card, #fff);
  box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.18);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  animation: bottom-sheet-up 0.22s ease-out;
}

.bottom-sheet__handle {
  width: 2.5rem;
  height: 0.28rem;
  margin: 0.55rem auto 0.25rem;
  border-radius: 999px;
  background: var(--color-border);
}

.bottom-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 1rem 0.5rem;
}

.bottom-sheet__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-heading, var(--color-text));
}

.bottom-sheet__close {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-soft);
  font-size: 1rem;
  cursor: pointer;
}

.bottom-sheet__close:hover {
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

.bottom-sheet__body {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0.35rem 1rem 0.75rem;
  -webkit-overflow-scrolling: touch;
}

.bottom-sheet__footer {
  padding: 0.5rem 1rem 0.85rem;
  border-top: 1px solid var(--color-border);
}

.bottom-sheet__done {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 10px;
  background: var(--color-accent);
  color: var(--color-text-inverse, #fff);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}

.bottom-sheet__done:hover {
  filter: brightness(1.05);
}

@keyframes bottom-sheet-up {
  from {
    transform: translateY(100%);
    opacity: 0.85;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bottom-sheet__panel {
    animation: none;
  }
}
</style>
