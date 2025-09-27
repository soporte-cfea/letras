<template>
  <div v-if="show" class="tag-modal-overlay" @click="closeModal">
    <div class="tag-modal" @click.stop>
      <div class="modal-header">
        <h3>Gestionar etiquetas</h3>
        <p class="song-title">{{ cancion?.title }}</p>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <div class="modal-content">
        <!-- Input para agregar nuevo tag -->
        <div class="add-tag-section">
          <div class="input-group">
            <input
              v-model="newTagName"
              @keyup.enter="addTag"
              @keyup.escape="closeModal"
              placeholder="Escribir etiqueta..."
              class="tag-input"
              ref="tagInput"
            />
            <select v-model="newTagType" class="tag-type-select">
              <option value="public">Público</option>
              <option value="private">Privado</option>
            </select>
          </div>
          <button 
            @click="addTag" 
            :disabled="!newTagName.trim() || loading"
            class="btn-add-full"
          >
            {{ loading ? '...' : 'Agregar etiqueta' }}
          </button>
        </div>
        
        <!-- Etiquetas agregadas -->
        <div v-if="currentTags.length > 0" class="tags-list">
          <span
            v-for="userTag in currentTags"
            :key="userTag.id"
            class="tag-badge"
            :class="{
              'tag-badge--public': userTag.tag_type?.name === 'public',
              'tag-badge--private': userTag.tag_type?.name === 'private'
            }"
          >
            {{ userTag.tag?.name }}
            <button 
              @click="removeTag(userTag.tag?.name || '', userTag.tag_type?.name || 'public')" 
              class="tag-remove"
              :disabled="loading"
            >
              ×
            </button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useCancionesStore } from '@/stores/canciones'
import type { Cancion } from '@/types/songTypes'

interface Props {
  show: boolean
  cancion: Cancion | null
  userId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const cancionesStore = useCancionesStore()

// Estado reactivo
const newTagName = ref('')
const newTagType = ref<'public' | 'private'>('private')
const loading = ref(false)
const tagInput = ref<HTMLInputElement>()

// Computed
const currentTags = computed(() => {
  if (!props.cancion) return []
  const song = cancionesStore.canciones.find(c => c.id === props.cancion?.id)
  return song?.user_tags || []
})

const addTag = async () => {
  if (!newTagName.value.trim() || loading.value || !props.cancion) return
  
  loading.value = true
  try {
    const success = await cancionesStore.addTagToCancion(
      props.cancion.id,
      newTagName.value.trim(),
      newTagType.value,
      props.userId
    )
    
    if (success) {
      newTagName.value = ''
    }
  } catch (error) {
    console.error('Error agregando tag:', error)
  } finally {
    loading.value = false
  }
}

const removeTag = async (tagName: string, tagType: string) => {
  if (loading.value || !props.cancion) return
  
  loading.value = true
  try {
    await cancionesStore.removeTagFromCancion(
      props.cancion.id,
      tagName,
      tagType as 'public' | 'private',
      props.userId
    )
  } catch (error) {
    console.error('Error eliminando tag:', error)
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  newTagName.value = ''
  newTagType.value = 'private'
  emit('close')
}

// Watchers
watch(() => props.show, (show) => {
  if (show) {
    nextTick(() => {
      tagInput.value?.focus()
    })
  }
})

</script>

<style scoped>
.tag-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1rem;
  padding-top: 2rem;
}

.tag-modal {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  animation: slide-down 0.2s ease-out;
}

@media (max-width: 640px) {
  .tag-modal {
    max-width: 95vw;
    margin: 0 1rem;
  }
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 1.5rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
  position: relative;
}

.modal-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.song-title {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 28px;
  height: 28px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  color: #6b7280;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-content {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

/* Sección agregar tag */
.add-tag-section {
  margin-bottom: 2rem;
}

.input-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.15s ease;
  min-width: 0;
}

.tag-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.tag-type-select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  min-width: 120px;
  flex-shrink: 0;
}

.btn-add-full {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s ease;
  margin-top: 1rem;
}

.btn-add-full:hover:not(:disabled) {
  background: #2563eb;
}

.btn-add-full:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Tags list */
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag-badge--public {
  background: #dbeafe;
  color: #1e40af;
}

.tag-badge--private {
  background: #fef3c7;
  color: #92400e;
}

.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: bold;
  color: inherit;
  opacity: 0.7;
  padding: 0;
  margin-left: 0.25rem;
  transition: opacity 0.15s ease;
}

.tag-remove:hover {
  opacity: 1;
}

.tag-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}


/* Responsive */
@media (max-width: 480px) {
  .tag-modal {
    max-width: 98vw;
    margin: 0 0.5rem;
  }
  
  .tag-input {
    font-size: 16px; /* Evita zoom en iOS */
    padding: 0.5rem;
  }
  
  .tag-type-select {
    font-size: 16px; /* Evita zoom en iOS */
    padding: 0.5rem;
    min-width: 100px;
  }
  
  .input-group {
    gap: 0.25rem;
  }
  
  .modal-header {
    padding: 1rem 1rem 0 1rem;
  }
  
  .modal-content {
    padding: 0 1rem 1rem 1rem;
  }
}
</style>

