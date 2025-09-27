export interface SongResource {
    id?: string
    type: 'spotify' | 'youtube' | 'facebook' | 'instagram' | 'apple-music' | 'image' | 'video' | 'audio' | 'other'
    url: string
  }

// Nuevos tipos para el sistema de tags híbrido
export interface Tag {
  id: string
  name: string
  created_at?: string
}

export interface TagType {
  id: string
  name: 'public' | 'private'
  description?: string
  is_visible_to_others: boolean
  created_at?: string
}

export interface UserSongTag {
  id: string
  user_id?: string
  song_id: string
  tag_id: string
  tag_type_id: string
  created_at?: string
  updated_at?: string
  // Relaciones
  tag?: Tag
  tag_type?: TagType
}

export interface Cancion {
    id: string
    title: string
    artist: string
    subtitle?: string
    tempo?: string
    bpm?: number
    tags: string[] // Mantener para compatibilidad temporal
    user_tags?: UserSongTag[] // Nueva estructura de tags
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
    name: string
    description?: string
    type: 'playlist' | 'album' | 'favorites' | 'custom'
    user_id?: string
    created_at?: string
    updated_at?: string
    songCount?: number
  }

export interface CollectionSong {
    id: string
    collection_id: string
    song_id: number  // Cambiado a number para coincidir con bigint
    order_index: number
    added_at?: string
  }