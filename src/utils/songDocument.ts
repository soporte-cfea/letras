/** Indica si un cuerpo HTML/texto de documento tiene contenido significativo. */
export function docBodyHasMeaningfulText(body: string): boolean {
  if (!body) return false
  return body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().length > 0
}

/** Detecta si el contenido parece HTML enriquecido (no texto plano legado). */
export function isHtmlContent(text: string): boolean {
  if (!text) return false
  return /<\/?[a-z][^>]*>/i.test(text)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function hasRichFormatting(html: string): boolean {
  return /<(strong|em|u|s|h[1-6]|ul|ol|table|img|mark|blockquote)\b/i.test(html)
}

/**
 * Convierte texto plano a HTML con saltos normales: cada `\n` → `<br>`.
 * Todo el contenido va en un solo `<p>`, como si se hubiera escrito con HTML a mano.
 */
export function plainTextToHtml(text: string): string {
  if (!text) return ''

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (!normalized.trim()) return ''

  return `<p>${escapeHtml(normalized).replace(/\n/g, '<br>')}</p>`
}

/**
 * Normaliza documentos simples (letra, acordes, análisis sin formato rico).
 * Texto plano → un `<p>` con `<br>`. HTML legado multi-`<p>` → mismo modelo.
 */
export function normalizeDocumentContent(content: string): string {
  if (!content) return ''
  if (!isHtmlContent(content)) {
    return plainTextToHtml(content)
  }
  if (hasRichFormatting(content)) {
    return content.replace(/<br\s*\/?>/gi, '<br>')
  }
  return plainTextToHtml(htmlToPlainText(content))
}

/** Prepara contenido antes de guardar (solo acordes necesitan espacios extra). */
export function prepareDocumentForSave(content: string, options?: { chords?: boolean }): string {
  const normalized = content.replace(/<br\s*\/?>/gi, '<br>')
  if (options?.chords) {
    return preserveChordsSpaces(normalized)
  }
  return normalized
}

/** Convierte HTML en texto plano (copiar, karaoke, formularios). */
export function htmlToPlainText(html: string): string {
  if (!html) return ''
  if (!isHtmlContent(html)) return html

  return html
    .replace(/<\s*\/p\s*>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\s*\/div\s*>/gi, '\n\n')
    .replace(/<\s*\/h[1-6]\s*>/gi, '\n\n')
    .replace(/<\s*li\s*>/gi, '- ')
    .replace(/<\s*\/li\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

/** Extrae versos separados por párrafos en blanco a partir de contenido HTML o plano. */
export function extractVersesFromContent(content: string): string[] {
  const plain = htmlToPlainText(content)
  if (!plain.trim()) return []

  return plain
    .split(/\n\s*\n/)
    .filter(verse => verse.trim().length > 0)
    .map(verse => verse.trim())
}

/**
 * Preserva espacios múltiples en acordes convirtiéndolos a &nbsp;
 * para mantener la alineación en HTML.
 */
export function preserveChordsSpaces(html: string): string {
  if (!html) return html

  return html.replace(/(>)([^<]*?)(<)/g, (match, before, content, after) => {
    if (content.trim().length === 0) return match

    const segments = content.split('&nbsp;')
    const processedSegments = segments.map((segment: string, index: number) => {
      const processed = segment.replace(/ {2,}/g, (spaces: string) => {
        return '&nbsp;'.repeat(spaces.length - 1) + ' '
      })
      return processed + (index < segments.length - 1 ? '&nbsp;' : '')
    })

    return before + processedSegments.join('') + after
  })
}
