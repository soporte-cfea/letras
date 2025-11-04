# Sprint: Organización y Filtros de Listas

## Objetivo
Mejorar la vista de listas (colecciones) con organización visual, sistema de filtros versátil y preparación para futuras funcionalidades.

---

## Iteraciones

### ✅ ITERACIÓN 1: Actualizar tipos e interfaces
**Estado:** ✅ Completada  
**Objetivo:** Actualizar el modelo de datos para soportar las nuevas categorías y campos.

**Tareas:**
- [x] Modificar `Collection` interface en `src/types/songTypes.ts`:
  - [x] Cambiar `type: 'playlist' | 'album' | 'favorites' | 'custom'` por `category: 'lista semanal' | 'evento' | 'otro'`
  - [x] Agregar `event_date?: string` (formato ISO 8601)
  - [x] Agregar `metadata?: Record<string, any>` (opcional, para futuro)
- [x] Crear tipo `DayOfWeek` para días calculados (no almacenado)

**Resultado esperado:** Tipos actualizados y compatibles con TypeScript. ✅

---

### ✅ ITERACIÓN 2: Actualizar store - Funciones helper y computed básicos
**Estado:** ✅ Completada  
**Objetivo:** Agregar funciones helper y computed properties básicos al store.

**Tareas:**
- [x] Agregar función `getDayOfWeek(eventDate: string | undefined): DayOfWeek | null`
- [x] Agregar función `formatEventDate(eventDate: string | undefined): string`
- [x] Agregar función `getMonthYear(eventDate: string | undefined): string | null`
- [x] Crear computed `weeklyLists` (filtra por category === 'lista semanal')
- [x] Crear computed `events` (filtra por category === 'evento')
- [x] Crear computed `otherCollections` (filtra por category === 'otro')
- [x] Crear computed `collectionsWithDate` (tiene event_date)

**Resultado esperado:** Store con helpers y computed básicos funcionando. ✅

---

### ✅ ITERACIÓN 3: Actualizar store - Funciones de filtrado
**Estado:** ✅ Completada  
**Objetivo:** Implementar sistema de filtrado avanzado en el store.

**Tareas:**
- [x] Actualizar función `filterColecciones()` con nuevos parámetros:
  - [x] `searchQuery?: string`
  - [x] `categoryFilter?: 'lista semanal' | 'evento' | 'otro'`
  - [x] `dateRange?: { start?: string; end?: string }`
  - [x] `daysOfWeek?: DayOfWeek[]` (solo aplica a 'lista semanal')
  - [x] `monthFilter?: string`
- [x] Agregar función `getCurrentMonthCollections()`
- [x] Agregar función `getLastMonthCollections()`
- [x] Agregar computed `weeklyListsByMonth` (agrupado por mes)

**Resultado esperado:** Sistema de filtrado completo implementado. ✅

---

### ✅ ITERACIÓN 4: Actualizar formulario de creación/edición
**Estado:** ✅ Completada  
**Objetivo:** Actualizar formularios para usar category y event_date.

**Tareas:**
- [x] En `ColeccionesView.vue`, modificar formulario:
  - [x] Cambiar select de `type` a `category` con opciones: 'lista semanal', 'evento', 'otro'
  - [x] Agregar campo `event_date` (input type="date") que aparezca solo si category es 'lista semanal' o 'evento'
  - [x] Agregar labels descriptivos para mejor UX
  - [x] Agregar validación en `handleFormSubmit` para requerir fecha cuando corresponde
  - [x] Actualizar `handleFormSubmit`, `createCollection`, `updateCollection`
- [x] Actualizar función `getTypeLabel()` a `getCategoryLabel()`

**Resultado esperado:** Formularios funcionando con los nuevos campos. ✅

---

### ✅ ITERACIÓN 5: Crear componente CollectionFilters
**Estado:** ✅ Completada  
**Objetivo:** Crear panel de filtros colapsable.

**Tareas:**
- [x] Crear `src/components/CollectionFilters.vue`:
  - [x] Campo de búsqueda por texto
  - [x] Selector de categoría (todas, lista semanal, evento, otro)
  - [x] Selector de período temporal (todos, último mes, mes actual, personalizado)
  - [x] Rango de fechas personalizado (cuando período es personalizado)
  - [x] Selector de días de semana (solo visible si categoría es 'lista semanal'): todos, domingo, miércoles, viernes, personalizado
  - [x] Selector múltiple de días (cuando día es personalizado)
  - [x] Botón para limpiar filtros
  - [x] Panel colapsable con animación
- [x] Emitir eventos con los filtros aplicados (`update:modelValue` y `filters-changed`)
- [x] Sincronización con props (v-model)

**Resultado esperado:** Componente de filtros funcional y reutilizable. ✅

---

### ✅ ITERACIÓN 6: Crear componente CollectionViewSelector
**Estado:** ✅ Completada  
**Objetivo:** Crear selector de vistas predefinidas.

**Tareas:**
- [x] Crear `src/components/CollectionViewSelector.vue`:
  - [x] Botones/pestañas para vistas predefinidas:
    - [x] "Todas" (sin filtros)
    - [x] "Listas del mes" (mes actual)
    - [x] "Último mes"
    - [x] "Solo domingos"
    - [x] "Solo miércoles"
    - [x] "Eventos"
    - [x] "Otros"
  - [x] Iconos SVG para cada vista
  - [x] Estado activo visual
  - [x] Función `getFiltersForView()` que genera filtros según vista
  - [x] Emitir eventos `update:modelValue` y `view-selected` con filtros
  - [x] Soporte para v-model
- [x] Diseño responsive

**Resultado esperado:** Selector de vistas predefinidas funcionando. ✅

---

### ✅ ITERACIÓN 7: Mejorar CollectionCard
**Estado:** ✅ Completada  
**Objetivo:** Mejorar visualización de tarjetas de colección.

**Tareas:**
- [x] En `ColeccionesView.vue`, mejorar `.collection-card`:
  - [x] Agregar badge de fecha si tiene `event_date` (usar `formatEventDate`)
  - [x] Agregar badge de día de semana si es 'lista semanal' con `event_date` (usar `getDayOfWeek`)
  - [x] Badge de día con colores distintivos por día de la semana
  - [x] Agregar badge de categoría con gradientes de color distintivos
  - [x] Agregar icono al contador de canciones
  - [x] Borde izquierdo de color según categoría
  - [x] Efectos hover mejorados con sombras de color según categoría
  - [x] Función `capitalizeDay()` para formatear días

**Resultado esperado:** Tarjetas con mejor información visual. ✅

---

### ✅ ITERACIÓN 8: Actualizar ColeccionesView principal
**Estado:** ✅ Completada  
**Objetivo:** Integrar todo y organizar visualmente.

**Tareas:**
- [x] Integrar `CollectionFilters` y `CollectionViewSelector` en la vista
- [x] Crear estado reactivo para `selectedView` y `currentFilters`
- [x] Crear computed `filteredCollections` que aplica todos los filtros
- [x] Crear computed `groupedCollections` que agrupa por mes cuando corresponde
- [x] Implementar agrupación visual:
  - [x] Si hay filtros de fecha/mes o listas con fecha: agrupar por mes
  - [x] Si no hay filtros de fecha: mostrar grid simple sin agrupar
  - [x] Sección "Otros" para listas sin fecha
- [x] Funciones `handleViewSelected` y `handleFiltersChanged`
- [x] Convertir filtros de vista a formato de store
- [x] Ordenar por fecha (más recientes primero) dentro de cada grupo
- [x] Estado vacío cuando no hay resultados de filtros
- [x] Ajustar estilos y responsive

**Resultado esperado:** Vista principal completa con organización visual mejorada. ✅

---

## Dependencias entre iteraciones

```
Iteración 1 (Tipos) 
  ↓
Iteración 2 (Store helpers) 
  ↓
Iteración 3 (Store filtros)
  ↓
Iteración 4 (Formularios) ──┐
Iteración 5 (Filtros) ──────┤
Iteración 6 (Vistas) ────────┤
Iteración 7 (Cards) ─────────┤
  ↓                          ↓
Iteración 8 (Vista principal)
```

---

## Notas

- Los tipos antiguos (`playlist`, `album`, `favorites`, `custom`) serán migrados manualmente por el usuario
- El día de la semana se calcula desde `event_date`, no se almacena
- Los filtros por día solo aplican a listas semanales
- El campo `metadata` queda preparado para futuras funcionalidades

---

## Estado general
- ✅ Completadas: 8/8 (TODAS LAS ITERACIONES COMPLETADAS AL 100%)
- ⏳ En progreso: 0/8
- ⏳ Pendientes: 0/8

## 🎉 Sprint Completado

Todas las iteraciones han sido implementadas exitosamente. El sistema de organización y filtros de listas está completamente funcional y listo para usar.

