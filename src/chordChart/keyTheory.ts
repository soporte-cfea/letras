import { Chord } from 'tonal'

export type KeyMode = 'major' | 'minor'

export interface ParsedKey {
  tonic: string
  mode: KeyMode
  /** Etiqueta compacta ChordPro: C, Am, F#m, Bb */
  label: string
}

/** Solo adapta aliases en español; la teoría la resuelve `Chord.get`. */
function normalizeKeyInput(raw: string): string {
  return raw
    .trim()
    .replace(/\s+mayor\s*$/i, ' major')
    .replace(/\s+menor\s*$/i, ' minor')
}

function modeFromChord(chord: ReturnType<typeof Chord.get>): KeyMode {
  if (chord.type === 'minor' || chord.quality === 'Minor') return 'minor'
  return 'major'
}

function labelFromChord(chord: ReturnType<typeof Chord.get>): string {
  if (!chord.tonic) return chord.symbol || ''
  return modeFromChord(chord) === 'minor' ? `${chord.tonic}m` : chord.tonic
}

/**
 * Interpreta `{key: …}` vía `Chord.get` (Am, A minor, C, C major, F#m, …).
 */
export function parseKey(raw?: string | null): ParsedKey | null {
  if (!raw?.trim()) return null

  const chord = Chord.get(normalizeKeyInput(raw))
  if (chord.empty || !chord.tonic) return null

  const mode = modeFromChord(chord)
  return {
    tonic: chord.tonic,
    mode,
    label: labelFromChord(chord)
  }
}

export function formatKeyLabel(tonic: string, mode: KeyMode): string {
  return mode === 'minor' ? `${tonic}m` : tonic
}

export function formatKeyDisplay(key: ParsedKey): string {
  return key.mode === 'minor' ? `${key.tonic} menor` : `${key.tonic} mayor`
}

/** Símbolo de acorde que representa la tonalidad para `Chord.transpose`. */
export function keyAsChordSymbol(key: ParsedKey): string {
  return key.mode === 'minor' ? `${key.tonic}m` : key.tonic
}
