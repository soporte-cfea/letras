import supabase from '../supabase/supabase';
import { Collection, CollectionSong, Cancion } from '../types/songTypes';

export class CollectionsService {
  // Obtener todas las colecciones del usuario
  static async getCollections(): Promise<Collection[]> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw error;
    }
  }

  // Obtener una colección específica
  static async getCollection(id: string): Promise<Collection | null> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching collection:', error);
      throw error;
    }
  }

  // Crear una nueva colección
  static async createCollection(collection: Omit<Collection, 'id' | 'created_at' | 'updated_at'>): Promise<Collection> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert([collection])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  // Actualizar una colección
  static async updateCollection(id: string, updates: Partial<Omit<Collection, 'id' | 'created_at' | 'updated_at'>>): Promise<Collection> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  }

  // Eliminar una colección
  static async deleteCollection(id: string): Promise<boolean> {
    try {
      // Primero eliminar todas las relaciones de canciones
      await supabase
        .from('collection_songs')
        .delete()
        .eq('collection_id', id);

      // Luego eliminar la colección
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }

  // Obtener canciones de una colección
  static async getCollectionSongs(collectionId: string): Promise<Cancion[]> {
    try {
      const { data, error } = await supabase
        .from('collection_songs')
        .select(`
          order_index,
          song (
            id,
            title,
            artist,
            subtitle,
            tempo,
            bpm,
            tags,
            created_at,
            update_at
          )
        `)
        .eq('collection_id', collectionId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      // Extraer las canciones y normalizar los datos
      return data?.map(item => ({
        ...item.song,
        tags: Array.isArray(item.song.tags) ? item.song.tags : []
      })) || [];
    } catch (error) {
      console.error('Error fetching collection songs:', error);
      throw error;
    }
  }

  // Agregar canción a colección
  static async addSongToCollection(collectionId: string, songId: number): Promise<CollectionSong> {
    try {
      // Obtener el siguiente índice de orden
      const { data: maxOrder } = await supabase
        .from('collection_songs')
        .select('order_index')
        .eq('collection_id', collectionId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrder = maxOrder?.[0]?.order_index ? maxOrder[0].order_index + 1 : 1;

      const { data, error } = await supabase
        .from('collection_songs')
        .insert([{
          collection_id: collectionId,
          song_id: songId,
          order_index: nextOrder,
          added_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding song to collection:', error);
      throw error;
    }
  }

  // Remover canción de colección
  static async removeSongFromCollection(collectionId: string, songId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('collection_songs')
        .delete()
        .eq('collection_id', collectionId)
        .eq('song_id', songId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing song from collection:', error);
      throw error;
    }
  }

  // Reordenar canciones en colección
  static async reorderCollectionSongs(collectionId: string, songOrders: { songId: number; orderIndex: number }[]): Promise<boolean> {
    try {
      const updates = songOrders.map(({ songId, orderIndex }) => 
        supabase
          .from('collection_songs')
          .update({ order_index: orderIndex })
          .eq('collection_id', collectionId)
          .eq('song_id', songId)
      );

      await Promise.all(updates);
      return true;
    } catch (error) {
      console.error('Error reordering collection songs:', error);
      throw error;
    }
  }

  // Obtener estadísticas de una colección
  static async getCollectionStats(collectionId: string): Promise<{ songCount: number; totalDuration?: number }> {
    try {
      const { count, error } = await supabase
        .from('collection_songs')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', collectionId);

      if (error) throw error;
      
      return {
        songCount: count || 0,
        totalDuration: undefined // TODO: Implementar si se agrega duración a las canciones
      };
    } catch (error) {
      console.error('Error fetching collection stats:', error);
      throw error;
    }
  }
}
