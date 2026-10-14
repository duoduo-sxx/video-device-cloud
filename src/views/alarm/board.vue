<script setup lang="ts">
/**
 * 告警看板：面向值班室的全局态势视图，支持自动刷新与实时告警流
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { alarmApi, dashboardApi } from '@/api'
import PageContainer from '@/components/PageContainer.vue'
import BaseChart from '@/components/BaseChart.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { alarmLevelMeta } from '@/utils/dict'
import { relativeTimeText } from '@/utils/format'

const days = ref(7)
const loading = ref(false)
const stats = ref<any>({})
const events = ref<any[]>([])
const autoRefresh = ref(true)
let timer: number | null = null

async function load() {
  loading.value = true
  try {
    const [s, e] = await Promise.all([alarmApi.statistics(days.value), dashboardApi.recentEvents(18)])
    stats.value = s
    events.value = e
  } finally {
    loading.value = false
  }
}

function setDays(d: number) {
  days.value = d
  load()
}

const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['告警产生', '告警处理'], top: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
  grid: { left: 12, right: 20, top: 36, bottom: 8, containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: stats.value.dates || [] },
  yAxis: { type: 'value', name: '条' },
  series: [
    {
      name: '告警产生',
      type: 'line',
      smooth: true,
      symbolSize: 5,
      areaStyle: { opacity: 0.16 },
      data: stats.value.counts || []
    },
    {
      name: '告警处理',
      type: 'line',
      smooth: true,
      symbolSize: 5,
      areaStyle: { opacity: 0.1 },
      data: stats.value.handleCounts || []
    }
  ]
}))

const levelOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  series: [
    {
      type: 'pie',
      radius: ['50%', '72%'],
      center: ['50%', '44%'],
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 13, formatter: '{b}\n{c} 条' } },
      data: (stats.value.byLevel || []).map((i: any) => ({
        name: alarmLevelMeta(i.name).label,
        value: i.value,
        itemStyle: { color: alarmLevelMeta(i.name).color }
      }))
    }
  ]
}))

const typeOption = computed(() => {
  const arr = (stats.value.byType || []).slice(0, 9).reverse()
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 12, right: 34, top: 12, bottom: 8, containLabel: true },
    xAxis: { type: 'value', name: '条' },
    yAxis: { type: 'category', data: arr.map((a: any) => a.name), axisLabel: { fontSize: 11 } },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        itemStyle: { borderRadius: [0, 4, 4, 0], color: '#1677ff' },
        label: { show: true, position: 'right', fontSize: 11 },
        data: arr.map((a: any) => a.value)
      }
    ]
  }
})

const regionOption = computed(() => {
  const arr = (stats.value.byRegion || []).slice(0, 9).reverse()
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 12, right: 34, top: 12, bottom: 8, containLabel: true },
    xAxis: { type: 'value', name: '条' },
    yAxis: { type: 'category', data: arr.map((a: any) => a.name), axisLabel: { fontSize: 11 } },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        itemStyle: { borderRadius: [0, 4, 4, 0], color: '#722ed1' },
        label: { show: true, position: 'right', fontSize: 11 },
        data: arr.map((a: any) => a.value)
      }
    ]
  }
})

const handleRate = computed(() => {
  const total = stats.value.total || 0
  const counts = (stats.value.counts || []).reduce((a: number, b: number) => a + b, 0)
  const handles = (stats.value.handleCounts || []).reduce((a: number, b: number) => a + b, 0)
  void total
  void counts
  return handles
})

onMounted(() => {
  load()
  timer = window.setInterval(() => {
    if (autoRefresh.value) load()
  }, 20000)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <PageContainer title="告警看板" subtitle="值班室全局态势视图，每 20 秒自动刷新">
    <template #header>
      <el-radio-group :model-value="days" size="small" @change="(v: any) => setDays(Number(v))">
        <el-radio-button :value="1">今日</el-radio-button>
        <el-radio-button :value="7">近 7 天</el-radio-button>
        <el-radio-button :value="30">近 30 天</el-radio-button>
      </el-radio-group>
      <el-switch v-model="autoRefresh" active-text="自动刷新" />
      <el-button :icon="'Refresh'" :loading="loading" @click="load">立即刷新</el-button>
    </template>

    <div v-loading="loading">
      <div class="bd__kpi">
        <div class="bd__kpiItem">
          <span class="bd__kpiLabel">周期内告警总量</span>
          <b class="bd__kpiValue">{{ stats.total || 0 }}</b>
          <span class="bd__kpiFoot">近 {{ days }} 天</span>
        </div>
        <div class="bd__kpiItem">
          <span class="bd__kpiLabel">平均响应时间 MTTA</span>
          <b class="bd__kpiValue" style="color: #faad14">{{ stats.mtta || 0 }}<em>分钟</em></b>
          <span class="bd__kpiFoot">从发生到首次处理</span>
        </div>
        <div class="bd__kpiItem">
          <span class="bd__kpiLabel">平均闭环时间 MTTR</span>
          <b class="bd__kpiValue" style="color: #52c41a">{{ stats.mttr || 0 }}<em>分钟</em></b>
          <span class="bd__kpiFoot">从发生到解决</span>
        </div>
        <div class="bd__kpiItem">
          <span class="bd__kpiLabel">误报率</span>
          <b class="bd__kpiValue" style="color: #722ed1">{{ stats.falseRate || 0 }}<em>%</em></b>
          <span class="bd__kpiFoot">已标记误报占比</span>
        </div>
        <div class="bd__kpiItem">
          <span class="bd__kpiLabel">周期内处理量</span>
          <b class="bd__kpiValue" style="color: #1677ff">{{ handleRate }}</b>
          <span class="bd__kpiFoot">含认领/解决/关闭</span>
        </div>
      </div>

      <div class="bd__row">
        <div class="vc-card bd__cardWide">
          <div class="vc-panel-title">告警产生与处理趋势</div>
          <BaseChart :option="trendOption" :height="230" />
        </div>
        <div class="vc-card">
          <div class="vc-panel-title">等级分布</div>
          <BaseChart :option="levelOption" :height="230" />
        </div>
      </div>

      <div class="bd__row bd__row3">
        <div class="vc-card">
          <div class="vc-panel-title">告警类型 TOP9</div>
          <BaseChart :option="typeOption" :height="260" />
        </div>
        <div class="vc-card">
          <div class="vc-panel-title">区域分布 TOP9</div>
          <BaseChart :option="regionOption" :height="260" />
        </div>
        <div class="vc-card bd__stream">
          <div class="vc-panel-title">
            实时告警流
            <span class="vc-pulse" style="margin-left: 4px" />
          </div>
          <div class="bd__streamList">
            <div v-for="e in events" :key="e.id" class="bd__event">
              <StatusTag :status="e.level" kind="alarmLevel" />
              <div class="bd__eventBody">
                <div class="bd__eventTitle">{{ e.title }}</div>
                <div class="bd__eventMeta">
                  <span>{{ e.deviceName }}</span>
                  <span>{{ e.region }}</span>
                  <span>{{ relativeTimeText(e.occurTime) }}</span>
                </div>
              </div>
              <span class="bd__eventNo vc-mono">{{ e.alarmNo.slice(-6) }}</span>
            </div>
            <EmptyState v-if="!events.length" description="暂无实时告警" />
          </div>
        </div>
      </div>

      <div class="vc-card" style="margin-top: 12px">
        <div class="vc-panel-title">租户告警量排行</div>
        <el-table :data="stats.byTenant || []" size="small" stripe>
          <el-table-column type="index" label="排名" width="70" />
          <el-table-column prop="name" label="租户名称" min-width="220" show-overflow-tooltip />
          <el-table-column label="告警量" width="120" sortable :sort-method="(a: any, b: any) => a.value - b.value">
            <template #default="{ row }"><b>{{ row.value }}</b> 条</template>
          </el-table-column>
          <el-table-column label="占比" min-width="240">
            <template #default="{ row }">
              <div class="bd__bar">
                <i :style="{ width: ((row.value / Math.max(1, (stats.byTenant || [])[0]?.value || 1)) * 100).toFixed(1) + '%' }" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="占比" width="90">
            <template #default="{ row }">
              {{ (((row.value / Math.max(1, stats.total)) * 100)).toFixed(1) }}%
            </template>
          </el-table-column>
          <template #empty><EmptyState description="暂无数据" /></template>
        </el-table>
      </div>
    </div>
  </PageContainer>
</template>

<style scoped>
.bd__kpi {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.bd__kpiItem {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bd__kpiLabel {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.bd__kpiValue {
  font-size: 26px;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

.bd__kpiValue em {
  font-style: normal;
  font-size: 12px;
  margin-left: 4px;
  color: var(--el-text-color-secondary);
}

.bd__kpiFoot {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.bd__row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.bd__row3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.bd__row > .vc-card {
  padding: 14px;
  min-width: 0;
}

.bd__cardWide {
  min-width: 0;
}

.bd__streamList {
  height: 260px;
  overflow: auto;
}

.bd__event {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.bd__eventBody {
  flex: 1;
  min-width: 0;
}

.bd__eventTitle {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bd__eventMeta {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  white-space: nowrap;
}

.bd__eventNo {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.bd__bar {
  height: 8px;
  border-radius: 4px;
  background: var(--el-fill-color);
  overflow: hidden;
}

.bd__bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #1677ff, #40a9ff);
}
</style>
