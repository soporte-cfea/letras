-- Migración para agregar etiquetas específicas de lista y notas a las canciones
-- Estas etiquetas y notas son diferentes a las generales de la canción
-- y solo se muestran cuando la canción está en esa lista específica

-- Agregar columna para etiquetas de lista
ALTER TABLE collection_songs 
ADD COLUMN list_tags TEXT[] DEFAULT '{}';

-- Agregar columna para notas específicas de lista
ALTER TABLE collection_songs 
ADD COLUMN notes TEXT DEFAULT '';

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_collection_songs_list_tags 
ON collection_songs USING GIN (list_tags);

CREATE INDEX IF NOT EXISTS idx_collection_songs_notes 
ON collection_songs USING GIN (to_tsvector('spanish', notes));

-- Comentarios explicativos
COMMENT ON COLUMN collection_songs.list_tags IS 'Etiquetas específicas para esta canción en esta lista (ej: Entrada, Ofertorio, Comunión)';
COMMENT ON COLUMN collection_songs.notes IS 'Notas adicionales específicas para esta canción en esta lista (ej: instrucciones, comentarios, recordatorios)';
