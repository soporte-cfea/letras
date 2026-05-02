<template>
  <template v-if="enabled">
    <div
      ref="rootRef"
      class="touch-hint-root"
      @click.capture.stop="toggle"
    >
      <slot />
    </div>
  </template>
  <slot v-else />
  <Teleport to="body">
    <div
      v-show="open"
      ref="bubbleRef"
      class="touch-hint-bubble"
      role="tooltip"
      :style="bubbleStyle"
      @click.stop="close"
    >
      {{ message }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';

const props = withDefaults(
  defineProps<{
    message: string;
    /** Si es false, solo renderiza el slot (sin envoltura ni burbuja). */
    enabled?: boolean;
  }>(),
  {
    enabled: true
  }
);

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const bubbleRef = ref<HTMLElement | null>(null);
const bubbleStyle = ref<Record<string, string>>({});

function close() {
  open.value = false;
}

function toggle() {
  open.value = !open.value;
  if (open.value) {
    nextTick(() => positionBubble());
  }
}

function positionBubble() {
  const root = rootRef.value;
  if (!root) return;
  const el = root.firstElementChild as HTMLElement | null;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const margin = 8;
  const below = r.bottom + 6;
  const spaceBelow = window.innerHeight - below;
  const bubbleH = bubbleRef.value?.offsetHeight ?? 48;
  const showAbove = spaceBelow < bubbleH + margin && r.top > bubbleH + margin;
  const top = showAbove ? r.top - bubbleH - 6 : below;
  const centerX = r.left + r.width / 2;
  bubbleStyle.value = {
    position: 'fixed',
    top: `${Math.max(margin, top)}px`,
    left: `${centerX}px`,
    transform: 'translateX(-50%)',
    zIndex: '10050',
    maxWidth: `min(240px, calc(100vw - ${margin * 2}px))`
  };
}

function onDocPointerDown(ev: PointerEvent) {
  if (!open.value) return;
  const t = ev.target as Node;
  if (rootRef.value?.contains(t)) return;
  if (bubbleRef.value?.contains(t)) return;
  close();
}

function onScrollOrResize() {
  if (open.value) close();
}

watch(open, (isOpen) => {
  if (isOpen) {
    nextTick(() => positionBubble());
  }
});

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, true);
  document.addEventListener('keydown', onEscape);
  window.addEventListener('scroll', onScrollOrResize, true);
  window.addEventListener('resize', onScrollOrResize);
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true);
  document.removeEventListener('keydown', onEscape);
  window.removeEventListener('scroll', onScrollOrResize, true);
  window.removeEventListener('resize', onScrollOrResize);
});
</script>

<style scoped>
.touch-hint-root {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}
</style>

<style>
.touch-hint-bubble {
  padding: 0.45rem 0.65rem;
  font-size: 0.8125rem;
  line-height: 1.35;
  color: var(--color-text);
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  text-align: center;
  cursor: default;
}
</style>
