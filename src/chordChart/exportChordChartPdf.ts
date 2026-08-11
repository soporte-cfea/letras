import { jsPDF } from 'jspdf'
import type { ChordChart } from './types'
import { formatChordChartText } from './formatChordChartText'
import type { AccidentalPreference } from './transpose'

export interface ExportChordChartPdfOptions {
  title?: string
  transposeSemitones?: number
  accidentals?: AccidentalPreference
  /** Nombre de archivo sin extensión */
  fileName?: string
}

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'acordes'
}

function buildPdf(chart: ChordChart, options: ExportChordChartPdfOptions = {}): {
  doc: jsPDF
  fileName: string
  text: string
} {
  const title = options.title?.trim() || 'Acordes'
  const text = formatChordChartText(chart, {
    title,
    transposeSemitones: options.transposeSemitones ?? 0,
    accidentals: options.accidentals
  })

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const marginX = 14
  const marginTop = 14
  const marginBottom = 14
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const maxWidth = pageWidth - marginX * 2
  const lineHeight = 4.2

  // Courier: monoespaciado embebido; alineación acorde/letra fiable
  doc.setFont('courier', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(17, 17, 17)

  const contentLines = text.replace(/\n$/, '').split('\n')
  let y = marginTop
  let isTitle = true

  for (const rawLine of contentLines) {
    const line = rawLine.length ? rawLine : ' '

    if (y + lineHeight > pageHeight - marginBottom) {
      doc.addPage()
      y = marginTop
      doc.setFont('courier', 'normal')
      doc.setFontSize(10)
    }

    // Primera línea = título
    if (isTitle && options.title?.trim()) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      const wrapped = doc.splitTextToSize(line, maxWidth) as string[]
      for (const w of wrapped) {
        if (y + 6 > pageHeight - marginBottom) {
          doc.addPage()
          y = marginTop
        }
        doc.text(w, marginX, y)
        y += 6
      }
      y += 1
      doc.setFont('courier', 'normal')
      doc.setFontSize(10)
      isTitle = false
      continue
    }
    isTitle = false

    // Etiquetas de sección [Coro]
    const isSection = /^\[[^\]]+\]$/.test(line.trim())
    if (isSection) {
      y += 1.5
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(51, 51, 51)
      doc.text(line.trim(), marginX, y)
      y += lineHeight + 0.5
      doc.setFont('courier', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(17, 17, 17)
      continue
    }

    // Líneas largas: no wrap (rompe alineación); reducir tamaño si no cabe
    const textWidth = doc.getTextWidth(line)
    if (textWidth > maxWidth && line.trim().length > 0) {
      const scale = maxWidth / textWidth
      const fontSize = Math.max(6.5, 10 * scale)
      doc.setFontSize(fontSize)
      doc.text(line, marginX, y)
      doc.setFontSize(10)
      y += Math.max(lineHeight * 0.9, fontSize * 0.4)
    } else {
      doc.text(line, marginX, y)
      y += lineHeight
    }
  }

  const base = options.fileName || sanitizeFileName(title)
  return { doc, fileName: `${base}.pdf`, text }
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export type ChordChartExportResult =
  | { method: 'share' }
  | { method: 'download' }
  | { method: 'cancelled' }

/**
 * Genera PDF del chart y lo comparte (móvil) o descarga (desktop).
 */
export async function exportChordChartPdf(
  chart: ChordChart,
  options: ExportChordChartPdfOptions = {}
): Promise<ChordChartExportResult> {
  const { doc, fileName } = buildPdf(chart, options)
  const blob = doc.output('blob')
  const file = new File([blob], fileName, { type: 'application/pdf' })

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })

  if (canShareFiles) {
    try {
      await navigator.share({
        files: [file],
        title: options.title || 'Acordes',
        text: options.title ? `Acordes: ${options.title}` : 'Acordes'
      })
      return { method: 'share' }
    } catch (err) {
      // Usuario canceló el sheet de compartir
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { method: 'cancelled' }
      }
      // Fallback a descarga si share falla por otro motivo
    }
  }

  triggerDownload(blob, fileName)
  return { method: 'download' }
}
