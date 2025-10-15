// Ejemplos de uso de la estructura de autenticación

import { useAuthStore } from '@/stores/auth'
import { useAuth } from '@/composables/authSupabase'

// Ejemplo 1: Uso del Store de Pinia
export const exampleStoreUsage = () => {
  const authStore = useAuthStore()
  
  // Inicializar autenticación
  const initAuth = async () => {
    await authStore.initializeAuth()
  }
  
  // Login
  const login = async (email: string, password: string) => {
    const result = await authStore.login(email, password)
    if (result.success) {
      console.log('Login exitoso!')
    } else {
      console.error('Error en login:', result.error)
    }
  }
  
  // Registro
  const register = async (email: string, password: string, name?: string) => {
    const result = await authStore.register(email, password, { name })
    if (result.success) {
      console.log('Registro exitoso!')
    } else {
      console.error('Error en registro:', result.error)
    }
  }
  
  // Logout
  const logout = async () => {
    const result = await authStore.logout()
    if (result.success) {
      console.log('Logout exitoso!')
    }
  }
  
  return {
    initAuth,
    login,
    register,
    logout,
    // Estado reactivo
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    loading: authStore.loading,
    error: authStore.error
  }
}

// Ejemplo 2: Uso directo del Composable
export const exampleComposableUsage = () => {
  const auth = useAuth()
  
  // Inicializar
  const init = async () => {
    await auth.initAuth()
  }
  
  // Login
  const login = async (email: string, password: string) => {
    const result = await auth.signIn(email, password)
    if (result.data) {
      console.log('Usuario autenticado:', result.data.user)
    }
  }
  
  return {
    init,
    login,
    // Estado reactivo
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    loading: auth.loading,
    error: auth.error
  }
}

// Ejemplo 3: Uso en un componente Vue
export const exampleVueComponent = `
<template>
  <div>
    <div v-if="authStore.loading">Cargando...</div>
    <div v-else-if="authStore.isAuthenticated">
      <h2>¡Hola {{ authStore.userEmail }}!</h2>
      <button @click="handleLogout">Cerrar Sesión</button>
    </div>
    <div v-else>
      <button @click="showLoginModal = true">Iniciar Sesión</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AuthModal from '@/components/auth/AuthModal.vue'

const authStore = useAuthStore()
const showLoginModal = ref(false)

const handleLogout = async () => {
  await authStore.logout()
}

// Inicializar auth al montar el componente
onMounted(async () => {
  await authStore.initializeAuth()
})
</script>
`

// Ejemplo 4: Configuración de rutas protegidas
export const exampleRouterConfig = `
// En tu router/index.ts
import { setupAuthGuards } from '@/router/guards'

const router = createRouter({
  // ... tu configuración
})

// Configurar guards de autenticación
setupAuthGuards(router)

// Rutas con meta de autenticación
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]
`
