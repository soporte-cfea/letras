/**
 * Claves centralizadas para persistencia
 * Todas las claves de localStorage y sessionStorage deben estar aquí
 */

export const StorageKeys = {
  // Tema
  THEME_PREFERENCE: "theme-preference",

  // Actualizaciones
  LAST_SONGS_UPDATE: "lastSongsUpdate",
  LAST_COLLECTIONS_UPDATE: "lastCollectionsUpdate",
  UPDATE_NOTIFICATION_DISMISSED: "updateNotificationDismissed",

  // Vista de Canciones
  CANCIONES_VIEW_PREFERENCES: "canciones-view-preferences",
  SONG_TABLE_COLUMN_WIDTHS: "song-table-column-widths",

  // Vista de Colección Detalle
  COLLECTION_FIELD_CONFIG: "collection-field-config",
  COLLECTION_READONLY_COLUMN_WIDTHS: "collection-readonly-column-widths",
  COLLECTION_READONLY_SHOW_TITLE_BELOW_HEADER: "collection-readonly-show-title-below-header",

  // Vista compartida (lista)
  SHARED_LIST_VIEW_MODE: "shared-list-view-mode",

  /** Animar contadores (canciones/artistas) en la pantalla de Inicio */
  HOME_ANIMATE_STATS: "home-animate-stats",

  /** Qué bloques mostrar en Inicio (widgets + próximas listas) */
  HOME_WIDGET_PREFERENCES: "home-widget-preferences",

  // Session Storage
  CANCIONES_VIEW_SESSION_STATE: "canciones-view-session-state",
} as const;

/**
 * Prefijos para limpieza masiva de datos
 */
export const StoragePrefixes = {
  LETRAS: "letras-",
  APP: "app-",
} as const;

/**
 * Tipo para todas las claves de almacenamiento
 */
export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
