export type Role = 'admin' | 'lead' | 'engineer' | 'qc' | 'client'

export const ROLE_META: Record<Role, { label: string; desc: string }> = {
  admin: { label: '管理员', desc: '平台全部权限，含成员与计费' },
  lead: { label: '技术负责人', desc: '业务全流程，不含成员权限' },
  engineer: { label: '修复工程师', desc: '执行检测、方案编排与修复' },
  qc: { label: '质检员', desc: '检测、验收、报告与规则维护' },
  client: { label: '客户', desc: '只读数据、提交需求与验收' },
}

export type Action =
  | 'asset.upload'
  | 'asset.delete'
  | 'detection.create'
  | 'repair.edit'
  | 'repair.run'
  | 'review.sign'
  | 'report.issue'
  | 'rule.edit'
  | 'member.manage'
  | 'billing.view'

const MATRIX: Record<Action, Role[]> = {
  'asset.upload': ['admin', 'lead', 'engineer', 'client'],
  'asset.delete': ['admin', 'lead', 'engineer'],
  'detection.create': ['admin', 'lead', 'engineer', 'qc', 'client'],
  'repair.edit': ['admin', 'lead', 'engineer'],
  'repair.run': ['admin', 'lead', 'engineer'],
  'review.sign': ['admin', 'lead', 'qc', 'client'],
  'report.issue': ['admin', 'lead', 'qc'],
  'rule.edit': ['admin', 'lead', 'qc'],
  'member.manage': ['admin'],
  'billing.view': ['admin', 'lead', 'client'],
}

export function can(role: Role, action: Action): boolean {
  return MATRIX[action].includes(role)
}

export const PERMISSION_ITEMS: { action: Action; label: string }[] = [
  { action: 'asset.upload', label: '上传素材' },
  { action: 'asset.delete', label: '删除素材' },
  { action: 'detection.create', label: '创建检测任务' },
  { action: 'repair.edit', label: '编辑修复方案' },
  { action: 'repair.run', label: '执行修复' },
  { action: 'review.sign', label: '验收签署' },
  { action: 'report.issue', label: '出具报告' },
  { action: 'rule.edit', label: '规则与阈值编辑' },
  { action: 'member.manage', label: '成员与权限管理' },
  { action: 'billing.view', label: '查看计费与账单' },
]

export function permissionOf(action: Action, role: Role): boolean {
  return MATRIX[action].includes(role)
}
