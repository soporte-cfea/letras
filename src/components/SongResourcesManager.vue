<template>
  <div class="song-resources-manager">
    <div class="resources-header">
      <h4 class="text-sm font-semibold text-gray-700 mb-3">Recursos de la Canción</h4>
      <button
        type="button"
        @click="addResource"
        class="add-resource-btn"
      >
        <span class="plus-icon">+</span>
        Nuevo Recurso
      </button>
    </div>

    <div v-if="resources.length === 0" class="empty-state">
      <p class="text-gray-500 text-sm">No hay recursos agregados</p>
    </div>

    <div v-else class="resources-list">
      <div
        v-for="(resource, index) in resources"
        :key="index"
        class="resource-item"
      >
        <div class="resource-content">
          <div class="resource-type">
            <select
              v-model="resource.type"
              class="resource-select"
              @change="updateResource(index)"
            >
              <option value="spotify">Spotify</option>
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="apple-music">Apple Music</option>
              <option value="image">Imagen</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="other">Otro</option>
            </select>
          </div>
          
          <div class="resource-inputs">
            <input
              v-model="resource.label"
              type="text"
              placeholder="Etiqueta personalizada (opcional)"
              class="resource-label-input"
              @input="updateResource(index)"
            />
            <input
              v-model="resource.url"
              type="url"
              placeholder="URL del recurso"
              class="resource-url-input"
              @input="updateResource(index)"
            />
            
            <!-- Campo especial para iframe de Spotify -->
            <div v-if="resource.type === 'spotify'" class="spotify-iframe-section">
              <label class="iframe-label">
                <input
                  type="checkbox"
                  v-model="showIframeField"
                  @change="toggleIframeField(index)"
                  class="iframe-checkbox"
                />
                <span class="checkbox-text">Usar iframe de Spotify (reproducción directa)</span>
              </label>
              
              <div v-if="showIframeField" class="iframe-input-container">
                <textarea
                  v-model="resource.iframe"
                  placeholder="Pega aquí el iframe de Spotify..."
                  class="iframe-textarea"
                  rows="3"
                  @input="updateResource(index)"
                ></textarea>
                <small class="iframe-help">
                  Copia el iframe desde Spotify (Share → Embed) para reproducir directamente en la página
                </small>
              </div>
            </div>
          </div>
        </div>
        
        <button
          type="button"
          @click="removeResource(index)"
          class="remove-resource-btn"
          title="Eliminar recurso"
        >
          <span class="remove-icon">×</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SongResource } from '@/types/songTypes'

interface Props {
  modelValue: SongResource[]
}

interface Emits {
  (e: 'update:modelValue', value: SongResource[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const resources = ref<SongResource[]>([...props.modelValue])
const showIframeField = ref(false)

// Función para agregar un nuevo recurso
function addResource() {
  resources.value.push({
    type: 'spotify',
    url: ''
  })
  emit('update:modelValue', resources.value)
}

// Función para eliminar un recurso
function removeResource(index: number) {
  resources.value.splice(index, 1)
  emit('update:modelValue', resources.value)
}

// Función para actualizar un recurso
function updateResource(index: number) {
  emit('update:modelValue', resources.value)
}

// Función para alternar el campo de iframe
function toggleIframeField(index: number) {
  if (!showIframeField.value) {
    // Si se desactiva, limpiar el iframe
    resources.value[index].iframe = ''
  }
  emit('update:modelValue', resources.value)
}

// Observar cambios en el prop modelValue
watch(() => props.modelValue, (newValue) => {
  resources.value = [...newValue]
}, { deep: true })
</script>

<style scoped>
.song-resources-manager {
  margin-top: 1rem;
}

.resources-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.add-resource-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--cf-gold);
  color: var(--cf-navy);
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-resource-btn:hover {
  background: #d4a574;
  transform: translateY(-1px);
}

.plus-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px dashed #cbd5e0;
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.resource-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.resource-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.resource-type {
  width: 100%;
}

.resource-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
  color: var(--cf-navy);
}

.resource-inputs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.resource-label-input,
.resource-url-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.resource-label-input:focus,
.resource-url-input:focus {
  outline: none;
  border-color: var(--cf-gold);
  box-shadow: 0 0 0 3px rgba(212, 165, 116, 0.1);
}

.remove-resource-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-resource-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.remove-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

/* Spotify iframe section */
.spotify-iframe-section {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.iframe-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 0.75rem;
}

.iframe-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--cf-gold);
}

.checkbox-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cf-navy);
}

.iframe-input-container {
  margin-top: 0.5rem;
}

.iframe-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s ease;
}

.iframe-textarea:focus {
  outline: none;
  border-color: var(--cf-gold);
  box-shadow: 0 0 0 3px rgba(212, 165, 116, 0.1);
}

.iframe-help {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

@media (max-width: 640px) {
  .resource-item {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .remove-resource-btn {
    align-self: flex-end;
  }
}
</style>
