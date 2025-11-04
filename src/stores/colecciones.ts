import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { CollectionsService } from '../api/collections';
import { Collection, Cancion, CancionEnLista, DayOfWeek } from '../types/songTypes';

export const useColeccionesStore = defineStore('colecciones', () => {
  // State
  const colecciones = ref<Collection[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentCollection = ref<Collection | null>(null);
  const collectionSongs = ref<CancionEnLista[]>([]);

  // Helper: Parsear fecha como fecha local (sin timezone)
  // Formato esperado: "YYYY-MM-DD"
  function parseLocalDate(dateString: string): Date | null {
    if (!dateString) return null;
    try {
      // Parsear fecha como local (YYYY-MM-DD)
      const parts = dateString.split('-');
      if (parts.length !== 3) return null;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Mes en JS es 0-indexed
      const day = parseInt(parts[2], 10);
      
      // Crear fecha local (sin timezone)
      return new Date(year, month, day);
    } catch {
      return null;
    }
  }

  // Helper: Calcular día de la semana desde event_date
  function getDayOfWeek(eventDate: string | undefined): DayOfWeek | null {
    if (!eventDate) return null;
    const date = parseLocalDate(eventDate);
    if (!date) return null;
    
    const days: DayOfWeek[] = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return days[date.getDay()];
  }

  // Helper: Formatear fecha para mostrar
  function formatEventDate(eventDate: string | undefined): string {
    if (!eventDate) return '';
    const date = parseLocalDate(eventDate);
    if (!date) return eventDate;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  }

  // Helper: Obtener mes y año de una fecha
  function getMonthYear(eventDate: string | undefined): string | null {
    if (!eventDate) return null;
    const date = parseLocalDate(eventDate);
    if (!date) return null;
    
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  // Getters
  const weeklyLists = computed(() => 
    colecciones.value.filter(c => c.category === 'lista semanal')
  );
  
  const events = computed(() => 
    colecciones.value.filter(c => c.category === 'evento')
  );
  
  const otherCollections = computed(() => 
    colecciones.value.filter(c => c.category === 'otro')
  );

  // Listas con fecha de evento (semanales + eventos)
  const collectionsWithDate = computed(() =>
    colecciones.value.filter(c => c.event_date && (c.category === 'lista semanal' || c.category === 'evento'))
  );

  // Listas semanales agrupadas por mes
  const weeklyListsByMonth = computed(() => {
    const grouped: Record<string, Collection[]> = {};
    weeklyLists.value.forEach(list => {
      if (list.event_date) {
        const monthYear = getMonthYear(list.event_date);
        if (monthYear) {
          if (!grouped[monthYear]) {
            grouped[monthYear] = [];
          }
          grouped[monthYear].push(list);
        }
      }
    });
    // Ordenar listas dentro de cada mes por fecha (más recientes primero)
    Object.keys(grouped).forEach(month => {
      grouped[month].sort((a, b) => {
        if (!a.event_date || !b.event_date) return 0;
        // Comparar strings directamente (YYYY-MM-DD se ordena lexicográficamente)
        return b.event_date.localeCompare(a.event_date);
      });
    });
    return grouped;
  });

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
  async function reorderCollectionSongs(collectionId: string, songOrders: { songId: string; orderIndex: number; sectionId?: string | null }[]): Promise<boolean> {
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

  // Función para ordenar colecciones
  function sortColecciones(
    collections: Collection[],
    sortBy: 'event_date' | 'name' | 'created_at' | 'songCount' = 'event_date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Collection[] {
    const sorted = [...collections];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'event_date':
          // Ordenar por fecha de evento (las que no tienen fecha van al final)
          if (!a.event_date && !b.event_date) return 0;
          if (!a.event_date) return 1; // a va al final
          if (!b.event_date) return -1; // b va al final
          // Para descendente: más recientes primero (invertir el orden)
          // localeCompare devuelve: negativo si a < b, positivo si a > b
          // Para descendente queremos: si a > b (más reciente), a va antes (negativo)
          comparison = b.event_date.localeCompare(a.event_date);
          break;
          
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
          
        case 'created_at':
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          comparison = dateA - dateB;
          break;
          
        case 'songCount':
          comparison = (a.songCount || 0) - (b.songCount || 0);
          break;
      }
      
      // Para event_date, ya invertimos la comparación, así que solo invertimos si es ascendente
      // Para otros campos, invertimos según sortOrder
      if (sortBy === 'event_date') {
        return sortOrder === 'asc' ? -comparison : comparison;
      } else {
        return sortOrder === 'asc' ? comparison : -comparison;
      }
    });
    
    return sorted;
  }

  // Función para obtener colecciones filtradas
  function filterColecciones(
    searchQuery?: string,
    categoryFilter?: 'lista semanal' | 'evento' | 'otro',
    dateRange?: { start?: string; end?: string },
    daysOfWeek?: DayOfWeek[],
    monthFilter?: string,
    sortBy?: 'event_date' | 'name' | 'created_at' | 'songCount',
    sortOrder?: 'asc' | 'desc'
  ) {
    let filtered = colecciones.value;

    // Filtro por búsqueda de texto
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(coleccion =>
        coleccion.name.toLowerCase().includes(query) ||
        (coleccion.description && coleccion.description.toLowerCase().includes(query))
      );
    }

    // Filtro por categoría
    if (categoryFilter) {
      filtered = filtered.filter(coleccion => coleccion.category === categoryFilter);
    }

    // Filtro por rango de fechas (solo para listas con event_date)
    if (dateRange && (dateRange.start || dateRange.end)) {
      filtered = filtered.filter(coleccion => {
        if (!coleccion.event_date) return false;
        // Comparar strings directamente (YYYY-MM-DD se ordena lexicográficamente)
        if (dateRange.start) {
          if (coleccion.event_date < dateRange.start) return false;
        }
        if (dateRange.end) {
          if (coleccion.event_date > dateRange.end) return false;
        }
        return true;
      });
    }

    // Filtro por días de la semana (solo para listas semanales)
    if (daysOfWeek && daysOfWeek.length > 0) {
      filtered = filtered.filter(coleccion => {
        if (coleccion.category !== 'lista semanal' || !coleccion.event_date) return false;
        const day = getDayOfWeek(coleccion.event_date);
        return day && daysOfWeek.includes(day);
      });
    }

    // Filtro por mes específico
    if (monthFilter) {
      filtered = filtered.filter(coleccion => {
        if (!coleccion.event_date) return false;
        const monthYear = getMonthYear(coleccion.event_date);
        return monthYear === monthFilter;
      });
    }

    // Aplicar ordenamiento (por defecto: event_date descendente)
    const finalSortBy = sortBy || 'event_date';
    const finalSortOrder = sortOrder || 'desc';
    
    return sortColecciones(filtered, finalSortBy, finalSortOrder);
  }

  // Función para obtener listas del mes actual (solo listas semanales y eventos)
  function getCurrentMonthCollections() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return filterColecciones(
      undefined,
      undefined,
      { 
        start: start.toISOString().split('T')[0], 
        end: end.toISOString().split('T')[0] 
      }
    ).filter(c => c.category === 'lista semanal' || c.category === 'evento');
  }

  // Función para obtener listas del mes pasado (solo listas semanales y eventos)
  function getLastMonthCollections() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return filterColecciones(
      undefined,
      undefined,
      { 
        start: start.toISOString().split('T')[0], 
        end: end.toISOString().split('T')[0] 
      }
    ).filter(c => c.category === 'lista semanal' || c.category === 'evento');
  }

  // Funciones para manejar etiquetas de lista
  async function updateSongListTags(collectionSongId: string, listTags: string[]) {
    try {
      await CollectionsService.updateSongListTags(collectionSongId, listTags);
      
      // Actualizar el estado local de forma reactiva
      const songIndex = collectionSongs.value.findIndex(song => song.collection_song_id === collectionSongId);
      if (songIndex !== -1) {
        // Crear un nuevo objeto para forzar la reactividad
        const updatedSong = {
          ...collectionSongs.value[songIndex],
          list_tags: listTags
        };
        collectionSongs.value[songIndex] = updatedSong;
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
      
      // Actualizar el estado local de forma reactiva
      const songIndex = collectionSongs.value.findIndex(song => song.collection_song_id === collectionSongId);
      if (songIndex !== -1) {
        const currentTags = collectionSongs.value[songIndex].list_tags || [];
        if (!currentTags.includes(tag)) {
          // Crear un nuevo objeto para forzar la reactividad
          const updatedSong = {
            ...collectionSongs.value[songIndex],
            list_tags: [...currentTags, tag]
          };
          collectionSongs.value[songIndex] = updatedSong;
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
      
      // Actualizar el estado local de forma reactiva
      const songIndex = collectionSongs.value.findIndex(song => song.collection_song_id === collectionSongId);
      if (songIndex !== -1) {
        const currentTags = collectionSongs.value[songIndex].list_tags || [];
        // Crear un nuevo objeto para forzar la reactividad
        const updatedSong = {
          ...collectionSongs.value[songIndex],
          list_tags: currentTags.filter(t => t !== tag)
        };
        collectionSongs.value[songIndex] = updatedSong;
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
      
      // Actualizar el estado local de forma reactiva
      const songIndex = collectionSongs.value.findIndex(song => song.collection_song_id === collectionSongId);
      if (songIndex !== -1) {
        // Crear un nuevo objeto para forzar la reactividad
        const updatedSong = {
          ...collectionSongs.value[songIndex],
          notes: notes
        };
        collectionSongs.value[songIndex] = updatedSong;
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
      
      // Actualizar el estado local de forma reactiva
      const songIndex = collectionSongs.value.findIndex(song => song.collection_song_id === collectionSongId);
      console.log('🔍 Debug updateSongListData:', {
        collectionSongId,
        songIndex,
        listTags,
        notes,
        currentSong: songIndex !== -1 ? collectionSongs.value[songIndex] : null
      });
      
      if (songIndex !== -1) {
        // Crear un nuevo objeto para forzar la reactividad
        const updatedSong = {
          ...collectionSongs.value[songIndex],
          list_tags: listTags,
          notes: notes
        };
        collectionSongs.value[songIndex] = updatedSong;
        console.log('✅ Song updated in colecciones store:', updatedSong);
        
        // También actualizar el store de secciones si está disponible
        try {
          const { useSectionsStore } = await import('./sections');
          const sectionsStore = useSectionsStore();
          if (sectionsStore && typeof sectionsStore.updateSongInSections === 'function') {
            sectionsStore.updateSongInSections(collectionSongId, { list_tags: listTags, notes: notes });
            console.log('✅ Song updated in sections store');
          }
        } catch (sectionsErr) {
          console.warn('⚠️ Could not update sections store:', sectionsErr);
        }
      } else {
        console.warn('⚠️ Song not found in collectionSongs:', collectionSongId);
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
    weeklyLists,
    events,
    otherCollections,
    collectionsWithDate,
    weeklyListsByMonth,
    
    // Helper functions
    getDayOfWeek,
    formatEventDate,
    getMonthYear,
    sortColecciones,
    
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
    getCurrentMonthCollections,
    getLastMonthCollections,
    updateCollectionSongCount,
    updateSongListTags,
    addSongListTag,
    removeSongListTag,
    updateSongNotes,
    updateSongListData
  };
});
