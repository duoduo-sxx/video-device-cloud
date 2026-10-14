<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { MENUS, type MenuNode } from './menu'

const route = useRoute()
const router = useRouter()
const app = useAppStore()
const user = useUserStore()

const menus = computed<MenuNode[]>(() => {
  const filter = (nodes: MenuNode[]): MenuNode[] =>
    nodes
      .filter((n) => !n.permission || user.hasPermission(n.permission))
      .map((n) => ({ ...n, children: n.children ? filter(n.children) : undefined }))
      .filter((n) => !n.children || n.children.length > 0)
  return filter(MENUS)
})

const activeMenu = computed(() => route.path)

function onSelect(path: string): void {
  if (path !== route.path) router.push(path)
}
</script>

<template>
  <aside class="side-menu" :class="{ 'is-collapsed': app.sidebarCollapsed }">
    <div class="side-menu__logo" @click="router.push('/dashboard')">
      <div class="side-menu__mark">
        <el-icon :size="18"><component :is="'VideoCameraFilled'" /></el-icon>
      </div>
      <div v-show="!app.sidebarCollapsed" class="side-menu__text">
        <strong>视频设备云</strong>
        <small>数据服务系统</small>
      </div>
    </div>

    <el-scrollbar class="side-menu__scroll">
      <el-menu
        :default-active="activeMenu"
        :collapse="app.sidebarCollapsed"
        :collapse-transition="false"
        unique-opened
        @select="onSelect"
      >
        <template v-for="menu in menus" :key="menu.path">
          <el-sub-menu v-if="menu.children && menu.children.length" :index="menu.path">
            <template #title>
              <el-icon><component :is="menu.icon || 'Menu'" /></el-icon>
              <span>{{ menu.title }}</span>
            </template>
            <el-menu-item v-for="child in menu.children" :key="child.path" :index="child.path">
              <span class="side-menu__child">{{ child.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="menu.path">
            <el-icon><component :is="menu.icon || 'Menu'" /></el-icon>
            <template #title>{{ menu.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>

    <div class="side-menu__footer" v-show="!app.sidebarCollapsed">
      <div class="side-menu__role">
        <span class="side-menu__dot" />
        {{ user.roleName }}
      </div>
      <div class="side-menu__tenant">{{ user.userInfo?.tenantName || '云视科技集团' }}</div>
    </div>
  </aside>
</template>

<style scoped>
.side-menu {
  width: var(--vc-sidebar-width);
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  transition: width 0.2s;
}

.side-menu.is-collapsed {
  width: var(--vc-sidebar-collapsed);
}

.side-menu__logo {
  height: var(--vc-header-height);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
}

.side-menu__mark {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1677ff, #4096ff);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.side-menu__text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  white-space: nowrap;
}

.side-menu__text strong {
  font-size: 14px;
  font-weight: 500;
}

.side-menu__text small {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.side-menu__scroll {
  flex: 1;
  min-height: 0;
}

.side-menu :deep(.el-menu) {
  border-right: none;
  padding: 8px;
}

.side-menu :deep(.el-menu-item),
.side-menu :deep(.el-sub-menu__title) {
  height: 40px;
  line-height: 40px;
  border-radius: 6px;
  margin-bottom: 2px;
  font-size: 13px;
}

.side-menu :deep(.el-menu-item.is-active) {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
}

.side-menu__child {
  font-size: 13px;
}

.side-menu__footer {
  padding: 10px 16px 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.side-menu__role {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.side-menu__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vc-success);
}

.side-menu__tenant {
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
