<template>
  <div 
    v-if="show && resource" 
    class="floating-player"
    :class="{ 'is-dragging': isDragging }"
    :style="{ 
      left: position.x + 'px', 
      top: position.y + 'px',
      zIndex: zIndex
    }"
    @mousedown="handleContainerMouseDown"
    @touchstart="handleContainerMouseDown"
  >
    <!-- Botón de cerrar flotante -->
    <button @click="closePlayer" class="floating-close-btn" title="Cerrar">
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>

    <!-- Contenido del reproductor -->
    <div class="player-content">
      <!-- YouTube Player -->
      <div v-if="resource.type === 'youtube'" class="youtube-player">
        <div v-if="!videoLoaded" class="youtube-thumbnail" @click="loadVideo">
          <img 
            :src="youtubeThumbnail" 
            :alt="`Thumbnail de ${youtubeTitle}`"
            class="thumbnail-image"
          />
          <div class="play-overlay">
            <div class="play-button">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div v-else class="youtube-embed">
          <iframe
            :src="youtubeEmbedUrl"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            class="youtube-iframe"
          ></iframe>
        </div>
      </div>

      <!-- Spotify Player -->
      <div v-else-if="resource.type === 'spotify'" class="spotify-player">
        <!-- Si tiene iframe, mostrar el reproductor -->
        <div v-if="resource.iframe && spotifyEmbedUrl" class="spotify-embed">
          <iframe
            :src="spotifyEmbedUrl"
            width="100%"
            height="152"
            frameborder="0"
            allowtransparency="true"
            allow="encrypted-media"
            class="spotify-iframe"
          ></iframe>
        </div>
        
        <!-- Si no tiene iframe, mostrar botón para abrir externamente -->
        <div v-else class="spotify-fallback">
          <div class="spotify-info">
            <div class="spotify-icon">🎵</div>
            <div class="spotify-details">
              <h4>Canción en Spotify</h4>
              <p>Haz click para abrir en Spotify</p>
            </div>
          </div>
          <button @click="openExternal" class="open-external-btn">
            Abrir en Spotify
          </button>
        </div>
      </div>

      <!-- Image Player -->
      <div v-else-if="resource.type === 'image'" class="image-player">
        <img 
          :src="resource.url" 
          :alt="'Imagen de la canción'"
          class="player-image"
          @error="handleImageError"
        />
      </div>

      <!-- Default Player -->
      <div v-else class="default-player">
        <div class="default-icon">{{ getResourceIcon(resource.type) }}</div>
        <h4>{{ getResourceTitle(resource.type) }}</h4>
        <p>Haz click para abrir el enlace</p>
        <button @click="openExternal" class="open-external-btn">
          Abrir Enlace
        </button>
      </div>
    </div>

    <!-- Indicador de arrastre -->
    <div 
      class="drag-indicator" 
      @mousedown.stop.prevent="startDrag" 
      @touchstart.stop.prevent="startDrag"
      @click.stop
    >
      <div class="drag-dots">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { SongResource } from '@/types/songTypes'

interface Props {
  show: boolean
  resource: SongResource | null
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Estado del reproductor
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const position = ref({ x: 20, y: 20 })
const zIndex = ref(1000)

// Estado del video
const videoLoaded = ref(false)
const imageError = ref(false)

// Extraer ID de YouTube de la URL
const youtubeId = computed(() => {
  if (!props.resource?.url) return null
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = props.resource.url.match(pattern)
    if (match) return match[1]
  }
  return null
})

// URL de miniatura de YouTube
const youtubeThumbnail = computed(() => {
  if (!youtubeId.value) return ''
  return `https://img.youtube.com/vi/${youtubeId.value}/maxresdefault.jpg`
})

// URL de embed de YouTube
const youtubeEmbedUrl = computed(() => {
  if (!youtubeId.value) return ''
  return `https://www.youtube.com/embed/${youtubeId.value}?autoplay=1`
})

// Información del video
const youtubeTitle = computed(() => {
  return 'Video de YouTube'
})

// Extraer URL de embed de Spotify del iframe
const spotifyEmbedUrl = computed(() => {
  if (!props.resource?.iframe) return null
  
  const srcMatch = props.resource.iframe.match(/src="([^"]+)"/)
  if (srcMatch) {
    return srcMatch[1]
  }
  
  const urlMatch = props.resource.iframe.match(/https:\/\/open\.spotify\.com\/embed\/[^"'\s]+/)
  if (urlMatch) {
    return urlMatch[0]
  }
  
  return null
})

// Funciones del reproductor
function closePlayer() {
  emit('close')
}

function openExternal() {
  if (props.resource?.url) {
    window.open(props.resource.url, '_blank', 'noopener,noreferrer')
  }
}

function loadVideo() {
  videoLoaded.value = true
}

function handleImageError() {
  imageError.value = true
}

// Función para manejar clics en el contenedor
function handleContainerMouseDown(event: MouseEvent | TouchEvent) {
  const target = event.target as HTMLElement
  
  // No arrastrar si se hace clic en:
  // - El botón de cerrar
  // - El indicador de arrastre (manejado por su propio evento)
  // - El contenido del video (iframe, thumbnail, etc.)
  // - El contenido de Spotify (iframe)
  // - Imágenes
  // - Botones
  if (
    target.closest('.floating-close-btn') ||
    target.closest('.drag-indicator') ||
    target.closest('iframe') ||
    target.closest('.youtube-thumbnail') ||
    target.closest('.youtube-embed') ||
    target.closest('.spotify-embed') ||
    target.closest('.spotify-iframe') ||
    target.closest('img') ||
    target.closest('button') ||
    target.closest('.player-content')
  ) {
    return // No iniciar arrastre
  }
  
  // Solo arrastrar desde áreas vacías (no desde el indicador)
  startDrag(event)
}

// Funciones de arrastre
function startDrag(event: MouseEvent | TouchEvent) {
  isDragging.value = true
  
  // Manejar tanto mouse como touch
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  // Calcular offset correctamente
  dragOffset.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y
  }
  
  // Agregar listeners para ambos tipos de eventos
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', handleDrag, { passive: false })
  document.addEventListener('touchend', stopDrag)
  
  event.preventDefault()
}

function handleDrag(event: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  
  // Manejar tanto mouse como touch
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  // Calcular nueva posición directamente sin límites
  const newX = clientX - dragOffset.value.x
  const newY = clientY - dragOffset.value.y
  
  // Aplicar posición directamente
  position.value = {
    x: newX,
    y: newY
  }
  
  // Prevenir scroll en móviles
  if ('touches' in event) {
    event.preventDefault()
  }
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDrag)
}

// Funciones de utilidad
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

function getResourceName(resource: SongResource): string {
  if (resource.label && resource.label.trim()) {
    return resource.label.trim()
  }
  
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

function getResourceTitle(type: string): string {
  const titles: Record<string, string> = {
    'spotify': 'Spotify',
    'youtube': 'YouTube',
    'facebook': 'Facebook',
    'instagram': 'Instagram',
    'apple-music': 'Apple Music',
    'image': 'Imagen',
    'video': 'Video',
    'audio': 'Audio',
    'other': 'Enlace'
  }
  return titles[type] || 'Recurso'
}

// Reset cuando se cierra el reproductor
watch(() => props.show, (newValue) => {
  if (!newValue) {
    videoLoaded.value = false
    imageError.value = false
  }
})
</script>

<style scoped>
.floating-player {
  position: fixed;
  background: transparent;
  border-radius: 12px;
  overflow: visible;
  transition: none; /* Sin transiciones durante el arrastre */
  cursor: move;
  user-select: none;
}

/* Botón de cerrar flotante */
.floating-close-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 1001;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.floating-close-btn:hover {
  background: rgba(239, 68, 68, 0.9);
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

/* Contenido */
.player-content {
  padding: 0;
  max-height: 400px;
  overflow: visible;
}

/* YouTube Player */
.youtube-player {
  width: 100%;
}

.youtube-thumbnail {
  position: relative;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.youtube-thumbnail:hover {
  transform: scale(1.02);
}

.thumbnail-image {
  width: 100%;
  height: auto;
  display: block;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.youtube-thumbnail:hover .play-overlay {
  background: rgba(0, 0, 0, 0.5);
}

.play-button {
  width: 50px;
  height: 50px;
  background: rgba(255, 0, 0, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.youtube-thumbnail:hover .play-button {
  transform: scale(1.1);
  background: rgba(255, 0, 0, 1);
}

.youtube-embed {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.youtube-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 12px;
}

/* Spotify Player */
.spotify-player {
  width: 100%;
}

.spotify-embed {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.spotify-iframe {
  border-radius: 12px;
}

.spotify-fallback {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.spotify-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.spotify-icon {
  font-size: 2rem;
}

.spotify-details h4 {
  font-size: 1rem;
  color: var(--cf-navy);
  margin: 0 0 0.25rem 0;
}

.spotify-details p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* Image Player */
.image-player {
  text-align: center;
}

.player-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Default Player */
.default-player {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.default-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.default-player h4 {
  font-size: 1.1rem;
  color: var(--cf-navy);
  margin: 0 0 0.5rem 0;
}

.default-player p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
}

/* Botones */
.open-external-btn {
  background: var(--cf-gold);
  color: var(--cf-navy);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.open-external-btn:hover {
  background: #d4a574;
  transform: translateY(-1px);
}

/* Indicador de arrastre */
.drag-indicator {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  opacity: 0.8;
  transition: all 0.2s ease;
  cursor: move;
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
  z-index: 1001;
}

.drag-indicator:hover {
  opacity: 0.9;
  background: rgba(0, 0, 0, 0.5);
  transform: scale(1.1);
}

.drag-dots {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3px;
  width: 16px;
  height: 16px;
}

.drag-dots span {
  width: 3px;
  height: 3px;
  background: var(--color-background-card);
  border-radius: 50%;
}

/* Clase para cuando se está arrastrando */
.floating-player.is-dragging {
  /* Sin transiciones durante el arrastre */
  transition: none !important;
  /* Sobrescribir estilos responsive cuando se está arrastrando */
  left: var(--drag-x, 0px) !important;
  top: var(--drag-y, 0px) !important;
  transform: none !important;
}

/* Transiciones suaves solo cuando NO se está arrastrando */
.floating-player:not(.is-dragging) {
  transition: all 0.2s ease;
}

/* Responsive */
@media (max-width: 640px) {
  .floating-player {
    /* Solo aplicar estilos por defecto si no está siendo arrastrado */
    cursor: move;
  }
  
  /* Cuando se está arrastrando, no aplicar estilos responsive */
  .floating-player.is-dragging {
    left: inherit !important;
    top: inherit !important;
    transform: none !important;
  }
  
  .floating-close-btn {
    width: 28px;
    height: 28px;
    top: -6px;
    right: -6px;
  }
}
</style>
