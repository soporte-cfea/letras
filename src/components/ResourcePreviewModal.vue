<template>
  <div v-if="show" class="resource-preview-overlay" @click="closeModal">
    <!-- Close button flotante - fuera del contenedor -->
    <button @click="closeModal" class="floating-close-btn">
      <span class="close-icon">×</span>
    </button>
    
    <div class="preview-container" @click.stop>
      <div class="preview-content">
        <!-- YouTube Preview -->
        <div v-if="resource?.type === 'youtube'" class="youtube-preview">
          <div v-if="!videoLoaded" class="youtube-thumbnail" @click="loadVideo">
            <img 
              :src="youtubeThumbnail" 
              :alt="`Thumbnail de ${youtubeTitle}`"
              class="thumbnail-image"
            />
            <div class="play-overlay">
              <div class="play-button">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            <div class="video-info">
              <h4 class="video-title">{{ youtubeTitle }}</h4>
              <p class="video-duration">{{ videoDuration }}</p>
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

        <!-- Spotify Preview -->
        <div v-else-if="resource?.type === 'spotify'" class="spotify-preview">
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

        <!-- Image Preview -->
        <div v-else-if="resource?.type === 'image'" class="image-preview">
          <img 
            :src="resource.url" 
            :alt="'Imagen de la canción'"
            class="preview-image"
            @error="handleImageError"
          />
        </div>

        <!-- Default Preview -->
        <div v-else class="default-preview">
          <div class="default-icon">{{ getResourceIcon(resource?.type) }}</div>
          <h4>{{ getResourceTitle(resource?.type) }}</h4>
          <p>Haz click para abrir el enlace</p>
          <button @click="openExternal" class="open-external-btn">
            Abrir Enlace
          </button>
        </div>
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

// Información del video (simulada - en producción podrías usar la API de YouTube)
const youtubeTitle = computed(() => {
  return 'Video de YouTube' // En producción, obtener del título real
})

const videoDuration = computed(() => {
  return '3:45' // En producción, obtener la duración real
})

// Función para cargar el video
function loadVideo() {
  videoLoaded.value = true
}

// Función para abrir enlace externo
function openExternal() {
  if (props.resource?.url) {
    window.open(props.resource.url, '_blank', 'noopener,noreferrer')
  }
}

// Función para cerrar modal
function closeModal() {
  emit('close')
}

// Función para manejar errores de imagen
function handleImageError() {
  imageError.value = true
}

// Función para obtener icono del recurso
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

// Función para obtener título del recurso
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

// Reset cuando se cierra el modal
watch(() => props.show, (newValue) => {
  if (!newValue) {
    videoLoaded.value = false
    imageError.value = false
  }
})
</script>

<style scoped>
.resource-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.preview-container {
  position: relative;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  background: transparent;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.floating-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 1001;
  backdrop-filter: blur(10px);
}

.floating-close-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

.close-icon {
  font-size: 1.5rem;
  font-weight: bold;
}

.preview-content {
  background: transparent;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* YouTube Preview */
.youtube-preview {
  width: 100%;
  max-width: 800px;
}

.youtube-thumbnail {
  position: relative;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
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
  width: 80px;
  height: 80px;
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

.video-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 1rem;
}

.video-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.video-duration {
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.9;
}

.youtube-embed {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.youtube-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 12px;
}

/* Spotify Preview */
.spotify-preview {
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.spotify-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.spotify-icon {
  font-size: 3rem;
}

.spotify-details h4 {
  font-size: 1.5rem;
  color: var(--cf-navy);
  margin: 0 0 0.5rem 0;
}

.spotify-details p {
  color: #6b7280;
  margin: 0;
}

/* Image Preview */
.image-preview {
  width: 100%;
  max-width: 800px;
}

.preview-image {
  width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

/* Default Preview */
.default-preview {
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.default-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.default-preview h4 {
  font-size: 1.5rem;
  color: var(--cf-navy);
  margin: 0 0 1rem 0;
}

.default-preview p {
  color: #6b7280;
  margin: 0 0 2rem 0;
}

/* Buttons */
.open-external-btn {
  background: var(--cf-gold);
  color: var(--cf-navy);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.open-external-btn:hover {
  background: #d4a574;
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .resource-preview-overlay {
    padding: 1rem;
  }
  
  .preview-container {
    max-width: 100%;
  }
  
  .preview-content {
    padding: 1rem;
  }
  
  .spotify-info {
    flex-direction: column;
    text-align: center;
  }
  
  .floating-close-btn {
    top: 15px;
    right: 15px;
    width: 35px;
    height: 35px;
  }
  
  .close-icon {
    font-size: 1.2rem;
  }
}
</style>
