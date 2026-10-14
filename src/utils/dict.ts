/**
 * 业务字典与状态映射
 * 统一维护状态文案与语义色，页面不再硬编码中文枚举
 */
import type { AlarmLevel, AlarmStatus, OnlineStatus, SlaStatus, TenantStatus, WorkOrderStatus } from '@/types'

export interface StatusMeta {
  label: string
  type: 'success' | 'info' | 'warning' | 'danger' | 'primary'
  color?: string
}

/* 设备在线状态 */
export const ONLINE_STATUS: Record<OnlineStatus, StatusMeta> = {
  online: { label: '在线', type: 'success', color: '#52C41A' },
  offline: { label: '离线', type: 'info', color: '#8C8C8C' },
  unknown: { label: '未知', type: 'warning', color: '#FAAD14' },
  pending: { label: '待接入', type: 'primary', color: '#1677FF' }
}

export const onlineStatusMeta = (s: string): StatusMeta => ONLINE_STATUS[s as OnlineStatus] || { label: s || '未知', type: 'info' }

/* 告警等级 */
export const ALARM_LEVEL: Record<AlarmLevel, StatusMeta> = {
  urgent: { label: '紧急', type: 'danger', color: '#FF4D4F' },
  major: { label: '重要', type: 'warning', color: '#FAAD14' },
  minor: { label: '次要', type: 'primary', color: '#1677FF' },
  info: { label: '提示', type: 'info', color: '#8C8C8C' }
}

export const alarmLevelMeta = (l: string): StatusMeta => ALARM_LEVEL[l as AlarmLevel] || { label: l || '提示', type: 'info' }

export const ALARM_LEVEL_OPTIONS = (Object.keys(ALARM_LEVEL) as AlarmLevel[]).map((k) => ({ label: ALARM_LEVEL[k].label, value: k }))

/* 告警状态 */
export const ALARM_STATUS: Record<AlarmStatus, StatusMeta> = {
  pending: { label: '待处理', type: 'danger' },
  processing: { label: '处理中', type: 'warning' },
  resolved: { label: '已解决', type: 'success' },
  closed: { label: '已关闭', type: 'info' },
  false_alarm: { label: '误报', type: 'info' }
}

export const alarmStatusMeta = (s: string): StatusMeta => ALARM_STATUS[s as AlarmStatus] || { label: s || '未知', type: 'info' }

export const ALARM_STATUS_OPTIONS = (Object.keys(ALARM_STATUS) as AlarmStatus[]).map((k) => ({ label: ALARM_STATUS[k].label, value: k }))

/* 工单状态 */
export const WORKORDER_STATUS: Record<WorkOrderStatus, StatusMeta> = {
  pending: { label: '待受理', type: 'danger' },
  assigned: { label: '已派单', type: 'warning' },
  processing: { label: '处理中', type: 'primary' },
  verifying: { label: '待验收', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
  closed: { label: '已关闭', type: 'info' }
}

export const workOrderStatusMeta = (s: string): StatusMeta => WORKORDER_STATUS[s as WorkOrderStatus] || { label: s || '未知', type: 'info' }

export const WORKORDER_STATUS_OPTIONS = (Object.keys(WORKORDER_STATUS) as WorkOrderStatus[]).map((k) => ({ label: WORKORDER_STATUS[k].label, value: k }))

/* SLA 状态 */
export const SLA_STATUS: Record<SlaStatus, StatusMeta> = {
  normal: { label: '正常', type: 'success' },
  warning: { label: '即将超时', type: 'warning' },
  overdue: { label: '已超时', type: 'danger' }
}

export const slaMeta = (s: string): StatusMeta => SLA_STATUS[s as SlaStatus] || { label: '正常', type: 'success' }

/* 租户状态 */
export const TENANT_STATUS: Record<TenantStatus, StatusMeta> = {
  normal: { label: '正常', type: 'success' },
  arrears: { label: '欠费', type: 'danger' },
  suspended: { label: '已停用', type: 'info' },
  expired: { label: '已到期', type: 'warning' }
}

export const tenantStatusMeta = (s: string): StatusMeta => TENANT_STATUS[s as TenantStatus] || { label: s || '未知', type: 'info' }
export const TENANT_STATUS_OPTIONS = (Object.keys(TENANT_STATUS) as TenantStatus[]).map((k) => ({ label: TENANT_STATUS[k].label, value: k }))

/* 存储池类型与状态 */
export const STORAGE_TYPE: Record<string, StatusMeta> = {
  standard: { label: '标准存储', type: 'primary' },
  ia: { label: '低频存储', type: 'warning' },
  archive: { label: '归档存储', type: 'info' }
}
export const STORAGE_STATUS: Record<string, StatusMeta> = {
  normal: { label: '正常', type: 'success' },
  warning: { label: '水位偏高', type: 'warning' },
  full: { label: '即将写满', type: 'danger' },
  offline: { label: '离线', type: 'info' }
}

/* 任务/流程状态（通用） */
export const TASK_STATUS: Record<string, StatusMeta> = {
  running: { label: '运行中', type: 'primary' },
  stopped: { label: '已停止', type: 'info' },
  abnormal: { label: '异常', type: 'danger' },
  completed: { label: '已完成', type: 'success' },
  failed: { label: '失败', type: 'danger' },
  pending: { label: '待执行', type: 'warning' },
  paused: { label: '已暂停', type: 'info' }
}
export const taskStatusMeta = (s: string): StatusMeta => TASK_STATUS[s] || { label: s || '未知', type: 'info' }

/* 微服务状态 */
export const SERVICE_STATUS: Record<string, StatusMeta> = {
  healthy: { label: '健康', type: 'success' },
  degraded: { label: '降级', type: 'warning' },
  fused: { label: '熔断', type: 'danger' },
  down: { label: '不可用', type: 'danger' }
}

/* 节点状态 */
export const NODE_STATUS: Record<string, StatusMeta> = {
  online: { label: '在线', type: 'success' },
  warning: { label: '告警', type: 'warning' },
  offline: { label: '离线', type: 'danger' }
}

/* 日志级别 */
export const LOG_LEVEL: Record<string, StatusMeta> = {
  INFO: { label: 'INFO', type: 'info' },
  WARN: { label: 'WARN', type: 'warning' },
  ERROR: { label: 'ERROR', type: 'danger' },
  DEBUG: { label: 'DEBUG', type: 'primary' }
}

/* 账单状态 */
export const BILL_STATUS: Record<string, StatusMeta> = {
  pending: { label: '待支付', type: 'warning' },
  paid: { label: '已支付', type: 'success' },
  overdue: { label: '已逾期', type: 'danger' },
  void: { label: '已作废', type: 'info' }
}

/* 发票状态 */
export const INVOICE_STATUS: Record<string, StatusMeta> = {
  pending: { label: '待开票', type: 'warning' },
  issued: { label: '已开票', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' }
}

/* 备件状态 */
export const PART_STATUS: Record<string, StatusMeta> = {
  normal: { label: '库存正常', type: 'success' },
  low: { label: '库存偏低', type: 'warning' },
  out: { label: '已缺货', type: 'danger' }
}

/* 数据源面板色 */
export const CHART_COLORS = ['#1677FF', '#52C41A', '#FAAD14', '#FF4D4F', '#722ED1', '#13C2C2', '#EB2F96', '#FA8C16']

/* 工单优先级 = 告警等级 */
export const priorityOptions = ALARM_LEVEL_OPTIONS

/* 设备类型选项 */
export const DEVICE_CATEGORY_OPTIONS = [
  '枪型摄像机',
  '半球摄像机',
  '高速球机',
  '云台摄像机',
  'NVR 录像机',
  'DVR 录像机',
  '边缘智能网关',
  '视频解码器'
].map((v) => ({ label: v, value: v }))

export const PROTOCOL_OPTIONS = ['GB/T 28181-2016', 'ONVIF', 'RTSP', '厂商私有协议', 'GA/T 1400'].map((v) => ({ label: v, value: v }))

export const VENDOR_OPTIONS = ['海康威视', '大华股份', '宇视科技', '华为技术', '普联技术', '天地伟业', '苏州科达'].map((v) => ({ label: v, value: v }))

export const WORKORDER_TYPE_OPTIONS = ['设备安装调试', '故障报修', '定期巡检', '系统升级', '使用培训', '驻场服务', '定制开发'].map((v) => ({ label: v, value: v }))

export const NOTIFY_CHANNEL_OPTIONS = ['站内消息', '邮件', '短信', 'Webhook'].map((v) => ({ label: v, value: v }))

export const STORAGE_TYPE_OPTIONS = [
  { label: '标准存储', value: 'standard' },
  { label: '低频存储', value: 'ia' },
  { label: '归档存储', value: 'archive' }
]

export const WEEK_DAYS = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 }
]
