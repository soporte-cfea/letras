<template>
  <div class="role-manager">
    <div class="container">
      <div class="header">
        <div style="display: flex; justify-content: flex-end; align-items: center;">
          <button 
            @click="saveAllChanges"
            :disabled="loading || !hasChanges"
            style="padding: 0.5rem 1rem; background-color: #2563eb; color: white; border-radius: 0.375rem; border: none; font-size: 0.875rem; font-weight: 500; cursor: pointer;"
            :style="{ opacity: (loading || !hasChanges) ? 0.5 : 1, cursor: (loading || !hasChanges) ? 'not-allowed' : 'pointer' }"
          >
            {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
      
      <!-- Lista de Usuarios -->
      <div>
        <div v-if="loading && users.length === 0" style="text-align: center; padding: 2rem; color: #6b7280;">
          Cargando usuarios...
        </div>
        
        <div v-else-if="users.length === 0" style="text-align: center; padding: 2rem; color: #6b7280;">
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
                  <h3 class="user-email" style="font-weight: 500; color: #111827; margin: 0;">{{ user.email }}</h3>
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
      <div v-if="error" style="margin-top: 1rem; padding: 0.75rem; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 0.375rem; color: #dc2626; font-size: 0.875rem;">
        {{ error }}
      </div>
      <div v-if="successMessage" style="margin-top: 1rem; padding: 0.75rem; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.375rem; color: #16a34a; font-size: 0.875rem;">
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
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.role-manager .user-header {
  margin-bottom: 1rem;
}

.role-manager .user-email {
  margin-bottom: 0.25rem;
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
  color: #374151;
}

.role-manager .control-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
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
  border: 1px solid #d1d5db;
}

.role-manager .permission-label {
  font-size: 0.875rem;
  color: #374151;
}

.role-manager .badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.role-manager .badge-admin {
  background-color: #dbeafe;
  color: #1e40af;
}

.role-manager .badge-super-admin {
  background-color: #e9d5ff;
  color: #7c3aed;
}

.role-manager .badge-user {
  background-color: #f3f4f6;
  color: #374151;
}

.role-manager .change-indicator {
  width: 0.5rem;
  height: 0.5rem;
  background-color: #f59e0b;
  border-radius: 50%;
}
</style>
