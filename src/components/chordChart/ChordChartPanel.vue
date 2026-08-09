<template>
  <div class="chord-chart-panel">
    <div v-if="loading" class="chord-chart-panel__state">
      <div class="chord-chart-panel__spinner" />
      <p>Cargando chart...</p>
    </div>

    <div v-else-if="error" class="chord-chart-panel__state chord-chart-panel__state--error">
      <h3>Error al cargar el chart</h3>
      <p>{{ error }}</p>
      <button type="button" class="chord-chart-panel__btn" @click="retry">Reintentar</button>
    </div>

    <div
      v-else-if="!editable && !hasContent"
      class="chord-chart-panel__state"
    >
      <h3>Chart no disponible</h3>
      <p>Esta canción aún no tiene un chart ChordPro.</p>
    </div>

    <div
      v-else-if="editable && !hasContent && !editing"
      class="chord-chart-panel__state"
    >
      <h3>Sin chart</h3>
      <p>Crea un chart ChordPro para esta canción.</p>
      <button
        type="button"
        class="chord-chart-panel__btn chord-chart-panel__btn--primary"
        @click="startCreate"
      >
        Crear chart
      </button>
    </div>

    <div v-else class="chord-chart-panel__body">
      <div v-if="editable" class="chord-chart-panel__actions">
        <button
          v-if="!editing && hasContent"
          type="button"
          class="chord-chart-panel__icon-btn"
          title="Editar chart"
          @click="startEdit"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
        <button
          v-if="!editing && hasContent"
          type="button"
          class="chord-chart-panel__icon-btn chord-chart-panel__icon-btn--danger"
          title="Eliminar chart"
          @click="requestClear"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
        <template v-if="editing">
          <button
            type="button"
            class="chord-chart-panel__icon-btn chord-chart-panel__icon-btn--save"
            title="Guardar"
            :disabled="saving"
            @click="save"
          >
            <span v-if="saving" class="chord-chart-panel__spinner chord-chart-panel__spinner--sm" />
            <svg v-else width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </button>
          <button
            type="button"
            class="chord-chart-panel__icon-btn"
            title="Cancelar"
            :disabled="saving"
            @click="cancelEdit"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </template>
      </div>

      <template v-if="editing">
        <ChordChartEditor v-model="draft" />
      </template>
      <template v-else>
        <ChordChartView
          :chart="parsedChart"
          :transpose-semitones="transposeSemitones"
          :show-key="false"
          :font-scale="fontScale"
        />
        <Teleport to="body">
          <div
            v-if="isActive && hasContent"
            class="chord-chart-fab-stack"
            :class="{
              'chord-chart-fab-stack--above-bottom-nav': dockAboveBottomNav
            }"
          >
            <!-- Nivel 1: tonalidad (+ offset / reset / guardar) -->
            <div class="chord-chart-fab-stack__key-row" aria-label="Tonalidad">
              <button
                type="button"
                class="chord-chart-fab-stack__key"
                :title="displayToolbarKey ? `Tonalidad: ${displayToolbarKey}` : 'Sin tonalidad'"
              >
                {{ displayToolbarKey || '—' }}
              </button>
              <span
                v-if="transposeSemitones !== 0"
                class="chord-chart-fab-stack__offset"
                :title="`Desplazamiento: ${transposeSemitones > 0 ? '+' : ''}${transposeSemitones}`"
              >
                {{ transposeSemitones > 0 ? '+' : '' }}{{ transposeSemitones }}
              </span>
              <button
                type="button"
                class="chord-chart-fab-stack__icon-btn"
                title="Restablecer tonalidad guardada"
                :disabled="transposeSemitones === 0"
                @click="transposeSemitones = 0"
              >
                ↻
              </button>
              <button
                v-if="editable && transposeSemitones !== 0"
                type="button"
                class="chord-chart-fab-stack__persist"
                title="Guardar chart en esta tonalidad"
                :disabled="saving"
                @click="requestPersistTranspose"
              >
                Guardar
              </button>
            </div>

            <!-- Nivel 2: ± tonalidad -->
            <div class="chord-chart-fab-stack__group" role="group" aria-label="Transponer tonalidad">
              <button
                type="button"
                class="chord-chart-fab-stack__btn"
                title="Bajar semitono (tonalidad)"
                @click="onTranspose(-1)"
              >
                T−
              </button>
              <button
                type="button"
                class="chord-chart-fab-stack__btn"
                title="Subir semitono (tonalidad)"
                @click="onTranspose(1)"
              >
                T+
              </button>
            </div>

            <!-- Nivel 3: tamaño de fuente -->
            <div class="chord-chart-fab-stack__group" role="group" aria-label="Tamaño del texto">
              <button
                type="button"
                class="chord-chart-fab-stack__btn"
                title="Reducir texto"
                :disabled="fontScale <= FONT_MIN"
                @click="onFontDelta(-1)"
              >
                A−
              </button>
              <button
                type="button"
                class="chord-chart-fab-stack__btn"
                title="Aumentar texto"
                :disabled="fontScale >= FONT_MAX"
                @click="onFontDelta(1)"
              >
                A+
              </button>
            </div>

            <!-- Nivel 4: nav de lista (solo si aplica) -->
            <div
              v-if="showCollectionNav"
              class="chord-chart-fab-stack__group chord-chart-fab-stack__group--nav"
              role="group"
              aria-label="Canciones de la lista"
            >
              <button
                type="button"
                class="chord-chart-fab-stack__btn chord-chart-fab-stack__btn--icon"
                title="Canción anterior"
                :disabled="!hasPrevCollectionSong"
                @click="$emit('prev-collection')"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <span class="chord-chart-fab-stack__nav-chip" title="Posición en la lista">
                {{ collectionSongNumber }} / {{ totalCollectionSongs }}
              </span>
              <button
                type="button"
                class="chord-chart-fab-stack__btn chord-chart-fab-stack__btn--icon"
                title="Canción siguiente"
                :disabled="!hasNextCollectionSong"
                @click="$emit('next-collection')"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>
        </Teleport>
      </template>
    </div>

    <ConfirmModal
      :show="showClearConfirm"
      title="Eliminar chart"
      message="¿Eliminar el chart ChordPro de esta canción? Los acordes TipTap legacy no se tocan."
      confirm-text="Eliminar"
      @confirm="confirmClear"
      @cancel="showClearConfirm = false"
    />
    <ConfirmModal
      :show="showPersistConfirm"
      title="Guardar tonalidad"
      :message="persistConfirmMessage"
      confirm-text="Guardar"
      @confirm="confirmPersistTranspose"
      @cancel="showPersistConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  exportChordChartPdf,
  parseChordPro,
  serializeChordPro,
  transposeChart
} from '@/chordChart'
import { useCancionesStore } from '@/stores/canciones'
import { useDocumentPresenceStore } from '@/stores/documentPresence'
import { useNotifications } from '@/composables/useNotifications'
import ConfirmModal from '@/components/ConfirmModal.vue'
import ChordChartView from './ChordChartView.vue'
import ChordChartEditor from './ChordChartEditor.vue'

const FONT_STORAGE_KEY = 'letras:chordChartFontScale'
const FONT_MIN = 0.65
const FONT_MAX = 1.8
const FONT_STEP = 0.1

const props = defineProps<{
  songId: string
  songTitle?: string
  editable?: boolean
  /** Tab Acordes activo: atajos ±1 y control de tamaño visibles. */
  active?: boolean
  /** @deprecated Preferir `active`. */
  keyboardTranspose?: boolean
  /** Nav de lista embebida en el stack (solo tab acordes). */
  showCollectionNav?: boolean
  collectionSongNumber?: number
  totalCollectionSongs?: number
  hasPrevCollectionSong?: boolean
  hasNextCollectionSong?: boolean
  /** Subir el dock por encima del bottom nav (móvil). */
  dockAboveBottomNav?: boolean
}>()

const emit = defineEmits<{
  saved: [hasContent: boolean]
  'prev-collection': []
  'next-collection': []
}>()

const cancionesStore = useCancionesStore()
const documentPresenceStore = useDocumentPresenceStore()
const { success, error: showError } = useNotifications()

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const content = ref('')
const draft = ref('')
const editing = ref(false)
const transposeSemitones = ref(0)
const fontScale = ref(1)
const showClearConfirm = ref(false)
const showPersistConfirm = ref(false)
const exporting = ref(false)

const hasContent = computed(() => content.value.trim().length > 0)
const isDirty = computed(() => editing.value && draft.value !== content.value)
const isActive = computed(() => props.active ?? props.keyboardTranspose ?? false)
const parsedChart = computed(() => parseChordPro(content.value))

const displayToolbarKey = computed(() => {
  const chart = parsedChart.value
  if (!chart.meta.key) return undefined
  if (transposeSemitones.value === 0) return chart.meta.key
  return transposeChart(chart, transposeSemitones.value).meta.key
})

const persistConfirmMessage = computed(() => {
  const offset = transposeSemitones.value
  const offsetLabel = `${offset > 0 ? '+' : ''}${offset}`
  const key = displayToolbarKey.value
  if (key) {
    return `Se guardará el chart en ${key} (${offsetLabel}). Los acordes y la tonalidad del archivo se actualizarán. ¿Continuar?`
  }
  return `Se guardará el chart con desplazamiento ${offsetLabel}. Los acordes del archivo se actualizarán. ¿Continuar?`
})

watch(
  () => props.songId,
  (id) => {
    if (id) load(id)
  },
  { immediate: true }
)

onMounted(() => {
  try {
    const raw = localStorage.getItem(FONT_STORAGE_KEY)
    const n = raw ? Number(raw) : NaN
    if (!Number.isNaN(n) && n >= FONT_MIN && n <= FONT_MAX) {
      fontScale.value = n
    }
  } catch {
    /* ignore */
  }
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

function onKeydown(event: KeyboardEvent) {
  if (!isActive.value || editing.value) return
  const tag = (event.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (event.target as HTMLElement)?.isContentEditable) {
    return
  }
  if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    onTranspose(1)
  } else if (event.key === '-' || event.key === '_') {
    event.preventDefault()
    onTranspose(-1)
  } else if (event.key === '0' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    transposeSemitones.value = 0
  }
}

async function load(songId: string, forceRefresh = false) {
  loading.value = true
  error.value = null
  editing.value = false
  transposeSemitones.value = 0
  try {
    const body = await cancionesStore.getSongChordChart(songId, forceRefresh)
    content.value = body || ''
    draft.value = content.value
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al cargar el chart'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function retry() {
  if (props.songId) load(props.songId, true)
}

const DEFAULT_CHART_TEMPLATE = `{key: Am}

{start_of_verse: Verso 1}
[Am]Escribe aquí la letra con [G]acordes
{end_of_verse}

{start_of_chorus}
[F]Coro de ejemplo [C]aquí
{end_of_chorus}
`

function startCreate() {
  draft.value = DEFAULT_CHART_TEMPLATE
  editing.value = true
  transposeSemitones.value = 0
}

function startEdit() {
  draft.value = content.value
  editing.value = true
  transposeSemitones.value = 0
}

function cancelEdit() {
  if (isDirty.value && !window.confirm('¿Descartar los cambios del chart?')) {
    return
  }
  editing.value = false
  draft.value = content.value
}

function onTranspose(delta: number) {
  transposeSemitones.value += delta
}

function requestPersistTranspose() {
  if (!props.editable || transposeSemitones.value === 0 || saving.value) return
  showPersistConfirm.value = true
}

async function confirmPersistTranspose() {
  showPersistConfirm.value = false
  if (!props.editable || !props.songId || transposeSemitones.value === 0) return

  const offset = transposeSemitones.value
  saving.value = true
  try {
    const nextBody = serializeChordPro(transposeChart(parsedChart.value, offset))
    await cancionesStore.createOrUpdateSongChordChart(
      props.songId,
      nextBody,
      props.songTitle ? `Chart de ${props.songTitle}` : 'Chart ChordPro'
    )
    content.value = nextBody
    draft.value = nextBody
    transposeSemitones.value = 0
    documentPresenceStore.patchSong(props.songId, {
      chordChart: nextBody.trim().length > 0
    })
    emit('saved', nextBody.trim().length > 0)
    const key = parseChordPro(nextBody).meta.key
    success(
      'Tonalidad guardada',
      key ? `Chart actualizado en ${key}.` : 'Chart actualizado con la nueva tonalidad.'
    )
  } catch (err) {
    console.error(err)
    showError('Error', 'No se pudo guardar la tonalidad. Inténtalo de nuevo.')
  } finally {
    saving.value = false
  }
}

function onFontDelta(delta: number) {
  const next = Math.round((fontScale.value + delta * FONT_STEP) * 100) / 100
  fontScale.value = Math.min(FONT_MAX, Math.max(FONT_MIN, next))
  try {
    localStorage.setItem(FONT_STORAGE_KEY, String(fontScale.value))
  } catch {
    /* ignore */
  }
}

async function exportPdf() {
  if (!hasContent.value || editing.value || exporting.value) return
  exporting.value = true
  try {
    const result = await exportChordChartPdf(parsedChart.value, {
      title: props.songTitle || 'Acordes',
      transposeSemitones: transposeSemitones.value
    })
    if (result.method === 'download') {
      success('PDF listo', 'Se descargó el archivo de acordes.')
    } else if (result.method === 'share') {
      success('Listo', 'PDF listo para compartir.')
    }
  } catch (err) {
    console.error(err)
    showError('Error', 'No se pudo exportar el PDF.')
  } finally {
    exporting.value = false
  }
}

function requestClear() {
  showClearConfirm.value = true
}

async function confirmClear() {
  showClearConfirm.value = false
  if (!props.editable || !props.songId) return
  saving.value = true
  try {
    await cancionesStore.deleteSongChordChart(props.songId)
    content.value = ''
    draft.value = ''
    editing.value = false
    transposeSemitones.value = 0
    documentPresenceStore.patchSong(props.songId, { chordChart: false })
    emit('saved', false)
    success('Éxito', 'Chart eliminado')
  } catch (err) {
    console.error(err)
    showError('Error', 'No se pudo eliminar el chart.')
  } finally {
    saving.value = false
  }
}

async function save() {
  if (!props.editable || !props.songId) return
  saving.value = true
  try {
    const body = draft.value
    await cancionesStore.createOrUpdateSongChordChart(
      props.songId,
      body,
      props.songTitle ? `Chart de ${props.songTitle}` : 'Chart ChordPro'
    )
    content.value = body
    editing.value = false
    documentPresenceStore.patchSong(props.songId, {
      chordChart: body.trim().length > 0
    })
    emit('saved', body.trim().length > 0)
    success('Éxito', 'Chart guardado correctamente')
  } catch (err) {
    console.error(err)
    showError('Error', 'No se pudo guardar el chart. Inténtalo de nuevo.')
  } finally {
    saving.value = false
  }
}

defineExpose({
  load,
  retry,
  hasContent,
  loading,
  error,
  exportPdf,
  hasUnsavedChanges: () => editing.value && draft.value !== content.value,
  discardUnsavedChanges: () => {
    editing.value = false
    draft.value = content.value
  }
})
</script>

<style scoped>
.chord-chart-panel {
  position: relative;
  flex: 1;
  background: var(--color-background-card);
  border-radius: 12px;
  padding: 0.75rem;
  min-height: 320px;
}

.chord-chart-panel__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2.5rem 1.5rem;
  min-height: 280px;
  gap: 0.5rem;
}

.chord-chart-panel__state h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-text);
}

.chord-chart-panel__state p {
  margin: 0;
  color: var(--color-text-soft);
}

.chord-chart-panel__body {
  position: relative;
  padding-top: 0.25rem;
}

.chord-chart-panel__actions {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 5;
  display: flex;
  gap: 0.4rem;
}

.chord-chart-panel__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background-card);
  color: var(--color-text);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.chord-chart-panel__icon-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.chord-chart-panel__icon-btn--save {
  background: var(--color-success);
  border-color: var(--color-success);
  color: var(--color-text-inverse, #fff);
}

.chord-chart-panel__icon-btn--danger:hover:not(:disabled) {
  border-color: var(--color-danger, #b91c1c);
  color: var(--color-danger, #b91c1c);
}

.chord-chart-panel__icon-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chord-chart-panel__btn {
  margin-top: 0.75rem;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
}

.chord-chart-panel__btn--primary {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-text-inverse, #fff);
}

.chord-chart-panel__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: chord-spin 0.8s linear infinite;
}

.chord-chart-panel__spinner--sm {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

@keyframes chord-spin {
  to { transform: rotate(360deg); }
}
</style>

<style>
/* Teleport a body: columna flotante derecha (tono → ± → A± → nav) */
.chord-chart-fab-stack {
  position: fixed;
  right: 0.75rem;
  bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  z-index: 1250;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
  pointer-events: none;
}

.chord-chart-fab-stack > * {
  pointer-events: auto;
}

/* Encima del bottom nav en móvil (cuando no vienes de una lista) */
@media (max-width: 900px) {
  .chord-chart-fab-stack--above-bottom-nav {
    bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px));
  }
}

body.content-fullscreen .chord-chart-fab-stack {
  z-index: 10060;
  bottom: calc(0.85rem + env(safe-area-inset-bottom, 0px));
}

.chord-chart-fab-stack__key-row {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  max-width: min(100vw - 1.5rem, 16rem);
  padding: 0.2rem;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-background-card, #fff) 94%, transparent);
  backdrop-filter: blur(6px);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.12));
}

.chord-chart-fab-stack__key {
  min-width: 2.4rem;
  padding: 0.3rem 0.5rem;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  cursor: default;
  line-height: 1.1;
}

.chord-chart-fab-stack__offset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.45rem;
  padding: 0.15rem 0.3rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-accent) 16%, transparent);
  color: var(--color-accent);
  font-size: 0.7rem;
  font-weight: 700;
}

.chord-chart-fab-stack__icon-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--color-text-soft);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}

.chord-chart-fab-stack__icon-btn:hover:not(:disabled) {
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

.chord-chart-fab-stack__icon-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.chord-chart-fab-stack__persist {
  padding: 0.3rem 0.55rem;
  border: none;
  border-radius: 7px;
  background: var(--color-accent);
  color: var(--color-text-inverse, #fff);
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.chord-chart-fab-stack__persist:hover:not(:disabled) {
  filter: brightness(1.06);
}

.chord-chart-fab-stack__persist:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.chord-chart-fab-stack__group {
  display: inline-flex;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-background-card, #fff) 94%, transparent);
  backdrop-filter: blur(6px);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.12));
}

.chord-chart-fab-stack__btn {
  min-width: 2.5rem;
  min-height: 2.35rem;
  padding: 0.3rem 0.55rem;
  border: none;
  border-right: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-soft, #6b7280);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  cursor: pointer;
}

.chord-chart-fab-stack__btn:last-child {
  border-right: none;
}

.chord-chart-fab-stack__btn:hover:not(:disabled) {
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

.chord-chart-fab-stack__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.chord-chart-fab-stack__btn--icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.35rem;
  padding: 0.3rem;
}

.chord-chart-fab-stack__group--nav .chord-chart-fab-stack__nav-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.75rem;
  padding: 0 0.45rem;
  border-right: 1px solid var(--color-border);
  color: var(--color-heading, var(--color-text));
  font-size: 0.72rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
