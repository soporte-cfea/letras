<template>
  <div class="collections-container">
    <!-- Header -->
    <header class="collections-header">
      <div class="header-content">
        <h1 class="page-title">Listas</h1>
        <div class="header-actions">
          <button 
            v-if="canCreateLists" 
            @click="showCreateCollection = true" 
            class="add-btn"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 5v14m7-7H5"/>
            </svg>
            Nueva lista
          </button>
        </div>
      </div>
    </header>


    <!-- Main Content -->
    <main class="collections-main">
      <!-- States -->
      <div v-if="loading" class="state-container">
        <div class="loading-spinner"></div>
        <p>Cargando listas...</p>
      </div>
      
      <div v-else-if="error" class="state-container error">
        <div class="error-icon">⚠️</div>
        <h3>Error al cargar listas</h3>
        <p>{{ error }}</p>
        <button @click="retryLoad" class="retry-btn">Reintentar</button>
      </div>
      
      <div v-else-if="colecciones.length === 0" class="state-container empty">
        <div class="empty-icon">📚</div>
        <h3>No hay listas</h3>
        <p>Comienza creando tu primera lista</p>
        <button 
          v-if="canCreateLists" 
          @click="showCreateCollection = true" 
          class="add-first-btn"
        >
          Crear primera lista
        </button>
      </div>
      
      <!-- Filtros y Vistas -->
      <div v-else class="collections-content">
        <!-- Selector de vistas predefinidas -->
        <CollectionViewSelector 
          v-model="selectedView"
          @view-selected="handleViewSelected"
        />
        
        <!-- Panel de filtros -->
        <CollectionFilters 
          v-model="currentFilters"
          @filters-changed="handleFiltersChanged"
        />
        
        <!-- Colecciones agrupadas o sin agrupar -->
        <div v-if="groupedCollections && Object.keys(groupedCollections).length > 0" class="collections-grouped">
          <div 
            v-for="(collectionsInGroup, groupTitle) in groupedCollections" 
            :key="groupTitle"
            class="collection-group"
          >
            <h2 class="group-title">{{ groupTitle }}</h2>
            <div class="collections-grid">
              <div 
                v-for="collection in collectionsInGroup" 
                :key="collection.id"
                class="collection-card"
                :class="`card-category-${collection.category.replace(' ', '-')}`"
                @click="goToCollection(collection)"
              >
                <div class="collection-icon">
                  <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                </div>
                
                <div class="collection-info">
                  <h3 class="collection-title">{{ collection.name }}</h3>
                  <p class="collection-description">{{ collection.description }}</p>
                  
                  <!-- Badges de fecha y día (solo para listas semanales y eventos con fecha) -->
                  <div v-if="collection.event_date && (collection.category === 'lista semanal' || collection.category === 'evento')" class="collection-dates">
                    <span v-if="collection.event_date" class="date-badge">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      {{ formatEventDate(collection.event_date) }}
                    </span>
                    <span 
                      v-if="collection.category === 'lista semanal' && getDayOfWeek(collection.event_date)" 
                      class="day-badge"
                      :class="`day-${getDayOfWeek(collection.event_date)}`"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {{ capitalizeDay(getDayOfWeek(collection.event_date)) }}
                    </span>
                  </div>
                  
                  <div class="collection-meta">
                    <span class="song-count">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                      </svg>
                      {{ collection.songCount || 0 }} canciones
                    </span>
                    <span 
                      class="collection-category"
                      :class="`category-${collection.category.replace(' ', '-')}`"
                    >
                      {{ getCategoryLabel(collection.category) }}
                    </span>
                  </div>
                </div>
                
                <div class="collection-actions" @click.stop>
                  <button 
                    v-if="canCreateLists"
                    @click="handleEditCollection(collection)" 
                    class="action-btn edit-btn" 
                    title="Editar"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button 
                    v-if="canCreateLists"
                    @click="handleDeleteCollection(collection)" 
                    class="action-btn delete-btn" 
                    title="Eliminar"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Grid simple cuando no hay agrupación -->
        <div v-else-if="filteredCollections.length > 0" class="collections-grid">
          <div 
            v-for="collection in filteredCollections" 
            :key="collection.id"
            class="collection-card"
            :class="`card-category-${collection.category.replace(' ', '-')}`"
            @click="goToCollection(collection)"
          >
            <div class="collection-icon">
              <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            
            <div class="collection-info">
              <h3 class="collection-title">{{ collection.name }}</h3>
              <p class="collection-description">{{ collection.description }}</p>
              
              <!-- Badges de fecha y día (solo para listas semanales y eventos con fecha) -->
              <div v-if="collection.event_date && (collection.category === 'lista semanal' || collection.category === 'evento')" class="collection-dates">
                <span v-if="collection.event_date" class="date-badge">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  {{ formatEventDate(collection.event_date) }}
                </span>
                <span 
                  v-if="collection.category === 'lista semanal' && getDayOfWeek(collection.event_date)" 
                  class="day-badge"
                  :class="`day-${getDayOfWeek(collection.event_date)}`"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ capitalizeDay(getDayOfWeek(collection.event_date)) }}
                </span>
              </div>
              
              <div class="collection-meta">
                <span class="song-count">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                  </svg>
                  {{ collection.songCount || 0 }} canciones
                </span>
                <span 
                  class="collection-category"
                  :class="`category-${(collection.category || 'otro').replace(' ', '-')}`"
                >
                  {{ getCategoryLabel(collection.category || 'otro') }}
                </span>
              </div>
            </div>
            
            <div class="collection-actions" @click.stop>
              <button 
                v-if="canCreateLists"
                @click="handleEditCollection(collection)" 
                class="action-btn edit-btn" 
                title="Editar"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              <button 
                v-if="canCreateLists"
                @click="handleDeleteCollection(collection)" 
                class="action-btn delete-btn" 
                title="Eliminar"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Estado vacío cuando no hay resultados -->
        <div v-else class="state-container empty">
          <div class="empty-icon">🔍</div>
          <h3>No se encontraron listas</h3>
          <p>Intenta ajustar los filtros para ver más resultados</p>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Eliminar lista"
      :message="`¿Estás seguro de que quieres eliminar la lista '${collectionToDelete?.name}'? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      @confirm="confirmDeleteCollection"
      @cancel="cancelDeleteCollection"
    />

    <Modal :show="showCreateCollection || showEditCollection" @close="closeModal">
      <h3 class="text-lg font-bold text-blue-900 mb-4">
        {{ isEditing ? 'Editar lista' : 'Crear nueva lista' }}
      </h3>
      <form @submit.prevent="handleFormSubmit" class="flex flex-col gap-3">
        <input
          v-model="form.name"
          type="text"
          placeholder="Nombre de la lista *"
          class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
          required
        />
        <textarea
          v-model="form.description"
          placeholder="Descripción (opcional)"
          rows="3"
          class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base resize-none"
        ></textarea>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
          <select
            v-model="form.category"
            class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
            required
          >
            <option value="lista semanal">Lista semanal</option>
            <option value="evento">Evento</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div v-if="form.category === 'lista semanal' || form.category === 'evento'">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Fecha del {{ form.category === 'lista semanal' ? 'evento' : 'evento' }} *
          </label>
          <input
            v-model="form.event_date"
            type="date"
            :required="form.category === 'lista semanal' || form.category === 'evento'"
            class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
          />
        </div>

        <div class="flex gap-2 mt-2">
          <button
            type="submit"
            class="flex-1 bg-blue-900 text-white rounded py-2 font-semibold hover:bg-blue-800 transition"
          >
            {{ isEditing ? 'Actualizar' : 'Crear' }}
          </button>
          <button
            type="button"
            @click="closeModal"
            class="flex-1 bg-gray-200 text-gray-700 rounded py-2 font-semibold hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useNotifications } from '@/composables/useNotifications';
import { usePermissions } from '@/composables/usePermissions';
import { useColeccionesStore } from '../stores/colecciones';
import { storeToRefs } from 'pinia';
import Modal from "../components/Modal.vue";
import ConfirmModal from "../components/ConfirmModal.vue";
import CollectionFilters from "../components/CollectionFilters.vue";
import CollectionViewSelector from "../components/CollectionViewSelector.vue";
import { Collection, DayOfWeek } from '../types/songTypes';

// Tipo para vistas predefinidas
type ViewType = 'all' | 'current-month' | 'last-month' | 'sundays' | 'wednesdays' | 'events' | 'others';

const router = useRouter();
const { success, error: showError } = useNotifications();
const { canCreateLists } = usePermissions();
const coleccionesStore = useColeccionesStore();
const { colecciones, loading, error } = storeToRefs(coleccionesStore);

// Helper functions del store
const { getDayOfWeek, formatEventDate, getMonthYear, filterColecciones, sortColecciones } = coleccionesStore;

const showCreateCollection = ref(false);
const showEditCollection = ref(false);
const showDeleteModal = ref(false);
const collectionToDelete = ref<Collection | null>(null);
const editingCollection = ref<Collection | null>(null);

// Estado de filtros y vistas
const selectedView = ref<ViewType>('all');
const currentFilters = ref<{
  searchQuery?: string;
  category?: 'lista semanal' | 'evento' | 'otro';
  period?: 'all' | 'current-month' | 'last-month' | 'custom';
  dateStart?: string;
  dateEnd?: string;
  dayFilter?: 'all' | 'domingo' | 'miércoles' | 'viernes' | 'custom';
  selectedDays?: DayOfWeek[];
  sortBy?: 'event_date' | 'name' | 'created_at' | 'songCount';
  sortOrder?: 'asc' | 'desc';
}>({
  sortBy: 'event_date',
  sortOrder: 'desc'
});

const form = ref({
  name: '',
  description: '',
  category: 'lista semanal' as 'lista semanal' | 'evento' | 'otro',
  event_date: ''
});

// Computed properties
const isEditing = computed(() => showEditCollection.value);

// Colecciones filtradas
const filteredCollections = computed(() => {
  const filters = currentFilters.value;
  
  // Convertir dayFilter a array de días si es necesario
  let daysOfWeek: DayOfWeek[] | undefined = undefined;
  if (filters.dayFilter === 'custom' && filters.selectedDays && filters.selectedDays.length > 0) {
    daysOfWeek = filters.selectedDays;
  } else if (filters.dayFilter && filters.dayFilter !== 'all' && filters.dayFilter !== 'custom') {
    daysOfWeek = [filters.dayFilter as DayOfWeek];
  }
  
  // Convertir period a dateRange si es necesario
  let dateRange: { start?: string; end?: string } | undefined = undefined;
  if (filters.period === 'custom' && (filters.dateStart || filters.dateEnd)) {
    dateRange = {
      start: filters.dateStart,
      end: filters.dateEnd
    };
  } else if (filters.period === 'current-month') {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    dateRange = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  } else if (filters.period === 'last-month') {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    dateRange = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }
  
  return filterColecciones(
    filters.searchQuery,
    filters.category,
    dateRange,
    daysOfWeek,
    undefined, // monthFilter
    filters.sortBy || 'event_date',
    filters.sortOrder || 'desc'
  );
});

// Agrupar colecciones por mes (solo si hay filtros de fecha o si hay listas con fecha)
const groupedCollections = computed(() => {
  const filtered = filteredCollections.value;
  
  // Agrupar solo si hay filtros de fecha/mes activos
  const hasDateFilter = currentFilters.value.period && currentFilters.value.period !== 'all' 
    || currentFilters.value.dateStart 
    || currentFilters.value.dateEnd;
  
  // Si no hay filtros de fecha, no agrupar
  if (!hasDateFilter) {
    return null;
  }
  
  const grouped: Record<string, Collection[]> = {};
  const others: Collection[] = [];
  
  filtered.forEach(collection => {
    // Si no tiene fecha, va a "Otros"
    const category = collection.category || 'otro';
    if (!collection.event_date || (category !== 'lista semanal' && category !== 'evento')) {
      others.push(collection);
      return;
    }
    
    const monthYear = getMonthYear(collection.event_date);
    if (monthYear) {
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(collection);
    } else {
      others.push(collection);
    }
  });
  
  // Ordenar cada grupo según el ordenamiento seleccionado
  const sortBy = currentFilters.value.sortBy || 'event_date';
  const sortOrder = currentFilters.value.sortOrder || 'desc';
  
  Object.keys(grouped).forEach(month => {
    grouped[month] = sortColecciones(grouped[month], sortBy, sortOrder);
  });
  
  // Agregar "Otros" al final si hay elementos (también ordenados)
  if (others.length > 0) {
    const sortBy = currentFilters.value.sortBy || 'event_date';
    const sortOrder = currentFilters.value.sortOrder || 'desc';
    grouped['Otros'] = sortColecciones(others, sortBy, sortOrder);
  }
  
  // Ordenar meses (más recientes primero)
  const sortedGroups: Record<string, Collection[]> = {};
  const sortedMonths = Object.keys(grouped).sort((a, b) => {
    if (a === 'Otros') return 1;
    if (b === 'Otros') return -1;
    // Convertir mes año a fecha para comparar
    try {
      const dateA = new Date(a + ' 1');
      const dateB = new Date(b + ' 1');
      return dateB.getTime() - dateA.getTime();
    } catch {
      return 0;
    }
  });
  
  sortedMonths.forEach(month => {
    sortedGroups[month] = grouped[month];
  });
  
  return Object.keys(sortedGroups).length > 0 ? sortedGroups : null;
});

// Methods
onMounted(async () => {
  await coleccionesStore.loadColecciones();
});

function closeModal() {
  showCreateCollection.value = false;
  showEditCollection.value = false;
  editingCollection.value = null;
  form.value = { 
    name: '', 
    description: '', 
    category: 'lista semanal',
    event_date: ''
  };
}

function handleFormSubmit() {
  // Validar que si la categoría requiere fecha, esta esté presente
  if ((form.value.category === 'lista semanal' || form.value.category === 'evento') && !form.value.event_date) {
    showError('Error', 'La fecha es requerida para listas semanales y eventos');
    return;
  }
  
  if (isEditing.value) {
    updateCollection();
  } else {
    createCollection();
  }
}

function goToCollection(collection: Collection) {
  router.push(`/coleccion/${collection.id}`);
}

async function retryLoad() {
  await coleccionesStore.loadColecciones();
}

async function createCollection() {
  if (!form.value.name.trim()) return;

  try {
    const newCollection = await coleccionesStore.createColeccion({
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
      category: form.value.category,
      event_date: (form.value.category === 'lista semanal' || form.value.category === 'evento') && form.value.event_date ? form.value.event_date : undefined
    });

    success('Éxito', `Lista "${newCollection.name}" creada correctamente`);
    closeModal();
  } catch (err) {
    console.error('Error al crear colección:', err);
    showError('Error', 'No se pudo crear la lista. Inténtalo de nuevo.');
  }
}

function handleEditCollection(collection: Collection) {
  editingCollection.value = collection;
  showEditCollection.value = true;
  
  form.value = {
    name: collection.name,
    description: collection.description || '',
    category: collection.category,
    event_date: collection.event_date || ''
  };
}

async function updateCollection() {
  if (!form.value.name.trim() || !editingCollection.value) return;

  try {
    await coleccionesStore.updateColeccion(editingCollection.value.id, {
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
      category: form.value.category,
      event_date: (form.value.category === 'lista semanal' || form.value.category === 'evento') && form.value.event_date ? form.value.event_date : undefined
    });
    
    success('Éxito', `Lista "${form.value.name}" actualizada correctamente`);
    closeModal();
  } catch (err) {
    console.error('Error al actualizar colección:', err);
    showError('Error', 'No se pudo actualizar la lista. Inténtalo de nuevo.');
  }
}

function handleDeleteCollection(collection: Collection) {
  collectionToDelete.value = collection;
  showDeleteModal.value = true;
}

function cancelDeleteCollection() {
  collectionToDelete.value = null;
  showDeleteModal.value = false;
}

async function confirmDeleteCollection() {
  if (!collectionToDelete.value) return;

  try {
    await coleccionesStore.deleteColeccion(collectionToDelete.value.id);
    success('Éxito', `Lista "${collectionToDelete.value.name}" eliminada correctamente`);
    cancelDeleteCollection();
  } catch (err) {
    console.error('Error al eliminar colección:', err);
    showError('Error', 'No se pudo eliminar la lista. Inténtalo de nuevo.');
  }
}

function getCategoryLabel(category: string): string {
  const labels = {
    'lista semanal': 'Lista semanal',
    'evento': 'Evento',
    'otro': 'Otro'
  };
  return labels[category as keyof typeof labels] || category;
}

function capitalizeDay(day: string | null): string {
  if (!day) return '';
  return day.charAt(0).toUpperCase() + day.slice(1);
}

// Manejar selección de vista predefinida
function handleViewSelected(view: ViewType, filters: any) {
  selectedView.value = view;
  // Mantener los valores de ordenamiento si no se especifican
  currentFilters.value = {
    ...filters || {},
    sortBy: filters?.sortBy || currentFilters.value.sortBy || 'event_date',
    sortOrder: filters?.sortOrder || currentFilters.value.sortOrder || 'desc'
  };
}

// Manejar cambios en filtros manuales
function handleFiltersChanged(filters: any) {
  // Si se cambian filtros manualmente, resetear la vista a 'all'
  if (selectedView.value !== 'all') {
    selectedView.value = 'all';
  }
  currentFilters.value = filters || {};
}
</script>

<style scoped>
.collections-container {
  min-height: 100vh;
  background: var(--color-background);
  display: flex;
  flex-direction: column;
  transition: background-color var(--transition-normal);
}

/* Header */
.collections-header {
  background: var(--color-background-card);
  border-bottom: 1px solid var(--color-border);
  padding: 1rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all var(--transition-normal);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
  transition: color var(--transition-normal);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.add-btn {
  background: var(--color-background-card);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-btn:hover {
  background: var(--color-background-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}


/* Main Content */
.collections-main {
  flex: 1;
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  background: var(--color-background);
  transition: background-color var(--transition-normal);
}

/* Contenedor de filtros y colecciones */
.collections-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 480px) {
  .collections-content {
    gap: 0.75rem;
  }
}

/* Colecciones agrupadas */
.collections-grouped {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.collection-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.group-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-border);
  transition: color var(--transition-normal);
}

/* States */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-text-mute);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon, .empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error h3, .empty h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
}

.error p, .empty p {
  color: var(--color-text-soft);
  margin: 0 0 1.5rem 0;
}

.retry-btn, .add-first-btn {
  background: var(--color-background-card);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.retry-btn:hover, .add-first-btn:hover {
  background: var(--color-background-hover);
  border-color: var(--color-border-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* Collections Grid */
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  background: var(--color-background);
  transition: background-color var(--transition-normal);
}

.collection-card {
  background: var(--color-background-card);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.collection-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* Indicadores visuales por categoría */
.card-category-lista-semanal:hover,
.card-category-evento:hover,
.card-category-otro:hover {
  box-shadow: var(--shadow-md);
}

.collection-icon {
  background: var(--color-background-soft);
  color: var(--color-text-mute);
  padding: 0.75rem;
  border-radius: 8px;
  flex-shrink: 0;
  transition: all var(--transition-normal);
}

.collection-info {
  flex: 1;
  min-width: 0;
}

.collection-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
  transition: color var(--transition-normal);
}

.collection-description {
  font-size: 0.9rem;
  color: var(--color-text-soft);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  transition: color var(--transition-normal);
}

/* Badges de fecha y día */
.collection-dates {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.date-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.date-badge svg {
  flex-shrink: 0;
}

.day-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--color-background-mute);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.day-badge svg {
  flex-shrink: 0;
  opacity: 0.7;
}

.day-domingo,
.day-lunes,
.day-martes,
.day-miércoles,
.day-jueves,
.day-viernes,
.day-sábado {
  background: var(--color-background-mute);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.collection-meta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.song-count {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--color-background-soft);
  color: var(--color-text);
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all var(--transition-normal);
}

.song-count svg {
  flex-shrink: 0;
  opacity: 0.7;
}

.collection-category {
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all var(--transition-normal);
}

.category-lista-semanal {
  background: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.category-evento {
  background: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.category-otro {
  background: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.collection-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  color: var(--color-text-mute);
}

.edit-btn:hover {
  background: var(--color-background-hover);
  color: var(--color-info);
}

.delete-btn {
  color: var(--color-text-mute);
}

.delete-btn:hover {
  background: var(--color-error);
  color: var(--color-text-inverse);
  opacity: 0.1;
}

/* Responsive */
@media (max-width: 768px) {
  .collections-header {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .add-btn {
    justify-content: center;
  }
  
  .collections-main {
    padding: 1rem;
  }
  
  .collections-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .collection-card {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.25rem;
  }
  
  .collection-title {
    font-size: 1rem;
  }
  
  .collection-description {
    font-size: 0.85rem;
  }
}
</style>
