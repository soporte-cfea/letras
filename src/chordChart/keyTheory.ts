import { Chord, Note } from 'tonal'

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

/**
 * Semitonos (camino corto, −6…+6) entre dos tonalidades por tónica.
 * Ignora mayor/menor: solo mueve la tónica. Null si alguna no se puede parsear.
 */
export function semitonesBetweenKeys(
  fromRaw?: string | null,
  toRaw?: string | null
): number | null {
  const from = parseKey(fromRaw)
  const to = parseKey(toRaw)
  if (!from || !to) return null

  const fromChroma = Note.chroma(from.tonic)
  const toChroma = Note.chroma(to.tonic)
  if (fromChroma == null || toChroma == null) return null

  let delta = toChroma - fromChroma
  if (delta > 6) delta -= 12
  if (delta < -6) delta += 12
  return delta
}
