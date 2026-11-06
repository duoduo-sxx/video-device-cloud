<template>
  <div class="page dashboard" v-loading="loading">
    <div class="welcome">
      <div class="w-left">
        <div class="hello">{{ greeting }}，{{ user?.name || '同事' }}</div>
        <div class="hello-sub">
          今天是 {{ today }} · 当前共有
          <b>{{ data?.activeAlarms ?? 0 }}</b> 条活跃告警、<b>{{ data?.openTickets ?? 0 }}</b> 张待闭环工单
        </div>
      </div>
      <div class="w-right">
        <div class="duty-inline" v-if="data?.duty">
          <span class="dot-live" />
          今日主班 <b>{{ data.duty.primary }}</b>
          <span class="muted">备班 {{ data.duty.backup }} · {{ data.duty.phone }}</span>
        </div>
        <el-button type="primary" :icon="Plus" @click="router.push('/service/tickets/new')">新建工单</el-button>
        <el-button :icon="SetUp" @click="router.push('/service/changes')">发起变更</el-button>
      </div>
    </div>

    <div class="kpi-grid">
      <StatCard label="纳管总容量" :value="capacityValue(data?.totalCapacityTB)" :unit="capacityUnit(data?.totalCapacityTB)" icon="Coin" tone="primary" hint="18 套集群 · 46 个存储池" />
      <StatCard label="已用容量" :value="capacityValue(data?.usedCapacityTB)" :unit="capacityUnit(data?.usedCapacityTB)" icon="Files" tone="cyan" hint="近 30 天增长 46.8 TB" />
      <StatCard label="整体使用率" :value="(data?.usageRate ?? 0).toFixed(1)" unit="%" icon="PieChart" :tone="(data?.usageRate ?? 0) >= 85 ? 'warning' : 'primary'" :progress="data?.usageRate" :hint="`${riskCount} 个池超过 85%`" />
      <StatCard label="在线设备" :value="`${data?.deviceOnline ?? 0}/${data?.deviceTotal ?? 0}`" unit="台" icon="Cpu" tone="success" hint="在线率 96.8%" />
      <StatCard label="活跃告警" :value="data?.activeAlarms ?? 0" unit="条" icon="Warning" tone="danger" :hint="`其中 P1 ${data?.p1Alarms ?? 0} 条`" />
      <StatCard label="未闭环工单" :value="data?.openTickets ?? 0" unit="单" icon="Tickets" tone="warning" hint="含待受理、处理中、待验收" />
      <StatCard label="SLA 达成率" :value="(data?.slaRate ?? 0).toFixed(1)" unit="%" icon="DataLine" tone="success" hint="按已关闭工单解决时限统计" />
      <StatCard label="本月服务工时" :value="(data?.monthWorkHours ?? 0).toFixed(1)" unit="h" icon="Clock" tone="purple" hint="本月工单登记工时合计" />
    </div>

    <div class="cols-2">
      <ChartCard title="容量趋势与预测" subtitle="近 12 个月实际 + 未来 6 个月线性预测" :option="capacityOption" :height="300">
        <template #extra>
          <el-radio-group v-model="capacityRange" size="small">
            <el-radio-button value="6">6 个月</el-radio-button>
            <el-radio-button value="12">12 个月</el-radio-button>
          </el-radio-group>
        </template>
      </ChartCard>
      <ChartCard title="活跃告警等级分布" :subtitle="`共 ${data?.activeAlarms ?? 0} 条`" :option="alarmOption" :height="300" />
    </div>

    <div class="cols-2">
      <ChartCard title="工单趋势" subtitle="近 14 天新建与关闭" :option="ticketOption" :height="280" />
      <ChartCard title="服务项工单量 TOP5" subtitle="近 12 个月" :option="serviceOption" :height="280" />
    </div>

    <div class="cols-2">
      <div class="card">
        <div class="card-head">
          <div class="card-title">容量风险 TOP5 <span class="sub">按使用率排序</span></div>
          <el-button link type="primary" @click="router.push('/resources/pools')">查看全部</el-button>
        </div>
        <el-table :data="data?.riskPools ?? []" size="small" style="width: 100%">
          <el-table-column prop="name" label="存储池" min-width="180">
            <template #default="{ row }">
              <div class="pool-name mono">{{ row.name }}</div>
              <div class="tiny muted">{{ row.customerName }} · {{ row.clusterName }}</div>
            </template>
          </el-table-column>
          <el-table-column label="使用率" width="150">
            <template #default="{ row }"><CapacityBar :value="row.usageRate" /></template>
          </el-table-column>
          <el-table-column label="剩余容量" width="100">
            <template #default="{ row }"><span class="num">{{ formatCapacity(row.freeTB) }}</span></template>
          </el-table-column>
          <el-table-column label="预计可用" width="96">
            <template #default="{ row }">
              <span :class="row.forecastDays < 90 ? 'danger-text' : ''">{{ row.forecastDays }} 天</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="92" align="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="expand(row)">发起扩容</el-button>
            </template>
          </el-table-column>
          <template #empty><EmptyState text="暂无容量风险" /></template>
        </el-table>
      </div>

      <div class="side-stack">
        <div class="card">
          <div class="card-head">
            <div class="card-title">我的待办</div>
            <span class="tiny muted">点击进入列表</span>
          </div>
          <div class="todo-list">
            <div v-for="t in data?.todos ?? []" :key="t.key" class="todo-item" @click="router.push(t.path)">
              <span class="todo-label">{{ t.label }}</span>
              <span class="todo-count" :class="{ zero: t.count === 0 }">{{ t.count }}</span>
              <el-icon :size="12" class="muted"><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
        <div class="card duty-card" v-if="data?.duty">
          <div class="card-head">
            <div class="card-title">今日值班</div>
            <span class="tiny muted">{{ today }}</span>
          </div>
          <div class="duty-row">
            <div class="duty-person">
              <div class="avatar-lg primary">{{ data.duty.primary.slice(0, 1) }}</div>
              <div>
                <div class="duty-name">{{ data.duty.primary }}</div>
                <div class="tiny muted">主班 · 存储一线</div>
              </div>
            </div>
            <div class="duty-person">
              <div class="avatar-lg neutral">{{ data.duty.backup.slice(0, 1) }}</div>
              <div>
                <div class="duty-name">{{ data.duty.backup }}</div>
                <div class="tiny muted">备班 · 存储二线</div>
              </div>
            </div>
          </div>
          <div class="duty-phone">
            <el-icon :size="13"><Phone /></el-icon>
            值班电话 {{ data.duty.phone }}
          </div>
        </div>
      </div>
    </div>

    <div class="cols-2-even">
      <div class="card">
        <div class="card-head">
          <div class="card-title">最近动态</div>
          <el-button link type="primary" @click="router.push('/system/logs')">操作日志</el-button>
        </div>
        <div class="activity">
          <div v-for="a in data?.activity ?? []" :key="a.id" class="activity-item">
            <span class="activity-dot" :class="a.result === 'fail' ? 'fail' : ''" />
            <div class="activity-main">
              <div class="activity-text">
                <b>{{ a.actor }}</b> {{ a.action }} <span class="mono">{{ a.target }}</span>
              </div>
              <div class="tiny muted">{{ a.module }} · {{ fromNow(a.time) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="card-title">最新工单</div>
          <el-button link type="primary" @click="router.push('/service/tickets')">全部工单</el-button>
        </div>
        <div class="ticket-list">
          <div v-for="t in data?.recentTickets ?? []" :key="t.id" class="ticket-item" @click="router.push(`/service/tickets/${t.id}`)">
            <div class="ticket-top">
              <span class="mono tiny muted">{{ t.id }}</span>
              <StatusTag kind="priority" :value="t.priority" />
              <StatusTag kind="ticket" :value="t.status" />
            </div>
            <div class="ticket-title">{{ t.title }}</div>
            <div class="tiny muted">{{ t.customerName }} · {{ t.serviceItem }} · {{ fromNow(t.createdAt) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Clock, Plus, SetUp } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import StatCard from '@/components/StatCard.vue'
import ChartCard from '@/components/ChartCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import CapacityBar from '@/components/CapacityBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getDashboard, type DashboardData, expandPool } from '@/api'
import { useUserStore } from '@/stores/user'
import { dayjs, formatCapacity, fromNow } from '@/utils/format'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const store = useUserStore()
const user = computed(() => store.user)

const loading = ref(true)
const data = ref<DashboardData>()
const capacityRange = ref<'6' | '12'>('12')

const greeting = computed(() => {
  const h = dayjs().hour()
  if (h < 6) return '凌晨好'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const today = computed(() => dayjs().format('YYYY-MM-DD dddd'))
const riskCount = computed(() => (data.value?.riskPools ?? []).filter((p) => p.usageRate >= 85).length)

function capacityValue(tb?: number) {
  if (!tb) return '0'
  return tb >= 1024 ? (tb / 1024).toFixed(2) : tb.toFixed(0)
}
function capacityUnit(tb?: number) {
  return tb && tb >= 1024 ? 'PB' : 'TB'
}

const capacityOption = computed<EChartsOption>(() => {
  const all = data.value?.capacityTrend ?? []
  const rows = capacityRange.value === '6' ? all.slice(6) : all
  const months = rows.map((r) => r.month.slice(2))
  const history = rows.map((r) => (r.forecast ? null : r.used))
  const forecast = rows.map((r, i) => {
    if (!r.forecast) {
      const next = rows[i + 1]
      return next?.forecast ? r.used : null
    }
    return r.used
  })
  const total = rows[0]?.total ?? 0
  return {
    grid: { left: 8, right: 16, top: 34, bottom: 6, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#E5E8EF',
      textStyle: { color: '#1F2937', fontSize: 12 },
      formatter: (params: any) => {
        const list = params as any[]
        const title = list[0]?.axisValue
        const lines = list
          .filter((p) => p.value !== null && p.value !== undefined)
          .map((p) => `${p.marker}${p.seriesName}：<b>${Number(p.value).toFixed(1)} TB</b>`)
        return `<div style="font-weight:600;margin-bottom:4px">20${title}</div>${lines.join('<br/>')}`
      }
    },
    legend: { right: 0, top: 0, itemWidth: 10, itemHeight: 6, textStyle: { fontSize: 11, color: '#8A94A6' } },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#E5E8EF' } },
      axisTick: { show: false },
      axisLabel: { color: '#8A94A6', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: 'TB',
      nameTextStyle: { color: '#B6BECC', fontSize: 10 },
      splitLine: { lineStyle: { color: '#EEF1F6', type: 'dashed' } },
      axisLabel: { color: '#8A94A6', fontSize: 11 }
    },
    series: [
      {
        name: '已用容量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: false,
        data: history,
        lineStyle: { width: 2, color: '#1668DC' },
        itemStyle: { color: '#1668DC' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(22,104,220,0.18)' }, { offset: 1, color: 'rgba(22,104,220,0.01)' }]
          }
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#E5484D', type: 'dashed', width: 1 },
          label: { formatter: '警戒水位 92%', color: '#E5484D', fontSize: 10, position: 'insideEndTop' },
          data: [{ yAxis: Number((total * 0.92).toFixed(1)) }]
        }
      },
      {
        name: '容量预测',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: forecast,
        lineStyle: { width: 2, color: '#F5A524', type: 'dashed' },
        itemStyle: { color: '#F5A524' }
      }
    ]
  }
})

const alarmOption = computed<EChartsOption>(() => {
  const dist = data.value?.alarmDist ?? []
  const total = dist.reduce((s, d) => s + d.value, 0)
  const colors: Record<string, string> = { P1: '#E5484D', P2: '#F59E0B', P3: '#1668DC', P4: '#94A3B8' }
  return {
    tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 条（{d}%）' },
    legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11, color: '#5B6675' } },
    title: {
      text: String(total),
      subtext: '活跃告警',
      left: 'center',
      top: '34%',
      textStyle: { fontSize: 24, fontWeight: 600, color: '#1F2937' },
      subtextStyle: { fontSize: 11, color: '#8A94A6' }
    },
    series: [
      {
        type: 'pie',
        radius: ['58%', '76%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fff', borderWidth: 3 },
        label: { show: false },
        data: dist.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: colors[d.level] } }))
      }
    ]
  }
})

const ticketOption = computed<EChartsOption>(() => {
  const rows = data.value?.ticketTrend ?? []
  return {
    grid: { left: 8, right: 12, top: 34, bottom: 6, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { right: 0, top: 0, itemWidth: 10, itemHeight: 6, textStyle: { fontSize: 11, color: '#8A94A6' } },
    xAxis: {
      type: 'category',
      data: rows.map((r) => r.date),
      axisLine: { lineStyle: { color: '#E5E8EF' } },
      axisTick: { show: false },
      axisLabel: { color: '#8A94A6', fontSize: 10, interval: 2 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#EEF1F6', type: 'dashed' } },
      axisLabel: { color: '#8A94A6', fontSize: 11 },
      minInterval: 1
    },
    series: [
      { name: '新建', type: 'bar', data: rows.map((r) => r.created), barWidth: 10, itemStyle: { color: '#1668DC', borderRadius: [3, 3, 0, 0] } },
      { name: '关闭', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, data: rows.map((r) => r.closed), lineStyle: { color: '#13C2C2', width: 2 }, itemStyle: { color: '#13C2C2' } }
    ]
  }
})

const serviceOption = computed<EChartsOption>(() => {
  const rows = [...(data.value?.serviceTop ?? [])].reverse()
  return {
    grid: { left: 8, right: 46, top: 10, bottom: 4, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#EEF1F6', type: 'dashed' } }, axisLabel: { color: '#8A94A6', fontSize: 11 } },
    yAxis: {
      type: 'category',
      data: rows.map((r) => r.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#5B6675', fontSize: 12 }
    },
    series: [
      {
        type: 'bar',
        data: rows.map((r) => r.value),
        barWidth: 12,
        itemStyle: { color: '#1668DC', borderRadius: [0, 6, 6, 0] },
        label: { show: true, position: 'right', color: '#5B6675', fontSize: 11 }
      }
    ]
  }
})

async function expand(row: { id: string; name: string }) {
  const val = await ElMessageBox.prompt(`为「${row.name}」申请扩容容量（TB）`, '发起扩容变更', {
    inputValue: '40',
    inputPattern: /^\d+(\.\d+)?$/,
    inputErrorMessage: '请输入数字',
    confirmButtonText: '提交'
  }).catch(() => null)
  if (!val) return
  await expandPool(row.id, Number(val.value))
  ElMessage.success('扩容申请已提交，容量已更新，变更单等待审批')
  data.value = await getDashboard()
}

onMounted(async () => {
  loading.value = true
  data.value = await getDashboard()
  loading.value = false
})
</script>

<style scoped>
.dashboard {
  padding-bottom: 8px;
}

.welcome {
  background: linear-gradient(100deg, #0f2a4d 0%, #123d6e 60%, #155a9c 100%);
  border-radius: 12px;
  padding: 20px 24px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.hello {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.hello-sub {
  margin-top: 6px;
  font-size: 12.5px;
  color: #b7cde8;
}

.hello-sub b {
  color: #7fd8d8;
  font-weight: 600;
  margin: 0 2px;
}

.w-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.duty-inline {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: #c9dcf3;
  margin-right: 6px;
}

.duty-inline b {
  color: #fff;
}

.dot-live {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4fd6d6;
  box-shadow: 0 0 0 3px rgba(79, 214, 214, 0.18);
}

.pool-name {
  font-size: 12.5px;
  color: var(--neutral-900);
}

.danger-text {
  color: #e5484d;
  font-weight: 500;
}

.side-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.todo-item:hover {
  background: #f5f8fd;
}

.todo-label {
  flex: 1;
  font-size: 13px;
  color: var(--neutral-700);
}

.todo-count {
  min-width: 24px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: #fdecec;
  color: #dc2626;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-variant-numeric: tabular-nums;
}

.todo-count.zero {
  background: #f1f3f7;
  color: #8a94a6;
}

.duty-row {
  display: flex;
  gap: 12px;
}

.duty-person {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-lg {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  flex: none;
}

.avatar-lg.primary {
  background: #1668dc;
}

.avatar-lg.neutral {
  background: #94a3b8;
}

.duty-name {
  font-size: 13px;
  color: var(--neutral-900);
}

.duty-phone {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--divider);
  font-size: 12px;
  color: var(--neutral-600);
  display: flex;
  align-items: center;
  gap: 6px;
}

.activity {
  display: flex;
  flex-direction: column;
}

.activity-item {
  display: flex;
  gap: 10px;
  padding: 7px 0;
  position: relative;
}

.activity-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 20px;
  bottom: -2px;
  width: 1px;
  background: var(--divider);
}

.activity-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1668dc;
  margin-top: 6px;
  flex: none;
}

.activity-dot.fail {
  background: #e5484d;
}

.activity-text {
  font-size: 12.5px;
  color: var(--neutral-700);
  line-height: 18px;
}

.activity-text b {
  font-weight: 500;
  color: var(--neutral-900);
}

.ticket-list {
  display: flex;
  flex-direction: column;
}

.ticket-item {
  padding: 9px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.ticket-item:hover {
  background: #f5f8fd;
}

.ticket-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ticket-title {
  font-size: 13px;
  color: var(--neutral-900);
  margin: 4px 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1280px) {
  .duty-inline {
    display: none;
  }
}
</style>
