<template>
  <div class="collection-filters">
    <!-- Botón para mostrar/ocultar filtros -->
    <button 
      @click="toggleFilters" 
      class="filters-toggle-btn"
      :class="{ active: isExpanded }"
    >
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
      </svg>
      <span>Filtros</span>
      <svg 
        width="16" 
        height="16" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        :class="{ rotated: isExpanded }"
      >
        <path d="M19 9l-7 7-7-7"/>
      </svg>
    </button>

    <!-- Panel de filtros -->
    <div v-if="isExpanded" class="filters-panel">
      <!-- Búsqueda por texto -->
      <div class="filter-group">
        <label class="filter-label">Buscar</label>
        <input
          v-model="filters.searchQuery"
          type="text"
          placeholder="Buscar por nombre o descripción..."
          class="filter-input"
          @input="onFiltersChange"
        />
      </div>

      <!-- Selector de categoría -->
      <div class="filter-group">
        <label class="filter-label">Categoría</label>
        <select
          v-model="filters.category"
          class="filter-select"
          @change="onFiltersChange"
        >
          <option value="">Todas</option>
          <option value="lista semanal">Lista semanal</option>
          <option value="evento">Evento</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <!-- Selector de período temporal -->
      <div class="filter-group">
        <label class="filter-label">Período</label>
        <select
          v-model="filters.period"
          class="filter-select"
          @change="onPeriodChange"
        >
          <option value="all">Todos</option>
          <option value="current-month">Mes actual</option>
          <option value="last-month">Último mes</option>
          <option value="custom">Personalizado</option>
        </select>
      </div>

      <!-- Rango de fechas personalizado -->
      <div v-if="filters.period === 'custom'" class="filter-group">
        <label class="filter-label">Rango de fechas</label>
        <div class="date-range-inputs">
          <input
            v-model="filters.dateStart"
            type="date"
            placeholder="Desde"
            class="filter-input date-input"
            @change="onFiltersChange"
          />
          <input
            v-model="filters.dateEnd"
            type="date"
            placeholder="Hasta"
            class="filter-input date-input"
            @change="onFiltersChange"
          />
        </div>
      </div>

      <!-- Selector de días de semana (solo para listas semanales) -->
      <div v-if="filters.category === 'lista semanal' || filters.category === ''" class="filter-group">
        <label class="filter-label">Día de la semana</label>
        <select
          v-model="filters.dayFilter"
          class="filter-select"
          @change="onDayFilterChange"
        >
          <option value="all">Todos los días</option>
          <option value="domingo">Solo domingos</option>
          <option value="miércoles">Solo miércoles</option>
          <option value="viernes">Solo viernes</option>
          <option value="custom">Personalizado</option>
        </select>
      </div>

      <!-- Selector múltiple de días (cuando es personalizado) -->
      <div v-if="filters.category === 'lista semanal' && filters.dayFilter === 'custom'" class="filter-group">
        <label class="filter-label">Seleccionar días</label>
        <div class="days-checkbox-group">
          <label v-for="day in availableDays" :key="day" class="day-checkbox">
            <input
              type="checkbox"
              :value="day"
              v-model="filters.selectedDays"
              @change="onFiltersChange"
            />
            <span>{{ day.charAt(0).toUpperCase() + day.slice(1) }}</span>
          </label>
        </div>
      </div>

      <!-- Botón para limpiar filtros -->
      <div class="filter-actions">
        <button @click="clearFilters" class="clear-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
          Limpiar filtros
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { DayOfWeek } from '../types/songTypes';

// Props
interface Props {
  modelValue?: {
    searchQuery?: string;
    category?: 'lista semanal' | 'evento' | 'otro' | '';
    period?: 'all' | 'current-month' | 'last-month' | 'custom';
    dateStart?: string;
    dateEnd?: string;
    dayFilter?: 'all' | 'domingo' | 'miércoles' | 'viernes' | 'custom';
    selectedDays?: DayOfWeek[];
  };
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({})
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Props['modelValue']];
  'filters-changed': [filters: Props['modelValue']];
}>();

// State
const isExpanded = ref(false);
const availableDays: DayOfWeek[] = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const filters = reactive({
  searchQuery: props.modelValue?.searchQuery || '',
  category: props.modelValue?.category || '',
  period: props.modelValue?.period || 'all',
  dateStart: props.modelValue?.dateStart || '',
  dateEnd: props.modelValue?.dateEnd || '',
  dayFilter: props.modelValue?.dayFilter || 'all',
  selectedDays: props.modelValue?.selectedDays || [] as DayOfWeek[]
});

// Methods
function toggleFilters() {
  isExpanded.value = !isExpanded.value;
}

function onFiltersChange() {
  emitFilters();
}

function onPeriodChange() {
  // Limpiar fechas personalizadas si no es período personalizado
  if (filters.period !== 'custom') {
    filters.dateStart = '';
    filters.dateEnd = '';
  }
  emitFilters();
}

function onDayFilterChange() {
  // Limpiar días seleccionados si no es personalizado
  if (filters.dayFilter !== 'custom') {
    filters.selectedDays = [];
  }
  emitFilters();
}

function clearFilters() {
  filters.searchQuery = '';
  filters.category = '';
  filters.period = 'all';
  filters.dateStart = '';
  filters.dateEnd = '';
  filters.dayFilter = 'all';
  filters.selectedDays = [];
  emitFilters();
}

function emitFilters() {
  const filterData = {
    searchQuery: filters.searchQuery || undefined,
    category: filters.category || undefined,
    period: filters.period !== 'all' ? filters.period : undefined,
    dateStart: filters.dateStart || undefined,
    dateEnd: filters.dateEnd || undefined,
    dayFilter: filters.dayFilter !== 'all' ? filters.dayFilter : undefined,
    selectedDays: filters.selectedDays.length > 0 ? filters.selectedDays : undefined
  };
  
  emit('update:modelValue', filterData);
  emit('filters-changed', filterData);
}

// Watch para sincronizar con props
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    filters.searchQuery = newValue.searchQuery || '';
    filters.category = newValue.category || '';
    filters.period = newValue.period || 'all';
    filters.dateStart = newValue.dateStart || '';
    filters.dateEnd = newValue.dateEnd || '';
    filters.dayFilter = newValue.dayFilter || 'all';
    filters.selectedDays = newValue.selectedDays || [];
  }
}, { deep: true });
</script>

<style scoped>
.collection-filters {
  margin-bottom: 1.5rem;
}

.filters-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--color-text);
  transition: all var(--transition-normal);
  width: 100%;
  justify-content: space-between;
}

.filters-toggle-btn:hover {
  background: var(--color-background-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.filters-toggle-btn.active {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.filters-toggle-btn svg:last-child {
  transition: transform var(--transition-normal);
}

.filters-toggle-btn svg:last-child.rotated {
  transform: rotate(180deg);
}

.filters-panel {
  margin-top: 1rem;
  padding: 1.5rem;
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 0.25rem;
}

.filter-input,
.filter-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
  transition: all var(--transition-normal);
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.1);
}

.date-range-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.date-input {
  width: 100%;
}

.days-checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.day-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--transition-normal);
  font-size: 0.875rem;
}

.day-checkbox:hover {
  background: var(--color-background-hover);
  border-color: var(--color-accent);
}

.day-checkbox input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.day-checkbox input[type="checkbox"]:checked + span {
  font-weight: 600;
  color: var(--color-accent);
}

.filter-actions {
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--color-text-mute);
  transition: all var(--transition-normal);
}

.clear-btn:hover {
  background: var(--color-background-hover);
  border-color: var(--color-error);
  color: var(--color-error);
}

/* Responsive */
@media (max-width: 768px) {
  .date-range-inputs {
    grid-template-columns: 1fr;
  }
  
  .days-checkbox-group {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

