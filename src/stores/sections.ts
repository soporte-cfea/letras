import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SectionsService, type CollectionSection } from '../api/sections';
import type { CancionEnLista } from '../types/songTypes';
import {
  getCachedSections,
  setCachedSections,
  invalidateSectionsCache
} from '@/utils/cache';

export const useSectionsStore = defineStore('sections', () => {
  // State
  const sections = ref<CollectionSection[]>([]);
  const songsBySection = ref<{ [sectionId: string]: CancionEnLista[] }>({});
  const unassignedSongs = ref<CancionEnLista[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const sectionsWithSongs = computed(() => {
    return sections.value.map(section => ({
      ...section,
      songs: songsBySection.value[section.id] || []
    }));
  });

  const totalSongs = computed(() => {
    const sectionSongs = Object.values(songsBySection.value).reduce((total, songs) => total + songs.length, 0);
    return sectionSongs + unassignedSongs.value.length;
  });

  // Actions
  async function fetchSections(collectionId: string, forceRefresh = false) {
    loading.value = true;
    error.value = null;
    
    // Limpiar estado antes de cargar nuevos datos
    clearSections();
    
    // Si no se fuerza actualización, intentar cargar del caché primero
    if (!forceRefresh) {
      const cached = await getCachedSections(collectionId);
      if (cached) {
        // Restaurar estado desde caché
        sections.value = cached.sections.map((section: any) => ({
          id: section.id,
          collection_id: section.collection_id,
          name: section.name,
          description: section.description,
          order_index: section.order_index,
          color: section.color,
          enabled: section.enabled !== undefined ? section.enabled : true,
          created_at: section.created_at,
          updated_at: section.updated_at
        }));

        songsBySection.value = {};
        cached.sections.forEach((section: any) => {
          songsBySection.value[section.id] = [...(section.songs || [])];
        });

        unassignedSongs.value = [...(cached.unassignedSongs || [])];
        
        loading.value = false;
        return true;
      }
    }
    
    try {
      const data = await SectionsService.getSongsBySection(collectionId);
      
      sections.value = data.sections.map(section => ({
        id: section.id,
        collection_id: section.collection_id,
        name: section.name,
        description: section.description,
        order_index: section.order_index,
        color: section.color,
        enabled: section.enabled || true, // Por defecto true si no existe
        created_at: section.created_at,
        updated_at: section.updated_at
      }));

      // Limpiar y organizar canciones por sección
      songsBySection.value = {};
      data.sections.forEach(section => {
        songsBySection.value[section.id] = [...section.songs]; // Crear nueva referencia
      });

      unassignedSongs.value = [...data.unassignedSongs]; // Crear nueva referencia
      
      // Guardar en caché
      await setCachedSections(collectionId, {
        sections: data.sections,
        unassignedSongs: data.unassignedSongs
      });
      
      return true;
    } catch (err) {
      // Si falla la API, intentar cargar del caché como fallback
      if (!forceRefresh) {
        const cached = await getCachedSections(collectionId);
        if (cached) {
          sections.value = cached.sections.map((section: any) => ({
            id: section.id,
            collection_id: section.collection_id,
            name: section.name,
            description: section.description,
            order_index: section.order_index,
            color: section.color,
            enabled: section.enabled !== undefined ? section.enabled : true,
            created_at: section.created_at,
            updated_at: section.updated_at
          }));

          songsBySection.value = {};
          cached.sections.forEach((section: any) => {
            songsBySection.value[section.id] = [...(section.songs || [])];
          });

          unassignedSongs.value = [...(cached.unassignedSongs || [])];
          
          loading.value = false;
          return true;
        }
      }
      
      error.value = err instanceof Error ? err.message : 'Error al cargar secciones';
      console.error('Error fetching sections:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createSection(
    collectionId: string, 
    name: string, 
    description: string = '', 
    color: string = '#3b82f6'
  ) {
    try {
      const newSection = await SectionsService.createSection(collectionId, name, description, color);
      sections.value.push(newSection);
      songsBySection.value[newSection.id] = [];
      
      // Invalidar caché de secciones
      await invalidateSectionsCache(collectionId);
      
      return newSection;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear sección';
      console.error('Error creating section:', err);
      throw err;
    }
  }

  async function updateSection(
    sectionId: string, 
    updates: Partial<Pick<CollectionSection, 'name' | 'description' | 'color' | 'enabled'>>
  ) {
    try {
      const updatedSection = await SectionsService.updateSection(sectionId, updates);
      
      const index = sections.value.findIndex(s => s.id === sectionId);
      if (index !== -1) {
        sections.value[index] = { ...sections.value[index], ...updatedSection };
      }
      
      // Invalidar caché de secciones (necesitamos el collectionId)
      const section = sections.value.find(s => s.id === sectionId);
      if (section) {
        await invalidateSectionsCache(section.collection_id);
      }
      
      return updatedSection;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar sección';
      console.error('Error updating section:', err);
      throw err;
    }
  }

  async function deleteSection(sectionId: string, moveSongsToSectionId?: string) {
    try {
      await SectionsService.deleteSection(sectionId, moveSongsToSectionId);
      
      // Si se movieron canciones a otra sección, actualizar el estado local
      if (moveSongsToSectionId && songsBySection.value[sectionId]) {
        const songsToMove = songsBySection.value[sectionId];
        songsBySection.value[moveSongsToSectionId] = [
          ...(songsBySection.value[moveSongsToSectionId] || []),
          ...songsToMove
        ];
      }
      
      // Eliminar la sección del estado local
      sections.value = sections.value.filter(s => s.id !== sectionId);
      delete songsBySection.value[sectionId];
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar sección';
      console.error('Error deleting section:', err);
      throw err;
    }
  }

  async function enableSection(sectionId: string) {
    try {
      await SectionsService.enableSection(sectionId);
      
      const index = sections.value.findIndex(s => s.id === sectionId);
      if (index !== -1) {
        sections.value[index].enabled = true;
      }
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al habilitar sección';
      console.error('Error enabling section:', err);
      throw err;
    }
  }

  async function disableSection(sectionId: string) {
    try {
      await SectionsService.disableSection(sectionId);
      
      const index = sections.value.findIndex(s => s.id === sectionId);
      if (index !== -1) {
        sections.value[index].enabled = false;
      }
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al deshabilitar sección';
      console.error('Error disabling section:', err);
      throw err;
    }
  }

  async function toggleSection(sectionId: string, enabled: boolean) {
    try {
      await SectionsService.toggleSection(sectionId, enabled);
      
      const index = sections.value.findIndex(s => s.id === sectionId);
      if (index !== -1) {
        sections.value[index].enabled = enabled;
      }
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cambiar estado de sección';
      console.error('Error toggling section:', err);
      throw err;
    }
  }

  async function reorderSections(sectionOrders: { id: string; order_index: number }[]) {
    try {
      // Obtener collectionId antes de reordenar
      const firstSection = sections.value.find(s => s.id === sectionOrders[0]?.id);
      const collectionId = firstSection?.collection_id;
      
      await SectionsService.reorderSections(sectionOrders);
      
      // Actualizar el estado local
      sectionOrders.forEach(({ id, order_index }) => {
        const section = sections.value.find(s => s.id === id);
        if (section) {
          section.order_index = order_index;
        }
      });
      
      // Reordenar el array
      sections.value.sort((a, b) => a.order_index - b.order_index);
      
      // Invalidar caché de secciones
      if (collectionId) {
        await invalidateSectionsCache(collectionId);
      }
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al reordenar secciones';
      console.error('Error reordering sections:', err);
      throw err;
    }
  }

  async function moveSongToSection(collectionSongId: string, sectionId: string | null) {
    try {
      await SectionsService.moveSongToSection(collectionSongId, sectionId);
      
      // Actualizar el estado local
      let songToMove: CancionEnLista | null = null;
      let foundInSection: string | null = null;
      
      // Buscar la canción en todas las secciones
      for (const [currentSectionId, songs] of Object.entries(songsBySection.value)) {
        const songIndex = songs.findIndex(song => song.collection_song_id === collectionSongId);
        if (songIndex !== -1) {
          songToMove = songs.splice(songIndex, 1)[0];
          foundInSection = currentSectionId;
          break;
        }
      }
      
      // Si no se encontró en las secciones, buscar en canciones sin asignar
      if (!songToMove) {
        const songIndex = unassignedSongs.value.findIndex(song => song.collection_song_id === collectionSongId);
        if (songIndex !== -1) {
          songToMove = unassignedSongs.value.splice(songIndex, 1)[0];
          foundInSection = 'unassigned';
        }
      }
      
      // Solo mover si la canción se encontró y no es el mismo destino
      if (songToMove && foundInSection !== sectionId) {
        songToMove.section_id = sectionId || undefined;
        
        if (sectionId) {
          if (!songsBySection.value[sectionId]) {
            songsBySection.value[sectionId] = [];
          }
          songsBySection.value[sectionId].push(songToMove);
        } else {
          unassignedSongs.value.push(songToMove);
        }
      } else if (songToMove && foundInSection === sectionId) {
        // Si es el mismo destino, solo actualizar el section_id sin mover
        songToMove.section_id = sectionId || undefined;
        
        // Devolver la canción a su lugar original
        if (foundInSection && foundInSection !== 'unassigned') {
          songsBySection.value[foundInSection].push(songToMove);
        } else {
          unassignedSongs.value.push(songToMove);
        }
      }
      
      // Invalidar caché de secciones (obtener collectionId de la primera sección)
      const firstSection = sections.value[0];
      if (firstSection) {
        await invalidateSectionsCache(firstSection.collection_id);
      }
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al mover canción';
      console.error('Error moving song to section:', err);
      throw err;
    }
  }

  function clearSections() {
    sections.value = [];
    songsBySection.value = {};
    unassignedSongs.value = [];
    error.value = null;
  }

  // Función para actualizar una canción en las secciones
  function updateSongInSections(collectionSongId: string, updates: { list_tags?: string[]; notes?: string }) {
    // Buscar y actualizar en todas las secciones
    for (const [sectionId, songs] of Object.entries(songsBySection.value)) {
      const songIndex = songs.findIndex(song => song.collection_song_id === collectionSongId);
      if (songIndex !== -1) {
        // Crear un nuevo objeto para forzar la reactividad
        const updatedSong = {
          ...songs[songIndex],
          ...updates
        };
        songs[songIndex] = updatedSong;
        return;
      }
    }
    
    // Buscar en canciones sin asignar
    const unassignedIndex = unassignedSongs.value.findIndex(song => song.collection_song_id === collectionSongId);
    if (unassignedIndex !== -1) {
      // Crear un nuevo objeto para forzar la reactividad
      const updatedSong = {
        ...unassignedSongs.value[unassignedIndex],
        ...updates
      };
      unassignedSongs.value[unassignedIndex] = updatedSong;
    }
  }

  return {
    // State
    sections,
    songsBySection,
    unassignedSongs,
    loading,
    error,
    
    // Getters
    sectionsWithSongs,
    totalSongs,
    
    // Actions
    fetchSections,
    createSection,
    updateSection,
    deleteSection,
    enableSection,
    disableSection,
    toggleSection,
    reorderSections,
    moveSongToSection,
    clearSections,
    updateSongInSections
  };
});
