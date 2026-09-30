export type PitchDetection = {
  hz: number
  /** 0…1 — qué tan periódica es la señal (1 = tono limpio) */
  clarity: number
}

const DEFAULT_MIN_HZ = 65
const DEFAULT_MAX_HZ = 1000
/** RMS mínimo: corta ruido de sala / ventiladores */
const DEFAULT_RMS_MIN = 0.025
/**
 * Umbral YIN (más bajo = más permisivo).
 * ~0.1–0.15 es típico en literatura; usamos 0.15 + clarity derivada.
 */
const DEFAULT_YIN_THRESHOLD = 0.15
/** Claridad mínima para aceptar un tono */
const DEFAULT_CLARITY_MIN = 0.85

/**
 * Detección de tono monofónico con YIN
 * (de Cheveigné & Kawahara) — más estable que autocorrelación simple en graves.
 */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  options?: {
    minHz?: number
    maxHz?: number
    rmsMin?: number
    clarityMin?: number
    yinThreshold?: number
  }
): PitchDetection | null {
  const minHz = options?.minHz ?? DEFAULT_MIN_HZ
  const maxHz = options?.maxHz ?? DEFAULT_MAX_HZ
  const rmsMin = options?.rmsMin ?? DEFAULT_RMS_MIN
  const clarityMin = options?.clarityMin ?? DEFAULT_CLARITY_MIN
  const yinThreshold = options?.yinThreshold ?? DEFAULT_YIN_THRESHOLD
  const size = buffer.length
  if (size < 128 || sampleRate <= 0) return null

  let rms = 0
  for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i]
  rms = Math.sqrt(rms / size)
  if (rms < rmsMin) return null

  const tauMin = Math.max(2, Math.floor(sampleRate / maxHz))
  const tauMax = Math.min(Math.floor(size / 2) - 2, Math.floor(sampleRate / minHz))
  if (tauMax <= tauMin) return null

  // 1) Función de diferencia
  const yinBuffer = new Float32Array(tauMax + 1)
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0
    for (let i = 0; i < size - tau; i++) {
      const delta = buffer[i] - buffer[i + tau]
      sum += delta * delta
    }
    yinBuffer[tau] = sum
  }

  // 2) Diferencia normalizada por media acumulada
  yinBuffer[0] = 1
  let runningSum = 0
  for (let tau = 1; tau <= tauMax; tau++) {
    runningSum += yinBuffer[tau]
    yinBuffer[tau] = runningSum > 0 ? (yinBuffer[tau] * tau) / runningSum : 1
  }

  // 3) Primer mínimo bajo el umbral (con búsqueda local)
  let tauEstimate = -1
  for (let tau = tauMin; tau < tauMax; tau++) {
    if (yinBuffer[tau] < yinThreshold) {
      while (tau + 1 < tauMax && yinBuffer[tau + 1] < yinBuffer[tau]) tau++
      tauEstimate = tau
      break
    }
  }

  // Fallback: mínimo global en el rango si no cruzó umbral
  if (tauEstimate < 0) {
    let bestTau = tauMin
    let bestVal = yinBuffer[tauMin]
    for (let tau = tauMin + 1; tau <= tauMax; tau++) {
      if (yinBuffer[tau] < bestVal) {
        bestVal = yinBuffer[tau]
        bestTau = tau
      }
    }
    if (bestVal < 0.35) tauEstimate = bestTau
  }

  if (tauEstimate < tauMin) return null

  // 4) Interpolación parabólica
  const x0 = tauEstimate < 1 ? tauEstimate : tauEstimate - 1
  const x2 = tauEstimate + 1 < yinBuffer.length ? tauEstimate + 1 : tauEstimate
  let betterTau = tauEstimate
  if (x0 !== tauEstimate && x2 !== tauEstimate) {
    const s0 = yinBuffer[x0]
    const s1 = yinBuffer[tauEstimate]
    const s2 = yinBuffer[x2]
    const denom = 2 * (2 * s1 - s2 - s0)
    if (denom !== 0) betterTau = tauEstimate + (s2 - s0) / denom
  }

  const hz = sampleRate / betterTau
  if (!Number.isFinite(hz) || hz < minHz || hz > maxHz) return null

  const yinAt = yinBuffer[tauEstimate] ?? 1
  const clarity = Math.max(0, Math.min(1, 1 - yinAt))
  if (clarity < clarityMin) return null

  return { hz, clarity }
}

/** Compat: Hz o -1 si no hay tono claro. */
export function detectPitchHz(
  buffer: Float32Array,
  sampleRate: number,
  options?: {
    minHz?: number
    maxHz?: number
    rmsMin?: number
    clarityMin?: number
    yinThreshold?: number
  }
): number {
  return detectPitch(buffer, sampleRate, options)?.hz ?? -1
}
