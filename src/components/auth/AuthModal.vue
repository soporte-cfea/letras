<template>
  <div v-if="showModal" class="auth-modal fixed inset-0 flex items-center justify-center">
    <!-- Overlay -->
    <div 
      class="modal-overlay"
      @click="handleClose"
    ></div>
    
    <!-- Modal Content -->
    <div class="modal-content rounded-lg shadow-xl max-w-md w-full mx-4">
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
        <LoginForm 
          v-if="isLoginMode"
          @success="handleSuccess"
          @error="handleError"
          @switch-to-register="handleSwitchToRegister"
          @forgot-password="handleForgotPassword"
        />
        
        <RegisterForm 
          v-if="isRegisterMode"
          @success="handleSuccess"
          @error="handleError"
          @switch-to-login="handleSwitchToLogin"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import LoginForm from './LoginForm.vue'
import RegisterForm from './RegisterForm.vue'
import type { AuthMode, AuthModalProps } from '@/types/auth'

// Props
const props = withDefaults(defineProps<AuthModalProps>(), {
  mode: 'login',
  show: false
})

// Emits
const emit = defineEmits<{
  close: []
  success: []
  error: [message: string]
}>()

// Estado interno
const currentMode = ref<AuthMode>(props.mode)
const showModal = ref(props.show)

// Computed
const isLoginMode = computed(() => currentMode.value === 'login')
const isRegisterMode = computed(() => currentMode.value === 'register')
const isResetMode = computed(() => currentMode.value === 'reset')

// Watchers
watch(() => props.mode, (newMode) => {
  currentMode.value = newMode
})

watch(() => props.show, (newShow) => {
  showModal.value = newShow
  // Manejar el scroll del body
  if (newShow) {
    document.body.classList.add('modal-open')
  } else {
    document.body.classList.remove('modal-open')
  }
})

// Métodos
const switchToLogin = () => {
  currentMode.value = 'login'
}

const switchToRegister = () => {
  currentMode.value = 'register'
}

const switchToReset = () => {
  currentMode.value = 'reset'
}

const handleClose = () => {
  showModal.value = false
  emit('close')
}

const handleSuccess = () => {
  emit('success')
  handleClose()
}

const handleError = (message: string) => {
  emit('error', message)
}

// Limpiar al desmontar
onUnmounted(() => {
  document.body.classList.remove('modal-open')
})

const handleLoginSuccess = () => {
  handleSuccess()
}

const handleRegisterSuccess = () => {
  handleSuccess()
}

const handleForgotPassword = () => {
  switchToReset()
}

const handleSwitchToRegister = () => {
  switchToRegister()
}

const handleSwitchToLogin = () => {
  switchToLogin()
}

// Exponer métodos para uso externo
defineExpose({
  switchToLogin,
  switchToRegister,
  switchToReset,
  show: () => { showModal.value = true },
  hide: () => { showModal.value = false },
  currentMode: computed(() => currentMode.value)
})
</script>

<style scoped>
.modal-content {
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-xl);
}

.modal-close-btn {
  color: var(--color-text-mute);
  transition: all var(--transition-normal);
}

.modal-close-btn:hover {
  color: var(--color-error);
  background: var(--color-background-hover);
  border-radius: 4px;
  padding: 0.25rem;
}
</style>
