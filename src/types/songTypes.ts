export interface SongResource {
    id?: string
    type: 'spotify' | 'youtube' | 'facebook' | 'instagram' | 'apple-music' | 'image' | 'video' | 'audio' | 'other'
    url: string
    label?: string
    iframe?: string // Para guardar el iframe de Spotify
  }

export interface Cancion {
    id: string
    title: string
    artist: string
    subtitle?: string
    tempo?: string
    bpm?: number
    tags: string[]
    resources?: SongResource[]
    created_at?: string
    update_at?: string
  }

export interface Document {
    id: string
    song_id: string
    body: string
    doc_type: string
    description?: string
    created_at?: string
    update_at?: string
  }

export interface Collection {
    id: string
    name?: string
    description?: string
    category: 'lista semanal' | 'evento' | 'otro'
    event_date?: string  // ISO 8601 date string, solo para listas semanales y eventos
    user_id?: string
    created_at?: string
    updated_at?: string
    songCount?: number
    metadata?: Record<string, any>  // Para datos extensibles futuros
  }

// Tipo para día de la semana (calculado, no almacenado)
export type DayOfWeek = 'domingo' | 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado'

export interface CollectionSong {
    id: string
    collection_id: string
    song_id: number  // Cambiado a number para coincidir con bigint
    order_index: number
    added_at?: string
    list_tags?: string[]  // Etiquetas específicas para esta canción en esta lista
    notes?: string  // Notas adicionales específicas para esta canción en esta lista
  }

// Interfaz para canciones en una colección que incluye etiquetas de lista y notas
export interface CancionEnLista extends Cancion {
    list_tags?: string[]  // Etiquetas específicas para esta canción en esta lista
    notes?: string  // Notas adicionales específicas para esta canción en esta lista
    collection_song_id?: string  // ID de la relación collection_songs
    section_id?: string  // ID de la sección a la que pertenece
    order_index?: number  // Índice de orden en la lista
}

// Interfaz para secciones de colección
export interface CollectionSection {
    id: string
    collection_id: string
    name: string
    description?: string
    order_index: number
    color: string
    enabled: boolean
    created_at?: string
    updated_at?: string
}