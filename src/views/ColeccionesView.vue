<template>
  <div class="collections-container">
    <!-- Header -->
    <header class="collections-header">
      <div class="header-content">
        <h1 class="page-title">Colecciones</h1>
        <div class="header-actions">
          <button @click="showCreateCollection = true" class="add-btn">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 5v14m7-7H5"/>
            </svg>
            Nueva colección
          </button>
        </div>
      </div>
    </header>

    <!-- Search Section -->
    <div class="search-section">
      <div class="search-container">
        <div class="search-input-wrapper">
          <svg class="search-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar colecciones..."
            class="search-input"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="collections-main">
      <!-- States -->
      <div v-if="loading" class="state-container">
        <div class="loading-spinner"></div>
        <p>Cargando colecciones...</p>
      </div>
      
      <div v-else-if="error" class="state-container error">
        <div class="error-icon">⚠️</div>
        <h3>Error al cargar colecciones</h3>
        <p>{{ error }}</p>
        <button @click="retryLoad" class="retry-btn">Reintentar</button>
      </div>
      
      <div v-else-if="filteredCollections.length === 0" class="state-container empty">
        <div class="empty-icon">📚</div>
        <h3>{{ hasActiveFilters ? 'No se encontraron colecciones' : 'No hay colecciones' }}</h3>
        <p v-if="hasActiveFilters">
          Intenta ajustar la búsqueda
        </p>
        <p v-else>
          Comienza creando tu primera colección
        </p>
        <button v-if="!hasActiveFilters" @click="showCreateCollection = true" class="add-first-btn">
          Crear primera colección
        </button>
      </div>
      
      <!-- Collections Grid -->
      <div v-else class="collections-grid">
        <div 
          v-for="collection in filteredCollections" 
          :key="collection.id"
          class="collection-card"
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
            <div class="collection-meta">
              <span class="song-count">{{ collection.songCount }} canciones</span>
              <span class="collection-type">{{ collection.type }}</span>
            </div>
          </div>
          
          <div class="collection-actions" @click.stop>
            <button @click="handleEditCollection(collection)" class="action-btn edit-btn" title="Editar">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button @click="handleDeleteCollection(collection)" class="action-btn delete-btn" title="Eliminar">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Eliminar colección"
      :message="`¿Estás seguro de que quieres eliminar la colección '${collectionToDelete?.name}'? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      @confirm="confirmDeleteCollection"
      @cancel="cancelDeleteCollection"
    />

    <Modal :show="showCreateCollection || showEditCollection" @close="closeModal">
      <h3 class="text-lg font-bold text-blue-900 mb-4">
        {{ isEditing ? 'Editar colección' : 'Crear nueva colección' }}
      </h3>
      <form @submit.prevent="handleFormSubmit" class="flex flex-col gap-3">
        <input
          v-model="form.name"
          type="text"
          placeholder="Nombre de la colección *"
          class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
          required
        />
        <textarea
          v-model="form.description"
          placeholder="Descripción (opcional)"
          rows="3"
          class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base resize-none"
        ></textarea>
        <select
          v-model="form.type"
          class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
        >
          <option value="playlist">Playlist</option>
          <option value="album">Álbum</option>
          <option value="favorites">Favoritos</option>
          <option value="custom">Personalizada</option>
        </select>

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
import Modal from "../components/Modal.vue";
import ConfirmModal from "../components/ConfirmModal.vue";

const router = useRouter();
const { success, error: showError } = useNotifications();

// Mock data for collections (en el futuro esto vendrá de un store)
const collections = ref([
  {
    id: '1',
    name: 'Favoritas',
    description: 'Mis canciones favoritas',
    type: 'favorites',
    songCount: 12,
    createdAt: new Date()
  },
  {
    id: '2',
    name: 'Alabanza',
    description: 'Canciones de alabanza y adoración',
    type: 'playlist',
    songCount: 8,
    createdAt: new Date()
  },
  {
    id: '3',
    name: 'Nuevas Canciones',
    description: 'Últimas canciones agregadas',
    type: 'album',
    songCount: 5,
    createdAt: new Date()
  }
]);

const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref("");

const showCreateCollection = ref(false);
const showEditCollection = ref(false);
const showDeleteModal = ref(false);
const collectionToDelete = ref<any>(null);
const editingCollection = ref<any>(null);

const form = ref({
  name: '',
  description: '',
  type: 'playlist'
});

// Computed properties
const isEditing = computed(() => showEditCollection.value);

const filteredCollections = computed(() => {
  if (!searchQuery.value) return collections.value;
  
  return collections.value.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    collection.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const hasActiveFilters = computed(() => {
  return searchQuery.value;
});

// Methods
onMounted(() => {
  // En el futuro aquí se cargarían las colecciones desde el store
});

function closeModal() {
  showCreateCollection.value = false;
  showEditCollection.value = false;
  editingCollection.value = null;
  form.value = { 
    name: '', 
    description: '', 
    type: 'playlist'
  };
}

function handleFormSubmit() {
  if (isEditing.value) {
    updateCollection();
  } else {
    createCollection();
  }
}

function goToCollection(collection: any) {
  // En el futuro esto navegaría a la vista de la colección
  console.log('Navegar a colección:', collection);
}

function retryLoad() {
  // En el futuro esto recargaría las colecciones
  console.log('Recargar colecciones');
}

function createCollection() {
  if (!form.value.name.trim()) return;

  try {
    const newCollection = {
      id: Date.now().toString(),
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      type: form.value.type,
      songCount: 0,
      createdAt: new Date()
    };

    collections.value.unshift(newCollection);
    success('Éxito', `Colección "${newCollection.name}" creada correctamente`);
    closeModal();
  } catch (err) {
    console.error('Error al crear colección:', err);
    showError('Error', 'No se pudo crear la colección. Inténtalo de nuevo.');
  }
}

function handleEditCollection(collection: any) {
  editingCollection.value = collection;
  showEditCollection.value = true;
  
  form.value = {
    name: collection.name,
    description: collection.description,
    type: collection.type
  };
}

function updateCollection() {
  if (!form.value.name.trim() || !editingCollection.value) return;

  try {
    const index = collections.value.findIndex(c => c.id === editingCollection.value.id);
    if (index !== -1) {
      collections.value[index] = {
        ...collections.value[index],
        name: form.value.name.trim(),
        description: form.value.description.trim(),
        type: form.value.type
      };
    }
    
    success('Éxito', `Colección "${form.value.name}" actualizada correctamente`);
    closeModal();
  } catch (err) {
    console.error('Error al actualizar colección:', err);
    showError('Error', 'No se pudo actualizar la colección. Inténtalo de nuevo.');
  }
}

function handleDeleteCollection(collection: any) {
  collectionToDelete.value = collection;
  showDeleteModal.value = true;
}

function cancelDeleteCollection() {
  collectionToDelete.value = null;
  showDeleteModal.value = false;
}

function confirmDeleteCollection() {
  if (!collectionToDelete.value) return;

  try {
    collections.value = collections.value.filter(c => c.id !== collectionToDelete.value.id);
    success('Éxito', `Colección "${collectionToDelete.value.name}" eliminada correctamente`);
    cancelDeleteCollection();
  } catch (err) {
    console.error('Error al eliminar colección:', err);
    showError('Error', 'No se pudo eliminar la colección. Inténtalo de nuevo.');
  }
}
</script>

<style scoped>
.collections-container {
  min-height: 100vh;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}

/* Header */
.collections-header {
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

/* Main Content */
.collections-main {
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

/* Collections Grid */
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.collection-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.collection-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.collection-icon {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.75rem;
  border-radius: 8px;
  flex-shrink: 0;
}

.collection-info {
  flex: 1;
  min-width: 0;
}

.collection-title {
  font-size: 1.1rem;
  font-weight: 600;
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
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
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
  
  .search-section {
    padding: 1rem;
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
