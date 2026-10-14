<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
const route = useRoute()
const router = useRouter()

const tabs = computed(() => app.visitedTabs)
const active = computed(() => route.fullPath)

function onClick(path: string) {
  if (path !== active.value) router.push(path)
}

function onClose(path: string) {
  const next = app.removeTab(path)
  if (route.fullPath === path && next) router.push(next)
}

function refresh() {
  // hash 路由下直接刷新即可保持当前页面
  window.location.reload()
}

function closeOthers() {
  app.closeOtherTabs(route.fullPath)
}
</script>

<template>
  <div class="tab-bar">
    <el-scrollbar>
      <div class="tab-bar__list">
        <div
          v-for="tab in tabs"
          :key="tab.path"
          class="tab-bar__item"
          :class="{ 'is-active': tab.path === active }"
          @click="onClick(tab.path)"
          @contextmenu.prevent="closeOthers"
        >
          <span class="tab-bar__dot" />
          <span class="tab-bar__title">{{ tab.title }}</span>
          <el-icon v-if="tab.closable" class="tab-bar__close" @click.stop="onClose(tab.path)">
            <component :is="'Close'" />
          </el-icon>
        </div>
      </div>
    </el-scrollbar>
    <el-tooltip content="刷新当前页" placement="bottom">
      <el-icon class="tab-bar__action" @click="refresh"><component :is="'Refresh'" /></el-icon>
    </el-tooltip>
    <el-tooltip content="关闭其他标签" placement="bottom">
      <el-icon class="tab-bar__action" @click="closeOthers"><component :is="'CircleClose'" /></el-icon>
    </el-tooltip>
  </div>
</template>

<style scoped>
.tab-bar {
  height: var(--vc-tabbar-height);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.tab-bar :deep(.el-scrollbar) {
  flex: 1;
  min-width: 0;
}

.tab-bar__list {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 0;
}

.tab-bar__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-bar__item:hover {
  color: var(--el-color-primary);
}

.tab-bar__item.is-active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

.tab-bar__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.5;
}

.tab-bar__item.is-active .tab-bar__dot {
  opacity: 1;
}

.tab-bar__close {
  font-size: 12px;
  opacity: 0.6;
}

.tab-bar__close:hover {
  opacity: 1;
  color: var(--vc-danger);
}

.tab-bar__action {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
}

.tab-bar__action:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}
</style>
