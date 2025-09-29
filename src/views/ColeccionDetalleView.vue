<template>
  <div class="collection-detail-container">
    <!-- Header -->
    <header class="collection-header">
      <div class="header-content">
        <div class="back-section">
          <button @click="goBack" class="back-btn">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <div class="collection-info">
            <h1 class="collection-title">{{ collection?.name }}</h1>
            <p class="collection-description">{{ collection?.description }}</p>
            <div class="collection-meta">
              <span class="song-count">{{ collectionSongs.length }} canciones</span>
              <span class="collection-type">{{ getTypeLabel(collection?.type) }}</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button @click="openAddSongsModal" class="add-songs-btn">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 5v14m7-7H5"/>
            </svg>
            Agregar canciones
          </button>
        </div>
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
        <h3>No hay canciones en esta colección</h3>
        <p>Agrega canciones para comenzar</p>
        <button @click="openAddSongsModal" class="add-first-btn">
          Agregar primera canción
        </button>
      </div>
      
      <!-- Songs List -->
      <div v-else class="songs-list">
        <div 
          v-for="(song, index) in collectionSongs" 
          :key="song.id"
          class="song-item"
          @click="goToSong(song)"
        >
          <div class="song-order">{{ index + 1 }}</div>
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
            <button @click="removeSongFromCollection(song)" class="action-btn remove-btn" title="Quitar de colección">
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
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNotifications } from '@/composables/useNotifications';
import { useColeccionesStore } from '../stores/colecciones';
import { useCancionesStore } from '../stores/canciones';
import { storeToRefs } from 'pinia';
import Modal from "../components/Modal.vue";
import { Collection, Cancion } from '../types/songTypes';

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
onMounted(async () => {
  const collectionId = route.params.id as string;
  if (collectionId) {
    await loadCollection(collectionId);
    await loadCollectionSongs(collectionId);
  }
});

async function loadCollection(collectionId: string) {
  try {
    const collectionData = await coleccionesStore.getCollection(collectionId);
    collection.value = collectionData;
  } catch (err) {
    console.error('Error loading collection:', err);
    showError('Error', 'No se pudo cargar la colección');
  }
}

async function loadCollectionSongs(collectionId: string) {
  try {
    await coleccionesStore.loadCollectionSongs(collectionId);
  } catch (err) {
    console.error('Error loading collection songs:', err);
    showError('Error', 'No se pudo cargar las canciones de la colección');
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
    success('Éxito', `"${song.title}" agregada a la colección`);
    
    // Recargar las canciones de la colección para actualizar la UI
    await loadCollectionSongs(collection.value.id);
  } catch (err) {
    console.error('Error adding song to collection:', err);
    showError('Error', 'No se pudo agregar la canción a la colección');
  }
}

async function removeSongFromCollection(song: Cancion) {
  if (!collection.value) return;

  try {
    const songId = parseInt(song.id);
    await coleccionesStore.removeSongFromCollection(collection.value.id, songId);
    success('Éxito', `"${song.title}" removida de la colección`);
    
    // Recargar las canciones de la colección para actualizar la UI
    await loadCollectionSongs(collection.value.id);
  } catch (err) {
    console.error('Error removing song from collection:', err);
    showError('Error', 'No se pudo remover la canción de la colección');
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
  padding: 1rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.back-section {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
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

.collection-info {
  flex: 1;
  min-width: 0;
}

.collection-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e3a8a;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.collection-description {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

.collection-meta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.song-count {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.collection-type {
  background: #fbbf24;
  color: #1e3a8a;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.header-actions {
  flex-shrink: 0;
}

.add-songs-btn {
  background: #fbbf24;
  color: #1e3a8a;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-songs-btn:hover {
  background: #f59e0b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}


/* Main Content */
.collection-main {
  flex: 1;
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
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
  gap: 0.75rem;
}

.song-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.song-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.song-order {
  background: #f3f4f6;
  color: #6b7280;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
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

/* Responsive */
@media (max-width: 768px) {
  .collection-header {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .back-section {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .add-songs-btn {
    justify-content: center;
  }
  
  .collection-main {
    padding: 1rem;
  }
  
  .song-item {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .collection-title {
    font-size: 1.25rem;
  }
  
  .song-title {
    font-size: 1rem;
  }
  
  .song-artist {
    font-size: 0.85rem;
  }
}
</style>

