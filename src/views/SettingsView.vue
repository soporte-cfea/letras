<template>
  <section class="settings-view">
    <header class="settings-header">
      <button type="button" class="back-link" @click="router.back()">← Volver</button>
      <h1>Ajustes</h1>
    </header>

    <div class="settings-section">
      <h2>Inicio</h2>
      <InicioAppSettingsSection />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import InicioAppSettingsSection from '@/components/settings/InicioAppSettingsSection.vue'

const router = useRouter()
</script>

<style scoped>
.settings-view {
  max-width: 640px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 3rem;
  color: var(--color-text);
}
.settings-header {
  margin-bottom: 2rem;
}
.settings-header h1 {
  margin: 0.5rem 0 0;
  font-size: 1.5rem;
  color: var(--color-heading);
}
.back-link {
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0;
}
.settings-section h2 {
  font-size: 1.1rem;
  margin: 0 0 0.75rem;
  color: var(--color-heading);
}
</style>
