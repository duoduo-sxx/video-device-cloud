/**
 * 侧边菜单结构（与 router 中的 permission 保持一致）
 */
export interface MenuNode {
  title: string
  path: string
  icon?: string
  permission?: string
  children?: MenuNode[]
}

export const MENUS: MenuNode[] = [
  { title: '数据驾驶舱', path: '/dashboard', icon: 'Odometer', permission: 'dashboard' },
  {
    title: '设备中心',
    path: '/device',
    icon: 'VideoCamera',
    permission: 'device',
    children: [
      { title: '设备列表', path: '/device', permission: 'device' },
      { title: '固件与 OTA 升级', path: '/device/firmware', permission: 'device' }
    ]
  },
  {
    title: '告警与事件中心',
    path: '/alarm',
    icon: 'Bell',
    permission: 'alarm',
    children: [
      { title: '告警列表', path: '/alarm', permission: 'alarm' },
      { title: '告警规则与通知', path: '/alarm/rules', permission: 'alarm' },
      { title: '告警看板', path: '/alarm/board', permission: 'alarm' }
    ]
  },
  { title: '云存储服务', path: '/storage', icon: 'FolderOpened', permission: 'storage' },
  { title: '视频与流媒体', path: '/video', icon: 'Film', permission: 'video' },
  { title: 'AI 智能分析', path: '/ai', icon: 'MagicStick', permission: 'ai' },
  {
    title: '技术服务与工单',
    path: '/service',
    icon: 'Tools',
    permission: 'service',
    children: [
      { title: '工单管理', path: '/service', permission: 'service' },
      { title: '工单看板', path: '/service/kanban', permission: 'service' }
    ]
  },
  { title: '运维监控', path: '/monitor', icon: 'Monitor', permission: 'monitor' },
  { title: '开放平台', path: '/openapi', icon: 'Connection', permission: 'openapi' },
  { title: '租户与权限', path: '/tenant', icon: 'OfficeBuilding', permission: 'tenant' },
  { title: '计费与账务', path: '/billing', icon: 'Money', permission: 'billing' },
  { title: '系统设置', path: '/system', icon: 'Setting', permission: 'system' }
]

/** 面包屑：路径 -> 中文标题 */
export const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': '数据驾驶舱',
  '/device': '设备中心 / 设备列表',
  '/device/firmware': '设备中心 / 固件与 OTA 升级',
  '/alarm': '告警与事件中心 / 告警列表',
  '/alarm/rules': '告警与事件中心 / 告警规则与通知',
  '/alarm/board': '告警与事件中心 / 告警看板',
  '/storage': '云存储服务',
  '/video': '视频与流媒体',
  '/ai': 'AI 智能分析',
  '/service': '技术服务与工单 / 工单管理',
  '/service/kanban': '技术服务与工单 / 工单看板',
  '/monitor': '运维监控',
  '/openapi': '开放平台',
  '/tenant': '租户与权限',
  '/billing': '计费与账务',
  '/system': '系统设置',
  '/profile': '个人中心'
}
