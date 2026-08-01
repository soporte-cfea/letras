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
      <div class="chord-chart-panel__actions">
        <template v-if="editable">
          <button
            v-if="!editing"
            type="button"
            class="chord-chart-panel__icon-btn"
            title="Editar chart"
            @click="startEdit"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <template v-else>
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
        </template>
      </div>

      <template v-if="editing">
        <ChordChartEditor v-model="draft" />
      </template>
      <template v-else>
        <ChordChartToolbar
          :display-key="displayToolbarKey"
          :transpose-semitones="transposeSemitones"
          @transpose="onTranspose"
          @reset="transposeSemitones = 0"
        />
        <ChordChartView
          :chart="parsedChart"
          :transpose-semitones="transposeSemitones"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { parseChordPro, transposeChart } from '@/chordChart'
import { useCancionesStore } from '@/stores/canciones'
import { useDocumentPresenceStore } from '@/stores/documentPresence'
import { useNotifications } from '@/composables/useNotifications'
import ChordChartView from './ChordChartView.vue'
import ChordChartToolbar from './ChordChartToolbar.vue'
import ChordChartEditor from './ChordChartEditor.vue'

const props = defineProps<{
  songId: string
  songTitle?: string
  editable?: boolean
}>()

const emit = defineEmits<{
  saved: [hasContent: boolean]
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

const hasContent = computed(() => content.value.trim().length > 0)
const parsedChart = computed(() => parseChordPro(content.value))

const displayToolbarKey = computed(() => {
  const chart = parsedChart.value
  if (!chart.meta.key) return undefined
  if (transposeSemitones.value === 0) return chart.meta.key
  return transposeChart(chart, transposeSemitones.value).meta.key
})

watch(
  () => props.songId,
  (id) => {
    if (id) load(id)
  },
  { immediate: true }
)

async function load(songId: string, forceRefresh = false) {
  loading.value = true
  error.value = null
  editing.value = false
  transposeSemitones.value = 0
  try {
    const body = await cancionesStore.getSongChordChart(songId, forceRefresh)
    content.value = body || ''
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

function startCreate() {
  draft.value = '{key: C}\n\n[Am]Escribe aquí la letra con [G]acordes\n'
  editing.value = true
  transposeSemitones.value = 0
}

function startEdit() {
  draft.value = content.value
  editing.value = true
  transposeSemitones.value = 0
}

function cancelEdit() {
  editing.value = false
  draft.value = content.value
}

function onTranspose(delta: number) {
  transposeSemitones.value += delta
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
  error
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
