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
    <div
      class="tabs-content"
      :class="{ 'tabs-content--swipeable': swipeable && tabs.length > 1 }"
      @touchstart.passive="onTabSwipeStart"
      @touchend="onTabSwipeEnd"
    >
      <slot :name="`tab-${activeTab}`">
        <slot></slot>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import SongDocIndicators from './SongDocIndicators.vue'
import type { DocIndicatorSection } from './SongDocIndicators.vue'
import type { SongDocumentPresence } from '@/types/songTypes'

export interface Tab {
  id: string
  label: string
  icon?: string
  badge?: string | number
  /** Icono alineado con listados (letra / acordes / análisis) */
  docIndicator?: DocIndicatorSection
}

export interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  /** Estado para colorear iconos (mismo criterio que en listas). */
  docPresence?: SongDocumentPresence | null
  /** Deslizar horizontalmente en el contenido para cambiar de pestaña. */
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

function selectTab(tabId: string) {
  if (activeTab.value !== tabId) {
    activeTab.value = tabId
    emit('update:activeTab', tabId)
    emit('tab-change', tabId)
  }
}

const SWIPE_MIN_DISTANCE = 56
const SWIPE_DIRECTION_RATIO = 1.35

let swipeStartX = 0
let swipeStartY = 0
let swipeTracking = false

function isSwipeBlockedTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      'input, textarea, select, button, a, [contenteditable="true"], .ProseMirror, .tiptap, .rich-text-editor'
    )
  )
}

function onTabSwipeStart(event: TouchEvent) {
  if (!props.swipeable || props.tabs.length <= 1) return
  if (event.touches.length !== 1) return
  if (isSwipeBlockedTarget(event.target)) return

  swipeStartX = event.touches[0].clientX
  swipeStartY = event.touches[0].clientY
  swipeTracking = true
}

function onTabSwipeEnd(event: TouchEvent) {
  if (!swipeTracking) return
  swipeTracking = false

  const touch = event.changedTouches[0]
  if (!touch) return

  const deltaX = touch.clientX - swipeStartX
  const deltaY = touch.clientY - swipeStartY

  if (Math.abs(deltaX) < SWIPE_MIN_DISTANCE) return
  if (Math.abs(deltaX) < Math.abs(deltaY) * SWIPE_DIRECTION_RATIO) return

  const currentIndex = props.tabs.findIndex((tab) => tab.id === activeTab.value)
  if (currentIndex === -1) return

  if (deltaX < 0 && currentIndex < props.tabs.length - 1) {
    selectTab(props.tabs[currentIndex + 1].id)
    return
  }

  if (deltaX > 0 && currentIndex > 0) {
    selectTab(props.tabs[currentIndex - 1].id)
  }
}

watch(() => props.defaultTab, (newTab) => {
  if (newTab && props.tabs.some(t => t.id === newTab)) {
    activeTab.value = newTab
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
      activeTab.value = fallback
    }
  }
)

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

.tabs-content--swipeable {
  touch-action: pan-y;
}
</style>

