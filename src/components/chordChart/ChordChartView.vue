<template>
  <div
    class="chord-chart-view"
    :class="{ 'chord-chart-view--empty': isEmpty }"
    :style="{ fontSize: `calc(1rem * ${fontScale})` }"
  >
    <p v-if="isEmpty" class="chord-chart-view__placeholder">
      {{ emptyMessage }}
    </p>
    <template v-else>
      <p v-if="showKey && displayKey" class="chord-chart-view__key">
        Tonalidad: <strong>{{ displayKey }}</strong>
        <span v-if="modeLabel" class="chord-chart-view__mode">{{ modeLabel }}</span>
      </p>

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
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { ChordChart, ChordChartLine, ChordChartSectionKind } from '@/chordChart'
import { parseKey, SECTION_KIND_LABELS, transposeChart } from '@/chordChart'

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
    emptyMessage?: string
    /** Si false, no muestra la línea de tonalidad (la toolbar ya la tiene). */
    showKey?: boolean
    /** Escala tipográfica (1 = 100%). */
    fontScale?: number
  }>(),
  {
    transposeSemitones: 0,
    emptyMessage: 'No hay contenido en el chart.',
    showKey: true,
    fontScale: 1
  }
)

const navRef = ref<HTMLElement | null>(null)
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
  transposeChart(props.chart, props.transposeSemitones)
)

const displayKey = computed(() => displayChart.value.meta.key || '')

const modeLabel = computed(() => {
  const parsed = parseKey(displayKey.value)
  if (!parsed) return ''
  return parsed.mode === 'minor' ? 'menor' : 'mayor'
})

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

const isEmpty = computed(() => {
  const c = displayChart.value
  if (c.meta.key) return false
  return !c.sections.some((s) => sectionHasVisibleContent(s.lines))
})

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
      // Banda superior del viewport (debajo del nav sticky)
      root: null,
      rootMargin: '-12% 0px -68% 0px',
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

onMounted(async () => {
  window.addEventListener('scrollend', onScrollEnd, true)
  await nextTick()
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

.chord-chart-view__nav {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.4rem;
  margin: 0 0 1rem;
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 0.4rem 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  background: color-mix(in srgb, var(--color-background-card, #fff) 92%, transparent);
  backdrop-filter: blur(6px);
  mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 0.6rem,
    #000 calc(100% - 0.6rem),
    transparent 100%
  );
}

.chord-chart-view__nav::-webkit-scrollbar {
  display: none;
}

.chord-chart-view__nav-chip {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  scroll-margin-inline: 0.75rem;
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
  scroll-margin-top: 3.25rem;
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
    font-size: 0.8rem;
    padding: 0.4rem 0.85rem;
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
