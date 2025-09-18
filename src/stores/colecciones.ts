import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { CollectionsService } from '../api/collections';
import { Collection, Cancion } from '../types/songTypes';

export const useColeccionesStore = defineStore('colecciones', () => {
  // State
  const colecciones = ref<Collection[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentCollection = ref<Collection | null>(null);
  const collectionSongs = ref<Cancion[]>([]);

  // Getters
  const playlists = computed(() => 
    colecciones.value.filter(c => c.type === 'playlist')
  );
  
  const albums = computed(() => 
    colecciones.value.filter(c => c.type === 'album')
  );
  
  const favorites = computed(() => 
    colecciones.value.filter(c => c.type === 'favorites')
  );
  
  const customCollections = computed(() => 
    colecciones.value.filter(c => c.type === 'custom')
  );

  // Actions
  async function loadColecciones() {
    loading.value = true;
    error.value = null;
    try {
      const data = await CollectionsService.getCollections();
      colecciones.value = data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar colecciones';
      console.error('Error loading collections:', err);
    } finally {
      loading.value = false;
    }
  }

  async function getCollection(id: string) {
    try {
      const collection = await CollectionsService.getCollection(id);
      return collection;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar colección';
      console.error('Error loading collection:', err);
      throw err;
    }
  }

  async function isSongInCollection(collectionId: string, songId: number): Promise<boolean> {
    try {
      const { data, error } = await CollectionsService.checkSongInCollection(collectionId, songId);
      if (error) throw error;
      return data || false;
    } catch (err) {
      console.error('Error checking if song is in collection:', err);
      return false;
    }
  }

  async function createColeccion(coleccionData: Omit<Collection, 'id' | 'created_at' | 'updated_at'>) {
    loading.value = true;
    error.value = null;
    try {
      const newColeccion = await CollectionsService.createCollection(coleccionData);
      colecciones.value.unshift(newColeccion);
      return newColeccion;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear colección';
      console.error('Error creating collection:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateColeccion(id: string, updates: Partial<Omit<Collection, 'id' | 'created_at' | 'updated_at'>>) {
    loading.value = true;
    error.value = null;
    try {
      const updatedColeccion = await CollectionsService.updateCollection(id, updates);
      const index = colecciones.value.findIndex(c => c.id === id);
      if (index !== -1) {
        colecciones.value[index] = updatedColeccion;
      }
      return updatedColeccion;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar colección';
      console.error('Error updating collection:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteColeccion(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await CollectionsService.deleteCollection(id);
      colecciones.value = colecciones.value.filter(c => c.id !== id);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar colección';
      console.error('Error deleting collection:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function loadCollectionSongs(collectionId: string) {
    loading.value = true;
    error.value = null;
    try {
      const songs = await CollectionsService.getCollectionSongs(collectionId);
      collectionSongs.value = songs;
      return songs;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar canciones de la colección';
      console.error('Error loading collection songs:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function addSongToCollection(collectionId: string, songId: number) {
    try {
      await CollectionsService.addSongToCollection(collectionId, songId);
      // Recargar las canciones de la colección si es la actual
      if (currentCollection.value?.id === collectionId) {
        await loadCollectionSongs(collectionId);
      }
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al agregar canción a la colección';
      console.error('Error adding song to collection:', err);
      throw err;
    }
  }

  async function removeSongFromCollection(collectionId: string, songId: number) {
    try {
      await CollectionsService.removeSongFromCollection(collectionId, songId);
      // Recargar las canciones de la colección si es la actual
      if (currentCollection.value?.id === collectionId) {
        await loadCollectionSongs(collectionId);
      }
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al remover canción de la colección';
      console.error('Error removing song from collection:', err);
      throw err;
    }
  }

  function setCurrentCollection(coleccion: Collection | null) {
    currentCollection.value = coleccion;
  }

  function clearError() {
    error.value = null;
  }

  // Función para obtener colecciones filtradas
  function filterColecciones(searchQuery: string, typeFilter?: string) {
    let filtered = colecciones.value;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(coleccion =>
        coleccion.name.toLowerCase().includes(query) ||
        (coleccion.description && coleccion.description.toLowerCase().includes(query))
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(coleccion => coleccion.type === typeFilter);
    }

    return filtered;
  }

  return {
    // State
    colecciones,
    loading,
    error,
    currentCollection,
    collectionSongs,
    
    // Getters
    playlists,
    albums,
    favorites,
    customCollections,
    
    // Actions
    loadColecciones,
    getCollection,
    isSongInCollection,
    createColeccion,
    updateColeccion,
    deleteColeccion,
    loadCollectionSongs,
    addSongToCollection,
    removeSongFromCollection,
    setCurrentCollection,
    clearError,
    filterColecciones
  };
});
