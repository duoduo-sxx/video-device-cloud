import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export function formatCapacity(tb?: number | null): string {
  if (tb === undefined || tb === null || Number.isNaN(tb)) return '--'
  if (tb >= 1024) return `${(tb / 1024).toFixed(2)} PB`
  // 整数容量不带多余小数位：512 TB / 239.5 TB
  return `${Number.isInteger(tb) ? tb : tb.toFixed(1)} TB`
}

export function formatGB(gb?: number | null): string {
  if (gb === undefined || gb === null) return '--'
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`
  return `${gb} GB`
}

export function formatNumber(n?: number | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '--'
  return n.toLocaleString('zh-CN')
}

export function formatPct(n?: number | null): string {
  if (n === undefined || n === null) return '--'
  return `${n.toFixed(1)}%`
}

export function formatMoney(n?: number | null): string {
  if (n === undefined || n === null) return '--'
  return `¥ ${n.toLocaleString('zh-CN')}`
}

export function formatDate(v?: string | null): string {
  if (!v) return '--'
  return dayjs(v).format('YYYY-MM-DD')
}

export function formatDateTime(v?: string | null): string {
  if (!v) return '--'
  return dayjs(v).format('YYYY-MM-DD HH:mm')
}

export function fromNow(v?: string | null): string {
  if (!v) return '--'
  return dayjs(v).fromNow()
}

export function durationText(minutes?: number | null): string {
  if (minutes === undefined || minutes === null) return '--'
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} 分钟`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h < 24) return m ? `${h}h ${m}m` : `${h}h`
  const d = Math.floor(h / 24)
  return `${d}天 ${h % 24}h`
}

export function remainText(ms: number): string {
  const abs = Math.abs(ms)
  const totalMin = Math.floor(abs / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

export function slaTone(remainMs: number, totalMs: number): 'danger' | 'warning' | 'success' {
  if (remainMs <= 0) return 'danger'
  if (totalMs > 0 && remainMs / totalMs <= 0.2) return 'warning'
  return 'success'
}

export function usageTone(rate: number): 'danger' | 'warning' | 'success' {
  if (rate >= 92) return 'danger'
  if (rate >= 85) return 'warning'
  return 'success'
}

export function percent(a: number, b: number): number {
  if (!b) return 0
  return Number(((a / b) * 100).toFixed(1))
}

export { dayjs }
