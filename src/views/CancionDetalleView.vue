<template>
  <div class="song-detail-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Cargando canción...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Error al cargar la canción</h3>
      <p>{{ error }}</p>
      <button @click="retryLoad" class="retry-btn">Reintentar</button>
    </div>

    <!-- Song Not Found -->
    <div v-else-if="!cancion" class="not-found-state">
      <div class="not-found-icon">🎵</div>
      <h3>Canción no encontrada</h3>
      <p>La canción que buscas no existe o ha sido eliminada.</p>
      <BackButton :to="backToFromQuery || '/canciones'" :show-label="true" label="Volver" />
    </div>

    <!-- Main Song View -->
    <div v-else class="song-view" :class="{ 'karaoke-active': karaokeMode }">
      <!-- Compact Header - Solo primera fila sticky -->
      <header v-if="!karaokeMode" class="song-header" :class="{ 'song-header--shared': sharedViewFromQuery }">
        <div class="header-row header-row-top">
          <div class="header-back">
            <BackButton
              :to="backToFromQuery"
              :title="backToFromQuery ? 'Volver a las canciones' : undefined"
            />
          </div>
          <h1 class="song-title">{{ cancion.title }}</h1>
          <div v-if="!sharedViewFromQuery" class="header-actions">
            <RefreshButton :on-click="refreshData" title="Recargar canción" />
            <div class="actions-menu">
              <button
                type="button"
                @click="toggleActionsMenu"
                class="menu-toggle"
                :class="{ active: showActionsMenu }"
                title="Opciones de la canción"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                </svg>
              </button>
              
              <!-- Actions Dropdown -->
              <div v-if="showActionsMenu" class="actions-dropdown">
            <button 
              v-if="canEditSongs" 
              @click="editSong" 
              class="action-item"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Editar
            </button>
            <button 
              v-if="canDeleteSongs" 
              @click="deleteSong" 
              class="action-item danger"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Eliminar
            </button>
            
            <!-- Resources Section (in the middle) -->
            <div v-if="cancion.resources && cancion.resources.length > 0" class="resources-section">
              <hr class="divider">
              <button
                v-for="resource in cancion.resources"
                :key="resource.url"
                @click="openResourcePreview(resource)"
                class="action-item resource-item"
              >
                <span class="resource-icon" v-html="getResourceIcon(resource.type)"></span>
                <span class="resource-name">{{ getResourceName(resource) }}</span>
              </button>
            </div>
            
            <hr class="divider">
            <button @click="toggleKaraoke" class="action-item">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
              Modo karaoke
            </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <!-- Artista y Meta - Fuera del header sticky -->
      <div v-if="!karaokeMode" class="song-info-section">
        <!-- Segunda fila: Artista -->
        <div class="header-row header-row-bottom">
          <p class="song-artist">{{ cancion.artist }}</p>
        </div>
        <!-- Tercera fila: Meta (BPM, Tempo, Tags) - oculta en vista compartida -->
        <div v-if="!sharedViewFromQuery" class="header-row header-row-meta">
          <div class="song-meta">
            <span v-if="cancion.bpm" class="meta-item">BPM: {{ cancion.bpm }}</span>
            <span v-if="cancion.tempo" class="meta-item">{{ cancion.tempo }}</span>
            <Tag v-for="tag in displayTags" :key="tag" :tag="tag" />
          </div>
        </div>

        <!-- Tonalidad (solo para usuarios autenticados, como etiqueta personal) -->
        <div v-if="authStore.isAuthenticated && !sharedViewFromQuery" class="header-row header-row-key">
          <div class="key-section">
            <div class="key-header">
              <h4 class="key-title">Tonalidad</h4>
            </div>
            
            <!-- Selector de tonalidad -->
            <div class="key-selector-wrapper">
              <KeySelector 
                v-model="currentKey"
                @update:modelValue="handleKeyChange"
                :disabled="savingKey"
              />
            </div>
          </div>
        </div>

        <!-- Etiquetas Personales (solo para usuarios autenticados, ocultas en vista compartida) -->
        <div v-if="authStore.isAuthenticated && !sharedViewFromQuery" class="header-row header-row-personal-tags">
          <div class="personal-tags-section">
            <div class="personal-tags-header">
              <h4 class="personal-tags-title">Mis Etiquetas</h4>
              <button 
                v-if="personalTagsWithoutKey.length > 0"
                @click="showAddPersonalTag = !showAddPersonalTag"
                class="add-tag-btn"
                title="Agregar etiqueta personal"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M12 5v14m-7-7h14"/>
                </svg>
              </button>
            </div>
            
            <!-- Etiquetas personales existentes (excluyendo la tonalidad que tiene su propia sección) -->
            <div v-if="personalTagsWithoutKey.length > 0" class="personal-tags-list">
              <span 
                v-for="tag in personalTagsWithoutKey" 
                :key="tag.id" 
                class="personal-tag"
              >
                {{ tag.tag_name }}
                <button 
                  @click="removePersonalTagHandler(tag.id)"
                  class="remove-tag-btn"
                  :disabled="personalTagsLoading"
                  title="Eliminar etiqueta"
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </span>
            </div>

            <!-- Input para agregar nueva etiqueta -->
            <div v-if="showAddPersonalTag || personalTagsWithoutKey.length === 0" class="add-tag-input-wrapper">
              <input
                v-model="newPersonalTag"
                @keyup.enter="addPersonalTagHandler"
                @blur="handleTagInputBlur"
                type="text"
                class="add-tag-input"
                placeholder="Agregar etiqueta personal..."
                :disabled="personalTagsLoading"
              />
              <div v-if="uniqueTags.length > 0 && newPersonalTag" class="tag-suggestions">
                <button
                  v-for="suggestion in filteredSuggestions"
                  :key="suggestion"
                  @click="selectSuggestion(suggestion)"
                  class="tag-suggestion"
                >
                  {{ suggestion }}
                </button>
              </div>
            </div>

            <!-- Botón para mostrar input si hay etiquetas -->
            <button 
              v-else-if="personalTagsWithoutKey.length === 0"
              @click="showAddPersonalTag = true"
              class="show-add-tag-btn"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M12 5v14m-7-7h14"/>
              </svg>
              Agregar etiqueta personal
            </button>
          </div>
        </div>
      </div>

      <!-- Karaoke Header (only in karaoke mode) -->
      <header v-if="karaokeMode" class="karaoke-header">
        <div class="karaoke-song-info">
          <h2 class="karaoke-title">{{ cancion.title }}</h2>
          <p class="karaoke-artist">{{ cancion.artist }}</p>
        </div>
        <div class="karaoke-actions">
          <button @click="toggleKaraoke" class="action-btn karaoke-btn active" title="Salir del modo karaoke">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- Karaoke Progress Bar (fixed below header) -->
      <div v-if="karaokeMode" class="karaoke-progress-fixed">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${((currentVerse + 1) / verses.length) * 100}%` }"
          ></div>
        </div>
        <div class="progress-text">
          {{ currentVerse + 1 }} de {{ verses.length }} versos
        </div>
      </div>

      <!-- Tabs Section -->
      <main class="tabs-section" :class="{ 'tabs-section--with-collection-nav': showCollectionNavigation && !karaokeMode }">
        <Tabs
          :tabs="songTabs"
          :default-tab="activeSongTab"
          :doc-presence="detailDocPresence"
          :swipeable="!karaokeMode && songTabs.length > 1"
          @tab-change="handleTabChange"
        >
          <!-- Tab: Letra -->
          <template #tab-letra>
            <div
              v-if="karaokeMode && lyricsDoc.hasContent"
              class="lyrics-container karaoke-mode"
            >
              <div class="lyrics-content">
                <div class="karaoke-lyrics">
                  <div
                    v-for="(verse, index) in verses"
                    :key="index"
                    class="verse"
                    :class="{
                      active: index === currentVerse,
                      completed: index < currentVerse,
                      upcoming: index > currentVerse
                    }"
                    @click="goToVerse(index)"
                  >
                    <div class="verse-content">{{ verse }}</div>
                    <div class="verse-number">{{ index + 1 }}</div>
                  </div>
                </div>
              </div>
            </div>

            <SongDocumentEditor
              v-else
              v-model="lyricsDoc.state.content"
              :loading="lyricsDoc.state.loading"
              :saving="lyricsDoc.state.saving"
              :error="lyricsDoc.state.error"
              :editing="lyricsDoc.state.editing"
              :editable="canEditSongs"
              :has-content="lyricsDoc.hasContent"
              loading-message="Cargando letra..."
              error-title="Error al cargar la letra"
              edit-title="Editar letra"
              placeholder="Escribe la letra de la canción aquí..."
              empty-title="Letra no disponible"
              empty-message="Esta canción no tiene letra disponible aún."
              empty-icon="📝"
              copy-label="Copiar letra"
              @start-edit="lyricsDoc.startEdit"
              @cancel-edit="lyricsDoc.cancelEdit"
              @save="saveLyricsDocument"
              @retry="retryLyricsDocument"
            />
          </template>

          <!-- Tab: Acordes -->
          <template #tab-acordes>
            <SongDocumentEditor
              v-model="chordsDoc.state.content"
              :loading="chordsDoc.state.loading"
              :saving="chordsDoc.state.saving"
              :error="chordsDoc.state.error"
              :editing="chordsDoc.state.editing"
              :editable="canEditSongs"
              :has-content="chordsDoc.hasContent"
              variant="monospace"
              loading-message="Cargando acordes..."
              error-title="Error al cargar los acordes"
              edit-title="Editar acordes"
              placeholder="Escribe los acordes de la canción aquí..."
              copy-label="Copiar acordes"
              @start-edit="chordsDoc.startEdit"
              @cancel-edit="chordsDoc.cancelEdit"
              @save="saveChordsDocument"
              @retry="retryChordsDocument"
            />
          </template>

          <!-- Tab: Análisis -->
          <template #tab-analisis>
            <SongDocumentEditor
              v-model="analysisDoc.state.content"
              :loading="analysisDoc.state.loading"
              :saving="analysisDoc.state.saving"
              :error="analysisDoc.state.error"
              :editing="analysisDoc.state.editing"
              :editable="canEditSongs"
              :has-content="analysisDoc.hasContent"
              loading-message="Cargando análisis..."
              error-title="Error al cargar el análisis"
              edit-title="Editar análisis"
              placeholder="Escribe tu análisis de la canción aquí..."
              copy-label="Copiar análisis"
              @start-edit="analysisDoc.startEdit"
              @cancel-edit="analysisDoc.cancelEdit"
              @save="saveAnalysisDocument"
              @retry="retryAnalysisDocument"
            />
          </template>
        </Tabs>
      </main>

      <!-- Minimalist Karaoke Controls - Floating outside container -->
      <div v-if="karaokeMode" class="minimal-karaoke-controls">
        <button @click="resetKaraoke" class="minimal-btn reset-btn" title="Reiniciar">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M1 4v6h6M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
        </button>
        
        <button @click="previousVerse" class="minimal-btn prev-btn" :disabled="currentVerse === 0" title="Anterior">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        
        <button @click="nextVerse" class="minimal-btn next-btn" :disabled="currentVerse >= verses.length - 1" title="Siguiente">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      <div v-if="showCollectionNavigation && !karaokeMode" class="floating-collection-nav">
        <button
          type="button"
          class="collection-nav-btn"
          :disabled="!previousCollectionSong"
          @click="goToPreviousCollectionSong"
        >
          Anterior
        </button>
        <span class="collection-nav-chip">{{ currentCollectionSongNumber }} / {{ totalCollectionSongs }}</span>
        <button
          type="button"
          class="collection-nav-btn collection-nav-btn--primary"
          :disabled="!nextCollectionSong"
          @click="goToNextCollectionSong"
        >
          Siguiente
        </button>
      </div>

    </div>

    <!-- Edit Song Modal -->
    <Modal :show="showEditModal" @close="closeEditModal">
      <h3 class="text-lg font-bold text-blue-900 mb-4">Editar canción</h3>
      <form @submit.prevent="updateSong" class="flex flex-col gap-3">
        <!-- Campos básicos -->
        <div class="space-y-3">
          <input
            v-model="editForm.title"
            type="text"
            placeholder="Título *"
            class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
            required
          />
          <input
            v-model="editForm.artist"
            type="text"
            placeholder="Artista"
            class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
          />
          <div class="relative">
            <textarea
              v-model="editForm.lyrics"
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
            v-model="editForm.tags"
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
            v-model="editForm.subtitle"
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
                  v-model.number="editForm.tempoNumerator"
                  type="number"
                  placeholder="4"
                  min="1"
                  max="16"
                  class="w-16 px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base text-center"
                />
                <span class="text-gray-400 text-xl font-bold">/</span>
                <input
                  v-model.number="editForm.tempoDenominator"
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
                v-model.number="editForm.bpm"
                type="number"
                placeholder="120"
                min="60"
                max="200"
                class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
              />
            </div>
          </div>
          <textarea
            v-model="editForm.description"
            placeholder="Descripción (opcional)"
            rows="2"
            class="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base resize-none"
          ></textarea>
          
          <!-- Recursos de la canción -->
          <SongResourcesManager v-model="editForm.resources" />
        </div>

        <div class="flex gap-2 mt-2">
          <button
            type="submit"
            class="flex-1 bg-blue-900 text-white rounded py-2 font-semibold hover:bg-blue-800 transition"
          >
            Actualizar
          </button>
          <button
            type="button"
            @click="closeEditModal"
            class="flex-1 bg-gray-200 text-gray-700 rounded py-2 font-semibold hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>

    <!-- Overlay de edición de letra en pantalla completa -->
    <Teleport to="body">
      <div
        v-if="showLetraFull"
        class="letra-fullscreen-overlay fixed inset-0 flex items-center justify-center p-2 sm:p-4"
        @click.self="showLetraFull = false"
      >
      <div
        class="letra-fullscreen-content bg-[var(--color-background-card)] border border-[var(--color-border)] rounded-lg shadow-xl w-full max-w-2xl mx-1 sm:mx-2 p-4 sm:p-6 flex flex-col h-[90vh]"
      >
        <div class="flex justify-between items-center mb-4 pb-3 border-b border-[var(--color-border)]">
          <h4 class="text-lg font-semibold text-[var(--color-heading)]">Editar letra</h4>
          <button
            @click="showLetraFull = false"
            class="text-[var(--color-text-mute)] hover:text-[var(--color-text)] text-xl font-light transition-colors p-1.5 rounded-md hover:bg-[var(--color-background-hover)] leading-none"
            title="Cerrar"
          >
            &times;
          </button>
        </div>
        <textarea
          v-model="editForm.lyrics"
          class="flex-1 w-full px-3 py-3 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-info)] focus:ring-1 focus:ring-[var(--color-info)] text-base resize-none mb-4 font-mono leading-relaxed"
          style="min-height: 200px; max-height: 100%"
          placeholder="Escribe la letra de la canción aquí..."
        ></textarea>
        <div class="flex gap-2 sm:gap-3 pt-3 border-t border-[var(--color-border)]">
          <button
            @click="showLetraFull = false"
            class="flex-1 bg-[var(--color-info)] text-white rounded-md py-2.5 px-4 font-medium hover:opacity-90 active:opacity-80 transition-all shadow-sm"
          >
            Guardar y volver
          </button>
          <button
            @click="showLetraFull = false"
            class="flex-1 bg-[var(--color-background-mute)] text-[var(--color-text)] border border-[var(--color-border)] rounded-md py-2.5 px-4 font-medium hover:bg-[var(--color-background-hover)] active:opacity-80 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Eliminar canción"
      :message="`¿Estás seguro de que quieres eliminar la canción '${cancion?.title}'? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- Floating Player -->
    <FloatingPlayer 
      :show="showResourcePreview" 
      :resource="selectedResource"
      @close="closeResourcePreview"
    />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCancionesStore } from '../stores/canciones'
import { useColeccionesStore } from '../stores/colecciones'
import { useSectionsStore } from '../stores/sections'
import { useDocumentPresenceStore } from '../stores/documentPresence'
import { useNotifications } from '@/composables/useNotifications'
import { usePermissions } from '@/composables/usePermissions'
import { usePersonalTags } from '@/composables/usePersonalTags'
import { useAuthStore } from '@/stores/auth'
import Modal from '../components/Modal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import SongResourcesManager from '../components/SongResourcesManager.vue'
import FloatingPlayer from '../components/FloatingPlayer.vue'
import Tag from '../components/common/Tag.vue'
import KeySelector from '../components/common/KeySelector.vue'
import KeyBadge from '../components/common/KeyBadge.vue'
import Tabs from '../components/common/Tabs.vue'
import SongDocumentEditor from '../components/songs/SongDocumentEditor.vue'
import BackButton from '../components/BackButton.vue'
import RefreshButton from '../components/RefreshButton.vue'
import { useEditableSongDocument } from '@/composables/useEditableSongDocument'
import {
  docBodyHasMeaningfulText,
  extractVersesFromContent,
  htmlToPlainText,
  normalizeDocumentContent,
  prepareDocumentForSave
} from '@/utils/songDocument'
import { Cancion, CancionEnLista, SongResource, SongDocumentPresence } from '@/types/songTypes'
import type { Tab } from '../components/common/Tabs.vue'
import { extractKeyFromTags, setKeyInTags, removeKeyTagFromTags, KEY_TAG_PREFIX, createKeyTag } from '@/utils/keyUtils'

const route = useRoute()
const router = useRouter()
const cancionesStore = useCancionesStore()
const coleccionesStore = useColeccionesStore()
const sectionsStore = useSectionsStore()
const documentPresenceStore = useDocumentPresenceStore()
const authStore = useAuthStore()
const { success, error: showError } = useNotifications()
const { canEditSongs, canDeleteSongs } = usePermissions()

// Personal tags
const {
  loading: personalTagsLoading,
  error: personalTagsError,
  personalTags,
  uniqueTags,
  loadPersonalTags,
  loadUniqueTags,
  addPersonalTag,
  removePersonalTag
} = usePersonalTags()

const showAddPersonalTag = ref(false)
const newPersonalTag = ref('')

// Key (tonalidad) state
const currentKey = ref<string | null>(null)
const savingKey = ref(false)

// Song data
const cancion = ref<Cancion | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const sharedViewFromQuery = computed(() => {
  const from = route.query.from
  return typeof from === 'string' && from.startsWith('/v/') ? from : undefined
})

const collectionFromQuery = computed(() => {
  const from = route.query.from
  return typeof from === 'string' && from.startsWith('/coleccion/') ? from : undefined
})

const backToFromQuery = computed(() => collectionFromQuery.value ?? sharedViewFromQuery.value)

const collectionContextCollectionId = ref<string | null>(null)
const collectionContextReady = ref(false)

const orderedCollectionSongs = computed<CancionEnLista[]>(() => {
  if (!collectionContextReady.value || !collectionFromQuery.value) return []

  const songsFromSections = [
    ...sectionsStore.sectionsWithSongs.flatMap((section) => section.songs),
    ...sectionsStore.unassignedSongs
  ]

  if (songsFromSections.length > 0) return songsFromSections
  return coleccionesStore.collectionSongs
})

const currentCollectionSongIndex = computed(() => {
  if (!cancion.value) return -1
  return orderedCollectionSongs.value.findIndex((song) => String(song.id) === String(cancion.value?.id))
})

const currentCollectionSongNumber = computed(() =>
  currentCollectionSongIndex.value >= 0 ? currentCollectionSongIndex.value + 1 : 0
)

const totalCollectionSongs = computed(() => orderedCollectionSongs.value.length)

const previousCollectionSong = computed(() => {
  const index = currentCollectionSongIndex.value
  return index > 0 ? orderedCollectionSongs.value[index - 1] : null
})

const nextCollectionSong = computed(() => {
  const index = currentCollectionSongIndex.value
  return index >= 0 && index < orderedCollectionSongs.value.length - 1
    ? orderedCollectionSongs.value[index + 1]
    : null
})

const showCollectionNavigation = computed(() =>
  Boolean(collectionFromQuery.value) &&
  totalCollectionSongs.value > 1 &&
  currentCollectionSongIndex.value >= 0
)

const lyricsDoc = useEditableSongDocument({
  load: (id, force) => cancionesStore.getSongLyrics(id, force),
  save: async (id, body) => {
    const song = cancion.value
    if (!song) return
    await cancionesStore.createOrUpdateSongLyrics(id, body, `Letra de ${song.title}`)
    documentPresenceStore.patchSong(id, { lyrics: docBodyHasMeaningfulText(body) })
  },
  transformOnLoad: normalizeDocumentContent,
  loadErrorMessage: 'Error al cargar la letra',
  saveErrorMessage: 'No se pudo guardar la letra. Inténtalo de nuevo.',
  saveSuccessMessage: 'Letra guardada correctamente'
})

const chordsDoc = useEditableSongDocument({
  load: (id, force) => cancionesStore.getSongChords(id, force),
  save: async (id, body) => {
    const song = cancion.value
    if (!song) return
    await cancionesStore.createOrUpdateSongChords(id, body, `Acordes de ${song.title}`)
    documentPresenceStore.patchSong(id, { chords: docBodyHasMeaningfulText(body) })
  },
  transformOnLoad: (content) => prepareDocumentForSave(normalizeDocumentContent(content), { chords: true }),
  transformOnSave: (content) => prepareDocumentForSave(content, { chords: true }),
  loadErrorMessage: 'Error al cargar los acordes',
  saveErrorMessage: 'No se pudo guardar los acordes. Inténtalo de nuevo.',
  saveSuccessMessage: 'Acordes guardados correctamente'
})

const analysisDoc = useEditableSongDocument({
  load: (id, force) => cancionesStore.getSongAnalysis(id, force),
  save: async (id, body) => {
    const song = cancion.value
    if (!song) return
    await cancionesStore.createOrUpdateSongAnalysis(id, body, `Análisis de ${song.title}`)
    documentPresenceStore.patchSong(id, { analysis: docBodyHasMeaningfulText(body) })
  },
  transformOnLoad: normalizeDocumentContent,
  loadErrorMessage: 'Error al cargar el análisis',
  saveErrorMessage: 'No se pudo guardar el análisis. Inténtalo de nuevo.',
  saveSuccessMessage: 'Análisis guardado correctamente'
})

/** Misma semántica que en listas: iconos “encendidos” si hay contenido real cargado. */
const detailDocPresence = computed<SongDocumentPresence>(() => ({
  lyrics: lyricsDoc.hasContent.value,
  chords: chordsDoc.hasContent.value,
  analysis: analysisDoc.hasContent.value
}))

// UI states
const karaokeMode = ref(false)
const currentVerse = ref(0)
const showActionsMenu = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showLetraFull = ref(false)
const showAdvancedFields = ref(false)
const refreshing = ref(false)

// Tabs state
const activeSongTab = ref('letra')

const VALID_SONG_TAB_IDS = ['letra', 'acordes', 'analisis'] as const

const tabFromRoute = computed(() => {
  const t = route.query.tab
  if (typeof t !== 'string') return null
  return (VALID_SONG_TAB_IDS as readonly string[]).includes(t) ? t : null
})

function getCollectionIdFromFromQuery(from: string): string | null {
  return from.replace('/coleccion/', '').split('/')[0] || null
}

function buildSongDetailRoute(song: Pick<Cancion, 'id' | 'title'>) {
  const slug = (song.title || 'sin-titulo').toLowerCase().replace(/\s+/g, '-')
  const query: Record<string, string> = {}

  const from = route.query.from
  if (typeof from === 'string' && from.length > 0) {
    query.from = from
  }

  if (tabFromRoute.value) {
    query.tab = tabFromRoute.value
  }

  return {
    path: `/cancion/${song.id}-${slug}`,
    query
  }
}

async function ensureCollectionContextLoaded(forceRefresh = false) {
  const from = collectionFromQuery.value

  if (!from) {
    collectionContextCollectionId.value = null
    collectionContextReady.value = false
    return
  }

  const collectionId = getCollectionIdFromFromQuery(from)
  if (!collectionId) {
    collectionContextCollectionId.value = null
    collectionContextReady.value = false
    return
  }

  if (collectionContextCollectionId.value === collectionId && collectionContextReady.value && !forceRefresh) {
    return
  }

  try {
    await Promise.all([
      coleccionesStore.loadCollectionSongs(collectionId, forceRefresh),
      sectionsStore.fetchSections(collectionId, forceRefresh)
    ])
    collectionContextCollectionId.value = collectionId
    collectionContextReady.value = true
  } catch (err) {
    collectionContextCollectionId.value = null
    collectionContextReady.value = false
    console.error('Error loading collection context:', err)
  }
}

// Computed para filtrar tabs: mostrar acordes y análisis según permisos y contenido
const songTabs = computed<Tab[]>(() => {
  const tabs: Tab[] = [
    { id: 'letra', label: 'Letra', docIndicator: 'lyrics' }
  ]
  
  // Tab de acordes
  // Si el usuario tiene permisos de edición, siempre mostrar (aunque esté vacío)
  // Si no tiene permisos, solo mostrar si hay contenido
  if (!chordsDoc.state.loading && !chordsDoc.state.error) {
    const hasChordsContent = chordsDoc.hasContent.value

    // Mostrar si tiene contenido O si el usuario puede editar
    if (hasChordsContent || canEditSongs.value) {
      tabs.push({ id: 'acordes', label: 'Acordes', docIndicator: 'chords' })
    }
  }
  
  // Tab de análisis
  // Si el usuario tiene permisos de edición, siempre mostrar (aunque esté vacío)
  // Si no tiene permisos, solo mostrar si hay contenido
  if (!analysisDoc.state.loading && !analysisDoc.state.error) {
    const hasAnalysisContent = analysisDoc.hasContent.value

    // Mostrar si tiene contenido O si el usuario puede editar
    if (hasAnalysisContent || canEditSongs.value) {
      tabs.push({ id: 'analisis', label: 'Análisis', docIndicator: 'analysis' })
    }
  }
  
  return tabs
})

// Sincronizar pestaña con ?tab= y con pestañas disponibles (carga asíncrona de acordes/análisis)
watch(
  [songTabs, tabFromRoute, () => chordsDoc.state.loading, () => analysisDoc.state.loading],
  () => {
    const want = tabFromRoute.value
    const tabs = songTabs.value

    if (want && tabs.some(t => t.id === want)) {
      activeSongTab.value = want
      return
    }

    if (want === 'acordes' && chordsDoc.state.loading) return
    if (want === 'analisis' && analysisDoc.state.loading) return

    if (want && !tabs.some(t => t.id === want)) {
      activeSongTab.value = 'letra'
      return
    }

    if (!tabs.some(t => t.id === activeSongTab.value)) {
      activeSongTab.value = 'letra'
    }
  },
  { immediate: true }
)

// Watch para recargar etiquetas personales cuando cambia la canción
watch(() => cancion.value?.id, async (newSongId) => {
  if (newSongId && authStore.isAuthenticated) {
    await Promise.all([
      loadPersonalTags(newSongId),
      loadUniqueTags()
    ])
  }
})

function handleTabChange(tabId: string) {
  activeSongTab.value = tabId
  router.replace({
    query: {
      ...route.query,
      tab: tabId
    }
  })
}

// Resource states
const showResourcePreview = ref(false)
const selectedResource = ref<SongResource | null>(null)

// Edit form
const editForm = ref({
  title: '',
  artist: '',
  lyrics: '',
  tags: '',
  key: null as string | null,
  subtitle: '',
  tempoNumerator: null,
  tempoDenominator: null,
  bpm: null,
  description: '',
  resources: [] as SongResource[]
})

// Computed para obtener tags sin la tonalidad
const displayTags = computed(() => {
  if (!cancion.value?.tags) return []
  return removeKeyTagFromTags(cancion.value.tags)
})

// Computed para obtener etiquetas personales sin la tonalidad (que tiene su propia sección)
const personalTagsWithoutKey = computed(() => {
  return personalTags.value.filter(tag => !tag.tag_name.startsWith(KEY_TAG_PREFIX))
})

// Computed para obtener la tonalidad de la canción desde las etiquetas personales
const songKey = computed(() => {
  if (!personalTags.value || personalTags.value.length === 0) return null
  // Buscar la tonalidad en las etiquetas personales
  const keyTagNames = personalTags.value.map(tag => tag.tag_name)
  return extractKeyFromTags(keyTagNames)
})

// Watch para actualizar currentKey cuando cambia songKey
watch(songKey, (newKey) => {
  currentKey.value = newKey
}, { immediate: true })

// Watch para actualizar currentKey cuando cambian las etiquetas personales
watch(personalTags, () => {
  const newKey = songKey.value
  if (currentKey.value !== newKey) {
    currentKey.value = newKey
  }
}, { deep: true })

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      loadSong()
    }
  }
)

// Computed
const verses = computed(() => extractVersesFromContent(lyricsDoc.state.content))

// Sugerencias de etiquetas filtradas
const filteredSuggestions = computed(() => {
  if (!newPersonalTag.value) return []
  const query = newPersonalTag.value.toLowerCase().trim()
  return uniqueTags.value
    .filter(tag => tag.toLowerCase().includes(query) && !personalTags.value.some(pt => pt.tag_name === tag))
    .slice(0, 5)
})

// Methods
/** Si `forceRefresh`, metadatos y documentos se piden a la API y luego se guardan en caché (no se sirve primero desde caché). */
async function loadSong(forceRefresh = false) {
  loading.value = true
  error.value = null
  void ensureCollectionContextLoaded(forceRefresh)
  
  try {
    const songId = route.params.id as string
    const [foundSong] = await Promise.all([
      cancionesStore.getCancionById(songId, forceRefresh),
      lyricsDoc.load(songId, forceRefresh).catch(() => {})
    ])
    cancion.value = foundSong
    
    if (foundSong) {
      loading.value = false
      chordsDoc.load(songId, forceRefresh)
      analysisDoc.load(songId, forceRefresh)
      if (forceRefresh) {
        void documentPresenceStore.ensureSynced([foundSong.id], { force: true })
      }
      if (authStore.isAuthenticated) {
        loadPersonalTags(songId)
        loadUniqueTags()
      }
    } else {
      loading.value = false
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al cargar la canción'
    console.error('Error loading song:', err)
  } finally {
    loading.value = false
  }
}

async function saveLyricsDocument() {
  if (!cancion.value) return
  await lyricsDoc.save(cancion.value.id, canEditSongs.value)
}

async function saveChordsDocument() {
  if (!cancion.value) return
  await chordsDoc.save(cancion.value.id, canEditSongs.value)
}

async function saveAnalysisDocument() {
  if (!cancion.value) return
  await analysisDoc.save(cancion.value.id, canEditSongs.value)
}

function retryLyricsDocument() {
  if (cancion.value) {
    lyricsDoc.retry(cancion.value.id)
  }
}

function retryChordsDocument() {
  if (cancion.value) {
    chordsDoc.retry(cancion.value.id)
  }
}

function retryAnalysisDocument() {
  if (cancion.value) {
    analysisDoc.retry(cancion.value.id)
  }
}

function retryLoad() {
  loadSong()
}

/** Recarga canción, letra, acordes y análisis desde API (omite caché de lectura) y actualiza caché con la respuesta. */
async function refreshData() {
  const songId = route.params.id as string;
  if (songId) {
    await loadSong(true);
  }
}

function goToCollectionSong(song: CancionEnLista | null) {
  if (!song) return
  showActionsMenu.value = false
  karaokeMode.value = false
  router.push(buildSongDetailRoute(song))
}

function goToPreviousCollectionSong() {
  goToCollectionSong(previousCollectionSong.value)
}

function goToNextCollectionSong() {
  goToCollectionSong(nextCollectionSong.value)
}

function toggleActionsMenu() {
  showActionsMenu.value = !showActionsMenu.value
}

function toggleKaraoke() {
  karaokeMode.value = !karaokeMode.value
  showActionsMenu.value = false
  if (karaokeMode.value) {
    currentVerse.value = 0
  }
}

function editSong() {
  if (!cancion.value) return
  
  // Obtener tags sin la tonalidad (la tonalidad se edita directamente en la vista)
  const tagsWithoutKey = removeKeyTagFromTags(cancion.value.tags || [])
  
  editForm.value = {
    title: cancion.value.title || '',
    artist: cancion.value.artist || '',
    lyrics: htmlToPlainText(lyricsDoc.state.content) || '',
    tags: tagsWithoutKey.join(', '),
    key: null, // No se edita en el modal
    subtitle: cancion.value.subtitle || '',
    tempoNumerator: cancion.value.tempo ? parseInt(cancion.value.tempo.split('/')[0]) : null,
    tempoDenominator: cancion.value.tempo ? parseInt(cancion.value.tempo.split('/')[1]) : null,
    bpm: cancion.value.bpm,
    description: '',
    resources: cancion.value.resources || []
  }
  showEditModal.value = true
  showActionsMenu.value = false
}

function deleteSong() {
  showDeleteModal.value = true
  showActionsMenu.value = false
}

async function updateSong() {
  if (!cancion.value) return

  if (!editForm.value.title.trim()) {
    showError('Error', 'El título de la canción es obligatorio');
    return;
  }

  try {
    let tempo = null;
    if (editForm.value.tempoNumerator && editForm.value.tempoDenominator) {
      tempo = `${editForm.value.tempoNumerator}/${editForm.value.tempoDenominator}`;
    }

    // La tonalidad ahora es una etiqueta personal, no se guarda en song.tags
    const tagsArray = editForm.value.tags.split(',').map(t => t.trim()).filter(Boolean)
    
    const updates = {
      title: editForm.value.title.trim(),
      artist: editForm.value.artist.trim(),
      subtitle: editForm.value.subtitle.trim() || null,
      tempo: tempo,
      bpm: editForm.value.bpm || null,
      tags: tagsArray,
      resources: editForm.value.resources.filter(r => r.url.trim())
    }

    await cancionesStore.updateCancion(cancion.value.id, updates)
    
    // Update lyrics if provided
    if (editForm.value.lyrics.trim()) {
      try {
        const normalizedLyrics = normalizeDocumentContent(editForm.value.lyrics.trim())
        await cancionesStore.createOrUpdateSongLyrics(
          cancion.value.id,
          normalizedLyrics,
          editForm.value.description.trim() || `Letra de ${updates.title}`
        )
        lyricsDoc.state.content = normalizedLyrics
        documentPresenceStore.patchSong(cancion.value.id, {
          lyrics: docBodyHasMeaningfulText(normalizedLyrics)
        })
      } catch (lyricsErr) {
        console.error('Error al actualizar la letra:', lyricsErr)
        showError('Error', 'Canción actualizada pero no se pudo guardar la letra')
      }
    }
    
    // Update local song data
    cancion.value = { ...cancion.value, ...updates }
    
    success('Éxito', `Canción "${updates.title}" actualizada correctamente`)
    closeEditModal()
  } catch (err) {
    console.error('Error al actualizar canción:', err)
    showError('Error', 'No se pudo actualizar la canción. Inténtalo de nuevo.')
  }
}

async function confirmDelete() {
  if (!cancion.value) return

  try {
    const id = cancion.value.id
    await cancionesStore.deleteCancion(id)
    documentPresenceStore.removeSong(id)
    success('Éxito', `Canción "${cancion.value.title}" eliminada correctamente`)
    router.push('/canciones')
  } catch (err) {
    console.error('Error al eliminar canción:', err)
    showError('Error', 'No se pudo eliminar la canción. Inténtalo de nuevo.')
  }
}

function closeEditModal() {
  showEditModal.value = false
  showAdvancedFields.value = false
  showLetraFull.value = false
  editForm.value = { 
    title: '', 
    artist: '', 
    lyrics: '', 
    tags: '',
    key: null,
    subtitle: '',
    tempoNumerator: null,
    tempoDenominator: null,
    bpm: null,
    description: '',
    resources: []
  }
}

function cancelDelete() {
  showDeleteModal.value = false
}

// Resource functions
function openResourcePreview(resource: SongResource) {
  selectedResource.value = resource
  showResourcePreview.value = true
  showActionsMenu.value = false // Cerrar el menú de acciones
}

function closeResourcePreview() {
  showResourcePreview.value = false
  selectedResource.value = null
}

// Función para obtener el icono del recurso (iconos oficiales de marcas)
function getResourceIcon(type: string): string {
  const icons: Record<string, string> = {
    'spotify': `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>`,
    'youtube': `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>`,
    'facebook': `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>`,
    'instagram': `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>`,
    'apple-music': `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>`,
    'image': `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21,15 16,10 5,21"/>
    </svg>`,
    'video': `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>`,
    'audio': `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>`,
    'other': `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 1 5.656 0l4-4a4 4 0 0 1-5.656-5.656l-1.1 1.1"/>
    </svg>`
  }
  return icons[type] || icons['other']
}

// Función para obtener el nombre del recurso
function getResourceName(resource: SongResource): string {
  // Si tiene label personalizado, usarlo
  if (resource.label && resource.label.trim()) {
    return resource.label.trim()
  }
  
  // Si no, usar el nombre por defecto basado en el type
  const names: Record<string, string> = {
    'spotify': 'Spotify',
    'youtube': 'YouTube',
    'facebook': 'Facebook',
    'instagram': 'Instagram',
    'apple-music': 'Apple Music',
    'image': 'Imagen',
    'video': 'Video',
    'audio': 'Audio',
    'other': 'Otro'
  }
  return names[resource.type] || 'Otro'
}

// Karaoke functions
function nextVerse() {
  if (currentVerse.value < verses.value.length - 1) {
    currentVerse.value++
    scrollToActiveVerse()
  }
}

function previousVerse() {
  if (currentVerse.value > 0) {
    currentVerse.value--
    scrollToActiveVerse()
  }
}

function scrollToActiveVerse() {
  setTimeout(() => {
    const activeVerse = document.querySelector('.verse.active')
    if (activeVerse) {
      activeVerse.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
    }
  }, 100)
}

function resetKaraoke() {
  currentVerse.value = 0
  scrollToActiveVerse()
}

function goToVerse(index: number) {
  if (index >= 0 && index < verses.value.length) {
    currentVerse.value = index
    scrollToActiveVerse()
  }
}

// Keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  if (!karaokeMode.value) return
  
  switch (event.key) {
    case 'ArrowRight':
    case ' ':
      event.preventDefault()
      nextVerse()
      break
    case 'ArrowLeft':
      event.preventDefault()
      previousVerse()
      break
    case 'Home':
      event.preventDefault()
      resetKaraoke()
      break
  }
}


// Personal tags handlers
async function addPersonalTagHandler() {
  if (!cancion.value || !newPersonalTag.value.trim()) return

  try {
    await addPersonalTag(cancion.value.id, newPersonalTag.value.trim())
    newPersonalTag.value = ''
    showAddPersonalTag.value = false
    success('Éxito', 'Etiqueta personal agregada correctamente')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error al agregar etiqueta personal'
    showError('Error', errorMessage)
  }
}

async function removePersonalTagHandler(tagId: string) {
  try {
    await removePersonalTag(tagId)
    success('Éxito', 'Etiqueta personal eliminada correctamente')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error al eliminar etiqueta personal'
    showError('Error', errorMessage)
  }
}

function selectSuggestion(suggestion: string) {
  newPersonalTag.value = suggestion
  addPersonalTagHandler()
}

// Handler para cambio de tonalidad (ahora como etiqueta personal)
async function handleKeyChange(newKey: string | null) {
  if (!cancion.value || !authStore.isAuthenticated) return
  
  savingKey.value = true
  
  try {
    // Buscar la etiqueta de tonalidad existente en las etiquetas personales
    const existingKeyTag = personalTags.value.find(tag => tag.tag_name.startsWith(KEY_TAG_PREFIX))
    
    // Si hay una tonalidad existente, eliminarla
    if (existingKeyTag) {
      await removePersonalTag(existingKeyTag.id)
    }
    
    // Si hay una nueva tonalidad, agregarla como etiqueta personal
    if (newKey) {
      const keyTagName = createKeyTag(newKey)
      if (keyTagName) {
        await addPersonalTag(cancion.value.id, keyTagName)
      }
    }
    
    // Recargar las etiquetas personales para actualizar la UI
    await loadPersonalTags(cancion.value.id)
    
    success('Éxito', 'Tonalidad actualizada correctamente')
  } catch (err) {
    console.error('Error al actualizar tonalidad:', err)
    showError('Error', 'No se pudo actualizar la tonalidad. Inténtalo de nuevo.')
    // Revertir el valor en el selector
    currentKey.value = songKey.value
  } finally {
    savingKey.value = false
  }
}

function handleTagInputBlur() {
  // Cerrar el input solo si está vacío y hay etiquetas
  if (!newPersonalTag.value.trim() && personalTags.value.length > 0) {
    setTimeout(() => {
      showAddPersonalTag.value = false
    }, 200) // Delay para permitir clicks en sugerencias
  }
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.actions-menu')) {
    showActionsMenu.value = false
  }
}

onMounted(() => {
  loadSong()
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.song-detail-container {
  min-height: 100vh;
  background: var(--color-background);
  display: flex;
  flex-direction: column;
}

/* Loading & Error States */
.loading-state, .error-state, .not-found-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-text-soft);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon, .not-found-icon, .placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  background: var(--cf-navy);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 1rem;
  transition: background 0.2s ease;
}

.retry-btn:hover {
  background: var(--cf-navy-dark);
}

/* Main Song View: sin padding global — el header al borde como collection-detail + collection-main con padding */
.song-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 0;
}

.song-view.karaoke-active {
  max-width: none;
  padding: 0;
}

/* Compact Header - alineado con .collection-header */
.song-header {
  padding: 0.75rem 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
  margin-bottom: 0;
  background: var(--color-background);
  border-bottom: none;
  transition: background-color var(--transition-normal);
}

.song-header--shared {
  padding: 0.75rem 1rem;
}

.song-header--shared .song-title {
  font-size: 1.1rem;
}

.song-header--shared .header-back :deep(.back-btn) {
  color: var(--color-text-mute);
  padding: 0.375rem 0;
}

.song-header--shared .header-back :deep(.back-btn:hover) {
  color: var(--color-text);
}

.song-header--shared .header-back :deep(.back-label) {
  font-size: 0.8125rem;
  font-weight: 500;
}

.header-back {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

/* Artista y Meta - mismo acolchado horizontal que .collection-main */
.song-info-section {
  padding: 0.75rem 1rem 0;
  margin-bottom: 0.5rem;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.header-row-top {
  margin-bottom: 0;
  gap: 0;
}

.header-row-bottom {
  align-items: flex-start;
}

.header-row-meta {
  padding-top: 0.5rem;
  margin-top: 0.25rem;
  align-items: center;
}

.collection-nav-btn {
  border: 1px solid var(--color-border);
  background: var(--color-background-card);
  color: var(--color-text);
  border-radius: 999px;
  padding: 0.75rem 1.2rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(10px);
  -webkit-tap-highlight-color: transparent;
}

.collection-nav-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
}

.collection-nav-btn:disabled {
  opacity: 1;
  cursor: not-allowed;
  background: var(--color-background-soft);
  border-color: var(--color-border);
  color: var(--color-text-mute);
  box-shadow: none;
  transform: none;
}

.collection-nav-btn--primary {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-text-inverse, #fff);
}

.collection-nav-btn--primary:disabled {
  background: var(--color-background-soft);
  border-color: var(--color-border);
  color: var(--color-text-mute);
}

.collection-nav-btn--primary:hover:not(:disabled) {
  color: var(--color-text-inverse, #fff);
  border-color: var(--color-accent);
  opacity: 0.92;
}

.collection-nav-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 0.95rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  color: var(--color-heading);
  font-size: 0.85rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}

.floating-collection-nav {
  position: fixed;
  left: 50%;
  bottom: 2rem;
  transform: translateX(-50%);
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.15rem;
  max-width: calc(100% - 1.5rem);
  pointer-events: none;
}

.floating-collection-nav > * {
  pointer-events: auto;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.song-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-heading);
  margin: 0;
  line-height: 1.3;
  flex: 1;
  min-width: 0;
  text-align: left;
  word-break: break-word;
  transition: color var(--transition-normal);
}

.song-artist {
  font-size: 1.1rem;
  color: var(--color-accent);
  margin: 0;
  font-weight: 500;
  transition: color var(--transition-normal);
  flex: 1;
  min-width: 0;
}

.song-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
}

.meta-item {
  background: var(--color-background-soft);
  color: var(--color-text);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid var(--color-border);
  transition: all var(--transition-normal);
}


/* Actions Menu - ahora dentro de header-actions */
.actions-menu {
  position: relative;
  flex-shrink: 0;
}

.menu-toggle {
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 0.5rem;
  margin: 0;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-mute);
  min-width: 2.75rem;
  min-height: 2.75rem;
  -webkit-tap-highlight-color: transparent;
}

.menu-toggle:hover {
  color: var(--color-heading);
  background: transparent;
}

.menu-toggle:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

.menu-toggle.active {
  color: var(--color-accent);
  background: transparent;
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
  min-width: 260px;
  max-height: min(85vh, 32rem);
  margin-top: 0.5rem;
  overflow-x: hidden;
  overflow-y: auto;
}

.action-item {
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
  transition: all 0.2s ease;
  text-align: left;
}

.action-item:hover {
  background: var(--color-background-hover);
  color: var(--color-accent);
}

.action-item.danger {
  color: var(--color-error);
}

.action-item.danger:hover {
  background: var(--color-error);
  color: var(--color-text-inverse);
}

.divider {
  margin: 0;
  border: none;
  border-top: 1px solid var(--color-border);
}

/* Resources Section in Actions Menu (homogeneous style) */
.resources-section {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
}

.resource-item {
  /* Same styling as other action items */
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--cf-navy);
  transition: background 0.2s ease;
  text-align: left;
}

.resource-item:hover {
  background: var(--color-background-soft);
}

.resource-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.resource-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Karaoke Header */
.karaoke-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
}

.karaoke-song-info {
  flex: 1;
}

.karaoke-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

.karaoke-artist {
  font-size: 1rem;
  color: var(--color-text);
  margin: 0;
  font-weight: 500;
}

.karaoke-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.action-btn.active {
  background: var(--color-background-mute);
  color: var(--color-text);
}

/* Karaoke Progress Bar */
.karaoke-progress-fixed {
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 2rem;
  position: sticky;
  top: 80px;
  z-index: 100;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--color-text-soft);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

/* Tabs Section - equivalente a .collection-main (contenido bajo el header) */
.tabs-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  width: 100%;
}

.tabs-section--with-collection-nav {
  padding-bottom: 6rem;
}

/* Karaoke lyrics container */
.lyrics-container {
  flex: 1;
  background: var(--color-background-card);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}


.lyrics-container.karaoke-mode {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  min-height: 100vh;
  margin: -1rem;
  border-radius: 0;
  border: none;
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
}

/* En pantallas grandes, usar ancho normal para respetar el sidebar */
@media (min-width: 1024px) {
  .lyrics-container.karaoke-mode {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    left: auto;
    right: auto;
    position: static;
  }
  
  .karaoke-header {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    left: auto;
    right: auto;
    position: static;
  }
  
  .karaoke-progress-fixed {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    position: static;
  }
}

/* Minimalist Karaoke Controls */
.minimal-karaoke-controls {
  position: fixed;
  bottom: 150px;
  right: 25px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.minimal-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.minimal-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.minimal-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.minimal-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

/* Lyrics Content */
.lyrics-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.karaoke-lyrics {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.verse {
  padding: 2rem 1.5rem;
  border-radius: 16px;
  transition: all 0.4s ease;
  opacity: 0.8;
  transform: scale(0.95);
  margin-bottom: 1rem;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  user-select: none;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.verse:hover {
  opacity: 0.9;
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.08);
}

.verse.active {
  opacity: 1;
  transform: scale(1.02);
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }
  50% {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }
}

.verse.completed {
  opacity: 0.7;
  background: rgba(255, 255, 255, 0.08);
  transform: scale(0.98);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.verse.upcoming {
  opacity: 0.6;
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.verse-content {
  font-size: 1rem;
  line-height: 1.6;
  text-align: center;
  white-space: pre-line;
  flex: 1;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.verse-number {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.9;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.verse:hover .verse-number {
  opacity: 1;
  background: rgba(255, 255, 255, 0.35);
}

.verse.active .verse-number {
  background: rgba(255, 255, 255, 0.9);
  color: var(--cf-navy-dark);
  opacity: 1;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.9);
}

/* Letras karaoke: mobile first, más grandes en escritorio */
@media (min-width: 640px) {
  .verse-content {
    font-size: 1.1rem;
  }
}

@media (min-width: 901px) {
  .verse-content {
    font-size: 1.25rem;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .tabs-section {
    padding: 0.75rem;
  }
  
  .song-header {
    padding: 0.75rem 1rem;
  }
  
  .header-row {
    gap: 0.75rem;
  }

  .header-row-top {
    gap: 0;
  }
  
  .header-row-bottom {
    padding-top: 0.5rem;
  }
  
  .header-row-meta {
    padding-top: 0.375rem;
    margin-top: 0.25rem;
  }

  .collection-nav-btn {
    padding: 0.65rem 1rem;
    font-size: 0.82rem;
  }

  .collection-nav-chip {
    font-size: 0.8rem;
    padding: 0.5rem 0.85rem;
  }

  .floating-collection-nav {
    bottom: 1.65rem;
    gap: 1rem;
  }
  
  .header-actions {
    gap: 0.375rem;
  }
  
  .song-title {
    font-size: 1.1rem;
  }
  
  .song-artist {
    font-size: 1rem;
  }
  
  .actions-dropdown {
    right: 0;
    left: auto;
  }
  
  .lyrics-content {
    padding: 1rem 1.5rem 1rem 1rem;
  }
  
  .karaoke-header {
    padding: 0.75rem 1rem;
    margin-left: calc(-50vw + 50%);
    margin-right: calc(-50vw + 50%);
  }
  
  .karaoke-progress-fixed {
    padding: 0.75rem 1rem;
    margin-left: calc(-50vw + 50%);
    margin-right: calc(-50vw + 50%);
    top: 60px;
  }
  
  .karaoke-title {
    font-size: 1.2rem;
  }
  
  .karaoke-artist {
    font-size: 0.9rem;
  }
  
  .minimal-karaoke-controls {
    bottom: 100px;
    right: 10px;
    gap: 0.4rem;
  }
  
  .minimal-btn {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 480px) {
  .song-header {
    padding: 0.5rem 0.75rem;
  }

  .song-header--shared {
    padding: 0.5rem 0.75rem;
  }

  .song-info-section {
    padding: 0.5rem 0.75rem 0;
  }

  .tabs-section {
    padding: 0.5rem;
  }

  .song-title {
    font-size: 0.9rem;
  }

  .collection-nav-btn {
    padding: 0.6rem 0.9rem;
    font-size: 0.78rem;
  }

  .collection-nav-chip {
    font-size: 0.75rem;
    padding: 0.45rem 0.75rem;
  }

  .floating-collection-nav {
    bottom: 1.35rem;
    gap: 0.85rem;
    max-width: calc(100% - 0.75rem);
  }
  
  .song-artist {
    font-size: 0.9rem;
  }
  
  .minimal-karaoke-controls {
    bottom: 90px;
    right: 15px;
    gap: 0.3rem;
  }
  
  .minimal-btn {
    width: 32px;
    height: 32px;
  }
}

/* Estilos para el modal de pantalla completa de letras */
.letra-fullscreen-overlay {
  background: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(8px) !important;
  z-index: 99999 !important;
}

.letra-fullscreen-content {
  background: var(--color-background-card) !important;
  border: 1px solid var(--color-border) !important;
  box-shadow: var(--shadow-xl) !important;
  z-index: 100000 !important;
  position: relative;
}

/* Tonalidad */
.header-row-key {
  padding-top: 0.75rem;
  margin-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.key-section {
  width: 100%;
}

.key-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.key-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-soft);
  margin: 0;
}

.key-selector-wrapper {
  width: 100%;
  max-width: 300px;
}

/* Etiquetas Personales */
.header-row-personal-tags {
  padding-top: 0.75rem;
  margin-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.personal-tags-section {
  width: 100%;
}

.personal-tags-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.personal-tags-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-soft);
  margin: 0;
}

.add-tag-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text-soft);
  cursor: pointer;
  transition: all 0.2s;
}

.add-tag-btn:hover {
  background: var(--color-background-mute);
  border-color: var(--cf-navy);
  color: var(--cf-navy);
}

.personal-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.personal-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background: rgba(var(--cf-navy-rgb, 30, 58, 138), 0.1);
  border: 1px solid rgba(var(--cf-navy-rgb, 30, 58, 138), 0.3);
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--cf-navy);
  transition: all 0.2s;
}

.personal-tag:hover {
  background: rgba(var(--cf-navy-rgb, 30, 58, 138), 0.15);
  border-color: rgba(var(--cf-navy-rgb, 30, 58, 138), 0.4);
}

.remove-tag-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--cf-navy);
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
  border-radius: 2px;
}

.remove-tag-btn:hover:not(:disabled) {
  opacity: 1;
  background: rgba(var(--cf-navy-rgb, 30, 58, 138), 0.1);
}

.remove-tag-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.add-tag-input-wrapper {
  position: relative;
  margin-top: 0.5rem;
}

.add-tag-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.add-tag-input:focus {
  outline: none;
  border-color: var(--cf-navy);
  box-shadow: 0 0 0 3px rgba(var(--cf-navy-rgb, 30, 58, 138), 0.1);
}

.add-tag-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tag-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  padding: 0.25rem;
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.tag-suggestion {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
}

.tag-suggestion:hover {
  background: var(--color-background-mute);
  color: var(--cf-navy);
}

.show-add-tag-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: 1px dashed var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-soft);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.show-add-tag-btn:hover {
  border-color: var(--cf-navy);
  color: var(--cf-navy);
  background: rgba(var(--cf-navy-rgb, 30, 58, 138), 0.05);
}

@media (max-width: 768px) {
  .header-row-key {
    padding-top: 0.5rem;
    margin-top: 0.375rem;
  }

  .key-title {
    font-size: 0.8125rem;
  }

  .key-selector-wrapper {
    max-width: 100%;
  }

  .header-row-personal-tags {
    padding-top: 0.5rem;
    margin-top: 0.375rem;
  }

  .personal-tags-title {
    font-size: 0.8125rem;
  }

  .personal-tag {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
}
</style> 