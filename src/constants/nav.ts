import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardCheck,
  Cpu,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Info,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/types'

export interface NavItem {
  key: string
  label: string
  path: string
  icon: LucideIcon
  roles?: Role[]
  badge?: 'alerts' | 'tasks' | 'tickets'
}

export interface NavGroup {
  key: string
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    label: '态势',
    items: [
      { key: 'dashboard', label: '态势总览', path: '/', icon: LayoutDashboard },
      { key: 'analytics', label: '数据分析', path: '/analytics', icon: BarChart3, roles: ['operator', 'engineer', 'manager'] },
    ],
  },
  {
    key: 'control',
    label: '控制',
    items: [
      { key: 'interaction', label: '多模态交互', path: '/interaction', icon: MessagesSquare },
      { key: 'devices', label: '设备与空间', path: '/devices', icon: Cpu },
      { key: 'scenes', label: '场景编排', path: '/scenes', icon: Sparkles, roles: ['operator', 'engineer', 'manager'] },
      { key: 'tasks', label: '任务与自动化', path: '/tasks', icon: ListChecks, badge: 'tasks' },
      { key: 'alerts', label: '告警与事件', path: '/alerts', icon: AlertTriangle, badge: 'alerts' },
    ],
  },
  {
    key: 'service',
    label: '服务',
    items: [
      { key: 'service', label: '技术服务', path: '/service', icon: LifeBuoy, badge: 'tickets' },
      { key: 'kb', label: '知识库', path: '/service?tab=kb', icon: Boxes },
    ],
  },
  {
    key: 'admin',
    label: '管理',
    items: [
      { key: 'users', label: '用户管理', path: '/admin/users', icon: Users, roles: ['manager'] },
      { key: 'roles', label: '权限矩阵', path: '/admin/roles', icon: KeyRound, roles: ['manager'] },
      { key: 'audit', label: '审计日志', path: '/admin/audit', icon: ShieldCheck, roles: ['manager', 'engineer'] },
      { key: 'settings', label: '系统设置', path: '/settings', icon: Settings },
      { key: 'about', label: '关于系统', path: '/about', icon: Info },
    ],
  },
]

export const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  '/': { title: '态势总览', sub: '全域设备、交互与服务运行状况实时汇总' },
  '/analytics': { title: '数据分析', sub: '交互、设备与服务效能的多维分析' },
  '/interaction': { title: '多模态交互中心', sub: '语音、文字与快捷指令驱动的统一控制入口' },
  '/devices': { title: '设备与空间', sub: '52 台在管设备的统一台账与控制' },
  '/scenes': { title: '场景编排', sub: '将多设备动作组织为一键可执行的场景' },
  '/tasks': { title: '任务与自动化', sub: '任务调度、执行追踪与自动化规则' },
  '/alerts': { title: '告警与事件', sub: '分级告警、处置流转与闭环跟踪' },
  '/service': { title: '技术服务', sub: '工单、服务目录、知识库与远程协助' },
  '/admin/users': { title: '用户管理', sub: '账号、角色与状态维护' },
  '/admin/roles': { title: '权限矩阵', sub: '按模块配置各角色的访问权限' },
  '/admin/audit': { title: '审计日志', sub: '近 7 天系统操作留痕与追溯' },
  '/settings': { title: '系统设置', sub: '常规、交互、告警与数据策略配置' },
  '/about': { title: '关于系统', sub: '版本信息、更新日志与开源许可' },
}

export const MODULE_PERMISSIONS = [
  { key: 'dashboard', label: '态势总览' },
  { key: 'interaction', label: '多模态交互' },
  { key: 'devices', label: '设备与空间' },
  { key: 'scenes', label: '场景编排' },
  { key: 'tasks', label: '任务与自动化' },
  { key: 'alerts', label: '告警与事件' },
  { key: 'service', label: '技术服务' },
  { key: 'analytics', label: '数据分析' },
  { key: 'users', label: '用户管理' },
  { key: 'roles', label: '权限矩阵' },
  { key: 'audit', label: '审计日志' },
  { key: 'settings', label: '系统设置' },
]

export const STATUS_ICON = Activity
export const CHECK_ICON = ClipboardCheck
