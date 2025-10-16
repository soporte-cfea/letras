import type { Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Tipos para guards
export type AuthGuardOptions = {
  requireAuth?: boolean
  requireAdmin?: boolean
  redirectTo?: string
  allowGuests?: boolean
}

export type RouteMeta = {
  requiresAuth?: boolean
  requiresAdmin?: boolean
  allowGuests?: boolean
  roles?: string[]
}

// Guard principal de autenticación
export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore()
  
  // Inicializar auth si no está inicializada
  if (!authStore.isInitialized) {
    await authStore.initializeAuth()
  }

  const requiresAuth = to.meta.requiresAuth !== false
  const requiresAdmin = to.meta.requiresAdmin === true
  const allowGuests = to.meta.allowGuests === true

  // Si la ruta no requiere autenticación, permitir acceso
  if (!requiresAuth || allowGuests) {
    return next()
  }

  // Verificar si está autenticado
  if (!authStore.isAuthenticated) {
    // Guardar la ruta de destino para redirigir después del login
    const redirectTo = to.fullPath
    return next({
      path: '/login',
      query: { redirect: redirectTo }
    })
  }

  // Verificar si requiere permisos de admin
  if (requiresAdmin && !authStore.isAdmin) {
    return next({
      path: '/unauthorized',
      query: { from: to.fullPath }
    })
  }

  // Verificar roles específicos si están definidos
  const requiredRoles = to.meta.roles as string[]
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = authStore.user?.user_metadata?.role
    if (!userRole || !requiredRoles.includes(userRole)) {
      return next({
        path: '/unauthorized',
        query: { from: to.fullPath }
      })
    }
  }

  return next()
}

// Guard para rutas de invitados (no autenticados)
export const guestGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore()
  
  // Inicializar auth si no está inicializada
  if (!authStore.isInitialized) {
    await authStore.initializeAuth()
  }

  // Si está autenticado, redirigir a la página principal
  if (authStore.isAuthenticated) {
    const redirectTo = to.query.redirect as string || '/'
    return next(redirectTo)
  }

  return next()
}

// Guard para rutas de administrador
export const adminGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore()
  
  // Inicializar auth si no está inicializada
  if (!authStore.isInitialized) {
    await authStore.initializeAuth()
  }

  // Verificar autenticación
  if (!authStore.isAuthenticated) {
    return next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }

  // Verificar permisos de admin
  if (!authStore.isAdmin) {
    return next({
      path: '/unauthorized',
      query: { from: to.fullPath }
    })
  }

  return next()
}

// Función para configurar guards en el router
export const setupAuthGuards = (router: Router) => {
  // Guard global
  router.beforeEach(authGuard)
  
  // Guards específicos para rutas
  router.beforeEach((to, from, next) => {
    // Rutas que requieren ser invitado (no autenticado)
    if (to.meta.allowGuests === true) {
      return guestGuard(to, from, next)
    }
    
    // Rutas que requieren admin
    if (to.meta.requiresAdmin === true) {
      return adminGuard(to, from, next)
    }
    
    // Aplicar guard de autenticación por defecto
    return authGuard(to, from, next)
  })
}

// Función para verificar permisos programáticamente
export const checkPermission = (permission: string): boolean => {
  const authStore = useAuthStore()
  
  if (!authStore.isAuthenticated) return false
  
  const userRole = authStore.user?.user_metadata?.role
  
  // Lógica de permisos basada en roles
  const permissions: Record<string, string[]> = {
    admin: ['*'], // Admin tiene todos los permisos
    user: ['read', 'create', 'update'],
    guest: ['read']
  }
  
  const userPermissions = permissions[userRole || 'guest'] || []
  
  return userPermissions.includes('*') || userPermissions.includes(permission)
}

// Función para verificar si el usuario puede acceder a una ruta
export const canAccessRoute = (routeName: string): boolean => {
  const authStore = useAuthStore()
  
  if (!authStore.isAuthenticated) {
    // Verificar si la ruta permite invitados
    const route = router.getRoutes().find(r => r.name === routeName)
    return route?.meta.allowGuests === true
  }
  
  // Verificar permisos específicos de la ruta
  const route = router.getRoutes().find(r => r.name === routeName)
  if (!route) return false
  
  if (route.meta.requiresAdmin && !authStore.isAdmin) {
    return false
  }
  
  return true
}
