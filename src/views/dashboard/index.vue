<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { dashboardApi } from '@/api'
import BaseChart from '@/components/BaseChart.vue'
import StatCard from '@/components/StatCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import PageContainer from '@/components/PageContainer.vue'
import { ALARM_LEVEL, CHART_COLORS } from '@/utils/dict'
import { formatNumber, formatStorage, relativeTimeText } from '@/utils/format'

const router = useRouter()

const loading = ref(true)
const trendDays = ref(7)
const overview = ref<any>({})
const trend = ref<any>({ dates: [], online: [], offline: [], added: [] })
const dist = ref<any>({ levels: [], types: [], total: 0 })
const regions = ref<any[]>([])
const storage = ref<any>({ dates: [], used: [], capacity: [], topTenants: [] })
const events = ref<any[]>([])
const todos = ref<any>({ pendingAlarms: [], pendingOrders: [], counts: {} })
const aiStats = ref<any[]>([])
const orderStats = ref<any>({ dates: [], created: [], finished: [], sla: {} })

let timer: number | null = null

async function loadAll() {
  loading.value = true
  try {
    const [ov, td, di, rg, st, ev, td2, ai, od] = await Promise.all([
      dashboardApi.overview(),
      dashboardApi.deviceTrend(trendDays.value),
      dashboardApi.alarmDistribution(),
      dashboardApi.regionDistribution(),
      dashboardApi.storageTrend(),
      dashboardApi.recentEvents(14),
      dashboardApi.todos(),
      dashboardApi.aiStats(),
      dashboardApi.orderStats()
    ])
    overview.value = ov
    trend.value = td
    dist.value = di
    regions.value = rg
    storage.value = st
    events.value = ev
    todos.value = td2
    aiStats.value = ai
    orderStats.value = od
  } finally {
    loading.value = false
  }
}

async function loadTrend() {
  trend.value = await dashboardApi.deviceTrend(trendDays.value)
}

/** 实时事件流：每 6 秒注入一条最新告警，模拟推流 */
function startEventStream() {
  timer = window.setInterval(async () => {
    const list = await dashboardApi.recentEvents(1)
    if (list.length) {
      const item = { ...list[0], id: list[0].id + '_' + Date.now(), occurTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-') }
      events.value = [item, ...events.value].slice(0, 14)
    }
  }, 6000)
}

const deviceTrendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { right: 0, top: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  grid: { left: 8, right: 12, top: 36, bottom: 4, containLabel: true },
  xAxis: { type: 'category', data: trend.value.dates, boundaryGap: false, axisTick: { show: false } },
  yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
  series: [
    {
      name: '在线设备',
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: trend.value.online,
      areaStyle: { opacity: 0.14 },
      lineStyle: { width: 2 }
    },
    {
      name: '离线设备',
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: trend.value.offline,
      lineStyle: { width: 1.5, type: 'dashed' }
    }
  ]
}))

const levelOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}：{c} 条（{d}%）' },
  legend: { orient: 'vertical', right: 0, top: 'center', icon: 'circle', itemWidth: 8, itemHeight: 8 },
  series: [
    {
      type: 'pie',
      radius: ['52%', '74%'],
      center: ['36%', '52%'],
      avoidLabelOverlap: true,
      itemStyle: { borderWidth: 2, borderColor: 'transparent' },
      label: { show: false },
      data: dist.value.levels.map((l: any, i: number) => ({
        name: l.name,
        value: l.value,
        itemStyle: { color: [ALARM_LEVEL.urgent.color, ALARM_LEVEL.major.color, ALARM_LEVEL.minor.color, ALARM_LEVEL.info.color][i] }
      }))
    }
  ]
}))

const typeOption = computed(() => {
  const list = [...(dist.value.types || [])].slice(0, 8).reverse()
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 8, right: 24, top: 8, bottom: 4, containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
    yAxis: { type: 'category', data: list.map((t: any) => t.name), axisTick: { show: false } },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        itemStyle: { borderRadius: [0, 6, 6, 0], color: '#1677ff' },
        label: { show: true, position: 'right', fontSize: 11 },
        data: list.map((t: any) => t.value)
      }
    ]
  }
})

const regionOption = computed(() => {
  const list = [...regions.value].slice(0, 10)
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0]
        const item = list[p.dataIndex]
        return `${item.city}<br/>设备总数：${item.total}<br/>在线：${item.online}<br/>近 7 天告警：${item.alarm}`
      }
    },
    legend: { right: 0, top: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
    grid: { left: 8, right: 16, top: 32, bottom: 4, containLabel: true },
    xAxis: { type: 'category', data: list.map((r: any) => r.city), axisLabel: { fontSize: 11, interval: 0, rotate: 24 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
    series: [
      { name: '在线设备', type: 'bar', stack: 'd', barWidth: 18, itemStyle: { color: '#52c41a', borderRadius: [0, 0, 0, 0] }, data: list.map((r: any) => r.online) },
      { name: '离线设备', type: 'bar', stack: 'd', itemStyle: { color: '#d9d9d9', borderRadius: [4, 4, 0, 0] }, data: list.map((r: any) => r.total - r.online) }
    ]
  }
})

const storageOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { right: 0, top: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  grid: { left: 8, right: 12, top: 36, bottom: 4, containLabel: true },
  xAxis: { type: 'category', data: storage.value.dates, boundaryGap: false, axisLabel: { interval: 4 } },
  yAxis: { type: 'value', name: 'TB', splitLine: { lineStyle: { type: 'dashed' } } },
  series: [
    {
      name: '已用容量',
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: storage.value.used,
      areaStyle: { opacity: 0.18 },
      lineStyle: { width: 2 }
    },
    { name: '总容量', type: 'line', smooth: true, showSymbol: false, data: storage.value.capacity, lineStyle: { width: 1, type: 'dashed', color: '#faad14' } }
  ]
}))

const tenantStorageOption = computed(() => {
  const list = [...(storage.value.topTenants || [])].reverse()
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>占用：{c} TB' },
    grid: { left: 8, right: 30, top: 8, bottom: 4, containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
    yAxis: { type: 'category', data: list.map((t: any) => t.name.slice(0, 10)), axisTick: { show: false }, axisLabel: { fontSize: 11 } },
    series: [
      {
        type: 'bar',
        barWidth: 11,
        itemStyle: { borderRadius: [0, 6, 6, 0], color: '#722ed1' },
        label: { show: true, position: 'right', fontSize: 11, formatter: '{c} TB' },
        data: list.map((t: any) => t.value)
      }
    ]
  }
})

const aiOption = computed(() => {
  const list = (aiStats.value || []).slice(0, 6)
  return {
    tooltip: { trigger: 'item' },
    radar: {
      indicator: list.map((a: any) => ({ name: a.name, max: Math.max(...list.map((x: any) => x.count)) * 1.2 || 10 })),
      radius: '64%',
      splitLine: { lineStyle: { type: 'dashed' } },
      axisName: { fontSize: 10 }
    },
    series: [
      {
        type: 'radar',
        areaStyle: { opacity: 0.18 },
        data: [{ value: list.map((a: any) => a.count), name: '识别事件量' }]
      }
    ]
  }
})

const orderOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { right: 0, top: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  grid: { left: 8, right: 12, top: 36, bottom: 4, containLabel: true },
  xAxis: { type: 'category', data: orderStats.value.dates, axisTick: { show: false } },
  yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
  series: [
    { name: '新建工单', type: 'bar', barWidth: 12, itemStyle: { borderRadius: [4, 4, 0, 0], color: CHART_COLORS[0] }, data: orderStats.value.created },
    { name: '完工工单', type: 'bar', barWidth: 12, itemStyle: { borderRadius: [4, 4, 0, 0], color: CHART_COLORS[1] }, data: orderStats.value.finished }
  ]
}))

onMounted(() => {
  loadAll()
  startEventStream()
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <PageContainer title="数据驾驶舱" subtitle="平台整体运行态势：设备接入、告警处置、存储用量、服务工单与服务质量的实时概览">
    <template #header>
      <el-button :icon="'Refresh'" :loading="loading" @click="loadAll">刷新数据</el-button>
      <el-button type="primary" :icon="'Bell'" @click="router.push('/alarm')">前往告警中心</el-button>
    </template>

    <div v-loading="loading" class="dash">
      <!-- KPI -->
      <div class="dash__kpis">
        <StatCard
          label="设备总数"
          :value="overview.deviceTotal || 0"
          unit="台"
          icon="VideoCamera"
          color="#1677ff"
          :footer="`在线 ${overview.onlineCount || 0} · 离线 ${overview.offlineCount || 0}`"
        />
        <StatCard label="设备在线率" :value="overview.onlineRate || 0" unit="%" :decimals="1" icon="CircleCheck" color="#52c41a" :footer="`微服务健康 ${overview.microServiceHealthy || 0}/${overview.microServiceTotal || 0}`" />
        <StatCard label="今日新增告警" :value="overview.alarmToday || 0" unit="条" icon="Bell" color="#ff4d4f" :trend="overview.alarmRingRatio" />
        <StatCard label="云存储已用" :value="overview.storageUsedTB || 0" unit="TB" :decimals="1" icon="FolderOpened" color="#722ed1" :footer="`使用率 ${overview.storageRate || 0}% / 总 ${formatStorage(overview.storageTotalTB)}`" />
        <StatCard label="带宽峰值" :value="overview.bandwidthPeakGbps || 0" unit="Gbps" :decimals="2" icon="TrendCharts" color="#13c2c2" :footer="`均值 ${overview.bandwidthAvgGbps || 0} Gbps`" />
        <StatCard label="待处理工单" :value="overview.pendingOrders || 0" unit="单" icon="Tools" color="#faad14" :footer="`超时 ${todos.counts?.overdueOrder || 0} · 预警 ${todos.counts?.warningOrder || 0}`" />
      </div>

      <!-- 第二行：设备趋势 + 告警分布 -->
      <div class="dash__row dash__row--2">
        <div class="vc-card dash__panel">
          <div class="vc-panel-title">
            设备在线趋势
            <el-radio-group v-model="trendDays" size="small" style="margin-left: auto" @change="loadTrend">
              <el-radio-button :value="7">近 7 天</el-radio-button>
              <el-radio-button :value="30">近 30 天</el-radio-button>
            </el-radio-group>
          </div>
          <BaseChart :option="deviceTrendOption" :height="248" />
        </div>

        <div class="vc-card dash__panel">
          <div class="vc-panel-title">告警等级分布（近 30 天 · 共 {{ formatNumber(dist.total || 0) }} 条）</div>
          <BaseChart :option="levelOption" :height="248" :empty="!dist.levels?.length" />
        </div>
      </div>

      <!-- 第三行：告警类型 TOP + 地域分布 -->
      <div class="dash__row dash__row--2">
        <div class="vc-card dash__panel">
          <div class="vc-panel-title">告警类型 TOP 8</div>
          <BaseChart :option="typeOption" :height="260" :empty="!dist.types?.length" />
        </div>
        <div class="vc-card dash__panel">
          <div class="vc-panel-title">设备地域分布 TOP 10</div>
          <BaseChart :option="regionOption" :height="260" :empty="!regions.length" />
        </div>
      </div>

      <!-- 第四行：存储 + AI + 工单 -->
      <div class="dash__row dash__row--3">
        <div class="vc-card dash__panel">
          <div class="vc-panel-title">云存储容量趋势（近 30 天）</div>
          <BaseChart :option="storageOption" :height="230" />
        </div>
        <div class="vc-card dash__panel">
          <div class="vc-panel-title">租户存储占用 TOP 10</div>
          <BaseChart :option="tenantStorageOption" :height="230" :empty="!storage.topTenants?.length" />
        </div>
        <div class="vc-card dash__panel">
          <div class="vc-panel-title">AI 识别事件分布（近 30 天）</div>
          <BaseChart :option="aiOption" :height="230" :empty="!aiStats.length" />
        </div>
      </div>

      <!-- 第五行：实时事件流 + 我的待办 + 工单趋势 -->
      <div class="dash__row dash__row--3">
        <div class="vc-card dash__panel">
          <div class="vc-panel-title">
            <span class="vc-pulse" />
            实时事件流
            <span class="vc-text-tertiary" style="margin-left: auto; font-size: 11px; font-weight: 400">每 6 秒自动推送</span>
          </div>
          <el-scrollbar max-height="300px">
            <div v-for="e in events" :key="e.id" class="evt" @click="router.push('/alarm')">
              <StatusTag :status="e.level" kind="alarmLevel" />
              <div class="evt__body">
                <div class="evt__title">{{ e.title }}</div>
                <div class="evt__meta">{{ e.deviceName }} · {{ e.tenantName }} · {{ e.region }}</div>
              </div>
              <span class="evt__time">{{ relativeTimeText(e.occurTime) }}</span>
            </div>
          </el-scrollbar>
        </div>

        <div class="vc-card dash__panel">
          <div class="vc-panel-title">我的待办</div>
          <el-tabs>
            <el-tab-pane :label="`待处理告警 (${todos.counts?.alarm || 0})`">
              <el-scrollbar max-height="248px">
                <div v-for="a in todos.pendingAlarms" :key="a.id" class="todo" @click="router.push('/alarm')">
                  <StatusTag :status="a.level" kind="alarmLevel" />
                  <span class="todo__text">{{ a.title }}</span>
                  <span class="todo__time">{{ relativeTimeText(a.time) }}</span>
                </div>
                <el-empty v-if="!todos.pendingAlarms?.length" description="暂无待处理告警" :image-size="60" />
              </el-scrollbar>
            </el-tab-pane>
            <el-tab-pane :label="`待处理工单 (${todos.counts?.order || 0})`">
              <el-scrollbar max-height="248px">
                <div v-for="o in todos.pendingOrders" :key="o.id" class="todo" @click="router.push('/service')">
                  <StatusTag :status="o.slaStatus" kind="sla" />
                  <span class="todo__text">{{ o.orderNo }} · {{ o.title }}</span>
                  <span class="todo__time">{{ relativeTimeText(o.time) }}</span>
                </div>
                <el-empty v-if="!todos.pendingOrders?.length" description="暂无待处理工单" :image-size="60" />
              </el-scrollbar>
            </el-tab-pane>
          </el-tabs>
        </div>

        <div class="vc-card dash__panel">
          <div class="vc-panel-title">
            服务工单趋势
            <span class="vc-text-tertiary" style="margin-left: auto; font-size: 11px; font-weight: 400">
              SLA 正常 {{ orderStats.sla?.normal || 0 }} · 预警 {{ orderStats.sla?.warning || 0 }} · 超时 {{ orderStats.sla?.overdue || 0 }}
            </span>
          </div>
          <BaseChart :option="orderOption" :height="230" />
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dash__kpis {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.dash__row {
  display: grid;
  gap: 16px;
}

.dash__row--2 {
  grid-template-columns: repeat(2, 1fr);
}

.dash__row--3 {
  grid-template-columns: repeat(3, 1fr);
}

.dash__panel {
  padding: 14px 16px 8px;
  min-width: 0;
}

.evt {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
  cursor: pointer;
}

.evt:hover {
  background: var(--el-fill-color-light);
}

.evt__body {
  flex: 1;
  min-width: 0;
}

.evt__title {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.evt__meta {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.evt__time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

.todo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 4px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
  cursor: pointer;
}

.todo:hover {
  background: var(--el-fill-color-light);
}

.todo__text {
  flex: 1;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo__time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

@media (max-width: 1600px) {
  .dash__kpis {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1360px) {
  .dash__row--3 {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
