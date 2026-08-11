import { Chord, Interval, Note } from 'tonal'
import type { ChordChart } from './types'
import {
  keyAsChordSymbol,
  parseKey,
  type ParsedKey
} from './keyTheory'

export type AccidentalPreference = 'sharp' | 'flat'

export interface TransposeOptions {
  /** Preferencia de escritura enarmónica (sostenidos / bemoles). */
  accidentals?: AccidentalPreference
}

function intervalFromSemitones(semitones: number): string {
  return Interval.fromSemitones(semitones)
}

function preferNoteSpelling(note: string, prefer: AccidentalPreference): string {
  if (!note) return note
  const acc = Note.accidentals(note)
  if (prefer === 'flat' && acc.includes('#')) return Note.enharmonic(note)
  if (prefer === 'sharp' && acc.includes('b')) return Note.enharmonic(note)
  return note
}

/**
 * Reescribe un símbolo de acorde con sostenidos o bemoles vía `Note.enharmonic`.
 * Si tonal no reconoce el símbolo, lo deja igual.
 */
export function applyAccidentalPreferenceToSymbol(
  symbol: string,
  prefer: AccidentalPreference
): string {
  if (!symbol) return symbol
  const chord = Chord.get(symbol)
  if (chord.empty || !chord.tonic) return symbol

  const tonic = preferNoteSpelling(chord.tonic, prefer)
  const bass = chord.bass ? preferNoteSpelling(chord.bass, prefer) : ''
  const type = chord.symbol.slice(chord.tonic.length).replace(/\/.*$/, '')
  return `${tonic}${type}${bass ? `/${bass}` : ''}`
}

export function detectAccidentalPreference(
  keyRaw?: string | null
): AccidentalPreference {
  const parsed = parseKey(keyRaw)
  const tonic = parsed?.tonic || keyRaw || ''
  const acc = Note.accidentals(tonic)
  if (acc.includes('b')) return 'flat'
  return 'sharp'
}

/**
 * Transpone un símbolo de acorde con `Chord.transpose` (tonal).
 * Si tonal no reconoce el símbolo, lo deja igual.
 */
export function transposeChordSymbol(
  symbol: string,
  semitones: number,
  options?: TransposeOptions
): string {
  if (!symbol) return symbol
  let next =
    semitones === 0
      ? symbol
      : Chord.transpose(symbol, intervalFromSemitones(semitones))
  if (options?.accidentals) {
    next = applyAccidentalPreferenceToSymbol(next, options.accidentals)
  }
  return next
}

/** Transpone `{key: …}` preservando mayor/menor vía `Chord.transpose`. */
export function transposeKeyDirective(
  keyRaw: string | undefined,
  semitones: number,
  options?: TransposeOptions
): string | undefined {
  if (!keyRaw) return keyRaw

  let next: string
  if (semitones === 0) {
    next = keyRaw
  } else {
    const parsed = parseKey(keyRaw)
    if (!parsed) {
      next = transposeChordSymbol(keyRaw, semitones)
    } else {
      const transposed = Chord.transpose(
        keyAsChordSymbol(parsed),
        intervalFromSemitones(semitones)
      )
      next = parseKey(transposed)?.label ?? transposed
    }
  }

  if (options?.accidentals) {
    next = applyAccidentalPreferenceToSymbol(next, options.accidentals)
    const parsedNext = parseKey(next)
    if (parsedNext) return parsedNext.label
  }
  return next
}

export function transposeParsedKey(
  key: ParsedKey,
  semitones: number,
  options?: TransposeOptions
): ParsedKey {
  const label = transposeKeyDirective(key.label, semitones, options)
  return parseKey(label) ?? key
}

function mapChart(
  chart: ChordChart,
  mapChord: (name: string) => string,
  nextKey: string | undefined
): ChordChart {
  return {
    meta: {
      ...chart.meta,
      key: nextKey
    },
    sections: chart.sections.map((section) => ({
      ...section,
      lines: section.lines.map((line) => ({
        segments: line.segments.map((seg) =>
          seg.type === 'chord'
            ? { type: 'chord' as const, name: mapChord(seg.name) }
            : { type: 'lyric' as const, text: seg.text }
        )
      }))
    }))
  }
}

/** Copia del chart con acordes y meta.key transpuestos por tonal (secciones intactas). */
export function transposeChart(
  chart: ChordChart,
  semitones: number,
  options?: TransposeOptions
): ChordChart {
  if (semitones === 0 && !options?.accidentals) {
    return mapChart(chart, (name) => name, chart.meta.key)
  }

  return mapChart(
    chart,
    (name) => transposeChordSymbol(name, semitones, options),
    chart.meta.key
      ? transposeKeyDirective(chart.meta.key, semitones, options)
      : chart.meta.key
  )
}
