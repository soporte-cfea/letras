// Función auxiliar para normalizar tags
export function normalizeTags(tags: any): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'object' && tags !== null) {
    return Object.values(tags).filter((tag: any) => typeof tag === 'string') as string[];
  }
  return [];
}
