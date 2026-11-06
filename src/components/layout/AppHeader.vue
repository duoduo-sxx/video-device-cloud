<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, ChevronDown, Command, Moon, Plus, RotateCcw, Search, Sun } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useDataStore } from '@/stores/data'

const app = useAppStore()
const data = useDataStore()
const route = useRoute()
const router = useRouter()

const title = computed(() => (route.meta.title as string) || '工作台')
const breadcrumb = computed(() => (route.meta.group as string) || '')
const gpuLoad = computed(() => 76 - (data.runningTasks.length ? 0 : 6))

const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function onDocDown(e: MouseEvent) {
  if (!menuOpen.value) return
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) menuOpen.value = false
}
onMounted(() => document.addEventListener('mousedown', onDocDown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocDown))

function resetDemo() {
  data.resetDemo()
  menuOpen.value = false
  app.toast('success', '演示数据已重置', '所有本地修改已清空，恢复为初始种子数据')
}
</script>

<template>
  <header class="header">
    <div class="left">
      <span class="crumb">{{ breadcrumb }}</span>
      <span v-if="breadcrumb" class="sep">/</span>
      <span class="title">{{ title }}</span>
    </div>

    <div class="right">
      <button class="search" @click="app.commandOpen = true">
        <Search :size="14" />
        <span class="ph">搜索素材、任务、页面…</span>
        <kbd><Command :size="10" />K</kbd>
      </button>

      <div class="gpu" :title="`GPU 平均利用率 ${gpuLoad}%`">
        <div class="gpu-bar"><div class="gpu-fill" :style="{ width: gpuLoad + '%' }" /></div>
        <span class="num">GPU {{ gpuLoad }}%</span>
      </div>

      <button class="btn btn-primary btn-sm new-btn" @click="router.push('/tasks/new')">
        <Plus :size="14" />
        新建任务
      </button>

      <button class="icon-btn" aria-label="通知" @click="app.notifOpen = true">
        <Bell :size="17" />
        <span v-if="data.unreadCount" class="red-dot">{{ data.unreadCount }}</span>
      </button>

      <div ref="menuRef" class="user-wrap">
        <button class="user-btn" @click="menuOpen = !menuOpen">
          <span class="avatar">{{ data.currentUser.avatar }}</span>
          <ChevronDown :size="13" class="chev" />
        </button>
        <Transition name="menu">
          <div v-if="menuOpen" class="menu">
            <div class="menu-head">
              <div class="menu-name">{{ data.currentUser.name }}</div>
              <div class="menu-mail">{{ data.currentUser.email }}</div>
              <span class="tag tag-primary plan">{{ data.currentUser.plan }}</span>
            </div>
            <div class="divider" />
            <button class="menu-item" @click="app.toggleTheme(); menuOpen = false">
              <Sun v-if="app.theme === 'dark'" :size="14" />
              <Moon v-else :size="14" />
              {{ app.theme === 'dark' ? '切换浅色主题' : '切换深色主题' }}
            </button>
            <button class="menu-item" @click="resetDemo">
              <RotateCcw :size="14" />
              重置演示数据
            </button>
            <div class="divider" />
            <button class="menu-item" @click="router.push('/settings/profile'); menuOpen = false">
              <span class="dot" style="background: var(--text-3)" />
              个人资料
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  height: var(--header-h);
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 20px 0 24px;
  background: var(--bg-app);
  border-bottom: 1px solid var(--border);
  z-index: 20;
}
.left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.crumb {
  font-size: 11.5px;
  color: var(--text-3);
}
.sep {
  font-size: 11px;
  color: var(--text-3);
  opacity: 0.6;
}
.title {
  font-size: 13.5px;
  color: var(--text-1);
  font-weight: 500;
  white-space: nowrap;
}
.right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 234px;
  height: 32px;
  padding: 0 8px 0 11px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-3);
  font-size: 12.5px;
  transition: border-color 0.14s, background 0.14s;
}
.search:hover {
  border-color: var(--border-strong);
  background: var(--bg-card-hover);
}
.ph {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
kbd {
  display: flex;
  align-items: center;
  gap: 1px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-3);
  background: var(--bg-inset);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 4px;
}
.gpu {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--bg-card);
}
.gpu-bar {
  width: 44px;
  height: 3px;
  background: var(--border);
  border-radius: 99px;
  overflow: hidden;
}
.gpu-fill {
  height: 100%;
  background: var(--gradient);
  border-radius: 99px;
  transition: width 0.6s var(--ease);
}
.gpu .num {
  font-size: 10.5px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}
.icon-btn {
  position: relative;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--text-2);
  border: 1px solid transparent;
}
.icon-btn:hover {
  background: var(--bg-card);
  border-color: var(--border);
  color: var(--text-1);
}
.red-dot {
  position: absolute;
  top: 3px;
  right: 2px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 99px;
  background: var(--danger);
  color: #fff;
  font-size: 9px;
  display: grid;
  place-items: center;
  font-weight: 600;
  border: 2px solid var(--bg-app);
}
.user-wrap {
  position: relative;
}
.user-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 5px 3px 3px;
  border-radius: 8px;
  border: 1px solid transparent;
}
.user-btn:hover {
  background: var(--bg-card);
  border-color: var(--border);
}
.avatar {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: linear-gradient(135deg, #2c3a5e, #1c2438);
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-1);
}
.chev {
  color: var(--text-3);
}
.menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 232px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  box-shadow: var(--shadow-pop);
  padding: 6px;
  z-index: 100;
}
.menu-head {
  padding: 10px 10px 12px;
  position: relative;
}
.menu-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-1);
}
.menu-mail {
  font-size: 11.5px;
  color: var(--text-3);
  margin-top: 2px;
}
.plan {
  margin-top: 8px;
  display: inline-flex;
}
.menu-item {
  width: 100%;
  height: 34px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 12.5px;
  color: var(--text-2);
  text-align: left;
}
.menu-item:hover {
  background: var(--bg-card-hover);
  color: var(--text-1);
}
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.14s var(--ease), transform 0.14s var(--ease);
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
