<template>
  <div class="app-container theme-transition">
    <OfflineIndicator />
    <SidebarNav v-if="!isMobile" />
    <router-view />
    <BottomNav v-if="isMobile" />
    <NotificationContainer />
    <ThemeStatus :show-status="showThemeStatus" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import BottomNav from '@/components/BottomNav.vue';
import SidebarNav from '@/components/SidebarNav.vue';
import NotificationContainer from '@/components/NotificationContainer.vue';
import ThemeStatus from '@/components/ThemeStatus.vue';
import OfflineIndicator from '@/components/OfflineIndicator.vue';
import { useTheme } from '@/composables/useTheme';
import { useNetworkStatus } from '@/composables/useNetworkStatus';
import { useCancionesStore } from '@/stores/canciones';
import { useColeccionesStore } from '@/stores/colecciones';

// Inicializar sistema de temas
const { initializeTheme } = useTheme();

// Inicializar estado de red
const { isOnline, wasOffline, resetWasOffline } = useNetworkStatus();

const isMobile = ref(window.innerWidth <= 900);
const showThemeStatus = ref(false);

const cancionesStore = useCancionesStore();
const coleccionesStore = useColeccionesStore();

const handleResize = () => {
  isMobile.value = window.innerWidth <= 900;
};

// Verificar y actualizar datos automáticamente cuando vuelves a la pestaña
let lastVisibilityCheck: Date | null = null;
const handleVisibilityChange = () => {
  // Solo verificar cuando la pestaña se vuelve visible
  if (document.hidden) return;
  
  // Evitar verificaciones muy frecuentes (mínimo 5 segundos entre verificaciones)
  if (lastVisibilityCheck) {
    const timeSinceLastCheck = new Date().getTime() - lastVisibilityCheck.getTime();
    const minInterval = 5 * 1000; // 5 segundos
    if (timeSinceLastCheck < minInterval) {
      return;
    }
  }
  
  lastVisibilityCheck = new Date();
  
  // Recargar datos automáticamente de forma silenciosa (sin forceRefresh)
  // El store ya verifica si hay actualizaciones y las aplica automáticamente
  if (isOnline.value) {
    cancionesStore.loadCanciones();
    coleccionesStore.loadColecciones();
  }
};

// Sincronizar automáticamente cuando se recupera la conexión
watch(isOnline, (online) => {
  if (online && wasOffline.value) {
    // Se recuperó la conexión después de estar offline
    // Sincronizar datos automáticamente
    console.log('Conexión recuperada, sincronizando datos...');
    cancionesStore.loadCanciones();
    coleccionesStore.loadColecciones();
    resetWasOffline();
  }
});

onMounted(() => {
  window.addEventListener('resize', handleResize);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  initializeTheme();
  
  // NOTA: La carga de canciones ahora se maneja a través del store con caché
  // No hacer llamadas directas a Supabase aquí para evitar llamadas API innecesarias
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  width: 100%;
}
</style>
