<template>
  <div class="app-container theme-transition" :class="{ 'shared-view': isSharedView }">
    <OfflineIndicator v-if="!isSharedView" />
    <SidebarNav v-if="!isMobile && !isSharedView" />
    <router-view />
    <BottomNav v-if="showBottomNav" />
    <NotificationContainer />
    <PwaUpdateNotification />
    <ThemeStatus :show-status="showThemeStatus" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import BottomNav from '@/components/BottomNav.vue';
import SidebarNav from '@/components/SidebarNav.vue';
import NotificationContainer from '@/components/NotificationContainer.vue';
import PwaUpdateNotification from '@/components/PwaUpdateNotification.vue';
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

const route = useRoute();
const isSharedView = computed(() => {
  if (route.meta?.sharedView) return true;
  const from = route.query.from;
  return typeof from === 'string' && from.startsWith('/v/');
});
const isSongDetailFromCollection = computed(() => {
  if (route.name !== 'cancion-detalle') return false;
  const from = route.query.from;
  return typeof from === 'string' && from.startsWith('/coleccion/');
});
const isMobile = ref(window.innerWidth <= 900);
const showThemeStatus = ref(false);
const showBottomNav = computed(() => isMobile.value && !isSharedView.value && !isSongDetailFromCollection.value);

const cancionesStore = useCancionesStore();
const coleccionesStore = useColeccionesStore();

const handleResize = () => {
  isMobile.value = window.innerWidth <= 900;
};

// Sincronizar automáticamente cuando se recupera la conexión
watch(isOnline, (online) => {
  if (online && wasOffline.value) {
    cancionesStore.loadCanciones();
    coleccionesStore.loadColecciones();
    resetWasOffline();
  }
});

watch(isSharedView, (shared) => {
  if (shared) document.body.classList.add('shared-view');
  else document.body.classList.remove('shared-view');
}, { immediate: true });
// Nota: body.shared-view permite en main.css quitar margen/padding del layout normal

onMounted(() => {
  window.addEventListener('resize', handleResize);
  initializeTheme();
});

onUnmounted(() => {
  document.body.classList.remove('shared-view');
  window.removeEventListener('resize', handleResize);
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
