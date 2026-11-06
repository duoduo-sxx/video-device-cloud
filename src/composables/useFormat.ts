import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  return `${m}:${String(ss).padStart(2, '0')}`
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export function formatTimecode(sec: number, fps = 25): string {
  const total = Math.max(0, sec)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = Math.floor(total % 60)
  const f = Math.floor((total % 1) * fps)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(h)}:${p(m)}:${p(s)}:${p(f)}`
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const val = bytes / Math.pow(1024, i)
  return `${val.toFixed(i >= 3 ? 2 : 1)} ${units[i]}`
}

export function formatGB(gb: number): string {
  if (gb >= 1024) return `${(gb / 1024).toFixed(2)} TB`
  return `${gb.toFixed(2)} GB`
}

export function formatBitrate(kbps: number): string {
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(kbps >= 10000 ? 0 : 1)} Mbps`
  return `${Math.round(kbps)} kbps`
}

export function formatDateTime(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}

export function formatDate(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD')
}

export function formatTime(iso: string): string {
  return dayjs(iso).format('HH:mm')
}

export function fromNow(iso: string): string {
  return dayjs(iso).fromNow()
}

export function resolutionLabel(w: number, h: number): string {
  const long = Math.max(w, h)
  if (long >= 7680) return '8K'
  if (long >= 3840) return '4K'
  if (long >= 2560) return '2K'
  if (long >= 1920) return '1080p'
  if (long >= 1280) return '720p'
  if (long >= 720) return '576p'
  return '480p'
}

export function aspectLabel(w: number, h: number): string {
  const g = (a: number, b: number): number => (b === 0 ? a : g(b, a % b))
  const d = g(w, h)
  return `${w / d}:${h / d}`
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'var(--success)'
  if (score >= 60) return 'var(--warning)'
  return 'var(--danger)'
}

export function gainText(v: number, digits = 1): string {
  const s = v > 0 ? `+${v.toFixed(digits)}` : v.toFixed(digits)
  return s
}

export function estimateText(sec: number): string {
  if (sec < 60) return `约 ${Math.round(sec)} 秒`
  const m = Math.round(sec / 60)
  if (m < 60) return `约 ${m} 分钟`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `约 ${h} 小时 ${rest} 分` : `约 ${h} 小时`
}

export function useFormat() {
  return {
    formatDuration,
    formatClock,
    formatTimecode,
    formatBytes,
    formatGB,
    formatBitrate,
    formatDateTime,
    formatDate,
    formatTime,
    fromNow,
    resolutionLabel,
    aspectLabel,
    scoreColor,
    gainText,
    estimateText
  }
}
