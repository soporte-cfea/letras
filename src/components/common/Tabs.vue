<template>
  <div class="tabs-container">
    <div class="tabs-header">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="selectTab(tab.id)"
        :class="[
          'tab-button',
          { 'active': activeTab === tab.id }
        ]"
      >
        <span
          v-if="tab.docIndicator"
          class="tab-doc-indicator"
          aria-hidden="true"
        >
          <SongDocIndicators
            mode="values"
            :presence="docPresence"
            :only-section="tab.docIndicator"
            :icon-size="15"
            :stop-propagation="false"
          />
        </span>
        <span v-if="tab.icon" class="tab-icon" v-html="tab.icon"></span>
        <span class="tab-label">{{ tab.label }}</span>
        <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </button>
    </div>

    <!-- Carrusel con swipe interactivo -->
    <div
      v-if="useCarousel"
      ref="viewportRef"
      class="tabs-viewport tabs-content--swipeable"
      :class="{ 'tabs-viewport--animated': viewportHeightAnimated && !prefersReducedMotion && !isDragging }"
      :style="viewportStyle"
      @touchstart.passive="onTouchStart"
    >
      <div
        class="tabs-track"
        :class="{
          'tabs-track--animated': trackAnimated && !prefersReducedMotion,
          'tabs-track--dragging': isDragging
        }"
        :style="trackStyle"
      >
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="tabs-panel"
          :aria-hidden="tab.id !== activeTab"
        >
          <div
            v-if="isTabMounted(tab.id)"
            :ref="(el) => setPanelRef(tab.id, el)"
            class="tabs-panel-inner"
          >
            <slot :name="`tab-${tab.id}`" />
          </div>
        </div>
      </div>
    </div>

    <!-- Modo simple (sin swipe o una sola pestaña) -->
    <div v-else class="tabs-content">
      <slot :name="`tab-${activeTab}`">
        <slot></slot>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, type ComponentPublicInstance } from 'vue'
import SongDocIndicators from './SongDocIndicators.vue'
import type { DocIndicatorSection } from './SongDocIndicators.vue'
import type { SongDocumentPresence } from '@/types/songTypes'

export interface Tab {
  id: string
  label: string
  icon?: string
  badge?: string | number
  docIndicator?: DocIndicatorSection
}

export interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  docPresence?: SongDocumentPresence | null
  swipeable?: boolean
}

const props = withDefaults(defineProps<TabsProps>(), {
  defaultTab: undefined,
  docPresence: null,
  swipeable: false
})

const emit = defineEmits<{
  'update:activeTab': [tabId: string]
  'tab-change': [tabId: string]
}>()

const activeTab = ref<string>(props.defaultTab || props.tabs[0]?.id || '')
const viewportRef = ref<HTMLElement | null>(null)
const viewportWidth = ref(0)
const viewportHeight = ref<number | null>(null)
const viewportHeightAnimated = ref(true)
const dragOffsetPx = ref(0)
const isDragging = ref(false)
const trackAnimated = ref(true)
const prefersReducedMotion = ref(false)

const mountedTabIds = ref<Set<string>>(new Set())

const useCarousel = computed(() => props.swipeable && props.tabs.length > 1)

const activeIndex = computed(() =>
  props.tabs.findIndex((tab) => tab.id === activeTab.value)
)

const trackStyle = computed(() => {
  const index = activeIndex.value >= 0 ? activeIndex.value : 0
  const offset = -(index * viewportWidth.value) + dragOffsetPx.value
  return {
    transform: `translate3d(${offset}px, 0, 0)`
  }
})

const viewportStyle = computed(() => {
  if (viewportHeight.value === null) return undefined
  return { height: `${viewportHeight.value}px` }
})

const panelRefs = new Map<string, HTMLElement>()
let panelResizeObserver: ResizeObserver | null = null

function setPanelRef(tabId: string, el: Element | ComponentPublicInstance | null) {
  const prev = panelRefs.get(tabId)
  if (prev && panelResizeObserver) {
    panelResizeObserver.unobserve(prev)
  }

  if (el instanceof HTMLElement) {
    panelRefs.set(tabId, el)
    panelResizeObserver?.observe(el)
  } else {
    panelRefs.delete(tabId)
  }

  nextTick(updateViewportHeight)
}

function measurePanelHeight(tabId: string): number {
  return panelRefs.get(tabId)?.scrollHeight ?? 0
}

function getRelevantTabIdsForHeight(): string[] {
  const idx = activeIndex.value
  if (idx === -1) return []

  const ids = [props.tabs[idx].id]
  const offset = dragOffsetPx.value
  const dragging = isDragging.value || Math.abs(offset) > 1

  if (dragging) {
    if (offset < 0 && idx < props.tabs.length - 1) {
      ids.push(props.tabs[idx + 1].id)
    }
    if (offset > 0 && idx > 0) {
      ids.push(props.tabs[idx - 1].id)
    }
  }

  return ids
}

function updateViewportHeight() {
  if (!useCarousel.value) return

  const ids = getRelevantTabIdsForHeight()
  let maxHeight = 0

  for (const id of ids) {
    maxHeight = Math.max(maxHeight, measurePanelHeight(id))
  }

  if (maxHeight > 0) {
    viewportHeight.value = maxHeight
  }
}

function isTabMounted(tabId: string): boolean {
  return mountedTabIds.value.has(tabId)
}

function syncMountedTabs() {
  const ids = new Set<string>()
  const idx = activeIndex.value
  if (idx === -1 || props.tabs.length === 0) {
    mountedTabIds.value = ids
    return
  }

  ids.add(props.tabs[idx].id)
  if (useCarousel.value) {
    if (idx > 0) ids.add(props.tabs[idx - 1].id)
    if (idx < props.tabs.length - 1) ids.add(props.tabs[idx + 1].id)
  }

  mountedTabIds.value = ids
}

function emitTabChange(tabId: string) {
  emit('update:activeTab', tabId)
  emit('tab-change', tabId)
}

function setActiveTab(tabId: string, animate = true) {
  if (activeTab.value === tabId) return
  if (!props.tabs.some((t) => t.id === tabId)) return

  trackAnimated.value = animate && !prefersReducedMotion.value
  dragOffsetPx.value = 0
  isDragging.value = false
  activeTab.value = tabId
  syncMountedTabs()
  emitTabChange(tabId)
  nextTick(updateViewportHeight)
}

function commitToTabIndex(newIndex: number) {
  const idx = activeIndex.value
  const width = viewportWidth.value
  if (idx === -1 || newIndex === idx || newIndex < 0 || newIndex >= props.tabs.length) return

  const direction = newIndex > idx ? 1 : -1
  trackAnimated.value = false
  activeTab.value = props.tabs[newIndex].id
  dragOffsetPx.value = dragOffsetPx.value + direction * width
  syncMountedTabs()
  emitTabChange(props.tabs[newIndex].id)

  requestAnimationFrame(() => {
    trackAnimated.value = !prefersReducedMotion.value
    dragOffsetPx.value = 0
    nextTick(updateViewportHeight)
  })
}

function selectTab(tabId: string) {
  setActiveTab(tabId, true)
}

const SWIPE_MIN_DISTANCE = 56
const SWIPE_DIRECTION_RATIO = 1.35
const SWIPE_COMMIT_RATIO = 0.22

let swipeStartX = 0
let swipeStartY = 0
let swipeTracking = false
let horizontalLocked = false

function isSwipeBlockedTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      'input, textarea, select, button, a, [contenteditable="true"], .ProseMirror, .tiptap, .rich-text-editor'
    )
  )
}

function clampDrag(deltaX: number): number {
  const idx = activeIndex.value
  const last = props.tabs.length - 1
  if (idx === 0 && deltaX > 0) return deltaX * 0.35
  if (idx === last && deltaX < 0) return deltaX * 0.35
  return deltaX
}

function updateViewportWidth() {
  viewportWidth.value = viewportRef.value?.clientWidth ?? 0
}

function onTouchMove(event: TouchEvent) {
  if (!swipeTracking || !useCarousel.value) return
  if (event.touches.length !== 1) return

  const touch = event.touches[0]
  const deltaX = touch.clientX - swipeStartX
  const deltaY = touch.clientY - swipeStartY

  if (!horizontalLocked) {
    if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return
    if (Math.abs(deltaY) > Math.abs(deltaX) * SWIPE_DIRECTION_RATIO) {
      endSwipeTracking()
      return
    }
    horizontalLocked = true
    isDragging.value = true
    trackAnimated.value = false
    syncMountedTabs()
  }

  event.preventDefault()
  dragOffsetPx.value = clampDrag(deltaX)
  updateViewportHeight()
}

function finishSwipe() {
  if (!horizontalLocked) {
    endSwipeTracking()
    return
  }

  const idx = activeIndex.value
  if (idx === -1) {
    endSwipeTracking()
    return
  }

  const width = viewportWidth.value || 1
  const threshold = Math.max(SWIPE_MIN_DISTANCE, width * SWIPE_COMMIT_RATIO)
  const offset = dragOffsetPx.value

  if (offset <= -threshold && idx < props.tabs.length - 1) {
    commitToTabIndex(idx + 1)
  } else if (offset >= threshold && idx > 0) {
    commitToTabIndex(idx - 1)
  } else {
    trackAnimated.value = !prefersReducedMotion.value
    viewportHeightAnimated.value = !prefersReducedMotion.value
    dragOffsetPx.value = 0
    nextTick(updateViewportHeight)
  }

  endSwipeTracking()
}

function endSwipeTracking() {
  swipeTracking = false
  horizontalLocked = false
  isDragging.value = false
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
  document.removeEventListener('touchcancel', onTouchEnd)
}

function onTouchEnd() {
  finishSwipe()
}

function onTouchStart(event: TouchEvent) {
  if (!useCarousel.value) return
  if (event.touches.length !== 1) return
  if (isSwipeBlockedTarget(event.target)) return

  updateViewportWidth()
  swipeStartX = event.touches[0].clientX
  swipeStartY = event.touches[0].clientY
  swipeTracking = true
  horizontalLocked = false

  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', onTouchEnd)
  document.addEventListener('touchcancel', onTouchEnd)
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  syncMountedTabs()

  if (typeof ResizeObserver !== 'undefined') {
    panelResizeObserver = new ResizeObserver(() => updateViewportHeight())
    resizeObserver = new ResizeObserver(() => {
      updateViewportWidth()
      updateViewportHeight()
    })
    nextTick(() => {
      if (viewportRef.value) {
        resizeObserver?.observe(viewportRef.value)
        updateViewportWidth()
        updateViewportHeight()
      }
    })
  } else {
    window.addEventListener('resize', updateViewportWidth)
    nextTick(() => {
      updateViewportWidth()
      updateViewportHeight()
    })
  }
})

onUnmounted(() => {
  endSwipeTracking()
  panelRefs.forEach((el) => panelResizeObserver?.unobserve(el))
  panelRefs.clear()
  panelResizeObserver?.disconnect()
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateViewportWidth)
})

watch(() => props.defaultTab, (newTab) => {
  if (newTab && props.tabs.some(t => t.id === newTab) && newTab !== activeTab.value) {
    setActiveTab(newTab, !prefersReducedMotion.value)
  }
})

watch(
  () => props.tabs.map((t) => t.id).join('|'),
  () => {
    if (props.tabs.length === 0) return
    if (!props.tabs.some((t) => t.id === activeTab.value)) {
      const fallback = (props.defaultTab && props.tabs.some((t) => t.id === props.defaultTab))
        ? props.defaultTab
        : props.tabs[0].id
      setActiveTab(fallback, false)
    } else {
      syncMountedTabs()
    }
  }
)

watch(useCarousel, () => {
  nextTick(() => {
    updateViewportWidth()
    syncMountedTabs()
    updateViewportHeight()
  })
})

watch(activeTab, () => {
  viewportHeightAnimated.value = !prefersReducedMotion.value && !isDragging.value
  nextTick(updateViewportHeight)
})

watch(dragOffsetPx, () => {
  if (isDragging.value) {
    viewportHeightAnimated.value = false
    updateViewportHeight()
  }
})

defineExpose({
  activeTab,
  selectTab
})
</script>

<style scoped>
.tabs-container {
  width: 100%;
}

.tabs-header {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-soft);
  font-weight: 500;
  font-size: 0.9375rem;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  position: relative;
}

.tab-button:hover {
  color: var(--color-text);
  background: var(--color-background-soft);
}

.tab-button.active {
  color: var(--color-text);
  border-bottom-color: var(--color-accent);
  font-weight: 600;
}

.tab-doc-indicator {
  display: inline-flex;
  align-items: center;
  line-height: 0;
  flex-shrink: 0;
  pointer-events: none;
}

.tab-icon {
  display: flex;
  align-items: center;
  font-size: 1rem;
  opacity: 0.7;
}

.tab-button.active .tab-icon {
  opacity: 1;
}

.tab-label {
  font-weight: inherit;
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 0.375rem;
  background: var(--color-background-mute);
  color: var(--color-text-soft);
  border-radius: 0.625rem;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1;
}

.tab-button.active .tab-badge {
  background: var(--color-accent);
  color: var(--color-text-inverse);
}

.tabs-content {
  width: 100%;
}

.tabs-viewport {
  width: 100%;
  overflow: hidden;
}

.tabs-viewport--animated {
  transition: height 0.28s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.tabs-content--swipeable {
  touch-action: pan-y;
}

.tabs-track {
  display: flex;
  width: 100%;
  align-items: flex-start;
  will-change: transform;
}

.tabs-track--animated {
  transition: transform 0.28s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.tabs-track--dragging {
  transition: none;
}

.tabs-panel {
  flex: 0 0 100%;
  width: 100%;
  min-width: 0;
}

.tabs-panel-inner {
  width: 100%;
}
</style>
