<template>
  <div class="tag-manager">
    <div class="tags-container">
      <!-- Tags existentes como chips -->
      <div 
        v-for="userTag in allTags" 
        :key="userTag.id"
        class="tag-chip"
        :class="{ 
          'tag-chip--public': userTag.tag_type?.name === 'public', 
          'tag-chip--private': userTag.tag_type?.name === 'private' 
        }"
      >
        <span class="chip-text">{{ userTag.tag?.name }}</span>
        <button 
          @click="removeTag(userTag.tag?.name || '', userTag.tag_type?.name || 'public')" 
          class="chip-remove"
          :disabled="loading"
        >
          ×
        </button>
      </div>
      
      <!-- Input para agregar nuevo tag -->
      <div class="tag-input-container">
        <input
          v-model="newTagName"
          @keyup.enter="addTag"
          @keyup.escape="cancelAdd"
          @focus="showSuggestions = true"
          @blur="hideSuggestions"
          placeholder="Agregar etiqueta..."
          class="tag-input"
          ref="tagInput"
        />
        
        <!-- Selector de tipo inline -->
        <select v-model="newTagType" class="tag-type-select">
          <option value="public">🌐</option>
          <option value="private">🔒</option>
        </select>
        
        <!-- Sugerencias -->
        <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-dropdown">
          <div 
            v-for="suggestion in suggestions" 
            :key="suggestion"
            @mousedown="selectSuggestion(suggestion)"
            class="suggestion-item"
          >
            {{ suggestion }}
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useCancionesStore } from '@/stores/canciones'
import { getAllTags } from '@/utils/tags'
import type { UserSongTag } from '@/types/songTypes'

interface Props {
  songId: string
  userId?: string
}

const props = defineProps<Props>()
const cancionesStore = useCancionesStore()

// Estado reactivo
const newTagName = ref('')
const newTagType = ref<'public' | 'private'>('public')
const loading = ref(false)
const allAvailableTags = ref<string[]>([])
const tagInput = ref<HTMLInputElement>()
const showSuggestions = ref(false)

// Computed
const currentTags = computed(() => {
  const song = cancionesStore.canciones.find(c => c.id === props.songId)
  return song?.user_tags || []
})

const allTags = computed(() => {
  return currentTags.value
})

const suggestions = computed(() => {
  if (!newTagName.value.trim()) return []
  
  const searchTerm = newTagName.value.toLowerCase()
  return allAvailableTags.value
    .filter(tag => 
      tag.toLowerCase().includes(searchTerm) && 
      !currentTags.value.some(ut => ut.tag?.name.toLowerCase() === tag.toLowerCase())
    )
    .slice(0, 5)
})

// Métodos
const loadAvailableTags = async () => {
  try {
    const tags = await getAllTags()
    allAvailableTags.value = tags.map(tag => tag.name)
  } catch (error) {
    console.error('Error cargando tags disponibles:', error)
  }
}

const addTag = async () => {
  if (!newTagName.value.trim() || loading.value) return
  
  loading.value = true
  try {
    const success = await cancionesStore.addTagToCancion(
      props.songId,
      newTagName.value.trim(),
      newTagType.value,
      props.userId
    )
    
    if (success) {
      newTagName.value = ''
      showSuggestions.value = false
    }
  } catch (error) {
    console.error('Error agregando tag:', error)
  } finally {
    loading.value = false
  }
}

const removeTag = async (tagName: string, tagType: string) => {
  if (loading.value) return
  
  loading.value = true
  try {
    await cancionesStore.removeTagFromCancion(
      props.songId,
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

const selectSuggestion = (suggestion: string) => {
  newTagName.value = suggestion
  showSuggestions.value = false
  nextTick(() => {
    tagInput.value?.focus()
  })
}

const cancelAdd = () => {
  newTagName.value = ''
  showSuggestions.value = false
}

const hideSuggestions = () => {
  // Delay para permitir click en sugerencias
  setTimeout(() => {
    showSuggestions.value = false
  }, 150)
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'short' 
  })
}

// Watchers
watch(showSuggestions, (show) => {
  if (show) {
    nextTick(() => {
      tagInput.value?.focus()
    })
  }
})

// Cargar tags disponibles al montar
loadAvailableTags()
</script>

<style scoped>
/* Contenedor principal - Simple */
.tag-manager {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.75rem;
}

/* Container de tags */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

/* Chips de tags */
.tag-chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.15s ease;
}

.tag-chip--public {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.tag-chip--private {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.chip-text {
  font-size: 0.75rem;
}

.chip-remove {
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: bold;
  transition: all 0.15s ease;
  color: inherit;
  opacity: 0.7;
}

.chip-remove:hover {
  background: rgba(0, 0, 0, 0.1);
  opacity: 1;
}

/* Input container */
.tag-input-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tag-input {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 0.75rem;
  background: white;
  transition: all 0.15s ease;
  min-width: 120px;
}

.tag-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.tag-type-select {
  padding: 0.25rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.75rem;
  background: white;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tag-type-select:focus {
  outline: none;
  border-color: #3b82f6;
}

/* Sugerencias */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 150px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 0.5rem;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background-color 0.15s ease;
}

.suggestion-item:hover {
  background: #f3f4f6;
}

.suggestion-item:first-child {
  border-radius: 6px 6px 0 0;
}

.suggestion-item:last-child {
  border-radius: 0 0 6px 6px;
}

/* Responsive */
@media (max-width: 640px) {
  .tags-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .tag-input-container {
    width: 100%;
  }
  
  .tag-input {
    flex: 1;
  }
}
</style>
