import supabase from '@/supabase/supabase'
import type { PersonalTag, PersonalTagInput } from '@/types/personalTags'
import { 
  getCachedPersonalTags, 
  setCachedPersonalTags, 
  invalidatePersonalTagsCache,
  invalidateAllPersonalTagsCache,
  getCachedUniquePersonalTags,
  setCachedUniquePersonalTags,
  invalidateUniquePersonalTagsCache
} from '@/utils/cache'

/**
 * Servicio para manejar etiquetas personales de canciones
 */
export class PersonalTagsService {
  /**
   * Obtener todas las etiquetas personales de un usuario para una canción
   */
  static async getPersonalTagsBySong(songId: string, userId: string, forceRefresh = false): Promise<PersonalTag[]> {
    try {
      // Validar que userId esté presente
      if (!userId || userId.trim() === '') {
        console.warn('getPersonalTagsBySong: userId no válido', { songId, userId })
        return []
      }

      // Intentar cargar del caché primero (si no se fuerza actualización)
      if (!forceRefresh) {
        const cached = await getCachedPersonalTags(userId, songId)
        if (cached !== null) {
          return cached as PersonalTag[]
        }
      }

      // Si no hay caché o se fuerza actualización, cargar desde API
      const { data, error } = await supabase
        .from('user_song_tags')
        .select('*')
        .eq('song_id', songId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching personal tags:', error)
        throw error
      }

      // Validar que todas las etiquetas pertenezcan al usuario (doble verificación)
      const filteredData = (data || []).filter((tag: PersonalTag) => tag.user_id === userId)

      // Guardar en caché
      await setCachedPersonalTags(userId, songId, filteredData)

      return filteredData as PersonalTag[]
    } catch (error) {
      console.error('Error in getPersonalTagsBySong:', error)
      // En caso de error, intentar devolver del caché como fallback
      const cached = await getCachedPersonalTags(userId, songId)
      if (cached !== null) {
        return cached as PersonalTag[]
      }
      throw error
    }
  }

  /**
   * Obtener todas las etiquetas personales de un usuario
   */
  static async getAllPersonalTags(userId: string): Promise<PersonalTag[]> {
    try {
      // Validar que userId esté presente
      if (!userId || userId.trim() === '') {
        console.warn('getAllPersonalTags: userId no válido', { userId })
        return []
      }

      const { data, error } = await supabase
        .from('user_song_tags')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all personal tags:', error)
        throw error
      }

      // Validar que todas las etiquetas pertenezcan al usuario (doble verificación)
      const filteredData = (data || []).filter((tag: PersonalTag) => tag.user_id === userId)

      return filteredData as PersonalTag[]
    } catch (error) {
      console.error('Error in getAllPersonalTags:', error)
      throw error
    }
  }

  /**
   * Agregar una etiqueta personal
   */
  static async addPersonalTag(input: PersonalTagInput, userId: string): Promise<PersonalTag> {
    try {
      // Validar que userId esté presente
      if (!userId || userId.trim() === '') {
        console.warn('addPersonalTag: userId no válido', { input, userId })
        throw new Error('Usuario no válido')
      }

      // Verificar si ya existe la etiqueta para este usuario y canción
      const { data: existing } = await supabase
        .from('user_song_tags')
        .select('id')
        .eq('song_id', input.song_id)
        .eq('user_id', userId)
        .eq('tag_name', input.tag_name.trim())
        .single()

      if (existing) {
        throw new Error('Esta etiqueta ya existe para esta canción')
      }

      const { data, error } = await supabase
        .from('user_song_tags')
        .insert({
          user_id: userId,
          song_id: input.song_id,
          tag_name: input.tag_name.trim()
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding personal tag:', error)
        throw error
      }

      // Invalidar caché de etiquetas personales para esta canción
      await invalidatePersonalTagsCache(userId, input.song_id)
      
      // Invalidar caché de etiquetas únicas del usuario
      await invalidateUniquePersonalTagsCache(userId)

      return data as PersonalTag
    } catch (error) {
      console.error('Error in addPersonalTag:', error)
      throw error
    }
  }

  /**
   * Eliminar una etiqueta personal
   */
  static async removePersonalTag(tagId: string, userId: string): Promise<void> {
    try {
      // Primero obtener la etiqueta para saber qué canción invalidar
      const { data: tag } = await supabase
        .from('user_song_tags')
        .select('song_id')
        .eq('id', tagId)
        .eq('user_id', userId)
        .single()

      const { error } = await supabase
        .from('user_song_tags')
        .delete()
        .eq('id', tagId)
        .eq('user_id', userId) // Asegurar que solo el dueño puede eliminar

      if (error) {
        console.error('Error removing personal tag:', error)
        throw error
      }

      // Invalidar caché de etiquetas personales para esta canción
      if (tag?.song_id) {
        await invalidatePersonalTagsCache(userId, tag.song_id)
      }
      
      // Invalidar caché de etiquetas únicas del usuario
      await invalidateUniquePersonalTagsCache(userId)
    } catch (error) {
      console.error('Error in removePersonalTag:', error)
      throw error
    }
  }

  /**
   * Obtener todas las etiquetas personales únicas de un usuario (para sugerencias)
   */
  static async getUniquePersonalTags(userId: string, forceRefresh = false): Promise<string[]> {
    try {
      // Validar que userId esté presente
      if (!userId || userId.trim() === '') {
        console.warn('getUniquePersonalTags: userId no válido', { userId })
        return []
      }

      // Intentar cargar del caché primero (si no se fuerza actualización)
      if (!forceRefresh) {
        const cached = await getCachedUniquePersonalTags(userId)
        if (cached !== null) {
          return cached
        }
      }

      const { data, error } = await supabase
        .from('user_song_tags')
        .select('tag_name, user_id')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching unique personal tags:', error)
        throw error
      }

      // Filtrar para asegurar que todas las etiquetas pertenezcan al usuario
      const filteredData = (data || []).filter((tag: { tag_name: string; user_id: string }) => tag.user_id === userId)
      const uniqueTags = new Set(filteredData.map((tag: { tag_name: string }) => tag.tag_name))
      const sortedTags = Array.from(uniqueTags).sort()

      // Guardar en caché
      await setCachedUniquePersonalTags(userId, sortedTags)

      return sortedTags
    } catch (error) {
      console.error('Error in getUniquePersonalTags:', error)
      // En caso de error, intentar devolver del caché como fallback
      const cached = await getCachedUniquePersonalTags(userId)
      if (cached !== null) {
        return cached
      }
      throw error
    }
  }

  /**
   * Obtener etiquetas personales para múltiples canciones
   * Retorna un Map con song_id como clave y array de tags como valor
   */
  static async getPersonalTagsBySongs(songIds: string[], userId: string, forceRefresh = false): Promise<Map<string, string[]>> {
    try {
      if (songIds.length === 0) {
        return new Map()
      }

      // Validar que userId esté presente
      if (!userId || userId.trim() === '') {
        console.warn('getPersonalTagsBySongs: userId no válido', { songIds, userId })
        return new Map()
      }

      const tagsMap = new Map<string, string[]>()
      const songsToFetch: string[] = []

      // Intentar cargar del caché primero (si no se fuerza actualización)
      if (!forceRefresh) {
        for (const songId of songIds) {
          const cached = await getCachedPersonalTags(userId, songId)
          if (cached !== null) {
            // Convertir PersonalTag[] a string[]
            const tagNames = cached.map((tag: PersonalTag) => tag.tag_name)
            tagsMap.set(songId, tagNames)
          } else {
            songsToFetch.push(songId)
          }
        }

        // Si todas están en caché, retornar
        if (songsToFetch.length === 0) {
          return tagsMap
        }
      } else {
        songsToFetch.push(...songIds)
      }

      // Cargar desde API solo las que no están en caché
      const { data, error } = await supabase
        .from('user_song_tags')
        .select('song_id, tag_name, user_id')
        .eq('user_id', userId)
        .in('song_id', songsToFetch)

      if (error) {
        console.error('Error fetching personal tags for multiple songs:', error)
        throw error
      }

      // Inicializar todas las canciones que no están en caché con array vacío
      songsToFetch.forEach(id => {
        if (!tagsMap.has(id)) {
          tagsMap.set(id, [])
        }
      })

      // Agregar las etiquetas encontradas, validando que pertenezcan al usuario
      const fetchedTagsBySong = new Map<string, PersonalTag[]>()
      ;(data || []).forEach((item: { song_id: string; tag_name: string; user_id: string }) => {
        // Doble verificación: asegurar que la etiqueta pertenece al usuario
        if (item.user_id === userId) {
          const existing = fetchedTagsBySong.get(item.song_id) || []
          fetchedTagsBySong.set(item.song_id, [...existing, { 
            id: '', 
            user_id: userId, 
            song_id: item.song_id, 
            tag_name: item.tag_name, 
            created_at: '' 
          } as PersonalTag])
        }
      })

      // Actualizar el mapa y guardar en caché
      for (const [songId, tags] of fetchedTagsBySong) {
        const tagNames = tags.map(tag => tag.tag_name)
        tagsMap.set(songId, tagNames)
        // Guardar en caché
        await setCachedPersonalTags(userId, songId, tags)
      }

      return tagsMap
    } catch (error) {
      console.error('Error in getPersonalTagsBySongs:', error)
      throw error
    }
  }
}

