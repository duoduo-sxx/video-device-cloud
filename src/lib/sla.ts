import dayjs from 'dayjs'

export interface SlaState {
  percent: number
  remainingMs: number
  overdue: boolean
  overdueDays: number
  level: 'ok' | 'warn' | 'danger'
  label: string
}

export function slaState(createdAt: string, slaHours: number, now = dayjs()): SlaState {
  const start = dayjs(createdAt)
  const deadline = start.add(slaHours, 'hour')
  const totalMs = deadline.diff(start)
  const usedMs = now.diff(start)
  const remainingMs = deadline.diff(now)
  const percent = Math.min(1.6, Math.max(0, usedMs / totalMs))
  const overdue = remainingMs < 0
  const overdueDays = overdue ? Math.ceil(-remainingMs / 86400000) : 0
  let level: SlaState['level'] = 'ok'
  if (overdue) level = 'danger'
  else if (percent >= 0.8) level = 'warn'

  let label: string
  if (overdue) {
    label = `超时 ${overdueDays} 天`
  } else {
    const h = Math.floor(remainingMs / 3600000)
    const m = Math.floor((remainingMs % 3600000) / 60000)
    label = h > 0 ? `剩余 ${h}h ${m}m` : `剩余 ${m}m`
  }
  return { percent, remainingMs, overdue, overdueDays, level, label }
}

export function slaDeadline(createdAt: string, slaHours: number): string {
  return dayjs(createdAt).add(slaHours, 'hour').toISOString()
}
