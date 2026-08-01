import type {
  ChordChart,
  ChordChartLine,
  ChordChartSection,
  ChordChartSegment
} from './types'
import {
  defaultLabelForKind,
  envFromStartDirective,
  isSectionEndDirective,
  isSectionStartDirective,
  resolveSectionKind
} from './sectionMeta'

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

function newSection(
  id: string,
  kind: ChordChartSection['kind'],
  label: string,
  env?: string
): ChordChartSection {
  return { id, kind, label, env, lines: [] }
}

function sectionHasContent(section: ChordChartSection): boolean {
  return section.lines.some((line) =>
    line.segments.some(
      (seg) =>
        seg.type === 'chord' ||
        (seg.type === 'lyric' && seg.text.trim().length > 0)
    )
  )
}

/** ChordPro → AST (key, secciones, líneas con [acordes]). */
export function parseChordPro(source: string): ChordChart {
  const meta: ChordChart['meta'] = {}
  const sections: ChordChartSection[] = []
  let sectionCounter = 0

  const pushSection = (
    kind: ChordChartSection['kind'],
    label: string,
    env?: string
  ) => {
    sectionCounter += 1
    const section = newSection(`sec-${sectionCounter}`, kind, label, env)
    sections.push(section)
    return section
  }

  let current = pushSection('body', '')

  const normalized = (source || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (!normalized.trim()) {
    return { meta, sections: [] }
  }

  for (const rawLine of normalized.split('\n')) {
    const directive = rawLine.match(DIRECTIVE_RE)
    if (directive) {
      const name = directive[1].trim().toLowerCase()
      const value = (directive[2] ?? '').trim()

      if (name === 'key' || name === 'tonality' || name === 'tonalidad') {
        if (value) meta.key = value
        continue
      }

      if (isSectionStartDirective(name)) {
        const env = envFromStartDirective(name)
        const kind = resolveSectionKind(env)
        if (!sectionHasContent(current) && current.kind === 'body') {
          sections.pop()
        }
        current = pushSection(
          kind,
          defaultLabelForKind(kind, env, value),
          env
        )
        continue
      }

      if (isSectionEndDirective(name)) {
        // Cierra la sección actual; lo siguiente cae en body hasta nuevo start/comment
        if (!sectionHasContent(current) && current.kind !== 'body') {
          // sección vacía: mantenerla por si acaso, o descartar
        }
        current = pushSection('body', '')
        continue
      }

      if (name === 'comment' || name === 'c' || name === 'highlight') {
        if (!sectionHasContent(current) && (current.kind === 'body' || current.kind === 'comment')) {
          sections.pop()
        }
        current = pushSection(
          'comment',
          value || defaultLabelForKind('comment'),
          undefined
        )
        continue
      }

      // Otras directivas: no afectan el AST de vista (el fuente crudo vive en el editor)
      continue
    }

    current.lines.push({ segments: parseLineContent(rawLine) })
  }

  // Quitar bodies vacíos al final / intercalados sin contenido
  const cleaned = sections.filter(
    (s, i) =>
      s.kind !== 'body' ||
      sectionHasContent(s) ||
      (i === 0 && sections.length === 1)
  )

  return { meta, sections: cleaned.length ? cleaned : [] }
}

export function flattenChartLines(chart: ChordChart): ChordChartLine[] {
  return chart.sections.flatMap((s) => s.lines)
}
