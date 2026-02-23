-- Crear tabla para etiquetas personales de canciones
-- Esta tabla permite que cada usuario agregue sus propias etiquetas a las canciones

CREATE TABLE IF NOT EXISTS user_song_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar etiquetas duplicadas para el mismo usuario y canción
  UNIQUE(user_id, song_id, tag_name)
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_user_song_tags_user_id ON user_song_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_song_tags_song_id ON user_song_tags(song_id);
CREATE INDEX IF NOT EXISTS idx_user_song_tags_user_song ON user_song_tags(user_id, song_id);

-- Política RLS: Los usuarios solo pueden ver sus propias etiquetas
ALTER TABLE user_song_tags ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Los usuarios solo pueden ver sus propias etiquetas
CREATE POLICY "Users can view their own personal tags"
  ON user_song_tags
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para INSERT: Los usuarios solo pueden crear etiquetas para sí mismos
CREATE POLICY "Users can insert their own personal tags"
  ON user_song_tags
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para DELETE: Los usuarios solo pueden eliminar sus propias etiquetas
CREATE POLICY "Users can delete their own personal tags"
  ON user_song_tags
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE user_song_tags IS 'Etiquetas personales que los usuarios pueden agregar a las canciones. Solo visibles para el usuario que las creó.';
COMMENT ON COLUMN user_song_tags.user_id IS 'ID del usuario que creó la etiqueta';
COMMENT ON COLUMN user_song_tags.song_id IS 'ID de la canción a la que pertenece la etiqueta';
COMMENT ON COLUMN user_song_tags.tag_name IS 'Nombre de la etiqueta personal';

