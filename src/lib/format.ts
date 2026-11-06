const pad = (n: number) => String(n).padStart(2, '0')

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${Math.round(min)} 分钟`
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return m === 0 ? `${h} 小时` : `${h} 小时 ${m} 分`
}

export function money(n: number): string {
  return '¥' + Math.round(n).toLocaleString('zh-CN')
}

export function num(n: number): string {
  return Math.round(n).toLocaleString('zh-CN')
}

export function pct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`
}

export function formatFileSize(gb: number): string {
  return gb >= 1024 ? `${(gb / 1024).toFixed(2)} TB` : `${gb.toFixed(1)} GB`
}

export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatFullDateTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function timeOfDay(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function relativeTime(iso?: string): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d === 1) return '昨天'
  if (d < 30) return `${d} 天前`
  return formatDate(iso)
}

export function daysLeft(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

export function formatCountdown(ms: number): string {
  const abs = Math.abs(ms)
  const h = Math.floor(abs / 3600000)
  const m = Math.floor((abs % 3600000) / 60000)
  const s = Math.floor((abs % 60000) / 1000)
  const body = h > 0 ? `${h}h ${pad(m)}m` : `${pad(m)}m ${pad(s)}s`
  return ms < 0 ? `+${body}` : body
}

export function avatarText(name: string): string {
  return name.slice(-2)
}
