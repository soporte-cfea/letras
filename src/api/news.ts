import supabase from '@/supabase/supabase'

export interface NewsItem {
  id: string
  title: string
  excerpt: string
  content?: string
  type: 'update' | 'feature' | 'announcement' | 'maintenance'
  priority: number
  is_active: boolean
  published_at: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface NewsFilters {
  limit?: number
  type?: string
  active_only?: boolean
  recent_only?: boolean
}

/**
 * Obtiene las noticias recientes desde la base de datos
 */
export async function getRecentNews(filters: NewsFilters = {}): Promise<NewsItem[]> {
  try {
    const {
      limit = 5,
      type,
      active_only = true,
      recent_only = true
    } = filters

    let query = supabase
      .from('news')
      .select('*')
      .order('priority', { ascending: true })
      .order('published_at', { ascending: false })
      .limit(limit)

    // Filtrar por noticias activas
    if (active_only) {
      query = query.eq('is_active', true)
    }

    // Filtrar por tipo si se especifica
    if (type) {
      query = query.eq('type', type)
    }

    // Filtrar por noticias recientes (últimos 30 días)
    if (recent_only) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      query = query.gte('published_at', thirtyDaysAgo.toISOString())
    }

    // Filtrar noticias que no hayan expirado
    query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())

    const { data, error } = await query

    if (error) {
      console.error('Error fetching news:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getRecentNews:', error)
    throw error
  }
}

/**
 * Obtiene todas las noticias (para administración)
 */
export async function getAllNews(): Promise<NewsItem[]> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error fetching all news:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllNews:', error)
    throw error
  }
}

/**
 * Crea una nueva noticia
 */
export async function createNews(newsData: Omit<NewsItem, 'id' | 'created_at' | 'updated_at'>): Promise<NewsItem> {
  try {
    const { data, error } = await supabase
      .from('news')
      .insert([newsData])
      .select()
      .single()

    if (error) {
      console.error('Error creating news:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createNews:', error)
    throw error
  }
}

/**
 * Actualiza una noticia existente
 */
export async function updateNews(id: string, updates: Partial<NewsItem>): Promise<NewsItem> {
  try {
    const { data, error } = await supabase
      .from('news')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating news:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in updateNews:', error)
    throw error
  }
}

/**
 * Elimina una noticia
 */
export async function deleteNews(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting news:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in deleteNews:', error)
    throw error
  }
}

/**
 * Obtiene estadísticas de noticias
 */
export async function getNewsStats(): Promise<{
  total: number
  active: number
  recent: number
  by_type: Record<string, number>
}> {
  try {
    const { data: allNews, error } = await supabase
      .from('news')
      .select('is_active, type, published_at')

    if (error) {
      console.error('Error fetching news stats:', error)
      throw error
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const stats = {
      total: allNews?.length || 0,
      active: allNews?.filter(n => n.is_active).length || 0,
      recent: allNews?.filter(n => new Date(n.published_at) >= thirtyDaysAgo).length || 0,
      by_type: {} as Record<string, number>
    }

    // Contar por tipo
    allNews?.forEach(news => {
      stats.by_type[news.type] = (stats.by_type[news.type] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error('Error in getNewsStats:', error)
    throw error
  }
}
