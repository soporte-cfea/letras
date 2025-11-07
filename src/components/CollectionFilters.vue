<template>
  <div class="collection-filters">
    <!-- Botón para mostrar/ocultar filtros (solo si no es panelOnly) -->
    <button 
      v-if="!panelOnly"
      @click="toggleFilters" 
      class="filters-toggle-btn"
      :class="{ active: isExpanded }"
    >
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
      </svg>
      <span>Filtros</span>
      <svg 
        width="14" 
        height="14" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        :class="{ rotated: isExpanded }"
      >
        <path d="M19 9l-7 7-7-7"/>
      </svg>
    </button>

    <!-- Panel de filtros (si es panelOnly siempre visible, o si está expandido y no es separatePanel) -->
    <div v-if="panelOnly || (isExpanded && !separatePanel)" class="filters-panel">
      <div class="filters-grid">
        <!-- Primera fila: Buscar, Categoría, Período -->
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

        <!-- Segunda fila: Día de la semana, Ordenar por -->
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

        <div class="filter-group">
          <label class="filter-label">Ordenar por</label>
          <select
            v-model="filters.sortOrder"
            class="filter-select"
            @change="onFiltersChange"
          >
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </select>
        </div>
      </div>

      <!-- Rango de fechas personalizado (condicional) -->
      <div v-if="filters.period === 'custom'" class="filter-group date-range-group">
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

      <!-- Selector múltiple de días (cuando es personalizado) -->
      <div v-if="filters.category === 'lista semanal' && filters.dayFilter === 'custom'" class="filter-group days-custom-group">
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
    sortBy?: 'event_date' | 'name' | 'created_at' | 'songCount';
    sortOrder?: 'asc' | 'desc';
  };
  separatePanel?: boolean; // Si es true, no renderiza el panel dentro del componente
  panelOnly?: boolean; // Si es true, solo muestra el panel sin el botón
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  separatePanel: false,
  panelOnly: false
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Props['modelValue']];
  'filters-changed': [filters: Props['modelValue']];
  'toggle-expanded': [expanded: boolean];
}>();

// State
const isExpanded = ref(false); // Por defecto cerrado para no ocupar tanto espacio
const availableDays: DayOfWeek[] = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const filters = reactive({
  searchQuery: props.modelValue?.searchQuery || '',
  category: props.modelValue?.category || '',
  period: props.modelValue?.period || 'all',
  dateStart: props.modelValue?.dateStart || '',
  dateEnd: props.modelValue?.dateEnd || '',
  dayFilter: props.modelValue?.dayFilter || 'all',
  selectedDays: props.modelValue?.selectedDays || [] as DayOfWeek[],
  sortBy: props.modelValue?.sortBy || 'event_date',
  sortOrder: props.modelValue?.sortOrder || 'desc'
});

// Methods
function toggleFilters() {
  isExpanded.value = !isExpanded.value;
  emit('toggle-expanded', isExpanded.value);
}

// Exponer el estado para uso externo
defineExpose({
  isExpanded,
  toggleFilters
});

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
  filters.sortBy = 'event_date';
  filters.sortOrder = 'desc';
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
    selectedDays: filters.selectedDays.length > 0 ? filters.selectedDays : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder
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
    filters.sortBy = newValue.sortBy || 'event_date';
    filters.sortOrder = newValue.sortOrder || 'desc';
  }
}, { deep: true });
</script>

<style scoped>
.collection-filters {
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

/* Cuando solo se muestra el panel (panelOnly), el contenedor debe ocupar todo el ancho */
.collection-filters:has(.filters-panel:only-child) {
  width: 100%;
}

.filters-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--color-text-soft);
  transition: all var(--transition-normal);
  width: auto;
  justify-content: flex-start;
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
  margin-top: 0.75rem;
  padding: 1rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

/* Primera fila: 3 columnas (Buscar, Categoría, Período) */
.filters-grid .filter-group:nth-child(1) {
  grid-column: 1;
}
.filters-grid .filter-group:nth-child(2) {
  grid-column: 2;
}
.filters-grid .filter-group:nth-child(3) {
  grid-column: 3;
}

/* Segunda fila: 2 columnas alineadas a la izquierda (Día de la semana, Ordenar por) */
.filters-grid .filter-group:nth-child(4) {
  grid-column: 1;
}
.filters-grid .filter-group:nth-child(5) {
  grid-column: 2;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.date-range-group,
.days-custom-group {
  margin-top: 0;
  margin-bottom: 1rem;
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-soft);
  margin-bottom: 0;
}

.filter-input,
.filter-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.85rem;
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
  gap: 0.5rem;
}

.date-input {
  width: 100%;
}

.days-checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
}

.day-checkbox {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--transition-normal);
  font-size: 0.8rem;
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
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
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
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .filters-grid .filter-group:nth-child(1),
  .filters-grid .filter-group:nth-child(2),
  .filters-grid .filter-group:nth-child(3),
  .filters-grid .filter-group:nth-child(4),
  .filters-grid .filter-group:nth-child(5) {
    grid-column: 1;
  }

  .date-range-inputs {
    grid-template-columns: 1fr;
  }
  
  .days-checkbox-group {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

