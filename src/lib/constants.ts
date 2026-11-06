import type {
  ClientLevel,
  JobStatus,
  OrderStatus,
  OutputFormat,
  ProjectStatus,
  StageKey,
  TicketPriority,
  TicketStatus,
} from '../types'

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'violet'

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  draft: '草稿',
  queued: '排队中',
  analyzing: '镜头分析',
  depth: '深度估计',
  disparity: '视差生成',
  temporal: '时域优化',
  rendering: '立体渲染',
  encoding: '编码封装',
  qa: '待质检',
  completed: '已完成',
  failed: '已失败',
  paused: '已暂停',
  canceled: '已取消',
}

export const JOB_STATUS_TONE: Record<JobStatus, Tone> = {
  draft: 'neutral',
  queued: 'neutral',
  analyzing: 'info',
  depth: 'info',
  disparity: 'info',
  temporal: 'info',
  rendering: 'primary',
  encoding: 'primary',
  qa: 'warning',
  completed: 'success',
  failed: 'danger',
  paused: 'warning',
  canceled: 'neutral',
}

export const RUNNING_STATUSES: JobStatus[] = ['analyzing', 'depth', 'disparity', 'temporal', 'rendering', 'encoding']

export const STAGE_META: { key: StageKey; label: string; weight: number }[] = [
  { key: 'analyze', label: '镜头分析', weight: 6 },
  { key: 'depth', label: '深度估计', weight: 26 },
  { key: 'disparity', label: '视差生成', weight: 14 },
  { key: 'temporal', label: '时域优化', weight: 12 },
  { key: 'render', label: '立体渲染', weight: 28 },
  { key: 'encode', label: '编码封装', weight: 8 },
  { key: 'qa', label: '质检', weight: 6 },
]

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: '草稿',
  active: '进行中',
  pending_acceptance: '待验收',
  delivered: '已交付',
  archived: '已归档',
  on_hold: '已挂起',
}

export const PROJECT_STATUS_TONE: Record<ProjectStatus, Tone> = {
  draft: 'neutral',
  active: 'primary',
  pending_acceptance: 'warning',
  delivered: 'success',
  archived: 'neutral',
  on_hold: 'warning',
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_confirm: '待确认',
  paid: '已支付',
  in_production: '制作中',
  delivered: '已交付',
  completed: '已完成',
  canceled: '已取消',
}

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  pending_confirm: 'warning',
  paid: 'info',
  in_production: 'primary',
  delivered: 'success',
  completed: 'success',
  canceled: 'neutral',
}

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  new: '待受理',
  accepted: '已受理',
  in_progress: '处理中',
  waiting_client: '待客户确认',
  resolved: '已解决',
  closed: '已关闭',
  reopened: '重新打开',
}

export const TICKET_STATUS_TONE: Record<TicketStatus, Tone> = {
  new: 'danger',
  accepted: 'warning',
  in_progress: 'primary',
  waiting_client: 'info',
  resolved: 'success',
  closed: 'neutral',
  reopened: 'warning',
}

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  P0: 'P0 紧急',
  P1: 'P1 高',
  P2: 'P2 中',
  P3: 'P3 低',
}

export const PRIORITY_TONE: Record<TicketPriority, Tone> = {
  P0: 'danger',
  P1: 'warning',
  P2: 'primary',
  P3: 'neutral',
}

export const SLA_HOURS: Record<TicketPriority, number> = { P0: 2, P1: 8, P2: 24, P3: 72 }

export const CLIENT_LEVEL_LABEL: Record<ClientLevel, string> = {
  strategic: '战略',
  key: '重点',
  normal: '普通',
}

export const CLIENT_LEVEL_TONE: Record<ClientLevel, Tone> = {
  strategic: 'violet',
  key: 'primary',
  normal: 'neutral',
}

export const FORMAT_LABEL: Record<OutputFormat, string> = {
  'MV-HEVC': 'MV-HEVC',
  'SBS-Full': 'SBS 全宽',
  'SBS-Half': 'SBS 半宽',
  OU: '上下 3D',
  Anaglyph: '红蓝立体',
}

export const UNIT_PRICE_4K = 120
export const UNIT_PRICE_8K = 360
export const UNIT_PRICE_1080 = 80
export const REFINE_RATE_4K = 600
export const REFINE_RATE_8K = 1400
export const RUSH_RATE = 1.5
export const TAX_RATE = 0.06

export const CALC_BASE_4K = 2.2
export const CALC_BASE_8K = 5.6
export const CALC_BASE_1080 = 1.1
export const FORMAT_FACTOR: Record<OutputFormat, number> = {
  'MV-HEVC': 1.15,
  'SBS-Full': 1.0,
  'SBS-Half': 1.0,
  OU: 1.0,
  Anaglyph: 0.9,
}

export const ERROR_LIBRARY = [
  { code: 'E-4021', message: '深度估计阶段显存不足（需 > 24GB）', hint: '降低输出分辨率至 4K，或改用 A100 节点重试' },
  { code: 'E-4108', message: '源视频帧率为非恒定帧率（VFR），时间轴无法对齐', hint: '先执行 CFR 转码（25fps 恒定）后重新提交' },
  { code: 'E-4233', message: '检测到大面积纯色/黑场，深度置信度低于 0.35', hint: '跳过该片段，或启用人工深度引导后重试' },
  { code: 'E-4310', message: 'MV-HEVC 编码器初始化失败', hint: '检查节点驱动版本是否为 550.54 以上，或更换节点' },
  { code: 'E-4402', message: '输出路径写入失败（磁盘配额不足）', hint: '清理节点缓存（需 ≥ 200GB 可用空间）后重试' },
  { code: 'E-4501', message: '任务超时（超过 8 小时未完成）', hint: '将素材拆分为 10 分钟片段，分别提交转换' },
]

export const NAV_GROUPS = [
  { title: '生产', items: ['dashboard', 'assets', 'jobs', 'review', 'presets'] },
] as const
