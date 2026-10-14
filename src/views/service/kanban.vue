<script setup lang="ts">
/**
 * 工单看板：按状态分列的卡片视图，支持快捷流转
 */
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { workOrderApi } from '@/api'
import PageContainer from '@/components/PageContainer.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { WORKORDER_STATUS } from '@/utils/dict'
import { formatDateTime, relativeTimeText } from '@/utils/format'

const loading = ref(false)
const columns = ref<{ status: string; items: any[] }[]>([])
const keyword = ref('')
const engineerFilter = ref('')
const engineers = ref<any[]>([])

const STATUS_ORDER = ['pending', 'assigned', 'processing', 'verifying', 'completed', 'closed']

const COLUMN_COLOR: Record<string, string> = {
  pending: '#ff4d4f',
  assigned: '#faad14',
  processing: '#1677ff',
  verifying: '#13c2c2',
  completed: '#52c41a',
  closed: '#8c8c8c'
}

const STATUS_FLOW: Record<string, string[]> = {
  pending: ['assigned', 'processing', 'closed'],
  assigned: ['processing', 'pending', 'closed'],
  processing: ['verifying', 'completed', 'closed'],
  verifying: ['completed', 'processing', 'closed'],
  completed: ['closed', 'verifying'],
  closed: []
}

async function load() {
  loading.value = true
  try {
    const res: any = await workOrderApi.kanban({ keyword: keyword.value })
    columns.value = STATUS_ORDER.map((s) => {
      const found = (res || []).find((c: any) => c.status === s)
      let items = found?.items || []
      if (engineerFilter.value) items = items.filter((o: any) => o.assignee === engineerFilter.value)
      return { status: s, items }
    })
  } finally {
    loading.value = false
  }
}

const totalCount = computed(() => columns.value.reduce((a, c) => a + c.items.length, 0))

async function moveTo(order: any, status: string) {
  const label = WORKORDER_STATUS[status as keyof typeof WORKORDER_STATUS]?.label || status
  await ElMessageBox.confirm(`确认将工单「${order.title}」流转为「${label}」？`, '工单流转', { type: 'info' })
    .then(async () => {
      try {
        await workOrderApi.changeStatus(order.id, { status, operator: '当前用户' })
        ElMessage.success(`工单已流转为「${label}」`)
        load()
      } catch {
        /* 已提示 */
      }
    })
    .catch(() => null)
}

async function quickAssign(order: any) {
  const options = engineers.value.filter((e) => e.status !== 'off')
  if (!options.length) return ElMessage.warning('没有可派单的工程师')
  const box = await ElMessageBox.prompt(`为工单「${order.title}」选择处理工程师（可输入姓名）：\n可选：${options.map((e) => e.name).join('、')}`, '快速派单', {
    inputValue: options[0].name,
    confirmButtonText: '确认派单'
  }).catch(() => null)
  if (!box) return
  try {
    await workOrderApi.assign(order.id, box.value, '看板快捷派单')
    ElMessage.success(`已派单给 ${box.value}`)
    load()
  } catch {
    /* 已提示 */
  }
}

function priorityBorder(priority: string) {
  return priority === 'urgent' ? '#ff4d4f' : priority === 'major' ? '#faad14' : priority === 'minor' ? '#1677ff' : '#8c8c8c'
}

onMounted(async () => {
  engineers.value = ((await workOrderApi.engineers().catch(() => [])) as any) || []
  await load()
})
</script>

<template>
  <PageContainer title="工单看板" subtitle="按处理阶段分列展示，卡片可直接流转状态">
    <template #header>
      <el-input v-model="keyword" placeholder="搜索工单号 / 标题 / 客户" clearable style="width: 240px" @keyup.enter="load" />
      <el-select v-model="engineerFilter" placeholder="全部工程师" clearable style="width: 160px" @change="load">
        <el-option v-for="e in engineers" :key="e.id" :label="e.name" :value="e.name" />
      </el-select>
      <el-button :icon="'Search'" type="primary" @click="load">查询</el-button>
      <el-button :icon="'Refresh'" :loading="loading" @click="load">刷新</el-button>
    </template>

    <div class="vc-card kb__summary">
      当前看板共 <b>{{ totalCount }}</b> 张工单
      <span v-for="c in columns" :key="c.status" class="kb__summaryItem">
        <i :style="{ background: COLUMN_COLOR[c.status] }" />
        {{ WORKORDER_STATUS[c.status as keyof typeof WORKORDER_STATUS]?.label }}
        <b>{{ c.items.length }}</b>
      </span>
    </div>

    <div v-loading="loading" class="kb__board">
      <div v-for="col in columns" :key="col.status" class="kb__col">
        <div class="kb__colHead" :style="{ borderTopColor: COLUMN_COLOR[col.status] }">
          <span>{{ WORKORDER_STATUS[col.status as keyof typeof WORKORDER_STATUS]?.label }}</span>
          <em>{{ col.items.length }}</em>
        </div>
        <div class="kb__colBody">
          <div v-for="o in col.items" :key="o.id" class="kb__card" :style="{ borderLeftColor: priorityBorder(o.priority) }">
            <div class="kb__cardHead">
              <StatusTag :status="o.priority" kind="alarmLevel" />
              <StatusTag v-if="o.slaStatus !== 'normal'" :status="o.slaStatus" kind="sla" />
              <div style="flex: 1" />
              <span class="kb__no vc-mono">{{ o.orderNo.slice(-6) }}</span>
            </div>
            <div class="kb__title" :title="o.title">{{ o.title }}</div>
            <div class="kb__meta">
              <span>{{ o.customerName }}</span>
              <span class="vc-text-tertiary">·</span>
              <span>{{ o.type }}</span>
            </div>
            <div v-if="o.deviceName" class="kb__device">{{ o.deviceName }}</div>
            <div class="kb__foot">
              <span class="kb__assignee">{{ o.assignee || '待派单' }}</span>
              <span class="vc-text-tertiary">{{ relativeTimeText(o.createTime) }}</span>
            </div>
            <div class="kb__actions">
              <el-button v-if="col.status === 'pending'" size="small" type="warning" plain @click="quickAssign(o)">派单</el-button>
              <el-button
                v-for="s in (STATUS_FLOW[col.status] || []).slice(0, 2)"
                :key="s"
                size="small"
                plain
                @click="moveTo(o, s)"
              >
                {{ WORKORDER_STATUS[s as keyof typeof WORKORDER_STATUS]?.label }}
              </el-button>
            </div>
          </div>
          <EmptyState v-if="!col.items.length" description="暂无工单" :size="60" />
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<style scoped>
.kb__summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 13px;
  flex-wrap: wrap;
}

.kb__summaryItem {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 10px;
  border-radius: 12px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.kb__summaryItem i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.kb__summaryItem b {
  color: var(--el-text-color-primary);
}

.kb__board {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
  margin-top: 12px;
}

.kb__col {
  min-width: 0;
}

.kb__colHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-top: 3px solid;
  border-radius: 8px 8px 0 0;
  font-size: 13px;
  font-weight: 500;
}

.kb__colHead em {
  font-style: normal;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border-radius: 10px;
  padding: 1px 8px;
}

.kb__colBody {
  min-height: 200px;
  max-height: calc(100vh - 260px);
  overflow-y: auto;
  padding: 8px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-top: none;
  border-radius: 0 0 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kb__card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-left: 3px solid;
  border-radius: 6px;
  padding: 9px 10px;
  transition: box-shadow 0.2s;
}

.kb__card:hover {
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.07);
}

.kb__cardHead {
  display: flex;
  align-items: center;
  gap: 4px;
}

.kb__no {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.kb__title {
  margin: 7px 0 5px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kb__meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  white-space: nowrap;
}

.kb__device {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 7px;
  padding-top: 6px;
  border-top: 1px dashed var(--el-border-color-lighter);
  font-size: 11px;
}

.kb__assignee {
  color: var(--el-text-color-regular);
}

.kb__actions {
  display: flex;
  gap: 4px;
  margin-top: 7px;
  flex-wrap: wrap;
}

.kb__actions :deep(.el-button) {
  font-size: 11px;
  padding: 4px 7px;
  height: auto;
}
</style>
