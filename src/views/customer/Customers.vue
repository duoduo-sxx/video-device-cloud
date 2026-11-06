<template>
  <div class="page">
    <PageHeader title="客户管理" desc="客户档案、服务经理、资源规模与 SLA 达成情况">
      <template #actions>
        <el-button :icon="Download" @click="onExport">导出</el-button>
      </template>
    </PageHeader>

    <div class="kpi-grid">
      <StatCard label="客户总数" :value="all.length" unit="家" icon="OfficeBuilding" tone="primary" hint="政务、金融、医疗、教育、能源等" />
      <StatCard label="纳管容量" :value="(totalCap / 1024).toFixed(2)" unit="PB" icon="Coin" tone="cyan" hint="全部客户存储容量合计" />
      <StatCard label="设备总数" :value="totalDevices" unit="台" icon="Cpu" tone="purple" hint="含存储、备份与交换机" />
      <StatCard label="平均 SLA" :value="avgSla.toFixed(1)" unit="%" icon="DataLine" tone="success" hint="按已关闭工单统计" />
    </div>

    <div class="card flush">
      <div class="filters-bar">
        <div class="filters">
          <el-input v-model="query.keyword" placeholder="客户名称 / 区域 / 服务经理" :prefix-icon="Search" clearable @keyup.enter="search" />
          <el-select v-model="query.industry" placeholder="全部行业" clearable>
            <el-option v-for="(v, k) in industryMap" :key="k" :label="v" :value="k" />
          </el-select>
          <el-select v-model="query.level" placeholder="全部等级" clearable>
            <el-option label="A 级" value="A" />
            <el-option label="B 级" value="B" />
            <el-option label="C 级" value="C" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button :icon="Refresh" @click="reset">重置</el-button>
        </div>
        <span class="tiny muted">共 {{ total }} 家客户</span>
      </div>

      <el-table :data="rows" v-loading="loading" @row-click="(row: Customer) => router.push(`/customers/${row.id}`)" row-class-name="clickable">
        <el-table-column label="客户" min-width="230">
          <template #default="{ row }">
            <div class="cust-cell">
              <div class="cust-avatar">{{ row.shortName.slice(0, 2) }}</div>
              <div>
                <div class="cust-name">{{ row.name }}</div>
                <div class="tiny muted">{{ row.id }} · {{ row.region }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="行业" width="100">
          <template #default="{ row }">{{ row.industryName }}</template>
        </el-table-column>
        <el-table-column label="等级" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.level === 'A' ? 'warning' : row.level === 'B' ? 'primary' : 'info'" effect="plain">{{ row.level }} 级</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="资源规模" width="180">
          <template #default="{ row }">
            <div class="tiny">{{ row.poolCount }} 池 · {{ row.deviceCount }} 台设备</div>
            <div class="tiny muted">总容量 {{ formatCapacity(row.totalCapacityTB) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="容量使用率" width="150">
          <template #default="{ row }">
            <CapacityBar :value="(row.usedCapacityTB / (row.totalCapacityTB || 1)) * 100" />
          </template>
        </el-table-column>
        <el-table-column label="工单量" width="90">
          <template #default="{ row }">{{ row.ticketCount }} 单</template>
        </el-table-column>
        <el-table-column label="SLA 达成" width="110">
          <template #default="{ row }">
            <span class="sla-value" :class="row.slaRate < 97 ? 'warn' : ''">{{ row.slaRate.toFixed(1) }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="manager" label="服务经理" width="100" />
        <el-table-column label="操作" width="82" align="right" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="router.push(`/customers/${row.id}`)">详情</el-button>
          </template>
        </el-table-column>
        <template #empty><EmptyState text="没有匹配的客户" /></template>
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
import { Download, Refresh, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import CapacityBar from '@/components/CapacityBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getAllCustomers, getCustomers } from '@/api'
import type { Customer } from '@/types'
import { formatCapacity } from '@/utils/format'
import { exportCsv } from '@/utils/export'

const router = useRouter()
const loading = ref(false)
const rows = ref<Customer[]>([])
const all = ref<Customer[]>([])
const total = ref(0)
const query = reactive({ keyword: '', industry: '', level: '', page: 1, pageSize: 10 })

const industryMap = { government: '政务', finance: '金融', medical: '医疗', education: '教育', energy: '能源', manufacturing: '制造', telecom: '运营商' }

const totalCap = computed(() => all.value.reduce((s, c) => s + c.totalCapacityTB, 0))
const totalDevices = computed(() => all.value.reduce((s, c) => s + c.deviceCount, 0))
const avgSla = computed(() => (all.value.length ? all.value.reduce((s, c) => s + c.slaRate, 0) / all.value.length : 0))

async function load() {
  loading.value = true
  const res = await getCustomers({ ...query })
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
  query.industry = ''
  query.level = ''
  search()
}

function onExport() {
  exportCsv(
    '客户清单.csv',
    ['客户编号', '客户名称', '行业', '等级', '区域', '设备数', '总容量TB', '工单量', 'SLA达成率', '服务经理'],
    rows.value.map((c) => [c.id, c.name, c.industryName, c.level, c.region, c.deviceCount, c.totalCapacityTB, c.ticketCount, c.slaRate, c.manager])
  )
  ElMessage.success('已导出当前页数据')
}

onMounted(async () => {
  await load()
  all.value = await getAllCustomers()
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

.cust-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cust-avatar {
  width: 32px;
  height: 32px;
  border-radius: 7px;
  background: #e8f1ff;
  color: #1668dc;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.cust-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--neutral-900);
}

.sla-value {
  font-weight: 500;
  color: #16a34a;
  font-variant-numeric: tabular-nums;
}

.sla-value.warn {
  color: #d97706;
}

:deep(.clickable) {
  cursor: pointer;
}
</style>
