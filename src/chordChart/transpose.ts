import { Interval, Note } from 'tonal'
import type { ChordChart } from './types'

const CHORD_ROOT_RE = /^([A-G](?:#|b)?)(.*)$/i

function transposePitchClass(pc: string, interval: string): string | null {
  const transposed = Note.transpose(pc, interval)
  if (!transposed) return null
  return transposed.replace(/\d+/g, '')
}

/** Transpone un símbolo de acorde (p. ej. Dm7, F/A, Bbmaj7). */
export function transposeChordSymbol(symbol: string, semitones: number): string {
  if (!symbol || semitones === 0) return symbol

  const interval = Interval.fromSemitones(semitones)
  const [main, bass] = symbol.split('/')

  const mainMatch = main.trim().match(CHORD_ROOT_RE)
  if (!mainMatch) return symbol

  const newRoot = transposePitchClass(mainMatch[1], interval)
  if (!newRoot) return symbol

  let result = `${newRoot}${mainMatch[2]}`

  if (bass != null && bass.trim()) {
    const bassMatch = bass.trim().match(CHORD_ROOT_RE)
    if (bassMatch) {
      const newBass = transposePitchClass(bassMatch[1], interval)
      if (newBass) {
        result += `/${newBass}${bassMatch[2]}`
      } else {
        result += `/${bass.trim()}`
      }
    } else {
      result += `/${bass.trim()}`
    }
  }

  return result
}

/** Copia del chart con acordes y meta.key transpuestos. */
export function transposeChart(chart: ChordChart, semitones: number): ChordChart {
  if (semitones === 0) {
    return {
      meta: { ...chart.meta },
      lines: chart.lines.map((line) => ({
        segments: line.segments.map((seg) => ({ ...seg }))
      }))
    }
  }

  return {
    meta: {
      ...chart.meta,
      key: chart.meta.key
        ? transposeChordSymbol(chart.meta.key, semitones)
        : chart.meta.key
    },
    lines: chart.lines.map((line) => ({
      segments: line.segments.map((seg) =>
        seg.type === 'chord'
          ? { type: 'chord' as const, name: transposeChordSymbol(seg.name, semitones) }
          : { type: 'lyric' as const, text: seg.text }
      )
    }))
  }
}
