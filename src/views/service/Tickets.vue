<template>
  <div class="page">
    <PageHeader title="工单管理" desc="服务请求的全流程跟踪，覆盖受理、派单、处理、验收与关闭">
      <template #actions>
        <el-button :icon="Download" @click="onExport">导出</el-button>
        <el-button type="primary" :icon="Plus" @click="router.push('/service/tickets/new')">新建工单</el-button>
      </template>
    </PageHeader>

    <div class="card flush">
      <div class="tab-bar">
        <div v-for="t in tabs" :key="t.key" class="tab-item" :class="{ active: query.tab === t.key }" @click="switchTab(t.key)">
          {{ t.label }}
          <span class="tab-count" :class="{ zero: !counts[t.key] }">{{ counts[t.key] ?? 0 }}</span>
        </div>
        <div class="tab-right">
          <el-button size="small" :icon="Grid" @click="router.push('/service/board')">看板视图</el-button>
        </div>
      </div>

      <div class="filters-bar">
        <div class="filters">
          <el-input v-model="query.keyword" placeholder="工单号 / 标题 / 处理人" :prefix-icon="Search" clearable @keyup.enter="search" />
          <el-select v-model="query.status" placeholder="全部状态" clearable>
            <el-option v-for="(v, k) in ticketStatus" :key="k" :label="v.label" :value="k" />
          </el-select>
          <el-select v-model="query.priority" placeholder="全部优先级" clearable>
            <el-option v-for="(v, k) in priorityMap" :key="k" :label="v.label" :value="k" />
          </el-select>
          <el-select v-model="query.serviceItem" placeholder="全部服务项" clearable>
            <el-option v-for="s in services" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
          <el-select v-model="query.customerId" placeholder="全部客户" clearable filterable>
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button :icon="Refresh" @click="reset">重置</el-button>
        </div>
        <span class="tiny muted">共 {{ total }} 张工单</span>
      </div>

      <el-table :data="rows" v-loading="loading" @row-click="(row: Ticket) => router.push(`/service/tickets/${row.id}`)" row-class-name="clickable">
        <el-table-column label="工单" min-width="300">
          <template #default="{ row }">
            <div class="ticket-id mono tiny">{{ row.id }}</div>
            <div class="ticket-title">{{ row.title }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户" min-width="160" show-overflow-tooltip />
        <el-table-column prop="serviceItem" label="服务项" width="110" />
        <el-table-column label="优先级" width="96">
          <template #default="{ row }"><StatusTag kind="priority" :value="row.priority" /></template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><StatusTag kind="ticket" :value="row.status" /></template>
        </el-table-column>
        <el-table-column label="处理人" width="96">
          <template #default="{ row }">{{ row.assignee || '--' }}</template>
        </el-table-column>
        <el-table-column label="SLA" width="150">
          <template #default="{ row }">
            <div v-if="row.status === 'closed'" class="sla-done">
              <span :class="row.slaResolveOk ? 'ok' : 'bad'">{{ row.slaResolveOk ? '已达成' : '已超时' }}</span>
            </div>
            <div v-else-if="row.status === 'resolved'" class="sla-done">
              <span :class="row.slaResolveOk ? 'ok' : 'bad'">{{ row.slaResolveOk ? '已达成' : '已超时' }}</span>
            </div>
            <div v-else class="sla-live" :class="slaInfo(row).tone">
              <el-icon :size="12"><Clock /></el-icon>
              <span v-if="slaInfo(row).over">超时 {{ slaInfo(row).text }}</span>
              <span v-else>剩 {{ slaInfo(row).text }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="满意度" width="110">
          <template #default="{ row }">
            <el-rate v-if="row.satisfaction" :model-value="row.satisfaction" disabled size="small" />
            <span v-else class="tiny muted">未评价</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="132">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="82" fixed="right" align="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="router.push(`/service/tickets/${row.id}`)">详情</el-button>
          </template>
        </el-table-column>
        <template #empty><EmptyState text="没有匹配的工单" desc="尝试切换 Tab 或调整筛选条件" /></template>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="load"
          @size-change="search"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Clock, Download, Grid, Plus, Refresh, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getAllCustomers, getAllTickets, getServiceItems, getTickets } from '@/api'
import type { Customer, ServiceItem, Ticket } from '@/types'
import { TICKET_STATUS, PRIORITY } from '@/constants'
import { dayjs, formatDateTime, remainText } from '@/utils/format'
import { exportCsv } from '@/utils/export'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const store = useUserStore()

const ticketStatus = TICKET_STATUS
const priorityMap = PRIORITY

const loading = ref(false)
const rows = ref<Ticket[]>([])
const allTickets = ref<Ticket[]>([])
const total = ref(0)
const customers = ref<Customer[]>([])
const services = ref<ServiceItem[]>([])
const view = ref('list')
const now = ref(Date.now())

const query = reactive({
  keyword: '', status: '', priority: '', serviceItem: '', customerId: '',
  tab: 'all' as 'all' | 'todo' | 'accept' | 'created' | 'overdue',
  page: 1, pageSize: 10
})

const tabs = [
  { key: 'all' as const, label: '全部工单' },
  { key: 'todo' as const, label: '我的待办' },
  { key: 'accept' as const, label: '待我验收' },
  { key: 'created' as const, label: '我创建的' },
  { key: 'overdue' as const, label: '已超时' }
]

const counts = computed(() => {
  const me = store.user
  const scope = allTickets.value.filter((t) => (me?.role === 'customer_admin' ? t.customerId === me.customerId : true))
  return {
    all: scope.length,
    todo: scope.filter((t) => ['pending', 'assigned', 'processing'].includes(t.status)).length,
    accept: scope.filter((t) => t.status === 'resolved').length,
    created: scope.filter((t) => t.creator === me?.name).length,
    overdue: scope.filter((t) => t.status !== 'closed' && dayjs(t.resolveDue).valueOf() < now.value).length
  }
})

function slaInfo(row: Ticket) {
  const due = dayjs(row.resolveDue).valueOf()
  const remain = due - now.value
  const over = remain < 0
  const totalSpan = Math.max(1, dayjs(row.resolveDue).valueOf() - dayjs(row.createdAt).valueOf())
  const ratio = Math.max(0, remain) / totalSpan
  const tone = over ? 'bad' : ratio < 0.2 ? 'warn' : 'ok'
  return { over, text: remainText(remain), tone }
}

async function load() {
  loading.value = true
  const res = await getTickets({ ...query })
  rows.value = res.list
  total.value = res.total
  loading.value = false
}

async function loadAll() {
  allTickets.value = await getAllTickets()
}

function switchTab(key: typeof query.tab) {
  query.tab = key
  query.page = 1
  load()
}

function search() {
  query.page = 1
  load()
}

function reset() {
  query.keyword = ''
  query.status = ''
  query.priority = ''
  query.serviceItem = ''
  query.customerId = ''
  query.tab = 'all'
  search()
}

function onExport() {
  exportCsv(
    '工单清单.csv',
    ['工单号', '标题', '客户', '服务项', '优先级', '状态', '处理人', '创建时间', '解决时限', '满意度'],
    rows.value.map((t) => [t.id, t.title, t.customerName, t.serviceItem, t.priority, TICKET_STATUS[t.status].label, t.assignee, t.createdAt, t.resolveDue, t.satisfaction ?? ''])
  )
  ElMessage.success('已导出当前页数据')
}

let timer: number | undefined
onMounted(async () => {
  const [cs, ss] = await Promise.all([getAllCustomers(), getServiceItems()])
  customers.value = cs
  services.value = ss
  if (route.query.tab) query.tab = route.query.tab as typeof query.tab
  await Promise.all([load(), loadAll()])
  timer = window.setInterval(() => (now.value = Date.now()), 30_000)
})
onUnmounted(() => window.clearInterval(timer))
</script>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 16px 0;
  border-bottom: 1px solid var(--divider);
}

.tab-item {
  position: relative;
  padding: 8px 12px 12px;
  font-size: 13px;
  color: var(--neutral-600);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-item:hover {
  color: var(--brand-600);
}

.tab-item.active {
  color: var(--brand-600);
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -1px;
  height: 2px;
  background: var(--brand-600);
  border-radius: 2px 2px 0 0;
}

.tab-count {
  min-width: 18px;
  height: 17px;
  padding: 0 5px;
  border-radius: 9px;
  background: #e8f1ff;
  color: #1668dc;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-variant-numeric: tabular-nums;
}

.tab-count.zero {
  background: #f1f3f7;
  color: #9aa4b5;
}

.tab-right {
  margin-left: auto;
  padding-bottom: 8px;
}

.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  flex-wrap: wrap;
}

.ticket-id {
  color: var(--neutral-400);
  line-height: 16px;
}

.ticket-title {
  font-size: 13px;
  color: var(--neutral-900);
  line-height: 19px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 420px;
}

.sla-live {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.sla-live.ok {
  color: #5b6675;
}

.sla-live.warn {
  color: #d97706;
  font-weight: 500;
}

.sla-live.bad {
  color: #dc2626;
  font-weight: 500;
}

.sla-done .ok {
  color: #16a34a;
  font-size: 12px;
}

.sla-done .bad {
  color: #dc2626;
  font-size: 12px;
}

:deep(.clickable) {
  cursor: pointer;
}
</style>
