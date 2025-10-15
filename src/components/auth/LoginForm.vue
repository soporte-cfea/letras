<template>
  <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <img class="mx-auto h-10 w-auto" src="/android-chrome-512x512.png" alt="Letras App" />
      <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">Inicia sesión en tu cuenta</h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label for="email" class="block text-sm/6 font-medium text-gray-100">Email</label>
          <div class="mt-2">
            <input 
              v-model="formData.email"
              @input="handleEmailChange"
              type="email" 
              name="email" 
              id="email" 
              autocomplete="email" 
              required 
              class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6" 
              placeholder="tu@email.com"
            />
            <p v-if="formErrors.email" class="mt-1 text-sm text-red-400">{{ formErrors.email }}</p>
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm/6 font-medium text-gray-100">Contraseña</label>
          <div class="mt-2">
            <input 
              v-model="formData.password"
              @input="handlePasswordChange"
              type="password" 
              name="password" 
              id="password" 
              autocomplete="current-password" 
              required 
              class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6" 
              placeholder="tu contraseña"
            />
            <p v-if="formErrors.password" class="mt-1 text-sm text-red-400">{{ formErrors.password }}</p>
          </div>
        </div>

        <div>
          <button 
            type="submit" 
            :disabled="!isValid || isLoading"
            class="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading">Iniciando sesión...</span>
            <span v-else>Iniciar sesión</span>
          </button>
        </div>

        <!-- Error general -->
        <div v-if="formErrors.general" class="rounded-md bg-red-900/50 p-3">
          <p class="text-sm text-red-200">{{ formErrors.general }}</p>
        </div>
      </form>

      <p class="mt-10 text-center text-sm/6 text-gray-400">
        ¿No tienes cuenta?
        {{ ' ' }}
        <button 
          type="button"
          @click="handleSwitchToRegister"
          class="font-semibold text-blue-300 hover:text-blue-200"
        >
          Regístrate aquí
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { LoginCredentials, AuthFormData, AuthFormErrors } from '@/types/auth'

// Props
interface Props {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  onSuccess: () => {},
  onSwitchToRegister: () => {}
})

// Emits
const emit = defineEmits<{
  success: []
  error: [message: string]
  switchToRegister: []
}>()

// Store
const authStore = useAuthStore()

// Estado del formulario
const formData = reactive<AuthFormData>({
  email: '',
  password: '',
  rememberMe: false
})

const formErrors = reactive<AuthFormErrors>({})
const isSubmitting = ref(false)

// Computed
const isValid = computed(() => {
  return formData.email && 
         formData.password && 
         !formErrors.email && 
         !formErrors.password
})

const isLoading = computed(() => authStore.loading || isSubmitting.value)

// Validaciones
const validateEmail = (email: string): string | null => {
  if (!email) return 'El email es requerido'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return 'El email no es válido'
  return null
}

const validatePassword = (password: string): string | null => {
  if (!password) return 'La contraseña es requerida'
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
  return null
}

const validateForm = (): boolean => {
  // Limpiar errores previos
  Object.keys(formErrors).forEach(key => {
    delete formErrors[key as keyof AuthFormErrors]
  })

  let isValid = true

  // Validar email
  const emailError = validateEmail(formData.email)
  if (emailError) {
    formErrors.email = emailError
    isValid = false
  }

  // Validar contraseña
  const passwordError = validatePassword(formData.password)
  if (passwordError) {
    formErrors.password = passwordError
    isValid = false
  }

  return isValid
}

// Métodos
const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    isSubmitting.value = true
    authStore.clearError()

    const credentials: LoginCredentials = {
      email: formData.email,
      password: formData.password
    }

    const result = await authStore.login(credentials.email, credentials.password)

    if (result.success) {
      emit('success')
      props.onSuccess()
    } else {
      formErrors.general = result.error || 'Error en el login'
      emit('error', formErrors.general)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error inesperado'
    formErrors.general = errorMessage
    emit('error', errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

const handleSwitchToRegister = () => {
  emit('switchToRegister')
  props.onSwitchToRegister()
}

const clearErrors = () => {
  Object.keys(formErrors).forEach(key => {
    delete formErrors[key as keyof AuthFormErrors]
  })
  authStore.clearError()
}

// Limpiar errores cuando cambian los campos
const handleEmailChange = () => {
  if (formErrors.email) {
    delete formErrors.email
  }
}

const handlePasswordChange = () => {
  if (formErrors.password) {
    delete formErrors.password
  }
}

// Exponer métodos para uso externo
defineExpose({
  clearErrors,
  validateForm,
  formData,
  formErrors
})
</script>
