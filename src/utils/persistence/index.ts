/**
 * Sistema de persistencia unificado
 *
 * Este módulo centraliza todas las operaciones de persistencia
 * (localStorage, sessionStorage) con tipado fuerte y validación.
 *
 * Para IndexedDB (caché de datos grandes), ver: src/utils/cache.ts
 */

// Exportar claves
export { StorageKeys, StoragePrefixes, type StorageKey } from "./keys";

// Exportar tipos
export type {
  ThemePreference,
  UpdateTimestamps,
  CancionesViewPreferences,
  SongTableColumnWidths,
  CancionesViewSessionState,
  CollectionFieldConfig,
} from "./types";

// Exportar instancias de almacenamiento
export {
  themeStorage,
  lastSongsUpdateStorage,
  lastCollectionsUpdateStorage,
  updateNotificationDismissedStorage,
  cancionesViewPreferencesStorage,
  songTableColumnWidthsStorage,
  cancionesViewSessionStateStorage,
  collectionFieldConfigStorage,
  clearAppStorage,
  clearAllKnownStorage,
} from "./storage";
