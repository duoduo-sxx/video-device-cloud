<script setup lang="ts">
/**
 * 数据服务与开放平台：应用密钥 / API 目录与在线调试 / 调用统计 / 数据订阅 / 导出任务
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { openApi, tenantApi } from '@/api'
import { useTable, paginationLayout, paginationSizes } from '@/composables/useTable'
import PageContainer from '@/components/PageContainer.vue'
import StatCard from '@/components/StatCard.vue'
import BaseChart from '@/components/BaseChart.vue'
import JsonViewer from '@/components/JsonViewer.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { copyText, exportJson } from '@/utils/download'
import { formatDateTime, formatDuration, formatNumber, formatPercent } from '@/utils/format'

const activeTab = ref('app')

/* ---------- 应用管理 ---------- */
const appTable = useTable({
  api: openApi.apps as any,
  syncQuery: true,
  defaultParams: { keyword: '', status: '' }
})
const tenants = ref<any[]>([])

const appDialog = ref(false)
const appEditing = ref<any>(null)
const appForm = reactive<any>({ appName: '', tenantId: '', owner: '', qpsLimit: 100, ipWhitelist: [] as string[] })

const secretDialog = ref(false)
const newSecret = ref('')

async function openAppCreate() {
  appEditing.value = null
  Object.assign(appForm, { appName: '', tenantId: '', owner: '当前用户', qpsLimit: 100, ipWhitelist: [] })
  appDialog.value = true
}

function openAppEdit(row: any) {
  appEditing.value = row
  Object.assign(appForm, {
    appName: row.appName,
    tenantId: row.tenantId,
    owner: row.owner,
    qpsLimit: row.qpsLimit,
    ipWhitelist: [...(row.ipWhitelist || [])]
  })
  appDialog.value = true
}

async function submitApp() {
  if (!appForm.appName) return ElMessage.warning('请输入应用名称')
  if (!appForm.tenantId) return ElMessage.warning('请选择所属租户')
  try {
    if (appEditing.value) {
      await openApi.updateApp(appEditing.value.id, { ...appForm })
      ElMessage.success('应用信息已更新')
    } else {
      const res: any = await openApi.createApp({ ...appForm })
      newSecret.value = res.appSecret
      secretDialog.value = true
    }
    appDialog.value = false
    appTable.load()
  } catch {
    /* 已提示 */
  }
}

async function resetSecret(row: any) {
  await ElMessageBox.confirm(`重置后旧 AppSecret 立即失效，所有使用旧密钥的调用将返回 401。确认重置「${row.appName}」的密钥？`, '重置 AppSecret', { type: 'warning' })
  const res: any = await openApi.resetSecret(row.id)
  newSecret.value = res.appSecret
  secretDialog.value = true
  appTable.load()
}

async function toggleApp(row: any) {
  await openApi.toggleApp(row.id, row.status === 1 ? 0 : 1)
  ElMessage.success(row.status === 1 ? '应用已停用' : '应用已启用')
  appTable.load()
}

async function removeApp(row: any) {
  await ElMessageBox.confirm(`删除应用「${row.appName}」后其 AppKey 立即失效。确认删除？`, '删除应用', { type: 'warning' })
  await openApi.removeApp(row.id)
  ElMessage.success('应用已删除')
  appTable.load()
}

/* ---------- API 目录 & 调试 ---------- */
const endpoints = ref<any[]>([])
const endpointGroups = ref<string[]>([])
const activeGroup = ref('all')
const activeEndpoint = ref<any>(null)
const debugParams = ref<Record<string, any>>({})
const debugResult = ref<any>(null)
const debuging = ref(false)

async function loadEndpoints() {
  const res: any = await openApi.endpoints({ group: activeGroup.value })
  endpoints.value = res.list || []
  endpointGroups.value = res.groups || []
  if (!activeEndpoint.value && endpoints.value.length) selectEndpoint(endpoints.value[0])
}

function selectEndpoint(ep: any) {
  activeEndpoint.value = ep
  debugParams.value = {}
  debugResult.value = null
  ;(ep.params || []).forEach((p: any) => {
    if (p.name.toLowerCase().includes('page')) debugParams.value[p.name] = 1
    else if (p.name.toLowerCase().includes('size') || p.name.toLowerCase().includes('limit')) debugParams.value[p.name] = 20
    else debugParams.value[p.name] = ''
  })
}

async function runDebug() {
  if (!activeEndpoint.value) return
  debuging.value = true
  try {
    const res: any = await openApi.debug({ endpointId: activeEndpoint.value.id, params: { ...debugParams.value } })
    debugResult.value = res
  } finally {
    debuging.value = false
  }
}

/* ---------- 调用统计 ---------- */
const stats = ref<any>({})
async function loadStats() {
  stats.value = await openApi.stats(14)
}

const callTrendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['调用量', '失败量'], top: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
  grid: { left: 12, right: 20, top: 36, bottom: 8, containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: stats.value.dates || [] },
  yAxis: { type: 'value', name: '次' },
  series: [
    { name: '调用量', type: 'line', smooth: true, symbolSize: 4, areaStyle: { opacity: 0.16 }, data: stats.value.counts || [] },
    { name: '失败量', type: 'line', smooth: true, symbolSize: 4, itemStyle: { color: '#ff4d4f' }, areaStyle: { opacity: 0.1 }, data: stats.value.errors || [] }
  ]
}))

const epRankOption = computed(() => {
  const arr = (stats.value.topEndpoints || []).slice(0, 8).reverse()
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 12, right: 40, top: 12, bottom: 8, containLabel: true },
    xAxis: { type: 'value', name: '次' },
    yAxis: { type: 'category', data: arr.map((a: any) => a.name), axisLabel: { fontSize: 11 } },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        itemStyle: { borderRadius: [0, 4, 4, 0], color: '#1677ff' },
        label: { show: true, position: 'right', fontSize: 11 },
        data: arr.map((a: any) => a.count)
      }
    ]
  }
})

const errorCodeOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  series: [
    {
      type: 'pie',
      radius: ['46%', '68%'],
      center: ['50%', '42%'],
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12, formatter: '{b}\n{c} 次' } },
      data: (stats.value.errorCodes || []).map((i: any) => ({ name: `HTTP ${i.name}`, value: i.value }))
    }
  ]
}))

/* ---------- 调用日志 ---------- */
const logTable = useTable({
  api: openApi.callLogs as any,
  defaultParams: { keyword: '', appId: '', method: '', statusCode: '' }
})

/* ---------- 数据订阅 ---------- */
const webhookTable = useTable({
  api: openApi.webhooks as any,
  defaultParams: { keyword: '', status: '' }
})
const whDialog = ref(false)
const whEditing = ref<any>(null)
const whForm = reactive<any>({ name: '', url: '', events: [] as string[], retryPolicy: '失败重试 3 次，间隔 5s', status: 1 })
const EVENT_OPTIONS = ['告警产生', '告警恢复', '工单创建', '工单完成', '设备上下线', 'AI 识别事件', '存储水位告警', '录像归档完成']

const whDetailVisible = ref(false)
const whDetail = ref<any>(null)

function openWhCreate() {
  whEditing.value = null
  Object.assign(whForm, { name: '', url: '', events: [], retryPolicy: '失败重试 3 次，间隔 5s', status: 1 })
  whDialog.value = true
}

async function openWhEdit(row: any) {
  whEditing.value = row
  const detail: any = await openApi.webhookDetail(row.id)
  Object.assign(whForm, {
    name: detail.name,
    url: detail.url,
    events: [...(detail.events || [])],
    retryPolicy: detail.retryPolicy,
    status: detail.status
  })
  whDialog.value = true
}

async function submitWh() {
  if (!whForm.name) return ElMessage.warning('请输入订阅名称')
  if (!/^https?:\/\/.+/.test(whForm.url)) return ElMessage.warning('回调地址必须以 http:// 或 https:// 开头')
  if (!whForm.events.length) return ElMessage.warning('请至少订阅一个事件类型')
  try {
    if (whEditing.value) {
      await openApi.updateWebhook(whEditing.value.id, { ...whForm })
      ElMessage.success('订阅配置已更新')
    } else {
      await openApi.createWebhook({ ...whForm })
      ElMessage.success('订阅已创建，Secret 已自动生成')
    }
    whDialog.value = false
    webhookTable.load()
  } catch {
    /* 已提示 */
  }
}

async function testWh(row: any) {
  const res: any = await openApi.testWebhook(row.id)
  if (res.success) ElMessage.success(res.message)
  else ElMessage.error(res.message)
  webhookTable.load()
}

async function openWhDetail(row: any) {
  whDetail.value = await openApi.webhookDetail(row.id)
  whDetailVisible.value = true
}

async function retryPush(record: any) {
  const res: any = await openApi.retryPush(whDetail.value.id, record.id)
  ElMessage.success(res.message)
  whDetail.value = await openApi.webhookDetail(whDetail.value.id)
}

async function removeWh(row: any) {
  await ElMessageBox.confirm(`删除订阅「${row.name}」后，平台将不再向其推送事件。确认删除？`, '删除数据订阅', { type: 'warning' })
  await openApi.removeWebhook(row.id)
  ElMessage.success('订阅已删除')
  webhookTable.load()
}

/* ---------- 导出任务 ---------- */
const exportTable = useTable({
  api: openApi.exports as any,
  defaultParams: { status: '' }
})
const expDialog = ref(false)
const expForm = reactive<any>({ dataType: '设备台账', conditions: '全部数据', creator: '当前用户' })
const DATA_TYPES = ['设备台账', '告警记录', '录像清单', 'AI 识别事件', '工单台账', '存储用量', 'API 调用日志', '操作审计日志']

async function submitExport() {
  try {
    const res: any = await openApi.createExport({ ...expForm })
    ElMessage.success(`导出任务已创建：${res.name}，完成后可在任务列表下载`)
    expDialog.value = false
    exportTable.load()
  } catch {
    /* 已提示 */
  }
}

async function removeExport(row: any) {
  await ElMessageBox.confirm(`确认删除导出任务「${row.name}」？`, '删除导出任务', { type: 'warning' })
  await openApi.removeExport(row.id)
  ElMessage.success('任务已删除')
  exportTable.load()
}

function downloadExport(row: any) {
  exportJson(`导出任务_${row.name}`, {
    任务名称: row.name,
    数据类型: row.dataType,
    筛选条件: row.conditions,
    行数: row.rowCount,
    状态: row.status,
    创建人: row.creator,
    创建时间: row.createTime,
    说明: '导出文件由本地数据服务生成，生产环境将输出 CSV/XLSX 压缩包'
  })
}

onMounted(async () => {
  const t = await tenantApi.list({ page: 1, pageSize: 100 })
  tenants.value = (t as any).list || []
  await Promise.all([loadEndpoints(), loadStats()])
})
</script>

<template>
  <PageContainer title="数据服务与开放平台" subtitle="应用密钥、API 目录与在线调试、调用统计与事件订阅">
    <template #header>
      <el-button :icon="'Refresh'" @click="() => { loadStats(); appTable.load() }">刷新</el-button>
      <el-button type="primary" :icon="'Plus'" @click="openAppCreate">创建应用</el-button>
    </template>

    <el-row :gutter="12">
      <el-col :span="4"><StatCard label="近 14 天调用量" :value="stats.total || 0" icon="Connection" color="#1677ff" :footer="`日均 QPS ${stats.qps || 0}`" /></el-col>
      <el-col :span="4"><StatCard label="调用成功率" :value="stats.successRate || 100" unit="%" :decimals="2" icon="CircleCheck" color="#52c41a" footer="全部接口" /></el-col>
      <el-col :span="4"><StatCard label="平均响应" :value="stats.avgDuration || 0" unit="ms" icon="Timer" color="#13c2c2" :footer="`P95 ${stats.p95Duration || 0} ms`" /></el-col>
      <el-col :span="4"><StatCard label="已接入应用" :value="appTable.total.value" icon="Grid" color="#722ed1" footer="含已停用" /></el-col>
      <el-col :span="4"><StatCard label="开放接口" :value="endpoints.length" icon="Document" color="#eb2f96" footer="当前分组口径" /></el-col>
      <el-col :span="4"><StatCard label="事件订阅" :value="webhookTable.total.value" icon="Bell" color="#faad14" footer="Webhook 推送" /></el-col>
    </el-row>

    <el-tabs v-model="activeTab" style="margin-top: 12px">
      <!-- 应用管理 -->
      <el-tab-pane label="应用管理" name="app">
        <div class="vc-card op__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="appTable.baseParams.value.keyword" placeholder="应用名称 / AppKey / 负责人" clearable style="width: 240px" @keyup.enter="appTable.search" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="appTable.baseParams.value.status" placeholder="全部" clearable style="width: 130px">
                <el-option label="已启用" value="1" />
                <el-option label="已停用" value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="appTable.search">查询</el-button>
              <el-button :icon="'RefreshLeft'" @click="appTable.reset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card op__table">
          <el-table v-loading="appTable.loading.value" :data="appTable.list.value" stripe>
            <el-table-column label="应用名称" min-width="200">
              <template #default="{ row }">
                <div style="font-weight: 500">{{ row.appName }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.id }} · {{ row.owner }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="tenantName" label="所属租户" min-width="170" show-overflow-tooltip />
            <el-table-column label="AppKey" min-width="230">
              <template #default="{ row }">
                <span class="vc-mono" style="font-size: 11px">{{ row.appKey }}</span>
                <el-button link type="primary" size="small" @click="copyText(row.appKey, 'AppKey 已复制')">复制</el-button>
              </template>
            </el-table-column>
            <el-table-column label="AppSecret" width="220">
              <template #default="{ row }">
                <span class="vc-mono" style="font-size: 11px">{{ row.appSecret }}</span>
              </template>
            </el-table-column>
            <el-table-column label="IP 白名单" min-width="160">
              <template #default="{ row }">
                <span v-if="!row.ipWhitelist?.length" class="vc-text-tertiary">不限</span>
                <el-tag v-for="ip in row.ipWhitelist" :key="ip" size="small" effect="plain" style="margin: 1px">{{ ip }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="QPS 上限" width="100">
              <template #default="{ row }">{{ row.qpsLimit }}</template>
            </el-table-column>
            <el-table-column label="调用量 7d/30d" width="150">
              <template #default="{ row }">
                <div>{{ formatNumber(row.callCount7d) }}</div>
                <div class="vc-text-tertiary" style="font-size: 11px">{{ formatNumber(row.callCount30d) }}</div>
              </template>
            </el-table-column>
            <el-table-column label="成功率" width="110" sortable :sort-method="(a: any, b: any) => a.successRate - b.successRate">
              <template #default="{ row }">
                <span :style="{ color: row.successRate >= 99 ? '#52c41a' : row.successRate >= 95 ? '#faad14' : '#ff4d4f' }">{{ formatPercent(row.successRate, 2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-switch :model-value="row.status === 1" @change="toggleApp(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openAppEdit(row)">编辑</el-button>
                <el-button link type="warning" size="small" @click="resetSecret(row)">重置密钥</el-button>
                <el-button link type="danger" size="small" @click="removeApp(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="暂无应用" action-text="创建应用" @action="openAppCreate" /></template>
          </el-table>
          <div class="op__pager">
            <el-pagination
              :current-page="appTable.page.value"
              :page-size="appTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="appTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="appTable.onPageChange"
              @size-change="appTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- API 调试台 -->
      <el-tab-pane label="API 目录与调试" name="debug">
        <div class="op__debug">
          <div class="vc-card op__epList">
            <div class="vc-panel-title">接口目录</div>
            <el-select v-model="activeGroup" size="small" style="width: 100%; margin-bottom: 8px" @change="loadEndpoints">
              <el-option label="全部分组" value="all" />
              <el-option v-for="g in endpointGroups" :key="g" :label="g" :value="g" />
            </el-select>
            <div class="op__epScroll">
              <div
                v-for="ep in endpoints"
                :key="ep.id"
                class="op__epItem"
                :class="{ 'is-active': activeEndpoint?.id === ep.id }"
                @click="selectEndpoint(ep)"
              >
                <el-tag size="small" :type="ep.method === 'GET' ? 'success' : ep.method === 'POST' ? 'primary' : ep.method === 'PUT' ? 'warning' : 'danger'" effect="plain">
                  {{ ep.method }}
                </el-tag>
                <div class="op__epBody">
                  <div class="op__epName">{{ ep.name }}</div>
                  <div class="op__epPath vc-mono">{{ ep.path }}</div>
                </div>
              </div>
              <EmptyState v-if="!endpoints.length" description="暂无接口" />
            </div>
          </div>

          <div class="op__debugMain">
            <div v-if="activeEndpoint" class="vc-card op__epInfo">
              <div class="op__epHead">
                <el-tag :type="activeEndpoint.method === 'GET' ? 'success' : 'primary'" effect="dark">{{ activeEndpoint.method }}</el-tag>
                <span class="vc-mono" style="font-size: 13px">{{ activeEndpoint.path }}</span>
                <el-tag size="small" effect="plain" type="info">{{ activeEndpoint.group }}</el-tag>
                <el-tag size="small" :type="activeEndpoint.auth ? 'warning' : 'success'" effect="plain">{{ activeEndpoint.auth ? '需鉴权' : '公开' }}</el-tag>
              </div>
              <div class="vc-text-secondary" style="font-size: 12px; margin-top: 8px">{{ activeEndpoint.description }}</div>
            </div>

            <div v-if="activeEndpoint" class="vc-card op__params">
              <div class="vc-panel-title">请求参数</div>
              <el-table :data="activeEndpoint.params || []" size="small" border>
                <el-table-column prop="name" label="参数名" width="150">
                  <template #default="{ row }"><span class="vc-mono">{{ row.name }}</span></template>
                </el-table-column>
                <el-table-column prop="type" label="类型" width="100" />
                <el-table-column label="必填" width="80">
                  <template #default="{ row }">
                    <el-tag size="small" :type="row.required ? 'danger' : 'info'" effect="plain">{{ row.required ? '必填' : '可选' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="说明" min-width="200" />
                <el-table-column label="取值" width="220">
                  <template #default="{ row }">
                    <el-input v-model="debugParams[row.name]" size="small" :placeholder="row.type" />
                  </template>
                </el-table-column>
                <template #empty><EmptyState description="该接口无需参数" /></template>
              </el-table>
              <div class="op__debugBtn">
                <el-button type="primary" :icon="'VideoPlay'" :loading="debuging" @click="runDebug">发送请求</el-button>
                <el-button :icon="'Delete'" @click="debugResult = null">清空结果</el-button>
              </div>
            </div>

            <div v-if="debugResult" class="vc-card op__result">
              <div class="vc-panel-title">
                响应结果
                <el-tag size="small" :type="debugResult.statusCode === 200 ? 'success' : 'danger'" effect="plain" style="margin-left: 8px">
                  HTTP {{ debugResult.statusCode }}
                </el-tag>
                <el-tag size="small" effect="plain" type="info" style="margin-left: 4px">{{ debugResult.duration }} ms</el-tag>
                <el-tag v-if="debugResult.requestId" size="small" effect="plain" type="info" style="margin-left: 4px">{{ debugResult.requestId }}</el-tag>
              </div>
              <div v-if="debugResult.requestUrl" class="op__reqUrl vc-mono">{{ debugResult.requestUrl }}</div>
              <JsonViewer :data="debugResult.body" />
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 调用统计 -->
      <el-tab-pane label="调用统计" name="stat">
        <div class="op__statRow">
          <div class="vc-card op__statWide">
            <div class="vc-panel-title">近 14 天调用量与失败量</div>
            <BaseChart :option="callTrendOption" :height="250" />
          </div>
          <div class="vc-card">
            <div class="vc-panel-title">失败状态码分布</div>
            <BaseChart :option="errorCodeOption" :height="250" :empty="!(stats.errorCodes || []).length" />
          </div>
        </div>
        <div class="op__statRow" style="grid-template-columns: 1fr 1fr; margin-top: 12px">
          <div class="vc-card">
            <div class="vc-panel-title">接口调用 TOP8</div>
            <BaseChart :option="epRankOption" :height="250" />
          </div>
          <div class="vc-card">
            <div class="vc-panel-title">应用调用量排名</div>
            <el-table :data="stats.topApps || []" size="small" stripe>
              <el-table-column type="index" label="#" width="60" />
              <el-table-column prop="name" label="应用名称" min-width="200" show-overflow-tooltip />
              <el-table-column label="调用量" width="130" sortable :sort-method="(a: any, b: any) => a.value - b.value">
                <template #default="{ row }"><b>{{ formatNumber(row.value) }}</b></template>
              </el-table-column>
              <el-table-column label="占比" min-width="180">
                <template #default="{ row }">
                  <el-progress :percentage="Math.min(100, Math.round((row.value / Math.max(1, stats.topApps?.[0]?.value || 1)) * 100))" :stroke-width="8" :show-text="false" />
                </template>
              </el-table-column>
              <template #empty><EmptyState description="暂无调用数据" /></template>
            </el-table>
          </div>
        </div>

        <div class="vc-card op__filter" style="margin-top: 12px">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="logTable.baseParams.value.keyword" placeholder="路径 / 应用 / IP" clearable style="width: 220px" @keyup.enter="logTable.search" />
            </el-form-item>
            <el-form-item label="请求方法">
              <el-select v-model="logTable.baseParams.value.method" placeholder="全部" clearable style="width: 120px">
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
                <el-option label="PUT" value="PUT" />
                <el-option label="DELETE" value="DELETE" />
              </el-select>
            </el-form-item>
            <el-form-item label="响应状态">
              <el-select v-model="logTable.baseParams.value.statusCode" placeholder="全部" clearable style="width: 140px">
                <el-option label="成功(200)" value="200" />
                <el-option label="失败(非 200)" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="logTable.search">查询</el-button>
              <el-button :icon="'Download'" @click="logTable.exportData([
                { key: 'createTime', label: '调用时间' },
                { key: 'appName', label: '应用' },
                { key: 'method', label: '方法' },
                { key: 'path', label: '路径' },
                { key: 'statusCode', label: '状态码' },
                { key: 'duration', label: '耗时(ms)' },
                { key: 'ip', label: '来源 IP' }
              ], 'API调用日志')">导出日志</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card op__table">
          <el-table v-loading="logTable.loading.value" :data="logTable.list.value" size="small" stripe>
            <el-table-column prop="createTime" label="调用时间" width="170" />
            <el-table-column prop="appName" label="应用" min-width="170" show-overflow-tooltip />
            <el-table-column label="方法" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.method === 'GET' ? 'success' : row.method === 'POST' ? 'primary' : 'warning'" effect="plain">{{ row.method }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="请求路径" min-width="280">
              <template #default="{ row }"><span class="vc-mono" style="font-size: 12px">{{ row.path }}</span></template>
            </el-table-column>
            <el-table-column label="状态码" width="100">
              <template #default="{ row }">
                <span :style="{ color: row.statusCode === 200 ? '#52c41a' : '#ff4d4f', fontWeight: 500 }">{{ row.statusCode }}</span>
              </template>
            </el-table-column>
            <el-table-column label="耗时" width="100" sortable :sort-method="(a: any, b: any) => a.duration - b.duration">
              <template #default="{ row }">
                <span :style="{ color: row.duration > 500 ? '#ff4d4f' : row.duration > 200 ? '#faad14' : undefined }">{{ row.duration }} ms</span>
              </template>
            </el-table-column>
            <el-table-column prop="ip" label="来源 IP" width="150">
              <template #default="{ row }"><span class="vc-mono" style="font-size: 12px">{{ row.ip }}</span></template>
            </el-table-column>
            <template #empty><EmptyState description="暂无调用日志" /></template>
          </el-table>
          <div class="op__pager">
            <el-pagination
              :current-page="logTable.page.value"
              :page-size="logTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="logTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="logTable.onPageChange"
              @size-change="logTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 数据订阅 -->
      <el-tab-pane label="数据订阅" name="webhook">
        <div class="vc-card op__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="webhookTable.baseParams.value.keyword" placeholder="订阅名称 / 回调地址" clearable style="width: 240px" @keyup.enter="webhookTable.search" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="webhookTable.baseParams.value.status" placeholder="全部" clearable style="width: 130px">
                <el-option label="已启用" value="1" />
                <el-option label="已停用" value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="webhookTable.search">查询</el-button>
              <el-button type="primary" plain :icon="'Plus'" @click="openWhCreate">新建订阅</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card op__table">
          <el-table v-loading="webhookTable.loading.value" :data="webhookTable.list.value" stripe>
            <el-table-column label="订阅名称" min-width="200">
              <template #default="{ row }">
                <div style="font-weight: 500">{{ row.name }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.id }} · {{ formatDateTime(row.createTime) }}</div>
              </template>
            </el-table-column>
            <el-table-column label="回调地址" min-width="260" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="vc-mono" style="font-size: 11px">{{ row.url }}</span>
                <el-button link type="primary" size="small" @click="copyText(row.url, '回调地址已复制')">复制</el-button>
              </template>
            </el-table-column>
            <el-table-column label="订阅事件" min-width="240">
              <template #default="{ row }">
                <el-tag v-for="e in (row.events || []).slice(0, 3)" :key="e" size="small" effect="plain" style="margin: 1px 3px 1px 0">{{ e }}</el-tag>
                <span v-if="(row.events || []).length > 3" class="vc-text-tertiary" style="font-size: 11px">+{{ row.events.length - 3 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="推送 / 失败" width="130">
              <template #default="{ row }">
                <span>{{ row.pushCount || 0 }}</span>
                <span v-if="row.failCount" class="op__fail"> / {{ row.failCount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="retryPolicy" label="重试策略" min-width="200" show-overflow-tooltip />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 1 ? 'success' : 'info'" effect="plain">{{ row.status === 1 ? '已启用' : '已停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="210" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openWhDetail(row)">推送记录</el-button>
                <el-button link type="success" size="small" @click="testWh(row)">测试</el-button>
                <el-button link type="primary" size="small" @click="openWhEdit(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="removeWh(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="暂无数据订阅" action-text="新建订阅" @action="openWhCreate" /></template>
          </el-table>
          <div class="op__pager">
            <el-pagination
              :current-page="webhookTable.page.value"
              :page-size="webhookTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="webhookTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="webhookTable.onPageChange"
              @size-change="webhookTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 导出任务 -->
      <el-tab-pane label="导出任务" name="export">
        <div class="vc-card op__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="状态">
              <el-select v-model="exportTable.baseParams.value.status" placeholder="全部" clearable style="width: 140px" @change="exportTable.search">
                <el-option label="执行中" value="running" />
                <el-option label="已完成" value="completed" />
                <el-option label="失败" value="failed" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" plain :icon="'Plus'" @click="expDialog = true">新建导出任务</el-button>
              <span class="vc-text-tertiary" style="font-size: 12px">大数据量导出在后台执行，完成后可下载</span>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card op__table">
          <el-table v-loading="exportTable.loading.value" :data="exportTable.list.value" stripe>
            <el-table-column label="任务名称" min-width="240" show-overflow-tooltip>
              <template #default="{ row }">
                <div>{{ row.name }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.id }} · {{ row.creator }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="dataType" label="数据类型" width="150" />
            <el-table-column prop="conditions" label="筛选条件" min-width="200" show-overflow-tooltip />
            <el-table-column label="数据量" width="140">
              <template #default="{ row }">
                <div>{{ formatNumber(row.rowCount) }} 行</div>
                <div class="vc-text-tertiary" style="font-size: 11px">{{ ((row.fileSize || 0) / 1024).toFixed(1) }} MB</div>
              </template>
            </el-table-column>
            <el-table-column label="进度" min-width="180">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :stroke-width="9" :status="row.status === 'failed' ? 'exception' : row.status === 'completed' ? 'success' : undefined" />
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }"><StatusTag :status="row.status" kind="task" /></template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="170" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === 'completed'" link type="primary" size="small" @click="downloadExport(row)">下载</el-button>
                <el-button link type="danger" size="small" @click="removeExport(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="暂无导出任务" action-text="新建导出任务" @action="expDialog = true" /></template>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 应用表单 -->
    <el-dialog v-model="appDialog" :title="appEditing ? '编辑应用' : '创建应用'" width="600px">
      <el-form :model="appForm" label-width="110px">
        <el-form-item label="应用名称" required>
          <el-input v-model="appForm.appName" placeholder="如：智慧园区综合管理平台" />
        </el-form-item>
        <el-form-item label="所属租户" required>
          <el-select v-model="appForm.tenantId" filterable placeholder="选择租户" style="width: 100%">
            <el-option v-for="t in tenants" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="appForm.owner" />
        </el-form-item>
        <el-form-item label="QPS 上限">
          <el-input-number v-model="appForm.qpsLimit" :min="1" :max="100000" :step="50" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="IP 白名单">
          <el-select v-model="appForm.ipWhitelist" multiple allow-create filterable default-first-option placeholder="输入 IP 后回车，留空表示不限制" style="width: 100%" />
        </el-form-item>
      </el-form>
      <el-alert type="warning" :closable="false" show-icon title="密钥安全提示" description="AppSecret 仅在创建或重置时展示一次，请立即保存到安全位置。平台不会明文存储，遗失只能重置。" />
      <template #footer>
        <el-button @click="appDialog = false">取消</el-button>
        <el-button type="primary" @click="submitApp">{{ appEditing ? '保存修改' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 密钥展示 -->
    <el-dialog v-model="secretDialog" title="请立即保存 AppSecret" width="560px" :close-on-click-modal="false">
      <el-alert type="error" :closable="false" show-icon title="此密钥仅展示一次" description="关闭本窗口后将无法再次查看，只能通过重置生成新密钥（旧密钥立即失效）。" />
      <div class="op__secret">
        <span class="vc-mono">{{ newSecret }}</span>
        <el-button type="primary" size="small" @click="copyText(newSecret, 'AppSecret 已复制到剪贴板')">复制</el-button>
      </div>
      <template #footer>
        <el-button type="primary" @click="secretDialog = false">我已保存</el-button>
      </template>
    </el-dialog>

    <!-- 订阅表单 -->
    <el-dialog v-model="whDialog" :title="whEditing ? '编辑数据订阅' : '新建数据订阅'" width="620px">
      <el-form :model="whForm" label-width="110px">
        <el-form-item label="订阅名称" required>
          <el-input v-model="whForm.name" placeholder="如：告警事件推送到客户工单系统" />
        </el-form-item>
        <el-form-item label="回调地址" required>
          <el-input v-model="whForm.url" placeholder="https://your-domain.com/api/webhook" class="vc-mono" />
        </el-form-item>
        <el-form-item label="订阅事件" required>
          <el-select v-model="whForm.events" multiple placeholder="选择需要推送的事件类型" style="width: 100%">
            <el-option v-for="e in EVENT_OPTIONS" :key="e" :label="e" :value="e" />
          </el-select>
        </el-form-item>
        <el-form-item label="重试策略">
          <el-input v-model="whForm.retryPolicy" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="whForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="whDialog = false">取消</el-button>
        <el-button type="primary" @click="submitWh">{{ whEditing ? '保存修改' : '创建订阅' }}</el-button>
      </template>
    </el-dialog>

    <!-- 推送记录 -->
    <el-drawer v-model="whDetailVisible" title="推送记录" size="720px">
      <div v-if="whDetail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订阅名称">{{ whDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag size="small" :type="whDetail.status === 1 ? 'success' : 'info'" effect="plain">{{ whDetail.status === 1 ? '已启用' : '已停用' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="回调地址" :span="2"><span class="vc-mono" style="font-size: 12px">{{ whDetail.url }}</span></el-descriptions-item>
          <el-descriptions-item label="订阅事件" :span="2">
            <el-tag v-for="e in whDetail.events" :key="e" size="small" effect="plain" style="margin: 1px 3px 1px 0">{{ e }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="签名密钥" :span="2">
            <span class="vc-mono" style="font-size: 12px">{{ whDetail.secret }}</span>
            <el-button link type="primary" size="small" @click="copyText(whDetail.secret, '签名密钥已复制')">复制</el-button>
          </el-descriptions-item>
        </el-descriptions>

        <div class="vc-panel-title" style="margin-top: 16px">推送历史（{{ (whDetail.pushRecords || []).length }}）</div>
        <el-table :data="whDetail.pushRecords || []" size="small" stripe>
          <el-table-column prop="id" label="记录号" width="140" />
          <el-table-column prop="event" label="事件" width="130" />
          <el-table-column prop="time" label="推送时间" width="170" />
          <el-table-column label="HTTP" width="90">
            <template #default="{ row }">
              <span :style="{ color: row.httpStatus === 200 ? '#52c41a' : '#ff4d4f' }">{{ row.httpStatus }}</span>
            </template>
          </el-table-column>
          <el-table-column label="耗时" width="90">
            <template #default="{ row }">{{ row.duration }} ms</template>
          </el-table-column>
          <el-table-column prop="retryCount" label="重试次数" width="100" />
          <el-table-column label="结果" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="row.result === 'success' ? 'success' : 'danger'" effect="plain">{{ row.result === 'success' ? '成功' : '失败' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90">
            <template #default="{ row }">
              <el-button v-if="row.result === 'fail'" link type="primary" size="small" @click="retryPush(row)">重推</el-button>
            </template>
          </el-table-column>
          <template #empty><EmptyState description="暂无推送记录" /></template>
        </el-table>
      </div>
    </el-drawer>

    <!-- 导出任务表单 -->
    <el-dialog v-model="expDialog" title="新建导出任务" width="560px">
      <el-form :model="expForm" label-width="110px">
        <el-form-item label="数据类型" required>
          <el-select v-model="expForm.dataType" style="width: 100%">
            <el-option v-for="t in DATA_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="筛选条件">
          <el-input v-model="expForm.conditions" type="textarea" :rows="3" placeholder="如：租户=某某集团，时间范围 2026-01-01 ~ 2026-03-31" />
        </el-form-item>
      </el-form>
      <el-alert type="info" :closable="false" show-icon title="导出说明" description="单次导出上限 50 万行，超出请拆分条件。导出文件保留 7 天，过期自动清理。" />
      <template #footer>
        <el-button @click="expDialog = false">取消</el-button>
        <el-button type="primary" @click="submitExport">创建任务</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<style scoped>
.op__filter {
  padding: 14px 16px 4px;
  margin-bottom: 12px;
}

.op__filter :deep(.el-form-item) {
  margin-bottom: 10px;
}

.op__table {
  padding: 0;
  overflow: hidden;
}

.op__pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.op__debug {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 12px;
}

.op__epList {
  padding: 14px;
  min-width: 0;
}

.op__epScroll {
  max-height: 620px;
  overflow: auto;
}

.op__epItem {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  align-items: flex-start;
}

.op__epItem:hover {
  background: var(--el-fill-color-light);
}

.op__epItem.is-active {
  background: var(--el-color-primary-light-9);
}

.op__epBody {
  min-width: 0;
  flex: 1;
}

.op__epName {
  font-size: 12px;
  font-weight: 500;
}

.op__epPath {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.op__debugMain {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.op__epInfo,
.op__params,
.op__result {
  padding: 14px;
}

.op__epHead {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.op__debugBtn {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.op__reqUrl {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: 6px 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  margin-bottom: 10px;
  word-break: break-all;
}

.op__statRow {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

.op__statRow > .vc-card {
  padding: 14px;
  min-width: 0;
}

.op__statWide {
  min-width: 0;
}

.op__fail {
  color: var(--vc-danger);
}

.op__secret {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  margin-top: 14px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
}

.op__secret span {
  flex: 1;
  font-size: 14px;
  word-break: break-all;
  color: var(--vc-danger);
}
</style>
