<template>
  <div class="app-container">
    <SidebarNav v-if="!isMobile" />
    <router-view />
    <BottomNav v-if="isMobile" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import BottomNav from '@/components/BottomNav.vue';
import SidebarNav from '@/components/SidebarNav.vue';

const isMobile = ref(window.innerWidth <= 900);
const handleResize = () => {
  isMobile.value = window.innerWidth <= 900;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
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
}
</style>
