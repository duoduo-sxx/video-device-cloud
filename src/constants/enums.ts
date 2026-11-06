import type { AlertLevel, AlertStatus, DeviceCategory, DeviceStatus, Role, TaskStatus, TicketPriority, TicketStatus } from '@/types'

export const ROLE_LABEL: Record<Role, string> = {
  operator: '值班调度员',
  engineer: '技术运维',
  manager: '中心主管',
  guest: '访客演示',
}

export const ROLE_DESC: Record<Role, string> = {
  operator: '值守场景切换、事件处置、任务执行',
  engineer: '设备维护、工单处理、远程协助',
  manager: '全局态势、数据分析、人员权限',
  guest: '只读浏览，用于参观演示',
}

export const DEVICE_STATUS_LABEL: Record<DeviceStatus, string> = {
  online: '在线',
  offline: '离线',
  warning: '告警',
  maintenance: '维护中',
}

export const DEVICE_STATUS_COLOR: Record<DeviceStatus, string> = {
  online: 'var(--success)',
  offline: '#64748B',
  warning: 'var(--danger)',
  maintenance: 'var(--info)',
}

export const DEVICE_CATEGORY_LABEL: Record<DeviceCategory, string> = {
  display: '显示设备',
  audio: '音频设备',
  lighting: '灯光设备',
  hvac: '暖通设备',
  sensor: '传感设备',
  control: '控制设备',
  network: '网络设备',
  power: '电力设备',
}

export const ALERT_LEVEL_COLOR: Record<AlertLevel, string> = {
  P1: 'var(--danger)',
  P2: 'var(--warning)',
  P3: 'var(--info)',
}

export const ALERT_LEVEL_LABEL: Record<AlertLevel, string> = {
  P1: '紧急',
  P2: '重要',
  P3: '提示',
}

export const ALERT_STATUS_LABEL: Record<AlertStatus, string> = {
  open: '待处理',
  acknowledged: '已认领',
  processing: '处理中',
  recovered: '已恢复',
  closed: '已关闭',
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pending: '待执行',
  running: '执行中',
  done: '已完成',
  failed: '异常',
}

export const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  pending: 'var(--text-muted)',
  running: 'var(--brand)',
  done: 'var(--success)',
  failed: 'var(--danger)',
}

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  pending: '待受理',
  assigned: '已指派',
  processing: '处理中',
  verifying: '待验证',
  done: '已完成',
  closed: '已关闭',
}

export const TICKET_PRIORITY_LABEL: Record<TicketPriority, string> = {
  urgent: '紧急',
  high: '高',
  normal: '普通',
  low: '低',
}

export const TICKET_PRIORITY_COLOR: Record<TicketPriority, string> = {
  urgent: 'var(--danger)',
  high: 'var(--warning)',
  normal: 'var(--info)',
  low: 'var(--text-muted)',
}

export const SERVICE_CATALOG = [
  {
    key: 'remote',
    name: '远程协助',
    icon: 'MonitorSmartphone',
    desc: '工程师远程接入控制台，实时排查设备与系统异常',
    sla: '15 分钟内响应',
    tags: ['即时', '在线'],
  },
  {
    key: 'onsite',
    name: '现场支持',
    icon: 'Wrench',
    desc: '派遣工程师到达现场处理硬件故障、更换备件与复测',
    sla: '2 小时内到场',
    tags: ['硬件', '备件'],
  },
  {
    key: 'inspection',
    name: '系统巡检',
    icon: 'ClipboardCheck',
    desc: '按周期对设备、网络、供配电进行全面检查并出具报告',
    sla: '提前 3 天预约',
    tags: ['周期性', '报告'],
  },
  {
    key: 'training',
    name: '操作培训',
    icon: 'GraduationCap',
    desc: '面向值班人员的场景操作、应急处置与日常维护培训',
    sla: '5 个工作日内安排',
    tags: ['现场', '考核'],
  },
  {
    key: 'custom',
    name: '定制开发',
    icon: 'Code2',
    desc: '场景流程定制、第三方系统对接、报表与看板开发',
    sla: '需求评估后 3 天反馈',
    tags: ['评估', '排期'],
  },
  {
    key: 'emergency',
    name: '应急保障',
    icon: 'ShieldAlert',
    desc: '重大活动期间驻场值守，7×24 小时不间断保障',
    sla: '立即启动',
    tags: ['驻场', '7×24'],
  },
]

export const ARTICLE_CATEGORIES = ['设备故障', '操作指引', '应急预案', '常见问答'] as const

export const SHORTCUTS = [
  { group: '导航', items: [{ keys: ['g', 'd'], desc: '前往态势总览' }, { keys: ['g', 'i'], desc: '前往多模态交互中心' }, { keys: ['g', 'a'], desc: '前往告警与事件' }, { keys: ['g', 't'], desc: '前往技术服务' }] },
  { group: '操作', items: [{ keys: ['⌘', 'K'], desc: '打开全局命令面板' }, { keys: ['/'], desc: '聚焦搜索' }, { keys: ['F'], desc: '切换全屏' }, { keys: ['Esc'], desc: '关闭最上层浮层' }] },
  { group: '通用', items: [{ keys: ['?'], desc: '打开快捷键帮助' }, { keys: ['Shift', 'L'], desc: '切换深浅主题' }, { keys: ['Shift', 'C'], desc: '切换焦点模式' }] },
]
