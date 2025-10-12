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
  background: #f8fafc;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  margin-bottom: 0;
  display: flex;
  align-items: center;
}

.section-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Responsive */
@media (max-width: 768px) {
  .section-header {
    padding: 0.2rem 0.4rem;
  }
  
  .section-name {
    font-size: 0.75rem;
  }
}

/* Media queries específicas para teléfonos */
@media (max-width: 480px) {
  .section-header {
    padding: 0.15rem 0.3rem;
  }
  
  .section-name {
    font-size: 0.7rem;
  }
}

/* Media query adicional para teléfonos muy pequeños */
@media (max-width: 360px) {
  .section-header {
    padding: 0.1rem 0.25rem;
  }
  
  .section-name {
    font-size: 0.65rem;
  }
}
</style>
