-- Migración para agregar la columna 'resources' a la tabla 'song'
-- Ejecutar este script en tu base de datos Supabase

-- Agregar la columna 'resources' como JSONB para almacenar un array de recursos
ALTER TABLE song 
ADD COLUMN resources JSONB DEFAULT '[]'::jsonb;

-- Crear un índice para mejorar el rendimiento de las consultas en la columna resources
CREATE INDEX idx_song_resources ON song USING GIN (resources);

-- Comentario para documentar la estructura de la columna
COMMENT ON COLUMN song.resources IS 'Array de recursos de la canción. Cada recurso tiene: type (spotify, youtube, facebook, etc.) y url';

-- Ejemplo de la estructura esperada:
-- [
--   {
--     "type": "spotify",
--     "url": "https://open.spotify.com/track/..."
--   },
--   {
--     "type": "youtube", 
--     "url": "https://youtube.com/watch?v=..."
--   }
-- ]

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'song' AND column_name = 'resources';
