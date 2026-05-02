<template>
  <div class="cards-view" :style="columnWidthsStyle">
    <div v-for="section in sectionsWithSongs" :key="section.id" class="section-block">
      <h3 class="section-title">{{ section.name }}</h3>
      <div class="cards-grid">
        <article
          v-for="song in section.songs"
          :key="song.collection_song_id"
          class="song-card"
          @click="emit('go-to-song', song)"
        >
          <div v-if="showTitleRow(song) || getDocPresence" class="song-card-header">
            <div v-if="showTitleRow(song)" class="song-card-main">
              <h4 v-if="visibleFields.includes('title')" class="song-title">{{ song.title }}</h4>
              <div v-if="showInlineTags(song)" class="song-tags-inline">
                <span v-for="tag in removeKeyTagFromTags(song.tags || [])" :key="tag" class="tag">{{ tag }}</span>
                <span
                  v-for="tag in getPersonalTagsForSong(song.id).filter((t: string) => !t.startsWith('key:'))"
                  :key="`personal-${tag}`"
                  class="tag tag-personal"
                >{{ tag }}</span>
              </div>
            </div>
            <div v-if="getDocPresence" class="song-doc-corner">
              <SongDocIndicators
                :presence="getDocPresence(song)"
                mode="values"
                :interactive="true"
                @select="(section) => emit('doc-indicator-select', song, section)"
              />
            </div>
          </div>

          <div
            v-if="visibleFields.includes('artist') || (visibleFields.includes('tags') && getSongKey(song.id)) || (visibleFields.includes('list_tags') && song.list_tags?.length)"
            class="song-subline"
          >
            <p v-if="visibleFields.includes('artist')" class="song-artist">{{ song.artist }}</p>
            <KeyBadge
              v-if="visibleFields.includes('tags') && getSongKey(song.id)"
              :key-value="getSongKey(song.id)!"
              size="sm"
            />
            <span
              v-if="visibleFields.includes('list_tags')"
              v-for="listTag in song.list_tags || []"
              :key="`subline-list-${listTag}`"
              class="list-tag"
            >{{ listTag }}</span>
          </div>

          <div v-if="hasMeta(song)" class="song-meta">
            <span v-if="visibleFields.includes('bpm') && song.bpm" class="meta-item">BPM: {{ song.bpm }}</span>
            <span v-if="visibleFields.includes('tempo') && song.tempo" class="meta-item">{{ song.tempo }}</span>
          </div>

          <p
            v-if="visibleFields.includes('notes') && song.notes?.trim()"
            class="song-notes"
          >{{ song.notes }}</p>
        </article>
      </div>
    </div>

    <div v-if="unassignedSongs.length > 0" class="section-block">
      <h3 class="section-title section-title-muted">Sin clasificar ({{ unassignedSongs.length }})</h3>
      <div class="cards-grid">
        <article
          v-for="song in unassignedSongs"
          :key="song.collection_song_id"
          class="song-card"
          @click="emit('go-to-song', song)"
        >
          <div v-if="showTitleRow(song) || getDocPresence" class="song-card-header">
            <div v-if="showTitleRow(song)" class="song-card-main">
              <h4 v-if="visibleFields.includes('title')" class="song-title">{{ song.title }}</h4>
              <div v-if="showInlineTags(song)" class="song-tags-inline">
                <span v-for="tag in removeKeyTagFromTags(song.tags || [])" :key="tag" class="tag">{{ tag }}</span>
                <span
                  v-for="tag in getPersonalTagsForSong(song.id).filter((t: string) => !t.startsWith('key:'))"
                  :key="`personal-${tag}`"
                  class="tag tag-personal"
                >{{ tag }}</span>
              </div>
            </div>
            <div v-if="getDocPresence" class="song-doc-corner">
              <SongDocIndicators
                :presence="getDocPresence(song)"
                mode="values"
                :interactive="true"
                @select="(section) => emit('doc-indicator-select', song, section)"
              />
            </div>
          </div>

          <div
            v-if="visibleFields.includes('artist') || (visibleFields.includes('tags') && getSongKey(song.id)) || (visibleFields.includes('list_tags') && song.list_tags?.length)"
            class="song-subline"
          >
            <p v-if="visibleFields.includes('artist')" class="song-artist">{{ song.artist }}</p>
            <KeyBadge
              v-if="visibleFields.includes('tags') && getSongKey(song.id)"
              :key-value="getSongKey(song.id)!"
              size="sm"
            />
            <span
              v-if="visibleFields.includes('list_tags')"
              v-for="listTag in song.list_tags || []"
              :key="`subline-list-${listTag}`"
              class="list-tag"
            >{{ listTag }}</span>
          </div>

          <div v-if="hasMeta(song)" class="song-meta">
            <span v-if="visibleFields.includes('bpm') && song.bpm" class="meta-item">BPM: {{ song.bpm }}</span>
            <span v-if="visibleFields.includes('tempo') && song.tempo" class="meta-item">{{ song.tempo }}</span>
          </div>

          <p
            v-if="visibleFields.includes('notes') && song.notes?.trim()"
            class="song-notes"
          >{{ song.notes }}</p>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import KeyBadge from './common/KeyBadge.vue';
import SongDocIndicators, { type DocIndicatorSection } from './common/SongDocIndicators.vue';
import type { CancionEnLista, SongDocumentPresence } from '@/types/songTypes';
import type { CollectionReadOnlyColumnWidths } from '@/utils/persistence/types';

interface SectionWithSongs {
  id: string;
  name: string;
  songs: CancionEnLista[];
}

const DEFAULT_WIDTHS: Required<CollectionReadOnlyColumnWidths> = {
  title: 215,
  artist: 150,
  tags: 120,
  list_tags: 120,
  meta: 100,
  notes: 280,
};

const props = withDefaults(defineProps<{
  sectionsWithSongs: SectionWithSongs[];
  unassignedSongs: CancionEnLista[];
  visibleFields?: string[];
  columnWidths?: CollectionReadOnlyColumnWidths | null;
  getSongKey?: (songId: string) => string | null;
  getPersonalTagsForSong?: (songId: string) => string[];
  removeKeyTagFromTags?: (tags: string[]) => string[];
  getDocPresence?: (song: CancionEnLista) => SongDocumentPresence;
}>(), {
  visibleFields: () => ['title', 'artist', 'list_tags'],
  columnWidths: () => null,
  getSongKey: () => () => null,
  getPersonalTagsForSong: () => () => [],
  removeKeyTagFromTags: (tags: string[]) => tags,
  getDocPresence: undefined,
});

const emit = defineEmits<{
  (e: 'go-to-song', song: CancionEnLista): void;
  (e: 'doc-indicator-select', song: CancionEnLista, section: DocIndicatorSection): void;
}>();

const getDocPresence = props.getDocPresence;

const getSongKey = props.getSongKey;
const getPersonalTagsForSong = props.getPersonalTagsForSong;
const removeKeyTagFromTags = props.removeKeyTagFromTags;

const columnWidthsStyle = computed(() => {
  const w = props.columnWidths;
  if (!w || typeof w !== 'object') return {};
  return {
    '--col-title': `${w.title ?? DEFAULT_WIDTHS.title}px`,
    '--col-artist': `${w.artist ?? DEFAULT_WIDTHS.artist}px`,
    '--col-tags': `${w.tags ?? DEFAULT_WIDTHS.tags}px`,
    '--col-list-tags': `${w.list_tags ?? DEFAULT_WIDTHS.list_tags}px`,
    '--col-meta': `${w.meta ?? DEFAULT_WIDTHS.meta}px`,
    '--col-notes': `${w.notes ?? DEFAULT_WIDTHS.notes}px`,
  };
});

function hasMeta(song: CancionEnLista): boolean {
  const { visibleFields } = props;
  return (
    (visibleFields.includes('bpm') && !!song.bpm) ||
    (visibleFields.includes('tempo') && !!song.tempo)
  );
}

function showInlineTags(song: CancionEnLista): boolean {
  if (!props.visibleFields.includes('tags')) return false;
  const personal = getPersonalTagsForSong(song.id).filter((t: string) => !t.startsWith('key:'));
  return Boolean(song.tags?.length || personal.length);
}

function showTitleRow(song: CancionEnLista): boolean {
  if (props.visibleFields.includes('title')) return true;
  return showInlineTags(song);
}
</script>

<style scoped>
.cards-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.section-title {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-text-mute);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 0.2rem;
}

.section-title-muted {
  opacity: 0.85;
}

.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.song-card {
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 0.62rem 0.78rem;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.song-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-0.5px);
  box-shadow: var(--shadow-sm);
}

.song-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.4rem;
  min-width: 0;
}

.song-card-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
  flex-wrap: wrap;
}

.song-doc-corner {
  flex-shrink: 0;
  align-self: flex-start;
  line-height: 0;
  margin-top: 0.04rem;
}

.song-doc-corner:first-child:last-child {
  margin-left: auto;
}

.song-subline {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  min-width: 0;
  max-width: min(100%, calc(var(--col-title, 280px) + var(--col-artist, 150px)));
}

.song-tags-inline {
  display: flex;
  align-items: center;
  gap: 0.24rem;
  flex-wrap: wrap;
  max-width: min(100%, calc(var(--col-tags, 120px) + var(--col-list-tags, 120px) + 180px));
}

.song-title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 500;
  color: var(--color-heading);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  max-width: 100%;
}

.song-artist {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-text-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: min(100%, var(--col-artist, 100%));
}

.song-tags,
.list-tags,
.song-meta {
  display: flex;
  gap: 0.24rem;
  flex-wrap: wrap;
  align-items: center;
  max-width: min(100%, var(--col-tags, 100%));
}

.list-tags {
  max-width: min(100%, var(--col-list-tags, 100%));
}

.song-meta {
  max-width: min(100%, var(--col-meta, 100%));
}

.tag,
.list-tag,
.meta-item {
  font-size: 0.72rem;
  padding: 0.14rem 0.36rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  color: var(--color-text-soft);
}

.tag-personal {
  color: var(--cf-navy, var(--color-text));
  background: rgba(var(--cf-navy-rgb, 30, 58, 138), 0.08);
}

.song-notes {
  margin: 0.1rem 0 0 0;
  font-size: 0.78rem;
  color: var(--color-text-soft);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: min(100%, var(--col-notes, 100%));
}

@media (max-width: 768px) {
  .song-card {
    padding: 0.58rem 0.68rem;
  }

  .song-title {
    font-size: 0.95rem;
  }

  .song-artist {
    font-size: 0.8rem;
  }

  .song-card-text-block {
    max-width: 100%;
  }

  .song-subline {
    max-width: 100%;
  }

  .song-tags,
  .list-tags,
  .song-meta {
    max-width: 100%;
  }

  .song-notes {
    max-width: 100%;
  }
}
</style>
