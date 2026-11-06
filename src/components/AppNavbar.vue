<template>
  <header class="navbar">
    <div class="nav-left">
      <button class="icon-btn" @click="emit('toggle')">
        <el-icon :size="18"><component :is="collapsed ? 'Expand' : 'Fold'" /></el-icon>
      </button>
      <div class="crumb">
        <span class="crumb-item home" @click="router.push('/dashboard')">首页</span>
        <template v-if="route.path !== '/dashboard'">
          <span class="sep">/</span>
          <span class="crumb-item">{{ route.meta.group || '概览' }}</span>
          <template v-if="route.meta.parentTitle">
            <span class="sep">/</span>
            <span class="crumb-item linkable" @click="router.push(String(route.meta.parent))">{{ route.meta.parentTitle }}</span>
          </template>
          <span class="sep">/</span>
          <span class="crumb-item current">{{ route.meta.title }}</span>
        </template>
        <template v-else>
          <span class="sep">/</span>
          <span class="crumb-item current">工作台</span>
        </template>
      </div>
    </div>

    <div class="nav-right">
      <div class="search-box" @click="openSearch">
        <el-icon :size="15"><Search /></el-icon>
        <span>搜索资源、工单、知识…</span>
        <kbd>/</kbd>
      </div>

      <el-tooltip content="消息中心" placement="bottom">
        <button class="icon-btn" @click="router.push('/messages')">
          <el-badge :value="unread" :hidden="unread === 0" :max="99">
            <el-icon :size="18"><Bell /></el-icon>
          </el-badge>
        </button>
      </el-tooltip>

      <el-dropdown trigger="click" @command="onCommand">
        <div class="user">
          <div class="avatar" :style="{ background: user?.avatarColor || '#1668DC' }">{{ user?.name?.slice(0, 1) || 'U' }}</div>
          <div class="user-meta">
            <div class="user-name">{{ user?.name || '未登录' }}</div>
            <div class="user-role">{{ user?.roleName || '--' }}</div>
          </div>
          <el-icon :size="12" class="muted"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人设置</el-dropdown-item>
            <el-dropdown-item command="messages">消息中心</el-dropdown-item>
            <el-dropdown-item divided disabled>切换角色（演示）</el-dropdown-item>
            <el-dropdown-item v-for="r in roleList" :key="r.code" :command="`role:${r.code}`" :disabled="r.code === user?.role">
              {{ r.name }}
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <el-dialog v-model="searchVisible" title="全局搜索" width="640px" :show-close="false" @closed="keyword = ''">
      <el-input
        ref="searchInput"
        v-model="keyword"
        size="large"
        placeholder="输入集群名称、工单号、知识标题，回车搜索"
        :prefix-icon="Search"
        clearable
        @input="onSearch"
      />
      <div class="search-result">
        <div v-if="!keyword" class="search-tip">支持搜索：存储集群 / 存储池 / 工单 / 知识库</div>
        <div v-else-if="!groups.length && searched" class="search-tip">没有找到与「{{ keyword }}」相关的结果</div>
        <div v-for="g in groups" :key="g.group" class="search-group">
          <div class="search-group-title">{{ g.group }}</div>
          <div v-for="item in g.items" :key="item.id" class="search-item" @click="go(item.path)">
            <div class="search-item-title">{{ item.title }}</div>
            <div class="search-item-desc">{{ item.desc }}</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </header>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getMessages, markAllRead, globalSearch } from '@/api'
import { ROLES } from '@/constants'
import type { RoleCode } from '@/types'

defineProps<{ collapsed: boolean }>()
const emit = defineEmits<{ (e: 'toggle'): void }>()

const route = useRoute()
const router = useRouter()
const store = useUserStore()

const user = computed(() => store.user)
const roleList = ROLES
const unread = ref(0)
const searchVisible = ref(false)
const keyword = ref('')
const searched = ref(false)
const groups = ref<{ group: string; items: { id: string; title: string; desc: string; path: string }[] }[]>([])
const searchInput = ref()

async function refreshUnread() {
  const list = await getMessages({ onlyUnread: true })
  unread.value = list.length
}

function openSearch() {
  searchVisible.value = true
  nextTick(() => searchInput.value?.focus())
}

let timer: number | undefined
function onSearch() {
  window.clearTimeout(timer)
  searched.value = false
  timer = window.setTimeout(async () => {
    groups.value = (await globalSearch(keyword.value)) as typeof groups.value
    searched.value = true
  }, 220)
}

function go(path: string) {
  searchVisible.value = false
  router.push(path)
}

function onCommand(cmd: string) {
  if (cmd === 'logout') {
    store.logout()
    router.push('/login')
    return
  }
  if (cmd === 'profile') {
    router.push('/profile')
    return
  }
  if (cmd === 'messages') {
    router.push('/messages')
    return
  }
  if (cmd.startsWith('role:')) {
    store.switchRole(cmd.slice(5) as RoleCode)
    ElMessage.success(`已切换为「${store.user?.roleName}」，菜单与数据范围已同步`)
    if (!store.has(route.meta.permission as string)) router.push('/dashboard')
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
    e.preventDefault()
    openSearch()
  }
}

onMounted(() => {
  refreshUnread()
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => window.removeEventListener('keydown', onKey))

async function onAllRead() {
  await markAllRead()
  await refreshUnread()
  ElMessage.success('已全部标为已读')
}

defineExpose({ refreshUnread, onAllRead })
</script>

<style scoped>
.navbar {
  height: 56px;
  flex: none;
  background: #fff;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 0 12px;
  position: sticky;
  top: 0;
  z-index: 60;
}

.nav-left,
.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--neutral-600);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-btn:hover {
  background: #f2f5f9;
}

.crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--neutral-400);
}

.crumb-item.current {
  color: var(--neutral-900);
  font-weight: 500;
}

.crumb-item.home,
.crumb-item.linkable {
  cursor: pointer;
}

.crumb-item.linkable:hover,
.crumb-item.home:hover {
  color: var(--brand-600);
}

.sep {
  color: #cfd6e0;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 240px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--neutral-400);
  font-size: 12.5px;
  cursor: pointer;
  background: #fafbfd;
}

.search-box:hover {
  border-color: #c6d8f5;
  background: #fff;
}

.search-box span {
  flex: 1;
}

.search-box kbd {
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0 5px;
  font-size: 11px;
  color: #9aa4b5;
  background: #fff;
}

.user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
}

.user:hover {
  background: #f5f7fa;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.user-name {
  font-size: 13px;
  color: var(--neutral-900);
  line-height: 16px;
}

.user-role {
  font-size: 11px;
  color: var(--neutral-400);
  line-height: 14px;
}

.search-result {
  margin-top: 14px;
  max-height: 420px;
  overflow-y: auto;
}

.search-tip {
  color: var(--neutral-400);
  font-size: 13px;
  padding: 24px 0;
  text-align: center;
}

.search-group-title {
  font-size: 12px;
  color: var(--neutral-400);
  margin: 12px 0 6px;
}

.search-item {
  padding: 9px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.search-item:hover {
  background: var(--brand-50);
}

.search-item-title {
  font-size: 13px;
  color: var(--neutral-900);
}

.search-item-desc {
  font-size: 12px;
  color: var(--neutral-400);
  margin-top: 2px;
}
</style>
