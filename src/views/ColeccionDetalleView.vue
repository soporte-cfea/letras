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
        <div class="header-actions">
          <button @click="showFieldConfig = !showFieldConfig" class="config-btn" title="Configurar campos">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
          <button @click="openAddSongsModal" class="add-songs-btn">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 5v14m7-7H5"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Panel de configuración de campos -->
    <div v-if="showFieldConfig" class="field-config-panel">
      <div class="config-content">
        <h4>Configurar campos visibles</h4>
        <div class="field-options">
          <label v-for="field in availableFields" :key="field.key" class="field-option">
            <input 
              type="checkbox" 
              v-model="visibleFields" 
              :value="field.key"
              class="field-checkbox"
            />
            <span class="field-label">{{ field.label }}</span>
          </label>
        </div>
        <div class="config-actions">
          <button @click="resetFields" class="reset-btn">Restablecer</button>
          <button @click="showFieldConfig = false" class="close-btn">Cerrar</button>
        </div>
      </div>
    </div>

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
            <div class="song-main-content">
              <div v-if="visibleFields.includes('title')" class="column-title">
                <h3 class="song-title">{{ song.title }}</h3>
              </div>
              <div v-if="visibleFields.includes('artist')" class="column-artist">
                <p class="song-artist">{{ song.artist }}</p>
              </div>
              <div v-if="visibleFields.includes('tags')" class="column-tags">
                <div v-if="song.tags && song.tags.length > 0" class="song-tags">
                  <span v-for="tag in song.tags" :key="tag" class="tag">{{ tag }}</span>
                </div>
              </div>
              <div v-if="visibleFields.includes('list_tags')" class="column-list-tags">
                <div v-if="song.list_tags && song.list_tags.length > 0" class="list-tags">
                  <span v-for="listTag in song.list_tags" :key="listTag" class="list-tag">{{ listTag }}</span>
                </div>
              </div>
            </div>
            <div v-if="(visibleFields.includes('bpm') && song.bpm) || (visibleFields.includes('tempo') && song.tempo)" class="column-meta">
              <div class="song-meta">
                <span v-if="visibleFields.includes('bpm') && song.bpm" class="meta-item">BPM: {{ song.bpm }}</span>
                <span v-if="visibleFields.includes('tempo') && song.tempo" class="meta-item">{{ song.tempo }}</span>
              </div>
            </div>
            <div v-if="visibleFields.includes('notes') && song.notes && song.notes.trim()" class="song-notes">
              <div class="notes-content">{{ song.notes }}</div>
            </div>
          </div>
          <div class="song-actions" @click.stop>
            <button @click="openEditListTagsModal(song)" class="action-btn edit-tags-btn" title="Editar etiquetas de lista">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
            </button>
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

    <!-- Modal para editar etiquetas de lista y notas -->
    <Modal :show="showEditListTagsModal" @close="closeEditListTagsModal">
      <h3 class="text-lg font-bold text-blue-900 mb-4">
        Editar etiquetas y notas para "{{ songToEditTags?.title }}"
      </h3>
      <div class="space-y-4">
        <!-- Etiquetas actuales -->
        <div v-if="currentListTags.length > 0">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Etiquetas actuales:</h4>
          <div class="flex flex-wrap gap-2 mb-4">
            <span 
              v-for="tag in currentListTags" 
              :key="tag" 
              class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {{ tag }}
              <button 
                @click="removeListTag(tag)"
                class="text-yellow-600 hover:text-yellow-800 ml-1"
              >
                ×
              </button>
            </span>
          </div>
        </div>

        <!-- Agregar nueva etiqueta -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">Agregar nueva etiqueta:</h4>
          <div class="flex gap-2">
            <input
              v-model="newListTag"
              type="text"
              placeholder="Ej: Entrada, Ofertorio, Comunión..."
              class="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
              @keyup.enter="addListTag"
            />
            <button 
              @click="addListTag"
              :disabled="!newListTag.trim()"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Agregar
            </button>
          </div>
        </div>

        <!-- Etiquetas sugeridas -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">Etiquetas sugeridas:</h4>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="suggestedTag in suggestedListTags"
              :key="suggestedTag"
              @click="addSuggestedTag(suggestedTag)"
              :disabled="currentListTags.includes(suggestedTag)"
              class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ suggestedTag }}
            </button>
          </div>
        </div>

        <!-- Campo de notas -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">Notas adicionales:</h4>
          <textarea
            v-model="currentNotes"
            placeholder="Agrega notas, instrucciones, comentarios o recordatorios para esta canción en esta lista..."
            rows="3"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base resize-none"
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">
            Estas notas solo se mostrarán en esta lista específica
          </p>
        </div>

        <div class="flex gap-2 mt-4">
          <button
            @click="saveListTags"
            class="flex-1 bg-blue-900 text-white rounded py-2 font-semibold hover:bg-blue-800 transition"
          >
            Guardar
          </button>
          <button
            @click="closeEditListTagsModal"
            class="flex-1 bg-gray-200 text-gray-700 rounded py-2 font-semibold hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNotifications } from '@/composables/useNotifications';
import { useColeccionesStore } from '../stores/colecciones';
import { useCancionesStore } from '../stores/canciones';
import { storeToRefs } from 'pinia';
import Modal from "../components/Modal.vue";
import { Collection, Cancion, CancionEnLista } from '../types/songTypes';
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

// Variables para el modal de etiquetas de lista
const showEditListTagsModal = ref(false);
const songToEditTags = ref<CancionEnLista | null>(null);
const currentListTags = ref<string[]>([]);
const currentNotes = ref("");
const newListTag = ref("");
const suggestedListTags = ref([
  "Entrada", "Ofertorio", "Comunión", "Salida", "Adoración", 
  "Alabanza", "Interludio", "Especial", "Coro", "Solo"
]);

// Variables para configuración de campos
const showFieldConfig = ref(false);
const availableFields = ref([
  { key: 'title', label: 'Título' },
  { key: 'artist', label: 'Artista' },
  { key: 'tags', label: 'Etiquetas generales' },
  { key: 'list_tags', label: 'Etiquetas de lista' },
  { key: 'notes', label: 'Notas' },
  { key: 'bpm', label: 'BPM' },
  { key: 'tempo', label: 'Tempo' }
]);
const visibleFields = ref(['title', 'artist', 'list_tags', 'notes']);

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

// Funciones para manejar etiquetas de lista
function openEditListTagsModal(song: CancionEnLista) {
  songToEditTags.value = song;
  currentListTags.value = [...(song.list_tags || [])];
  currentNotes.value = song.notes || "";
  newListTag.value = "";
  showEditListTagsModal.value = true;
}

function closeEditListTagsModal() {
  showEditListTagsModal.value = false;
  songToEditTags.value = null;
  currentListTags.value = [];
  currentNotes.value = "";
  newListTag.value = "";
}

function addListTag() {
  const tag = newListTag.value.trim();
  if (tag && !currentListTags.value.includes(tag)) {
    currentListTags.value.push(tag);
    newListTag.value = "";
  }
}

function addSuggestedTag(tag: string) {
  if (!currentListTags.value.includes(tag)) {
    currentListTags.value.push(tag);
  }
}

function removeListTag(tag: string) {
  currentListTags.value = currentListTags.value.filter(t => t !== tag);
}

async function saveListTags() {
  if (!songToEditTags.value?.collection_song_id) return;

  try {
    await coleccionesStore.updateSongListData(
      songToEditTags.value.collection_song_id, 
      currentListTags.value,
      currentNotes.value
    );
    
    success('Éxito', 'Etiquetas y notas actualizadas correctamente');
    closeEditListTagsModal();
  } catch (err) {
    console.error('Error saving list data:', err);
    showError('Error', 'No se pudieron guardar las etiquetas y notas');
  }
}

// Funciones para configuración de campos
function resetFields() {
  visibleFields.value = ['title', 'artist', 'list_tags', 'notes'];
  saveFieldConfig();
}

function saveFieldConfig() {
  localStorage.setItem('collection-field-config', JSON.stringify(visibleFields.value));
}

function loadFieldConfig() {
  const saved = localStorage.getItem('collection-field-config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      visibleFields.value = parsed;
    } catch (e) {
      console.warn('Error loading field config:', e);
    }
  }
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
  
  // Cargar configuración de campos
  loadFieldConfig();
  
  // Inicializar la colección
  await initializeCollection();
});

// Watcher para guardar configuración automáticamente
watch(visibleFields, () => {
  saveFieldConfig();
}, { deep: true });

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

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
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
  text-align: left;
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

.config-btn {
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.config-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

/* Panel de configuración de campos */
.field-config-panel {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.config-content {
  max-width: none;
  margin: 0;
}

.config-content h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.field-options {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.field-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
}

.field-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #1e3a8a;
  cursor: pointer;
}

.field-label {
  user-select: none;
}

.config-actions {
  display: flex;
  gap: 0.75rem;
}

.reset-btn, .close-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #d1d5db;
}

.reset-btn {
  background: #f3f4f6;
  color: #374151;
}

.reset-btn:hover {
  background: #e5e7eb;
}

.close-btn {
  background: #1e3a8a;
  color: white;
  border-color: #1e3a8a;
}

.close-btn:hover {
  background: #1e40af;
  border-color: #1e40af;
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
  gap: 0.25rem;
}

.song-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.375rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  color: #9ca3af;
  cursor: grab;
  border-radius: 3px;
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
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.song-main-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

/* Sistema de columnas con anchos fijos */
.column-title {
  width: 200px;
  min-width: 200px;
  flex-shrink: 0;
}

.column-artist {
  width: 150px;
  min-width: 150px;
  flex-shrink: 0;
}

.column-tags {
  width: 120px;
  min-width: 120px;
  flex-shrink: 0;
}

.column-list-tags {
  width: 120px;
  min-width: 120px;
  flex-shrink: 0;
}


.column-meta {
  width: 100px;
  min-width: 100px;
  flex-shrink: 0;
}

.song-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e3a8a;
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.song-artist {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.song-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: nowrap;
  align-items: center;
  overflow: hidden;
}

.tag {
  background: #dbeafe;
  color: #1e40af;
  padding: 0.1rem 0.25rem;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.2;
}

.list-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: nowrap;
  align-items: center;
  overflow: hidden;
}

.list-tag {
  background: #fef3c7;
  color: #92400e;
  padding: 0.1rem 0.25rem;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid #f59e0b;
  line-height: 1.2;
}

.song-notes {
  display: flex;
  width: 100%;
  margin-top: 0.125rem;
}

.notes-content {
  font-size: 0.7rem;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 0;
  padding: 0.25rem 0.5rem;
  line-height: 1.3;
  word-wrap: break-word;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  width: 100%;
}

.song-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
}

.meta-item {
  background: #f3f4f6;
  color: #374151;
  padding: 0.1rem 0.25rem;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.2;
}

.song-actions {
  display: flex;
  gap: 0.125rem;
  flex-shrink: 0;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 4px;
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

.edit-tags-btn {
  color: #6b7280;
}

.edit-tags-btn:hover {
  background: #fef3c7;
  color: #92400e;
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
  
  .header-actions {
    gap: 0.375rem;
  }
  
  .collection-title {
    font-size: 1.1rem;
  }
  
  .field-config-panel {
    padding: 0.75rem 1rem;
  }
  
  .field-options {
    gap: 1rem;
  }
  
  .config-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .reset-btn, .close-btn {
    width: 100%;
    justify-content: center;
  }
  
  .collection-main {
    padding: 0.75rem;
  }
  
  .song-item {
    padding: 0.25rem 0.375rem;
  }
  
  .drag-handle {
    padding: 0.125rem;
  }
  
  .songs-list {
    gap: 0.125rem;
  }
  
  /* Ajustar columnas en móviles - diseño más flexible */
  .song-main-content {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  .column-title {
    width: 140px;
    min-width: 140px;
    flex: 1;
  }
  
  .column-artist {
    width: 100px;
    min-width: 100px;
    flex-shrink: 0;
  }
  
  .column-tags {
    width: auto;
    min-width: auto;
    flex-shrink: 0;
  }
  
  .column-list-tags {
    width: auto;
    min-width: auto;
    flex-shrink: 0;
  }
  
  .column-meta {
    width: auto;
    min-width: auto;
    flex-shrink: 0;
  }
  
  /* Mejorar legibilidad en móviles */
  .song-title {
    font-size: 0.85rem;
    line-height: 1.1;
  }
  
  .song-artist {
    font-size: 0.7rem;
    line-height: 1.1;
  }
  
  .tag, .list-tag {
    font-size: 0.6rem;
    padding: 0.075rem 0.2rem;
    line-height: 1.1;
  }
  
  .meta-item {
    font-size: 0.6rem;
    padding: 0.075rem 0.2rem;
    line-height: 1.1;
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
  
  /* Optimización extrema para pantallas muy pequeñas */
  .song-item {
    padding: 0.2rem 0.25rem;
    gap: 0.25rem;
  }
  
  .drag-handle {
    padding: 0.1rem;
  }
  
  .song-main-content {
    gap: 0.2rem;
  }
  
  .column-title {
    width: 120px;
    min-width: 120px;
  }
  
  .column-artist {
    width: 80px;
    min-width: 80px;
  }
  
  .song-title {
    font-size: 0.8rem;
  }
  
  .song-artist {
    font-size: 0.65rem;
  }
  
  .tag, .list-tag {
    font-size: 0.55rem;
    padding: 0.05rem 0.15rem;
  }
  
  .meta-item {
    font-size: 0.55rem;
    padding: 0.05rem 0.15rem;
  }
  
  .action-btn {
    padding: 0.2rem;
  }
}
</style>

