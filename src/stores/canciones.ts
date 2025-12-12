import { Cancion, Document } from "@/types/songTypes";
import { SongsService, DocumentsService } from "@/api/songs";
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { normalizeTags } from "@/utils/tags";
import {
  getCachedDocument,
  setCachedDocument,
  invalidateDocumentCache,
  getCachedSong,
  getCachedSongs,
  setCachedSong,
  setCachedSongs,
  invalidateSongCache,
  normalizeSongId
} from "@/utils/cache";

export const useCancionesStore = defineStore("canciones", () => {
  const canciones = ref<Cancion[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Cache de promesas en curso para evitar llamadas duplicadas
  const pendingDocumentRequests = new Map<string, Promise<string | null>>();

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

  // Cargar todas las canciones (con caché)
  async function loadCanciones(forceRefresh = false) {
    loading.value = true;
    error.value = null;
    
    // Si no se fuerza actualización, intentar cargar del caché primero
    if (!forceRefresh) {
      const cachedSongs = await getCachedSongs();
      
      if (cachedSongs.length > 0) {
        canciones.value = cachedSongs;
        loading.value = false;
        // NO hacer llamada API - solo usar caché cuando está disponible
        return;
      }
    }
    
    // Si no hay caché o se fuerza actualización, cargar desde API
    try {
      const data = await SongsService.getSongs();
      canciones.value = data;
      
      // Guardar en caché
      await setCachedSongs(data);
    } catch (err) {
      // Si falla la API, intentar cargar del caché como fallback
      const cachedSongs = await getCachedSongs();
      if (cachedSongs.length > 0) {
        canciones.value = cachedSongs;
        error.value = null; // Limpiar error si hay datos en caché
      } else {
        // Solo mostrar error si no hay datos en caché ni en el store
        if (canciones.value.length === 0) {
          error.value = err instanceof Error ? err.message : 'Error al cargar canciones';
        } else {
          // Si ya hay canciones en el store, no mostrar error (ya tiene datos)
          error.value = null;
        }
        console.error('Error loading canciones:', err);
      }
    } finally {
      loading.value = false;
    }
  }

  // Obtener canción por ID (con caché)
  async function getCancionById(id: string, forceRefresh = false): Promise<Cancion | null> {
    try {
      // Primero buscar en el store local
      const localSong = canciones.value.find((c) => c.id === id);
      if (localSong && !forceRefresh) {
        return localSong;
      }

      // Si no está en local o se fuerza actualización, verificar caché
      if (!forceRefresh) {
        const cached = await getCachedSong(id);
        if (cached) {
          // Agregar a la lista local si no está
          const exists = canciones.value.find(c => c.id === cached.id);
          if (!exists) {
            canciones.value.unshift(cached);
          }
          return cached;
        }
      }

      // Si no está en caché, buscar en Supabase
      const song = await SongsService.getSongById(id);
      if (song) {
        // Guardar en caché
        await setCachedSong(song);
        
        // Agregar a la lista local si no está
        const exists = canciones.value.find(c => c.id === song.id);
        if (!exists) {
          canciones.value.unshift(song);
        }
      }
      return song;
    } catch (err) {
      console.error('Error getting cancion by id:', err);
      // En caso de error, intentar devolver del caché como fallback
      if (!forceRefresh) {
        const cached = await getCachedSong(id);
        if (cached) {
          return cached;
        }
      }
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
        // Actualizar en el store local
        const index = canciones.value.findIndex(c => c.id === id);
        if (index !== -1) {
          canciones.value[index] = updatedSong;
        }
        
        // Actualizar caché
        await setCachedSong(updatedSong);
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
        const normalizedId = normalizeSongId(id);
        const documents = await DocumentsService.getDocumentsBySongId(normalizedId);
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
        
        // Limpiar caché
        await invalidateSongCache(id);
        await invalidateDocumentCache(id); // Eliminar todos los documentos de la canción
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

  // Obtener letra de una canción (con caché)
  async function getSongLyrics(songId: string, forceRefresh = false): Promise<string | null> {
    // Normalizar songId (extraer solo el número si viene con slug: "180-adonai" -> "180")
    const normalizedSongId = normalizeSongId(songId);
    const cacheKey = `lyrics-${normalizedSongId}`;
    
    // Si ya hay una petición en curso para este documento, esperar a que termine
    if (!forceRefresh && pendingDocumentRequests.has(cacheKey)) {
      return pendingDocumentRequests.get(cacheKey)!;
    }
    
    // Crear la promesa de la petición
    const requestPromise = (async () => {
      try {
        // Primero verificar el caché (a menos que se fuerce la actualización)
        if (!forceRefresh) {
          const cached = await getCachedDocument(normalizedSongId, 'lyrics');
          if (cached.found) {
            // Está en caché, devolver el valor (puede ser null si el documento no existe)
            return cached.value;
          }
        }

        // Si no está en caché o se fuerza actualización, cargar de la API
        const documents = await DocumentsService.getDocumentsBySongId(normalizedSongId);
      
      // Buscar un documento de tipo 'lyrics' o 'letra'
      const lyricsDoc = documents.find(doc => 
        doc.doc_type === 'lyrics' || 
        doc.doc_type === 'letra' || 
        doc.doc_type === 'lyric'
      );
      
      const lyrics = lyricsDoc ? lyricsDoc.body : null;
      
      // Guardar en caché (incluso si es null, para evitar llamadas repetidas)
      await setCachedDocument(normalizedSongId, 'lyrics', lyrics);
      
        return lyrics;
      } catch (err) {
        console.error('Error getting song lyrics:', err);
        // En caso de error, intentar devolver del caché como fallback
        if (!forceRefresh) {
          const cached = await getCachedDocument(normalizedSongId, 'lyrics');
          if (cached.found) {
            return cached.value;
          }
        }
        return null;
      } finally {
        // Eliminar la petición pendiente cuando termine
        pendingDocumentRequests.delete(cacheKey);
      }
    })();
    
    // Guardar la promesa en el mapa de peticiones pendientes
    if (!forceRefresh) {
      pendingDocumentRequests.set(cacheKey, requestPromise);
    }
    
    return requestPromise;
  }

  // Crear o actualizar letra de una canción
  async function createOrUpdateSongLyrics(songId: string, lyrics: string, description?: string) {
    try {
      // Normalizar songId (extraer solo el número si viene con slug: "180-adonai" -> "180")
      const normalizedSongId = normalizeSongId(songId);
      
      // Primero buscar si ya existe un documento de letra
      const documents = await DocumentsService.getDocumentsBySongId(normalizedSongId);
      const existingLyrics = documents.find(doc => 
        doc.doc_type === 'lyrics' || 
        doc.doc_type === 'letra' || 
        doc.doc_type === 'lyric'
      );

      let result;
      if (existingLyrics) {
        // Actualizar documento existente
        result = await DocumentsService.updateDocument(existingLyrics.id, {
          body: lyrics,
          description: description || existingLyrics.description || 'Letra de la canción'
        });
      } else {
        // Crear nuevo documento
        const document = {
          song_id: normalizedSongId,
          body: lyrics,
          doc_type: 'lyrics',
          description: description || 'Letra de la canción'
        };
        
        result = await DocumentsService.createDocument(document);
      }

      // Actualizar caché con el nuevo contenido
      if (result) {
        await setCachedDocument(normalizedSongId, 'lyrics', lyrics);
      }

      return result;
    } catch (err) {
      console.error('Error creating/updating song lyrics:', err);
      throw err;
    }
  }

  // Mantener función antigua por compatibilidad (deprecated)
  async function createSongLyrics(songId: string, lyrics: string, description?: string) {
    return createOrUpdateSongLyrics(songId, lyrics, description);
  }

  // Obtener análisis de una canción (con caché)
  async function getSongAnalysis(songId: string, forceRefresh = false): Promise<string | null> {
    // Normalizar songId (extraer solo el número si viene con slug: "180-adonai" -> "180")
    const normalizedSongId = normalizeSongId(songId);
    const cacheKey = `analysis-${normalizedSongId}`;
    
    // Si ya hay una petición en curso para este documento, esperar a que termine
    if (!forceRefresh && pendingDocumentRequests.has(cacheKey)) {
      return pendingDocumentRequests.get(cacheKey)!;
    }
    
    // Crear la promesa de la petición
    const requestPromise = (async () => {
      try {
        // Primero verificar el caché (a menos que se fuerce la actualización)
        if (!forceRefresh) {
          const cached = await getCachedDocument(normalizedSongId, 'analysis');
          if (cached.found) {
            // Está en caché, devolver el valor (puede ser null si el documento no existe)
            return cached.value;
          }
        }

        // Si no está en caché o se fuerza actualización, cargar de la API
        const documents = await DocumentsService.getDocumentsBySongId(normalizedSongId);
      
        // Buscar un documento de tipo 'analysis' o 'analisis'
        const analysisDoc = documents.find(doc => 
          doc.doc_type === 'analysis' || 
          doc.doc_type === 'analisis'
        );
      
        const analysis = analysisDoc ? analysisDoc.body : null;
      
        // Guardar en caché (incluso si es null, para evitar llamadas repetidas)
        await setCachedDocument(normalizedSongId, 'analysis', analysis);
      
        return analysis;
      } catch (err) {
        console.error('Error getting song analysis:', err);
        // En caso de error, intentar devolver del caché como fallback
        if (!forceRefresh) {
          const cached = await getCachedDocument(normalizedSongId, 'analysis');
          if (cached.found) {
            return cached.value;
          }
        }
        return null;
      } finally {
        // Eliminar la petición pendiente cuando termine
        pendingDocumentRequests.delete(cacheKey);
      }
    })();
    
    // Guardar la promesa en el mapa de peticiones pendientes
    if (!forceRefresh) {
      pendingDocumentRequests.set(cacheKey, requestPromise);
    }
    
    return requestPromise;
  }

  // Crear o actualizar análisis de una canción
  async function createOrUpdateSongAnalysis(songId: string, analysis: string, description?: string) {
    try {
      // Normalizar songId (extraer solo el número si viene con slug: "180-adonai" -> "180")
      const normalizedSongId = normalizeSongId(songId);
      
      // Primero buscar si ya existe un documento de análisis
      const documents = await DocumentsService.getDocumentsBySongId(normalizedSongId);
      const existingAnalysis = documents.find(doc => 
        doc.doc_type === 'analysis' || 
        doc.doc_type === 'analisis'
      );

      let result;
      if (existingAnalysis) {
        // Actualizar documento existente
        result = await DocumentsService.updateDocument(existingAnalysis.id, {
          body: analysis,
          description: description || existingAnalysis.description || 'Análisis de la canción'
        });
      } else {
        // Crear nuevo documento
        const document = {
          song_id: normalizedSongId,
          body: analysis,
          doc_type: 'analysis',
          description: description || 'Análisis de la canción'
        };
        
        result = await DocumentsService.createDocument(document);
      }

      // Actualizar caché con el nuevo contenido
      if (result) {
        await setCachedDocument(normalizedSongId, 'analysis', analysis);
      }

      return result;
    } catch (err) {
      console.error('Error creating/updating song analysis:', err);
      throw err;
    }
  }

  // Obtener acordes de una canción (con caché)
  async function getSongChords(songId: string, forceRefresh = false): Promise<string | null> {
    // Normalizar songId (extraer solo el número si viene con slug: "180-adonai" -> "180")
    const normalizedSongId = normalizeSongId(songId);
    const cacheKey = `chords-${normalizedSongId}`;
    
    // Si ya hay una petición en curso para este documento, esperar a que termine
    if (!forceRefresh && pendingDocumentRequests.has(cacheKey)) {
      return pendingDocumentRequests.get(cacheKey)!;
    }
    
    // Crear la promesa de la petición
    const requestPromise = (async () => {
      try {
        // Primero verificar el caché (a menos que se fuerce la actualización)
        if (!forceRefresh) {
          const cached = await getCachedDocument(normalizedSongId, 'chords');
          if (cached.found) {
            // Está en caché, devolver el valor (puede ser null si el documento no existe)
            return cached.value;
          }
        }

        // Si no está en caché o se fuerza actualización, cargar de la API
        const documents = await DocumentsService.getDocumentsBySongId(normalizedSongId);
      
        // Buscar un documento de tipo 'chords' o 'acordes'
        const chordsDoc = documents.find(doc => 
          doc.doc_type === 'chords' || 
          doc.doc_type === 'acordes'
        );
      
        const chords = chordsDoc ? chordsDoc.body : null;
      
        // Guardar en caché (incluso si es null, para evitar llamadas repetidas)
        await setCachedDocument(normalizedSongId, 'chords', chords);
      
        return chords;
      } catch (err) {
        console.error('Error getting song chords:', err);
        // En caso de error, intentar devolver del caché como fallback
        if (!forceRefresh) {
          const cached = await getCachedDocument(normalizedSongId, 'chords');
          if (cached.found) {
            return cached.value;
          }
        }
        return null;
      } finally {
        // Eliminar la petición pendiente cuando termine
        pendingDocumentRequests.delete(cacheKey);
      }
    })();
    
    // Guardar la promesa en el mapa de peticiones pendientes
    if (!forceRefresh) {
      pendingDocumentRequests.set(cacheKey, requestPromise);
    }
    
    return requestPromise;
  }

  // Crear o actualizar acordes de una canción
  async function createOrUpdateSongChords(songId: string, chords: string, description?: string) {
    try {
      // Normalizar songId (extraer solo el número si viene con slug: "180-adonai" -> "180")
      const normalizedSongId = normalizeSongId(songId);
      
      // Primero buscar si ya existe un documento de acordes
      const documents = await DocumentsService.getDocumentsBySongId(normalizedSongId);
      const existingChords = documents.find(doc => 
        doc.doc_type === 'chords' || 
        doc.doc_type === 'acordes'
      );

      let result;
      if (existingChords) {
        // Actualizar documento existente
        result = await DocumentsService.updateDocument(existingChords.id, {
          body: chords,
          description: description || existingChords.description || 'Acordes de la canción'
        });
      } else {
        // Crear nuevo documento
        const document = {
          song_id: normalizedSongId,
          body: chords,
          doc_type: 'chords',
          description: description || 'Acordes de la canción'
        };
        
        result = await DocumentsService.createDocument(document);
      }

      // Actualizar caché con el nuevo contenido
      if (result) {
        await setCachedDocument(normalizedSongId, 'chords', chords);
      }

      return result;
    } catch (err) {
      console.error('Error creating/updating song chords:', err);
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
    createOrUpdateSongLyrics,
    createSongLyrics, // Deprecated: usar createOrUpdateSongLyrics
    getSongAnalysis,
    createOrUpdateSongAnalysis,
    getSongChords,
    createOrUpdateSongChords
  };
});
