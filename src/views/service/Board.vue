<template>
  <div class="page">
    <PageHeader title="工单看板" desc="按状态流转查看工单，可直接拖拽卡片推进状态">
      <template #actions>
        <el-button :icon="List" @click="router.push('/service/tickets')">列表视图</el-button>
        <el-button type="primary" :icon="Plus" @click="router.push('/service/tickets/new')">新建工单</el-button>
      </template>
    </PageHeader>

    <div class="board" v-loading="loading">
      <div
        v-for="col in columns"
        :key="col.key"
        class="column"
        :class="col.key"
        @dragover.prevent
        @drop="onDrop(col.key)"
      >
        <div class="col-head">
          <span class="col-dot" :style="{ background: col.color }" />
          <span class="col-name">{{ col.name }}</span>
          <span class="col-count">{{ grouped[col.key]?.length ?? 0 }}</span>
        </div>
        <div class="col-body">
          <div
            v-for="t in grouped[col.key] ?? []"
            :key="t.id"
            class="kanban-card"
            draggable="true"
            @dragstart="dragId = t.id"
            @click="router.push(`/service/tickets/${t.id}`)"
          >
            <div class="k-top">
              <span class="k-id mono">{{ t.id }}</span>
              <StatusTag kind="priority" :value="t.priority" />
            </div>
            <div class="k-title">{{ t.title }}</div>
            <div class="k-customer">{{ t.customerName }}</div>
            <div class="k-foot">
              <span class="k-assignee">
                <span class="mini-avatar">{{ (t.assignee || '待')[0] }}</span>
                {{ t.assignee || '待分配' }}
              </span>
              <span v-if="t.status !== 'closed'" class="k-sla" :class="slaTone(t)">
                {{ slaText(t) }}
              </span>
            </div>
          </div>
          <div v-if="!grouped[col.key]?.length" class="col-empty">暂无工单</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { List, Plus } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import { acceptTicket, assignTicket, closeTicket, getAllTickets, resolveTicket, resumeTicket, suspendTicket } from '@/api'
import type { Ticket } from '@/types'
import { dayjs, remainText } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const tickets = ref<Ticket[]>([])
const dragId = ref<string>('')

const columns = [
  { key: 'pending', name: '待受理', color: '#F59E0B' },
  { key: 'assigned', name: '待派单', color: '#F5A524' },
  { key: 'processing', name: '处理中', color: '#1668DC' },
  { key: 'suspended', name: '已挂起', color: '#94A3B8' },
  { key: 'resolved', name: '待验收', color: '#13C2C2' },
  { key: 'closed', name: '已关闭', color: '#16A34A' }
]

const grouped = computed<Record<string, Ticket[]>>(() => {
  const map: Record<string, Ticket[]> = {}
  columns.forEach((c) => (map[c.key] = []))
  tickets.value
    .filter((t) => t.status !== 'closed')
    .slice(0, 200)
    .forEach((t) => {
      if (map[t.status]) map[t.status].push(t)
    })
  // 已关闭列只展示最近 8 条
  map.closed = tickets.value.filter((t) => t.status === 'closed').slice(0, 8)
  Object.keys(map).forEach((k) => map[k].sort((a, b) => dayjs(a.resolveDue).valueOf() - dayjs(b.resolveDue).valueOf()))
  return map
})

function slaText(t: Ticket) {
  const remain = dayjs(t.resolveDue).valueOf() - Date.now()
  return remain > 0 ? `剩 ${remainText(remain)}` : `超时 ${remainText(remain)}`
}

function slaTone(t: Ticket) {
  const remain = dayjs(t.resolveDue).valueOf() - Date.now()
  if (remain <= 0) return 'bad'
  if (remain < 2 * 3600_000) return 'warn'
  return ''
}

async function onDrop(target: string) {
  const id = dragId.value
  dragId.value = ''
  if (!id) return
  const t = tickets.value.find((x) => x.id === id)
  if (!t || t.status === target) return

  const allowed: Record<string, string[]> = {
    pending: ['assigned'],
    assigned: ['processing'],
    processing: ['resolved', 'suspended'],
    suspended: ['processing'],
    resolved: ['closed'],
    closed: []
  }
  if (!allowed[t.status]?.includes(target)) {
    ElMessage.warning('不允许的状态流转，请按正常流程推进')
    return
  }

  if (target === 'assigned') await acceptTicket(t.id, '林悦')
  if (target === 'processing') await assignTicket(t.id, t.assignee || '陈立', t.assigneeGroup || '存储一线')
  if (target === 'suspended') await suspendTicket(t.id, '等待客户确认，临时挂起')
  if (target === 'resolved') await resolveTicket(t.id, '现场处置完成，指标恢复正常，等待客户验收。')
  if (target === 'closed') await closeTicket(t.id, '李建国', 5, ['响应及时'])
  ElMessage.success('状态已更新')
  await load()
}

async function load() {
  loading.value = true
  tickets.value = await getAllTickets()
  loading.value = false
}

onMounted(load)
</script>

<style scoped>
.board {
  display: grid;
  grid-template-columns: repeat(6, minmax(200px, 1fr));
  gap: 12px;
  align-items: start;
  overflow-x: auto;
  padding-bottom: 8px;
}

.column {
  background: #f0f3f8;
  border-radius: 10px;
  padding: 10px;
  min-height: 420px;
}

.col-head {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 2px 4px 10px;
}

.col-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.col-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--neutral-900);
}

.col-count {
  margin-left: auto;
  font-size: 11.5px;
  color: var(--neutral-600);
  background: #fff;
  border-radius: 9px;
  padding: 1px 7px;
}

.col-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 340px;
}

.kanban-card {
  background: #fff;
  border: 1px solid #e3e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: box-shadow 0.14s ease, transform 0.14s ease;
}

.kanban-card:hover {
  box-shadow: 0 4px 12px rgba(16, 24, 40, 0.08);
  transform: translateY(-1px);
}

.k-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.k-id {
  font-size: 10.5px;
  color: var(--neutral-400);
}

.k-title {
  font-size: 12.5px;
  color: var(--neutral-900);
  line-height: 1.5;
  margin: 6px 0 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.k-customer {
  font-size: 11px;
  color: var(--neutral-400);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.k-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 7px;
  border-top: 1px dashed var(--divider);
}

.k-assignee {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--neutral-600);
}

.mini-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #dbe7fb;
  color: #1668dc;
  font-size: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.k-sla {
  font-size: 10.5px;
  color: var(--neutral-400);
  font-variant-numeric: tabular-nums;
}

.k-sla.warn {
  color: #d97706;
}

.k-sla.bad {
  color: #dc2626;
}

.col-empty {
  text-align: center;
  color: #aab3c2;
  font-size: 12px;
  padding: 24px 0;
  border: 1px dashed #dbe1ea;
  border-radius: 8px;
}
</style>
