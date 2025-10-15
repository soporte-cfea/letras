<template>
  <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
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
import { ref, computed, watch } from 'vue'
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
