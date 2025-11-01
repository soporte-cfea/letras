import { Cancion, Document } from "@/types/songTypes";
import { SongsService, DocumentsService } from "@/api/songs";
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { normalizeTags } from "@/utils/tags";

export const useCancionesStore = defineStore("canciones", () => {
  const canciones = ref<Cancion[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed para obtener artistas únicos
  const artistas = computed(() => {
    const uniqueArtists = new Set(canciones.value.map((c) => c.artist).filter(Boolean));
    return Array.from(uniqueArtists).sort();
  });


  // Computed para obtener tags únicos
  const tags = computed(() => {
    const allTags = new Set<string>();
    canciones.value.forEach((cancion) => {
      const normalizedTags = normalizeTags(cancion.tags);
      normalizedTags.forEach((tag: string) => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  });

  // Cargar todas las canciones
  async function loadCanciones() {
    loading.value = true;
    error.value = null;
    try {
      const data = await SongsService.getSongs();
      canciones.value = data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar canciones';
      console.error('Error loading canciones:', err);
    } finally {
      loading.value = false;
    }
  }

  // Obtener canción por ID
  async function getCancionById(id: string): Promise<Cancion | null> {
    try {
      // Primero buscar en el store local
      const localSong = canciones.value.find((c) => c.id === id);
      if (localSong) {
        return localSong;
      }

      // Si no está en local, buscar en Supabase
      const song = await SongsService.getSongById(id);
      if (song) {
        // Agregar a la lista local si no está
        const exists = canciones.value.find(c => c.id === song.id);
        if (!exists) {
          canciones.value.unshift(song);
        }
      }
      return song;
    } catch (err) {
      console.error('Error getting cancion by id:', err);
      return null;
    }
  }

  // Agregar nueva canción
  async function addCancion(song: Omit<Cancion, 'id' | 'created_at' | 'update_at'>) {
    loading.value = true;
    error.value = null;
    try {
      const newSong = await SongsService.createSong(song);
      if (newSong) {
        canciones.value.unshift(newSong);
      }
      return newSong;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al agregar canción';
      console.error('Error adding cancion:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Actualizar canción
  async function updateCancion(id: string, updates: Partial<Omit<Cancion, 'id' | 'created_at'>>) {
    loading.value = true;
    error.value = null;
    try {
      const updatedSong = await SongsService.updateSong(id, updates);
      if (updatedSong) {
        const index = canciones.value.findIndex(c => c.id === id);
        if (index !== -1) {
          canciones.value[index] = updatedSong;
        }
      }
      return updatedSong;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar canción';
      console.error('Error updating cancion:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Eliminar canción
  async function deleteCancion(id: string) {
    loading.value = true;
    error.value = null;
    try {
      // Primero eliminar todos los documentos asociados a la canción
      try {
        const documents = await DocumentsService.getDocumentsBySongId(id);
        for (const doc of documents) {
          await DocumentsService.deleteDocument(doc.id);
        }
      } catch (docErr) {
        console.warn('Error deleting documents, continuing with song deletion:', docErr);
        // Continuar con la eliminación de la canción aunque falle la eliminación de documentos
      }

      // Luego eliminar la canción
      const success = await SongsService.deleteSong(id);
      if (success) {
        canciones.value = canciones.value.filter(c => c.id !== id);
      }
      return success;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar canción';
      console.error('Error deleting cancion:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Buscar canciones
  async function searchCanciones(query: string) {
    loading.value = true;
    error.value = null;
    try {
      const results = await SongsService.searchSongs(query);
      return results;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al buscar canciones';
      console.error('Error searching canciones:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Función para normalizar texto (remover acentos y caracteres especiales)
  function normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^\w\s]/g, '') // Remover caracteres especiales excepto espacios
      .replace(/\s+/g, ' '); // Normalizar espacios múltiples
  }

  // Filtrar canciones localmente
  function filterCanciones(
    searchQuery: string, 
    selectedArtists: string[], 
    selectedTags: string[],
    artistFilterMode: 'and' | 'or' = 'or',
    tagFilterMode: 'and' | 'or' = 'or'
  ) {
    const normalizedSearchQuery = normalizeText(searchQuery);
    
    const filtered = canciones.value.filter((cancion) => {
      const normalizedTags = normalizeTags(cancion.tags);
      
      const matchesSearch =
        searchQuery === "" ||
        (cancion.title && normalizeText(cancion.title).includes(normalizedSearchQuery)) ||
        (cancion.artist && normalizeText(cancion.artist).includes(normalizedSearchQuery)) ||
        (cancion.subtitle && normalizeText(cancion.subtitle).includes(normalizedSearchQuery)) ||
        normalizedTags.some((tag) =>
          normalizeText(tag).includes(normalizedSearchQuery)
        );

      // Filtrar por artistas (múltiples selecciones con modo Y/O)
      let matchesArtist = true;
      if (selectedArtists.length > 0) {
        if (artistFilterMode === 'and') {
          // Todas las selecciones deben cumplirse (imposible con un solo artista por canción, pero por consistencia)
          matchesArtist = selectedArtists.every(artist => cancion.artist === artist);
        } else {
          // Al menos una debe cumplirse
          matchesArtist = selectedArtists.includes(cancion.artist || '');
        }
      }

      // Filtrar por tags (múltiples selecciones con modo Y/O)
      let matchesTag = true;
      if (selectedTags.length > 0) {
        if (tagFilterMode === 'and') {
          // Todas las etiquetas seleccionadas deben estar presentes
          matchesTag = selectedTags.every(tag => normalizedTags.includes(tag));
        } else {
          // Al menos una etiqueta debe estar presente
          matchesTag = selectedTags.some(tag => normalizedTags.includes(tag));
        }
      }

      return matchesSearch && matchesArtist && matchesTag;
    });

    // Ordenar alfabéticamente por título
    return filtered.sort((a, b) => {
      const titleA = normalizeText(a.title || '');
      const titleB = normalizeText(b.title || '');
      return titleA.localeCompare(titleB, 'es', { sensitivity: 'base' });
    });
  }

  // Obtener letra de una canción
  async function getSongLyrics(songId: string): Promise<string | null> {
    try {
      const documents = await DocumentsService.getDocumentsBySongId(songId);
      
      // Buscar un documento de tipo 'lyrics' o 'letra'
      const lyricsDoc = documents.find(doc => 
        doc.doc_type === 'lyrics' || 
        doc.doc_type === 'letra' || 
        doc.doc_type === 'lyric'
      );
      
      return lyricsDoc ? lyricsDoc.body : null;
    } catch (err) {
      console.error('Error getting song lyrics:', err);
      return null;
    }
  }

  // Crear letra para una canción
  async function createSongLyrics(songId: string, lyrics: string, description?: string) {
    try {
      const document = {
        song_id: songId,
        body: lyrics,
        doc_type: 'lyrics',
        description: description || 'Letra de la canción'
      };
      
      return await DocumentsService.createDocument(document);
    } catch (err) {
      console.error('Error creating song lyrics:', err);
      throw err;
    }
  }

  return { 
    canciones, 
    loading, 
    error, 
    artistas, 
    tags,
    loadCanciones, 
    getCancionById, 
    addCancion, 
    updateCancion, 
    deleteCancion, 
    searchCanciones,
    filterCanciones,
    getSongLyrics,
    createSongLyrics
  };
});
