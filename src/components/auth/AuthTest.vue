<template>
  <div class="auth-test bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-sm">
    <h2 class="text-xl font-bold mb-4 text-center">Prueba de Autenticación</h2>
    
    <!-- Estado actual -->
    <div class="mb-4 p-3 bg-gray-800 rounded text-sm">
      <p><strong>Estado:</strong> {{ authStore.isAuthenticated ? '✅ Autenticado' : '❌ No autenticado' }}</p>
      <p v-if="authStore.user"><strong>Usuario:</strong> {{ authStore.userEmail }}</p>
      <p v-if="authStore.loading" class="text-yellow-400">⏳ Cargando...</p>
      <p v-if="authStore.error" class="text-red-400"><strong>Error:</strong> {{ authStore.error }}</p>
    </div>

    <!-- Botones de acción -->
    <div class="space-y-2">
      <button 
        v-if="!authStore.isAuthenticated"
        @click="showLoginModal = true"
        class="w-full bg-indigo-500 text-white p-2 rounded hover:bg-indigo-600 transition-colors"
      >
        Iniciar Sesión
      </button>
      
      <button 
        v-if="!authStore.isAuthenticated"
        @click="showRegisterModal = true"
        class="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors"
      >
        Registrarse
      </button>
      
      <button 
        v-if="authStore.isAuthenticated"
        @click="handleLogout" 
        :disabled="authStore.loading"
        class="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
      >
        {{ authStore.loading ? 'Cargando...' : 'Cerrar Sesión' }}
      </button>
    </div>

    <!-- Botón para limpiar errores -->
    <button 
      v-if="authStore.error"
      @click="authStore.clearError"
      class="mt-2 text-xs text-gray-400 hover:text-gray-300"
    >
      Limpiar Error
    </button>

    <!-- Modales -->
    <AuthModal 
      v-model:show="showLoginModal"
      mode="login"
      @success="handleAuthSuccess"
      @close="showLoginModal = false"
    />
    
    <AuthModal 
      v-model:show="showRegisterModal"
      mode="register"
      @success="handleAuthSuccess"
      @close="showRegisterModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AuthModal from './AuthModal.vue'

// Store
const authStore = useAuthStore()

// Estado de modales
const showLoginModal = ref(false)
const showRegisterModal = ref(false)

// Métodos
const handleLogout = async () => {
  const result = await authStore.logout()
  
  if (result.success) {
    console.log('Sesión cerrada correctamente')
  } else {
    console.error(`Error al cerrar sesión: ${result.error}`)
  }
}

const handleAuthSuccess = () => {
  showLoginModal.value = false
  showRegisterModal.value = false
  console.log('Autenticación exitosa')
}

// Inicializar autenticación al montar el componente
onMounted(async () => {
  await authStore.initializeAuth()
})
</script>
