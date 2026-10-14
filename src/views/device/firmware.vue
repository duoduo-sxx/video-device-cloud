<script setup lang="ts">
/**
 * 固件仓库与 OTA 批量升级
 */
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deviceApi, firmwareApi } from '@/api'
import { useTable, paginationLayout, paginationSizes } from '@/composables/useTable'
import PageContainer from '@/components/PageContainer.vue'
import StatCard from '@/components/StatCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import BaseChart from '@/components/BaseChart.vue'
import { formatBytes, formatDateTime } from '@/utils/format'

const activeTab = ref('ota')

const firmwares = ref<any[]>([])
const fwKeyword = ref('')

const otaTable = useTable({
  api: firmwareApi.otaTasks as any,
  syncQuery: true,
  defaultParams: { keyword: '', status: '' }
})

const devices = ref<any[]>([])
const deviceKeyword = ref('')
const selectedDeviceIds = ref<string[]>([])

/* ---------- 升级向导 ---------- */
const wizardVisible = ref(false)
const wizardStep = ref(0)
const draft = ref<any>({ name: '', firmwareId: '', mode: 'immediate', startTime: '', strategy: 'batch', batchSize: 50, retry: 3 })

onMounted(async () => {
  await Promise.all([loadFirmwares(), loadDevices()])
})

async function loadFirmwares() {
  const res = await firmwareApi.list({ keyword: fwKeyword.value })
  firmwares.value = res.list || []
}

async function loadDevices() {
  const res = await deviceApi.list({ page: 1, pageSize: 200, keyword: deviceKeyword.value })
  devices.value = (res as any).list || []
}

const filteredFirmwares = computed(() => {
  const kw = fwKeyword.value.trim().toLowerCase()
  if (!kw) return firmwares.value
  return firmwares.value.filter((f) => [f.version, f.vendor, f.category].some((v: string) => String(v).toLowerCase().includes(kw)))
})

const stat = computed(() => {
  const list = otaTable.list.value as any[]
  return {
    total: otaTable.total.value,
    running: list.filter((o) => o.status === 'running').length,
    completed: list.filter((o) => o.status === 'completed').length,
    failed: list.filter((o) => o.status === 'failed').length
  }
})

const fwChart = computed(() => {
  const map = new Map<string, number>()
  ;(otaTable.list.value as any[]).forEach((o) => map.set(o.firmwareVersion, (map.get(o.firmwareVersion) || 0) + o.deviceCount))
  const arr = [...map.entries()].slice(0, 8)
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 12, right: 24, top: 24, bottom: 8, containLabel: true },
    xAxis: { type: 'value', name: '台' },
    yAxis: { type: 'category', data: arr.map((a) => a[0]) },
    series: [{ type: 'bar', barWidth: 14, itemStyle: { borderRadius: [0, 4, 4, 0] }, data: arr.map((a) => a[1]) }]
  }
})

function openWizard() {
  if (!selectedDeviceIds.value.length) {
    ElMessage.warning('请先在下方设备列表勾选待升级设备')
    return
  }
  if (!firmwares.value.length) {
    ElMessage.warning('固件仓库为空，无法发起升级')
    return
  }
  draft.value = { name: '', firmwareId: firmwares.value[0].id, mode: 'immediate', startTime: '', strategy: 'batch', batchSize: 50, retry: 3 }
  wizardStep.value = 0
  wizardVisible.value = true
}

async function submitWizard() {
  if (!draft.value.firmwareId) return ElMessage.warning('请选择目标固件版本')
  const fw = firmwares.value.find((f) => f.id === draft.value.firmwareId)
  const payload = {
    name: draft.value.name || `${fw?.vendor}${fw?.category}固件升级任务`,
    firmwareId: draft.value.firmwareId,
    deviceIds: selectedDeviceIds.value,
    mode: draft.value.mode,
    creator: '当前用户'
  }
  try {
    const res: any = await firmwareApi.createOta(payload)
    ElMessage.success(`OTA 任务已创建：${res.name}，覆盖 ${res.deviceCount} 台设备`)
    wizardVisible.value = false
    selectedDeviceIds.value = []
    otaTable.load()
  } catch {
    /* 已提示 */
  }
}

async function cancelTask(row: any) {
  await ElMessageBox.confirm(`确认中断 OTA 任务「${row.name}」？已升级完成的设备不会回滚。`, '中断升级任务', { type: 'warning' })
  ElMessage.success('升级任务已中断，剩余设备将保持当前版本')
}

function pushToDevices(row: any) {
  ElMessage.info(`已按任务「${row.name}」重新下发升级指令，失败设备将自动重试 ${row.failCount} 次`)
}

const deviceTable = computed(() => devices.value)

function toggleDevice(id: string) {
  const idx = selectedDeviceIds.value.indexOf(id)
  if (idx >= 0) selectedDeviceIds.value.splice(idx, 1)
  else selectedDeviceIds.value.push(id)
}

function toggleAllDevices() {
  if (selectedDeviceIds.value.length === deviceTable.value.length) selectedDeviceIds.value = []
  else selectedDeviceIds.value = deviceTable.value.map((d) => d.id)
}
</script>

<template>
  <PageContainer title="固件与 OTA 升级" subtitle="统一管理固件仓库，支持灰度分批、定时下发与失败重试">
    <template #header>
      <el-button :icon="'Refresh'" @click="otaTable.load">刷新</el-button>
      <el-button type="primary" :icon="'Upload'" @click="openWizard">发起升级（{{ selectedDeviceIds.length }}）</el-button>
    </template>

    <el-row :gutter="12">
      <el-col :span="6"><StatCard label="OTA 任务总数" :value="stat.total" icon="Upload" color="#1677ff" footer="全部历史任务" /></el-col>
      <el-col :span="6"><StatCard label="进行中" :value="stat.running" icon="Loading" color="#faad14" footer="正在下发/升级" /></el-col>
      <el-col :span="6"><StatCard label="已完成" :value="stat.completed" icon="CircleCheck" color="#52c41a" footer="全部设备升级成功" /></el-col>
      <el-col :span="6"><StatCard label="存在失败" :value="stat.failed" icon="WarningFilled" color="#ff4d4f" footer="需人工介入处理" /></el-col>
    </el-row>

    <el-tabs v-model="activeTab" style="margin-top: 12px">
      <el-tab-pane label="升级任务" name="ota">
        <div class="vc-card fw__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="otaTable.baseParams.value.keyword" placeholder="任务名 / 固件版本 / 创建人" clearable style="width: 240px" @keyup.enter="otaTable.search" />
            </el-form-item>
            <el-form-item label="任务状态">
              <el-select v-model="otaTable.baseParams.value.status" placeholder="全部" clearable style="width: 140px">
                <el-option label="进行中" value="running" />
                <el-option label="已完成" value="completed" />
                <el-option label="已失败" value="failed" />
                <el-option label="已暂停" value="paused" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="otaTable.search">查询</el-button>
              <el-button :icon="'RefreshLeft'" @click="otaTable.reset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="fw__grid">
          <div class="vc-card fw__table">
            <el-table v-loading="otaTable.loading.value" :data="otaTable.list.value" size="small" stripe>
              <el-table-column label="任务名称" min-width="230" show-overflow-tooltip>
                <template #default="{ row }">
                  <div>{{ row.name }}</div>
                  <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.id }} · {{ row.creator }}</div>
                </template>
              </el-table-column>
              <el-table-column label="固件版本" width="130">
                <template #default="{ row }"><span class="vc-mono">{{ row.firmwareVersion }}</span></template>
              </el-table-column>
              <el-table-column label="升级进度" min-width="200">
                <template #default="{ row }">
                  <el-progress
                    :percentage="row.deviceCount ? Math.round(((row.successCount + row.failCount) / row.deviceCount) * 100) : 0"
                    :stroke-width="10"
                    :status="row.failCount ? 'exception' : row.status === 'completed' ? 'success' : undefined"
                  />
                  <div class="fw__progress">
                    总数 {{ row.deviceCount }} · 成功 <b class="is-ok">{{ row.successCount }}</b> · 失败
                    <b class="is-err">{{ row.failCount }}</b> · 进行中 {{ row.runningCount }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="方式" width="90">
                <template #default="{ row }">{{ row.mode === 'immediate' ? '立即' : '定时' }}</template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }"><StatusTag :status="row.status" kind="task" /></template>
              </el-table-column>
              <el-table-column prop="startTime" label="开始时间" width="170" />
              <el-table-column label="失败原因" min-width="220">
                <template #default="{ row }">
                  <div v-for="f in row.failReasons || []" :key="f.reason" class="fw__reason">
                    <span>{{ f.reason }}</span><em>{{ f.count }} 台</em>
                  </div>
                  <span v-if="!row.failReasons?.length" class="vc-text-tertiary">-</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="pushToDevices(row)">重新下发</el-button>
                  <el-button v-if="row.status === 'running'" link type="danger" size="small" @click="cancelTask(row)">中断</el-button>
                </template>
              </el-table-column>
              <template #empty><EmptyState description="暂无升级任务" /></template>
            </el-table>
            <div class="fw__pager">
              <el-pagination
                :current-page="otaTable.page.value"
                :page-size="otaTable.pageSize.value"
                :page-sizes="paginationSizes"
                :total="otaTable.total.value"
                :layout="paginationLayout"
                background
                @current-change="otaTable.onPageChange"
                @size-change="otaTable.onSizeChange"
              />
            </div>
          </div>

          <div class="vc-card fw__side">
            <div class="vc-panel-title">各版本升级设备量</div>
            <BaseChart :option="fwChart" :height="230" :empty="!(otaTable.list.value as any[]).length" />
            <div class="vc-panel-title" style="margin-top: 14px">升级注意事项</div>
            <ul class="fw__tips">
              <li>升级过程设备会中断服务约 60~120 秒，建议在业务低峰期执行。</li>
              <li>跨大版本升级需先升级到中间版本，避免配置不兼容。</li>
              <li>批量升级默认按 10% 灰度分批下发，失败自动重试 3 次。</li>
              <li>升级前后系统会自动留存配置快照，可在设备详情页回滚。</li>
            </ul>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="固件仓库" name="repo">
        <div class="vc-card fw__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="fwKeyword" placeholder="版本号 / 厂商 / 适配类型" clearable style="width: 260px" @change="loadFirmwares" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="loadFirmwares">查询</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card">
          <el-table :data="filteredFirmwares" size="small" stripe>
            <el-table-column label="固件版本" width="150">
              <template #default="{ row }">
                <span class="vc-mono">{{ row.version }}</span>
                <el-tag v-if="row.version.includes('V6.2')" size="small" type="success" effect="plain" style="margin-left: 6px">最新</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="vendor" label="厂商" width="120" />
            <el-table-column prop="category" label="适配类型" width="140" />
            <el-table-column label="文件大小" width="110">
              <template #default="{ row }">{{ formatBytes(row.fileSize) }}</template>
            </el-table-column>
            <el-table-column prop="releaseDate" label="发布日期" width="120" />
            <el-table-column label="MD5" width="220">
              <template #default="{ row }"><span class="vc-mono" style="font-size: 11px">{{ row.md5 }}</span></template>
            </el-table-column>
            <el-table-column prop="changelog" label="更新说明" min-width="280" show-overflow-tooltip />
            <el-table-column prop="downloadCount" label="下载次数" width="100" />
            <template #empty><EmptyState description="没有匹配的固件" /></template>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="待升级设备" name="devices">
        <div class="vc-card fw__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="deviceKeyword" placeholder="设备名称 / SN / IP" clearable style="width: 240px" @keyup.enter="loadDevices" />
            </el-form-item>
            <el-form-item>
              <el-button :icon="'Search'" @click="loadDevices">查询</el-button>
              <el-button link type="primary" @click="toggleAllDevices">
                {{ selectedDeviceIds.length === deviceTable.length ? '取消全选' : '全选' }}
              </el-button>
              <span class="vc-text-tertiary" style="font-size: 12px">已选 {{ selectedDeviceIds.length }} 台</span>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card">
          <el-table :data="deviceTable" size="small" stripe height="440">
            <el-table-column width="46">
              <template #default="{ row }">
                <el-checkbox :model-value="selectedDeviceIds.includes(row.id)" @change="toggleDevice(row.id)" />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="设备名称" min-width="200" show-overflow-tooltip />
            <el-table-column label="SN" width="150">
              <template #default="{ row }"><span class="vc-mono">{{ row.sn }}</span></template>
            </el-table-column>
            <el-table-column prop="vendor" label="厂商" width="110" />
            <el-table-column label="当前固件" width="120">
              <template #default="{ row }"><span class="vc-mono">{{ row.firmware }}</span></template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><StatusTag :status="row.onlineStatus" kind="online" dot /></template>
            </el-table-column>
            <el-table-column prop="tenantName" label="所属租户" min-width="160" show-overflow-tooltip />
            <el-table-column label="最后心跳" width="160">
              <template #default="{ row }">{{ formatDateTime(row.lastHeartbeat) }}</template>
            </el-table-column>
            <template #empty><EmptyState description="没有匹配的设备" /></template>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 升级向导 -->
    <el-dialog v-model="wizardVisible" title="发起 OTA 升级" width="680px">
      <el-steps :active="wizardStep" align-center finish-status="success" style="margin-bottom: 20px">
        <el-step title="选择固件" />
        <el-step title="下发策略" />
        <el-step title="确认提交" />
      </el-steps>

      <div v-if="wizardStep === 0">
        <el-form label-width="100px">
          <el-form-item label="目标固件">
            <el-select v-model="draft.firmwareId" style="width: 100%">
              <el-option v-for="f in firmwares" :key="f.id" :label="`${f.version} · ${f.vendor} · ${f.category}`" :value="f.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="任务名称">
            <el-input v-model="draft.name" placeholder="留空则自动生成" />
          </el-form-item>
        </el-form>
        <el-alert type="info" :closable="false" show-icon title="待升级设备" :description="`本次将覆盖 ${selectedDeviceIds.length} 台设备，系统会逐台校验型号与硬件版本兼容性。`" />
      </div>

      <div v-else-if="wizardStep === 1">
        <el-form label-width="100px">
          <el-form-item label="下发方式">
            <el-radio-group v-model="draft.mode">
              <el-radio value="immediate">立即下发</el-radio>
              <el-radio value="scheduled">定时下发</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="draft.mode === 'scheduled'" label="执行时间">
            <el-date-picker v-model="draft.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择执行时间" style="width: 100%" />
          </el-form-item>
          <el-form-item label="分批策略">
            <el-radio-group v-model="draft.strategy">
              <el-radio value="batch">灰度分批</el-radio>
              <el-radio value="all">全量并行</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="draft.strategy === 'batch'" label="每批数量">
            <el-input-number v-model="draft.batchSize" :min="5" :max="500" :step="5" controls-position="right" />
          </el-form-item>
          <el-form-item label="失败重试">
            <el-input-number v-model="draft.retry" :min="0" :max="10" controls-position="right" />
            <span class="vc-text-tertiary" style="margin-left: 8px; font-size: 12px">次，间隔 30 秒</span>
          </el-form-item>
        </el-form>
      </div>

      <div v-else>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="任务名称">{{ draft.name || '（自动生成）' }}</el-descriptions-item>
          <el-descriptions-item label="目标固件">{{ firmwares.find((f) => f.id === draft.firmwareId)?.version }}</el-descriptions-item>
          <el-descriptions-item label="覆盖设备">{{ selectedDeviceIds.length }} 台</el-descriptions-item>
          <el-descriptions-item label="下发方式">{{ draft.mode === 'immediate' ? '立即下发' : `定时 ${draft.startTime}` }}</el-descriptions-item>
          <el-descriptions-item label="分批策略">{{ draft.strategy === 'batch' ? `灰度分批，每批 ${draft.batchSize} 台` : '全量并行' }}</el-descriptions-item>
          <el-descriptions-item label="失败重试">{{ draft.retry }} 次</el-descriptions-item>
        </el-descriptions>
        <el-alert style="margin-top: 12px" type="warning" :closable="false" show-icon title="请确认业务影响" description="升级期间对应通道视频将中断，平台会持续跟踪升级进度并在完成后自动恢复录像计划。" />
      </div>

      <template #footer>
        <el-button @click="wizardVisible = false">取消</el-button>
        <el-button v-if="wizardStep > 0" @click="wizardStep--">上一步</el-button>
        <el-button v-if="wizardStep < 2" type="primary" @click="wizardStep++">下一步</el-button>
        <el-button v-else type="primary" @click="submitWizard">确认提交</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<style scoped>
.fw__filter {
  padding: 14px 16px 4px;
  margin-bottom: 12px;
}

.fw__filter :deep(.el-form-item) {
  margin-bottom: 10px;
}

.fw__grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 12px;
}

.fw__table {
  padding: 0;
  overflow: hidden;
}

.fw__side {
  padding: 14px;
}

.fw__progress {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.fw__progress b.is-ok {
  color: var(--vc-success);
}

.fw__progress b.is-err {
  color: var(--vc-danger);
}

.fw__reason {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.fw__reason em {
  font-style: normal;
  color: var(--vc-danger);
}

.fw__tips {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.9;
}

.fw__pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
