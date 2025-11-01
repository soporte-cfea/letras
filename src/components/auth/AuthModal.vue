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
/* Modal siempre en modo oscuro */
.modal-content {
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
.modal-content :deep(*) {
  color: #f1f5f9 !important;
}

.modal-content :deep(input),
.modal-content :deep(textarea),
.modal-content :deep(select) {
  background: #0f172a !important;
  border-color: #475569 !important;
  color: #f1f5f9 !important;
}

.modal-content :deep(input::placeholder),
.modal-content :deep(textarea::placeholder) {
  color: #64748b !important;
}

.modal-content :deep(input:focus),
.modal-content :deep(textarea:focus),
.modal-content :deep(select:focus) {
  border-color: #64748b !important;
  outline-color: #64748b !important;
  background: #0f172a !important;
}

.modal-content :deep(button:not(.modal-close-btn):not([class*="text-blue"]):not([class*="hover:text-blue"])) {
  background: #334155 !important;
  color: #f1f5f9 !important;
  border-color: #475569 !important;
}

.modal-content :deep(button:hover:not(.modal-close-btn):not(:disabled):not([class*="text-blue"]):not([class*="hover:text-blue"])) {
  background: #475569 !important;
}

/* Enlaces/botones de cambio de modal - sin fondo, solo texto como enlace */
.modal-content :deep(button[class*="text-blue"]),
.modal-content :deep(button[class*="hover:text-blue"]) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
  text-decoration: underline !important;
  text-underline-offset: 3px !important;
  font-weight: 500 !important;
  color: #94a3b8 !important;
  transition: color var(--transition-normal) !important;
}

.modal-content :deep(button[class*="text-blue"]:hover),
.modal-content :deep(button[class*="hover:text-blue"]:hover) {
  background: transparent !important;
  color: #cbd5e1 !important;
  text-decoration: underline !important;
}

.modal-content :deep(button:disabled) {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

.modal-content :deep(label) {
  color: #cbd5e1 !important;
}

.modal-content :deep(h2),
.modal-content :deep(h3),
.modal-content :deep(h4) {
  color: #ffffff !important;
}

.modal-content :deep(a) {
  color: #94a3b8 !important;
}

.modal-content :deep(a:hover) {
  color: #cbd5e1 !important;
}

.modal-content :deep(p) {
  color: #cbd5e1 !important;
}

.modal-content :deep(.text-red-400),
.modal-content :deep(.text-red-500) {
  color: #f87171 !important;
}

.modal-content :deep(img) {
  filter: brightness(1.1);
}
</style>
