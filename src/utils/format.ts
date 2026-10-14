/**
 * 格式化工具：数字、容量、时长、时间
 */
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export const DATE_TIME = 'YYYY-MM-DD HH:mm:ss'
export const DATE = 'YYYY-MM-DD'

export function formatNumber(value: number | string | undefined | null, decimals = 0): string {
  const n = Number(value)
  if (value === null || value === undefined || Number.isNaN(n)) return '-'
  return n.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/** 千分位 + 单位后缀 */
export function formatCount(value: number, unit = ''): string {
  return formatNumber(value) + unit
}

/** 容量自动换算：GB / TB / PB */
export function formatStorage(tb: number | undefined | null, sourceUnit: 'TB' | 'GB' = 'TB'): string {
  if (tb === null || tb === undefined) return '-'
  let gb = sourceUnit === 'TB' ? tb * 1024 : tb
  if (gb >= 1024 * 1024) return `${(gb / 1024 / 1024).toFixed(2)} PB`
  if (gb >= 1024) return `${(gb / 1024).toFixed(2)} TB`
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  return `${(gb * 1024).toFixed(0)} MB`
}

/** 字节数格式化 */
export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`
}

/** 分钟 → 中文时长 */
export function formatDuration(minutes: number | undefined | null): string {
  if (minutes === null || minutes === undefined) return '-'
  if (minutes < 1) return '不足 1 分钟'
  if (minutes < 60) return `${Math.round(minutes)} 分钟`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h < 24) return m ? `${h} 小时 ${m} 分钟` : `${h} 小时`
  const d = Math.floor(h / 24)
  const hh = h % 24
  return hh ? `${d} 天 ${hh} 小时` : `${d} 天`
}

/** 秒 → mm:ss 或 hh:mm:ss */
export function formatSeconds(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`
}

export function formatPercent(value: number | undefined | null, decimals = 1): string {
  if (value === null || value === undefined) return '-'
  return `${Number(value).toFixed(decimals)}%`
}

export function relativeTimeText(time: string): string {
  if (!time) return '-'
  return dayjs(time).fromNow()
}

export function formatDate(time?: string | number | Date, pattern = DATE): string {
  if (!time) return '-'
  return dayjs(time).format(pattern)
}

export function formatDateTime(time?: string | number | Date): string {
  return formatDate(time, DATE_TIME)
}

/** 近 N 天的日期数组（含今天），格式 MM-DD */
export function recentDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => dayjs().subtract(n - 1 - i, 'day').format('MM-DD'))
}

export function now(): string {
  return dayjs().format(DATE_TIME)
}

export function diffDays(from: string, to: string = dayjs().format(DATE_TIME)): number {
  return dayjs(to).diff(dayjs(from), 'day')
}

/** 生成编号：前缀 + 日期 + 序号 */
export function makeNo(prefix: string, seq: number, pad = 4): string {
  return `${prefix}${dayjs().format('YYYYMMDD')}${String(seq).padStart(pad, '0')}`
}

export { dayjs }
