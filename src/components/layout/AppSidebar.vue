<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  Gauge,
  Headphones,
  LayoutDashboard,
  LayoutTemplate,
  Library,
  ListVideo,
  Settings,
  Sparkles
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useDataStore } from '@/stores/data'

const app = useAppStore()
const data = useDataStore()
const route = useRoute()
const router = useRouter()

const collapsed = computed(() => app.sidebarCollapsed)
const runningCount = computed(() => data.runningTasks.length + data.queuedTasks.length)

interface NavItem {
  label: string
  path: string
  icon: unknown
  badge?: number
  match: string
}

const groups = computed<{ title: string; items: NavItem[] }[]>(() => [
  {
    title: '总览',
    items: [{ label: '工作台', path: '/dashboard', icon: LayoutDashboard, match: '/dashboard' }]
  },
  {
    title: '生产',
    items: [
      { label: '素材库', path: '/library', icon: Library, match: '/library' },
      { label: '增强任务', path: '/tasks/list', icon: ListVideo, badge: runningCount.value, match: '/tasks' },
      { label: '质量评估', path: '/quality', icon: Gauge, match: '/quality' }
    ]
  },
  {
    title: '能力',
    items: [
      { label: '能力与模型', path: '/capabilities', icon: Sparkles, match: '/capabilities' },
      { label: '模板中心', path: '/templates', icon: LayoutTemplate, match: '/templates' }
    ]
  },
  {
    title: '运营',
    items: [
      { label: '数据报表', path: '/analytics', icon: BarChart3, match: '/analytics' },
      { label: '技术服务', path: '/service/overview', icon: Headphones, match: '/service' }
    ]
  }
])

function isActive(match: string): boolean {
  return route.path === match || route.path.startsWith(match + '/')
}

const settingsActive = computed(() => route.path.startsWith('/settings'))
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="brand" @click="router.push('/dashboard')">
      <div class="logo">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
          <path d="M8.5 6.5v11l9-5.5-9-5.5z" fill="#fff" />
        </svg>
      </div>
      <div v-if="!collapsed" class="brand-text">
        <div class="brand-name">VidClear</div>
        <div class="brand-sub">Studio · 画质增强</div>
      </div>
    </div>

    <nav class="nav">
      <div v-for="g in groups" :key="g.title" class="group">
        <div v-if="!collapsed" class="group-title">{{ g.title }}</div>
        <div v-else class="group-line" />
        <button
          v-for="item in g.items"
          :key="item.path"
          class="nav-item"
          :class="{ active: isActive(item.match) }"
          :title="collapsed ? item.label : undefined"
          @click="router.push(item.path)"
        >
          <component :is="item.icon" :size="17" class="nav-icon" />
          <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
          <span v-if="!collapsed && item.badge" class="nav-badge">{{ item.badge }}</span>
        </button>
      </div>
    </nav>

    <div class="bottom">
      <button
        class="nav-item"
        :class="{ active: settingsActive }"
        :title="collapsed ? '系统设置' : undefined"
        @click="router.push('/settings/profile')"
      >
        <Settings :size="17" class="nav-icon" />
        <span v-if="!collapsed" class="nav-label">系统设置</span>
      </button>

      <div class="user-card" :class="{ mini: collapsed }">
        <div class="avatar">{{ data.currentUser.avatar }}</div>
        <div v-if="!collapsed" class="user-meta">
          <div class="user-name">{{ data.currentUser.name }}</div>
          <div class="user-role">{{ data.currentUser.role }}</div>
        </div>
      </div>

      <button class="collapse" :aria-label="collapsed ? '展开侧栏' : '折叠侧栏'" @click="app.toggleSidebar()">
        <ChevronsRight v-if="collapsed" :size="15" />
        <ChevronsLeft v-else :size="15" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  flex: none;
  height: 100%;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width 0.22s var(--ease);
  overflow: hidden;
  z-index: 30;
}
.sidebar.collapsed {
  width: var(--sidebar-w-collapsed);
}
.brand {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  flex: none;
  cursor: pointer;
}
.sidebar.collapsed .brand {
  padding: 0;
  justify-content: center;
}
.logo {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--gradient);
  display: grid;
  place-items: center;
  flex: none;
  box-shadow: 0 2px 10px rgba(79, 124, 255, 0.32);
}
.brand-name {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-1);
  line-height: 1.15;
}
.brand-sub {
  font-size: 10px;
  color: var(--text-3);
  letter-spacing: 0.02em;
}
.nav {
  flex: 1;
  overflow-y: auto;
  padding: 6px 10px 10px;
}
.sidebar.collapsed .nav {
  padding: 6px 10px;
}
.group {
  margin-bottom: 14px;
}
.group-title {
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-3);
  padding: 6px 10px;
  font-weight: 500;
}
.group-line {
  height: 1px;
  background: var(--border);
  margin: 8px 10px 10px;
}
.nav-item {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  border-radius: 8px;
  color: var(--text-2);
  font-size: 13px;
  position: relative;
  transition: background 0.14s var(--ease), color 0.14s var(--ease);
  margin-bottom: 2px;
}
.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0;
}
.nav-item:hover {
  background: var(--bg-card-hover);
  color: var(--text-1);
}
.nav-item.active {
  background: var(--primary-soft);
  color: var(--text-1);
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  bottom: 9px;
  width: 2.5px;
  border-radius: 2px;
  background: var(--gradient);
}
.sidebar.collapsed .nav-item.active::before {
  left: -10px;
}
.nav-icon {
  flex: none;
  opacity: 0.85;
}
.nav-item.active .nav-icon {
  color: var(--primary);
  opacity: 1;
}
.nav-label {
  flex: 1;
  text-align: left;
  white-space: nowrap;
}
.nav-badge {
  min-width: 18px;
  height: 17px;
  padding: 0 5px;
  border-radius: 99px;
  background: var(--primary-soft-2);
  color: var(--primary);
  font-size: 10.5px;
  display: grid;
  place-items: center;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.bottom {
  flex: none;
  padding: 8px 10px 12px;
  border-top: 1px solid var(--border);
}
.user-card {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 6px;
  margin-top: 4px;
  border-radius: 8px;
}
.user-card.mini {
  justify-content: center;
  padding: 8px 0;
}
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #2c3a5e, #1c2438);
  border: 1px solid var(--border-strong);
  display: grid;
  place-items: center;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-1);
  flex: none;
  letter-spacing: 0.02em;
}
.user-meta {
  min-width: 0;
}
.user-name {
  font-size: 12.5px;
  color: var(--text-1);
  line-height: 1.3;
}
.user-role {
  font-size: 10.5px;
  color: var(--text-3);
}
.collapse {
  width: 100%;
  height: 26px;
  display: grid;
  place-items: center;
  color: var(--text-3);
  border-radius: 6px;
  margin-top: 4px;
}
.collapse:hover {
  background: var(--bg-card-hover);
  color: var(--text-2);
}
</style>
