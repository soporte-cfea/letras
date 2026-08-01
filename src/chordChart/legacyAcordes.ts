/**
 * TipTap «Acordes» queda solo como rollback.
 * Activar: `?legacyAcordes=1` en la URL del detalle de canción.
 */
export const LEGACY_ACORDES_QUERY = 'legacyAcordes'

export function isLegacyAcordesRollback(query: Record<string, unknown> | undefined | null): boolean {
  const v = query?.[LEGACY_ACORDES_QUERY]
  return v === '1' || v === 'true'
}
