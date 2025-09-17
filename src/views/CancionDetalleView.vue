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
      <!-- Compact Header -->
      <header v-if="!karaokeMode" class="song-header">
        <div class="song-info">
          <h1 class="song-title">{{ cancion.title }}</h1>
          <p class="song-artist">{{ cancion.artist }}</p>
          <div class="song-meta">
            <span v-if="cancion.bpm" class="meta-item">BPM: {{ cancion.bpm }}</span>
            <span v-if="cancion.tempo" class="meta-item">{{ cancion.tempo }}</span>
            <span v-for="tag in cancion.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>

        <!-- Actions Menu -->
        <div class="actions-menu">
          <button @click="toggleActionsMenu" class="menu-toggle" :class="{ active: showActionsMenu }">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
            </svg>
          </button>
          
          <!-- Actions Dropdown -->
          <div v-if="showActionsMenu" class="actions-dropdown">
            <button @click="editSong" class="action-item">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Editar
            </button>
            <button @click="deleteSong" class="action-item danger">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Eliminar
            </button>
            <hr class="divider">
            <button @click="toggleKaraoke" class="action-item">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
              Modo karaoke
            </button>
          </div>
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

        <div v-else class="lyrics-container" :class="{ 'karaoke-mode': karaokeMode }">
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

    </div>

    <!-- Edit Song Modal -->
    <Modal :show="showEditModal" @close="closeEditModal">
      <h3 class="text-lg font-bold text-blue-900 mb-4">Editar canción</h3>
      <form @submit.prevent="updateSong" class="flex flex-col gap-3">
        <input
          v-model="editForm.title"
          type="text"
          placeholder="Título *"
          class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
          required
        />
        <input
          v-model="editForm.artist"
          type="text"
          placeholder="Artista *"
          class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
          required
        />
        <textarea
          v-model="editForm.lyrics"
          placeholder="Letra"
          rows="4"
          class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base resize-none"
        ></textarea>
        <input
          v-model="editForm.tags"
          type="text"
          placeholder="Tags (separados por coma)"
          class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
        />
        <div class="flex gap-2 mt-2">
          <button
            type="submit"
            class="flex-1 bg-blue-900 text-white rounded py-2 font-semibold hover:bg-blue-800 transition"
          >
            Actualizar
          </button>
          <button
            type="button"
            @click="closeEditModal"
            class="flex-1 bg-gray-200 text-gray-700 rounded py-2 font-semibold hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Eliminar canción"
      :message="`¿Estás seguro de que quieres eliminar la canción '${cancion?.title}'? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCancionesStore } from '../stores/canciones'
import { useNotifications } from '@/composables/useNotifications'
import Modal from '../components/Modal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import { Cancion } from '@/types/songTypes'

const route = useRoute()
const router = useRouter()
const cancionesStore = useCancionesStore()
const { success, error: showError } = useNotifications()

// Song data
const cancion = ref<Cancion | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Lyrics data
const lyrics = ref<string | null>(null)
const loadingLyrics = ref(false)
const lyricsError = ref<string | null>(null)

// UI states
const karaokeMode = ref(false)
const currentVerse = ref(0)
const showActionsMenu = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)

// Edit form
const editForm = ref({
  title: '',
  artist: '',
  lyrics: '',
  tags: ''
})

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

function toggleActionsMenu() {
  showActionsMenu.value = !showActionsMenu.value
}

function toggleKaraoke() {
  karaokeMode.value = !karaokeMode.value
  showActionsMenu.value = false
  if (karaokeMode.value) {
    currentVerse.value = 0
  }
}

function editSong() {
  if (!cancion.value) return
  
  editForm.value = {
    title: cancion.value.title || '',
    artist: cancion.value.artist || '',
    lyrics: lyrics.value || '',
    tags: cancion.value.tags ? cancion.value.tags.join(', ') : ''
  }
  showEditModal.value = true
  showActionsMenu.value = false
}

function deleteSong() {
  showDeleteModal.value = true
  showActionsMenu.value = false
}

async function updateSong() {
  if (!cancion.value) return

  try {
    const updates = {
      title: editForm.value.title.trim(),
      artist: editForm.value.artist.trim(),
      tags: editForm.value.tags.split(',').map(t => t.trim()).filter(Boolean)
    }

    await cancionesStore.updateCancion(cancion.value.id, updates)
    
    // Update lyrics if provided
    if (editForm.value.lyrics.trim()) {
      try {
        await cancionesStore.createSongLyrics(
          cancion.value.id, 
          editForm.value.lyrics.trim(),
          `Letra de ${updates.title}`
        )
        lyrics.value = editForm.value.lyrics.trim()
      } catch (lyricsErr) {
        console.error('Error al actualizar la letra:', lyricsErr)
        showError('Error', 'Canción actualizada pero no se pudo guardar la letra')
      }
    }
    
    // Update local song data
    cancion.value = { ...cancion.value, ...updates }
    
    success('Éxito', `Canción "${updates.title}" actualizada correctamente`)
    closeEditModal()
  } catch (err) {
    console.error('Error al actualizar canción:', err)
    showError('Error', 'No se pudo actualizar la canción. Inténtalo de nuevo.')
  }
}

async function confirmDelete() {
  if (!cancion.value) return

  try {
    await cancionesStore.deleteCancion(cancion.value.id)
    success('Éxito', `Canción "${cancion.value.title}" eliminada correctamente`)
    router.push('/canciones')
  } catch (err) {
    console.error('Error al eliminar canción:', err)
    showError('Error', 'No se pudo eliminar la canción. Inténtalo de nuevo.')
  }
}

function closeEditModal() {
  showEditModal.value = false
  editForm.value = { title: '', artist: '', lyrics: '', tags: '' }
}

function cancelDelete() {
  showDeleteModal.value = false
}

// Karaoke functions
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


// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.actions-menu')) {
    showActionsMenu.value = false
  }
}

onMounted(() => {
  loadSong()
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
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

/* Compact Header */
.song-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--cf-navy);
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

.song-artist {
  font-size: 1.1rem;
  color: var(--cf-gold);
  margin: 0 0 0.75rem 0;
  font-weight: 500;
}

.song-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.meta-item {
  background: var(--color-background-soft);
  color: var(--cf-navy);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid var(--color-border);
}

.tag {
  background: var(--cf-gold);
  color: var(--cf-navy);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Actions Menu */
.actions-menu {
  position: relative;
  flex-shrink: 0;
}

.menu-toggle {
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
  width: 44px;
  height: 44px;
}

.menu-toggle:hover {
  background: var(--cf-gold);
  color: var(--cf-navy);
  transform: translateY(-1px);
}

.menu-toggle.active {
  background: var(--cf-gold);
  color: var(--cf-navy);
}

.actions-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 180px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.action-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--cf-navy);
  transition: background 0.2s ease;
  text-align: left;
}

.action-item:hover {
  background: var(--color-background-soft);
}

.action-item.danger {
  color: #dc2626;
}

.action-item.danger:hover {
  background: #fef2f2;
}

.divider {
  margin: 0;
  border: none;
  border-top: 1px solid var(--color-border);
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

.action-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.action-btn.active {
  background: var(--cf-gold);
  color: var(--cf-navy);
}

/* Karaoke Progress Bar */
.karaoke-progress-fixed {
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 2rem;
  position: sticky;
  top: 80px;
  z-index: 100;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
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
  
  .karaoke-progress-fixed {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    position: static;
  }
}

/* Minimalist Karaoke Controls */
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


/* Responsive */
@media (max-width: 768px) {
  .song-view {
    padding: 0.75rem;
  }
  
  .song-header {
    flex-direction: row;
    gap: 1rem;
    margin-bottom: 1rem;
    align-items: flex-start;
  }
  
  .song-title {
    font-size: 1.5rem;
  }
  
  .song-artist {
    font-size: 1rem;
  }
  
  .actions-menu {
    flex-shrink: 0;
    margin-top: 0.25rem;
  }
  
  .menu-toggle {
    width: 40px;
    height: 40px;
    padding: 0.5rem;
  }
  
  .actions-dropdown {
    right: 0;
    left: auto;
    min-width: 160px;
  }
  
  .lyrics-content {
    padding: 1rem 1.5rem 1rem 1rem;
  }
  
  .verse-content {
    font-size: 1.1rem;
  }
  
  
  .karaoke-header {
    padding: 0.75rem 1rem;
    margin-left: calc(-50vw + 50%);
    margin-right: calc(-50vw + 50%);
  }
  
  .karaoke-progress-fixed {
    padding: 0.75rem 1rem;
    margin-left: calc(-50vw + 50%);
    margin-right: calc(-50vw + 50%);
    top: 60px;
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
    font-size: 1.3rem;
  }
  
  .song-artist {
    font-size: 0.9rem;
  }
  
  .verse-content {
    font-size: 1rem;
  }
  
  .normal-lyrics pre {
  font-size: 1rem;
  }
  
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