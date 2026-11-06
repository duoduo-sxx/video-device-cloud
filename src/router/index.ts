import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: '工作台', group: '总览' }
  },
  {
    path: '/library',
    name: 'library',
    component: () => import('@/views/LibraryView.vue'),
    meta: { title: '素材库', group: '生产' }
  },
  {
    path: '/library/:assetId',
    name: 'asset-detail',
    component: () => import('@/views/AssetDetailView.vue'),
    meta: { title: '素材详情', group: '素材库' }
  },
  {
    path: '/tasks/list',
    name: 'task-list',
    component: () => import('@/views/TaskListView.vue'),
    meta: { title: '增强任务', group: '生产' }
  },
  {
    path: '/tasks/new',
    name: 'task-new',
    component: () => import('@/views/TaskNewView.vue'),
    meta: { title: '新建增强任务', group: '增强任务' }
  },
  {
    path: '/tasks/:taskId/compare',
    name: 'task-compare',
    component: () => import('@/views/CompareView.vue'),
    meta: { title: '对比审片', group: '增强任务' }
  },
  {
    path: '/tasks/:taskId',
    name: 'task-detail',
    component: () => import('@/views/TaskDetailView.vue'),
    meta: { title: '任务详情', group: '增强任务' }
  },
  {
    path: '/capabilities',
    name: 'capabilities',
    component: () => import('@/views/CapabilitiesView.vue'),
    meta: { title: '能力与模型', group: '能力' }
  },
  {
    path: '/quality',
    name: 'quality',
    component: () => import('@/views/QualityView.vue'),
    meta: { title: '质量评估', group: '生产' }
  },
  {
    path: '/templates',
    name: 'templates',
    component: () => import('@/views/TemplatesView.vue'),
    meta: { title: '模板中心', group: '能力' }
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: () => import('@/views/AnalyticsView.vue'),
    meta: { title: '数据报表', group: '运营' }
  },
  {
    path: '/service/overview',
    name: 'service-overview',
    component: () => import('@/views/ServiceOverviewView.vue'),
    meta: { title: '技术服务', group: '运营' }
  },
  {
    path: '/service/tickets',
    name: 'service-tickets',
    component: () => import('@/views/TicketsView.vue'),
    meta: { title: '服务工单', group: '技术服务' }
  },
  {
    path: '/service/kb',
    name: 'service-kb',
    component: () => import('@/views/KbView.vue'),
    meta: { title: '知识库', group: '技术服务' }
  },
  {
    path: '/service/nodes',
    name: 'service-nodes',
    component: () => import('@/views/NodesView.vue'),
    meta: { title: '节点状态', group: '技术服务' }
  },
  {
    path: '/settings/:tab?',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: '系统设置', group: '设置' }
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
