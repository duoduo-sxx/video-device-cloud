import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number, pad = false): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h > 0 || pad ? String(m).padStart(2, '0') : String(m)
  const ss = String(sec).padStart(2, '0')
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${mm}:${ss}`
}

export function formatTimecode(seconds: number): string {
  const s = Math.max(0, seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const cs = Math.floor((s % 1) * 100)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

export function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN')
}

export function formatDate(iso: string, withTime = true): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = (x: number) => String(x).padStart(2, '0')
  const base = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  return withTime ? `${base} ${p(d.getHours())}:${p(d.getMinutes())}` : base
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  return formatDate(iso, false)
}

export function percent(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`
}

export function downloadText(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob(['\uFEFF' + content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function toSrt(segments: { start: number; end: number; text: string }[]): string {
  const ts = (t: number) => {
    const h = Math.floor(t / 3600)
    const m = Math.floor((t % 3600) / 60)
    const s = Math.floor(t % 60)
    const ms = Math.floor((t % 1) * 1000)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
  }
  return segments
    .map((s, i) => `${i + 1}\n${ts(s.start)} --> ${ts(s.end)}\n${s.text}\n`)
    .join('\n')
}

export function toVtt(segments: { start: number; end: number; text: string }[]): string {
  const ts = (t: number) => {
    const h = Math.floor(t / 3600)
    const m = Math.floor((t % 3600) / 60)
    const s = Math.floor(t % 60)
    const ms = Math.floor((t % 1) * 1000)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
  }
  return `WEBVTT\n\n${segments.map((s, i) => `${i + 1}\n${ts(s.start)} --> ${ts(s.end)}\n${s.text}\n`).join('\n')}`
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export function scoreColor(score: number): string {
  if (score >= 0.9) return 'var(--success)'
  if (score >= 0.75) return 'var(--brand)'
  if (score >= 0.65) return 'var(--warning)'
  return 'var(--danger)'
}

export function coverUrl(seed: string, w = 640, h = 360) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}

export function avatarUrl(n: number) {
  return `https://i.pravatar.cc/80?img=${n}`
}
