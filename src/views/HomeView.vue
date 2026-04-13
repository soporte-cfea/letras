<template>
  <section class="home-view">
    <div class="theme-toggle-container">
      <ThemeToggle />
    </div>

    <header class="home-brand-bar">
      <h1 class="home-brand-title">CF Letras</h1>
    </header>

    <div
      v-if="anyTopWidgetVisible"
      class="home-widgets"
      :class="homeWidgetsLayoutClass"
      :style="homeWidgetsGridInlineStyle"
      role="region"
      aria-label="Resumen"
    >
        <div v-if="widgetPrefs.calendar" class="widget-tile widget-calendar">
          <span class="widget-kicker">Calendario</span>
          <div class="mini-cal">
            <div class="mini-cal-headers" aria-hidden="true">
              <span
                v-for="(label, i) in calendarFortnight.weekdayHeaders"
                :key="'h' + i"
                class="mini-cal-dow-header"
              >{{ label }}</span>
            </div>
            <div class="mini-cal-body">
              <div
                v-for="(d, i) in calendarFortnight.days"
                :key="i"
                class="mini-cal-day"
                :class="{ 'mini-cal-today': d.isToday }"
              >
                <span class="mini-cal-num">{{ d.day }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="widgetPrefs.stats" class="widget-tile widget-stats-counts">
          <div class="widget-stats-row" role="group" aria-label="Canciones y artistas">
            <div class="widget-stat">
              <span class="widget-stat-value">{{ songCountDisplay }}</span>
              <span class="widget-stat-label">Canciones</span>
            </div>
            <div class="widget-stat">
              <span class="widget-stat-value">{{ artistCountDisplay }}</span>
              <span class="widget-stat-label">Artistas</span>
            </div>
          </div>
        </div>
        <div v-if="widgetPrefs.otros" class="widget-tile widget-otros">
          <span class="widget-kicker">Listas</span>
          <p class="widget-title">Otros</p>
          <button type="button" class="widget-btn" @click="goToOtrosListas">
            Ver en Listas
          </button>
        </div>

        <div v-if="widgetPrefs.recent" class="widget-tile widget-recent">
          <span class="widget-kicker">{{ getFeaturedSectionTitle() }}</span>
          <div
            v-if="recentLoading"
            class="widget-loading"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div class="widget-spinner" aria-hidden="true" />
            <span class="widget-loading-text">Cargando canciones…</span>
          </div>
          <template v-else>
            <ul
              v-if="allRecentSongs.length"
              class="recent-songs-scroll"
              role="list"
            >
              <li
                v-for="song in allRecentSongs"
                :key="song.id"
                class="recent-song-row"
                role="button"
                tabindex="0"
                @click="goToSong(song.id)"
                @keydown.enter="goToSong(song.id)"
                @keydown.space.prevent="goToSong(song.id)"
              >
                <span class="recent-song-title">{{ song.title }}</span>
                <span class="recent-song-artist">{{ song.artist }}</span>
              </li>
            </ul>
            <p v-else class="widget-placeholder widget-recent-empty">No hay canciones recientes.</p>
          </template>
        </div>
      </div>

      <section
        v-if="widgetPrefs.upcoming && (eventListCards.length || listsLoading)"
        class="upcoming-events"
        aria-labelledby="upcoming-events-heading"
      >
        <h2 id="upcoming-events-heading" class="upcoming-events-title">Próximas eventos</h2>
        <div
          v-if="listsLoading && !eventListCards.length"
          class="upcoming-events-loading"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div class="widget-spinner" aria-hidden="true" />
          <p class="upcoming-events-loading-text">Cargando listas…</p>
        </div>
        <div v-else class="event-cards">
          <article
            v-for="{ col, title, subtitle } in eventListCards"
            :key="col.id"
            class="event-card"
            role="button"
            tabindex="0"
            @click="goToLista(col.id)"
            @keydown.enter="goToLista(col.id)"
            @keydown.space.prevent="goToLista(col.id)"
          >
            <div class="event-card-body">
              <h3 class="event-card-name">{{ title }}</h3>
              <p v-if="subtitle" class="event-card-subtitle">{{ subtitle }}</p>
              <p
                v-if="(col.songCount ?? 0) === 0"
                class="event-card-empty-songs"
                role="status"
              >
                Sin canciones
              </p>
              <p v-if="col.description" class="event-card-desc">{{ col.description }}</p>
            </div>
          </article>
        </div>
      </section>

    <!-- News Section - Solo se muestra si hay noticias recientes -->
    <div v-if="newsStore.hasRecentNews" class="news-section">
      <h2>Últimas Actualizaciones</h2>
      <div class="news-grid">
        <article v-for="news in newsStore.recentNews" :key="news.id" class="news-card">
          <div class="news-header">
            <span class="news-type" :style="{ backgroundColor: newsStore.getNewsTypeColor(news.type) }" v-html="newsStore.getNewsTypeIcon(news.type)">
            </span>
            <span class="news-date">{{ newsStore.formatNewsDate(news.published_at) }}</span>
          </div>
          <h3>{{ news.title }}</h3>
          <p>{{ news.excerpt }}</p>
        </article>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCancionesStore } from '@/stores/canciones'
import { useColeccionesStore } from '@/stores/colecciones'
import { useNewsStore } from '@/stores/news'
import { useNotifications } from '@/composables/useNotifications'
import ThemeToggle from '@/components/ThemeToggle.vue'
import type { Collection } from '@/types/songTypes'
import {
  homeWidgetsStorage,
  HOME_WIDGET_DEFAULTS,
  homeAnimateStatsStorage,
  type HomeWidgetPreferences,
} from '@/utils/persistence'

const router = useRouter()

const widgetPrefs = reactive<HomeWidgetPreferences>({
  ...HOME_WIDGET_DEFAULTS,
  ...(homeWidgetsStorage.get() ?? {}),
})

const cancionesStore = useCancionesStore()
const coleccionesStore = useColeccionesStore()
const { colecciones } = storeToRefs(coleccionesStore)
const { getCollectionCardTitle, getCollectionCardSubtitle } = coleccionesStore

const newsStore = useNewsStore()
const { error } = useNotifications()

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

/**
 * Con contadores + recientes: izquierda arriba contadores, abajo Listas (otros);
 * derecha = recientes en dos filas. Opcional: fila completa de calendario arriba.
 */
function buildRecentStatsRightGrid(otros: boolean, calendar: boolean) {
  const lines: string[] = []
  if (calendar) lines.push('cal cal')
  lines.push('statC recent')
  if (otros) lines.push('otros recent')
  return {
    display: 'grid' as const,
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    gridTemplateRows: `repeat(${lines.length}, auto)`,
    gridTemplateAreas: lines.map((l) => `"${l}"`).join(' '),
  }
}

/** Sin contadores visibles: otros/cal a la izquierda en plantilla de 3 columnas; `recent` a la derecha en dos filas. */
function buildRecentSpanGrid(leftAreas: string[]) {
  const slots = [
    ['.', '.'],
    ['.', '.'],
  ] as string[][]
  leftAreas.forEach((name, i) => {
    const r = Math.floor(i / 2)
    const c = i % 2
    slots[r][c] = name
  })
  const c = (x: string) => x
  return {
    display: 'grid' as const,
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.22fr)',
    gridTemplateRows: 'auto auto',
    gridTemplateAreas: `"${c(slots[0][0])} ${c(slots[0][1])} recent" "${c(slots[1][0])} ${c(slots[1][1])} recent"`,
  }
}

const homeWidgetsGridInlineStyle = computed(() => {
  const { otros, calendar, recent, stats } = widgetPrefs
  if (!recent) return {}
  if (stats) {
    return buildRecentStatsRightGrid(otros, calendar)
  }
  const left: string[] = []
  if (otros) left.push('otros')
  if (calendar) left.push('cal')
  if (left.length === 0) {
    return {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gridTemplateRows: 'auto',
      gridTemplateAreas: '"recent"',
    }
  }
  return buildRecentSpanGrid(left)
})

const anyTopWidgetVisible = computed(
  () =>
    widgetPrefs.otros ||
    widgetPrefs.calendar ||
    widgetPrefs.stats ||
    widgetPrefs.recent
)

/** Sin «recientes»: clases clásicas. Con «recientes» + otros: rejilla inline y `recent-span`. */
const homeWidgetsLayoutClass = computed(() => {
  const { otros, calendar, recent, stats } = widgetPrefs
  if (recent) return 'home-widgets--recent-span'

  const n = [otros, calendar, stats].filter(Boolean).length
  if (n === 0) return ''
  if (n === 3) return 'home-widgets--layout-ocs'
  if (n === 1) {
    if (otros) return 'home-widgets--layout-only-otros'
    if (calendar) return 'home-widgets--layout-only-cal'
    return 'home-widgets--layout-only-stats'
  }
  if (otros && calendar) return 'home-widgets--layout-oc'
  if (otros && stats) return 'home-widgets--layout-os'
  if (calendar && stats) return 'home-widgets--layout-cs'
  return ''
})

const songCountDisplay = ref(0)
const artistCountDisplay = ref(0)
let statsAnimRaf = 0

watch(
  () => [cancionesStore.canciones.length, cancionesStore.artistas.length] as const,
  ([songTarget, artistTarget]) => {
    const animate = homeAnimateStatsStorage.get() !== false
    if (!animate) {
      cancelAnimationFrame(statsAnimRaf)
      songCountDisplay.value = songTarget
      artistCountDisplay.value = artistTarget
      return
    }
    const fromS = songCountDisplay.value
    const fromA = artistCountDisplay.value
    const start = performance.now()
    const duration = 480
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const e = easeOutQuad(t)
      songCountDisplay.value = Math.round(fromS + (songTarget - fromS) * e)
      artistCountDisplay.value = Math.round(fromA + (artistTarget - fromA) * e)
      if (t < 1) statsAnimRaf = requestAnimationFrame(tick)
    }
    cancelAnimationFrame(statsAnimRaf)
    statsAnimRaf = requestAnimationFrame(tick)
  },
  { immediate: true }
)

const allRecentSongs = ref<
  { id: string; title: string; artist: string; created_at?: string }[]
>([])

/** Solo el widget de canciones recientes espera a `loadCanciones`. */
const recentLoading = ref(true)
/** Solo la sección de próximas listas espera a `loadColecciones` cuando aún no hay datos. */
const listsLoading = ref(true)

/** Fecha de evento en calendario local (YYYY-MM-DD), coherente con el store de listas */
function parseEventDateLocal(dateString: string): Date | null {
  try {
    const parts = dateString.split('-')
    if (parts.length !== 3) return null
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    return new Date(year, month, day)
  } catch {
    return null
  }
}

const eventListsOrdered = computed((): Collection[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcoming = colecciones.value.filter((c) => {
    if (!c.event_date) return false
    const d = parseEventDateLocal(c.event_date)
    if (!d) return false
    d.setHours(0, 0, 0, 0)
    return d >= today
  })

  return [...upcoming].sort((a, b) => {
    if (!a.event_date || !b.event_date) return 0
    return a.event_date.localeCompare(b.event_date)
  })
})

const eventListCards = computed(() =>
  eventListsOrdered.value.map((col) => ({
    col,
    title: getCollectionCardTitle(col),
    subtitle: getCollectionCardSubtitle(col)
  }))
)

/** Cabecera lun–dom una vez; debajo 14 celdas solo con número de día. */
const calendarFortnight = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const monday = new Date(today)
  const dayOfWeek = monday.getDay()
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(monday.getDate() + offsetToMonday)

  const weekdayHeaders = Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday)
    x.setDate(monday.getDate() + i)
    return x
      .toLocaleDateString('es-ES', { weekday: 'short' })
      .replace(/\.$/, '')
  })

  const days: { day: number; isToday: boolean }[] = []
  for (let i = 0; i < 14; i++) {
    const x = new Date(monday)
    x.setDate(monday.getDate() + i)
    days.push({
      day: x.getDate(),
      isToday: x.getTime() === today.getTime()
    })
  }

  return { weekdayHeaders, days }
})

function goToOtrosListas() {
  router.push({ path: '/colecciones', query: { category: 'otro' } })
}

function goToLista(collectionId: string) {
  router.push(`/coleccion/${collectionId}`)
}

function goToSong(songId: string) {
  const song = allRecentSongs.value.find((s) => s.id === songId)
  const slug = song
    ? song.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : 'cancion'
  router.push(`/cancion/${songId}-${slug}`)
}

function getFeaturedSectionTitle(): string {
  if (allRecentSongs.value.length === 0) return 'Agregadas recientemente'

  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const hasRecentSongs = allRecentSongs.value.some((song) => {
    if (!song.created_at) return false
    return new Date(song.created_at) >= lastWeek
  })

  if (hasRecentSongs) {
    return 'Agregadas esta semana'
  }
  return 'Agregadas recientemente'
}

function applyRecentSongsFromStore() {
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const recentSongs = cancionesStore.canciones.filter((cancion) => {
    if (!cancion.created_at) return false
    return new Date(cancion.created_at) >= lastWeek
  })

  let allSongsToShow
  if (recentSongs.length > 0) {
    allSongsToShow = recentSongs.sort(
      (a, b) =>
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
    )
  } else {
    allSongsToShow = cancionesStore.canciones.slice(0, 3)
  }

  allRecentSongs.value = allSongsToShow.map((cancion) => ({
    id: cancion.id,
    title: cancion.title,
    artist: cancion.artist,
    created_at: cancion.created_at
  }))
}

// Canciones + listas en paralelo (antes iban en serie y bloqueaban toda la vista).
// Noticias en segundo plano: no retrasan calendario, «Otros» ni el resto.
async function loadHomeData() {
  recentLoading.value = true
  listsLoading.value = true

  newsStore.loadNews({ limit: 5, recent_only: true }).catch((err) => {
    console.error('Error loading news on home:', err)
  })

  try {
    const [songsResult, listsResult] = await Promise.allSettled([
      cancionesStore.loadCanciones(),
      coleccionesStore.loadColecciones()
    ])

    if (songsResult.status === 'rejected') {
      console.error('Error loading canciones (inicio):', songsResult.reason)
    }
    if (listsResult.status === 'rejected') {
      console.error('Error loading colecciones (inicio):', listsResult.reason)
    }

    applyRecentSongsFromStore()

    if (songsResult.status === 'rejected' && listsResult.status === 'rejected') {
      error('Error', 'No se pudieron cargar los datos de inicio')
    } else if (songsResult.status === 'rejected') {
      error('Error', 'No se pudieron cargar las canciones recientes')
    } else if (listsResult.status === 'rejected') {
      error('Error', 'No se pudieron cargar las listas')
    }
  } catch (err) {
    console.error('Error loading home data:', err)
    error('Error', 'No se pudieron cargar los datos de inicio')
  } finally {
    recentLoading.value = false
    listsLoading.value = false
  }
}

onMounted(() => {
  loadHomeData()
})
</script>

<style scoped>
.home-view {
  padding: 0;
  background: var(--color-background);
  overflow: hidden;
  transition: background-color var(--transition-normal);
  position: relative;
}

/* Control de tema en la parte superior derecha (aire debajo respecto a los widgets) */
.theme-toggle-container {
  position: fixed;
  top: 1.15rem;
  right: 0.85rem;
  z-index: 1000;
  padding-bottom: 0.35rem;
  transition: all var(--transition-normal);
}

/* En móviles, ajustar posición */
@media (max-width: 900px) {
  .theme-toggle-container {
    top: 0.85rem;
    right: 0.65rem;
  }
}

/* Título en la franja superior (solo hueco a la izquierda del selector de tema) */
.home-brand-bar {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 3.5rem 1.1rem 0.75rem;
}

.home-brand-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-heading);
  letter-spacing: 0.02em;
  line-height: 1.2;
}

/*
 * Rejilla: con «recientes», `recent` ocupa dos filas (inline style).
 * Sin «recientes», combinaciones otros / cal / stats con clases layout-*.
 */
.home-widgets {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.25rem 0.75rem 1.5rem;
  display: grid;
  gap: 0.75rem;
}

.widget-otros {
  grid-area: otros;
}

.widget-calendar {
  grid-area: cal;
}

.widget-stats-counts {
  grid-area: statC;
}

.widget-recent {
  grid-area: recent;
}

/* Misma rejilla en móvil que en escritorio (no forzar columna única). */
.home-widgets--recent-span .widget-recent {
  align-self: stretch;
  min-height: 9rem;
}

@media (min-width: 720px) {
  .home-widgets--recent-span .widget-recent {
    min-height: 10.5rem;
  }
}

@media (max-width: 719px) {
  .home-widgets--recent-span {
    gap: 0.55rem;
  }
}

.home-widgets--layout-ocs {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-areas: 'otros cal statC';
}

.home-widgets--layout-oc {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-areas: 'otros cal';
}

.home-widgets--layout-os {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-areas: 'otros statC';
}

.home-widgets--layout-cs {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-areas: 'cal statC';
}

.home-widgets--layout-only-otros,
.home-widgets--layout-only-cal,
.home-widgets--layout-only-recent {
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: 'otros';
}

.home-widgets--layout-only-cal {
  grid-template-areas: 'cal';
}

.home-widgets--layout-only-recent {
  grid-template-areas: 'recent';
}

.home-widgets--layout-only-stats {
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: 'statC';
}

.widget-tile {
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1rem 1.1rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.widget-otros .widget-btn:first-of-type {
  margin-top: auto;
}

.widget-kicker {
  display: block;
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-mute);
  margin-bottom: 0.35rem;
}

.widget-title {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-heading);
}

.widget-stats-row {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: space-around;
  gap: 0.75rem;
  margin-top: 0.05rem;
}

.widget-stat {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.widget-stat-value {
  display: block;
  font-size: 1.32rem;
  font-weight: 700;
  color: var(--color-heading);
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}

.widget-stat-label {
  display: block;
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-mute);
  margin-top: 0.22rem;
}

.widget-meta {
  margin: 0 0 0.75rem;
  font-size: 0.78rem;
  color: var(--color-text-soft);
}

.widget-btn {
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.widget-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-background-hover);
}

.mini-cal {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin: 0.5rem 0 0.35rem;
}

.mini-cal-headers,
.mini-cal-body {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.35rem;
}

.mini-cal-dow-header {
  min-width: 0;
  text-align: center;
  font-size: 0.56rem;
  font-weight: 600;
  text-transform: capitalize;
  color: var(--color-text-mute);
  line-height: 1.2;
}

.mini-cal-day {
  min-width: 0;
  text-align: center;
  padding: 0.35rem 0.15rem;
  border-radius: 8px;
  background: var(--color-background-soft);
  border: 1px solid transparent;
}

.mini-cal-today {
  border-color: var(--color-accent);
  background: var(--color-background-hover);
}

.mini-cal-num {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-heading);
}

.widget-placeholder {
  margin: 0;
  font-size: 0.62rem;
  color: var(--color-text-mute);
}

/* Próximos eventos */
.upcoming-events {
  padding: 0 0.75rem 2rem;
  max-width: 960px;
  margin: 0 auto;
}

.upcoming-events-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.75rem;
  text-align: left;
}

.event-cards {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.event-card {
  width: 100%;
  text-align: left;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-background-card);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.event-card:hover,
.event-card:focus-visible {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.event-card-body {
  padding: 0.85rem 1rem;
}

.event-card-name {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-heading);
}

.event-card-subtitle {
  margin: 0 0 0.35rem;
  font-size: 0.75rem;
  color: var(--color-accent);
  font-weight: 500;
}

.event-card-empty-songs {
  margin: 0.2rem 0 0.35rem;
  padding: 0;
  font-size: 0.68rem;
  font-weight: 400;
  font-style: italic;
  color: var(--color-text-mute);
  line-height: 1.35;
}

.event-card-desc {
  margin: 0;
  font-size: 0.72rem;
  color: var(--color-text-soft);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Últimas canciones: lista compacta con scroll */
.widget-recent .widget-kicker {
  margin-bottom: 0.45rem;
}

.recent-songs-scroll {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: min(48vh, 18rem);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  flex: 1;
  min-height: 0;
}

@media (min-width: 720px) {
  .home-widgets--recent-span .recent-songs-scroll {
    max-height: min(56vh, 24rem);
  }
}

.widget-recent-empty {
  flex: 1;
  margin: 0;
  display: flex;
  align-items: center;
  padding-top: 0.35rem;
}

.recent-song-row {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.45rem 0.25rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.recent-song-row:hover,
.recent-song-row:focus-visible {
  outline: none;
  background: var(--color-background-hover);
}

.recent-song-title {
  font-size: 0.78rem;
  font-weight: 400;
  color: var(--color-heading);
  line-height: 1.25;
}

.recent-song-artist {
  font-size: 0.68rem;
  color: var(--color-text-soft);
}

/* News Section */
.news-section {
  padding: 4rem 1rem;
  background: var(--color-background-soft);
}

.news-section h2 {
  font-size: 1.65rem;
  color: var(--color-heading);
  text-align: center;
  margin: 0 0 2rem;
  font-weight: 600;
}

.news-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
  max-width: 1400px;
  margin: 0 auto;
}

.news-card {
  background: var(--color-background-card);
  padding: 2rem;
  border-radius: 10px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  width: 350px;
  height: auto;
  transition: all var(--transition-normal);
}

.news-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.news-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.news-type {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  font-size: 0.9rem;
  font-weight: bold;
}

.news-type svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.news-date {
  color: var(--color-accent);
  font-size: 0.8rem;
  font-weight: 500;
}

.news-card h3 {
  color: var(--color-heading);
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

.news-card p {
  color: var(--color-text-soft);
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.widget-spinner {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-text-soft);
  border-radius: 50%;
  animation: spin 0.85s linear infinite;
}

.widget-loading {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.35rem 0 0.15rem;
  min-height: 2.5rem;
}

.widget-loading-text {
  font-size: 0.75rem;
  color: var(--color-text-soft);
  font-weight: 500;
}

.upcoming-events-loading {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0 0.35rem;
}

.upcoming-events-loading-text {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-soft);
  font-weight: 500;
}

@media (max-width: 768px) {
  .home-brand-bar {
    padding: 1.1rem 3.5rem 1rem 0.65rem;
  }

  .home-brand-title {
    font-size: 0.88rem;
  }
}
</style>