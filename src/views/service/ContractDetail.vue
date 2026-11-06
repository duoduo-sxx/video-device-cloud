<template>
  <div class="page" v-loading="loading">
    <div class="back-row">
      <el-button link :icon="ArrowLeft" @click="router.push('/service/contracts')">返回服务合同</el-button>
    </div>

    <div class="card head-card" v-if="contract">
      <div class="head-left">
        <div class="title-row">
          <h2 class="mono">{{ contract.id }}</h2>
          <StatusTag kind="contract" :value="contract.level" />
          <StatusTag kind="contract" :value="contract.status" />
        </div>
        <div class="sub">{{ contract.customerName }} · 服务经理 {{ contract.manager }} · 覆盖 {{ contract.deviceCount }} 台设备</div>
        <div class="actions">
          <el-button type="primary" size="small" @click="ElMessage.info('演示环境：续签流程需线下审批')">发起续签</el-button>
          <el-button size="small" @click="ElMessage.success('合同已导出为 PDF（演示）')">导出合同</el-button>
        </div>
      </div>
      <div class="head-side">
        <div class="side-item">
          <div class="side-label">服务额度</div>
          <div class="side-value num">{{ contract.quotaDays - contract.usedDays }}<span class="unit"> 人天</span></div>
          <div class="tiny muted">已用 {{ contract.usedDays }} / {{ contract.quotaDays }} 人天</div>
        </div>
        <div class="divider-v" />
        <div class="side-item">
          <div class="side-label">合同金额</div>
          <div class="side-value num">¥{{ (contract.amount / 10000).toFixed(1) }}<span class="unit"> 万</span></div>
          <div class="tiny muted">{{ contract.startDate }} 至 {{ contract.endDate }}</div>
        </div>
      </div>
    </div>

    <div class="cols-2" v-if="contract">
      <div class="card">
        <div class="card-title">服务级别条款（SLA）</div>
        <el-table :data="contract.slaItems" size="small" style="margin-top: 12px">
          <el-table-column prop="serviceItem" label="服务项" width="120" />
          <el-table-column label="响应时限" width="110">
            <template #default="{ row }">{{ row.responseHours }} 小时</template>
          </el-table-column>
          <el-table-column label="解决时限" width="110">
            <template #default="{ row }">{{ row.resolveHours }} 小时</template>
          </el-table-column>
          <el-table-column prop="penalty" label="违约条款" min-width="240" show-overflow-tooltip />
        </el-table>
      </div>

      <div class="card">
        <div class="card-title">合同信息</div>
        <div class="info-list">
          <div class="info-row"><span>客户名称</span><b>{{ contract.customerName }}</b></div>
          <div class="info-row"><span>服务级别</span><b>{{ contract.levelName }}</b></div>
          <div class="info-row"><span>合同期限</span><b>{{ contract.startDate }} 至 {{ contract.endDate }}</b></div>
          <div class="info-row"><span>服务额度</span><b>{{ contract.quotaDays }} 人天</b></div>
          <div class="info-row"><span>已消耗</span><b>{{ contract.usedDays }} 人天</b></div>
          <div class="info-row"><span>覆盖设备</span><b>{{ contract.deviceCount }} 台</b></div>
          <div class="info-row"><span>服务经理</span><b>{{ contract.manager }}</b></div>
          <div class="info-row"><span>付款方式</span><b>按季度支付，季初 10 个工作日内</b></div>
        </div>
        <div class="section-title">付款节点</div>
        <el-timeline>
          <el-timeline-item v-for="(p, i) in payments" :key="i" :timestamp="p.date" :color="p.done ? '#16A34A' : '#C9D3E0'">
            {{ p.label }} · ¥{{ p.amount.toLocaleString() }}
            <el-tag v-if="p.done" size="small" type="success" effect="plain" style="margin-left: 8px">已支付</el-tag>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>

    <div class="card" v-if="contract">
      <div class="card-head">
        <div class="card-title">覆盖设备清单 <span class="sub">{{ devices.length }} 台</span></div>
        <el-button link type="primary" @click="router.push('/resources/devices')">设备台账</el-button>
      </div>
      <el-table :data="devices" size="small">
        <el-table-column prop="name" label="设备名称" min-width="150" />
        <el-table-column label="型号" min-width="220">
          <template #default="{ row }">{{ row.vendor }} {{ row.model }}</template>
        </el-table-column>
        <el-table-column label="序列号" width="180">
          <template #default="{ row }"><span class="mono tiny">{{ row.sn }}</span></template>
        </el-table-column>
        <el-table-column prop="datacenter" label="机房" width="180" show-overflow-tooltip />
        <el-table-column label="保修到期" width="120">
          <template #default="{ row }">{{ row.warrantyEnd }}</template>
        </el-table-column>
        <el-table-column label="状态" width="96">
          <template #default="{ row }"><StatusTag kind="device" :value="row.status" /></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag.vue'
import { getContract, getDevices } from '@/api'
import type { Contract, Device } from '@/types'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const contract = ref<Contract>()
const devices = ref<Device[]>([])

const payments = computed(() => {
  if (!contract.value) return []
  const q = Math.round(contract.value.amount / 4)
  return [
    { label: '第一期（合同签订）', date: contract.value.startDate, amount: q, done: true },
    { label: '第二期（服务满一季度）', date: '2026-06-30', amount: q, done: true },
    { label: '第三期（服务满两季度）', date: '2026-09-30', amount: q, done: true },
    { label: '第四期（服务期满）', date: contract.value.endDate, amount: contract.value.amount - q * 3, done: false }
  ]
})

onMounted(async () => {
  const c = await getContract(String(route.params.id))
  contract.value = c
  if (c) {
    const res = await getDevices({ customerId: c.customerId, pageSize: 200 })
    devices.value = res.list
  }
  loading.value = false
})
</script>

<style scoped>
.back-row {
  margin-bottom: -8px;
}

.head-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.sub {
  margin-top: 7px;
  font-size: 12.5px;
  color: var(--neutral-400);
}

.actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}

.head-side {
  display: flex;
  align-items: center;
  gap: 22px;
  flex: none;
}

.side-item {
  min-width: 150px;
}

.side-label {
  font-size: 12px;
  color: var(--neutral-400);
  margin-bottom: 4px;
}

.side-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--neutral-900);
  line-height: 28px;
}

.side-value .unit {
  font-size: 12px;
  font-weight: 400;
  color: var(--neutral-400);
}

.divider-v {
  width: 1px;
  height: 48px;
  background: var(--divider);
}

.info-list {
  margin-top: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12.5px;
  padding: 8px 0;
  border-bottom: 1px dashed var(--divider);
}

.info-row span {
  color: var(--neutral-400);
}

.info-row b {
  font-weight: 500;
  color: var(--neutral-900);
  text-align: right;
}
</style>
