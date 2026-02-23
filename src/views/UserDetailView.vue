<template>
  <section class="user-detail-view">
    <div class="view-header">
      <BackButton />
      <h1 class="view-title">Detalle de Usuario</h1>
    </div>

    <div class="view-content" v-if="loading && !user">
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Cargando información del usuario...</p>
      </div>
    </div>

    <div class="view-content" v-else-if="error">
      <div class="error-state">
        <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>{{ error }}</p>
        <button @click="goBack" class="back-button">Volver</button>
      </div>
    </div>

    <div class="view-content" v-else-if="user">
      <!-- Información del Usuario -->
      <div class="info-section">
        <div class="user-header-card">
          <div class="user-avatar-large">
            <div class="avatar-circle" :class="{ 'has-avatar': getUserAvatarUrl(user) }">
              <img v-if="getUserAvatarUrl(user)" :src="getUserAvatarUrl(user)" :alt="user.name || user.email" class="avatar-image" />
              <span v-else>{{ (user.name || user.email).charAt(0).toUpperCase() }}</span>
            </div>
          </div>
          <div class="user-header-info">
            <h2 class="user-email-large">{{ user.name || user.email }}</h2>
            <p class="user-email-subtitle" v-if="user.name">{{ user.email }}</p>
            <div class="user-badges">
              <span class="badge" 
                    :class="getUserRole(user.id) === 'super_admin' ? 'badge-super-admin' : getUserRole(user.id) === 'admin' ? 'badge-admin' : 'badge-user'">
                {{ getUserRole(user.id) === 'super_admin' ? 'Super Admin' : getUserRole(user.id) === 'admin' ? 'Admin' : 'Usuario' }}
              </span>
              <span v-if="hasUserChanges(user.id)" class="change-badge">
                <svg class="change-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Cambios pendientes
              </span>
            </div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Email</span>
            <span class="info-value">{{ user.email }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Fecha de Registro</span>
            <span class="info-value">{{ formatDate(user.created_at) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Rol Actual</span>
            <span class="info-value">
              <span class="badge" 
                    :class="getUserRole(user.id) === 'super_admin' ? 'badge-super-admin' : getUserRole(user.id) === 'admin' ? 'badge-admin' : 'badge-user'">
                {{ getUserRole(user.id) === 'super_admin' ? 'Super Admin' : getUserRole(user.id) === 'admin' ? 'Admin' : 'Usuario' }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- Rol y Permisos -->
      <div class="controls-section">
        <h3 class="section-title">Rol y Permisos</h3>
        
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
        <h3 class="section-title">Seguridad</h3>
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
              @click="updatePassword()"
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
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRoleManagement } from '@/composables/useRoleManagement'
import { getUserAvatar } from '@/composables/useAvatar'
import BackButton from '@/components/BackButton.vue'
import type { UserWithRole } from '@/components/admin/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { 
  assignUserRole,
  listUsersWithRoles,
  updateUserPassword
} = useRoleManagement()

const user = ref<UserWithRole | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const passwordInput = ref('')
const updatingPassword = ref(false)
const passwordMessage = ref<{ type: 'success' | 'error', text: string } | null>(null)
const localChanges = ref<Record<string, { role?: string; permissions?: string[] }>>({})

// Cargar usuario
const loadUser = async () => {
  const userId = route.params.id as string
  if (!userId) {
    error.value = 'ID de usuario no válido'
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await listUsersWithRoles()
    if (result.success) {
      const foundUser = result.data.find(u => u.id === userId)
      if (foundUser) {
        user.value = foundUser
      } else {
        error.value = 'Usuario no encontrado'
      }
    } else {
      error.value = result.error || 'Error al cargar usuario'
    }
  } catch (err) {
    error.value = 'Error al cargar información del usuario'
  } finally {
    loading.value = false
  }
}

// Obtener rol actual
const getUserRole = (userId: string) => {
  if (!user.value) return 'user'
  return localChanges.value[userId]?.role || user.value.role || 'user'
}

// Obtener permiso actual
const getUserPermission = (userId: string, permission: string) => {
  if (!user.value) return false
  const currentPermissions = localChanges.value[userId]?.permissions || user.value.permissions || []
  return currentPermissions.includes(permission)
}

// Verificar si tiene cambios
const hasUserChanges = (userId: string) => {
  if (!user.value) return false
  const changes = localChanges.value[userId]
  if (!changes) return false
  
  const roleChanged = changes.role && changes.role !== user.value.role
  const originalPermissions = user.value.permissions || []
  const currentPermissions = changes.permissions || originalPermissions
  const permissionsChanged = JSON.stringify(originalPermissions.sort()) !== JSON.stringify(currentPermissions.sort())
  
  if (!roleChanged && !permissionsChanged) {
    delete localChanges.value[userId]
    return false
  }
  
  return true
}

// Actualizar rol localmente
const updateUserRoleLocal = (userId: string, newRole: string) => {
  if (!user.value) return
  
  if (newRole === user.value.role) {
    if (localChanges.value[userId]) {
      delete localChanges.value[userId]
    }
    return
  }
  
  if (!localChanges.value[userId]) {
    localChanges.value[userId] = {}
  }
  localChanges.value[userId].role = newRole
  
  const permissions = newRole === 'super_admin' 
    ? ['create:songs', 'create:lists', 'manage:roles', 'manage:users']
    : newRole === 'admin' 
    ? ['create:songs', 'create:lists']
    : []
  
  localChanges.value[userId].permissions = permissions
}

// Actualizar permiso localmente
const updateUserPermission = (userId: string, permission: string, enabled: boolean) => {
  if (!user.value) return
  
  const originalPermissions = user.value.permissions || []
  const currentPermissions = localChanges.value[userId]?.permissions || originalPermissions
  
  let newPermissions = [...currentPermissions]
  
  if (enabled) {
    if (!newPermissions.includes(permission)) {
      newPermissions.push(permission)
    }
  } else {
    newPermissions = newPermissions.filter(p => p !== permission)
  }
  
  const isBackToOriginal = JSON.stringify(originalPermissions.sort()) === JSON.stringify(newPermissions.sort())
  
  if (isBackToOriginal) {
    if (localChanges.value[userId] && !localChanges.value[userId].role) {
      delete localChanges.value[userId]
      return
    }
    if (localChanges.value[userId]) {
      delete localChanges.value[userId].permissions
    }
    return
  }
  
  if (!localChanges.value[userId]) {
    localChanges.value[userId] = {}
  }
  
  localChanges.value[userId].permissions = newPermissions
}

// Actualizar contraseña
const updatePassword = async () => {
  if (!user.value || !passwordInput.value) return

  updatingPassword.value = true
  passwordMessage.value = null

  try {
    const result = await updateUserPassword(user.value.id, passwordInput.value)
    
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

// Guardar cambios
const saveChanges = async () => {
  if (!user.value) return
  
  const changes = localChanges.value[user.value.id]
  if (!changes) return
  
  loading.value = true
  
  try {
    const finalRole = changes.role || user.value.role
    const finalPermissions = changes.permissions || user.value.permissions
    
    const result = await assignUserRole(user.value.id, finalRole, finalPermissions)
    
    if (result.success) {
      delete localChanges.value[user.value.id]
      await loadUser()
      
      if (authStore.userId === user.value.id) {
        await authStore.refreshUserSession()
      }
    } else {
      error.value = result.error || 'Error al guardar cambios'
    }
  } catch (err) {
    error.value = 'Error al guardar cambios'
  } finally {
    loading.value = false
  }
}

// Descartar cambios
const discardChanges = () => {
  if (!user.value) return
  delete localChanges.value[user.value.id]
}

// Formatear fecha
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

// Volver
const goBack = () => {
  router.push('/admin/usuarios')
}

// Obtener URL del avatar del usuario
const getUserAvatarUrl = (user: UserWithRole | null): string | null => {
  if (!user) return null
  return getUserAvatar({
    user_metadata: user.user_metadata,
    email: user.email,
    id: user.id
  })
}

onMounted(() => {
  loadUser()
})
</script>

<style scoped>
.user-detail-view {
  min-height: 100vh;
  background: var(--color-background);
  display: flex;
  flex-direction: column;
}

.view-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
  position: sticky;
  top: 0;
  z-index: 10;
}

.view-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
}

.view-content {
  flex: 1;
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: var(--color-text-soft);
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-info);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  width: 3rem;
  height: 3rem;
  color: var(--color-error);
  margin-bottom: 1rem;
}

.back-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: var(--color-background-hover);
}

.info-section {
  margin-bottom: 2rem;
}

.user-header-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  background: transparent;
}

.user-avatar-large {
  flex-shrink: 0;
}

.avatar-circle {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 500;
  overflow: hidden;
  position: relative;
}

.avatar-circle.has-avatar {
  background: transparent;
}

.avatar-circle .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-header-info {
  flex: 1;
}

.user-email-large {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.25rem 0;
}

.user-email-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-soft);
  margin: 0 0 0.75rem 0;
}

.user-badges {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
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

.change-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background-color: rgba(255, 193, 7, 0.1);
  color: var(--color-warning);
  font-size: 0.75rem;
  font-weight: 500;
}

.change-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: transparent;
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

.controls-section,
.password-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: transparent;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
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
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.permission-item:hover {
  border-color: var(--color-border-hover);
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
  background-color: transparent;
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
  .view-content {
    padding: 1rem;
  }

  .user-header-card {
    flex-direction: column;
    text-align: center;
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

