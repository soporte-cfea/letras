<template>
  <div class="collection-view-selector">
    <div class="view-buttons">
      <button
        v-for="view in views"
        :key="view.id"
        @click="selectView(view.id)"
        :class="['view-btn', { active: selectedView === view.id }]"
        :title="view.description"
      >
        <svg v-if="view.icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path :d="view.icon"/>
        </svg>
        <span>{{ view.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { DayOfWeek } from '../types/songTypes';

// Tipos de vistas predefinidas
export type ViewType = 
  | 'all' 
  | 'current-month' 
  | 'others';

interface ViewDefinition {
  id: ViewType;
  label: string;
  description: string;
  icon?: string;
}

// Props
interface Props {
  modelValue?: ViewType;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'all'
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: ViewType];
  'view-selected': [view: ViewType, filters: ViewFilters];
}>();

// State
const selectedView = ref<ViewType>(props.modelValue || 'all');

// Definición de vistas
const views: ViewDefinition[] = [
  {
    id: 'all',
    label: 'Todas',
    description: 'Mostrar todas las listas',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
  },
  {
    id: 'current-month',
    label: 'Este mes',
    description: 'Listas semanales del mes actual',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
  },
  {
    id: 'others',
    label: 'Otros',
    description: 'Listas comunes (coros, cumbias, etc.)',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
  }
];

// Tipos para los filtros de cada vista
interface ViewFilters {
  searchQuery?: string;
  category?: 'lista semanal' | 'evento' | 'otro';
  period?: 'all' | 'current-month' | 'last-month' | 'custom';
  dateStart?: string;
  dateEnd?: string;
  dayFilter?: 'all' | 'domingo' | 'miércoles' | 'viernes' | 'custom';
  selectedDays?: DayOfWeek[];
}

// Función para obtener los filtros según la vista seleccionada
function getFiltersForView(view: ViewType): ViewFilters {
  const filters: ViewFilters = {};

  switch (view) {
    case 'all':
      // Sin filtros, mostrar todo
      break;

    case 'current-month': {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filters.period = 'custom';
      filters.dateStart = start.toISOString().split('T')[0];
      filters.dateEnd = end.toISOString().split('T')[0];
      break;
    }

    case 'others':
      filters.category = 'otro';
      break;
  }

  return filters;
}

// Función para seleccionar una vista
function selectView(view: ViewType) {
  selectedView.value = view;
  const filters = getFiltersForView(view);
  
  emit('update:modelValue', view);
  emit('view-selected', view, filters);
}
</script>

<style scoped>
.collection-view-selector {
  margin-bottom: 0;
}

.view-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0;
  background: transparent;
  border: none;
}

.view-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.875rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--color-text-soft);
  transition: all var(--transition-normal);
  white-space: nowrap;
}

.view-btn:hover {
  background: var(--color-background-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.view-btn.active {
  background: var(--color-background-mute);
  border-color: var(--color-border-hover);
  color: var(--color-text);
  font-weight: 600;
}

.view-btn.active:hover {
  background: var(--color-background-mute);
  transform: translateY(0);
}

.view-btn svg {
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .view-buttons {
    padding: 0;
    gap: 0.5rem;
  }
  
  .view-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
    flex: 1;
    min-width: calc(50% - 0.25rem);
    justify-content: flex-start;
  }
  
  .view-btn span {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .view-buttons {
    gap: 0.4rem;
  }
  
  .view-btn {
    flex: 1;
    min-width: calc(33.333% - 0.27rem);
    padding: 0.45rem 0.6rem;
    justify-content: flex-start;
    gap: 0.4rem;
  }
  
  .view-btn svg {
    width: 16px;
    height: 16px;
  }
  
  .view-btn span {
    font-size: 0.8rem;
    white-space: nowrap;
  }
}
</style>

