import { ref, onUnmounted } from 'vue'
import { SongsService } from '@/api/songs'
import {
  getCachedDocumentsMaxUpdatedAt,
  normalizeSongId
} from '@/utils/cache'
import type { Cancion } from '@/types/songTypes'

export type SongContentStamp = {
  songUpdatedAt: string | null
  docsUpdatedAt: string | null
}

const STAMP_PREFIX = 'letras:songContentStamp:'
const DISMISS_PREFIX = 'letras:songContentDismiss:'

function readStamp(songId: string): SongContentStamp | null {
  try {
    const raw = localStorage.getItem(STAMP_PREFIX + normalizeSongId(songId))
    if (!raw) return null
    return JSON.parse(raw) as SongContentStamp
  } catch {
    return null
  }
}

function writeStamp(songId: string, stamp: SongContentStamp) {
  try {
    localStorage.setItem(STAMP_PREFIX + normalizeSongId(songId), JSON.stringify(stamp))
  } catch {
    // ignore quota
  }
}

function readDismissed(songId: string): SongContentStamp | null {
  try {
    const raw = localStorage.getItem(DISMISS_PREFIX + normalizeSongId(songId))
    if (!raw) return null
    return JSON.parse(raw) as SongContentStamp
  } catch {
    return null
  }
}

function writeDismissed(songId: string, stamp: SongContentStamp) {
  try {
    localStorage.setItem(DISMISS_PREFIX + normalizeSongId(songId), JSON.stringify(stamp))
  } catch {
    // ignore
  }
}

function clearDismissed(songId: string) {
  try {
    localStorage.removeItem(DISMISS_PREFIX + normalizeSongId(songId))
  } catch {
    // ignore
  }
}

function isStampNewer(server: SongContentStamp, local: SongContentStamp): boolean {
  if (
    server.songUpdatedAt &&
    local.songUpdatedAt &&
    server.songUpdatedAt > local.songUpdatedAt
  ) {
    return true
  }
  if (
    server.docsUpdatedAt &&
    local.docsUpdatedAt &&
    server.docsUpdatedAt > local.docsUpdatedAt
  ) {
    return true
  }
  // Pasó de “sin docs en local” a “hay docs en servidor” (p. ej. se agregaron acordes)
  if (server.docsUpdatedAt && !local.docsUpdatedAt) {
    return true
  }
  if (server.songUpdatedAt && !local.songUpdatedAt) return true
  return false
}

function sameStamp(a: SongContentStamp, b: SongContentStamp): boolean {
  return a.songUpdatedAt === b.songUpdatedAt && a.docsUpdatedAt === b.docsUpdatedAt
}

/**
 * Detecta si el servidor tiene una versión más nueva de la canción (metadata + docs)
 * y expone estado para una nota inline: actualizar o quedarse con la copia local.
 */
export function useSongContentFreshness() {
  const updateAvailable = ref(false)
  const checking = ref(false)
  const applying = ref(false)
  const applyError = ref<string | null>(null)
  const serverStamp = ref<SongContentStamp | null>(null)

  let currentSongId: string | null = null
  let checkSeq = 0

  async function buildLocalStamp(song: Cancion | null, songId: string): Promise<SongContentStamp> {
    const stored = readStamp(songId)
    const docsFromCache = await getCachedDocumentsMaxUpdatedAt(songId)
    return {
      songUpdatedAt: stored?.songUpdatedAt ?? song?.update_at ?? null,
      docsUpdatedAt: stored?.docsUpdatedAt ?? docsFromCache
    }
  }

  async function check(songId: string, song: Cancion | null) {
    const id = normalizeSongId(songId)
    currentSongId = id
    const seq = ++checkSeq

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      updateAvailable.value = false
      applyError.value = null
      return
    }

    checking.value = true
    applyError.value = null
    try {
      const server = await SongsService.getSongContentStamp(id)
      if (seq !== checkSeq || currentSongId !== id) return

      serverStamp.value = server
      const local = await buildLocalStamp(song, id)

      // Primera vez sin baseline en localStorage
      const stored = readStamp(id)
      if (!stored) {
        const songLooksStale =
          !!server.songUpdatedAt &&
          !!song?.update_at &&
          server.songUpdatedAt > song.update_at
        const docsLookStale =
          !!server.docsUpdatedAt &&
          !!local.docsUpdatedAt &&
          server.docsUpdatedAt > local.docsUpdatedAt
        // Había docs en servidor y local no tiene stamp de docs (caché viejo / sin acordes)
        const serverHasDocsLocalDoesNot =
          !!server.docsUpdatedAt && !local.docsUpdatedAt

        if (songLooksStale || docsLookStale || serverHasDocsLocalDoesNot) {
          const dismissed = readDismissed(id)
          if (dismissed && sameStamp(dismissed, server)) {
            updateAvailable.value = false
            writeStamp(id, local)
          } else {
            updateAvailable.value = true
          }
        } else {
          writeStamp(id, server)
          updateAvailable.value = false
        }
        return
      }

      if (isStampNewer(server, local)) {
        const dismissed = readDismissed(id)
        if (dismissed && sameStamp(dismissed, server)) {
          updateAvailable.value = false
        } else {
          updateAvailable.value = true
        }
      } else {
        writeStamp(id, server)
        updateAvailable.value = false
      }
    } catch (err) {
      console.warn('No se pudo verificar versión de la canción:', err)
      updateAvailable.value = false
    } finally {
      if (seq === checkSeq) checking.value = false
    }
  }

  /** Tras cargar desde red con éxito: alinear stamp local con el servidor. */
  async function markSynced(songId: string) {
    const id = normalizeSongId(songId)
    try {
      const server = await SongsService.getSongContentStamp(id)
      writeStamp(id, server)
      clearDismissed(id)
      serverStamp.value = server
      updateAvailable.value = false
      applyError.value = null
    } catch {
      // Si falla el stamp, al menos no seguir mostrando aviso
      updateAvailable.value = false
    }
  }

  function dismissKeepLocal(songId: string) {
    const id = normalizeSongId(songId)
    if (serverStamp.value) {
      writeDismissed(id, serverStamp.value)
    }
    updateAvailable.value = false
  }

  function handleVisibility() {
    if (document.hidden || !currentSongId) return
    // Re-chequeo al volver a la app (sin banner global)
    void check(currentSongId, null)
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibility)
  }

  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
    currentSongId = null
  })

  return {
    updateAvailable,
    checking,
    applying,
    applyError,
    serverStamp,
    check,
    markSynced,
    dismissKeepLocal
  }
}
