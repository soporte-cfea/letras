-- ============================================================================
-- MIGRACIÓN: Hacer la columna 'type' nullable y eventualmente eliminarla
-- Fecha: 2024
-- Descripción:
--   - Hace la columna 'type' nullable para permitir nuevas inserciones
--   - La columna 'type' ya no se usa, se reemplazó por 'category'
--   - Esta migración permite que el código funcione sin enviar 'type'
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: Hacer la columna 'type' nullable
-- ============================================================================

-- Primero, asegurarnos de que todas las filas existentes tengan un valor
-- (aunque ya deberían tenerlo, pero por seguridad)
UPDATE collections
SET type = 'custom'
WHERE type IS NULL;

-- Ahora hacer la columna nullable
ALTER TABLE collections
ALTER COLUMN type DROP NOT NULL;

-- ============================================================================
-- PASO 2: (Opcional) Eliminar constraint CHECK de 'type' si existe
-- ============================================================================

-- Eliminar el constraint CHECK si existe (no es necesario mantenerlo)
ALTER TABLE collections
DROP CONSTRAINT IF EXISTS collections_type_check;

-- ============================================================================
-- PASO 3: Comentario para documentación
-- ============================================================================

COMMENT ON COLUMN collections.type IS 'DEPRECATED: Esta columna ya no se usa. Se reemplazó por "category". Se mantiene temporalmente para compatibilidad. Se puede eliminar después de verificar que todo funciona.';

-- ============================================================================
-- VERIFICACIÓN: Mostrar resumen
-- ============================================================================

DO $$
DECLARE
  total_count INTEGER;
  null_type_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM collections;
  SELECT COUNT(*) INTO null_type_count FROM collections WHERE type IS NULL;
  
  RAISE NOTICE '✓ Migración exitosa:';
  RAISE NOTICE '  - Total de colecciones: %', total_count;
  RAISE NOTICE '  - Colecciones con type NULL: %', null_type_count;
  RAISE NOTICE '  - La columna type ahora permite NULL';
END $$;

COMMIT;

-- ============================================================================
-- NOTAS POST-MIGRACIÓN:
-- ============================================================================
--
-- 1. Ahora puedes crear colecciones sin enviar el campo 'type'
-- 2. La columna 'type' se mantiene en la base de datos pero no se usa
-- 3. Después de verificar que todo funciona, puedes eliminar 'type' completamente:
--
--    BEGIN;
--    ALTER TABLE collections DROP COLUMN IF EXISTS type;
--    COMMIT;
--
-- ============================================================================

