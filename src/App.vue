<template>
  <div class="app-container theme-transition">
    <SidebarNav v-if="!isMobile" />
    <router-view />
    <BottomNav v-if="isMobile" />
    <NotificationContainer />
    <ThemeStatus :show-status="showThemeStatus" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import BottomNav from '@/components/BottomNav.vue';
import SidebarNav from '@/components/SidebarNav.vue';
import NotificationContainer from '@/components/NotificationContainer.vue';
import ThemeStatus from '@/components/ThemeStatus.vue';
import { useTheme } from '@/composables/useTheme';
import supabase from '@/supabase/supabase';

// Inicializar sistema de temas
const { initializeTheme } = useTheme();

const isMobile = ref(window.innerWidth <= 900);
const showThemeStatus = ref(false);

const handleResize = () => {
  isMobile.value = window.innerWidth <= 900;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  initializeTheme();
  
  // NOTA: La carga de canciones ahora se maneja a través del store con caché
  // No hacer llamadas directas a Supabase aquí para evitar llamadas API innecesarias
});

onUnmounted(() => {
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
