<template>
  <div v-if="show" class="profile-edit-modal fixed inset-0 flex items-center justify-center">
    <!-- Overlay -->
    <div 
      class="modal-overlay profile-edit-overlay fixed inset-0 bg-black/50 backdrop-blur-sm"
      @click="handleClose"
    ></div>
    
    <!-- Modal Content -->
    <div class="modal-content profile-edit-content relative rounded-lg shadow-xl max-w-md w-full mx-4">
      <!-- Close Button -->
      <button
        @click="handleClose"
        class="modal-close-btn absolute top-4 right-4 transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
      
      <!-- Content -->
      <div class="p-6">
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold">Editar Perfil</h3>
          <p class="text-sm">Actualiza tu información personal</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium mb-2">Nombre</label>
            <input 
              v-model="formData.name"
              type="text" 
              id="name"
              class="profile-edit-input"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium mb-2">Email</label>
            <input 
              v-model="formData.email"
              type="email" 
              id="email"
              disabled
              class="profile-edit-input profile-edit-input-disabled"
              placeholder="tu@email.com"
            />
            <p class="mt-1 text-xs">El email no se puede cambiar</p>
          </div>

          <!-- Error/Success Messages -->
          <div v-if="error" class="profile-edit-error">
            <p>{{ error }}</p>
          </div>

          <div v-if="success" class="profile-edit-success">
            <p>{{ success }}</p>
          </div>

          <!-- Buttons -->
          <div class="flex space-x-3 pt-4">
            <button 
              type="button"
              @click="handleClose"
              class="profile-edit-btn profile-edit-btn-secondary"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              :disabled="isLoading || !hasChanges"
              class="profile-edit-btn profile-edit-btn-primary"
            >
              <span v-if="isLoading">Guardando...</span>
              <span v-else>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Props
interface Props {
  show: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  success: []
}>()

// Store
const authStore = useAuthStore()

// Estado del formulario
const formData = reactive({
  name: '',
  email: ''
})

const isLoading = ref(false)
const error = ref('')
const success = ref('')

// Computed
const hasChanges = computed(() => {
  return formData.name.trim() !== ''
})

// Watchers
watch(() => props.show, (newShow) => {
  if (newShow) {
    // Cargar datos del usuario
    formData.email = authStore.userEmail
    formData.name = authStore.user?.user_metadata?.name || ''
    error.value = ''
    success.value = ''
  }
})

// Métodos
const handleClose = () => {
  emit('close')
}

const handleSubmit = async () => {
  if (!hasChanges.value) return

  try {
    isLoading.value = true
    error.value = ''
    success.value = ''

    // Actualizar el perfil del usuario en Supabase
    const { error: updateError } = await authStore.updateUserProfile({
      name: formData.name.trim()
    })

    if (updateError) {
      throw new Error(updateError)
    }

    success.value = 'Perfil actualizado correctamente'
    
    // Cerrar modal después de un momento
    setTimeout(() => {
      emit('success')
      handleClose()
    }, 1500)

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al actualizar el perfil. Inténtalo de nuevo.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Modal siempre en modo oscuro - consistente con AuthModal */
.profile-edit-content {
  background: #1e293b !important;
  border: 1px solid #475569 !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3) !important;
  color: #f1f5f9 !important;
}

.modal-close-btn {
  color: #94a3b8 !important;
  transition: all var(--transition-normal);
}

.modal-close-btn:hover {
  color: #f87171 !important;
  background: #334155 !important;
  border-radius: 4px;
  padding: 0.25rem;
}

/* Forzar modo oscuro en todos los elementos hijos */
.profile-edit-content :deep(*) {
  color: #f1f5f9 !important;
}

/* Inputs */
.profile-edit-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: #0f172a !important;
  border: 1px solid #475569 !important;
  border-radius: 0.375rem;
  color: #f1f5f9 !important;
  font-size: 1rem;
  transition: all var(--transition-normal);
}

.profile-edit-input::placeholder {
  color: #64748b !important;
}

.profile-edit-input:focus {
  outline: none !important;
  border-color: #64748b !important;
  background: #0f172a !important;
}

.profile-edit-input-disabled {
  color: #64748b !important;
  cursor: not-allowed !important;
  opacity: 0.7;
}

/* Labels */
.profile-edit-content :deep(label) {
  color: #cbd5e1 !important;
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

/* Títulos */
.profile-edit-content :deep(h3) {
  color: #ffffff !important;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.profile-edit-content :deep(p) {
  color: #cbd5e1 !important;
  font-size: 0.875rem;
}

/* Mensajes de error y éxito */
.profile-edit-error {
  background: rgba(248, 113, 113, 0.1) !important;
  border: 1px solid rgba(248, 113, 113, 0.3) !important;
  border-radius: 0.375rem;
  padding: 0.75rem;
}

.profile-edit-error p {
  color: #fca5a5 !important;
  font-size: 0.875rem;
  margin: 0;
}

.profile-edit-success {
  background: rgba(34, 197, 94, 0.1) !important;
  border: 1px solid rgba(34, 197, 94, 0.3) !important;
  border-radius: 0.375rem;
  padding: 0.75rem;
}

.profile-edit-success p {
  color: #86efac !important;
  font-size: 0.875rem;
  margin: 0;
}

/* Botones */
.profile-edit-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  border: 1px solid #475569 !important;
  transition: all var(--transition-normal);
  cursor: pointer;
}

.profile-edit-btn-secondary {
  background: #334155 !important;
  color: #cbd5e1 !important;
}

.profile-edit-btn-secondary:hover {
  background: #475569 !important;
  color: #f1f5f9 !important;
}

.profile-edit-btn-primary {
  background: #334155 !important;
  color: #f1f5f9 !important;
}

.profile-edit-btn-primary:hover:not(:disabled) {
  background: #475569 !important;
}

.profile-edit-btn:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

/* Iconos */
.profile-edit-content :deep(svg) {
  color: inherit;
}
</style>
