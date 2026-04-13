<template>
  <div class="inicio-settings">
    <p class="inicio-settings-desc">Opciones que afectan a la pantalla principal.</p>
    <label class="inicio-toggle-row">
      <input v-model="animateStats" type="checkbox" />
      <span>Animar contadores de canciones y artistas en Inicio</span>
    </label>

    <h3 class="inicio-settings-subheading">Widgets en Inicio</h3>
    <p class="inicio-settings-desc">Elige qué bloques se muestran en la página principal.</p>
    <label class="inicio-toggle-row">
      <input v-model="homeWidgets.otros" type="checkbox" />
      <span>Acceso rápido a listas «Otros»</span>
    </label>
    <label class="inicio-toggle-row">
      <input v-model="homeWidgets.calendar" type="checkbox" />
      <span>Mini calendario (dos semanas)</span>
    </label>
    <label class="inicio-toggle-row">
      <input v-model="homeWidgets.stats" type="checkbox" />
      <span>Contadores de canciones y artistas</span>
    </label>
    <label class="inicio-toggle-row">
      <input v-model="homeWidgets.recent" type="checkbox" />
      <span>Canciones recientes</span>
    </label>
    <label class="inicio-toggle-row">
      <input v-model="homeWidgets.upcoming" type="checkbox" />
      <span>Listas con fecha en Inicio</span>
    </label>

    <h3 class="inicio-settings-subheading">Texto del encabezado</h3>
    <p class="inicio-settings-desc">
      Título de la sección donde aparecen las listas con fecha (debajo de los widgets).
    </p>
    <label class="inicio-field-label" for="home-upcoming-title">Título de la sección</label>
    <input
      id="home-upcoming-title"
      v-model="upcomingSectionTitle"
      class="inicio-text-input"
      type="text"
      maxlength="100"
      autocomplete="off"
      :placeholder="HOME_UPCOMING_SECTION_TITLE_DEFAULT"
      @blur="normalizeUpcomingTitle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import {
  homeAnimateStatsStorage,
  homeWidgetsStorage,
  homeUpcomingSectionTitleStorage,
  HOME_WIDGET_DEFAULTS,
  HOME_UPCOMING_SECTION_TITLE_DEFAULT,
  type HomeWidgetPreferences,
} from '@/utils/persistence'

const animateStats = ref(homeAnimateStatsStorage.get() !== false)

watch(animateStats, (v) => {
  homeAnimateStatsStorage.set(v)
})

const homeWidgets = reactive<HomeWidgetPreferences>({
  ...HOME_WIDGET_DEFAULTS,
  ...(homeWidgetsStorage.get() ?? {}),
})

watch(
  () => ({
    otros: homeWidgets.otros,
    calendar: homeWidgets.calendar,
    stats: homeWidgets.stats,
    recent: homeWidgets.recent,
    upcoming: homeWidgets.upcoming,
  }),
  (v) => {
    homeWidgetsStorage.set(v)
  }
)

const upcomingSectionTitle = ref(
  homeUpcomingSectionTitleStorage.get() ?? HOME_UPCOMING_SECTION_TITLE_DEFAULT
)

watch(upcomingSectionTitle, (raw) => {
  const t = raw.trim() || HOME_UPCOMING_SECTION_TITLE_DEFAULT
  homeUpcomingSectionTitleStorage.set(t)
})

function normalizeUpcomingTitle() {
  const t =
    upcomingSectionTitle.value.trim() || HOME_UPCOMING_SECTION_TITLE_DEFAULT
  upcomingSectionTitle.value = t
  homeUpcomingSectionTitleStorage.set(t)
}
</script>

<style scoped>
.inicio-settings-desc {
  margin: 0 0 0.85rem;
  font-size: 0.88rem;
  color: var(--color-text-soft);
  line-height: 1.4;
}

.inicio-settings-subheading {
  font-size: 0.98rem;
  margin: 1.25rem 0 0.35rem;
  color: var(--color-heading);
  font-weight: 600;
}

.inicio-toggle-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.92rem;
  margin-bottom: 0.65rem;
  color: var(--color-text);
}

.inicio-toggle-row:last-of-type {
  margin-bottom: 0;
}

.inicio-toggle-row input {
  margin-top: 0.2rem;
}

.inicio-field-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-heading-soft);
  margin: 0 0 0.35rem;
}

.inicio-text-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.65rem;
  font-size: 0.92rem;
  color: var(--color-text);
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 0.15rem;
}

.inicio-text-input:focus {
  outline: none;
  border-color: var(--color-border-focus);
}
</style>
