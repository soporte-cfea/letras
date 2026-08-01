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
        class="chord-chart-view__nav"
        aria-label="Secciones"
      >
        <a
          v-for="sec in navSections"
          :key="sec.id"
          class="chord-chart-view__nav-chip"
          :class="`chord-chart-view__nav-chip--${sec.kind}`"
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
          { 'chord-chart-view__section--labeled': Boolean(sec.displayLabel) }
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
import { computed } from 'vue'
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

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
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
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0 0 1rem;
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 0.35rem 0;
  background: color-mix(in srgb, var(--color-background-card, #fff) 92%, transparent);
  backdrop-filter: blur(6px);
}

.chord-chart-view__nav-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  scroll-margin-top: 3rem;
}

.chord-chart-view__nav-chip:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.chord-chart-view__section {
  margin: 0 0 1rem;
  scroll-margin-top: 3.5rem;
}

.chord-chart-view__section--labeled {
  padding: 0.55rem 0.65rem 0.35rem;
  border-radius: 8px;
  background: color-mix(in srgb, var(--section-accent, var(--color-border)) 8%, transparent);
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
    padding: 0.4rem 0.7rem;
  }
}
</style>
