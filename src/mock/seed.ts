export function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const rand = mulberry32(20261019)

export const rnd = () => rand()

export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]

export const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))

export const float = (min: number, max: number, digits = 1) => {
  const v = min + rand() * (max - min)
  const p = Math.pow(10, digits)
  return Math.round(v * p) / p
}

export const chance = (p: number) => rand() < p

export const NOW = new Date('2026-10-19T10:20:00+08:00')

export const iso = (d: Date) => d.toISOString()

export const addMinutes = (base: string | Date, minutes: number) =>
  iso(new Date(new Date(base).getTime() + minutes * 60000))

export const addDays = (base: string | Date, days: number) =>
  iso(new Date(new Date(base).getTime() + days * 86400000))

export const at = (daysAgo: number, hour = 9, minute = 0) => {
  const d = new Date(NOW)
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return iso(d)
}
