import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { CollectionsService } from '../api/collections';
import { Collection, Cancion, CancionEnLista } from '../types/songTypes';

export const useColeccionesStore = defineStore('colecciones', () => {
  // State
  const colecciones = ref<Collection[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentCollection = ref<Collection | null>(null);
  const collectionSongs = ref<CancionEnLista[]>([]);

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
      const result = await CollectionsService.checkSongInCollection(collectionId, songId);
      return result;
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
      // Actualizar el contador de canciones en la lista principal
      await updateCollectionSongCount(collectionId);
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
      // Actualizar el contador de canciones en la lista principal
      await updateCollectionSongCount(collectionId);
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

  // Función para reordenar canciones en una colección
  async function reorderCollectionSongs(collectionId: string, songOrders: { songId: number; orderIndex: number }[]): Promise<boolean> {
    try {
      const result = await CollectionsService.reorderCollectionSongs(collectionId, songOrders);
      // NO recargamos la lista porque el estado local ya está actualizado
      // Esto evita que SortableJS se rompa
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al reordenar canciones';
      console.error('Error reordering collection songs:', err);
      throw err;
    }
  }

  // Función para actualizar el contador de canciones de una colección específica
  async function updateCollectionSongCount(collectionId: string) {
    try {
      const { songCount } = await CollectionsService.getCollectionStats(collectionId);
      
      // Actualizar el contador en la lista de colecciones
      const collectionIndex = colecciones.value.findIndex(c => c.id === collectionId);
      if (collectionIndex !== -1) {
        colecciones.value[collectionIndex].songCount = songCount;
      }
    } catch (err) {
      console.error('Error updating collection song count:', err);
    }
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

  // Funciones para manejar etiquetas de lista
  async function updateSongListTags(collectionSongId: string, listTags: string[]) {
    try {
      await CollectionsService.updateSongListTags(collectionSongId, listTags);
      
      // Actualizar el estado local
      const songIndex = collectionSongs.value.findIndex(song => song.collection_song_id === collectionSongId);
      if (songIndex !== -1) {
        collectionSongs.value[songIndex].list_tags = listTags;
      }
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar etiquetas de lista';
      console.error('Error updating song list tags:', err);
      throw err;
    }
  }

  async function addSongListTag(collectionSongId: string, tag: string) {
    try {
      await CollectionsService.addSongListTag(collectionSongId, tag);
      
      // Actualizar el estado local
      const songIndex = collectionSongs.value.findIndex(song => song.collection_song_id === collectionSongId);
      if (songIndex !== -1) {
        const currentTags = collectionSongs.value[songIndex].list_tags || [];
        if (!currentTags.includes(tag)) {
          collectionSongs.value[songIndex].list_tags = [...currentTags, tag];
        }
      }
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al agregar etiqueta de lista';
      console.error('Error adding song list tag:', err);
      throw err;
    }
  }

  async function removeSongListTag(collectionSongId: string, tag: string) {
    try {
      await CollectionsService.removeSongListTag(collectionSongId, tag);
      
      // Actualizar el estado local
      const songIndex = collectionSongs.value.findIndex(song => song.collection_song_id === collectionSongId);
      if (songIndex !== -1) {
        const currentTags = collectionSongs.value[songIndex].list_tags || [];
        collectionSongs.value[songIndex].list_tags = currentTags.filter(t => t !== tag);
      }
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al remover etiqueta de lista';
      console.error('Error removing song list tag:', err);
      throw err;
    }
  }

  // Funciones para manejar notas de lista
  async function updateSongNotes(collectionSongId: string, notes: string) {
    try {
      await CollectionsService.updateSongNotes(collectionSongId, notes);
      
      // Actualizar el estado local
      const songIndex = collectionSongs.value.findIndex(song => song.collection_song_id === collectionSongId);
      if (songIndex !== -1) {
        collectionSongs.value[songIndex].notes = notes;
      }
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar notas de lista';
      console.error('Error updating song notes:', err);
      throw err;
    }
  }

  async function updateSongListData(collectionSongId: string, listTags: string[], notes: string) {
    try {
      await CollectionsService.updateSongListData(collectionSongId, listTags, notes);
      
      // Actualizar el estado local
      const songIndex = collectionSongs.value.findIndex(song => song.collection_song_id === collectionSongId);
      if (songIndex !== -1) {
        collectionSongs.value[songIndex].list_tags = listTags;
        collectionSongs.value[songIndex].notes = notes;
      }
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar datos de lista';
      console.error('Error updating song list data:', err);
      throw err;
    }
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
    reorderCollectionSongs,
    setCurrentCollection,
    clearError,
    filterColecciones,
    updateCollectionSongCount,
    updateSongListTags,
    addSongListTag,
    removeSongListTag,
    updateSongNotes,
    updateSongListData
  };
});
