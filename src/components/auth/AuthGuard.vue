<template>
  <!-- Template será proporcionado por el usuario -->
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Props
interface Props {
  requireAuth?: boolean
  requireAdmin?: boolean
  fallbackComponent?: any
  redirectTo?: string
}

const props = withDefaults(defineProps<Props>(), {
  requireAuth: true,
  requireAdmin: false,
  redirectTo: '/login'
})

// Emits
const emit = defineEmits<{
  unauthorized: []
  forbidden: []
  ready: []
}>()

// Store
const authStore = useAuthStore()

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
const isLoading = computed(() => authStore.loading)
const user = computed(() => authStore.user)

// Verificaciones de acceso
const hasAccess = computed(() => {
  if (isLoading.value) return false
  
  if (props.requireAuth && !isAuthenticated.value) {
    return false
  }
  
  if (props.requireAdmin && !isAdmin.value) {
    return false
  }
  
  return true
})

const canAccess = computed(() => {
  if (isLoading.value) return 'loading'
  
  if (props.requireAuth && !isAuthenticated.value) {
    return 'unauthorized'
  }
  
  if (props.requireAdmin && !isAdmin.value) {
    return 'forbidden'
  }
  
  return 'allowed'
})

// Métodos
const checkAccess = () => {
  const access = canAccess.value
  
  switch (access) {
    case 'loading':
      // Aún cargando, no hacer nada
      break
    case 'unauthorized':
      emit('unauthorized')
      break
    case 'forbidden':
      emit('forbidden')
      break
    case 'allowed':
      emit('ready')
      break
  }
}

const handleUnauthorized = () => {
  // Redirigir a login o mostrar modal de login
  if (props.redirectTo) {
    // Aquí podrías usar el router para redirigir
    console.log('Redirigir a:', props.redirectTo)
  }
}

const handleForbidden = () => {
  // Mostrar mensaje de acceso denegado
  console.log('Acceso denegado: se requieren permisos de administrador')
}

// Lifecycle
onMounted(async () => {
  // Inicializar autenticación si no está inicializada
  if (!authStore.isInitialized) {
    await authStore.initializeAuth()
  }
  
  checkAccess()
})

// Watchers para cambios de estado
watch(isLoading, (newLoading) => {
  if (!newLoading) {
    checkAccess()
  }
})

watch(isAuthenticated, () => {
  checkAccess()
})

watch(isAdmin, () => {
  checkAccess()
})

// Exponer estado para uso externo
defineExpose({
  isAuthenticated,
  isAdmin,
  isLoading,
  user,
  hasAccess,
  canAccess,
  checkAccess
})
</script>
