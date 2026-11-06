import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('@/views/Login.vue'), meta: { title: '登录', public: true } },
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '工作台', group: '概览', icon: 'Odometer', permission: 'dashboard:view' } },

      { path: 'resources/clusters', component: () => import('@/views/resource/Clusters.vue'), meta: { title: '存储集群', group: '资源管理', permission: 'resource:read' } },
      { path: 'resources/clusters/:id', component: () => import('@/views/resource/ClusterDetail.vue'), meta: { title: '集群详情', group: '资源管理', parent: '/resources/clusters', parentTitle: '存储集群', permission: 'resource:read', hidden: true } },
      { path: 'resources/pools', component: () => import('@/views/resource/Pools.vue'), meta: { title: '存储池', group: '资源管理', permission: 'resource:read' } },
      { path: 'resources/devices', component: () => import('@/views/resource/Devices.vue'), meta: { title: '设备台账', group: '资源管理', permission: 'resource:read' } },
      { path: 'resources/devices/:id', component: () => import('@/views/resource/DeviceDetail.vue'), meta: { title: '设备详情', group: '资源管理', parent: '/resources/devices', parentTitle: '设备台账', permission: 'resource:read', hidden: true } },
      { path: 'resources/volumes', component: () => import('@/views/resource/Volumes.vue'), meta: { title: '卷与文件系统', group: '资源管理', permission: 'resource:read' } },

      { path: 'monitor/alarms', component: () => import('@/views/monitor/Alarms.vue'), meta: { title: '告警中心', group: '监控告警', permission: 'alarm:read' } },
      { path: 'monitor/inspections', component: () => import('@/views/monitor/Inspections.vue'), meta: { title: '巡检管理', group: '监控告警', permission: 'alarm:read' } },

      { path: 'service/catalog', component: () => import('@/views/service/Catalog.vue'), meta: { title: '服务目录', group: '技术服务', permission: 'ticket:read' } },
      { path: 'service/tickets', component: () => import('@/views/service/Tickets.vue'), meta: { title: '工单管理', group: '技术服务', permission: 'ticket:read' } },
      { path: 'service/tickets/new', component: () => import('@/views/service/TicketNew.vue'), meta: { title: '新建工单', group: '技术服务', parent: '/service/tickets', parentTitle: '工单管理', permission: 'ticket:create' } },
      { path: 'service/tickets/:id', component: () => import('@/views/service/TicketDetail.vue'), meta: { title: '工单详情', group: '技术服务', parent: '/service/tickets', parentTitle: '工单管理', permission: 'ticket:read', hidden: true } },
      { path: 'service/board', component: () => import('@/views/service/Board.vue'), meta: { title: '工单看板', group: '技术服务', permission: 'ticket:read' } },
      { path: 'service/changes', component: () => import('@/views/service/Changes.vue'), meta: { title: '变更管理', group: '技术服务', permission: 'ticket:read' } },
      { path: 'service/knowledge', component: () => import('@/views/service/Knowledge.vue'), meta: { title: '知识库', group: '技术服务', permission: 'knowledge:read' } },
      { path: 'service/knowledge/:id', component: () => import('@/views/service/KnowledgeDetail.vue'), meta: { title: '文章详情', group: '技术服务', parent: '/service/knowledge', parentTitle: '知识库', permission: 'knowledge:read', hidden: true } },
      { path: 'service/spares', component: () => import('@/views/service/Spares.vue'), meta: { title: '备件管理', group: '技术服务', permission: 'spare:read' } },
      { path: 'service/contracts', component: () => import('@/views/service/Contracts.vue'), meta: { title: '服务合同', group: '技术服务', permission: 'contract:read' } },
      { path: 'service/contracts/:id', component: () => import('@/views/service/ContractDetail.vue'), meta: { title: '合同详情', group: '技术服务', parent: '/service/contracts', parentTitle: '服务合同', permission: 'contract:read', hidden: true } },
      { path: 'service/reports', component: () => import('@/views/service/Reports.vue'), meta: { title: '服务报告', group: '技术服务', permission: 'report:view' } },
      { path: 'service/duty', component: () => import('@/views/service/Duty.vue'), meta: { title: '值班排班', group: '技术服务', permission: 'ticket:read' } },

      { path: 'customers', component: () => import('@/views/customer/Customers.vue'), meta: { title: '客户管理', group: '客户与机房', permission: 'customer:read' } },
      { path: 'customers/datacenters', component: () => import('@/views/customer/Datacenters.vue'), meta: { title: '机房管理', group: '客户与机房', permission: 'customer:read' } },
      { path: 'customers/:id', component: () => import('@/views/customer/CustomerDetail.vue'), meta: { title: '客户详情', group: '客户与机房', parent: '/customers', parentTitle: '客户管理', permission: 'customer:read', hidden: true } },

      { path: 'reports/capacity', component: () => import('@/views/report/Capacity.vue'), meta: { title: '容量分析', group: '统计报表', permission: 'report:view' } },
      { path: 'reports/service', component: () => import('@/views/service/Reports.vue'), meta: { title: '服务质量分析', group: '统计报表', permission: 'report:view' } },

      { path: 'system/users', component: () => import('@/views/system/Users.vue'), meta: { title: '用户管理', group: '系统管理', permission: 'system:manage' } },
      { path: 'system/roles', component: () => import('@/views/system/Roles.vue'), meta: { title: '角色权限', group: '系统管理', permission: 'system:manage' } },
      { path: 'system/settings', component: () => import('@/views/system/Settings.vue'), meta: { title: '参数配置', group: '系统管理', permission: 'system:manage' } },
      { path: 'system/logs', component: () => import('@/views/system/Logs.vue'), meta: { title: '操作日志', group: '系统管理', permission: 'system:manage' } },

      { path: 'messages', component: () => import('@/views/Messages.vue'), meta: { title: '消息中心', group: '个人中心', hidden: true } },
      { path: 'profile', component: () => import('@/views/Profile.vue'), meta: { title: '个人设置', group: '个人中心', hidden: true } },

      { path: '403', component: () => import('@/views/error/Forbidden.vue'), meta: { title: '无访问权限', hidden: true } }
    ]
  },
  { path: '/:pathMatch(.*)*', component: () => import('@/views/error/NotFound.vue'), meta: { title: '页面不存在', hidden: true } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  const store = useUserStore()
  document.title = `${to.meta.title ?? '控制台'} · 数据存储系统与技术服务`
  if (to.meta.public) {
    if (store.isLogin && to.path === '/login') return { path: '/dashboard' }
    return true
  }
  if (!store.isLogin) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  const perm = to.meta.permission as string | undefined
  if (perm && !store.has(perm)) return { path: '/403' }
  return true
})

export default router
