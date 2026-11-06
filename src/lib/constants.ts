import type { Channel, Grade, OrderStatus, Severity, TaskStatus } from '../types'

export const SEVERITY_META: Record<Severity, { label: string; color: string; bg: string; weight: number }> = {
  fatal: { label: '致命', color: '#F87171', bg: 'rgba(248,113,113,.12)', weight: 8 },
  severe: { label: '严重', color: '#FB923C', bg: 'rgba(251,146,60,.12)', weight: 4 },
  moderate: { label: '一般', color: '#FBBF24', bg: 'rgba(251,191,36,.12)', weight: 1.5 },
  info: { label: '提示', color: '#60A5FA', bg: 'rgba(96,165,250,.12)', weight: 0.5 },
}

export const SEVERITY_ORDER: Severity[] = ['fatal', 'severe', 'moderate', 'info']

export const CHANNEL_META: Record<Channel, { label: string; color: string }> = {
  video: { label: '视频', color: '#A78BFA' },
  audio: { label: '音频', color: '#22D3EE' },
  container: { label: '容器', color: '#FBBF24' },
  subtitle: { label: '字幕', color: '#34D399' },
}

export const GRADE_META: Record<Grade, { color: string; label: string }> = {
  A: { color: '#34D399', label: '优良' },
  B: { color: '#22D3EE', label: '合格' },
  C: { color: '#FBBF24', label: '待修复' },
  D: { color: '#F87171', label: '不合格' },
}

export const TASK_STATUS_META: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  queued: { label: '排队中', color: '#A7B4C4', bg: 'rgba(167,180,196,.12)' },
  probing: { label: '探针中', color: '#60A5FA', bg: 'rgba(96,165,250,.12)' },
  detecting: { label: '检测中', color: '#22D3EE', bg: 'rgba(34,211,238,.12)' },
  aggregating: { label: '聚合评分', color: '#A78BFA', bg: 'rgba(167,139,250,.12)' },
  done: { label: '已完成', color: '#34D399', bg: 'rgba(52,211,153,.12)' },
  failed: { label: '失败', color: '#F87171', bg: 'rgba(248,113,113,.12)' },
  canceled: { label: '已取消', color: '#6E7D90', bg: 'rgba(110,125,144,.12)' },
}

export const REPAIR_STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  draft: { label: '方案草稿', color: '#A7B4C4', bg: 'rgba(167,180,196,.12)' },
  pending: { label: '待执行', color: '#FBBF24', bg: 'rgba(251,191,36,.12)' },
  running: { label: '修复中', color: '#22D3EE', bg: 'rgba(34,211,238,.12)' },
  rechecking: { label: '复检中', color: '#A78BFA', bg: 'rgba(167,139,250,.12)' },
  review: { label: '待验收', color: '#FBBF24', bg: 'rgba(251,191,36,.12)' },
  passed: { label: '已通过', color: '#34D399', bg: 'rgba(52,211,153,.12)' },
  rejected: { label: '已驳回', color: '#F87171', bg: 'rgba(248,113,113,.12)' },
  failed: { label: '失败', color: '#F87171', bg: 'rgba(248,113,113,.12)' },
}

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  submitted: { label: '待评估', color: '#A7B4C4', bg: 'rgba(167,180,196,.12)' },
  quoted: { label: '已报价', color: '#60A5FA', bg: 'rgba(96,165,250,.12)' },
  signed: { label: '已签约', color: '#A78BFA', bg: 'rgba(167,139,250,.12)' },
  receiving: { label: '素材接收', color: '#A78BFA', bg: 'rgba(167,139,250,.12)' },
  scheduled: { label: '已排期', color: '#22D3EE', bg: 'rgba(34,211,238,.12)' },
  processing: { label: '处理中', color: '#22D3EE', bg: 'rgba(34,211,238,.12)' },
  internal_qc: { label: '内审中', color: '#FBBF24', bg: 'rgba(251,191,36,.12)' },
  delivered: { label: '待验收', color: '#FBBF24', bg: 'rgba(251,191,36,.12)' },
  accepted: { label: '已验收', color: '#34D399', bg: 'rgba(52,211,153,.12)' },
  settled: { label: '已结算', color: '#34D399', bg: 'rgba(52,211,153,.12)' },
  canceled: { label: '已取消', color: '#6E7D90', bg: 'rgba(110,125,144,.12)' },
  rework: { label: '返工中', color: '#F87171', bg: 'rgba(248,113,113,.12)' },
}

export const ORDER_BOARD_COLUMNS: OrderStatus[] = [
  'submitted',
  'quoted',
  'signed',
  'processing',
  'internal_qc',
  'delivered',
  'settled',
]

export const RULE_SET_LABELS = ['广电播出', '流媒体上线', '影院 DCP', '教育课程']

export const LOUDNESS_STANDARDS = [
  { scene: '广电播出（中国）', target: -24, tolerance: 2, peak: -1, channels: '2.0 / 5.1', ref: 'GY/T 282-2014' },
  { scene: '流媒体上线', target: -14, tolerance: 1, peak: -1, channels: '2.0', ref: '平台通行规范' },
  { scene: '影院 DCP', target: -27, tolerance: 2, peak: -3, channels: '5.1 / 7.1', ref: 'SMPTE RP 200' },
  { scene: '教育 / 会议录制', target: -16, tolerance: 2, peak: -1, channels: '2.0', ref: '内部规范' },
]
