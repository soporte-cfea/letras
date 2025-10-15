import type { RouteRecordRaw } from 'vue-router'

// Rutas relacionadas con autenticación
export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: {
      requiresAuth: false,
      allowGuests: true,
      title: 'Iniciar Sesión'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue'),
    meta: {
      requiresAuth: false,
      allowGuests: true,
      title: 'Registrarse'
    }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: {
      requiresAuth: false,
      allowGuests: true,
      title: 'Recuperar Contraseña'
    }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/ResetPasswordView.vue'),
    meta: {
      requiresAuth: false,
      allowGuests: true,
      title: 'Restablecer Contraseña'
    }
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('@/views/UnauthorizedView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Acceso Denegado'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Mi Perfil'
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/AdminView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: 'Panel de Administración'
    }
  }
]

// Rutas protegidas que requieren autenticación
export const protectedRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Dashboard'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Configuración'
    }
  }
]

// Rutas públicas (accesibles sin autenticación)
export const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Inicio'
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/AboutView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Acerca de'
    }
  }
]

// Función para obtener todas las rutas de autenticación
export const getAllAuthRoutes = (): RouteRecordRaw[] => {
  return [
    ...authRoutes,
    ...protectedRoutes,
    ...publicRoutes
  ]
}

// Función para verificar si una ruta requiere autenticación
export const isRouteProtected = (routeName: string): boolean => {
  const allRoutes = getAllAuthRoutes()
  const route = allRoutes.find(r => r.name === routeName)
  return route?.meta?.requiresAuth === true
}

// Función para verificar si una ruta requiere permisos de admin
export const isRouteAdminOnly = (routeName: string): boolean => {
  const allRoutes = getAllAuthRoutes()
  const route = allRoutes.find(r => r.name === routeName)
  return route?.meta?.requiresAdmin === true
}
