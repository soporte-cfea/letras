<template>
  <section class="settings-view">
    <header class="settings-header">
      <button type="button" class="back-link" @click="router.back()">← Volver</button>
      <h1>Ajustes</h1>
    </header>

    <div class="settings-section">
      <h2>Inicio</h2>
      <p class="settings-desc">Opciones que afectan a la pantalla principal.</p>
      <label class="toggle-row">
        <input v-model="animateStats" type="checkbox" />
        <span>Animar contadores de canciones y artistas en Inicio</span>
      </label>

      <h3 class="settings-subheading">Widgets en Inicio</h3>
      <p class="settings-desc">Elige qué bloques se muestran en la página principal.</p>
      <label class="toggle-row">
        <input v-model="homeWidgets.otros" type="checkbox" />
        <span>Acceso rápido a listas «Otros»</span>
      </label>
      <label class="toggle-row">
        <input v-model="homeWidgets.calendar" type="checkbox" />
        <span>Mini calendario (dos semanas)</span>
      </label>
      <label class="toggle-row">
        <input v-model="homeWidgets.recent" type="checkbox" />
        <span>Canciones recientes</span>
      </label>
      <label class="toggle-row">
        <input v-model="homeWidgets.upcoming" type="checkbox" />
        <span>Próximas listas con fecha</span>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  homeAnimateStatsStorage,
  homeWidgetsStorage,
  HOME_WIDGET_DEFAULTS,
  type HomeWidgetPreferences,
} from '@/utils/persistence'

const router = useRouter()
const animateStats = ref(homeAnimateStatsStorage.get() !== false)

watch(animateStats, (v) => {
  homeAnimateStatsStorage.set(v)
})

const homeWidgets = reactive<HomeWidgetPreferences>({
  ...(homeWidgetsStorage.get() ?? HOME_WIDGET_DEFAULTS),
})

watch(
  () => ({
    otros: homeWidgets.otros,
    calendar: homeWidgets.calendar,
    recent: homeWidgets.recent,
    upcoming: homeWidgets.upcoming,
  }),
  (v) => {
    homeWidgetsStorage.set(v)
  }
)
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
  margin: 0 0 0.5rem;
  color: var(--color-heading);
}

.settings-subheading {
  font-size: 1rem;
  margin: 1.5rem 0 0.35rem;
  color: var(--color-heading);
  font-weight: 600;
}
.settings-desc {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}
.toggle-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.95rem;
}
.toggle-row input {
  margin-top: 0.2rem;
}
</style>
