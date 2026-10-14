<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { systemApi } from '@/api'
import { BREADCRUMB_MAP } from './menu'
import { relativeTimeText } from '@/utils/format'
import type { MessageItem } from '@/types'

const app = useAppStore()
const user = useUserStore()
const route = useRoute()
const router = useRouter()

const messages = ref<MessageItem[]>([])
const unread = ref(0)

const breadcrumb = ref<string[]>([])

function updateBreadcrumb() {
  const mapped = BREADCRUMB_MAP[route.path]
  if (mapped) {
    breadcrumb.value = mapped.split(' / ')
  } else if (route.path.startsWith('/device/detail')) {
    breadcrumb.value = ['设备中心', '设备详情']
  } else {
    breadcrumb.value = [(route.meta?.title as string) || '首页']
  }
}

async function loadMessages() {
  const res = await systemApi.messages({ limit: 12 })
  messages.value = res.list || []
  unread.value = res.unread || 0
}

async function readAll() {
  await systemApi.readMessages([])
  ElMessage.success('已将全部消息标记为已读')
  loadMessages()
}

async function onMessageClick(msg: MessageItem) {
  await systemApi.readMessages([msg.id])
  loadMessages()
  if (msg.link) router.push(msg.link)
}

function toggleTheme() {
  app.setTheme(app.theme === 'dark' ? 'light' : 'dark')
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen()
  else document.documentElement.requestFullscreen?.()
}

async function resetDemo() {
  await ElMessageBox.confirm(
    '重置后，本机所有新增/修改/删除的数据都会被还原为初始演示数据，且无法恢复。是否继续？',
    '重置演示数据',
    { type: 'warning', confirmButtonText: '确认重置', cancelButtonText: '取消' }
  )
  await systemApi.resetDemo()
  ElMessage.success('演示数据已重置，页面即将刷新')
  setTimeout(() => window.location.reload(), 600)
}

async function onCommand(cmd: string) {
  if (cmd === 'logout') {
    await ElMessageBox.confirm('确认退出当前登录账号？', '退出登录', { type: 'warning' })
    await user.logout()
    router.push('/login')
    return
  }
  if (cmd === 'reset') return resetDemo()
  if (cmd === 'theme') return toggleTheme()
  if (cmd === 'profile') return router.push('/profile')
  if (cmd === 'about') return router.push('/system')
}

onMounted(() => {
  updateBreadcrumb()
  loadMessages()
})

import { watch } from 'vue'
watch(() => route.path, updateBreadcrumb, { immediate: true })
</script>

<template>
  <header class="header-bar">
    <div class="header-bar__left">
      <el-icon class="header-bar__icon-btn" @click="app.toggleSidebar()">
        <component :is="app.sidebarCollapsed ? 'Expand' : 'Fold'" />
      </el-icon>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="(b, i) in breadcrumb" :key="i">{{ b }}</el-breadcrumb-item>
      </el-breadcrumb>
      <el-tag v-if="user.isSuperAdmin" size="small" type="danger" effect="light" round>平台管理视角</el-tag>
    </div>

    <div class="header-bar__right">
      <div class="header-bar__search" @click="app.toggleSearch(true)">
        <el-icon><component :is="'Search'" /></el-icon>
        <span>搜索设备 / 告警 / 工单</span>
        <kbd>Ctrl K</kbd>
      </div>

      <el-popover placement="bottom-end" :width="360" trigger="click">
        <template #reference>
          <div class="header-bar__icon-btn" @click="loadMessages">
            <el-badge :value="unread" :hidden="!unread" :max="99">
              <el-icon><component :is="'Bell'" /></el-icon>
            </el-badge>
          </div>
        </template>
        <div class="msg-panel">
          <div class="msg-panel__head">
            <span>消息中心（{{ unread }} 条未读）</span>
            <el-button link type="primary" size="small" @click="readAll">全部标记已读</el-button>
          </div>
          <el-scrollbar max-height="320px">
            <div v-if="!messages.length" class="msg-panel__empty">暂无消息</div>
            <div v-for="m in messages" :key="m.id" class="msg-item" :class="{ 'is-unread': !m.read }" @click="onMessageClick(m)">
              <div class="msg-item__title">
                <span class="vc-pulse" :style="{ background: m.level === 'urgent' ? '#ff4d4f' : '#faad14' }" v-if="!m.read" />
                {{ m.title }}
              </div>
              <div class="msg-item__content">{{ m.content }}</div>
              <div class="msg-item__time">{{ relativeTimeText(m.createTime) }}</div>
            </div>
          </el-scrollbar>
        </div>
      </el-popover>

      <el-tooltip :content="app.theme === 'dark' ? '切换浅色主题' : '切换深色主题'" placement="bottom">
        <div class="header-bar__icon-btn" @click="toggleTheme">
          <el-icon><component :is="app.theme === 'dark' ? 'Sunny' : 'Moon'" /></el-icon>
        </div>
      </el-tooltip>

      <el-tooltip content="全屏显示" placement="bottom">
        <div class="header-bar__icon-btn" @click="toggleFullscreen">
          <el-icon><component :is="'FullScreen'" /></el-icon>
        </div>
      </el-tooltip>

      <el-dropdown trigger="click" @command="onCommand">
        <div class="header-bar__user">
          <el-avatar :size="28" :src="user.userInfo?.avatar" />
          <div class="header-bar__user-info">
            <span class="name">{{ user.nickname }}</span>
            <span class="role">{{ user.roleName }}</span>
          </div>
          <el-icon><component :is="'ArrowDown'" /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><component :is="'User'" /></el-icon>个人中心
            </el-dropdown-item>
            <el-dropdown-item command="theme">
              <el-icon><component :is="'MagicStick'" /></el-icon>切换主题
            </el-dropdown-item>
            <el-dropdown-item command="reset" divided>
              <el-icon><component :is="'RefreshLeft'" /></el-icon>重置演示数据
            </el-dropdown-item>
            <el-dropdown-item command="about">
              <el-icon><component :is="'InfoFilled'" /></el-icon>关于系统
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <el-icon><component :is="'SwitchButton'" /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped>
.header-bar {
  height: var(--vc-header-height);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-bar__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.header-bar__right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-bar__icon-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  font-size: 16px;
}

.header-bar__icon-btn:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.header-bar__search {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  margin-right: 6px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  cursor: pointer;
  min-width: 210px;
}

.header-bar__search:hover {
  border-color: var(--el-color-primary-light-5);
}

.header-bar__search kbd {
  margin-left: auto;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  font-size: 10px;
  font-family: inherit;
}

.header-bar__user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.header-bar__user:hover {
  background: var(--el-fill-color-light);
}

.header-bar__user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.header-bar__user-info .name {
  font-size: 12px;
  font-weight: 500;
}

.header-bar__user-info .role {
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.msg-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
}

.msg-panel__empty {
  padding: 28px 0;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.msg-item {
  padding: 10px 4px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
  cursor: pointer;
}

.msg-item:hover {
  background: var(--el-fill-color-light);
}

.msg-item__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}

.msg-item__content {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.msg-item__time {
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
</style>
