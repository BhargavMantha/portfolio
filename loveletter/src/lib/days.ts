export const WEDDING_DAY = '2022-12-18'
export const ANNIVERSARY = '2026-12-18'

/** Whole calendar days between two YYYY-MM-DD dates, independent of time zone. */
export function daysBetween(a: string, b: string): number {
  const utc = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((utc(b) - utc(a)) / 86_400_000)
}
