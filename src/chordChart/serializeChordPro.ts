import type {
  ChordChart,
  ChordChartSegment
} from './types'
import { defaultLabelForKind } from './sectionMeta'

function serializeLine(segments: ChordChartSegment[]): string {
  return segments
    .map((seg) => (seg.type === 'chord' ? `[${seg.name}]` : seg.text))
    .join('')
}

/** AST → ChordPro (key + secciones + líneas). */
export function serializeChordPro(chart: ChordChart): string {
  const out: string[] = []

  if (chart.meta.key) {
    out.push(`{key: ${chart.meta.key}}`)
  }

  for (const section of chart.sections) {
    if (section.kind === 'body') {
      for (const line of section.lines) {
        out.push(serializeLine(line.segments))
      }
      continue
    }

    if (section.kind === 'comment' || !section.env) {
      out.push(`{comment: ${section.label}}`)
      for (const line of section.lines) {
        out.push(serializeLine(line.segments))
      }
      out.push('')
      continue
    }

    const defaultLabel = defaultLabelForKind(section.kind, section.env)
    const labelSuffix =
      section.label && section.label !== defaultLabel
        ? `: ${section.label}`
        : ''
    out.push(`{start_of_${section.env}${labelSuffix}}`)

    for (const line of section.lines) {
      out.push(serializeLine(line.segments))
    }

    out.push(`{end_of_${section.env}}`)
    out.push('')
  }

  while (out.length > 0 && out[out.length - 1] === '') {
    out.pop()
  }

  return out.join('\n')
}
