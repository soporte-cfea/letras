-- Crear tabla de colecciones
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('playlist', 'album', 'favorites', 'custom')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de relación colección-canción
CREATE TABLE IF NOT EXISTS collection_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  song_id BIGINT NOT NULL REFERENCES song(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, song_id)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_type ON collections(type);
CREATE INDEX IF NOT EXISTS idx_collection_songs_collection_id ON collection_songs(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_songs_song_id ON collection_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_collection_songs_order ON collection_songs(collection_id, order_index);

-- Habilitar RLS (Row Level Security)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_songs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para colecciones
CREATE POLICY "Users can view their own collections" ON collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para collection_songs
CREATE POLICY "Users can view collection songs for their collections" ON collection_songs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = collection_songs.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add songs to their collections" ON collection_songs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = collection_songs.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update songs in their collections" ON collection_songs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = collection_songs.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove songs from their collections" ON collection_songs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = collection_songs.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en colecciones
CREATE TRIGGER update_collections_updated_at 
  BEFORE UPDATE ON collections 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Función para obtener estadísticas de una colección
CREATE OR REPLACE FUNCTION get_collection_stats(collection_uuid UUID)
RETURNS TABLE(song_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT as song_count
  FROM collection_songs
  WHERE collection_id = collection_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para reordenar canciones en una colección
CREATE OR REPLACE FUNCTION reorder_collection_songs(
  collection_uuid UUID,
  song_orders JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  song_order JSONB;
BEGIN
  -- Verificar que el usuario es propietario de la colección
  IF NOT EXISTS (
    SELECT 1 FROM collections 
    WHERE id = collection_uuid AND user_id = auth.uid()
  ) THEN
    RETURN FALSE;
  END IF;

  -- Actualizar el orden de cada canción
  FOR song_order IN SELECT * FROM jsonb_array_elements(song_orders)
  LOOP
    UPDATE collection_songs
    SET order_index = (song_order->>'orderIndex')::INTEGER
    WHERE collection_id = collection_uuid 
    AND song_id = (song_order->>'songId')::BIGINT;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
