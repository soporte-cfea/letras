<template>
  <div class="role-manager">
    <div class="container">
      <div class="header">
        <div style="display: flex; justify-content: flex-end; align-items: center;">
          <button 
            @click="saveAllChanges"
            :disabled="loading || !hasChanges"
            class="save-button"
          >
            {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
      
      <!-- Lista de Usuarios -->
      <div>
        <div v-if="loading && users.length === 0" class="empty-state">
          Cargando usuarios...
        </div>
        
        <div v-else-if="users.length === 0" class="empty-state">
          No hay usuarios registrados
        </div>
        
        <div v-else>
          <div 
            v-for="user in users" 
            :key="user.id"
            class="user-card"
          >
            <!-- Información del Usuario -->
            <div class="user-header">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <h3 class="user-email">{{ user.email }}</h3>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span class="badge" 
                        :class="user.role === 'super_admin' ? 'badge-super-admin' : user.role === 'admin' ? 'badge-admin' : 'badge-user'">
                    {{ user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User' }}
                  </span>
                  <div v-if="hasUserChanges(user.id)" class="change-indicator" title="Cambios pendientes"></div>
                </div>
              </div>
            </div>
            
            <!-- Controles de Rol -->
            <div class="controls-section">
              <div class="control-group">
                <label class="control-label">Rol</label>
                <select 
                  :value="getUserRole(user.id)"
                  @change="updateUserRoleLocal(user.id, $event.target.value)"
                  :disabled="loading || user.role === 'super_admin'"
                  class="control-select"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                  <option value="super_admin">Super Administrador</option>
                </select>
              </div>
              
              <!-- Permisos -->
              <div class="control-group">
                <label class="control-label">Permisos</label>
                <div class="permissions-list">
                  <div class="permission-item">
                    <input 
                      type="checkbox" 
                      :checked="getUserPermission(user.id, 'create:lists')"
                      @change="updateUserPermission(user.id, 'create:lists', $event.target.checked)"
                      :disabled="loading || user.role === 'super_admin'"
                      class="permission-checkbox"
                    >
                    <span class="permission-label">Crear listas</span>
                  </div>
                  <div class="permission-item">
                    <input 
                      type="checkbox" 
                      :checked="getUserPermission(user.id, 'create:songs')"
                      @change="updateUserPermission(user.id, 'create:songs', $event.target.checked)"
                      :disabled="loading || user.role === 'user' || user.role === 'super_admin'"
                      class="permission-checkbox"
                    >
                    <span class="permission-label">Crear canciones</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensajes de Estado -->
      <div v-if="error" class="message-error">
        {{ error }}
      </div>
      <div v-if="successMessage" class="message-success">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoleManagement } from '@/composables/useRoleManagement'

// Store y composables
const authStore = useAuthStore()
const { 
  loading, 
  error, 
  assignUserRole,
  listUsersWithRoles 
} = useRoleManagement()

// Estado local
const users = ref<any[]>([])
const localChanges = ref<Record<string, { role?: string; permissions?: string[] }>>({})
const successMessage = ref('')

// Computed
const hasChanges = computed(() => Object.keys(localChanges.value).length > 0)

// Métodos
const loadUsers = async () => {
  const result = await listUsersWithRoles()
  if (result.success) {
    users.value = result.data
    localChanges.value = {} // Limpiar cambios al cargar
  }
}

// Obtener rol actual (local o original)
const getUserRole = (userId: string) => {
  const user = users.value.find(u => u.id === userId)
  return localChanges.value[userId]?.role || user?.role || 'user'
}

// Obtener permiso actual (local o original)
const getUserPermission = (userId: string, permission: string) => {
  const user = users.value.find(u => u.id === userId)
  const currentPermissions = localChanges.value[userId]?.permissions || user?.permissions || []
  return currentPermissions.includes(permission)
}

// Actualizar rol localmente
const updateUserRoleLocal = (userId: string, newRole: string) => {
  const user = users.value.find(u => u.id === userId)
  if (!user) return
  
  // Si se regresa al rol original, limpiar cambios
  if (newRole === user.role) {
    if (localChanges.value[userId]) {
      delete localChanges.value[userId]
    }
    return
  }
  
  if (!localChanges.value[userId]) {
    localChanges.value[userId] = {}
  }
  localChanges.value[userId].role = newRole
  
  // Actualizar permisos automáticamente según el rol
  const permissions = newRole === 'super_admin' 
    ? ['create:songs', 'create:lists', 'manage:roles', 'manage:users']
    : newRole === 'admin' 
    ? ['create:songs', 'create:lists']
    : [] // Los usuarios básicos no tienen permisos
  
  localChanges.value[userId].permissions = permissions
}

// Actualizar permiso localmente
const updateUserPermission = (userId: string, permission: string, enabled: boolean) => {
  const user = users.value.find(u => u.id === userId)
  if (!user) return
  
  const originalPermissions = user.permissions || []
  const currentPermissions = localChanges.value[userId]?.permissions || originalPermissions
  
  let newPermissions = [...currentPermissions]
  
  if (enabled) {
    if (!newPermissions.includes(permission)) {
      newPermissions.push(permission)
    }
  } else {
    newPermissions = newPermissions.filter(p => p !== permission)
  }
  
  // Verificar si se regresa al estado original
  const isBackToOriginal = JSON.stringify(originalPermissions.sort()) === JSON.stringify(newPermissions.sort())
  
  if (isBackToOriginal) {
    // Si no hay otros cambios, eliminar completamente el objeto de cambios
    if (localChanges.value[userId] && !localChanges.value[userId].role) {
      delete localChanges.value[userId]
      return
    }
    // Si hay cambios de rol, solo limpiar los permisos
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

// Verificar si un usuario tiene cambios
const hasUserChanges = (userId: string) => {
  const user = users.value.find(u => u.id === userId)
  const changes = localChanges.value[userId]
  
  if (!changes || !user) return false
  
  // Verificar si el rol cambió
  const roleChanged = changes.role && changes.role !== user.role
  
  // Verificar si los permisos cambiaron
  const originalPermissions = user.permissions || []
  const currentPermissions = changes.permissions || originalPermissions
  const permissionsChanged = JSON.stringify(originalPermissions.sort()) !== JSON.stringify(currentPermissions.sort())
  
  // Si no hay cambios reales, limpiar el objeto de cambios
  if (!roleChanged && !permissionsChanged) {
    delete localChanges.value[userId]
    return false
  }
  
  return true
}

// Guardar todos los cambios
const saveAllChanges = async () => {
  try {
    const promises = Object.entries(localChanges.value).map(async ([userId, changes]) => {
      const user = users.value.find(u => u.id === userId)
      if (!user) return
      
      const finalRole = changes.role || user.role
      const finalPermissions = changes.permissions || user.permissions
      
      return await assignUserRole(userId, finalRole, finalPermissions)
    })
    
    const results = await Promise.all(promises)
    const allSuccessful = results.every(result => result.success)
    
    if (allSuccessful) {
      successMessage.value = 'Todos los cambios se guardaron correctamente'
      localChanges.value = {} // Limpiar cambios
      await loadUsers() // Recargar datos
      
      // Refrescar sesión del usuario actual para actualizar permisos
      await authStore.refreshUserSession()
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      successMessage.value = 'Algunos cambios no se pudieron guardar'
    }
  } catch (err) {
    console.error('Error saving changes:', err)
    successMessage.value = 'Error al guardar los cambios'
  }
}

// Cargar usuarios al montar el componente
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
/* Reset específico para este componente */
.role-manager * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Espaciados específicos */
.role-manager .container {
  padding: 1.5rem;
}

.role-manager .header {
  margin-bottom: 1.5rem;
}

.role-manager .user-card {
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
}

.role-manager .user-header {
  margin-bottom: 1rem;
}

.role-manager .user-email {
  margin-bottom: 0.25rem;
  font-weight: 500;
  color: var(--color-heading);
  margin: 0;
}

.role-manager .controls-section {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
}

.role-manager .control-group {
  flex: 1;
}

.role-manager .control-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.role-manager .control-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: var(--color-background);
  color: var(--color-text);
  transition: border-color 0.2s ease;
}

.role-manager .control-select:focus {
  outline: none;
  border-color: var(--color-info);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.role-manager .control-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.role-manager .permissions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.role-manager .permission-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.role-manager .permission-checkbox {
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  border: 1px solid var(--color-border);
  cursor: pointer;
  accent-color: var(--color-info);
}

.role-manager .permission-checkbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.role-manager .permission-label {
  font-size: 0.875rem;
  color: var(--color-text);
  cursor: pointer;
}

.role-manager .badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.role-manager .badge-admin {
  background-color: rgba(59, 130, 246, 0.2);
  color: var(--color-info);
}

.role-manager .badge-super-admin {
  background-color: rgba(147, 51, 234, 0.2);
  color: #a855f7;
}

.role-manager .badge-user {
  background-color: var(--color-background-mute);
  color: var(--color-text);
}

.role-manager .change-indicator {
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--color-warning);
  border-radius: 50%;
}

.role-manager .save-button {
  padding: 0.5rem 1rem;
  background-color: var(--color-info);
  color: white;
  border-radius: 0.375rem;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.role-manager .save-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.role-manager .save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.role-manager .empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-soft);
}

.role-manager .message-error {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-error);
  border-radius: 0.375rem;
  color: var(--color-error);
  font-size: 0.875rem;
}

.role-manager .message-success {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid var(--color-success);
  border-radius: 0.375rem;
  color: var(--color-success);
  font-size: 0.875rem;
}
</style>
