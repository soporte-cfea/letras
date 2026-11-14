export type DateRangeValue = [string, string] | null

export type TimePresetId =
  | 'next-7'
  | 'next-30'
  | 'this-month'
  | 'this-year'
  | 'last-year'
  | 'all'
  | 'custom'

export interface TimePresetOption {
  id: TimePresetId
  label: string
}

/** Orden estándar: corto → largo → calendario → pasado → clear → custom. */
export const TIME_PRESET_OPTIONS: TimePresetOption[] = [
  { id: 'next-7', label: 'Próximos 7 días' },
  { id: 'next-30', label: 'Próximos 30 días' },
  { id: 'this-month', label: 'Este mes' },
  { id: 'this-year', label: 'Este año' },
  { id: 'last-year', label: 'Año pasado' },
  { id: 'all', label: 'Sin filtro de fecha' },
  { id: 'custom', label: 'Rango personalizado' },
]

/** YYYY-MM-DD en hora local (sin desfase UTC). */
export function toLocalDateString(date: Date): string {
  const anio = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
  return d
}

export function startOfToday(): Date {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return hoy
}

/** Hoy → hoy + N días. */
export function getUpcomingDaysRange(days: number): [string, string] {
  const hoy = startOfToday()
  return [toLocalDateString(hoy), toLocalDateString(addDays(hoy, days))]
}

/** Rango por defecto: próximos 30 días. */
export function getDefaultUpcomingDateRange(): [string, string] {
  return getUpcomingDaysRange(30)
}

export function getThisMonthRange(): [string, string] {
  const hoy = startOfToday()
  const start = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const end = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  return [toLocalDateString(start), toLocalDateString(end)]
}

export function getThisYearRange(): [string, string] {
  const year = startOfToday().getFullYear()
  return [
    toLocalDateString(new Date(year, 0, 1)),
    toLocalDateString(new Date(year, 11, 31)),
  ]
}

export function getLastYearRange(): [string, string] {
  const year = startOfToday().getFullYear() - 1
  return [
    toLocalDateString(new Date(year, 0, 1)),
    toLocalDateString(new Date(year, 11, 31)),
  ]
}

export function getRangeForPreset(
  id: Exclude<TimePresetId, 'custom'>
): DateRangeValue {
  switch (id) {
    case 'next-7':
      return getUpcomingDaysRange(7)
    case 'next-30':
      return getUpcomingDaysRange(30)
    case 'this-month':
      return getThisMonthRange()
    case 'this-year':
      return getThisYearRange()
    case 'last-year':
      return getLastYearRange()
    case 'all':
      return null
  }
}

export function formatRangeLabel(range: DateRangeValue): string {
  if (!range) return 'Sin filtro de fecha'
  const [start, end] = range
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y.slice(2)}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

export function getPresetLabel(id: TimePresetId, range: DateRangeValue): string {
  if (id === 'custom') return formatRangeLabel(range)
  return TIME_PRESET_OPTIONS.find((o) => o.id === id)?.label ?? 'Tiempo'
}

/** Diferencia en días civiles: event - hoy (negativo = pasado). */
export function daysFromToday(isoDate: string): number | null {
  const parts = isoDate.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null
  const [y, m, d] = parts
  const event = new Date(y, m - 1, d)
  const hoy = startOfToday()
  return Math.round((event.getTime() - hoy.getTime()) / 86400000)
}

/**
 * Etiqueta relativa para eventos próximos:
 * hoy | mañana | n días. Pasado → null.
 */
export function getRelativeUpcomingLabel(isoDate: string): string | null {
  const days = daysFromToday(isoDate)
  if (days === null || days < 0) return null
  if (days === 0) return 'hoy'
  if (days === 1) return 'mañana'
  return `${days} días`
}
