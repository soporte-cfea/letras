import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BuscarView from '@/views/BuscarView.vue'
import BibliotecaView from '@/views/BibliotecaView.vue'
import CancionDetalleView from '@/views/CancionDetalleView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/buscar',
      name: 'buscar',
      component: BuscarView
    },
    {
      path: '/biblioteca',
      name: 'biblioteca',
      component: BibliotecaView
    },
    {
      path: '/cancion/:id',
      name: 'cancion-detalle',
      component: CancionDetalleView
    }
  ],
})

export default router
