import type { Collection } from '@/types/songTypes'

/** Lista visible para todo el mundo: tiene fecha de publicación y esa fecha ya llegó. */
export function isCollectionPublished(
  collection: Pick<Collection, 'published_at'>,
  at: Date = new Date()
): boolean {
  // Caché anterior a published_at: no ocultar listas que ya se veían.
  if (collection.published_at === undefined) return true
  if (collection.published_at === null || collection.published_at === '') return false
  const published = new Date(collection.published_at).getTime()
  if (Number.isNaN(published)) return false
  return published <= at.getTime()
}

export function isCollectionDraft(
  collection: Pick<Collection, 'published_at'>,
  at?: Date
): boolean {
  return !isCollectionPublished(collection, at)
}

export function filterVisibleCollections<T extends Pick<Collection, 'published_at'>>(
  collections: T[],
  canManageLists: boolean,
  at?: Date
): T[] {
  if (canManageLists) return collections
  return collections.filter((c) => isCollectionPublished(c, at))
}

export type DraftUrgency = 'normal' | 'soon' | 'today'

const WEEKDAY_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const

function parseEventDateLocal(dateString: string): Date | null {
  const parts = dateString.split('-')
  if (parts.length !== 3) return null
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null
  return new Date(year, month, day)
}

/** Qué tan pronto es el evento de una lista en borrador (para tono visual, sin alarmas). */
export function getDraftUrgency(
  collection: Pick<Collection, 'published_at' | 'event_date'>,
  at: Date = new Date()
): DraftUrgency {
  if (!isCollectionDraft(collection, at)) return 'normal'
  if (!collection.event_date) return 'normal'

  const eventDate = parseEventDateLocal(collection.event_date)
  if (!eventDate) return 'normal'

  const today = new Date(at)
  today.setHours(0, 0, 0, 0)
  eventDate.setHours(0, 0, 0, 0)

  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / 86_400_000)
  if (diffDays <= 0) return 'today'
  if (diffDays <= 2) return 'soon'
  return 'normal'
}

/** Mensaje neutro para la barra de estado de borrador. */
export function getDraftStatusMessage(
  collection: Pick<Collection, 'published_at' | 'event_date' | 'category'>,
  at: Date = new Date()
): string {
  const urgency = getDraftUrgency(collection, at)
  if (urgency === 'today') {
    return 'Hoy — aún no visible para todos'
  }
  if (urgency === 'soon' && collection.event_date) {
    const eventDate = parseEventDateLocal(collection.event_date)
    if (eventDate) {
      const dayName = WEEKDAY_ES[eventDate.getDay()]
      const label = dayName.charAt(0).toUpperCase() + dayName.slice(1)
      return `${label} — aún no visible para todos`
    }
  }
  return 'Solo visible para el equipo'
}

/** Etiqueta compacta en tarjetas: «Hoy» cuando el evento es hoy, si no «Borrador». */
export function getDraftBadgeLabel(
  collection: Pick<Collection, 'published_at' | 'event_date'>,
  at: Date = new Date()
): string {
  if (getDraftUrgency(collection, at) === 'today') return 'Hoy'
  return 'Borrador'
}
