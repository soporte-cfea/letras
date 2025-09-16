<template>
  <section class="buscar-view">
    <div class="search-container">
      <input
        v-model="query"
        class="search-input" 
        type="text"
        placeholder="Buscar canciones, artistas, letras..."
        ref="searchInput"
        autofocus
      />
      
      <!-- Filtros Avanzados -->
      <div class="filters-container">
        <div class="filter-group">
          <label class="filter-label">Artista:</label>
          <select v-model="selectedArtist" class="filter-select">
            <option value="">Todos los artistas</option>
            <option v-for="artist in cancionesStore.artistas" :key="artist" :value="artist">
              {{ artist }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Género:</label>
          <select v-model="selectedTag" class="filter-select">
            <option value="">Todos los géneros</option>
            <option v-for="tag in cancionesStore.tags" :key="tag" :value="tag">
              {{ tag }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">BPM:</label>
          <select v-model="selectedBPM" class="filter-select">
            <option value="">Cualquier BPM</option>
            <option value="slow">Lento (60-80)</option>
            <option value="medium">Medio (80-120)</option>
            <option value="fast">Rápido (120+)</option>
          </select>
        </div>
        
        <button @click="clearFilters" class="clear-filters-btn">
          Limpiar Filtros
        </button>
      </div>
    </div>
    <div v-if="!query" class="resultados-placeholder">
      <span>Escribe para buscar canciones.</span>
    </div>
    <ul v-else-if="filteredCanciones.length" class="resultados-lista">
      <li v-for="cancion in filteredCanciones" :key="cancion.id" class="resultado-item">
        <router-link :to="`/cancion/${cancion.id}`" class="resultado-link">
          <div class="titulo">{{ cancion.title }}</div>
          <div class="autor">{{ cancion.artist }}</div>
          <div v-if="cancion.subtitle" class="subtitulo">{{ cancion.subtitle }}</div>
          <div class="tags">
            <span v-for="tag in cancion.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </router-link>
      </li>
    </ul>
    <div v-else class="no-resultados">
      <span>No se encontraron resultados</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCancionesStore } from '../stores/canciones'
import { storeToRefs } from 'pinia'
import { normalizeTags } from '@/utils/tags'

const searchInput = ref<HTMLInputElement | null>(null)
const query = ref('')
const selectedArtist = ref('')
const selectedTag = ref('')
const selectedBPM = ref('')
const cancionesStore = useCancionesStore()
const { canciones, loading, error } = storeToRefs(cancionesStore)

const filteredCanciones = computed(() => {
  return canciones.value.filter(cancion => {
    const searchTerm = query.value.toLowerCase()
    const normalizedTags = normalizeTags(cancion.tags)
    
    // Filtro de búsqueda de texto
    const matchesSearch = !query.value || 
      (cancion.title && cancion.title.toLowerCase().includes(searchTerm)) ||
      (cancion.artist && cancion.artist.toLowerCase().includes(searchTerm)) ||
      (cancion.subtitle && cancion.subtitle.toLowerCase().includes(searchTerm)) ||
      normalizedTags.some(tag => tag.toLowerCase().includes(searchTerm))
    
    // Filtro de artista
    const matchesArtist = !selectedArtist.value || cancion.artist === selectedArtist.value
    
    // Filtro de género/tag
    const matchesTag = !selectedTag.value || normalizedTags.includes(selectedTag.value)
    
    // Filtro de BPM
    const matchesBPM = !selectedBPM.value || (() => {
      if (!cancion.bpm) return true
      switch (selectedBPM.value) {
        case 'slow': return cancion.bpm >= 60 && cancion.bpm <= 80
        case 'medium': return cancion.bpm > 80 && cancion.bpm <= 120
        case 'fast': return cancion.bpm > 120
        default: return true
      }
    })()
    
    return matchesSearch && matchesArtist && matchesTag && matchesBPM
  })
})

function clearFilters() {
  query.value = ''
  selectedArtist.value = ''
  selectedTag.value = ''
  selectedBPM.value = ''
  searchInput.value?.focus()
}

onMounted(async () => {
  searchInput.value?.focus()
  // Cargar canciones si no están cargadas
  if (canciones.value.length === 0) {
    await cancionesStore.loadCanciones()
  }
})
</script>

<style scoped>
.buscar-view {
  padding: 24px 16px 80px 16px;
}

.search-container {
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 24px;
  background: var(--color-background-soft);
  outline: none;
}
.resultados-placeholder {
  color: var(--color-text);
  opacity: 0.6;
  text-align: center;
  margin-top: 32px;
}
.resultados-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.resultado-item {
  background: var(--color-background-soft);
  border-radius: 8px;
  padding: 12px;
}
.resultado-link {
  text-decoration: none;
  color: var(--color-text);
}
.titulo {
  font-weight: 600;
  font-size: 1.1rem;
}
.autor {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 4px;
}
.subtitulo {
  font-size: 0.85rem;
  opacity: 0.7;
  margin-top: 2px;
  font-style: italic;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.tag {
  background: var(--color-background-mute);
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 0.8rem;
}
.no-resultados {
  color: var(--color-text);
  opacity: 0.6;
  text-align: center;
  margin-top: 32px;
}

/* Filtros Avanzados */
.filters-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--cf-navy);
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: white;
  color: var(--cf-navy);
  font-size: 0.9rem;
}

.filter-select:focus {
  outline: none;
  border-color: var(--cf-gold);
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
}

.clear-filters-btn {
  grid-column: 1 / -1;
  padding: 0.75rem 1rem;
  background: var(--cf-navy);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.2s ease;
  margin-top: 0.5rem;
}

.clear-filters-btn:hover {
  background: var(--cf-navy-dark);
}

@media (max-width: 768px) {
  .filters-container {
    grid-template-columns: 1fr;
  }
}
</style>