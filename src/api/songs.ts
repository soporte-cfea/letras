import supabase from '@/supabase/supabase'
import { Cancion, Document } from '@/types/songTypes'
import { sanitizeSongData, sanitizeDocumentData } from '@/utils/supabase'

export class SongsService {
  // Obtener todas las canciones
  static async getSongs(): Promise<Cancion[]> {
    try {
      const { data, error } = await supabase
        .from('song')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching songs:', error)
        throw error
      }

      return (data || []).map(sanitizeSongData)
    } catch (error) {
      console.error('Error in getSongs:', error)
      throw error
    }
  }

  // Obtener una canción por ID
  static async getSongById(id: string): Promise<Cancion | null> {
    try {
      const { data, error } = await supabase
        .from('song')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching song:', error)
        return null
      }

      return data ? sanitizeSongData(data) : null
    } catch (error) {
      console.error('Error in getSongById:', error)
      return null
    }
  }

  // Crear una nueva canción
  static async createSong(song: Omit<Cancion, 'id' | 'created_at' | 'update_at'>): Promise<Cancion | null> {
    try {
      const { data, error } = await supabase
        .from('song')
        .insert([song])
        .select()
        .single()

      if (error) {
        console.error('Error creating song:', error)
        throw error
      }

      return data ? sanitizeSongData(data) : null
    } catch (error) {
      console.error('Error in createSong:', error)
      throw error
    }
  }

  // Actualizar una canción
  static async updateSong(id: string, updates: Partial<Omit<Cancion, 'id' | 'created_at'>>): Promise<Cancion | null> {
    try {
      const { data, error } = await supabase
        .from('song')
        .update({ ...updates, update_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating song:', error)
        throw error
      }

      return data ? sanitizeSongData(data) : null
    } catch (error) {
      console.error('Error in updateSong:', error)
      throw error
    }
  }

  // Eliminar una canción
  static async deleteSong(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('song')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting song:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in deleteSong:', error)
      throw error
    }
  }

  // Buscar canciones
  static async searchSongs(query: string): Promise<Cancion[]> {
    try {
      const { data, error } = await supabase
        .from('song')
        .select('*')
        .or(`title.ilike.%${query}%,artist.ilike.%${query}%,subtitle.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error searching songs:', error)
        throw error
      }

      return (data || []).map(sanitizeSongData)
    } catch (error) {
      console.error('Error in searchSongs:', error)
      throw error
    }
  }

  // Obtener canciones por artista
  static async getSongsByArtist(artist: string): Promise<Cancion[]> {
    try {
      const { data, error } = await supabase
        .from('song')
        .select('*')
        .eq('artist', artist)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching songs by artist:', error)
        throw error
      }

      return (data || []).map(sanitizeSongData)
    } catch (error) {
      console.error('Error in getSongsByArtist:', error)
      throw error
    }
  }

  // Obtener canciones por tag
  static async getSongsByTag(tag: string): Promise<Cancion[]> {
    try {
      const { data, error } = await supabase
        .from('song')
        .select('*')
        .contains('tags', [tag])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching songs by tag:', error)
        throw error
      }

      return (data || []).map(sanitizeSongData)
    } catch (error) {
      console.error('Error in getSongsByTag:', error)
      throw error
    }
  }

  // Verificar si hay actualizaciones en canciones
  static async checkForUpdates(lastUpdate: string | null): Promise<boolean> {
    try {
      if (!lastUpdate) return true // Si no hay timestamp guardado, hay actualizaciones
      
      const { data, error } = await supabase
        .from('song')
        .select('update_at')
        .gt('update_at', lastUpdate)
        .limit(1)

      if (error) {
        console.error('Error checking for song updates:', error)
        return false
      }

      return (data && data.length > 0) || false
    } catch (error) {
      console.error('Error in checkForUpdates:', error)
      return false
    }
  }

  // Obtener el timestamp de la última actualización
  static async getLastUpdateTimestamp(): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('song')
        .select('update_at')
        .order('update_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error getting last update timestamp:', error)
        return null
      }

      return data && data.length > 0 ? data[0].update_at : null
    } catch (error) {
      console.error('Error in getLastUpdateTimestamp:', error)
      return null
    }
  }
}

export class DocumentsService {
  // Obtener documentos de una canción
  static async getDocumentsBySongId(songId: string): Promise<Document[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('song_id', songId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching documents:', error)
        throw error
      }

      return (data || []).map(sanitizeDocumentData)
    } catch (error) {
      console.error('Error in getDocumentsBySongId:', error)
      throw error
    }
  }

  // Crear un nuevo documento
  static async createDocument(document: Omit<Document, 'id' | 'created_at' | 'update_at'>): Promise<Document | null> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([document])
        .select()
        .single()

      if (error) {
        console.error('Error creating document:', error)
        throw error
      }

      return data ? sanitizeDocumentData(data) : null
    } catch (error) {
      console.error('Error in createDocument:', error)
      throw error
    }
  }

  // Actualizar un documento
  static async updateDocument(id: string, updates: Partial<Omit<Document, 'id' | 'created_at'>>): Promise<Document | null> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({ ...updates, update_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating document:', error)
        throw error
      }

      return data ? sanitizeDocumentData(data) : null
    } catch (error) {
      console.error('Error in updateDocument:', error)
      throw error
    }
  }

  // Eliminar un documento
  static async deleteDocument(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting document:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in deleteDocument:', error)
      throw error
    }
  }
}
