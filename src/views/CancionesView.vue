<template>
  <div class="songs-container">
    <!-- Header Compacto -->
    <header class="songs-header">
      <div class="header-content">
        <h1 class="page-title">Canciones</h1>
        <div class="header-actions">
          <button @click="showAddModal = true" class="add-btn">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 5v14m7-7H5"/>
            </svg>
            Nueva canción
          </button>
        </div>
      </div>
    </header>

    <!-- Barra de Búsqueda y Filtros Compacta -->
    <div class="search-section">
      <div class="search-container">
        <div class="search-input-wrapper">
          <svg class="search-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar canciones, artistas, etiquetas..."
            class="search-input"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="filters-row">
          <select v-model="selectedArtist" class="filter-select">
            <option value="">Todos los artistas</option>
            <option v-for="artist in artistas" :key="artist" :value="artist">
              {{ artist }}
            </option>
          </select>
          
          <select v-model="selectedTag" class="filter-select">
            <option value="">Todas las etiquetas</option>
            <option v-for="tag in tags" :key="tag" :value="tag">
              {{ tag }}
            </option>
          </select>
          
          <button v-if="hasActiveFilters" @click="clearFilters" class="clear-filters">
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>

    <!-- Contenido Principal -->
    <main class="songs-main">
      <!-- Estados de Carga y Error -->
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
      
      <div v-else-if="filteredCanciones.length === 0" class="state-container empty">
        <div class="empty-icon">🎵</div>
        <h3>{{ hasActiveFilters ? 'No se encontraron resultados' : 'No hay canciones' }}</h3>
        <p v-if="hasActiveFilters">
          Intenta ajustar los filtros o la búsqueda
        </p>
        <p v-else>
          Comienza agregando tu primera canción
        </p>
        <button v-if="!hasActiveFilters" @click="showAddModal = true" class="add-first-btn">
          Agregar primera canción
        </button>
      </div>
      
      <!-- Lista de Canciones -->
      <div v-else class="songs-grid">
        <div 
          v-for="cancion in filteredCanciones" 
          :key="cancion.id"
          class="song-card"
          @click="goToSong(cancion)"
        >
          <div class="song-info">
            <h3 class="song-title">{{ cancion.title }}</h3>
            <p class="song-artist">{{ cancion.artist }}</p>
            <div class="song-meta">
              <span v-if="cancion.bpm" class="meta-bpm">{{ cancion.bpm }} BPM</span>
              <span v-if="cancion.tempo" class="meta-tempo">{{ cancion.tempo }}</span>
            </div>
            <div class="song-tags">
              <span v-for="tag in cancion.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
          
          <div class="song-actions" @click.stop>
            <button @click="handleAddToCollection(cancion)" class="action-btn collection-btn" title="Agregar a colección">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </button>
            <button @click="handleEditSong(cancion)" class="action-btn edit-btn" title="Editar">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button @click="handleDeleteSong(cancion)" class="action-btn delete-btn" title="Eliminar">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Modales -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Eliminar canción"
      :message="`¿Estás seguro de que quieres eliminar la canción '${songToDelete?.title}'? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      @confirm="confirmDeleteSong"
      @cancel="cancelDeleteSong"
    />

    <!-- Modal para agregar a colección -->
    <Modal :show="showAddToCollectionModal" @close="closeAddToCollectionModal">
      <h3 class="text-lg font-bold text-blue-900 mb-4">
        Agregar "{{ songToAddToCollection?.title }}" a una colección
      </h3>
      <div class="space-y-4">
        <div class="max-h-96 overflow-y-auto space-y-2">
          <div 
            v-for="collection in availableCollections" 
            :key="collection.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div class="flex-1">
              <h4 class="font-medium text-gray-900">{{ collection.name }}</h4>
              <p class="text-sm text-gray-600">{{ collection.description || 'Sin descripción' }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {{ getTypeLabel(collection.type) }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ collection.songCount || 0 }} canciones
                </span>
              </div>
            </div>
            <button 
              @click="addSongToSelectedCollection(collection)"
              class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Agregar
            </button>
          </div>
        </div>

        <div v-if="availableCollections.length === 0" class="text-center text-gray-500 py-8">
          <p v-if="colecciones.length === 0">No tienes colecciones creadas</p>
          <p v-else>Esta canción ya está en todas tus colecciones</p>
          <button 
            @click="goToCollections" 
            class="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            {{ colecciones.length === 0 ? 'Crear primera colección' : 'Ver colecciones' }}
          </button>
        </div>
      </div>
    </Modal>

    <Modal :show="showAddModal || showEditModal" @close="closeModal">
      <h3 class="text-lg font-bold text-blue-900 mb-4">
        {{ isEditing ? 'Editar canción' : 'Agregar nueva canción' }}
      </h3>
      <form @submit.prevent="handleFormSubmit" class="flex flex-col gap-3">
        <!-- Campos básicos -->
        <div class="space-y-3">
          <input
            v-model="form.titulo"
            type="text"
            placeholder="Título *"
            class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
            required
          />
          <input
            v-model="form.autor"
            type="text"
            placeholder="Artista"
            class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
          />
          <div class="relative">
            <textarea
              v-model="form.letra"
              placeholder="Letra"
              rows="4"
              class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base resize-none"
            ></textarea>
            <button
              type="button"
              @click="showLetraFull = true"
              class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
            >
              Pantalla completa
            </button>
          </div>
          <input
            v-model="form.tags"
            type="text"
            placeholder="Etiquetas (separadas por coma)"
            class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
          />
        </div>

        <!-- Botón para mostrar/ocultar más detalles -->
        <button
          type="button"
          @click="showAdvancedFields = !showAdvancedFields"
          class="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium py-2 border-t border-gray-200 mt-2"
        >
          <span>{{ showAdvancedFields ? 'Ocultar' : 'Mostrar' }} más detalles</span>
          <svg 
            :class="{ 'rotate-180': showAdvancedFields }"
            class="w-4 h-4 transition-transform duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        <!-- Campos avanzados -->
        <div v-if="showAdvancedFields" class="space-y-3 border-t border-gray-200 pt-3">
          <input
            v-model="form.subtitle"
            type="text"
            placeholder="Subtítulo"
            class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
          />
          <div class="flex flex-row gap-3">
            <!-- Tempo (Compás musical) -->
            <div class="flex flex-col flex-1">
              <label class="text-sm text-gray-600 mb-2 font-medium">Tempo (Compás)</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="form.tempoNumerator"
                  type="number"
                  placeholder="4"
                  min="1"
                  max="16"
                  class="w-16 px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base text-center"
                />
                <span class="text-gray-400 text-xl font-bold">/</span>
                <input
                  v-model.number="form.tempoDenominator"
                  type="number"
                  placeholder="4"
                  min="1"
                  max="16"
                  class="w-16 px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base text-center"
                />
              </div>
            </div>
            <!-- BPM -->
            <div class="flex flex-col flex-1">
              <label class="text-sm text-gray-600 mb-2 font-medium">BPM</label>
              <input
                v-model.number="form.bpm"
                type="number"
                placeholder="120"
                min="60"
                max="200"
                class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
              />
            </div>
          </div>
          <textarea
            v-model="form.description"
            placeholder="Descripción (opcional)"
            rows="2"
            class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base resize-none"
          ></textarea>
          
          <!-- Recursos de la canción -->
          <SongResourcesManager v-model="form.resources" />
        </div>

        <div class="flex gap-2 mt-2">
          <button
            type="submit"
            class="flex-1 bg-blue-900 text-white rounded py-2 font-semibold hover:bg-blue-800 transition"
          >
            {{ isEditing ? 'Actualizar' : 'Guardar' }}
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

    <!-- Overlay de edición de letra en pantalla completa -->
    <div
      v-if="showLetraFull"
      class="fixed inset-0 z-[1200] flex items-center justify-center bg-black bg-opacity-60"
    >
      <div
        class="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-1 sm:mx-2 p-2 sm:p-4 flex flex-col h-[90vh]"
      >
        <div class="flex justify-between items-center mb-1 sm:mb-2">
          <h4 class="text-lg font-bold text-blue-900">Editar letra</h4>
          <button
            @click="showLetraFull = false"
            class="text-gray-400 hover:text-red-500 text-2xl font-bold"
          >
            &times;
          </button>
        </div>
        <textarea
          v-model="form.letra"
          class="flex-1 w-full px-2 py-2 sm:px-3 rounded border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base resize-none mb-2 sm:mb-3"
          style="min-height: 160px; max-height: 100%"
        ></textarea>
        <div class="flex gap-1 sm:gap-2">
          <button
            @click="showLetraFull = false"
            class="flex-1 bg-blue-900 text-white rounded py-2 font-semibold hover:bg-blue-800 transition"
          >
            Guardar y volver
          </button>
          <button
            @click="showLetraFull = false"
            class="flex-1 bg-gray-200 text-gray-700 rounded py-2 font-semibold hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useCancionesStore } from "../stores/canciones";
import { useColeccionesStore } from "../stores/colecciones";
import { storeToRefs } from "pinia";
import { useNotifications } from '@/composables/useNotifications';
import Modal from "../components/Modal.vue";
import ConfirmModal from "../components/ConfirmModal.vue";
import SongResourcesManager from "../components/SongResourcesManager.vue";
import { Cancion, Collection, SongResource } from "@/types/songTypes";

const router = useRouter();
const cancionesStore = useCancionesStore();
const coleccionesStore = useColeccionesStore();
const { canciones, loading, error, artistas, tags } = storeToRefs(cancionesStore);
const { colecciones } = storeToRefs(coleccionesStore);
const { success, error: showError } = useNotifications();

const searchQuery = ref("");
const selectedArtist = ref("");
const selectedTag = ref("");

const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showAddToCollectionModal = ref(false);
const showLetraFull = ref(false);
const showAdvancedFields = ref(false);
const songToDelete = ref<Cancion | null>(null);
const songToAddToCollection = ref<Cancion | null>(null);
const editingSong = ref<Cancion | null>(null);

const form = ref({
  titulo: "",
  autor: "",
  letra: "",
  tags: "",
  subtitle: "",
  tempoNumerator: null,
  tempoDenominator: null,
  bpm: null,
  description: "",
  resources: [] as SongResource[],
});

// Computed properties
const isEditing = computed(() => showEditModal.value);

const filteredCanciones = computed(() => {
  return cancionesStore.filterCanciones(
    searchQuery.value,
    selectedArtist.value,
    selectedTag.value
  );
});

const hasActiveFilters = computed(() => {
  return searchQuery.value || selectedArtist.value || selectedTag.value;
});

// Computed para colecciones disponibles (que no contengan la canción seleccionada)
const availableCollections = ref<Collection[]>([]);

// Función para cargar colecciones disponibles
async function loadAvailableCollections() {
  if (!songToAddToCollection.value) {
    availableCollections.value = [];
    return;
  }

  const collections = [];
  const songId = parseInt(songToAddToCollection.value.id);
  
  for (const collection of colecciones.value) {
    const isInCollection = await coleccionesStore.isSongInCollection(collection.id, songId);
    if (!isInCollection) {
      collections.push(collection);
    }
  }
  availableCollections.value = collections;
}

// Cargar canciones y colecciones al montar el componente
onMounted(async () => {
  await cancionesStore.loadCanciones();
  await coleccionesStore.loadColecciones();
});

function closeModal() {
  showAddModal.value = false;
  showEditModal.value = false;
  showAdvancedFields.value = false;
  showLetraFull.value = false;
  editingSong.value = null;
  form.value = { 
    titulo: "", 
    autor: "", 
    letra: "", 
    tags: "",
    subtitle: "",
    tempoNumerator: null,
    tempoDenominator: null,
    bpm: null,
    description: "",
    resources: []
  };
}

function handleFormSubmit() {
  if (isEditing.value) {
    updateCancion();
  } else {
    agregarCancion();
  }
}

function goToSong(cancion: Cancion) {
  router.push(`/cancion/${cancion.id}-${(cancion.title || 'sin-titulo')
    .toLowerCase()
    .replace(/ /g, '-')}`);
}

function clearFilters() {
  searchQuery.value = "";
  selectedArtist.value = "";
  selectedTag.value = "";
}

function retryLoad() {
  cancionesStore.loadCanciones();
}

async function agregarCancion() {
  if (!form.value.titulo.trim()) {
    showError('Error', 'El título de la canción es obligatorio');
    return;
  }

  try {
    let tempo = null;
    if (form.value.tempoNumerator && form.value.tempoDenominator) {
      tempo = `${form.value.tempoNumerator}/${form.value.tempoDenominator}`;
    }

    const newSong = {
      title: form.value.titulo.trim(),
      artist: form.value.autor.trim(),
      subtitle: form.value.subtitle.trim() || null,
      tempo: tempo,
      bpm: form.value.bpm || null,
      tags: form.value.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      resources: form.value.resources.filter(r => r.url.trim()),
    };

    const createdSong = await cancionesStore.addCancion(newSong);
    
    if (createdSong && form.value.letra.trim()) {
      try {
        await cancionesStore.createSongLyrics(
          createdSong.id, 
          form.value.letra.trim(),
          form.value.description.trim() || `Letra de ${createdSong.title}`
        );
      } catch (lyricsErr) {
        console.error('Error al crear la letra:', lyricsErr);
        showError('Error', 'Canción creada pero no se pudo guardar la letra');
      }
    }
    
    success('Éxito', `Canción "${createdSong.title}" agregada correctamente`);
    closeModal();
  } catch (err) {
    console.error('Error al agregar canción:', err);
    showError('Error', 'No se pudo agregar la canción. Inténtalo de nuevo.');
  }
}

function handleEditSong(cancion: Cancion) {
  editingSong.value = cancion;
  showEditModal.value = true;
  
  form.value = {
    titulo: cancion.title || "",
    autor: cancion.artist || "",
    letra: "",
    tags: cancion.tags ? cancion.tags.join(", ") : "",
    subtitle: cancion.subtitle || "",
    tempoNumerator: cancion.tempo ? parseInt(cancion.tempo.split('/')[0]) : null,
    tempoDenominator: cancion.tempo ? parseInt(cancion.tempo.split('/')[1]) : null,
    bpm: cancion.bpm,
    description: "",
    resources: cancion.resources || []
  };
  
  loadSongLyrics(cancion.id);
}

async function loadSongLyrics(songId: string) {
  try {
    const lyrics = await cancionesStore.getSongLyrics(songId);
    if (lyrics) {
      form.value.letra = lyrics;
    }
  } catch (err) {
    console.error('Error loading lyrics:', err);
  }
}

async function updateCancion() {
  if (!form.value.titulo.trim() || !editingSong.value) {
    showError('Error', 'El título de la canción es obligatorio');
    return;
  }

  try {
    let tempo = null;
    if (form.value.tempoNumerator && form.value.tempoDenominator) {
      tempo = `${form.value.tempoNumerator}/${form.value.tempoDenominator}`;
    }

    const updates = {
      title: form.value.titulo.trim(),
      artist: form.value.autor.trim(),
      subtitle: form.value.subtitle.trim() || null,
      tempo: tempo,
      bpm: form.value.bpm || null,
      tags: form.value.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      resources: form.value.resources.filter(r => r.url.trim()),
    };

    await cancionesStore.updateCancion(editingSong.value.id, updates);
    
    if (form.value.letra.trim()) {
      try {
        await cancionesStore.createSongLyrics(
          editingSong.value.id, 
          form.value.letra.trim(),
          form.value.description.trim() || `Letra de ${updates.title}`
        );
      } catch (lyricsErr) {
        console.error('Error al actualizar la letra:', lyricsErr);
        showError('Error', 'Canción actualizada pero no se pudo guardar la letra');
      }
    }
    
    success('Éxito', `Canción "${updates.title}" actualizada correctamente`);
    closeModal();
  } catch (err) {
    console.error('Error al actualizar canción:', err);
    showError('Error', 'No se pudo actualizar la canción. Inténtalo de nuevo.');
  }
}

function handleDeleteSong(cancion: Cancion) {
  songToDelete.value = cancion;
  showDeleteModal.value = true;
}

function cancelDeleteSong() {
  songToDelete.value = null;
  showDeleteModal.value = false;
}

async function confirmDeleteSong() {
  if (!songToDelete.value) return;

  try {
    await cancionesStore.deleteCancion(songToDelete.value.id);
    success('Éxito', `Canción "${songToDelete.value.title}" eliminada correctamente`);
    cancelDeleteSong();
  } catch (err) {
    console.error('Error al eliminar canción:', err);
    showError('Error', 'No se pudo eliminar la canción. Inténtalo de nuevo.');
  }
}

// Funciones para agregar a colección
async function handleAddToCollection(cancion: Cancion) {
  songToAddToCollection.value = cancion;
  showAddToCollectionModal.value = true;
  await loadAvailableCollections();
}

function closeAddToCollectionModal() {
  showAddToCollectionModal.value = false;
  songToAddToCollection.value = null;
}

async function addSongToSelectedCollection(collection: Collection) {
  if (!songToAddToCollection.value) return;

  try {
    const songId = parseInt(songToAddToCollection.value.id);
    await coleccionesStore.addSongToCollection(collection.id, songId);
    success('Éxito', `"${songToAddToCollection.value.title}" agregada a "${collection.name}"`);
    closeAddToCollectionModal();
  } catch (err) {
    console.error('Error adding song to collection:', err);
    showError('Error', 'No se pudo agregar la canción a la colección');
  }
}

function goToCollections() {
  closeAddToCollectionModal();
  router.push('/colecciones');
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
.songs-container {
  min-height: 100vh;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}

/* Header */
.songs-header {
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
  align-items: center;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e3a8a;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.add-btn {
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

.add-btn:hover {
  background: #f59e0b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}

/* Search Section */
.search-section {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
}

.search-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #6b7280;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  background: #f9fafb;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-search {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-search:hover {
  color: #374151;
  background: #f3f4f6;
}

.filters-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 150px;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-filters {
  background: none;
  border: 1px solid #d1d5db;
  color: #6b7280;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-filters:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Main Content */
.songs-main {
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

/* Songs Grid */
.songs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.song-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.song-card:hover {
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
  color: #fbbf24;
  margin: 0 0 0.75rem 0;
  font-weight: 500;
}

.song-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.meta-bpm, .meta-tempo {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.song-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.tag {
  background: #fbbf24;
  color: #1e3a8a;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.song-actions {
  display: flex;
  gap: 0.25rem;
  margin-left: 0.75rem;
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

.collection-btn {
  color: #6b7280;
}

.collection-btn:hover {
  background: #f0f9ff;
  color: #0ea5e9;
}

.edit-btn {
  color: #6b7280;
}

.edit-btn:hover {
  background: #f3f4f6;
  color: #3b82f6;
}

.delete-btn {
  color: #6b7280;
}

.delete-btn:hover {
  background: #fef2f2;
  color: #dc2626;
}

/* Responsive */
@media (max-width: 768px) {
  .songs-header {
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
  
  .search-section {
    padding: 1rem;
  }
  
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-select {
    min-width: auto;
  }
  
  .songs-main {
    padding: 1rem;
  }
  
  .songs-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .song-card {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .page-title {
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