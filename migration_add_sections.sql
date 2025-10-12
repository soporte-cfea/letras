-- Migración para agregar secciones a las colecciones
-- Permite organizar las canciones en secciones como: Introducción, Alabanza, Adoración, etc.

-- Crear tabla para secciones de colección
CREATE TABLE collection_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  order_index INTEGER NOT NULL,
  color VARCHAR(7) DEFAULT '#3b82f6',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agregar columna section_id a collection_songs
ALTER TABLE collection_songs 
ADD COLUMN section_id UUID REFERENCES collection_sections(id) ON DELETE SET NULL;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_collection_sections_collection_id 
ON collection_sections (collection_id);

CREATE INDEX IF NOT EXISTS idx_collection_sections_order 
ON collection_sections (collection_id, order_index);

CREATE INDEX IF NOT EXISTS idx_collection_songs_section_id 
ON collection_songs (section_id);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_collection_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collection_sections_updated_at
  BEFORE UPDATE ON collection_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_sections_updated_at();

-- Comentarios explicativos
COMMENT ON TABLE collection_sections IS 'Secciones para organizar canciones dentro de una colección (ej: Introducción, Alabanza, Adoración)';
COMMENT ON COLUMN collection_sections.name IS 'Nombre de la sección (ej: "Introducción", "Alabanza")';
COMMENT ON COLUMN collection_sections.description IS 'Descripción opcional de la sección';
COMMENT ON COLUMN collection_sections.order_index IS 'Orden de aparición de la sección en la lista';
COMMENT ON COLUMN collection_sections.color IS 'Color hexadecimal para identificar visualmente la sección';
COMMENT ON COLUMN collection_songs.section_id IS 'ID de la sección a la que pertenece esta canción';
