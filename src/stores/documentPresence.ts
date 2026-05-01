import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DocumentsService } from '@/api/songs';
import { normalizeSongId } from '@/utils/cache';
import type { SongDocumentPresence } from '@/types/songTypes';

function emptyPresence(): SongDocumentPresence {
  return { lyrics: false, chords: false, analysis: false };
}

export const useDocumentPresenceStore = defineStore('documentPresence', () => {
  const bySongId = ref<Record<string, SongDocumentPresence>>({});

  /**
   * Alinea presencia de documentos con los IDs pedidos.
   * Si ya hay entrada en caché para cada ID (p. ej. tras visitar Canciones), no llama a la API salvo `force`.
   */
  async function ensureSynced(rawIds: string[], opts?: { force?: boolean }) {
    const normIds = [...new Set(rawIds.map((id) => normalizeSongId(id)))];

    if (normIds.length === 0) {
      bySongId.value = {};
      return;
    }

    if (!opts?.force && normIds.every((id) => id in bySongId.value)) {
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
  }

  function invalidateAll() {
    bySongId.value = {};
  }

  return {
    bySongId,
    ensureSynced,
    patchSong,
    removeSong,
    invalidateAll
  };
});
