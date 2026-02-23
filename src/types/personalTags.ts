/**
 * Tipos para etiquetas personales de canciones
 */

export interface PersonalTag {
  id: string
  user_id: string
  song_id: string
  tag_name: string
  created_at: string
}

export interface PersonalTagInput {
  song_id: string
  tag_name: string
}

