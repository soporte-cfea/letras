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
