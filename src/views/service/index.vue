<script setup lang="ts">
/**
 * 技术服务与工单：工单全生命周期（受理 / 派单 / 处理 / 验收 / 回访）+ SLA + 备件 + 知识库 + 巡检
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deviceApi, knowledgeApi, partApi, patrolApi, tenantApi, workOrderApi } from '@/api'
import { useTable, paginationLayout, paginationSizes } from '@/composables/useTable'
import PageContainer from '@/components/PageContainer.vue'
import StatCard from '@/components/StatCard.vue'
import BaseChart from '@/components/BaseChart.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ALARM_LEVEL_OPTIONS, WORKORDER_STATUS_OPTIONS, WORKORDER_TYPE_OPTIONS, priorityOptions } from '@/utils/dict'
import { formatDateTime, formatDuration, formatNumber, relativeTimeText } from '@/utils/format'

const activeTab = ref('orders')

/* ---------- 工单列表 ---------- */
const orderTable = useTable({
  api: workOrderApi.list as any,
  syncQuery: true,
  defaultParams: { keyword: '', status: [], type: '', priority: [], slaStatus: '', assignee: '', customerId: '' }
})

const tenants = ref<any[]>([])
const engineers = ref<any[]>([])
const serviceStats = ref<any>({})

const boardStats = computed(() => (orderTable as any).boardStats || {})

const selectedIds = computed(() => orderTable.selection.value.map((o: any) => o.id))

/* ---------- 新建工单 ---------- */
const createVisible = ref(false)
const createForm = reactive<any>({ title: '', customerId: '', deviceId: '', type: '故障报修', priority: 'major', description: '', creator: '当前用户' })
const customerDevices = ref<any[]>([])

async function onCustomerChange() {
  if (!createForm.customerId) return
  const res: any = await deviceApi.list({ page: 1, pageSize: 100, tenantId: createForm.customerId })
  customerDevices.value = res.list || []
}

async function submitCreate() {
  try {
    const res: any = await workOrderApi.create({ ...createForm })
    ElMessage.success(`工单 ${res.orderNo} 已创建，SLA 截止 ${formatDateTime(res.slaDeadline)}`)
    createVisible.value = false
    Object.assign(createForm, { title: '', customerId: '', deviceId: '', type: '故障报修', priority: 'major', description: '', creator: '当前用户' })
    orderTable.load()
  } catch {
    /* 已提示 */
  }
}

/* ---------- 详情 ---------- */
const drawerVisible = ref(false)
const detail = ref<any>({})
const logText = ref('')

async function openDetail(row: any) {
  detail.value = await workOrderApi.detail(row.id)
  logText.value = ''
  drawerVisible.value = true
}

const flowSteps = computed(() => {
  const order = ['pending', 'assigned', 'processing', 'verifying', 'completed', 'closed']
  const cur = order.indexOf(detail.value.status)
  return order.map((s, i) => ({
    key: s,
    label: WORKORDER_STATUS_OPTIONS.find((o) => o.value === s)?.label || s,
    done: i <= cur,
    current: i === cur
  }))
})

async function changeStatus(status: string, extra: any = {}) {
  try {
    const res: any = await workOrderApi.changeStatus(detail.value.id, { status, operator: '当前用户', ...extra })
    detail.value = { ...detail.value, ...res }
    ElMessage.success('工单状态已流转')
    orderTable.load()
  } catch {
    /* 已提示 */
  }
}

async function completeOrder() {
  const box = await ElMessageBox.prompt('请输入本次服务的费用（元），留空按 0 计：', '提交验收并完成', {
    inputValue: String(detail.value.cost || 0),
    inputPattern: /^\d+(\.\d{1,2})?$/,
    inputErrorMessage: '请输入合法的金额'
  }).catch(() => null)
  if (!box) return
  await changeStatus('completed', { cost: Number(box.value) })
}

async function addLog() {
  if (!logText.value.trim()) return ElMessage.warning('请输入处理记录内容')
  const res: any = await workOrderApi.addLog(detail.value.id, logText.value, '现场处理')
  detail.value = { ...detail.value, handlerLogs: res.handlerLogs }
  logText.value = ''
  ElMessage.success('处理记录已追加')
}

/** 处理中 → 提交验收 */
async function submitVisitOrComplete() {
  await ElMessageBox.confirm('确认现场处理已完毕，提交客户验收？验收通过后工单进入已完成状态。', '提交验收', { type: 'info' })
    .then(() => changeStatus('verifying'))
    .catch(() => null)
}

/* ---------- 派单 ---------- */
const assignVisible = ref(false)
const assignForm = reactive({ assignee: '', remark: '' })
const suggestions = ref<any[]>([])
const suggestLoading = ref(false)
const needSkill = ref('')

async function openAssign(row?: any) {
  if (row) {
    detail.value = await workOrderApi.detail(row.id)
  }
  if (!detail.value.id) return ElMessage.warning('请先选择工单')
  if (['completed', 'closed'].includes(detail.value.status)) return ElMessage.warning('已完成的工单不可再次派单')
  assignForm.assignee = detail.value.assignee || ''
  assignForm.remark = ''
  assignVisible.value = true
  suggestLoading.value = true
  try {
    const res: any = await workOrderApi.dispatchSuggest(detail.value.id)
    suggestions.value = res.list || []
    needSkill.value = res.needSkill || ''
  } finally {
    suggestLoading.value = false
  }
}

async function submitAssign() {
  if (!assignForm.assignee) return ElMessage.warning('请选择处理工程师')
  try {
    const res: any = await workOrderApi.assign(detail.value.id, assignForm.assignee, assignForm.remark)
    detail.value = { ...detail.value, ...res }
    ElMessage.success(`已派单给 ${assignForm.assignee}`)
    assignVisible.value = false
    orderTable.load()
  } catch {
    /* 已提示 */
  }
}

/* ---------- 回访 ---------- */
const visitVisible = ref(false)
const visitForm = reactive<any>({ result: 'satisfied', score: 5, remark: '' })

async function submitVisit() {
  try {
    const res: any = await workOrderApi.visit(detail.value.id, { ...visitForm, operator: '客服专员' })
    detail.value = { ...detail.value, ...res }
    ElMessage.success('回访结果已记录，感谢您的反馈')
    visitVisible.value = false
    orderTable.load()
  } catch {
    /* 已提示 */
  }
}

/* ---------- 服务报表 ---------- */
const serviceTrendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['新建工单', '完成工单'], top: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
  grid: { left: 12, right: 20, top: 36, bottom: 8, containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: serviceStats.value.dates || [] },
  yAxis: { type: 'value', name: '张' },
  series: [
    { name: '新建工单', type: 'line', smooth: true, symbolSize: 4, areaStyle: { opacity: 0.16 }, data: serviceStats.value.created || [] },
    { name: '完成工单', type: 'line', smooth: true, symbolSize: 4, areaStyle: { opacity: 0.1 }, data: serviceStats.value.finishedArr || [] }
  ]
}))

const engineerOption = computed(() => {
  const arr = (serviceStats.value.byEngineer || []).slice(0, 8).reverse()
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['按时率', '满意度'], top: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
    grid: { left: 12, right: 30, top: 36, bottom: 8, containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: arr.map((a: any) => a.name), axisLabel: { fontSize: 11 } },
    series: [
      { name: '按时率', type: 'bar', barWidth: 9, itemStyle: { borderRadius: [0, 3, 3, 0] }, data: arr.map((a: any) => a.onTimeRate) },
      { name: '满意度', type: 'bar', barWidth: 9, itemStyle: { borderRadius: [0, 3, 3, 0] }, data: arr.map((a: any) => a.avgScore * 20) }
    ]
  }
})

const typeOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  series: [
    {
      type: 'pie',
      radius: ['46%', '68%'],
      center: ['50%', '42%'],
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12, formatter: '{b}\n{c} 张' } },
      data: serviceStats.value.byType || []
    }
  ]
}))

const satisfactionOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  series: [
    {
      type: 'pie',
      radius: ['46%', '68%'],
      center: ['50%', '42%'],
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12, formatter: '{b}\n{c} 张' } },
      data: serviceStats.value.satisfactionDist || []
    }
  ]
}))

async function loadServiceStats() {
  serviceStats.value = await workOrderApi.stats(30)
}

/* ---------- 备件 ---------- */
const partTable = useTable({
  api: partApi.list as any,
  defaultParams: { keyword: '', category: '', status: '' }
})
const partSummary = computed(() => (partTable as any).summary || {})
const partDialog = ref(false)
const partForm = reactive<any>({ partId: '', type: 'out', quantity: 1, workOrderNo: '', operator: '当前用户' })

async function submitPart() {
  if (!partForm.partId) return ElMessage.warning('请选择备件')
  if (!partForm.quantity || partForm.quantity <= 0) return ElMessage.warning('数量必须大于 0')
  try {
    await partApi.inOut({ ...partForm })
    ElMessage.success(partForm.type === 'in' ? '入库成功' : '出库成功')
    partDialog.value = false
    partTable.load()
  } catch {
    /* 已提示 */
  }
}

/* ---------- 知识库 ---------- */
const kbTable = useTable({
  api: knowledgeApi.list as any,
  defaultParams: { keyword: '', category: '' }
})
const kbCategories = computed(() => (kbTable as any).categories || [])
const kbHot = computed(() => (kbTable as any).hot || [])
const kbVisible = ref(false)
const kbArticle = ref<any>(null)
const kbDialog = ref(false)
const kbForm = reactive<any>({ title: '', category: '故障处置', tags: [] as string[], content: '' })

async function openKb(row: any) {
  kbArticle.value = await knowledgeApi.detail(row.id)
  kbVisible.value = true
}

async function submitKb() {
  if (!kbForm.title) return ElMessage.warning('请输入文章标题')
  if (!kbForm.content) return ElMessage.warning('请输入文章内容')
  await knowledgeApi.create({ ...kbForm, author: '当前用户', status: 1 })
  ElMessage.success('知识文章已发布')
  kbDialog.value = false
  Object.assign(kbForm, { title: '', category: '故障处置', tags: [], content: '' })
  kbTable.load()
}

/* ---------- 巡检 ---------- */
const patrolTable = useTable({
  api: patrolApi.list as any,
  defaultParams: { status: '' }
})
const patrolDialog = ref(false)
const patrolForm = reactive<any>({ name: '', items: ['在线状态', '视频质量', '存储状态', '录像完整性'], scope: '全部租户' })
const PATROL_ITEMS = ['在线状态', '视频质量', '存储状态', '录像完整性', 'AI 任务运行', '固件版本', '网络时延', '磁盘健康']

async function submitPatrol() {
  if (!patrolForm.name) return ElMessage.warning('请输入巡检任务名称')
  if (!patrolForm.items.length) return ElMessage.warning('请至少选择一个巡检项')
  await patrolApi.create({ ...patrolForm, executor: '当前用户' })
  ElMessage.success('巡检任务已下发，系统将按设备清单自动执行')
  patrolDialog.value = false
  Object.assign(patrolForm, { name: '', items: ['在线状态', '视频质量', '存储状态', '录像完整性'], scope: '全部租户' })
  patrolTable.load()
}

/* ---------- 初始化 ---------- */
function exportOrders() {
  orderTable.exportData(
    [
      { key: 'orderNo', label: '工单号' },
      { key: 'title', label: '标题' },
      { key: 'type', label: '服务类型' },
      { key: 'priority', label: '优先级' },
      { key: 'customerName', label: '客户' },
      { key: 'deviceName', label: '设备' },
      { key: 'status', label: '状态' },
      { key: 'slaStatus', label: 'SLA' },
      { key: 'assignee', label: '处理人' },
      { key: 'createTime', label: '创建时间' },
      { key: 'slaDeadline', label: 'SLA 截止' },
      { key: 'finishTime', label: '完成时间' },
      { key: 'cost', label: '费用(元)' },
      { key: 'satisfaction', label: '满意度' }
    ],
    `工单台账_${new Date().toISOString().slice(0, 10)}`
  )
}

onMounted(async () => {
  const [t, e] = await Promise.all([tenantApi.list({ page: 1, pageSize: 100 }), workOrderApi.engineers().catch(() => [])])
  tenants.value = (t as any).list || []
  engineers.value = (e as any) || []
  await loadServiceStats()
})
</script>

<template>
  <PageContainer title="技术服务与工单" subtitle="从受理、派单、处理到验收回访的全流程闭环">
    <template #header>
      <el-button :icon="'Refresh'" :loading="orderTable.loading.value" @click="orderTable.load">刷新</el-button>
      <el-button :icon="'Download'" @click="exportOrders">导出工单</el-button>
      <el-button type="primary" :icon="'Plus'" @click="createVisible = true">新建工单</el-button>
    </template>

    <el-row :gutter="12">
      <el-col :span="4"><StatCard label="工单总数" :value="orderTable.total.value" icon="Tickets" color="#1677ff" footer="当前筛选条件" /></el-col>
      <el-col :span="4"><StatCard label="待受理" :value="boardStats.pending || 0" icon="Bell" color="#ff4d4f" footer="需尽快派单" /></el-col>
      <el-col :span="4"><StatCard label="处理中" :value="(boardStats.processing || 0) + (boardStats.assigned || 0)" icon="Loading" color="#faad14" footer="含已派单" /></el-col>
      <el-col :span="4"><StatCard label="待验收" :value="boardStats.verifying || 0" icon="CircleCheck" color="#13c2c2" footer="等待客户确认" /></el-col>
      <el-col :span="4"><StatCard label="SLA 超时" :value="boardStats.overdue || 0" icon="WarningFilled" color="#ff4d4f" footer="已超出响应时限" /></el-col>
      <el-col :span="4"><StatCard label="按时完成率" :value="serviceStats.onTimeRate || 0" unit="%" :decimals="1" icon="TrendCharts" color="#52c41a" :footer="`平均处理 ${serviceStats.avgHandleHours || 0} 小时`" /></el-col>
    </el-row>

    <el-tabs v-model="activeTab" style="margin-top: 12px">
      <!-- 工单管理 -->
      <el-tab-pane label="工单管理" name="orders">
        <div class="vc-card sv__filter">
          <el-form :model="orderTable.baseParams.value" inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="orderTable.baseParams.value.keyword" placeholder="工单号 / 标题 / 客户 / 设备 / 处理人" clearable style="width: 250px" @keyup.enter="orderTable.search" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="orderTable.baseParams.value.status" multiple collapse-tags collapse-tags-tooltip placeholder="全部状态" clearable style="width: 200px">
                <el-option v-for="s in WORKORDER_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="服务类型">
              <el-select v-model="orderTable.baseParams.value.type" placeholder="全部类型" clearable style="width: 160px">
                <el-option v-for="t in WORKORDER_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="优先级">
              <el-select v-model="orderTable.baseParams.value.priority" multiple collapse-tags placeholder="全部" clearable style="width: 170px">
                <el-option v-for="p in priorityOptions" :key="p.value" :label="p.label" :value="p.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="SLA 状态">
              <el-select v-model="orderTable.baseParams.value.slaStatus" placeholder="全部" clearable style="width: 140px">
                <el-option label="正常" value="normal" />
                <el-option label="即将超时" value="warning" />
                <el-option label="已超时" value="overdue" />
              </el-select>
            </el-form-item>
            <el-form-item label="客户">
              <el-select v-model="orderTable.baseParams.value.customerId" placeholder="全部客户" clearable filterable style="width: 190px">
                <el-option v-for="t in tenants" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="处理人">
              <el-select v-model="orderTable.baseParams.value.assignee" placeholder="全部工程师" clearable filterable style="width: 160px">
                <el-option v-for="e in engineers" :key="e.id" :label="e.name" :value="e.name" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="orderTable.search">查询</el-button>
              <el-button :icon="'RefreshLeft'" @click="orderTable.reset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="vc-card sv__table">
          <el-table
            v-loading="orderTable.loading.value"
            :data="orderTable.list.value"
            stripe
            row-key="id"
            @sort-change="orderTable.onSortChange"
            @selection-change="orderTable.onSelectionChange"
          >
            <el-table-column type="selection" width="42" />
            <el-table-column label="工单信息" min-width="260">
              <template #default="{ row }">
                <div class="sv__title" @click="openDetail(row)">
                  <StatusTag :status="row.priority" kind="alarmLevel" />
                  <span>{{ row.title }}</span>
                </div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.orderNo }} · {{ row.type }} · 由 {{ row.creator }} 创建</div>
              </template>
            </el-table-column>
            <el-table-column label="客户 / 设备" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <div>{{ row.customerName }}</div>
                <div class="vc-text-tertiary" style="font-size: 11px">{{ row.deviceName || '未关联设备' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="来源" width="100">
              <template #default="{ row }">
                <el-tag size="small" effect="plain" :type="row.source === 'alarm' ? 'warning' : row.source === 'plan' ? 'info' : 'primary'">
                  {{ row.source === 'alarm' ? '告警转单' : row.source === 'plan' ? '计划任务' : '客户报修' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" sortable="custom" prop="status">
              <template #default="{ row }"><StatusTag :status="row.status" kind="workOrder" /></template>
            </el-table-column>
            <el-table-column label="SLA" width="120">
              <template #default="{ row }">
                <StatusTag :status="row.slaStatus" kind="sla" />
                <div class="vc-text-tertiary" style="font-size: 11px">{{ row.slaDeadline?.slice(5, 16) }}</div>
              </template>
            </el-table-column>
            <el-table-column label="处理人" width="130">
              <template #default="{ row }">
                <div>{{ row.assignee || '待派单' }}</div>
                <div v-if="row.assigneePhone" class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.assigneePhone }}</div>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="150" sortable="custom" prop="createTime">
              <template #default="{ row }">
                <div>{{ relativeTimeText(row.createTime) }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.createTime.slice(5, 16) }}</div>
              </template>
            </el-table-column>
            <el-table-column label="费用" width="110" sortable="custom" prop="cost">
              <template #default="{ row }">¥{{ formatNumber(row.cost, 2) }}</template>
            </el-table-column>
            <el-table-column label="满意度" width="100">
              <template #default="{ row }">
                <el-rate v-if="row.satisfaction" :model-value="Math.round(row.satisfaction)" disabled size="small" />
                <span v-else class="vc-text-tertiary">未回访</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="190" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
                <el-button v-if="!['completed', 'closed'].includes(row.status)" link type="warning" size="small" @click="openAssign(row)">派单</el-button>
                <el-button v-if="['completed', 'closed'].includes(row.status) && !row.visitResult" link type="success" size="small" @click="openDetail(row).then(() => (visitVisible = true))">回访</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="没有符合条件的工单" tips="可调整筛选条件或新建工单" action-text="新建工单" @action="createVisible = true" /></template>
          </el-table>
          <div class="sv__pager">
            <el-pagination
              :current-page="orderTable.page.value"
              :page-size="orderTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="orderTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="orderTable.onPageChange"
              @size-change="orderTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 服务报表 -->
      <el-tab-pane label="服务报表" name="report">
        <div class="sv__repRow">
          <div class="vc-card sv__repWide">
            <div class="vc-panel-title">近 30 天工单新建与完成</div>
            <BaseChart :option="serviceTrendOption" :height="240" />
          </div>
          <div class="vc-card">
            <div class="vc-panel-title">服务类型分布</div>
            <BaseChart :option="typeOption" :height="240" />
          </div>
        </div>
        <div class="sv__repRow" style="margin-top: 12px">
          <div class="vc-card">
            <div class="vc-panel-title">工程师绩效（按时率 / 满意度×20）</div>
            <BaseChart :option="engineerOption" :height="250" />
          </div>
          <div class="vc-card">
            <div class="vc-panel-title">满意度分布</div>
            <BaseChart :option="satisfactionOption" :height="250" />
          </div>
          <div class="vc-card sv__overdue">
            <div class="vc-panel-title">SLA 超时工单（{{ (serviceStats.overdueList || []).length }}）</div>
            <div v-for="o in serviceStats.overdueList || []" :key="o.id" class="sv__overdueItem">
              <div>
                <div class="sv__overdueTitle">{{ o.title }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ o.orderNo }} · {{ o.customerName }}</div>
              </div>
              <div class="sv__overdueRight">
                <span class="is-err">超时</span>
                <div class="vc-text-tertiary" style="font-size: 11px">{{ o.assignee || '未派单' }}</div>
              </div>
            </div>
            <EmptyState v-if="!(serviceStats.overdueList || []).length" description="没有超时工单，服务健康" />
          </div>
        </div>
      </el-tab-pane>

      <!-- 备件管理 -->
      <el-tab-pane label="备件管理" name="part">
        <div class="vc-card sv__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="partTable.baseParams.value.keyword" placeholder="备件名称 / 型号 / 库位" clearable style="width: 220px" @keyup.enter="partTable.search" />
            </el-form-item>
            <el-form-item label="分类">
              <el-select v-model="partTable.baseParams.value.category" placeholder="全部分类" clearable style="width: 150px">
                <el-option v-for="c in (partTable as any).categories || []" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item label="库存状态">
              <el-select v-model="partTable.baseParams.value.status" placeholder="全部" clearable style="width: 140px">
                <el-option label="库存正常" value="normal" />
                <el-option label="库存偏低" value="low" />
                <el-option label="已缺货" value="out" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="partTable.search">查询</el-button>
              <el-button type="primary" plain :icon="'Sort'" @click="partDialog = true">出入库登记</el-button>
              <span class="vc-text-tertiary" style="font-size: 12px">
                共 {{ partSummary.total || 0 }} 种，偏低 <b class="is-warn">{{ partSummary.low || 0 }}</b>，缺货 <b class="is-err">{{ partSummary.out || 0 }}</b>，
                库存总值 ¥{{ formatNumber(partSummary.totalValue || 0, 2) }}
              </span>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card sv__table">
          <el-table v-loading="partTable.loading.value" :data="partTable.list.value" stripe>
            <el-table-column label="备件名称 / 型号" min-width="230">
              <template #default="{ row }">
                <div style="font-weight: 500">{{ row.name }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.model }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="130" />
            <el-table-column label="库存" width="130">
              <template #default="{ row }">
                <b :class="{ 'is-warn': row.status === 'low', 'is-err': row.status === 'out' }">{{ row.stock }}</b>
                <span class="vc-text-tertiary"> {{ row.unit }}</span>
                <div class="vc-text-tertiary" style="font-size: 11px">预警值 {{ row.warningStock }}</div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }"><StatusTag :status="row.status" kind="part" /></template>
            </el-table-column>
            <el-table-column label="单价" width="110">
              <template #default="{ row }">¥{{ formatNumber(row.price, 2) }}</template>
            </el-table-column>
            <el-table-column prop="location" label="库位" width="130" />
            <el-table-column prop="supplier" label="供应商" min-width="180" show-overflow-tooltip />
            <el-table-column label="最近出入库" min-width="220">
              <template #default="{ row }">
                <div v-for="(r, i) in (row.inOutRecords || []).slice(0, 2)" :key="i" style="font-size: 12px">
                  <el-tag size="small" :type="r.type === 'in' ? 'success' : 'warning'" effect="plain" style="margin-right: 4px">
                    {{ r.type === 'in' ? '入库' : '出库' }}
                  </el-tag>
                  {{ r.quantity }}{{ row.unit }} · {{ r.operator }} · {{ r.time.slice(5, 16) }}
                </div>
                <span v-if="!row.inOutRecords?.length" class="vc-text-tertiary">无记录</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="() => { partForm.partId = row.id; partForm.type = 'out'; partDialog = true }">出库</el-button>
                <el-button link type="primary" size="small" @click="() => { partForm.partId = row.id; partForm.type = 'in'; partDialog = true }">入库</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="暂无备件" /></template>
          </el-table>
          <div class="sv__pager">
            <el-pagination
              :current-page="partTable.page.value"
              :page-size="partTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="partTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="partTable.onPageChange"
              @size-change="partTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 知识库 -->
      <el-tab-pane label="知识库" name="kb">
        <div class="sv__kb">
          <div class="vc-card sv__kbMain">
            <div class="sv__kbHead">
              <el-input v-model="kbTable.baseParams.value.keyword" placeholder="搜索标题 / 标签 / 作者" clearable style="width: 260px" @keyup.enter="kbTable.search" />
              <el-select v-model="kbTable.baseParams.value.category" placeholder="全部分类" clearable style="width: 170px" @change="kbTable.search">
                <el-option v-for="c in kbCategories" :key="c" :label="c" :value="c" />
              </el-select>
              <el-button type="primary" :icon="'Search'" @click="kbTable.search">搜索</el-button>
              <div style="flex: 1" />
              <el-button type="primary" plain :icon="'Plus'" @click="kbDialog = true">发布文章</el-button>
            </div>
            <div class="sv__kbList">
              <div v-for="k in kbTable.list.value" :key="k.id" class="sv__kbItem" @click="openKb(k)">
                <div class="sv__kbTitle">{{ k.title }}</div>
                <div class="sv__kbMeta">
                  <el-tag size="small" effect="plain">{{ k.category }}</el-tag>
                  <el-tag v-for="t in k.tags" :key="t" size="small" effect="plain" type="info">{{ t }}</el-tag>
                  <span class="vc-text-tertiary">{{ k.author }} · {{ formatDateTime(k.publishTime) }}</span>
                  <span class="vc-text-tertiary">阅读 {{ k.views }}</span>
                </div>
              </div>
              <EmptyState v-if="!kbTable.list.value.length" description="暂无知识文章" action-text="发布文章" @action="kbDialog = true" />
            </div>
            <div class="sv__pager">
              <el-pagination
                :current-page="kbTable.page.value"
                :page-size="kbTable.pageSize.value"
                :page-sizes="paginationSizes"
                :total="kbTable.total.value"
                :layout="paginationLayout"
                background
                @current-change="kbTable.onPageChange"
                @size-change="kbTable.onSizeChange"
              />
            </div>
          </div>
          <div class="vc-card sv__kbSide">
            <div class="vc-panel-title">热门文章</div>
            <div v-for="(h, i) in kbHot" :key="h.id" class="sv__hotItem" @click="openKb(h)">
              <span class="sv__hotRank" :class="{ 'is-top': i < 3 }">{{ i + 1 }}</span>
              <span class="sv__hotTitle">{{ h.title }}</span>
              <span class="vc-text-tertiary">{{ h.views }}</span>
            </div>
            <EmptyState v-if="!kbHot.length" description="暂无数据" />
          </div>
        </div>
      </el-tab-pane>

      <!-- 定期巡检 -->
      <el-tab-pane label="定期巡检" name="patrol">
        <div class="vc-card sv__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="状态">
              <el-select v-model="patrolTable.baseParams.value.status" placeholder="全部" clearable style="width: 140px" @change="patrolTable.search">
                <el-option label="执行中" value="running" />
                <el-option label="已完成" value="completed" />
                <el-option label="失败" value="failed" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" plain :icon="'Plus'" @click="patrolDialog = true">新建巡检任务</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card sv__table">
          <el-table v-loading="patrolTable.loading.value" :data="patrolTable.list.value" stripe>
            <el-table-column label="任务名称" min-width="220">
              <template #default="{ row }">
                <div style="font-weight: 500">{{ row.name }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.id }} · 执行人 {{ row.executor }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="scope" label="巡检范围" width="150" />
            <el-table-column label="巡检项" min-width="240">
              <template #default="{ row }">
                <el-tag v-for="i in (row.items || []).slice(0, 4)" :key="i" size="small" effect="plain" style="margin: 1px 3px 1px 0">{{ i }}</el-tag>
                <span v-if="(row.items || []).length > 4" class="vc-text-tertiary" style="font-size: 11px">+{{ row.items.length - 4 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="进度" min-width="220">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :stroke-width="9" :status="row.status === 'failed' ? 'exception' : row.status === 'completed' ? 'success' : undefined" />
                <div class="vc-text-tertiary" style="font-size: 11px">
                  共 {{ row.deviceCount }} 台 · 正常 {{ row.normalCount }} · 异常 <b class="is-warn">{{ row.abnormalCount }}</b> · 跳过 {{ row.skippedCount }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }"><StatusTag :status="row.status" kind="task" /></template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="170" />
            <el-table-column label="完成时间" width="170">
              <template #default="{ row }">{{ row.finishTime ? formatDateTime(row.finishTime) : '-' }}</template>
            </el-table-column>
            <template #empty><EmptyState description="暂无巡检任务" action-text="新建巡检任务" @action="patrolDialog = true" /></template>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 新建工单 -->
    <el-dialog v-model="createVisible" title="新建服务工单" width="660px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="工单标题" required>
          <el-input v-model="createForm.title" placeholder="如：园区南门摄像机画面模糊需上门检查" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="客户" required>
          <el-select v-model="createForm.customerId" filterable placeholder="选择客户（租户）" style="width: 100%" @change="onCustomerChange">
            <el-option v-for="t in tenants" :key="t.id" :label="`${t.name}（${t.city}）`" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联设备">
          <el-select v-model="createForm.deviceId" clearable filterable placeholder="可选，选择需要服务的设备" style="width: 100%">
            <el-option v-for="d in customerDevices" :key="d.id" :label="`${d.name}（${d.sn}）`" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="服务类型">
              <el-select v-model="createForm.type" style="width: 100%">
                <el-option v-for="t in WORKORDER_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="createForm.priority" style="width: 100%">
                <el-option v-for="l in ALARM_LEVEL_OPTIONS" :key="l.value" :label="`${l.label}（SLA ${l.value === 'urgent' ? 4 : l.value === 'major' ? 8 : l.value === 'minor' ? 24 : 48} 小时）`" :value="l.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="问题描述" required>
          <el-input v-model="createForm.description" type="textarea" :rows="4" placeholder="请描述故障现象、发生时间与已尝试的处理（不少于 5 个字）" maxlength="300" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">提交工单</el-button>
      </template>
    </el-dialog>

    <!-- 工单详情 -->
    <el-drawer v-model="drawerVisible" title="工单详情" size="680px">
      <div v-if="detail.id">
        <div class="sv__head">
          <StatusTag :status="detail.priority" kind="alarmLevel" size="default" />
          <StatusTag :status="detail.status" kind="workOrder" size="default" />
          <StatusTag :status="detail.slaStatus" kind="sla" size="default" />
          <span class="vc-mono vc-text-tertiary">{{ detail.orderNo }}</span>
        </div>
        <h3 class="sv__detailTitle">{{ detail.title }}</h3>

        <el-steps :active="flowSteps.findIndex((s) => s.current)" align-center finish-status="success" style="margin: 16px 0">
          <el-step v-for="s in flowSteps" :key="s.key" :title="s.label" />
        </el-steps>

        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="服务类型">{{ detail.type }}</el-descriptions-item>
          <el-descriptions-item label="来源">
            {{ detail.source === 'alarm' ? '告警转单' : detail.source === 'plan' ? '计划任务' : '客户报修' }}
          </el-descriptions-item>
          <el-descriptions-item label="客户">{{ detail.customerName }}</el-descriptions-item>
          <el-descriptions-item label="关联设备">{{ detail.deviceName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ detail.creator }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(detail.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="处理工程师">{{ detail.assignee || '待派单' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detail.assigneePhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="SLA 截止">{{ formatDateTime(detail.slaDeadline) }}</el-descriptions-item>
          <el-descriptions-item label="到场时间">{{ detail.arriveTime ? formatDateTime(detail.arriveTime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ detail.finishTime ? formatDateTime(detail.finishTime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="服务费用">¥{{ formatNumber(detail.cost, 2) }}</el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="2">{{ detail.description }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="detail.device" style="margin-top: 14px">
          <div class="vc-panel-title">关联设备信息</div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="设备名称">{{ detail.device.name }}</el-descriptions-item>
            <el-descriptions-item label="SN"><span class="vc-mono">{{ detail.device.sn }}</span></el-descriptions-item>
            <el-descriptions-item label="安装地址" :span="2">{{ detail.device.installAddress }}</el-descriptions-item>
            <el-descriptions-item label="在线状态"><StatusTag :status="detail.device.onlineStatus" kind="online" dot /></el-descriptions-item>
            <el-descriptions-item label="健康度">{{ detail.device.healthScore }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div style="margin-top: 14px">
          <div class="vc-panel-title">处理记录（{{ (detail.handlerLogs || []).length }}）</div>
          <el-timeline>
            <el-timeline-item v-for="(l, i) in detail.handlerLogs || []" :key="i" :timestamp="formatDateTime(l.time)" placement="top">
              <div class="sv__logAction">{{ l.action }}<span class="vc-text-tertiary"> · {{ l.operator }}</span></div>
              <div v-if="l.remark" class="sv__logRemark">{{ l.remark }}</div>
            </el-timeline-item>
          </el-timeline>
          <div class="sv__logInput">
            <el-input v-model="logText" placeholder="追加处理记录，如：已更换电源适配器，画面恢复正常" />
            <el-button type="primary" @click="addLog">追加</el-button>
          </div>
        </div>

        <div v-if="detail.partsUsed?.length" style="margin-top: 14px">
          <div class="vc-panel-title">使用备件</div>
          <el-table :data="detail.partsUsed" size="small" stripe>
            <el-table-column prop="partName" label="备件名称" min-width="160" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column label="单价" width="100">
              <template #default="{ row }">¥{{ row.price }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <div class="sv__footer">
          <el-select v-if="!['completed', 'closed'].includes(detail.status)" placeholder="流转到..." style="width: 160px" @change="(v: any) => changeStatus(v)">
            <el-option
              v-for="s in WORKORDER_STATUS_OPTIONS.filter((x) => x.value !== detail.status)"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
          <el-button v-if="!['completed', 'closed'].includes(detail.status)" type="primary" plain :icon="'User'" @click="openAssign()">重新派单</el-button>
          <el-button v-if="detail.status === 'processing'" type="success" @click="submitVisitOrComplete">提交验收</el-button>
          <el-button v-if="['completed', 'closed'].includes(detail.status) && !detail.visitResult" type="success" plain @click="visitVisible = true">客户回访</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 派单 -->
    <el-dialog v-model="assignVisible" title="工单派单" width="720px" top="8vh">
      <div v-loading="suggestLoading">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 12px"
          :title="`推荐所需技能：${needSkill || '通用技能'}`"
          description="系统按技能匹配度、就近服务、当前负载与历史服务质量综合评分排序，推荐前 5 位工程师。"
        />
        <div class="sv__sugList">
          <div
            v-for="s in suggestions"
            :key="s.id"
            class="sv__sug"
            :class="{ 'is-active': assignForm.assignee === s.name, 'is-off': s.status === 'off' }"
            @click="s.status !== 'off' && (assignForm.assignee = s.name)"
          >
            <div class="sv__sugHead">
              <b>{{ s.name }}</b>
              <el-tag size="small" effect="plain">{{ s.level }}</el-tag>
              <el-tag v-if="s.status === 'off'" size="small" type="info" effect="plain">休息中</el-tag>
              <div style="flex: 1" />
              <span class="sv__sugScore">{{ s.score }}</span>
            </div>
            <div class="sv__sugMeta">
              <span>{{ s.region }}</span>
              <span>当前 {{ s.currentLoad }}/{{ s.maxLoad }} 单</span>
              <span>满意度 {{ s.satisfaction }}</span>
              <span>准时率 {{ s.onTimeRate }}%</span>
            </div>
            <div class="sv__sugReasons">
              <div v-for="r in s.reasons" :key="r">· {{ r }}</div>
            </div>
          </div>
          <EmptyState v-if="!suggestions.length && !suggestLoading" description="暂无推荐工程师" />
        </div>
        <el-form :model="assignForm" label-width="100px" style="margin-top: 14px">
          <el-form-item label="处理工程师">
            <el-select v-model="assignForm.assignee" filterable placeholder="也可手动选择其他工程师" style="width: 100%">
              <el-option v-for="e in engineers" :key="e.id" :label="`${e.name}（${e.level}，${e.region}）`" :value="e.name" :disabled="e.status === 'off'" />
            </el-select>
          </el-form-item>
          <el-form-item label="派单备注">
            <el-input v-model="assignForm.remark" type="textarea" :rows="2" placeholder="如：需携带备用电源适配器，客户要求在上午 10 点前到场" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign">确认派单</el-button>
      </template>
    </el-dialog>

    <!-- 回访 -->
    <el-dialog v-model="visitVisible" title="客户回访" width="520px">
      <el-form :model="visitForm" label-width="100px">
        <el-form-item label="回访结果">
          <el-radio-group v-model="visitForm.result">
            <el-radio value="satisfied">满意</el-radio>
            <el-radio value="normal">一般</el-radio>
            <el-radio value="unsatisfied">不满意</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="满意度评分">
          <el-rate v-model="visitForm.score" show-text :texts="['很不满意', '不满意', '一般', '满意', '非常满意']" />
        </el-form-item>
        <el-form-item label="回访备注">
          <el-input v-model="visitForm.remark" type="textarea" :rows="3" placeholder="记录客户反馈与后续改进建议" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visitVisible = false">取消</el-button>
        <el-button type="primary" @click="submitVisit">提交回访</el-button>
      </template>
    </el-dialog>

    <!-- 备件出入库 -->
    <el-dialog v-model="partDialog" title="备件出入库登记" width="520px">
      <el-form :model="partForm" label-width="100px">
        <el-form-item label="备件">
          <el-select v-model="partForm.partId" filterable placeholder="选择备件" style="width: 100%">
            <el-option v-for="p in partTable.list.value" :key="p.id" :label="`${p.name}（库存 ${p.stock} ${p.unit}）`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-radio-group v-model="partForm.type">
            <el-radio value="in">入库</el-radio>
            <el-radio value="out">出库</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="partForm.quantity" :min="1" :max="9999" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="关联工单">
          <el-input v-model="partForm.workOrderNo" placeholder="选填，填写工单号可关联成本" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="partDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPart">确认登记</el-button>
      </template>
    </el-dialog>

    <!-- 知识文章 -->
    <el-dialog v-model="kbDialog" title="发布知识文章" width="720px" top="8vh">
      <el-form :model="kbForm" label-width="100px">
        <el-form-item label="文章标题" required>
          <el-input v-model="kbForm.title" placeholder="如：海康摄像机 GB28181 注册失败的 6 种排查方法" maxlength="60" show-word-limit />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="kbForm.category" allow-create filterable default-first-option style="width: 100%">
            <el-option label="故障处置" value="故障处置" />
            <el-option label="安装调试" value="安装调试" />
            <el-option label="平台配置" value="平台配置" />
            <el-option label="AI 应用" value="AI 应用" />
            <el-option label="存储运维" value="存储运维" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="kbForm.tags" multiple allow-create filterable default-first-option placeholder="输入标签后回车" style="width: 100%" />
        </el-form-item>
        <el-form-item label="正文" required>
          <el-input v-model="kbForm.content" type="textarea" :rows="10" placeholder="建议包含：现象描述、排查步骤、根因分析、解决方案、预防措施" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="kbDialog = false">取消</el-button>
        <el-button type="primary" @click="submitKb">发布</el-button>
      </template>
    </el-dialog>

    <!-- 文章详情 -->
    <el-drawer v-model="kbVisible" title="知识文章" size="720px">
      <div v-if="kbArticle">
        <h2 class="sv__kbArticleTitle">{{ kbArticle.title }}</h2>
        <div class="sv__kbMeta" style="margin: 10px 0 16px">
          <el-tag size="small" effect="plain">{{ kbArticle.category }}</el-tag>
          <el-tag v-for="t in kbArticle.tags" :key="t" size="small" effect="plain" type="info">{{ t }}</el-tag>
          <span class="vc-text-tertiary">{{ kbArticle.author }} · {{ formatDateTime(kbArticle.publishTime) }} · 阅读 {{ kbArticle.views }}</span>
        </div>
        <div class="sv__kbContent">{{ kbArticle.content }}</div>
        <div v-if="kbArticle.related?.length" style="margin-top: 20px">
          <div class="vc-panel-title">相关文章</div>
          <div v-for="r in kbArticle.related" :key="r.id" class="sv__hotItem" @click="openKb(r)">
            <span class="sv__hotTitle">{{ r.title }}</span>
            <span class="vc-text-tertiary">{{ r.views }}</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </PageContainer>
</template>

<style scoped>
.sv__filter {
  padding: 14px 16px 4px;
  margin-bottom: 12px;
}

.sv__filter :deep(.el-form-item) {
  margin-bottom: 10px;
}

.sv__table {
  padding: 0;
  overflow: hidden;
}

.sv__pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.sv__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.sv__title:hover span {
  color: var(--el-color-primary);
}

.sv__repRow {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

.sv__repRow + .sv__repRow {
  grid-template-columns: 1fr 1fr 1fr;
}

.sv__repRow > .vc-card {
  padding: 14px;
  min-width: 0;
}

.sv__repWide {
  min-width: 0;
}

.sv__overdue {
  max-height: 320px;
  overflow: auto;
}

.sv__overdueItem {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.sv__overdueTitle {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.sv__overdueRight {
  text-align: right;
  flex-shrink: 0;
}

.sv__kb {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 12px;
}

.sv__kbMain {
  padding: 0;
  overflow: hidden;
}

.sv__kbHead {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.sv__kbList {
  padding: 6px 16px;
}

.sv__kbItem {
  padding: 12px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
  cursor: pointer;
}

.sv__kbItem:hover .sv__kbTitle {
  color: var(--el-color-primary);
}

.sv__kbTitle {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
}

.sv__kbMeta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  flex-wrap: wrap;
}

.sv__kbSide {
  padding: 14px;
}

.sv__hotItem {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  cursor: pointer;
  font-size: 12px;
}

.sv__hotItem:hover .sv__hotTitle {
  color: var(--el-color-primary);
}

.sv__hotRank {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: var(--el-fill-color);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
}

.sv__hotRank.is-top {
  background: var(--vc-danger);
  color: #fff;
}

.sv__hotTitle {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sv__kbArticleTitle {
  margin: 0;
  font-size: 18px;
}

.sv__kbContent {
  font-size: 13px;
  line-height: 2;
  white-space: pre-wrap;
  color: var(--el-text-color-regular);
}

.sv__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sv__detailTitle {
  margin: 10px 0 0;
  font-size: 17px;
  font-weight: 500;
}

.sv__logAction {
  font-size: 13px;
}

.sv__logRemark {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.sv__logInput {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.sv__footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.sv__sugList {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.sv__sug {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.sv__sug:hover {
  border-color: var(--el-color-primary-light-5);
}

.sv__sug.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.sv__sug.is-off {
  opacity: 0.55;
  cursor: not-allowed;
}

.sv__sugHead {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sv__sugScore {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
}

.sv__sugMeta {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin: 6px 0;
  flex-wrap: wrap;
}

.sv__sugReasons {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  line-height: 1.7;
}

.is-warn {
  color: var(--vc-warning);
}

.is-err {
  color: var(--vc-danger);
}
</style>
