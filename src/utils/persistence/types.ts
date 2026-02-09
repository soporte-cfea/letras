/**
 * Tipos para datos persistidos
 */

// Tema
export type ThemePreference = "light" | "dark" | "auto";

// Actualizaciones
export interface UpdateTimestamps {
  lastSongsUpdate: string | null;
  lastCollectionsUpdate: string | null;
  updateNotificationDismissed: string | null;
}

// Vista de Canciones - Preferencias
export interface CancionesViewPreferences {
  currentView: "cards" | "table";
  visibleColumns: string[];
}

// Vista de Canciones - Anchos de columnas
export interface SongTableColumnWidths {
  [key: string]: number;
}

// Vista de Canciones - Estado de sesión (filtros temporales)
export interface CancionesViewSessionState {
  searchQuery: string;
  selectedArtists: string[];
  selectedTags: string[];
  artistFilterMode: "and" | "or";
  tagFilterMode: "and" | "or";
}

// Vista de Colección Detalle - Configuración de campos
// Es un array de strings que representan los campos visibles
export type CollectionFieldConfig = string[];
