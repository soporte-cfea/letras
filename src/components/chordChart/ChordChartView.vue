<template>
  <div class="chord-chart-view" :class="{ 'chord-chart-view--empty': isEmpty }">
    <p v-if="isEmpty" class="chord-chart-view__placeholder">
      {{ emptyMessage }}
    </p>
    <template v-else>
      <p v-if="displayKey" class="chord-chart-view__key">
        Tonalidad: <strong>{{ displayKey }}</strong>
        <span v-if="modeLabel" class="chord-chart-view__mode">{{ modeLabel }}</span>
      </p>
      <div
        v-for="(line, lineIndex) in renderedLines"
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChordChart, ChordChartLine } from '@/chordChart'
import { parseKey, transposeChart } from '@/chordChart'

interface ChartColumn {
  chord: string
  lyric: string
}

interface RenderedLine {
  blank: boolean
  columns: ChartColumn[]
}

const props = withDefaults(
  defineProps<{
    chart: ChordChart
    transposeSemitones?: number
    emptyMessage?: string
  }>(),
  {
    transposeSemitones: 0,
    emptyMessage: 'No hay contenido en el chart.'
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

const renderedLines = computed<RenderedLine[]>(() =>
  displayChart.value.lines.map((line) => {
    if (isBlankLine(line)) {
      return { blank: true, columns: [] }
    }
    return { blank: false, columns: lineToColumns(line) }
  })
)

const isEmpty = computed(() => {
  const c = displayChart.value
  if (c.meta.key) return false
  return c.lines.every((line) => isBlankLine(line))
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
}
</style>
