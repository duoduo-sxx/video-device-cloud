<script setup lang="ts">
/**
 * 运维监控：集群资源、节点、微服务拓扑、日志检索、容量预测、维护窗口与健康报告
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { monitorApi } from '@/api'
import { useTable, paginationLayout, paginationSizes } from '@/composables/useTable'
import PageContainer from '@/components/PageContainer.vue'
import StatCard from '@/components/StatCard.vue'
import BaseChart from '@/components/BaseChart.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { formatDateTime, formatNumber, formatPercent } from '@/utils/format'

const activeTab = ref('cluster')
const autoRefresh = ref(true)
let timer: number | null = null

const cluster = ref<any>({})
const health = ref<any>({})
const capacity = ref<any>({})
const services = ref<any[]>([])
const serviceSummary = ref<any>({})
const topology = ref<any>({ nodes: [], links: [] })
const maintenance = ref<any[]>([])

/* ---------- 节点 ---------- */
const nodeTable = useTable({
  api: monitorApi.nodes as any,
  syncQuery: true,
  defaultParams: { keyword: '', type: '', status: '' }
})
const nodeDialogVisible = ref(false)
const nodeDetail = ref<any>(null)

/* ---------- 日志 ---------- */
const logTable = useTable({
  api: monitorApi.logs as any,
  defaultParams: { keyword: '', level: '', service: '', traceId: '' }
})
const logLevels = computed(() => (logTable as any).levels || [])
const logServices = computed(() => (logTable as any).services || [])
const logTimeRange = ref<[string, string] | null>(null)

/* ---------- 维护窗口 ---------- */
const mwDialog = ref(false)
const mwForm = reactive<any>({ name: '', scope: '全部设备', alarmTypes: [] as string[], startTime: '', endTime: '', reason: '', creator: '当前用户' })
const ALARM_TYPES = ['设备离线', '视频信号丢失', '存储写入异常', '网络抖动', '录像缺失', 'AI 任务异常']

async function loadCluster() {
  cluster.value = await monitorApi.cluster()
}

async function loadHealth() {
  health.value = await monitorApi.healthReport()
}

async function loadCapacity() {
  capacity.value = await monitorApi.capacity()
}

async function loadServices() {
  const res: any = await monitorApi.services()
  services.value = res.list || []
  serviceSummary.value = res.summary || {}
}

async function loadTopology() {
  topology.value = await monitorApi.topology()
}

async function loadMaintenance() {
  const res: any = await monitorApi.maintenance()
  maintenance.value = res.list || []
}

async function openNodeDetail(row: any) {
  nodeDetail.value = await monitorApi.nodeDetail(row.id)
  nodeDialogVisible.value = true
}

async function submitMw() {
  if (!mwForm.name) return ElMessage.warning('请输入维护窗口名称')
  if (!mwForm.startTime || !mwForm.endTime) return ElMessage.warning('请选择维护时间范围')
  try {
    await monitorApi.createMaintenance({ ...mwForm })
    ElMessage.success('维护窗口已创建，窗口期内相关告警将自动抑制')
    mwDialog.value = false
    Object.assign(mwForm, { name: '', scope: '全部设备', alarmTypes: [], startTime: '', endTime: '', reason: '', creator: '当前用户' })
    loadMaintenance()
  } catch {
    /* 已提示 */
  }
}

async function removeMw(row: any) {
  await ElMessageBox.confirm(`确认删除维护窗口「${row.name}」？删除后窗口期内告警将恢复正常上报。`, '删除维护窗口', { type: 'warning' })
  await monitorApi.removeMaintenance(row.id)
  ElMessage.success('维护窗口已删除')
  loadMaintenance()
}

/* ---------- 图表 ---------- */
const realtimeOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['CPU', '内存', 'GPU', '带宽(Gbps)'], top: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
  grid: { left: 12, right: 20, top: 40, bottom: 8, containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: cluster.value.realtime?.time || [] },
  yAxis: [
    { type: 'value', name: '%', max: 100 },
    { type: 'value', name: 'Gbps' }
  ],
  series: [
    { name: 'CPU', type: 'line', smooth: true, symbol: 'none', data: cluster.value.realtime?.cpu || [] },
    { name: '内存', type: 'line', smooth: true, symbol: 'none', data: cluster.value.realtime?.mem || [] },
    { name: 'GPU', type: 'line', smooth: true, symbol: 'none', data: cluster.value.realtime?.gpu || [] },
    { name: '带宽(Gbps)', type: 'line', smooth: true, symbol: 'none', yAxisIndex: 1, lineStyle: { type: 'dashed' }, data: cluster.value.realtime?.bandwidth || [] }
  ]
}))

const topoOption = computed(() => {
  const nodes = (topology.value.nodes || []).map((n: any) => ({
    name: n.id,
    symbolSize: Math.max(24, Math.min(56, 18 + n.qps / 260)),
    itemStyle: {
      color:
        n.status === 'healthy' ? '#52c41a' : n.status === 'degraded' ? '#faad14' : n.status === 'fused' ? '#ff7a45' : '#ff4d4f'
    },
    label: { show: true, fontSize: 11, formatter: '{b}' }
  }))
  const links = (topology.value.links || []).map((l: any) => ({ source: l.source, target: l.target, lineStyle: { color: '#c9d3e4', curveness: 0.08 } }))
  return {
    tooltip: {
      formatter: (p: any) => {
        if (p.dataType === 'edge') return `${p.data.source} → ${p.data.target}`
        const n = (topology.value.nodes || []).find((x: any) => x.id === p.name)
        if (!n) return p.name
        return `${n.name}<br/>状态：${n.status}<br/>QPS：${formatNumber(n.qps)}<br/>时延：${n.latency} ms<br/>错误率：${n.errorRate}%<br/>副本：${n.healthyReplicas}/${n.replicas}`
      }
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        label: { position: 'bottom', color: 'inherit' },
        force: { repulsion: 520, edgeLength: [120, 200], gravity: 0.06 },
        emphasis: { focus: 'adjacency', lineStyle: { width: 3 } },
        lineStyle: { width: 1.2, opacity: 0.65 },
        data: nodes,
        links
      }
    ]
  }
})

const capacityOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['历史使用量', '预测使用量'], top: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
  grid: { left: 12, right: 20, top: 40, bottom: 8, containLabel: true },
  xAxis: { type: 'category', data: capacity.value.dates || [] },
  yAxis: { type: 'value', name: 'TB' },
  series: [
    { name: '历史使用量', type: 'line', smooth: true, symbol: 'none', areaStyle: { opacity: 0.16 }, data: capacity.value.history || [] },
    { name: '预测使用量', type: 'line', smooth: true, symbol: 'none', lineStyle: { type: 'dashed' }, areaStyle: { opacity: 0.08 }, data: capacity.value.forecast || [] }
  ]
}))

const logLevelOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  series: [
    {
      type: 'pie',
      radius: ['48%', '70%'],
      center: ['50%', '43%'],
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12, formatter: '{b}\n{c} 条' } },
      data: (logLevels.value as any[]).map((l: any) => ({
        name: l.name,
        value: l.value,
        itemStyle: { color: l.name === 'ERROR' ? '#ff4d4f' : l.name === 'WARN' ? '#faad14' : l.name === 'DEBUG' ? '#1677ff' : '#8c8c8c' }
      }))
    }
  ]
}))

const healthRadarOption = computed(() => ({
  tooltip: {},
  radar: {
    indicator: (health.value.items || []).map((i: any) => ({ name: i.name, max: Math.max(100, i.target * 1.2) })),
    radius: '64%'
  },
  series: [
    {
      type: 'radar',
      areaStyle: { opacity: 0.22 },
      data: [{ value: (health.value.items || []).map((i: any) => i.value), name: '当前值' }]
    }
  ]
}))

function usageColor(v: number) {
  if (v >= 90) return '#ff4d4f'
  if (v >= 75) return '#faad14'
  return '#52c41a'
}

onMounted(async () => {
  await Promise.all([loadCluster(), loadHealth(), loadCapacity(), loadServices(), loadTopology(), loadMaintenance()])
  timer = window.setInterval(() => {
    if (autoRefresh.value && activeTab.value === 'cluster') loadCluster()
  }, 15000)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <PageContainer title="运维监控" subtitle="集群资源、微服务拓扑、日志检索与容量规划">
    <template #header>
      <el-switch v-model="autoRefresh" active-text="实时刷新(15s)" />
      <el-button :icon="'Refresh'" @click="() => { loadCluster(); loadHealth(); loadCapacity() }">刷新</el-button>
    </template>

    <el-row :gutter="12">
      <el-col :span="3"><StatCard label="节点总数" :value="cluster.totalNodes || 0" icon="Cpu" color="#1677ff" :footer="`中心 ${cluster.centerNodes || 0} / 边缘 ${cluster.edgeNodes || 0}`" /></el-col>
      <el-col :span="3"><StatCard label="节点在线" :value="cluster.onlineNodes || 0" icon="CircleCheck" color="#52c41a" :footer="`告警 ${cluster.warningNodes || 0}`" /></el-col>
      <el-col :span="3"><StatCard label="平均 CPU" :value="cluster.cpuUsage || 0" unit="%" :decimals="1" icon="Odometer" color="#722ed1" footer="全节点均值" /></el-col>
      <el-col :span="3"><StatCard label="平均内存" :value="cluster.memUsage || 0" unit="%" :decimals="1" icon="Histogram" color="#13c2c2" footer="全节点均值" /></el-col>
      <el-col :span="3"><StatCard label="平均 GPU" :value="cluster.gpuUsage || 0" unit="%" :decimals="1" icon="VideoPlay" color="#eb2f96" footer="AI 推理负载" /></el-col>
      <el-col :span="3"><StatCard label="集群带宽" :value="cluster.bandwidthGbps || 0" unit="Gbps" :decimals="1" icon="Connection" color="#fa8c16" footer="回传总带宽" /></el-col>
      <el-col :span="3"><StatCard label="运行任务" :value="cluster.runningTasks || 0" icon="List" color="#1677ff" footer="录像+转码+AI" /></el-col>
      <el-col :span="3"><StatCard label="服务健康" :value="`${cluster.serviceHealthy || 0}/${cluster.serviceTotal || 0}`" icon="Monitor" color="#52c41a" :footer="`运行 ${cluster.uptimeDays || 0} 天`" /></el-col>
    </el-row>

    <el-tabs v-model="activeTab" style="margin-top: 12px">
      <!-- 集群概览 -->
      <el-tab-pane label="集群概览" name="cluster">
        <div class="mn__row">
          <div class="vc-card mn__wide">
            <div class="vc-panel-title">实时资源曲线（近 30 分钟）</div>
            <BaseChart :option="realtimeOption" :height="270" />
          </div>
          <div class="vc-card">
            <div class="vc-panel-title">系统健康雷达</div>
            <BaseChart :option="healthRadarOption" :height="270" />
          </div>
        </div>

        <div class="mn__row" style="grid-template-columns: 1fr 1fr">
          <div class="vc-card">
            <div class="vc-panel-title">健康评分</div>
            <div class="mn__score">
              <div class="mn__scoreRing" :style="{ '--c': health.score >= 95 ? '#52c41a' : health.score >= 88 ? '#1677ff' : health.score >= 75 ? '#faad14' : '#ff4d4f' }">
                <b>{{ health.score }}</b>
                <span>分</span>
              </div>
              <div class="mn__scoreInfo">
                <div class="mn__grade">{{ health.grade }}</div>
                <div class="vc-text-tertiary" style="font-size: 12px">报告生成时间 {{ health.generatedAt }}</div>
                <el-table :data="health.items || []" size="small" :show-header="false" style="margin-top: 8px">
                  <el-table-column prop="name" width="130" />
                  <el-table-column>
                    <template #default="{ row }">
                      <span :style="{ color: row.status === 'ok' ? '#52c41a' : '#faad14' }">{{ row.value }}</span>
                      <span class="vc-text-tertiary" style="font-size: 11px"> / 目标 {{ row.target }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </div>

          <div class="vc-card">
            <div class="vc-panel-title">微服务状态汇总</div>
            <el-row :gutter="8">
              <el-col :span="8"><div class="mn__miniStat"><span>总服务</span><b>{{ serviceSummary.total || 0 }}</b></div></el-col>
              <el-col :span="8"><div class="mn__miniStat"><span>健康</span><b style="color: #52c41a">{{ serviceSummary.healthy || 0 }}</b></div></el-col>
              <el-col :span="8"><div class="mn__miniStat"><span>降级/熔断</span><b style="color: #faad14">{{ (serviceSummary.degraded || 0) + (serviceSummary.fused || 0) }}</b></div></el-col>
              <el-col :span="8"><div class="mn__miniStat"><span>总 QPS</span><b>{{ formatNumber(serviceSummary.totalQps || 0) }}</b></div></el-col>
              <el-col :span="8"><div class="mn__miniStat"><span>平均时延</span><b>{{ serviceSummary.avgLatency || 0 }} ms</b></div></el-col>
              <el-col :span="8"><div class="mn__miniStat"><span>集群带宽</span><b>{{ cluster.bandwidthGbps }} Gbps</b></div></el-col>
            </el-row>
          </div>
        </div>
      </el-tab-pane>

      <!-- 节点管理 -->
      <el-tab-pane label="节点管理" name="node">
        <div class="vc-card mn__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="nodeTable.baseParams.value.keyword" placeholder="节点名称 / IP / 区域" clearable style="width: 220px" @keyup.enter="nodeTable.search" />
            </el-form-item>
            <el-form-item label="节点类型">
              <el-select v-model="nodeTable.baseParams.value.type" placeholder="全部" clearable style="width: 140px">
                <el-option label="中心节点" value="center" />
                <el-option label="边缘节点" value="edge" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="nodeTable.baseParams.value.status" placeholder="全部" clearable style="width: 130px">
                <el-option label="在线" value="online" />
                <el-option label="告警" value="warning" />
                <el-option label="离线" value="offline" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="nodeTable.search">查询</el-button>
              <el-button :icon="'RefreshLeft'" @click="nodeTable.reset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card mn__table">
          <el-table v-loading="nodeTable.loading.value" :data="nodeTable.list.value" stripe>
            <el-table-column label="节点名称" min-width="200">
              <template #default="{ row }">
                <div style="font-weight: 500">{{ row.name }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.ip }} · v{{ row.version }}</div>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" effect="plain" :type="row.type === 'center' ? 'primary' : 'info'">{{ row.type === 'center' ? '中心节点' : '边缘节点' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="region" label="区域" width="130" />
            <el-table-column label="CPU" width="130">
              <template #default="{ row }">
                <el-progress :percentage="row.cpuUsage" :stroke-width="8" :show-text="false" :color="usageColor(row.cpuUsage)" />
                <span class="vc-text-tertiary" style="font-size: 11px">{{ formatPercent(row.cpuUsage) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="内存" width="130">
              <template #default="{ row }">
                <el-progress :percentage="row.memUsage" :stroke-width="8" :show-text="false" :color="usageColor(row.memUsage)" />
                <span class="vc-text-tertiary" style="font-size: 11px">{{ formatPercent(row.memUsage) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="磁盘" width="130">
              <template #default="{ row }">
                <el-progress :percentage="row.diskUsage" :stroke-width="8" :show-text="false" :color="usageColor(row.diskUsage)" />
                <span class="vc-text-tertiary" style="font-size: 11px">{{ formatPercent(row.diskUsage) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="GPU" width="110" sortable :sort-method="(a: any, b: any) => a.gpuUsage - b.gpuUsage">
              <template #default="{ row }">{{ formatPercent(row.gpuUsage) }}</template>
            </el-table-column>
            <el-table-column label="带宽" width="120" sortable :sort-method="(a: any, b: any) => a.bandwidthMbps - b.bandwidthMbps">
              <template #default="{ row }">{{ formatNumber(row.bandwidthMbps) }} Mbps</template>
            </el-table-column>
            <el-table-column label="承载设备" width="100">
              <template #default="{ row }">{{ formatNumber(row.deviceCount) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><StatusTag :status="row.status" kind="node" /></template>
            </el-table-column>
            <el-table-column label="运行时长" width="110">
              <template #default="{ row }">{{ row.uptime }} 天</template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openNodeDetail(row)">详情</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="没有符合条件的节点" /></template>
          </el-table>
          <div class="mn__pager">
            <el-pagination
              :current-page="nodeTable.page.value"
              :page-size="nodeTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="nodeTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="nodeTable.onPageChange"
              @size-change="nodeTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 微服务与拓扑 -->
      <el-tab-pane label="微服务与拓扑" name="service">
        <div class="vc-card" style="padding: 14px; margin-bottom: 12px">
          <div class="vc-panel-title">服务依赖拓扑（节点大小代表 QPS，颜色代表健康度，可拖拽与缩放）</div>
          <BaseChart :option="topoOption" :height="420" :empty="!topology.nodes.length" />
        </div>
        <div class="vc-card mn__table">
          <el-table :data="services" stripe>
            <el-table-column label="服务名称" min-width="200">
              <template #default="{ row }">
                <div style="font-weight: 500">{{ row.name }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.code }} · v{{ row.version }}</div>
              </template>
            </el-table-column>
            <el-table-column label="副本" width="110">
              <template #default="{ row }">{{ row.healthyReplicas }} / {{ row.replicas }}</template>
            </el-table-column>
            <el-table-column label="QPS" width="120" sortable :sort-method="(a: any, b: any) => a.qps - b.qps">
              <template #default="{ row }">{{ formatNumber(row.qps) }}</template>
            </el-table-column>
            <el-table-column label="平均时延" width="130" sortable :sort-method="(a: any, b: any) => a.avgLatency - b.avgLatency">
              <template #default="{ row }">
                <span :style="{ color: row.avgLatency > 200 ? '#ff4d4f' : row.avgLatency > 100 ? '#faad14' : undefined }">{{ row.avgLatency }} ms</span>
              </template>
            </el-table-column>
            <el-table-column label="错误率" width="120" sortable :sort-method="(a: any, b: any) => a.errorRate - b.errorRate">
              <template #default="{ row }">
                <span :style="{ color: row.errorRate > 1 ? '#ff4d4f' : row.errorRate > 0.3 ? '#faad14' : '#52c41a' }">{{ row.errorRate }}%</span>
              </template>
            </el-table-column>
            <el-table-column label="依赖服务" min-width="260">
              <template #default="{ row }">
                <el-tag v-for="d in row.dependsOn" :key="d" size="small" effect="plain" style="margin: 1px 3px 1px 0">{{ d }}</el-tag>
                <span v-if="!row.dependsOn?.length" class="vc-text-tertiary">无</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }"><StatusTag :status="row.status" kind="service" /></template>
            </el-table-column>
            <template #empty><EmptyState description="暂无服务数据" /></template>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 日志检索 -->
      <el-tab-pane label="日志检索" name="log">
        <div class="mn__logRow">
          <div class="vc-card mn__filter" style="flex: 1">
            <el-form inline @submit.prevent>
              <el-form-item label="关键字">
                <el-input v-model="logTable.baseParams.value.keyword" placeholder="日志内容 / TraceID / IP" clearable style="width: 230px" @keyup.enter="logTable.search" />
              </el-form-item>
              <el-form-item label="级别">
                <el-select v-model="logTable.baseParams.value.level" placeholder="全部" clearable style="width: 120px" @change="logTable.search">
                  <el-option label="INFO" value="INFO" />
                  <el-option label="WARN" value="WARN" />
                  <el-option label="ERROR" value="ERROR" />
                  <el-option label="DEBUG" value="DEBUG" />
                </el-select>
              </el-form-item>
              <el-form-item label="服务">
                <el-select v-model="logTable.baseParams.value.service" placeholder="全部服务" clearable filterable style="width: 180px" @change="logTable.search">
                  <el-option v-for="s in logServices" :key="s" :label="s" :value="s" />
                </el-select>
              </el-form-item>
              <el-form-item label="TraceID">
                <el-input v-model="logTable.baseParams.value.traceId" placeholder="精确追踪" clearable style="width: 180px" @keyup.enter="logTable.search" />
              </el-form-item>
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="logTimeRange"
                  type="datetimerange"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  start-placeholder="开始"
                  end-placeholder="结束"
                  style="width: 320px"
                  @change="(v: any) => { logTable.baseParams.value.startTime = v?.[0] || ''; logTable.baseParams.value.endTime = v?.[1] || ''; logTable.search() }"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :icon="'Search'" @click="logTable.search">检索</el-button>
                <el-button :icon="'RefreshLeft'" @click="() => { logTimeRange = null; logTable.reset() }">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          <div class="vc-card mn__logChart">
            <div class="vc-panel-title">日志级别分布</div>
            <BaseChart :option="logLevelOption" :height="180" />
          </div>
        </div>

        <div class="vc-card mn__logBox">
          <div v-loading="logTable.loading.value" class="mn__logList vc-mono">
            <div v-for="l in logTable.list.value" :key="l.id" class="mn__logLine">
              <span class="mn__logTime">{{ l.createTime }}</span>
              <StatusTag :status="l.level" kind="log" />
              <span class="mn__logService">{{ l.service }}</span>
              <span class="mn__logTrace">{{ l.traceId }}</span>
              <span class="mn__logContent">{{ l.content }}</span>
              <span class="mn__logDur">{{ l.duration }}ms</span>
            </div>
            <EmptyState v-if="!logTable.list.value.length && !logTable.loading.value" description="没有匹配的日志" />
          </div>
          <div class="mn__pager">
            <el-pagination
              :current-page="logTable.page.value"
              :page-size="logTable.pageSize.value"
              :page-sizes="[50, 100, 200, 500]"
              :total="logTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="logTable.onPageChange"
              @size-change="logTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 容量预测 -->
      <el-tab-pane label="容量预测" name="capacity">
        <div class="mn__row" style="grid-template-columns: 2fr 1fr">
          <div class="vc-card">
            <div class="vc-panel-title">存储容量趋势与未来 30 天预测</div>
            <BaseChart :option="capacityOption" :height="280" />
          </div>
          <div class="vc-card">
            <div class="vc-panel-title">扩容建议</div>
            <div class="mn__capGrid">
              <div class="mn__capItem"><span>当前已用</span><b>{{ capacity.usedTB }} TB</b></div>
              <div class="mn__capItem"><span>总容量</span><b>{{ capacity.capacityTB }} TB</b></div>
              <div class="mn__capItem"><span>日均增长</span><b>{{ capacity.dailyGrowthTB }} TB</b></div>
              <div class="mn__capItem"><span>预计写满</span><b :style="{ color: capacity.daysToFull < 60 ? '#ff4d4f' : '#52c41a' }">{{ capacity.daysToFull }} 天后</b></div>
            </div>
            <ul class="mn__suggest">
              <li v-for="(s, i) in capacity.suggestions || []" :key="i">{{ s }}</li>
            </ul>
            <el-descriptions :column="2" border size="small" style="margin-top: 12px">
              <el-descriptions-item label="设备增长（近30天）">{{ capacity.deviceGrowth?.last30 }} 台</el-descriptions-item>
              <el-descriptions-item label="设备预测（未来30天）">{{ capacity.deviceGrowth?.forecast30 }} 台</el-descriptions-item>
              <el-descriptions-item label="AI 任务增长">{{ capacity.aiTaskGrowth?.last30 }} 个</el-descriptions-item>
              <el-descriptions-item label="AI 任务预测">{{ capacity.aiTaskGrowth?.forecast30 }} 个</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-tab-pane>

      <!-- 维护窗口 -->
      <el-tab-pane label="维护窗口" name="maintenance">
        <div class="vc-card mn__filter">
          <el-form inline @submit.prevent>
            <el-form-item>
              <el-button type="primary" plain :icon="'Plus'" @click="mwDialog = true">新建维护窗口</el-button>
              <span class="vc-text-tertiary" style="font-size: 12px">窗口期内匹配的告警将被自动抑制，不会触发通知与转单</span>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card mn__table">
          <el-table :data="maintenance" stripe>
            <el-table-column prop="id" label="编号" width="100" />
            <el-table-column prop="name" label="窗口名称" min-width="220" show-overflow-tooltip />
            <el-table-column prop="scope" label="作用范围" width="150" />
            <el-table-column label="抑制告警类型" min-width="260">
              <template #default="{ row }">
                <el-tag v-for="t in row.alarmTypes" :key="t" size="small" effect="plain" style="margin: 1px 3px 1px 0">{{ t }}</el-tag>
                <span v-if="!row.alarmTypes?.length" class="vc-text-tertiary">全部告警</span>
              </template>
            </el-table-column>
            <el-table-column label="维护时段" min-width="300">
              <template #default="{ row }">
                <span class="vc-mono" style="font-size: 12px">{{ row.startTime }} ~ {{ row.endTime }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" min-width="200" show-overflow-tooltip />
            <el-table-column prop="creator" label="创建人" width="110" />
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="removeMw(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="暂无维护窗口" action-text="新建维护窗口" @action="mwDialog = true" /></template>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 节点详情 -->
    <el-drawer v-model="nodeDialogVisible" title="节点详情" size="560px">
      <div v-if="nodeDetail">
        <h3 style="margin: 0 0 12px">{{ nodeDetail.name }}</h3>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="节点类型">{{ nodeDetail.type === 'center' ? '中心节点' : '边缘节点' }}</el-descriptions-item>
          <el-descriptions-item label="状态"><StatusTag :status="nodeDetail.status" kind="node" /></el-descriptions-item>
          <el-descriptions-item label="内网 IP"><span class="vc-mono">{{ nodeDetail.ip }}</span></el-descriptions-item>
          <el-descriptions-item label="区域">{{ nodeDetail.region }}</el-descriptions-item>
          <el-descriptions-item label="CPU">{{ formatPercent(nodeDetail.cpuUsage) }}</el-descriptions-item>
          <el-descriptions-item label="内存">{{ formatPercent(nodeDetail.memUsage) }}</el-descriptions-item>
          <el-descriptions-item label="磁盘">{{ formatPercent(nodeDetail.diskUsage) }}</el-descriptions-item>
          <el-descriptions-item label="GPU">{{ formatPercent(nodeDetail.gpuUsage) }}</el-descriptions-item>
          <el-descriptions-item label="带宽">{{ formatNumber(nodeDetail.bandwidthMbps) }} Mbps</el-descriptions-item>
          <el-descriptions-item label="承载设备">{{ formatNumber(nodeDetail.deviceCount) }} 台</el-descriptions-item>
          <el-descriptions-item label="运行任务">{{ nodeDetail.runningTasks }} 个</el-descriptions-item>
          <el-descriptions-item label="版本"><span class="vc-mono">v{{ nodeDetail.version }}</span></el-descriptions-item>
          <el-descriptions-item label="运行时长">{{ nodeDetail.uptime }} 天</el-descriptions-item>
          <el-descriptions-item label="最后上报">{{ formatDateTime(nodeDetail.lastReportTime) }}</el-descriptions-item>
        </el-descriptions>

        <div class="vc-panel-title" style="margin-top: 16px">磁盘分区</div>
        <el-table :data="nodeDetail.diskPartitions || []" size="small" stripe>
          <el-table-column prop="mount" label="挂载点" width="110" />
          <el-table-column label="已用 / 容量" min-width="180">
            <template #default="{ row }">{{ row.usedTB }} TB / {{ row.capacityTB }} TB</template>
          </el-table-column>
          <el-table-column label="使用率" min-width="180">
            <template #default="{ row }">
              <el-progress :percentage="Math.round((row.usedTB / row.capacityTB) * 100)" :stroke-width="8" :show-text="false" />
            </template>
          </el-table-column>
          <template #empty><EmptyState description="暂无分区信息" /></template>
        </el-table>

        <div class="vc-panel-title" style="margin-top: 16px">节点上运行的微服务</div>
        <el-table :data="nodeDetail.services || []" size="small" stripe>
          <el-table-column prop="name" label="服务名称" min-width="180" />
          <el-table-column prop="replicas" label="副本数" width="90" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }"><StatusTag :status="row.status" kind="service" /></template>
          </el-table-column>
          <template #empty><EmptyState description="暂无服务信息" /></template>
        </el-table>
      </div>
    </el-drawer>

    <!-- 维护窗口表单 -->
    <el-dialog v-model="mwDialog" title="新建维护窗口" width="620px">
      <el-form :model="mwForm" label-width="110px">
        <el-form-item label="窗口名称" required>
          <el-input v-model="mwForm.name" placeholder="如：园区存储节点磁盘更换" />
        </el-form-item>
        <el-form-item label="作用范围">
          <el-select v-model="mwForm.scope" allow-create filterable default-first-option style="width: 100%">
            <el-option label="全部设备" value="全部设备" />
            <el-option label="全部节点" value="全部节点" />
            <el-option label="华东区域" value="华东区域" />
            <el-option label="杭州节点" value="杭州节点" />
          </el-select>
        </el-form-item>
        <el-form-item label="抑制告警类型">
          <el-select v-model="mwForm.alarmTypes" multiple placeholder="留空表示抑制全部告警" style="width: 100%">
            <el-option v-for="t in ALARM_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="维护时段" required>
          <el-date-picker
            v-model="mwForm.timeRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
            @change="(v: any) => { mwForm.startTime = v?.[0] || ''; mwForm.endTime = v?.[1] || '' }"
          />
        </el-form-item>
        <el-form-item label="维护原因">
          <el-input v-model="mwForm.reason" type="textarea" :rows="3" placeholder="如：更换 3 号槽位故障磁盘，预计影响该节点录像写入约 20 分钟" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="mwDialog = false">取消</el-button>
        <el-button type="primary" @click="submitMw">确认创建</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<style scoped>
.mn__row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

.mn__row > .vc-card {
  padding: 14px;
  min-width: 0;
}

.mn__wide {
  min-width: 0;
}

.mn__filter {
  padding: 14px 16px 4px;
  margin-bottom: 12px;
}

.mn__filter :deep(.el-form-item) {
  margin-bottom: 10px;
}

.mn__table {
  padding: 0;
  overflow: hidden;
}

.mn__pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.mn__score {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.mn__scoreRing {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  border: 8px solid var(--c);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mn__scoreRing b {
  font-size: 30px;
  line-height: 1;
  color: var(--c);
}

.mn__scoreRing span {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.mn__scoreInfo {
  flex: 1;
  min-width: 0;
}

.mn__grade {
  font-size: 17px;
  font-weight: 500;
  margin-bottom: 4px;
}

.mn__miniStat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 0;
}

.mn__miniStat span {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.mn__miniStat b {
  font-size: 17px;
}

.mn__logRow {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 12px;
}

.mn__logChart {
  padding: 14px;
}

.mn__logBox {
  padding: 0;
  overflow: hidden;
  margin-top: 12px;
}

.mn__logList {
  max-height: 560px;
  overflow: auto;
  padding: 8px 12px;
  font-size: 12px;
}

.mn__logLine {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.mn__logTime {
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
  width: 145px;
}

.mn__logService {
  width: 130px;
  flex-shrink: 0;
  color: var(--el-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mn__logTrace {
  width: 130px;
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mn__logContent {
  flex: 1;
  min-width: 0;
  color: var(--el-text-color-regular);
}

.mn__logDur {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
}

.mn__capGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.mn__capItem {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
}

.mn__capItem span {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.mn__capItem b {
  font-size: 16px;
}

.mn__suggest {
  margin: 14px 0 0;
  padding-left: 18px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.9;
}
</style>
