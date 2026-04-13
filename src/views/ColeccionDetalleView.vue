<template>
  <div class="collection-detail-container">
    <!-- Header -->
    <header class="collection-header">
      <div class="header-content">
        <BackButton />
        <h1 class="collection-title">{{ isShowingCurrentCollection ? collectionTitle : 'Cargando...' }}</h1>
        <div v-if="isShowingCurrentCollection && collection?.id" class="header-actions">
          <div class="actions-menu">
            <button
              @click="toggleCollectionOptionsMenu"
              class="menu-toggle"
              :class="{ active: showCollectionOptionsMenu }"
              title="Opciones de la lista"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
            </button>
            <div v-if="showCollectionOptionsMenu" class="actions-dropdown">
              <button @click="refreshDataFromMenu" class="action-item">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Recargar lista
              </button>
              <button
                @click="goToSharedViewFromMenu"
                class="action-item"
                :disabled="sharingView"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                {{ sharingView ? 'Generando...' : 'Vista compartida' }}
              </button>
              <button @click="openListConfigFromMenu" class="action-item">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Configuración
              </button>
              <template v-if="canCreateLists">
                <hr class="divider">
                <button @click="openSectionsFromMenu" class="action-item">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                  </svg>
                  Gestionar secciones
                </button>
                <button @click="openAddSongsFromMenu" class="action-item">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 5v14m7-7H5"/>
                  </svg>
                  Añadir canciones
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div v-if="showTitleBelowHeader && !loading && !error && collectionSongs.length > 0" class="collection-title-below-header">
      <h2 class="collection-title-below-header-text">{{ collectionTitle }}</h2>
    </div>

    <!-- Main Content -->
    <main class="collection-main">
      <!-- States: loader cuando se está cargando o cuando la colección cargada no es la de la ruta -->
      <div v-if="showLoadingState" class="state-container">
        <div class="loading-spinner"></div>
        <p>Cargando canciones...</p>
      </div>
      
      <div v-else-if="error" class="state-container error">
        <div class="error-icon">⚠️</div>
        <h3>Error al cargar canciones</h3>
        <p>{{ error }}</p>
        <button @click="retryLoad" class="retry-btn">Reintentar</button>
      </div>
      
      <div v-else-if="collectionSongs.length === 0" class="state-container empty">
        <div class="empty-icon">🎵</div>
        <h3>No hay canciones en esta lista</h3>
        <p v-if="canCreateLists">Agrega canciones para comenzar</p>
        <p v-else>La lista está vacía.</p>
        <button v-if="canCreateLists" @click="openAddSongsModal" class="add-first-btn">
          Agregar primera canción
        </button>
      </div>
      
      <!-- Lista editable (solo administradores / con permiso de crear listas): reordenar, editar, quitar -->
      <div v-else-if="canCreateLists" class="songs-list">
        <div
          v-for="(section, sectionIdx) in sectionsStore.sectionsWithSongs"
          :key="section.id"
          class="section-container"
        >
          <SectionHeader
            :section="section"
            :show-reorder-controls="sectionsStore.sectionsWithSongs.length > 1"
            :can-move-up="sectionIdx > 0"
            :can-move-down="sectionIdx < sectionsStore.sectionsWithSongs.length - 1"
            :reorder-busy="sectionReorderBusy"
            @move-up="handleMoveSectionUp(sectionIdx)"
            @move-down="handleMoveSectionDown(sectionIdx)"
          />
          
          <div class="section-songs" :ref="(el) => setSongsListRef(el, section.id)" :data-section-id="section.id">
            <div
              v-for="song in section.songs"
              :key="song.collection_song_id"
              class="song-item"
              @click="goToSong(song)"
            >
          <div class="drag-handle" @click.stop>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 6h8M8 12h8M8 18h8"/>
            </svg>
          </div>
          <div class="song-info">
            <div class="song-main-content">
              <div v-if="effectiveVisibleFields.includes('title')" class="column-title">
                <h3 class="song-title">{{ song.title }}</h3>
              </div>
              <div v-if="effectiveVisibleFields.includes('artist')" class="column-artist">
                <p class="song-artist">{{ song.artist }}</p>
              </div>
              <div v-if="effectiveVisibleFields.includes('tags')" class="column-tags">
                <div class="song-tags">
                  <KeyBadge v-if="getSongKey(song.id)" :key-value="getSongKey(song.id)!" size="sm" />
                  <span v-for="tag in removeKeyTagFromTags(song.tags || [])" :key="tag" class="tag">{{ tag }}</span>
                  <span 
                    v-for="tag in getPersonalTagsForSong(song.id).filter(t => !t.startsWith('key:'))" 
                    :key="`personal-${tag}`" 
                    class="tag tag-personal"
                  >{{ tag }}</span>
                </div>
              </div>
              <div v-if="effectiveVisibleFields.includes('list_tags')" class="column-list-tags">
                <div v-if="song.list_tags && song.list_tags.length > 0" class="list-tags">
                  <span v-for="listTag in song.list_tags" :key="listTag" class="list-tag">{{ listTag }}</span>
                </div>
              </div>
            </div>
            <div v-if="(effectiveVisibleFields.includes('bpm') && song.bpm) || (effectiveVisibleFields.includes('tempo') && song.tempo)" class="column-meta">
              <div class="song-meta">
                <span v-if="effectiveVisibleFields.includes('bpm') && song.bpm" class="meta-item">BPM: {{ song.bpm }}</span>
                <span v-if="effectiveVisibleFields.includes('tempo') && song.tempo" class="meta-item">{{ song.tempo }}</span>
              </div>
            </div>
            <div v-if="effectiveVisibleFields.includes('notes') && song.notes && song.notes.trim()" class="song-notes">
              <div class="notes-content">{{ song.notes }}</div>
            </div>
          </div>
          <div class="song-actions" @click.stop>
            <button 
              @click="openEditListTagsModal(song)" 
              class="action-btn edit-tags-btn" 
              title="Editar etiquetas de lista"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
            </button>
            <button 
              @click="removeSongFromCollection(song)" 
              class="action-btn remove-btn" 
              title="Quitar de lista"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
            </div>
          </div>
        </div>
        
        <div v-if="sectionsStore.unassignedSongs.length > 0" class="unassigned-section">
          <div class="unassigned-header">
            <h3 class="unassigned-title">Sin clasificar ({{ sectionsStore.unassignedSongs.length }})</h3>
          </div>
          <div class="section-songs unassigned-songs" :ref="(el) => setSongsListRef(el, 'unassigned')" data-section-id="unassigned">
            <div
              v-for="song in sectionsStore.unassignedSongs"
              :key="song.collection_song_id"
              class="song-item"
              @click="goToSong(song)"
            >
              <div class="drag-handle" @click.stop>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M8 6h8M8 12h8M8 18h8"/>
                </svg>
              </div>
              <div class="song-info">
                <div class="song-main-content">
                  <div v-if="effectiveVisibleFields.includes('title')" class="column-title">
                    <h3 class="song-title">{{ song.title }}</h3>
                  </div>
                  <div v-if="effectiveVisibleFields.includes('artist')" class="column-artist">
                    <p class="song-artist">{{ song.artist }}</p>
                  </div>
                  <div v-if="effectiveVisibleFields.includes('tags')" class="column-tags">
                    <div class="song-tags">
                  <KeyBadge v-if="getSongKey(song.id)" :key-value="getSongKey(song.id)!" size="sm" />
                  <span v-for="tag in removeKeyTagFromTags(song.tags || [])" :key="tag" class="tag">{{ tag }}</span>
                  <span 
                    v-for="tag in getPersonalTagsForSong(song.id).filter(t => !t.startsWith('key:'))" 
                    :key="`personal-${tag}`" 
                    class="tag tag-personal"
                  >{{ tag }}</span>
                </div>
                  </div>
                  <div v-if="effectiveVisibleFields.includes('list_tags')" class="column-list-tags">
                    <div v-if="song.list_tags && song.list_tags.length > 0" class="list-tags">
                      <span v-for="listTag in song.list_tags" :key="listTag" class="list-tag">{{ listTag }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="(effectiveVisibleFields.includes('bpm') && song.bpm) || (effectiveVisibleFields.includes('tempo') && song.tempo)" class="column-meta">
                  <div class="song-meta">
                    <span v-if="effectiveVisibleFields.includes('bpm') && song.bpm" class="meta-item">BPM: {{ song.bpm }}</span>
                    <span v-if="effectiveVisibleFields.includes('tempo') && song.tempo" class="meta-item">{{ song.tempo }}</span>
                  </div>
                </div>
                <div v-if="effectiveVisibleFields.includes('notes') && song.notes && song.notes.trim()" class="song-notes">
                  <div class="notes-content">{{ song.notes }}</div>
                </div>
              </div>
              <div class="song-actions" @click.stop>
                <button 
                  @click="openEditListTagsModal(song)" 
                  class="action-btn edit-tags-btn" 
                  title="Editar etiquetas de lista"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                  </svg>
                </button>
                <button 
                  @click="removeSongFromCollection(song)" 
                  class="action-btn remove-btn" 
                  title="Quitar de lista"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista minimalista (solo lectura) para usuarios sin permiso de edición -->
      <div v-else class="songs-list readonly-list-wrapper">
        <CollectionSongsListReadOnly
          :sections-with-songs="sectionsStore.sectionsWithSongs"
          :unassigned-songs="sectionsStore.unassignedSongs"
          :visible-fields="effectiveVisibleFields"
          :column-widths="effectiveColumnWidths"
          :get-song-key="getSongKey"
          :get-personal-tags-for-song="getPersonalTagsForSong"
          :remove-key-tag-from-tags="removeKeyTagFromTags"
          @go-to-song="goToSong"
        />
      </div>
    </main>

    <!-- Add Songs Modal -->
    <Modal :show="showAddSongs" @close="closeAddSongsModal">
      <div class="add-songs-modal">
        <h3 class="modal-title">Agregar canciones a "{{ collectionTitle }}"</h3>
        <div class="modal-body">
          <!-- Search in all songs -->
          <div class="search-container">
            <input
              v-model="songSearchQuery"
              type="text"
              placeholder="Buscar canciones para agregar..."
              class="search-input"
            />
            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>

          <!-- Available songs list: altura fija para que el modal no cambie de tamaño -->
          <div class="songs-list add-songs-list-fixed">
            <template v-if="filteredAvailableSongs.length === 0">
              <div class="empty-state">
                <p>No hay canciones disponibles para agregar</p>
              </div>
            </template>
            <template v-else>
              <div 
                v-for="song in filteredAvailableSongs" 
                :key="song.id"
                class="song-entry"
                :class="{ 'song-entry--adding': addingSongIds.has(String(song.id)) }"
              >
                <div class="song-entry-info">
                  <h4 class="song-entry-title">{{ song.title }}</h4>
                  <p class="song-entry-artist">{{ song.artist }}</p>
                </div>
                <button 
                  @click="addSongToCollection(song)"
                  class="add-button"
                  :disabled="addingSongIds.has(String(song.id))"
                >
                  {{ addingSongIds.has(String(song.id)) ? 'Agregando…' : 'Agregar' }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Modal para editar etiquetas de lista y notas -->
    <Modal :show="showEditListTagsModal" @close="closeEditListTagsModal">
      <h3 class="text-lg font-bold text-blue-900 mb-4">
        Etiquetas y notas para "{{ songToEditTags?.title }}"
      </h3>
      <div class="space-y-4">
        <!-- Etiquetas actuales -->
        <div v-if="currentListTags.length > 0">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Etiquetas actuales:</h4>
          <div class="flex flex-wrap gap-2 mb-3">
            <span 
              v-for="tag in currentListTags" 
              :key="tag" 
              class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {{ tag }}
              <button 
                @click="removeListTag(tag)"
                class="text-yellow-600 hover:text-yellow-800 ml-1"
              >
                ×
              </button>
            </span>
          </div>
        </div>

        <!-- Agregar nueva etiqueta -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">Agregar nueva etiqueta:</h4>
          <div class="flex gap-2">
            <input
              v-model="newListTag"
              type="text"
              placeholder="Ej: C, D, E, F, G, A, B, Cm, Dm, Em..."
              class="w-48 px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
              @keyup.enter="addListTag"
            />
            <button 
              @click="addListTag"
              :disabled="!newListTag.trim()"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Agregar
            </button>
          </div>
        </div>

        <!-- Etiquetas sugeridas -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">Etiquetas sugeridas:</h4>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="suggestedTag in suggestedListTags"
              :key="suggestedTag"
              @click="addSuggestedTag(suggestedTag)"
              :disabled="currentListTags.includes(suggestedTag)"
              class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ suggestedTag }}
            </button>
          </div>
        </div>

        <!-- Campo de notas -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">Notas adicionales:</h4>
          <textarea
            v-model="currentNotes"
            placeholder="Agrega notas, instrucciones, comentarios o recordatorios para esta canción en esta lista..."
            rows="2"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base resize-none"
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">
            Estas notas solo se mostrarán en esta lista específica
          </p>
        </div>

        <div class="flex gap-2 mt-4">
          <button
            @click="saveListTags"
            class="flex-1 bg-blue-900 text-white rounded py-2 font-semibold hover:bg-blue-800 transition"
          >
            Guardar
          </button>
          <button
            @click="closeEditListTagsModal"
            class="flex-1 bg-gray-200 text-gray-700 rounded py-2 font-semibold hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>

    <!-- Modal: Configuración unificada (7 filas: visible + ancho). Sin opacar el fondo; cambios en vivo. -->
    <Modal :show="showListConfigModal" :transparent-overlay="true" @close="closeListConfigModal">
      <div class="list-config-modal">
        <h3 class="list-config-modal-title">Configuración de la lista</h3>
        <p class="list-config-modal-hint">Los cambios se aplican y guardan al instante.</p>

        <div class="list-config-option-standalone list-config-option-first">
          <label class="list-config-row-check">
            <input
              type="checkbox"
              :checked="showTitleBelowHeaderForm"
              class="list-config-checkbox"
              @change="onShowTitleBelowHeaderChange(($event.target as HTMLInputElement).checked)"
            />
            <span class="list-config-row-label">Título de la lista</span>
          </label>
        </div>

        <div class="list-config-rows">
          <div v-for="row in LIST_CONFIG_ROWS" :key="row.key" class="list-config-row">
            <label class="list-config-row-check">
              <input
                type="checkbox"
                :checked="isListConfigRowVisible(row)"
                class="list-config-checkbox"
                @change="setListConfigRowVisible(row, ($event.target as HTMLInputElement).checked)"
              />
              <span class="list-config-row-label">{{ row.label }}</span>
            </label>
            <input
              v-model.number="columnWidthsForm[row.key]"
              type="number"
              :min="row.min"
              :max="row.max"
              :step="row.step"
              class="list-config-width-input"
            />
            <span class="list-config-px">px</span>
          </div>
        </div>

        <div class="list-config-actions">
          <button type="button" class="reset-widths-btn" @click="resetListConfig">Restablecer</button>
        </div>
      </div>
    </Modal>

    <!-- Modal de gestión de secciones -->
    <div v-if="showSectionsManager" class="modal-overlay" @click="showSectionsManager = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Gestionar Secciones</h3>
          <button @click="showSectionsManager = false" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <SectionsCRUD
            :sections="sectionsStore.sections"
            :songs-by-section="sectionsStore.songsBySection"
            @create-section="handleCreateSection"
            @update-section="handleUpdateSection"
            @delete-section="handleDeleteSection"
            @toggle-section="handleToggleSection"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNotifications } from '@/composables/useNotifications';
import { usePermissions } from '@/composables/usePermissions';
import { usePersonalTagsBatch } from '@/composables/usePersonalTagsBatch';
import { useColeccionesStore } from '../stores/colecciones';
import { useCancionesStore } from '../stores/canciones';
import { useSectionsStore } from '../stores/sections';
import KeyBadge from '../components/common/KeyBadge.vue';
import { extractKeyFromTags, removeKeyTagFromTags } from '@/utils/keyUtils';
import { storeToRefs } from 'pinia';
import SectionHeader from '../components/SectionHeader.vue';
import SectionManager from '../components/SectionManager.vue';
import SectionsCRUD from '../components/SectionsCRUD.vue';
import CollectionSongsListReadOnly from '../components/CollectionSongsListReadOnly.vue';
import Modal from "../components/Modal.vue";
import BackButton from "../components/BackButton.vue";
import {
  collectionFieldConfigStorage,
  collectionReadOnlyColumnWidthsStorage,
  collectionReadOnlyShowTitleBelowHeaderStorage,
} from '@/utils/persistence';
import type { CollectionReadOnlyColumnWidths } from '@/utils/persistence/types';
import { CollectionsService } from '@/api/collections';
import { Collection, Cancion, CancionEnLista } from '../types/songTypes';
import Sortable from 'sortablejs';

const route = useRoute();
const router = useRouter();
const { success, error: showError } = useNotifications();
const { canCreateLists } = usePermissions();
const coleccionesStore = useColeccionesStore();
const cancionesStore = useCancionesStore();
const sectionsStore = useSectionsStore();
const { collectionSongs, loading, error } = storeToRefs(coleccionesStore);
const { canciones } = storeToRefs(cancionesStore);
const { getCollectionDisplayTitle } = coleccionesStore;

// Personal tags batch
const { loadPersonalTagsForSongs, getPersonalTagsForSong } = usePersonalTagsBatch();

const collection = ref<Collection | null>(null);
const songSearchQuery = ref("");
const showAddSongs = ref(false);
const addingSongIds = ref<Set<string>>(new Set());
const sortableInstances = ref<Map<string, Sortable>>(new Map());
const songsListRefs = ref<Map<string, HTMLElement>>(new Map());
const sectionReorderBusy = ref(false);
const pendingChanges = ref<{ songId: string; orderIndex: number }[]>([]);
const saveTimeout = ref<NodeJS.Timeout | null>(null);

// Variables para el modal de etiquetas de lista
const showEditListTagsModal = ref(false);
const songToEditTags = ref<CancionEnLista | null>(null);
const currentListTags = ref<string[]>([]);
const currentNotes = ref("");
const newListTag = ref("");
const suggestedListTags = ref([
  "C", "D", "E", "F", "G", "A", "B",
  "Cm", "Dm", "Em", "Fm", "Am", "Bm"
]);

// Configuración unificada: 7 filas (visible + ancho cada una)
const LIST_CONFIG_ROWS: { key: keyof CollectionReadOnlyColumnWidths; label: string; visibleKeys: string[]; min: number; max: number; step: number }[] = [
  { key: 'number', label: 'Número', visibleKeys: ['number'], min: 24, max: 80, step: 2 },
  { key: 'title', label: 'Título', visibleKeys: ['title'], min: 80, max: 500, step: 5 },
  { key: 'artist', label: 'Artista', visibleKeys: ['artist'], min: 80, max: 400, step: 5 },
  { key: 'tags', label: 'Etiquetas', visibleKeys: ['tags'], min: 60, max: 300, step: 5 },
  { key: 'list_tags', label: 'Etiquetas de lista', visibleKeys: ['list_tags'], min: 60, max: 300, step: 5 },
  { key: 'meta', label: 'Meta (BPM/tempo)', visibleKeys: ['bpm', 'tempo'], min: 60, max: 200, step: 5 },
  { key: 'notes', label: 'Notas', visibleKeys: ['notes'], min: 100, max: 600, step: 10 }
];
const DEFAULT_VISIBLE_FIELDS = ['number', 'title', 'artist', 'list_tags', 'notes'];
const visibleFields = ref<string[]>([...DEFAULT_VISIBLE_FIELDS]);
const visibleFieldsForm = ref<string[]>([...DEFAULT_VISIBLE_FIELDS]);

const readOnlyColumnWidths = ref<CollectionReadOnlyColumnWidths | null>(null);
const showListConfigModal = ref(false);
const DEFAULT_READONLY_WIDTHS: Required<CollectionReadOnlyColumnWidths> = {
  number: 36,
  title: 215,
  artist: 150,
  tags: 120,
  list_tags: 120,
  meta: 100,
  notes: 280
};
const columnWidthsForm = ref<Required<CollectionReadOnlyColumnWidths>>({ ...DEFAULT_READONLY_WIDTHS });

const showTitleBelowHeader = ref(false);
const showTitleBelowHeaderForm = ref(false);

function isListConfigRowVisible(row: (typeof LIST_CONFIG_ROWS)[0]): boolean {
  return row.visibleKeys.some(k => visibleFieldsForm.value.includes(k));
}
function setListConfigRowVisible(row: (typeof LIST_CONFIG_ROWS)[0], visible: boolean) {
  if (visible) {
    row.visibleKeys.forEach(k => {
      if (!visibleFieldsForm.value.includes(k)) visibleFieldsForm.value = [...visibleFieldsForm.value, k];
    });
  } else {
    visibleFieldsForm.value = visibleFieldsForm.value.filter(k => !row.visibleKeys.includes(k));
  }
  visibleFields.value = [...visibleFieldsForm.value];
  collectionFieldConfigStorage.set(visibleFields.value);
}

function onShowTitleBelowHeaderChange(checked: boolean) {
  showTitleBelowHeaderForm.value = checked;
  showTitleBelowHeader.value = checked;
  collectionReadOnlyShowTitleBelowHeaderStorage.set(checked);
}

// En vivo: si el modal está abierto usamos los formularios; si no, lo guardado
const effectiveVisibleFields = computed(() =>
  showListConfigModal.value ? visibleFieldsForm.value : visibleFields.value
);
const effectiveColumnWidths = computed(() =>
  showListConfigModal.value ? columnWidthsForm.value : (readOnlyColumnWidths.value ?? DEFAULT_READONLY_WIDTHS)
);

// Variables para secciones
const showSectionsManager = ref(false);
const refreshing = ref(false);

// Computed properties
// Computed simple: canciones que NO están en la colección actual
const availableSongs = computed(() => {
  return canciones.value.filter(song => {
    const songId = String(song.id);
    const isInCollection = collectionSongs.value.some(cs => String(cs.id) === songId);
    return !isInCollection;
  });
});

// Computed para filtrar las canciones disponibles por búsqueda
const filteredAvailableSongs = computed(() => {
  if (!songSearchQuery.value) return availableSongs.value;
  
  return availableSongs.value.filter(song => 
    song.title.toLowerCase().includes(songSearchQuery.value.toLowerCase()) ||
    song.artist.toLowerCase().includes(songSearchQuery.value.toLowerCase())
  );
});

// La colección cargada coincide con la ruta actual (evitar mostrar lista anterior)
const isShowingCurrentCollection = computed(() => {
  const routeId = route.params.id as string;
  return routeId && collection.value?.id === routeId;
});

// Mostrar loader cuando la ruta es de otra lista (no mostrar la lista anterior)
const showLoadingState = computed(() => {
  const routeId = route.params.id as string;
  if (!routeId) return loading.value;
  if (!isShowingCurrentCollection.value) return true;
  return loading.value;
});

// Mismo título que en el store (`getCollectionDisplayTitle`)
const collectionTitle = computed(() =>
  collection.value ? getCollectionDisplayTitle(collection.value) : ''
);

// Helper para obtener la tonalidad de una canción desde las etiquetas personales
function getSongKey(songId: string): string | null {
  const personalTags = getPersonalTagsForSong(songId);
  if (personalTags && personalTags.length > 0) {
    return extractKeyFromTags(personalTags);
  }
  return null;
}

// Methods
async function initializeCollection() {
  const collectionId = route.params.id as string;
  if (!collectionId) return;
  // No asignar collection hasta tener datos + canciones; así no se muestra la lista anterior
  collection.value = null;
  let collectionData: Collection | null = null;
  try {
    collectionData = await loadCollection(collectionId);
    await loadCollectionSongs(collectionId);
  } catch {
    return;
  }
  if (!sectionsReloading) {
    await loadSections(collectionId, false);
  }
  // Mostrar lista en cuanto tenemos colección + canciones + secciones (caché); el resto en segundo plano
  collection.value = collectionData ?? null;
  await nextTick();
  const allSongs = [
    ...sectionsStore.sectionsWithSongs.flatMap(s => s.songs),
    ...sectionsStore.unassignedSongs
  ];
  const songIds = allSongs.map(s => s.id);
  if (songIds.length > 0) {
    loadPersonalTagsForSongs(songIds).catch(() => {});
  }
}

/** Devuelve los datos de la colección; no asigna collection.value (lo hace quien llama cuando tenga también las canciones). */
async function loadCollection(collectionId: string, forceRefresh = false): Promise<Collection | null> {
  try {
    const collectionData = await coleccionesStore.getCollection(collectionId, forceRefresh);
    return collectionData;
  } catch (err) {
    console.error('Error loading collection:', err);
    showError('Error', 'No se pudo cargar la lista');
    return null;
  }
}

async function loadCollectionSongs(collectionId: string, forceRefresh = false) {
  try {
    await coleccionesStore.loadCollectionSongs(collectionId, forceRefresh);
  } catch (err) {
    console.error('Error loading collection songs:', err);
    showError('Error', 'No se pudo cargar las canciones de la lista');
  }
}

async function loadSections(collectionId: string, forceRefresh = false) {
  try {
    await sectionsStore.fetchSections(collectionId, forceRefresh);
  } catch (err) {
    console.error('Error loading sections:', err);
  }
}


function goToSong(song: Cancion) {
  router.push(`/cancion/${song.id}-${song.title.toLowerCase().replace(/\s+/g, '-')}`);
}

function addSongToCollection(song: Cancion) {
  if (!collection.value) return;
  const id = String(song.id);
  addingSongIds.value = new Set([...addingSongIds.value, id]);

  // Limpiar buscador de inmediato para poder seguir agregando sin esperar la API
  songSearchQuery.value = "";

  const collectionId = collection.value.id;
  const songId = parseInt(song.id);

  coleccionesStore.addSongToCollection(collectionId, songId)
    .then(async () => {
      destroySortable();
      await loadSections(collectionId, true);
      await nextTick();
    })
    .catch((err) => {
      console.error('Error adding song to collection:', err);
      showError('Error', 'No se pudo agregar la canción a la lista');
    })
    .finally(() => {
      addingSongIds.value = new Set([...addingSongIds.value].filter((x) => x !== id));
    });
}

async function removeSongFromCollection(song: Cancion) {
  if (!collection.value) return;

  try {
    const songId = parseInt(song.id);
    await coleccionesStore.removeSongFromCollection(collection.value.id, songId);
    
    // Solo recargar las secciones, que ya incluye todas las canciones (forzar recarga porque cambió)
    // Esto evita duplicaciones al no cargar ambos stores
    await loadSections(collection.value.id, true);
  } catch (err) {
    console.error('Error removing song from collection:', err);
    showError('Error', 'No se pudo remover la canción de la lista');
  }
}

const sharingView = ref(false)
const showCollectionOptionsMenu = ref(false)

function toggleCollectionOptionsMenu() {
  showCollectionOptionsMenu.value = !showCollectionOptionsMenu.value
}

function handleClickOutsideCollectionMenu(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.actions-menu')) {
    showCollectionOptionsMenu.value = false
  }
}

function refreshDataFromMenu() {
  showCollectionOptionsMenu.value = false
  refreshData()
}

function openSectionsFromMenu() {
  showCollectionOptionsMenu.value = false
  showSectionsManager.value = true
}


function openAddSongsFromMenu() {
  showCollectionOptionsMenu.value = false
  openAddSongsModal()
}

async function goToSharedView() {
  if (!collection.value?.id || sharingView.value) return
  try {
    sharingView.value = true
    showCollectionOptionsMenu.value = false
    const shareCode = await CollectionsService.ensureShareCode(collection.value.id)
    router.push(`/v/${shareCode}`)
  } catch (err) {
    console.error('Error getting share link:', err)
    showError('Error', 'No se pudo generar el enlace. Inténtalo de nuevo.')
  } finally {
    sharingView.value = false
  }
}

async function goToSharedViewFromMenu() {
  await goToSharedView()
}

async function openAddSongsModal() {
  // Si no hay canciones cargadas, cargarlas primero (usará caché si está disponible)
  if (canciones.value.length === 0) {
    await cancionesStore.loadCanciones();
  }
  
  showAddSongs.value = true;
  songSearchQuery.value = "";
}

function closeAddSongsModal() {
  showAddSongs.value = false;
  songSearchQuery.value = "";
  addingSongIds.value = new Set();
}

async function retryLoad() {
  const collectionId = route.params.id as string;
  if (collectionId) {
    await loadCollectionSongs(collectionId, true); // Forzar recarga desde API
  }
}

async function refreshData() {
  const collectionId = route.params.id as string;
  if (collectionId) {
    const data = await loadCollection(collectionId, true);
    await loadCollectionSongs(collectionId, true);
    await loadSections(collectionId, true);
    if (data) collection.value = data;
    
    // Recargar etiquetas personales
    const allSongs = [
      ...sectionsStore.sectionsWithSongs.flatMap(s => s.songs),
      ...sectionsStore.unassignedSongs
    ];
    const songIds = allSongs.map(s => s.id);
    if (songIds.length > 0) {
      await loadPersonalTagsForSongs(songIds);
    }
  }
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

// Funciones para manejar etiquetas de lista
function openEditListTagsModal(song: CancionEnLista) {
  songToEditTags.value = song;
  currentListTags.value = [...(song.list_tags || [])];
  currentNotes.value = song.notes || "";
  newListTag.value = "";
  showEditListTagsModal.value = true;
}

function closeEditListTagsModal() {
  showEditListTagsModal.value = false;
  songToEditTags.value = null;
  currentListTags.value = [];
  currentNotes.value = "";
  newListTag.value = "";
}

function addListTag() {
  const tag = newListTag.value.trim();
  if (tag && !currentListTags.value.includes(tag)) {
    currentListTags.value.push(tag);
    newListTag.value = "";
  }
}

function addSuggestedTag(tag: string) {
  if (!currentListTags.value.includes(tag)) {
    currentListTags.value.push(tag);
  }
}

function removeListTag(tag: string) {
  currentListTags.value = currentListTags.value.filter(t => t !== tag);
}

async function saveListTags() {
  if (!songToEditTags.value?.collection_song_id) return;

  try {
    await coleccionesStore.updateSongListData(
      songToEditTags.value.collection_song_id, 
      currentListTags.value,
      currentNotes.value
    );
    
    success('Éxito', 'Etiquetas y notas actualizadas correctamente');
    closeEditListTagsModal();
  } catch (err) {
    console.error('Error saving list data:', err);
    showError('Error', 'No se pudieron guardar las etiquetas y notas');
  }
}

function loadFieldConfig() {
  const saved = collectionFieldConfigStorage.get();
  if (saved && Array.isArray(saved) && saved.length > 0) {
    visibleFields.value = [...saved];
  } else {
    visibleFields.value = [...DEFAULT_VISIBLE_FIELDS];
  }
  const widths = collectionReadOnlyColumnWidthsStorage.get();
  if (widths && typeof widths === 'object') {
    readOnlyColumnWidths.value = { ...DEFAULT_READONLY_WIDTHS, ...widths };
    columnWidthsForm.value = { ...DEFAULT_READONLY_WIDTHS, ...widths };
  }
  const showTitle = collectionReadOnlyShowTitleBelowHeaderStorage.get();
  showTitleBelowHeader.value = showTitle === true;
}

function openListConfigModal() {
  visibleFieldsForm.value = [...visibleFields.value];
  columnWidthsForm.value = {
    ...DEFAULT_READONLY_WIDTHS,
    ...readOnlyColumnWidths.value
  };
  showTitleBelowHeaderForm.value = showTitleBelowHeader.value;
  showListConfigModal.value = true;
}

function closeListConfigModal() {
  readOnlyColumnWidths.value = { ...columnWidthsForm.value };
  collectionReadOnlyColumnWidthsStorage.set(columnWidthsForm.value);
  showListConfigModal.value = false;
}

function resetListConfig() {
  visibleFieldsForm.value = [...DEFAULT_VISIBLE_FIELDS];
  visibleFields.value = [...DEFAULT_VISIBLE_FIELDS];
  collectionFieldConfigStorage.set(visibleFields.value);
  columnWidthsForm.value = { ...DEFAULT_READONLY_WIDTHS };
  readOnlyColumnWidths.value = null;
  collectionReadOnlyColumnWidthsStorage.remove();
  showTitleBelowHeaderForm.value = false;
  showTitleBelowHeader.value = false;
  collectionReadOnlyShowTitleBelowHeaderStorage.remove();
  showListConfigModal.value = false;
  success('Listo', 'Configuración restablecida');
}

function openListConfigFromMenu() {
  showCollectionOptionsMenu.value = false;
  openListConfigModal();
}

// Funciones para gestión de secciones
async function handleCreateSection(data: { name: string; description: string; color: string }) {
  if (!collection.value?.id) return;
  
  try {
    await sectionsStore.createSection(collection.value.id, data.name, data.description, data.color);
    success('Éxito', 'Sección creada correctamente');
  } catch (err) {
    console.error('Error creating section:', err);
    showError('Error', 'No se pudo crear la sección');
  }
}

async function handleUpdateSection(section: any, data?: { name: string; description: string; color: string }) {
  try {
    // Si no hay datos, significa que se está editando desde SectionHeader
    if (!data) {
      // Abrir el modal de edición en SectionsCRUD
      showSectionsManager.value = true;
      return;
    }
    
    await sectionsStore.updateSection(section.id, data);
    success('Éxito', 'Sección actualizada correctamente');
  } catch (err) {
    console.error('Error updating section:', err);
    showError('Error', 'No se pudo actualizar la sección');
  }
}

async function handleDeleteSection(section: any, options?: { moveToSection?: string; moveToUnassigned?: boolean }) {
  try {
    const moveToSectionId = options?.moveToSection;
    await sectionsStore.deleteSection(section.id, moveToSectionId);
    success('Éxito', 'Sección eliminada correctamente');
  } catch (err) {
    console.error('Error deleting section:', err);
    showError('Error', 'No se pudo eliminar la sección');
  }
}

async function handleToggleSection(section: any, enabled: boolean) {
  try {
    await sectionsStore.toggleSection(section.id, enabled);
    const status = enabled ? 'habilitada' : 'deshabilitada';
    success('Éxito', `Sección ${status} correctamente`);
  } catch (err) {
    console.error('Error toggling section:', err);
    showError('Error', 'No se pudo cambiar el estado de la sección');
  }
}

async function flushPendingSongOrderIfAny() {
  if (pendingChanges.value.length === 0) return;
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
    saveTimeout.value = null;
  }
  await saveChanges(pendingChanges.value);
}

async function handleMoveSectionUp(index: number) {
  if (index <= 0 || sectionReorderBusy.value) return;
  await applySectionReorder(index, index - 1);
}

async function handleMoveSectionDown(index: number) {
  const last = sectionsStore.sectionsWithSongs.length - 1;
  if (index >= last || sectionReorderBusy.value) return;
  await applySectionReorder(index, index + 1);
}

async function applySectionReorder(fromIdx: number, toIdx: number) {
  const list = sectionsStore.sectionsWithSongs;
  if (fromIdx < 0 || toIdx < 0 || fromIdx >= list.length || toIdx >= list.length) return;

  const ids = list.map((s) => s.id);
  const reordered = [...ids];
  const [movedId] = reordered.splice(fromIdx, 1);
  reordered.splice(toIdx, 0, movedId);
  const sectionOrders = reordered.map((id, i) => ({ id, order_index: i }));

  sectionReorderBusy.value = true;
  try {
    await flushPendingSongOrderIfAny();
    await sectionsStore.reorderSections(sectionOrders);
    await reinitializeSortable();
  } catch (err) {
    console.error('Error reordering sections:', err);
    showError('Error', 'No se pudo reordenar las secciones');
    if (collection.value) {
      await loadSections(collection.value.id);
      await reinitializeSortable();
    }
  } finally {
    sectionReorderBusy.value = false;
  }
}

// Drag and Drop Functions
function setSongsListRef(el: HTMLElement | null, sectionId: string) {
  if (el) {
    songsListRefs.value.set(sectionId, el);
    // Inicializar sortable para esta sección específica
    nextTick(() => {
      initializeSortableForSection(sectionId);
    });
  }
}

function initializeSortableForSection(sectionId: string) {
  const element = songsListRefs.value.get(sectionId);
  if (!element || sortableInstances.value.has(sectionId)) return;

  const sortableInstance = new Sortable(element, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    handle: '.drag-handle',
    group: 'songs', // Permitir drag & drop entre secciones
    forceFallback: true, // Usar fallback para mejor control
    onEnd: async (evt) => {
      const { oldIndex, newIndex, from, to, item } = evt;
      if (!collection.value) return;

      // REVERTIR el DOM inmediatamente - SortableJS ya movió el elemento
      // pero nosotros manejamos el estado, no el DOM
      if (oldIndex !== newIndex) {
        // Revertir el movimiento en el DOM
        if (from === to) {
          // Mismo contenedor - revertir posición
          const parent = from;
          const movedElement = item;
          const targetElement = parent.children[newIndex];
          if (targetElement && movedElement !== targetElement) {
            if (newIndex > oldIndex) {
              parent.insertBefore(movedElement, targetElement.nextSibling);
            } else {
              parent.insertBefore(movedElement, targetElement);
            }
          }
        } else {
          // Diferentes contenedores - revertir completamente
          from.appendChild(item);
        }
      }

      // Determinar sección origen y destino
      const fromSectionId = from.dataset.sectionId || 'unassigned';
      const toSectionId = to.dataset.sectionId || 'unassigned';

      // Obtener canciones de la sección origen
      let fromSongs;
      if (fromSectionId === 'unassigned') {
        fromSongs = sectionsStore.unassignedSongs;
      } else {
        const fromSection = sectionsStore.sectionsWithSongs.find(s => s.id === fromSectionId);
        if (!fromSection) return;
        fromSongs = fromSection.songs;
      }

      const movedSong = fromSongs[oldIndex];
      if (!movedSong) {
        return;
      }

      // Si se movió a la misma sección, solo reordenar
      if (fromSectionId === toSectionId) {
        // Crear un nuevo array con el orden correcto
        const reorderedSongs = [...fromSongs];
        const songToMove = reorderedSongs.splice(oldIndex, 1)[0];
        reorderedSongs.splice(newIndex, 0, songToMove);
        
        // ACTUALIZAR el estado local inmediatamente
        fromSongs.splice(0, fromSongs.length, ...reorderedSongs);
        
        // Actualizar los order_index en el estado local
        fromSongs.forEach((song, index) => {
          song.order_index = index;
        });
        
        // Crear cambios para TODAS las canciones de la sección
        const sectionChanges = reorderedSongs.map((song, index) => ({
          songId: song.collection_song_id,
          orderIndex: index
        }));
        
        // Reemplazar cambios pendientes con los nuevos
        pendingChanges.value = sectionChanges;
      } else {
        // Movimiento entre secciones diferentes
        // Obtener canciones de la sección destino
        let toSongs;
        if (toSectionId === 'unassigned') {
          toSongs = sectionsStore.unassignedSongs;
        } else {
          const toSection = sectionsStore.sectionsWithSongs.find(s => s.id === toSectionId);
          if (!toSection) return;
          toSongs = toSection.songs;
        }
        
        // Remover la canción de la sección origen
        fromSongs.splice(oldIndex, 1);
        
        // Actualizar los order_index en la sección origen
        fromSongs.forEach((song, index) => {
          song.order_index = index;
        });
        
        // Actualizar section_id de la canción movida
        movedSong.section_id = toSectionId === 'unassigned' ? null : toSectionId;
        
        // Crear un nuevo array con la canción en la posición correcta
        const newToSongs = [...toSongs];
        newToSongs.splice(newIndex, 0, movedSong);
        
        // Actualizar el estado local inmediatamente
        toSongs.splice(0, toSongs.length, ...newToSongs);
        
        // Actualizar los order_index en la sección destino
        toSongs.forEach((song, index) => {
          song.order_index = index;
        });
        
        // Crear cambios para AMBAS secciones
        const originChanges = fromSongs.map((song, index) => ({
          songId: song.collection_song_id,
          orderIndex: index,
          sectionId: fromSectionId === 'unassigned' ? null : fromSectionId
        }));
        
        const targetChanges = toSongs.map((song, index) => ({
          songId: song.collection_song_id,
          orderIndex: index,
          sectionId: toSectionId === 'unassigned' ? null : toSectionId
        }));
        
        const allChanges = [...originChanges, ...targetChanges];
        
        // Reemplazar cambios pendientes con los nuevos
        pendingChanges.value = allChanges;
      }

      // Guardar cambios con debounce
      saveTimeout.value && clearTimeout(saveTimeout.value);
      saveTimeout.value = setTimeout(() => {
        if (pendingChanges.value.length > 0) {
          saveChanges(pendingChanges.value);
        }
      }, 1000);
    }
  });

  sortableInstances.value.set(sectionId, sortableInstance);
}

// Función para programar el guardado con debounce
function scheduleSave(songOrders: { songId: number; orderIndex: number }[]) {
  // Cancelar guardado anterior si existe
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
  }

  // Actualizar cambios pendientes
  pendingChanges.value = songOrders;

  // Programar nuevo guardado en 1 segundo
  saveTimeout.value = setTimeout(async () => {
    await saveChanges(songOrders);
  }, 1000);
}

// Función para guardar cambios
async function saveChanges(songOrders: { songId: string; orderIndex: number; sectionId?: string | null }[]) {
  if (!collection.value) return;
  
  try {
    await coleccionesStore.reorderCollectionSongs(collection.value.id, songOrders);
    pendingChanges.value = [];
  } catch (err) {
    console.error('Error saving song order:', err);
    showError('Error', 'No se pudo guardar el orden de las canciones');
    // Solo recargar en caso de error
    await loadSections(collection.value.id);
  }
}

function destroySortable() {
  // Destruir todas las instancias de sortable
  sortableInstances.value.forEach((instance, sectionId) => {
    instance.destroy();
  });
  sortableInstances.value.clear();
  songsListRefs.value.clear();
}

// Función para reinicializar SortableJS si es necesario
async function reinitializeSortable() {
  destroySortable();
  await nextTick();
  // Las instancias se reinicializarán automáticamente cuando se monten los elementos
}

// Auto-guardado al cambiar de pestaña o cerrar
function handleBeforeUnload() {
  if (pendingChanges.value.length > 0) {
    // Forzar guardado inmediato
    saveTimeout.value && clearTimeout(saveTimeout.value);
    saveChanges(pendingChanges.value);
  }
}

// Auto-guardado al cambiar de pestaña (visibilitychange)
function handleVisibilityChange() {
  if (document.hidden && pendingChanges.value.length > 0) {
    saveTimeout.value && clearTimeout(saveTimeout.value);
    saveChanges(pendingChanges.value);
  }
}

onMounted(async () => {
  // Agregar listeners para auto-guardado
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  document.addEventListener('click', handleClickOutsideCollectionMenu);
  
  // Cargar configuración de campos
  loadFieldConfig();
  
  // Inicializar la colección
  await initializeCollection();
});

// Watcher para recargar cuando cambia el ID de la colección en la ruta
watch(() => route.params.id, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await initializeCollection();
  }
});

// Flag para evitar cargar secciones dos veces
let sectionsReloading = false;

// Listener para cuando se actualizan las canciones de la colección
if (typeof window !== 'undefined') {
  window.addEventListener('collection-songs-updated', async (event: Event) => {
    const customEvent = event as CustomEvent<{ collectionId: string }>;
    const collectionId = route.params.id as string;
    if (customEvent.detail.collectionId === collectionId && !sectionsReloading) {
      sectionsReloading = true;
      // Recargar las secciones para que la vista se actualice
      await loadSections(collectionId, true);
      sectionsReloading = false;
    }
  });
}

// Watcher para recargar datos cuando vuelves a esta vista (desde otra página)
// Esto se ejecuta cuando navegas a esta ruta desde otra
watch(() => route.fullPath, async (newPath, oldPath) => {
  if (!oldPath || newPath === oldPath || route.name !== 'coleccion-detalle') return;
  const collectionId = route.params.id as string;
  if (!collectionId) return;
  const data = await loadCollection(collectionId);
  await loadCollectionSongs(collectionId);
  await loadSections(collectionId);
  if (data) collection.value = data;
});

onUnmounted(() => {
  // Limpiar listeners y guardar cambios pendientes
  window.removeEventListener('beforeunload', handleBeforeUnload);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  document.removeEventListener('click', handleClickOutsideCollectionMenu);
  
  // Guardar cambios pendientes antes de destruir
  if (pendingChanges.value.length > 0) {
    saveTimeout.value && clearTimeout(saveTimeout.value);
    saveChanges(pendingChanges.value);
  }
  
  destroySortable();
});
</script>

<style scoped>
/* Forzar espaciados en el modal de etiquetas */
.space-y-16 > * + * {
  margin-top: 1rem !important;
}

.mb-8 {
  margin-bottom: 0.75rem !important;
}

.mb-10 {
  margin-bottom: 1rem !important;
}

.mt-6 {
  margin-top: 0.5rem !important;
}

.mt-12 {
  margin-top: 1rem !important;
}
.collection-detail-container {
  min-height: 100vh;
  background: var(--color-background);
  display: flex;
  flex-direction: column;
  transition: background-color var(--transition-normal);
}

/* Header */
.collection-header {
  background: var(--color-background-card);
  border-bottom: 1px solid var(--color-border);
  padding: 0.75rem 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all var(--transition-normal);
}

.collection-title-below-header {
  padding: 0.75rem 1rem;
  background: var(--color-background);
  transition: background-color var(--transition-normal);
}

.collection-title-below-header-text {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-heading);
  line-height: 1.3;
  transition: color var(--transition-normal);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  position: relative;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.collection-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-heading);
  margin: 0;
  line-height: 1.3;
  flex: 1;
  text-align: left;
  transition: color var(--transition-normal);
}


.add-songs-btn {
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Actions menu (igual que en vista de canción) */
.actions-menu {
  position: relative;
  flex-shrink: 0;
}

.menu-toggle {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-mute);
  width: 44px;
  height: 44px;
}

.menu-toggle:hover {
  background: var(--color-background-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
}

.menu-toggle.active {
  background: var(--color-background-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.actions-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 220px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.actions-dropdown .action-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text);
  text-align: left;
  transition: all 0.2s ease;
}

.actions-dropdown .action-item:hover:not(:disabled) {
  background: var(--color-background-hover);
  color: var(--color-accent);
}

.actions-dropdown .action-item:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.actions-dropdown .divider {
  margin: 0;
  border: none;
  border-top: 1px solid var(--color-border);
}

.reset-btn, .close-btn {
  padding: 0.375rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #d1d5db;
  min-width: auto;
  width: auto;
}

.reset-btn {
  background: #f3f4f6;
  color: #374151;
}

.reset-btn:hover {
  background: #e5e7eb;
}

.close-btn {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.close-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

/* Main Content */
.collection-main {
  flex: 1;
  padding: 1rem;
  width: 100%;
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

/* Songs List */
.songs-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Modal configuración unificada (campos visibles + anchos) */
.list-config-modal {
  padding: 0.25rem 0;
}

.list-config-modal-title {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-heading);
}

.list-config-modal-hint {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: var(--color-text-mute);
}

.list-config-rows {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.list-config-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.list-config-row-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text);
  min-width: 0;
  flex: 1;
}

.list-config-row-label {
  font-weight: 400;
  color: var(--color-text);
  white-space: nowrap;
}

.list-config-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-accent);
  cursor: pointer;
  flex-shrink: 0;
}

.list-config-width-input {
  width: 4.5rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
  background: var(--color-background);
  color: var(--color-text);
  flex-shrink: 0;
}

.list-config-px {
  font-size: 0.8rem;
  color: var(--color-text-mute);
  flex-shrink: 0;
}

.list-config-option-standalone {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.list-config-option-first {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
  margin-bottom: 0.25rem;
}

.list-config-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.list-config-modal .reset-widths-btn {
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background-soft);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.list-config-modal .reset-widths-btn:hover {
  background: var(--color-background-hover);
}

.list-config-modal .save-widths-btn {
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
  border: none;
  border-radius: 6px;
  background: var(--color-accent);
  color: var(--color-text-inverse);
  cursor: pointer;
  transition: all 0.2s ease;
}

.list-config-modal .save-widths-btn:hover {
  background: var(--color-accent-hover);
}

/* Section Container */
.section-container {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin-bottom: 0.5rem;
}

.section-songs {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-left: 0;
  padding-left: 0;
  margin-top: 0;
  margin-right: 0;
  padding-right: 0;
}

/* Unassigned Section */
.unassigned-section {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin-top: 0.5rem;
}

.unassigned-header {
  background: #f3f4f6;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  margin-bottom: 0.25rem;
}

.unassigned-title {
  font-size: 0.8rem;
  font-weight: 400;
  color: #6b7280;
  margin: 0;
}


.song-item {
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.375rem 0.5rem;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.25rem;
  box-shadow: var(--shadow-sm);
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  color: var(--color-text-mute);
  cursor: grab;
  border-radius: 4px;
  transition: all var(--transition-normal);
  flex-shrink: 0;
  opacity: 0.6;
}

.drag-handle:hover {
  background: var(--color-background-hover);
  color: var(--color-text);
  opacity: 1;
}

.drag-handle:active {
  cursor: grabbing;
  background: var(--color-background-soft);
}

.song-item:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.song-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.song-main-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

/* Sistema de columnas con anchos fijos */
.column-title {
  width: 215px;
  min-width: 200px;
  flex-shrink: 0;
}

.column-artist {
  width: 150px;
  min-width: 150px;
  flex-shrink: 0;
}

.column-tags {
  width: 120px;
  min-width: 120px;
  flex-shrink: 0;
}

.column-list-tags {
  width: 120px;
  min-width: 120px;
  flex-shrink: 0;
}


.column-meta {
  width: 100px;
  min-width: 100px;
  flex-shrink: 0;
}

.song-title {
  font-size: 1rem;
  font-weight: 400;
  color: var(--color-heading);
  margin: 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  transition: color var(--transition-normal);
}

.song-artist {
  font-size: 0.9rem;
  color: var(--color-text-soft);
  margin: 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  transition: color var(--transition-normal);
}

.song-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: nowrap;
  align-items: center;
  overflow: hidden;
}

.tag {
  background: var(--color-background-soft);
  color: var(--color-text-soft);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.2;
  border: 1px solid var(--color-border);
  transition: all var(--transition-normal);
}

.tag-personal {
  background: rgba(var(--cf-navy-rgb, 30, 58, 138), 0.1);
  color: var(--cf-navy);
  border: 1px solid rgba(var(--cf-navy-rgb, 30, 58, 138), 0.3);
}

.list-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: nowrap;
  align-items: center;
  overflow: hidden;
}

.list-tag {
  background: var(--color-background-card);
  color: var(--color-text-soft);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
  line-height: 1.2;
  transition: all var(--transition-normal);
}

.song-notes {
  display: flex;
  width: 100%;
  margin-top: 0.125rem;
}

.notes-content {
  font-size: 0.85rem;
  color: var(--color-text-soft);
  background: var(--color-background-soft);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  line-height: 1.4;
  word-wrap: break-word;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  width: 100%;
  border: 1px solid var(--color-border);
  transition: all var(--transition-normal);
}

.song-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
}

.meta-item {
  background: var(--color-background-soft);
  color: var(--color-text);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.2;
  border: 1px solid var(--color-border);
  transition: all var(--transition-normal);
}

.song-actions {
  display: flex;
  gap: 0.0625rem;
  flex-shrink: 0;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-mute);
}

.action-btn:hover {
  background: var(--color-background-hover);
  color: var(--color-text);
}

.remove-btn {
  color: var(--color-text-mute);
}

.remove-btn:hover {
  background: var(--color-error);
  color: var(--color-text-inverse);
}

.edit-tags-btn {
  color: var(--color-text-mute);
}

.edit-tags-btn:hover {
  background: var(--color-accent);
  color: var(--color-text-inverse);
}

/* Drag and Drop Styles */
.sortable-ghost {
  opacity: 0.3;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
}

.sortable-chosen {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.sortable-drag {
  opacity: 0.9;
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

/* Responsive */
@media (max-width: 768px) {
  .collection-header {
    padding: 0.75rem 1rem;
  }
  
  .header-content {
    gap: 0.75rem;
  }
  
  .header-actions {
    gap: 0.375rem;
  }
  
  .collection-title {
    font-size: 1.1rem;
  }
  
  .reset-btn, .close-btn {
    flex: 1;
    min-width: 0;
  }
  
  .collection-main {
    padding: 0.75rem;
  }
  
  .song-item {
    padding: 0.25rem 0.375rem;
  }
  
  .drag-handle {
    padding: 0.125rem;
  }
  
  .songs-list {
    gap: 0.125rem;
  }
  
  /* Ajustar columnas en móviles - diseño más flexible */
  .song-main-content {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  .column-title {
    width: 140px;
    min-width: 140px;
    flex: 1;
  }
  
  .column-artist {
    width: 100px;
    min-width: 100px;
    flex-shrink: 0;
  }
  
  .column-tags {
    width: auto;
    min-width: auto;
    flex-shrink: 0;
  }
  
  .column-list-tags {
    width: auto;
    min-width: auto;
    flex-shrink: 0;
  }
  
  .column-meta {
    width: auto;
    min-width: auto;
    flex-shrink: 0;
  }
  
  /* Mejorar legibilidad en móviles */
  .song-title {
    font-size: 1rem;
    line-height: 1.1;
  }
  
  .song-artist {
    font-size: 1rem;
    line-height: 1.1;
  }
  
  .tag, .list-tag {
    font-size: 1rem;
    padding: 0.075rem 0.2rem;
    line-height: 1.1;
  }
  
  .meta-item {
    font-size: 1rem;
    padding: 0.075rem 0.2rem;
    line-height: 1.1;
  }
}

/* Media queries específicas para teléfonos (no tabletas) */
@media (max-width: 480px) {
  .collection-header {
    padding: 0.5rem 0.75rem;
  }
  
  .collection-title {
    font-size: 0.9rem;
  }
  
  .collection-main {
    padding: 0.5rem;
  }
  
  /* Optimización extrema para pantallas muy pequeñas */
  .song-item {
    padding: 0.2rem 0.25rem;
    gap: 0.25rem;
  }
  
  .drag-handle {
    padding: 0.1rem;
  }
  
  .song-main-content {
    gap: 0.2rem;
  }
  
  .column-title {
    width: 120px;
    min-width: 120px;
  }
  
  .column-artist {
    width: 80px;
    min-width: 80px;
  }
  
  .song-title {
    font-size: 0.85rem;
  }
  
  .song-artist {
    font-size: 0.8rem;
  }
  
  .tag, .list-tag {
    font-size: 0.75rem;
    padding: 0.05rem 0.15rem;
  }
  
  .meta-item {
    font-size: 0.75rem;
    padding: 0.05rem 0.15rem;
  }
  
  .action-btn {
    padding: 0.2rem;
  }
  
  .notes-content {
    font-size: 0.8rem;
  }
  
  .unassigned-title {
    font-size: 0.75rem;
  }
  
  .section-header {
    font-size: 0.9rem;
  }
}

/* Media query adicional para teléfonos muy pequeños */
@media (max-width: 360px) {
  .song-title {
    font-size: 0.8rem;
  }
  
  .song-artist {
    font-size: 0.75rem;
  }
  
  .tag, .list-tag {
    font-size: 0.7rem;
  }
  
  .meta-item {
    font-size: 0.7rem;
  }
  
  .notes-content {
    font-size: 0.75rem;
  }
  
  .collection-title {
    font-size: 0.85rem;
  }
  
  .section-header {
    font-size: 0.85rem;
  }
}

/* Modal personalizado para secciones */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--color-background-card);
  border-radius: 12px;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-border);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  position: relative;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
}

.modal-header .close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--color-text-mute);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  line-height: 1;
  position: absolute;
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
}

.modal-header .close-btn:hover {
  color: var(--color-text);
  background: var(--color-background-hover);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* Responsive para el modal */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 1rem;
  }
}

/* Estilos para el modal de agregar canciones */
.add-songs-modal {
  width: 100%;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 1rem 0;
  line-height: 1.5;
  transition: color var(--transition-normal);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-container {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-background-card);
  color: var(--color-text);
  font-size: 1rem;
  transition: all var(--transition-normal);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(218, 186, 9, 0.1);
}

.search-input::placeholder {
  color: var(--color-text-mute);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-text-mute);
  pointer-events: none;
}

/* Estilos para songs-list dentro del modal únicamente: altura fija para que el modal no cambie de tamaño */
.add-songs-modal .songs-list.add-songs-list-fixed {
  min-height: 24rem;
  max-height: 24rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-right: 0.25rem;
}

/* Estilos para la barra de desplazamiento dentro del modal */
.add-songs-modal .songs-list::-webkit-scrollbar {
  width: 6px;
}

.add-songs-modal .songs-list::-webkit-scrollbar-track {
  background: var(--color-background-soft);
  border-radius: 3px;
}

.add-songs-modal .songs-list::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.add-songs-modal .songs-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-mute);
}

/* Estilos específicos del modal de agregar canciones */
.add-songs-modal .song-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-background-card);
  transition: all var(--transition-normal);
}

.add-songs-modal .song-entry:hover {
  background: var(--color-background-hover);
  border-color: var(--color-border-hover);
}

.add-songs-modal .song-entry-info {
  flex: 1;
  min-width: 0;
}

.add-songs-modal .song-entry-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.25rem 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-normal);
}

.add-songs-modal .song-entry-artist {
  font-size: 0.875rem;
  color: var(--color-text-soft);
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-normal);
}

.add-songs-modal .add-button {
  background: var(--color-info);
  color: var(--color-text-inverse);
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
  flex-shrink: 0;
  white-space: nowrap;
}

.add-songs-modal .add-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.add-songs-modal .add-button:active {
  transform: translateY(0);
  opacity: 1;
}

.add-songs-modal .add-button:disabled {
  opacity: 0.8;
  cursor: not-allowed;
  transform: none;
}

.add-songs-modal .song-entry--adding {
  opacity: 0.85;
}

.add-songs-modal .songs-list .empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--color-text-mute);
  padding: 2rem;
  min-height: 0;
  transition: color var(--transition-normal);
}

.add-songs-modal .empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* Responsive para el modal de agregar canciones */
@media (max-width: 768px) {
  .add-songs-modal .modal-title {
    font-size: 1rem;
  }
  
  .add-songs-modal .search-input {
    font-size: 1rem;
  }
  
  .add-songs-modal .song-entry {
    padding: 0.625rem;
  }
  
  .add-songs-modal .song-entry-title,
  .add-songs-modal .song-entry-artist {
    font-size: 0.8125rem;
  }
  
  .add-songs-modal .add-button {
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
  }
  
  .add-songs-modal .songs-list.add-songs-list-fixed {
    min-height: 20rem;
    max-height: 20rem;
  }
}
</style>

