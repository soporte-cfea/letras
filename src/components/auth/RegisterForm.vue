<template>
  <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <img class="mx-auto h-10 w-auto" src="/favicon-32x32.png" alt="Letras App" />
      <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">Crea tu cuenta</h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label for="name" class="block text-sm/6 font-medium text-gray-100">Nombre (opcional)</label>
          <div class="mt-2">
            <input 
              v-model="formData.name"
              @input="handleNameChange"
              type="text" 
              name="name" 
              id="name" 
              autocomplete="name" 
              class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6" 
              placeholder="Tu nombre"
            />
            <p v-if="formErrors.name" class="mt-1 text-sm text-red-400">{{ formErrors.name }}</p>
          </div>
        </div>

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
              autocomplete="new-password" 
              required 
              class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6" 
              placeholder="mínimo 6 caracteres"
            />
            <p v-if="formErrors.password" class="mt-1 text-sm text-red-400">{{ formErrors.password }}</p>
          </div>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm/6 font-medium text-gray-100">Confirmar contraseña</label>
          <div class="mt-2">
            <input 
              v-model="formData.confirmPassword"
              @input="handleConfirmPasswordChange"
              type="password" 
              name="confirmPassword" 
              id="confirmPassword" 
              autocomplete="new-password" 
              required 
              class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6" 
              placeholder="repite tu contraseña"
            />
            <p v-if="formErrors.confirmPassword" class="mt-1 text-sm text-red-400">{{ formErrors.confirmPassword }}</p>
          </div>
        </div>

        <div>
          <button 
            type="submit" 
            :disabled="!isValid || isLoading"
            class="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading">Creando cuenta...</span>
            <span v-else>Crear cuenta</span>
          </button>
        </div>

        <!-- Error general -->
        <div v-if="formErrors.general" class="rounded-md bg-red-900/50 p-3">
          <p class="text-sm text-red-200">{{ formErrors.general }}</p>
        </div>
      </form>

      <p class="mt-10 text-center text-sm/6 text-gray-400">
        ¿Ya tienes cuenta?
        {{ ' ' }}
        <button 
          type="button"
          @click="handleSwitchToLogin"
          class="font-semibold text-blue-300 hover:text-blue-200"
        >
          Inicia sesión aquí
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { RegisterCredentials, AuthFormData, AuthFormErrors } from '@/types/auth'

// Props
interface Props {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  onSuccess: () => {},
  onSwitchToLogin: () => {}
})

// Emits
const emit = defineEmits<{
  success: []
  error: [message: string]
  switchToLogin: []
}>()

// Store
const authStore = useAuthStore()

// Estado del formulario
const formData = reactive<AuthFormData>({
  email: '',
  password: '',
  confirmPassword: '',
  name: ''
})

const formErrors = reactive<AuthFormErrors>({})
const isSubmitting = ref(false)

// Computed
const isValid = computed(() => {
  return formData.email && 
         formData.password && 
         formData.confirmPassword &&
         !formErrors.email && 
         !formErrors.password &&
         !formErrors.confirmPassword
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
  if (!/(?=.*[a-z])/.test(password)) return 'La contraseña debe contener al menos una letra minúscula'
  if (!/(?=.*[A-Z])/.test(password)) return 'La contraseña debe contener al menos una letra mayúscula'
  if (!/(?=.*\d)/.test(password)) return 'La contraseña debe contener al menos un número'
  return null
}

const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return 'Confirma tu contraseña'
  if (password !== confirmPassword) return 'Las contraseñas no coinciden'
  return null
}

const validateName = (name: string): string | null => {
  if (name && name.length < 2) return 'El nombre debe tener al menos 2 caracteres'
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

  // Validar confirmación de contraseña
  const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword)
  if (confirmPasswordError) {
    formErrors.confirmPassword = confirmPasswordError
    isValid = false
  }

  // Validar nombre (opcional)
  if (formData.name) {
    const nameError = validateName(formData.name)
    if (nameError) {
      formErrors.name = nameError
      isValid = false
    }
  }

  return isValid
}

// Métodos
const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    isSubmitting.value = true
    authStore.clearError()

    const credentials: RegisterCredentials = {
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      name: formData.name,
      metadata: formData.name ? { name: formData.name } : undefined
    }

    const result = await authStore.register(
      credentials.email, 
      credentials.password, 
      credentials.metadata
    )

    if (result.success) {
      emit('success')
      props.onSuccess()
    } else {
      formErrors.general = result.error || 'Error en el registro'
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

const handleSwitchToLogin = () => {
  emit('switchToLogin')
  props.onSwitchToLogin()
}

const clearErrors = () => {
  Object.keys(formErrors).forEach(key => {
    delete formErrors[key as keyof AuthFormErrors]
  })
  authStore.clearError()
}

const resetForm = () => {
  formData.email = ''
  formData.password = ''
  formData.confirmPassword = ''
  formData.name = ''
  clearErrors()
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
  if (formErrors.confirmPassword) {
    delete formErrors.confirmPassword
  }
}

const handleConfirmPasswordChange = () => {
  if (formErrors.confirmPassword) {
    delete formErrors.confirmPassword
  }
}

const handleNameChange = () => {
  if (formErrors.name) {
    delete formErrors.name
  }
}

// Exponer métodos para uso externo
defineExpose({
  clearErrors,
  resetForm,
  validateForm,
  formData,
  formErrors
})
</script>
