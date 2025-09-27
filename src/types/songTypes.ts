export interface SongResource {
    id?: string
    type: 'spotify' | 'youtube' | 'facebook' | 'instagram' | 'apple-music' | 'image' | 'video' | 'audio' | 'other'
    url: string
    label?: string
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