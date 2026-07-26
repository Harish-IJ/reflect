// Date helpers work on plain 'YYYY-MM-DD' strings to stay in the same calendar
// frame the server uses (its as_of), avoiding browser-timezone drift.

export function parseYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function formatYMD(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** The last `n` days ending at (and including) `asOf`, oldest first. */
export function lastNDays(asOf: string, n: number): string[] {
  const end = parseYMD(asOf)
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setUTCDate(d.getUTCDate() - i)
    out.push(formatYMD(d))
  }
  return out
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function weekdayShort(ymd: string): string {
  return WEEKDAYS[parseYMD(ymd).getUTCDay()]
}

export function dayOfMonth(ymd: string): number {
  return parseYMD(ymd).getUTCDate()
}

/** Days between two 'YYYY-MM-DD' dates (b - a), positive when b is later. */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseYMD(b).getTime() - parseYMD(a).getTime()) / 86_400_000)
}
