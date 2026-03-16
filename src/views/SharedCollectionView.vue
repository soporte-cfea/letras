<template>
  <div class="shared-list-container">
    <header class="shared-header">
      <div class="shared-header-top">
        <router-link
          v-if="authStore.isAuthenticated"
          to="/colecciones"
          class="back-to-app"
          title="Volver a la app"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          <span>App</span>
        </router-link>
        <h1 class="shared-title">{{ collectionTitle }}</h1>
        <div class="header-controls">
          <button
            type="button"
            role="switch"
            :aria-checked="isDark"
            :aria-label="isDark ? 'Tema oscuro. Pulsa para cambiar a claro.' : 'Tema claro. Pulsa para cambiar a oscuro.'"
            :title="isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
            class="theme-switch"
            @click="toggleThemeLightDark"
          >
            <span class="theme-switch-track">
              <span class="theme-switch-icon theme-switch-icon--sun">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              </span>
              <span class="theme-switch-thumb" :class="{ dark: isDark }"></span>
              <span class="theme-switch-icon theme-switch-icon--moon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </span>
            </span>
          </button>
          <button
            v-if="!loading && !error && collectionSongs.length > 0"
            type="button"
            role="switch"
            :aria-checked="viewMode === 'compact'"
            :aria-label="viewMode === 'compact' ? 'Vista compacta. Pulsa para tarjetas.' : 'Vista tarjetas. Pulsa para compacta.'"
            :title="viewMode === 'compact' ? 'Cambiar a vista tarjetas' : 'Cambiar a vista compacta'"
            class="view-switch"
            @click="viewMode = viewMode === 'cards' ? 'compact' : 'cards'"
          >
            <span class="view-switch-track">
              <span class="view-switch-icon view-switch-icon--cards">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </span>
              <span class="view-switch-thumb" :class="{ compact: viewMode === 'compact' }"></span>
              <span class="view-switch-icon view-switch-icon--list">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </span>
            </span>
          </button>
        </div>
      </div>
      <p v-if="collectionSubtitle" class="shared-subtitle">{{ collectionSubtitle }}</p>
      <div v-if="!loading && !error && collectionSongs.length > 0" class="search-wrap">
        <div class="search-bar">
          <svg class="search-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            v-model.trim="searchQuery"
            type="search"
            class="search-input"
            placeholder="Buscar canción"
            autocomplete="off"
            aria-label="Buscar canción"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="search-clear"
            @click="searchQuery = ''"
            aria-label="Borrar búsqueda"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <div v-if="showTitleBelowHeader && !loading && !error" class="shared-title-below-header">
      <h2 class="shared-title-below-header-text">{{ collectionTitle }}</h2>
    </div>

    <main class="shared-main">
      <div v-if="loading" class="state-container">
        <div class="loading-spinner"></div>
        <p>Cargando canciones...</p>
      </div>

      <div v-else-if="error" class="state-container error">
        <div class="error-icon">⚠️</div>
        <h3>No se pudieron cargar las canciones</h3>
        <p>{{ error }}</p>
      </div>

      <div v-else-if="collectionSongs.length === 0" class="state-container empty">
        <div class="empty-icon">🎵</div>
        <h3>No hay canciones aquí</h3>
      </div>

      <div v-else class="shared-songs" :class="{ 'shared-songs--compact': viewMode === 'compact' }">
        <p v-if="filteredSongs.length === 0" class="search-no-results">
          No hay canciones que coincidan con "{{ searchQuery }}"
        </p>
        <ul v-else class="song-list" :class="{ 'song-list--compact': viewMode === 'compact' }">
          <li
            v-for="song in filteredSongs"
            :key="song.collection_song_id ?? song.id"
            class="song-row"
            :class="{ 'song-row--compact': viewMode === 'compact' }"
            @click="goToSong(song)"
          >
            <template v-if="viewMode === 'cards'">
              <div class="song-row-content">
                <span class="song-name">{{ song.title }}</span>
                <span class="song-artist">{{ song.artist }}</span>
                <p v-if="lyricsSnippets[song.id]" class="song-lyrics-snippet">
                  {{ lyricsSnippets[song.id] }}
                </p>
                <div v-if="(song.list_tags?.length || song.notes)" class="song-meta">
                  <span v-if="song.list_tags?.length" class="list-tags">
                    {{ song.list_tags.join(' · ') }}
                  </span>
                  <span v-if="song.notes?.trim()" class="song-notes">{{ song.notes }}</span>
                </div>
              </div>
              <span class="song-chevron" aria-hidden="true">›</span>
            </template>
            <template v-else>
              <span class="song-name">{{ song.title }}</span>
              <span class="song-chevron" aria-hidden="true">›</span>
            </template>
          </li>
        </ul>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useColeccionesStore } from '@/stores/colecciones'
import { useCancionesStore } from '@/stores/canciones'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { getCachedLyricsSnippetsForSongIds, setCachedSong } from '@/utils/cache'
import { sharedListViewModeStorage, collectionReadOnlyShowTitleBelowHeaderStorage } from '@/utils/persistence'
import type { Collection, CancionEnLista } from '@/types/songTypes'

const route = useRoute()
const router = useRouter()
const coleccionesStore = useColeccionesStore()
const cancionesStore = useCancionesStore()
const authStore = useAuthStore()
const { isDark, applyTheme } = useTheme()

function toggleThemeLightDark() {
  applyTheme(isDark.value ? 'light' : 'dark')
}

const { getDayOfWeek, formatEventDate } = coleccionesStore
const { loading, error, collectionSongs } = storeToRefs(coleccionesStore)

const collection = ref<Collection | null>(null)
const lyricsSnippets = ref<Record<string, string>>({})
const viewMode = ref<'cards' | 'compact'>(
  sharedListViewModeStorage.get() ?? 'compact'
)
const searchQuery = ref('')
const showTitleBelowHeader = ref(false)

const collectionId = computed(() => route.params.id as string)

function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\u0300/g, '')
}

const filteredSongs = computed(() => {
  const q = searchQuery.value
  if (!q) return collectionSongs.value
  const norm = normalizeForSearch(q)
  return collectionSongs.value.filter((song) => {
    if (normalizeForSearch(song.title).includes(norm)) return true
    if (normalizeForSearch(song.artist || '').includes(norm)) return true
    const snippet = lyricsSnippets.value[song.id]
    if (snippet && normalizeForSearch(snippet).includes(norm)) return true
    const tags = (song.list_tags || []).join(' ')
    if (tags && normalizeForSearch(tags).includes(norm)) return true
    if (song.notes && normalizeForSearch(song.notes).includes(norm)) return true
    return false
  })
})

const collectionTitle = computed(() => {
  if (!collection.value) return 'Canciones'
  const col = collection.value
  if (col.category === 'lista semanal') {
    const day = getDayOfWeek(col.event_date)
    const date = formatEventDate(col.event_date)
    const dayLabel = day ? day.charAt(0).toUpperCase() + day.slice(1) : ''
    if (day && date) return `${dayLabel} ${date}`
    if (date) return date
    return 'Canciones'
  }
  if (col.category === 'evento') {
    const name = col.name || 'Evento'
    const date = formatEventDate(col.event_date)
    return date ? `${name} – ${date}` : name
  }
  return col.name || 'Canciones'
})

const collectionSubtitle = computed(() => {
  if (!collection.value?.description) return ''
  return collection.value.description
})

const PRECACHE_CONCURRENCY = 4

async function refreshSnippetsFromCache() {
  const ids = collectionSongs.value.map((s) => String(s.id))
  if (ids.length) {
    lyricsSnippets.value = await getCachedLyricsSnippetsForSongIds(ids, 100)
  }
}

function precacheLyricsInBackground(songIds: string[], forCollectionId: string) {
  const run = async () => {
    for (let i = 0; i < songIds.length; i += PRECACHE_CONCURRENCY) {
      if (collectionId.value !== forCollectionId) return
      const batch = songIds.slice(i, i + PRECACHE_CONCURRENCY)
      await Promise.all(batch.map((id) => cancionesStore.getSongLyrics(id)))
      if (collectionId.value !== forCollectionId) return
      await refreshSnippetsFromCache()
    }
  }
  run()
}

async function load() {
  const id = collectionId.value
  if (!id) return
  try {
    collection.value = await coleccionesStore.getCollection(id)
    if (!collection.value) return
    const realId = collection.value.id
    await coleccionesStore.loadCollectionSongs(realId, true)
    const songs = collectionSongs.value
    await Promise.all(songs.map((s) => setCachedSong({ ...s, id: String(s.id), tags: s.tags || [] })))
    const ids = songs.map((s) => String(s.id))
    lyricsSnippets.value = await getCachedLyricsSnippetsForSongIds(ids, 100)
    precacheLyricsInBackground(ids, realId)
  } catch (err) {
    console.error('Error loading shared list:', err)
  }
}

function goToSong(song: CancionEnLista) {
  const slug = song.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const from = `/v/${collectionId.value}`
  router.push({ path: `/cancion/${song.id}-${slug}`, query: { from } })
}

watch(viewMode, (mode) => {
  sharedListViewModeStorage.set(mode)
}, { immediate: false })

onMounted(() => {
  showTitleBelowHeader.value = collectionReadOnlyShowTitleBelowHeaderStorage.get() === true
  load()
})

onActivated(() => {
  showTitleBelowHeader.value = collectionReadOnlyShowTitleBelowHeaderStorage.get() === true
  if (collectionSongs.value.length) refreshSnippetsFromCache()
})

watch(collectionId, () => load())
</script>

<style scoped>
.shared-list-container {
  min-height: 100vh;
  background: var(--color-background);
  display: flex;
  flex-direction: column;
  transition: background-color var(--transition-normal);
}

.shared-header {
  background: var(--color-background-card);
  border-bottom: 1px solid var(--color-border);
  padding: 1.25rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 10;
  transition: all var(--transition-normal);
}

.shared-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.shared-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--color-heading);
  margin: 0;
  line-height: 1.3;
  flex: 1;
  min-width: 0;
  transition: color var(--transition-normal);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Controles pill unificados: mismo tamaño (56×28), borde y estados */
.theme-switch {
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.theme-switch:hover .theme-switch-track {
  border-color: var(--color-border-hover);
}

.theme-switch:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

.theme-switch-track {
  display: grid;
  grid-template-columns: 1fr 1fr;
  place-items: center;
  position: relative;
  width: 76px;
  height: 40px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  transition: background-color var(--transition-normal), border-color var(--transition-normal);
}

.theme-switch-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  color: var(--color-text-soft);
  transition: color var(--transition-normal);
  pointer-events: none;
  z-index: 1;
}

.theme-switch-icon svg {
  width: 18px;
  height: 18px;
  display: block;
}

.theme-switch-icon--sun {
  transform: translateX(-1px);
}

.theme-switch-icon--moon {
  transform: translateX(1px);
}

.theme-switch-thumb {
  position: absolute;
  top: 50%;
  left: 5px;
  width: 28px;
  height: 28px;
  margin-top: -14px;
  border-radius: 50%;
  background: var(--color-background-card);
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--color-border);
  transition: transform 0.22s ease;
  pointer-events: none;
  z-index: 0;
}

.theme-switch-thumb.dark {
  transform: translateX(38px);
}

/* Switch de vista: mismo patrón que tema (track + thumb + iconos) */
.view-switch {
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
}

.view-switch:hover .view-switch-track {
  border-color: var(--color-border-hover);
}

.view-switch:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

.view-switch-track {
  display: grid;
  grid-template-columns: 1fr 1fr;
  place-items: center;
  position: relative;
  width: 76px;
  height: 40px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  transition: background-color var(--transition-normal), border-color var(--transition-normal);
}

.view-switch-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  color: var(--color-text-soft);
  transition: color var(--transition-normal);
  pointer-events: none;
  z-index: 1;
}

.view-switch-icon svg {
  width: 18px;
  height: 18px;
  display: block;
}

.view-switch-icon--cards {
  transform: translateX(-2px);
}

.view-switch-icon--list {
  transform: translateX(-1px);
}

.view-switch-thumb {
  position: absolute;
  top: 50%;
  left: 5px;
  width: 28px;
  height: 28px;
  margin-top: -14px;
  border-radius: 50%;
  background: var(--color-background-card);
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--color-border);
  transition: transform 0.22s ease;
  pointer-events: none;
  z-index: 0;
}

.view-switch-thumb.compact {
  transform: translateX(38px);
}

.back-to-app {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  color: var(--color-text-mute);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  flex-shrink: 0;
  transition: color var(--transition-fast), background-color var(--transition-fast);
}

.back-to-app:hover {
  color: var(--color-text);
  background: var(--color-background-hover);
}

.shared-subtitle {
  font-size: 0.9375rem;
  color: var(--color-text-soft);
  margin: 0.5rem 0 0 0;
  line-height: 1.4;
  transition: color var(--transition-normal);
}

.shared-header-top + .shared-subtitle {
  margin-top: 0.5rem;
}

.search-wrap {
  margin-top: 1rem;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.5rem 1rem 0.5rem 1rem;
  transition: background-color var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.search-bar:focus-within {
  background: var(--color-background-card);
  border-color: var(--color-border);
  box-shadow: 0 0 0 2px var(--color-background), 0 0 0 4px var(--color-border-focus);
}

.search-icon {
  flex-shrink: 0;
  color: var(--color-text-mute);
  transition: color var(--transition-normal);
}

.search-bar:focus-within .search-icon {
  color: var(--color-text);
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.9375rem;
  outline: none;
}

.search-input::placeholder {
  color: var(--color-text-mute);
}

[data-theme="dark"] .search-bar {
  background: var(--color-background-mute);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .search-bar {
    background: var(--color-background-mute);
  }
}

.search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-mute);
  cursor: pointer;
  border-radius: 50%;
  transition: color var(--transition-fast), background-color var(--transition-fast);
}

.search-clear:hover {
  color: var(--color-text);
  background: var(--color-background-hover);
}

.search-no-results {
  text-align: center;
  color: var(--color-text-mute);
  font-size: 0.9375rem;
  margin: 2rem 0 0 0;
  padding: 0 1rem;
}

.shared-main {
  flex: 1;
  padding: 1rem 1.5rem 2rem;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.error h3,
.empty h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
  transition: color var(--transition-normal);
}

.error p,
.empty p {
  color: var(--color-text-soft);
  margin: 0;
  font-size: 0.9375rem;
  transition: color var(--transition-normal);
}

.shared-title-below-header {
  padding: 0.75rem 1.5rem;
  background: var(--color-background);
  border-bottom: none;
  transition: background-color var(--transition-normal);
}

.shared-title-below-header-text {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-heading);
  line-height: 1.3;
  transition: color var(--transition-normal);
}

.shared-songs {
  display: flex;
  flex-direction: column;
}

.song-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.song-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.song-row:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-md);
  background: var(--color-background-hover);
}

.song-row-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.song-name {
  font-weight: 400;
  font-size: 1rem;
  color: var(--color-heading);
  transition: color var(--transition-normal);
}

.song-artist {
  font-size: 0.875rem;
  color: var(--color-text-soft);
  transition: color var(--transition-normal);
}

.song-lyrics-snippet {
  font-size: 0.8125rem;
  color: var(--color-text-mute);
  line-height: 1.4;
  margin: 0.375rem 0 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color var(--transition-normal);
}

.song-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: var(--color-text-mute);
  transition: color var(--transition-normal);
}

.list-tags {
  font-weight: 400;
}

.song-notes {
  font-style: italic;
}

.song-chevron {
  font-size: 1.25rem;
  color: var(--color-text-mute);
  flex-shrink: 0;
  transition: color var(--transition-normal);
}

.song-row:hover .song-chevron {
  color: var(--color-accent);
}

/* Vista compacta: solo nombre, sin cards */
.song-list--compact {
  gap: 0;
}

.song-row--compact {
  padding: 0.4rem 0;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  gap: 0.5rem;
}

.song-row--compact:hover {
  background: var(--color-background-soft);
}

.song-row--compact .song-name {
  flex: 1;
  min-width: 0;
  font-size: 0.9375rem;
}

.song-row--compact .song-chevron {
  font-size: 1rem;
}

@media (max-width: 640px) {
  .shared-header {
    padding: 1rem 1.25rem;
  }

  .shared-title {
    font-size: 1.25rem;
  }

  .search-wrap {
    margin-top: 0.75rem;
  }

  .search-bar {
    padding: 0.45rem 0.875rem;
  }

  .search-input {
    font-size: 0.875rem;
  }

  .theme-switch-track,
  .view-switch-track {
    width: 68px;
    height: 36px;
    padding: 0 2px;
  }

  .theme-switch-thumb,
  .view-switch-thumb {
    width: 24px;
    height: 24px;
    left: 4px;
    margin-top: -12px;
  }

  .theme-switch-thumb.dark {
    transform: translateX(34px);
  }

  .view-switch-thumb.compact {
    transform: translateX(34px);
  }

  .theme-switch-icon svg,
  .view-switch-icon svg {
    width: 16px;
    height: 16px;
  }

  .shared-main {
    padding: 1rem 1.25rem 1.5rem;
  }

  .song-row {
    padding: 0.875rem 1rem;
  }

  .song-row--compact {
    padding: 0.35rem 0;
  }

  .song-name {
    font-size: 0.9375rem;
  }

  .song-lyrics-snippet {
    font-size: 0.75rem;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
}
</style>
