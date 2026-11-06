<template>
  <div class="page">
    <PageHeader title="服务合同" desc="合同期限、服务级别、服务额度与覆盖设备，到期前自动提醒">
      <template #actions>
        <el-button :icon="Download" @click="onExport">导出</el-button>
      </template>
    </PageHeader>

    <div class="kpi-grid">
      <StatCard label="合同总数" :value="all.length" unit="份" icon="Document" tone="primary" hint="覆盖 8 家客户" />
      <StatCard label="生效中" :value="activeCount" unit="份" icon="CircleCheck" tone="success" hint="服务正常履行" />
      <StatCard label="90 天内到期" :value="expiringCount" unit="份" icon="Clock" tone="warning" hint="需提前启动续签" />
      <StatCard label="合同总额" :value="(amount / 10000).toFixed(0)" unit="万元" icon="Money" tone="purple" hint="年度服务合同金额" />
    </div>

    <div class="card flush">
      <div class="filters-bar">
        <div class="filters">
          <el-input v-model="query.keyword" placeholder="合同号 / 客户 / 服务经理" :prefix-icon="Search" clearable @keyup.enter="search" />
          <el-select v-model="query.level" placeholder="全部级别" clearable>
            <el-option label="黄金级" value="gold" />
            <el-option label="白银级" value="silver" />
            <el-option label="青铜级" value="bronze" />
          </el-select>
          <el-select v-model="query.status" placeholder="全部状态" clearable>
            <el-option label="生效中" value="active" />
            <el-option label="即将到期" value="expiring" />
            <el-option label="已到期" value="expired" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button :icon="Refresh" @click="reset">重置</el-button>
        </div>
        <span class="tiny muted">共 {{ total }} 份合同</span>
      </div>

      <el-table :data="rows" v-loading="loading" @row-click="(row: Contract) => router.push(`/service/contracts/${row.id}`)" row-class-name="clickable">
        <el-table-column label="合同号" width="150">
          <template #default="{ row }"><span class="mono">{{ row.id }}</span></template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户" min-width="180" show-overflow-tooltip />
        <el-table-column label="服务级别" width="110">
          <template #default="{ row }"><StatusTag kind="contract" :value="row.level" /></template>
        </el-table-column>
        <el-table-column label="合同期限" width="200">
          <template #default="{ row }">
            <div>{{ row.startDate }}</div>
            <div class="tiny muted">至 {{ row.endDate }}</div>
          </template>
        </el-table-column>
        <el-table-column label="服务额度（人天）" width="190">
          <template #default="{ row }">
            <div class="quota">
              <CapacityBar :value="(row.usedDays / row.quotaDays) * 100" :height="5" />
              <span class="tiny muted">{{ row.usedDays }} / {{ row.quotaDays }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="覆盖设备" width="100">
          <template #default="{ row }">{{ row.deviceCount }} 台</template>
        </el-table-column>
        <el-table-column label="合同金额" width="130">
          <template #default="{ row }">¥ {{ row.amount.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="状态" width="112">
          <template #default="{ row }"><StatusTag kind="contract" :value="row.status" /></template>
        </el-table-column>
        <el-table-column prop="manager" label="服务经理" width="100" />
        <el-table-column label="操作" width="82" fixed="right" align="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="router.push(`/service/contracts/${row.id}`)">详情</el-button>
          </template>
        </el-table-column>
        <template #empty><EmptyState text="没有匹配的合同" /></template>
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
import StatusTag from '@/components/StatusTag.vue'
import CapacityBar from '@/components/CapacityBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getContracts } from '@/api'
import type { Contract } from '@/types'
import { exportCsv } from '@/utils/export'

const router = useRouter()
const loading = ref(false)
const rows = ref<Contract[]>([])
const all = ref<Contract[]>([])
const total = ref(0)
const query = reactive({ keyword: '', level: '', status: '', page: 1, pageSize: 10 })

const activeCount = computed(() => all.value.filter((c) => c.status === 'active').length)
const expiringCount = computed(() => all.value.filter((c) => c.status === 'expiring').length)
const amount = computed(() => all.value.reduce((s, c) => s + c.amount, 0))

async function load() {
  loading.value = true
  const res = await getContracts({ ...query })
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
  query.level = ''
  query.status = ''
  search()
}

function onExport() {
  exportCsv(
    '服务合同.csv',
    ['合同号', '客户', '级别', '开始', '结束', '额度人天', '已用人天', '覆盖设备', '金额', '状态'],
    rows.value.map((c) => [c.id, c.customerName, c.levelName, c.startDate, c.endDate, c.quotaDays, c.usedDays, c.deviceCount, c.amount, c.status])
  )
  ElMessage.success('已导出当前页数据')
}

onMounted(async () => {
  await load()
  const res = await getContracts({ page: 1, pageSize: 999 })
  all.value = res.list
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

.quota {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

:deep(.clickable) {
  cursor: pointer;
}
</style>
