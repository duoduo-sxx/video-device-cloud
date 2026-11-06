<template>
  <div class="page">
    <PageHeader title="备件管理" desc="备件库存、出入库与返修跟踪，保障故障响应时效">
      <template #actions>
        <el-button :icon="Download" @click="onExport">导出</el-button>
        <el-button type="primary" :icon="Plus" @click="ElMessage.info('演示环境：备件入库由仓储管理员操作')">备件入库</el-button>
      </template>
    </PageHeader>

    <div class="kpi-grid">
      <StatCard label="备件品类" :value="spares.length" unit="种" icon="Box" tone="primary" hint="覆盖 8 个厂商 14 个型号" />
      <StatCard label="库存总量" :value="totalStock" unit="件" icon="Files" tone="cyan" hint="含三个库房" />
      <StatCard label="低库存预警" :value="lowCount" unit="种" icon="Warning" tone="warning" hint="低于安全库存或已缺货" />
      <StatCard label="库存金额" :value="amount.toFixed(1)" unit="万元" icon="Money" tone="purple" hint="按单价与库存量估算" />
    </div>

    <div class="card flush">
      <el-tabs v-model="tab" class="tabs">
        <el-tab-pane :label="`库存 (${spares.length})`" name="stock">
          <div class="filters inner-filters">
            <el-input v-model="keyword" placeholder="备件名称 / 编码 / 型号" :prefix-icon="Search" clearable style="width: 260px" />
            <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width: 150px">
              <el-option label="库存正常" value="normal" />
              <el-option label="库存偏低" value="low" />
              <el-option label="已缺货" value="out" />
            </el-select>
          </div>
          <el-table :data="filteredSpares" v-loading="loading" row-class-name="spare-row">
            <el-table-column label="备件" min-width="230">
              <template #default="{ row }">
                <div class="spare-name" :class="{ low: row.status !== 'normal' }">{{ row.name }}</div>
                <div class="tiny muted mono">{{ row.code }} · {{ row.model }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="applicable" label="适用设备" min-width="220" show-overflow-tooltip />
            <el-table-column prop="warehouse" label="库房" width="140" />
            <el-table-column label="库存 / 安全" width="120">
              <template #default="{ row }">
                <span class="num" :class="row.stock <= row.safetyStock ? 'danger-text' : ''">{{ row.stock }}</span>
                <span class="tiny muted"> / {{ row.safetyStock }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单价" width="110">
              <template #default="{ row }">¥ {{ row.unitPrice.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column label="状态" width="112">
              <template #default="{ row }"><StatusTag kind="spare" :value="row.status" /></template>
            </el-table-column>
            <el-table-column label="操作" width="90" align="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" :disabled="row.stock === 0" @click="openOut(row)">领用</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState text="没有匹配的备件" /></template>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="出入库记录" name="records">
          <el-table :data="records">
            <el-table-column label="时间" width="160">
              <template #default="{ row }">{{ formatDateTime(row.time) }}</template>
            </el-table-column>
            <el-table-column prop="spareName" label="备件" min-width="200" />
            <el-table-column prop="typeName" label="类型" width="110" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column label="关联工单" width="170">
              <template #default="{ row }">
                <span v-if="row.ticketId" class="link mono tiny" @click="router.push(`/service/tickets/${row.ticketId}`)">{{ row.ticketId }}</span>
                <span v-else class="muted">--</span>
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column prop="warehouse" label="库房" width="140" />
            <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="返修跟踪" name="repair">
          <el-table :data="repairRecords">
            <el-table-column label="时间" width="160">
              <template #default="{ row }">{{ formatDateTime(row.time) }}</template>
            </el-table-column>
            <el-table-column prop="spareName" label="备件" min-width="220" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="operator" label="经办人" width="100" />
            <el-table-column label="状态" width="120">
              <template #default><StatusTag tone="warning" label="返修在途" /></template>
            </el-table-column>
            <el-table-column prop="remark" label="说明" min-width="240" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="outVisible" title="备件领用" width="460px">
      <el-form label-position="top">
        <el-form-item label="备件">
          <el-input :model-value="current ? `${current.name}（库存 ${current.stock}）` : ''" disabled />
        </el-form-item>
        <el-form-item label="领用数量">
          <el-input-number v-model="outQty" :min="1" :max="current?.stock ?? 1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="关联工单">
          <el-select v-model="outTicket" filterable placeholder="选择工单" style="width: 100%">
            <el-option v-for="t in openTickets" :key="t.id" :label="`${t.id} · ${t.title}`" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="outRemark" placeholder="如：更换 3 号槽位故障盘" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="outVisible = false">取消</el-button>
        <el-button type="primary" @click="submitOut">确认出库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Box, Download, Plus, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getAllTickets, getSpareRecords, getSpares, outSpare } from '@/api'
import type { SparePart, SpareRecord, Ticket } from '@/types'
import { formatDateTime } from '@/utils/format'
import { exportCsv } from '@/utils/export'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const store = useUserStore()
const loading = ref(false)
const tab = ref('stock')
const spares = ref<SparePart[]>([])
const records = ref<SpareRecord[]>([])
const tickets = ref<Ticket[]>([])
const keyword = ref('')
const statusFilter = ref('')

const outVisible = ref(false)
const current = ref<SparePart>()
const outQty = ref(1)
const outTicket = ref('')
const outRemark = ref('')

const totalStock = computed(() => spares.value.reduce((s, x) => s + x.stock, 0))
const lowCount = computed(() => spares.value.filter((x) => x.status !== 'normal').length)
const amount = computed(() => spares.value.reduce((s, x) => s + x.stock * x.unitPrice, 0) / 10000)
const filteredSpares = computed(() =>
  spares.value.filter((s) => {
    const kw = keyword.value.trim().toLowerCase()
    const matchKw = !kw || `${s.name}${s.code}${s.model}`.toLowerCase().includes(kw)
    return matchKw && (!statusFilter.value || s.status === statusFilter.value)
  })
)
const repairRecords = computed(() => records.value.filter((r) => r.type === 'repair'))
const openTickets = computed(() => tickets.value.filter((t) => t.status !== 'closed').slice(0, 60))

function openOut(row: SparePart) {
  current.value = row
  outQty.value = 1
  outTicket.value = ''
  outRemark.value = ''
  outVisible.value = true
}

async function submitOut() {
  if (!current.value) return
  await outSpare(current.value.id, outQty.value, outTicket.value, store.user?.name ?? '陈立', outRemark.value)
  outVisible.value = false
  ElMessage.success('备件已出库，库存已更新')
  await load()
}

function onExport() {
  exportCsv(
    '备件库存.csv',
    ['编码', '名称', '型号', '适用设备', '库房', '库存', '安全库存', '单价', '状态'],
    filteredSpares.value.map((s) => [s.code, s.name, s.model, s.applicable, s.warehouse, s.stock, s.safetyStock, s.unitPrice, s.status])
  )
  ElMessage.success('已导出')
}

async function load() {
  loading.value = true
  const [sp, rec, ts] = await Promise.all([getSpares({ page: 1, pageSize: 200 }), getSpareRecords(), getAllTickets()])
  spares.value = sp.list
  records.value = rec
  tickets.value = ts
  loading.value = false
}

onMounted(load)
</script>

<style scoped>
.tabs {
  padding: 4px 20px 16px;
}

.inner-filters {
  padding: 4px 0 14px;
}

.spare-name {
  font-size: 13px;
  color: var(--neutral-900);
}

.spare-name.low {
  color: #b45309;
}

.danger-text {
  color: #dc2626;
  font-weight: 600;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--divider);
}
</style>
