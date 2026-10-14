<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { alarmApi, deviceApi, workOrderApi } from '@/api'

const app = useAppStore()
const router = useRouter()

const keyword = ref('')
const loading = ref(false)
const devices = ref<any[]>([])
const alarms = ref<any[]>([])
const orders = ref<any[]>([])
const inputRef = ref()

const groups = computed(() => [
  { key: 'device', title: '设备', items: devices.value.map((d) => ({ id: d.id, label: d.name, sub: `${d.vendor} ${d.model} · ${d.onlineStatus === 'online' ? '在线' : '离线'}`, path: `/device/detail/${d.id}` })) },
  { key: 'alarm', title: '告警', items: alarms.value.map((a) => ({ id: a.id, label: a.title, sub: `${a.deviceName} · ${a.occurTime}`, path: '/alarm' })) },
  { key: 'order', title: '工单', items: orders.value.map((o) => ({ id: o.id, label: o.title, sub: `${o.orderNo} · ${o.customerName}`, path: '/service' })) }
])

const flat = computed(() => groups.value.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title }))))
const activeIndex = ref(0)
const hasResult = computed(() => flat.value.length > 0)

let timer: number | null = null

async function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) {
    devices.value = []
    alarms.value = []
    orders.value = []
    return
  }
  loading.value = true
  try {
    const [d, a, o] = await Promise.all([
      deviceApi.list({ page: 1, pageSize: 6, keyword: kw }),
      alarmApi.list({ page: 1, pageSize: 6, keyword: kw }),
      workOrderApi.list({ page: 1, pageSize: 6, keyword: kw })
    ])
    devices.value = d.list || []
    alarms.value = a.list || []
    orders.value = o.list || []
    activeIndex.value = 0
  } finally {
    loading.value = false
  }
}

function onInput() {
  if (timer) window.clearTimeout(timer)
  timer = window.setTimeout(doSearch, 260)
}

function go(item: { path: string }) {
  close()
  router.push(item.path)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(flat.value.length - 1, activeIndex.value + 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(0, activeIndex.value - 1)
  } else if (e.key === 'Enter') {
    const item = flat.value[activeIndex.value]
    if (item) go(item)
  } else if (e.key === 'Escape') {
    close()
  }
}

function close() {
  app.toggleSearch(false)
}

watch(
  () => app.globalSearchVisible,
  (v) => {
    if (v) {
      keyword.value = ''
      devices.value = []
      alarms.value = []
      orders.value = []
      nextTick(() => inputRef.value?.focus())
    }
  }
)
</script>

<template>
  <el-dialog
    :model-value="app.globalSearchVisible"
    width="620px"
    top="12vh"
    :show-close="false"
    custom-class="global-search-dialog"
    @update:model-value="close"
  >
    <div class="gs">
      <div class="gs__input">
        <el-icon><component :is="'Search'" /></el-icon>
        <input
          ref="inputRef"
          v-model="keyword"
          placeholder="输入设备名称 / SN / 告警标题 / 工单号，↑↓ 选择，Enter 跳转"
          @input="onInput"
          @keydown="onKeydown"
        />
        <el-icon v-if="loading" class="is-loading"><component :is="'Loading'" /></el-icon>
        <kbd>ESC</kbd>
      </div>

      <div class="gs__body">
        <template v-if="keyword && hasResult">
          <div v-for="g in groups" :key="g.key">
            <template v-if="g.items.length">
              <div class="gs__group">{{ g.title }}（{{ g.items.length }}）</div>
              <div
                v-for="item in g.items"
                :key="item.id"
                class="gs__item"
                :class="{ 'is-active': flat.findIndex((f) => f.id === item.id) === activeIndex }"
                @click="go(item)"
                @mouseenter="activeIndex = flat.findIndex((f) => f.id === item.id)"
              >
                <span class="gs__label">{{ item.label }}</span>
                <span class="gs__sub">{{ item.sub }}</span>
              </div>
            </template>
          </div>
        </template>
        <div v-else-if="keyword && !loading" class="gs__empty">未找到与「{{ keyword }}」相关的结果</div>
        <div v-else class="gs__hint">
          <div class="gs__hint-title">快捷入口</div>
          <div class="gs__hint-list">
            <span @click="go({ path: '/device' })">设备列表</span>
            <span @click="go({ path: '/alarm' })">告警中心</span>
            <span @click="go({ path: '/service' })">工单管理</span>
            <span @click="go({ path: '/ai' })">AI 分析</span>
            <span @click="go({ path: '/openapi' })">API 调试台</span>
            <span @click="go({ path: '/monitor' })">运维监控</span>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.gs__input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.gs__input input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.gs__input kbd {
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  font-size: 10px;
}

.gs__body {
  margin-top: 10px;
  max-height: 380px;
  overflow: auto;
}

.gs__group {
  padding: 8px 4px 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.gs__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.gs__item.is-active {
  background: var(--el-color-primary-light-9);
}

.gs__label {
  font-size: 13px;
}

.gs__sub {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.gs__empty {
  padding: 40px 0;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.gs__hint-title {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  padding: 4px;
}

.gs__hint-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px;
}

.gs__hint-list span {
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  cursor: pointer;
}

.gs__hint-list span:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
</style>
