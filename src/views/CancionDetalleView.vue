<template>
  <section class="detalle-view">
    <!-- Estado de carga -->
    <div v-if="loading" class="text-center text-gray-500 py-8">
      Cargando canción...
    </div>
    
    <!-- Estado de error -->
    <div v-else-if="error" class="text-center text-red-500 py-8">
      Error: {{ error }}
    </div>
    
    <!-- Canción encontrada -->
    <div v-else-if="cancion">
      <h2>{{ cancion.title }}</h2>
      <div class="autor">{{ cancion.artist }}</div>
      <div v-if="cancion.subtitle" class="subtitulo">{{ cancion.subtitle }}</div>
      <div class="etiquetas">
        <span v-for="etiqueta in cancion.tags" :key="etiqueta" class="etiqueta">{{ etiqueta }}</span>
      </div>
      <div v-if="cancion.bpm" class="info-adicional">
        <span class="bpm">BPM: {{ cancion.bpm }}</span>
        <span v-if="cancion.tempo" class="tempo">Tempo: {{ cancion.tempo }}</span>
      </div>
      <!-- Letra de la canción -->
      <div v-if="loadingLyrics" class="letra-loading">
        <p>Cargando letra...</p>
      </div>
      <div v-else-if="lyricsError" class="letra-error">
        <p>Error al cargar la letra: {{ lyricsError }}</p>
      </div>
      <div v-else-if="lyrics" class="letra">
        <pre>{{ lyrics }}</pre>
      </div>
      <div v-else class="letra-placeholder">
        <p>No hay letra disponible para esta canción.</p>
        <p><em>La letra se almacena en la tabla 'documents' y se puede recuperar usando el song_id.</em></p>
      </div>
    </div>
    
    <!-- Canción no encontrada -->
    <div v-else class="text-center text-gray-500 py-8">
      <p>Canción no encontrada.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCancionesStore } from '../stores/canciones'
import { DocumentsService } from '@/api/songs'
import { Cancion } from '@/types/songTypes'

const route = useRoute()
const cancionesStore = useCancionesStore()
const cancion = ref<Cancion | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Estados para la letra
const lyrics = ref<string | null>(null)
const loadingLyrics = ref(false)
const lyricsError = ref<string | null>(null)

// Función para cargar la letra
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

onMounted(async () => {
  loading.value = true
  try {
    const songId = route.params.id as string
    const foundSong = await cancionesStore.getCancionById(songId)
    cancion.value = foundSong
    
    // Cargar la letra si se encontró la canción
    if (foundSong) {
      await loadLyrics(songId)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al cargar la canción'
    console.error('Error loading song:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.detalle-view {
  padding: 24px 16px 80px 16px;
  background: var(--color-background);
}
h2 {
  font-size: 1.3rem;
  margin-bottom: 0.2em;
  color: var(--cf-navy);
}
.autor {
  font-size: 1rem;
  color: var(--cf-gold);
  margin-bottom: 0.5em;
}
.etiquetas {
  margin-bottom: 1em;
}
.etiqueta {
  display: inline-block;
  background: rgba(255, 215, 0, 0.13);
  color: var(--cf-navy);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.85em;
  margin-right: 6px;
  margin-bottom: 4px;
  border: 1px solid var(--cf-gold);
}
.letra {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 1rem;
  white-space: pre-wrap;
  color: var(--cf-navy-dark);
}
.subtitulo {
  font-size: 0.9rem;
  color: var(--cf-gold);
  margin-bottom: 0.5em;
  font-style: italic;
}
.info-adicional {
  margin-bottom: 1em;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.bpm, .tempo {
  background: rgba(255, 215, 0, 0.1);
  color: var(--cf-navy);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.85em;
  border: 1px solid var(--cf-gold);
}
.letra-placeholder {
  background: #f8f9fa;
  border: 1px dashed #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  color: #6c757d;
  font-style: italic;
}
.letra-loading {
  text-align: center;
  color: #6c757d;
  padding: 1rem;
  font-style: italic;
}
.letra-error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 1rem;
  color: #721c24;
}
.letra {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}
.letra pre {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 1rem;
  white-space: pre-wrap;
  color: var(--cf-navy-dark);
  margin: 0;
}
</style> 