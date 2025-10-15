import { usePermissions } from './usePermissions'
import type { UserRole, Permission } from '@/types/auth'

/**
 * Composable con funciones helper para verificación de roles y permisos
 */
export function useRoleHelpers() {
  const { hasRole, hasPermission, canCreateSongs, canCreateLists, isAdmin, isUser } = usePermissions()

  /**
   * Verificar si el usuario puede realizar una acción específica
   */
  const canPerformAction = (action: string): boolean => {
    switch (action) {
      case 'create_songs':
        return canCreateSongs()
      case 'create_lists':
        return canCreateLists()
      case 'admin_actions':
        return isAdmin.value
      default:
        return false
    }
  }

  /**
   * Verificar si el usuario tiene al menos uno de los roles especificados
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role))
  }

  /**
   * Verificar si el usuario tiene al menos uno de los permisos especificados
   */
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  /**
   * Verificar si el usuario tiene todos los permisos especificados
   */
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  /**
   * Obtener el nivel de acceso del usuario
   */
  const getAccessLevel = (): 'guest' | 'user' | 'admin' => {
    if (!isAdmin.value && !isUser.value) return 'guest'
    if (isAdmin.value) return 'admin'
    return 'user'
  }

  /**
   * Verificar si el usuario puede acceder a una sección específica
   */
  const canAccessSection = (section: string): boolean => {
    switch (section) {
      case 'admin_panel':
        return isAdmin.value
      case 'create_content':
        return canCreateSongs() || canCreateLists()
      case 'moderate_content':
        return isAdmin.value
      default:
        return true
    }
  }

  return {
    canPerformAction,
    hasAnyRole,
    hasAnyPermission,
    hasAllPermissions,
    getAccessLevel,
    canAccessSection
  }
}
