import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export const now = () => dayjs()

export function iso(d: dayjs.Dayjs | Date | string | number) {
  return dayjs(d).format('YYYY-MM-DDTHH:mm:ssZ')
}

export function fromNow(t: string) {
  return dayjs(t).fromNow()
}

export function fmtTime(t: string | Date) {
  return dayjs(t).format('HH:mm:ss')
}

export function fmtShort(t: string | Date) {
  return dayjs(t).format('MM-DD HH:mm')
}

export function fmtDate(t: string | Date) {
  return dayjs(t).format('YYYY-MM-DD')
}

export function fmtFull(t: string | Date) {
  return dayjs(t).format('YYYY-MM-DD HH:mm:ss')
}

export function minutesBetween(a: string, b: string) {
  return Math.max(0, Math.round(dayjs(b).diff(dayjs(a), 'minute', true)))
}

export function fmtDuration(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} 分钟`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h < 24) return m ? `${h} 小时 ${m} 分` : `${h} 小时`
  const d = Math.floor(h / 24)
  return `${d} 天 ${h % 24} 小时`
}

export function fmtNumber(n: number, digits = 0) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function fmtPercent(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`
}

export function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function greeting() {
  const h = dayjs().hour()
  if (h < 6) return '夜间值守'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}
