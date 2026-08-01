export type ChordChartSegment =
  | { type: 'lyric'; text: string }
  | { type: 'chord'; name: string }

export interface ChordChartLine {
  segments: ChordChartSegment[]
}

export interface ChordChartMeta {
  key?: string
}

export interface ChordChart {
  meta: ChordChartMeta
  lines: ChordChartLine[]
}
