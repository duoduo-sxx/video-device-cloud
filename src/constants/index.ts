import type { Role, RoleCode } from '@/types'

export const ALL_PERMISSIONS = [
  'dashboard:view',
  'resource:read',
  'resource:write',
  'alarm:read',
  'alarm:handle',
  'ticket:read',
  'ticket:create',
  'ticket:assign',
  'ticket:handle',
  'ticket:accept',
  'ticket:close',
  'change:read',
  'change:approve',
  'spare:read',
  'spare:write',
  'knowledge:read',
  'knowledge:write',
  'contract:read',
  'report:view',
  'customer:read',
  'system:manage'
]

export const ROLES: Role[] = [
  {
    code: 'admin',
    name: '平台管理员',
    desc: '系统配置、账号与权限、字典参数，拥有全部功能权限',
    scope: 'all',
    permissions: ALL_PERMISSIONS
  },
  {
    code: 'service_manager',
    name: '服务经理',
    desc: '服务交付负责人，负责派单、SLA 监控、合同与服务报告',
    scope: 'all',
    permissions: [
      'dashboard:view', 'resource:read', 'alarm:read', 'alarm:handle', 'ticket:read', 'ticket:create',
      'ticket:assign', 'ticket:close', 'change:read', 'change:approve', 'spare:read', 'knowledge:read',
      'knowledge:write', 'contract:read', 'report:view', 'customer:read'
    ]
  },
  {
    code: 'engineer',
    name: '存储运维工程师',
    desc: '一线运维，处理工单、查看监控与资源，沉淀知识库',
    scope: 'self',
    permissions: [
      'dashboard:view', 'resource:read', 'alarm:read', 'alarm:handle', 'ticket:read', 'ticket:create',
      'ticket:handle', 'spare:read', 'spare:write', 'knowledge:read', 'knowledge:write', 'change:read',
      'report:view', 'customer:read'
    ]
  },
  {
    code: 'service_desk',
    name: '服务台坐席',
    desc: '受理中心，负责建单、分派与满意度回访',
    scope: 'all',
    permissions: [
      'dashboard:view', 'resource:read', 'alarm:read', 'ticket:read', 'ticket:create', 'ticket:assign',
      'knowledge:read', 'customer:read'
    ]
  },
  {
    code: 'customer_admin',
    name: '客户管理员',
    desc: '客户方 IT，查看本客户资源、报障与验收工单',
    scope: 'customer',
    permissions: ['dashboard:view', 'resource:read', 'ticket:read', 'ticket:create', 'ticket:accept', 'knowledge:read']
  },
  {
    code: 'viewer',
    name: '领导 / 审计',
    desc: '只读全部数据，可查看看板与报表并导出',
    scope: 'all',
    permissions: [
      'dashboard:view', 'resource:read', 'alarm:read', 'ticket:read', 'change:read', 'spare:read',
      'knowledge:read', 'contract:read', 'report:view', 'customer:read'
    ]
  }
]

export const ROLE_MAP: Record<RoleCode, Role> = ROLES.reduce((acc, r) => {
  acc[r.code] = r
  return acc
}, {} as Record<RoleCode, Role>)

export const ROLE_NAME: Record<RoleCode, string> = ROLES.reduce((acc, r) => {
  acc[r.code] = r.name
  return acc
}, {} as Record<RoleCode, string>)

export const TICKET_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: '待受理', tone: 'warning' },
  assigned: { label: '待派单', tone: 'warning' },
  processing: { label: '处理中', tone: 'primary' },
  suspended: { label: '已挂起', tone: 'neutral' },
  resolved: { label: '待验收', tone: 'cyan' },
  closed: { label: '已关闭', tone: 'success' }
}

export const PRIORITY: Record<string, { label: string; tone: Tone }> = {
  P1: { label: 'P1 紧急', tone: 'danger' },
  P2: { label: 'P2 高', tone: 'warning' },
  P3: { label: 'P3 中', tone: 'primary' },
  P4: { label: 'P4 低', tone: 'neutral' }
}

export const ALARM_LEVEL: Record<string, { label: string; tone: Tone }> = {
  P1: { label: 'P1', tone: 'danger' },
  P2: { label: 'P2', tone: 'warning' },
  P3: { label: 'P3', tone: 'primary' },
  P4: { label: 'P4', tone: 'neutral' }
}

export const ALARM_STATUS: Record<string, { label: string; tone: Tone }> = {
  active: { label: '活跃', tone: 'danger' },
  acked: { label: '已确认', tone: 'warning' },
  recovered: { label: '已恢复', tone: 'success' },
  closed: { label: '已关闭', tone: 'neutral' }
}

export const DEVICE_STATUS: Record<string, { label: string; tone: Tone }> = {
  online: { label: '在线', tone: 'success' },
  warning: { label: '告警', tone: 'warning' },
  offline: { label: '离线', tone: 'danger' },
  maintenance: { label: '维护中', tone: 'neutral' }
}

export const POOL_STATUS: Record<string, { label: string; tone: Tone }> = {
  normal: { label: '正常', tone: 'success' },
  warning: { label: '容量警告', tone: 'warning' },
  critical: { label: '容量严重', tone: 'danger' }
}

export const CLUSTER_STATUS: Record<string, { label: string; tone: Tone }> = {
  online: { label: '在线', tone: 'success' },
  warning: { label: '告警', tone: 'warning' },
  offline: { label: '离线', tone: 'danger' },
  maintenance: { label: '维护中', tone: 'neutral' }
}

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'cyan' | 'purple'

export const CHART_COLORS = ['#1668DC', '#13C2C2', '#F5A524', '#7C5CFC', '#E5484D', '#22C55E', '#94A3B8']

export const INDUSTRY_NAME: Record<string, string> = {
  government: '政务',
  finance: '金融',
  medical: '医疗',
  education: '教育',
  energy: '能源',
  manufacturing: '制造',
  telecom: '运营商'
}

export const SERVICE_CATEGORIES = [
  { key: 'all', name: '全部' },
  { key: 'fault', name: '故障案例' },
  { key: 'manual', name: '操作手册' },
  { key: 'best', name: '最佳实践' },
  { key: 'faq', name: 'FAQ' },
  { key: 'doc', name: '产品文档' }
]
