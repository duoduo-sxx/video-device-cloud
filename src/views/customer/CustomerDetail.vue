<template>
  <div class="page" v-loading="loading">
    <div class="back-row">
      <el-button link :icon="ArrowLeft" @click="router.push('/customers')">返回客户管理</el-button>
    </div>

    <div class="card head-card" v-if="customer">
      <div class="head-left">
        <div class="avatar">{{ customer.shortName.slice(0, 2) }}</div>
        <div>
          <div class="title-row">
            <h2>{{ customer.name }}</h2>
            <el-tag size="small" effect="plain" :type="customer.level === 'A' ? 'warning' : 'primary'">{{ customer.level }} 级客户</el-tag>
            <el-tag size="small" effect="plain" type="info">{{ customer.industryName }}</el-tag>
          </div>
          <div class="sub">{{ customer.region }} · 服务经理 {{ customer.manager }} · {{ customer.contactName }} {{ customer.contactPhone }}</div>
        </div>
      </div>
      <div class="head-actions">
        <el-button type="primary" size="small" @click="router.push({ path: '/service/tickets/new', query: { customerId: customer.id } })">报障</el-button>
        <el-button size="small" @click="router.push({ path: '/service/contracts' })">查看合同</el-button>
      </div>
    </div>

    <div class="kpi-grid" v-if="customer">
      <StatCard label="纳管容量" :value="formatCapacityValue(customer.totalCapacityTB)" :unit="customer.totalCapacityTB >= 1024 ? 'PB' : 'TB'" icon="Coin" tone="primary" :hint="`已用 ${formatCapacity(customer.usedCapacityTB)}`" />
      <StatCard label="容量使用率" :value="((customer.usedCapacityTB / customer.totalCapacityTB) * 100).toFixed(1)" unit="%" icon="PieChart" tone="cyan" :progress="(customer.usedCapacityTB / customer.totalCapacityTB) * 100" hint="按集群容量加权" />
      <StatCard label="纳管设备" :value="customer.deviceCount" unit="台" icon="Cpu" tone="purple" :hint="`${customer.poolCount} 个存储池`" />
      <StatCard label="SLA 达成率" :value="customer.slaRate.toFixed(1)" unit="%" icon="DataLine" tone="success" :hint="`累计 ${customer.ticketCount} 张工单`" />
    </div>

    <div class="card flush" v-if="customer">
      <el-tabs v-model="tab" class="tabs">
        <el-tab-pane label="概览" name="overview">
          <div class="ov">
            <div class="ov-left">
              <div class="section-title" style="margin-top: 0">客户档案</div>
              <div class="desc-list">
                <div class="desc-item"><span class="label">客户编号</span><span class="value mono">{{ customer.id }}</span></div>
                <div class="desc-item"><span class="label">所属区域</span><span class="value">{{ customer.region }}</span></div>
                <div class="desc-item"><span class="label">主联系人</span><span class="value">{{ customer.contactName }}</span></div>
                <div class="desc-item"><span class="label">联系电话</span><span class="value">{{ customer.contactPhone }}</span></div>
                <div class="desc-item"><span class="label">服务经理</span><span class="value">{{ customer.manager }}</span></div>
                <div class="desc-item"><span class="label">合同数量</span><span class="value">{{ customer.contractCount }} 份</span></div>
                <div class="desc-item"><span class="label">机房地址</span><span class="value">{{ customer.address }}</span></div>
                <div class="desc-item"><span class="label">最近工单</span><span class="value">{{ tickets[0]?.title || '--' }}</span></div>
              </div>
            </div>
            <div class="ov-chart">
              <ChartCard title="容量构成" :option="capacityOption" :height="200" />
            </div>
          </div>

          <div class="section-title">最近工单</div>
          <el-table :data="tickets.slice(0, 5)" size="small">
            <el-table-column prop="id" label="工单号" width="160">
              <template #default="{ row }"><span class="mono tiny">{{ row.id }}</span></template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="260" show-overflow-tooltip />
            <el-table-column prop="serviceItem" label="服务项" width="110" />
            <el-table-column label="优先级" width="96">
              <template #default="{ row }"><StatusTag kind="priority" :value="row.priority" /></template>
            </el-table-column>
            <el-table-column label="状态" width="96">
              <template #default="{ row }"><StatusTag kind="ticket" :value="row.status" /></template>
            </el-table-column>
            <el-table-column label="创建时间" width="140">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`设备 (${devices.length})`" name="devices">
          <el-table :data="devices" size="small">
            <el-table-column prop="name" label="设备名称" min-width="150" />
            <el-table-column label="型号" min-width="210">
              <template #default="{ row }">{{ row.vendor }} {{ row.model }}</template>
            </el-table-column>
            <el-table-column label="序列号" width="180">
              <template #default="{ row }"><span class="mono tiny">{{ row.sn }}</span></template>
            </el-table-column>
            <el-table-column prop="datacenter" label="机房" width="180" show-overflow-tooltip />
            <el-table-column label="磁盘健康" width="100">
              <template #default="{ row }">{{ row.diskCount ? `${row.diskHealth}%` : '--' }}</template>
            </el-table-column>
            <el-table-column label="保修到期" width="116">
              <template #default="{ row }">{{ row.warrantyEnd }}</template>
            </el-table-column>
            <el-table-column label="状态" width="96">
              <template #default="{ row }"><StatusTag kind="device" :value="row.status" /></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`存储池 (${pools.length})`" name="pools">
          <el-table :data="pools" size="small">
            <el-table-column prop="name" label="存储池" min-width="180">
              <template #default="{ row }"><span class="mono">{{ row.name }}</span></template>
            </el-table-column>
            <el-table-column prop="clusterName" label="所属集群" min-width="160" />
            <el-table-column label="总容量" width="100">
              <template #default="{ row }">{{ formatCapacity(row.totalTB) }}</template>
            </el-table-column>
            <el-table-column label="已用" width="100">
              <template #default="{ row }">{{ formatCapacity(row.usedTB) }}</template>
            </el-table-column>
            <el-table-column label="使用率" width="150">
              <template #default="{ row }"><CapacityBar :value="row.usageRate" /></template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }"><StatusTag kind="pool" :value="row.status" /></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`合同 (${contracts.length})`" name="contracts">
          <el-table :data="contracts" size="small">
            <el-table-column prop="id" label="合同号" width="150">
              <template #default="{ row }"><span class="mono">{{ row.id }}</span></template>
            </el-table-column>
            <el-table-column label="服务级别" width="110">
              <template #default="{ row }"><StatusTag kind="contract" :value="row.level" /></template>
            </el-table-column>
            <el-table-column prop="startDate" label="开始日期" width="120" />
            <el-table-column prop="endDate" label="结束日期" width="120" />
            <el-table-column label="服务额度" width="150">
              <template #default="{ row }">{{ row.usedDays }} / {{ row.quotaDays }} 人天</template>
            </el-table-column>
            <el-table-column label="金额" width="130">
              <template #default="{ row }">¥ {{ row.amount.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }"><StatusTag kind="contract" :value="row.status" /></template>
            </el-table-column>
            <el-table-column label="操作" width="76" align="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="router.push(`/service/contracts/${row.id}`)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`工单 (${tickets.length})`" name="tickets">
          <el-table :data="tickets" size="small">
            <el-table-column prop="id" label="工单号" width="160">
              <template #default="{ row }"><span class="mono tiny">{{ row.id }}</span></template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="260" show-overflow-tooltip />
            <el-table-column prop="serviceItem" label="服务项" width="110" />
            <el-table-column prop="assignee" label="处理人" width="96" />
            <el-table-column label="状态" width="96">
              <template #default="{ row }"><StatusTag kind="ticket" :value="row.status" /></template>
            </el-table-column>
            <el-table-column label="创建时间" width="140">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="76" align="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="router.push(`/service/tickets/${row.id}`)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="联系人" name="contacts">
          <div class="contact-grid">
            <div class="contact-card">
              <div class="c-avatar">{{ customer.contactName.slice(0, 1) }}</div>
              <div>
                <div class="c-name">{{ customer.contactName }} <el-tag size="small" effect="plain">主要联系人</el-tag></div>
                <div class="tiny muted">信息科 · 主任</div>
                <div class="tiny" style="margin-top: 6px">{{ customer.contactPhone }}</div>
              </div>
            </div>
            <div class="contact-card">
              <div class="c-avatar alt">刘</div>
              <div>
                <div class="c-name">刘志远</div>
                <div class="tiny muted">运维科 · 工程师</div>
                <div class="tiny" style="margin-top: 6px">139****8821</div>
              </div>
            </div>
            <div class="contact-card">
              <div class="c-avatar alt">孙</div>
              <div>
                <div class="c-name">孙倩</div>
                <div class="tiny muted">业务部门 · 对接人</div>
                <div class="tiny" style="margin-top: 6px">137****2140</div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import CapacityBar from '@/components/CapacityBar.vue'
import ChartCard from '@/components/ChartCard.vue'
import { getContracts, getCustomer, getDevices, getPools, getTickets } from '@/api'
import type { Contract, Customer, Device, StoragePool, Ticket } from '@/types'
import { formatCapacity, formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const customer = ref<Customer>()
const devices = ref<Device[]>([])
const pools = ref<StoragePool[]>([])
const tickets = ref<Ticket[]>([])
const contracts = ref<Contract[]>([])
const tab = ref('overview')

const capacityOption = computed<EChartsOption>(() => {
  const used = customer.value?.usedCapacityTB ?? 0
  const total = customer.value?.totalCapacityTB ?? 1
  return {
    series: [
      {
        type: 'pie',
        radius: ['62%', '82%'],
        center: ['50%', '50%'],
        label: { show: false },
        data: [
          { value: used, name: '已用', itemStyle: { color: '#1668DC' } },
          { value: Math.max(0, total - used), name: '剩余', itemStyle: { color: '#EEF1F6' } }
        ]
      }
    ],
    title: {
      text: `${((used / total) * 100).toFixed(1)}%`,
      subtext: formatCapacity(total),
      left: 'center',
      top: '40%',
      textStyle: { fontSize: 18, fontWeight: 600, color: '#1F2937' },
      subtextStyle: { fontSize: 10, color: '#8A94A6' }
    }
  }
})

function formatCapacityValue(tb: number) {
  return tb >= 1024 ? (tb / 1024).toFixed(2) : tb.toFixed(0)
}

onMounted(async () => {
  const id = String(route.params.id)
  const c = await getCustomer(id)
  customer.value = c
  const [d, p, t, ct] = await Promise.all([
    getDevices({ customerId: id, pageSize: 200 }),
    getPools({ customerId: id, pageSize: 100 }),
    getTickets({ customerId: id, pageSize: 100, tab: 'all' }),
    getContracts({ pageSize: 100 })
  ])
  devices.value = d.list
  pools.value = p.list
  tickets.value = t.list
  contracts.value = ct.list.filter((x) => x.customerId === id)
  loading.value = false
})
</script>

<style scoped>
.back-row {
  margin-bottom: -8px;
}

.head-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: #e8f1ff;
  color: #1668dc;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

h2 {
  margin: 0;
  font-size: 19px;
  font-weight: 600;
}

.sub {
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--neutral-400);
}

.head-actions {
  display: flex;
  gap: 8px;
}

.tabs {
  padding: 4px 20px 18px;
}

.ov {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) 280px;
  gap: 24px;
  align-items: center;
}

.ov-chart :deep(.chart-card) {
  border: none;
  box-shadow: none;
  padding: 0;
}

.ov-chart :deep(.chart-head) {
  display: none;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 6px 0;
}

.contact-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.c-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #1668dc;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.c-avatar.alt {
  background: #94a3b8;
}

.c-name {
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--divider);
}
</style>
