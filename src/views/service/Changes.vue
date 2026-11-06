<template>
  <div class="page">
    <PageHeader title="变更管理" desc="存储扩容、固件升级、配置调整等变更的申请、审批、实施与验证">
      <template #actions>
        <el-button :icon="Refresh" @click="load">刷新</el-button>
      </template>
    </PageHeader>

    <div class="kpi-grid">
      <StatCard label="变更总数" :value="all.length" unit="单" icon="SetUp" tone="primary" hint="近 3 个月" />
      <StatCard label="待审批" :value="pendingCount" unit="单" icon="Clock" tone="warning" hint="需服务经理审核" />
      <StatCard label="实施中" :value="implementingCount" unit="单" icon="Loading" tone="cyan" hint="处于变更窗口内" />
      <StatCard label="高风险变更" :value="highRisk" unit="单" icon="Warning" tone="danger" hint="需双人复核与回滚预案" />
    </div>

    <div class="card flush">
      <div class="filters-bar">
        <div class="filters">
          <el-select v-model="status" placeholder="全部状态" clearable style="width: 150px" @change="load">
            <el-option label="审批中" value="approving" />
            <el-option label="已审批" value="approved" />
            <el-option label="实施中" value="implementing" />
            <el-option label="验证中" value="verifying" />
            <el-option label="已关闭" value="closed" />
          </el-select>
          <span class="tiny muted">共 {{ total }} 条变更</span>
        </div>
      </div>

      <el-table :data="rows" v-loading="loading" @row-click="(row: Change) => openDetail(row)" row-class-name="clickable">
        <el-table-column label="变更单号" width="160">
          <template #default="{ row }"><span class="mono">{{ row.id }}</span></template>
        </el-table-column>
        <el-table-column label="变更标题" min-width="300">
          <template #default="{ row }">
            <div class="c-title">{{ row.title }}</div>
            <div class="tiny muted">{{ row.resourceNames.join('、') || '无关联资源' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户" min-width="170" show-overflow-tooltip />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">{{ row.typeName }}</template>
        </el-table-column>
        <el-table-column label="风险" width="86">
          <template #default="{ row }">
            <StatusTag :tone="row.risk === 'high' ? 'danger' : row.risk === 'medium' ? 'warning' : 'success'" :label="row.risk === 'high' ? '高' : row.risk === 'medium' ? '中' : '低'" />
          </template>
        </el-table-column>
        <el-table-column label="实施窗口" width="190">
          <template #default="{ row }">
            <div>{{ formatDateTime(row.windowStart) }}</div>
            <div class="tiny muted">至 {{ formatDateTime(row.windowEnd) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="实施人" width="96" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><StatusTag kind="change" :value="row.status" /></template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'approving'" link type="primary" size="small" @click.stop="approve(row)">审批</el-button>
            <el-button v-else link type="primary" size="small" @click.stop="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
        <template #empty><EmptyState text="暂无变更单" /></template>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="load"
          @size-change="load"
        />
      </div>
    </div>

    <el-drawer v-model="detailVisible" title="变更详情" size="520px">
      <div v-if="current" class="chg-detail">
        <div class="chg-head">
          <span class="mono tiny muted">{{ current.id }}</span>
          <StatusTag kind="change" :value="current.status" />
          <StatusTag :tone="current.risk === 'high' ? 'danger' : 'warning'" :label="`${current.risk === 'high' ? '高' : current.risk === 'medium' ? '中' : '低'}风险`" />
        </div>
        <h3>{{ current.title }}</h3>
        <div class="info-row"><span>客户</span><b>{{ current.customerName }}</b></div>
        <div class="info-row"><span>变更类型</span><b>{{ current.typeName }}</b></div>
        <div class="info-row"><span>实施人</span><b>{{ current.owner }}</b></div>
        <div class="info-row"><span>审批人</span><b>{{ current.approver }}</b></div>
        <div class="info-row"><span>实施窗口</span><b>{{ formatDateTime(current.windowStart) }} 至 {{ formatDateTime(current.windowEnd) }}</b></div>
        <div class="info-row"><span>关联资源</span><b>{{ current.resourceNames.join('、') || '--' }}</b></div>

        <div class="section-title">变更原因</div>
        <p class="para">{{ current.reason }}</p>
        <div class="section-title">回滚方案</div>
        <div class="rollback">{{ current.rollbackPlan }}</div>

        <div class="drawer-actions">
          <el-button v-if="current.status === 'approving'" type="primary" @click="approve(current)">审批通过</el-button>
          <el-button @click="detailVisible = false">关闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { approveChange, getChanges } from '@/api'
import type { Change } from '@/types'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const rows = ref<Change[]>([])
const all = ref<Change[]>([])
const total = ref(0)
const status = ref('')
const page = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const current = ref<Change>()

const pendingCount = computed(() => all.value.filter((c) => c.status === 'approving').length)
const implementingCount = computed(() => all.value.filter((c) => c.status === 'implementing').length)
const highRisk = computed(() => all.value.filter((c) => c.risk === 'high').length)

async function load() {
  loading.value = true
  const res = await getChanges({ page: page.value, pageSize: pageSize.value, status: status.value })
  rows.value = res.list
  total.value = res.total
  const allRes = await getChanges({ page: 1, pageSize: 999 })
  all.value = allRes.list
  loading.value = false
}

function openDetail(row: Change) {
  current.value = row
  detailVisible.value = true
}

async function approve(row: Change) {
  const ok = await ElMessageBox.confirm(`确认审批通过变更「${row.title}」？`, '变更审批', { type: 'warning' }).catch(() => null)
  if (!ok) return
  await approveChange(row.id)
  ElMessage.success('审批已通过，变更将在窗口期实施')
  detailVisible.value = false
  await load()
}

onMounted(load)
</script>

<style scoped>
.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--divider);
}

.c-title {
  font-size: 13px;
  color: var(--neutral-900);
  line-height: 18px;
}

.chg-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 12px 0 16px;
  line-height: 1.5;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  font-size: 12.5px;
  padding: 8px 0;
  border-bottom: 1px dashed var(--divider);
}

.info-row span {
  color: var(--neutral-400);
  flex: none;
}

.info-row b {
  font-weight: 500;
  text-align: right;
  color: var(--neutral-900);
}

.para {
  font-size: 13px;
  color: var(--neutral-600);
  line-height: 1.75;
  margin: 0;
}

.rollback {
  background: #fff8ec;
  border: 1px solid #fbe3bd;
  border-radius: 6px;
  padding: 12px 14px;
  font-size: 12.5px;
  line-height: 1.7;
  color: #8a5b12;
}

.drawer-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--divider);
  display: flex;
  gap: 8px;
}

:deep(.clickable) {
  cursor: pointer;
}
</style>
