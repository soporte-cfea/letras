# Migración: Collections - De 'type' a 'category'

## Resumen

Esta migración actualiza la tabla `collections` para usar el nuevo sistema de categorías:
- **Antes**: Campo `type` con valores: `'playlist'`, `'album'`, `'favorites'`, `'custom'`
- **Después**: Campo `category` con valores: `'lista semanal'`, `'evento'`, `'otro'`

Además, agrega:
- Campo `event_date` (DATE) para fechas de eventos/listas semanales
- Campo `metadata` (JSONB) para datos extensibles futuros

## Mapeo de Valores

Los valores antiguos se mapean automáticamente a los nuevos:

| Tipo Antiguo | Categoría Nueva |
|-------------|-----------------|
| `playlist`  | `lista semanal` |
| `custom`    | `lista semanal` |
| `album`     | `otro`         |
| `favorites`  | `otro`         |

## Pasos para Ejecutar la Migración

### 1. Hacer Backup de la Base de Datos

⚠️ **IMPORTANTE**: Antes de ejecutar cualquier migración, haz un backup completo de tu base de datos.

En Supabase:
1. Ve a tu proyecto
2. Settings → Database → Backups
3. Crea un backup manual o verifica que los backups automáticos estén activos

### 2. Ejecutar el Script de Migración

#### Opción A: Desde el SQL Editor de Supabase

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Copia el contenido completo del archivo `migration_collections_category_event_date.sql`
4. Pega y ejecuta el script
5. Verifica que no haya errores

#### Opción B: Desde la línea de comandos (si tienes acceso)

```bash
# Conectarte a tu base de datos PostgreSQL
psql -h <host> -U <user> -d <database> -f migration_collections_category_event_date.sql
```

### 3. Verificar la Migración

El script incluye verificaciones automáticas que mostrarán:
- ✓ Confirmación de que todas las colecciones tienen `category` asignada
- Distribución de categorías (cuántas de cada tipo)

Puedes verificar manualmente ejecutando:

```sql
-- Verificar que todas las colecciones tienen category
SELECT COUNT(*) as total, 
       COUNT(category) as con_category,
       COUNT(CASE WHEN category IS NULL THEN 1 END) as sin_category
FROM collections;

-- Ver distribución de categorías
SELECT category, COUNT(*) as cantidad
FROM collections
GROUP BY category
ORDER BY cantidad DESC;
```

### 4. Actualizar el Código de la Aplicación

El código ya ha sido actualizado para usar `category` en lugar de `type`. Los cambios incluyen:

- ✅ `src/types/songTypes.ts` - `category` es ahora requerido
- ✅ `src/api/collections.ts` - Eliminada toda la normalización temporal
- ✅ `src/stores/colecciones.ts` - Eliminadas protecciones defensivas
- ✅ `src/views/ColeccionesView.vue` - Actualizado para usar `category` directamente

### 5. (Opcional) Eliminar la Columna `type`

Una vez que hayas verificado que todo funciona correctamente, puedes eliminar la columna `type`:

```sql
BEGIN;

-- Eliminar índice de type (ya no es necesario)
DROP INDEX IF EXISTS idx_collections_type;

-- Eliminar constraint de type
ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_type_check;

-- Eliminar columna type
ALTER TABLE collections DROP COLUMN IF EXISTS type;

COMMIT;
```

**Nota**: No elimines `type` inmediatamente. Espera al menos unos días para asegurarte de que todo funciona correctamente.

## Estructura Final de la Tabla

Después de la migración, la tabla `collections` tendrá:

```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('lista semanal', 'evento', 'otro')),
  event_date DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Índices Creados

La migración crea los siguientes índices:

- `idx_collections_category` - Para filtros por categoría
- `idx_collections_event_date` - Para filtros por fecha
- `idx_collections_category_event_date` - Índice compuesto para consultas comunes

## Rollback (Revertir Migración)

Si necesitas revertir la migración (no recomendado después de que la aplicación esté en producción):

```sql
BEGIN;

-- Eliminar nuevas columnas
ALTER TABLE collections DROP COLUMN IF EXISTS category;
ALTER TABLE collections DROP COLUMN IF EXISTS event_date;
ALTER TABLE collections DROP COLUMN IF EXISTS metadata;

-- Eliminar nuevos índices
DROP INDEX IF EXISTS idx_collections_category;
DROP INDEX IF EXISTS idx_collections_event_date;
DROP INDEX IF EXISTS idx_collections_category_event_date;

-- Restaurar índice de type (si lo eliminaste)
CREATE INDEX IF NOT EXISTS idx_collections_type ON collections(type);

COMMIT;
```

**Nota**: El rollback NO restaura los valores de `type` originales. Si necesitas esto, deberás hacerlo manualmente desde tu backup.

## Verificación Post-Migración

Después de ejecutar la migración y actualizar el código:

1. ✅ Verifica que todas las colecciones se muestren correctamente
2. ✅ Verifica que los filtros por categoría funcionen
3. ✅ Verifica que los filtros por fecha funcionen
4. ✅ Verifica que puedas crear nuevas colecciones con `category`
5. ✅ Verifica que puedas editar colecciones existentes

## Soporte

Si encuentras algún problema durante la migración:

1. Revisa los logs del SQL Editor en Supabase
2. Verifica que no haya errores de sintaxis
3. Verifica que tengas los permisos necesarios
4. Restaura desde el backup si es necesario

## Archivos Relacionados

- `migration_collections_category_event_date.sql` - Script de migración SQL
- `supabase_collections_setup.sql` - Setup original (solo referencia, no modificar)
- `src/types/songTypes.ts` - Definiciones de tipos TypeScript
- `src/api/collections.ts` - Servicio de API para colecciones
- `src/stores/colecciones.ts` - Store de Pinia para colecciones

