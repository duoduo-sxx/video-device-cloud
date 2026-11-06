<template>
  <div class="page" v-loading="loading">
    <div class="back-row">
      <el-button link :icon="ArrowLeft" @click="router.push('/resources/clusters')">返回存储集群</el-button>
    </div>

    <div class="card head-card" v-if="cluster">
      <div class="head-left">
        <div class="title-row">
          <h2>{{ cluster.name }}</h2>
          <StatusTag kind="cluster" :value="cluster.status" />
          <el-tag size="small" effect="plain">{{ cluster.healthScore }} 分</el-tag>
        </div>
        <div class="sub">
          {{ cluster.vendor }} {{ cluster.model }} · {{ cluster.customerName }} · {{ cluster.datacenter }} {{ cluster.rack }} {{ cluster.unit }}
        </div>
        <div class="actions">
          <el-button type="primary" size="small" :icon="SetUp" @click="ElMessage.info('已发起变更申请，请前往变更管理审批')">发起变更</el-button>
          <el-button size="small" :icon="Warning" @click="router.push('/monitor/alarms')">查看告警</el-button>
          <el-button size="small" :icon="Refresh" @click="load">刷新</el-button>
        </div>
      </div>
      <div class="head-chart">
        <ChartCard title="容量水位" :option="capacityOption" :height="170" />
      </div>
    </div>

    <div class="card" v-if="cluster">
      <div class="desc-list">
        <div class="desc-item"><span class="label">集群编号</span><span class="value mono">{{ cluster.id }}</span></div>
        <div class="desc-item"><span class="label">管理 IP</span><span class="value mono">{{ cluster.mgmtIp }}</span></div>
        <div class="desc-item"><span class="label">固件版本</span><span class="value mono">{{ cluster.firmware }}</span></div>
        <div class="desc-item"><span class="label">保修到期</span><span class="value">{{ formatDate(cluster.warrantyEnd) }}</span></div>
        <div class="desc-item"><span class="label">负责人</span><span class="value">{{ cluster.owner }}</span></div>
        <div class="desc-item"><span class="label">纳管时间</span><span class="value">{{ formatDate(cluster.createdAt) }}</span></div>
        <div class="desc-item"><span class="label">存储池 / 卷</span><span class="value">{{ cluster.poolCount }} 个 / {{ cluster.volumeCount }} 个</span></div>
        <div class="desc-item"><span class="label">性能参考</span><span class="value num">{{ formatNumber(cluster.iops) }} IOPS · {{ cluster.latencyMs }} ms · {{ cluster.bandwidthGBps }} GB/s</span></div>
      </div>
    </div>

    <div class="card flush" v-if="cluster">
      <el-tabs v-model="tab" class="tabs">
        <el-tab-pane :label="`存储池 (${pools.length})`" name="pools">
          <el-table :data="pools" size="small">
            <el-table-column prop="name" label="存储池" min-width="180">
              <template #default="{ row }"><span class="mono">{{ row.name }}</span></template>
            </el-table-column>
            <el-table-column prop="raidLevel" label="冗余" width="100" />
            <el-table-column prop="diskType" label="介质" width="120" />
            <el-table-column label="总容量" width="100">
              <template #default="{ row }">{{ formatCapacity(row.totalTB) }}</template>
            </el-table-column>
            <el-table-column label="已用" width="100">
              <template #default="{ row }">{{ formatCapacity(row.usedTB) }}</template>
            </el-table-column>
            <el-table-column label="使用率" width="150">
              <template #default="{ row }"><CapacityBar :value="row.usageRate" /></template>
            </el-table-column>
            <el-table-column label="预计可用" width="100">
              <template #default="{ row }">{{ row.forecastDays }} 天</template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }"><StatusTag kind="pool" :value="row.status" /></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`设备 (${devices.length})`" name="devices">
          <el-table :data="devices" size="small">
            <el-table-column prop="name" label="设备名称" min-width="150" />
            <el-table-column prop="typeName" label="类型" width="110" />
            <el-table-column label="型号" min-width="200">
              <template #default="{ row }">{{ row.vendor }} {{ row.model }}</template>
            </el-table-column>
            <el-table-column label="序列号" width="180">
              <template #default="{ row }"><span class="mono tiny">{{ row.sn }}</span></template>
            </el-table-column>
            <el-table-column label="管理 IP" width="130">
              <template #default="{ row }"><span class="mono tiny">{{ row.mgmtIp }}</span></template>
            </el-table-column>
            <el-table-column label="磁盘健康" width="100">
              <template #default="{ row }">{{ row.diskHealth }}%</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }"><StatusTag kind="device" :value="row.status" /></template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="router.push(`/resources/devices/${row.id}`)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`卷 (${volumes.length})`" name="volumes">
          <el-table :data="volumes.slice(0, 30)" size="small">
            <el-table-column prop="name" label="卷名称" min-width="200">
              <template #default="{ row }"><span class="mono">{{ row.name }}</span></template>
            </el-table-column>
            <el-table-column prop="poolName" label="所属池" min-width="160" />
            <el-table-column label="容量" width="100">
              <template #default="{ row }">{{ formatGB(row.capacityGB) }}</template>
            </el-table-column>
            <el-table-column prop="protocol" label="协议" width="90" />
            <el-table-column prop="hostCount" label="映射主机" width="90" />
            <el-table-column prop="snapshotCount" label="快照" width="70" />
            <el-table-column prop="protection" label="保护" width="100" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><StatusTag :tone="row.status === 'normal' ? 'success' : 'warning'" :label="row.status === 'normal' ? '正常' : '异常'" /></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`告警 (${alarms.length})`" name="alarms">
          <el-table :data="alarms" size="small">
            <el-table-column label="等级" width="82">
              <template #default="{ row }"><StatusTag kind="alarmLevel" :value="row.level" /></template>
            </el-table-column>
            <el-table-column prop="title" label="告警内容" min-width="300" show-overflow-tooltip />
            <el-table-column prop="occurredAt" label="发生时间" width="150">
              <template #default="{ row }">{{ formatDateTime(row.occurredAt) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="96">
              <template #default="{ row }"><StatusTag kind="alarmStatus" :value="row.status" /></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`变更 (${changes.length})`" name="changes">
          <el-table :data="changes" size="small">
            <el-table-column prop="id" label="变更单号" width="160">
              <template #default="{ row }"><span class="mono tiny">{{ row.id }}</span></template>
            </el-table-column>
            <el-table-column prop="title" label="变更标题" min-width="280" show-overflow-tooltip />
            <el-table-column prop="owner" label="实施人" width="90" />
            <el-table-column label="窗口" width="190">
              <template #default="{ row }">{{ formatDateTime(row.windowStart) }} 起</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }"><StatusTag kind="change" :value="row.status" /></template>
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
import { ElMessage } from 'element-plus'
import { ArrowLeft, Refresh, SetUp, Warning } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import CapacityBar from '@/components/CapacityBar.vue'
import ChartCard from '@/components/ChartCard.vue'
import { getAlarms, getChanges, getCluster, getDevices, getPools, getVolumes } from '@/api'
import type { Alarm, Change, Device, StorageCluster, StoragePool, Volume } from '@/types'
import { dayjs, formatCapacity, formatDate, formatDateTime, formatGB, formatNumber } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const cluster = ref<StorageCluster>()
const pools = ref<StoragePool[]>([])
const devices = ref<Device[]>([])
const volumes = ref<Volume[]>([])
const alarms = ref<Alarm[]>([])
const changes = ref<Change[]>([])
const tab = ref('pools')

const capacityOption = computed<EChartsOption>(() => {
  const used = cluster.value?.usedTB ?? 0
  const total = cluster.value?.totalTB ?? 1
  return {
    series: [
      {
        type: 'pie',
        radius: ['66%', '86%'],
        center: ['50%', '50%'],
        label: { show: false },
        data: [
          { value: used, name: '已用', itemStyle: { color: used / total >= 0.85 ? '#F59E0B' : '#1668DC' } },
          { value: Math.max(0, total - used), name: '剩余', itemStyle: { color: '#EEF1F6' } }
        ]
      }
    ],
    title: {
      text: `${((used / total) * 100).toFixed(1)}%`,
      subtext: `${formatCapacity(used)} / ${formatCapacity(total)}`,
      left: 'center',
      top: '40%',
      textStyle: { fontSize: 18, fontWeight: 600, color: '#1F2937' },
      subtextStyle: { fontSize: 10, color: '#8A94A6' }
    }
  }
})

async function load() {
  if (!route.params.id) return
  loading.value = true
  const c = await getCluster(String(route.params.id))
  cluster.value = c
  if (c) {
    const [p, d, v, a, ch] = await Promise.all([
      getPools({ clusterId: c.id, pageSize: 50 }),
      getDevices({ clusterId: c.id, pageSize: 50 }),
      getVolumes({ clusterId: c.id, pageSize: 300 }),
      getAlarms({ keyword: c.name, pageSize: 50 }),
      getChanges({ pageSize: 50 })
    ])
    pools.value = p.list
    devices.value = d.list
    volumes.value = v.list
    alarms.value = a.list.filter((x) => x.objectName === c.name || x.objectId === c.id)
    changes.value = ch.list.filter((x) => x.resourceNames.includes(c.name) || x.resourceIds.includes(c.id))
  }
  loading.value = false
}

onMounted(load)
</script>

<style scoped>
.back-row {
  margin-bottom: -6px;
}

.head-card {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
}

.head-left {
  flex: 1;
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

.head-chart {
  width: 260px;
  flex: none;
}

.head-chart :deep(.chart-card) {
  border: none;
  box-shadow: none;
  padding: 0;
}

.head-chart :deep(.chart-head) {
  display: none;
}

.tabs {
  padding: 4px 20px 16px;
}

:deep(.el-tabs__header) {
  margin-bottom: 8px;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--divider);
}
</style>
