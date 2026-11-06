<template>
  <div class="page">
    <PageHeader title="设备台账" desc="存储设备、备份一体机、磁带库与光纤交换机的资产台账与健康状态">
      <template #actions>
        <el-segmented v-model="view" :options="[{ label: '表格', value: 'table' }, { label: '卡片', value: 'card' }]" size="default" />
        <el-button :icon="Download" @click="onExport">导出</el-button>
      </template>
    </PageHeader>

    <div class="kpi-grid">
      <StatCard label="设备总数" :value="all.length" unit="台" icon="Cpu" tone="primary" hint="覆盖 8 家客户、12 个机房" />
      <StatCard label="在线设备" :value="online" unit="台" icon="CircleCheck" tone="success" :hint="`在线率 ${((online / (all.length || 1)) * 100).toFixed(1)}%`" />
      <StatCard label="告警 / 离线" :value="abnormal" unit="台" icon="Warning" tone="danger" hint="含磁盘预测故障与链路异常" />
      <StatCard label="保修临期" :value="expiring" unit="台" icon="Clock" tone="warning" hint="90 天内到期或已过保" />
    </div>

    <div class="card flush">
      <div class="filters-bar">
        <div class="filters">
          <el-input v-model="query.keyword" placeholder="设备名 / SN / 型号 / IP" :prefix-icon="Search" clearable @keyup.enter="search" />
          <el-select v-model="query.type" placeholder="全部类型" clearable>
            <el-option v-for="t in types" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
          <el-select v-model="query.customerId" placeholder="全部客户" clearable filterable>
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-select v-model="query.status" placeholder="全部状态" clearable>
            <el-option label="在线" value="online" />
            <el-option label="告警" value="warning" />
            <el-option label="离线" value="offline" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button :icon="Refresh" @click="reset">重置</el-button>
        </div>
        <span class="tiny muted">共 {{ total }} 台设备</span>
      </div>

      <el-table v-if="view === 'table'" :data="rows" v-loading="loading" @row-click="(row: Device) => router.push(`/resources/devices/${row.id}`)" row-class-name="clickable">
        <el-table-column label="设备名称" min-width="190">
          <template #default="{ row }">
            <div class="name">{{ row.name }}</div>
            <div class="tiny muted">{{ row.typeName }}</div>
          </template>
        </el-table-column>
        <el-table-column label="厂商 / 型号" min-width="210">
          <template #default="{ row }">
            <div>{{ row.vendor }}</div>
            <div class="tiny muted">{{ row.model }}</div>
          </template>
        </el-table-column>
        <el-table-column label="序列号" width="180">
          <template #default="{ row }"><span class="mono tiny">{{ row.sn }}</span></template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户" min-width="160" show-overflow-tooltip />
        <el-table-column label="位置" width="184">
          <template #default="{ row }">
            <div>{{ row.datacenter }}</div>
            <div class="tiny muted">{{ row.rack }} · {{ row.unit }}</div>
          </template>
        </el-table-column>
        <el-table-column label="管理 IP" width="130">
          <template #default="{ row }"><span class="mono tiny">{{ row.mgmtIp }}</span></template>
        </el-table-column>
        <el-table-column label="磁盘健康" width="110">
          <template #default="{ row }">
            <div v-if="row.diskCount" class="disk-health">
              <CapacityBar :value="row.diskHealth" :height="5" :show-label="false" />
              <span class="tiny num">{{ row.diskHealth }}%</span>
            </div>
            <span v-else class="muted">--</span>
          </template>
        </el-table-column>
        <el-table-column label="保修到期" width="112">
          <template #default="{ row }">
            <span :class="warrantyClass(row.warrantyEnd)">{{ formatDate(row.warrantyEnd) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="96">
          <template #default="{ row }"><StatusTag kind="device" :value="row.status" /></template>
        </el-table-column>
        <el-table-column label="操作" width="82" fixed="right" align="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="router.push(`/resources/devices/${row.id}`)">详情</el-button>
          </template>
        </el-table-column>
        <template #empty><EmptyState text="没有匹配的设备" /></template>
      </el-table>

      <div v-else class="device-grid" v-loading="loading">
        <div v-for="d in rows" :key="d.id" class="device-card" @click="router.push(`/resources/devices/${d.id}`)">
          <div class="device-art" :class="d.status">
            <svg viewBox="0 0 96 64" width="96" height="64" fill="none">
              <rect x="10" y="6" width="76" height="52" rx="5" fill="#F7F9FC" stroke="#DCE3ED" />
              <rect v-for="n in 8" :key="n" :x="16" :y="6 + n * 6" width="64" height="4" rx="2" fill="#E8EEF7" />
              <rect x="70" y="8" width="10" height="2" rx="1" :fill="statusColor(d.status)" />
              <circle cx="18" cy="10" r="1.6" :fill="statusColor(d.status)" />
            </svg>
            <StatusTag kind="device" :value="d.status" />
          </div>
          <div class="device-body">
            <div class="device-name">{{ d.name }}</div>
            <div class="tiny muted">{{ d.vendor }} {{ d.model }}</div>
            <div class="device-meta">
              <span class="tiny muted">{{ d.datacenter }} · {{ d.rack }}</span>
              <span class="tiny muted">{{ d.diskCount ? `${d.diskCount} 盘位` : '—' }}</span>
            </div>
            <div class="device-foot">
              <span class="tiny muted">保修至 {{ formatDate(d.warrantyEnd) }}</span>
              <span class="tiny link">详情 →</span>
            </div>
          </div>
        </div>
      </div>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[12, 24, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="load"
          @size-change="search"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Download, Refresh, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import CapacityBar from '@/components/CapacityBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getAllCustomers, getDevices } from '@/api'
import type { Customer, Device } from '@/types'
import { dayjs, formatDate } from '@/utils/format'
import { exportCsv } from '@/utils/export'

const router = useRouter()
const view = ref<'table' | 'card'>('table')
const loading = ref(false)
const rows = ref<Device[]>([])
const all = ref<Device[]>([])
const total = ref(0)
const customers = ref<Customer[]>([])

const types = [
  { label: '全闪存储', value: 'allFlash' },
  { label: '混闪存储', value: 'hybrid' },
  { label: '分布式存储', value: 'distributed' },
  { label: '备份一体机', value: 'backupAppliance' },
  { label: '磁带库', value: 'tapeLibrary' },
  { label: '光纤交换机', value: 'switch' }
]

const query = reactive({ keyword: '', type: '', customerId: '', status: '', page: 1, pageSize: 12 })

const online = computed(() => all.value.filter((d) => d.status === 'online').length)
const abnormal = computed(() => all.value.filter((d) => d.status === 'warning' || d.status === 'offline').length)
const expiring = computed(() => all.value.filter((d) => dayjs(d.warrantyEnd).diff(dayjs(), 'day') < 90).length)

function statusColor(status: string) {
  return { online: '#16A34A', warning: '#F59E0B', offline: '#E5484D', maintenance: '#94A3B8' }[status] ?? '#94A3B8'
}

function warrantyClass(date: string) {
  const days = dayjs(date).diff(dayjs(), 'day')
  if (days < 0) return 'danger-text'
  if (days < 90) return 'warn-text'
  return ''
}

async function load() {
  loading.value = true
  const res = await getDevices({ ...query })
  rows.value = res.list
  total.value = res.total
  loading.value = false
}

async function loadAll() {
  const res = await getDevices({ page: 1, pageSize: 999 })
  all.value = res.list
}

function search() {
  query.page = 1
  load()
}

function reset() {
  query.keyword = ''
  query.type = ''
  query.customerId = ''
  query.status = ''
  search()
}

function onExport() {
  exportCsv(
    '设备台账.csv',
    ['设备名称', '类型', '厂商', '型号', '序列号', '客户', '机房', '机柜', 'U位', '管理IP', '磁盘健康%', '保修到期', '状态'],
    rows.value.map((d) => [d.name, d.typeName, d.vendor, d.model, d.sn, d.customerName, d.datacenter, d.rack, d.unit, d.mgmtIp, d.diskHealth, d.warrantyEnd, d.status])
  )
  ElMessage.success('已导出当前页数据')
}

onMounted(async () => {
  customers.value = await getAllCustomers()
  await Promise.all([load(), loadAll()])
})
</script>

<style scoped>
.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--divider);
  flex-wrap: wrap;
}

.name {
  font-size: 13px;
  color: var(--neutral-900);
  font-weight: 500;
}

.disk-health {
  display: flex;
  align-items: center;
  gap: 6px;
}

.warn-text {
  color: #d97706;
}

.danger-text {
  color: #dc2626;
  font-weight: 500;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 14px;
  padding: 18px 20px;
}

.device-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.16s ease, transform 0.16s ease;
  background: #fff;
}

.device-card:hover {
  box-shadow: 0 6px 18px rgba(16, 24, 40, 0.08);
  transform: translateY(-1px);
}

.device-art {
  background: linear-gradient(180deg, #f8fafd 0%, #f2f6fb 100%);
  padding: 14px 16px 10px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.device-body {
  padding: 12px 16px 14px;
}

.device-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--neutral-900);
  margin-bottom: 3px;
}

.device-meta {
  display: flex;
  justify-content: space-between;
  margin: 9px 0 4px;
}

.device-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--divider);
}

:deep(.clickable) {
  cursor: pointer;
}
</style>
