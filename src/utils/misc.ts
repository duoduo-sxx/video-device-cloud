export function cn(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(' ')
}

let seed = 20261019

export function setSeed(s: number) {
  seed = s
}

function rnd() {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

export function rand() {
  return rnd()
}

export function randInt(min: number, max: number) {
  return Math.floor(rnd() * (max - min + 1)) + min
}

export function randFloat(min: number, max: number, digits = 1) {
  const v = rnd() * (max - min) + min
  return Number(v.toFixed(digits))
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)]
}

export function pickMany<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0])
  }
  return out
}

export function chance(p: number) {
  return rnd() < p
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export function pad(n: number, len = 4) {
  return String(n).padStart(len, '0')
}

export function genSeries(base: number, points: number, amp: number, drift = 0): number[] {
  const out: number[] = []
  let v = base
  for (let i = 0; i < points; i++) {
    v = v + (rnd() - 0.5) * amp + drift
    out.push(Number(v.toFixed(1)))
  }
  return out
}

export function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ]
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function avatarText(name: string) {
  return name.slice(-2)
}

export function hexAlpha(hex: string, alpha: number) {
  if (!hex.startsWith('#')) return hex
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export * from './format'
