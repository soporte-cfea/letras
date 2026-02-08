/**
 * Wrapper unificado para localStorage y sessionStorage
 * Proporciona tipado fuerte, validación y manejo de errores
 */

import { StorageKeys } from "./keys";
import type {
  ThemePreference,
  CancionesViewPreferences,
  SongTableColumnWidths,
  CancionesViewSessionState,
  CollectionFieldConfig,
} from "./types";

type StorageType = "localStorage" | "sessionStorage";

/**
 * Obtiene el objeto de almacenamiento según el tipo
 */
function getStorage(type: StorageType): Storage {
  if (typeof window === "undefined") {
    throw new Error("Storage is not available in this environment");
  }

  return type === "localStorage" ? window.localStorage : window.sessionStorage;
}

/**
 * Verifica si el almacenamiento está disponible
 */
function isStorageAvailable(type: StorageType): boolean {
  if (typeof window === "undefined") return false;

  try {
    const storage = getStorage(type);
    const testKey = "__storage_test__";
    storage.setItem(testKey, "test");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clase base para operaciones de almacenamiento
 */
class StorageWrapper<T> {
  constructor(
    private key: string,
    private storageType: StorageType,
    private validator?: (value: unknown) => value is T,
    private defaultValue?: T
  ) {}

  /**
   * Obtiene el valor del almacenamiento
   */
  get(): T | null {
    if (!isStorageAvailable(this.storageType)) {
      return this.defaultValue ?? null;
    }

    try {
      const storage = getStorage(this.storageType);
      const item = storage.getItem(this.key);

      if (item === null) {
        return this.defaultValue ?? null;
      }

      const parsed = JSON.parse(item);

      // Validar si hay un validador
      if (this.validator && !this.validator(parsed)) {
        console.warn(
          `Invalid data for key "${this.key}", returning default or null`
        );
        return this.defaultValue ?? null;
      }

      return parsed as T;
    } catch (error) {
      console.error(
        `Error reading from ${this.storageType} key "${this.key}":`,
        error
      );
      return this.defaultValue ?? null;
    }
  }

  /**
   * Guarda el valor en el almacenamiento
   */
  set(value: T): boolean {
    if (!isStorageAvailable(this.storageType)) {
      console.warn(`Storage not available for key "${this.key}"`);
      return false;
    }

    try {
      const storage = getStorage(this.storageType);
      storage.setItem(this.key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(
        `Error writing to ${this.storageType} key "${this.key}":`,
        error
      );
      return false;
    }
  }

  /**
   * Elimina el valor del almacenamiento
   */
  remove(): boolean {
    if (!isStorageAvailable(this.storageType)) {
      return false;
    }

    try {
      const storage = getStorage(this.storageType);
      storage.removeItem(this.key);
      return true;
    } catch (error) {
      console.error(
        `Error removing ${this.storageType} key "${this.key}":`,
        error
      );
      return false;
    }
  }

  /**
   * Verifica si existe el valor en el almacenamiento
   */
  has(): boolean {
    if (!isStorageAvailable(this.storageType)) {
      return false;
    }

    try {
      const storage = getStorage(this.storageType);
      return storage.getItem(this.key) !== null;
    } catch {
      return false;
    }
  }
}

// ==================== VALIDADORES ====================

function isValidTheme(value: unknown): value is ThemePreference {
  return typeof value === "string" && ["light", "dark", "auto"].includes(value);
}

function isValidCancionesViewPreferences(
  value: unknown
): value is CancionesViewPreferences {
  if (!value || typeof value !== "object") return false;
  const pref = value as any;
  return (
    typeof pref.currentView === "string" &&
    ["cards", "table"].includes(pref.currentView) &&
    Array.isArray(pref.visibleColumns) &&
    pref.visibleColumns.every((col: unknown) => typeof col === "string")
  );
}

function isValidSongTableColumnWidths(
  value: unknown
): value is SongTableColumnWidths {
  if (!value || typeof value !== "object") return false;
  return Object.values(value).every((v) => typeof v === "number");
}

function isValidCancionesViewSessionState(
  value: unknown
): value is CancionesViewSessionState {
  if (!value || typeof value !== "object") return false;
  const state = value as any;
  return (
    typeof state.searchQuery === "string" &&
    Array.isArray(state.selectedArtists) &&
    state.selectedArtists.every((a: unknown) => typeof a === "string") &&
    Array.isArray(state.selectedTags) &&
    state.selectedTags.every((t: unknown) => typeof t === "string") &&
    typeof state.artistFilterMode === "string" &&
    ["and", "or"].includes(state.artistFilterMode) &&
    typeof state.tagFilterMode === "string" &&
    ["and", "or"].includes(state.tagFilterMode)
  );
}

function isValidCollectionFieldConfig(
  value: unknown
): value is CollectionFieldConfig {
  if (!value || typeof value !== "object") return false;
  return Object.values(value).every((v) => typeof v === "boolean");
}

// ==================== INSTANCIAS TIPADAS ====================

/**
 * Tema preferido
 */
export const themeStorage = new StorageWrapper<ThemePreference>(
  StorageKeys.THEME_PREFERENCE,
  "localStorage",
  isValidTheme,
  "auto"
);

/**
 * Timestamp de última actualización de canciones
 */
export const lastSongsUpdateStorage = new StorageWrapper<string>(
  StorageKeys.LAST_SONGS_UPDATE,
  "localStorage"
);

/**
 * Timestamp de última actualización de colecciones
 */
export const lastCollectionsUpdateStorage = new StorageWrapper<string>(
  StorageKeys.LAST_COLLECTIONS_UPDATE,
  "localStorage"
);

/**
 * Timestamp de notificación de actualización descartada
 */
export const updateNotificationDismissedStorage = new StorageWrapper<string>(
  StorageKeys.UPDATE_NOTIFICATION_DISMISSED,
  "localStorage"
);

/**
 * Preferencias de la vista de canciones
 */
export const cancionesViewPreferencesStorage =
  new StorageWrapper<CancionesViewPreferences>(
    StorageKeys.CANCIONES_VIEW_PREFERENCES,
    "localStorage",
    isValidCancionesViewPreferences
  );

/**
 * Anchos de columnas de la tabla de canciones
 */
export const songTableColumnWidthsStorage =
  new StorageWrapper<SongTableColumnWidths>(
    StorageKeys.SONG_TABLE_COLUMN_WIDTHS,
    "localStorage",
    isValidSongTableColumnWidths
  );

/**
 * Estado de sesión de la vista de canciones (filtros temporales)
 */
export const cancionesViewSessionStateStorage =
  new StorageWrapper<CancionesViewSessionState>(
    StorageKeys.CANCIONES_VIEW_SESSION_STATE,
    "sessionStorage",
    isValidCancionesViewSessionState
  );

/**
 * Configuración de campos de la vista de colección detalle
 */
export const collectionFieldConfigStorage =
  new StorageWrapper<CollectionFieldConfig>(
    StorageKeys.COLLECTION_FIELD_CONFIG,
    "localStorage",
    isValidCollectionFieldConfig
  );

// ==================== UTILIDADES ====================

/**
 * Limpia todas las claves de almacenamiento relacionadas con la app
 */
export function clearAppStorage(
  prefixes: string[] = ["letras-", "app-"]
): void {
  if (typeof window === "undefined") return;

  const storages: StorageType[] = ["localStorage", "sessionStorage"];

  storages.forEach((storageType) => {
    if (!isStorageAvailable(storageType)) return;

    try {
      const storage = getStorage(storageType);
      const keysToRemove: string[] = [];

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => storage.removeItem(key));
    } catch (error) {
      console.error(`Error clearing ${storageType} with prefixes:`, error);
    }
  });
}

/**
 * Limpia todas las claves conocidas de la app
 */
export function clearAllKnownStorage(): void {
  const allKeys = Object.values(StorageKeys);

  (["localStorage", "sessionStorage"] as StorageType[]).forEach(
    (storageType) => {
      if (!isStorageAvailable(storageType)) return;

      try {
        const storage = getStorage(storageType);
        allKeys.forEach((key) => {
          try {
            storage.removeItem(key);
          } catch (error) {
            console.error(
              `Error removing key "${key}" from ${storageType}:`,
              error
            );
          }
        });
      } catch (error) {
        console.error(`Error clearing ${storageType}:`, error);
      }
    }
  );
}
