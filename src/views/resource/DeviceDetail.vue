<template>
  <div class="page" v-loading="loading">
    <div class="back-row">
      <el-button link :icon="ArrowLeft" @click="router.push('/resources/devices')">返回设备台账</el-button>
    </div>

    <div class="card head-card" v-if="device">
      <div class="head-left">
        <div class="title-row">
          <h2>{{ device.name }}</h2>
          <StatusTag kind="device" :value="device.status" />
          <el-tag size="small" effect="plain">{{ device.typeName }}</el-tag>
        </div>
        <div class="sub">{{ device.vendor }} {{ device.model }} · {{ device.customerName }} · {{ device.datacenter }} {{ device.rack }} {{ device.unit }}</div>
        <div class="actions">
          <el-button type="primary" size="small" :icon="Warning" @click="reportFault">报障</el-button>
          <el-button size="small" :icon="Box" @click="router.push('/service/spares')">领用备件</el-button>
          <el-button size="small" :icon="Tickets" @click="router.push('/service/tickets')">关联工单</el-button>
        </div>
      </div>
      <div class="head-side">
        <div class="side-item">
          <div class="side-label">磁盘健康</div>
          <div class="side-value num" :class="device.diskHealth < 90 ? 'warn' : ''">{{ device.diskCount ? `${device.diskHealth}%` : '--' }}</div>
          <div class="tiny muted">{{ device.diskCount }} 个盘位 · {{ failedDisks }} 个故障</div>
        </div>
        <div class="divider-v" />
        <div class="side-item">
          <div class="side-label">保修状态</div>
          <div class="side-value" :class="warrantyDays < 0 ? 'danger' : warrantyDays < 90 ? 'warn' : ''">
            {{ warrantyDays < 0 ? '已过保' : `剩余 ${warrantyDays} 天` }}
          </div>
          <div class="tiny muted">{{ formatDate(device.warrantyEnd) }} 到期</div>
        </div>
      </div>
    </div>

    <div class="card" v-if="device">
      <div class="desc-list">
        <div class="desc-item"><span class="label">设备编号</span><span class="value mono">{{ device.id }}</span></div>
        <div class="desc-item"><span class="label">序列号</span><span class="value mono">{{ device.sn }}</span></div>
        <div class="desc-item"><span class="label">管理 IP</span><span class="value mono">{{ device.mgmtIp }}</span></div>
        <div class="desc-item"><span class="label">固件版本</span><span class="value mono">{{ device.firmware }}</span></div>
        <div class="desc-item"><span class="label">所属集群</span><span class="value">{{ device.clusterName }}</span></div>
        <div class="desc-item"><span class="label">负责人</span><span class="value">{{ device.owner }}</span></div>
        <div class="desc-item"><span class="label">纳管时间</span><span class="value">{{ formatDate(device.createdAt) }}</span></div>
        <div class="desc-item"><span class="label">所在机房</span><span class="value">{{ device.datacenter }} · {{ device.rack }} · {{ device.unit }}</span></div>
      </div>
    </div>

    <div class="card flush" v-if="device">
      <el-tabs v-model="tab" class="tabs">
        <el-tab-pane :label="`磁盘 (${device.disks.length})`" name="disks">
          <el-table :data="device.disks" size="small" max-height="520">
            <el-table-column prop="slot" label="槽位" width="70" />
            <el-table-column prop="model" label="型号" min-width="180" />
            <el-table-column label="容量" width="100">
              <template #default="{ row }">{{ formatGB(row.capacityGB) }}</template>
            </el-table-column>
            <el-table-column prop="type" label="介质" width="80" />
            <el-table-column label="健康度" width="180">
              <template #default="{ row }">
                <div class="disk-health">
                  <CapacityBar :value="row.health" :height="5" :show-label="false" />
                  <span class="tiny num">{{ row.health }}%</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="预测故障" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.predictFail" type="danger" size="small" effect="light">预测故障</el-tag>
                <span v-else class="muted tiny">正常</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="96">
              <template #default="{ row }">
                <StatusTag :tone="row.status === 'failed' ? 'danger' : 'success'" :label="row.status === 'failed' ? '故障' : '在线'" />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="硬件配置" name="spec">
          <div class="spec-grid">
            <div class="spec-item"><span class="muted">控制器</span><b>双控制器 · 冗余热插拔</b></div>
            <div class="spec-item"><span class="muted">缓存</span><b>256 GB（含 8GB NVRAM）</b></div>
            <div class="spec-item"><span class="muted">前端端口</span><b>8 × 32Gb FC + 4 × 25GbE</b></div>
            <div class="spec-item"><span class="muted">后端端口</span><b>4 × 12Gb SAS</b></div>
            <div class="spec-item"><span class="muted">磁盘类型</span><b>NVMe SSD / SAS SSD 混合</b></div>
            <div class="spec-item"><span class="muted">电源模块</span><b>2 × 1200W 冗余</b></div>
            <div class="spec-item"><span class="muted">风扇模块</span><b>4 × 热插拔</b></div>
            <div class="spec-item"><span class="muted">RAID 级别</span><b>RAID6 / RAID-TP</b></div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="保修与合同" name="warranty">
          <div class="spec-grid">
            <div class="spec-item"><span class="muted">保修开始</span><b>{{ formatDate(device.createdAt) }}</b></div>
            <div class="spec-item"><span class="muted">保修到期</span><b>{{ formatDate(device.warrantyEnd) }}</b></div>
            <div class="spec-item"><span class="muted">服务级别</span><b>7×24 现场，4 小时响应</b></div>
            <div class="spec-item"><span class="muted">所属合同</span><b>{{ contract ? `${contract.id}（${contract.levelName}）` : '暂无' }}</b></div>
            <div class="spec-item"><span class="muted">合同期限</span><b>{{ contract ? `${contract.startDate} 至 ${contract.endDate}` : '--' }}</b></div>
            <div class="spec-item"><span class="muted">服务经理</span><b>{{ contract?.manager || '--' }}</b></div>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="`工单记录 (${tickets.length})`" name="tickets">
          <el-table :data="tickets" size="small">
            <el-table-column prop="id" label="工单号" width="160">
              <template #default="{ row }"><span class="mono tiny">{{ row.id }}</span></template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="280" show-overflow-tooltip />
            <el-table-column prop="serviceItem" label="服务项" width="120" />
            <el-table-column label="创建时间" width="150">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="96">
              <template #default="{ row }"><StatusTag kind="ticket" :value="row.status" /></template>
            </el-table-column>
            <el-table-column label="操作" width="76" align="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="router.push(`/service/tickets/${row.id}`)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Box, Tickets as TicketIcon, Warning } from '@element-plus/icons-vue'
import type { Contract, Device, Ticket } from '@/types'
import StatusTag from '@/components/StatusTag.vue'
import CapacityBar from '@/components/CapacityBar.vue'
import { getAllTickets, getContracts, getDevice } from '@/api'
import { dayjs, formatDate, formatDateTime, formatGB } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const device = ref<Device>()
const contract = ref<Contract>()
const tickets = ref<Ticket[]>([])
const tab = ref('disks')

const failedDisks = computed(() => device.value?.disks.filter((d) => d.status === 'failed').length ?? 0)
const warrantyDays = computed(() => (device.value ? dayjs(device.value.warrantyEnd).diff(dayjs(), 'day') : 0))

function reportFault() {
  router.push({ path: '/service/tickets/new', query: { deviceId: device.value?.id, customerId: device.value?.customerId } })
}

onMounted(async () => {
  const d = await getDevice(String(route.params.id))
  device.value = d
  if (d) {
    const [cs, ts] = await Promise.all([getContracts({ pageSize: 100 }), getAllTickets()])
    contract.value = cs.list.find((c) => c.customerId === d.customerId)
    tickets.value = ts.filter((t) => t.resourceIds.includes(d.id) || t.resourceNames.includes(d.name)).slice(0, 20)
  }
  loading.value = false
})
</script>

<style scoped>
.back-row {
  margin-bottom: -6px;
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
  min-width: 130px;
}

.side-label {
  font-size: 12px;
  color: var(--neutral-400);
  margin-bottom: 4px;
}

.side-value {
  font-size: 22px;
  font-weight: 600;
  color: var(--neutral-900);
  line-height: 26px;
}

.side-value.warn {
  color: #d97706;
}

.side-value.danger {
  color: #dc2626;
}

.divider-v {
  width: 1px;
  height: 48px;
  background: var(--divider);
}

.tabs {
  padding: 4px 20px 16px;
}

.spec-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 32px;
  padding: 8px 0 12px;
}

.spec-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 13px;
  padding: 9px 0;
  border-bottom: 1px dashed var(--divider);
}

.spec-item b {
  font-weight: 500;
  color: var(--neutral-900);
}

.disk-health {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--divider);
}
</style>
