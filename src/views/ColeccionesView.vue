<template>
  <div class="collections-container">
    <!-- Header -->
    <header class="collections-header">
      <div class="header-content">
        <div class="header-leading">
          <h1 class="page-title">{{ LISTAS_VIEW_TITLE }}</h1>
          <button
            v-if="canCreateLists && draftCount > 0"
            type="button"
            class="drafts-count-pill"
            :class="{ 'drafts-count-pill--active': showDraftsOnly }"
            :title="showDraftsOnly ? 'Ver todas las listas' : 'Ver solo borradores'"
            @click="toggleDraftsFilter"
          >
            {{ draftCount }} {{ draftCount === 1 ? 'borrador' : 'borradores' }}
          </button>
        </div>
        <div class="header-actions">
          <RefreshButton
            :on-click="refreshData"
            title="Recargar listas"
          />
          <button
            v-if="canCreateLists"
            type="button"
            @click="showCreateCollection = true"
            class="add-btn"
            title="Nueva lista"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 5v14m7-7H5"/>
            </svg>
            <span class="add-btn__label">Nueva lista</span>
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
      
      <!-- Filtros y listas -->
      <div v-else class="collections-content">
        <div class="collections-toolbar">
          <!-- Fila 1: solo filtro de tiempo -->
          <div class="collections-toolbar__time">
            <TimeRangePreset
              v-model="dateRange"
              v-model:preset="timePreset"
            />
          </div>
          <!-- Fila 2: chips izq · ojito der -->
          <div class="collections-toolbar__filters">
            <div class="collections-toolbar__chips">
              <FilterChipGroup
                v-model="categoryChips"
                :options="categoryChipOptions"
                :multiple="false"
              />
              <FilterChipGroup
                v-if="!showOthersOnly"
                v-model="selectedDayChips"
                :options="dayChipOptions"
                :multiple="true"
              />
            </div>
            <button
              type="button"
              @click="toggleAllCollections"
              class="expand-all-btn"
              :class="{ 'expand-all-btn--active': allExpanded }"
              :title="allExpanded ? 'Cerrar todas las listas' : 'Expandir todas las listas'"
              :aria-label="allExpanded ? 'Cerrar todas las listas' : 'Expandir todas las listas'"
              :aria-pressed="allExpanded"
            >
              <svg v-if="allExpanded" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <path d="M1 1l22 22"/>
              </svg>
              <svg v-else width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Lista de colecciones -->

        <div v-if="filteredCollections.length > 0" class="collections-grid">
          <div 
            v-for="collection in filteredCollections" 
            :key="collection.id"
            class="collection-card"
            :class="[
              `card-category-${collection.category.replace(' ', '-')}`,
              { 'collection-card-menu-open': openMenuCollectionId === collection.id },
              { 'collection-card--draft': canCreateLists && isDraft(collection) }
            ]"
            @click="goToCollection(collection)"
          >
            <div class="collection-header">
              <div class="collection-icon-small">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </div>
              
              <div class="collection-info">
                <h3 class="collection-title">
                  <span>{{ getCollectionCardTitle(collection) }}</span>
                </h3>
                <p v-if="getCollectionSubtitle(collection)" class="collection-subtitle">{{ getCollectionSubtitle(collection) }}</p>
              </div>
              
              <div class="collection-actions" @click.stop>
                <div class="collection-card-options-menu">
                  <button
                    @click="toggleCollectionMenu(collection.id)"
                    class="menu-toggle"
                    :class="{ active: openMenuCollectionId === collection.id }"
                    title="Opciones de la lista"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                    </svg>
                  </button>
                  <div v-if="openMenuCollectionId === collection.id" class="collection-card-dropdown">
                    <button
                      @click="refreshData(); closeCollectionMenu()"
                      class="dropdown-action"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      Actualizar
                    </button>
                    <button
                      v-if="canCreateLists"
                      @click="handleEditCollection(collection); closeCollectionMenu()"
                      class="dropdown-action"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      Editar
                    </button>
                    <button
                      v-if="canCreateLists && isDraft(collection) && (collection.songCount ?? 0) > 0"
                      @click="handlePublishCollection(collection); closeCollectionMenu()"
                      class="dropdown-action"
                      :disabled="publishingCollectionId === collection.id"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                      {{ publishingCollectionId === collection.id ? 'Publicando...' : 'Publicar' }}
                    </button>
                    <button
                      v-if="canCreateLists && !isDraft(collection)"
                      @click="handleUnpublishCollection(collection); closeCollectionMenu()"
                      class="dropdown-action"
                      :disabled="publishingCollectionId === collection.id"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 014.52-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <path d="M1 1l22 22"/>
                      </svg>
                      Despublicar
                    </button>
                    <button
                      v-if="canCreateLists"
                      @click="handleDeleteCollection(collection); closeCollectionMenu()"
                      class="dropdown-action delete"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                      Eliminar
                    </button>
                    <button
                      v-if="collection.songCount && collection.songCount > 0"
                      @click="toggleSongsPreview(collection); closeCollectionMenu()"
                      class="dropdown-action"
                      :class="{ active: expandedCollections.has(collection.id) }"
                    >
                      <svg v-if="expandedCollections.has(collection.id)" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      <svg v-else width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <path d="M1 1l22 22"/>
                      </svg>
                      {{ expandedCollections.has(collection.id) ? 'Ocultar canciones' : 'Expandir canciones' }}
                    </button>
                    <button
                      @click="goToSharedView(collection)"
                      class="dropdown-action"
                      :disabled="sharingCollectionId === collection.id"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                      {{ sharingCollectionId === collection.id ? 'Generando...' : 'Vista compartida' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="collection-content">
              <p v-if="collection.description" class="collection-description">{{ collection.description }}</p>
              
              <div class="collection-meta">
                <button
                  type="button"
                  class="song-count"
                  :class="{
                    'song-count--interactive': (collection.songCount || 0) > 0,
                    'song-count--expanded': expandedCollections.has(collection.id)
                  }"
                  :disabled="!(collection.songCount && collection.songCount > 0)"
                  :title="(collection.songCount || 0) > 0
                    ? (expandedCollections.has(collection.id) ? 'Ocultar canciones' : 'Ver canciones')
                    : undefined"
                  :aria-label="(collection.songCount || 0) > 0
                    ? (expandedCollections.has(collection.id) ? 'Ocultar canciones' : 'Ver canciones')
                    : undefined"
                  :aria-expanded="(collection.songCount || 0) > 0
                    ? expandedCollections.has(collection.id)
                    : undefined"
                  @click.stop="(collection.songCount || 0) > 0 && toggleSongsPreview(collection)"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                  </svg>
                  <span>{{ collection.songCount || 0 }} canciones</span>
                  <svg
                    v-if="(collection.songCount || 0) > 0"
                    class="song-count__chevron"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                <span
                  v-if="getRelativeLabel(collection)"
                  class="relative-when"
                  :class="relativeWhenClass(collection)"
                >
                  {{ getRelativeLabel(collection) }}
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

    <ConfirmModal
      :show="showUnpublishModal"
      title="Despublicar lista"
      :message="`La lista dejará de verse para quienes no pueden editarla. Podrás publicarla de nuevo cuando quieras.`"
      confirm-text="Despublicar"
      @confirm="confirmUnpublishCollection"
      @cancel="cancelUnpublishCollection"
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
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useNotifications } from '@/composables/useNotifications';
import { usePermissions } from '@/composables/usePermissions';
import { useColeccionesStore } from '../stores/colecciones';
import { SectionsService } from '../api/sections';
import { CollectionsService } from '../api/collections';
import { storeToRefs } from 'pinia';
import Modal from "../components/Modal.vue";
import ConfirmModal from "../components/ConfirmModal.vue";
import FilterChipGroup from "../components/common/FilterChipGroup.vue";
import TimeRangePreset from "../components/common/TimeRangePreset.vue";
import {
  getDefaultUpcomingDateRange,
  getRangeForPreset,
  getRelativeUpcomingLabel,
  daysFromToday,
  type DateRangeValue,
  type TimePresetId,
} from "../utils/dateRange";

interface FilterChipOption {
  value: string
  label: string
  title?: string
}
import RefreshButton from "../components/RefreshButton.vue";
import { Collection, DayOfWeek, CancionEnLista } from '../types/songTypes';
import { LISTAS_VIEW_TITLE } from '@/constants/collectionUi';
import { isCollectionPublished, isCollectionDraft } from '@/utils/collectionPublish';

const router = useRouter();
const route = useRoute();
const { success, error: showError } = useNotifications();
const { canCreateLists } = usePermissions();
const coleccionesStore = useColeccionesStore();
const { colecciones, loading, error } = storeToRefs(coleccionesStore);

// Helper functions del store
const { getDayOfWeek, formatEventDate, filterColecciones, sortColeccionesByCurrentMonth } = coleccionesStore;

const showCreateCollection = ref(false);
const showEditCollection = ref(false);
const showDeleteModal = ref(false);
const refreshing = ref(false);
const collectionToDelete = ref<Collection | null>(null);
const editingCollection = ref<Collection | null>(null);
const showUnpublishModal = ref(false);
const collectionToUnpublish = ref<Collection | null>(null);
const publishingCollectionId = ref<string | null>(null);
const showDraftsOnly = ref(false);

// Estado para preview de canciones (múltiples cards pueden estar abiertas)
const expandedCollections = ref<Set<string>>(new Set());
const collectionSongs = ref<Record<string, CancionEnLista[]>>({});
const collectionLoading = ref<Record<string, boolean>>({});
const songsCache = ref<Record<string, CancionEnLista[]>>({});

// Menú de opciones (tres puntos) en cada card
const openMenuCollectionId = ref<string | null>(null);
const sharingCollectionId = ref<string | null>(null);

// Toolbar: presets de tiempo + chips
const timePreset = ref<TimePresetId>('next-30');
const dateRange = ref<DateRangeValue>(getDefaultUpcomingDateRange());
const categoryChips = ref<string[]>([]);
const selectedDayChips = ref<string[]>([]);

const categoryChipOptions: FilterChipOption[] = [
  { value: 'otro', label: 'Otros', title: 'Listas comunes (coros, cumbias, etc.)' },
];

const dayChipOptions: FilterChipOption[] = [
  { value: 'domingo', label: 'Dom', title: 'Domingo' },
  { value: 'miércoles', label: 'Mié', title: 'Miércoles' },
  { value: 'viernes', label: 'Vie', title: 'Viernes' },
];

const showOthersOnly = computed(() => categoryChips.value.includes('otro'));

const currentFilters = computed(() => {
  const range = dateRange.value;
  const applyDates = !showOthersOnly.value && !showDraftsOnly.value && range && range.length === 2;

  return {
    category: showOthersOnly.value ? ('otro' as const) : undefined,
    dateStart: applyDates ? range[0] : undefined,
    dateEnd: applyDates ? range[1] : undefined,
    selectedDays: !showOthersOnly.value && selectedDayChips.value.length > 0
      ? (selectedDayChips.value as DayOfWeek[])
      : undefined,
    sortBy: 'event_date' as const,
    // Con filtro de tiempo: el sort inteligente manda; sin filtro: descendente
    sortOrder: (applyDates ? 'asc' : 'desc') as 'asc' | 'desc',
  };
});

const form = ref({
  name: '',
  description: '',
  category: 'lista semanal' as 'lista semanal' | 'evento' | 'otro',
  event_date: ''
});

// Computed properties
const isEditing = computed(() => showEditCollection.value);

const draftCount = computed(() =>
  colecciones.value.filter((c) => !isCollectionPublished(c)).length
);

function toggleDraftsFilter() {
  showDraftsOnly.value = !showDraftsOnly.value;
  if (showDraftsOnly.value) {
    categoryChips.value = [];
    selectedDayChips.value = [];
  }
}

watch(showOthersOnly, (active) => {
  if (active) {
    selectedDayChips.value = [];
  } else if (!dateRange.value && timePreset.value === 'all') {
    // Sin filtro de fecha: mantener null
  } else if (!dateRange.value && timePreset.value !== 'custom') {
    dateRange.value = getRangeForPreset(timePreset.value);
  } else if (!dateRange.value) {
    dateRange.value = getDefaultUpcomingDateRange();
  }
});

watch(draftCount, (count) => {
  if (count === 0) showDraftsOnly.value = false;
});

const allExpanded = computed(() => {
  const collectionsWithSongs = filteredCollections.value.filter(
    (collection) => collection.songCount && collection.songCount > 0
  );
  if (collectionsWithSongs.length === 0) return false;
  return collectionsWithSongs.every((collection) =>
    expandedCollections.value.has(collection.id)
  );
});

// Colecciones filtradas
const filteredCollections = computed(() => {
  const filters = currentFilters.value;

  const range =
    filters.dateStart || filters.dateEnd
      ? { start: filters.dateStart, end: filters.dateEnd }
      : undefined;

  const filtered = filterColecciones(
    undefined,
    filters.category,
    range,
    filters.selectedDays,
    undefined,
    filters.sortBy || 'event_date',
    filters.sortOrder || (range ? 'asc' : 'desc')
  );

  let result = filtered;
  if (showDraftsOnly.value && canCreateLists.value) {
    result = result.filter((c) => !isCollectionPublished(c));
  }

  // Con rango de fechas: próximas primero, luego pasadas
  if (range) {
    return sortColeccionesByCurrentMonth(result);
  }

  // Sin filtro de fecha: más recientes primero (ya viene desc del store)
  return result;
});

// Methods
onMounted(async () => {
  document.addEventListener('click', handleClickOutsideCollectionCardMenu);
  // Limpiar caché de canciones para asegurar que se carguen con el orden correcto
  songsCache.value = {};
  collectionSongs.value = {};
  
  await coleccionesStore.loadColecciones();
  const qCategory = route.query.category as string | undefined;
  if (qCategory === 'otro') {
    categoryChips.value = ['otro'];
    selectedDayChips.value = [];
    timePreset.value = 'next-30';
    dateRange.value = null;
    router.replace({ path: '/colecciones', query: {} });
  } else {
    timePreset.value = 'next-30';
    dateRange.value = getRangeForPreset('next-30');
    categoryChips.value = [];
    selectedDayChips.value = [];
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutsideCollectionCardMenu);
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
    
    await coleccionesStore.createColeccion({
      name: nameValue,
      description: descriptionValue,
      category: form.value.category,
      event_date: (form.value.category === 'lista semanal' || form.value.category === 'evento') && form.value.event_date ? form.value.event_date : undefined
    });

    success('Lista creada', 'Publica cuando esté lista para que todos la vean');
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

function isDraft(collection: Collection) {
  return isCollectionDraft(collection);
}

async function handlePublishCollection(collection: Collection) {
  if ((collection.songCount ?? 0) === 0) {
    showError('Lista vacía', 'Añade al menos una canción antes de publicar');
    return;
  }
  try {
    publishingCollectionId.value = collection.id;
    await coleccionesStore.publishColeccion(collection.id);
    success('Visible para todos', 'La lista ya aparece en la app y en el enlace compartido');
  } catch (err) {
    console.error('Error al publicar colección:', err);
    showError('Error', 'No se pudo publicar la lista. Inténtalo de nuevo.');
  } finally {
    publishingCollectionId.value = null;
  }
}

function handleUnpublishCollection(collection: Collection) {
  collectionToUnpublish.value = collection;
  showUnpublishModal.value = true;
}

function cancelUnpublishCollection() {
  collectionToUnpublish.value = null;
  showUnpublishModal.value = false;
}

async function confirmUnpublishCollection() {
  if (!collectionToUnpublish.value) return;

  try {
    publishingCollectionId.value = collectionToUnpublish.value.id;
    await coleccionesStore.unpublishColeccion(collectionToUnpublish.value.id);
    success('Despublicado', 'La lista ya no es visible para quienes no pueden editarla');
    cancelUnpublishCollection();
  } catch (err) {
    console.error('Error al despublicar colección:', err);
    showError('Error', 'No se pudo despublicar la lista. Inténtalo de nuevo.');
    publishingCollectionId.value = null;
  } finally {
    publishingCollectionId.value = null;
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
    }
    return date || '';
  }

  return '';
}

function getRelativeLabel(collection: Collection): string | null {
  if (
    (collection.category !== 'lista semanal' && collection.category !== 'evento') ||
    !collection.event_date
  ) {
    return null;
  }
  return getRelativeUpcomingLabel(collection.event_date);
}

function relativeWhenClass(collection: Collection): string {
  if (!collection.event_date) return '';
  const days = daysFromToday(collection.event_date);
  if (days === null || days < 0) return '';
  if (days === 0) return 'relative-when--today';
  if (days === 1) return 'relative-when--tomorrow';
  return 'relative-when--soon';
}

function getVisibleCollectionsWithSongs(): Collection[] {
  return filteredCollections.value.filter(
    (collection) => collection.songCount && collection.songCount > 0
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

function toggleCollectionMenu(collectionId: string) {
  openMenuCollectionId.value = openMenuCollectionId.value === collectionId ? null : collectionId;
}

function closeCollectionMenu() {
  openMenuCollectionId.value = null;
}

function handleClickOutsideCollectionCardMenu(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.collection-card-options-menu')) {
    closeCollectionMenu();
  }
}

async function goToSharedView(collection: Collection) {
  if (!collection?.id || sharingCollectionId.value) return;
  try {
    sharingCollectionId.value = collection.id;
    closeCollectionMenu();
    const shareCode = await CollectionsService.ensureShareCode(collection.id);
    router.push(`/v/${shareCode}`);
  } catch (err) {
    console.error('Error getting share link:', err);
    showError('Error', 'No se pudo generar el enlace. Inténtalo de nuevo.');
  } finally {
    sharingCollectionId.value = null;
  }
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
  gap: 0.75rem;
  min-height: 36px;
}

.header-leading {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  flex: 1;
}

.page-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
  line-height: 1.2;
  transition: color var(--transition-normal);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.add-btn {
  background: var(--cf-navy);
  color: var(--color-text-inverse);
  border: 1px solid var(--cf-navy);
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color var(--transition-normal),
    border-color var(--transition-normal);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  height: 32px;
}

.add-btn:hover {
  background: var(--cf-navy-dark);
  border-color: var(--cf-navy-dark);
  color: var(--color-text-inverse);
}

.add-btn svg {
  flex-shrink: 0;
}

:global([data-theme="dark"]) .add-btn {
  background: var(--cf-navy-light);
  border-color: var(--cf-navy-light);
  color: #fff;
}

:global([data-theme="dark"]) .add-btn:hover {
  background: var(--cf-navy);
  border-color: var(--cf-navy);
}

:global([data-theme="dark"]) .expand-all-btn--active {
  color: var(--color-heading);
  background: color-mix(in srgb, var(--color-heading) 10%, transparent);
  border-color: color-mix(in srgb, var(--color-heading) 25%, transparent);
}

/* Main Content */
.collections-main {
  flex: 1;
  padding: 1.25rem 1.5rem;
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

/* Toolbar: fila1 tiempo · fila2 chips | ojito */
.collections-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  min-width: 0;
}

.collections-toolbar__time {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.collections-toolbar__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  min-width: 0;
}

.collections-toolbar__chips {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  flex: 1 1 auto;
}

.expand-all-btn {
  background: transparent;
  color: var(--color-text-mute);
  border: 1px solid transparent;
  padding: 0;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color var(--transition-normal),
    color var(--transition-normal),
    border-color var(--transition-normal);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  opacity: 0.75;
}

.expand-all-btn:hover {
  background: var(--color-background-hover);
  border-color: var(--color-border);
  color: var(--color-text);
  opacity: 1;
}

.expand-all-btn--active {
  color: var(--cf-navy);
  opacity: 1;
  background: color-mix(in srgb, var(--cf-navy) 8%, transparent);
  border-color: color-mix(in srgb, var(--cf-navy) 20%, transparent);
}

.expand-all-btn svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

@media (max-width: 480px) {
  .collections-content {
    gap: 0.75rem;
  }

  .add-btn {
    padding: 0;
    width: 32px;
  }

  .add-btn__label {
    display: none;
  }
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

/* Cuando el menú de opciones está abierto, la card se eleva para que el dropdown quede por encima de las demás */
.collection-card-menu-open {
  z-index: 50;
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

.collection-meta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}

/* Nota relativa: se distingue sin parecer botón */
.relative-when {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  font-size: 0.72rem;
  font-weight: 500;
  font-style: italic;
  line-height: 1.2;
  letter-spacing: 0.01em;
  white-space: nowrap;
  opacity: 0.92;
}

.relative-when--today {
  color: color-mix(in srgb, var(--color-success) 72%, var(--color-text));
}

.relative-when--tomorrow {
  color: color-mix(in srgb, var(--color-info) 55%, var(--color-text-soft));
}

.relative-when--soon {
  color: color-mix(in srgb, var(--cf-navy) 40%, var(--color-text-soft));
}

:global([data-theme="dark"]) .relative-when--today {
  color: color-mix(in srgb, var(--color-success) 75%, #fff);
}

:global([data-theme="dark"]) .relative-when--tomorrow {
  color: color-mix(in srgb, var(--color-info) 65%, var(--color-text-soft));
}

:global([data-theme="dark"]) .relative-when--soon {
  color: color-mix(in srgb, var(--color-heading) 45%, var(--color-text-soft));
}

/* Contador como meta/texto, no como botón */
.song-count {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--color-text-soft);
  font-size: 0.75rem;
  font-weight: 500;
  font-family: inherit;
  line-height: 1.2;
  transition: color var(--transition-normal);
}

.song-count svg {
  flex-shrink: 0;
  opacity: 0.55;
}

.song-count--interactive {
  cursor: pointer;
}

.song-count--interactive:hover {
  color: var(--color-heading);
}

.song-count--interactive:hover svg {
  opacity: 0.85;
}

.song-count--expanded {
  color: var(--color-heading);
}

.song-count--expanded svg {
  opacity: 0.75;
}

.song-count__chevron {
  opacity: 0.45;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.song-count--expanded .song-count__chevron {
  transform: rotate(180deg);
  opacity: 0.7;
}

.song-count:disabled {
  cursor: default;
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
  justify-content: flex-end;
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

/* Menú de opciones (tres puntos) en la card - mismo estilo que vista canción */
.collection-card-options-menu {
  position: relative;
  margin-left: auto;
}

.collection-card-options-menu .menu-toggle {
  background: none;
  border: none;
  border-radius: 0;
  padding: 0.35rem;
  cursor: pointer;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-mute);
}

.collection-card-options-menu .menu-toggle:hover {
  color: var(--color-accent);
}

.collection-card-options-menu .menu-toggle.active {
  color: var(--color-accent);
}

.collection-card-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 200px;
  margin-top: 0.25rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.collection-card-dropdown .dropdown-action {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text);
  text-align: left;
  transition: background 0.15s ease;
}

.collection-card-dropdown .dropdown-action:hover:not(:disabled) {
  background: var(--color-background-hover);
}

.collection-card-dropdown .dropdown-action:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.collection-card-dropdown .dropdown-action.delete:hover {
  background: var(--color-error);
  color: var(--color-text-inverse);
}

.collection-card-dropdown .dropdown-action.active {
  color: var(--color-accent);
}

/* Responsive */
@media (max-width: 768px) {
  .collections-header {
    padding: 0.75rem 1rem;
  }

  .header-content {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  .page-title {
    font-size: 1.2rem;
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
