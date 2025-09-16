<template>
  <div class="song-detail-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Cargando canción...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Error al cargar la canción</h3>
      <p>{{ error }}</p>
      <button @click="retryLoad" class="retry-btn">Reintentar</button>
    </div>

    <!-- Song Not Found -->
    <div v-else-if="!cancion" class="not-found-state">
      <div class="not-found-icon">🎵</div>
      <h3>Canción no encontrada</h3>
      <p>La canción que buscas no existe o ha sido eliminada.</p>
      <router-link to="/canciones" class="back-btn">Volver a Canciones</router-link>
    </div>

    <!-- Main Song View -->
    <div v-else class="song-view" :class="{ 'karaoke-active': karaokeMode }">
      <!-- Header Section -->
      <header v-if="!karaokeMode" class="song-header">
        <div class="song-info">
          <h1 class="song-title">{{ cancion.title }}</h1>
          <p class="song-artist">{{ cancion.artist }}</p>
          <p v-if="cancion.subtitle" class="song-subtitle">{{ cancion.subtitle }}</p>
          
          <div class="song-meta">
            <div class="meta-tags">
              <span v-for="tag in cancion.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <div class="meta-info">
              <span v-if="cancion.bpm" class="bpm">BPM: {{ cancion.bpm }}</span>
              <span v-if="cancion.tempo" class="tempo">{{ cancion.tempo }}</span>
            </div>
          </div>
        </div>

        <div class="song-actions">
          <button @click="toggleFullscreen" class="action-btn fullscreen-btn" title="Pantalla completa">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          </button>
          <button @click="toggleChords" class="action-btn chords-btn" :class="{ active: showChords }" title="Mostrar acordes">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
            </svg>
          </button>
          <button @click="toggleKaraoke" class="action-btn karaoke-btn" :class="{ active: karaokeMode }" title="Modo karaoke">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- Karaoke Header (only in karaoke mode) -->
      <header v-if="karaokeMode" class="karaoke-header">
        <div class="karaoke-song-info">
          <h2 class="karaoke-title">{{ cancion.title }}</h2>
          <p class="karaoke-artist">{{ cancion.artist }}</p>
        </div>
        <div class="karaoke-actions">
          <button @click="toggleKaraoke" class="action-btn karaoke-btn active" title="Salir del modo karaoke">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- Karaoke Progress Bar (fixed below header) -->
      <div v-if="karaokeMode" class="karaoke-progress-fixed">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${((currentVerse + 1) / verses.length) * 100}%` }"
          ></div>
        </div>
        <div class="progress-text">
          {{ currentVerse + 1 }} de {{ verses.length }} versos
        </div>
      </div>

      <!-- Lyrics Section -->
      <main class="lyrics-section">
        <div v-if="loadingLyrics" class="lyrics-loading">
          <div class="loading-spinner"></div>
          <p>Cargando letra...</p>
        </div>

        <div v-else-if="lyricsError" class="lyrics-error">
          <div class="error-icon">⚠️</div>
          <h3>Error al cargar la letra</h3>
          <p>{{ lyricsError }}</p>
          <button @click="retryLyrics" class="retry-btn">Reintentar</button>
        </div>

        <div v-else-if="!lyrics" class="lyrics-placeholder">
          <div class="placeholder-icon">📝</div>
          <h3>Letra no disponible</h3>
          <p>Esta canción no tiene letra disponible aún.</p>
        </div>

        <div v-else class="lyrics-container" :class="{ 'karaoke-mode': karaokeMode, 'fullscreen': isFullscreen }">
          <!-- Lyrics Content -->
          <div class="lyrics-content">
            <div v-if="karaokeMode" class="karaoke-lyrics">
              <div 
                v-for="(verse, index) in verses" 
                :key="index"
                class="verse"
                :class="{ 
                  'active': index === currentVerse,
                  'completed': index < currentVerse,
                  'upcoming': index > currentVerse
                }"
                @click="goToVerse(index)"
              >
                <div class="verse-content">{{ verse }}</div>
                <div class="verse-number">{{ index + 1 }}</div>
              </div>
            </div>
            <div v-else class="normal-lyrics">
              <pre>{{ lyrics }}</pre>
            </div>
          </div>
        </div>
      </main>

      <!-- Minimalist Karaoke Controls - Floating outside container -->
      <div v-if="karaokeMode" class="minimal-karaoke-controls">
        <button @click="resetKaraoke" class="minimal-btn reset-btn" title="Reiniciar">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M1 4v6h6M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
        </button>
        
        <button @click="previousVerse" class="minimal-btn prev-btn" :disabled="currentVerse === 0" title="Anterior">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        
        <button @click="nextVerse" class="minimal-btn next-btn" :disabled="currentVerse >= verses.length - 1" title="Siguiente">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      <!-- Chords Section -->
      <aside v-if="showChords" class="chords-section">
        <div class="chords-header">
          <h3>Acordes</h3>
          <button @click="toggleChords" class="close-btn">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="chords-content">
          <div class="chord-diagram">
            <div class="chord-placeholder">
              <div class="placeholder-icon">🎸</div>
              <p>Los acordes se mostrarán aquí</p>
              <small>Funcionalidad en desarrollo</small>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCancionesStore } from '../stores/canciones'
import { Cancion } from '@/types/songTypes'

const route = useRoute()
const cancionesStore = useCancionesStore()

// Song data
const cancion = ref<Cancion | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Lyrics data
const lyrics = ref<string | null>(null)
const loadingLyrics = ref(false)
const lyricsError = ref<string | null>(null)

// UI states
const showChords = ref(false)
const karaokeMode = ref(false)
const isFullscreen = ref(false)
const currentVerse = ref(0)

// Computed
const verses = computed(() => {
  if (!lyrics.value) return []
  return lyrics.value
    .split('\n\n')
    .filter(verse => verse.trim().length > 0)
    .map(verse => verse.trim())
})

// Methods
async function loadSong() {
  loading.value = true
  error.value = null
  
  try {
    const songId = route.params.id as string
    const foundSong = await cancionesStore.getCancionById(songId)
    cancion.value = foundSong
    
    if (foundSong) {
      await loadLyrics(songId)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al cargar la canción'
    console.error('Error loading song:', err)
  } finally {
    loading.value = false
  }
}

async function loadLyrics(songId: string) {
  loadingLyrics.value = true
  lyricsError.value = null
  
  try {
    const lyricsText = await cancionesStore.getSongLyrics(songId)
    lyrics.value = lyricsText
  } catch (err) {
    lyricsError.value = err instanceof Error ? err.message : 'Error al cargar la letra'
    console.error('Error loading lyrics:', err)
  } finally {
    loadingLyrics.value = false
  }
}

function retryLoad() {
  loadSong()
}

function retryLyrics() {
  if (cancion.value) {
    loadLyrics(cancion.value.id)
  }
}

function toggleChords() {
  showChords.value = !showChords.value
}

function toggleKaraoke() {
  karaokeMode.value = !karaokeMode.value
  if (karaokeMode.value) {
    currentVerse.value = 0
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function nextVerse() {
  if (currentVerse.value < verses.value.length - 1) {
    currentVerse.value++
    scrollToActiveVerse()
  }
}

function previousVerse() {
  if (currentVerse.value > 0) {
    currentVerse.value--
    scrollToActiveVerse()
  }
}

function scrollToActiveVerse() {
  // Wait for DOM update, then scroll to active verse
  setTimeout(() => {
    const activeVerse = document.querySelector('.verse.active')
    if (activeVerse) {
      activeVerse.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
    }
  }, 100)
}

function resetKaraoke() {
  currentVerse.value = 0
  scrollToActiveVerse()
}

function goToVerse(index: number) {
  if (index >= 0 && index < verses.value.length) {
    currentVerse.value = index
    scrollToActiveVerse()
  }
}

// Keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  if (!karaokeMode.value) return
  
  switch (event.key) {
    case 'ArrowRight':
    case ' ':
      event.preventDefault()
      nextVerse()
      break
    case 'ArrowLeft':
      event.preventDefault()
      previousVerse()
      break
    case 'Home':
      event.preventDefault()
      resetKaraoke()
      break
  }
}

// Fullscreen change handler
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  loadSong()
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
.song-detail-container {
  min-height: 100vh;
  background: var(--color-background);
  display: flex;
  flex-direction: column;
}

/* Loading & Error States */
.loading-state, .error-state, .not-found-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
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

.error-icon, .not-found-icon, .placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn, .back-btn {
  background: var(--cf-navy);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 1rem;
  transition: background 0.2s ease;
}

.retry-btn:hover, .back-btn:hover {
  background: var(--cf-navy-dark);
}

/* Main Song View */
.song-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 1rem;
}

.song-view.karaoke-active {
  max-width: none;
  padding: 0;
}

/* Karaoke Header */
.karaoke-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
}

.karaoke-song-info {
  flex: 1;
}

.karaoke-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

.karaoke-artist {
  font-size: 1rem;
  color: var(--cf-gold);
  margin: 0;
  font-weight: 500;
}

.karaoke-actions {
  display: flex;
  gap: 0.5rem;
}

/* Karaoke Progress Bar - Fixed below header */
.karaoke-progress-fixed {
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 2rem;
  position: sticky;
  top: 80px; /* Debajo del header (altura aproximada del header) */
  z-index: 100;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
}

/* En pantallas grandes, respetar el sidebar */
@media (min-width: 1024px) {
  .karaoke-progress-fixed {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    position: static;
  }
}

/* Header */
.song-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
}

.song-info {
  flex: 1;
}

.song-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--cf-navy);
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.song-artist {
  font-size: 1.5rem;
  color: var(--cf-gold);
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.song-subtitle {
  font-size: 1.1rem;
  color: var(--cf-navy-light);
  margin: 0 0 1rem 0;
  font-style: italic;
}

.song-meta {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: var(--cf-gold);
  color: var(--cf-navy);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.meta-info {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.bpm, .tempo {
  background: var(--color-background-soft);
  color: var(--cf-navy);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid var(--color-border);
}

.song-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cf-navy);
}

.action-btn:hover {
  background: var(--cf-gold);
  color: var(--cf-navy);
  transform: translateY(-1px);
}

.action-btn.active {
  background: var(--cf-gold);
  color: var(--cf-navy);
}

/* Lyrics Section */
.lyrics-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.lyrics-container {
  flex: 1;
  background: white;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  transition: all 0.3s ease;
}

.lyrics-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  border-radius: 0;
  border: none;
}

.lyrics-container.karaoke-mode {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  min-height: 100vh;
  margin: -1rem;
  border-radius: 0;
  border: none;
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
}

/* En pantallas grandes, usar ancho normal para respetar el sidebar */
@media (min-width: 1024px) {
  .lyrics-container.karaoke-mode {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    left: auto;
    right: auto;
    position: static;
  }
  
  .karaoke-header {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    left: auto;
    right: auto;
    position: static;
  }
}

/* Minimalist Karaoke Controls - No container, just floating buttons */
.minimal-karaoke-controls {
  position: fixed;
  bottom: 150px;
  right: 25px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.minimal-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.minimal-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.minimal-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.minimal-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

/* Karaoke Progress */
.karaoke-progress {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cf-gold), #ffd700);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.control-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 0.75rem;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  min-height: 48px;
  font-weight: 500;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.control-btn:active:not(:disabled) {
  transform: translateY(0);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.verse-indicator {
  background: rgba(255, 255, 255, 0.15);
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 80px;
  text-align: center;
}

/* Lyrics Content */
.lyrics-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.karaoke-lyrics {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.verse {
  padding: 2rem 1.5rem;
  border-radius: 16px;
  transition: all 0.4s ease;
  opacity: 0.8;
  transform: scale(0.95);
  margin-bottom: 1rem;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  user-select: none;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.verse:hover {
  opacity: 0.9;
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.08);
}

.verse.active {
  opacity: 1;
  transform: scale(1.02);
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid var(--cf-gold);
  box-shadow: 0 8px 32px rgba(255, 193, 7, 0.2);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 8px 32px rgba(255, 193, 7, 0.2);
  }
  50% {
    box-shadow: 0 12px 40px rgba(255, 193, 7, 0.3);
  }
}

.verse.completed {
  opacity: 0.7;
  background: rgba(255, 255, 255, 0.08);
  transform: scale(0.98);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.verse.upcoming {
  opacity: 0.6;
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.verse-content {
  font-size: 1.2rem;
  line-height: 1.6;
  text-align: center;
  white-space: pre-line;
  flex: 1;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.verse-number {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.9;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.verse:hover .verse-number {
  opacity: 1;
  background: rgba(255, 255, 255, 0.35);
}

.verse.active .verse-number {
  background: var(--cf-gold);
  color: var(--cf-navy);
  opacity: 1;
  font-weight: 700;
  border: 1px solid var(--cf-gold);
}

.normal-lyrics pre {
  font-family: inherit;
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--cf-navy);
  white-space: pre-wrap;
  margin: 0;
}

/* Chords Section */
.chords-section {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: white;
  border-left: 1px solid var(--color-border);
  z-index: 999;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.chords-section.show {
  transform: translateX(0);
}

.chords-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.chords-header h3 {
  margin: 0;
  color: var(--cf-navy);
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  color: var(--cf-navy-light);
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--color-background-soft);
  color: var(--cf-navy);
}

.chords-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.chord-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: var(--cf-navy-light);
}

.chord-placeholder .placeholder-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .song-view {
    padding: 1rem;
  }
  
  .song-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .song-title {
    font-size: 2rem;
  }
  
  .song-artist {
    font-size: 1.2rem;
  }
  
  .song-actions {
    align-self: stretch;
    justify-content: center;
  }
  
  .lyrics-content {
    padding: 1rem 1.5rem 1rem 1rem;
  }
  
  .verse-content {
    font-size: 1.1rem;
  }
  
  .chords-section {
    width: 100%;
  }
  
  .karaoke-controls {
    padding: 0.75rem;
    gap: 0.25rem;
  }
  
  .control-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0.5rem;
  }
  
  .verse-indicator {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    min-width: 70px;
  }
  
  .verse {
    padding: 1.5rem 1rem;
    min-height: 100px;
  }
  
  .verse-content {
    font-size: 1.1rem;
  }
  
  /* Minimalist controls mobile adjustments */
  .karaoke-header {
    padding: 0.75rem 1rem;
    margin-left: calc(-50vw + 50%);
    margin-right: calc(-50vw + 50%);
  }
  
  .karaoke-progress-fixed {
    padding: 0.75rem 1rem;
    margin-left: calc(-50vw + 50%);
    margin-right: calc(-50vw + 50%);
    top: 60px; /* Altura menor en móviles */
  }
  
  .karaoke-title {
    font-size: 1.2rem;
  }
  
  .karaoke-artist {
    font-size: 0.9rem;
  }
  
  .minimal-karaoke-controls {
    bottom: 100px;
    right: 10px;
    gap: 0.4rem;
  }
  
  .minimal-btn {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 480px) {
  .song-title {
    font-size: 1.5rem;
  }
  
  .song-artist {
    font-size: 1rem;
  }
  
  .verse-content {
    font-size: 1rem;
  }
  
  .normal-lyrics pre {
  font-size: 1rem;
  }
  
  /* Extra small screens */
  .minimal-karaoke-controls {
    bottom: 90px;
    right: 15px;
    gap: 0.3rem;
  }
  
  .minimal-btn {
    width: 32px;
    height: 32px;
  }
}
</style> 