-- Migración para agregar control de visibilidad de secciones por colección
-- Permite habilitar/deshabilitar secciones específicas para cada lista

-- Agregar columna enabled a collection_sections
ALTER TABLE collection_sections 
ADD COLUMN enabled BOOLEAN DEFAULT true;

-- Crear índice para optimizar consultas de secciones habilitadas
CREATE INDEX IF NOT EXISTS idx_collection_sections_enabled 
ON collection_sections (collection_id, enabled);

-- Comentario explicativo
COMMENT ON COLUMN collection_sections.enabled IS 'Controla si la sección está visible en la colección (true = visible, false = oculta)';
