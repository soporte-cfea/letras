<template>
  <div
    class="draft-status-bar"
    :class="urgencyClass"
    role="status"
    aria-live="polite"
  >
    <p class="draft-status-bar__text">{{ message }}</p>
    <button
      type="button"
      class="draft-status-bar__publish"
      :disabled="publishing"
      @click="$emit('publish')"
    >
      {{ publishing ? 'Publicando…' : 'Publicar' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Collection } from '@/types/songTypes'
import { getDraftStatusMessage, getDraftUrgency } from '@/utils/collectionPublish'

const props = defineProps<{
  collection: Pick<Collection, 'published_at' | 'event_date' | 'category'>
  publishing?: boolean
}>()

defineEmits<{
  publish: []
}>()

const message = computed(() => getDraftStatusMessage(props.collection))
const urgencyClass = computed(() => {
  const u = getDraftUrgency(props.collection)
  if (u === 'today') return 'draft-status-bar--today'
  if (u === 'soon') return 'draft-status-bar--soon'
  return ''
})
</script>

<style scoped>
.draft-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 1rem;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 90;
  transition: background-color var(--transition-normal), border-color var(--transition-normal);
}

.draft-status-bar--soon {
  background: color-mix(in srgb, var(--color-accent) 8%, var(--color-background-soft));
  border-bottom-color: color-mix(in srgb, var(--color-accent) 25%, var(--color-border));
}

.draft-status-bar--today {
  background: color-mix(in srgb, var(--color-accent) 12%, var(--color-background-soft));
  border-bottom-color: color-mix(in srgb, var(--color-accent) 35%, var(--color-border));
}

.draft-status-bar__text {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-text-soft);
  line-height: 1.35;
  flex: 1;
  min-width: 0;
}

.draft-status-bar--soon .draft-status-bar__text,
.draft-status-bar--today .draft-status-bar__text {
  color: var(--color-text);
}

.draft-status-bar__publish {
  flex-shrink: 0;
  background: var(--color-accent);
  color: var(--color-text-inverse, #fff);
  border: none;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  white-space: nowrap;
}

.draft-status-bar__publish:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
}

.draft-status-bar__publish:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.draft-status-bar__publish:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

@media (max-width: 480px) {
  .draft-status-bar {
    padding: 0.5rem 0.75rem;
  }

  .draft-status-bar__text {
    font-size: 0.78rem;
  }
}
</style>
