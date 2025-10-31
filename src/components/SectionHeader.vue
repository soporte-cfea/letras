<template>
  <div class="section-header" :style="{ borderLeftColor: section.color }">
    <h3 class="section-name">{{ section.name }}</h3>
  </div>
</template>

<script setup lang="ts">
import type { CollectionSection } from '../api/sections';

interface Props {
  section: CollectionSection;
}

const props = defineProps<Props>();
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
