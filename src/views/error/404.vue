<script setup lang="ts">
/**
 * 404 页面不存在
 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MENUS, type MenuNode } from '@/layouts/menu'

const router = useRouter()
const route = useRoute()
const keyword = ref('')

const missingPath = computed(() => route.fullPath)

const quickLinks: { title: string; path: string; icon: string }[] = [
  { title: '数据驾驶舱', path: '/dashboard', icon: 'Odometer' },
  { title: '设备中心', path: '/device', icon: 'VideoCamera' },
  { title: '告警与事件中心', path: '/alarm', icon: 'Bell' },
  { title: '技术服务与工单', path: '/service', icon: 'Tools' }
]

const flatMenus = computed(() => {
  const flatten = (nodes: MenuNode[]): MenuNode[] =>
    nodes.flatMap((n) => [n, ...(n.children ? flatten(n.children) : [])])
  return flatten(MENUS).filter((m) => !m.path.includes(':'))
})

const searchResult = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return []
  return flatMenus.value.filter((m) => m.title.toLowerCase().includes(kw) || m.path.toLowerCase().includes(kw)).slice(0, 8)
})

function go(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="err-page">
    <div class="err-card">
      <div class="err-illustration">
        <svg viewBox="0 0 240 120" width="240" height="120" role="img" aria-label="页面不存在">
          <g fill="none" stroke="#1677ff" stroke-width="2.4" stroke-linecap="round">
            <rect x="26" y="24" width="188" height="72" rx="10" opacity="0.28" />
            <rect x="38" y="36" width="164" height="48" rx="6" opacity="0.55" />
            <path d="M74 60h22M74 72h40M126 60h40" opacity="0.7" />
            <circle cx="168" cy="72" r="8" />
            <path d="M174 78l10 10" stroke-width="3" />
          </g>
          <text x="120" y="26" text-anchor="middle" font-size="13" fill="#faad14" font-family="monospace">ERROR 404</text>
        </svg>
      </div>

      <h1 class="err-title">页面走丢了</h1>
      <p class="err-desc">
        未能找到地址为 <code>{{ missingPath }}</code> 的页面。<br />
        该页面可能已被移除、重命名，或您输入的链接有误。
      </p>

      <div class="err-actions">
        <el-button type="primary" @click="go('/dashboard')">回到数据驾驶舱</el-button>
        <el-button plain @click="router.back()">返回上一页</el-button>
      </div>

      <div class="err-search">
        <el-input v-model="keyword" placeholder="搜索功能模块，如：告警、工单、存储" clearable :prefix-icon="'Search'" />
        <div v-if="searchResult.length" class="err-search__result">
          <div v-for="m in searchResult" :key="m.path" class="err-search__item" @click="go(m.path)">
            <span>{{ m.title }}</span>
            <span class="err-search__path">{{ m.path }}</span>
          </div>
        </div>
      </div>

      <div class="err-quick">
        <span
          v-for="q in quickLinks"
          :key="q.path"
          class="err-quick__item"
          @click="go(q.path)"
        >
          <el-icon><component :is="q.icon" /></el-icon>
          {{ q.title }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.err-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--vc-bg-page, #f5f7fa);
}

.err-card {
  width: 100%;
  max-width: 640px;
  padding: 40px 40px 32px;
  border-radius: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.err-illustration {
  display: flex;
  justify-content: center;
}

.err-title {
  margin: 10px 0 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.err-desc {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.9;
  color: var(--el-text-color-secondary);
}

.err-desc code {
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  font-family: 'Roboto Mono', monospace;
  color: var(--el-color-danger);
}

.err-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

.err-search {
  margin-top: 26px;
  text-align: left;
}

.err-search__result {
  margin-top: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.err-search__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.err-search__item:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.err-search__path {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-family: 'Roboto Mono', monospace;
}

.err-quick {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 18px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.err-quick__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color 0.15s;
}

.err-quick__item:hover {
  color: var(--el-color-primary);
}
</style>
