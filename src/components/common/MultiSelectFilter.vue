<template>
  <div class="multi-select-filter" ref="containerRef">
    <!-- Label opcional -->
    <label v-if="label" class="filter-label" :for="filterId">
      {{ label }}
    </label>

    <!-- Botón principal del dropdown -->
    <button
      :id="filterId"
      ref="buttonRef"
      type="button"
      :class="['filter-button', { 'filter-button--open': isOpen, 'filter-button--has-selection': selectedValues.length > 0 }]"
      @click="toggleDropdown"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      :aria-controls="dropdownId"
    >
      <span class="filter-button-text">
        {{ displayText }}
      </span>
      <svg 
        class="filter-button-icon" 
        width="16" 
        height="16" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        :class="{ 'rotate-180': isOpen }"
      >
        <path d="M19 9l-7 7-7-7"/>
      </svg>
    </button>


    <!-- Chips de selección (cuando hay selecciones) -->
    <div v-if="showSelectedChips && selectedValues.length > 0" class="selected-chips">
      <span
        v-for="(value, index) in visibleSelectedItems"
        :key="getOptionValue(value)"
        class="selected-chip"
      >
        <span class="chip-text">{{ getOptionLabel(value) }}</span>
        <button
          type="button"
          class="chip-remove"
          @click.stop="removeSelection(value)"
          :aria-label="`Remover ${getOptionLabel(value)}`"
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </span>
      <span v-if="hiddenSelectedCount > 0" class="chip-more">
        +{{ hiddenSelectedCount }} más
      </span>
    </div>

    <!-- Dropdown menu -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        :id="dropdownId"
        ref="dropdownRef"
        class="filter-dropdown"
        :style="dropdownStyle"
        role="listbox"
        :aria-multiselectable="true"
      >
        <!-- Búsqueda (si está habilitada) -->
        <div v-if="searchable" class="dropdown-search">
          <svg class="search-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Buscar..."
            @click.stop
            @keydown.escape="closeDropdown"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="search-clear"
            @click.stop="searchQuery = ''"
            aria-label="Limpiar búsqueda"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Header con toggle de modo y icono de información (siempre visible cuando allowFilterModeToggle está habilitado) -->
        <div v-if="allowFilterModeToggle" class="filter-mode-header">
          <div v-if="selectedValues.length > 1" class="filter-mode-control-visible">
            <span class="filter-mode-label-text">Modo:</span>
            <div class="filter-mode-toggle-visible">
              <button
                type="button"
                :class="['filter-mode-btn-visible', { 'filter-mode-btn-visible--active': localFilterMode === 'or' }]"
                @click.stop="setFilterMode('or')"
                title="Mostrar elementos que tengan cualquiera de las seleccionadas"
              >
                Cualquiera
              </button>
              <button
                type="button"
                :class="['filter-mode-btn-visible', { 'filter-mode-btn-visible--active': localFilterMode === 'and' }]"
                @click.stop="setFilterMode('and')"
                title="Mostrar solo elementos que tengan todas las seleccionadas"
              >
                Todas
              </button>
            </div>
          </div>
          <div v-else class="filter-mode-control-visible">
            <span class="filter-mode-label-text">Modo:</span>
            <span class="filter-mode-placeholder">{{ selectedValues.length === 1 ? 'Una selección' : 'Sin selecciones' }}</span>
          </div>
          <HelpIcon title="Información del filtro">
            <div v-if="selectedValues.length > 1" class="tooltip-section">
              <div class="tooltip-mode-control">
                <label class="tooltip-mode-label">
                  <span class="tooltip-mode-text">Modo de filtro:</span>
                  <div class="tooltip-mode-toggle">
                    <button
                      type="button"
                      :class="['tooltip-mode-btn', { 'tooltip-mode-btn--active': localFilterMode === 'or' }]"
                      @click.stop="setFilterMode('or')"
                    >
                      Cualquiera
                    </button>
                    <button
                      type="button"
                      :class="['tooltip-mode-btn', { 'tooltip-mode-btn--active': localFilterMode === 'and' }]"
                      @click.stop="setFilterMode('and')"
                    >
                      Todas
                    </button>
                  </div>
                </label>
                <p class="tooltip-mode-description">
                  <strong v-if="localFilterMode === 'or'">Cualquiera:</strong>
                  <strong v-else>Todas:</strong>
                  <span v-if="localFilterMode === 'or'">
                    Muestra elementos que tengan <em>al menos una</em> de las opciones seleccionadas.
                  </span>
                  <span v-else>
                    Muestra solo elementos que tengan <em>todas</em> las opciones seleccionadas.
                  </span>
                </p>
              </div>
            </div>
            <div v-else-if="selectedValues.length === 1" class="tooltip-section">
              <p class="tooltip-description">
                Una opción seleccionada. Se mostrarán elementos que coincidan con esta opción.
              </p>
            </div>
            <div v-else class="tooltip-section">
              <p class="tooltip-description">
                Selecciona múltiples opciones para usar el modo de filtro.
              </p>
            </div>
          </HelpIcon>
        </div>

        <!-- Opción "Seleccionar todas" -->
        <div class="dropdown-actions">
          <button
            type="button"
            class="action-btn"
            @click.stop="toggleSelectAll"
          >
            {{ allSelected ? 'Deseleccionar todas' : 'Seleccionar todas' }}
          </button>
        </div>

        <!-- Lista de opciones -->
        <div class="dropdown-options" role="group">
          <button
            v-for="option in filteredOptions"
            :key="getOptionValue(option)"
            type="button"
            :class="['option-item', { 'option-item--selected': isSelected(option) }]"
            @click.stop="toggleSelection(option)"
            role="option"
            :aria-selected="isSelected(option)"
          >
            <span class="option-checkbox">
              <svg
                v-if="isSelected(option)"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span v-else class="checkbox-empty"></span>
            </span>
            <span class="option-label">{{ getOptionLabel(option) }}</span>
          </button>

          <!-- Mensaje cuando no hay resultados -->
          <div v-if="filteredOptions.length === 0" class="no-results">
            No se encontraron resultados
          </div>
        </div>

      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import HelpIcon from './HelpIcon.vue';

export type FilterMode = 'and' | 'or';

export type OptionValue = string | number;

export interface Option {
  id?: OptionValue;
  label?: string;
  value?: OptionValue;
}

export type SelectOption = string | number | Option;

export type DropdownPosition = 
  | 'auto'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'top-left'
  | 'top-center'
  | 'top-right';

interface Props {
  options: SelectOption[];
  modelValue: OptionValue[];
  modelFilterMode?: FilterMode;
  filterMode?: FilterMode;
  placeholder?: string;
  label?: string;
  allowFilterModeToggle?: boolean;
  searchable?: boolean;
  maxDisplay?: number;
  showSelectedChips?: boolean;
  dropdownWidth?: number | string;
  dropdownPosition?: DropdownPosition;
  dropdownPositionMobileOnly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Seleccionar opciones',
  filterMode: 'or',
  allowFilterModeToggle: true,
  searchable: false,
  maxDisplay: 3,
  showSelectedChips: true,
  dropdownWidth: 300,
  dropdownPosition: 'auto',
  dropdownPositionMobileOnly: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: OptionValue[]];
  'update:modelFilterMode': [mode: FilterMode];
  'update:filter-mode': [mode: FilterMode];
  'update:filterMode': [mode: FilterMode];
  'change': [selected: OptionValue[], mode: FilterMode];
}>();

// Referencias
const containerRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLButtonElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

// Estado
const isOpen = ref(false);
const searchQuery = ref('');
const localFilterMode = ref<FilterMode>(
  props.allowFilterModeToggle 
    ? (props.modelFilterMode || props.filterMode || 'or')
    : 'or'
);
const dropdownStyle = ref<Record<string, string>>({});

// IDs únicos para accesibilidad
const filterId = `multi-select-${Math.random().toString(36).substr(2, 9)}`;
const dropdownId = `dropdown-${Math.random().toString(36).substr(2, 9)}`;

// Computed
const selectedValues = computed(() => props.modelValue || []);

const normalizedOptions = computed(() => {
  return props.options.map(opt => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) };
    }
    return {
      value: opt.id || opt.value || '',
      label: opt.label || String(opt.value || ''),
    };
  });
});

const filteredOptions = computed(() => {
  if (!searchQuery.value) {
    return normalizedOptions.value;
  }
  const query = searchQuery.value.toLowerCase();
  return normalizedOptions.value.filter(opt =>
    opt.label.toLowerCase().includes(query)
  );
});

const allSelected = computed(() => {
  return filteredOptions.value.length > 0 &&
    filteredOptions.value.every(opt => isSelected(opt));
});

const displayText = computed(() => {
  if (selectedValues.value.length === 0) {
    return props.placeholder;
  }
  if (selectedValues.value.length === 1) {
    const selected = normalizedOptions.value.find(
      opt => opt.value === selectedValues.value[0]
    );
    return selected?.label || props.placeholder;
  }
  return `${selectedValues.value.length} seleccionadas`;
});

const visibleSelectedItems = computed(() => {
  const selected = normalizedOptions.value.filter(opt =>
    selectedValues.value.includes(opt.value)
  );
  return selected.slice(0, props.maxDisplay);
});

const hiddenSelectedCount = computed(() => {
  return Math.max(0, selectedValues.value.length - props.maxDisplay);
});

// Métodos
function getOptionValue(option: SelectOption | { value: OptionValue; label: string }): OptionValue {
  if (typeof option === 'string' || typeof option === 'number') {
    return option;
  }
  if ('value' in option) {
    return option.value;
  }
  return option.id || option.value || '';
}

function getOptionLabel(option: SelectOption | { value: OptionValue; label: string }): string {
  if (typeof option === 'string' || typeof option === 'number') {
    return String(option);
  }
  if ('label' in option) {
    return option.label || String(option.value || '');
  }
  return String(option.id || option.value || '');
}

function isSelected(option: SelectOption | { value: OptionValue; label: string }): boolean {
  const value = getOptionValue(option);
  return selectedValues.value.includes(value);
}

function toggleSelection(option: SelectOption | { value: OptionValue; label: string }) {
  const value = getOptionValue(option);
  const current = [...selectedValues.value];
  
  if (current.includes(value)) {
    const index = current.indexOf(value);
    current.splice(index, 1);
  } else {
    current.push(value);
  }
  
  emit('update:modelValue', current);
  emit('change', current, localFilterMode.value);
}

function removeSelection(option: SelectOption | { value: OptionValue; label: string }) {
  const value = getOptionValue(option);
  const current = selectedValues.value.filter(v => v !== value);
  
  emit('update:modelValue', current);
  emit('change', current, localFilterMode.value);
}

function toggleSelectAll() {
  if (allSelected.value) {
    // Deseleccionar todas las opciones filtradas
    const filteredValues = filteredOptions.value.map(opt => opt.value);
    const current = selectedValues.value.filter(v => !filteredValues.includes(v));
    emit('update:modelValue', current);
    emit('change', current, localFilterMode.value);
  } else {
    // Seleccionar todas las opciones filtradas
    const filteredValues = filteredOptions.value.map(opt => opt.value);
    const current = [...new Set([...selectedValues.value, ...filteredValues])];
    emit('update:modelValue', current);
    emit('change', current, localFilterMode.value);
  }
}

function toggleFilterMode() {
  localFilterMode.value = localFilterMode.value === 'and' ? 'or' : 'and';
  emit('update:modelFilterMode', localFilterMode.value);
  emit('update:filter-mode', localFilterMode.value);
  emit('update:filterMode', localFilterMode.value);
  emit('change', selectedValues.value, localFilterMode.value);
}

function setFilterMode(mode: FilterMode) {
  if (localFilterMode.value === mode) return;
  localFilterMode.value = mode;
  emit('update:modelFilterMode', localFilterMode.value);
  emit('update:filter-mode', localFilterMode.value);
  emit('update:filterMode', localFilterMode.value);
  emit('change', selectedValues.value, localFilterMode.value);
}


function toggleDropdown() {
  isOpen.value = !isOpen.value;
  if (isOpen.value && props.searchable && searchInputRef.value) {
    setTimeout(() => {
      searchInputRef.value?.focus();
    }, 100);
  }
}

function closeDropdown() {
  isOpen.value = false;
  searchQuery.value = '';
}

function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    closeDropdown();
    buttonRef.value?.focus();
  }
}

function positionDropdown() {
  if (!buttonRef.value || !dropdownRef.value || !containerRef.value || !isOpen.value) {
    return;
  }

  // Esperar a que el DOM se actualice
  nextTick(() => {
    requestAnimationFrame(() => {
      if (!dropdownRef.value || !containerRef.value || !buttonRef.value || !isOpen.value) return;
      
      const buttonRect = buttonRef.value.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Detectar si es pantalla pequeña (móvil)
      const isMobile = viewportWidth <= 768;
      
      // Determinar si se debe aplicar la posición personalizada
      const applyCustomPosition = props.dropdownPosition !== 'auto' && 
        (!props.dropdownPositionMobileOnly || (props.dropdownPositionMobileOnly && isMobile));
      
      // Margen de seguridad desde los bordes de la pantalla (8px)
      const margin = 8;
      
      // Ancho deseado del dropdown (desde props o default)
      const desiredWidth = typeof props.dropdownWidth === 'number' 
        ? props.dropdownWidth 
        : parseInt(String(props.dropdownWidth)) || 300;
      
      // Obtener altura del dropdown
      const dropdownHeight = Math.min(dropdownRef.value.offsetHeight || 320, 320);
      
      // Calcular ancho máximo permitido basado en el viewport (con márgenes)
      const realMaxWidth = viewportWidth - margin * 2;
      const finalWidth = Math.min(desiredWidth, realMaxWidth);
      
      let finalTop: number;
      let finalLeft: number;
      
      // Si se debe aplicar posición personalizada
      if (applyCustomPosition) {
        // Parsear la posición
        const [vertical, horizontal] = props.dropdownPosition.split('-') as [string, string];
        
        // Calcular posición vertical
        if (vertical === 'top') {
          finalTop = Math.max(margin, buttonRect.top - dropdownHeight - 8);
        } else { // 'bottom'
          finalTop = buttonRect.bottom + 8;
          // Si no cabe abajo, mostrar arriba
          if (finalTop + dropdownHeight > viewportHeight - margin) {
            finalTop = Math.max(margin, buttonRect.top - dropdownHeight - 8);
          }
        }
        
        // Calcular posición horizontal
        if (horizontal === 'center') {
          finalLeft = (viewportWidth - finalWidth) / 2;
        } else if (horizontal === 'right') {
          finalLeft = viewportWidth - finalWidth - margin;
          // Si no cabe a la derecha, ajustar
          if (finalLeft < margin) {
            finalLeft = margin;
          }
        } else { // 'left'
          finalLeft = buttonRect.left;
          // Si no cabe a la izquierda desde el botón, ajustar
          if (finalLeft + finalWidth > viewportWidth - margin) {
            finalLeft = Math.max(margin, viewportWidth - finalWidth - margin);
          }
        }
      } else {
        // Modo automático (comportamiento original mejorado)
        // Calcular posición top (debajo del botón por defecto)
        const top = buttonRect.bottom + 8;
        
        // Verificar si cabe abajo, si no, mostrar arriba
        finalTop = top + dropdownHeight > viewportHeight - margin
          ? Math.max(margin, buttonRect.top - dropdownHeight - 8)
          : top;
        
        // Calcular espacio disponible con margen
        const spaceRight = viewportWidth - buttonRect.left - margin;
        const spaceLeft = buttonRect.left - margin;
        
        let leftPosition = buttonRect.left;
        let width = desiredWidth;
        
        // Si el dropdown se desbordaría por el lado derecho (considerando el margen)
        if (buttonRect.left + desiredWidth > viewportWidth - margin) {
          // Calcular cuánto espacio tenemos realmente a la derecha
          const actualSpaceRight = spaceRight;
          
          // Si hay más espacio a la izquierda, intentar reposicionar
          if (spaceLeft > spaceRight && spaceLeft >= desiredWidth) {
            // Reposicionar hacia la izquierda
            const overflow = buttonRect.left + desiredWidth - (viewportWidth - margin);
            leftPosition = buttonRect.left - overflow;
            
            // Asegurarse de no salirse por la izquierda (respetar margen de 8px)
            if (leftPosition < margin) {
              leftPosition = margin;
              // Si no cabe al ancho deseado, ajustar solo lo necesario
              width = Math.min(desiredWidth, viewportWidth - margin * 2);
            }
          } else {
            // No hay suficiente espacio a la izquierda, ajustar ancho para que quepa a la derecha
            leftPosition = buttonRect.left;
            width = Math.min(desiredWidth, actualSpaceRight);
            
            // Si el ancho ajustado aún hace que se desborde, reposicionar
            if (leftPosition + width > viewportWidth - margin) {
              width = Math.min(width, viewportWidth - leftPosition - margin);
            }
          }
          
          const adjustedWidth = Math.min(width, realMaxWidth);
          finalLeft = Math.max(margin, Math.min(leftPosition, viewportWidth - adjustedWidth - margin));
        } else {
          // Hay suficiente espacio
          finalLeft = buttonRect.left;
        }
      }
      
      // Asegurar que las posiciones finales respeten los márgenes
      finalLeft = Math.max(margin, Math.min(finalLeft, viewportWidth - finalWidth - margin));
      finalTop = Math.max(margin, Math.min(finalTop, viewportHeight - dropdownHeight - margin));
      
      // Aplicar estilos
      dropdownStyle.value = {
        top: `${finalTop}px`,
        left: `${finalLeft}px`,
        width: `${finalWidth}px`,
        maxWidth: `${realMaxWidth}px`,
        minWidth: `${desiredWidth}px`,
      };
    });
  });
}

// Watchers
watch(() => props.modelFilterMode || props.filterMode, (newMode) => {
  if (newMode !== undefined && props.allowFilterModeToggle) {
    localFilterMode.value = newMode;
  } else if (!props.allowFilterModeToggle) {
    localFilterMode.value = 'or';
  }
});

// Forzar modo 'or' cuando el toggle está deshabilitado
watch(() => props.allowFilterModeToggle, (enabled) => {
  if (!enabled) {
    localFilterMode.value = 'or';
  }
});

// Reposicionar dropdown cuando se abre o cuando cambia el contenido
watch(isOpen, (newVal) => {
  if (newVal) {
    nextTick(() => {
      positionDropdown();
    });
  } else {
    dropdownStyle.value = {};
  }
});

// También reposicionar cuando cambia el contenido del dropdown (selecciones, búsqueda, etc)
watch([selectedValues, searchQuery], () => {
  if (isOpen.value) {
    nextTick(() => {
      positionDropdown();
    });
  }
});


// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscape);
  window.addEventListener('resize', positionDropdown);
  window.addEventListener('scroll', positionDropdown, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscape);
  window.removeEventListener('resize', positionDropdown);
  window.removeEventListener('scroll', positionDropdown, true);
});
</script>

<style scoped>
.multi-select-filter {
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: visible;
}

.filter-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.filter-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.875rem;
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-normal);
  outline: none;
}

.filter-button:hover {
  border-color: var(--color-border-hover);
  background: var(--color-background-hover);
}

.filter-button:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(var(--color-info), 0.1);
}

.filter-button--open {
  border-color: var(--color-border-focus);
}

.filter-button--has-selection {
  color: var(--color-text);
}

.filter-button-text {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-button-icon {
  flex-shrink: 0;
  margin-left: 0.5rem;
  transition: transform var(--transition-normal);
  color: var(--color-text-soft);
}

.filter-button-icon.rotate-180 {
  transform: rotate(180deg);
}

.filter-mode-header {
  padding: 0.5rem 0.75rem; /* Reducido para compactar */
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
  display: flex;
  align-items: center;
  gap: 0.75rem; /* Reducido para compactar */
  /* Asegurar que todo esté dentro del contenedor */
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.filter-mode-control-visible {
  display: flex;
  align-items: center;
  gap: 0.5rem; /* Reducido para compactar */
  flex: 1;
  min-width: 0; /* Permite que el contenido se comprima si es necesario */
}

/* Espaciado y alineación para el icono de ayuda */
.filter-mode-header :deep(.help-icon-wrapper) {
  flex-shrink: 0;
  margin-left: auto; /* Empuja el icono a la derecha */
  padding-left: 0.75rem; /* Reducido pero suficiente */
  padding-right: 0;
}

.filter-mode-label-text {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-soft);
  white-space: nowrap;
}

.filter-mode-placeholder {
  font-size: 0.8125rem;
  color: var(--color-text-mute);
  font-style: italic;
}

.filter-mode-toggle-visible {
  display: flex;
  gap: 0.25rem; /* Compactado */
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 2px; /* Compactado */
  flex-shrink: 0;
}

.filter-mode-btn-visible {
  padding: 0.25rem 0.5rem; /* Compactado de 0.375rem 0.625rem */
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--color-text-soft);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
  white-space: nowrap;
}

.filter-mode-btn-visible:hover:not(.filter-mode-btn-visible--active) {
  color: var(--color-text);
  background: var(--color-background-soft);
}

.filter-mode-btn-visible--active {
  background: var(--color-info);
  color: var(--color-text-inverse);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}


.tooltip-mode-control {
  margin-bottom: 0.75rem;
}

:deep(.tooltip-mode-label) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

:deep(.tooltip-mode-text) {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
}

:deep(.tooltip-mode-toggle) {
  display: flex;
  gap: 0.25rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 2px;
}

:deep(.tooltip-mode-btn) {
  padding: 0.375rem 0.625rem;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--color-text-soft);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
  white-space: nowrap;
}

:deep(.tooltip-mode-btn:hover:not(.tooltip-mode-btn--active)) {
  color: var(--color-text);
  background: var(--color-background-card);
}

:deep(.tooltip-mode-btn--active) {
  background: var(--color-info);
  color: var(--color-text-inverse);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

:deep(.tooltip-mode-description) {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-text-soft);
}

:deep(.tooltip-mode-description strong) {
  color: var(--color-text);
  font-weight: 600;
}

:deep(.tooltip-mode-description em) {
  font-style: italic;
}

:deep(.tooltip-description) {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-text-soft);
}


.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.selected-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--color-text);
}

.chip-text {
  flex: 1;
}

.chip-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: none;
  border: none;
  color: var(--color-text-soft);
  cursor: pointer;
  transition: color var(--transition-fast);
  outline: none;
}

.chip-remove:hover {
  color: var(--color-error);
}

.chip-more {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  color: var(--color-text-soft);
  font-size: 0.75rem;
}

.filter-dropdown {
  position: fixed;
  z-index: 1000;
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: var(--shadow-lg);
  max-height: 20rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  /* Evitar cambios de tamaño */
  box-sizing: border-box;
}

.dropdown-search {
  position: relative;
  padding: 0.625rem;
  border-bottom: 1px solid var(--color-border);
}

.search-icon {
  position: absolute;
  left: 1.125rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-mute);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 2.25rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  font-size: 0.875rem;
  outline: none;
  transition: all var(--transition-normal);
}

.search-input:focus {
  border-color: var(--color-border-focus);
  background: var(--color-background);
}

.search-clear {
  position: absolute;
  right: 1.125rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.25rem;
  background: none;
  border: none;
  color: var(--color-text-mute);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast);
  outline: none;
}

.search-clear:hover {
  color: var(--color-text);
}

.dropdown-actions {
  padding: 0.5rem 0.625rem;
  border-bottom: 1px solid var(--color-border);
}

.action-btn {
  width: 100%;
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--color-link);
  font-size: 0.8125rem;
  text-align: left;
  cursor: pointer;
  transition: color var(--transition-fast);
  outline: none;
}

.action-btn:hover {
  color: var(--color-link-hover);
}

.dropdown-options {
  flex: 1;
  overflow-y: auto;
  padding: 0.25rem 0;
}

.option-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--transition-fast);
  outline: none;
}

.option-item:hover {
  background: var(--color-background-hover);
}

.option-item--selected {
  background: var(--color-background-soft);
}

.option-item--selected:hover {
  background: var(--color-background-hover);
}

.option-checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--color-border);
  border-radius: 3px;
  background: var(--color-background);
  color: var(--color-info);
}

.checkbox-empty {
  display: block;
  width: 100%;
  height: 100%;
}

.option-label {
  flex: 1;
}

.no-results {
  padding: 1.5rem;
  text-align: center;
  color: var(--color-text-mute);
  font-size: 0.875rem;
}


/* Transiciones */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

/* Scrollbar personalizado */
.dropdown-options::-webkit-scrollbar {
  width: 6px;
}

.dropdown-options::-webkit-scrollbar-track {
  background: var(--color-background-soft);
}

.dropdown-options::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.dropdown-options::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-hover);
}
</style>

