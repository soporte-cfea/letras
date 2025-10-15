import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { UserRole, Permission, RolePermissions } from '@/types/auth'

// Configuración de permisos por rol
const rolePermissions: RolePermissions = {
  super_admin: ['create:songs', 'create:lists', 'manage:roles', 'manage:users'],
  admin: ['create:songs', 'create:lists'],
  user: [] // Los usuarios básicos no tienen permisos de creación
}

export function usePermissions() {
  const authStore = useAuthStore()

  // Obtener el rol del usuario actual
  const userRole = computed((): UserRole => {
    return authStore.user?.user_metadata?.role || 'user'
  })

  // Obtener permisos del usuario actual
  const userPermissions = computed((): Permission[] => {
    return authStore.user?.user_metadata?.permissions || rolePermissions[userRole.value] || []
  })

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role: UserRole): boolean => {
    return userRole.value === role
  }

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (permission: Permission): boolean => {
    return userPermissions.value.includes(permission)
  }

  // Verificar si puede crear canciones
  const canCreateSongs = computed((): boolean => {
    return hasPermission('create:songs')
  })

  // Verificar si puede crear listas
  const canCreateLists = computed((): boolean => {
    return hasPermission('create:lists')
  })

  // Verificar si puede editar canciones
  const canEditSongs = computed((): boolean => {
    return hasPermission('create:songs') // Los que pueden crear también pueden editar
  })

  // Verificar si puede eliminar canciones
  const canDeleteSongs = computed((): boolean => {
    return hasPermission('create:songs') // Los que pueden crear también pueden eliminar
  })

  // Verificar si puede gestionar roles
  const canManageRoles = computed((): boolean => {
    return hasPermission('manage:roles')
  })

  // Verificar si puede gestionar usuarios
  const canManageUsers = computed((): boolean => {
    return hasPermission('manage:users')
  })

  // Verificar si es super administrador
  const isSuperAdmin = computed((): boolean => {
    return hasRole('super_admin')
  })

  // Verificar si es administrador
  const isAdmin = computed((): boolean => {
    return hasRole('admin') || hasRole('super_admin')
  })

  // Verificar si es usuario básico
  const isUser = computed((): boolean => {
    return hasRole('user')
  })

  return {
    userRole,
    userPermissions,
    hasRole,
    hasPermission,
    canCreateSongs,
    canCreateLists,
    canEditSongs,
    canDeleteSongs,
    canManageRoles,
    canManageUsers,
    isSuperAdmin,
    isAdmin,
    isUser
  }
}
