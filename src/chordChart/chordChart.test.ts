import { describe, expect, it } from 'vitest'
import {
  A_EL_ALTO_Y_SUBLIME_CHORDPRO,
  formatChordChartText,
  parseChordPro,
  serializeChordPro,
  transposeChart,
  transposeChordSymbol,
  transposeKeyDirective
} from './index'

describe('parseChordPro', () => {
  it('parsea el sample completo con key y secciones', () => {
    const chart = parseChordPro(A_EL_ALTO_Y_SUBLIME_CHORDPRO)

    expect(chart.meta.key).toBe('B')
    expect(chart.sections.length).toBeGreaterThan(5)

    const kinds = chart.sections.map((s) => s.kind)
    expect(kinds).toContain('intro')
    expect(kinds).toContain('verse')
    expect(kinds).toContain('prechorus')
    expect(kinds).toContain('chorus')
    expect(kinds).toContain('comment')

    const chorus = chart.sections.find((s) => s.kind === 'chorus')
    expect(chorus?.lines.length).toBeGreaterThan(0)
    expect(
      chorus?.lines.some((line) =>
        line.segments.some((seg) => seg.type === 'chord' && seg.name === 'B')
      )
    ).toBe(true)
  })

  it('parsea slash chords y extensiones en la intro', () => {
    const chart = parseChordPro(A_EL_ALTO_Y_SUBLIME_CHORDPRO)
    const intro = chart.sections.find((s) => s.kind === 'intro')
    const chordNames =
      intro?.lines.flatMap((line) =>
        line.segments
          .filter((seg): seg is { type: 'chord'; name: string } => seg.type === 'chord')
          .map((seg) => seg.name)
      ) ?? []

    expect(chordNames).toContain('F#/A#')
    expect(chordNames).toContain('F#sus4')
  })

  it('round-trip básico: serialize → parse conserva key y acordes', () => {
    const original = parseChordPro(A_EL_ALTO_Y_SUBLIME_CHORDPRO)
    const roundTripped = parseChordPro(serializeChordPro(original))

    expect(roundTripped.meta.key).toBe(original.meta.key)

    const origChords = original.sections
      .flatMap((s) => s.lines)
      .flatMap((l) => l.segments)
      .filter((s) => s.type === 'chord')
      .map((s) => (s.type === 'chord' ? s.name : ''))

    const nextChords = roundTripped.sections
      .flatMap((s) => s.lines)
      .flatMap((l) => l.segments)
      .filter((s) => s.type === 'chord')
      .map((s) => (s.type === 'chord' ? s.name : ''))

    expect(nextChords).toEqual(origChords)
  })
})

describe('transpose', () => {
  it('transpone símbolos simples y slash chords', () => {
    expect(transposeChordSymbol('B', 1)).toBe('C')
    expect(transposeChordSymbol('F#/A#', 1)).toMatch(/^G\/B$|^G\/B/)
  })

  it('transpone la key del sample +1 y vuelve al original con −1', () => {
    const chart = parseChordPro(A_EL_ALTO_Y_SUBLIME_CHORDPRO)
    const up = transposeChart(chart, 1)
    expect(up.meta.key).toBe('C')

    const firstChord = up.sections
      .flatMap((s) => s.lines)
      .flatMap((l) => l.segments)
      .find((s) => s.type === 'chord')
    expect(firstChord && firstChord.type === 'chord' ? firstChord.name : null).toBe('C')

    const back = transposeChart(up, -1)
    expect(back.meta.key).toBe('B')
  })

  it('transposeKeyDirective preserva modo menor', () => {
    expect(transposeKeyDirective('Am', 2)).toBe('Bm')
    expect(transposeKeyDirective('B', 0)).toBe('B')
  })

  it('persistir transpose: serialize del chart transpuesto deja offset 0 equivalente', () => {
    const chart = parseChordPro(A_EL_ALTO_Y_SUBLIME_CHORDPRO)
    const baked = parseChordPro(serializeChordPro(transposeChart(chart, 2)))
    expect(baked.meta.key).toBe('C#')
    expect(transposeChart(baked, 0).meta.key).toBe('C#')
  })

  it('aplica preferencia de bemoles/sostenidos', () => {
    expect(transposeChordSymbol('F#', 0, { accidentals: 'flat' })).toBe('Gb')
    expect(transposeChordSymbol('Gb', 0, { accidentals: 'sharp' })).toBe('F#')
    expect(transposeChordSymbol('F#/A#', 0, { accidentals: 'flat' })).toBe('Gb/Bb')
    const chart = parseChordPro('{key: F#}\n[F#]Hey')
    expect(transposeChart(chart, 0, { accidentals: 'flat' }).meta.key).toBe('Gb')
  })
})

describe('formatChordChartText', () => {
  it('alinea acorde encima de letra', () => {
    const chart = parseChordPro('[Am]Hola [G]mundo')
    const text = formatChordChartText(chart)
    const lines = text.trim().split('\n')
    expect(lines[0]).toMatch(/^Am\s+G/)
    expect(lines[1]).toMatch(/^Hola\s+mundo/)
  })

  it('incluye título, tonalidad y sección del sample', () => {
    const chart = parseChordPro(A_EL_ALTO_Y_SUBLIME_CHORDPRO)
    const text = formatChordChartText(chart, {
      title: 'A el alto y sublime',
      transposeSemitones: 0
    })
    expect(text).toContain('A el alto y sublime')
    expect(text).toContain('Tonalidad: B')
    expect(text).toMatch(/\[(Intro|Verso|Coro|Precoro)/)
  })

  it('respeta transposición en el texto exportado', () => {
    const chart = parseChordPro(A_EL_ALTO_Y_SUBLIME_CHORDPRO)
    const text = formatChordChartText(chart, { transposeSemitones: 1 })
    expect(text).toContain('Tonalidad: C (+1)')
  })
})

describe('semitonesBetweenKeys', () => {
  it('calcula el camino corto entre tónicas', async () => {
    const { semitonesBetweenKeys } = await import('./index')
    expect(semitonesBetweenKeys('C', 'G')).toBe(-5) // o +7 → camino corto -5
    expect(semitonesBetweenKeys('C', 'D')).toBe(2)
    expect(semitonesBetweenKeys('Am', 'C')).toBe(3)
    expect(semitonesBetweenKeys('B', 'C')).toBe(1)
    expect(semitonesBetweenKeys(null, 'C')).toBeNull()
    expect(semitonesBetweenKeys('C', 'C')).toBe(0)
  })
})
