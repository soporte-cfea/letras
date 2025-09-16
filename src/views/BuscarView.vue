<template>
  <section class="buscar-view">
    <input
      v-model="query"
      class="search-input" 
      type="text"
      placeholder="Buscar canciones..."
      ref="searchInput"
      autofocus
    />
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

const searchInput = ref<HTMLInputElement | null>(null)
const query = ref('')
const cancionesStore = useCancionesStore()
const { canciones, loading, error } = storeToRefs(cancionesStore)

const filteredCanciones = computed(() => {
  if (!query.value) return []
  
  return canciones.value.filter(cancion => {
    const searchTerm = query.value.toLowerCase()
    return cancion.title.toLowerCase().includes(searchTerm) ||
           cancion.artist.toLowerCase().includes(searchTerm) ||
           (cancion.subtitle && cancion.subtitle.toLowerCase().includes(searchTerm)) ||
           (cancion.tags && cancion.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
  })
})

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
</style>