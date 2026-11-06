import dayjs from 'dayjs'

export const pad = (n: number, len = 2) => String(Math.floor(n)).padStart(len, '0')

/** 秒 -> HH:MM:SS:FF */
export function timecode(sec: number, fps = 25): string {
  const s = Math.max(0, sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = Math.floor(s % 60)
  const f = Math.floor((s % 1) * fps)
  return `${pad(h)}:${pad(m)}:${pad(ss)}:${pad(f)}`
}

/** 秒 -> HH:MM:SS */
export function duration(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return `${pad(h)}:${pad(m)}:${pad(ss)}`
}

/** 秒 -> 1h 24m / 24m 12s */
export function durationCn(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h} 小时 ${m} 分`
  if (m > 0) return `${m} 分 ${s % 60} 秒`
  return `${s} 秒`
}

/** 分钟 -> 00:42:10 */
export function minutesToHms(min: number): string {
  return duration(Math.round(min * 60))
}

export function gb(n: number): string {
  if (n >= 1) return `${n.toFixed(n >= 100 ? 0 : 1)} GB`
  return `${Math.round(n * 1024)} MB`
}

export function dateTime(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}

export function dateOnly(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD')
}

export function timeOnly(iso: string): string {
  return dayjs(iso).format('HH:mm')
}

export function fromNow(iso: string): string {
  const diff = dayjs().diff(dayjs(iso), 'minute')
  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff} 分钟前`
  if (diff < 60 * 24) return `${Math.floor(diff / 60)} 小时前`
  if (diff < 60 * 24 * 30) return `${Math.floor(diff / 60 / 24)} 天前`
  return dayjs(iso).format('YYYY-MM-DD')
}

export function pct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`
}

export function signed(n: number, digits = 1): string {
  const v = n.toFixed(digits)
  return n > 0 ? `+${v}` : v
}

export function lufs(n?: number): string {
  if (n === undefined) return '—'
  return `${n.toFixed(1)} LKFS`
}

export function db(n?: number): string {
  if (n === undefined) return '—'
  return `${n.toFixed(1)} dBTP`
}
