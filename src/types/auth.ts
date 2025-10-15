import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  role?: string
  metadata?: Record<string, any>
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  confirmPassword: string
  name?: string
  metadata?: Record<string, any>
}

export interface AuthResponse {
  success: boolean
  error?: string | null
  data?: any
}

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  isAdmin: boolean
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>
  logout: () => Promise<AuthResponse>
  resetPassword: (email: string) => Promise<AuthResponse>
  clearError: () => void
}

export interface AuthFormData {
  email: string
  password: string
  confirmPassword?: string
  name?: string
  rememberMe?: boolean
}

export interface AuthFormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  name?: string
  general?: string
}

export type AuthMode = 'login' | 'register' | 'reset'

export interface AuthModalProps {
  mode?: AuthMode
  show?: boolean
  onClose?: () => void
  onSuccess?: () => void
}

// Tipos de roles
export type UserRole = 'super_admin' | 'admin' | 'user'

// Tipos de permisos
export type Permission = 'create:songs' | 'create:lists' | 'manage:roles' | 'manage:users'

// Configuración de permisos por rol
export interface RolePermissions {
  [key: string]: Permission[]
}

// Interfaz para verificación de permisos
export interface PermissionCheck {
  hasRole: (role: UserRole) => boolean
  hasPermission: (permission: Permission) => boolean
  canCreateSongs: () => boolean
  canCreateLists: () => boolean
  canManageRoles: () => boolean
  canManageUsers: () => boolean
  isSuperAdmin: () => boolean
  isAdmin: () => boolean
  isUser: () => boolean
}
