export type ChordChartSegment =
  | { type: 'lyric'; text: string }
  | { type: 'chord'; name: string }

export interface ChordChartLine {
  segments: ChordChartSegment[]
}

/** Tipos de sección reconocidos (ChordPro start_of_* + comentario). */
export type ChordChartSectionKind =
  | 'verse'
  | 'chorus'
  | 'prechorus'
  | 'bridge'
  | 'intro'
  | 'outro'
  | 'solo'
  | 'instrumental'
  | 'interlude'
  | 'tag'
  | 'comment'
  | 'custom'
  | 'body'

export interface ChordChartSection {
  /** Id estable para anclas de ensayo */
  id: string
  kind: ChordChartSectionKind
  /** Texto visible: "Coro", "Verso 1", etc. */
  label: string
  /**
   * Nombre de entorno ChordPro si aplica (verse, chorus, …).
   * Vacío en body/comment genérico.
   */
  env?: string
  lines: ChordChartLine[]
}

export interface ChordChartMeta {
  key?: string
}

export interface ChordChart {
  meta: ChordChartMeta
  sections: ChordChartSection[]
}
