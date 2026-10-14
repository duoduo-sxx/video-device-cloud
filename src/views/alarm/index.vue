<script setup lang="ts">
/**
 * 告警与事件中心：告警列表 / 详情 / 批量处理 / 一键转工单
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { alarmApi, tenantApi, workOrderApi } from '@/api'
import { useTable, paginationLayout, paginationSizes } from '@/composables/useTable'
import PageContainer from '@/components/PageContainer.vue'
import StatCard from '@/components/StatCard.vue'
import BaseChart from '@/components/BaseChart.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { CHART_COLORS, ALARM_LEVEL_OPTIONS, ALARM_STATUS_OPTIONS, alarmLevelMeta } from '@/utils/dict'
import { formatDateTime, formatDuration, formatNumber, relativeTimeText } from '@/utils/format'
import { copyText } from '@/utils/download'

const router = useRouter()
const showSearch = ref(true)

const tenants = ref<any[]>([])
const engineers = ref<any[]>([])
const stats = ref<any>({})

const alarmTypes = [
  '视频信号丢失',
  '设备离线',
  '移动侦测',
  '区域入侵',
  '越界检测',
  '人员聚集',
  '未戴安全帽',
  '烟雾明火',
  '车辆违停',
  '存储写入异常',
  '码率异常',
  '录像缺失',
  '网络抖动',
  'AI 任务异常'
]

const timeRange = ref<[string, string] | null>(null)

const {
  loading,
  list,
  total,
  page,
  pageSize,
  baseParams,
  selection,
  load,
  search,
  reset,
  onPageChange,
  onSizeChange,
  onSortChange,
  onSelectionChange,
  exportData
} = useTable({
  api: alarmApi.list as any,
  syncQuery: true,
  defaultParams: {
    keyword: '',
    level: [] as string[],
    status: [] as string[],
    type: '',
    category: '',
    tenantId: '',
    startTime: '',
    endTime: ''
  }
})

const selectedIds = computed(() => selection.value.map((a: any) => a.id))

/* ---------- 详情抽屉 ---------- */
const drawerVisible = ref(false)
const detail = ref<any>({})
const handleForm = ref({ status: 'resolved', remark: '' })
const handling = ref(false)

async function openDetail(row: any) {
  detail.value = await alarmApi.detail(row.id)
  handleForm.value = { status: detail.value.status === 'pending' ? 'processing' : 'resolved', remark: '' }
  drawerVisible.value = true
}

async function submitHandle() {
  if (handleForm.value.status === 'false_alarm' && !handleForm.value.remark.trim()) {
    ElMessage.warning('标记误报时必须填写误报原因')
    return
  }
  handling.value = true
  try {
    await alarmApi.handle(detail.value.id, { ...handleForm.value })
    ElMessage.success('告警处理结果已保存')
    drawerVisible.value = false
    await Promise.all([load(), loadStats()])
  } finally {
    handling.value = false
  }
}

/* ---------- 批量处理 ---------- */
async function batchHandle(status: string, label: string) {
  if (!selectedIds.value.length) return ElMessage.warning('请先选择告警')
  let remark = ''
  if (status === 'false_alarm') {
    const box = await ElMessageBox.prompt('请输入误报原因，将记录到处理日志中：', '标记误报', {
      confirmButtonText: '确认标记',
      inputPlaceholder: '如：树枝晃动触发误判'
    }).catch(() => null)
    if (!box) return
    remark = box.value
  } else {
    await ElMessageBox.confirm(`确认将选中的 ${selectedIds.value.length} 条告警标记为「${label}」？`, label, { type: 'warning' })
  }
  const res: any = await alarmApi.batchHandle(selectedIds.value, status, remark)
  ElMessage.success(res.message)
  await Promise.all([load(), loadStats()])
}

/* ---------- 转工单 ---------- */
const transferVisible = ref(false)
const transferForm = ref({ type: '故障报修', priority: 'major', assignee: '', description: '', assigneePhone: '', creator: '当前用户' })

function openTransfer(row?: any) {
  if (row) selection.value = [row]
  if (!selectedIds.value.length) return ElMessage.warning('请先选择告警')
  transferForm.value = {
    type: '故障报修',
    priority: alarmLevelMeta(selection.value[0].level).label === '紧急' ? 'urgent' : 'major',
    assignee: '',
    assigneePhone: '',
    description: '',
    creator: '当前用户'
  }
  transferVisible.value = true
}

async function submitTransfer() {
  const first = selection.value[0]
  const res: any = await alarmApi.transfer(first.id, { ...transferForm.value })
  ElMessage.success(`已生成工单 ${res.orderNo}`)
  transferVisible.value = false
  await Promise.all([load(), loadStats()])
  router.push('/service')
}

/* ---------- 统计 ---------- */
async function loadStats() {
  stats.value = await alarmApi.statistics(7)
}

const levelChart = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  series: [
    {
      type: 'pie',
      radius: ['46%', '68%'],
      center: ['50%', '44%'],
      label: { formatter: '{b}\n{d}%', fontSize: 11 },
      data: (stats.value.byLevel || []).map((i: any, idx: number) => ({
        name: alarmLevelMeta(i.name).label,
        value: i.value,
        itemStyle: { color: alarmLevelMeta(i.name).color || CHART_COLORS[idx % CHART_COLORS.length] }
      }))
    }
  ]
}))

const typeChart = computed(() => {
  const arr = (stats.value.byType || []).slice(0, 8).reverse()
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 12, right: 30, top: 16, bottom: 8, containLabel: true },
    xAxis: { type: 'value', name: '条' },
    yAxis: { type: 'category', data: arr.map((a: any) => a.name), axisLabel: { fontSize: 11 } },
    series: [
      {
        type: 'bar',
        barWidth: 13,
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', fontSize: 11 },
        data: arr.map((a: any) => a.value)
      }
    ]
  }
})

function levelText(level: string) {
  return ALARM_LEVEL_OPTIONS.find((o) => o.value === level)?.label || level
}

function exportList() {
  exportData(
    [
      { key: 'alarmNo', label: '告警编号' },
      { key: 'title', label: '告警标题' },
      { key: 'type', label: '告警类型' },
      { key: 'category', label: '来源' },
      { key: 'level', label: '等级' },
      { key: 'deviceName', label: '设备名称' },
      { key: 'tenantName', label: '所属租户' },
      { key: 'region', label: '区域' },
      { key: 'confidence', label: '置信度' },
      { key: 'occurTime', label: '发生时间' },
      { key: 'duration', label: '持续(分钟)' },
      { key: 'status', label: '状态' },
      { key: 'handler', label: '处理人' },
      { key: 'handleRemark', label: '处理说明' }
    ],
    `告警记录_${new Date().toISOString().slice(0, 10)}`
  )
}

async function loadMeta() {
  const [t, e] = await Promise.all([tenantApi.list({ page: 1, pageSize: 100 }), workOrderApi.engineers().catch(() => [])])
  tenants.value = (t as any).list || []
  engineers.value = (e as any) || []
}

onMounted(loadMeta)
</script>

<template>
  <PageContainer title="告警与事件中心" subtitle="汇聚设备、AI、存储与网络四类告警，支持收敛、闭环与转单">
    <template #header>
      <el-button :icon="'Refresh'" :loading="loading" @click="load">刷新</el-button>
      <el-button :icon="'Download'" @click="exportList">导出告警</el-button>
      <el-button type="primary" :icon="'Tickets'" :disabled="!selectedIds.length" @click="openTransfer()">转工单</el-button>
    </template>

    <el-row :gutter="12">
      <el-col :span="4"><StatCard label="近 7 天告警" :value="stats.total || 0" icon="Bell" color="#1677ff" footer="全部来源" /></el-col>
      <el-col :span="4"><StatCard label="平均响应(MTTA)" :value="stats.mtta || 0" unit="分钟" icon="Timer" color="#faad14" footer="从发生到首次处理" /></el-col>
      <el-col :span="4"><StatCard label="平均闭环(MTTR)" :value="stats.mttr || 0" unit="分钟" icon="CircleCheck" color="#52c41a" footer="从发生到解决" /></el-col>
      <el-col :span="4"><StatCard label="误报率" :value="stats.falseRate || 0" unit="%" :decimals="1" icon="Warning" color="#722ed1" footer="已标记为误报占比" /></el-col>
      <el-col :span="4"><StatCard label="待处理" :value="(stats.byLevel || []).length ? list.filter((a: any) => a.status === 'pending').length : 0" icon="AlarmClock" color="#ff4d4f" footer="当前页口径" /></el-col>
      <el-col :span="4"><StatCard label="告警类型数" :value="(stats.byType || []).length" icon="Grid" color="#13c2c2" footer="近 7 天出现" /></el-col>
    </el-row>

    <div class="vc-card al__filter" style="margin-top: 12px">
      <el-form :model="baseParams" inline @submit.prevent>
        <el-form-item label="关键字">
          <el-input v-model="baseParams.keyword" placeholder="告警编号 / 标题 / 设备 / 租户" clearable style="width: 230px" @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="告警等级">
          <el-select v-model="baseParams.level" multiple collapse-tags collapse-tags-tooltip placeholder="全部等级" clearable style="width: 190px">
            <el-option v-for="l in ALARM_LEVEL_OPTIONS" :key="l.value" :label="l.label" :value="l.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="baseParams.status" multiple collapse-tags collapse-tags-tooltip placeholder="全部状态" clearable style="width: 190px">
            <el-option v-for="s in ALARM_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="告警类型">
          <el-select v-model="baseParams.type" placeholder="全部类型" clearable filterable style="width: 170px">
            <el-option v-for="t in alarmTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源分类">
          <el-select v-model="baseParams.category" placeholder="全部来源" clearable style="width: 130px">
            <el-option label="设备告警" value="device" />
            <el-option label="AI 事件" value="ai" />
            <el-option label="存储告警" value="storage" />
            <el-option label="网络告警" value="network" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属租户">
          <el-select v-model="baseParams.tenantId" placeholder="全部租户" clearable filterable style="width: 190px">
            <el-option v-for="t in tenants" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="发生时间">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 340px"
            @change="(v: any) => { baseParams.startTime = v?.[0] || ''; baseParams.endTime = v?.[1] || '' }"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="'Search'" @click="search">查询</el-button>
          <el-button :icon="'RefreshLeft'" @click="() => { timeRange = null; reset() }">重置</el-button>
          <el-button link type="primary" @click="showSearch = !showSearch">{{ showSearch ? '收起' : '展开' }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="al__charts">
      <div class="vc-card">
        <div class="vc-panel-title">告警等级分布</div>
        <BaseChart :option="levelChart" :height="200" :empty="!(stats.byLevel || []).length" />
      </div>
      <div class="vc-card">
        <div class="vc-panel-title">告警类型 TOP8</div>
        <BaseChart :option="typeChart" :height="200" :empty="!(stats.byType || []).length" />
      </div>
      <div class="vc-card">
        <div class="vc-panel-title">各租户告警量</div>
        <el-table :data="(stats.byTenant || []).slice(0, 6)" size="small" :show-header="false">
          <el-table-column prop="name" min-width="130" show-overflow-tooltip />
          <el-table-column width="110">
            <template #default="{ row }">
              <el-progress :percentage="Math.min(100, Math.round((row.value / Math.max(1, (stats.byTenant || [])[0]?.value || 1)) * 100))" :stroke-width="8" :show-text="false" />
            </template>
          </el-table-column>
          <el-table-column prop="value" width="60" align="right" />
          <template #empty><EmptyState description="暂无数据" /></template>
        </el-table>
      </div>
    </div>

    <div v-if="selectedIds.length" class="al__batch">
      <span>已选择 <b>{{ selectedIds.length }}</b> 条告警</span>
      <el-button size="small" type="primary" plain @click="batchHandle('processing', '认领')">批量认领</el-button>
      <el-button size="small" type="success" plain @click="batchHandle('resolved', '标记已解决')">标记已解决</el-button>
      <el-button size="small" plain @click="batchHandle('closed', '关闭')">批量关闭</el-button>
      <el-button size="small" warning plain @click="batchHandle('false_alarm', '标记误报')">标记误报</el-button>
      <el-button size="small" type="primary" @click="openTransfer()">一键转工单</el-button>
    </div>

    <div class="vc-card al__table" style="margin-top: 12px">
      <el-table
        v-loading="loading"
        :data="list"
        row-key="id"
        stripe
        @sort-change="onSortChange"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="42" />
        <el-table-column label="告警信息" min-width="270">
          <template #default="{ row }">
            <div class="al__title" @click="openDetail(row)">
              <StatusTag :status="row.level" kind="alarmLevel" />
              <span class="al__titleText">{{ row.title }}</span>
            </div>
            <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.alarmNo }} · {{ row.type }}</div>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="96">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" :type="row.category === 'ai' ? 'warning' : row.category === 'device' ? 'primary' : 'info'">
              {{ row.category === 'ai' ? 'AI 事件' : row.category === 'device' ? '设备' : row.category === 'storage' ? '存储' : '网络' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设备 / 通道" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.deviceName }}</div>
            <div class="vc-text-tertiary" style="font-size: 11px">{{ row.region }}{{ row.channelNo ? ` · CH${String(row.channelNo).padStart(2, '0')}` : '' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="tenantName" label="所属租户" min-width="160" show-overflow-tooltip />
        <el-table-column label="置信度" width="100" sortable="custom" prop="confidence">
          <template #default="{ row }">
            <span v-if="row.confidence > 0" :style="{ color: row.confidence >= 0.9 ? '#52c41a' : row.confidence >= 0.75 ? '#faad14' : '#ff4d4f' }">
              {{ row.confidence.toFixed(3) }}
            </span>
            <span v-else class="vc-text-tertiary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="发生时间" width="160" sortable="custom" prop="occurTime">
          <template #default="{ row }">
            <div>{{ relativeTimeText(row.occurTime) }}</div>
            <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.occurTime.slice(5, 16) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="持续" width="100" sortable="custom" prop="duration">
          <template #default="{ row }">{{ row.duration ? formatDuration(row.duration) : '进行中' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" sortable="custom" prop="status">
          <template #default="{ row }"><StatusTag :status="row.status" kind="alarmStatus" /></template>
        </el-table-column>
        <el-table-column label="处理人" width="110">
          <template #default="{ row }">{{ row.handler || '-' }}</template>
        </el-table-column>
        <el-table-column label="关联工单" width="140">
          <template #default="{ row }">
            <el-button v-if="row.relatedWorkOrderId" link type="primary" size="small" @click="router.push('/service')">
              {{ row.relatedWorkOrderId }}
            </el-button>
            <span v-else class="vc-text-tertiary">未转单</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
            <el-button v-if="!row.relatedWorkOrderId" link type="warning" size="small" @click="openTransfer(row)">转工单</el-button>
            <el-button v-if="row.status !== 'closed'" link type="success" size="small" @click="alarmApi.handle(row.id, { status: 'resolved', remark: '列表快捷处理' }).then(() => { ElMessage.success('已标记解决'); load() })">解决</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <EmptyState description="没有符合条件的告警" tips="可调整筛选条件或时间范围" />
        </template>
      </el-table>
      <div class="al__pager">
        <el-pagination
          :current-page="page"
          :page-size="pageSize"
          :page-sizes="paginationSizes"
          :total="total"
          :layout="paginationLayout"
          background
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </div>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="告警详情" size="620px">
      <div v-if="detail.id" class="al__detail">
        <div class="al__detailHead">
          <StatusTag :status="detail.level" kind="alarmLevel" size="default" />
          <StatusTag :status="detail.status" kind="alarmStatus" size="default" />
          <span class="al__detailNo vc-mono">{{ detail.alarmNo }}</span>
          <el-button link type="primary" size="small" @click="copyText(detail.alarmNo, '告警编号已复制')">复制编号</el-button>
        </div>
        <h3 class="al__detailTitle">{{ detail.title }}</h3>

        <img v-if="detail.snapshotUrl" :src="detail.snapshotUrl" class="al__snapshot" alt="告警抓图" />
        <div v-else class="al__noSnap">该告警类型无抓图</div>

        <el-descriptions :column="2" border size="small" style="margin-top: 12px">
          <el-descriptions-item label="告警类型">{{ detail.type }}</el-descriptions-item>
          <el-descriptions-item label="来源分类">
            {{ detail.category === 'ai' ? 'AI 事件' : detail.category === 'device' ? '设备告警' : detail.category === 'storage' ? '存储告警' : '网络告警' }}
          </el-descriptions-item>
          <el-descriptions-item label="识别算法">{{ detail.algorithmName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="置信度">{{ detail.confidence ? detail.confidence.toFixed(3) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ formatDateTime(detail.occurTime) }}</el-descriptions-item>
          <el-descriptions-item label="恢复时间">{{ detail.recoverTime ? formatDateTime(detail.recoverTime) : '未恢复' }}</el-descriptions-item>
          <el-descriptions-item label="持续时长">{{ detail.duration ? formatDuration(detail.duration) : '进行中' }}</el-descriptions-item>
          <el-descriptions-item label="处理人">{{ detail.handler || '待认领' }}</el-descriptions-item>
          <el-descriptions-item label="处理时间">{{ detail.handleTime ? formatDateTime(detail.handleTime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="所在区域">{{ detail.region }}</el-descriptions-item>
          <el-descriptions-item label="告警描述" :span="2">{{ detail.description }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.handleRemark" label="处理说明" :span="2">{{ detail.handleRemark }}</el-descriptions-item>
        </el-descriptions>

        <div class="vc-panel-title" style="margin-top: 16px">关联设备</div>
        <el-descriptions v-if="detail.device" :column="1" border size="small">
          <el-descriptions-item label="设备名称">{{ detail.device.name }}</el-descriptions-item>
          <el-descriptions-item label="序列号"><span class="vc-mono">{{ detail.device.sn }}</span></el-descriptions-item>
          <el-descriptions-item label="安装地址">{{ detail.device.installAddress }}</el-descriptions-item>
          <el-descriptions-item label="在线状态"><StatusTag :status="detail.device.onlineStatus" kind="online" dot /></el-descriptions-item>
          <el-descriptions-item label="健康度">{{ detail.device.healthScore }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="detail.workOrder" class="al__order">
          <div class="vc-panel-title">关联工单</div>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="工单号">{{ detail.workOrder.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="处理人">{{ detail.workOrder.assignee || '待派单' }}</el-descriptions-item>
            <el-descriptions-item label="状态"><StatusTag :status="detail.workOrder.status" kind="workOrder" /></el-descriptions-item>
            <el-descriptions-item label="SLA 截止">{{ formatDateTime(detail.workOrder.slaDeadline) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <template #footer>
        <div class="al__handle">
          <el-select v-model="handleForm.status" style="width: 140px">
            <el-option v-for="s in ALARM_STATUS_OPTIONS.filter((x) => x.value !== 'pending')" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
          <el-input v-model="handleForm.remark" placeholder="填写处理说明（标记误报时必填）" />
          <el-button type="primary" :loading="handling" @click="submitHandle">提交处理</el-button>
        </div>
        <el-button style="margin-top: 10px; width: 100%" type="warning" plain :disabled="!!detail.relatedWorkOrderId" @click="openTransfer(detail)">
          {{ detail.relatedWorkOrderId ? '该告警已转工单' : '转为工单' }}
        </el-button>
      </template>
    </el-drawer>

    <!-- 转工单 -->
    <el-dialog v-model="transferVisible" title="告警转工单" width="620px">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 14px"
        :title="`本次将为 ${selectedIds.length} 条告警生成工单`"
        description="同一告警若已关联工单，将自动跳过不重复生成。",
      />
      <el-form :model="transferForm" label-width="100px">
        <el-form-item label="工单类型">
          <el-select v-model="transferForm.type" style="width: 100%">
            <el-option v-for="t in ['设备安装调试', '故障报修', '定期巡检', '系统升级', '使用培训', '驻场服务']" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="transferForm.priority" style="width: 100%">
            <el-option v-for="l in ALARM_LEVEL_OPTIONS" :key="l.value" :label="l.label" :value="l.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派工程师">
          <el-select v-model="transferForm.assignee" clearable filterable placeholder="留空则进入待派单池" style="width: 100%">
            <el-option v-for="e in engineers" :key="e.id" :label="`${e.name}（${e.level}，当前 ${e.currentLoad} 单）`" :value="e.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="transferForm.assigneePhone" placeholder="选填" />
        </el-form-item>
        <el-form-item label="问题描述">
          <el-input v-model="transferForm.description" type="textarea" :rows="3" placeholder="留空则自动生成（含告警编号、设备位置等信息）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTransfer">确认转单</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<style scoped>
.al__filter {
  padding: 14px 16px 4px;
}

.al__filter :deep(.el-form-item) {
  margin-bottom: 10px;
}

.al__charts {
  display: grid;
  grid-template-columns: 300px 1fr 340px;
  gap: 12px;
  margin-top: 12px;
}

.al__charts > .vc-card {
  padding: 14px;
  min-width: 0;
}

.al__batch {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  margin-top: 12px;
  border-radius: 8px;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  font-size: 13px;
  flex-wrap: wrap;
}

.al__table {
  padding: 0;
  overflow: hidden;
}

.al__title {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.al__titleText {
  font-size: 13px;
  font-weight: 500;
}

.al__titleText:hover {
  color: var(--el-color-primary);
}

.al__pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.al__detailHead {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.al__detailNo {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.al__detailTitle {
  margin: 10px 0 12px;
  font-size: 16px;
  font-weight: 500;
}

.al__snapshot {
  width: 100%;
  border-radius: 6px;
  display: block;
}

.al__noSnap {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.al__order {
  margin-top: 16px;
}

.al__handle {
  display: flex;
  gap: 8px;
}
</style>
