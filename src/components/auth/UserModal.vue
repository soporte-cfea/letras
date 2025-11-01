<template>
  <div v-if="show" class="user-modal fixed inset-0 flex items-center justify-center">
    <!-- Overlay -->
    <div 
      class="modal-overlay"
      @click="handleClose"
    ></div>
    
    <!-- Modal Content -->
    <div class="modal-content user-modal-content rounded-lg shadow-xl max-w-sm w-full mx-4">
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
        <!-- User Info -->
        <div class="text-center mb-6">
          <div class="user-modal-avatar">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <h3 class="user-modal-name">{{ userName || userEmail }}</h3>
          <p class="user-modal-email">{{ userName ? userEmail : 'Usuario autenticado' }}</p>
        </div>

        <!-- Menu Options -->
        <div class="space-y-2">
          <button 
            @click="handleEditProfile"
            class="user-modal-menu-item"
          >
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Editar Perfil
          </button>


          <hr class="user-modal-divider">

          <button 
            @click="handleLogout"
            class="user-modal-menu-item user-modal-menu-item-logout"
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

<style scoped>
/* Modal siempre en modo oscuro - consistente con AuthModal */
.user-modal-content {
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
.user-modal-content :deep(*) {
  color: #f1f5f9 !important;
}

/* Avatar */
.user-modal-avatar {
  width: 4rem;
  height: 4rem;
  background: #334155 !important;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
}

.user-modal-avatar svg {
  color: #ffffff !important;
}

/* Nombre y email */
.user-modal-name {
  color: #ffffff !important;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.user-modal-email {
  color: #94a3b8 !important;
  font-size: 0.875rem;
  margin: 0;
}

/* Elementos del menú */
.user-modal-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  text-align: left;
  background: transparent !important;
  border: none;
  border-radius: 0.5rem;
  color: #cbd5e1 !important;
  transition: all var(--transition-normal);
  cursor: pointer;
}

.user-modal-menu-item:hover {
  background: #334155 !important;
  color: #f1f5f9 !important;
}

.user-modal-menu-item svg {
  color: inherit !important;
}

/* Opción de logout con color especial */
.user-modal-menu-item-logout {
  color: #f87171 !important;
}

.user-modal-menu-item-logout:hover {
  background: rgba(248, 113, 113, 0.1) !important;
  color: #fca5a5 !important;
}

/* Divisor */
.user-modal-divider {
  border-color: #475569 !important;
  margin: 1rem 0;
}

/* Títulos */
.user-modal-content :deep(h3) {
  color: #ffffff !important;
}

.user-modal-content :deep(p) {
  color: #cbd5e1 !important;
}
</style>
