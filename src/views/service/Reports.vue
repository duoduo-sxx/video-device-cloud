<template>
  <div class="page" v-loading="loading">
    <PageHeader title="服务质量分析" desc="工单量、SLA 达成、MTTR 与工程师绩效的多维分析">
      <template #actions>
        <el-select v-model="months" style="width: 130px" @change="compute">
          <el-option label="近 3 个月" :value="3" />
          <el-option label="近 6 个月" :value="6" />
          <el-option label="近 12 个月" :value="12" />
        </el-select>
        <el-select v-model="customerId" placeholder="全部客户" clearable filterable style="width: 190px" @change="compute">
          <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-button :icon="Download" @click="onExport">导出</el-button>
        <el-button :icon="Printer" @click="print">打印</el-button>
      </template>
    </PageHeader>

    <div class="kpi-grid">
      <StatCard label="工单总量" :value="kpi.total" unit="单" icon="Tickets" tone="primary" :hint="`周期内新建 ${kpi.created} 单`" />
      <StatCard label="平均响应时长" :value="kpi.avgResponse.toFixed(1)" unit="h" icon="Clock" tone="cyan" :hint="`目标 ≤ ${kpi.responseTarget}h`" />
      <StatCard label="平均解决时长 MTTR" :value="kpi.mttr.toFixed(1)" unit="h" icon="Timer" tone="purple" hint="从受理到解决的平均耗时" />
      <StatCard label="SLA 达成率" :value="kpi.slaRate.toFixed(1)" unit="%" icon="DataLine" tone="success" :progress="kpi.slaRate" hint="按已关闭工单统计" />
      <StatCard label="一次解决率" :value="kpi.firstFix.toFixed(1)" unit="%" icon="CircleCheck" tone="success" hint="未挂起、未升级直接解决" />
      <StatCard label="平均满意度" :value="kpi.satisfaction.toFixed(2)" unit="分" icon="Star" tone="warning" hint="5 分制，客户验收评价" />
      <StatCard label="超时工单" :value="kpi.overdue" unit="单" icon="Warning" tone="danger" hint="解决时限超出合同约定" />
      <StatCard label="服务工时" :value="kpi.workHours.toFixed(0)" unit="h" icon="Odometer" tone="primary" hint="周期内工单登记工时" />
    </div>

    <div class="cols-2">
      <ChartCard title="工单量与解决量趋势" subtitle="按自然月统计" :option="trendOption" :height="300" />
      <ChartCard title="服务项分布" :subtitle="`共 ${kpi.total} 单`" :option="servicePieOption" :height="300" />
    </div>

    <div class="cols-2">
      <ChartCard title="SLA 达成率与平均解决时长" subtitle="月度对比" :option="slaOption" :height="290" />
      <ChartCard title="优先级分布" :option="priorityOption" :height="290" />
    </div>

    <div class="card">
      <div class="card-head">
        <div class="card-title">工程师绩效 <span class="sub">按工单量排序</span></div>
        <span class="tiny muted">响应/解决时长单位为小时</span>
      </div>
      <el-table :data="engineerRows" size="small">
        <el-table-column type="index" label="#" width="52" />
        <el-table-column prop="name" label="工程师" width="110">
          <template #default="{ row }">
            <div class="eng-cell">
              <span class="eng-avatar">{{ row.name.slice(0, 1) }}</span>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="count" label="工单量" width="90" sortable />
        <el-table-column label="平均响应" width="110" sortable prop="response">
          <template #default="{ row }">{{ row.response.toFixed(1) }} h</template>
        </el-table-column>
        <el-table-column label="平均解决" width="110" sortable prop="resolve">
          <template #default="{ row }">{{ row.resolve.toFixed(1) }} h</template>
        </el-table-column>
        <el-table-column label="SLA 达成率" width="130">
          <template #default="{ row }">
            <div class="rate-cell">
              <CapacityBar :value="row.sla" :height="5" :show-label="false" />
              <span class="tiny num">{{ row.sla.toFixed(1) }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="满意度" width="130">
          <template #default="{ row }">
            <el-rate v-if="row.satisfaction" :model-value="row.satisfaction" disabled size="small" />
            <span v-else class="tiny muted">--</span>
          </template>
        </el-table-column>
        <el-table-column prop="workHours" label="工时" width="90">
          <template #default="{ row }">{{ row.workHours.toFixed(1) }} h</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Printer } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import ChartCard from '@/components/ChartCard.vue'
import CapacityBar from '@/components/CapacityBar.vue'
import { getAllCustomers, getAllTickets } from '@/api'
import type { Customer, Ticket } from '@/types'
import { dayjs } from '@/utils/format'
import { exportCsv } from '@/utils/export'

const loading = ref(true)
const months = ref(12)
const customerId = ref('')
const tickets = ref<Ticket[]>([])
const customers = ref<Customer[]>([])

const filtered = computed(() =>
  tickets.value.filter((t) => (!customerId.value || t.customerId === customerId.value) && dayjs(t.createdAt).valueOf() >= dayjs().subtract(months.value, 'month').startOf('month').valueOf())
)

const kpi = computed(() => {
  const list = filtered.value
  const closed = list.filter((t) => t.status === 'closed')
  const resolved = list.filter((t) => t.resolvedAt)
  const avgResponse = resolved.length
    ? resolved.reduce((s, t) => s + dayjs(t.respondedAt ?? t.createdAt).diff(dayjs(t.createdAt), 'minute') / 60, 0) / resolved.length
    : 0
  const mttr = resolved.length
    ? resolved.reduce((s, t) => s + dayjs(t.resolvedAt!).diff(dayjs(t.createdAt), 'minute') / 60, 0) / resolved.length
    : 0
  const slaOk = closed.filter((t) => t.slaResolveOk).length
  const rated = closed.filter((t) => t.satisfaction)
  return {
    total: list.length,
    created: list.filter((t) => dayjs(t.createdAt).valueOf() >= dayjs().subtract(30, 'day').valueOf()).length,
    avgResponse,
    responseTarget: 2,
    mttr,
    slaRate: closed.length ? (slaOk / closed.length) * 100 : 0,
    firstFix: closed.length ? (closed.filter((t) => !t.timeline.some((x) => x.action === '挂起')).length / closed.length) * 100 : 0,
    satisfaction: rated.length ? rated.reduce((s, t) => s + (t.satisfaction ?? 0), 0) / rated.length : 0,
    overdue: closed.filter((t) => t.slaResolveOk === false).length,
    workHours: list.reduce((s, t) => s + t.workHours, 0)
  }
})

const monthList = computed(() => {
  const arr: { key: string; label: string }[] = []
  for (let i = months.value - 1; i >= 0; i--) {
    const m = dayjs().subtract(i, 'month')
    arr.push({ key: m.format('YYYY-MM'), label: m.format('MM 月') })
  }
  return arr
})

const trendOption = computed<EChartsOption>(() => {
  const created = monthList.value.map((m) => filtered.value.filter((t) => dayjs(t.createdAt).format('YYYY-MM') === m.key).length)
  const closed = monthList.value.map((m) => filtered.value.filter((t) => t.closedAt && dayjs(t.closedAt).format('YYYY-MM') === m.key).length)
  return {
    grid: { left: 8, right: 16, top: 36, bottom: 6, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { right: 0, top: 0, itemWidth: 10, itemHeight: 6, textStyle: { fontSize: 11, color: '#8A94A6' } },
    xAxis: { type: 'category', data: monthList.value.map((m) => m.label), axisLine: { lineStyle: { color: '#E5E8EF' } }, axisTick: { show: false }, axisLabel: { color: '#8A94A6', fontSize: 11 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#EEF1F6', type: 'dashed' } }, axisLabel: { color: '#8A94A6', fontSize: 11 } },
    series: [
      { name: '新建工单', type: 'bar', data: created, barWidth: 14, itemStyle: { color: '#1668DC', borderRadius: [3, 3, 0, 0] } },
      { name: '关闭工单', type: 'bar', data: closed, barWidth: 14, itemStyle: { color: '#13C2C2', borderRadius: [3, 3, 0, 0] } }
    ]
  }
})

const servicePieOption = computed<EChartsOption>(() => {
  const map: Record<string, number> = {}
  filtered.value.forEach((t) => (map[t.serviceItem] = (map[t.serviceItem] ?? 0) + 1))
  const data = Object.entries(map).map(([name, value]) => ({ name, value }))
  return {
    tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 单（{d}%）' },
    legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11, color: '#5B6675' } },
    color: ['#1668DC', '#13C2C2', '#F5A524', '#7C5CFC', '#E5484D', '#22C55E', '#94A3B8', '#0EA5E9'],
    series: [
      {
        type: 'pie',
        radius: ['45%', '68%'],
        center: ['50%', '44%'],
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { fontSize: 11, color: '#5B6675' },
        labelLine: { length: 8, length2: 8 },
        data
      }
    ]
  }
})

const slaOption = computed<EChartsOption>(() => {
  const rates = monthList.value.map((m) => {
    const closed = filtered.value.filter((t) => t.closedAt && dayjs(t.closedAt).format('YYYY-MM') === m.key)
    const ok = closed.filter((t) => t.slaResolveOk).length
    return closed.length ? Number(((ok / closed.length) * 100).toFixed(1)) : 0
  })
  const hours = monthList.value.map((m) => {
    const list = filtered.value.filter((t) => t.resolvedAt && dayjs(t.resolvedAt).format('YYYY-MM') === m.key)
    return list.length ? Number((list.reduce((s, t) => s + dayjs(t.resolvedAt!).diff(dayjs(t.createdAt), 'minute') / 60, 0) / list.length).toFixed(1)) : 0
  })
  return {
    grid: { left: 8, right: 16, top: 36, bottom: 6, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { right: 0, top: 0, itemWidth: 10, itemHeight: 6, textStyle: { fontSize: 11, color: '#8A94A6' } },
    xAxis: { type: 'category', data: monthList.value.map((m) => m.label), axisLine: { lineStyle: { color: '#E5E8EF' } }, axisTick: { show: false }, axisLabel: { color: '#8A94A6', fontSize: 11 } },
    yAxis: [
      { type: 'value', min: 80, max: 100, name: 'SLA %', nameTextStyle: { fontSize: 10, color: '#B6BECC' }, splitLine: { lineStyle: { color: '#EEF1F6', type: 'dashed' } }, axisLabel: { color: '#8A94A6', fontSize: 11 } },
      { type: 'value', name: '小时', nameTextStyle: { fontSize: 10, color: '#B6BECC' }, splitLine: { show: false }, axisLabel: { color: '#8A94A6', fontSize: 11 } }
    ],
    series: [
      { name: 'SLA 达成率', type: 'bar', data: rates, barWidth: 14, itemStyle: { color: '#1668DC', borderRadius: [3, 3, 0, 0] } },
      { name: '平均解决时长', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 5, data: hours, lineStyle: { color: '#F5A524', width: 2 }, itemStyle: { color: '#F5A524' } }
    ]
  }
})

const priorityOption = computed<EChartsOption>(() => {
  const levels = ['P1', 'P2', 'P3', 'P4']
  const colors: Record<string, string> = { P1: '#E5484D', P2: '#F59E0B', P3: '#1668DC', P4: '#94A3B8' }
  const data = levels.map((l) => ({ name: l, value: filtered.value.filter((t) => t.priority === l).length, itemStyle: { color: colors[l] } }))
  return {
    tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 单（{d}%）' },
    legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11, color: '#5B6675' } },
    series: [{ type: 'pie', radius: ['48%', '70%'], center: ['50%', '45%'], itemStyle: { borderColor: '#fff', borderWidth: 2 }, label: { fontSize: 11, color: '#5B6675' }, data }]
  }
})

const engineerRows = computed(() => {
  const map: Record<string, { name: string; count: number; response: number; resolve: number; sla: number; satisfaction: number; satCount: number; workHours: number }> = {}
  filtered.value.forEach((t) => {
    if (!t.assignee) return
    if (!map[t.assignee]) map[t.assignee] = { name: t.assignee, count: 0, response: 0, resolve: 0, sla: 0, satisfaction: 0, satCount: 0, workHours: 0 }
    const e = map[t.assignee]
    e.count += 1
    e.workHours += t.workHours
    if (t.respondedAt) e.response += dayjs(t.respondedAt).diff(dayjs(t.createdAt), 'minute') / 60
    if (t.resolvedAt) e.resolve += dayjs(t.resolvedAt).diff(dayjs(t.createdAt), 'minute') / 60
    if (t.slaResolveOk) e.sla += 1
    if (t.satisfaction) {
      e.satisfaction += t.satisfaction
      e.satCount += 1
    }
  })
  return Object.values(map)
    .map((e) => ({
      ...e,
      response: e.response / e.count,
      resolve: e.resolve / e.count,
      sla: (e.sla / e.count) * 100,
      satisfaction: e.satCount ? e.satisfaction / e.satCount : 0
    }))
    .sort((a, b) => b.count - a.count)
})

function print() {
  window.print()
}

function onExport() {
  exportCsv(
    '服务质量分析.csv',
    ['指标', '数值'],
    [
      ['工单总量', kpi.value.total],
      ['平均响应时长(h)', kpi.value.avgResponse.toFixed(1)],
      ['平均解决时长(h)', kpi.value.mttr.toFixed(1)],
      ['SLA达成率(%)', kpi.value.slaRate.toFixed(1)],
      ['一次解决率(%)', kpi.value.firstFix.toFixed(1)],
      ['平均满意度', kpi.value.satisfaction.toFixed(2)],
      ['超时工单', kpi.value.overdue],
      ['服务工时(h)', kpi.value.workHours.toFixed(1)]
    ]
  )
  ElMessage.success('已导出分析结果')
}

function compute() {
  /* 计算属性自动响应 */
}

onMounted(async () => {
  const [ts, cs] = await Promise.all([getAllTickets(), getAllCustomers()])
  tickets.value = ts
  customers.value = cs
  loading.value = false
})
</script>

<style scoped>
.eng-cell {
  display: flex;
  align-items: center;
  gap: 7px;
}

.eng-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e8f1ff;
  color: #1668dc;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.rate-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
