<template>
  <div
    class="readonly-list"
    :style="columnWidthsStyle"
  >
    <!-- Secciones -->
    <div v-for="section in sectionsWithSongs" :key="section.id" class="section-block">
      <h3 class="section-title">
        {{ section.name }}
      </h3>
      <div class="song-rows">
        <div
          v-for="(song, index) in section.songs"
          :key="song.collection_song_id"
          class="song-row"
        >
          <div class="song-main-content">
            <div v-if="visibleFields.includes('number')" class="column-number">
              <span class="song-number">{{ index + 1 }}</span>
            </div>
            <div v-if="visibleFields.includes('title')" class="column-title">
              <button type="button" class="song-title-link" @click="emit('go-to-song', song)">
                {{ song.title }}
              </button>
            </div>
            <div v-if="visibleFields.includes('artist')" class="column-artist">
              <span class="song-artist">{{ song.artist }}</span>
            </div>
            <div v-if="visibleFields.includes('tags')" class="column-tags">
              <div class="song-tags">
                <KeyBadge v-if="getSongKey(song.id)" :key-value="getSongKey(song.id)!" size="sm" />
                <span v-for="tag in removeKeyTagFromTags(song.tags || [])" :key="tag" class="tag">{{ tag }}</span>
                <span
                  v-for="tag in getPersonalTagsForSong(song.id).filter((t: string) => !t.startsWith('key:'))"
                  :key="`personal-${tag}`"
                  class="tag tag-personal"
                >{{ tag }}</span>
              </div>
            </div>
            <div v-if="visibleFields.includes('list_tags')" class="column-list-tags">
              <div v-if="song.list_tags && song.list_tags.length > 0" class="list-tags">
                <span v-for="listTag in song.list_tags" :key="listTag" class="list-tag">{{ listTag }}</span>
              </div>
            </div>
            <div v-if="hasMeta(song)" class="column-meta">
              <div class="song-meta">
                <span v-if="visibleFields.includes('bpm') && song.bpm" class="meta-item">BPM: {{ song.bpm }}</span>
                <span v-if="visibleFields.includes('tempo') && song.tempo" class="meta-item">{{ song.tempo }}</span>
              </div>
            </div>
          </div>
          <!-- Fila 2 (si hay notas) -->
          <div v-if="visibleFields.includes('notes') && song.notes && song.notes.trim()" class="song-notes">
            <div class="notes-content">{{ song.notes }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sin clasificar -->
    <div v-if="unassignedSongs.length > 0" class="section-block">
      <h3 class="section-title section-title-muted">Sin clasificar ({{ unassignedSongs.length }})</h3>
      <div class="song-rows">
        <div
          v-for="(song, index) in unassignedSongs"
          :key="song.collection_song_id"
          class="song-row"
        >
          <div class="song-main-content">
            <div v-if="visibleFields.includes('number')" class="column-number">
              <span class="song-number">{{ index + 1 }}</span>
            </div>
            <div v-if="visibleFields.includes('title')" class="column-title">
              <button type="button" class="song-title-link" @click="emit('go-to-song', song)">
                {{ song.title }}
              </button>
            </div>
            <div v-if="visibleFields.includes('artist')" class="column-artist">
              <span class="song-artist">{{ song.artist }}</span>
            </div>
            <div v-if="visibleFields.includes('tags')" class="column-tags">
              <div class="song-tags">
                <KeyBadge v-if="getSongKey(song.id)" :key-value="getSongKey(song.id)!" size="sm" />
                <span v-for="tag in removeKeyTagFromTags(song.tags || [])" :key="tag" class="tag">{{ tag }}</span>
                <span
                  v-for="tag in getPersonalTagsForSong(song.id).filter((t: string) => !t.startsWith('key:'))"
                  :key="`personal-${tag}`"
                  class="tag tag-personal"
                >{{ tag }}</span>
              </div>
            </div>
            <div v-if="visibleFields.includes('list_tags')" class="column-list-tags">
              <div v-if="song.list_tags && song.list_tags.length > 0" class="list-tags">
                <span v-for="listTag in song.list_tags" :key="listTag" class="list-tag">{{ listTag }}</span>
              </div>
            </div>
            <div v-if="hasMeta(song)" class="column-meta">
              <div class="song-meta">
                <span v-if="visibleFields.includes('bpm') && song.bpm" class="meta-item">BPM: {{ song.bpm }}</span>
                <span v-if="visibleFields.includes('tempo') && song.tempo" class="meta-item">{{ song.tempo }}</span>
              </div>
            </div>
          </div>
          <div v-if="visibleFields.includes('notes') && song.notes && song.notes.trim()" class="song-notes">
            <div class="notes-content">{{ song.notes }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import KeyBadge from './common/KeyBadge.vue';
import type { CancionEnLista } from '../types/songTypes';
import type { CollectionReadOnlyColumnWidths } from '@/utils/persistence/types';

const DEFAULT_WIDTHS: Required<CollectionReadOnlyColumnWidths> = {
  number: 36,
  title: 215,
  artist: 150,
  tags: 120,
  list_tags: 120,
  meta: 100,
  notes: 280
};

interface SectionWithSongs {
  id: string;
  name: string;
  color?: string;
  songs: CancionEnLista[];
}

const props = withDefaults(
  defineProps<{
    sectionsWithSongs: SectionWithSongs[];
    unassignedSongs: CancionEnLista[];
    visibleFields?: string[];
    columnWidths?: CollectionReadOnlyColumnWidths | null;
    getSongKey?: (songId: string) => string | null;
    getPersonalTagsForSong?: (songId: string) => string[];
    removeKeyTagFromTags?: (tags: string[]) => string[];
  }>(),
  {
    visibleFields: () => ['title', 'artist', 'list_tags'],
    columnWidths: () => null,
    getSongKey: () => () => null,
    getPersonalTagsForSong: () => () => [],
    removeKeyTagFromTags: (tags: string[]) => tags
  }
);

const emit = defineEmits<{
  (e: 'go-to-song', song: CancionEnLista): void;
}>();

const columnWidthsStyle = computed(() => {
  const w = props.columnWidths;
  if (!w || typeof w !== 'object') return {};
  return {
    '--col-number': `${w.number ?? DEFAULT_WIDTHS.number}px`,
    '--col-title': `${w.title ?? DEFAULT_WIDTHS.title}px`,
    '--col-artist': `${w.artist ?? DEFAULT_WIDTHS.artist}px`,
    '--col-tags': `${w.tags ?? DEFAULT_WIDTHS.tags}px`,
    '--col-list-tags': `${w.list_tags ?? DEFAULT_WIDTHS.list_tags}px`,
    '--col-meta': `${w.meta ?? DEFAULT_WIDTHS.meta}px`,
    '--col-notes': `${w.notes ?? DEFAULT_WIDTHS.notes}px`
  };
});

function hasMeta(song: CancionEnLista): boolean {
  const { visibleFields } = props;
  return (visibleFields.includes('bpm') && !!song.bpm) || (visibleFields.includes('tempo') && !!song.tempo);
}
</script>

<style scoped>
.readonly-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Títulos de sección: etiquetas de grupo, diferenciados de los títulos de canción */
.section-title {
  font-size: 0.8125rem;
  font-weight: 500;
  margin: 0;
  padding: 0 0 0.5rem 0;
  border-bottom: none;
  color: var(--color-text-mute);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: color var(--transition-normal);
}

.section-title-muted {
  color: var(--color-text-mute);
  font-weight: 500;
  opacity: 0.9;
}

.song-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Cada canción: solo el título es clicable (artista podrá serlo después) */
.song-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  width: 100%;
  padding: 0.5rem 0.25rem 0.5rem 0;
  margin: 0;
  border-radius: 6px;
  text-align: left;
  font: inherit;
  color: inherit;
}

/* Fila 1: número | título | artista | etiquetas | etiquetas lista | meta (estilo tipo Spotify) */
.song-main-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex-wrap: wrap;
}

.column-number {
  width: var(--col-number, 36px);
  min-width: var(--col-number, 36px);
  flex-shrink: 0;
  text-align: right;
}

.song-number {
  font-size: 0.875rem;
  color: var(--color-text-mute);
  font-variant-numeric: tabular-nums;
}

.column-title {
  width: var(--col-title, 215px);
  min-width: calc(var(--col-title, 215px) - 15px);
  flex-shrink: 0;
}

.column-artist {
  width: var(--col-artist, 150px);
  min-width: calc(var(--col-artist, 150px) - 15px);
  flex-shrink: 0;
}

.column-tags {
  width: var(--col-tags, 120px);
  min-width: calc(var(--col-tags, 120px) - 15px);
  flex-shrink: 0;
}

.column-list-tags {
  width: var(--col-list-tags, 120px);
  min-width: calc(var(--col-list-tags, 120px) - 15px);
  flex-shrink: 0;
}

.column-meta {
  width: var(--col-meta, 100px);
  min-width: calc(var(--col-meta, 100px) - 15px);
  flex-shrink: 0;
}

/* Título de canción: clicable para ir a la canción (solo el título, no toda la fila) */
.song-title-link {
  font-family: inherit;
  font-size: 1rem;
  font-weight: 400;
  color: var(--color-heading);
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  width: 100%;
  min-width: 0;
  transition: color var(--transition-normal);
}

.song-title-link:hover {
  color: var(--color-accent);
}

/* Artista: texto secundario */
.song-artist {
  font-size: 0.875rem;
  color: var(--color-text-mute);
  margin: 0;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  transition: color var(--transition-normal);
}

.song-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: nowrap;
  align-items: center;
  overflow: hidden;
}

.tag {
  font-size: 0.8125rem;
  color: var(--color-text-soft);
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  background: var(--color-background-soft);
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.2;
}

.tag-personal {
  color: var(--cf-navy, var(--color-text));
  background: rgba(var(--cf-navy-rgb, 30, 58, 138), 0.08);
}

.list-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: nowrap;
  align-items: center;
  overflow: hidden;
}

.list-tag {
  font-size: 0.8125rem;
  color: var(--color-text-soft);
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  background: var(--color-background-soft);
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.2;
}

.song-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: nowrap;
  align-items: center;
}

.meta-item {
  font-size: 0.8125rem;
  color: var(--color-text-mute);
  white-space: nowrap;
  flex-shrink: 0;
}

/* Fila 2: notas (minimalista, sin caja) */
.song-notes {
  margin-top: 0.125rem;
  padding-left: 0;
}

.notes-content {
  font-size: 0.875rem;
  color: var(--color-text-soft);
  line-height: 1.4;
  word-wrap: break-word;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  max-width: var(--col-notes, 280px);
}
</style>
