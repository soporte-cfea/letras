<template>
  <div class="collections-container">
    <!-- Header -->
    <header class="collections-header">
      <div class="header-content">
        <h1 class="page-title">Listas</h1>
        <div class="header-actions">
          <RefreshButton 
            :on-click="refreshData" 
            title="Recargar listas"
          />
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
        
        <!-- Panel de filtros y acciones -->
        <div class="filters-actions-bar">
          <!-- Fila de botones -->
          <div class="filters-buttons-row">
            <CollectionFilters 
              ref="filtersComponentRef"
              v-model="currentFilters"
              :separate-panel="true"
              @filters-changed="handleFiltersChanged"
              @toggle-expanded="handleFiltersToggle"
            />
            <button 
              @click="toggleAllCollections"
              class="expand-all-btn"
              :title="allExpanded ? 'Cerrar todas las listas' : 'Expandir todas las listas'"
            >
              <svg v-if="allExpanded" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <path d="M1 1l22 22"/>
              </svg>
              <svg v-else width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span>{{ allExpanded ? 'Cerrar listas' : 'Expandir listas' }}</span>
            </button>
          </div>
          <!-- Panel de filtros (se renderiza fuera del contenedor flex) -->
          <div v-if="filtersExpanded" class="filters-panel-wrapper">
            <CollectionFilters 
              v-model="currentFilters"
              :panel-only="true"
              @filters-changed="handleFiltersChanged"
            />
          </div>
        </div>
        
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
                <div class="collection-header">
                  <div class="collection-icon-small">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                  </div>
                  
                  <div class="collection-info">
                    <h3 class="collection-title">{{ getCollectionCardTitle(collection) }}</h3>
                    <p v-if="getCollectionSubtitle(collection)" class="collection-subtitle">{{ getCollectionSubtitle(collection) }}</p>
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
                  <button
                    v-if="collection.songCount && collection.songCount > 0"
                    @click="toggleSongsPreview(collection)"
                    class="action-btn view-btn"
                    :class="{ active: expandedCollections.has(collection.id) }"
                    title="Ver canciones"
                  >
                    <svg v-if="expandedCollections.has(collection.id)" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <svg v-else width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <path d="M1 1l22 22"/>
                    </svg>
                  </button>
                  </div>
                </div>
                
                <div class="collection-content">
                  <p v-if="collection.description" class="collection-description">{{ collection.description }}</p>
                  
                  <div class="collection-meta">
                    <span class="song-count">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                      </svg>
                      {{ collection.songCount || 0 }} canciones
                    </span>
                  </div>
                  
                  <!-- Contenido expandido de canciones -->
                  <div 
                    v-if="expandedCollections.has(collection.id)" 
                    class="collection-songs-expanded"
                  >
                    <ul v-if="collectionSongs[collection.id] && collectionSongs[collection.id].length > 0" class="songs-list">
                      <li
                        v-for="(song, index) in collectionSongs[collection.id]"
                        :key="song.id"
                        class="song-item"
                      >
                        <span class="song-number">{{ index + 1 }}</span>
                        <div class="song-details">
                          <span class="song-title">{{ song.title }}</span>
                          <span v-if="song.artist" class="song-artist">{{ song.artist }}</span>
                        </div>
                      </li>
                    </ul>
                    
                    <div v-else-if="!collectionLoading[collection.id] && collectionSongs[collection.id] && collectionSongs[collection.id].length === 0" class="songs-empty">
                      <p>No hay canciones en esta lista</p>
                    </div>
                  </div>
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
            <div class="collection-header">
              <div class="collection-icon-small">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </div>
              
              <div class="collection-info">
                <h3 class="collection-title">{{ getCollectionCardTitle(collection) }}</h3>
                <p v-if="getCollectionSubtitle(collection)" class="collection-subtitle">{{ getCollectionSubtitle(collection) }}</p>
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
                <button
                  v-if="collection.songCount && collection.songCount > 0"
                  @click="toggleSongsPreview(collection)"
                  class="action-btn view-btn"
                  :class="{ active: expandedCollections.has(collection.id) }"
                  title="Ver canciones"
                >
                  <svg v-if="expandedCollections.has(collection.id)" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <path d="M1 1l22 22"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="collection-content">
              <p v-if="collection.description" class="collection-description">{{ collection.description }}</p>
              
              <div class="collection-meta">
                <span class="song-count">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                  </svg>
                  {{ collection.songCount || 0 }} canciones
                </span>
              </div>
              
              <!-- Contenido expandido de canciones -->
              <div 
                v-if="expandedCollections.has(collection.id)" 
                class="collection-songs-expanded"
              >
                <ul v-if="collectionSongs[collection.id] && collectionSongs[collection.id].length > 0" class="songs-list">
                  <li
                    v-for="(song, index) in collectionSongs[collection.id]"
                    :key="song.id"
                    class="song-item"
                  >
                    <span class="song-number">{{ index + 1 }}</span>
                    <div class="song-details">
                      <span class="song-title">{{ song.title }}</span>
                      <span v-if="song.artist" class="song-artist">{{ song.artist }}</span>
                    </div>
                  </li>
                </ul>
                
                <div v-else-if="!collectionLoading[collection.id] && collectionSongs[collection.id] && collectionSongs[collection.id].length === 0" class="songs-empty">
                  <p>No hay canciones en esta lista</p>
                </div>
              </div>
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
          placeholder="Nombre de la lista (opcional)"
          class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
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
import { SectionsService } from '../api/sections';
import { storeToRefs } from 'pinia';
import Modal from "../components/Modal.vue";
import ConfirmModal from "../components/ConfirmModal.vue";
import CollectionFilters from "../components/CollectionFilters.vue";
import CollectionViewSelector from "../components/CollectionViewSelector.vue";
import RefreshButton from "../components/RefreshButton.vue";
import { Collection, DayOfWeek, CancionEnLista } from '../types/songTypes';

// Tipo para vistas predefinidas
type ViewType = 'all' | 'current-month' | 'last-month' | 'sundays' | 'wednesdays' | 'events' | 'others';

const router = useRouter();
const { success, error: showError } = useNotifications();
const { canCreateLists } = usePermissions();
const coleccionesStore = useColeccionesStore();
const { colecciones, loading, error } = storeToRefs(coleccionesStore);

// Helper functions del store
const { getDayOfWeek, formatEventDate, getMonthYear, filterColecciones, sortColecciones, sortColeccionesByCurrentMonth } = coleccionesStore;

const showCreateCollection = ref(false);
const showEditCollection = ref(false);
const showDeleteModal = ref(false);
const refreshing = ref(false);
const collectionToDelete = ref<Collection | null>(null);
const editingCollection = ref<Collection | null>(null);
const filtersExpanded = ref(false);

// Estado para preview de canciones (múltiples cards pueden estar abiertas)
const expandedCollections = ref<Set<string>>(new Set());
const collectionSongs = ref<Record<string, CancionEnLista[]>>({});
const collectionLoading = ref<Record<string, boolean>>({});
const songsCache = ref<Record<string, CancionEnLista[]>>({});

// Estado de filtros y vistas
const selectedView = ref<ViewType>('current-month');
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
  period: 'current-month',
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

// Computed para detectar si todas las colecciones visibles con canciones están expandidas
const allExpanded = computed(() => {
  // Obtener todas las colecciones visibles
  const allVisibleCollections: Collection[] = [];
  
  if (groupedCollections.value) {
    Object.values(groupedCollections.value).forEach(collectionsInGroup => {
      allVisibleCollections.push(...collectionsInGroup);
    });
  } else if (filteredCollections.value.length > 0) {
    allVisibleCollections.push(...filteredCollections.value);
  }
  
  // Filtrar solo las que tienen canciones
  const collectionsWithSongs = allVisibleCollections.filter(
    collection => collection.songCount && collection.songCount > 0
  );
  
  if (collectionsWithSongs.length === 0) {
    return false;
  }
  
  // Verificar si todas están expandidas
  return collectionsWithSongs.every(collection => 
    expandedCollections.value.has(collection.id)
  );
});

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
  
  const filtered = filterColecciones(
    filters.searchQuery,
    filters.category,
    dateRange,
    daysOfWeek,
    undefined, // monthFilter
    filters.sortBy || 'event_date',
    filters.sortOrder || 'desc'
  );
  
  // Si el filtro es "current-month" y se ordena por event_date, usar ordenamiento inteligente
  if (filters.period === 'current-month' && (filters.sortBy === 'event_date' || !filters.sortBy)) {
    return sortColeccionesByCurrentMonth(filtered);
  }
  
  return filtered;
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
  
  // Obtener el mes actual para aplicar ordenamiento inteligente
  const now = new Date();
  const currentMonthYear = getMonthYear(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
  
  Object.keys(grouped).forEach(month => {
    // Si es el mes actual y el periodo es "current-month", usar ordenamiento inteligente
    if (currentFilters.value.period === 'current-month' && month === currentMonthYear && (sortBy === 'event_date' || !sortBy)) {
      grouped[month] = sortColeccionesByCurrentMonth(grouped[month]);
    } else {
      grouped[month] = sortColecciones(grouped[month], sortBy, sortOrder);
    }
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
  // Limpiar caché de canciones para asegurar que se carguen con el orden correcto
  songsCache.value = {};
  collectionSongs.value = {};
  
  await coleccionesStore.loadColecciones();
  // Aplicar filtros iniciales para "Este mes"
  handleViewSelected('current-month', {
    period: 'current-month',
    sortBy: 'event_date',
    sortOrder: 'desc'
  });
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

async function refreshData() {
  await coleccionesStore.loadColecciones(true); // forceRefresh = true
}

async function createCollection() {
  try {
    const nameValue = form.value.name?.trim() || undefined;
    const descriptionValue = form.value.description?.trim() || undefined;
    
    const newCollection = await coleccionesStore.createColeccion({
      name: nameValue,
      description: descriptionValue,
      category: form.value.category,
      event_date: (form.value.category === 'lista semanal' || form.value.category === 'evento') && form.value.event_date ? form.value.event_date : undefined
    });

    const collectionName = newCollection.name || 'Lista';
    success('Éxito', `Lista "${collectionName}" creada correctamente`);
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
    name: collection.name || '',
    description: collection.description || '',
    category: collection.category,
    event_date: collection.event_date || ''
  };
}

async function updateCollection() {
  if (!editingCollection.value) return;

  try {
    const nameValue = form.value.name?.trim() || undefined;
    const descriptionValue = form.value.description?.trim() || undefined;
    
    await coleccionesStore.updateColeccion(editingCollection.value.id, {
      name: nameValue,
      description: descriptionValue,
      category: form.value.category,
      event_date: (form.value.category === 'lista semanal' || form.value.category === 'evento') && form.value.event_date ? form.value.event_date : undefined
    });
    
    const collectionName = nameValue || 'Lista';
    success('Éxito', `Lista "${collectionName}" actualizada correctamente`);
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

// Función para obtener el título de la colección en las cards
function getCollectionCardTitle(collection: Collection): string {
  // Listas semanales: siempre "Lista semanal" (ignorar name)
  if (collection.category === 'lista semanal') {
    return 'Lista semanal';
  }
  
  // Listas de eventos: usar el name o vacío
  if (collection.category === 'evento') {
    return collection.name || '';
  }
  
  // Listas "Otro": usar el name
  return collection.name || '';
}

// Función para obtener el subtítulo de la colección en las cards
function getCollectionSubtitle(collection: Collection): string {
  // Solo listas semanales y eventos tienen subtítulo (día + fecha)
  if ((collection.category === 'lista semanal' || collection.category === 'evento') && collection.event_date) {
    const day = getDayOfWeek(collection.event_date);
    const date = formatEventDate(collection.event_date);
    
    if (day && date) {
      return `${capitalizeDay(day)} ${date}`;
    } else if (date) {
      return date;
    }
  }
  
  return '';
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

// Manejar toggle de filtros
function handleFiltersToggle(expanded: boolean) {
  filtersExpanded.value = expanded;
}

// Función auxiliar para obtener todas las colecciones visibles con canciones
function getVisibleCollectionsWithSongs(): Collection[] {
  const allVisibleCollections: Collection[] = [];
  
  if (groupedCollections.value) {
    Object.values(groupedCollections.value).forEach(collectionsInGroup => {
      allVisibleCollections.push(...collectionsInGroup);
    });
  } else if (filteredCollections.value.length > 0) {
    allVisibleCollections.push(...filteredCollections.value);
  }
  
  return allVisibleCollections.filter(
    collection => collection.songCount && collection.songCount > 0
  );
}

// Función para expandir o cerrar todas las colecciones visibles
function toggleAllCollections() {
  const collectionsWithSongs = getVisibleCollectionsWithSongs();
  
  if (collectionsWithSongs.length === 0) {
    return;
  }
  
  // Si todas están expandidas, cerrarlas todas
  if (allExpanded.value) {
    collectionsWithSongs.forEach(collection => {
      expandedCollections.value.delete(collection.id);
    });
  } else {
    // Si no todas están expandidas, expandirlas todas
    collectionsWithSongs.forEach(collection => {
      if (!expandedCollections.value.has(collection.id)) {
        expandedCollections.value.add(collection.id);
        
        // Si no están en caché, cargarlas
        if (!songsCache.value[collection.id]) {
          loadCollectionSongs(collection.id);
        } else {
          collectionSongs.value[collection.id] = songsCache.value[collection.id];
        }
      }
    });
  }
}

// Función auxiliar para cargar canciones de una colección
function loadCollectionSongs(collectionId: string) {
  // Inicializar como array vacío para que la sección se expanda
  collectionSongs.value[collectionId] = [];
  collectionLoading.value[collectionId] = true;
  
  SectionsService.getSongsBySection(collectionId)
    .then(data => {
      // Aplanar las canciones respetando el orden de las secciones
      const sortedSections = [...data.sections].sort((a, b) => a.order_index - b.order_index);
      const allSongs: CancionEnLista[] = [];
      
      sortedSections.forEach(section => {
        allSongs.push(...section.songs);
      });
      
      allSongs.push(...data.unassignedSongs);
      
      collectionSongs.value[collectionId] = allSongs;
      songsCache.value[collectionId] = allSongs;
    })
    .catch(err => {
      console.error('Error loading preview songs:', err);
      collectionSongs.value[collectionId] = [];
    })
    .finally(() => {
      collectionLoading.value[collectionId] = false;
    });
}

// Funciones para expandir/contraer canciones en la card
function toggleSongsPreview(collection: Collection) {
  const collectionId = collection.id;
  
  // Si ya está abierto, cerrar
  if (expandedCollections.value.has(collectionId)) {
    expandedCollections.value.delete(collectionId);
    return;
  }

  // Abrir nueva colección inmediatamente (sin bloquear)
  expandedCollections.value.add(collectionId);
  
  // Si ya tenemos las canciones en caché, usarlas directamente (ya vienen ordenadas)
  if (songsCache.value[collectionId]) {
    collectionSongs.value[collectionId] = songsCache.value[collectionId];
    return;
  }

  // Cargar canciones usando la función auxiliar
  loadCollectionSongs(collectionId);
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

/* Barra de filtros y acciones */
.filters-actions-bar {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.filters-buttons-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filters-panel-wrapper {
  width: 100%;
  margin-top: 0.75rem;
}

.expand-all-btn {
  background: var(--color-background-soft);
  color: var(--color-text-soft);
  border: 1px solid var(--color-border);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  flex-shrink: 0;
  height: fit-content;
}

.expand-all-btn:hover {
  background: var(--color-background-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.expand-all-btn svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

@media (max-width: 768px) {
  .filters-buttons-row {
    width: 100%;
  }
  
  .expand-all-btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .collections-content {
    gap: 0.75rem;
  }
  
  .expand-all-btn {
    padding: 0.625rem 0.875rem;
    font-size: 0.85rem;
  }
  
  .expand-all-btn span {
    font-size: 0.85rem;
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
  flex-direction: column;
  gap: 0;
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

.collection-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.collection-icon-small {
  background: var(--color-background-soft);
  color: var(--color-text-mute);
  padding: 0.5rem;
  border-radius: 6px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal);
}

.collection-card:hover .collection-icon-small {
  background: var(--color-background-hover);
  color: var(--color-accent);
}

.collection-info {
  flex: 1;
  min-width: 0;
}

.collection-content {
  margin-top: 0.75rem;
}

.collection-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
  transition: color var(--transition-normal);
}

.collection-subtitle {
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--color-text-soft);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
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

.view-btn {
  color: var(--color-text-mute);
  opacity: 0.7;
}

.view-btn:hover {
  opacity: 1;
  color: var(--color-info);
  background: var(--color-background-hover);
}

.view-btn.active {
  opacity: 1;
  color: var(--color-info);
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
  margin-left: auto;
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

/* Expansión de canciones en la card */
.collection-songs-expanded {
  margin-top: 0.75rem;
  animation: expandDown 0.3s ease-out;
}

@keyframes expandDown {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 500px;
    transform: translateY(0);
  }
}


/* Lista de canciones */
.songs-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 400px;
  overflow-y: auto;
}

.song-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem 0;
  transition: background var(--transition-normal);
}

.song-item:hover {
  background: var(--color-background-hover);
  margin: 0 -0.5rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  border-radius: 6px;
}

.song-item .song-number {
  font-size: 0.75rem;
  color: var(--color-text-mute);
  font-weight: 600;
  flex-shrink: 0;
  min-width: 24px;
  text-align: right;
  padding-top: 0.1rem;
}

.song-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.song-item .song-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.4;
}

.song-item .song-artist {
  font-size: 0.75rem;
  color: var(--color-text-soft);
  line-height: 1.3;
}

.songs-empty {
  padding: 1.5rem 0;
  text-align: center;
  color: var(--color-text-mute);
  font-size: 0.875rem;
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
