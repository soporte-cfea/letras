-- ============================================================================
-- MIGRACIÓN: Actualizar tabla collections de 'type' a 'category'
-- Fecha: 2024
-- Descripción: 
--   - Agrega columna 'category' con valores: 'lista semanal', 'evento', 'otro'
--   - Agrega columna 'event_date' para fechas de eventos/listas semanales
--   - Agrega columna 'metadata' (JSONB) para datos extensibles
--   - Migra datos existentes de 'type' a 'category'
--   - Actualiza índices y constraints
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: Agregar nuevas columnas
-- ============================================================================

-- Agregar columna 'category' (temporalmente nullable para permitir migración)
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) CHECK (category IN ('lista semanal', 'evento', 'otro'));

-- Agregar columna 'event_date' para fechas de eventos/listas semanales
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS event_date DATE;

-- Agregar columna 'metadata' para datos extensibles (JSONB)
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- PASO 2: Migrar datos existentes de 'type' a 'category'
-- ============================================================================

-- Mapear valores antiguos a nuevos valores de categoría
UPDATE collections 
SET category = CASE 
  WHEN type = 'playlist' THEN 'lista semanal'
  WHEN type = 'custom' THEN 'lista semanal'
  WHEN type = 'album' THEN 'otro'
  WHEN type = 'favorites' THEN 'otro'
  ELSE 'otro'  -- Valor por defecto para cualquier otro tipo inesperado
END
WHERE category IS NULL;

-- Asegurar que todas las filas tengan un valor de category
UPDATE collections 
SET category = 'otro' 
WHERE category IS NULL;

-- ============================================================================
-- PASO 3: Hacer 'category' NOT NULL (ahora que todas las filas tienen valor)
-- ============================================================================

ALTER TABLE collections 
ALTER COLUMN category SET NOT NULL;

-- ============================================================================
-- PASO 4: Actualizar índices
-- ============================================================================

-- Eliminar índice antiguo de 'type' si existe
DROP INDEX IF EXISTS idx_collections_type;

-- Crear nuevo índice para 'category'
CREATE INDEX IF NOT EXISTS idx_collections_category ON collections(category);

-- Crear índice para 'event_date' (útil para filtros por fecha)
CREATE INDEX IF NOT EXISTS idx_collections_event_date ON collections(event_date);

-- Crear índice compuesto para filtros comunes (category + event_date)
CREATE INDEX IF NOT EXISTS idx_collections_category_event_date 
ON collections(category, event_date) 
WHERE event_date IS NOT NULL;

-- ============================================================================
-- PASO 5: Actualizar constraint CHECK de 'type' (opcional - mantenerlo temporalmente)
-- ============================================================================

-- Opción 1: Mantener el constraint de 'type' por ahora (para compatibilidad)
-- No hacemos nada aquí, el constraint existente se mantiene

-- Opción 2: Si quieres eliminar el constraint de 'type' completamente:
-- ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_type_check;

-- ============================================================================
-- PASO 6: Comentarios para documentación
-- ============================================================================

COMMENT ON COLUMN collections.category IS 'Categoría de la colección: lista semanal, evento, o otro';
COMMENT ON COLUMN collections.event_date IS 'Fecha del evento o lista semanal (ISO 8601)';
COMMENT ON COLUMN collections.metadata IS 'Datos extensibles en formato JSON para características futuras';

-- ============================================================================
-- VERIFICACIÓN: Mostrar resumen de migración
-- ============================================================================

-- Verificar que todas las colecciones tienen category
DO $$
DECLARE
  null_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM collections WHERE category IS NULL;
  SELECT COUNT(*) INTO total_count FROM collections;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Error: % colecciones aún tienen category NULL de % totales', null_count, total_count;
  ELSE
    RAISE NOTICE '✓ Migración exitosa: Todas las % colecciones tienen category asignada', total_count;
  END IF;
END $$;

-- Mostrar distribución de categorías
DO $$
DECLARE
  lista_semanal_count INTEGER;
  evento_count INTEGER;
  otro_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO lista_semanal_count FROM collections WHERE category = 'lista semanal';
  SELECT COUNT(*) INTO evento_count FROM collections WHERE category = 'evento';
  SELECT COUNT(*) INTO otro_count FROM collections WHERE category = 'otro';
  
  RAISE NOTICE 'Distribución de categorías:';
  RAISE NOTICE '  - Lista semanal: %', lista_semanal_count;
  RAISE NOTICE '  - Evento: %', evento_count;
  RAISE NOTICE '  - Otro: %', otro_count;
END $$;

COMMIT;

-- ============================================================================
-- NOTAS POST-MIGRACIÓN:
-- ============================================================================
-- 
-- 1. La columna 'type' se mantiene temporalmente para compatibilidad
--    Puedes eliminarla después de verificar que todo funciona correctamente:
--    ALTER TABLE collections DROP COLUMN type;
--
-- 2. Si necesitas revertir la migración (no recomendado):
--    BEGIN;
--    ALTER TABLE collections DROP COLUMN category;
--    ALTER TABLE collections DROP COLUMN event_date;
--    ALTER TABLE collections DROP COLUMN metadata;
--    DROP INDEX IF EXISTS idx_collections_category;
--    DROP INDEX IF EXISTS idx_collections_event_date;
--    DROP INDEX IF EXISTS idx_collections_category_event_date;
--    CREATE INDEX IF NOT EXISTS idx_collections_type ON collections(type);
--    COMMIT;
--
-- 3. Actualiza el código de la aplicación para usar 'category' en lugar de 'type'
--    y elimina la lógica de normalización temporal en src/api/collections.ts
--
-- ============================================================================

