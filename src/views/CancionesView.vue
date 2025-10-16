<template>
  <div class="songs-container">
    <!-- Header Compacto -->
    <header class="songs-header">
      <div class="header-content">
        <h1 class="page-title">Canciones</h1>
        <div class="header-actions">
          <!-- Toggle de vistas -->
          <div class="view-toggle">
            <button 
              @click="currentView = 'cards'" 
              :class="['view-btn', { active: currentView === 'cards' }]"
              title="Vista de tarjetas"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
            </button>
            <button 
              @click="currentView = 'table'" 
              :class="['view-btn', { active: currentView === 'table' }]"
              title="Vista de tabla"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 6h18M3 10h18M3 14h18M3 18h18"/>
              </svg>
            </button>
          </div>
          <!-- Botón de configuración de columnas (solo en vista tabla) -->
          <button 
            v-if="currentView === 'table'" 
            @click="showColumnConfig = !showColumnConfig" 
            class="config-btn"
            title="Configurar columnas"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
          <button 
            v-if="canCreateSongs" 
            @click="showAddModal = true" 
            class="add-btn"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 5v14m7-7H5"/>
            </svg>
            Nueva canción
          </button>
        </div>
      </div>
    </header>

    <!-- Panel de configuración de columnas -->
    <div v-if="currentView === 'table' && showColumnConfig" class="column-config-panel">
      <div class="config-content">
        <h4>Configurar columnas visibles</h4>
        <div class="column-options">
          <label v-for="column in availableColumns" :key="column.key" class="column-option">
            <input 
              type="checkbox" 
              v-model="visibleColumns" 
              :value="column.key"
              class="column-checkbox"
            />
            <span class="column-label">{{ column.label }}</span>
          </label>
        </div>
        <div class="config-actions">
          <button @click="resetColumns" class="reset-btn">Restablecer</button>
          <button @click="showColumnConfig = false" class="close-btn">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Barra de Búsqueda Sticky para Móviles -->
    <div class="sticky-search-mobile">
      <div class="search-input-wrapper">
        <svg class="search-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Buscar canciones..."
          class="search-input"
          @keyup.enter="handleSearchEnter"
          @keypress.enter="handleSearchEnter"
          @blur="handleSearchBlur"
        />
      </div>
      
      <!-- Filtros siempre visibles en móviles -->
      <div class="mobile-filters">
        <select v-model="selectedArtist" class="filter-select">
          <option value="">Todos los artistas</option>
          <option v-for="artist in artistas" :key="artist" :value="artist">
            {{ artist }}
          </option>
        </select>
        
        <select v-model="selectedTag" class="filter-select">
          <option value="">Todas las etiquetas</option>
          <option v-for="tag in tags" :key="tag" :value="tag">
            {{ tag }}
          </option>
        </select>
        
        <button v-if="hasActiveFilters" @click="clearFilters" class="clear-filters">
          Limpiar
        </button>
      </div>
    </div>

    <!-- Barra de Búsqueda Desktop (oculta en móviles) -->
    <div class="search-section desktop-only">
      <div class="search-container">
        <div class="search-input-wrapper">
          <svg class="search-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar canciones, artistas, etiquetas..."
            class="search-input"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="filters-row">
          <select v-model="selectedArtist" class="filter-select">
            <option value="">Todos los artistas</option>
            <option v-for="artist in artistas" :key="artist" :value="artist">
              {{ artist }}
            </option>
          </select>
          
          <select v-model="selectedTag" class="filter-select">
            <option value="">Todas las etiquetas</option>
            <option v-for="tag in tags" :key="tag" :value="tag">
              {{ tag }}
            </option>
          </select>
          
          <button v-if="hasActiveFilters" @click="clearFilters" class="clear-filters">
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>


    <!-- Contenido Principal -->
    <main class="songs-main">
      <!-- Estados de Carga y Error -->
      <div v-if="loading" class="state-container">
        <div class="loading-spinner"></div>
        <p>Cargando canciones...</p>
      </div>
      
      <div v-else-if="error" class="state-container error">
        <div class="error-icon">⚠️</div>
        <h3>Error al cargar canciones</h3>
        <p>{{ error }}</p>
        <button @click="retryLoad" class="retry-btn">Reintentar</button>
      </div>
      
      <div v-else-if="filteredCanciones.length === 0" class="state-container empty">
        <div class="empty-icon">🎵</div>
        <h3>{{ hasActiveFilters ? 'No se encontraron resultados' : 'No hay canciones' }}</h3>
        <p v-if="hasActiveFilters">
          Intenta ajustar los filtros o la búsqueda
        </p>
        <p v-else>
          Comienza agregando tu primera canción
        </p>
        <button v-if="!hasActiveFilters" @click="showAddModal = true" class="add-first-btn">
          Agregar primera canción
        </button>
      </div>
      
      <!-- Contador de canciones mostradas -->
      <div v-if="filteredCanciones.length > 0" class="songs-counter">
        <span class="counter-text">{{ filteredCanciones.length }} {{ filteredCanciones.length === 1 ? 'canción' : 'canciones' }}</span>
      </div>

      <!-- Lista de Canciones - Vista de Cards -->
      <div v-if="filteredCanciones.length > 0 && currentView === 'cards'" class="songs-grid">
        <div 
          v-for="cancion in filteredCanciones" 
          :key="cancion.id"
          class="song-card"
          @click="goToSong(cancion)"
        >
          <div class="song-info">
            <h3 class="song-title">{{ cancion.title }}</h3>
            <p class="song-artist">{{ cancion.artist }}</p>
            <div class="song-meta">
              <span v-if="cancion.bpm" class="meta-bpm">{{ cancion.bpm }} BPM</span>
              <span v-if="cancion.tempo" class="meta-tempo">{{ cancion.tempo }}</span>
            </div>
            <div class="song-tags">
              <span v-for="tag in cancion.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
          
          <div class="song-actions" @click.stop>
            <button 
              v-if="canCreateLists"
              @click="handleAddToCollection(cancion)" 
              class="action-btn collection-btn" 
              title="Agregar a lista"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </button>
            <button 
              v-if="canEditSongs" 
              @click="handleEditSong(cancion)" 
              class="action-btn edit-btn" 
              title="Editar"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button 
              v-if="canDeleteSongs" 
              @click="handleDeleteSong(cancion)" 
              class="action-btn delete-btn" 
              title="Eliminar"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>


      <!-- Lista de Canciones - Vista de Tabla -->
      <div 
        v-if="filteredCanciones.length > 0 && currentView === 'table'" 
        :class="['songs-table-container', { resizing: isResizing }]"
      >
        <div class="table-wrapper">
          <table class="songs-table">
            <thead>
              <tr>
                <th 
                  v-if="visibleColumns.includes('title')" 
                  class="table-header resizable-header"
                  :style="{ width: columnWidths.title + 'px' }"
                >
                  <span class="header-content">
                    Título
                    <svg class="resize-icon" width="8" height="8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6h8M8 12h8M8 18h8"/>
                    </svg>
                  </span>
                  <div 
                    class="resize-handle"
                    @mousedown="(e) => startResize('title', e)"
                    @touchstart="(e) => startResize('title', e)"
                  ></div>
                </th>
                <th 
                  v-if="visibleColumns.includes('artist')" 
                  class="table-header resizable-header"
                  :style="{ width: columnWidths.artist + 'px' }"
                >
                  <span class="header-content">
                    Artista
                    <svg class="resize-icon" width="8" height="8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6h8M8 12h8M8 18h8"/>
                    </svg>
                  </span>
                  <div 
                    class="resize-handle"
                    @mousedown="(e) => startResize('artist', e)"
                    @touchstart="(e) => startResize('artist', e)"
                  ></div>
                </th>
                <th 
                  v-if="visibleColumns.includes('tags')" 
                  class="table-header resizable-header"
                  :style="{ width: columnWidths.tags + 'px' }"
                >
                  <span class="header-content">
                    Etiquetas
                    <svg class="resize-icon" width="8" height="8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6h8M8 12h8M8 18h8"/>
                    </svg>
                  </span>
                  <div 
                    class="resize-handle"
                    @mousedown="(e) => startResize('tags', e)"
                    @touchstart="(e) => startResize('tags', e)"
                  ></div>
                </th>
                <th 
                  v-if="visibleColumns.includes('bpm')" 
                  class="table-header resizable-header"
                  :style="{ width: columnWidths.bpm + 'px' }"
                >
                  <span class="header-content">
                    BPM
                    <svg class="resize-icon" width="8" height="8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6h8M8 12h8M8 18h8"/>
                    </svg>
                  </span>
                  <div 
                    class="resize-handle"
                    @mousedown="(e) => startResize('bpm', e)"
                    @touchstart="(e) => startResize('bpm', e)"
                  ></div>
                </th>
                <th 
                  v-if="visibleColumns.includes('tempo')" 
                  class="table-header resizable-header"
                  :style="{ width: columnWidths.tempo + 'px' }"
                >
                  <span class="header-content">
                    Tempo
                    <svg class="resize-icon" width="8" height="8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6h8M8 12h8M8 18h8"/>
                    </svg>
                  </span>
                  <div 
                    class="resize-handle"
                    @mousedown="(e) => startResize('tempo', e)"
                    @touchstart="(e) => startResize('tempo', e)"
                  ></div>
                </th>
                <th class="table-header actions-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="cancion in filteredCanciones" 
                :key="cancion.id"
                class="table-row"
              >
                <td 
                  v-if="visibleColumns.includes('title')" 
                  class="table-cell title-cell"
                  :style="{ width: columnWidths.title + 'px' }"
                >
                  <span 
                    class="song-title-text clickable-title" 
                    @click="goToSong(cancion)"
                  >
                    {{ cancion.title }}
                  </span>
                </td>
                <td 
                  v-if="visibleColumns.includes('artist')" 
                  class="table-cell artist-cell"
                  :style="{ width: columnWidths.artist + 'px' }"
                >
                  <span class="song-artist-text">{{ cancion.artist }}</span>
                </td>
                <td 
                  v-if="visibleColumns.includes('tags')" 
                  class="table-cell tags-cell"
                  :style="{ width: columnWidths.tags + 'px' }"
                >
                  <div class="table-tags">
                    <span v-for="tag in cancion.tags" :key="tag" class="table-tag">{{ tag }}</span>
                  </div>
                </td>
                <td 
                  v-if="visibleColumns.includes('bpm')" 
                  class="table-cell bpm-cell"
                  :style="{ width: columnWidths.bpm + 'px' }"
                >
                  <span class="bpm-text">{{ cancion.bpm || '-' }}</span>
                </td>
                <td 
                  v-if="visibleColumns.includes('tempo')" 
                  class="table-cell tempo-cell"
                  :style="{ width: columnWidths.tempo + 'px' }"
                >
                  <span class="tempo-text">{{ cancion.tempo || '-' }}</span>
                </td>
                <td class="table-cell actions-cell" @click.stop>
                  <button 
                    @click="toggleActionsMenu(cancion.id)" 
                    class="three-dots-btn"
                    title="Más acciones"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                    </svg>
                  </button>
                  
                  <!-- Menú desplegable de acciones -->
                  <div 
                    v-if="activeActionsMenu === cancion.id" 
                    class="actions-dropdown"
                    @click.stop
                  >
                    <button 
                      v-if="canCreateLists"
                      @click="handleAddToCollection(cancion)" 
                      class="dropdown-action"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                      </svg>
                      Agregar a lista
                    </button>
                    <button 
                      v-if="canEditSongs" 
                      @click="handleEditSong(cancion)" 
                      class="dropdown-action"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      Editar
                    </button>
                    <button 
                      v-if="canDeleteSongs" 
                      @click="handleDeleteSong(cancion)" 
                      class="dropdown-action delete"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Modales -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Eliminar canción"
      :message="`¿Estás seguro de que quieres eliminar la canción '${songToDelete?.title}'? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      @confirm="confirmDeleteSong"
      @cancel="cancelDeleteSong"
    />

    <!-- Modal de duplicado -->
    <ConfirmModal
      :show="showDuplicateModal"
      title="Canción duplicada detectada"
      :message="`Ya existe una canción con el título '${form.titulo}' y artista '${form.autor}'. ¿Estás seguro de que quieres ${isEditing ? 'actualizar' : 'agregar'} esta canción?`"
      :confirm-text="isEditing ? 'Actualizar' : 'Agregar'"
      cancel-text="Cancelar"
      @confirm="confirmDuplicate"
      @cancel="cancelDuplicate"
    />

    <!-- Modal para agregar a lista -->
    <Modal :show="showAddToCollectionModal" @close="closeAddToCollectionModal">
      <h3 class="text-lg font-bold text-blue-900 mb-4">
        Agregar "{{ songToAddToCollection?.title }}" a una lista
      </h3>
      <div class="space-y-4">
        <div class="max-h-96 overflow-y-auto space-y-2">
          <div 
            v-for="collection in availableCollections" 
            :key="collection.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div class="flex-1">
              <h4 class="font-medium text-gray-900">{{ collection.name }}</h4>
              <p class="text-sm text-gray-600">{{ collection.description || 'Sin descripción' }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {{ getTypeLabel(collection.type) }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ collection.songCount || 0 }} canciones
                </span>
              </div>
            </div>
            <button 
              @click="addSongToSelectedCollection(collection)"
              class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Agregar
            </button>
          </div>
        </div>

        <div v-if="availableCollections.length === 0" class="text-center text-gray-500 py-8">
          <p v-if="colecciones.length === 0">No tienes listas creadas</p>
          <p v-else>Esta canción ya está en todas tus listas</p>
          <button 
            v-if="colecciones.length === 0 ? canCreateLists : true"
            @click="goToCollections" 
            class="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            {{ colecciones.length === 0 ? 'Crear primera lista' : 'Ver listas' }}
          </button>
        </div>
      </div>
    </Modal>

    <Modal :show="showAddModal || showEditModal" @close="closeModal">
      <h3 class="text-lg font-bold text-blue-900 mb-4">
        {{ isEditing ? 'Editar canción' : 'Agregar nueva canción' }}
      </h3>
      <form @submit.prevent="handleFormSubmit" class="flex flex-col gap-3">
        <!-- Campos básicos -->
        <div class="space-y-3">
          <input
            v-model="form.titulo"
            type="text"
            placeholder="Título *"
            class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
            required
          />
          <input
            v-model="form.autor"
            type="text"
            placeholder="Artista"
            class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
          />
          <div class="relative">
            <textarea
              v-model="form.letra"
              placeholder="Letra"
              rows="4"
              class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base resize-none"
            ></textarea>
            <button
              type="button"
              @click="showLetraFull = true"
              class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
            >
              Pantalla completa
            </button>
          </div>
          <input
            v-model="form.tags"
            type="text"
            placeholder="Etiquetas (separadas por coma)"
            class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
          />
        </div>

        <!-- Botón para mostrar/ocultar más detalles -->
        <button
          type="button"
          @click="showAdvancedFields = !showAdvancedFields"
          class="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium py-2 border-t border-gray-200 mt-2"
        >
          <span>{{ showAdvancedFields ? 'Ocultar' : 'Mostrar' }} más detalles</span>
          <svg 
            :class="{ 'rotate-180': showAdvancedFields }"
            class="w-4 h-4 transition-transform duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        <!-- Campos avanzados -->
        <div v-if="showAdvancedFields" class="space-y-3 border-t border-gray-200 pt-3">
          <input
            v-model="form.subtitle"
            type="text"
            placeholder="Subtítulo"
            class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
          />
          <div class="flex flex-row gap-3">
            <!-- Tempo (Compás musical) -->
            <div class="flex flex-col flex-1">
              <label class="text-sm text-gray-600 mb-2 font-medium">Tempo (Compás)</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="form.tempoNumerator"
                  type="number"
                  placeholder="4"
                  min="1"
                  max="16"
                  class="w-16 px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base text-center"
                />
                <span class="text-gray-400 text-xl font-bold">/</span>
                <input
                  v-model.number="form.tempoDenominator"
                  type="number"
                  placeholder="4"
                  min="1"
                  max="16"
                  class="w-16 px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base text-center"
                />
              </div>
            </div>
            <!-- BPM -->
            <div class="flex flex-col flex-1">
              <label class="text-sm text-gray-600 mb-2 font-medium">BPM</label>
              <input
                v-model.number="form.bpm"
                type="number"
                placeholder="120"
                min="60"
                max="200"
                class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
              />
            </div>
          </div>
          <textarea
            v-model="form.description"
            placeholder="Descripción (opcional)"
            rows="2"
            class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base resize-none"
          ></textarea>
          
          <!-- Recursos de la canción -->
          <SongResourcesManager v-model="form.resources" />
        </div>

        <div class="flex gap-2 mt-2">
          <button
            type="submit"
            class="flex-1 bg-blue-900 text-white rounded py-2 font-semibold hover:bg-blue-800 transition"
          >
            {{ isEditing ? 'Actualizar' : 'Guardar' }}
          </button>
          <button
            type="button"
            @click="closeModal"
            class="flex-1 bg-gray-200 text-gray-700 rounded py-2 font-semibold hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>

    <!-- Overlay de edición de letra en pantalla completa -->
    <div
      v-if="showLetraFull"
      class="fixed inset-0 z-[1200] flex items-center justify-center bg-black bg-opacity-60"
    >
      <div
        class="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-1 sm:mx-2 p-2 sm:p-4 flex flex-col h-[90vh]"
      >
        <div class="flex justify-between items-center mb-1 sm:mb-2">
          <h4 class="text-lg font-bold text-blue-900">Editar letra</h4>
          <button
            @click="showLetraFull = false"
            class="text-gray-400 hover:text-red-500 text-2xl font-bold"
          >
            &times;
          </button>
        </div>
        <textarea
          v-model="form.letra"
          class="flex-1 w-full px-2 py-2 sm:px-3 rounded border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base resize-none mb-2 sm:mb-3"
          style="min-height: 160px; max-height: 100%"
        ></textarea>
        <div class="flex gap-1 sm:gap-2">
          <button
            @click="showLetraFull = false"
            class="flex-1 bg-blue-900 text-white rounded py-2 font-semibold hover:bg-blue-800 transition"
          >
            Guardar y volver
          </button>
          <button
            @click="showLetraFull = false"
            class="flex-1 bg-gray-200 text-gray-700 rounded py-2 font-semibold hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useCancionesStore } from "../stores/canciones";
import { useColeccionesStore } from "../stores/colecciones";
import { storeToRefs } from "pinia";
import { useNotifications } from '@/composables/useNotifications';
import { usePermissions } from '@/composables/usePermissions';
import Modal from "../components/Modal.vue";
import ConfirmModal from "../components/ConfirmModal.vue";
import SongResourcesManager from "../components/SongResourcesManager.vue";
import { Cancion, Collection, SongResource } from "@/types/songTypes";

const router = useRouter();
const cancionesStore = useCancionesStore();
const coleccionesStore = useColeccionesStore();
const { canciones, loading, error, artistas, tags } = storeToRefs(cancionesStore);
const { colecciones } = storeToRefs(coleccionesStore);
const { success, error: showError } = useNotifications();
const { canCreateSongs, canCreateLists, canEditSongs, canDeleteSongs } = usePermissions();

const searchQuery = ref("");
const selectedArtist = ref("");
const selectedTag = ref("");
const currentView = ref<'cards' | 'table'>('cards');
const activeActionsMenu = ref<string | null>(null);
const showColumnConfig = ref(false);

// Configuración de columnas
const availableColumns = [
  { key: 'title', label: 'Título' },
  { key: 'artist', label: 'Artista' },
  { key: 'tags', label: 'Etiquetas' },
  { key: 'bpm', label: 'BPM' },
  { key: 'tempo', label: 'Tempo' }
];

const visibleColumns = ref(['title', 'artist', 'tags', 'bpm']);

// Anchos de columnas configurables
const columnWidths = ref({
  title: 200,
  artist: 150,
  tags: 200,
  bpm: 80,
  tempo: 80
});

// Estado para el redimensionamiento
const isResizing = ref(false);
const resizingColumn = ref<string | null>(null);
const startX = ref(0);
const startWidth = ref(0);

const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showAddToCollectionModal = ref(false);
const showLetraFull = ref(false);
const showAdvancedFields = ref(false);
const showDuplicateModal = ref(false);
const songToDelete = ref<Cancion | null>(null);
const songToAddToCollection = ref<Cancion | null>(null);
const editingSong = ref<Cancion | null>(null);
const duplicateSong = ref<Cancion | null>(null);
const isDuplicateCheck = ref(false);

const form = ref({
  titulo: "",
  autor: "",
  letra: "",
  tags: "",
  subtitle: "",
  tempoNumerator: null,
  tempoDenominator: null,
  bpm: null,
  description: "",
  resources: [] as SongResource[],
});

// Computed properties
const isEditing = computed(() => showEditModal.value);

const filteredCanciones = computed(() => 
  cancionesStore.filterCanciones(
    searchQuery.value,
    selectedArtist.value,
    selectedTag.value
  )
);

const hasActiveFilters = computed(() => {
  return searchQuery.value || selectedArtist.value || selectedTag.value;
});

// Función para normalizar texto (remover acentos y caracteres especiales)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^\w\s]/g, '') // Remover caracteres especiales excepto espacios
    .replace(/\s+/g, ' '); // Normalizar espacios múltiples
}

// Función para verificar si existe una canción duplicada
function checkForDuplicate(title: string, artist: string, excludeId?: string): Cancion | null {
  const normalizedTitle = normalizeText(title);
  const normalizedArtist = normalizeText(artist);
  
  return canciones.value.find(cancion => {
    if (excludeId && cancion.id === excludeId) return false;
    
    const existingTitle = normalizeText(cancion.title || '');
    const existingArtist = normalizeText(cancion.artist || '');
    
    return existingTitle === normalizedTitle && existingArtist === normalizedArtist;
  }) || null;
}

// Computed para colecciones disponibles (que no contengan la canción seleccionada)
const availableCollections = ref<Collection[]>([]);

// Función para cargar colecciones disponibles
async function loadAvailableCollections() {
  if (!songToAddToCollection.value) {
    availableCollections.value = [];
    return;
  }

  const collections = [];
  const songId = parseInt(songToAddToCollection.value.id);
  
  for (const collection of colecciones.value) {
    const isInCollection = await coleccionesStore.isSongInCollection(collection.id, songId);
    if (!isInCollection) {
      collections.push(collection);
    }
  }
  availableCollections.value = collections;
}

// Cargar canciones y colecciones al montar el componente
onMounted(async () => {
  await cancionesStore.loadCanciones();
  await coleccionesStore.loadColecciones();
  
  // Cargar anchos de columnas guardados
  loadColumnWidths();
  
  // Agregar event listener para cerrar menú de acciones
  document.addEventListener('click', closeActionsMenu);
});

// Limpiar event listener al desmontar
onUnmounted(() => {
  document.removeEventListener('click', closeActionsMenu);
});

function closeModal() {
  showAddModal.value = false;
  showEditModal.value = false;
  showAdvancedFields.value = false;
  showLetraFull.value = false;
  showDuplicateModal.value = false;
  editingSong.value = null;
  duplicateSong.value = null;
  isDuplicateCheck.value = false;
  form.value = { 
    titulo: "", 
    autor: "", 
    letra: "", 
    tags: "",
    subtitle: "",
    tempoNumerator: null,
    tempoDenominator: null,
    bpm: null,
    description: "",
    resources: []
  };
}

function handleFormSubmit() {
  if (isDuplicateCheck.value) {
    // Si estamos en el modal de duplicado, proceder con la acción
    if (isEditing.value) {
      updateCancion();
    } else {
      agregarCancion();
    }
    return;
  }

  // Verificar duplicados antes de proceder
  const duplicate = checkForDuplicate(
    form.value.titulo.trim(), 
    form.value.autor.trim(),
    isEditing.value ? editingSong.value?.id : undefined
  );

  if (duplicate) {
    duplicateSong.value = duplicate;
    showDuplicateModal.value = true;
    return;
  }

  // No hay duplicados, proceder normalmente
  if (isEditing.value) {
    updateCancion();
  } else {
    agregarCancion();
  }
}

function goToSong(cancion: Cancion) {
  router.push(`/cancion/${cancion.id}-${(cancion.title || 'sin-titulo')
    .toLowerCase()
    .replace(/ /g, '-')}`);
}

function clearFilters() {
  searchQuery.value = "";
  selectedArtist.value = "";
  selectedTag.value = "";
}

// Función para manejar Enter en el buscador móvil
function handleSearchEnter(event: KeyboardEvent) {
  // Prevenir el comportamiento por defecto
  event.preventDefault();
  
  // Quitar el foco del input para ocultar el teclado
  const input = event.target as HTMLInputElement;
  if (input) {
    input.blur();
  }
}

// Función para manejar blur (cuando se pierde el foco)
function handleSearchBlur() {
  // Esta función se ejecuta cuando el input pierde el foco
  // El teclado se oculta automáticamente
}


function retryLoad() {
  cancionesStore.loadCanciones();
}

async function agregarCancion() {
  if (!form.value.titulo.trim()) {
    showError('Error', 'El título de la canción es obligatorio');
    return;
  }

  try {
    let tempo = null;
    if (form.value.tempoNumerator && form.value.tempoDenominator) {
      tempo = `${form.value.tempoNumerator}/${form.value.tempoDenominator}`;
    }

    const newSong = {
      title: form.value.titulo.trim(),
      artist: form.value.autor.trim(),
      subtitle: form.value.subtitle.trim() || null,
      tempo: tempo,
      bpm: form.value.bpm || null,
      tags: form.value.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      resources: form.value.resources.filter(r => r.url.trim()),
    };

    const createdSong = await cancionesStore.addCancion(newSong);
    
    if (createdSong && form.value.letra.trim()) {
      try {
        await cancionesStore.createSongLyrics(
          createdSong.id, 
          form.value.letra.trim(),
          form.value.description.trim() || `Letra de ${createdSong.title}`
        );
      } catch (lyricsErr) {
        console.error('Error al crear la letra:', lyricsErr);
        showError('Error', 'Canción creada pero no se pudo guardar la letra');
      }
    }
    
    success('Éxito', `Canción "${createdSong.title}" agregada correctamente`);
    isDuplicateCheck.value = false;
    closeModal();
  } catch (err) {
    console.error('Error al agregar canción:', err);
    showError('Error', 'No se pudo agregar la canción. Inténtalo de nuevo.');
  }
}

function handleEditSong(cancion: Cancion) {
  handleActionClick();
  editingSong.value = cancion;
  showEditModal.value = true;
  
  form.value = {
    titulo: cancion.title || "",
    autor: cancion.artist || "",
    letra: "",
    tags: cancion.tags ? cancion.tags.join(", ") : "",
    subtitle: cancion.subtitle || "",
    tempoNumerator: cancion.tempo ? parseInt(cancion.tempo.split('/')[0]) : null,
    tempoDenominator: cancion.tempo ? parseInt(cancion.tempo.split('/')[1]) : null,
    bpm: cancion.bpm,
    description: "",
    resources: cancion.resources || []
  };
  
  loadSongLyrics(cancion.id);
}

async function loadSongLyrics(songId: string) {
  try {
    const lyrics = await cancionesStore.getSongLyrics(songId);
    if (lyrics) {
      form.value.letra = lyrics;
    }
  } catch (err) {
    console.error('Error loading lyrics:', err);
  }
}

async function updateCancion() {
  if (!form.value.titulo.trim() || !editingSong.value) {
    showError('Error', 'El título de la canción es obligatorio');
    return;
  }

  try {
    let tempo = null;
    if (form.value.tempoNumerator && form.value.tempoDenominator) {
      tempo = `${form.value.tempoNumerator}/${form.value.tempoDenominator}`;
    }

    const updates = {
      title: form.value.titulo.trim(),
      artist: form.value.autor.trim(),
      subtitle: form.value.subtitle.trim() || null,
      tempo: tempo,
      bpm: form.value.bpm || null,
      tags: form.value.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      resources: form.value.resources.filter(r => r.url.trim()),
    };

    await cancionesStore.updateCancion(editingSong.value.id, updates);
    
    if (form.value.letra.trim()) {
      try {
        await cancionesStore.createSongLyrics(
          editingSong.value.id, 
          form.value.letra.trim(),
          form.value.description.trim() || `Letra de ${updates.title}`
        );
      } catch (lyricsErr) {
        console.error('Error al actualizar la letra:', lyricsErr);
        showError('Error', 'Canción actualizada pero no se pudo guardar la letra');
      }
    }
    
    success('Éxito', `Canción "${updates.title}" actualizada correctamente`);
    isDuplicateCheck.value = false;
    closeModal();
  } catch (err) {
    console.error('Error al actualizar canción:', err);
    showError('Error', 'No se pudo actualizar la canción. Inténtalo de nuevo.');
  }
}

function handleDeleteSong(cancion: Cancion) {
  handleActionClick();
  songToDelete.value = cancion;
  showDeleteModal.value = true;
}

function cancelDeleteSong() {
  songToDelete.value = null;
  showDeleteModal.value = false;
}

async function confirmDeleteSong() {
  if (!songToDelete.value) return;

  try {
    await cancionesStore.deleteCancion(songToDelete.value.id);
    success('Éxito', `Canción "${songToDelete.value.title}" eliminada correctamente`);
    cancelDeleteSong();
  } catch (err) {
    console.error('Error al eliminar canción:', err);
    showError('Error', 'No se pudo eliminar la canción. Inténtalo de nuevo.');
  }
}

// Funciones para agregar a lista
async function handleAddToCollection(cancion: Cancion) {
  handleActionClick();
  songToAddToCollection.value = cancion;
  showAddToCollectionModal.value = true;
  await loadAvailableCollections();
}

function closeAddToCollectionModal() {
  showAddToCollectionModal.value = false;
  songToAddToCollection.value = null;
}

async function addSongToSelectedCollection(collection: Collection) {
  if (!songToAddToCollection.value) return;

  try {
    const songId = parseInt(songToAddToCollection.value.id);
    await coleccionesStore.addSongToCollection(collection.id, songId);
    success('Éxito', `"${songToAddToCollection.value.title}" agregada a "${collection.name}"`);
    closeAddToCollectionModal();
  } catch (err) {
    console.error('Error adding song to collection:', err);
    showError('Error', 'No se pudo agregar la canción a la lista');
  }
}

function goToCollections() {
  closeAddToCollectionModal();
  router.push('/colecciones');
}

function getTypeLabel(type?: string): string {
  const labels = {
    'playlist': 'Playlist',
    'album': 'Álbum',
    'favorites': 'Favoritos',
    'custom': 'Personalizada'
  };
  return labels[type as keyof typeof labels] || type || '';
}

// Funciones para manejar duplicados
function confirmDuplicate() {
  isDuplicateCheck.value = true;
  showDuplicateModal.value = false;
  // Re-ejecutar el submit
  handleFormSubmit();
}

function cancelDuplicate() {
  showDuplicateModal.value = false;
  duplicateSong.value = null;
  isDuplicateCheck.value = false;
}

// Función para manejar el menú de acciones
function toggleActionsMenu(songId: string) {
  if (activeActionsMenu.value === songId) {
    activeActionsMenu.value = null;
  } else {
    activeActionsMenu.value = songId;
  }
}

// Cerrar menú de acciones al hacer click fuera
function closeActionsMenu() {
  activeActionsMenu.value = null;
}

// Cerrar menú al hacer click en cualquier acción
function handleActionClick() {
  activeActionsMenu.value = null;
}

// Función para restablecer columnas
function resetColumns() {
  visibleColumns.value = ['title', 'artist', 'tags', 'bpm'];
  resetColumnWidths();
}

// Función para restablecer anchos de columnas
function resetColumnWidths() {
  columnWidths.value = {
    title: 200,
    artist: 150,
    tags: 200,
    bpm: 80,
    tempo: 80
  };
  saveColumnWidths();
}

// Función para cargar anchos de columnas desde localStorage
function loadColumnWidths() {
  const saved = localStorage.getItem('song-table-column-widths');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      columnWidths.value = { ...columnWidths.value, ...parsed };
    } catch (e) {
      console.warn('Error loading column widths:', e);
    }
  }
}

// Función para guardar anchos de columnas en localStorage
function saveColumnWidths() {
  localStorage.setItem('song-table-column-widths', JSON.stringify(columnWidths.value));
}

// Funciones para redimensionamiento de columnas
function startResize(column: string, event: MouseEvent | TouchEvent) {
  event.preventDefault();
  event.stopPropagation();
  
  console.log('Starting resize for column:', column); // Debug
  
  isResizing.value = true;
  resizingColumn.value = column;
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
  startX.value = clientX;
  startWidth.value = columnWidths.value[column as keyof typeof columnWidths.value];
  
  console.log('Start values:', { clientX, startWidth: startWidth.value }); // Debug
  
  // Agregar listeners globales
  document.addEventListener('mousemove', handleResize, { passive: false });
  document.addEventListener('mouseup', stopResize);
  document.addEventListener('touchmove', handleResize, { passive: false });
  document.addEventListener('touchend', stopResize);
  
  // Prevenir selección de texto
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';
}

function handleResize(event: MouseEvent | TouchEvent) {
  if (!isResizing.value || !resizingColumn.value) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
  const deltaX = clientX - startX.value;
  const newWidth = Math.max(80, startWidth.value + deltaX); // Mínimo 80px
  
  console.log('Resizing:', { clientX, deltaX, newWidth }); // Debug
  
  // Actualizar el ancho de la columna
  columnWidths.value = {
    ...columnWidths.value,
    [resizingColumn.value]: newWidth
  };
}

function stopResize() {
  if (isResizing.value) {
    console.log('Stopping resize'); // Debug
    
    isResizing.value = false;
    resizingColumn.value = null;
    saveColumnWidths();
    
    // Remover listeners globales
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('touchmove', handleResize);
    document.removeEventListener('touchend', stopResize);
    
    // Restaurar estilos del body
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }
}
</script>

<style scoped>
.songs-container {
  min-height: 100vh;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}

/* Header */
.songs-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 90;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e3a8a;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* Toggle de vistas */
.view-toggle {
  display: flex;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}

.view-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.view-btn.active {
  background: white;
  color: #1e3a8a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Botón de configuración */
.config-btn {
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.config-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.add-btn {
  background: #fbbf24;
  color: #1e3a8a;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-btn:hover {
  background: #f59e0b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}

/* Panel de configuración de columnas */
.column-config-panel {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.config-content {
  max-width: none;
  margin: 0;
}

.config-content h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.column-options {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.column-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
}

.column-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #1e3a8a;
  cursor: pointer;
}

.column-label {
  user-select: none;
}

.config-actions {
  display: flex;
  gap: 0.75rem;
}

.reset-btn, .close-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #d1d5db;
}

.reset-btn {
  background: #f3f4f6;
  color: #374151;
}

.reset-btn:hover {
  background: #e5e7eb;
}

.close-btn {
  background: #1e3a8a;
  color: white;
  border-color: #1e3a8a;
}

.close-btn:hover {
  background: #1e40af;
  border-color: #1e40af;
}

/* Search Section */
.search-section {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
}

/* Sticky Search Mobile */
.sticky-search-mobile {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.sticky-search-mobile .search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.sticky-search-mobile .search-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #f9fafb;
  transition: all 0.2s ease;
}

.sticky-search-mobile .search-icon {
  position: absolute;
  left: 0.75rem;
  color: #6b7280;
  z-index: 1;
}

.sticky-search-mobile .search-input:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.sticky-search-mobile .search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}


/* Filtros móviles */
.mobile-filters {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 0.75rem;
}

.mobile-filters .filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.85rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 120px;
}

.mobile-filters .filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.mobile-filters .clear-filters {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #6b7280;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.mobile-filters .clear-filters:hover {
  background: #e5e7eb;
  color: #374151;
}


/* Desktop only search */
.desktop-only {
  display: block;
}

.search-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #6b7280;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  background: #f9fafb;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-search {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-search:hover {
  color: #374151;
  background: #f3f4f6;
}

.filters-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 150px;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-filters {
  background: none;
  border: 1px solid #d1d5db;
  color: #6b7280;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-filters:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Main Content */
.songs-main {
  flex: 1;
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Para vista de tabla, usar todo el ancho */
.songs-main:has(.songs-table-container) {
  max-width: none;
  padding: 0;
}

/* States */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #fbbf24;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon, .empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error h3, .empty h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.error p, .empty p {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}

.retry-btn, .add-first-btn {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover, .add-first-btn:hover {
  background: #1e40af;
  transform: translateY(-1px);
}

/* Songs Counter */
.songs-counter {
  margin-bottom: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.counter-text {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  background: #f9fafb;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  display: inline-block;
}

/* Songs Grid */
.songs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}


.three-dots-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
}

.three-dots-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.actions-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 50;
  min-width: 180px;
  padding: 0.25rem 0;
  margin-top: 0.25rem;
}

.dropdown-action {
  width: 100%;
  background: none;
  border: none;
  padding: 0.5rem 0.75rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
}

.dropdown-action:hover {
  background: #f9fafb;
  color: #1f2937;
}

.dropdown-action.delete:hover {
  background: #fef2f2;
  color: #dc2626;
}

/* Vista de Tabla */
.songs-table-container {
  background: white;
  border-radius: 0;
  border: none;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: none;
  margin: 0;
}

.table-wrapper {
  overflow-x: auto;
}

.songs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  table-layout: fixed;
}

.table-header {
  background: #f9fafb;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
  position: relative;
}

.resizable-header {
  user-select: none;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 6px;
  height: 100%;
}

.resize-icon {
  color: #d1d5db;
  opacity: 0.4;
  transition: all 0.2s ease;
  width: 8px;
  height: 8px;
  flex-shrink: 0;
}

.resizable-header:hover .resize-icon {
  opacity: 0.7;
  color: #9ca3af;
}

.table-header:first-child {
  border-top-left-radius: 0;
}

.table-header:last-child {
  border-top-right-radius: 0;
}

.actions-header {
  text-align: center;
  width: 80px;
}

.table-row {
  transition: all 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
}

.table-row:hover {
  background: #f9fafb;
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.title-cell {
  font-weight: 600;
  color: #1e3a8a;
}

.artist-cell {
  color: #fbbf24;
  font-weight: 500;
}

/* .tags-cell sin min-width para permitir redimensionamiento */

.table-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.table-tag {
  background: #fbbf24;
  color: #1e3a8a;
  padding: 0.125rem 0.375rem;
  border-radius: 8px;
  font-size: 0.6875rem;
  font-weight: 500;
  white-space: nowrap;
}

.bpm-cell, .tempo-cell {
  text-align: center;
  color: #6b7280;
  font-weight: 500;
}

.actions-cell {
  text-align: center;
  width: 80px;
  position: relative;
}

.song-title-text, .song-artist-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 100%;
}

.clickable-title {
  cursor: pointer;
  transition: color 0.2s ease;
  border-radius: 4px;
  padding: 2px 4px;
  margin: -2px -4px;
}

.clickable-title:hover {
  color: #1e40af;
  background: #f0f9ff;
}

/* Handle de redimensionamiento */
.resize-handle {
  position: absolute;
  top: 0;
  right: -1px;
  width: 3px;
  height: 100%;
  background: #f3f4f6;
  cursor: col-resize;
  z-index: 10;
  transition: all 0.2s ease;
  border-radius: 1px;
}

.resize-handle:hover {
  background: #d1d5db;
  width: 4px;
  right: -1.5px;
}

.resize-handle:active {
  background: #9ca3af;
  width: 5px;
  right: -2px;
}

/* Indicador visual durante el redimensionamiento */
.songs-table-container.resizing {
  cursor: col-resize;
  user-select: none;
}

.songs-table-container.resizing * {
  pointer-events: none;
}

.songs-table-container.resizing .resize-handle {
  pointer-events: auto;
}

.song-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.song-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e3a8a;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.song-artist {
  font-size: 0.9rem;
  color: #fbbf24;
  margin: 0 0 0.75rem 0;
  font-weight: 500;
}

.song-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.meta-bpm, .meta-tempo {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.song-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.tag {
  background: #fbbf24;
  color: #1e3a8a;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.song-actions {
  display: flex;
  gap: 0.25rem;
  margin-left: 0.75rem;
  flex-shrink: 0;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collection-btn {
  color: #6b7280;
}

.collection-btn:hover {
  background: #f0f9ff;
  color: #0ea5e9;
}

.edit-btn {
  color: #6b7280;
}

.edit-btn:hover {
  background: #f3f4f6;
  color: #3b82f6;
}

.delete-btn {
  color: #6b7280;
}

.delete-btn:hover {
  background: #fef2f2;
  color: #dc2626;
}

/* Responsive */
@media (max-width: 768px) {
  .songs-header {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .add-btn {
    justify-content: center;
  }
  
  /* Mostrar búsqueda sticky en móviles */
  .sticky-search-mobile {
    display: block;
  }
  
  /* Ocultar búsqueda desktop en móviles */
  .desktop-only {
    display: none;
  }
  
  .songs-main {
    padding: 1rem;
  }

  /* Para vista de tabla en móviles */
  .songs-main:has(.songs-table-container) {
    padding: 0;
  }

  .songs-table-container {
    margin: 0;
  }
  
  .songs-counter {
    margin-bottom: 0.75rem;
    padding: 0.375rem 0;
  }
  
  .counter-text {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
  }
  
  .songs-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .song-card {
    padding: 1rem;
  }

  .actions-dropdown {
    min-width: 160px;
  }

  /* Panel de configuración en móviles */
  .column-config-panel {
    padding: 0.75rem 1rem;
  }

  .column-options {
    gap: 1rem;
  }

  .config-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .reset-btn, .close-btn {
    width: 100%;
    justify-content: center;
  }

  /* Tabla en móviles */
  .songs-table {
    font-size: 0.8125rem;
  }

  .table-header, .table-cell {
    padding: 0.5rem 0.75rem;
  }

  .title-cell {
    min-width: 150px;
  }

  .artist-cell {
    min-width: 120px;
  }

  .tags-cell {
    min-width: 150px;
  }

  .bpm-cell, .tempo-cell {
    min-width: 60px;
  }

  /* Handles más grandes para touch en móviles */
  .resize-handle {
    width: 6px;
    right: -2px;
    background: #e5e7eb;
  }

  .resize-handle:hover {
    background: #d1d5db;
    width: 8px;
    right: -3px;
  }

  .resize-handle:active {
    background: #9ca3af;
    width: 10px;
    right: -4px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.25rem;
  }
  
  .song-title {
    font-size: 1rem;
  }
  
  .song-artist {
    font-size: 0.85rem;
  }
}
</style>