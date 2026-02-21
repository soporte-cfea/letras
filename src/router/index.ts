import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ColeccionesView from '@/views/ColeccionesView.vue'
import ColeccionDetalleView from '@/views/ColeccionDetalleView.vue'
import CancionesView from '@/views/CancionesView.vue'
import CancionDetalleView from '@/views/CancionDetalleView.vue'
import PerfilView from '@/views/PerfilView.vue'
import MasView from '@/views/MasView.vue'
import MultiSelectTestView from '@/views/MultiSelectTestView.vue'
import TipTapTestView from '@/views/TipTapTestView.vue'
import UsuariosAdminView from '@/views/UsuariosAdminView.vue'
import UserDetailView from '@/views/UserDetailView.vue'
import { useCancionesStore } from '@/stores/canciones'
import { useColeccionesStore } from '@/stores/colecciones'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/colecciones',
      name: 'colecciones',
      component: ColeccionesView
    },
    {
      path: '/coleccion/:id',
      name: 'coleccion-detalle',
      component: ColeccionDetalleView
    },
    {
      path: '/cancion/:id-:slug',
      name: 'cancion-detalle',
      component: CancionDetalleView
    },
    {
      path: '/canciones',
      name: 'canciones',
      component: CancionesView
    },
    {
      path: '/perfil',
      name: 'perfil',
      component: PerfilView
    },
    {
      path: '/mas',
      name: 'mas',
      component: MasView
    },
    {
      path: '/admin/usuarios',
      name: 'admin-usuarios',
      component: UsuariosAdminView,
      meta: {
        requiresAuth: true,
        requiresSuperAdmin: true
      }
    },
    {
      path: '/admin/usuarios/:id',
      name: 'admin-usuario-detalle',
      component: UserDetailView,
      meta: {
        requiresAuth: true,
        requiresSuperAdmin: true
      }
    },
    {
      path: '/test-multiselect',
      name: 'test-multiselect',
      component: MultiSelectTestView
    },
    {
      path: '/test-tiptap',
      name: 'test-tiptap',
      component: TipTapTestView
    }
  ],
})

// Guard para verificar permisos de super_admin
router.beforeEach(async (to, from, next) => {
  // Verificar si la ruta requiere super_admin
  if (to.meta.requiresSuperAdmin) {
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()
    
    // Inicializar auth si no está inicializada
    if (!authStore.isInitialized) {
      await authStore.initializeAuth()
    }
    
    // Verificar autenticación
    if (!authStore.isAuthenticated) {
      return next({
        path: '/mas',
        query: { redirect: to.fullPath }
      })
    }
    
    // Verificar si es super_admin
    const userRole = authStore.userRole
    if (userRole !== 'super_admin') {
      return next({
        path: '/mas',
        query: { error: 'unauthorized' }
      })
    }
  }
  
  next()
})

// Guard para verificar y actualizar datos automáticamente en cada navegación
router.afterEach((to) => {
  // Solo verificar si hay conexión
  if (typeof navigator === 'undefined' || !navigator.onLine) {
    return
  }

  const cancionesStore = useCancionesStore()
  const coleccionesStore = useColeccionesStore()

  // Determinar qué datos recargar según la ruta
  const routeName = to.name as string

  // Rutas que necesitan canciones
  const needsCanciones = [
    'home',
    'canciones',
    'cancion-detalle',
    'coleccion-detalle'
  ].includes(routeName)

  // Rutas que necesitan colecciones
  const needsColecciones = [
    'home',
    'colecciones',
    'coleccion-detalle',
    'canciones'
  ].includes(routeName)

  // Recargar datos automáticamente de forma silenciosa
  // El store ya verifica si hay actualizaciones y las aplica automáticamente
  if (needsCanciones) {
    cancionesStore.loadCanciones()
  }

  if (needsColecciones) {
    coleccionesStore.loadColecciones()
  }

  // Para el detalle de colección, también recargar los datos específicos de esa colección
  if (routeName === 'coleccion-detalle' && to.params.id) {
    const collectionId = to.params.id as string
    // Recargar la colección específica y sus canciones
    coleccionesStore.getCollection(collectionId)
    coleccionesStore.loadCollectionSongs(collectionId)
  }
})

export default router
