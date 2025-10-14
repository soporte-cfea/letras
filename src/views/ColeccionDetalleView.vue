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
          <button @click="showSectionsManager = true" class="sections-btn" title="Gestionar secciones">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
          </button>
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
      
      <!-- Songs List with Sections -->
      <div v-else class="songs-list">
        <!-- Secciones -->
        <div v-for="section in sectionsStore.sectionsWithSongs" :key="section.id" class="section-container">
          <SectionHeader
            :section="section"
          />
          
          <div class="section-songs" :ref="(el) => setSongsListRef(el, section.id)" :data-section-id="section.id">
            <div
              v-for="song in section.songs"
              :key="song.collection_song_id"
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
        </div>
        
        <!-- Canciones sin asignar -->
        <div v-if="sectionsStore.unassignedSongs.length > 0" class="unassigned-section">
          <div class="unassigned-header">
            <h3 class="unassigned-title">Sin clasificar ({{ sectionsStore.unassignedSongs.length }})</h3>
          </div>
          <div class="section-songs unassigned-songs" :ref="(el) => setSongsListRef(el, 'unassigned')" data-section-id="unassigned">
            <div
              v-for="song in sectionsStore.unassignedSongs"
              :key="song.collection_song_id"
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
        Etiquetas y notas para "{{ songToEditTags?.title }}"
      </h3>
      <div class="space-y-16">
        <!-- Etiquetas actuales -->
        <div v-if="currentListTags.length > 0">
          <h4 class="text-sm font-medium text-gray-700 mb-8">Etiquetas actuales:</h4>
          <div class="flex flex-wrap gap-2 mb-10">
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
          <h4 class="text-sm font-medium text-gray-700 mb-8">Agregar nueva etiqueta:</h4>
          <div class="flex gap-2">
            <input
              v-model="newListTag"
              type="text"
              placeholder="Ej: C, D, E, F, G, A, B, Cm, Dm, Em..."
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
          <h4 class="text-sm font-medium text-gray-700 mb-8">Etiquetas sugeridas:</h4>
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
          <h4 class="text-sm font-medium text-gray-700 mb-8">Notas adicionales:</h4>
          <textarea
            v-model="currentNotes"
            placeholder="Agrega notas, instrucciones, comentarios o recordatorios para esta canción en esta lista..."
            rows="2"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base resize-none"
          ></textarea>
          <p class="text-xs text-gray-500 mt-6">
            Estas notas solo se mostrarán en esta lista específica
          </p>
        </div>

        <div class="flex gap-2 mt-12">
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

    <!-- Modal de gestión de secciones -->
    <div v-if="showSectionsManager" class="modal-overlay" @click="showSectionsManager = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Gestionar Secciones</h3>
          <button @click="showSectionsManager = false" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <SectionsCRUD
            :sections="sectionsStore.sections"
            :songs-by-section="sectionsStore.songsBySection"
            @create-section="handleCreateSection"
            @update-section="handleUpdateSection"
            @delete-section="handleDeleteSection"
            @toggle-section="handleToggleSection"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNotifications } from '@/composables/useNotifications';
import { useColeccionesStore } from '../stores/colecciones';
import { useCancionesStore } from '../stores/canciones';
import { useSectionsStore } from '../stores/sections';
import { storeToRefs } from 'pinia';
import SectionHeader from '../components/SectionHeader.vue';
import SectionManager from '../components/SectionManager.vue';
import SectionsCRUD from '../components/SectionsCRUD.vue';
import Modal from "../components/Modal.vue";
import { Collection, Cancion, CancionEnLista } from '../types/songTypes';
import Sortable from 'sortablejs';

const route = useRoute();
const router = useRouter();
const { success, error: showError } = useNotifications();
const coleccionesStore = useColeccionesStore();
const cancionesStore = useCancionesStore();
const sectionsStore = useSectionsStore();
const { collectionSongs, loading, error } = storeToRefs(coleccionesStore);
const { canciones } = storeToRefs(cancionesStore);

const collection = ref<Collection | null>(null);
const songSearchQuery = ref("");
const showAddSongs = ref(false);
const sortableInstances = ref<Map<string, Sortable>>(new Map());
const songsListRefs = ref<Map<string, HTMLElement>>(new Map());
const pendingChanges = ref<{ songId: string; orderIndex: number }[]>([]);
const saveTimeout = ref<NodeJS.Timeout | null>(null);

// Variables para el modal de etiquetas de lista
const showEditListTagsModal = ref(false);
const songToEditTags = ref<CancionEnLista | null>(null);
const currentListTags = ref<string[]>([]);
const currentNotes = ref("");
const newListTag = ref("");
const suggestedListTags = ref([
  "C", "D", "E", "F", "G", "A", "B",
  "Cm", "Dm", "Em", "Fm", "Am", "Bm"
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

// Variables para secciones
const showSectionsManager = ref(false);

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
    await loadSections(collectionId);
    await nextTick();
    // Los sortables se inicializarán automáticamente cuando se monten los elementos
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

async function loadSections(collectionId: string) {
  try {
    await sectionsStore.fetchSections(collectionId);
  } catch (err) {
    console.error('Error loading sections:', err);
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
    console.log('🎵 Adding song to collection:', song.title, 'ID:', songId);
    
    await coleccionesStore.addSongToCollection(collection.value.id, songId);
    
    // Destruir instancias de SortableJS antes de recargar
    destroySortable();
    
    // Solo recargar las secciones, que ya incluye todas las canciones
    await loadSections(collection.value.id);
    
    // Reinicializar SortableJS después de recargar
    await nextTick();
    console.log('✅ Song added successfully, sections reloaded and sortable reinitialized');
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
    
    // Solo recargar las secciones, que ya incluye todas las canciones
    // Esto evita duplicaciones al no cargar ambos stores
    await loadSections(collection.value.id);
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

// Funciones para gestión de secciones
async function handleCreateSection(data: { name: string; description: string; color: string }) {
  if (!collection.value?.id) return;
  
  try {
    await sectionsStore.createSection(collection.value.id, data.name, data.description, data.color);
    success('Éxito', 'Sección creada correctamente');
  } catch (err) {
    console.error('Error creating section:', err);
    showError('Error', 'No se pudo crear la sección');
  }
}

async function handleUpdateSection(section: any, data?: { name: string; description: string; color: string }) {
  try {
    // Si no hay datos, significa que se está editando desde SectionHeader
    if (!data) {
      // Abrir el modal de edición en SectionsCRUD
      showSectionsManager.value = true;
      return;
    }
    
    await sectionsStore.updateSection(section.id, data);
    success('Éxito', 'Sección actualizada correctamente');
  } catch (err) {
    console.error('Error updating section:', err);
    showError('Error', 'No se pudo actualizar la sección');
  }
}

async function handleDeleteSection(section: any, options?: { moveToSection?: string; moveToUnassigned?: boolean }) {
  try {
    const moveToSectionId = options?.moveToSection;
    await sectionsStore.deleteSection(section.id, moveToSectionId);
    success('Éxito', 'Sección eliminada correctamente');
  } catch (err) {
    console.error('Error deleting section:', err);
    showError('Error', 'No se pudo eliminar la sección');
  }
}

async function handleToggleSection(section: any, enabled: boolean) {
  try {
    await sectionsStore.toggleSection(section.id, enabled);
    const status = enabled ? 'habilitada' : 'deshabilitada';
    success('Éxito', `Sección ${status} correctamente`);
  } catch (err) {
    console.error('Error toggling section:', err);
    showError('Error', 'No se pudo cambiar el estado de la sección');
  }
}


// Drag and Drop Functions
function setSongsListRef(el: HTMLElement | null, sectionId: string) {
  if (el) {
    songsListRefs.value.set(sectionId, el);
    // Inicializar sortable para esta sección específica
    nextTick(() => {
      initializeSortableForSection(sectionId);
    });
  }
}

function initializeSortableForSection(sectionId: string) {
  const element = songsListRefs.value.get(sectionId);
  if (!element || sortableInstances.value.has(sectionId)) return;

  const sortableInstance = new Sortable(element, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    handle: '.drag-handle',
    group: 'songs', // Permitir drag & drop entre secciones
    forceFallback: true, // Usar fallback para mejor control
    onStart: (evt) => {
      console.log('🎯 Drag started:', evt.item.textContent);
    },
    onEnd: async (evt) => {
      const { oldIndex, newIndex, from, to, item } = evt;
      if (!collection.value) return;

      console.log('🎯 Drag & Drop event:', { oldIndex, newIndex, from, to, sectionId });

      // REVERTIR el DOM inmediatamente - SortableJS ya movió el elemento
      // pero nosotros manejamos el estado, no el DOM
      if (oldIndex !== newIndex) {
        // Revertir el movimiento en el DOM
        if (from === to) {
          // Mismo contenedor - revertir posición
          const parent = from;
          const movedElement = item;
          const targetElement = parent.children[newIndex];
          if (targetElement && movedElement !== targetElement) {
            if (newIndex > oldIndex) {
              parent.insertBefore(movedElement, targetElement.nextSibling);
            } else {
              parent.insertBefore(movedElement, targetElement);
            }
          }
        } else {
          // Diferentes contenedores - revertir completamente
          from.appendChild(item);
        }
      }

      // Determinar sección origen y destino
      const fromSectionId = from.dataset.sectionId || 'unassigned';
      const toSectionId = to.dataset.sectionId || 'unassigned';

      // Obtener canciones de la sección origen
      let fromSongs;
      if (fromSectionId === 'unassigned') {
        fromSongs = sectionsStore.unassignedSongs;
      } else {
        const fromSection = sectionsStore.sectionsWithSongs.find(s => s.id === fromSectionId);
        if (!fromSection) return;
        fromSongs = fromSection.songs;
      }

      const movedSong = fromSongs[oldIndex];
      if (!movedSong) {
        console.warn('⚠️ Song not found at index:', oldIndex);
        return;
      }

      // Si se movió a la misma sección, solo reordenar
      if (fromSectionId === toSectionId) {
        console.log('🔄 Reordering within same section:', movedSong.title, 'from', oldIndex, 'to', newIndex);
        
        // Crear un nuevo array con el orden correcto
        const reorderedSongs = [...fromSongs];
        const songToMove = reorderedSongs.splice(oldIndex, 1)[0];
        reorderedSongs.splice(newIndex, 0, songToMove);
        
        // ACTUALIZAR el estado local inmediatamente
        fromSongs.splice(0, fromSongs.length, ...reorderedSongs);
        
        // Actualizar los order_index en el estado local
        fromSongs.forEach((song, index) => {
          song.order_index = index;
        });
        
        // Crear cambios para TODAS las canciones de la sección
        const sectionChanges = reorderedSongs.map((song, index) => ({
          songId: song.collection_song_id,
          orderIndex: index
        }));
        
        console.log('📝 Section changes:', sectionChanges);
        
        // Reemplazar cambios pendientes con los nuevos
        pendingChanges.value = sectionChanges;
      } else {
        // Movimiento entre secciones diferentes
        console.log('🔄 Moving song between sections:', movedSong.title, 'from', fromSectionId, 'to', toSectionId);
        
        // Obtener canciones de la sección destino
        let toSongs;
        if (toSectionId === 'unassigned') {
          toSongs = sectionsStore.unassignedSongs;
        } else {
          const toSection = sectionsStore.sectionsWithSongs.find(s => s.id === toSectionId);
          if (!toSection) return;
          toSongs = toSection.songs;
        }
        
        // Remover la canción de la sección origen
        fromSongs.splice(oldIndex, 1);
        
        // Actualizar los order_index en la sección origen
        fromSongs.forEach((song, index) => {
          song.order_index = index;
        });
        
        // Actualizar section_id de la canción movida
        movedSong.section_id = toSectionId === 'unassigned' ? null : toSectionId;
        
        // Crear un nuevo array con la canción en la posición correcta
        const newToSongs = [...toSongs];
        newToSongs.splice(newIndex, 0, movedSong);
        
        // Actualizar el estado local inmediatamente
        toSongs.splice(0, toSongs.length, ...newToSongs);
        
        // Actualizar los order_index en la sección destino
        toSongs.forEach((song, index) => {
          song.order_index = index;
        });
        
        // Crear cambios para AMBAS secciones
        const originChanges = fromSongs.map((song, index) => ({
          songId: song.collection_song_id,
          orderIndex: index,
          sectionId: fromSectionId === 'unassigned' ? null : fromSectionId
        }));
        
        const targetChanges = toSongs.map((song, index) => ({
          songId: song.collection_song_id,
          orderIndex: index,
          sectionId: toSectionId === 'unassigned' ? null : toSectionId
        }));
        
        const allChanges = [...originChanges, ...targetChanges];
        
        console.log('📝 Origin section changes:', originChanges);
        console.log('📝 Target section changes:', targetChanges);
        
        // Reemplazar cambios pendientes con los nuevos
        pendingChanges.value = allChanges;
      }
      
      console.log('📝 Pending changes:', pendingChanges.value);

      // Guardar cambios con debounce
      saveTimeout.value && clearTimeout(saveTimeout.value);
      saveTimeout.value = setTimeout(() => {
        if (pendingChanges.value.length > 0) {
          saveChanges(pendingChanges.value);
        }
      }, 1000);
    }
  });

  sortableInstances.value.set(sectionId, sortableInstance);
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
async function saveChanges(songOrders: { songId: string; orderIndex: number; sectionId?: string | null }[]) {
  if (!collection.value) return;
  
  console.log('Saving changes for collection:', collection.value.id, 'with orders:', songOrders);
  
  try {
    await coleccionesStore.reorderCollectionSongs(collection.value.id, songOrders);
    console.log('Successfully saved song order');
    pendingChanges.value = [];
    
    // NO recargar - el estado local ya está correcto
    // SortableJS sigue funcionando porque no destruimos el DOM
    console.log('✅ Order saved, SortableJS remains functional');
  } catch (err) {
    console.error('Error saving song order:', err);
    showError('Error', 'No se pudo guardar el orden de las canciones');
    // Solo recargar en caso de error
    await loadSections(collection.value.id);
    console.log('🔄 Sections reloaded after error');
  }
}

function destroySortable() {
  // Destruir todas las instancias de sortable
  sortableInstances.value.forEach((instance, sectionId) => {
    instance.destroy();
  });
  sortableInstances.value.clear();
  songsListRefs.value.clear();
}

// Función para reinicializar SortableJS si es necesario
async function reinitializeSortable() {
  destroySortable();
  await nextTick();
  // Las instancias se reinicializarán automáticamente cuando se monten los elementos
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
/* Forzar espaciados en el modal de etiquetas */
.space-y-16 > * + * {
  margin-top: 1rem !important;
}

.mb-8 {
  margin-bottom: 0.75rem !important;
}

.mb-10 {
  margin-bottom: 1rem !important;
}

.mt-6 {
  margin-top: 0.5rem !important;
}

.mt-12 {
  margin-top: 1rem !important;
}
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

.sections-btn {
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

.sections-btn:hover {
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
  padding: 0.375rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #d1d5db;
  min-width: auto;
  width: auto;
}

.reset-btn {
  background: #f3f4f6;
  color: #374151;
}

.reset-btn:hover {
  background: #e5e7eb;
}

.close-btn {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.close-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
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

/* Section Container */
.section-container {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin-bottom: 0.5rem;
}

.section-songs {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-left: 0;
  padding-left: 0;
  margin-top: 0;
  margin-right: 0;
  padding-right: 0;
}

/* Unassigned Section */
.unassigned-section {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin-top: 0.5rem;
}

.unassigned-header {
  background: #f3f4f6;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  margin-bottom: 0.25rem;
}

.unassigned-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0;
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
  width: 215px;
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
  font-size: 1rem;
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
  font-size: 1rem;
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
  background: #f1f5f9;
  color: #475569;
  padding: 0.1rem 0.25rem;
  border-radius: 3px;
  font-size: 1rem;
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
  background: #f8fafc;
  color: #64748b;
  padding: 0.1rem 0.25rem;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid #e2e8f0;
  line-height: 1.2;
}

.song-notes {
  display: flex;
  width: 100%;
  margin-top: 0.125rem;
}

.notes-content {
  font-size: 1rem;
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
  font-size: 1rem;
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
    flex-direction: row;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .reset-btn, .close-btn {
    flex: 1;
    min-width: 0;
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
    font-size: 1rem;
    line-height: 1.1;
  }
  
  .song-artist {
    font-size: 1rem;
    line-height: 1.1;
  }
  
  .tag, .list-tag {
    font-size: 1rem;
    padding: 0.075rem 0.2rem;
    line-height: 1.1;
  }
  
  .meta-item {
    font-size: 1rem;
    padding: 0.075rem 0.2rem;
    line-height: 1.1;
  }
}

/* Media queries específicas para teléfonos (no tabletas) */
@media (max-width: 480px) {
  .collection-header {
    padding: 0.5rem 0.75rem;
  }
  
  .collection-title {
    font-size: 0.9rem;
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
    font-size: 0.85rem;
  }
  
  .song-artist {
    font-size: 0.8rem;
  }
  
  .tag, .list-tag {
    font-size: 0.75rem;
    padding: 0.05rem 0.15rem;
  }
  
  .meta-item {
    font-size: 0.75rem;
    padding: 0.05rem 0.15rem;
  }
  
  .action-btn {
    padding: 0.2rem;
  }
  
  .notes-content {
    font-size: 0.8rem;
  }
  
  .unassigned-title {
    font-size: 0.75rem;
  }
  
  .section-header {
    font-size: 0.9rem;
  }
}

/* Media query adicional para teléfonos muy pequeños */
@media (max-width: 360px) {
  .song-title {
    font-size: 0.8rem;
  }
  
  .song-artist {
    font-size: 0.75rem;
  }
  
  .tag, .list-tag {
    font-size: 0.7rem;
  }
  
  .meta-item {
    font-size: 0.7rem;
  }
  
  .notes-content {
    font-size: 0.75rem;
  }
  
  .collection-title {
    font-size: 0.85rem;
  }
  
  .section-header {
    font-size: 0.85rem;
  }
}

/* Modal personalizado para secciones */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  position: relative;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-header .close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0;
  transition: all 0.2s ease;
  line-height: 1;
  position: absolute;
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
}

.modal-header .close-btn:hover {
  color: #6b7280;
  background: none;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* Responsive para el modal */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 1rem;
  }
}
</style>

