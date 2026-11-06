<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="logo">
      <svg class="mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="26" height="7" rx="3" fill="#1668DC" />
        <rect x="3" y="12.5" width="26" height="7" rx="3" fill="#3C89E8" opacity="0.9" />
        <rect x="3" y="21" width="26" height="7" rx="3" fill="#13C2C2" opacity="0.9" />
        <circle cx="7.5" cy="7.5" r="1.4" fill="#fff" />
        <circle cx="7.5" cy="16" r="1.4" fill="#fff" />
        <circle cx="7.5" cy="24.5" r="1.4" fill="#fff" />
      </svg>
      <div v-if="!collapsed" class="logo-text">
        <div class="logo-name">储维台</div>
        <div class="logo-sub">StorageOps Console</div>
      </div>
    </div>

    <div class="nav-scroll">
      <el-tooltip content="工作台" placement="right" :disabled="!collapsed">
        <router-link to="/dashboard" class="nav-item" :class="{ active: isActive('/dashboard') }">
          <el-icon :size="17"><Odometer /></el-icon>
          <span v-if="!collapsed" class="nav-text">工作台</span>
        </router-link>
      </el-tooltip>

      <div v-for="group in NAV_GROUPS" :key="group.title" class="nav-group">
        <div v-if="!collapsed" class="group-title" @click="toggleGroup(group.title)">
          <el-icon :size="14"><component :is="group.icon" /></el-icon>
          <span>{{ group.title }}</span>
          <el-icon class="caret" :class="{ open: isOpen(group.title) }" :size="12"><ArrowRight /></el-icon>
        </div>
        <div v-else class="group-divider" />
        <div v-show="collapsed || isOpen(group.title)" class="group-items">
          <el-tooltip v-for="item in group.items" :key="item.path" :content="item.title" placement="right" :disabled="!collapsed">
            <router-link :to="item.path" class="nav-item sub" :class="{ active: isActive(item.path) }">
              <el-icon :size="16"><component :is="item.icon" /></el-icon>
              <span v-if="!collapsed" class="nav-text">{{ item.title }}</span>
            </router-link>
          </el-tooltip>
        </div>
      </div>
    </div>

    <div class="sidebar-foot" v-if="!collapsed">
      <div class="foot-dot" />
      <span>Mock 演示环境 · v1.0.0</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NAV_GROUPS } from '@/config/nav'

const props = defineProps<{ collapsed: boolean }>()
const route = useRoute()

const openMap = ref<Record<string, boolean>>({})

const currentGroup = computed(() => {
  const g = NAV_GROUPS.find((group) => group.items.some((i) => route.path === i.path || route.path.startsWith(`${i.path}/`)))
  return g?.title
})

watch(
  currentGroup,
  (val) => {
    if (val) openMap.value[val] = true
  },
  { immediate: true }
)

NAV_GROUPS.forEach((g) => {
  if (openMap.value[g.title] === undefined) openMap.value[g.title] = true
})

function isOpen(title: string) {
  return openMap.value[title] !== false
}

function toggleGroup(title: string) {
  openMap.value[title] = !isOpen(title)
}

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 232px;
  background: #101b2d;
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: width 0.18s ease;
}

.sidebar.collapsed {
  width: 64px;
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  flex: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar.collapsed .logo {
  padding: 0;
  justify-content: center;
}

.mark {
  width: 26px;
  height: 26px;
  flex: none;
}

.logo-name {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 1px;
}

.logo-sub {
  color: #6f7d93;
  font-size: 9px;
  letter-spacing: 0.4px;
  line-height: 12px;
  transform: scale(0.92);
  transform-origin: left;
}

.nav-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 0;
}

.nav-scroll::-webkit-scrollbar {
  width: 4px;
}

.nav-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 12px;
  margin: 2px 10px;
  border-radius: 6px;
  color: #9faabd;
  font-size: 13.5px;
  transition: background 0.14s ease, color 0.14s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #e8eefc;
}

.nav-item.active {
  background: rgba(22, 104, 220, 0.22);
  color: #fff;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 9px;
  bottom: 9px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: #1668dc;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0;
  margin: 3px 12px;
}

.nav-text {
  white-space: nowrap;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 12px;
  margin: 6px 10px 2px;
  color: #6f7d93;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  border-radius: 6px;
}

.group-title:hover {
  color: #aab6c8;
}

.group-title span {
  flex: 1;
}

.caret {
  transition: transform 0.16s ease;
}

.caret.open {
  transform: rotate(90deg);
}

.group-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.07);
  margin: 8px 14px;
}

.group-items {
  overflow: hidden;
}

.sidebar-foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  color: #64718a;
  font-size: 11px;
}

.foot-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
}
</style>
