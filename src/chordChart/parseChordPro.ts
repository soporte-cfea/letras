import type { ChordChart, ChordChartLine, ChordChartSegment } from './types'

const DIRECTIVE_RE = /^\s*\{([^}:]+)(?::\s*(.*?))?\}\s*$/
const CHORD_TOKEN_RE = /\[([^\]]*)\]/g

function parseLineContent(raw: string): ChordChartSegment[] {
  const segments: ChordChartSegment[] = []
  let lastIndex = 0
  CHORD_TOKEN_RE.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = CHORD_TOKEN_RE.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'lyric', text: raw.slice(lastIndex, match.index) })
    }
    const name = match[1].trim()
    if (name) {
      segments.push({ type: 'chord', name })
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < raw.length) {
    segments.push({ type: 'lyric', text: raw.slice(lastIndex) })
  }

  return segments
}

/** ChordPro mínimo → AST (key + líneas con [acordes]). */
export function parseChordPro(source: string): ChordChart {
  const meta: ChordChart['meta'] = {}
  const lines: ChordChartLine[] = []

  const normalized = (source || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (!normalized.trim()) {
    return { meta, lines: [] }
  }

  for (const rawLine of normalized.split('\n')) {
    const directive = rawLine.match(DIRECTIVE_RE)
    if (directive) {
      const name = directive[1].trim().toLowerCase()
      const value = (directive[2] ?? '').trim()
      if (name === 'key' || name === 'tonality' || name === 'tonalidad') {
        if (value) meta.key = value
      }
      // Otras directivas se ignoran en v1 (no se pierden al editar el fuente crudo en el textarea)
      continue
    }

    lines.push({ segments: parseLineContent(rawLine) })
  }

  return { meta, lines }
}
