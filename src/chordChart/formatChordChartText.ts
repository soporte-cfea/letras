import type { ChordChart, ChordChartLine, ChordChartSectionKind } from './types'
import { SECTION_KIND_LABELS } from './sectionMeta'
import { transposeChart, type AccidentalPreference } from './transpose'

interface ChartColumn {
  chord: string
  lyric: string
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

/** Alinea acorde encima de letra como en la vista (monoespaciado). */
export function formatLineColumns(line: ChordChartLine): { chord: string; lyric: string } | null {
  if (isBlankLine(line)) return null

  const columns = lineToColumns(line)
  if (!columns.length) return null

  let chordRow = ''
  let lyricRow = ''

  for (const col of columns) {
    const width = Math.max(col.chord.length, col.lyric.length)
    chordRow += col.chord.padEnd(width)
    lyricRow += col.lyric.padEnd(width)
  }

  return {
    chord: chordRow.replace(/\s+$/, ''),
    lyric: lyricRow.replace(/\s+$/, '')
  }
}

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

export interface FormatChordChartTextOptions {
  title?: string
  transposeSemitones?: number
  accidentals?: AccidentalPreference
}

/**
 * Chart → texto plano listo para PDF/compartir.
 * Respeta transposición y etiquetas de sección.
 */
export function formatChordChartText(
  chart: ChordChart,
  options: FormatChordChartTextOptions = {}
): string {
  const { title, transposeSemitones = 0, accidentals } = options
  const display = transposeChart(chart, transposeSemitones, { accidentals })

  const lines: string[] = []

  if (title?.trim()) {
    lines.push(title.trim())
  }

  if (display.meta.key) {
    const offset =
      transposeSemitones !== 0
        ? ` (${transposeSemitones > 0 ? '+' : ''}${transposeSemitones})`
        : ''
    lines.push(`Tonalidad: ${display.meta.key}${offset}`)
  }

  if (lines.length) {
    lines.push('')
  }

  const sections = display.sections.filter(
    (s) => s.kind !== 'body' || sectionHasVisibleContent(s.lines)
  )
  const labels = buildDisplayLabels(sections)

  sections.forEach((section, i) => {
    const label = labels[i]
    if (label) {
      if (lines.length && lines[lines.length - 1] !== '') {
        lines.push('')
      }
      lines.push(`[${label}]`)
    }

    for (const line of section.lines) {
      if (isBlankLine(line)) {
        lines.push('')
        continue
      }
      const formatted = formatLineColumns(line)
      if (!formatted) continue
      if (formatted.chord.trim()) {
        lines.push(formatted.chord)
      }
      lines.push(formatted.lyric || '')
    }
  })

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}
