import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ColeccionesView from '@/views/ColeccionesView.vue'
import CancionesView from '@/views/CancionesView.vue'
import CancionDetalleView from '@/views/CancionDetalleView.vue'
import PerfilView from '@/views/PerfilView.vue'
import MasView from '@/views/MasView.vue'

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
    }
  ],
})

export default router
