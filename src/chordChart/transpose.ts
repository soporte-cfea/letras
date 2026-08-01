import { Chord, Interval } from 'tonal'
import type { ChordChart } from './types'
import {
  keyAsChordSymbol,
  parseKey,
  type ParsedKey
} from './keyTheory'

function intervalFromSemitones(semitones: number): string {
  return Interval.fromSemitones(semitones)
}

/**
 * Transpone un símbolo de acorde con `Chord.transpose` (tonal).
 * Si tonal no reconoce el símbolo, lo deja igual.
 */
export function transposeChordSymbol(symbol: string, semitones: number): string {
  if (!symbol || semitones === 0) return symbol
  return Chord.transpose(symbol, intervalFromSemitones(semitones))
}

/** Transpone `{key: …}` preservando mayor/menor vía `Chord.transpose`. */
export function transposeKeyDirective(
  keyRaw: string | undefined,
  semitones: number
): string | undefined {
  if (!keyRaw) return keyRaw
  if (semitones === 0) return keyRaw

  const parsed = parseKey(keyRaw)
  if (!parsed) {
    return transposeChordSymbol(keyRaw, semitones)
  }

  const next = Chord.transpose(
    keyAsChordSymbol(parsed),
    intervalFromSemitones(semitones)
  )
  return parseKey(next)?.label ?? next
}

export function transposeParsedKey(key: ParsedKey, semitones: number): ParsedKey {
  if (semitones === 0) return { ...key }
  const next = Chord.transpose(
    keyAsChordSymbol(key),
    intervalFromSemitones(semitones)
  )
  return parseKey(next) ?? key
}

/** Copia del chart con acordes y meta.key transpuestos por tonal (secciones intactas). */
export function transposeChart(chart: ChordChart, semitones: number): ChordChart {
  if (semitones === 0) {
    return {
      meta: { ...chart.meta },
      sections: chart.sections.map((section) => ({
        ...section,
        lines: section.lines.map((line) => ({
          segments: line.segments.map((seg) => ({ ...seg }))
        }))
      }))
    }
  }

  return {
    meta: {
      ...chart.meta,
      key: chart.meta.key
        ? transposeKeyDirective(chart.meta.key, semitones)
        : chart.meta.key
    },
    sections: chart.sections.map((section) => ({
      ...section,
      lines: section.lines.map((line) => ({
        segments: line.segments.map((seg) =>
          seg.type === 'chord'
            ? {
                type: 'chord' as const,
                name: transposeChordSymbol(seg.name, semitones)
              }
            : { type: 'lyric' as const, text: seg.text }
        )
      }))
    }))
  }
}
