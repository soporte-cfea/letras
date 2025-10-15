<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Overlay -->
    <div 
      class="fixed inset-0 bg-black/50 backdrop-blur-sm"
      @click="handleClose"
    ></div>
    
    <!-- Modal Content -->
    <div class="relative bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
      <!-- Close Button -->
      <button
        @click="handleClose"
        class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
      
      <!-- Content -->
      <div class="p-6">
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-white">Editar Perfil</h3>
          <p class="text-sm text-gray-400">Actualiza tu información personal</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-100 mb-2">Nombre</label>
            <input 
              v-model="formData.name"
              type="text" 
              id="name"
              class="block w-full rounded-md bg-white/5 px-3 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600" 
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-100 mb-2">Email</label>
            <input 
              v-model="formData.email"
              type="email" 
              id="email"
              disabled
              class="block w-full rounded-md bg-white/5 px-3 py-2 text-base text-gray-400 outline-1 -outline-offset-1 outline-white/10 cursor-not-allowed" 
              placeholder="tu@email.com"
            />
            <p class="mt-1 text-xs text-gray-500">El email no se puede cambiar</p>
          </div>

          <!-- Error/Success Messages -->
          <div v-if="error" class="rounded-md bg-red-900/50 p-3">
            <p class="text-sm text-red-200">{{ error }}</p>
          </div>

          <div v-if="success" class="rounded-md bg-green-900/50 p-3">
            <p class="text-sm text-green-200">{{ success }}</p>
          </div>

          <!-- Buttons -->
          <div class="flex space-x-3 pt-4">
            <button 
              type="button"
              @click="handleClose"
              class="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              :disabled="isLoading || !hasChanges"
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
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
