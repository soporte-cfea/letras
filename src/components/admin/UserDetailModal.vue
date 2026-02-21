<template>
  <div v-if="show" class="user-detail-modal-overlay" @click.self="closeModal">
    <div class="user-detail-modal-content" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <div class="header-info">
          <h3 class="modal-title">Detalle de Usuario</h3>
          <p class="modal-subtitle">{{ user?.email }}</p>
        </div>
        <button @click="closeModal" class="close-button" aria-label="Cerrar">
          <svg class="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="modal-body" v-if="user">
        <!-- Información del Usuario -->
        <div class="info-section">
          <h4 class="section-title">Información</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Email:</span>
              <span class="info-value">{{ user.email }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Rol Actual:</span>
              <span class="info-value">
                <span class="badge" 
                      :class="getUserRole(user.id) === 'super_admin' ? 'badge-super-admin' : getUserRole(user.id) === 'admin' ? 'badge-admin' : 'badge-user'">
                  {{ getUserRole(user.id) === 'super_admin' ? 'Super Admin' : getUserRole(user.id) === 'admin' ? 'Admin' : 'Usuario' }}
                </span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Fecha de Registro:</span>
              <span class="info-value">{{ formatDate(user.created_at) }}</span>
            </div>
            <div class="info-item" v-if="hasUserChanges(user.id)">
              <span class="info-label">Estado:</span>
              <span class="info-value change-pending">
                <span class="change-indicator"></span>
                Cambios pendientes
              </span>
            </div>
          </div>
        </div>

        <!-- Rol y Permisos -->
        <div class="controls-section">
          <h4 class="section-title">Rol y Permisos</h4>
          
          <div class="control-group">
            <label class="control-label">Rol</label>
            <select 
              :value="getUserRole(user.id)"
              @change="updateUserRoleLocal(user.id, ($event.target as HTMLSelectElement).value)"
              :disabled="loading || getUserRole(user.id) === 'super_admin'"
              class="control-select"
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
              <option value="super_admin">Super Administrador</option>
            </select>
            <p class="control-hint" v-if="getUserRole(user.id) === 'super_admin'">
              El rol de Super Admin no puede ser modificado
            </p>
          </div>

          <div class="control-group">
            <label class="control-label">Permisos</label>
            <div class="permissions-list">
              <div class="permission-item">
                <label class="permission-label-wrapper">
                  <input 
                    type="checkbox" 
                    :checked="getUserPermission(user.id, 'create:lists')"
                    @change="updateUserPermission(user.id, 'create:lists', ($event.target as HTMLInputElement).checked)"
                    :disabled="loading || getUserRole(user.id) === 'super_admin'"
                    class="permission-checkbox"
                  >
                  <span class="permission-label">Crear listas</span>
                </label>
                <span class="permission-description">Permite crear y gestionar colecciones</span>
              </div>
              <div class="permission-item">
                <label class="permission-label-wrapper">
                  <input 
                    type="checkbox" 
                    :checked="getUserPermission(user.id, 'create:songs')"
                    @change="updateUserPermission(user.id, 'create:songs', ($event.target as HTMLInputElement).checked)"
                    :disabled="loading || getUserRole(user.id) === 'user' || getUserRole(user.id) === 'super_admin'"
                    class="permission-checkbox"
                  >
                  <span class="permission-label">Crear canciones</span>
                </label>
                <span class="permission-description">Permite crear y editar canciones</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actualizar Contraseña -->
        <div class="password-section">
          <h4 class="section-title">Seguridad</h4>
          <div class="password-control">
            <div class="password-input-wrapper">
              <input 
                type="password" 
                v-model="passwordInput"
                placeholder="Nueva contraseña"
                class="password-input"
                @keyup.enter="updatePassword()"
              />
              <button 
                @click="updatePassword"
                :disabled="loading || !passwordInput || updatingPassword"
                class="password-button"
              >
                <span v-if="updatingPassword">Actualizando...</span>
                <span v-else>Actualizar Contraseña</span>
              </button>
            </div>
            <p class="password-hint">La contraseña se actualizará inmediatamente</p>
            <div v-if="passwordMessage" 
                 :class="passwordMessage.type === 'success' ? 'password-message success' : 'password-message error'">
              {{ passwordMessage.text }}
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="actions-section">
          <button 
            @click="saveChanges"
            :disabled="loading || !hasUserChanges(user.id)"
            class="action-button primary"
          >
            <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Guardar Cambios
          </button>
          <button 
            @click="discardChanges"
            :disabled="loading || !hasUserChanges(user.id)"
            class="action-button secondary"
          >
            Descartar Cambios
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { UserWithRole } from './types'

interface Props {
  show: boolean
  user: UserWithRole | null
  loading: boolean
  getUserRole: (userId: string) => string
  getUserPermission: (userId: string, permission: string) => boolean
  hasUserChanges: (userId: string) => boolean
  updateUserRoleLocal: (userId: string, role: string) => void
  updateUserPermission: (userId: string, permission: string, enabled: boolean) => void
  updatePassword: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>
  saveUserChanges: (userId: string) => Promise<void>
  discardUserChanges: (userId: string) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const passwordInput = ref('')
const updatingPassword = ref(false)
const passwordMessage = ref<{ type: 'success' | 'error', text: string } | null>(null)

// Limpiar contraseña cuando se cierra el modal
watch(() => props.show, (newValue) => {
  if (!newValue) {
    passwordInput.value = ''
    passwordMessage.value = null
  }
})

const closeModal = () => {
  emit('close')
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const updatePassword = async () => {
  if (!props.user || !passwordInput.value) return

  updatingPassword.value = true
  passwordMessage.value = null

  try {
    const result = await props.updatePassword(props.user.id, passwordInput.value)
    
    if (result.success) {
      passwordMessage.value = {
        type: 'success',
        text: 'Contraseña actualizada correctamente'
      }
      passwordInput.value = ''
      
      setTimeout(() => {
        passwordMessage.value = null
      }, 3000)
    } else {
      passwordMessage.value = {
        type: 'error',
        text: result.error || 'Error al actualizar contraseña'
      }
    }
  } catch (err) {
    passwordMessage.value = {
      type: 'error',
      text: 'Error al actualizar contraseña'
    }
  } finally {
    updatingPassword.value = false
  }
}

const saveChanges = async () => {
  if (!props.user) return
  await props.saveUserChanges(props.user.id)
}

const discardChanges = () => {
  if (!props.user) return
  props.discardUserChanges(props.user.id)
}

</script>

<style scoped>
.user-detail-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;
}

.user-detail-modal-content {
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: slideUp 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
  border-radius: 1rem 1rem 0 0;
}

.header-info {
  flex: 1;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 0.25rem 0;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-soft);
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: var(--color-text-mute);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.close-button:hover {
  background: var(--color-background-hover);
  color: var(--color-text);
}

.close-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.modal-body {
  padding: 1.5rem;
}

.info-section,
.controls-section,
.password-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-border);
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-soft);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 0.875rem;
  color: var(--color-text);
}

.change-pending {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-warning);
}

.change-indicator {
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--color-warning);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-admin {
  background-color: rgba(59, 130, 246, 0.2);
  color: var(--color-info);
}

.badge-super-admin {
  background-color: rgba(147, 51, 234, 0.2);
  color: #a855f7;
}

.badge-user {
  background-color: var(--color-background-mute);
  color: var(--color-text);
}

.control-group {
  margin-bottom: 1.5rem;
}

.control-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.control-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: var(--color-background);
  color: var(--color-text);
  transition: all 0.2s ease;
  cursor: pointer;
}

.control-select:focus {
  outline: none;
  border-color: var(--color-info);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.control-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-hint {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-soft);
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.permission-item {
  padding: 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.permission-item:hover {
  border-color: var(--color-border-hover);
  background: var(--color-background-hover);
}

.permission-label-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.permission-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  border: 1px solid var(--color-border);
  cursor: pointer;
  accent-color: var(--color-info);
  flex-shrink: 0;
}

.permission-checkbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.permission-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.permission-description {
  font-size: 0.75rem;
  color: var(--color-text-soft);
  margin-left: 2rem;
}

.password-control {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.password-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.password-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: var(--color-background);
  color: var(--color-text);
  transition: all 0.2s ease;
}

.password-input:focus {
  outline: none;
  border-color: var(--color-info);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.password-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-info);
  color: white;
  border-radius: 0.5rem;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.password-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.password-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.password-hint {
  font-size: 0.75rem;
  color: var(--color-text-soft);
  margin: 0;
}

.password-message {
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.password-message.success {
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid var(--color-success);
  color: var(--color-success);
}

.password-message.error {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-error);
  color: var(--color-error);
}

.actions-section {
  display: flex;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.action-button {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
}

.action-button.primary {
  background-color: var(--color-info);
  color: white;
}

.action-button.primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.action-button.secondary {
  background-color: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.action-button.secondary:hover:not(:disabled) {
  background-color: var(--color-background-hover);
  border-color: var(--color-border-hover);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-icon {
  width: 1rem;
  height: 1rem;
}

@media (max-width: 640px) {
  .user-detail-modal-content {
    max-height: 95vh;
  }

  .password-input-wrapper {
    flex-direction: column;
  }

  .password-button {
    width: 100%;
  }

  .actions-section {
    flex-direction: column;
  }
}
</style>

