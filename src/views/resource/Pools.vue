<template>
  <div class="page">
    <PageHeader title="存储池" desc="按客户与集群查看容量水位、增长趋势与扩容建议">
      <template #actions>
        <el-button :icon="Download" @click="onExport">导出</el-button>
        <el-switch v-model="onlyRisk" active-text="仅看风险池" style="margin-left: 4px" @change="search" />
      </template>
    </PageHeader>

    <div class="kpi-grid">
      <StatCard label="存储池总数" :value="all.length" unit="个" icon="Files" tone="primary" hint="分布于 18 套集群" />
      <StatCard label="总容量" :value="(stat.total / 1024).toFixed(2)" unit="PB" icon="Coin" tone="cyan" hint="已扣除 RAID 冗余" />
      <StatCard label="已用容量" :value="(stat.used / 1024).toFixed(2)" unit="PB" icon="PieChart" tone="purple" :progress="stat.rate" :hint="`整体使用率 ${stat.rate.toFixed(1)}%`" />
      <StatCard label="超阈值池" :value="stat.risk" unit="个" icon="Warning" tone="danger" hint="使用率 ≥ 85%，需扩容或清理" />
    </div>

    <div class="card flush">
      <div class="filters-bar">
        <div class="filters">
          <el-input v-model="query.keyword" placeholder="存储池名称 / 集群" :prefix-icon="Search" clearable @keyup.enter="search" />
          <el-select v-model="query.customerId" placeholder="全部客户" clearable>
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-select v-model="query.status" placeholder="全部状态" clearable>
            <el-option label="正常" value="normal" />
            <el-option label="容量警告" value="warning" />
            <el-option label="容量严重" value="critical" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button :icon="Refresh" @click="reset">重置</el-button>
        </div>
        <span class="tiny muted">共 {{ total }} 个存储池</span>
      </div>

      <el-table :data="rows" v-loading="loading" row-class-name="pool-row">
        <el-table-column label="存储池" min-width="210">
          <template #default="{ row }">
            <div class="pool-cell">
              <span v-if="row.usageRate >= 92" class="risk-bar" />
              <div>
                <div class="mono name">{{ row.name }}</div>
                <div class="tiny muted">{{ row.clusterName }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户" min-width="160" show-overflow-tooltip />
        <el-table-column label="冗余 / 介质" width="150">
          <template #default="{ row }">
            <div>{{ row.raidLevel }}</div>
            <div class="tiny muted">{{ row.diskType }}</div>
          </template>
        </el-table-column>
        <el-table-column label="总容量" width="100">
          <template #default="{ row }"><span class="num">{{ formatCapacity(row.totalTB) }}</span></template>
        </el-table-column>
        <el-table-column label="已用 / 剩余" width="150">
          <template #default="{ row }">
            <span class="num">{{ formatCapacity(row.usedTB) }}</span>
            <span class="tiny muted"> / {{ formatCapacity(row.freeTB) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="使用率" width="150">
          <template #default="{ row }"><CapacityBar :value="row.usageRate" /></template>
        </el-table-column>
        <el-table-column label="月均增长" width="100">
          <template #default="{ row }"><span class="num">{{ row.growRatePerMonth }} TB</span></template>
        </el-table-column>
        <el-table-column label="预计可用" width="100">
          <template #default="{ row }">
            <span :class="row.forecastDays < 90 ? 'danger-text' : ''">{{ row.forecastDays }} 天</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="112">
          <template #default="{ row }"><StatusTag kind="pool" :value="row.status" /></template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right" align="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openExpand(row)">扩容</el-button>
            <el-button link type="primary" size="small" @click="router.push(`/resources/volumes?poolId=${row.id}`)">卷</el-button>
          </template>
        </el-table-column>
        <template #empty><EmptyState text="没有匹配的存储池" /></template>
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

    <el-dialog v-model="expandVisible" title="发起扩容变更" width="480px">
      <div v-if="current" class="expand-body">
        <div class="expand-row"><span class="muted">存储池</span><b class="mono">{{ current.name }}</b></div>
        <div class="expand-row"><span class="muted">当前容量</span><span>{{ formatCapacity(current.totalTB) }}（已用 {{ current.usageRate }}%）</span></div>
        <div class="expand-row"><span class="muted">预计可用</span><span>{{ current.forecastDays }} 天</span></div>
        <el-form label-position="top" style="margin-top: 16px">
          <el-form-item label="扩容容量（TB）">
            <el-input-number v-model="addTB" :min="8" :max="512" :step="8" style="width: 100%" />
          </el-form-item>
          <el-form-item label="变更说明">
            <el-input v-model="reason" type="textarea" :rows="3" placeholder="说明扩容原因与实施窗口" />
          </el-form-item>
        </el-form>
        <div class="alert-tip">提交后将生成变更单并进入审批流程，审批通过后在实施窗口内执行。</div>
      </div>
      <template #footer>
        <el-button @click="expandVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitExpand">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Download, Refresh, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import CapacityBar from '@/components/CapacityBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { expandPool, getAllCustomers, getPools } from '@/api'
import type { Customer, StoragePool } from '@/types'
import { formatCapacity } from '@/utils/format'
import { exportCsv } from '@/utils/export'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const rows = ref<StoragePool[]>([])
const all = ref<StoragePool[]>([])
const total = ref(0)
const customers = ref<Customer[]>([])
const onlyRisk = ref(false)

const query = reactive({ keyword: '', customerId: '', status: '', page: 1, pageSize: 10 })

const expandVisible = ref(false)
const submitting = ref(false)
const current = ref<StoragePool>()
const addTB = ref(40)
const reason = ref('容量水位接近阈值，需在业务低峰期扩容。')

const stat = computed(() => {
  const t = all.value.reduce((s, p) => s + p.totalTB, 0)
  const u = all.value.reduce((s, p) => s + p.usedTB, 0)
  return {
    total: t,
    used: u,
    rate: t ? Number(((u / t) * 100).toFixed(1)) : 0,
    risk: all.value.filter((p) => p.usageRate >= 85).length
  }
})

async function load() {
  loading.value = true
  const res = await getPools({
    keyword: query.keyword,
    customerId: query.customerId,
    status: query.status,
    minUsage: onlyRisk.value ? 85 : undefined,
    page: query.page,
    pageSize: query.pageSize
  })
  rows.value = res.list
  total.value = res.total
  loading.value = false
}

async function loadAll() {
  const res = await getPools({ page: 1, pageSize: 999 })
  all.value = res.list
}

function search() {
  query.page = 1
  load()
}

function reset() {
  query.keyword = ''
  query.customerId = ''
  query.status = ''
  search()
}

function openExpand(row: StoragePool) {
  current.value = row
  addTB.value = row.usageRate >= 92 ? 80 : 40
  expandVisible.value = true
}

async function submitExpand() {
  if (!current.value) return
  submitting.value = true
  await expandPool(current.value.id, addTB.value)
  submitting.value = false
  expandVisible.value = false
  ElMessage.success('扩容申请已提交，容量已更新')
  await Promise.all([load(), loadAll()])
}

function onExport() {
  exportCsv(
    '存储池台账.csv',
    ['存储池', '集群', '客户', '冗余', '介质', '总容量TB', '已用TB', '剩余TB', '使用率%', '预计可用天数', '状态'],
    rows.value.map((p) => [p.name, p.clusterName, p.customerName, p.raidLevel, p.diskType, p.totalTB, p.usedTB, p.freeTB, p.usageRate, p.forecastDays, p.status])
  )
  ElMessage.success('已导出当前页数据')
}

onMounted(async () => {
  customers.value = await getAllCustomers()
  if (route.query.poolId) query.keyword = ''
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

.pool-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.risk-bar {
  width: 3px;
  height: 30px;
  border-radius: 3px;
  background: #e5484d;
  flex: none;
}

.name {
  font-size: 12.5px;
  color: var(--neutral-900);
}

.danger-text {
  color: #e5484d;
  font-weight: 500;
}

.expand-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 7px 0;
  border-bottom: 1px dashed var(--divider);
}

.alert-tip {
  margin-top: 12px;
  background: #f5f8fd;
  border: 1px solid #e3ecf9;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  color: #5b6675;
  line-height: 1.6;
}
</style>
