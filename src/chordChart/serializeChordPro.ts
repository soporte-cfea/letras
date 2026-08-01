import type { ChordChart, ChordChartSegment } from './types'

function serializeLine(segments: ChordChartSegment[]): string {
  return segments
    .map((seg) => (seg.type === 'chord' ? `[${seg.name}]` : seg.text))
    .join('')
}

/** AST → ChordPro (key + líneas). */
export function serializeChordPro(chart: ChordChart): string {
  const out: string[] = []

  if (chart.meta.key) {
    out.push(`{key: ${chart.meta.key}}`)
  }

  for (const line of chart.lines) {
    out.push(serializeLine(line.segments))
  }

  // Evitar archivo vacío sin salto final raro: unir con \n
  return out.join('\n')
}
