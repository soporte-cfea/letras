import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getRecentNews, getAllNews, createNews, updateNews, deleteNews, getNewsStats } from '@/api/news'
import type { NewsItem, NewsFilters } from '@/api/news'

export const useNewsStore = defineStore('news', () => {
  // Estado
  const news = ref<NewsItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const recentNews = computed(() => {
    return news.value.filter(item => {
      const publishedDate = new Date(item.published_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      return item.is_active && publishedDate >= thirtyDaysAgo
    })
  })

  const activeNews = computed(() => {
    return news.value.filter(item => item.is_active)
  })

  const newsByType = computed(() => {
    const grouped: Record<string, NewsItem[]> = {}
    news.value.forEach(item => {
      if (!grouped[item.type]) {
        grouped[item.type] = []
      }
      grouped[item.type].push(item)
    })
    return grouped
  })

  const hasRecentNews = computed(() => {
    return recentNews.value.length > 0
  })

  // Acciones
  async function loadNews(filters: NewsFilters = {}) {
    try {
      loading.value = true
      error.value = null
      
      const newsData = await getRecentNews(filters)
      news.value = newsData
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar noticias'
      console.error('Error loading news:', err)
    } finally {
      loading.value = false
    }
  }

  async function loadAllNews() {
    try {
      loading.value = true
      error.value = null
      
      const newsData = await getAllNews()
      news.value = newsData
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar todas las noticias'
      console.error('Error loading all news:', err)
    } finally {
      loading.value = false
    }
  }

  async function addNews(newsData: Omit<NewsItem, 'id' | 'created_at' | 'updated_at'>) {
    try {
      loading.value = true
      error.value = null
      
      const newNews = await createNews(newsData)
      news.value.unshift(newNews)
      
      return newNews
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear noticia'
      console.error('Error adding news:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function editNews(id: string, updates: Partial<NewsItem>) {
    try {
      loading.value = true
      error.value = null
      
      const updatedNews = await updateNews(id, updates)
      const index = news.value.findIndex(item => item.id === id)
      if (index !== -1) {
        news.value[index] = updatedNews
      }
      
      return updatedNews
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar noticia'
      console.error('Error editing news:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeNews(id: string) {
    try {
      loading.value = true
      error.value = null
      
      await deleteNews(id)
      news.value = news.value.filter(item => item.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar noticia'
      console.error('Error removing news:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function refreshNews() {
    await loadNews()
  }

  function clearError() {
    error.value = null
  }

  function clearNews() {
    news.value = []
  }

  // Función para formatear fechas de noticias
  function formatNewsDate(dateString: string): string {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    if (diffDays <= 7) return `Hace ${diffDays} días`
    if (diffDays <= 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    })
  }

  // Función para obtener el icono del tipo de noticia
  function getNewsTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'update': `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>`,
      'feature': `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
      'announcement': `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
      'maintenance': `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`
    }
    return icons[type] || `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`
  }

  // Función para obtener el color del tipo de noticia
  function getNewsTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'update': '#3b82f6', // azul
      'feature': '#10b981', // verde
      'announcement': '#f59e0b', // amarillo
      'maintenance': '#ef4444' // rojo
    }
    return colors[type] || '#6b7280'
  }

  return {
    // Estado
    news,
    loading,
    error,
    
    // Getters
    recentNews,
    activeNews,
    newsByType,
    hasRecentNews,
    
    // Acciones
    loadNews,
    loadAllNews,
    addNews,
    editNews,
    removeNews,
    refreshNews,
    clearError,
    clearNews,
    
    // Utilidades
    formatNewsDate,
    getNewsTypeIcon,
    getNewsTypeColor
  }
})
