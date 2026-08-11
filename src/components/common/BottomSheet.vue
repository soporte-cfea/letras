<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="bottom-sheet"
      :class="{ 'bottom-sheet--fullscreen': elevated }"
    >
      <div
        class="bottom-sheet__backdrop"
        :style="{ opacity: backdropOpacity }"
        @click="requestClose"
      />
      <div
        ref="panelRef"
        class="bottom-sheet__panel"
        :class="{
          'bottom-sheet__panel--dragging': dragging,
          'bottom-sheet__panel--closing': closing,
          'bottom-sheet__panel--snap': snapping
        }"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        :style="panelStyle"
        @click.stop
        @transitionend="onPanelTransitionEnd"
      >
        <div
          class="bottom-sheet__grab"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <div class="bottom-sheet__handle" aria-hidden="true" />
          <header v-if="title" class="bottom-sheet__header">
            <h2 class="bottom-sheet__title">{{ title }}</h2>
            <button
              type="button"
              class="bottom-sheet__close"
              title="Cerrar"
              aria-label="Cerrar"
              @click="requestClose"
              @pointerdown.stop
            >
              ✕
            </button>
          </header>
        </div>
        <div class="bottom-sheet__body">
          <slot />
        </div>
        <footer class="bottom-sheet__footer">
          <button type="button" class="bottom-sheet__done" @click="requestClose">
            Listo
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
  title?: string
  /** z-index alto (p. ej. sobre content-fullscreen). */
  elevated?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const DISMISS_PX = 110
const DISMISS_VELOCITY = 0.55

const panelRef = ref<HTMLElement | null>(null)
const dragY = ref(0)
const dragging = ref(false)
const closing = ref(false)
const snapping = ref(false)

let startY = 0
let lastY = 0
let lastT = 0
let velocityY = 0
let previousBodyOverflow = ''
let lockedScroll = false
let closeTimer: ReturnType<typeof setTimeout> | null = null

const panelStyle = computed(() => {
  if (dragging.value || closing.value || snapping.value || dragY.value > 0) {
    return { transform: `translateY(${dragY.value}px)` }
  }
  return undefined
})

const backdropOpacity = computed(() => {
  const h = panelRef.value?.offsetHeight || 420
  const progress = Math.min(1, Math.max(0, dragY.value / h))
  return 0.4 * (1 - progress * 0.85)
})

function lockBodyScroll() {
  if (lockedScroll) return
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  lockedScroll = true
}

function unlockBodyScroll() {
  if (!lockedScroll) return
  document.body.style.overflow = previousBodyOverflow
  previousBodyOverflow = ''
  lockedScroll = false
}

function clearCloseTimer() {
  if (closeTimer != null) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function resetDrag() {
  clearCloseTimer()
  dragY.value = 0
  dragging.value = false
  closing.value = false
  snapping.value = false
  velocityY = 0
}

function requestClose() {
  emit('close')
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0 || closing.value) return
  const target = e.target as HTMLElement | null
  if (target?.closest('.bottom-sheet__close')) return

  snapping.value = false
  dragging.value = true
  startY = e.clientY
  lastY = e.clientY
  lastT = performance.now()
  velocityY = 0
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  dragY.value = Math.max(0, e.clientY - startY)

  const now = performance.now()
  const dt = now - lastT
  if (dt > 0) {
    velocityY = (e.clientY - lastY) / dt
  }
  lastY = e.clientY
  lastT = now
}

function onPointerUp() {
  if (!dragging.value) return
  dragging.value = false

  const panelH = panelRef.value?.offsetHeight || 420
  const threshold = Math.min(DISMISS_PX, panelH * 0.28)
  const shouldClose =
    dragY.value >= threshold || (velocityY > DISMISS_VELOCITY && dragY.value > 36)

  if (shouldClose) {
    closing.value = true
    dragY.value = panelH + 24
    clearCloseTimer()
    closeTimer = setTimeout(() => {
      requestClose()
      resetDrag()
    }, 180)
  } else if (dragY.value > 0) {
    snapping.value = true
    dragY.value = 0
  }
}

function onPanelTransitionEnd(e: TransitionEvent) {
  if (e.propertyName !== 'transform') return
  if (snapping.value) snapping.value = false
}

watch(
  () => props.show,
  (open) => {
    if (open) {
      resetDrag()
      lockBodyScroll()
    } else {
      unlockBodyScroll()
      resetDrag()
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  clearCloseTimer()
  unlockBodyScroll()
})
</script>

<style scoped>
.bottom-sheet {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overscroll-behavior: none;
}

.bottom-sheet--fullscreen {
  z-index: 10070;
}

.bottom-sheet__backdrop {
  position: absolute;
  inset: 0;
  background: rgb(0, 0, 0);
  opacity: 0.4;
  backdrop-filter: blur(2px);
  touch-action: none;
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
  will-change: transform;
}

.bottom-sheet__panel--dragging {
  animation: none;
  transition: none;
}

.bottom-sheet__panel--snap {
  animation: none;
  transition: transform 0.2s ease-out;
}

.bottom-sheet__panel--closing {
  animation: none;
  transition: transform 0.18s ease-in;
  pointer-events: none;
}

.bottom-sheet__grab {
  flex-shrink: 0;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.bottom-sheet__grab:active {
  cursor: grabbing;
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
  pointer-events: none;
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
  touch-action: manipulation;
}

.bottom-sheet__close:hover {
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

.bottom-sheet__body {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0.35rem 1rem 0.75rem;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
}

.bottom-sheet__footer {
  flex-shrink: 0;
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
  .bottom-sheet__panel,
  .bottom-sheet__panel--snap,
  .bottom-sheet__panel--closing {
    animation: none;
    transition: none;
  }
}
</style>
