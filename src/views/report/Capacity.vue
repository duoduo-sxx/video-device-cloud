<template>
  <div class="page" v-loading="loading">
    <PageHeader title="容量分析" desc="按客户、厂商、集群维度分析容量分布、增长率与扩容需求">
      <template #actions>
        <el-button :icon="Download" @click="onExport">导出</el-button>
      </template>
    </PageHeader>

    <div class="kpi-grid">
      <StatCard label="总容量" :value="(stat.total / 1024).toFixed(2)" unit="PB" icon="Coin" tone="primary" hint="18 套集群合计" />
      <StatCard label="已用容量" :value="(stat.used / 1024).toFixed(2)" unit="PB" icon="Files" tone="cyan" :progress="stat.rate" :hint="`整体使用率 ${stat.rate.toFixed(1)}%`" />
      <StatCard label="月均增长" :value="stat.grow.toFixed(1)" unit="TB" icon="TrendCharts" tone="purple" hint="按存储池增长速率估算" />
      <StatCard label="需扩容容量" :value="stat.needExpand.toFixed(0)" unit="TB" icon="Warning" tone="danger" hint="90 天内可用不足的池需扩容量" />
    </div>

    <div class="cols-2">
      <ChartCard title="各客户容量分布" subtitle="已用 / 剩余（TB）" :option="customerOption" :height="320" />
      <ChartCard title="厂商容量占比" :option="vendorOption" :height="320" />
    </div>

    <div class="cols-2">
      <ChartCard title="存储池使用率分布" subtitle="按区间统计池数量" :option="histOption" :height="280" />
      <ChartCard title="容量增长与预测" subtitle="近 12 个月 + 未来 6 个月" :option="growthOption" :height="280" />
    </div>

    <div class="card">
      <div class="card-head">
        <div class="card-title">扩容需求清单 <span class="sub">按预计可用天数升序</span></div>
        <el-button link type="primary" @click="router.push('/resources/pools')">查看全部存储池</el-button>
      </div>
      <el-table :data="riskPools" size="small">
        <el-table-column prop="name" label="存储池" min-width="180">
          <template #default="{ row }"><span class="mono">{{ row.name }}</span></template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户" min-width="170" show-overflow-tooltip />
        <el-table-column label="总容量" width="100">
          <template #default="{ row }">{{ formatCapacity(row.totalTB) }}</template>
        </el-table-column>
        <el-table-column label="使用率" width="150">
          <template #default="{ row }"><CapacityBar :value="row.usageRate" /></template>
        </el-table-column>
        <el-table-column label="月均增长" width="100">
          <template #default="{ row }">{{ row.growRatePerMonth }} TB</template>
        </el-table-column>
        <el-table-column label="预计可用" width="100">
          <template #default="{ row }"><span :class="row.forecastDays < 90 ? 'danger-text' : ''">{{ row.forecastDays }} 天</span></template>
        </el-table-column>
        <el-table-column label="建议扩容" width="110">
          <template #default="{ row }">{{ suggest(row) }} TB</template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="router.push('/resources/pools')">去扩容</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import ChartCard from '@/components/ChartCard.vue'
import CapacityBar from '@/components/CapacityBar.vue'
import { getAllCustomers, getAllPools, getClusters } from '@/api'
import type { Customer, StorageCluster, StoragePool } from '@/types'
import { formatCapacity, dayjs } from '@/utils/format'
import { exportCsv } from '@/utils/export'

const router = useRouter()
const loading = ref(true)
const pools = ref<StoragePool[]>([])
const customers = ref<Customer[]>([])
const clusters = ref<StorageCluster[]>([])

const stat = computed(() => {
  const total = pools.value.reduce((s, p) => s + p.totalTB, 0)
  const used = pools.value.reduce((s, p) => s + p.usedTB, 0)
  const grow = pools.value.reduce((s, p) => s + p.growRatePerMonth, 0)
  const need = pools.value.filter((p) => p.forecastDays < 90).reduce((s, p) => s + p.growRatePerMonth * 3, 0)
  return { total, used, rate: total ? (used / total) * 100 : 0, grow, needExpand: need }
})

const riskPools = computed(() => [...pools.value].sort((a, b) => a.forecastDays - b.forecastDays).slice(0, 8))

function suggest(row: StoragePool) {
  return Math.max(20, Math.ceil((row.growRatePerMonth * 6) / 10) * 10)
}

const customerOption = computed<EChartsOption>(() => {
  const rows = customers.value
    .map((c) => ({
      name: c.name.replace(/中心|集团|数据中心/g, ''),
      used: Number(pools.value.filter((p) => p.customerId === c.id).reduce((s, p) => s + p.usedTB, 0).toFixed(0)),
      free: Number(pools.value.filter((p) => p.customerId === c.id).reduce((s, p) => s + p.freeTB, 0).toFixed(0))
    }))
    .sort((a, b) => b.used + b.free - (a.used + a.free))
  return {
    grid: { left: 8, right: 20, top: 34, bottom: 4, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { right: 0, top: 0, itemWidth: 10, itemHeight: 6, textStyle: { fontSize: 11, color: '#8A94A6' } },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#EEF1F6', type: 'dashed' } }, axisLabel: { color: '#8A94A6', fontSize: 11 } },
    yAxis: { type: 'category', data: rows.map((r) => r.name), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#5B6675', fontSize: 11 } },
    series: [
      { name: '已用', type: 'bar', stack: 'c', data: rows.map((r) => r.used), barWidth: 14, itemStyle: { color: '#1668DC', borderRadius: [0, 0, 0, 0] } },
      { name: '剩余', type: 'bar', stack: 'c', data: rows.map((r) => r.free), barWidth: 14, itemStyle: { color: '#D6E5FA', borderRadius: [0, 4, 4, 0] } }
    ]
  }
})

const vendorOption = computed<EChartsOption>(() => {
  const map: Record<string, number> = {}
  clusters.value.forEach((c) => (map[c.vendor] = (map[c.vendor] ?? 0) + c.totalTB))
  return {
    tooltip: { trigger: 'item', formatter: '{b}<br/>{c} TB（{d}%）' },
    legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11, color: '#5B6675' } },
    color: ['#1668DC', '#13C2C2', '#F5A524', '#7C5CFC', '#E5484D', '#22C55E', '#94A3B8'],
    series: [
      {
        type: 'pie',
        radius: ['45%', '68%'],
        center: ['50%', '44%'],
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { fontSize: 11, color: '#5B6675' },
        data: Object.entries(map).map(([name, value]) => ({ name, value }))
      }
    ]
  }
})

const histOption = computed<EChartsOption>(() => {
  const buckets = [
    { label: '<50%', min: 0, max: 50 },
    { label: '50-70%', min: 50, max: 70 },
    { label: '70-85%', min: 70, max: 85 },
    { label: '85-92%', min: 85, max: 92 },
    { label: '≥92%', min: 92, max: 200 }
  ]
  const data = buckets.map((b) => pools.value.filter((p) => p.usageRate >= b.min && p.usageRate < b.max).length)
  return {
    grid: { left: 8, right: 16, top: 20, bottom: 4, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'category', data: buckets.map((b) => b.label), axisLine: { lineStyle: { color: '#E5E8EF' } }, axisTick: { show: false }, axisLabel: { color: '#8A94A6', fontSize: 11 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#EEF1F6', type: 'dashed' } }, axisLabel: { color: '#8A94A6', fontSize: 11 }, minInterval: 1 },
    series: [
      {
        type: 'bar',
        data: data.map((v, i) => ({ value: v, itemStyle: { color: i >= 3 ? '#E5484D' : i === 2 ? '#F5A524' : '#1668DC', borderRadius: [4, 4, 0, 0] } })),
        barWidth: 34,
        label: { show: true, position: 'top', color: '#5B6675', fontSize: 11 }
      }
    ]
  }
})

const growthOption = computed<EChartsOption>(() => {
  const used = stat.value.used
  const months: string[] = []
  const data: (number | null)[] = []
  const forecast: (number | null)[] = []
  for (let i = 11; i >= 0; i--) {
    months.push(dayjs().subtract(i, 'month').format('YY-MM'))
    data.push(Number((used * Math.pow(0.973, i)).toFixed(0)))
    forecast.push(null)
  }
  forecast[11] = data[11]
  for (let i = 1; i <= 6; i++) {
    months.push(dayjs().add(i, 'month').format('YY-MM'))
    data.push(null)
    forecast.push(Number((used * Math.pow(1.028, i)).toFixed(0)))
  }
  return {
    grid: { left: 8, right: 16, top: 30, bottom: 4, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { right: 0, top: 0, itemWidth: 10, itemHeight: 6, textStyle: { fontSize: 11, color: '#8A94A6' } },
    xAxis: { type: 'category', data: months, boundaryGap: false, axisLine: { lineStyle: { color: '#E5E8EF' } }, axisTick: { show: false }, axisLabel: { color: '#8A94A6', fontSize: 10 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#EEF1F6', type: 'dashed' } }, axisLabel: { color: '#8A94A6', fontSize: 11 } },
    series: [
      { name: '已用容量', type: 'line', smooth: true, showSymbol: false, data, lineStyle: { color: '#1668DC', width: 2 }, itemStyle: { color: '#1668DC' }, areaStyle: { color: 'rgba(22,104,220,0.12)' } },
      { name: '预测', type: 'line', smooth: true, symbol: 'none', data: forecast, lineStyle: { color: '#F5A524', width: 2, type: 'dashed' } }
    ]
  }
})

function onExport() {
  exportCsv(
    '容量分析.csv',
    ['存储池', '客户', '总容量TB', '已用TB', '使用率%', '月均增长TB', '预计可用天数'],
    pools.value.map((p) => [p.name, p.customerName, p.totalTB, p.usedTB, p.usageRate, p.growRatePerMonth, p.forecastDays])
  )
  ElMessage.success('已导出容量明细')
}

onMounted(async () => {
  const [ps, cs, cl] = await Promise.all([getAllPools(), getAllCustomers(), getClusters({ page: 1, pageSize: 999 })])
  pools.value = ps
  customers.value = cs
  clusters.value = cl.list
  loading.value = false
})
</script>

<style scoped>
.danger-text {
  color: #dc2626;
  font-weight: 500;
}
</style>
