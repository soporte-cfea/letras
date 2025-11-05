-- ============================================================================
-- MIGRACIÓN: Hacer la columna 'name' nullable en la tabla collections
-- Fecha: 2024
-- Descripción:
--   - Permite que la columna 'name' acepte valores NULL
--   - Esto permite crear colecciones sin nombre (útil para listas semanales)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: Hacer la columna 'name' nullable
-- ============================================================================

ALTER TABLE collections
ALTER COLUMN name DROP NOT NULL;

-- ============================================================================
-- PASO 2: Actualizar filas existentes que puedan tener name vacío
-- ============================================================================

-- Si hay filas con name vacío o solo espacios, convertirlas a NULL
UPDATE collections
SET name = NULL
WHERE name IS NOT NULL AND TRIM(name) = '';

-- ============================================================================
-- PASO 3: Comentario para documentación
-- ============================================================================

COMMENT ON COLUMN collections.name IS 'Nombre de la colección (opcional). Para listas semanales puede quedar vacío ya que el título se genera automáticamente.';

-- ============================================================================
-- VERIFICACIÓN: Mostrar resumen
-- ============================================================================

DO $$
DECLARE
  total_count INTEGER;
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM collections;
  SELECT COUNT(*) INTO null_count FROM collections WHERE name IS NULL;
  
  RAISE NOTICE '✓ Migración exitosa:';
  RAISE NOTICE '  - Total de colecciones: %', total_count;
  RAISE NOTICE '  - Colecciones sin nombre: %', null_count;
END $$;

COMMIT;

-- ============================================================================
-- NOTAS POST-MIGRACIÓN:
-- ============================================================================
--
-- 1. Ahora las colecciones pueden crearse sin nombre
-- 2. El título se generará automáticamente según la categoría:
--    - Listas semanales: "Lista semanal - [Día] - [Fecha]"
--    - Eventos: "[Nombre] - [Fecha]" o solo "[Nombre]"
--    - Otros: "[Nombre]" o "Colección" si no hay nombre
--
-- ============================================================================

