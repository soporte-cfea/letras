export interface Cancion {
    id: string
    title: string
    artist: string
    subtitle?: string
    tempo?: string
    bpm?: number
    tags: string[]
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