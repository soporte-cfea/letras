<template>
  <div
    class="chord-chart-view"
    :class="{
      'chord-chart-view--empty': isEmpty,
      'chord-chart-view--compact': compactLines
    }"
    :style="{ fontSize: `calc(1rem * ${fontScale})` }"
  >
    <p v-if="isEmpty" class="chord-chart-view__placeholder">
      {{ emptyMessage }}
    </p>
    <template v-else>
      <p v-if="showKey && chartDisplayKey" class="chord-chart-view__key">
        Tonalidad: <strong>{{ chartDisplayKey }}</strong>
        <span v-if="modeLabel" class="chord-chart-view__mode">{{ modeLabel }}</span>
      </p>

      <Teleport to="#chord-chart-sticky-host" :disabled="!useStickyTeleport">
        <div
          v-if="showStickyBar"
          class="chord-chart-view__sticky"
          :class="{ 'chord-chart-view__sticky--teleported': useStickyTeleport }"
        >
          <div class="chord-chart-view__sticky-row">
            <nav
              v-if="navSections.length > 1"
              ref="navRef"
              class="chord-chart-view__nav"
              aria-label="Secciones"
            >
              <a
                v-for="sec in navSections"
                :key="sec.id"
                class="chord-chart-view__nav-chip"
                :class="[
                  `chord-chart-view__nav-chip--${sec.kind}`,
                  { 'chord-chart-view__nav-chip--active': activeSectionId === sec.id }
                ]"
                :data-section-id="sec.id"
                :href="`#${sec.id}`"
                @click.prevent="scrollToSection(sec.id)"
              >
                {{ sec.displayLabel }}
              </a>
            </nav>
            <div
              v-if="showSettings && showSettingsTriggers"
              class="chord-chart-view__tools"
              aria-label="Ajustes"
            >
              <button
                type="button"
                class="chord-chart-view__tool"
                :class="{ 'chord-chart-view__tool--active': transposeSemitones !== 0 }"
                :title="`Tonalidad: ${settingsKeyLabel}`"
                @click="setSheet('key')"
              >
                {{ settingsKeyLabel }}<template v-if="transposeSemitones !== 0">{{ transposeSemitones > 0 ? '+' : '' }}{{ transposeSemitones }}</template>
              </button>
              <button
                type="button"
                class="chord-chart-view__tool"
                title="Tamaño del texto"
                @click="setSheet('font')"
              >
                Aa
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <BottomSheet
        :show="activeSheet === 'key'"
        title="Tonalidad"
        :elevated="elevatedSheets"
        @close="setSheet(null)"
      >
        <div class="chord-sheet-key">
          <div class="chord-sheet-key__main">
            <p class="chord-sheet-key__current">{{ settingsKeyLabel }}</p>

            <div class="chord-sheet-key__carousel" aria-label="Elegir tonalidad">
              <button
                type="button"
                class="chord-sheet-key__chevron"
                :disabled="!canStepKey(-1)"
                title="Tonalidad anterior"
                aria-label="Tonalidad anterior"
                @click="stepKey(-1)"
              >
                ‹
              </button>

              <div ref="keyCarouselRef" class="chord-sheet-key__track">
                <button
                  v-for="tone in keyCarouselTones"
                  :key="tone.index"
                  type="button"
                  class="chord-sheet-key__tone"
                  :class="{ 'chord-sheet-key__tone--current': tone.index === carouselIndex }"
                  :data-index="tone.index"
                  :title="tone.index === carouselIndex ? 'Tonalidad actual' : `Ir a ${tone.label}`"
                  @click="selectCarouselIndex(tone.index)"
                >
                  {{ tone.label }}
                </button>
              </div>

              <button
                type="button"
                class="chord-sheet-key__chevron"
                :disabled="!canStepKey(1)"
                title="Tonalidad siguiente"
                aria-label="Tonalidad siguiente"
                @click="stepKey(1)"
              >
                ›
              </button>
            </div>

            <div class="chord-sheet-key__actions">
              <button
                type="button"
                class="chord-sheet-key__reset"
                :disabled="!canResetKey"
                :title="canResetKey ? 'Volver a la tonalidad original' : 'Ya estás en la tonalidad original'"
                @click="$emit('reset-transpose')"
              >
                Volver al original
              </button>

              <button
                v-if="canPersist && hasPendingKeyChange"
                type="button"
                class="chord-sheet-key__persist"
                :disabled="persistDisabled"
                @click="$emit('persist-transpose')"
              >
                Guardar en esta tonalidad
              </button>
            </div>
          </div>

          <div class="chord-sheet-key__aside">
            <p v-if="originalKeyLabel" class="chord-sheet-key__original">
              Original <strong>{{ originalKeyLabel }}</strong>
            </p>
            <p v-else class="chord-sheet-key__original">Sin tonalidad en el chart</p>
            <div class="chord-sheet-key__accidentals" role="group" aria-label="Escritura">
              <button
                type="button"
                class="chord-sheet-key__accidental"
                :class="{ 'chord-sheet-key__accidental--active': accidentals === 'flat' }"
                title="Bemoles"
                aria-label="Preferir bemoles"
                :aria-pressed="accidentals === 'flat'"
                @click="$emit('update:accidentals', 'flat')"
              >
                <span aria-hidden="true">♭</span>
              </button>
              <button
                type="button"
                class="chord-sheet-key__accidental"
                :class="{ 'chord-sheet-key__accidental--active': accidentals === 'sharp' }"
                title="Sostenidos"
                aria-label="Preferir sostenidos"
                :aria-pressed="accidentals === 'sharp'"
                @click="$emit('update:accidentals', 'sharp')"
              >
                <span aria-hidden="true">♯</span>
              </button>
            </div>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        :show="activeSheet === 'font'"
        title="Tamaño del texto"
        :elevated="elevatedSheets"
        @close="setSheet(null)"
      >
        <div class="chord-sheet-font">
          <p class="chord-sheet-font__preview" :style="{ fontSize: `calc(1rem * ${fontScale})` }">
            <span class="chord-sheet-font__preview-chord">Am</span>
            Ejemplo de letra
          </p>
          <p class="chord-sheet-font__percent">{{ Math.round(fontScale * 100) }}%</p>

          <div class="chord-sheet-font__presets" role="group" aria-label="Presets">
            <button
              v-for="preset in FONT_PRESETS"
              :key="preset.id"
              type="button"
              class="chord-sheet-font__preset"
              :class="{ 'chord-sheet-font__preset--active': isPresetActive(preset.value) }"
              @click="$emit('font-set', preset.value)"
            >
              {{ preset.label }}
            </button>
          </div>

          <input
            class="chord-sheet-font__slider"
            type="range"
            :min="fontMin"
            :max="fontMax"
            :step="0.05"
            :value="fontScale"
            aria-label="Tamaño del texto"
            @input="onSliderInput"
          />

          <div class="chord-sheet-font__steps">
            <button
              type="button"
              class="chord-sheet-font__step"
              :disabled="fontScale <= fontMin"
              @click="$emit('font-delta', -1)"
            >
              A−
            </button>
            <button
              type="button"
              class="chord-sheet-font__step"
              :disabled="fontScale >= fontMax"
              @click="$emit('font-delta', 1)"
            >
              A+
            </button>
            <button
              type="button"
              class="chord-sheet-font__step"
              :disabled="fontScale === 1"
              @click="$emit('font-set', 1)"
            >
              100%
            </button>
          </div>

          <label class="chord-sheet-font__toggle">
            <input
              type="checkbox"
              :checked="compactLines"
              @change="onCompactChange"
            />
            <span>Líneas más compactas</span>
          </label>
        </div>
      </BottomSheet>

      <section
        v-for="sec in renderedSections"
        :id="sec.id"
        :key="sec.id"
        class="chord-chart-view__section"
        :class="[
          `chord-chart-view__section--${sec.kind}`,
          { 'chord-chart-view__section--labeled': Boolean(sec.displayLabel) },
          { 'chord-chart-view__section--highlighted': pulsedSectionId === sec.id }
        ]"
      >
        <header v-if="sec.displayLabel" class="chord-chart-view__section-header">
          {{ sec.displayLabel }}
        </header>
        <div
          v-for="(line, lineIndex) in sec.lines"
          :key="lineIndex"
          class="chord-chart-view__line"
          :class="{ 'chord-chart-view__line--blank': line.blank }"
        >
          <span v-if="line.blank" class="chord-chart-view__blank">&nbsp;</span>
          <span
            v-for="(col, colIndex) in line.columns"
            :key="colIndex"
            class="chord-chart-view__col"
          >
            <span class="chord-chart-view__chord">{{ col.chord || '\u00a0' }}</span>
            <span class="chord-chart-view__lyric">{{ col.lyric || '\u00a0' }}</span>
          </span>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Note } from 'tonal'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { ChordChart, ChordChartLine, ChordChartSectionKind } from '@/chordChart'
import {
  parseKey,
  formatKeyLabel,
  SECTION_KIND_LABELS,
  transposeChart,
  detectAccidentalPreference,
  applyAccidentalPreferenceToSymbol,
  type AccidentalPreference
} from '@/chordChart'
import BottomSheet from '@/components/common/BottomSheet.vue'

const FONT_PRESETS = [
  { id: 'sm', label: 'Pequeño', value: 0.85 },
  { id: 'md', label: 'Normal', value: 1 },
  { id: 'lg', label: 'Grande', value: 1.25 },
  { id: 'xl', label: 'Muy grande', value: 1.55 }
] as const

interface ChartColumn {
  chord: string
  lyric: string
}

interface RenderedLine {
  blank: boolean
  columns: ChartColumn[]
}

interface RenderedSection {
  id: string
  kind: ChordChartSectionKind
  displayLabel: string
  lines: RenderedLine[]
}

const PULSE_MS = 4000
/** Fallback si el navegador no dispara scrollend tras scrollIntoView. */
const PROGRAMMATIC_SCROLL_MAX_MS = 2500

const props = withDefaults(
  defineProps<{
    chart: ChordChart
    transposeSemitones?: number
    /** Preferencia ♯ / ♭ para la escritura del chart. */
    accidentals?: AccidentalPreference
    emptyMessage?: string
    /** Si false, no muestra la línea de tonalidad encima del chart. */
    showKey?: boolean
    /** Escala tipográfica (1 = 100%). */
    fontScale?: number
    /** Habilita sheets de tono/fuente. */
    showSettings?: boolean
    /** Mostrar triggers G/Aa en la barra sticky (p. ej. fullscreen). */
    showSettingsTriggers?: boolean
    /** Sheet abierto (controlable desde fuera). */
    sheet?: 'key' | 'font' | null
    /** Tonalidad mostrada en el trigger (ya transpuesta). */
    displayKey?: string
    canPersist?: boolean
    persistDisabled?: boolean
    /** Hay cambios de tonalidad/escritura pendientes de guardar. */
    hasPendingKeyChange?: boolean
    fontMin?: number
    fontMax?: number
    compactLines?: boolean
    /** Sheets por encima de content-fullscreen. */
    elevatedSheets?: boolean
    /**
     * Saca la barra de chips al host sticky de la página (fuera del carrusel).
     * Debe ser true solo cuando el tab Acordes está activo.
     */
    stickyTeleport?: boolean
  }>(),
  {
    transposeSemitones: 0,
    accidentals: 'sharp',
    emptyMessage: 'No hay contenido en el chart.',
    showKey: true,
    fontScale: 1,
    showSettings: false,
    showSettingsTriggers: false,
    sheet: null,
    displayKey: undefined,
    canPersist: false,
    persistDisabled: false,
    hasPendingKeyChange: false,
    fontMin: 0.65,
    fontMax: 1.8,
    compactLines: false,
    elevatedSheets: false,
    stickyTeleport: false
  }
)

const emit = defineEmits<{
  transpose: [delta: number]
  'reset-transpose': []
  'persist-transpose': []
  'update:accidentals': [value: AccidentalPreference]
  'font-delta': [delta: number]
  'font-set': [scale: number]
  'update:compact-lines': [value: boolean]
  'update:sheet': [value: 'key' | 'font' | null]
}>()

const STICKY_HOST_ID = 'chord-chart-sticky-host'

const navRef = ref<HTMLElement | null>(null)
const stickyHostReady = ref(false)
const localSheet = ref<'key' | 'font' | null>(null)
const activeSheet = computed(() => props.sheet ?? localSheet.value)

function refreshStickyHost() {
  stickyHostReady.value = !!document.getElementById(STICKY_HOST_ID)
}

function setSheet(value: 'key' | 'font' | null) {
  localSheet.value = value
  emit('update:sheet', value)
}
/** Chip activo según sección visible (o salto por chip). */
const activeSectionId = ref<string | null>(null)
/** Resalte temporal del bloque al saltar con un chip. */
const pulsedSectionId = ref<string | null>(null)

let pulseTimer: ReturnType<typeof setTimeout> | null = null
let programmaticScroll = false
let programmaticScrollFallback: ReturnType<typeof setTimeout> | null = null
let sectionObserver: IntersectionObserver | null = null
const intersectingIds = new Set<string>()

const displayChart = computed(() =>
  transposeChart(props.chart, props.transposeSemitones, {
    accidentals: props.accidentals
  })
)

const chartDisplayKey = computed(() => displayChart.value.meta.key || '')

const modeLabel = computed(() => {
  const parsed = parseKey(chartDisplayKey.value)
  if (!parsed) return ''
  return parsed.mode === 'minor' ? 'menor' : 'mayor'
})

const settingsKeyLabel = computed(() => props.displayKey || chartDisplayKey.value || '—')

const originalKeyLabel = computed(() => props.chart.meta.key || '')

const isAtOriginalKey = computed(() => {
  if (props.transposeSemitones !== 0) return false
  return (
    props.accidentals === detectAccidentalPreference(props.chart.meta.key)
  )
})

const canResetKey = computed(() => !isAtOriginalKey.value)

/** Cromático fijo: C … B … C (misma nota al inicio y al final). */
const SHARP_TONICS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const FLAT_TONICS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const

const keyCarouselRef = ref<HTMLElement | null>(null)
const carouselIndex = ref(0)

const originalParsedKey = computed(() => parseKey(props.chart.meta.key))

const normalizedOffset = computed(() => {
  const n = props.transposeSemitones % 12
  return n < 0 ? n + 12 : n
})

const keyCarouselTones = computed(() => {
  const mode = originalParsedKey.value?.mode ?? 'major'
  const tonics = props.accidentals === 'flat' ? FLAT_TONICS : SHARP_TONICS
  const origChroma = originalParsedKey.value
    ? Note.chroma(originalParsedKey.value.tonic)
    : 0

  const tones = tonics.map((tonic, index) => {
    const spelled = applyAccidentalPreferenceToSymbol(tonic, props.accidentals)
    const label = formatKeyLabel(spelled, mode)
    const chroma = Note.chroma(tonic) ?? 0
    const absolute = ((chroma - (origChroma ?? 0)) % 12 + 12) % 12
    return { index, label, absolute, chroma }
  })

  // Cierra la octava: termina otra vez en C
  const first = tones[0]
  tones.push({
    index: tones.length,
    label: first.label,
    absolute: first.absolute,
    chroma: first.chroma
  })
  return tones
})

function syncCarouselIndexFromOffset() {
  const tones = keyCarouselTones.value
  const matches = tones
    .map((t, i) => (t.absolute === normalizedOffset.value ? i : -1))
    .filter((i) => i >= 0)
  if (matches.length === 0) {
    carouselIndex.value = 0
    return
  }
  if (!matches.includes(carouselIndex.value)) {
    carouselIndex.value = matches[0]
  }
}

function canStepKey(direction: -1 | 1) {
  const next = carouselIndex.value + direction
  return next >= 0 && next < keyCarouselTones.value.length
}

function stepKey(direction: -1 | 1) {
  if (!canStepKey(direction)) return
  selectCarouselIndex(carouselIndex.value + direction)
}

function selectCarouselIndex(index: number) {
  const tone = keyCarouselTones.value[index]
  if (!tone) return
  carouselIndex.value = index
  const delta = tone.absolute - normalizedOffset.value
  if (delta !== 0) emit('transpose', delta)
  else scrollKeyCarouselToCurrent('smooth')
}

async function scrollKeyCarouselToCurrent(behavior: ScrollBehavior = 'smooth') {
  await nextTick()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const track = keyCarouselRef.value
      if (!track) return
      const current = track.querySelector<HTMLElement>('.chord-sheet-key__tone--current')
      if (!current) return
      const targetLeft =
        current.offsetLeft - (track.clientWidth - current.offsetWidth) / 2
      track.scrollTo({ left: Math.max(0, targetLeft), behavior })
    })
  })
}

watch(
  [normalizedOffset, keyCarouselTones],
  () => {
    syncCarouselIndexFromOffset()
  },
  { immediate: true }
)

watch(
  () => props.transposeSemitones,
  () => {
    if (activeSheet.value === 'key') scrollKeyCarouselToCurrent('smooth')
  }
)

watch(carouselIndex, () => {
  if (activeSheet.value === 'key') scrollKeyCarouselToCurrent('smooth')
})

watch(
  () => props.accidentals,
  () => {
    if (activeSheet.value === 'key') scrollKeyCarouselToCurrent('auto')
  }
)

watch(
  () => activeSheet.value,
  (sheet) => {
    if (sheet === 'key') {
      syncCarouselIndexFromOffset()
      scrollKeyCarouselToCurrent('auto')
    }
  }
)

function isPresetActive(value: number) {
  return Math.abs(props.fontScale - value) < 0.03
}

function onSliderInput(event: Event) {
  const raw = Number((event.target as HTMLInputElement).value)
  if (Number.isNaN(raw)) return
  emit('font-set', Math.round(raw * 100) / 100)
}

function onCompactChange(event: Event) {
  emit('update:compact-lines', (event.target as HTMLInputElement).checked)
}

watch(
  () => props.showSettings,
  (show) => {
    if (!show) setSheet(null)
  }
)

function lineToColumns(line: ChordChartLine): ChartColumn[] {
  const columns: ChartColumn[] = []
  let pendingChord = ''

  for (const seg of line.segments) {
    if (seg.type === 'chord') {
      if (pendingChord) {
        columns.push({ chord: pendingChord, lyric: '' })
      }
      pendingChord = seg.name
    } else {
      columns.push({ chord: pendingChord, lyric: seg.text })
      pendingChord = ''
    }
  }

  if (pendingChord) {
    columns.push({ chord: pendingChord, lyric: '' })
  }

  return columns
}

function isBlankLine(line: ChordChartLine): boolean {
  if (!line.segments.length) return true
  return line.segments.every(
    (seg) => seg.type === 'lyric' && seg.text.trim() === ''
  )
}

function sectionHasVisibleContent(lines: ChordChartLine[]): boolean {
  return lines.some((line) => !isBlankLine(line))
}

/** Numera Verso/Coro repetidos cuando el label es el genérico. */
function buildDisplayLabels(
  sections: { kind: ChordChartSectionKind; label: string }[]
): string[] {
  const counts = new Map<ChordChartSectionKind, number>()
  const totals = new Map<ChordChartSectionKind, number>()

  for (const s of sections) {
    const base = SECTION_KIND_LABELS[s.kind]
    if (base && s.label === base) {
      totals.set(s.kind, (totals.get(s.kind) || 0) + 1)
    }
  }

  return sections.map((s) => {
    if (!s.label) return ''
    const base = SECTION_KIND_LABELS[s.kind]
    const total = totals.get(s.kind) || 0
    if (base && s.label === base && total > 1) {
      const n = (counts.get(s.kind) || 0) + 1
      counts.set(s.kind, n)
      return `${base} ${n}`
    }
    return s.label
  })
}

const renderedSections = computed<RenderedSection[]>(() => {
  const sections = displayChart.value.sections.filter(
    (s) => s.kind !== 'body' || sectionHasVisibleContent(s.lines)
  )
  const labels = buildDisplayLabels(sections)

  return sections.map((section, i) => ({
    id: section.id,
    kind: section.kind,
    displayLabel: labels[i] || '',
    lines: section.lines.map((line) => {
      if (isBlankLine(line)) {
        return { blank: true, columns: [] }
      }
      return { blank: false, columns: lineToColumns(line) }
    })
  }))
})

const navSections = computed(() =>
  renderedSections.value.filter((s) => Boolean(s.displayLabel))
)

const showStickyBar = computed(
  () => props.showSettings || navSections.value.length > 1
)
const useStickyTeleport = computed(
  () => props.stickyTeleport && stickyHostReady.value && showStickyBar.value
)

const isEmpty = computed(() => {
  const c = displayChart.value
  if (c.meta.key) return false
  return !c.sections.some((s) => sectionHasVisibleContent(s.lines))
})

function stickyTopInsetPx(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--song-header-offset')
    .trim()
  const header = Number.parseFloat(raw) || 0
  const stickyEl = document.getElementById(STICKY_HOST_ID)
  const bar = stickyEl?.getBoundingClientRect().height || 44
  return Math.ceil(header + bar)
}

function clearPulse() {
  pulsedSectionId.value = null
  if (pulseTimer) {
    clearTimeout(pulseTimer)
    pulseTimer = null
  }
}

function pulseSection(id: string) {
  pulsedSectionId.value = id
  if (pulseTimer) clearTimeout(pulseTimer)
  pulseTimer = setTimeout(() => {
    pulsedSectionId.value = null
    pulseTimer = null
  }, PULSE_MS)
}

/** Centra el chip en la fila horizontal sin mover el scroll de la página. */
function scrollChipIntoView(id: string, behavior: ScrollBehavior = 'smooth') {
  const nav = navRef.value
  if (!nav) return
  const chip = nav.querySelector<HTMLElement>(`[data-section-id="${id}"]`)
  if (!chip) return

  const navRect = nav.getBoundingClientRect()
  const chipRect = chip.getBoundingClientRect()
  const delta =
    chipRect.left - navRect.left - (navRect.width - chipRect.width) / 2
  const nextLeft = nav.scrollLeft + delta
  if (Math.abs(delta) < 2) return
  nav.scrollTo({ left: nextLeft, behavior })
}

function setActiveSection(id: string | null, scrollChip = true) {
  if (!id) return
  const changed = activeSectionId.value !== id
  if (changed) activeSectionId.value = id
  if (scrollChip && changed) scrollChipIntoView(id)
}

function pickActiveFromIntersections() {
  if (programmaticScroll || intersectingIds.size === 0) return

  const order = navSections.value.map((s) => s.id)
  // Preferir la primera sección (en orden del chart) que esté en la zona observada
  const firstHit = order.find((id) => intersectingIds.has(id))
  if (firstHit) setActiveSection(firstHit)
}

function teardownObserver() {
  sectionObserver?.disconnect()
  sectionObserver = null
  intersectingIds.clear()
}

function setupObserver() {
  teardownObserver()
  if (typeof IntersectionObserver === 'undefined') return
  if (navSections.value.length < 2) return

  sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target.id
        if (!id) continue
        if (entry.isIntersecting) intersectingIds.add(id)
        else intersectingIds.delete(id)
      }
      pickActiveFromIntersections()
    },
    {
      // Banda superior del viewport (debajo de header + chips sticky)
      root: null,
      rootMargin: `-${stickyTopInsetPx()}px 0px -62% 0px`,
      threshold: [0, 0.1, 0.25, 0.5]
    }
  )

  for (const sec of navSections.value) {
    const el = document.getElementById(sec.id)
    if (el) sectionObserver.observe(el)
  }

  if (!activeSectionId.value && navSections.value[0]) {
    setActiveSection(navSections.value[0].id, false)
    nextTick(() => scrollChipIntoView(navSections.value[0].id, 'auto'))
  }
}

function endProgrammaticScroll() {
  if (!programmaticScroll) return
  programmaticScroll = false
  if (programmaticScrollFallback) {
    clearTimeout(programmaticScrollFallback)
    programmaticScrollFallback = null
  }
  if (pulsedSectionId.value) {
    pulseSection(pulsedSectionId.value)
  }
  pickActiveFromIntersections()
}

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return

  programmaticScroll = true
  if (programmaticScrollFallback) clearTimeout(programmaticScrollFallback)
  programmaticScrollFallback = setTimeout(
    endProgrammaticScroll,
    PROGRAMMATIC_SCROLL_MAX_MS
  )

  setActiveSection(id)
  pulseSection(id)
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function onScrollEnd() {
  if (programmaticScroll) endProgrammaticScroll()
}

watch(
  () => navSections.value.map((s) => s.id).join('|'),
  async () => {
    await nextTick()
    setupObserver()
  }
)

watch(
  () => props.stickyTeleport,
  async (enabled) => {
    if (!enabled) return
    await nextTick()
    refreshStickyHost()
    await nextTick()
    setupObserver()
  },
  { immediate: true }
)

watch(useStickyTeleport, async () => {
  await nextTick()
  if (activeSectionId.value) scrollChipIntoView(activeSectionId.value, 'auto')
})

onMounted(async () => {
  window.addEventListener('scrollend', onScrollEnd, true)
  refreshStickyHost()
  await nextTick()
  refreshStickyHost()
  setupObserver()
})

onUnmounted(() => {
  clearPulse()
  teardownObserver()
  if (programmaticScrollFallback) clearTimeout(programmaticScrollFallback)
  window.removeEventListener('scrollend', onScrollEnd, true)
})
</script>

<style scoped>
.chord-chart-view {
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 1rem;
  line-height: 1.25;
  color: var(--color-text);
  padding: 0.25rem 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.chord-chart-view__placeholder {
  color: var(--color-text-soft);
  font-family: inherit;
  margin: 0;
}

.chord-chart-view__key {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.chord-chart-view__mode {
  margin-left: 0.25rem;
}

.chord-chart-view__sticky {
  position: sticky;
  top: var(--song-header-offset, 0px);
  z-index: 2;
  margin: 0 0 0.85rem;
  padding: 0.3rem 0 0.35rem;
  background: color-mix(in srgb, var(--color-background) 94%, transparent);
  backdrop-filter: blur(8px);
}

.chord-chart-view__sticky--teleported {
  position: static;
  top: auto;
  z-index: auto;
  margin: 0;
  backdrop-filter: none;
  background: transparent;
}

.chord-chart-view__sticky-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
}

.chord-chart-view__nav {
  display: flex;
  flex: 1;
  flex-wrap: nowrap;
  gap: 0.28rem;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 0.35rem,
    #000 calc(100% - 0.35rem),
    transparent 100%
  );
}

.chord-chart-view__nav::-webkit-scrollbar {
  display: none;
}

.chord-chart-view__tools {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
}

.chord-chart-view__tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 30px;
  padding: 0 0.4rem;
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-card, #fff);
  color: var(--color-heading, var(--color-text));
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.chord-chart-view__tool:hover {
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 35%, var(--color-border));
  background: var(--color-background-hover);
}

.chord-chart-view__tool--active {
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 40%, var(--color-border));
}

.chord-sheet-key {
  max-width: 100%;
  overflow-x: hidden;
}

.chord-sheet-key__main {
  text-align: center;
  max-width: 100%;
}

.chord-sheet-key__current {
  margin: 0.15rem 0 0.85rem;
  text-align: center;
  font-size: 2.35rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--color-heading, var(--color-text));
}

.chord-sheet-key__carousel {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0 0 1rem;
  overflow: hidden;
}

.chord-sheet-key__chevron {
  flex-shrink: 0;
  width: 2rem;
  height: 2.5rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-accent);
  font-size: 1.65rem;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
}

.chord-sheet-key__chevron:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

.chord-sheet-key__chevron:disabled {
  color: var(--color-text-mute, #cbd5e1);
  cursor: default;
  opacity: 0.55;
}

.chord-sheet-key__track {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-block: 0.35rem;
  /* Centrar también extremos: hueco vacío a los lados */
  padding-inline: calc(50% - 1.5rem);
}

.chord-sheet-key__track::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.chord-sheet-key__tone {
  flex: 0 0 auto;
  scroll-snap-align: center;
  scroll-snap-stop: always;
  min-width: 3rem;
  padding: 0.55rem 0.65rem;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--color-text-mute, var(--color-text-soft));
  font-family: inherit;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
  opacity: 0.5;
}

.chord-sheet-key__tone:hover {
  color: var(--color-text);
  opacity: 0.85;
}

.chord-sheet-key__tone--current {
  color: var(--color-accent);
  font-size: 1.35rem;
  font-weight: 800;
  opacity: 1;
  transform: scale(1.05);
  cursor: default;
}

.chord-sheet-key__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
}

.chord-sheet-key__reset {
  display: inline-block;
  width: auto;
  margin: 0.15rem auto 0;
  padding: 0.35rem 0.25rem;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--color-accent);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 0.18em;
  text-decoration-thickness: 1px;
}

.chord-sheet-key__reset:hover:not(:disabled) {
  color: var(--color-heading, var(--color-text));
}

.chord-sheet-key__reset:disabled {
  color: var(--color-text-mute, #94a3b8);
  text-decoration: none;
  cursor: default;
  opacity: 0.7;
  pointer-events: none;
}

.chord-sheet-key__persist {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 10px;
  background: var(--color-accent);
  color: var(--color-text-inverse, #fff);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}

.chord-sheet-key__persist:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.chord-sheet-key__aside {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.1rem;
  padding-top: 0.75rem;
  border-top: 1px solid color-mix(in srgb, var(--color-border) 75%, transparent);
  max-width: 100%;
  min-width: 0;
}

.chord-sheet-key__original {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-text-mute, var(--color-text-soft));
}

.chord-sheet-key__original strong {
  color: var(--color-text-soft);
  font-weight: 650;
}

.chord-sheet-key__accidentals {
  display: inline-flex;
  align-items: center;
  gap: 0.12rem;
  flex-shrink: 0;
  padding: 0.08rem;
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-border) 30%, transparent);
}

.chord-sheet-key__accidental {
  width: 1.5rem;
  height: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-mute, var(--color-text-soft));
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.chord-sheet-key__accidental:hover {
  color: var(--color-accent);
  background: var(--color-background);
}

.chord-sheet-key__accidental--active {
  color: var(--color-accent);
  background: var(--color-background);
}

.chord-sheet-font__preview {
  margin: 0.15rem 0 0.35rem;
  padding: 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
  line-height: 1.25;
}

.chord-sheet-font__preview-chord {
  display: block;
  font-weight: 700;
  color: var(--color-accent);
  font-size: 0.85em;
}

.chord-sheet-font__percent {
  margin: 0 0 0.75rem;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text-soft);
}

.chord-sheet-font__presets {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.85rem;
}

.chord-sheet-font__preset {
  padding: 0.55rem 0.25rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.chord-sheet-font__preset--active,
.chord-sheet-font__preset:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

.chord-sheet-font__slider {
  width: 100%;
  margin-bottom: 0.75rem;
  accent-color: var(--color-accent);
}

.chord-sheet-font__steps {
  display: flex;
  gap: 0.45rem;
  margin-bottom: 0.85rem;
}

.chord-sheet-font__step {
  flex: 1;
  min-height: 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.chord-sheet-font__step:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.chord-sheet-font__step:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.chord-sheet-font__toggle {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
}

.chord-chart-view--compact .chord-chart-view__line {
  margin-bottom: 0.15rem;
}

.chord-chart-view--compact .chord-chart-view__line--blank {
  min-height: 0.65em;
  margin-bottom: 0.25rem;
}

.chord-chart-view--compact .chord-chart-view__section {
  margin-bottom: 0.55rem;
}

.chord-chart-view__nav-chip {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;
  white-space: nowrap;
  scroll-margin-inline: 0.5rem;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.chord-chart-view__nav-chip:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.chord-chart-view__nav-chip--active {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
}

.chord-chart-view__section {
  margin: 0 0 1rem;
  scroll-margin-top: calc(var(--song-header-offset, 0px) + 2.5rem);
  transition:
    background 0.25s ease,
    box-shadow 0.25s ease;
}

.chord-chart-view__section--labeled {
  padding: 0.55rem 0.65rem 0.35rem;
  border-radius: 8px;
  background: color-mix(in srgb, var(--section-accent, var(--color-border)) 8%, transparent);
}

.chord-chart-view__section--highlighted {
  background: color-mix(in srgb, var(--section-accent, var(--color-accent)) 24%, transparent);
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--section-accent, var(--color-accent)) 55%, transparent);
  animation: chord-section-pulse 0.55s ease-out;
}

.chord-chart-view__section--highlighted:not(.chord-chart-view__section--labeled) {
  padding: 0.45rem 0.55rem 0.25rem;
  border-radius: 8px;
}

@keyframes chord-section-pulse {
  0% {
    background: color-mix(in srgb, var(--section-accent, var(--color-accent)) 38%, transparent);
  }
  100% {
    background: color-mix(in srgb, var(--section-accent, var(--color-accent)) 24%, transparent);
  }
}

.chord-chart-view__section--verse {
  --section-accent: #3b6ea5;
}

.chord-chart-view__section--chorus {
  --section-accent: #b45309;
}

.chord-chart-view__section--prechorus {
  --section-accent: #a16207;
}

.chord-chart-view__section--bridge {
  --section-accent: #6d28d9;
}

.chord-chart-view__section--intro,
.chord-chart-view__section--outro,
.chord-chart-view__section--tag {
  --section-accent: #0f766e;
}

.chord-chart-view__section--solo,
.chord-chart-view__section--instrumental,
.chord-chart-view__section--interlude {
  --section-accent: #475569;
}

.chord-chart-view__section--comment,
.chord-chart-view__section--custom {
  --section-accent: var(--color-accent, #1e3a5f);
}

.chord-chart-view__section-header {
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--section-accent, var(--color-text-soft));
  margin: 0 0 0.45rem;
}

.chord-chart-view__line {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  margin: 0 0 0.35rem;
  min-height: 1.25em;
}

.chord-chart-view__line--blank {
  min-height: 1.25em;
  margin-bottom: 0.5rem;
}

.chord-chart-view__col {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  white-space: pre;
}

.chord-chart-view__chord {
  font-weight: 700;
  color: var(--color-accent, #1e3a5f);
  font-size: 0.85em;
  line-height: 1.2;
  min-height: 1.2em;
}

.chord-chart-view__lyric {
  white-space: pre;
}

@media (max-width: 768px) {
  .chord-chart-view {
    font-size: 1.05rem;
  }

  .chord-chart-view__nav-chip {
    font-size: 0.68rem;
    padding: 0.16rem 0.48rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chord-chart-view__section--highlighted {
    animation: none;
  }

  .chord-chart-view__nav {
    scroll-behavior: auto;
  }
}

</style>
