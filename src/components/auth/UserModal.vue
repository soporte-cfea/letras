<template>
  <div v-if="show" class="user-modal fixed inset-0 flex items-center justify-center">
    <!-- Overlay -->
    <div 
      class="modal-overlay"
      @click="handleClose"
    ></div>
    
    <!-- Modal Content -->
    <div class="modal-content bg-gray-900 rounded-lg shadow-xl max-w-sm w-full mx-4">
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
        <!-- User Info -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-white">{{ userName || userEmail }}</h3>
          <p class="text-sm text-gray-400">{{ userName ? userEmail : 'Usuario autenticado' }}</p>
        </div>

        <!-- Menu Options -->
        <div class="space-y-2">
          <button 
            @click="handleEditProfile"
            class="w-full flex items-center px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Editar Perfil
          </button>


          <hr class="border-gray-700 my-4">

          <button 
            @click="handleLogout"
            class="w-full flex items-center px-4 py-3 text-left text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Props
interface Props {
  show: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  logout: []
  editProfile: []
}>()

// Store
const authStore = useAuthStore()

// Computed
const userEmail = computed(() => authStore.userEmail)
const userName = computed(() => authStore.userName)

// Watchers
watch(() => props.show, (newShow) => {
  if (newShow) {
    document.body.classList.add('modal-open')
  } else {
    document.body.classList.remove('modal-open')
  }
})

// Limpiar al desmontar
onUnmounted(() => {
  document.body.classList.remove('modal-open')
})

// Methods
const handleClose = () => {
  emit('close')
}

const handleLogout = async () => {
  await authStore.logout()
  emit('logout')
  handleClose()
}

const handleEditProfile = () => {
  emit('editProfile')
  handleClose()
}

</script>
