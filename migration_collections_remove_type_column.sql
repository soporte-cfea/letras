-- ============================================================================
-- MIGRACIÓN: Eliminar completamente la columna 'type' (OPCIONAL - Ejecutar después)
-- Fecha: 2024
-- Descripción:
--   - Elimina la columna 'type' que ya no se usa
--   - Solo ejecutar después de verificar que todo funciona correctamente
--   - Esta migración es OPCIONAL y puede ejecutarse más adelante
-- ============================================================================
--
-- ⚠️ ADVERTENCIA: Solo ejecuta esta migración después de:
--   1. Ejecutar migration_collections_type_nullable.sql
--   2. Verificar que la aplicación funciona correctamente
--   3. Esperar al menos unos días para asegurar estabilidad
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: Eliminar índice de 'type' si existe
-- ============================================================================

DROP INDEX IF EXISTS idx_collections_type;

-- ============================================================================
-- PASO 2: Eliminar constraint de 'type' si existe
-- ============================================================================

ALTER TABLE collections
DROP CONSTRAINT IF EXISTS collections_type_check;

-- ============================================================================
-- PASO 3: Eliminar la columna 'type'
-- ============================================================================

ALTER TABLE collections
DROP COLUMN IF EXISTS type;

-- ============================================================================
-- VERIFICACIÓN: Confirmar eliminación
-- ============================================================================

DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'collections'
    AND column_name = 'type'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE EXCEPTION 'Error: La columna type aún existe. Revisa la migración.';
  ELSE
    RAISE NOTICE '✓ Columna type eliminada exitosamente';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- NOTAS:
-- ============================================================================
--
-- La columna 'type' ha sido completamente eliminada.
-- El código de la aplicación ya no debería hacer referencia a esta columna.
--
-- ============================================================================

