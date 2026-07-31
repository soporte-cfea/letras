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
 * Normaliza documentos simples (letra / análisis) para compatibilidad con texto plano legado.
 * Texto plano → un `<p>` con `<br>`. HTML legado multi-`<p>` → mismo modelo.
 * Los acordes no usan esta ruta: se cargan y guardan el HTML de TipTap tal cual.
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

