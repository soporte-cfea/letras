import { describe, expect, it } from 'vitest'
import {
  tokenizeChordSequence,
  transposeChordSequence,
  semitonesBetweenKeys,
  transposeKeyLabel
} from './transposeSequence'

describe('tokenizeChordSequence', () => {
  it('parte por espacios, comas y pipes', () => {
    expect(tokenizeChordSequence('Am, F | C G')).toEqual([
      'Am',
      'F',
      '|',
      'C',
      'G'
    ])
  })

  it('quita corchetes ChordPro', () => {
    expect(tokenizeChordSequence('[Am] [F] [C]')).toEqual(['Am', 'F', 'C'])
  })
})

describe('transposeChordSequence', () => {
  it('transpone una progresión simple', () => {
    expect(transposeChordSequence('Am F C G', 2)).toBe('Bm G D A')
  })

  it('respeta pipes y offset 0', () => {
    expect(transposeChordSequence('Am | F', 0)).toBe('Am | F')
    expect(transposeChordSequence('Am | F', 1)).toBe('Bbm | Gb')
  })
})

describe('semitonesBetweenKeys', () => {
  it('calcula distancia entre tónicas', () => {
    expect(semitonesBetweenKeys('C', 'G')).toBe(7)
    expect(semitonesBetweenKeys('Am', 'Bm')).toBe(2)
    expect(semitonesBetweenKeys('G', 'C')).toBe(5)
  })

  it('devuelve null si falta alguna', () => {
    expect(semitonesBetweenKeys(null, 'C')).toBeNull()
    expect(semitonesBetweenKeys('C', null)).toBeNull()
  })
})

describe('transposeKeyLabel', () => {
  it('mantiene modo menor', () => {
    expect(transposeKeyLabel('Am', 2)).toBe('Bm')
  })
})
