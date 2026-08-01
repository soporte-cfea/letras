import type { ChordChart } from './types'

export type {
  ChordChart,
  ChordChartLine,
  ChordChartMeta,
  ChordChartSection,
  ChordChartSectionKind,
  ChordChartSegment
} from './types'
export { parseChordPro, flattenChartLines } from './parseChordPro'
export { serializeChordPro } from './serializeChordPro'
export {
  transposeChart,
  transposeChordSymbol,
  transposeKeyDirective,
  transposeParsedKey
} from './transpose'
export {
  parseKey,
  formatKeyDisplay,
  formatKeyLabel,
  keyAsChordSymbol,
  type KeyMode,
  type ParsedKey
} from './keyTheory'
export {
  SECTION_KIND_LABELS,
  defaultLabelForKind,
  resolveSectionKind
} from './sectionMeta'
export { A_EL_ALTO_Y_SUBLIME_CHORDPRO } from './samples/aElAltoYSublime'
export { isLegacyAcordesRollback, LEGACY_ACORDES_QUERY } from './legacyAcordes'

/** True si el chart no tiene líneas con texto/acordes. */
export function isChordChartContentEmpty(chart: ChordChart): boolean {
  return !chart.sections.some((section) =>
    section.lines.some((line) =>
      line.segments.some(
        (seg) =>
          seg.type === 'chord' ||
          (seg.type === 'lyric' && seg.text.trim().length > 0)
      )
    )
  )
}
