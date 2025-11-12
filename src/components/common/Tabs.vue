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
        <span v-if="tab.icon" class="tab-icon" v-html="tab.icon"></span>
        <span class="tab-label">{{ tab.label }}</span>
        <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </button>
    </div>
    <div class="tabs-content">
      <slot :name="`tab-${activeTab}`">
        <slot></slot>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

export interface Tab {
  id: string
  label: string
  icon?: string
  badge?: string | number
}

export interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
}

const props = withDefaults(defineProps<TabsProps>(), {
  defaultTab: undefined
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

watch(() => props.defaultTab, (newTab) => {
  if (newTab && props.tabs.some(t => t.id === newTab)) {
    activeTab.value = newTab
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
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1.5rem;
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
  margin-bottom: -1px;
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
</style>

