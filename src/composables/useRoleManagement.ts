import { ref, computed } from 'vue'
import supabase from '@/supabase/supabase'
import type { UserRole, Permission } from '@/types/auth'

/**
 * Composable para gestionar roles y permisos de usuarios
 */
export function useRoleManagement() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Asignar rol y permisos a un usuario
   */
  const assignUserRole = async (userId: string, role: UserRole, permissions: Permission[]) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          role,
          permissions
        }
      })

      if (updateError) {
        error.value = updateError.message
        return { success: false, error: updateError.message }
      }

      return { success: true, data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al asignar rol'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Promover usuario a super administrador
   */
  const promoteToSuperAdmin = async (userId: string) => {
    return await assignUserRole(userId, 'super_admin', ['create:songs', 'create:lists', 'manage:roles', 'manage:users'])
  }

  /**
   * Promover usuario a administrador
   */
  const promoteToAdmin = async (userId: string) => {
    return await assignUserRole(userId, 'admin', ['create:songs', 'create:lists'])
  }

  /**
   * Degradar usuario a usuario básico
   */
  const demoteToUser = async (userId: string) => {
    return await assignUserRole(userId, 'user', [])
  }

  /**
   * Asignar rol específico (solo super_admin)
   */
  const assignSpecificRole = async (userId: string, role: UserRole) => {
    const permissions = role === 'super_admin' 
      ? ['create:songs', 'create:lists', 'manage:roles', 'manage:users']
      : role === 'admin'
      ? ['create:songs', 'create:lists']
      : [] // Los usuarios básicos no tienen permisos
    
    return await assignUserRole(userId, role, permissions)
  }

  /**
   * Obtener información de roles de un usuario
   */
  const getUserRoleInfo = async (userId: string) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase.auth.admin.getUserById(userId)

      if (fetchError) {
        error.value = fetchError.message
        return { success: false, error: fetchError.message }
      }

      const role = data.user?.user_metadata?.role || 'user'
      const permissions = data.user?.user_metadata?.permissions || []

      return { 
        success: true, 
        data: { 
          role, 
          permissions,
          user: data.user 
        } 
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener información del usuario'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Listar todos los usuarios con sus roles
   */
  const listUsersWithRoles = async () => {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase.auth.admin.listUsers()

      if (fetchError) {
        error.value = fetchError.message
        return { success: false, error: fetchError.message }
      }

      const usersWithRoles = data.users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        role: user.user_metadata?.role || 'user',
        permissions: user.user_metadata?.permissions || [],
        created_at: user.created_at,
        user_metadata: {
          avatar_style: user.user_metadata?.avatar_style,
          avatar_config: user.user_metadata?.avatar_config,
          name: user.user_metadata?.name
        }
      }))

      return { success: true, data: usersWithRoles }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al listar usuarios'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualizar contraseña de un usuario (solo super_admin)
   */
  const updateUserPassword = async (userId: string, newPassword: string) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      })

      if (updateError) {
        error.value = updateError.message
        return { success: false, error: updateError.message }
      }

      return { success: true, data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar contraseña'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  return {
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    assignUserRole,
    promoteToSuperAdmin,
    promoteToAdmin,
    demoteToUser,
    assignSpecificRole,
    getUserRoleInfo,
    listUsersWithRoles,
    updateUserPassword
  }
}
