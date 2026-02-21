import supabase from '@/supabase/supabase'
import type { PersonalTag, PersonalTagInput } from '@/types/personalTags'

/**
 * Servicio para manejar etiquetas personales de canciones
 */
export class PersonalTagsService {
  /**
   * Obtener todas las etiquetas personales de un usuario para una canción
   */
  static async getPersonalTagsBySong(songId: string, userId: string): Promise<PersonalTag[]> {
    try {
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

      return (data || []) as PersonalTag[]
    } catch (error) {
      console.error('Error in getPersonalTagsBySong:', error)
      throw error
    }
  }

  /**
   * Obtener todas las etiquetas personales de un usuario
   */
  static async getAllPersonalTags(userId: string): Promise<PersonalTag[]> {
    try {
      const { data, error } = await supabase
        .from('user_song_tags')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all personal tags:', error)
        throw error
      }

      return (data || []) as PersonalTag[]
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
      const { error } = await supabase
        .from('user_song_tags')
        .delete()
        .eq('id', tagId)
        .eq('user_id', userId) // Asegurar que solo el dueño puede eliminar

      if (error) {
        console.error('Error removing personal tag:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in removePersonalTag:', error)
      throw error
    }
  }

  /**
   * Obtener todas las etiquetas personales únicas de un usuario (para sugerencias)
   */
  static async getUniquePersonalTags(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_song_tags')
        .select('tag_name')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching unique personal tags:', error)
        throw error
      }

      const uniqueTags = new Set((data || []).map((tag: { tag_name: string }) => tag.tag_name))
      return Array.from(uniqueTags).sort()
    } catch (error) {
      console.error('Error in getUniquePersonalTags:', error)
      throw error
    }
  }

  /**
   * Obtener etiquetas personales para múltiples canciones
   * Retorna un Map con song_id como clave y array de tags como valor
   */
  static async getPersonalTagsBySongs(songIds: string[], userId: string): Promise<Map<string, string[]>> {
    try {
      if (songIds.length === 0) {
        return new Map()
      }

      const { data, error } = await supabase
        .from('user_song_tags')
        .select('song_id, tag_name')
        .eq('user_id', userId)
        .in('song_id', songIds)

      if (error) {
        console.error('Error fetching personal tags for multiple songs:', error)
        throw error
      }

      const tagsMap = new Map<string, string[]>()
      
      // Inicializar todas las canciones con array vacío
      songIds.forEach(id => {
        tagsMap.set(id, [])
      })

      // Agregar las etiquetas encontradas
      ;(data || []).forEach((item: { song_id: string; tag_name: string }) => {
        const existing = tagsMap.get(item.song_id) || []
        tagsMap.set(item.song_id, [...existing, item.tag_name])
      })

      return tagsMap
    } catch (error) {
      console.error('Error in getPersonalTagsBySongs:', error)
      throw error
    }
  }
}

