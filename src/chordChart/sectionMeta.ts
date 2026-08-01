import type {
  ChordChartSectionKind
} from './types'

/** Etiquetas en español para la UI de ensayo. */
export const SECTION_KIND_LABELS: Record<ChordChartSectionKind, string> = {
  verse: 'Verso',
  chorus: 'Coro',
  prechorus: 'Precoro',
  bridge: 'Puente',
  intro: 'Intro',
  outro: 'Outro',
  solo: 'Solo',
  instrumental: 'Instrumental',
  interlude: 'Interludio',
  tag: 'Cierre',
  comment: 'Sección',
  custom: 'Sección',
  body: ''
}

const ENV_ALIASES: Record<string, ChordChartSectionKind> = {
  verse: 'verse',
  verses: 'verse',
  chorus: 'chorus',
  prechorus: 'prechorus',
  'pre-chorus': 'prechorus',
  bridge: 'bridge',
  intro: 'intro',
  outro: 'outro',
  solo: 'solo',
  instrumental: 'instrumental',
  interlude: 'interlude',
  tag: 'tag',
  ending: 'tag',
  // Abreviaciones ChordPro habituales
  soc: 'chorus',
  eoc: 'chorus',
  sov: 'verse',
  eov: 'verse',
  sob: 'bridge',
  eob: 'bridge'
}

export function resolveSectionKind(envName: string): ChordChartSectionKind {
  const key = envName.trim().toLowerCase().replace(/\s+/g, '')
  return ENV_ALIASES[key] ?? 'custom'
}

export function defaultLabelForKind(
  kind: ChordChartSectionKind,
  env?: string,
  explicit?: string
): string {
  if (explicit?.trim()) return explicit.trim()
  if (kind === 'custom' && env) {
    return env.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return SECTION_KIND_LABELS[kind] || ''
}

export function isSectionStartDirective(name: string): boolean {
  const n = name.toLowerCase()
  return n.startsWith('start_of_') || n === 'soc' || n === 'sov' || n === 'sob'
}

export function isSectionEndDirective(name: string): boolean {
  const n = name.toLowerCase()
  return n.startsWith('end_of_') || n === 'eoc' || n === 'eov' || n === 'eob'
}

export function envFromStartDirective(name: string): string {
  const n = name.toLowerCase()
  if (n === 'soc') return 'chorus'
  if (n === 'sov') return 'verse'
  if (n === 'sob') return 'bridge'
  if (n.startsWith('start_of_')) return n.slice('start_of_'.length)
  return n
}

export function envFromEndDirective(name: string): string {
  const n = name.toLowerCase()
  if (n === 'eoc') return 'chorus'
  if (n === 'eov') return 'verse'
  if (n === 'eob') return 'bridge'
  if (n.startsWith('end_of_')) return n.slice('end_of_'.length)
  return n
}
