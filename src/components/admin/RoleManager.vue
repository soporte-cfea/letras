<template>
  <div class="role-manager">
    <div class="container">
      <!-- Header con búsqueda y filtros -->
      <div class="header">
        <div class="header-top">
          <p class="page-subtitle">Gestiona usuarios, roles y permisos del sistema</p>
          <button 
            @click="saveAllChanges"
            :disabled="loading || !hasChanges"
            class="save-button"
          >
            <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ loading ? 'Guardando...' : `Guardar Cambios${hasChanges ? ` (${Object.keys(localChanges).length})` : ''}` }}
          </button>
        </div>
        
        <!-- Estadísticas -->
        <div class="stats-container">
          <div class="stat-card">
            <svg class="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <div class="stat-content">
              <div class="stat-value">{{ filteredUsers.length }}</div>
              <div class="stat-label">Total Usuarios</div>
            </div>
          </div>
          <div class="stat-card">
            <svg class="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <div class="stat-content">
              <div class="stat-value">{{ statsByRole.super_admin }}</div>
              <div class="stat-label">Super Admin</div>
            </div>
          </div>
          <div class="stat-card">
            <svg class="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div class="stat-content">
              <div class="stat-value">{{ statsByRole.admin }}</div>
              <div class="stat-label">Administradores</div>
            </div>
          </div>
          <div class="stat-card">
            <svg class="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div class="stat-content">
              <div class="stat-value">{{ statsByRole.user }}</div>
              <div class="stat-label">Usuarios</div>
            </div>
          </div>
        </div>

        <!-- Búsqueda y Filtros -->
        <div class="filters-container">
          <div class="search-box">
            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="Buscar por email..."
              class="search-input"
            />
          </div>
          <div class="filter-box">
            <select v-model="roleFilter" class="filter-select">
              <option value="">Todos los roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Administrador</option>
              <option value="user">Usuario</option>
            </select>
          </div>
          <div class="sort-box">
            <select v-model="sortBy" class="filter-select">
              <option value="email">Ordenar por Email</option>
              <option value="role">Ordenar por Rol</option>
              <option value="created_at">Ordenar por Fecha</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Lista de Usuarios (Vista Compacta) -->
      <div class="users-list-container">
        <div v-if="loading && users.length === 0" class="empty-state">
          <div class="loading-spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
        
        <div v-else-if="filteredUsers.length === 0" class="empty-state">
          <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>{{ searchQuery || roleFilter ? 'No se encontraron usuarios con los filtros aplicados' : 'No hay usuarios registrados' }}</p>
        </div>
        
        <div v-else class="users-list">
          <div 
            v-for="user in filteredUsers" 
            :key="user.id"
            class="user-list-item"
            :class="{ 'has-changes': hasUserChanges(user.id) }"
            @click="openUserDetail(user)"
          >
            <div class="user-avatar">
              <div class="avatar-circle" :class="{ 'has-avatar': getUserAvatarUrl(user) }">
                <img v-if="getUserAvatarUrl(user)" :src="getUserAvatarUrl(user)" :alt="user.name || user.email" class="avatar-image" />
                <span v-else>{{ (user.name || user.email).charAt(0).toUpperCase() }}</span>
              </div>
            </div>
            
            <div class="user-info">
              <div class="user-main-info">
                <div class="user-name-section">
                  <h3 class="user-email">{{ user.name || user.email }}</h3>
                  <p class="user-email-subtitle" v-if="user.name">{{ user.email }}</p>
                </div>
                <span class="badge" 
                      :class="getUserRole(user.id) === 'super_admin' ? 'badge-super-admin' : getUserRole(user.id) === 'admin' ? 'badge-admin' : 'badge-user'">
                  {{ getUserRole(user.id) === 'super_admin' ? 'Super Admin' : getUserRole(user.id) === 'admin' ? 'Admin' : 'Usuario' }}
                </span>
              </div>
              <div class="user-meta">
                <span class="user-date">
                  <svg class="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ formatDate(user.created_at) }}
                </span>
                <span class="user-permissions" v-if="getUserPermissions(user.id).length > 0">
                  <svg class="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {{ getUserPermissions(user.id).length }} permiso(s)
                </span>
              </div>
            </div>
            
            <div class="user-actions">
              <div v-if="hasUserChanges(user.id)" class="change-indicator" title="Cambios pendientes">
                <svg class="change-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <svg class="chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensajes de Estado -->
      <div v-if="error" class="message-error">
        <svg class="message-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ error }}
      </div>
      <div v-if="successMessage" class="message-success">
        <svg class="message-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {{ successMessage }}
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRoleManagement } from '@/composables/useRoleManagement'
import { getUserAvatar } from '@/composables/useAvatar'
import type { UserWithRole } from './types'

// Store y composables
const router = useRouter()
const authStore = useAuthStore()
const { 
  loading, 
  error, 
  assignUserRole,
  listUsersWithRoles,
  updateUserPassword
} = useRoleManagement()

// Estado local
const users = ref<UserWithRole[]>([])
const localChanges = ref<Record<string, { role?: string; permissions?: string[] }>>({})
const successMessage = ref('')
const searchQuery = ref('')
const roleFilter = ref('')
const sortBy = ref('email')

// Computed
const hasChanges = computed(() => Object.keys(localChanges.value).length > 0)

// Estadísticas
const statsByRole = computed(() => {
  const stats = { super_admin: 0, admin: 0, user: 0 }
  users.value.forEach(user => {
    const role = user.role || 'user'
    if (role in stats) {
      stats[role as keyof typeof stats]++
    }
  })
  return stats
})

// Usuarios filtrados
const filteredUsers = computed(() => {
  let filtered = [...users.value]

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.email.toLowerCase().includes(query)
    )
  }

  // Filtrar por rol
  if (roleFilter.value) {
    filtered = filtered.filter(user => {
      const currentRole = localChanges.value[user.id]?.role || user.role
      return currentRole === roleFilter.value
    })
  }

  // Ordenar
  filtered.sort((a, b) => {
    const roleA = localChanges.value[a.id]?.role || a.role
    const roleB = localChanges.value[b.id]?.role || b.role
    
    switch (sortBy.value) {
      case 'email':
        return a.email.localeCompare(b.email)
      case 'role':
        const roleOrder = { super_admin: 0, admin: 1, user: 2 }
        return (roleOrder[roleA as keyof typeof roleOrder] || 2) - (roleOrder[roleB as keyof typeof roleOrder] || 2)
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        return 0
    }
  })

  return filtered
})

// Métodos
const loadUsers = async () => {
  const result = await listUsersWithRoles()
  if (result.success) {
    users.value = result.data
    localChanges.value = {} // Limpiar cambios al cargar
  }
}

// Formatear fecha
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

// Obtener rol actual (local o original)
const getUserRole = (userId: string) => {
  const user = users.value.find(u => u.id === userId)
  return localChanges.value[userId]?.role || user?.role || 'user'
}

// Obtener permisos del usuario
const getUserPermissions = (userId: string) => {
  const user = users.value.find(u => u.id === userId)
  return localChanges.value[userId]?.permissions || user?.permissions || []
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

// Abrir detalle de usuario
const openUserDetail = (user: UserWithRole) => {
  router.push(`/admin/usuarios/${user.id}`)
}

// Obtener URL del avatar del usuario
const getUserAvatarUrl = (user: UserWithRole): string | null => {
  return getUserAvatar({
    user_metadata: user.user_metadata,
    email: user.email,
    id: user.id
  })
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
.role-manager {
  width: 100%;
}

.role-manager .container {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.role-manager .header {
  margin-bottom: 2rem;
}

.role-manager .header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.role-manager .page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-soft);
  margin: 0;
  flex: 1;
}

.role-manager .save-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.role-manager .save-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.role-manager .save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.role-manager .button-icon {
  width: 1rem;
  height: 1rem;
}

.role-manager .stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.role-manager .stat-card {
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
}

.role-manager .stat-card:hover {
  border-color: var(--color-border-hover);
}

.role-manager .stat-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-text-soft);
  flex-shrink: 0;
}

.role-manager .stat-content {
  flex: 1;
}

.role-manager .stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 0.25rem;
  line-height: 1;
}

.role-manager .stat-label {
  font-size: 0.75rem;
  color: var(--color-text-soft);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-manager .filters-container {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.role-manager .search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
}

.role-manager .search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-text-mute);
  pointer-events: none;
}

.role-manager .search-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: var(--color-background);
  color: var(--color-text);
  transition: all 0.2s ease;
}

.role-manager .search-input:focus {
  outline: none;
  border-color: var(--color-info);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.role-manager .filter-box,
.role-manager .sort-box {
  min-width: 180px;
}

.role-manager .filter-select {
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

.role-manager .filter-select:focus {
  outline: none;
  border-color: var(--color-info);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.role-manager .users-list-container {
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  overflow: hidden;
}

.role-manager .users-list {
  display: flex;
  flex-direction: column;
}

.role-manager .user-list-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
}

.role-manager .user-list-item:last-child {
  border-bottom: none;
}

.role-manager .user-list-item:hover {
  background: var(--color-background-hover);
  border-left: 3px solid var(--color-info);
  padding-left: calc(1.5rem - 3px);
}

.role-manager .user-list-item.has-changes {
  border-left: 3px solid var(--color-warning);
}

.role-manager .user-avatar {
  flex-shrink: 0;
}

.role-manager .avatar-circle {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  overflow: hidden;
  position: relative;
}

.role-manager .avatar-circle.has-avatar {
  background: transparent;
}

.role-manager .avatar-circle .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.role-manager .user-info {
  flex: 1;
  min-width: 0;
}

.role-manager .user-main-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.role-manager .user-name-section {
  flex: 1;
  min-width: 0;
}

.role-manager .user-email {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-heading);
  margin: 0;
}

.role-manager .user-email-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-soft);
  margin: 0.25rem 0 0 0;
}

.role-manager .user-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.role-manager .user-date,
.role-manager .user-permissions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-text-soft);
}

.role-manager .meta-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.role-manager .badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
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

.role-manager .user-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.role-manager .change-indicator {
  color: var(--color-warning);
  animation: pulse 2s infinite;
}

.role-manager .change-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.role-manager .chevron-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-text-mute);
  transition: transform 0.2s ease;
}

.role-manager .user-list-item:hover .chevron-icon {
  transform: translateX(4px);
  color: var(--color-text);
}

.role-manager .empty-state {
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--color-text-soft);
}

.role-manager .empty-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
  color: var(--color-text-soft);
  opacity: 0.5;
}

.role-manager .loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-info);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.role-manager .message-error,
.role-manager .message-success {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.role-manager .message-error {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-error);
  color: var(--color-error);
}

.role-manager .message-success {
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid var(--color-success);
  color: var(--color-success);
}

.role-manager .message-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .role-manager .container {
    padding: 1rem;
  }

  .role-manager .header-top {
    flex-direction: column;
  }

  .role-manager .save-button {
    width: 100%;
    justify-content: center;
  }

  .role-manager .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }

  .role-manager .filters-container {
    flex-direction: column;
  }

  .role-manager .user-list-item {
    padding: 1rem;
  }

  .role-manager .user-main-info {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
