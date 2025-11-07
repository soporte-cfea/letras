import supabase from '../supabase/supabase';

export interface CollectionSection {
  id: string;
  collection_id: string;
  name: string;
  description?: string;
  order_index: number;
  color: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export class SectionsService {
  // Obtener todas las secciones de una colección (solo las habilitadas)
  static async getCollectionSections(collectionId: string): Promise<CollectionSection[]> {
    try {
      const { data, error } = await supabase
        .from('collection_sections')
        .select('*')
        .eq('collection_id', collectionId)
        .eq('enabled', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching collection sections:', error);
      throw error;
    }
  }

  // Obtener TODAS las secciones de una colección (incluyendo las deshabilitadas)
  static async getAllCollectionSections(collectionId: string): Promise<CollectionSection[]> {
    try {
      const { data, error } = await supabase
        .from('collection_sections')
        .select('*')
        .eq('collection_id', collectionId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all collection sections:', error);
      throw error;
    }
  }

  // Crear una nueva sección
  static async createSection(
    collectionId: string, 
    name: string, 
    description: string = '', 
    color: string = '#3b82f6'
  ): Promise<CollectionSection> {
    try {
      // Obtener el siguiente order_index
      const { data: lastSection } = await supabase
        .from('collection_sections')
        .select('order_index')
        .eq('collection_id', collectionId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      const nextOrderIndex = lastSection ? lastSection.order_index + 1 : 0;

      const { data, error } = await supabase
        .from('collection_sections')
        .insert({
          collection_id: collectionId,
          name,
          description,
          order_index: nextOrderIndex,
          color,
          enabled: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating section:', error);
      throw error;
    }
  }

  // Actualizar una sección
  static async updateSection(
    sectionId: string, 
    updates: Partial<Pick<CollectionSection, 'name' | 'description' | 'color' | 'enabled'>>
  ): Promise<CollectionSection> {
    try {
      // Validar que tenemos datos para actualizar
      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('No hay datos para actualizar');
      }

      // Validar que el sectionId existe
      if (!sectionId || sectionId.trim() === '') {
        throw new Error('ID de sección inválido');
      }

      // Filtrar campos vacíos o undefined
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key, value]) => value !== undefined && value !== null && value !== '')
      );

      if (Object.keys(cleanUpdates).length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      console.log('Updating section:', sectionId, 'with data:', cleanUpdates);

      const { data, error } = await supabase
        .from('collection_sections')
        .update(cleanUpdates)
        .eq('id', sectionId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error updating section:', error);
      throw error;
    }
  }

  // Eliminar una sección
  static async deleteSection(sectionId: string, moveSongsToSectionId?: string): Promise<boolean> {
    try {
      // Si se especifica una sección destino, mover las canciones
      if (moveSongsToSectionId) {
        const { error: moveError } = await supabase
          .from('collection_songs')
          .update({ section_id: moveSongsToSectionId })
          .eq('section_id', sectionId);

        if (moveError) throw moveError;
      }

      // Eliminar la sección
      const { error } = await supabase
        .from('collection_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting section:', error);
      throw error;
    }
  }

  // Reordenar secciones
  static async reorderSections(sectionOrders: { id: string; order_index: number }[]): Promise<boolean> {
    try {
      const updates = sectionOrders.map(({ id, order_index }) => 
        supabase
          .from('collection_sections')
          .update({ order_index })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      
      for (const result of results) {
        if (result.error) throw result.error;
      }

      return true;
    } catch (error) {
      console.error('Error reordering sections:', error);
      throw error;
    }
  }

  // Habilitar una sección
  static async enableSection(sectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('collection_sections')
        .update({ enabled: true })
        .eq('id', sectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error enabling section:', error);
      throw error;
    }
  }

  // Deshabilitar una sección
  static async disableSection(sectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('collection_sections')
        .update({ enabled: false })
        .eq('id', sectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error disabling section:', error);
      throw error;
    }
  }

  // Alternar estado de una sección
  static async toggleSection(sectionId: string, enabled: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('collection_sections')
        .update({ enabled })
        .eq('id', sectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling section:', error);
      throw error;
    }
  }

  // Mover canción a una sección
  static async moveSongToSection(collectionSongId: string, sectionId: string | null): Promise<boolean> {
    try {
      // Obtener el siguiente order_index para la sección destino
      let nextOrderIndex = 1;
      
      if (sectionId) {
        // Si se mueve a una sección específica, obtener el siguiente order_index
        const { data: maxOrder } = await supabase
          .from('collection_songs')
          .select('order_index')
          .eq('collection_id', (await supabase
            .from('collection_songs')
            .select('collection_id')
            .eq('id', collectionSongId)
            .single()
          ).data?.collection_id)
          .eq('section_id', sectionId)
          .order('order_index', { ascending: false })
          .limit(1);
        
        nextOrderIndex = maxOrder?.[0]?.order_index ? maxOrder[0].order_index + 1 : 1;
      } else {
        // Si se mueve a unassigned, obtener el siguiente order_index para unassigned
        const { data: maxOrder } = await supabase
          .from('collection_songs')
          .select('order_index')
          .eq('collection_id', (await supabase
            .from('collection_songs')
            .select('collection_id')
            .eq('id', collectionSongId)
            .single()
          ).data?.collection_id)
          .is('section_id', null)
          .order('order_index', { ascending: false })
          .limit(1);
        
        nextOrderIndex = maxOrder?.[0]?.order_index ? maxOrder[0].order_index + 1 : 1;
      }

      // Actualizar tanto section_id como order_index
      const { error } = await supabase
        .from('collection_songs')
        .update({ 
          section_id: sectionId,
          order_index: nextOrderIndex
        })
        .eq('id', collectionSongId);

      if (error) throw error;
      
      console.log(`📝 Moved song ${collectionSongId} to section ${sectionId} with order_index ${nextOrderIndex}`);
      return true;
    } catch (error) {
      console.error('Error moving song to section:', error);
      throw error;
    }
  }

  // Obtener canciones agrupadas por sección
  static async getSongsBySection(collectionId: string): Promise<{
    sections: (CollectionSection & { songs: any[] })[];
    unassignedSongs: any[];
  }> {
    try {
      // Obtener secciones (solo las habilitadas para mostrar)
      const sections = await this.getCollectionSections(collectionId);

      // Obtener todas las canciones de la colección
      const { data: songs, error: songsError } = await supabase
        .from('collection_songs')
        .select(`
          id,
          order_index,
          list_tags,
          notes,
          section_id,
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

      if (songsError) throw songsError;

      // Mapear canciones
      const mappedSongs = songs?.map((item: any) => ({
        ...item.song,
        tags: Array.isArray(item.song?.tags) ? item.song.tags : [],
        list_tags: Array.isArray(item.list_tags) ? item.list_tags : [],
        notes: item.notes || '',
        collection_song_id: item.id,
        section_id: item.section_id,
        order_index: item.order_index
      })) || [];

      // Agrupar canciones por sección y ordenar por order_index
      const sectionsWithSongs = sections.map(section => ({
        ...section,
        songs: mappedSongs
          .filter(song => song.section_id === section.id)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      }));

      // Canciones sin asignar, ordenadas por order_index
      const unassignedSongs = mappedSongs
        .filter(song => !song.section_id)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

      return {
        sections: sectionsWithSongs,
        unassignedSongs
      };
    } catch (error) {
      console.error('Error getting songs by section:', error);
      throw error;
    }
  }
}
