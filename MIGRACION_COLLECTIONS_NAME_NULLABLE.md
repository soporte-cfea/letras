# Migración: Hacer columna `name` nullable en `collections`

## Descripción

Esta migración permite que la columna `name` en la tabla `collections` acepte valores `NULL`, lo cual es necesario para permitir crear colecciones sin nombre (especialmente útil para listas semanales donde el título se genera automáticamente).

## Pasos para ejecutar la migración

### 1. Acceder al SQL Editor en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor** en el menú lateral
3. Haz clic en **New query**

### 2. Ejecutar el script de migración

1. Copia el contenido completo del archivo `migration_collections_name_nullable.sql`
2. Pégalo en el editor SQL
3. Haz clic en **Run** o presiona `Ctrl+Enter` (Windows/Linux) o `Cmd+Enter` (Mac)

### 3. Verificar la migración

Después de ejecutar el script, deberías ver un mensaje en la consola que indica:
- Total de colecciones
- Colecciones sin nombre (probablemente 0 si no hay ninguna aún)

## Cambios realizados

1. **Base de datos**: La columna `name` ahora acepta valores `NULL`
2. **Código TypeScript**: La interfaz `Collection` tiene `name?` (opcional)
3. **Frontend**: Todos los lugares que muestran `collection.name` tienen fallbacks apropiados
4. **Filtros**: El filtro de búsqueda ahora maneja correctamente colecciones sin nombre
5. **Formularios**: El nombre es opcional y se puede dejar vacío

## Comportamiento después de la migración

### Listas semanales
- Pueden crearse sin nombre
- El título se genera automáticamente: `"Lista semanal - [Día] - [Fecha]"`
- Ejemplo: `"Lista semanal - Domingo - 2 nov 2025"`

### Eventos
- Pueden crearse sin nombre (aunque no es común)
- Si tienen nombre: `"[Nombre] - [Fecha]"`
- Si no tienen nombre pero tienen fecha: `"Evento - [Fecha]"`
- Si no tienen nombre ni fecha: `"Evento"`

### Otros
- Si tienen nombre: muestra el nombre
- Si no tienen nombre: muestra `"Colección"`

## Rollback (si es necesario)

Si necesitas revertir esta migración (no recomendado):

```sql
BEGIN;

-- Hacer name NOT NULL nuevamente
ALTER TABLE collections
ALTER COLUMN name SET NOT NULL;

-- Actualizar filas sin nombre (asignar un nombre por defecto)
UPDATE collections
SET name = 'Colección sin nombre'
WHERE name IS NULL;

COMMIT;
```

## Notas

- Las colecciones existentes no se ven afectadas
- Los nombres vacíos o solo espacios se convierten automáticamente a `NULL`
- El código frontend maneja correctamente valores `NULL` o `undefined`

