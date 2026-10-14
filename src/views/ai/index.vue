<script setup lang="ts">
/**
 * AI 智能分析：算法市场 / 算法任务编排 / AI 识别事件
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { aiApi, channelApi, deviceApi } from '@/api'
import { useTable, paginationLayout, paginationSizes } from '@/composables/useTable'
import PageContainer from '@/components/PageContainer.vue'
import StatCard from '@/components/StatCard.vue'
import BaseChart from '@/components/BaseChart.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { formatDateTime, formatDuration, formatNumber, formatPercent, relativeTimeText } from '@/utils/format'
import { ALARM_LEVEL_OPTIONS, alarmLevelMeta } from '@/utils/dict'

const activeTab = ref('market')

/* ---------- 算法市场 ---------- */
const algorithms = ref<any[]>([])
const algLoading = ref(false)
const algFilter = reactive({ keyword: '', type: '', vendor: '', sortBy: '' })
const vendors = ref<string[]>([])
const types = ref<string[]>([])

const algDetailVisible = ref(false)
const algDetail = ref<any>(null)

async function loadAlgorithms() {
  algLoading.value = true
  try {
    const res = await aiApi.algorithms({ ...algFilter })
    algorithms.value = (res as any).list || []
    vendors.value = (res as any).vendors || []
    types.value = (res as any).types || []
  } finally {
    algLoading.value = false
  }
}

async function openAlgDetail(row: any) {
  algDetail.value = await aiApi.algorithmDetail(row.id)
  algDetailVisible.value = true
}

async function toggleAlg(row: any) {
  try {
    await aiApi.toggleAlgorithm(row.id, row.status === 1 ? 0 : 1)
    ElMessage.success(row.status === 1 ? `算法「${row.name}」已下架` : `算法「${row.name}」已上架`)
    loadAlgorithms()
  } catch {
    /* 已提示 */
  }
}

/* ---------- AI 任务 ---------- */
const taskTable = useTable({
  api: aiApi.tasks as any,
  syncQuery: true,
  defaultParams: { keyword: '', status: '', algorithmName: '', alarmLevel: '' }
})

const taskStats = computed(() => (taskTable as any).list.value && (taskTable as any).stats || {})

const taskDialog = ref(false)
const taskEditing = ref<any>(null)
const taskForm = reactive<any>({
  name: '',
  algorithmId: '',
  channelIds: [] as string[],
  threshold: 0.75,
  alarmLevel: 'major',
  schedule: { startTime: '00:00', endTime: '23:59', days: [1, 2, 3, 4, 5, 6, 7] }
})
const taskDevices = ref<any[]>([])
const taskChannels = ref<any[]>([])
const selectedDeviceIds = ref<string[]>([])

const WEEK_DAYS = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 }
]

async function loadTaskMeta() {
  const [d, a] = await Promise.all([
    deviceApi.list({ page: 1, pageSize: 100 }).catch(() => ({ list: [] })),
    aiApi.algorithms({})
  ])
  taskDevices.value = (d as any).list || []
  if (!algorithms.value.length) algorithms.value = (a as any).list || []
}

function openTaskCreate() {
  taskEditing.value = null
  Object.assign(taskForm, {
    name: '',
    algorithmId: algorithms.value.find((a) => a.status === 1)?.id || '',
    channelIds: [],
    threshold: 0.75,
    alarmLevel: 'major',
    schedule: { startTime: '00:00', endTime: '23:59', days: [1, 2, 3, 4, 5, 6, 7] }
  })
  selectedDeviceIds.value = []
  taskChannels.value = []
  taskDialog.value = true
}

function openTaskEdit(row: any) {
  taskEditing.value = row
  Object.assign(taskForm, {
    name: row.name,
    algorithmId: row.algorithmId,
    channelIds: [...(row.channelIds || [])],
    threshold: row.threshold,
    alarmLevel: row.alarmLevel,
    schedule: JSON.parse(JSON.stringify(row.schedule || { startTime: '00:00', endTime: '23:59', days: [1, 2, 3, 4, 5, 6, 7] }))
  })
  selectedDeviceIds.value = []
  taskChannels.value = []
  taskDialog.value = true
}

async function onDeviceSelect() {
  const all: any[] = []
  for (const id of selectedDeviceIds.value) {
    const list = await channelApi.list({ deviceId: id, page: 1, pageSize: 64 }).catch(() => ({ list: [] }))
    all.push(...((list as any).list || []))
  }
  taskChannels.value = all
}

async function submitTask() {
  if (!taskForm.name) return ElMessage.warning('请输入任务名称')
  if (!taskForm.algorithmId) return ElMessage.warning('请选择算法')
  if (!taskForm.channelIds.length) return ElMessage.warning('请至少选择一个通道')
  const payload = { ...taskForm }
  try {
    if (taskEditing.value) {
      await aiApi.updateTask(taskEditing.value.id, payload)
      ElMessage.success('任务已更新')
    } else {
      await aiApi.createTask(payload)
      ElMessage.success('任务已创建，默认为停止状态，请手动启动')
    }
    taskDialog.value = false
    taskTable.load()
  } catch {
    /* 已提示 */
  }
}

async function toggleTask(row: any) {
  try {
    await aiApi.toggleTask(row.id, row.status === 'running' ? 'stopped' : 'running')
    ElMessage.success(row.status === 'running' ? `任务「${row.name}」已停止` : `任务「${row.name}」已启动，GPU 资源已分配`)
    taskTable.load()
  } catch {
    /* 已提示 */
  }
}

async function removeTask(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除任务「${row.name}」？删除后其历史识别事件仍会保留。`, '删除算法任务', { type: 'warning' })
    await aiApi.removeTask(row.id)
    ElMessage.success('任务已删除')
    taskTable.load()
  } catch {
    /* 已提示 */
  }
}

/* ---------- 识别事件 ---------- */
const eventTable = useTable({
  api: aiApi.events as any,
  defaultParams: { keyword: '', algorithmName: '', type: '', minConfidence: '' }
})
const eventStats = ref<any>({})

async function loadEventStats() {
  eventStats.value = await aiApi.eventStats(7)
}

const eventTrendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 12, right: 20, top: 24, bottom: 8, containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: eventStats.value.dates || [] },
  yAxis: { type: 'value', name: '次' },
  series: [{ type: 'line', smooth: true, symbolSize: 5, areaStyle: { opacity: 0.18 }, data: eventStats.value.counts || [] }]
}))

const eventAlgOption = computed(() => {
  const arr = (eventStats.value.algorithms || []).slice(0, 8).reverse()
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => `${p[0].name}<br/>识别 ${p[0].value} 次` },
    grid: { left: 12, right: 34, top: 12, bottom: 8, containLabel: true },
    xAxis: { type: 'value', name: '次' },
    yAxis: { type: 'category', data: arr.map((a: any) => a.name), axisLabel: { fontSize: 11 } },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        itemStyle: { borderRadius: [0, 4, 4, 0], color: '#722ed1' },
        label: { show: true, position: 'right', fontSize: 11 },
        data: arr.map((a: any) => a.count)
      }
    ]
  }
})

const eventHourOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 12, right: 20, top: 24, bottom: 8, containLabel: true },
  xAxis: { type: 'category', data: (eventStats.value.byHour || []).map((h: any) => h.hour), axisLabel: { fontSize: 10, interval: 2 } },
  yAxis: { type: 'value', name: '次' },
  series: [{ type: 'bar', barWidth: '58%', itemStyle: { borderRadius: [4, 4, 0, 0] }, data: (eventStats.value.byHour || []).map((h: any) => h.value) }]
}))

const eventTotal = computed(() => eventTable.total.value)

onMounted(async () => {
  await loadAlgorithms()
  await Promise.all([loadTaskMeta(), loadEventStats()])
})
</script>

<template>
  <PageContainer title="AI 智能分析" subtitle="算法市场、任务编排与识别事件闭环分析">
    <template #header>
      <el-button :icon="'Refresh'" @click="() => { loadAlgorithms(); loadEventStats(); taskTable.load() }">刷新</el-button>
      <el-button type="primary" :icon="'Plus'" @click="openTaskCreate">新建分析任务</el-button>
    </template>

    <el-row :gutter="12">
      <el-col :span="4"><StatCard label="算法数量" :value="algorithms.length" icon="Cpu" color="#1677ff" footer="上架 + 已下架" /></el-col>
      <el-col :span="4"><StatCard label="已上架算法" :value="algorithms.filter((a) => a.status === 1).length" icon="MagicStick" color="#52c41a" footer="可用于新建任务" /></el-col>
      <el-col :span="4"><StatCard label="任务总数" :value="(taskTable as any).stats?.total || 0" icon="List" color="#722ed1" footer="全部算法任务" /></el-col>
      <el-col :span="4"><StatCard label="运行中任务" :value="(taskTable as any).stats?.running || 0" icon="VideoPlay" color="#13c2c2" footer="正在消耗 GPU" /></el-col>
      <el-col :span="4"><StatCard label="分析通道数" :value="(taskTable as any).stats?.channelCount || 0" icon="VideoCamera" color="#eb2f96" footer="被任务覆盖" /></el-col>
      <el-col :span="4"><StatCard label="近 7 天识别事件" :value="eventStats.total || 0" icon="Bell" color="#faad14" :footer="`误报率 ${eventStats.falseRate || 0}%`" /></el-col>
    </el-row>

    <el-tabs v-model="activeTab" style="margin-top: 12px">
      <!-- 算法市场 -->
      <el-tab-pane label="算法市场" name="market">
        <div class="vc-card ai__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="algFilter.keyword" placeholder="算法名称 / 编码 / 厂商" clearable style="width: 220px" @keyup.enter="loadAlgorithms" />
            </el-form-item>
            <el-form-item label="算法类型">
              <el-select v-model="algFilter.type" placeholder="全部类型" clearable style="width: 160px" @change="loadAlgorithms">
                <el-option v-for="t in types" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
            <el-form-item label="厂商">
              <el-select v-model="algFilter.vendor" placeholder="全部厂商" clearable style="width: 170px" @change="loadAlgorithms">
                <el-option v-for="v in vendors" :key="v" :label="v" :value="v" />
              </el-select>
            </el-form-item>
            <el-form-item label="排序">
              <el-select v-model="algFilter.sortBy" placeholder="默认排序" clearable style="width: 140px" @change="loadAlgorithms">
                <el-option label="准确率优先" value="accuracy" />
                <el-option label="价格优先" value="price" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <div v-loading="algLoading" class="ai__cards">
          <div v-for="a in algorithms" :key="a.id" class="vc-card ai__card">
            <div class="ai__cardHead">
              <div>
                <span class="ai__cardName">{{ a.name }}</span>
                <el-tag v-if="a.hot" size="small" type="danger" effect="plain" style="margin-left: 6px">热门</el-tag>
              </div>
              <el-tag size="small" :type="a.status === 1 ? 'success' : 'info'" effect="plain">{{ a.status === 1 ? '已上架' : '已下架' }}</el-tag>
            </div>
            <div class="ai__cardMeta vc-mono">{{ a.code }} · v{{ a.version }} · {{ a.vendor }}</div>
            <div class="ai__cardDesc">{{ a.description }}</div>
            <div class="ai__cardTags">
              <el-tag v-for="s in a.scenes" :key="s" size="small" effect="plain">{{ s }}</el-tag>
            </div>
            <div class="ai__cardStat">
              <div><span>准确率</span><b style="color: #52c41a">{{ formatPercent(a.accuracy * 100) }}</b></div>
              <div><span>单帧耗时</span><b>{{ a.detectCost }} ms</b></div>
              <div><span>最大分辨率</span><b>{{ a.maxResolution }}</b></div>
              <div><span>价格</span><b style="color: #fa8c16">¥{{ a.price }}/路/月</b></div>
            </div>
            <div class="ai__cardActions">
              <el-button size="small" @click="openAlgDetail(a)">详情</el-button>
              <el-button size="small" :type="a.status === 1 ? 'danger' : 'primary'" plain @click="toggleAlg(a)">
                {{ a.status === 1 ? '下架' : '上架' }}
              </el-button>
            </div>
          </div>
          <EmptyState v-if="!algorithms.length && !algLoading" description="没有匹配的算法" />
        </div>
      </el-tab-pane>

      <!-- 算法任务 -->
      <el-tab-pane label="算法任务" name="task">
        <div class="vc-card ai__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="taskTable.baseParams.value.keyword" placeholder="任务名称 / 算法名称" clearable style="width: 220px" @keyup.enter="taskTable.search" />
            </el-form-item>
            <el-form-item label="任务状态">
              <el-select v-model="taskTable.baseParams.value.status" placeholder="全部" clearable style="width: 130px">
                <el-option label="运行中" value="running" />
                <el-option label="已停止" value="stopped" />
                <el-option label="异常" value="abnormal" />
              </el-select>
            </el-form-item>
            <el-form-item label="告警等级">
              <el-select v-model="taskTable.baseParams.value.alarmLevel" placeholder="全部" clearable style="width: 130px">
                <el-option v-for="l in ALARM_LEVEL_OPTIONS" :key="l.value" :label="l.label" :value="l.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="taskTable.search">查询</el-button>
              <el-button :icon="'RefreshLeft'" @click="taskTable.reset">重置</el-button>
              <el-button type="primary" plain :icon="'Plus'" @click="openTaskCreate">新建任务</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="vc-card ai__table">
          <el-table v-loading="taskTable.loading.value" :data="taskTable.list.value" stripe>
            <el-table-column label="任务名称" min-width="220">
              <template #default="{ row }">
                <div style="font-size: 13px; font-weight: 500">{{ row.name }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.id }} · {{ formatDateTime(row.createTime) }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="algorithmName" label="算法" width="150" />
            <el-table-column label="覆盖通道" width="110">
              <template #default="{ row }">{{ row.channelCount }} 路</template>
            </el-table-column>
            <el-table-column label="运行计划" min-width="180">
              <template #default="{ row }">
                <div style="font-size: 12px">{{ row.schedule?.startTime }} - {{ row.schedule?.endTime }}</div>
                <div class="vc-text-tertiary" style="font-size: 11px">
                  {{ (row.schedule?.days || []).length === 7 ? '每天' : (row.schedule?.days || []).map((d: number) => WEEK_DAYS.find((w) => w.value === d)?.label).join('、') }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="置信度阈值" width="120">
              <template #default="{ row }">{{ row.threshold }}</template>
            </el-table-column>
            <el-table-column label="告警等级" width="100">
              <template #default="{ row }"><StatusTag :status="row.alarmLevel" kind="alarmLevel" /></template>
            </el-table-column>
            <el-table-column label="GPU 占用" width="130" sortable :sort-method="(a: any, b: any) => a.gpuUsage - b.gpuUsage">
              <template #default="{ row }">
                <el-progress :percentage="Math.min(100, row.gpuUsage)" :stroke-width="8" :show-text="false" :color="row.gpuUsage > 80 ? '#ff4d4f' : '#1677ff'" />
                <span class="vc-text-tertiary" style="font-size: 11px">{{ row.gpuUsage }}%</span>
              </template>
            </el-table-column>
            <el-table-column label="今日事件" width="100" prop="eventsToday" sortable :sort-method="(a: any, b: any) => a.eventsToday - b.eventsToday" />
            <el-table-column label="实际准确率" width="120">
              <template #default="{ row }">{{ formatPercent(row.accuracy * 100) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }"><StatusTag :status="row.status" kind="task" /></template>
            </el-table-column>
            <el-table-column label="操作" width="190" fixed="right">
              <template #default="{ row }">
                <el-button link :type="row.status === 'running' ? 'danger' : 'success'" size="small" @click="toggleTask(row)">
                  {{ row.status === 'running' ? '停止' : '启动' }}
                </el-button>
                <el-button link type="primary" size="small" @click="openTaskEdit(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="removeTask(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="暂无算法任务" action-text="新建任务" @action="openTaskCreate" /></template>
          </el-table>
          <div class="ai__pager">
            <el-pagination
              :current-page="taskTable.page.value"
              :page-size="taskTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="taskTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="taskTable.onPageChange"
              @size-change="taskTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 识别事件 -->
      <el-tab-pane label="识别事件" name="event">
        <div class="ai__eventRow">
          <div class="vc-card">
            <div class="vc-panel-title">近 7 天识别趋势</div>
            <BaseChart :option="eventTrendOption" :height="200" />
          </div>
          <div class="vc-card">
            <div class="vc-panel-title">算法识别量 TOP8</div>
            <BaseChart :option="eventAlgOption" :height="200" />
          </div>
          <div class="vc-card">
            <div class="vc-panel-title">识别时段分布（24h）</div>
            <BaseChart :option="eventHourOption" :height="200" />
          </div>
        </div>

        <div class="vc-card ai__filter" style="margin-top: 12px">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="eventTable.baseParams.value.keyword" placeholder="设备 / 类型 / 租户" clearable style="width: 220px" @keyup.enter="eventTable.search" />
            </el-form-item>
            <el-form-item label="算法">
              <el-select v-model="eventTable.baseParams.value.algorithmName" placeholder="全部算法" clearable filterable style="width: 190px">
                <el-option v-for="a in algorithms" :key="a.id" :label="a.name" :value="a.name" />
              </el-select>
            </el-form-item>
            <el-form-item label="最低置信度">
              <el-select v-model="eventTable.baseParams.value.minConfidence" placeholder="不限" clearable style="width: 130px">
                <el-option label="≥ 0.8" value="0.8" />
                <el-option label="≥ 0.9" value="0.9" />
                <el-option label="≥ 0.95" value="0.95" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="eventTable.search">查询</el-button>
              <el-button :icon="'RefreshLeft'" @click="eventTable.reset">重置</el-button>
              <span class="vc-text-tertiary" style="font-size: 12px">共 {{ formatNumber(eventTotal) }} 条识别事件</span>
            </el-form-item>
          </el-form>
        </div>

        <div class="vc-card ai__table">
          <el-table v-loading="eventTable.loading.value" :data="eventTable.list.value" stripe>
            <el-table-column label="事件抓图" width="130">
              <template #default="{ row }">
                <img v-if="row.snapshotUrl" :src="row.snapshotUrl" class="ai__thumb" alt="事件抓图" />
                <div v-else class="ai__thumb ai__thumb--empty">无图</div>
              </template>
            </el-table-column>
            <el-table-column label="事件信息" min-width="240">
              <template #default="{ row }">
                <div class="ai__title">
                  <StatusTag :status="row.level" kind="alarmLevel" />
                  <span>{{ row.title }}</span>
                </div>
                <div class="vc-text-tertiary" style="font-size: 11px">{{ row.type }} · {{ row.algorithmName }}</div>
              </template>
            </el-table-column>
            <el-table-column label="设备 / 区域" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <div>{{ row.deviceName }}</div>
                <div class="vc-text-tertiary" style="font-size: 11px">{{ row.region }}</div>
              </template>
            </el-table-column>
            <el-table-column label="置信度" width="110" sortable :sort-method="(a: any, b: any) => a.confidence - b.confidence">
              <template #default="{ row }">
                <span :style="{ color: row.confidence >= 0.9 ? '#52c41a' : row.confidence >= 0.75 ? '#faad14' : '#ff4d4f' }">
                  {{ row.confidence.toFixed(3) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="发生时间" width="170" sortable :sort-method="(a: any, b: any) => (a.occurTime < b.occurTime ? -1 : 1)">
              <template #default="{ row }">
                <div>{{ relativeTimeText(row.occurTime) }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.occurTime.slice(5, 16) }}</div>
              </template>
            </el-table-column>
            <el-table-column label="处理状态" width="100">
              <template #default="{ row }"><StatusTag :status="row.status" kind="alarmStatus" /></template>
            </el-table-column>
            <el-table-column label="确认" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 'false_alarm' ? 'info' : row.status === 'pending' ? 'warning' : 'success'" effect="plain">
                  {{ row.status === 'false_alarm' ? '误报' : row.status === 'pending' ? '待确认' : '有效' }}
                </el-tag>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="暂无识别事件" /></template>
          </el-table>
          <div class="ai__pager">
            <el-pagination
              :current-page="eventTable.page.value"
              :page-size="eventTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="eventTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="eventTable.onPageChange"
              @size-change="eventTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 算法详情 -->
    <el-drawer v-model="algDetailVisible" title="算法详情" size="560px">
      <div v-if="algDetail" class="ai__algDetail">
        <h3 style="margin: 0 0 6px">{{ algDetail.name }}</h3>
        <div class="vc-mono vc-text-tertiary" style="font-size: 12px">{{ algDetail.code }} · v{{ algDetail.version }} · {{ algDetail.vendor }}</div>
        <p style="font-size: 13px; color: var(--el-text-color-regular)">{{ algDetail.description }}</p>

        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="算法类型">{{ algDetail.type }}</el-descriptions-item>
          <el-descriptions-item label="准确率">{{ formatPercent(algDetail.accuracy * 100) }}</el-descriptions-item>
          <el-descriptions-item label="单帧耗时">{{ algDetail.detectCost }} ms</el-descriptions-item>
          <el-descriptions-item label="最大分辨率">{{ algDetail.maxResolution }}</el-descriptions-item>
          <el-descriptions-item label="GPU 消耗">{{ algDetail.gpuCost }} 核</el-descriptions-item>
          <el-descriptions-item label="单价">¥{{ algDetail.price }}/路/月</el-descriptions-item>
          <el-descriptions-item label="关联任务">{{ algDetail.taskCount }} 个</el-descriptions-item>
          <el-descriptions-item label="运行中任务">{{ algDetail.runningTaskCount }} 个</el-descriptions-item>
          <el-descriptions-item label="历史事件">{{ formatNumber(algDetail.eventTotal) }} 次</el-descriptions-item>
          <el-descriptions-item label="平均置信度">{{ algDetail.avgConfidence }}</el-descriptions-item>
          <el-descriptions-item label="适用场景" :span="2">
            <el-tag v-for="s in algDetail.scenes" :key="s" size="small" effect="plain" style="margin-right: 4px">{{ s }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2">{{ formatDateTime(algDetail.updateTime) }}</el-descriptions-item>
        </el-descriptions>

        <div class="vc-panel-title" style="margin-top: 16px">近 14 天准确率趋势</div>
        <BaseChart
          :option="{
            tooltip: { trigger: 'axis' },
            grid: { left: 12, right: 24, top: 20, bottom: 8, containLabel: true },
            xAxis: { type: 'category', data: (algDetail.accuracyTrend || []).map((d: any) => d.date) },
            yAxis: { type: 'value', min: (v: any) => Math.floor(v.min * 10) / 10, name: '%' },
            series: [{ type: 'line', smooth: true, symbolSize: 5, areaStyle: { opacity: 0.16 }, data: (algDetail.accuracyTrend || []).map((d: any) => d.value) }]
          }"
          :height="200"
        />
      </div>
    </el-drawer>

    <!-- 任务表单 -->
    <el-dialog v-model="taskDialog" :title="taskEditing ? '编辑算法任务' : '新建算法任务'" width="760px" top="7vh">
      <el-form :model="taskForm" label-width="110px">
        <el-form-item label="任务名称">
          <el-input v-model="taskForm.name" placeholder="如：园区周界入侵检测" maxlength="40" show-word-limit />
        </el-form-item>
        <el-form-item label="选择算法">
          <el-select v-model="taskForm.algorithmId" filterable placeholder="选择已上架算法" style="width: 100%">
            <el-option v-for="a in algorithms.filter((x) => x.status === 1)" :key="a.id" :label="`${a.name}（准确率 ${formatPercent(a.accuracy * 100)}）`" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择设备">
          <el-select v-model="selectedDeviceIds" multiple filterable collapse-tags collapse-tags-tooltip placeholder="先选择设备，再选择具体通道" style="width: 100%" @change="onDeviceSelect">
            <el-option v-for="d in taskDevices" :key="d.id" :label="`${d.name}（${d.channelCount} 通道）`" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分析通道">
          <el-select v-model="taskForm.channelIds" multiple filterable collapse-tags collapse-tags-tooltip placeholder="选择要分析的通道" style="width: 100%">
            <el-option v-for="c in taskChannels" :key="c.id" :label="`${c.deviceName} - ${c.name}`" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="置信度阈值">
              <el-slider v-model="taskForm.threshold" :min="0.1" :max="1" :step="0.05" show-input />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="告警等级">
              <el-select v-model="taskForm.alarmLevel" style="width: 100%">
                <el-option v-for="l in ALARM_LEVEL_OPTIONS" :key="l.value" :label="l.label" :value="l.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="运行时段">
          <div style="display: flex; align-items: center; gap: 8px">
            <el-time-picker v-model="taskForm.schedule.startTime" value-format="HH:mm" format="HH:mm" placeholder="开始" style="width: 130px" />
            <span>-</span>
            <el-time-picker v-model="taskForm.schedule.endTime" value-format="HH:mm" format="HH:mm" placeholder="结束" style="width: 130px" />
          </div>
        </el-form-item>
        <el-form-item label="生效星期">
          <el-checkbox-group v-model="taskForm.schedule.days">
            <el-checkbox v-for="w in WEEK_DAYS" :key="w.value" :value="w.value">{{ w.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="资源说明"
        description="每个分析任务按通道数占用 GPU 资源，创建后默认为停止状态。启动前请确认边缘节点 GPU 余量充足，避免影响其他任务。"
      />
      <template #footer>
        <el-button @click="taskDialog = false">取消</el-button>
        <el-button type="primary" @click="submitTask">{{ taskEditing ? '保存修改' : '确认创建' }}</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<style scoped>
.ai__filter {
  padding: 14px 16px 4px;
  margin-bottom: 12px;
}

.ai__filter :deep(.el-form-item) {
  margin-bottom: 10px;
}

.ai__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

.ai__card {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: box-shadow 0.2s;
}

.ai__card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
}

.ai__cardHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ai__cardName {
  font-size: 14px;
  font-weight: 500;
}

.ai__cardMeta {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.ai__cardDesc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  min-height: 38px;
}

.ai__cardTags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ai__cardStat {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
  padding: 10px 0;
  border-top: 1px dashed var(--el-border-color-lighter);
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.ai__cardStat > div {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.ai__cardStat span {
  color: var(--el-text-color-secondary);
}

.ai__cardActions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.ai__table {
  padding: 0;
  overflow: hidden;
}

.ai__pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.ai__eventRow {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.ai__eventRow > .vc-card {
  padding: 14px;
  min-width: 0;
}

.ai__thumb {
  width: 112px;
  height: 63px;
  border-radius: 4px;
  object-fit: cover;
  display: block;
  border: 1px solid var(--el-border-color-lighter);
}

.ai__thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.ai__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}

.ai__algDetail p {
  margin: 10px 0;
  line-height: 1.7;
}
</style>
