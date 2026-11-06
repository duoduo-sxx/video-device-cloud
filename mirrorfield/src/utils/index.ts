import dayjs from 'dayjs'

export const fmtDate = (v?: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '—')
export const fmtDateTime = (v?: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—')
export const fmtTime = (v?: string) => (v ? dayjs(v).format('HH:mm:ss') : '—')
export const fromNow = (v?: string) => {
  if (!v) return '—'
  const diff = Date.now() - new Date(v).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  return dayjs(v).format('YYYY-MM-DD')
}

export const fmtNum = (n: number) => n.toLocaleString('zh-CN')
export const fmtMoney = (n: number) => `¥ ${n.toLocaleString('zh-CN')}`
export const fmtDuration = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

export const TASK_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待开始', color: 'default' },
  RUNNING: { label: '进行中', color: 'cyan' },
  RETURNING: { label: '数据回传', color: 'blue' },
  PROCESSING: { label: '处理中', color: 'geekblue' },
  DONE: { label: '已完成', color: 'green' },
  CANCELLED: { label: '已取消', color: 'default' },
}

export const TASK_TYPE: Record<string, string> = {
  UAV_OBLIQUE: '无人机倾斜摄影',
  GROUND_SCAN: '地面站式扫描',
  SLAM: '手持 SLAM',
  PANORAMA: '全景拍摄',
}

export const QUALITY: Record<string, { label: string; color: string }> = {
  PASS: { label: '合格', color: 'green' },
  PENDING: { label: '待检', color: 'default' },
  FAIL: { label: '不合格', color: 'red' },
}

export const TICKET_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待派单', color: 'default' },
  ASSIGNED: { label: '已派单', color: 'blue' },
  PROCESSING: { label: '处理中', color: 'cyan' },
  VERIFYING: { label: '待验收', color: 'gold' },
  DONE: { label: '已完成', color: 'green' },
}

export const ASSET_STATUS: Record<string, { label: string; color: string }> = {
  PUBLISHED: { label: '已发布', color: 'green' },
  OPTIMIZING: { label: '轻量化中', color: 'cyan' },
  DRAFT: { label: '草稿', color: 'default' },
  ARCHIVED: { label: '已归档', color: 'default' },
}

export const DEVICE_STATUS: Record<string, { label: string; color: string }> = {
  ONLINE: { label: '在线', color: 'green' },
  OFFLINE: { label: '离线', color: 'red' },
  MAINTAIN: { label: '维护中', color: 'gold' },
}

export const DEFECT_STATUS: Record<string, { label: string; color: string }> = {
  NEW: { label: '待确认', color: 'default' },
  CONFIRMED: { label: '已确认', color: 'blue' },
  PROCESSING: { label: '处理中', color: 'cyan' },
  CLOSED: { label: '已闭环', color: 'green' },
}

export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  SIGNED: { label: '已签约', color: 'default' },
  RUNNING: { label: '执行中', color: 'cyan' },
  DELIVERING: { label: '交付中', color: 'blue' },
  DONE: { label: '已完成', color: 'green' },
}

export const PRIORITY_COLOR: Record<string, string> = { 高: '#F87171', 中: '#FBBF24', 低: '#93A4BE' }

/** 世界坐标 → CGCS2000 + 经纬度 */
export function toCrs(x: number, y: number, z: number) {
  const X = 3453210.456 + x
  const Y = 40512880.132 - z
  const lat = 30.2841 + z / 111320
  const lng = 120.1526 + x / (111320 * Math.cos((30.2841 * Math.PI) / 180))
  return {
    X: X.toFixed(3),
    Y: Y.toFixed(3),
    Z: y.toFixed(2),
    lat: lat.toFixed(6),
    lng: lng.toFixed(6),
  }
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export function downloadText(filename: string, content: string) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function toCsv(rows: Record<string, string | number>[]): string {
  if (!rows.length) return ''
  const heads = Object.keys(rows[0])
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  return [heads.join(','), ...rows.map((r) => heads.map((h) => esc(r[h] ?? '')).join(','))].join('\n')
}
