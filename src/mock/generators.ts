import dayjs from 'dayjs'
import { genSeries, rand } from '@/utils/misc'

export function metricTrend(base: number, amp = 4, points = 12) {
  return genSeries(base, points, amp).map((v) => Number(v.toFixed(1)))
}

export function alertSeries(current: number, points = 30) {
  const now = dayjs()
  const start = current * 0.72
  return Array.from({ length: points }, (_, i) => {
    const ratio = i / (points - 1)
    const base = start + (current - start) * Math.pow(ratio, 1.7)
    const noise = (rand() - 0.5) * current * 0.018
    return {
      time: now.subtract((points - 1 - i) * 2, 'minute').format('HH:mm'),
      value: Number((base + noise).toFixed(1)),
    }
  })
}

/** 24 小时指令量，工作日双峰 */
export function commandVolume24h() {
  const shape = [
    0.12, 0.08, 0.06, 0.05, 0.05, 0.08, 0.18, 0.36, 0.62, 0.88, 1.0, 0.92, 0.7, 0.78, 0.95, 1.0,
    0.94, 0.82, 0.6, 0.44, 0.34, 0.26, 0.2, 0.15,
  ]
  const now = dayjs().hour()
  return Array.from({ length: 24 }, (_, h) => {
    const base = shape[h] * 92
    const jitter = 1 + (rand() - 0.5) * 0.18
    return { hour: `${String(h).padStart(2, '0')}:00`, value: Math.round(base * jitter), idx: h, now: h <= now }
  })
}

export function weekVolume() {
  const names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const base = [1180, 1264, 1102, 1348, 1216, 486, 312]
  return names.map((n, i) => ({ label: n, value: Math.round(base[i] * (1 + (rand() - 0.5) * 0.08)) }))
}

export function heatmapData() {
  return Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 24 }, (_, h) => {
      const dayFactor = d >= 5 ? 0.32 : 1
      const hourFactor =
        h < 7 ? 0.08 : h < 9 ? 0.42 : h < 12 ? 0.95 : h < 14 ? 0.62 : h < 18 ? 1 : h < 21 ? 0.55 : 0.18
      return Math.round(hourFactor * dayFactor * 100 * (0.85 + rand() * 0.3))
    })
  )
}

export function responseDistribution() {
  const buckets = [
    { label: '<1s', base: 320 },
    { label: '1-2s', base: 520 },
    { label: '2-4s', base: 268 },
    { label: '4-8s', base: 96 },
    { label: '>8s', base: 28 },
  ]
  return buckets.map((b) => ({ label: b.label, value: Math.round(b.base * (0.9 + rand() * 0.2)) }))
}
