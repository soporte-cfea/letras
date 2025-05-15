<template>
  <section v-if="cancion" class="detalle-view">
    <h2>{{ cancion.titulo }}</h2>
    <div class="autor">{{ cancion.autor }}</div>
    <div class="etiquetas">
      <span v-for="etiqueta in cancion.tags" :key="etiqueta" class="etiqueta">{{ etiqueta }}</span>
    </div>
    <pre class="letra">{{ cancion.letra }}</pre>
  </section>
  <section v-else class="detalle-view">
    <p>Canción no encontrada.</p>
  </section>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useCancionesStore } from '../stores/canciones'
const route = useRoute()
const cancionesStore = useCancionesStore()
const cancion = cancionesStore.getCancionById(route.params.id as string)
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
</style> 