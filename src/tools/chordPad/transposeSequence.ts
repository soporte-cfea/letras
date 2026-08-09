import { Chord, Interval } from 'tonal'

/**
 * Tokeniza texto libre en piezas (acordes / separadores / resto).
 * Acepta espacios, comas, |, saltos de línea y `[Am]` estilo ChordPro.
 */
export function tokenizeChordSequence(raw: string): string[] {
  if (!raw.trim()) return []

  const normalized = raw
    .replace(/\r\n/g, '\n')
    .replace(/\[([^\]]+)\]/g, ' $1 ')
    .replace(/,/g, ' ')
    .replace(/\|/g, ' | ')

  return normalized
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
}

function intervalFromSemitones(semitones: number): string {
  return Interval.fromSemitones(semitones)
}

/** Transpone un símbolo; si tonal no lo reconoce, lo deja igual. */
export function transposeChordToken(token: string, semitones: number): string {
  if (!token || semitones === 0) return token
  if (token === '|') return token

  const next = Chord.transpose(token, intervalFromSemitones(semitones))
  return next || token
}

export function transposeChordSequence(raw: string, semitones: number): string {
  const tokens = tokenizeChordSequence(raw)
  if (tokens.length === 0) return ''
  return tokens.map((t) => transposeChordToken(t, semitones)).join(' ')
}

/** Tónica de una etiqueta tipo C, Am, F#m (vía Chord.get). */
export function tonicFromKeyLabel(key: string): string | null {
  if (!key?.trim()) return null
  const chord = Chord.get(key.trim())
  return chord.empty || !chord.tonic ? null : chord.tonic
}

/**
 * Semitonos de origen → destino (0–11).
 * Si no se pueden parsear, null.
 */
export function semitonesBetweenKeys(
  fromKey: string | null | undefined,
  toKey: string | null | undefined
): number | null {
  const from = tonicFromKeyLabel(fromKey || '')
  const to = tonicFromKeyLabel(toKey || '')
  if (!from || !to) return null

  const ivl = Interval.distance(from, to)
  const n = Interval.semitones(ivl)
  if (n === undefined || Number.isNaN(n)) return null
  return ((n % 12) + 12) % 12
}

/** Desplaza una tonalidad (C, Am…) por semitonos. */
export function transposeKeyLabel(
  key: string | null | undefined,
  semitones: number
): string | null {
  if (!key?.trim()) return null
  if (semitones === 0) return key
  const next = Chord.transpose(key.trim(), intervalFromSemitones(semitones))
  return next || key
}
