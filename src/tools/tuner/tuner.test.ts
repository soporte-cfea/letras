import { describe, expect, it } from 'vitest'
import {
  readingFromFrequency,
  formatNoteLabel,
  isInTune,
  centsFromMidi,
  readingForMidi,
  nearestGuitarString,
  foldHzToTarget,
  headstockPegs,
  GUITAR_DROP_D_STRINGS,
  GUITAR_STANDARD_STRINGS
} from './noteFromFrequency'
import { detectPitchHz } from './detectPitch'

describe('readingFromFrequency', () => {
  it('reconoce A4 a 440 Hz', () => {
    const r = readingFromFrequency(440, 440)
    expect(r).not.toBeNull()
    expect(formatNoteLabel(r!)).toBe('A4')
    expect(Math.abs(r!.cents)).toBeLessThanOrEqual(1)
  })

  it('detecta cents positivos (agudo)', () => {
    const sharp = 440 * Math.pow(2, 30 / 1200)
    const r = readingFromFrequency(sharp, 440)
    expect(r!.noteName).toBe('A')
    expect(r!.octave).toBe(4)
    expect(r!.cents).toBeGreaterThan(20)
    expect(r!.cents).toBeLessThan(40)
  })

  it('devuelve null con frecuencia inválida', () => {
    expect(readingFromFrequency(0)).toBeNull()
    expect(readingFromFrequency(-1)).toBeNull()
  })
})

describe('isInTune / nota bloqueada', () => {
  it('considera afinado un rango (±8), no un punto', () => {
    expect(isInTune(0)).toBe(true)
    expect(isInTune(7)).toBe(true)
    expect(isInTune(8)).toBe(true)
    expect(isInTune(9)).toBe(false)
    expect(isInTune(-8)).toBe(true)
  })

  it('mantiene cents respecto al MIDI bloqueado', () => {
    const sharp = 440 * Math.pow(2, 40 / 1200)
    expect(centsFromMidi(sharp, 69, 440)).toBeGreaterThan(35)
    const r = readingForMidi(sharp, 69, 440)
    expect(r.noteName).toBe('A')
    expect(r.cents).toBeGreaterThan(35)
  })
})

describe('detectPitchHz (YIN)', () => {
  it('estima la frecuencia de una senoide', () => {
    const sampleRate = 44100
    const freq = 220 // A3
    const buf = new Float32Array(4096)
    for (let i = 0; i < buf.length; i++) {
      buf[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate) * 0.5
    }
    const detected = detectPitchHz(buf, sampleRate)
    expect(detected).toBeGreaterThan(0)
    expect(Math.abs(detected - freq)).toBeLessThan(3)
  })

  it('estima E2 grave con razonable precisión', () => {
    const sampleRate = 44100
    const freq = 82.41
    const buf = new Float32Array(8192)
    for (let i = 0; i < buf.length; i++) {
      buf[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate) * 0.55
    }
    const detected = detectPitchHz(buf, sampleRate, { minHz: 65, maxHz: 1000 })
    expect(detected).toBeGreaterThan(0)
    expect(Math.abs(detected - freq)).toBeLessThan(2)
  })

  it('devuelve -1 en silencio', () => {
    const buf = new Float32Array(2048)
    expect(detectPitchHz(buf, 44100)).toBe(-1)
  })

  it('rechaza ruido débil (RMS bajo)', () => {
    const sampleRate = 44100
    const buf = new Float32Array(4096)
    for (let i = 0; i < buf.length; i++) {
      buf[i] = (Math.random() * 2 - 1) * 0.008
    }
    expect(detectPitchHz(buf, sampleRate)).toBe(-1)
  })
})

describe('foldHzToTarget', () => {
  it('pliega un armónico a la octava de la cuerda', () => {
    const e2 = 82.41
    expect(Math.abs(foldHzToTarget(e2 * 2, e2) - e2)).toBeLessThan(0.5)
    expect(Math.abs(foldHzToTarget(e2 * 4, e2) - e2)).toBeLessThan(0.5)
  })
})

describe('nearestGuitarString', () => {
  it('elige A2 cerca de 110 Hz', () => {
    const n = nearestGuitarString(110, 440)
    expect(n?.id).toBe('A2')
    expect(Math.abs(n!.cents)).toBeLessThan(5)
  })

  it('elige la 1ª (E4) y no una nota cromática rara', () => {
    const n = nearestGuitarString(329.63, 440)
    expect(n?.id).toBe('E4')
  })

  it('con armónico de E2 sigue en E2', () => {
    const e2 = 440 * Math.pow(2, (40 - 69) / 12)
    const n = nearestGuitarString(e2 * 2, 440)
    expect(n?.id).toBe('E2')
  })

  it('en Drop D reconoce D2', () => {
    const d2 = 440 * Math.pow(2, (38 - 69) / 12)
    const n = nearestGuitarString(d2, 440, GUITAR_DROP_D_STRINGS)
    expect(n?.id).toBe('D2')
  })
})

describe('headstockPegs', () => {
  it('reparte 3+3 graves/agudas', () => {
    const { left, right } = headstockPegs(GUITAR_STANDARD_STRINGS)
    expect(left.map((s) => s.id)).toEqual(['D3', 'A2', 'E2'])
    expect(right.map((s) => s.id)).toEqual(['G3', 'B3', 'E4'])
  })
})
