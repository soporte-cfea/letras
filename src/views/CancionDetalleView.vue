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
      <router-link to="/canciones" class="back-btn">Volver a Canciones</router-link>
    </div>

    <!-- Main Song View -->
    <div v-else class="song-view" :class="{ 'karaoke-active': karaokeMode }">
      <!-- Compact Header -->
      <header v-if="!karaokeMode" class="song-header">
        <div class="song-info">
          <h1 class="song-title">{{ cancion.title }}</h1>
          <p class="song-artist">{{ cancion.artist }}</p>
          <div class="song-meta">
            <span v-if="cancion.bpm" class="meta-item">BPM: {{ cancion.bpm }}</span>
            <span v-if="cancion.tempo" class="meta-item">{{ cancion.tempo }}</span>
            <Tag v-for="tag in cancion.tags" :key="tag" :tag="tag" />
          </div>
        </div>

        <!-- Actions Menu -->
        <div class="actions-menu">
          <button @click="toggleActionsMenu" class="menu-toggle" :class="{ active: showActionsMenu }">
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
      </header>

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
      <main class="tabs-section">
        <Tabs :tabs="songTabs" :default-tab="activeSongTab" @tab-change="handleTabChange">
          <!-- Tab: Letra -->
          <template #tab-letra>
            <div v-if="loadingLyrics" class="lyrics-loading">
              <div class="loading-spinner"></div>
              <p>Cargando letra...</p>
            </div>

            <div v-else-if="lyricsError" class="lyrics-error">
              <div class="error-icon">⚠️</div>
              <h3>Error al cargar la letra</h3>
              <p>{{ lyricsError }}</p>
              <button @click="retryLyrics" class="retry-btn">Reintentar</button>
            </div>

            <div v-else-if="!lyrics" class="lyrics-placeholder">
              <div class="placeholder-icon">📝</div>
              <h3>Letra no disponible</h3>
              <p>Esta canción no tiene letra disponible aún.</p>
            </div>

            <div v-else class="lyrics-container" :class="{ 'karaoke-mode': karaokeMode }">
              <!-- Copy Button -->
              <button 
                v-if="!karaokeMode && lyrics" 
                @click="copyLyrics" 
                class="copy-button"
                :class="{ 'copied': copyButtonState === 'copied' }"
                :title="copyButtonState === 'copied' ? '¡Copiado!' : 'Copiar letra'"
              >
                <svg v-if="copyButtonState === 'idle'" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <svg v-else-if="copyButtonState === 'copied'" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span v-if="copyButtonState === 'copied'" class="copy-text">¡Copiado!</span>
              </button>

              <!-- Lyrics Content -->
              <div class="lyrics-content">
                <div v-if="karaokeMode" class="karaoke-lyrics">
                  <div 
                    v-for="(verse, index) in verses" 
                    :key="index"
                    class="verse"
                    :class="{ 
                      'active': index === currentVerse,
                      'completed': index < currentVerse,
                      'upcoming': index > currentVerse
                    }"
                    @click="goToVerse(index)"
                  >
                    <div class="verse-content">{{ verse }}</div>
                    <div class="verse-number">{{ index + 1 }}</div>
                  </div>
                </div>
                <div v-else class="normal-lyrics">
                  <pre>{{ lyrics }}</pre>
                </div>
              </div>
            </div>
          </template>

          <!-- Tab: Acordes -->
          <template #tab-acordes>
            <div class="chords-container">
              <div v-if="loadingChords" class="chords-loading">
                <div class="loading-spinner"></div>
                <p>Cargando acordes...</p>
              </div>
              
              <div v-else-if="chordsError" class="chords-error">
                <div class="error-icon">⚠️</div>
                <h3>Error al cargar los acordes</h3>
                <p>{{ chordsError }}</p>
                <button @click="loadChords(cancion!.id)" class="retry-btn">Reintentar</button>
              </div>
              
              <div v-else class="chords-editor-wrapper">
                <!-- Modo solo lectura: solo mostrar el HTML sin editor -->
                <RichTextContent
                  v-if="!canEditSongs"
                  :content="chordsContent || ''"
                />
                
                <!-- Modo edición con botones -->
                <template v-else>
                  <!-- Botón flotante de editar -->
                  <button
                    v-if="!editingChords"
                    @click="startEditChords"
                    class="floating-edit-btn"
                    title="Editar acordes"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  
                  <!-- Botones flotantes de guardar/cancelar -->
                  <div v-else class="floating-edit-actions">
                    <button
                      @click="saveChords"
                      :disabled="savingChords"
                      class="floating-save-btn"
                      title="Guardar"
                    >
                      <svg v-if="!savingChords" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                      <span v-else class="loading-spinner-small"></span>
                    </button>
                    <button
                      @click="cancelEditChords"
                      :disabled="savingChords"
                      class="floating-cancel-btn"
                      title="Cancelar"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  
                  <!-- Contenido: solo lectura o editor -->
                  <RichTextContent
                    v-if="!editingChords"
                    :content="chordsContent || ''"
                  />
                  <RichTextEditorAdvanced
                    v-else
                    v-model="chordsContent"
                    :editable="true"
                    placeholder="Escribe los acordes de la canción aquí..."
                  />
                </template>
              </div>
            </div>
          </template>

          <!-- Tab: Análisis -->
          <template #tab-analisis>
            <div class="analysis-container">
              <div v-if="loadingAnalysis" class="analysis-loading">
                <div class="loading-spinner"></div>
                <p>Cargando análisis...</p>
              </div>
              
              <div v-else-if="analysisError" class="analysis-error">
                <div class="error-icon">⚠️</div>
                <h3>Error al cargar el análisis</h3>
                <p>{{ analysisError }}</p>
                <button @click="loadAnalysis(cancion!.id)" class="retry-btn">Reintentar</button>
              </div>
              
              <div v-else class="analysis-editor-wrapper">
                <!-- Modo solo lectura: solo mostrar el HTML sin editor -->
                <RichTextContent
                  v-if="!canEditSongs"
                  :content="analysisContent || ''"
                />
                
                <!-- Modo edición con botones -->
                <template v-else>
                  <!-- Botón flotante de editar -->
                  <button
                    v-if="!editingAnalysis"
                    @click="startEditAnalysis"
                    class="floating-edit-btn"
                    title="Editar análisis"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  
                  <!-- Botones flotantes de guardar/cancelar -->
                  <div v-else class="floating-edit-actions">
                    <button
                      @click="saveAnalysis"
                      :disabled="savingAnalysis"
                      class="floating-save-btn"
                      title="Guardar"
                    >
                      <svg v-if="!savingAnalysis" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                      <span v-else class="loading-spinner-small"></span>
                    </button>
                    <button
                      @click="cancelEditAnalysis"
                      :disabled="savingAnalysis"
                      class="floating-cancel-btn"
                      title="Cancelar"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  
                  <!-- Contenido: solo lectura o editor -->
                  <RichTextContent
                    v-if="!editingAnalysis"
                    :content="analysisContent || ''"
                  />
                  <RichTextEditorAdvanced
                    v-else
                    v-model="analysisContent"
                    :editable="true"
                    placeholder="Escribe tu análisis de la canción aquí..."
                  />
                </template>
              </div>
            </div>
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
import { useNotifications } from '@/composables/useNotifications'
import { usePermissions } from '@/composables/usePermissions'
import Modal from '../components/Modal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import SongResourcesManager from '../components/SongResourcesManager.vue'
import FloatingPlayer from '../components/FloatingPlayer.vue'
import Tag from '../components/common/Tag.vue'
import Tabs from '../components/common/Tabs.vue'
import RichTextEditorAdvanced from '../components/common/RichTextEditorAdvanced.vue'
import RichTextContent from '../components/common/RichTextContent.vue'
import { Cancion, SongResource } from '@/types/songTypes'
import type { Tab } from '../components/common/Tabs.vue'

const route = useRoute()
const router = useRouter()
const cancionesStore = useCancionesStore()
const { success, error: showError } = useNotifications()
const { canEditSongs, canDeleteSongs } = usePermissions()

// Song data
const cancion = ref<Cancion | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Lyrics data
const lyrics = ref<string | null>(null)
const loadingLyrics = ref(false)
const lyricsError = ref<string | null>(null)

// Analysis data
const analysisContent = ref<string>('')
const loadingAnalysis = ref(false)
const savingAnalysis = ref(false)
const analysisError = ref<string | null>(null)
const editingAnalysis = ref(false)
const originalAnalysisContent = ref<string>('')

// Chords data
const chordsContent = ref<string>('')
const loadingChords = ref(false)
const savingChords = ref(false)
const chordsError = ref<string | null>(null)
const editingChords = ref(false)
const originalChordsContent = ref<string>('')

// UI states
const karaokeMode = ref(false)
const currentVerse = ref(0)
const showActionsMenu = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showLetraFull = ref(false)
const showAdvancedFields = ref(false)
const copyButtonState = ref<'idle' | 'copied'>('idle')

// Tabs state
const activeSongTab = ref('letra')

// Computed para filtrar tabs: mostrar acordes y análisis según permisos y contenido
const songTabs = computed<Tab[]>(() => {
  const tabs: Tab[] = [
    { id: 'letra', label: 'Letra' }
  ]
  
  // Tab de acordes
  // Si el usuario tiene permisos de edición, siempre mostrar (aunque esté vacío)
  // Si no tiene permisos, solo mostrar si hay contenido
  if (!loadingChords.value && !chordsError.value) {
    const hasChordsContent = chordsContent.value && 
      chordsContent.value.trim().length > 0 &&
      chordsContent.value.replace(/<[^>]*>/g, '').trim().length > 0
    
    // Mostrar si tiene contenido O si el usuario puede editar
    if (hasChordsContent || canEditSongs.value) {
      tabs.push({ id: 'acordes', label: 'Acordes' })
    }
  }
  
  // Tab de análisis
  // Si el usuario tiene permisos de edición, siempre mostrar (aunque esté vacío)
  // Si no tiene permisos, solo mostrar si hay contenido
  if (!loadingAnalysis.value && !analysisError.value) {
    const hasAnalysisContent = analysisContent.value && 
      analysisContent.value.trim().length > 0 &&
      analysisContent.value.replace(/<[^>]*>/g, '').trim().length > 0
    
    // Mostrar si tiene contenido O si el usuario puede editar
    if (hasAnalysisContent || canEditSongs.value) {
      tabs.push({ id: 'analisis', label: 'Análisis' })
    }
  }
  
  return tabs
})

// Watch para cambiar el tab activo si algún tab se oculta
watch(songTabs, (newTabs) => {
  // Si el tab activo no está en la lista, cambiar a "letra"
  if (!newTabs.some(t => t.id === activeSongTab.value)) {
    activeSongTab.value = 'letra'
  }
}, { immediate: true })

function handleTabChange(tabId: string) {
  activeSongTab.value = tabId
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
  subtitle: '',
  tempoNumerator: null,
  tempoDenominator: null,
  bpm: null,
  description: '',
  resources: [] as SongResource[]
})

// Computed
const verses = computed(() => {
  if (!lyrics.value) return []
  return lyrics.value
    .split('\n\n')
    .filter(verse => verse.trim().length > 0)
    .map(verse => verse.trim())
})

// Helper function para preservar espacios múltiples en acordes
// Convierte espacios múltiples (2+) a &nbsp; para mantener la alineación
function preserveChordsSpaces(html: string): string {
  if (!html) return html
  
  // Procesar el HTML preservando la estructura
  // Reemplazar espacios múltiples (2 o más) dentro del contenido de texto
  // pero no dentro de las etiquetas HTML
  return html.replace(/(>)([^<]*?)(<)/g, (match, before, content, after) => {
    // Solo procesar el contenido entre etiquetas que tenga texto
    if (content.trim().length === 0) return match
    
    // Si el contenido ya tiene &nbsp;, preservarlo y solo procesar espacios normales
    // Dividir por &nbsp; para procesar cada segmento por separado
    const segments = content.split('&nbsp;')
    const processedSegments = segments.map((segment, index) => {
      // Convertir 2 o más espacios seguidos a &nbsp; (excepto el último espacio)
      const processed = segment.replace(/ {2,}/g, (spaces) => {
        return '&nbsp;'.repeat(spaces.length - 1) + ' '
      })
      // Agregar &nbsp; de vuelta entre segmentos (excepto después del último)
      return processed + (index < segments.length - 1 ? '&nbsp;' : '')
    })
    
    return before + processedSegments.join('') + after
  })
}

// Methods
async function loadSong() {
  loading.value = true
  error.value = null
  
  try {
    const songId = route.params.id as string
    const foundSong = await cancionesStore.getCancionById(songId)
    cancion.value = foundSong
    
    if (foundSong) {
      await Promise.all([
        loadLyrics(songId),
        loadChords(songId),
        loadAnalysis(songId)
      ])
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al cargar la canción'
    console.error('Error loading song:', err)
  } finally {
    loading.value = false
  }
}

async function loadLyrics(songId: string) {
  loadingLyrics.value = true
  lyricsError.value = null
  
  try {
    const lyricsText = await cancionesStore.getSongLyrics(songId)
    lyrics.value = lyricsText
  } catch (err) {
    lyricsError.value = err instanceof Error ? err.message : 'Error al cargar la letra'
    console.error('Error loading lyrics:', err)
  } finally {
    loadingLyrics.value = false
  }
}

async function loadChords(songId: string) {
  loadingChords.value = true
  chordsError.value = null
  
  try {
    const chordsText = await cancionesStore.getSongChords(songId)
    // Preservar espacios múltiples convirtiéndolos a &nbsp;
    chordsContent.value = preserveChordsSpaces(chordsText || '')
  } catch (err) {
    chordsError.value = err instanceof Error ? err.message : 'Error al cargar los acordes'
    console.error('Error loading chords:', err)
  } finally {
    loadingChords.value = false
  }
}

async function loadAnalysis(songId: string) {
  loadingAnalysis.value = true
  analysisError.value = null
  
  try {
    const analysisText = await cancionesStore.getSongAnalysis(songId)
    analysisContent.value = analysisText || ''
  } catch (err) {
    analysisError.value = err instanceof Error ? err.message : 'Error al cargar el análisis'
    console.error('Error loading analysis:', err)
  } finally {
    loadingAnalysis.value = false
  }
}

function startEditChords() {
  originalChordsContent.value = chordsContent.value
  editingChords.value = true
}

function cancelEditChords() {
  chordsContent.value = originalChordsContent.value
  editingChords.value = false
}

async function saveChords() {
  if (!cancion.value || !canEditSongs.value) return
  
  savingChords.value = true
  
  try {
    // Preservar espacios múltiples convirtiéndolos a &nbsp; antes de guardar
    const processedContent = preserveChordsSpaces(chordsContent.value)
    await cancionesStore.createOrUpdateSongChords(
      cancion.value.id,
      processedContent,
      `Acordes de ${cancion.value.title}`
    )
    // Actualizar el contenido local con el procesado para mantener consistencia
    chordsContent.value = processedContent
    originalChordsContent.value = processedContent
    editingChords.value = false
    success('Éxito', 'Acordes guardados correctamente')
  } catch (err) {
    console.error('Error saving chords:', err)
    showError('Error', 'No se pudo guardar los acordes. Inténtalo de nuevo.')
  } finally {
    savingChords.value = false
  }
}

function startEditAnalysis() {
  originalAnalysisContent.value = analysisContent.value
  editingAnalysis.value = true
}

function cancelEditAnalysis() {
  analysisContent.value = originalAnalysisContent.value
  editingAnalysis.value = false
}

async function saveAnalysis() {
  if (!cancion.value || !canEditSongs.value) return
  
  savingAnalysis.value = true
  
  try {
    await cancionesStore.createOrUpdateSongAnalysis(
      cancion.value.id,
      analysisContent.value,
      `Análisis de ${cancion.value.title}`
    )
    originalAnalysisContent.value = analysisContent.value
    editingAnalysis.value = false
    success('Éxito', 'Análisis guardado correctamente')
  } catch (err) {
    console.error('Error saving analysis:', err)
    showError('Error', 'No se pudo guardar el análisis. Inténtalo de nuevo.')
  } finally {
    savingAnalysis.value = false
  }
}

function retryLoad() {
  loadSong()
}

function retryLyrics() {
  if (cancion.value) {
    loadLyrics(cancion.value.id)
  }
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
  
  editForm.value = {
    title: cancion.value.title || '',
    artist: cancion.value.artist || '',
    lyrics: lyrics.value || '',
    tags: cancion.value.tags ? cancion.value.tags.join(', ') : '',
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

    const updates = {
      title: editForm.value.title.trim(),
      artist: editForm.value.artist.trim(),
      subtitle: editForm.value.subtitle.trim() || null,
      tempo: tempo,
      bpm: editForm.value.bpm || null,
      tags: editForm.value.tags.split(',').map(t => t.trim()).filter(Boolean),
      resources: editForm.value.resources.filter(r => r.url.trim())
    }

    await cancionesStore.updateCancion(cancion.value.id, updates)
    
    // Update lyrics if provided
    if (editForm.value.lyrics.trim()) {
      try {
        await cancionesStore.createSongLyrics(
          cancion.value.id, 
          editForm.value.lyrics.trim(),
          editForm.value.description.trim() || `Letra de ${updates.title}`
        )
        lyrics.value = editForm.value.lyrics.trim()
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
    await cancionesStore.deleteCancion(cancion.value.id)
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

// Copy lyrics function
async function copyLyrics() {
  if (!lyrics.value) return
  
  try {
    // Intentar usar la API moderna de clipboard primero
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(lyrics.value)
    } else {
      // Fallback para móviles o contextos no seguros
      await fallbackCopyTextToClipboard(lyrics.value)
    }
    
    copyButtonState.value = 'copied'
    
    // Reset button state after 2 seconds
    setTimeout(() => {
      copyButtonState.value = 'idle'
    }, 2000)
  } catch (err) {
    console.error('Error al copiar la letra:', err)
    showError('Error', 'No se pudo copiar la letra. Inténtalo de nuevo.')
  }
}

// Fallback function for older browsers or mobile contexts
async function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement('textarea')
  textArea.value = text
  
  // Evitar scroll hacia el elemento
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  
  try {
    const successful = document.execCommand('copy')
    if (!successful) {
      throw new Error('Fallback: No se pudo copiar el texto')
    }
  } catch (err) {
    throw new Error('Fallback: No se pudo copiar el texto')
  } finally {
    document.body.removeChild(textArea)
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

.retry-btn, .back-btn {
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

.retry-btn:hover, .back-btn:hover {
  background: var(--cf-navy-dark);
}

/* Main Song View */
.song-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 1rem;
}

.song-view.karaoke-active {
  max-width: none;
  padding: 0;
}

/* Compact Header */
.song-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
  transition: color var(--transition-normal);
}

.song-artist {
  font-size: 1.1rem;
  color: var(--color-accent);
  margin: 0 0 0.75rem 0;
  font-weight: 500;
  transition: color var(--transition-normal);
}

.song-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
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


/* Actions Menu */
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
  min-width: 180px;
  margin-top: 0.5rem;
  overflow: hidden;
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

/* Tabs Section */
.tabs-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Analysis Container */
.analysis-container {
  flex: 1;
  background: var(--color-background-card);
  border-radius: 12px;
  padding: 1rem;
  min-height: 400px;
}

.analysis-loading,
.analysis-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
  min-height: 400px;
}

.analysis-loading .loading-spinner {
  margin-bottom: 1rem;
}

.analysis-error .error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.analysis-error h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.analysis-error p {
  color: var(--color-text-soft);
  margin-bottom: 1rem;
}

.analysis-editor-wrapper {
  position: relative;
}

.analysis-saving-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  background: var(--color-background-soft);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

/* Chords Container */
.chords-container {
  flex: 1;
  background: var(--color-background-card);
  border-radius: 12px;
  padding: 0.75rem;
  min-height: 400px;
}

.chords-loading,
.chords-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
  min-height: 400px;
}

.chords-loading .loading-spinner {
  margin-bottom: 1rem;
}

.chords-error .error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.chords-error h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.chords-error p {
  color: var(--color-text-soft);
  margin-bottom: 1rem;
}

.chords-editor-wrapper {
  position: relative;
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
}

/* Aplicar fuente monoespaciada al contenido de acordes (solo lectura) */
.chords-editor-wrapper :deep(.rich-text-content) {
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.15;
  white-space: pre-wrap;
}

.chords-editor-wrapper :deep(.rich-text-content p) {
  margin: 0 0 0.5rem 0;
  line-height: 1.15;
}

/* Solo forzar altura en párrafos completamente vacíos, sin agregar espacio extra */
.chords-editor-wrapper :deep(.rich-text-content p:empty) {
  min-height: 1em;
  display: block;
}

.chords-editor-wrapper :deep(.rich-text-content p:empty::before) {
  content: '\00a0'; /* Espacio no rompible invisible para mantener altura */
  visibility: hidden;
}

.chords-editor-wrapper :deep(.rich-text-content p:last-child) {
  margin-bottom: 0;
}

/* Aplicar fuente monoespaciada al editor de acordes */
.chords-editor-wrapper :deep(.ProseMirror) {
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.15;
  padding: 0.5rem 0.75rem !important;
}

.chords-editor-wrapper :deep(.ProseMirror p) {
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
  margin: 0 0 0.5rem 0;
  padding: 0;
  white-space: pre-wrap;
  line-height: 1.15;
}

.chords-editor-wrapper :deep(.ProseMirror p:last-child) {
  margin-bottom: 0;
}

.chords-editor-wrapper :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
}

.chords-saving-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  background: var(--color-background-soft);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

/* Editor Controls */
.editor-controls {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.edit-btn,
.save-btn,
.cancel-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background-card);
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn {
  background: var(--color-info);
  color: white;
  border-color: var(--color-info);
}

.edit-btn:hover {
  background: var(--color-info-hover, var(--color-info));
  opacity: 0.9;
  transform: translateY(-1px);
}

.edit-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-background-card);
  color: var(--color-text-mute);
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-icon-btn:hover {
  background: var(--color-background-hover);
  color: var(--color-info);
  border-color: var(--color-info);
  transform: translateY(-1px);
}

/* Floating Edit Button */
.floating-edit-btn {
  position: absolute;
  top: 0.5rem;
  right: 1rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background-card);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
}

.floating-edit-btn:hover {
  background: var(--color-background-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Floating Edit Actions */
.floating-edit-actions {
  position: absolute;
  top: 0.5rem;
  right: 1rem;
  z-index: 10;
  display: flex;
  gap: 0.5rem;
}

.floating-save-btn,
.floating-cancel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
}

.floating-save-btn {
  background: var(--color-success);
  color: var(--color-text-inverse);
  border-color: var(--color-success);
}

.floating-save-btn:hover:not(:disabled) {
  background: var(--color-success-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.floating-save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.floating-cancel-btn {
  background: var(--color-background-card);
  color: var(--color-text);
  border-color: var(--color-border);
}

.floating-cancel-btn:hover:not(:disabled) {
  background: var(--color-background-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.floating-cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.save-btn {
  background: var(--color-success);
  color: white;
  border-color: var(--color-success);
}

.save-btn:hover:not(:disabled) {
  background: var(--color-success-hover, var(--color-success));
  opacity: 0.9;
  transform: translateY(-1px);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: var(--color-background-soft);
  color: var(--color-text);
}

.cancel-btn:hover:not(:disabled) {
  background: var(--color-background-hover);
  border-color: var(--color-text-soft);
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

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

/* Copy Button */
.copy-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 500;
  z-index: 10;
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
}

.copy-button:hover {
  background: var(--color-background-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.copy-button.copied {
  background: var(--color-success);
  color: var(--color-text-inverse);
  border-color: var(--color-success);
  transform: scale(1.05);
}

.copy-button.copied:hover {
  background: var(--color-success-hover);
  transform: scale(1.05);
}

.copy-text {
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
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
  font-size: 1.2rem;
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

.normal-lyrics pre {
  font-family: inherit;
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--color-text);
  white-space: pre-wrap;
  margin: 0;
  transition: color var(--transition-normal);
}


/* Responsive */
@media (max-width: 768px) {
  .song-view {
    padding: 0.75rem;
  }
  
  .song-header {
    flex-direction: row;
    gap: 1rem;
    margin-bottom: 1rem;
    align-items: flex-start;
  }
  
  .song-title {
    font-size: 1.5rem;
  }
  
  .song-artist {
    font-size: 1rem;
  }
  
  .actions-menu {
    flex-shrink: 0;
    margin-top: 0.25rem;
  }
  
  .menu-toggle {
    width: 40px;
    height: 40px;
    padding: 0.5rem;
  }
  
  .actions-dropdown {
    right: 0;
    left: auto;
    min-width: 160px;
  }
  
  .lyrics-content {
    padding: 1rem 1.5rem 1rem 1rem;
  }
  
  .verse-content {
    font-size: 1.1rem;
  }
  
  .copy-button {
    top: 0.75rem;
    right: 0.75rem;
    padding: 0.4rem;
    font-size: 0.8rem;
  }
  
  .copy-text {
    font-size: 0.75rem;
  }
  
  .floating-edit-btn,
  .floating-edit-actions {
    top: 0.75rem;
    right: 0.75rem;
  }
  
  .floating-edit-btn,
  .floating-save-btn,
  .floating-cancel-btn {
    padding: 0.4rem;
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
  .song-title {
    font-size: 1.3rem;
  }
  
  .song-artist {
    font-size: 0.9rem;
  }
  
  .verse-content {
    font-size: 1rem;
  }
  
  .normal-lyrics pre {
  font-size: 1rem;
  }
  
  .copy-button {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.35rem;
    font-size: 0.75rem;
  }
  
  .copy-text {
    font-size: 0.7rem;
  }
  
  .floating-edit-btn,
  .floating-edit-actions {
    top: 0.5rem;
    right: 0.5rem;
  }
  
  .floating-edit-btn,
  .floating-save-btn,
  .floating-cancel-btn {
    padding: 0.35rem;
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
</style> 