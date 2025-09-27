import supabase from '../supabase/supabase'
import type { Tag, TagType, UserSongTag } from '../types/songTypes'
import { mockTagAPI } from '../mock/tagMocks'

// Flag para usar mocks en lugar de la base de datos real
const USE_MOCKS = true

/**
 * Normaliza un array de tags (compatibilidad con sistema anterior)
 */
export function normalizeTags(tags: string[]): string[] {
  return tags
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .map(tag => tag.toLowerCase())
}

/**
 * Obtiene todos los tags de una canción (públicos + privados del usuario)
 */
export async function getSongTags(songId: string, userId?: string): Promise<UserSongTag[]> {
  if (USE_MOCKS) {
    return await mockTagAPI.getSongTags(songId, userId)
  }

  const { data, error } = await supabase
    .from('user_song_tags')
    .select(`
      *,
      tag:tags(*),
      tag_type:tag_types(*)
    `)
    .eq('song_id', songId)
    .or(`tag_type.is_visible_to_others.eq.true${userId ? `,user_id.eq.${userId}` : ''}`)

  if (error) {
    console.error('Error obteniendo tags de canción:', error)
    return []
  }

  return data || []
}

/**
 * Obtiene solo los tags públicos de una canción
 */
export async function getPublicSongTags(songId: string): Promise<UserSongTag[]> {
  if (USE_MOCKS) {
    return await mockTagAPI.getPublicSongTags(songId)
  }

  const { data, error } = await supabase
    .from('user_song_tags')
    .select(`
      *,
      tag:tags(*),
      tag_type:tag_types(*)
    `)
    .eq('song_id', songId)
    .eq('tag_type.name', 'public')

  if (error) {
    console.error('Error obteniendo tags públicos:', error)
    return []
  }

  return data || []
}

/**
 * Obtiene solo los tags privados de un usuario para una canción
 */
export async function getPrivateSongTags(songId: string, userId: string): Promise<UserSongTag[]> {
  if (USE_MOCKS) {
    return await mockTagAPI.getPrivateSongTags(songId, userId)
  }

  const { data, error } = await supabase
    .from('user_song_tags')
    .select(`
      *,
      tag:tags(*),
      tag_type:tag_types(*)
    `)
    .eq('song_id', songId)
    .eq('user_id', userId)
    .eq('tag_type.name', 'private')

  if (error) {
    console.error('Error obteniendo tags privados:', error)
    return []
  }

  return data || []
}

/**
 * Agrega un tag a una canción
 */
export async function addTagToSong(
  songId: string, 
  tagName: string, 
  tagType: 'public' | 'private' = 'public',
  userId?: string
): Promise<boolean> {
  if (USE_MOCKS) {
    return await mockTagAPI.addTagToSong(songId, tagName, tagType, userId)
  }

  try {
    // Crear o obtener el tag
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .upsert({ name: tagName.trim() })
      .select()
      .single()

    if (tagError) {
      console.error('Error creando/obteniendo tag:', tagError)
      return false
    }

    // Obtener el tipo de tag
    const { data: tagTypeData, error: tagTypeError } = await supabase
      .from('tag_types')
      .select('id')
      .eq('name', tagType)
      .single()

    if (tagTypeError) {
      console.error('Error obteniendo tipo de tag:', tagTypeError)
      return false
    }

    // Crear la relación
    const { error: relationError } = await supabase
      .from('user_song_tags')
      .insert({
        song_id: songId,
        tag_id: tag.id,
        tag_type_id: tagTypeData.id,
        user_id: tagType === 'private' ? userId : null
      })

    if (relationError) {
      console.error('Error creando relación tag-canción:', relationError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error agregando tag a canción:', error)
    return false
  }
}

/**
 * Elimina un tag de una canción
 */
export async function removeTagFromSong(
  songId: string,
  tagName: string,
  tagType: 'public' | 'private' = 'public',
  userId?: string
): Promise<boolean> {
  if (USE_MOCKS) {
    return await mockTagAPI.removeTagFromSong(songId, tagName, tagType, userId)
  }

  try {
    // Obtener IDs necesarios
    const { data: tag } = await supabase
      .from('tags')
      .select('id')
      .eq('name', tagName)
      .single()

    const { data: tagTypeData } = await supabase
      .from('tag_types')
      .select('id')
      .eq('name', tagType)
      .single()

    if (!tag || !tagTypeData) {
      return false
    }

    // Eliminar la relación
    const { error } = await supabase
      .from('user_song_tags')
      .delete()
      .eq('song_id', songId)
      .eq('tag_id', tag.id)
      .eq('tag_type_id', tagTypeData.id)
      .eq('user_id', tagType === 'private' ? userId : null)

    if (error) {
      console.error('Error eliminando tag de canción:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error eliminando tag de canción:', error)
    return false
  }
}

/**
 * Obtiene todos los tags disponibles (para autocompletado)
 */
export async function getAllTags(): Promise<Tag[]> {
  if (USE_MOCKS) {
    return await mockTagAPI.getAllTags()
  }

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error obteniendo todos los tags:', error)
    return []
  }

  return data || []
}

/**
 * Obtiene los tipos de tags disponibles
 */
export async function getTagTypes(): Promise<TagType[]> {
  if (USE_MOCKS) {
    return await mockTagAPI.getTagTypes()
  }

  const { data, error } = await supabase
    .from('tag_types')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error obteniendo tipos de tags:', error)
    return []
  }

  return data || []
}

/**
 * Convierte UserSongTag[] a string[] (para compatibilidad)
 */
export function userTagsToStringArray(userTags: UserSongTag[]): string[] {
  return userTags
    .filter(ut => ut.tag)
    .map(ut => ut.tag!.name)
}

/**
 * Convierte string[] a UserSongTag[] (para compatibilidad)
 */
export function stringArrayToUserTags(tagNames: string[], songId: string): UserSongTag[] {
  return tagNames.map((name, index) => ({
    id: `temp-${index}`,
    song_id: songId,
    tag_id: `temp-tag-${index}`,
    tag_type_id: 'temp-type',
    tag: { id: `temp-tag-${index}`, name },
    tag_type: { id: 'temp-type', name: 'public', is_visible_to_others: true }
  }))
}

/**
 * Filtra tags por tipo
 */
export function filterTagsByType(userTags: UserSongTag[], tagType: 'public' | 'private'): UserSongTag[] {
  return userTags.filter(ut => ut.tag_type?.name === tagType)
}

/**
 * Obtiene nombres de tags únicos de una lista de UserSongTag
 */
export function getUniqueTagNames(userTags: UserSongTag[]): string[] {
  const names = userTags
    .filter(ut => ut.tag)
    .map(ut => ut.tag!.name)
  
  return [...new Set(names)]
}