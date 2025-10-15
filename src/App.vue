<template>
  <div class="app-container">
    <SidebarNav v-if="!isMobile" />
    <router-view />
    <BottomNav v-if="isMobile" />
    <NotificationContainer />
    
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import BottomNav from '@/components/BottomNav.vue';
import SidebarNav from '@/components/SidebarNav.vue';
import NotificationContainer from '@/components/NotificationContainer.vue';
import supabase from '@/supabase/supabase';

const isMobile = ref(window.innerWidth <= 900);

const handleResize = () => {
  isMobile.value = window.innerWidth <= 900;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  // Solo hacemos una petición a la tabla "song"
  supabase
    .from('song')
    .select('*')
    .then(({ data, error }) => {
      if (error) {
        console.error('Error al obtener canciones:', error);
      } else {
        console.log('Canciones:', data);
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
