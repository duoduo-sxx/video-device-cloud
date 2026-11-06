<template>
  <div class="page">
    <PageHeader title="存储集群" desc="纳管全部存储集群，查看容量水位、健康度与保修状态">
      <template #actions>
        <el-button :icon="Download" @click="onExport">导出</el-button>
        <el-button type="primary" :icon="Plus" @click="ElMessage.info('演示环境：集群纳管由管理员在后台完成')">纳管集群</el-button>
      </template>
    </PageHeader>

    <div class="kpi-grid">
      <StatCard label="集群总数" :value="stats.total" unit="套" icon="Grid" tone="primary" hint="覆盖 8 家客户、12 个机房" />
      <StatCard label="总容量" :value="(stats.capacity / 1024).toFixed(2)" unit="PB" icon="Coin" tone="cyan" hint="原始可用容量（已扣除热备）" />
      <StatCard label="平均使用率" :value="stats.usage.toFixed(1)" unit="%" icon="PieChart" :tone="stats.usage >= 80 ? 'warning' : 'success'" :progress="stats.usage" hint="按容量加权计算" />
      <StatCard label="异常集群" :value="stats.abnormal" unit="套" icon="Warning" tone="danger" hint="含告警、离线与维护中" />
    </div>

    <div class="card flush">
      <div class="filters-bar">
        <div class="filters">
          <el-input v-model="query.keyword" placeholder="集群名称 / 型号 / IP" :prefix-icon="Search" clearable @keyup.enter="search" />
          <el-select v-model="query.customerId" placeholder="全部客户" clearable>
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-select v-model="query.vendor" placeholder="全部厂商" clearable>
            <el-option v-for="v in vendors" :key="v" :label="v" :value="v" />
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
        <div class="toolbar-right">
          <span class="tiny muted">共 {{ total }} 套集群</span>
          <el-tooltip content="刷新"><el-button circle :icon="RefreshRight" @click="load" /></el-tooltip>
        </div>
      </div>

      <el-table :data="rows" v-loading="loading" @row-click="(row: StorageCluster) => router.push(`/resources/clusters/${row.id}`)" row-class-name="clickable">
        <el-table-column label="集群名称" min-width="230">
          <template #default="{ row }">
            <div class="name-cell">
              <div class="name">{{ row.name }}</div>
              <div class="tiny muted">{{ row.vendor }} · {{ row.model }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="所属客户" min-width="170" show-overflow-tooltip />
        <el-table-column label="机房 / 位置" width="176">
          <template #default="{ row }">
            <div>{{ row.datacenter }}</div>
            <div class="tiny muted">{{ row.rack }} · {{ row.unit }}</div>
          </template>
        </el-table-column>
        <el-table-column label="管理 IP" width="132">
          <template #default="{ row }"><span class="mono tiny">{{ row.mgmtIp }}</span></template>
        </el-table-column>
        <el-table-column label="容量（已用/总）" width="150">
          <template #default="{ row }">
            <span class="num">{{ formatCapacity(row.usedTB) }}</span>
            <span class="tiny muted"> / {{ formatCapacity(row.totalTB) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="使用率" width="140">
          <template #default="{ row }"><CapacityBar :value="row.usageRate" /></template>
        </el-table-column>
        <el-table-column label="健康分" width="92">
          <template #default="{ row }">
            <span class="health num" :class="row.healthScore < 80 ? 'warn' : 'good'">{{ row.healthScore }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="96">
          <template #default="{ row }"><StatusTag kind="cluster" :value="row.status" /></template>
        </el-table-column>
        <el-table-column label="保修到期" width="112">
          <template #default="{ row }">
            <span :class="isExpiring(row.warrantyEnd) ? 'warn-text' : ''">{{ formatDate(row.warrantyEnd) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="router.push(`/resources/clusters/${row.id}`)">详情</el-button>
          </template>
        </el-table-column>
        <template #empty><EmptyState text="没有匹配的存储集群" desc="试试调整筛选条件" /></template>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Download, Plus, Refresh, RefreshRight, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import CapacityBar from '@/components/CapacityBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getAllCustomers, getClusters } from '@/api'
import type { Customer, StorageCluster } from '@/types'
import { formatCapacity, formatDate, dayjs } from '@/utils/format'
import { exportCsv } from '@/utils/export'

const router = useRouter()
const loading = ref(false)
const rows = ref<StorageCluster[]>([])
const allRows = ref<StorageCluster[]>([])
const total = ref(0)
const customers = ref<Customer[]>([])

const query = reactive({
  keyword: '',
  customerId: '',
  vendor: '',
  status: '',
  page: 1,
  pageSize: 10
})

const vendors = ['华为', '浪潮', '宏杉', '新华三', '联想凌拓', '戴尔', 'Pure Storage']

const stats = computed(() => {
  const cap = allRows.value.reduce((s, r) => s + r.totalTB, 0)
  return {
    total: allRows.value.length,
    capacity: cap,
    usage: allRows.value.length ? allRows.value.reduce((s, r) => s + r.usageRate, 0) / allRows.value.length : 0,
    abnormal: allRows.value.filter((r) => r.status !== 'online').length
  }
})

async function load() {
  loading.value = true
  const res = await getClusters({ ...query })
  rows.value = res.list
  total.value = res.total
  loading.value = false
}

function search() {
  query.page = 1
  load()
}

function reset() {
  query.keyword = ''
  query.customerId = ''
  query.vendor = ''
  query.status = ''
  search()
}

function isExpiring(date: string) {
  return dayjs(date).diff(dayjs(), 'day') < 90
}

function onExport() {
  exportCsv(
    '存储集群台账.csv',
    ['集群名称', '厂商', '型号', '客户', '机房', '管理IP', '总容量(TB)', '已用(TB)', '使用率(%)', '健康分', '状态', '保修到期'],
    rows.value.map((r) => [r.name, r.vendor, r.model, r.customerName, r.datacenter, r.mgmtIp, r.totalTB, r.usedTB, r.usageRate, r.healthScore, r.status, r.warrantyEnd])
  )
  ElMessage.success('已导出当前页数据')
}

onMounted(async () => {
  customers.value = await getAllCustomers()
  const all = await getClusters({ page: 1, pageSize: 999 })
  allRows.value = all.list
  await load()
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

.name-cell {
  line-height: 18px;
}

.health {
  font-weight: 600;
  font-size: 13px;
}

.health.good {
  color: #16a34a;
}

.health.warn {
  color: #e5484d;
}

.warn-text {
  color: #dc2626;
}

:deep(.clickable) {
  cursor: pointer;
}
</style>
