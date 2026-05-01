import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DocumentsService } from '@/api/songs';
import { normalizeSongId } from '@/utils/cache';
import type { SongDocumentPresence } from '@/types/songTypes';

function emptyPresence(): SongDocumentPresence {
  return { lyrics: false, chords: false, analysis: false };
}

/** Huella estable del listado de canciones (para saber si el caché sigue siendo válido). */
function fingerprintForSongIds(rawIds: string[]): string {
  if (rawIds.length === 0) return '__empty__';
  const norm = [...new Set(rawIds.map((id) => normalizeSongId(id)))];
  norm.sort();
  return norm.join('|');
}

export const useDocumentPresenceStore = defineStore('documentPresence', () => {
  const bySongId = ref<Record<string, SongDocumentPresence>>({});
  const syncedFingerprint = ref<string | null>(null);

  function hasFullCacheFor(fp: string, normIds: string[]): boolean {
    if (syncedFingerprint.value !== fp) return false;
    return normIds.every((id) => id in bySongId.value);
  }

  /**
   * Alinea presencia de documentos con el listado actual.
   * Si ya hay caché completo para el mismo conjunto de IDs, no llama a la API salvo `force`.
   */
  async function ensureSynced(rawIds: string[], opts?: { force?: boolean }) {
    const normIds = [...new Set(rawIds.map((id) => normalizeSongId(id)))];
    const fp = fingerprintForSongIds(rawIds);

    if (normIds.length === 0) {
      bySongId.value = {};
      syncedFingerprint.value = '__empty__';
      return;
    }

    if (!opts?.force && hasFullCacheFor(fp, normIds)) {
      return;
    }

    try {
      const data = await DocumentsService.getDocumentPresenceBySongIds(rawIds);
      bySongId.value = { ...bySongId.value, ...data };
      for (const id of normIds) {
        if (!bySongId.value[id]) {
          bySongId.value[id] = emptyPresence();
        }
      }
      syncedFingerprint.value = fp;
    } catch (err) {
      console.error('Error syncing document presence:', err);
    }
  }

  function patchSong(rawId: string, partial: Partial<SongDocumentPresence>) {
    const id = normalizeSongId(rawId);
    const cur = bySongId.value[id] ?? emptyPresence();
    bySongId.value = { ...bySongId.value, [id]: { ...cur, ...partial } };
  }

  function removeSong(rawId: string) {
    const id = normalizeSongId(rawId);
    const { [id]: _removed, ...rest } = bySongId.value;
    bySongId.value = rest;
    syncedFingerprint.value = null;
  }

  function invalidateAll() {
    bySongId.value = {};
    syncedFingerprint.value = null;
  }

  return {
    bySongId,
    syncedFingerprint,
    ensureSynced,
    patchSong,
    removeSong,
    invalidateAll
  };
});
