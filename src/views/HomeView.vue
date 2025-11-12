<template>
  <section class="home-view">
    <!-- Control de Tema - Parte superior derecha -->
    <div class="theme-toggle-container">
      <ThemeToggle />
    </div>
    
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <!-- Logo/Icono -->
        <div class="hero-logo">
          <div class="logo-container">
            <div class="music-note">♪</div>
            <div class="logo-text">CF Letras</div>
          </div>
        </div>

        <!-- Estadísticas en Tiempo Real -->
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-number">{{ animatedStats.songs }}+</span>
            <span class="stat-label">Canciones</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ animatedStats.artists }}+</span>
            <span class="stat-label">Artistas</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ animatedStats.tags }}+</span>
            <span class="stat-label">Etiquetas</span>
          </div>
        </div>

        <!-- Call to Action -->
        <div class="hero-cta">
          <button @click="goToSongs" class="cta-button">
            Explorar canciones
          </button>
        </div>
      </div>

      <!-- Animación de Notas Musicales -->
      <div class="floating-notes">
        <div class="note note-1">♪</div>
        <div class="note note-2">♫</div>
        <div class="note note-3">♪</div>
        <div class="note note-4">♫</div>
        <div class="note note-5">♪</div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando datos...</p>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Featured Section -->
      <div class="featured-section">
        <h2>{{ getFeaturedSectionTitle() }}</h2>
        <div class="cards-container">
        <div class="card" v-for="(song, index) in featuredSongs" :key="index" @click="goToSong(song.id)" style="cursor: pointer;">
          <div class="card-content">
            <div class="song-header">
              <h3>{{ song.title }}</h3>
              <p class="artist">{{ song.artist }}</p>
              <p v-if="song.subtitle" class="subtitle">{{ song.subtitle }}</p>
            </div>
            
            <div class="song-metadata">
              <div v-if="song.created_at" class="metadata-item">
                <span class="metadata-value">{{ formatDate(song.created_at) }}</span>
              </div>
            </div>
            
            <div class="tags">
              <Tag v-for="tag in song.tags" :key="tag" :tag="tag" size="sm" />
            </div>
            
            <!-- Recursos de la canción - Menú desplegable -->
            <div v-if="song.resources && song.resources.length > 0" class="resources-dropdown">
              <button 
                @click.stop="toggleResourcesDropdown(index)"
                class="resources-toggle"
                :class="{ 'active': openDropdownIndex === index }"
                :title="`${song.resources.length} recursos disponibles`"
              >
                <span class="three-dots">⋯</span>
              </button>
              
              <div v-if="openDropdownIndex === index" class="resources-menu">
                <button
                  v-for="resource in song.resources"
                  :key="resource.url"
                  @click.stop="openResourcePreview(resource)"
                  class="resource-menu-item"
                >
                  <span class="resource-icon" v-html="getResourceIcon(resource.type)"></span>
                  <span class="resource-name">{{ getResourceName(resource) }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Botón sutil para expandir/contraer -->
        <div v-if="allRecentSongs.length > 6" class="expand-section">
          <button @click="toggleShowAllSongs" class="expand-btn">
            <span v-if="!showAllSongs">
              Ver todas
            </span>
            <span v-else>
              Ver menos
            </span>
            <svg 
              :class="{ 'rotated': showAllSongs }"
              width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- News Section - Solo se muestra si hay noticias recientes -->
    <div v-if="newsStore.hasRecentNews" class="news-section">
      <h2>Últimas Actualizaciones</h2>
      <div class="news-grid">
        <article v-for="news in newsStore.recentNews" :key="news.id" class="news-card">
          <div class="news-header">
            <span class="news-type" :style="{ backgroundColor: newsStore.getNewsTypeColor(news.type) }" v-html="newsStore.getNewsTypeIcon(news.type)">
            </span>
            <span class="news-date">{{ newsStore.formatNewsDate(news.published_at) }}</span>
          </div>
          <h3>{{ news.title }}</h3>
          <p>{{ news.excerpt }}</p>
        </article>
      </div>
    </div>

    </div>

    <!-- Resource Preview Modal -->
    <ResourcePreviewModal 
      :show="showPreviewModal" 
      :resource="selectedResource"
      @close="closePreviewModal"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCancionesStore } from '@/stores/canciones'
import { useNewsStore } from '@/stores/news'
import { useNotifications } from '@/composables/useNotifications'
import ResourcePreviewModal from '@/components/ResourcePreviewModal.vue'
import Tag from '@/components/common/Tag.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import type { SongResource } from '@/types/songTypes'

const router = useRouter()
const cancionesStore = useCancionesStore()
const newsStore = useNewsStore()
const { success, error } = useNotifications()

const featuredSongs = ref([])
const allRecentSongs = ref([])
const showAllSongs = ref(false)

const loading = ref(true)
const showPreviewModal = ref(false)
const selectedResource = ref<SongResource | null>(null)
const openDropdownIndex = ref<number | null>(null)

// Hero section variables
const animatedStats = ref({
  songs: 0,
  artists: 0,
  tags: 0
})

// Función para navegar a la canción
function goToSong(songId: string) {
  // Crear un slug básico del título para la URL
  const song = featuredSongs.value.find(s => s.id === songId)
  const slug = song ? song.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'cancion'
  router.push(`/cancion/${songId}-${slug}`)
}

// Función para obtener el icono del recurso (iconos oficiales de marcas)
function getResourceIcon(type: string): string {
  const icons: Record<string, string> = {
    'spotify': `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>`,
    'youtube': `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>`,
    'facebook': `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>`,
    'instagram': `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>`,
    'apple-music': `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>`,
    'image': `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21,15 16,10 5,21"/>
    </svg>`,
    'video': `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>`,
    'audio': `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>`,
    'other': `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 1 5.656 0l4-4a4 4 0 0 1-5.656-5.656l-1.1 1.1"/>
    </svg>`
  }
  return icons[type] || icons['other']
}

// Función para obtener el nombre del recurso
function getResourceName(resource: SongResource): string {
  // Si tiene label personalizado, usarlo
  if (resource.label && resource.label.trim()) {
    return resource.label.trim()
  }
  
  // Si no, usar el nombre por defecto basado en el type
  const names: Record<string, string> = {
    'spotify': 'Spotify',
    'youtube': 'YouTube',
    'facebook': 'Facebook',
    'instagram': 'Instagram',
    'apple-music': 'Apple Music',
    'image': 'Imagen',
    'video': 'Video',
    'audio': 'Audio',
    'other': 'Otro'
  }
  return names[resource.type] || 'Otro'
}

// Función para abrir preview del recurso
function openResourcePreview(resource: SongResource) {
  selectedResource.value = resource
  showPreviewModal.value = true
}

// Función para cerrar preview
function closePreviewModal() {
  showPreviewModal.value = false
  selectedResource.value = null
}

// Función para alternar el dropdown de recursos
function toggleResourcesDropdown(index: number) {
  if (openDropdownIndex.value === index) {
    openDropdownIndex.value = null
  } else {
    openDropdownIndex.value = index
  }
}

// Función para alternar entre mostrar 6 y mostrar todas las canciones
function toggleShowAllSongs() {
  showAllSongs.value = !showAllSongs.value
  if (showAllSongs.value) {
    featuredSongs.value = allRecentSongs.value
  } else {
    featuredSongs.value = allRecentSongs.value.slice(0, 6)
  }
}

// Funciones del Hero Section
function goToSongs() {
  router.push('/canciones')
}

// Función para animar contadores
function animateCounters() {
  const targetStats = {
    songs: cancionesStore.canciones.length,
    artists: new Set(cancionesStore.canciones.map(c => c.artist)).size,
    tags: cancionesStore.tags.length
  }

  const duration = 2000 // 2 segundos
  const steps = 60
  const stepDuration = duration / steps

  Object.keys(targetStats).forEach(key => {
    const target = targetStats[key as keyof typeof targetStats]
    const start = 0
    const increment = target / steps
    let current = start

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        animatedStats.value[key as keyof typeof animatedStats] = target
        clearInterval(timer)
      } else {
        animatedStats.value[key as keyof typeof animatedStats] = Math.floor(current)
      }
    }, stepDuration)
  })
}

// Función para formatear fechas
function formatDate(dateString: string): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Agregada hoy'
  if (diffDays === 2) return 'Agregada ayer'
  if (diffDays <= 7) return `Agregada hace ${diffDays} días`
  if (diffDays <= 30) return `Agregada hace ${Math.ceil(diffDays / 7)} semanas`
  
  return `Agregada ${date.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'short' 
  })}`
}

// Función para generar el título dinámico de la sección
function getFeaturedSectionTitle(): string {
  if (featuredSongs.value.length === 0) return 'Agregadas recientemente'
  
  // Calcular fecha de hace 7 días
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  // Verificar si hay canciones de la última semana
  const hasRecentSongs = featuredSongs.value.some(song => {
    if (!song.created_at) return false
    return new Date(song.created_at) >= lastWeek
  })
  
  if (hasRecentSongs) {
    return 'Agregadas esta semana'
  } else {
    return 'Agregadas recientemente'
  }
}

// Cargar datos reales
async function loadHomeData() {
  try {
    loading.value = true
    
    // Cargar canciones destacadas (sistema híbrido inteligente)
    await cancionesStore.loadCanciones()
    
    // Calcular fecha de hace 7 días
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    // Filtrar canciones de la última semana
    const recentSongs = cancionesStore.canciones.filter(cancion => {
      if (!cancion.created_at) return false
      return new Date(cancion.created_at) >= lastWeek
    })
    
    // Sistema híbrido: si hay canciones de la última semana, mostrar las últimas 6
    // Si no, mostrar las últimas 3 como fallback
    let allSongsToShow
    if (recentSongs.length > 0) {
      // Ordenar por fecha de creación (más recientes primero)
      allSongsToShow = recentSongs.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } else {
      // Fallback: últimas 3 canciones
      allSongsToShow = cancionesStore.canciones.slice(0, 3)
    }
    
    // Guardar todas las canciones disponibles
    allRecentSongs.value = allSongsToShow.map(cancion => ({
      id: cancion.id,
      title: cancion.title,
      artist: cancion.artist,
      subtitle: cancion.subtitle,
      tempo: cancion.tempo,
      bpm: cancion.bpm,
      tags: cancion.tags || [],
      resources: cancion.resources || [],
      created_at: cancion.created_at
    }))
    
    // Mostrar solo las primeras 6 (o todas si son menos de 6)
    featuredSongs.value = allRecentSongs.value.slice(0, 6)
    
    // Cargar noticias recientes
    await newsStore.loadNews({ limit: 5, recent_only: true })
    
    // Calcular estadísticas reales para el hero
    const canciones = cancionesStore.canciones
    const uniqueArtists = new Set(canciones.map(c => c.artist))
    
    // Animar contadores
    animateCounters()
    
  } catch (err) {
    console.error('Error loading home data:', err)
    error('Error', 'No se pudieron cargar los datos de inicio')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadHomeData()
})
</script>

<style scoped>
.home-view {
  padding: 0;
  background: var(--color-background);
  overflow: hidden;
  transition: background-color var(--transition-normal);
  position: relative;
}

/* Control de tema en la parte superior derecha */
.theme-toggle-container {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
  transition: all var(--transition-normal);
}

/* En móviles, ajustar posición */
@media (max-width: 900px) {
  .theme-toggle-container {
    top: 1rem;
    right: 1rem;
  }
}

/* Hero Section */
.hero-section {
  min-height: 60vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  padding: 3rem 2rem;
  overflow: hidden;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  text-align: center;
  z-index: 2;
  position: relative;
}

/* Logo/Icono */
.hero-logo {
  margin-bottom: 2.5rem;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.music-note {
  font-size: 4rem;
  animation: float 3s ease-in-out infinite;
}

.logo-text {
  font-size: 3rem;
  font-weight: 600;
  letter-spacing: 2px;
}

/* Animación de Notas Musicales */
.floating-notes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.note {
  position: absolute;
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.note-1 {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.note-2 {
  top: 30%;
  right: 15%;
  animation-delay: 1s;
}

.note-3 {
  top: 60%;
  left: 20%;
  animation-delay: 2s;
}

.note-4 {
  top: 70%;
  right: 10%;
  animation-delay: 3s;
}

.note-5 {
  top: 40%;
  left: 50%;
  animation-delay: 4s;
}

/* Estadísticas */
.hero-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-bottom: 2rem;
}

.hero-stats .stat-item {
  text-align: center;
  animation: fadeInUp 1s ease-out 0.4s both;
}

.hero-stats .stat-number {
  display: block;
  font-size: 2.5rem;
  font-weight: 300;
  color: var(--color-text);
  margin-bottom: 0.3rem;
}

.hero-stats .stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-text-soft);
}

/* Call to Action */
.hero-cta {
  animation: fadeInUp 1s ease-out 0.6s both;
}

.cta-button {
  background: transparent;
  color: var(--color-text);
  border: 2px solid var(--color-text);
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 300;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(212, 165, 116, 0.3);
}

/* Featured Section */
.featured-section {
  padding: 4rem 2rem;
}

h2 {
  font-size: 2rem;
  color: var(--color-heading);
  text-align: center;
  margin-bottom: 2rem;
}

.featured-section h2 {
  color: var(--color-heading);
  font-weight: 600;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1rem;
  justify-content: center;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.card {
  background: var(--color-background-card);
  border-radius: 15px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  width: 320px;
  height: auto;
  border: 1px solid var(--color-border);
  position: relative;
  flex: 1 1 320px;
  max-width: 400px;
}

/* Mejoras específicas para modo claro */
:root:not([data-theme="dark"]) .card,
:root[data-theme="light"] .card {
  background: linear-gradient(to bottom, #ffffff, #fafbfc);
  border: 1px solid #e4e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
}

:root:not([data-theme="dark"]) .card:hover,
:root[data-theme="light"] .card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
  border-color: #d1d5db;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) .card {
    /* Respetar el modo oscuro cuando es auto y el sistema prefiere oscuro */
    background: var(--color-background-card);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-md);
  }
  
  :root:not([data-theme]) .card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
}

.card-content {
  padding: 1.5rem;
}

.song-header {
  margin-bottom: 1rem;
}

.song-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.artist {
  font-size: 1rem;
  color: var(--color-text-soft);
  margin: 0 0 0.25rem 0;
  font-weight: 500;
}

/* Mejoras de color para modo claro */
:root:not([data-theme="dark"]) .artist,
:root[data-theme="light"] .artist {
  color: #475569;
  font-weight: 600;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) .artist {
    color: var(--color-text-soft);
    font-weight: 500;
  }
}

.subtitle {
  font-size: 0.875rem;
  color: var(--color-text-mute);
  margin: 0 0 0.5rem 0;
  font-style: italic;
}

.song-metadata {
  margin-bottom: 1rem;
}

.metadata-item {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
}

.metadata-value {
  color: var(--color-text-mute);
  font-weight: 400;
  font-size: 0.75rem;
}

/* Mejoras de metadatos para modo claro */
:root:not([data-theme="dark"]) .metadata-value,
:root[data-theme="light"] .metadata-value {
  color: #64748b;
  font-weight: 500;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) .metadata-value {
    color: var(--color-text-mute);
    font-weight: 400;
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  background: var(--color-background-soft);
  color: var(--color-text-soft);
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.8rem;
  border: 1px solid var(--color-border);
}

/* Mejoras de etiquetas para modo claro */
:root:not([data-theme="dark"]) .tag,
:root[data-theme="light"] .tag {
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
  color: #475569;
  border: 1px solid #e2e8f0;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) .tag {
    background: var(--color-background-soft);
    color: var(--color-text-soft);
    border: 1px solid var(--color-border);
    font-weight: 400;
    box-shadow: none;
  }
}

/* Resources Dropdown */
.resources-dropdown {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.resources-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.resources-toggle:hover {
  background: var(--color-background-hover);
  border-color: var(--color-border-hover);
}

.resources-toggle.active {
  background: var(--color-background-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.three-dots {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-text-soft);
  line-height: 1;
}

.resources-toggle.active .three-dots {
  color: var(--color-text-inverse);
}

.resources-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  z-index: 10;
  margin-top: 0.25rem;
  overflow: hidden;
  min-width: 180px;
}

.resource-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  background: var(--color-background-card);
  border: none;
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-normal);
  font-size: 0.875rem;
  color: var(--color-text);
}

.resource-menu-item:hover {
  background: var(--color-background-hover);
  color: var(--color-text);
}

.resource-menu-item:not(:last-child) {
  border-bottom: 1px solid var(--color-border);
}

.resource-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.resource-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* News Section */
.news-section {
  padding: 4rem 2rem;
  background: var(--color-background-soft);
}

.news-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
  max-width: 1400px;
  margin: 0 auto;
}

.news-card {
  background: var(--color-background-card);
  padding: 2rem;
  border-radius: 10px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  width: 350px;
  height: auto;
  transition: all var(--transition-normal);
}

.news-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.news-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.news-type {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  font-size: 1rem;
  font-weight: bold;
}

.news-type svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.news-date {
  color: var(--color-accent);
  font-size: 0.9rem;
  font-weight: 500;
}

.news-card h3 {
  color: var(--color-heading);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

.news-card p {
  color: var(--color-text-soft);
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
}


.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--color-heading);
  display: block;
}

.stat-label {
  color: var(--color-text-soft);
  font-size: 1.1rem;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* Loading Styles */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-text-soft);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  color: var(--color-text-soft);
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .hero-section {
    min-height: 50vh;
    padding: 2rem 1rem;
  }
  
  .logo-text {
    font-size: 2rem;
  }
  
  .music-note {
    font-size: 3rem;
  }
  
  .hero-logo {
    margin-bottom: 2rem;
  }
  
  .hero-stats {
    gap: 2rem;
  }
  
  .hero-stats .stat-number {
    font-size: 2rem;
  }
  
  .hero-stats .stat-label {
    font-size: 0.8rem;
  }
  
  .cta-button {
    padding: 0.8rem 2rem;
    font-size: 0.9rem;
  }
  
  .note {
    font-size: 1.5rem;
  }
  
  /* Optimización de cards para móviles */
  .cards-container {
    gap: 1rem;
    padding: 0.5rem;
  }
  
  .card {
    width: 100%;
    max-width: none;
    flex: 1 1 100%;
    min-width: 280px;
  }
  
  .card-content {
    padding: 1.25rem;
  }
  
  .song-header h3 {
    font-size: 1.1rem;
    line-height: 1.3;
  }
  
  .song-header .artist {
    font-size: 0.9rem;
  }
  
  .song-header .subtitle {
    font-size: 0.8rem;
  }
  
  .tags {
    gap: 0.4rem;
  }
  
  .tag {
    font-size: 0.75rem;
    padding: 0.3rem 0.6rem;
  }
  
}

/* Media query para pantallas muy pequeñas */
@media (max-width: 480px) {
  .cards-container {
    gap: 0.75rem;
    padding: 0rem;
  }
  
  .card {
    min-width: 260px;
  }
  
  .card-content {
    padding: 1rem;
  }
  
  .song-header h3 {
    font-size: 1rem;
  }
  
  .song-header .artist {
    font-size: 0.85rem;
  }
  
  .song-header .subtitle {
    font-size: 0.75rem;
  }
  
  .tags {
    gap: 0.3rem;
  }
  
  .tag {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
  }
  
  .metadata-item {
    font-size: 0.75rem;
  }
}

/* Expand Section */
.expand-section {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  color: var(--color-text-soft);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.expand-btn:hover {
  background: var(--color-background-hover);
  border-color: var(--color-accent);
  color: var(--color-text);
}

.expand-btn svg {
  transition: transform var(--transition-normal);
}

.expand-btn svg.rotated {
  transform: rotate(180deg);
}
</style>