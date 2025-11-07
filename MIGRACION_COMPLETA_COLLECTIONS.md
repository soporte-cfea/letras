# Migración Completa: Collections - Arreglar problemas de NULL

## Problema

Después de aplicar la migración de `name` nullable, todavía hay un error porque la columna `type` tiene un constraint `NOT NULL` pero el código ya no envía ese campo.

## Solución

Ejecutar las siguientes migraciones **en orden**:

### 1. Primero: Hacer `type` nullable

**Archivo**: `migration_collections_type_nullable.sql`

Esta migración hace que la columna `type` acepte valores `NULL`, permitiendo que el código funcione sin enviar ese campo.

**Pasos**:
1. Abre Supabase Dashboard → SQL Editor
2. Copia y pega el contenido de `migration_collections_type_nullable.sql`
3. Ejecuta el script
4. Verifica que veas el mensaje: "✓ Migración exitosa"

### 2. Segundo: (Ya aplicada) Hacer `name` nullable

**Archivo**: `migration_collections_name_nullable.sql`

Esta migración ya debería estar aplicada. Si no, ejecútala también.

### 3. Tercero (Opcional, más adelante): Eliminar columna `type`

**Archivo**: `migration_collections_remove_type_column.sql`

Esta migración elimina completamente la columna `type` que ya no se usa.

**⚠️ IMPORTANTE**: Solo ejecuta esta migración después de:
- Verificar que todo funciona correctamente
- Esperar al menos unos días para asegurar estabilidad
- Confirmar que no hay ningún código que aún use `type`

## Orden de Ejecución Recomendado

```
1. migration_collections_type_nullable.sql       ← EJECUTAR AHORA
2. migration_collections_name_nullable.sql        ← Ya debería estar aplicada
3. migration_collections_remove_type_column.sql   ← Ejecutar más adelante (opcional)
```

## Verificación

Después de ejecutar las migraciones, intenta crear una nueva lista semanal sin nombre. Debería funcionar sin errores.

## Estado Actual del Esquema

Después de las migraciones:

- ✅ `name`: **nullable** (puede ser NULL)
- ✅ `type`: **nullable** (puede ser NULL, pero ya no se usa)
- ✅ `category`: **NOT NULL** (requerido)
- ✅ `event_date`: **nullable** (opcional)

## Notas

- La columna `type` se mantiene temporalmente para compatibilidad
- El código ya no usa `type`, solo `category`
- Puedes eliminar `type` más adelante cuando estés seguro de que todo funciona

