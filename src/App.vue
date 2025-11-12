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
  
  // Solo hacemos una petición a la tabla "song"
  supabase
    .from('song')
    .select('*')
    .then(({ data, error }) => {
      if (error) {
        console.error('Error al obtener canciones:', error);
      } else {
        // console.log('Canciones:', data);
      }
    });
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
