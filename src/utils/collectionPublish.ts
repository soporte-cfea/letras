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
