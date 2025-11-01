<template>
  <div class="test-container">
    <div class="test-header">
      <h1>Prueba del Componente MultiSelectFilter</h1>
      <p class="test-description">
        Esta es una vista de prueba para demostrar el funcionamiento del componente MultiSelectFilter.
      </p>
    </div>

    <div class="test-content">
      <!-- Ejemplo 1: Selección simple con strings -->
      <section class="test-section">
        <h2>Ejemplo 1: Etiquetas (Strings simples)</h2>
        <div class="example-info">
          <p><strong>Opciones:</strong> Array de strings</p>
          <p><strong>Seleccionadas:</strong> {{ selectedTags.length }} opciones</p>
          <p><strong>Modo de filtro:</strong> {{ tagFilterMode.toUpperCase() }}</p>
          <p><strong>Valores seleccionados:</strong> {{ selectedTags.join(', ') || 'Ninguna' }}</p>
        </div>
        <MultiSelectFilter
          v-model="selectedTags"
          v-model:filter-mode="tagFilterMode"
          :options="tags"
          placeholder="Todas las etiquetas"
          label="Filtrar por etiquetas"
          :allow-filter-mode-toggle="true"
          :searchable="true"
          :max-display="3"
          @change="handleTagChange"
        />
      </section>

      <!-- Ejemplo 2: Artistas con objetos -->
      <section class="test-section">
        <h2>Ejemplo 2: Artistas (Objetos con id y label)</h2>
        <div class="example-info">
          <p><strong>Opciones:</strong> Array de objetos { id, label }</p>
          <p><strong>Seleccionadas:</strong> {{ selectedArtists.length }} opciones</p>
          <p><strong>Modo de filtro:</strong> {{ artistFilterMode.toUpperCase() }}</p>
          <p><strong>Valores seleccionados:</strong> {{ selectedArtists.join(', ') || 'Ninguna' }}</p>
        </div>
        <MultiSelectFilter
          v-model="selectedArtists"
          v-model:filter-mode="artistFilterMode"
          :options="artists"
          placeholder="Todos los artistas"
          label="Filtrar por artistas"
          :allow-filter-mode-toggle="true"
          :searchable="true"
          :max-display="2"
          @change="handleArtistChange"
        />
      </section>

      <!-- Ejemplo 3: Sin búsqueda, sin toggle Y/O -->
      <section class="test-section">
        <h2>Ejemplo 3: Sin búsqueda, sin toggle Y/O</h2>
        <div class="example-info">
          <p><strong>Configuración:</strong> searchable=false, allowFilterModeToggle=false</p>
          <p><strong>Seleccionadas:</strong> {{ selectedCategories.length }} opciones</p>
          <p><strong>Valores seleccionados:</strong> {{ selectedCategories.join(', ') || 'Ninguna' }}</p>
        </div>
        <MultiSelectFilter
          v-model="selectedCategories"
          :options="categories"
          placeholder="Seleccionar categorías"
          label="Categorías"
          :allow-filter-mode-toggle="false"
          :searchable="false"
        />
      </section>

      <!-- Ejemplo 4: Solo lectura de resultados -->
      <section class="test-section">
        <h2>Ejemplo 4: Resultado del filtrado</h2>
        <div class="results-container">
          <div class="filter-info">
            <h3>Filtros aplicados:</h3>
            <div class="filters-summary">
              <div v-if="selectedTags.length > 0" class="filter-summary-item">
                <strong>Etiquetas:</strong>
                <span>{{ selectedTags.join(', ') }}</span>
                <span class="filter-mode-badge">{{ tagFilterMode.toUpperCase() }}</span>
              </div>
              <div v-if="selectedArtists.length > 0" class="filter-summary-item">
                <strong>Artistas:</strong>
                <span>{{ selectedArtists.join(', ') }}</span>
                <span class="filter-mode-badge">{{ artistFilterMode.toUpperCase() }}</span>
              </div>
              <div v-if="selectedCategories.length > 0" class="filter-summary-item">
                <strong>Categorías:</strong>
                <span>{{ selectedCategories.join(', ') }}</span>
              </div>
              <div v-if="selectedTags.length === 0 && selectedArtists.length === 0 && selectedCategories.length === 0" class="no-filters">
                No hay filtros aplicados
              </div>
            </div>
          </div>

          <div class="actions">
            <button @click="clearAllFilters" class="clear-btn">
              Limpiar todos los filtros
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MultiSelectFilter, { type FilterMode } from '@/components/common/MultiSelectFilter.vue';

// Datos de ejemplo
const tags = ref([
  'Adoración',
  'Alabanza',
  'Coro',
  'Pendiente',
  'Navidad',
  'Resurrección',
  'Semana Santa',
  'Vida Cristiana',
  'Oración',
  'Adventista'
]);

const artists = ref([
  { id: 1, label: 'Gadiel Espinoza' },
  { id: 2, label: 'Jaime Murrell' },
  { id: 3, label: 'Marco Barrientos' },
  { id: 4, label: 'Hillsong' },
  { id: 5, label: 'Bethel Music' },
  { id: 6, label: 'Elevation Worship' },
  { id: 7, label: 'Miel San Marcos' },
  { id: 8, label: 'En Espiritú y en Verdad' }
]);

const categories = ref([
  'Popular',
  'Reciente',
  'Favoritas',
  'Compartidas',
  'Mis canciones'
]);

// Estado de selecciones
const selectedTags = ref<string[]>([]);
const selectedArtists = ref<number[]>([]);
const selectedCategories = ref<string[]>([]);

// Modos de filtro
const tagFilterMode = ref<FilterMode>('or');
const artistFilterMode = ref<FilterMode>('or');

// Handlers
function handleTagChange(selected: string[], mode: FilterMode) {
  console.log('Etiquetas cambiadas:', selected, 'Modo:', mode);
}

function handleArtistChange(selected: number[], mode: FilterMode) {
  console.log('Artistas cambiados:', selected, 'Modo:', mode);
}

function clearAllFilters() {
  selectedTags.value = [];
  selectedArtists.value = [];
  selectedCategories.value = [];
  tagFilterMode.value = 'or';
  artistFilterMode.value = 'or';
}
</script>

<style scoped>
.test-container {
  min-height: 100vh;
  padding: 2rem;
  background: var(--color-background);
  color: var(--color-text);
}

.test-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--color-border);
}

.test-header h1 {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-heading);
}

.test-description {
  color: var(--color-text-soft);
  font-size: 1rem;
  line-height: 1.6;
}

.test-content {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  padding: 1.5rem;
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
}

.test-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.example-info {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: 6px;
  border-left: 3px solid var(--color-info);
}

.example-info p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  color: var(--color-text-soft);
  line-height: 1.5;
}

.example-info strong {
  color: var(--color-text);
  font-weight: 600;
}

.results-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-info h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--color-heading);
}

.filters-summary {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-summary-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--color-background-soft);
  border-radius: 6px;
  font-size: 0.875rem;
}

.filter-summary-item strong {
  min-width: 80px;
  color: var(--color-text);
}

.filter-summary-item span:not(.filter-mode-badge) {
  flex: 1;
  color: var(--color-text-soft);
}

.filter-mode-badge {
  padding: 0.25rem 0.5rem;
  background: var(--color-info);
  color: var(--color-text-inverse);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: monospace;
}

.no-filters {
  padding: 0.75rem;
  color: var(--color-text-mute);
  font-style: italic;
  text-align: center;
}

.actions {
  margin-top: 1rem;
}

.clear-btn {
  padding: 0.625rem 1.25rem;
  background: var(--color-error);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
  outline: none;
}

.clear-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.clear-btn:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .test-container {
    padding: 1rem;
  }

  .test-header h1 {
    font-size: 1.5rem;
  }

  .test-section {
    padding: 1rem;
  }
}
</style>

