/**
 * Sistema de caché con IndexedDB para la aplicación
 * Usa idb para una API más simple y type-safe
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Cancion, Document } from '@/types/songTypes'

interface AppDB extends DBSchema {
  songs: {
    key: string // songId
    value: {
      songId: string
      data: Cancion
      cachedAt: number
      expiresAt: number
    }
    indexes: { 'by-cached-at': number }
  }
  documents: {
    key: [string, string] // [songId, doc_type]
    value: {
      songId: string
      docType: string
      body: string
      cachedAt: number
      expiresAt: number
    }
    indexes: { 'by-song-id': string; 'by-cached-at': number }
  }
  collections: {
    key: string // collectionId
    value: {
      collectionId: string
      data: any
      cachedAt: number
      expiresAt: number
    }
    indexes: { 'by-cached-at': number }
  }
  collection_songs: {
    key: string // collectionId
    value: {
      collectionId: string
      songs: any[]
      cachedAt: number
      expiresAt: number
    }
    indexes: { 'by-cached-at': number }
  }
  sections: {
    key: string // collectionId
    value: {
      collectionId: string
      data: {
        sections: any[]
        unassignedSongs: any[]
      }
      cachedAt: number
      expiresAt: number
    }
    indexes: { 'by-cached-at': number }
  }
}

// Configuración del caché
const CACHE_CONFIG = {
  DB_NAME: 'letras-app-cache',
  DB_VERSION: 3, // Incrementado para agregar store sections
  DEFAULT_TTL: 7 * 24 * 60 * 60 * 1000, // 7 días por defecto
  SONGS_TTL: 7 * 24 * 60 * 60 * 1000, // 7 días para canciones
  DOCUMENTS_TTL: 7 * 24 * 60 * 60 * 1000, // 7 días para documentos
  COLLECTIONS_TTL: 7 * 24 * 60 * 60 * 1000, // 7 días para colecciones
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null
let initPromise: Promise<void> | null = null

/**
 * Normaliza el songId extrayendo solo el número (en caso de que venga con slug: "180-adonai" -> "180")
 * Exportada para uso en stores
 */
export function normalizeSongId(songId: string): string {
  // Si el songId incluye un guión, extraer solo la parte numérica
  // Ejemplo: "180-adonai" -> "180"
  const match = songId.match(/^(\d+)/)
  return match ? match[1] : songId
}

/**
 * Maneja errores de IndexedDB, especialmente cuando la conexión se está cerrando
 */
function handleIndexedDBError(error: any, context: string): void {
  // Si el error es de conexión cerrada, resetear la conexión
  if (error?.name === 'InvalidStateError' && error?.message?.includes('closing')) {
    // Resetear la conexión para que se recree en la próxima llamada
    dbPromise = null
    initPromise = null
  }
  console.error(`Error in ${context}:`, error)
}

/**
 * Obtiene o crea la conexión a la base de datos
 */
function getDB(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(CACHE_CONFIG.DB_NAME, CACHE_CONFIG.DB_VERSION, {
      upgrade(db) {
        // Store para canciones
        if (!db.objectStoreNames.contains('songs')) {
          const songsStore = db.createObjectStore('songs', { keyPath: 'songId' })
          songsStore.createIndex('by-cached-at', 'cachedAt')
        }

        // Store para documentos (letras, análisis, acordes)
        if (!db.objectStoreNames.contains('documents')) {
          const documentsStore = db.createObjectStore('documents', {
            keyPath: ['songId', 'docType']
          })
          documentsStore.createIndex('by-song-id', 'songId')
          documentsStore.createIndex('by-cached-at', 'cachedAt')
        }

        // Store para colecciones
        if (!db.objectStoreNames.contains('collections')) {
          const collectionsStore = db.createObjectStore('collections', {
            keyPath: 'collectionId'
          })
          collectionsStore.createIndex('by-cached-at', 'cachedAt')
        }

        // Store para canciones de colecciones
        if (!db.objectStoreNames.contains('collection_songs')) {
          const collectionSongsStore = db.createObjectStore('collection_songs', {
            keyPath: 'collectionId'
          })
          collectionSongsStore.createIndex('by-cached-at', 'cachedAt')
        }

        // Store para secciones de colecciones
        if (!db.objectStoreNames.contains('sections')) {
          const sectionsStore = db.createObjectStore('sections', {
            keyPath: 'collectionId'
          })
          sectionsStore.createIndex('by-cached-at', 'cachedAt')
        }
      }
    })
  }
  return dbPromise
}

/**
 * Limpia elementos expirados del caché
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const db = await getDB()
    const now = Date.now()

    // Limpiar canciones expiradas
    const songsStore = db.transaction('songs', 'readwrite').objectStore('songs')
    const songsIndex = songsStore.index('by-cached-at')
    for await (const cursor of songsIndex.iterate()) {
      if (cursor.value.expiresAt < now) {
        await cursor.delete()
      }
    }

    // Limpiar documentos expirados
    const documentsStore = db.transaction('documents', 'readwrite').objectStore('documents')
    const documentsIndex = documentsStore.index('by-cached-at')
    for await (const cursor of documentsIndex.iterate()) {
      if (cursor.value.expiresAt < now) {
        await cursor.delete()
      }
    }

    // Limpiar colecciones expiradas
    const collectionsStore = db.transaction('collections', 'readwrite').objectStore('collections')
    const collectionsIndex = collectionsStore.index('by-cached-at')
    for await (const cursor of collectionsIndex.iterate()) {
      if (cursor.value.expiresAt < now) {
        await cursor.delete()
      }
    }

    // Limpiar canciones de colecciones expiradas
    const collectionSongsStore = db.transaction('collection_songs', 'readwrite').objectStore('collection_songs')
    const collectionSongsIndex = collectionSongsStore.index('by-cached-at')
    for await (const cursor of collectionSongsIndex.iterate()) {
      if (cursor.value.expiresAt < now) {
        await cursor.delete()
      }
    }

    // Limpiar secciones expiradas
    const sectionsStore = db.transaction('sections', 'readwrite').objectStore('sections')
    const sectionsIndex = sectionsStore.index('by-cached-at')
    for await (const cursor of sectionsIndex.iterate()) {
      if (cursor.value.expiresAt < now) {
        await cursor.delete()
      }
    }
  } catch (error) {
    console.error('Error clearing expired cache:', error)
  }
}

// ==================== CACHÉ DE CANCIONES ====================

/**
 * Obtiene una canción del caché
 */
export async function getCachedSong(songId: string): Promise<Cancion | null> {
  try {
    // Asegurar que el caché esté inicializado
    await initCache()
    
    const db = await getDB()
    const cached = await db.get('songs', songId)
    
    if (!cached) return null
    
    // Verificar si expiró
    if (cached.expiresAt < Date.now()) {
      await db.delete('songs', songId)
      return null
    }
    
    return cached.data
  } catch (error: any) {
    handleIndexedDBError(error, 'getCachedSong')
    return null
  }
}

/**
 * Obtiene todas las canciones del caché
 */
export async function getCachedSongs(): Promise<Cancion[]> {
  try {
    // Asegurar que el caché esté inicializado
    await initCache()
    
    const db = await getDB()
    const allCached = await db.getAll('songs')
    
    if (!allCached || allCached.length === 0) {
      return []
    }
    
    const now = Date.now()
    const validSongs: Cancion[] = []
    
    // Filtrar canciones válidas (no expiradas)
    for (const cached of allCached) {
      if (cached.expiresAt >= now) {
        validSongs.push(cached.data)
      } else {
        // Eliminar expiradas
        try {
          await db.delete('songs', cached.songId)
        } catch (e) {
          // Ignorar errores al eliminar (puede que ya no exista)
        }
      }
    }
    
    // Ordenar por fecha de creación (más recientes primero)
    return validSongs.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      return dateB - dateA
    })
  } catch (error: any) {
    handleIndexedDBError(error, 'getCachedSongs')
    return []
  }
}

/**
 * Guarda una canción en el caché
 */
export async function setCachedSong(song: Cancion, ttl?: number): Promise<void> {
  try {
    // Asegurar que el caché esté inicializado
    await initCache()
    
    const db = await getDB()
    const now = Date.now()
    const expiresAt = now + (ttl || CACHE_CONFIG.SONGS_TTL)
    
    await db.put('songs', {
      songId: song.id,
      data: song,
      cachedAt: now,
      expiresAt
    })
  } catch (error: any) {
    handleIndexedDBError(error, 'setCachedSong')
  }
}

/**
 * Guarda múltiples canciones en el caché
 */
export async function setCachedSongs(songs: Cancion[], ttl?: number): Promise<void> {
  try {
    // Asegurar que el caché esté inicializado
    await initCache()
    
    const db = await getDB()
    const now = Date.now()
    const expiresAt = now + (ttl || CACHE_CONFIG.SONGS_TTL)
    const tx = db.transaction('songs', 'readwrite')
    
    for (const song of songs) {
      await tx.store.put({
        songId: song.id,
        data: song,
        cachedAt: now,
        expiresAt
      })
    }
    
    await tx.done
  } catch (error: any) {
    handleIndexedDBError(error, 'setCachedSongs')
  }
}

/**
 * Invalida el caché de una canción
 */
export async function invalidateSongCache(songId: string): Promise<void> {
  try {
    const db = await getDB()
    await db.delete('songs', songId)
  } catch (error) {
    console.error('Error invalidating song cache:', error)
  }
}

// ==================== CACHÉ DE DOCUMENTOS ====================

/**
 * Resultado de búsqueda en caché
 */
export type CachedDocumentResult = {
  found: boolean; // true si está en caché (exista o no el documento)
  value: string | null; // el contenido del documento, o null si no existe
}

/**
 * Obtiene un documento del caché (letra, análisis, acordes)
 * Retorna un objeto que indica si está en caché y el valor
 */
export async function getCachedDocument(
  songId: string,
  docType: 'lyrics' | 'analysis' | 'chords' | 'letra' | 'analisis' | 'acordes'
): Promise<CachedDocumentResult> {
  try {
    // Asegurar que el caché esté inicializado
    await initCache()
    
    // Normalizar el songId (extraer solo el número si viene con slug)
    const normalizedSongId = normalizeSongId(songId)
    
    // Normalizar tipos de documentos
    const normalizedType = normalizeDocType(docType)
    
    const db = await getDB()
    const cached = await db.get('documents', [normalizedSongId, normalizedType])
    
    if (!cached) {
      return { found: false, value: null }
    }
    
    // Verificar si expiró
    if (cached.expiresAt < Date.now()) {
      try {
        await db.delete('documents', [normalizedSongId, normalizedType])
      } catch (e) {
        // Ignorar errores al eliminar
      }
      return { found: false, value: null }
    }
    
    // Si el body está vacío, significa que el documento no existe (se guardó null)
    const bodyLength = cached.body?.length || 0
    
    // Retornar que está en caché (found: true) y el valor (o null si está vacío)
    return { 
      found: true, 
      value: bodyLength > 0 ? cached.body : null 
    }
  } catch (error: any) {
    handleIndexedDBError(error, 'getCachedDocument')
    return { found: false, value: null }
  }
}

/**
 * Guarda un documento en el caché
 */
export async function setCachedDocument(
  songId: string,
  docType: 'lyrics' | 'analysis' | 'chords' | 'letra' | 'analisis' | 'acordes',
  body: string | null,
  ttl?: number
): Promise<void> {
  try {
    // Asegurar que el caché esté inicializado
    await initCache()
    
    // Normalizar el songId (extraer solo el número si viene con slug)
    const normalizedSongId = normalizeSongId(songId)
    
    const normalizedType = normalizeDocType(docType)
    const db = await getDB()
    const now = Date.now()
    const expiresAt = now + (ttl || CACHE_CONFIG.DOCUMENTS_TTL)
    
    await db.put('documents', {
      songId: normalizedSongId,
      docType: normalizedType,
      body: body || '', // Guardar string vacío si es null
      cachedAt: now,
      expiresAt
    })
  } catch (error: any) {
    handleIndexedDBError(error, 'setCachedDocument')
  }
}

/**
 * Invalida el caché de un documento específico
 */
export async function invalidateDocumentCache(
  songId: string,
  docType?: 'lyrics' | 'analysis' | 'chords' | 'letra' | 'analisis' | 'acordes'
): Promise<void> {
  try {
    // Normalizar el songId (extraer solo el número si viene con slug)
    const normalizedSongId = normalizeSongId(songId)
    
    const db = await getDB()
    
    if (docType) {
      // Invalidar un tipo específico
      const normalizedType = normalizeDocType(docType)
      await db.delete('documents', [normalizedSongId, normalizedType])
    } else {
      // Invalidar todos los documentos de la canción
      const tx = db.transaction('documents', 'readwrite')
      const index = tx.store.index('by-song-id')
      
      for await (const cursor of index.iterate(normalizedSongId)) {
        await cursor.delete()
      }
      
      await tx.done
    }
  } catch (error: any) {
    handleIndexedDBError(error, 'invalidateDocumentCache')
  }
}

/**
 * Normaliza el tipo de documento a un formato estándar
 */
function normalizeDocType(
  docType: 'lyrics' | 'analysis' | 'chords' | 'letra' | 'analisis' | 'acordes'
): 'lyrics' | 'analysis' | 'chords' {
  const mapping: Record<string, 'lyrics' | 'analysis' | 'chords'> = {
    lyrics: 'lyrics',
    letra: 'lyrics',
    lyric: 'lyrics',
    analysis: 'analysis',
    analisis: 'analysis',
    chords: 'chords',
    acordes: 'chords'
  }
  
  return mapping[docType.toLowerCase()] || docType as 'lyrics' | 'analysis' | 'chords'
}

// ==================== CACHÉ DE COLECCIONES ====================

/**
 * Obtiene todas las colecciones del caché
 */
export async function getCachedCollections(): Promise<any[]> {
  try {
    // Asegurar que el caché esté inicializado
    await initCache()
    
    const db = await getDB()
    const allCached = await db.getAll('collections')
    
    if (!allCached || allCached.length === 0) {
      return []
    }
    
    const now = Date.now()
    const validCollections: any[] = []
    
    // Filtrar colecciones válidas (no expiradas)
    for (const cached of allCached) {
      if (cached.expiresAt >= now) {
        validCollections.push(cached.data)
      } else {
        // Eliminar expiradas
        await db.delete('collections', cached.collectionId)
      }
    }
    
    // Ordenar por fecha de creación (más recientes primero)
    return validCollections.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      return dateB - dateA
    })
  } catch (error: any) {
    handleIndexedDBError(error, 'getCachedCollections')
    return []
  }
}

/**
 * Obtiene una colección del caché
 */
export async function getCachedCollection(collectionId: string): Promise<any | null> {
  try {
    // Asegurar que el caché esté inicializado
    await initCache()
    
    const db = await getDB()
    const cached = await db.get('collections', collectionId)
    
    if (!cached) return null
    
    // Verificar si expiró
    if (cached.expiresAt < Date.now()) {
      await db.delete('collections', collectionId)
      return null
    }
    
    return cached.data
  } catch (error: any) {
    handleIndexedDBError(error, 'getCachedCollection')
    return null
  }
}

/**
 * Guarda múltiples colecciones en el caché
 */
export async function setCachedCollections(collections: any[], ttl?: number): Promise<void> {
  try {
    // Asegurar que el caché esté inicializado
    await initCache()
    
    const db = await getDB()
    const now = Date.now()
    const expiresAt = now + (ttl || CACHE_CONFIG.COLLECTIONS_TTL)
    const tx = db.transaction('collections', 'readwrite')
    
    for (const collection of collections) {
      await tx.store.put({
        collectionId: collection.id,
        data: collection,
        cachedAt: now,
        expiresAt
      })
    }
    
    await tx.done
  } catch (error: any) {
    handleIndexedDBError(error, 'setCachedCollections')
  }
}

/**
 * Guarda una colección en el caché
 */
export async function setCachedCollection(collectionId: string, data: any, ttl?: number): Promise<void> {
  try {
    // Asegurar que el caché esté inicializado
    await initCache()
    
    const db = await getDB()
    const now = Date.now()
    const expiresAt = now + (ttl || CACHE_CONFIG.COLLECTIONS_TTL)
    
    await db.put('collections', {
      collectionId,
      data,
      cachedAt: now,
      expiresAt
    })
  } catch (error: any) {
    handleIndexedDBError(error, 'setCachedCollection')
  }
}

/**
 * Invalida el caché de una colección
 */
export async function invalidateCollectionCache(collectionId: string): Promise<void> {
  try {
    const db = await getDB()
    await db.delete('collections', collectionId)
    // También invalidar las canciones de la colección
    await db.delete('collection_songs', collectionId)
  } catch (error) {
    console.error('Error invalidating collection cache:', error)
  }
}

// ==================== CACHÉ DE CANCIONES DE COLECCIONES ====================

/**
 * Obtiene las canciones de una colección del caché
 */
export async function getCachedCollectionSongs(collectionId: string): Promise<any[] | null> {
  try {
    // Asegurar que el caché esté inicializado
    await initCache()
    
    const db = await getDB()
    const cached = await db.get('collection_songs', collectionId)
    
    if (!cached) return null
    
    // Verificar si expiró
    if (cached.expiresAt < Date.now()) {
      await db.delete('collection_songs', collectionId)
      return null
    }
    
    return cached.songs
  } catch (error: any) {
    handleIndexedDBError(error, 'getCachedCollectionSongs')
    return null
  }
}

/**
 * Guarda las canciones de una colección en el caché
 */
export async function setCachedCollectionSongs(collectionId: string, songs: any[], ttl?: number): Promise<void> {
  try {
    // Asegurar que el caché esté inicializado
    await initCache()
    
    const db = await getDB()
    const now = Date.now()
    const expiresAt = now + (ttl || CACHE_CONFIG.COLLECTIONS_TTL)
    
    await db.put('collection_songs', {
      collectionId,
      songs,
      cachedAt: now,
      expiresAt
    })
  } catch (error: any) {
    handleIndexedDBError(error, 'setCachedCollectionSongs')
  }
}

// ==================== CACHÉ DE SECCIONES ====================

/**
 * Obtiene las secciones de una colección del caché
 */
export async function getCachedSections(collectionId: string): Promise<{ sections: any[]; unassignedSongs: any[] } | null> {
  try {
    // Asegurar que el caché esté inicializado
    await initCache()
    
    const db = await getDB()
    const cached = await db.get('sections', collectionId)
    
    if (!cached) return null
    
    // Verificar si expiró
    if (cached.expiresAt < Date.now()) {
      await db.delete('sections', collectionId)
      return null
    }
    
    return cached.data
  } catch (error: any) {
    handleIndexedDBError(error, 'getCachedSections')
    return null
  }
}

/**
 * Guarda las secciones de una colección en el caché
 */
export async function setCachedSections(
  collectionId: string,
  data: { sections: any[]; unassignedSongs: any[] },
  ttl?: number
): Promise<void> {
  try {
    // Asegurar que el caché esté inicializado
    await initCache()
    
    const db = await getDB()
    const now = Date.now()
    const expiresAt = now + (ttl || CACHE_CONFIG.COLLECTIONS_TTL)
    
    await db.put('sections', {
      collectionId,
      data,
      cachedAt: now,
      expiresAt
    })
  } catch (error: any) {
    handleIndexedDBError(error, 'setCachedSections')
  }
}

/**
 * Invalida el caché de secciones de una colección
 */
export async function invalidateSectionsCache(collectionId: string): Promise<void> {
  try {
    const db = await getDB()
    await db.delete('sections', collectionId)
  } catch (error) {
    console.error('Error invalidating sections cache:', error)
  }
}

// ==================== UTILIDADES ====================

/**
 * Limpia todo el caché
 */
export async function clearAllCache(): Promise<void> {
  try {
    const db = await getDB()
    await db.clear('songs')
    await db.clear('documents')
    await db.clear('collections')
    await db.clear('collection_songs')
    await db.clear('sections')
  } catch (error) {
    console.error('Error clearing all cache:', error)
  }
}

/**
 * Obtiene estadísticas del caché
 */
export async function getCacheStats(): Promise<{
  songs: number
  documents: number
  collections: number
  collectionSongs: number
  sections: number
  totalSize: number
}> {
  try {
    const db = await getDB()
    
    const songsCount = await db.count('songs')
    const documentsCount = await db.count('documents')
    const collectionsCount = await db.count('collections')
    const collectionSongsCount = await db.count('collection_songs')
    const sectionsCount = await db.count('sections')
    
    // Nota: calcular el tamaño exacto requiere más trabajo, esto es una aproximación
    return {
      songs: songsCount,
      documents: documentsCount,
      collections: collectionsCount,
      collectionSongs: collectionSongsCount,
      sections: sectionsCount,
      totalSize: 0 // TODO: calcular tamaño real si es necesario
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return { songs: 0, documents: 0, collections: 0, collectionSongs: 0, sections: 0, totalSize: 0 }
  }
}

/**
 * Inicializa el sistema de caché
 * Es idempotente: solo se ejecuta una vez, incluso si se llama múltiples veces
 */
export async function initCache(): Promise<void> {
  // Si ya se está inicializando o ya se inicializó, esperar a que termine
  if (initPromise) {
    return initPromise
  }
  
  initPromise = (async () => {
    try {
      // Asegurar que la DB esté inicializada
      await getDB()
      
      // Limpiar elementos expirados al iniciar
      await clearExpiredCache()
    } catch (error) {
      console.error('Error initializing cache:', error)
      // Resetear la promesa para permitir reintentos
      initPromise = null
      throw error
    }
  })()
  
  return initPromise
}

