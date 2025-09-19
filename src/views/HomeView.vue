<template>
  <section class="home-view">
    <!-- Hero Section -->
    <div class="hero-section">
      <h1 class="animated-title">Música para tu Alma</h1>
      <p class="subtitle">Descubre, comparte y vive la música a través de sus letras</p>
      <div class="wave-animation"></div>
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
        <h2>Agregadas recientemente</h2>
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
              <span v-for="tag in song.tags" :key="tag" class="tag">{{ tag }}</span>
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
                  <span class="resource-icon">{{ getResourceIcon(resource.type) }}</span>
                  <span class="resource-name">{{ getResourceName(resource.type) }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- News Section -->
    <div class="news-section">
      <h2>Últimas Actualizaciones</h2>
      <div class="news-grid">
        <article v-for="(news, index) in latestNews" :key="index" class="news-card">
          <span class="news-date">{{ news.date }}</span>
          <h3>{{ news.title }}</h3>
          <p>{{ news.excerpt }}</p>
        </article>
      </div>
    </div>

    <!-- Stats Section -->
    <div class="stats-section">
      <div class="stat-item">
        <span class="stat-number">{{ stats.songs }}+</span>
        <span class="stat-label">Canciones</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ stats.artists }}+</span>
        <span class="stat-label">Artistas</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ stats.users }}+</span>
        <span class="stat-label">Usuarios</span>
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
import { useNotifications } from '@/composables/useNotifications'
import ResourcePreviewModal from '@/components/ResourcePreviewModal.vue'
import type { SongResource } from '@/types/songTypes'

const router = useRouter()
const cancionesStore = useCancionesStore()
const { success, error } = useNotifications()

const featuredSongs = ref([])
const latestNews = ref([])
const stats = ref({
  songs: 0,
  artists: 0,
  users: 0
})

const loading = ref(true)
const showPreviewModal = ref(false)
const selectedResource = ref<SongResource | null>(null)
const openDropdownIndex = ref<number | null>(null)

// Función para navegar a la canción
function goToSong(songId: string) {
  // Crear un slug básico del título para la URL
  const song = featuredSongs.value.find(s => s.id === songId)
  const slug = song ? song.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'cancion'
  router.push(`/cancion/${songId}-${slug}`)
}

// Función para obtener el icono del recurso
function getResourceIcon(type: string): string {
  const icons: Record<string, string> = {
    'spotify': '🎵',
    'youtube': '📺',
    'facebook': '📘',
    'instagram': '📷',
    'apple-music': '🍎',
    'image': '🖼️',
    'video': '🎬',
    'audio': '🎧',
    'other': '🔗'
  }
  return icons[type] || '🔗'
}

// Función para obtener el nombre del recurso
function getResourceName(type: string): string {
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
  return names[type] || 'Otro'
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

// Cargar datos reales
async function loadHomeData() {
  try {
    loading.value = true
    
    // Cargar canciones destacadas (las 3 más recientes)
    await cancionesStore.loadCanciones()
    featuredSongs.value = cancionesStore.canciones.slice(0, 3).map(cancion => ({
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
    
    // Calcular estadísticas reales
    const canciones = cancionesStore.canciones
    const uniqueArtists = new Set(canciones.map(c => c.artist))
    
    stats.value = {
      songs: canciones.length,
      artists: uniqueArtists.size,
      users: Math.floor(canciones.length * 0.1) // Estimación basada en canciones
    }
    
    // Noticias estáticas por ahora (se pueden conectar a Supabase después)
    latestNews.value = [
      {
        date: new Date().toISOString().split('T')[0],
        title: "Nueva Funcionalidad de Búsqueda",
        excerpt: "Ahora puedes buscar por acordes y tonalidad"
      },
      {
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        title: "Colaboración con Artistas Locales",
        excerpt: `Más de ${canciones.length} canciones agregadas`
      }
    ]
    
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
  padding: 0 0 80px 0;
  background: var(--color-background);
  overflow: hidden;
}

/* Hero Section */
.hero-section {
  height: 60vh;
  min-height: 400px;
  background: linear-gradient(135deg, var(--cf-navy) 0%, #1a365d 100%);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
  padding: 2rem;
}

.animated-title {
  font-size: 3rem;
  font-weight: bold;
  animation: fadeInUp 1s ease-out;
}

.subtitle {
  font-size: 1.2rem;
  margin-top: 1rem;
  opacity: 0;
  animation: fadeInUp 1s ease-out 0.5s forwards;
}

.wave-animation {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E");
  background-size: cover;
}

/* Featured Section */
.featured-section {
  padding: 4rem 2rem;
}

h2 {
  font-size: 2rem;
  color: var(--cf-navy);
  text-align: center;
  margin-bottom: 2rem;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 1rem;
  justify-content: center;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
  width: 320px;
  height: auto;
  border: 1px solid #e5e7eb;
  position: relative;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
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
  color: var(--cf-navy);
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.artist {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
  font-weight: 500;
}

.subtitle {
  font-size: 0.875rem;
  color: #9ca3af;
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
  color: #9ca3af;
  font-weight: 400;
  font-size: 0.75rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  background: var(--cf-gold);
  color: var(--cf-navy);
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.8rem;
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
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.resources-toggle:hover {
  background: #f8fafc;
  border-color: var(--cf-navy);
}

.resources-toggle.active {
  background: var(--cf-navy);
  border-color: var(--cf-navy);
  color: white;
}

.three-dots {
  font-size: 1.2rem;
  font-weight: bold;
  color: #6b7280;
  line-height: 1;
}

.resources-toggle.active .three-dots {
  color: white;
}

.resources-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
  background: white;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  color: var(--cf-navy);
}

.resource-menu-item:hover {
  background: #f8fafc;
  color: var(--cf-navy);
}

.resource-menu-item:not(:last-child) {
  border-bottom: 1px solid #f1f5f9;
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
  background: #f8fafc;
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
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  width: 350px;
  height: auto;
}

.news-date {
  color: var(--cf-gold);
  font-size: 0.9rem;
}

/* Stats Section */
.stats-section {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 4rem 2rem;
  text-align: center;
  justify-content: center;
  max-width: 1400px;
  margin: 0 auto;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--cf-navy);
  display: block;
}

.stat-label {
  color: var(--cf-navy-light);
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
  border-top: 4px solid var(--cf-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  color: var(--cf-navy-light);
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .animated-title {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .stats-section {
    grid-template-columns: 1fr;
  }
}
</style>