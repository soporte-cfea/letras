<template>
  <section class="home-view">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <!-- Logo/Icono -->
        <div class="hero-logo">
          <div class="logo-container">
            <div class="music-note">♪</div>
            <div class="logo-text">Letras</div>
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
            <span class="stat-label">Géneros</span>
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
    
    // Animar contadores
    animateCounters()
    
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
  min-height: 60vh;
  background: linear-gradient(135deg, var(--cf-navy) 0%, #1a365d 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 3rem 2rem;
  overflow: hidden;
  border-radius: 0 0 2rem 2rem;
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
  color: var(--cf-gold);
  animation: float 3s ease-in-out infinite;
}

.logo-text {
  font-size: 3rem;
  font-weight: 300;
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
  color: var(--cf-gold);
  margin-bottom: 0.3rem;
}

.hero-stats .stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.9);
}

/* Call to Action */
.hero-cta {
  animation: fadeInUp 1s ease-out 0.6s both;
}

.cta-button {
  background: transparent;
  color: white;
  border: 2px solid var(--cf-gold);
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
  background: var(--cf-gold);
  color: var(--cf-navy);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(212, 165, 116, 0.3);
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
  .hero-section {
    min-height: 50vh;
    padding: 2rem 1rem;
    border-radius: 0 0 1.5rem 1.5rem;
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
  
  .stats-section {
    grid-template-columns: 1fr;
  }
}
</style>