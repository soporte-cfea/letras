import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// Definir el orden de las rutas principales para la navegación por swipe
const mainRoutes = [
  { name: 'home', path: '/' },
  { name: 'colecciones', path: '/colecciones' },
  { name: 'canciones', path: '/canciones' },
  { name: 'mas', path: '/mas' }
]

export function useSwipeNavigation() {
  const router = useRouter()
  const route = useRoute()
  
  const touchStartX = ref(0)
  const touchStartY = ref(0)
  const touchEndX = ref(0)
  const touchEndY = ref(0)
  const minSwipeDistance = 50 // Distancia mínima para considerar un swipe
  
  // Verificar si la ruta actual es una ruta principal
  const isMainRoute = (path: string): boolean => {
    return mainRoutes.some(route => route.path === path)
  }
  
  // Obtener el índice de la ruta actual
  const getCurrentRouteIndex = (): number => {
    return mainRoutes.findIndex(r => r.path === route.path)
  }
  
  // Navegar a la siguiente ruta
  const navigateToNext = () => {
    const currentIndex = getCurrentRouteIndex()
    if (currentIndex !== -1 && currentIndex < mainRoutes.length - 1) {
      router.push(mainRoutes[currentIndex + 1].path)
    }
  }
  
  // Navegar a la ruta anterior
  const navigateToPrevious = () => {
    const currentIndex = getCurrentRouteIndex()
    if (currentIndex !== -1 && currentIndex > 0) {
      router.push(mainRoutes[currentIndex - 1].path)
    }
  }
  
  // Manejar el inicio del touch
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.value = e.touches[0].clientX
    touchStartY.value = e.touches[0].clientY
  }
  
  // Manejar el final del touch
  const handleTouchEnd = (e: TouchEvent) => {
    touchEndX.value = e.changedTouches[0].clientX
    touchEndY.value = e.changedTouches[0].clientY
    handleSwipe()
  }
  
  // Determinar si fue un swipe horizontal
  const handleSwipe = () => {
    const deltaX = touchEndX.value - touchStartX.value
    const deltaY = touchEndY.value - touchStartY.value
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    
    // Solo procesar si el swipe es más horizontal que vertical
    if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
      // Solo navegar si estamos en una ruta principal
      if (isMainRoute(route.path)) {
        if (deltaX > 0) {
          // Swipe hacia la derecha -> ruta anterior
          navigateToPrevious()
        } else {
          // Swipe hacia la izquierda -> siguiente ruta
          navigateToNext()
        }
      }
    }
  }
  
  // Activar navegación por swipe
  const enableSwipeNavigation = () => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
  }
  
  // Desactivar navegación por swipe
  const disableSwipeNavigation = () => {
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchend', handleTouchEnd)
  }
  
  return {
    enableSwipeNavigation,
    disableSwipeNavigation,
    navigateToNext,
    navigateToPrevious,
    isMainRoute,
    getCurrentRouteIndex
  }
}
