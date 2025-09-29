<template>
  <div class="collection-detail-container">
    <!-- Header -->
    <header class="collection-header">
      <div class="header-content">
        <button @click="goBack" class="back-btn">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <h1 class="collection-title">{{ collection?.name }}</h1>
        <button @click="openAddSongsModal" class="add-songs-btn">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 5v14m7-7H5"/>
          </svg>
        </button>
      </div>
    </header>


    <!-- Main Content -->
    <main class="collection-main">
      <!-- States -->
      <div v-if="loading" class="state-container">
        <div class="loading-spinner"></div>
        <p>Cargando canciones...</p>
      </div>
      
      <div v-else-if="error" class="state-container error">
        <div class="error-icon">⚠️</div>
        <h3>Error al cargar canciones</h3>
        <p>{{ error }}</p>
        <button @click="retryLoad" class="retry-btn">Reintentar</button>
      </div>
      
      <div v-else-if="collectionSongs.length === 0" class="state-container empty">
        <div class="empty-icon">🎵</div>
        <h3>No hay canciones en esta lista</h3>
        <p>Agrega canciones para comenzar</p>
        <button @click="openAddSongsModal" class="add-first-btn">
          Agregar primera canción
        </button>
      </div>
      
      <!-- Songs List -->
      <div v-else ref="songsListRef" class="songs-list">
        <div 
          v-for="song in collectionSongs" 
          :key="song.id"
          class="song-item"
          @click="goToSong(song)"
        >
          <div class="drag-handle" @click.stop>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 6h8M8 12h8M8 18h8"/>
            </svg>
          </div>
          <div class="song-info">
            <h3 class="song-title">{{ song.title }}</h3>
            <p class="song-artist">{{ song.artist }}</p>
            <div class="song-meta">
              <span v-if="song.bpm" class="meta-item">BPM: {{ song.bpm }}</span>
              <span v-if="song.tempo" class="meta-item">{{ song.tempo }}</span>
              <span v-for="tag in song.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
          <div class="song-actions" @click.stop>
            <button @click="removeSongFromCollection(song)" class="action-btn remove-btn" title="Quitar de lista">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Add Songs Modal -->
    <Modal :show="showAddSongs" @close="closeAddSongsModal">
      <h3 class="text-lg font-bold text-blue-900 mb-4">Agregar canciones a "{{ collection?.name }}"</h3>
      <div class="space-y-4">
        <!-- Search in all songs -->
        <div class="relative">
          <input
            v-model="songSearchQuery"
            type="text"
            placeholder="Buscar canciones para agregar..."
            class="w-full px-3 py-2 pl-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
          />
          <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>

        <!-- Available songs list -->
        <div class="max-h-96 overflow-y-auto space-y-2">
          <div 
            v-for="song in filteredAvailableSongs" 
            :key="song.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div class="flex-1">
              <h4 class="font-medium text-gray-900">{{ song.title }}</h4>
              <p class="text-sm text-gray-600">{{ song.artist }}</p>
            </div>
            <button 
              @click="addSongToCollection(song)"
              class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Agregar
            </button>
          </div>
        </div>

        <div v-if="filteredAvailableSongs.length === 0" class="text-center text-gray-500 py-8">
          <p>No hay canciones disponibles para agregar</p>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNotifications } from '@/composables/useNotifications';
import { useColeccionesStore } from '../stores/colecciones';
import { useCancionesStore } from '../stores/canciones';
import { storeToRefs } from 'pinia';
import Modal from "../components/Modal.vue";
import { Collection, Cancion } from '../types/songTypes';
import Sortable from 'sortablejs';

const route = useRoute();
const router = useRouter();
const { success, error: showError } = useNotifications();
const coleccionesStore = useColeccionesStore();
const cancionesStore = useCancionesStore();
const { collectionSongs, loading, error } = storeToRefs(coleccionesStore);
const { canciones } = storeToRefs(cancionesStore);

const collection = ref<Collection | null>(null);
const songSearchQuery = ref("");
const showAddSongs = ref(false);
const sortableInstance = ref<Sortable | null>(null);
const songsListRef = ref<HTMLElement | null>(null);
const pendingChanges = ref<{ songId: number; orderIndex: number }[]>([]);
const saveTimeout = ref<NodeJS.Timeout | null>(null);

// Computed properties
// Computed simple: canciones que NO están en la colección actual
const availableSongs = computed(() => {
  return canciones.value.filter(song => {
    const songId = String(song.id);
    const isInCollection = collectionSongs.value.some(cs => String(cs.id) === songId);
    return !isInCollection;
  });
});

// Computed para filtrar las canciones disponibles por búsqueda
const filteredAvailableSongs = computed(() => {
  if (!songSearchQuery.value) return availableSongs.value;
  
  return availableSongs.value.filter(song => 
    song.title.toLowerCase().includes(songSearchQuery.value.toLowerCase()) ||
    song.artist.toLowerCase().includes(songSearchQuery.value.toLowerCase())
  );
});

// Methods
async function initializeCollection() {
  const collectionId = route.params.id as string;
  if (collectionId) {
    await loadCollection(collectionId);
    await loadCollectionSongs(collectionId);
    await nextTick();
    initializeSortable();
  }
}

async function loadCollection(collectionId: string) {
  try {
    const collectionData = await coleccionesStore.getCollection(collectionId);
    collection.value = collectionData;
  } catch (err) {
    console.error('Error loading collection:', err);
    showError('Error', 'No se pudo cargar la lista');
  }
}

async function loadCollectionSongs(collectionId: string) {
  try {
    await coleccionesStore.loadCollectionSongs(collectionId);
  } catch (err) {
    console.error('Error loading collection songs:', err);
    showError('Error', 'No se pudo cargar las canciones de la lista');
  }
}

function goBack() {
  router.back();
}

function goToSong(song: Cancion) {
  router.push(`/cancion/${song.id}-${song.title.toLowerCase().replace(/\s+/g, '-')}`);
}

async function addSongToCollection(song: Cancion) {
  if (!collection.value) return;

  try {
    const songId = parseInt(song.id);
    await coleccionesStore.addSongToCollection(collection.value.id, songId);
    
    // Recargar las canciones de la colección para actualizar la UI
    await loadCollectionSongs(collection.value.id);
  } catch (err) {
    console.error('Error adding song to collection:', err);
    showError('Error', 'No se pudo agregar la canción a la lista');
  }
}

async function removeSongFromCollection(song: Cancion) {
  if (!collection.value) return;

  try {
    const songId = parseInt(song.id);
    await coleccionesStore.removeSongFromCollection(collection.value.id, songId);
    
    // Recargar las canciones de la colección para actualizar la UI
    await loadCollectionSongs(collection.value.id);
  } catch (err) {
    console.error('Error removing song from collection:', err);
    showError('Error', 'No se pudo remover la canción de la lista');
  }
}

function openAddSongsModal() {
  showAddSongs.value = true;
  songSearchQuery.value = "";
}

function closeAddSongsModal() {
  showAddSongs.value = false;
  songSearchQuery.value = "";
}

async function retryLoad() {
  const collectionId = route.params.id as string;
  if (collectionId) {
    await loadCollectionSongs(collectionId);
  }
}

function getTypeLabel(type?: string): string {
  const labels = {
    'playlist': 'Playlist',
    'album': 'Álbum',
    'favorites': 'Favoritos',
    'custom': 'Personalizada'
  };
  return labels[type as keyof typeof labels] || type || '';
}

// Drag and Drop Functions
function initializeSortable() {
  if (!songsListRef.value || sortableInstance.value) return;

  sortableInstance.value = new Sortable(songsListRef.value, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    handle: '.drag-handle',
    onEnd: (evt) => {
      const { oldIndex, newIndex } = evt;
      if (oldIndex === newIndex || !collection.value) return;

      // Actualización optimista - UI se actualiza inmediatamente
      const newOrder = [...collectionSongs.value];
      const [movedSong] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, movedSong);

      // Actualizar el estado local inmediatamente
      collectionSongs.value = newOrder;

      // Crear array de órdenes para guardar
      const songOrders = newOrder.map((song, index) => ({
        songId: parseInt(song.id),
        orderIndex: index + 1
      }));

      // Programar guardado con debounce
      scheduleSave(songOrders);
    }
  });
}

// Función para programar el guardado con debounce
function scheduleSave(songOrders: { songId: number; orderIndex: number }[]) {
  // Cancelar guardado anterior si existe
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
  }

  // Actualizar cambios pendientes
  pendingChanges.value = songOrders;

  // Programar nuevo guardado en 1 segundo
  saveTimeout.value = setTimeout(async () => {
    await saveChanges(songOrders);
  }, 1000);
}

// Función para guardar cambios
async function saveChanges(songOrders: { songId: number; orderIndex: number }[]) {
  if (!collection.value) return;
  
  try {
    await coleccionesStore.reorderCollectionSongs(collection.value.id, songOrders);
    pendingChanges.value = [];
    // No mostramos mensaje de éxito - el usuario ya ve que funciona
  } catch (err) {
    console.error('Error saving song order:', err);
    showError('Error', 'No se pudo guardar el orden de las canciones');
    // Recargar para restaurar el orden original solo en caso de error
    await loadCollectionSongs(collection.value.id);
    // Reinicializar SortableJS después de recargar
    await nextTick();
    destroySortable();
    initializeSortable();
  }
}

function destroySortable() {
  if (sortableInstance.value) {
    sortableInstance.value.destroy();
    sortableInstance.value = null;
  }
}

// Función para reinicializar SortableJS si es necesario
async function reinitializeSortable() {
  destroySortable();
  await nextTick();
  initializeSortable();
}

// Auto-guardado al cambiar de pestaña o cerrar
function handleBeforeUnload() {
  if (pendingChanges.value.length > 0) {
    // Forzar guardado inmediato
    saveTimeout.value && clearTimeout(saveTimeout.value);
    saveChanges(pendingChanges.value);
  }
}

// Auto-guardado al cambiar de pestaña (visibilitychange)
function handleVisibilityChange() {
  if (document.hidden && pendingChanges.value.length > 0) {
    saveTimeout.value && clearTimeout(saveTimeout.value);
    saveChanges(pendingChanges.value);
  }
}

onMounted(async () => {
  // Agregar listeners para auto-guardado
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Inicializar la colección
  await initializeCollection();
});

onUnmounted(() => {
  // Limpiar listeners y guardar cambios pendientes
  window.removeEventListener('beforeunload', handleBeforeUnload);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  
  // Guardar cambios pendientes antes de destruir
  if (pendingChanges.value.length > 0) {
    saveTimeout.value && clearTimeout(saveTimeout.value);
    saveChanges(pendingChanges.value);
  }
  
  destroySortable();
});
</script>

<style scoped>
.collection-detail-container {
  min-height: 100vh;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}

/* Header */
.collection-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  position: relative;
}

.back-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.back-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.collection-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e3a8a;
  margin: 0;
  line-height: 1.3;
  flex: 1;
  text-align: center;
}


.add-songs-btn {
  background: #fbbf24;
  color: #1e3a8a;
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-songs-btn:hover {
  background: #f59e0b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}


/* Main Content */
.collection-main {
  flex: 1;
  padding: 1rem;
  width: 100%;
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
  border: 4px solid #e5e7eb;
  border-top: 4px solid #fbbf24;
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
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.error p, .empty p {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}

.retry-btn, .add-first-btn {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover, .add-first-btn:hover {
  background: #1e40af;
  transform: translateY(-1px);
}

/* Songs List */
.songs-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.song-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  color: #9ca3af;
  cursor: grab;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.drag-handle:hover {
  background: #f3f4f6;
  color: #6b7280;
}

.drag-handle:active {
  cursor: grabbing;
  background: #e5e7eb;
}

.song-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e3a8a;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.song-artist {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.song-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.meta-item {
  background: #f3f4f6;
  color: #374151;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag {
  background: #dbeafe;
  color: #1e40af;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.song-actions {
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
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn {
  color: #6b7280;
}

.remove-btn:hover {
  background: #fef2f2;
  color: #dc2626;
}

/* Drag and Drop Styles */
.sortable-ghost {
  opacity: 0.3;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
}

.sortable-chosen {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.sortable-drag {
  opacity: 0.9;
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

/* Responsive */
@media (max-width: 768px) {
  .collection-header {
    padding: 0.75rem 1rem;
  }
  
  .header-content {
    gap: 0.75rem;
  }
  
  .collection-title {
    font-size: 1.1rem;
  }
  
  .collection-main {
    padding: 0.75rem;
  }
  
  .song-item {
    padding: 0.75rem;
  }
  
  .drag-handle {
    padding: 0.75rem 0.5rem;
  }
  
  .songs-list {
    gap: 0.375rem;
  }
}

@media (max-width: 480px) {
  .collection-header {
    padding: 0.5rem 0.75rem;
  }
  
  .collection-title {
    font-size: 1rem;
  }
  
  .collection-main {
    padding: 0.5rem;
  }
  
  .song-item {
    padding: 0.625rem;
  }
  
  .drag-handle {
    padding: 0.625rem 0.375rem;
  }
  
  .songs-list {
    gap: 0.25rem;
  }
  
  .song-title {
    font-size: 1rem;
  }
  
  .song-artist {
    font-size: 0.85rem;
  }
}
</style>

