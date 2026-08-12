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
          :accidentals="accidentalPreference"
          :show-key="false"
          :font-scale="fontScale"
          :show-settings="isActive && hasContent"
          :show-settings-triggers="Boolean(showStickySettingsTriggers)"
          :sticky-teleport="isActive"
          :sheet="settingsSheet"
          :display-key="displayToolbarKey"
          :can-persist="Boolean(editable)"
          :persist-disabled="saving"
          :has-pending-key-change="hasPendingKeyChange"
          :font-min="FONT_MIN"
          :font-max="FONT_MAX"
          :compact-lines="compactLines"
          :elevated-sheets="isActive"
          @transpose="onTranspose"
          @reset-transpose="resetTranspose"
          @persist-transpose="requestPersistTranspose"
          @update:accidentals="onAccidentalPreference"
          @font-delta="onFontDelta"
          @font-set="onFontSet"
          @update:compact-lines="onCompactLines"
          @update:sheet="settingsSheet = $event"
        />
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
  transposeChart,
  detectAccidentalPreference,
  semitonesBetweenKeys,
  type AccidentalPreference
} from '@/chordChart'
import { useCancionesStore } from '@/stores/canciones'
import { useDocumentPresenceStore } from '@/stores/documentPresence'
import { useNotifications } from '@/composables/useNotifications'
import ConfirmModal from '@/components/ConfirmModal.vue'
import ChordChartView from './ChordChartView.vue'
import ChordChartEditor from './ChordChartEditor.vue'

const FONT_STORAGE_KEY = 'letras:chordChartFontScale'
const COMPACT_STORAGE_KEY = 'letras:chordChartCompactLines'
const FONT_MIN = 0.65
const FONT_MAX = 1.8
const FONT_STEP = 0.1

const props = defineProps<{
  songId: string
  songTitle?: string
  editable?: boolean
  /** Tab Acordes activo: atajos ±1 y panel de ajustes. */
  active?: boolean
  /** @deprecated Preferir `active`. */
  keyboardTranspose?: boolean
  /**
   * Mostrar G/Aa en la barra sticky del chart.
   * En detalle normal van en el header; en fullscreen (sin header) conviene true.
   */
  showStickySettingsTriggers?: boolean
  /**
   * Tonalidad objetivo al abrir (p. ej. performance_key de la lista).
   * Se aplica como transpose relativo a `{key:}` del chart. Null/undefined = original.
   */
  targetKey?: string | null
}>()

const emit = defineEmits<{
  saved: [hasContent: boolean]
  'settings-meta': [meta: { keyLabel: string; offset: number; canShow: boolean }]
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
const accidentalPreference = ref<AccidentalPreference>('sharp')
const fontScale = ref(1)
const compactLines = ref(false)
const settingsSheet = ref<'key' | 'font' | null>(null)
const showClearConfirm = ref(false)
const showPersistConfirm = ref(false)
const exporting = ref(false)

const hasContent = computed(() => content.value.trim().length > 0)
const isDirty = computed(() => editing.value && draft.value !== content.value)
const isActive = computed(() => props.active ?? props.keyboardTranspose ?? false)
const parsedChart = computed(() => parseChordPro(content.value))
const canShowChartSettings = computed(
  () => isActive.value && hasContent.value && !editing.value
)

const transposeOptions = computed(() => ({
  accidentals: accidentalPreference.value
}))

const displayToolbarKey = computed(() => {
  const chart = parsedChart.value
  if (!chart.meta.key) return undefined
  return transposeChart(chart, transposeSemitones.value, transposeOptions.value).meta.key
})

const settingsKeyLabel = computed(() => displayToolbarKey.value || '—')

function syncAccidentalPreferenceFromChart() {
  accidentalPreference.value = detectAccidentalPreference(parsedChart.value.meta.key)
}

/** Aplica `targetKey` como offset desde la tonalidad escrita del chart. */
function applyTargetKey() {
  const target = props.targetKey?.trim() || null
  if (!target) {
    transposeSemitones.value = 0
    return
  }
  const delta = semitonesBetweenKeys(parsedChart.value.meta.key, target)
  transposeSemitones.value = delta ?? 0
  if (delta != null) {
    accidentalPreference.value = detectAccidentalPreference(target)
  }
}

watch(
  [settingsKeyLabel, transposeSemitones, canShowChartSettings],
  ([keyLabel, offset, canShow]) => {
    emit('settings-meta', { keyLabel, offset, canShow })
  },
  { immediate: true }
)

watch(
  () => props.targetKey,
  () => {
    if (editing.value || loading.value) return
    applyTargetKey()
  }
)

const persistConfirmMessage = computed(() => {
  const offset = transposeSemitones.value
  const key = displayToolbarKey.value
  if (offset === 0) {
    return key
      ? `Se guardará el chart con escritura en ${key}. ¿Continuar?`
      : 'Se guardará el chart con la escritura de alteraciones elegida. ¿Continuar?'
  }
  const offsetLabel = `${offset > 0 ? '+' : ''}${offset}`
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
    compactLines.value = localStorage.getItem(COMPACT_STORAGE_KEY) === '1'
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
    syncAccidentalPreferenceFromChart()
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
    syncAccidentalPreferenceFromChart()
    applyTargetKey()
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

function onAccidentalPreference(value: AccidentalPreference) {
  accidentalPreference.value = value
}

function resetTranspose() {
  transposeSemitones.value = 0
  syncAccidentalPreferenceFromChart()
}

const pendingKeyBody = computed(() => {
  const preferDefault = detectAccidentalPreference(parsedChart.value.meta.key)
  const options =
    transposeSemitones.value !== 0 || accidentalPreference.value !== preferDefault
      ? transposeOptions.value
      : undefined
  return serializeChordPro(
    transposeChart(parsedChart.value, transposeSemitones.value, options)
  )
})

const hasPendingKeyChange = computed(
  () => hasContent.value && pendingKeyBody.value !== content.value
)

function requestPersistTranspose() {
  if (!props.editable || !hasPendingKeyChange.value || saving.value) return
  showPersistConfirm.value = true
}

async function confirmPersistTranspose() {
  showPersistConfirm.value = false
  if (!props.editable || !props.songId || !hasPendingKeyChange.value) return

  const offset = transposeSemitones.value
  saving.value = true
  try {
    const nextBody = pendingKeyBody.value
    await cancionesStore.createOrUpdateSongChordChart(
      props.songId,
      nextBody,
      props.songTitle ? `Chart de ${props.songTitle}` : 'Chart ChordPro'
    )
    content.value = nextBody
    draft.value = nextBody
    transposeSemitones.value = 0
    syncAccidentalPreferenceFromChart()
    documentPresenceStore.patchSong(props.songId, {
      chordChart: nextBody.trim().length > 0
    })
    emit('saved', nextBody.trim().length > 0)
    const key = parseChordPro(nextBody).meta.key
    success(
      'Tonalidad guardada',
      key
        ? `Chart actualizado en ${key}.`
        : offset
          ? 'Chart actualizado con la nueva tonalidad.'
          : 'Chart actualizado con la nueva escritura.'
    )
  } catch (err) {
    console.error(err)
    showError('Error', 'No se pudo guardar la tonalidad. Inténtalo de nuevo.')
  } finally {
    saving.value = false
  }
}

function persistFontScale(scale: number) {
  fontScale.value = Math.min(FONT_MAX, Math.max(FONT_MIN, scale))
  try {
    localStorage.setItem(FONT_STORAGE_KEY, String(fontScale.value))
  } catch {
    /* ignore */
  }
}

function onFontDelta(delta: number) {
  const next = Math.round((fontScale.value + delta * FONT_STEP) * 100) / 100
  persistFontScale(next)
}

function onFontSet(scale: number) {
  persistFontScale(Math.round(scale * 100) / 100)
}

function onCompactLines(value: boolean) {
  compactLines.value = value
  try {
    localStorage.setItem(COMPACT_STORAGE_KEY, value ? '1' : '0')
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
      transposeSemitones: transposeSemitones.value,
      accidentals: accidentalPreference.value
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
  canShowChartSettings,
  settingsKeyLabel,
  transposeSemitones,
  openKeySettings: () => {
    settingsSheet.value = 'key'
  },
  openFontSettings: () => {
    settingsSheet.value = 'font'
  },
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
