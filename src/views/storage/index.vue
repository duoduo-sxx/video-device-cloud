<script setup lang="ts">
/**
 * 云存储服务：容量概览 / 存储池 / 使用量分析 / 录像计划 / 归档任务 / 磁盘健康
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { storageApi } from '@/api'
import { useTable, paginationLayout, paginationSizes } from '@/composables/useTable'
import PageContainer from '@/components/PageContainer.vue'
import StatCard from '@/components/StatCard.vue'
import BaseChart from '@/components/BaseChart.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { CHART_COLORS, STORAGE_TYPE_OPTIONS, WEEK_DAYS } from '@/utils/dict'
import { formatDateTime, formatDuration, formatNumber, formatPercent, formatStorage } from '@/utils/format'

const activeTab = ref('overview')

const overview = ref<any>({})
const disks = ref<any[]>([])
const diskWarning = ref(0)

/* ---------- 存储池 ---------- */
const poolTable = useTable({
  api: storageApi.pools as any,
  syncQuery: true,
  defaultParams: { keyword: '', type: '', status: '' }
})

const poolDialog = ref(false)
const poolEditing = ref<any>(null)
const poolFormRef = ref<FormInstance>()
const poolForm = reactive<any>({
  name: '',
  type: 'standard',
  region: '',
  nodeId: '',
  capacityTB: 500,
  retentionDays: 30,
  lifecycleRule: { daysToIA: 7, daysToArchive: 30, daysToDelete: 90 }
})

const poolRules: FormRules = {
  name: [{ required: true, message: '请输入存储池名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择存储类型', trigger: 'change' }],
  region: [{ required: true, message: '请输入所属区域', trigger: 'blur' }],
  capacityTB: [{ required: true, message: '请输入容量', trigger: 'blur' }]
}

/* ---------- 使用量 ---------- */
const usageDimension = ref<'tenant' | 'device' | 'channel'>('tenant')
const usage = useTable({
  api: storageApi.usage as any,
  defaultParams: { dimension: 'tenant', keyword: '' }
})

/* ---------- 录像计划 ---------- */
const planTable = useTable({
  api: storageApi.plans as any,
  defaultParams: { keyword: '', template: '' }
})

const planDialog = ref(false)
const planEditing = ref<any>(null)
const planForm = reactive<any>({
  name: '',
  template: 'continuous',
  streamType: 'main',
  storagePoolId: '',
  retentionDays: 30,
  channelIds: [] as string[],
  timeSlots: [{ day: 1, start: '00:00', end: '23:59' }] as any[],
  status: 1
})

const TEMPLATE_OPTIONS = [
  { label: '全天连续录像', value: 'continuous' },
  { label: '工作日录像', value: 'workday' },
  { label: '夜间录像', value: 'night' },
  { label: '移动侦测录像', value: 'motion' },
  { label: '自定义时段', value: 'custom' }
]

/* ---------- 归档 ---------- */
const archiveTable = useTable({
  api: storageApi.archiveTasks as any,
  defaultParams: { status: '', type: '' }
})
const archiveDialog = ref(false)
const archiveForm = reactive<any>({ fromPoolId: '', toPoolId: '', beforeDays: 90, creator: '当前用户' })

const pools = computed(() => poolTable.list.value as any[])

async function loadOverview() {
  overview.value = await storageApi.overview()
}

async function loadDisks() {
  const res: any = await storageApi.disks()
  disks.value = res.list || []
  diskWarning.value = res.warning || 0
}

/* ---------- 存储池操作 ---------- */
function openPoolCreate() {
  poolEditing.value = null
  Object.assign(poolForm, { name: '', type: 'standard', region: '', nodeId: '', capacityTB: 500, retentionDays: 30, lifecycleRule: { daysToIA: 7, daysToArchive: 30, daysToDelete: 90 } })
  poolDialog.value = true
}

function openPoolEdit(row: any) {
  poolEditing.value = row
  Object.assign(poolForm, JSON.parse(JSON.stringify(row)))
  poolDialog.value = true
}

async function submitPool() {
  const ok = await poolFormRef.value?.validate().catch(() => false)
  if (!ok) return
  try {
    if (poolEditing.value) {
      await storageApi.updatePool(poolEditing.value.id, { ...poolForm })
      ElMessage.success('存储池已更新')
    } else {
      await storageApi.createPool({ ...poolForm })
      ElMessage.success('存储池已创建')
    }
    poolDialog.value = false
    await Promise.all([poolTable.load(), loadOverview()])
  } catch {
    /* 已提示 */
  }
}

/* ---------- 计划操作 ---------- */
function openPlanCreate() {
  planEditing.value = null
  Object.assign(planForm, {
    name: '',
    template: 'continuous',
    streamType: 'main',
    storagePoolId: pools.value[0]?.id || '',
    retentionDays: 30,
    channelIds: [],
    timeSlots: [{ day: 1, start: '00:00', end: '23:59' }],
    status: 1
  })
  planDialog.value = true
}

function openPlanEdit(row: any) {
  planEditing.value = row
  Object.assign(planForm, JSON.parse(JSON.stringify(row)))
  planDialog.value = true
}

function applyTemplate() {
  const t = planForm.template
  if (t === 'continuous') planForm.timeSlots = [{ day: 1, start: '00:00', end: '23:59' }]
  else if (t === 'workday') planForm.timeSlots = [1, 2, 3, 4, 5].map((d) => ({ day: d, start: '08:00', end: '20:00' }))
  else if (t === 'night') planForm.timeSlots = [1, 2, 3, 4, 5, 6, 7].map((d) => ({ day: d, start: '20:00', end: '23:59' }))
  else if (t === 'motion') planForm.timeSlots = [{ day: 1, start: '00:00', end: '23:59' }]
}

async function submitPlan() {
  if (!planForm.name) return ElMessage.warning('请输入计划名称')
  if (!planForm.channelIds.length) return ElMessage.warning('请至少绑定一个通道')
  if (!planForm.timeSlots.length) return ElMessage.warning('请至少配置一个录像时间段')
  if (planEditing.value) {
    await storageApi.updatePlan(planEditing.value.id, { ...planForm })
    ElMessage.success('录像计划已更新')
  } else {
    await storageApi.createPlan({ ...planForm })
    ElMessage.success('录像计划已创建')
  }
  planDialog.value = false
  planTable.load()
}

async function removePlan(row: any) {
  await ElMessageBox.confirm(`删除计划「${row.name}」后，绑定通道将回落到默认录像策略。确认删除？`, '删除录像计划', { type: 'warning' })
  await storageApi.removePlan(row.id)
  ElMessage.success('录像计划已删除')
  planTable.load()
}

async function submitArchive() {
  if (!archiveForm.fromPoolId || !archiveForm.toPoolId) return ElMessage.warning('请选择源存储池与目标存储池')
  try {
    const res: any = await storageApi.createArchive({ ...archiveForm })
    ElMessage.success(`归档任务已创建：${res.name}`)
    archiveDialog.value = false
    archiveTable.load()
  } catch {
    /* 已提示 */
  }
}

/* ---------- 图表 ---------- */
const capacityOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['已用容量', '总容量'], top: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
  grid: { left: 12, right: 20, top: 36, bottom: 8, containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: overview.value.dates || [] },
  yAxis: { type: 'value', name: 'TB' },
  series: [
    { name: '已用容量', type: 'line', smooth: true, symbolSize: 4, areaStyle: { opacity: 0.18 }, data: overview.value.growth || [] },
    { name: '总容量', type: 'line', smooth: true, symbol: 'none', lineStyle: { type: 'dashed' }, data: overview.value.capacity ? (overview.value.dates || []).map(() => overview.value.capacityTB) : [] }
  ]
}))

const byTypeOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}<br/>{c} TB（{d}%）' },
  legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  color: CHART_COLORS,
  series: [
    {
      type: 'pie',
      radius: ['48%', '70%'],
      center: ['50%', '44%'],
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12, formatter: '{b}\n{c} TB' } },
      data: (overview.value.byType || []).map((i: any) => ({ name: i.name, value: i.value }))
    }
  ]
}))

const poolUsageOption = computed(() => {
  const arr = (overview.value.topPools || []).slice().reverse()
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => `${p[0].name}<br/>使用率 ${p[0].value}%` },
    grid: { left: 12, right: 40, top: 12, bottom: 8, containLabel: true },
    xAxis: { type: 'value', max: 100, name: '%' },
    yAxis: { type: 'category', data: arr.map((a: any) => a.name), axisLabel: { fontSize: 11 } },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: (p: any) => (p.value >= 90 ? '#ff4d4f' : p.value >= 80 ? '#faad14' : '#1677ff')
        },
        label: { show: true, position: 'right', fontSize: 11, formatter: '{c}%' },
        data: arr.map((a: any) => ({ value: a.usageRate, name: a.name }))
      }
    ]
  }
})

const usageSummary = computed(() => (usage.list.value as any[]).reduce((a, b: any) => a + (b.usedTB || 0), 0))

function usageColor(rate: number) {
  if (rate >= 90) return '#ff4d4f'
  if (rate >= 80) return '#faad14'
  return '#52c41a'
}

onMounted(async () => {
  await Promise.all([loadOverview(), loadDisks()])
})
</script>

<template>
  <PageContainer title="云存储服务" subtitle="存储池、录像计划、生命周期与归档的一体化管理">
    <template #header>
      <el-button :icon="'Refresh'" @click="() => { loadOverview(); loadDisks(); poolTable.load() }">刷新</el-button>
      <el-button :icon="'FolderAdd'" @click="openPoolCreate">新建存储池</el-button>
      <el-button type="primary" :icon="'Files'" @click="archiveDialog = true">发起归档</el-button>
    </template>

    <el-row :gutter="12">
      <el-col :span="4"><StatCard label="总容量" :value="overview.capacityTB || 0" unit="TB" :decimals="1" icon="Coin" color="#1677ff" footer="全部存储池" /></el-col>
      <el-col :span="4"><StatCard label="已用容量" :value="overview.usedTB || 0" unit="TB" :decimals="1" icon="PieChart" color="#faad14" footer="含标准/低频/归档" /></el-col>
      <el-col :span="4"><StatCard label="剩余容量" :value="overview.freeTB || 0" unit="TB" :decimals="1" icon="Open" color="#52c41a" footer="可继续写入" /></el-col>
      <el-col :span="4"><StatCard label="整体使用率" :value="overview.usageRate || 0" unit="%" :decimals="1" icon="TrendCharts" color="#722ed1" footer="容量水位" /></el-col>
      <el-col :span="4"><StatCard label="录像通道数" :value="overview.channelCount || 0" icon="VideoCamera" color="#13c2c2" footer="产生录像的通道" /></el-col>
      <el-col :span="4"><StatCard label="录像文件数" :value="overview.recordCount || 0" icon="Document" color="#eb2f96" footer="历史累计" /></el-col>
    </el-row>

    <el-tabs v-model="activeTab" style="margin-top: 12px">
      <!-- 容量概览 -->
      <el-tab-pane label="容量概览" name="overview">
        <div class="st__row">
          <div class="vc-card st__wide">
            <div class="vc-panel-title">近 30 天容量增长</div>
            <BaseChart :option="capacityOption" :height="250" />
          </div>
          <div class="vc-card">
            <div class="vc-panel-title">存储类型占比</div>
            <BaseChart :option="byTypeOption" :height="250" />
          </div>
        </div>
        <div class="st__row" style="margin-top: 12px">
          <div class="vc-card">
            <div class="vc-panel-title">存储池水位 TOP6</div>
            <BaseChart :option="poolUsageOption" :height="240" />
          </div>
          <div class="vc-card st__wide">
            <div class="vc-panel-title">
              存储池概况
              <el-tag v-if="diskWarning" size="small" type="warning" effect="plain" style="margin-left: 8px">{{ diskWarning }} 块磁盘需关注</el-tag>
            </div>
            <el-table :data="(overview.topPools || []) as any[]" size="small" stripe>
              <el-table-column prop="name" label="存储池" min-width="160" show-overflow-tooltip />
              <el-table-column label="已用 / 总容量" min-width="160">
                <template #default="{ row }">{{ row.usedTB }} TB / {{ row.capacityTB }} TB</template>
              </el-table-column>
              <el-table-column label="使用率" min-width="200">
                <template #default="{ row }">
                  <div class="st__rate">
                    <el-progress :percentage="row.usageRate" :stroke-width="8" :show-text="false" :color="usageColor(row.usageRate)" />
                    <span :style="{ color: usageColor(row.usageRate) }">{{ formatPercent(row.usageRate) }}</span>
                  </div>
                </template>
              </el-table-column>
              <template #empty><EmptyState description="暂无存储池" /></template>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <!-- 存储池 -->
      <el-tab-pane label="存储池" name="pool">
        <div class="vc-card st__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="poolTable.baseParams.value.keyword" placeholder="存储池名称 / 区域" clearable style="width: 220px" @keyup.enter="poolTable.search" />
            </el-form-item>
            <el-form-item label="存储类型">
              <el-select v-model="poolTable.baseParams.value.type" placeholder="全部" clearable style="width: 140px">
                <el-option v-for="t in STORAGE_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="poolTable.baseParams.value.status" placeholder="全部" clearable style="width: 140px">
                <el-option label="正常" value="normal" />
                <el-option label="水位偏高" value="warning" />
                <el-option label="即将写满" value="full" />
                <el-option label="离线" value="offline" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="poolTable.search">查询</el-button>
              <el-button :icon="'RefreshLeft'" @click="poolTable.reset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card st__table">
          <el-table v-loading="poolTable.loading.value" :data="poolTable.list.value" stripe>
            <el-table-column label="存储池名称" min-width="200">
              <template #default="{ row }">
                <div style="font-size: 13px; font-weight: 500">{{ row.name }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.id }} · {{ row.nodeName }}</div>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="110">
              <template #default="{ row }"><StatusTag :status="row.type" kind="storageType" /></template>
            </el-table-column>
            <el-table-column prop="region" label="区域" width="120" />
            <el-table-column label="容量使用" min-width="230">
              <template #default="{ row }">
                <div class="st__rate">
                  <el-progress :percentage="row.usageRate" :stroke-width="9" :show-text="false" :color="usageColor(row.usageRate)" />
                  <span :style="{ color: usageColor(row.usageRate) }">{{ formatPercent(row.usageRate) }}</span>
                </div>
                <div class="vc-text-tertiary" style="font-size: 11px">{{ row.usedTB }} TB / {{ row.capacityTB }} TB（剩余 {{ (row.capacityTB - row.usedTB).toFixed(1) }} TB）</div>
              </template>
            </el-table-column>
            <el-table-column label="通道数" width="90" prop="channelCount" sortable="custom" />
            <el-table-column label="保存周期" width="100">
              <template #default="{ row }">{{ row.retentionDays }} 天</template>
            </el-table-column>
            <el-table-column label="生命周期策略" min-width="220">
              <template #default="{ row }">
                <div style="font-size: 12px">热数据 {{ row.lifecycleRule.daysToIA }} 天后转低频</div>
                <div class="vc-text-tertiary" style="font-size: 11px">
                  {{ row.lifecycleRule.daysToArchive }} 天转归档，{{ row.lifecycleRule.daysToDelete }} 天删除
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }"><StatusTag :status="row.status" kind="storageStatus" /></template>
            </el-table-column>
            <el-table-column label="操作" width="110" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openPoolEdit(row)">编辑</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="没有符合条件的存储池" /></template>
          </el-table>
          <div class="st__pager">
            <el-pagination
              :current-page="poolTable.page.value"
              :page-size="poolTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="poolTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="poolTable.onPageChange"
              @size-change="poolTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 使用量分析 -->
      <el-tab-pane label="使用量分析" name="usage">
        <div class="vc-card st__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="统计维度">
              <el-radio-group v-model="usageDimension" @change="() => { usage.baseParams.value.dimension = usageDimension; usage.search() }">
                <el-radio-button value="tenant">按租户</el-radio-button>
                <el-radio-button value="device">按设备</el-radio-button>
                <el-radio-button value="channel">按通道</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="关键字">
              <el-input v-model="usage.baseParams.value.keyword" placeholder="名称" clearable style="width: 200px" @keyup.enter="usage.search" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="usage.search">查询</el-button>
              <el-button :icon="'Download'" @click="usage.exportData([
                { key: 'key', label: '名称' },
                { key: 'channelCount', label: '通道数' },
                { key: 'usedTB', label: '占用容量(TB)' },
                { key: 'usedGB', label: '占用容量(GB)' },
                { key: 'recordDays', label: '保存天数' },
                { key: 'cost', label: '预估月成本(元)' }
              ], `存储使用量_${usageDimension}`)">导出</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card st__table">
          <div class="st__usageHead">
            当前筛选合计占用 <b>{{ usageSummary.toFixed(1) }}</b> TB，按 0.28 元/GB/月 估算月成本约
            <b>¥{{ (usageSummary * 1024 * 0.28).toFixed(2) }}</b>
          </div>
          <el-table v-loading="usage.loading.value" :data="usage.list.value" stripe>
            <el-table-column prop="key" :label="usageDimension === 'tenant' ? '租户 / 维度' : usageDimension === 'device' ? '设备名称' : '通道名称'" min-width="240" show-overflow-tooltip />
            <el-table-column label="通道数" width="100" prop="channelCount" sortable :sort-method="(a: any, b: any) => a.channelCount - b.channelCount" />
            <el-table-column label="占用容量" width="160" sortable :sort-method="(a: any, b: any) => a.usedTB - b.usedTB">
              <template #default="{ row }">
                <b>{{ row.usedTB }}</b> TB
                <div class="vc-text-tertiary" style="font-size: 11px">{{ formatNumber(row.usedGB) }} GB</div>
              </template>
            </el-table-column>
            <el-table-column label="容量占比" min-width="220">
              <template #default="{ row }">
                <div class="st__rate">
                  <el-progress :percentage="Math.min(100, Math.round((row.usedTB / Math.max(1, usage.list.value[0]?.usedTB || 1)) * 100))" :stroke-width="8" :show-text="false" />
                  <span>{{ ((row.usedTB / Math.max(1, usageSummary)) * 100).toFixed(1) }}%</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="保存天数" width="110">
              <template #default="{ row }">{{ row.recordDays }} 天</template>
            </el-table-column>
            <el-table-column label="预估月成本" width="140" sortable :sort-method="(a: any, b: any) => a.cost - b.cost">
              <template #default="{ row }">¥{{ formatNumber(row.cost, 2) }}</template>
            </el-table-column>
            <template #empty><EmptyState description="暂无使用量数据" /></template>
          </el-table>
          <div class="st__pager">
            <el-pagination
              :current-page="usage.page.value"
              :page-size="usage.pageSize.value"
              :page-sizes="paginationSizes"
              :total="usage.total.value"
              :layout="paginationLayout"
              background
              @current-change="usage.onPageChange"
              @size-change="usage.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 录像计划 -->
      <el-tab-pane label="录像计划" name="plan">
        <div class="vc-card st__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="planTable.baseParams.value.keyword" placeholder="计划名称" clearable style="width: 220px" @keyup.enter="planTable.search" />
            </el-form-item>
            <el-form-item label="模板类型">
              <el-select v-model="planTable.baseParams.value.template" placeholder="全部" clearable style="width: 170px">
                <el-option v-for="t in TEMPLATE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="planTable.search">查询</el-button>
              <el-button type="primary" :icon="'Plus'" plain @click="openPlanCreate">新建计划</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card st__table">
          <el-table v-loading="planTable.loading.value" :data="planTable.list.value" stripe>
            <el-table-column label="计划名称" min-width="200">
              <template #default="{ row }">
                <div style="font-size: 13px; font-weight: 500">{{ row.name }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.id }} · {{ row.creater }}</div>
              </template>
            </el-table-column>
            <el-table-column label="模板" width="130">
              <template #default="{ row }">{{ TEMPLATE_OPTIONS.find((t) => t.value === row.template)?.label || row.template }}</template>
            </el-table-column>
            <el-table-column label="录像时段" min-width="230">
              <template #default="{ row }">
                <div v-for="(s, i) in (row.timeSlots || []).slice(0, 3)" :key="i" style="font-size: 12px">
                  {{ WEEK_DAYS.find((w) => w.value === s.day)?.label || `周${s.day}` }} {{ s.start }} - {{ s.end }}
                </div>
                <div v-if="(row.timeSlots || []).length > 3" class="vc-text-tertiary" style="font-size: 11px">
                  等 {{ row.timeSlots.length }} 个时段
                </div>
              </template>
            </el-table-column>
            <el-table-column label="码流" width="90">
              <template #default="{ row }">{{ row.streamType === 'main' ? '主码流' : row.streamType === 'sub' ? '子码流' : '第三码流' }}</template>
            </el-table-column>
            <el-table-column label="绑定通道" width="100" prop="channelCount" />
            <el-table-column prop="storagePoolName" label="存储池" min-width="160" show-overflow-tooltip />
            <el-table-column label="保存周期" width="100">
              <template #default="{ row }">{{ row.retentionDays }} 天</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 1 ? 'success' : 'info'" effect="plain">{{ row.status === 1 ? '已启用' : '已停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="130" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openPlanEdit(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="removePlan(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="暂无录像计划" action-text="新建计划" @action="openPlanCreate" /></template>
          </el-table>
          <div class="st__pager">
            <el-pagination
              :current-page="planTable.page.value"
              :page-size="planTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="planTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="planTable.onPageChange"
              @size-change="planTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 归档任务 -->
      <el-tab-pane label="归档任务" name="archive">
        <div class="vc-card st__table">
          <div class="st__usageHead">
            归档任务用于将低频访问的历史录像迁移至低频/归档存储，可显著降低存储成本。
            <el-button link type="primary" @click="archiveDialog = true">立即发起归档</el-button>
          </div>
          <el-table v-loading="archiveTable.loading.value" :data="archiveTable.list.value" stripe>
            <el-table-column label="任务名称" min-width="240" show-overflow-tooltip>
              <template #default="{ row }">
                <div>{{ row.name }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.id }} · {{ row.creator }}</div>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" effect="plain" :type="row.type === 'archive' ? 'primary' : 'warning'">{{ row.type === 'archive' ? '归档' : '回迁' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="数据量" width="160">
              <template #default="{ row }">
                <div>{{ formatNumber(row.recordCount) }} 个文件</div>
                <div class="vc-text-tertiary" style="font-size: 11px">{{ formatStorage(row.fileSize, 'GB') }}</div>
              </template>
            </el-table-column>
            <el-table-column label="迁移路径" min-width="200">
              <template #default="{ row }">
                <span style="font-size: 12px">{{ row.fromStorage }} → {{ row.toStorage }}</span>
              </template>
            </el-table-column>
            <el-table-column label="进度" min-width="200">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :stroke-width="9" :status="row.status === 'failed' ? 'exception' : row.status === 'completed' ? 'success' : undefined" />
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }"><StatusTag :status="row.status" kind="task" /></template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="170" />
            <template #empty><EmptyState description="暂无归档任务" action-text="发起归档" @action="archiveDialog = true" /></template>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 磁盘健康 -->
      <el-tab-pane :label="`磁盘健康${diskWarning ? `（${diskWarning}）` : ''}`" name="disk">
        <div class="vc-card">
          <div class="st__usageHead">
            共 {{ disks.length }} 块物理磁盘，其中 <b :class="{ 'is-err': diskWarning }">{{ diskWarning }}</b> 块存在告警或降级，建议及时更换。
          </div>
          <el-table :data="disks.filter((d) => d.health !== 'normal').concat(disks.filter((d) => d.health === 'normal')).slice(0, 60)" size="small" stripe height="500">
            <el-table-column prop="id" label="磁盘编号" width="100" />
            <el-table-column prop="nodeName" label="所属节点" min-width="160" show-overflow-tooltip />
            <el-table-column prop="slot" label="槽位" width="80" />
            <el-table-column prop="model" label="型号" width="180">
              <template #default="{ row }"><span class="vc-mono" style="font-size: 12px">{{ row.model }}</span></template>
            </el-table-column>
            <el-table-column label="容量" width="110">
              <template #default="{ row }">{{ row.capacityTB }} TB</template>
            </el-table-column>
            <el-table-column label="使用率" width="150">
              <template #default="{ row }">
                <el-progress :percentage="Math.round((row.usedTB / row.capacityTB) * 100)" :stroke-width="7" :show-text="false" />
              </template>
            </el-table-column>
            <el-table-column label="健康" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.health === 'normal' ? 'success' : row.health === 'warning' ? 'warning' : 'danger'" effect="plain">
                  {{ row.health === 'normal' ? '正常' : row.health === 'warning' ? '预警' : '故障' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="温度" width="90">
              <template #default="{ row }">
                <span :style="{ color: row.temperature >= 40 ? '#ff4d4f' : undefined }">{{ row.temperature }}℃</span>
              </template>
            </el-table-column>
            <el-table-column prop="powerOnHours" label="通电时长(h)" width="120" />
            <el-table-column label="RAID 状态" width="120">
              <template #default="{ row }">
                <span :class="{ 'is-err': row.raidStatus !== '正常' }">{{ row.raidStatus }}</span>
                <div v-if="row.rebuildProgress" class="vc-text-tertiary" style="font-size: 11px">重构 {{ row.rebuildProgress }}%</div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 存储池表单 -->
    <el-dialog v-model="poolDialog" :title="poolEditing ? '编辑存储池' : '新建存储池'" width="640px">
      <el-form ref="poolFormRef" :model="poolForm" :rules="poolRules" label-width="110px">
        <el-form-item label="存储池名称" prop="name">
          <el-input v-model="poolForm.name" placeholder="如：华东-标准存储池-A" />
        </el-form-item>
        <el-form-item label="存储类型" prop="type">
          <el-select v-model="poolForm.type" style="width: 100%">
            <el-option v-for="t in STORAGE_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属区域" prop="region">
          <el-input v-model="poolForm.region" placeholder="如：华东-杭州" />
        </el-form-item>
        <el-form-item label="总容量(TB)" prop="capacityTB">
          <el-input-number v-model="poolForm.capacityTB" :min="1" :max="100000" :step="100" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="保存周期(天)">
          <el-input-number v-model="poolForm.retentionDays" :min="1" :max="3650" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="转低频(天)">
          <el-input-number v-model="poolForm.lifecycleRule.daysToIA" :min="1" :max="3650" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="转归档(天)">
          <el-input-number v-model="poolForm.lifecycleRule.daysToArchive" :min="1" :max="3650" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="删除(天)">
          <el-input-number v-model="poolForm.lifecycleRule.daysToDelete" :min="1" :max="3650" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="poolDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPool">{{ poolEditing ? '保存修改' : '确认创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 录像计划表单 -->
    <el-dialog v-model="planDialog" :title="planEditing ? '编辑录像计划' : '新建录像计划'" width="720px" top="8vh">
      <el-form :model="planForm" label-width="110px">
        <el-form-item label="计划名称">
          <el-input v-model="planForm.name" placeholder="如：园区重点区域全天录像" />
        </el-form-item>
        <el-form-item label="录像模板">
          <el-select v-model="planForm.template" style="width: 100%" @change="applyTemplate">
            <el-option v-for="t in TEMPLATE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="录像时段">
          <div class="st__slots">
            <div v-for="(s, i) in planForm.timeSlots" :key="i" class="st__slot">
              <el-select v-model="s.day" style="width: 110px">
                <el-option v-for="w in WEEK_DAYS" :key="w.value" :label="w.label" :value="w.value" />
                <el-option label="每天" :value="1" />
              </el-select>
              <el-time-picker v-model="s.start" value-format="HH:mm" format="HH:mm" placeholder="开始" style="width: 120px" />
              <span>-</span>
              <el-time-picker v-model="s.end" value-format="HH:mm" format="HH:mm" placeholder="结束" style="width: 120px" />
              <el-button link type="danger" size="small" @click="planForm.timeSlots.splice(i, 1)">删除</el-button>
            </div>
            <el-button size="small" :icon="'Plus'" @click="planForm.timeSlots.push({ day: 1, start: '00:00', end: '23:59' })">添加时段</el-button>
          </div>
        </el-form-item>
        <el-form-item label="录像码流">
          <el-radio-group v-model="planForm.streamType">
            <el-radio value="main">主码流</el-radio>
            <el-radio value="sub">子码流</el-radio>
            <el-radio value="third">第三码流</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="绑定通道">
          <el-select v-model="planForm.channelIds" multiple filterable allow-create default-first-option placeholder="输入通道 ID，支持批量粘贴" style="width: 100%" />
        </el-form-item>
        <el-form-item label="存储池">
          <el-select v-model="planForm.storagePoolId" clearable placeholder="选择存储池" style="width: 100%">
            <el-option v-for="p in pools" :key="p.id" :label="`${p.name}（剩余 ${(p.capacityTB - p.usedTB).toFixed(1)} TB）`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="保存周期(天)">
          <el-input-number v-model="planForm.retentionDays" :min="1" :max="3650" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="planForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPlan">{{ planEditing ? '保存修改' : '确认创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 归档 -->
    <el-dialog v-model="archiveDialog" title="发起数据归档" width="580px">
      <el-form :model="archiveForm" label-width="130px">
        <el-form-item label="源存储池">
          <el-select v-model="archiveForm.fromPoolId" placeholder="选择源存储池" style="width: 100%">
            <el-option v-for="p in pools" :key="p.id" :label="`${p.name}（${p.usedTB} TB 已用）`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标存储池">
          <el-select v-model="archiveForm.toPoolId" placeholder="选择目标存储池" style="width: 100%">
            <el-option v-for="p in pools" :key="p.id" :label="`${p.name}（${p.type === 'archive' ? '归档' : p.type === 'ia' ? '低频' : '标准'}）`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="归档数据范围">
          <el-input-number v-model="archiveForm.beforeDays" :min="1" :max="3650" :step="30" controls-position="right" style="width: 160px" />
          <span style="margin-left: 8px; font-size: 12px; color: var(--el-text-color-secondary)">天之前的历史录像</span>
        </el-form-item>
      </el-form>
      <el-alert type="info" :closable="false" show-icon title="归档说明" description="归档过程在后台执行，不影响实时录像写入。归档后回放延迟会增加，如需回迁可在归档任务中发起。" />
      <template #footer>
        <el-button @click="archiveDialog = false">取消</el-button>
        <el-button type="primary" @click="submitArchive">确认发起</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<style scoped>
.st__row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

.st__row > .vc-card {
  padding: 14px;
  min-width: 0;
}

.st__wide {
  min-width: 0;
}

.st__filter {
  padding: 14px 16px 4px;
  margin-bottom: 12px;
}

.st__filter :deep(.el-form-item) {
  margin-bottom: 10px;
}

.st__table {
  padding: 0;
  overflow: hidden;
}

.st__pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.st__rate {
  display: flex;
  align-items: center;
  gap: 8px;
}

.st__rate :deep(.el-progress) {
  flex: 1;
}

.st__usageHead {
  padding: 12px 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.st__usageHead b {
  color: var(--el-text-color-primary);
}

.st__slots {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.st__slot {
  display: flex;
  align-items: center;
  gap: 8px;
}

.is-err {
  color: var(--vc-danger);
}
</style>
