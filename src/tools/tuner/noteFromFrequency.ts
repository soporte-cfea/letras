const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export type TunerReading = {
  frequency: number
  noteName: string
  octave: number
  /** Cents respecto a la nota objetivo */
  cents: number
  midi: number
}

export type GuitarStringDef = {
  id: string
  name: string
  label: string
  midi: number
}

export type GuitarTuningId = 'standard' | 'dropD'

export type GuitarTuning = {
  id: GuitarTuningId
  label: string
  strings: readonly GuitarStringDef[]
}

/**
 * Convierte frecuencia (Hz) a nota + cents, con A4 configurable (por defecto 440).
 */
export function readingFromFrequency(
  frequency: number,
  a4Hz = 440
): TunerReading | null {
  if (!Number.isFinite(frequency) || frequency <= 0 || a4Hz <= 0) return null

  const midiFloat = 69 + 12 * Math.log2(frequency / a4Hz)
  if (!Number.isFinite(midiFloat)) return null

  const midi = Math.round(midiFloat)
  const cents = Math.round((midiFloat - midi) * 100)
  const noteIndex = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1

  return {
    frequency,
    noteName: NOTE_NAMES[noteIndex],
    octave,
    cents,
    midi
  }
}

export function formatNoteLabel(reading: TunerReading): string {
  return `${reading.noteName}${reading.octave}`
}

/** Zona “afinada” estilo apps de ensayo (± cents). */
export const IN_TUNE_CENTS = 8

export function isInTune(cents: number, tolerance = IN_TUNE_CENTS): boolean {
  return Math.abs(cents) <= tolerance
}

/** Cents de una frecuencia respecto a un MIDI concreto (nota bloqueada). */
export function centsFromMidi(frequency: number, midi: number, a4Hz = 440): number {
  const targetHz = a4Hz * Math.pow(2, (midi - 69) / 12)
  return Math.round(1200 * Math.log2(frequency / targetHz))
}

export function readingForMidi(
  frequency: number,
  midi: number,
  a4Hz = 440
): TunerReading {
  const noteIndex = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  return {
    frequency,
    noteName: NOTE_NAMES[noteIndex],
    octave,
    cents: centsFromMidi(frequency, midi, a4Hz),
    midi
  }
}

/** Cuerdas guitarra estándar (6ª → 1ª). */
export const GUITAR_STANDARD_STRINGS: readonly GuitarStringDef[] = [
  { id: 'E2', name: 'E', label: '6ª · E', midi: 40 },
  { id: 'A2', name: 'A', label: '5ª · A', midi: 45 },
  { id: 'D3', name: 'D', label: '4ª · D', midi: 50 },
  { id: 'G3', name: 'G', label: '3ª · G', midi: 55 },
  { id: 'B3', name: 'B', label: '2ª · B', midi: 59 },
  { id: 'E4', name: 'e', label: '1ª · e', midi: 64 }
] as const

/** Drop D: 6ª baja a D2. */
export const GUITAR_DROP_D_STRINGS: readonly GuitarStringDef[] = [
  { id: 'D2', name: 'D', label: '6ª · D', midi: 38 },
  { id: 'A2', name: 'A', label: '5ª · A', midi: 45 },
  { id: 'D3', name: 'D', label: '4ª · D', midi: 50 },
  { id: 'G3', name: 'G', label: '3ª · G', midi: 55 },
  { id: 'B3', name: 'B', label: '2ª · B', midi: 59 },
  { id: 'E4', name: 'e', label: '1ª · e', midi: 64 }
] as const

export const GUITAR_TUNINGS: Record<GuitarTuningId, GuitarTuning> = {
  standard: {
    id: 'standard',
    label: 'Estándar',
    strings: GUITAR_STANDARD_STRINGS
  },
  dropD: {
    id: 'dropD',
    label: 'Drop D',
    strings: GUITAR_DROP_D_STRINGS
  }
}

/** @deprecated prefer GUITAR_TUNINGS — alias de compat */
export type GuitarStringId = string

/** Frecuencias de referencia guitarra estándar (E2 A2 D3 G3 B3 E4) a A4 dado. */
export function guitarStandardFrequencies(a4Hz = 440): { name: string; hz: number; midi: number }[] {
  return GUITAR_STANDARD_STRINGS.map((s) => ({
    name: s.id,
    midi: s.midi,
    hz: a4Hz * Math.pow(2, (s.midi - 69) / 12)
  }))
}

/**
 * Pliega la frecuencia detectada a la octava de la nota objetivo
 * (los micrófonos a menudo captan el armónico, no el fundamental).
 */
export function foldHzToTarget(hz: number, targetHz: number): number {
  if (hz <= 0 || targetHz <= 0) return hz
  let f = hz
  const upper = targetHz * Math.SQRT2
  const lower = targetHz / Math.SQRT2
  while (f > upper) f /= 2
  while (f < lower) f *= 2
  return f
}

export type NearestGuitarString = {
  id: string
  midi: number
  name: string
  targetHz: number
  foldedHz: number
  cents: number
}

/** Cuerda más cercana dentro del set de afinación (fundamental o armónicos bajos). */
export function nearestGuitarString(
  hz: number,
  a4Hz = 440,
  strings: readonly GuitarStringDef[] = GUITAR_STANDARD_STRINGS
): NearestGuitarString | null {
  if (!Number.isFinite(hz) || hz <= 0 || a4Hz <= 0 || strings.length === 0) return null

  let best: NearestGuitarString | null = null
  let bestAbsCents = Infinity
  let bestHarmonic = Infinity

  for (const s of strings) {
    const targetHz = a4Hz * Math.pow(2, (s.midi - 69) / 12)
    for (let harm = 1; harm <= 4; harm++) {
      const centsToHarm = 1200 * Math.log2(hz / (targetHz * harm))
      const abs = Math.abs(centsToHarm)
      const better =
        abs < bestAbsCents - 0.05 ||
        (Math.abs(abs - bestAbsCents) <= 0.05 && harm < bestHarmonic)
      if (!better) continue

      bestAbsCents = abs
      bestHarmonic = harm
      const foldedHz = foldHzToTarget(hz, targetHz)
      best = {
        id: s.id,
        midi: s.midi,
        name: s.name,
        targetHz,
        foldedHz,
        cents: 1200 * Math.log2(foldedHz / targetHz)
      }
    }
  }

  return best
}

/**
 * Distribución pala 3+3 (arriba → abajo).
 * Izq = graves (4ª,5ª,6ª), der = agudas (3ª,2ª,1ª).
 */
export function headstockPegs(strings: readonly GuitarStringDef[]): {
  left: GuitarStringDef[]
  right: GuitarStringDef[]
} {
  // strings vienen 6ª→1ª
  const s6 = strings[0]
  const s5 = strings[1]
  const s4 = strings[2]
  const s3 = strings[3]
  const s2 = strings[4]
  const s1 = strings[5]
  return {
    left: [s4, s5, s6],
    right: [s3, s2, s1]
  }
}
