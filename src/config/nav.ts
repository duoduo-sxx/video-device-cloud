export interface NavItem {
  title: string
  path: string
  icon: string
}

export interface NavGroup {
  title: string
  icon: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: '资源管理',
    icon: 'Coin',
    items: [
      { title: '存储集群', path: '/resources/clusters', icon: 'Grid' },
      { title: '存储池', path: '/resources/pools', icon: 'Files' },
      { title: '设备台账', path: '/resources/devices', icon: 'Cpu' },
      { title: '卷与文件系统', path: '/resources/volumes', icon: 'FolderOpened' }
    ]
  },
  {
    title: '监控告警',
    icon: 'Monitor',
    items: [
      { title: '告警中心', path: '/monitor/alarms', icon: 'Warning' },
      { title: '巡检管理', path: '/monitor/inspections', icon: 'Search' }
    ]
  },
  {
    title: '技术服务',
    icon: 'Service',
    items: [
      { title: '服务目录', path: '/service/catalog', icon: 'Collection' },
      { title: '工单管理', path: '/service/tickets', icon: 'Tickets' },
      { title: '工单看板', path: '/service/board', icon: 'Management' },
      { title: '变更管理', path: '/service/changes', icon: 'SetUp' },
      { title: '知识库', path: '/service/knowledge', icon: 'Notebook' },
      { title: '备件管理', path: '/service/spares', icon: 'Box' },
      { title: '服务合同', path: '/service/contracts', icon: 'Document' },
      { title: '值班排班', path: '/service/duty', icon: 'Calendar' }
    ]
  },
  {
    title: '客户与机房',
    icon: 'OfficeBuilding',
    items: [
      { title: '客户管理', path: '/customers', icon: 'User' },
      { title: '机房管理', path: '/customers/datacenters', icon: 'MapLocation' }
    ]
  },
  {
    title: '统计报表',
    icon: 'DataAnalysis',
    items: [
      { title: '容量分析', path: '/reports/capacity', icon: 'PieChart' },
      { title: '服务质量分析', path: '/reports/service', icon: 'TrendCharts' }
    ]
  },
  {
    title: '系统管理',
    icon: 'Setting',
    items: [
      { title: '用户管理', path: '/system/users', icon: 'UserFilled' },
      { title: '角色权限', path: '/system/roles', icon: 'Key' },
      { title: '参数配置', path: '/system/settings', icon: 'Operation' },
      { title: '操作日志', path: '/system/logs', icon: 'List' }
    ]
  }
]
