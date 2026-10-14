import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'

export interface MenuMeta {
  title: string
  icon?: string
  permission?: string
  hidden?: boolean
  /** 是否出现在多标签页中 */
  noTab?: boolean
}

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/BasicLayout.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据驾驶舱', icon: 'Odometer', permission: 'dashboard' }
      },
      {
        path: 'device',
        name: 'DeviceList',
        component: () => import('@/views/device/index.vue'),
        meta: { title: '设备中心', icon: 'VideoCamera', permission: 'device' }
      },
      {
        path: 'device/detail/:id',
        name: 'DeviceDetail',
        component: () => import('@/views/device/detail.vue'),
        meta: { title: '设备详情', permission: 'device', hidden: true }
      },
      {
        path: 'device/firmware',
        name: 'DeviceFirmware',
        component: () => import('@/views/device/firmware.vue'),
        meta: { title: '固件与 OTA 升级', icon: 'Upload', permission: 'device' }
      },
      {
        path: 'alarm',
        name: 'AlarmCenter',
        component: () => import('@/views/alarm/index.vue'),
        meta: { title: '告警与事件中心', icon: 'Bell', permission: 'alarm' }
      },
      {
        path: 'alarm/rules',
        name: 'AlarmRules',
        component: () => import('@/views/alarm/rules.vue'),
        meta: { title: '告警规则与通知', icon: 'Setting', permission: 'alarm' }
      },
      {
        path: 'alarm/board',
        name: 'AlarmBoard',
        component: () => import('@/views/alarm/board.vue'),
        meta: { title: '告警看板', icon: 'DataAnalysis', permission: 'alarm' }
      },
      {
        path: 'storage',
        name: 'Storage',
        component: () => import('@/views/storage/index.vue'),
        meta: { title: '云存储服务', icon: 'FolderOpened', permission: 'storage' }
      },
      {
        path: 'video',
        name: 'Video',
        component: () => import('@/views/video/index.vue'),
        meta: { title: '视频与流媒体', icon: 'Film', permission: 'video' }
      },
      {
        path: 'ai',
        name: 'AiAnalysis',
        component: () => import('@/views/ai/index.vue'),
        meta: { title: 'AI 智能分析', icon: 'MagicStick', permission: 'ai' }
      },
      {
        path: 'service',
        name: 'Service',
        component: () => import('@/views/service/index.vue'),
        meta: { title: '技术服务与工单', icon: 'Tools', permission: 'service' }
      },
      {
        path: 'service/kanban',
        name: 'ServiceKanban',
        component: () => import('@/views/service/kanban.vue'),
        meta: { title: '工单看板', icon: 'Grid', permission: 'service' }
      },
      {
        path: 'monitor',
        name: 'Monitor',
        component: () => import('@/views/monitor/index.vue'),
        meta: { title: '运维监控', icon: 'Monitor', permission: 'monitor' }
      },
      {
        path: 'openapi',
        name: 'OpenApi',
        component: () => import('@/views/openapi/index.vue'),
        meta: { title: '开放平台', icon: 'Connection', permission: 'openapi' }
      },
      {
        path: 'tenant',
        name: 'Tenant',
        component: () => import('@/views/tenant/index.vue'),
        meta: { title: '租户与权限', icon: 'OfficeBuilding', permission: 'tenant' }
      },
      {
        path: 'billing',
        name: 'Billing',
        component: () => import('@/views/billing/index.vue'),
        meta: { title: '计费与账务', icon: 'Money', permission: 'billing' }
      },
      {
        path: 'system',
        name: 'System',
        component: () => import('@/views/system/index.vue'),
        meta: { title: '系统设置', icon: 'Setting', permission: 'system' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/system/profile.vue'),
        meta: { title: '个人中心', hidden: true, noTab: true }
      }
    ]
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { title: '无访问权限', hidden: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', hidden: true }
  }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

export function menuRoutes(): RouteRecordRaw[] {
  const layout = routes.find((r) => r.path === '/' && r.children)
  return (layout?.children || []) as RouteRecordRaw[]
}

router.beforeEach((to, _from, next) => {
  const user = useUserStore()
  const app = useAppStore()
  document.title = `${to.meta?.title || '视频设备云'} · 视频设备云数据服务系统`

  if (to.path === '/login') {
    if (user.isLogin) return next('/dashboard')
    return next()
  }

  if (!user.isLogin) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  const permission = to.meta?.permission as string | undefined
  if (permission && !user.hasPermission(permission)) {
    return next('/403')
  }

  if (!to.meta?.noTab && to.meta?.title && to.path !== '/login') {
    app.addTab({ path: to.fullPath, title: to.meta.title as string, closable: to.path !== '/dashboard' })
  }

  next()
})

export default router
