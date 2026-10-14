<script setup lang="ts">
/**
 * 视频与流媒体：实时预览通道墙 / 转码模板 / 视频质量诊断 / 直播频道分享
 */
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { channelApi, deviceApi, videoApi } from '@/api'
import { useTable, paginationLayout, paginationSizes } from '@/composables/useTable'
import PageContainer from '@/components/PageContainer.vue'
import VideoPlayer from '@/components/VideoPlayer.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import BaseChart from '@/components/BaseChart.vue'
import { copyText } from '@/utils/download'
import { formatDateTime, formatDuration, formatNumber } from '@/utils/format'
import { ALARM_LEVEL_OPTIONS } from '@/utils/dict'

const activeTab = ref('live')

/* ---------- 实时预览 ---------- */
const channels = ref<any[]>([])
const channelKeyword = ref('')
const gridLayout = ref<1 | 4 | 9>(4)
const playingChannels = ref<any[]>([])
const mainChannel = ref<any>(null)
const tourRunning = ref(false)
let tourTimer: number | null = null

const filteredChannels = computed(() => {
  const kw = channelKeyword.value.trim().toLowerCase()
  const list = kw ? channels.value.filter((c) => [c.name, c.deviceName].some((v: string) => String(v).toLowerCase().includes(kw))) : channels.value
  return list
})

const onlineChannels = computed(() => channels.value.filter((c) => c.onlineStatus === 'online'))

async function loadChannels() {
  const res: any = await channelApi.list({ page: 1, pageSize: 60 })
  channels.value = res.list || []
  if (!playingChannels.value.length) {
    playingChannels.value = channels.value.slice(0, gridLayout.value)
    mainChannel.value = playingChannels.value[0] || null
  }
}

function setGrid(n: 1 | 4 | 9) {
  gridLayout.value = n
  playingChannels.value = channels.value.slice(0, n)
}

function playChannel(ch: any) {
  if (mainChannel.value?.id === ch.id) return
  mainChannel.value = ch
}

function toggleTour() {
  if (tourRunning.value) {
    if (tourTimer) window.clearInterval(tourTimer)
    tourTimer = null
    tourRunning.value = false
    ElMessage.info('轮巡已停止')
    return
  }
  if (!onlineChannels.value.length) return ElMessage.warning('没有在线通道可轮巡')
  tourRunning.value = true
  let idx = 0
  tourTimer = window.setInterval(() => {
    mainChannel.value = onlineChannels.value[idx % onlineChannels.value.length]
    idx++
  }, 8000)
  ElMessage.success('已开启轮巡，每 8 秒切换一个在线通道')
}

/* ---------- 转码模板 ---------- */
const templates = ref<any[]>([])
const tplDialog = ref(false)
const tplEditing = ref<any>(null)
const tplForm = reactive<any>({ name: '', resolution: '1920×1080', bitrateKbps: 4096, frameRate: 25, codec: 'H.265', gop: 50, audio: 'AAC 48kHz 立体声' })

const RESOLUTIONS = ['3840×2160', '2560×1440', '1920×1080', '1280×720', '704×576', '352×288']

async function loadTemplates() {
  templates.value = (await videoApi.templates()) || []
}

function openTplCreate() {
  tplEditing.value = null
  Object.assign(tplForm, { name: '', resolution: '1920×1080', bitrateKbps: 4096, frameRate: 25, codec: 'H.265', gop: 50, audio: 'AAC 48kHz 立体声' })
  tplDialog.value = true
}

function openTplEdit(row: any) {
  tplEditing.value = row
  Object.assign(tplForm, JSON.parse(JSON.stringify(row)))
  tplDialog.value = true
}

async function submitTpl() {
  if (!tplForm.name) return ElMessage.warning('请输入模板名称')
  if (tplEditing.value) {
    await videoApi.updateTemplate(tplEditing.value.id, { ...tplForm })
    ElMessage.success('转码模板已更新')
  } else {
    await videoApi.createTemplate({ ...tplForm })
    ElMessage.success('转码模板已创建')
  }
  tplDialog.value = false
  loadTemplates()
}

async function removeTpl(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除转码模板「${row.name}」？`, '删除模板', { type: 'warning' })
    await videoApi.removeTemplate(row.id)
    ElMessage.success('模板已删除')
    loadTemplates()
  } catch {
    /* 已提示 */
  }
}

async function setDefault(row: any) {
  await videoApi.updateTemplate(row.id, { isDefault: true })
  ElMessage.success(`已将「${row.name}」设为默认模板`)
  loadTemplates()
}

/* ---------- 质量诊断 ---------- */
const qcTable = useTable({
  api: videoApi.qualityChecks as any,
  defaultParams: { keyword: '', status: '' }
})
const qcDialog = ref(false)
const qcDevices = ref<any[]>([])
const qcForm = reactive<any>({
  deviceIds: [] as string[],
  items: ['丢包检测', '卡顿检测', '花屏检测', '黑屏检测', '亮度异常', '遮挡检测']
})
const QC_ITEMS = ['丢包检测', '卡顿检测', '花屏检测', '黑屏检测', '亮度异常', '遮挡检测', '偏色检测', '抖动检测', '场景变更检测', '视频冻结检测']

async function openQcDialog() {
  const res: any = await deviceApi.list({ page: 1, pageSize: 100 })
  qcDevices.value = res.list || []
  qcForm.deviceIds = []
  qcDialog.value = true
}

async function submitQc() {
  if (!qcForm.deviceIds.length) return ElMessage.warning('请至少选择一台设备')
  if (!qcForm.items.length) return ElMessage.warning('请至少选择一个诊断项')
  const res: any = await videoApi.createQualityCheck({ ...qcForm })
  ElMessage.success(res.message)
  qcDialog.value = false
  qcTable.load()
}

const qcChart = computed(() => {
  const list = qcTable.list.value as any[]
  const buckets = [
    { name: '90-100 优秀', value: list.filter((q) => q.score >= 90).length },
    { name: '80-89 良好', value: list.filter((q) => q.score >= 80 && q.score < 90).length },
    { name: '60-79 一般', value: list.filter((q) => q.score >= 60 && q.score < 80).length },
    { name: '<60 较差', value: list.filter((q) => q.score > 0 && q.score < 60).length }
  ]
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 12, right: 30, top: 16, bottom: 8, containLabel: true },
    xAxis: { type: 'value', name: '个' },
    yAxis: { type: 'category', data: buckets.map((b) => b.name), axisLabel: { fontSize: 11 } },
    series: [{ type: 'bar', barWidth: 14, itemStyle: { borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', fontSize: 11 }, data: buckets.map((b) => b.value) }]
  }
})

/* ---------- 直播频道 ---------- */
const liveTable = useTable({
  api: videoApi.liveChannels as any,
  defaultParams: { keyword: '', visibility: '' }
})
const liveDialog = ref(false)
const liveForm = reactive<any>({ name: '', deviceId: '', channelNo: 1, visibility: 'private', password: '' })
const liveDevices = ref<any[]>([])

async function openLiveDialog() {
  const res: any = await deviceApi.list({ page: 1, pageSize: 100 })
  liveDevices.value = (res.list || []).map((d: any) => ({ id: d.id, name: d.name, channelCount: d.channelCount }))
  Object.assign(liveForm, { name: '', deviceId: '', channelNo: 1, visibility: 'private', password: '' })
  liveDialog.value = true
}

async function submitLive() {
  if (!liveForm.name) return ElMessage.warning('请输入频道名称')
  if (!liveForm.deviceId) return ElMessage.warning('请选择来源设备')
  if (liveForm.visibility === 'private' && !liveForm.password) return ElMessage.warning('私有频道必须设置访问密码')
  try {
    await videoApi.createLiveChannel({ ...liveForm })
    ElMessage.success('直播频道已创建，分享链接已生成')
    liveDialog.value = false
    liveTable.load()
  } catch {
    /* 已提示 */
  }
}

async function refreshToken(row: any) {
  const res: any = await videoApi.refreshToken(row.id)
  row.shareToken = res.shareToken
  row.expiresAt = res.expiresAt
  ElMessage.success('分享令牌已刷新，旧链接立即失效')
}

async function toggleLive(row: any) {
  await videoApi.updateLiveChannel(row.id, { status: row.status === 1 ? 0 : 1 })
  row.status = row.status === 1 ? 0 : 1
  ElMessage.success(row.status === 1 ? '频道已启用' : '频道已停用')
}

async function removeLive(row: any) {
  await ElMessageBox.confirm(`删除频道「${row.name}」后，已分享的链接将立即失效。确认删除？`, '删除直播频道', { type: 'warning' })
  await videoApi.removeLiveChannel(row.id)
  ElMessage.success('频道已删除')
  liveTable.load()
}

function shareUrl(row: any) {
  return `${window.location.origin}/#/live/${row.shareToken}`
}

/* ---------- 全局 ---------- */
const stats = computed(() => ({
  total: channels.value.length,
  online: channels.value.filter((c) => c.onlineStatus === 'online').length,
  bitrate: channels.value.filter((c) => c.onlineStatus === 'online').reduce((a, c) => a + c.bitrateKbps, 0)
}))

onMounted(async () => {
  await Promise.all([loadChannels(), loadTemplates()])
})

onBeforeUnmount(() => {
  if (tourTimer) window.clearInterval(tourTimer)
})
</script>

<template>
  <PageContainer title="视频与流媒体" subtitle="实时预览、转码模板、视频质量诊断与对外直播分享">
    <template #header>
      <span class="vc-text-secondary" style="font-size: 12px">
        通道 {{ stats.total }} 路 · 在线 {{ stats.online }} 路 · 总码率 {{ (stats.bitrate / 1000).toFixed(1) }} Mbps
      </span>
      <el-button :icon="'Refresh'" @click="loadChannels">刷新</el-button>
    </template>

    <el-tabs v-model="activeTab">
      <!-- 实时预览 -->
      <el-tab-pane label="实时预览" name="live">
        <div class="vd__live">
          <div class="vc-card vd__main">
            <VideoPlayer
              v-if="mainChannel"
              :channel-id="mainChannel.id"
              :label="mainChannel.name"
              :online="mainChannel.onlineStatus === 'online'"
              :resolution="mainChannel.resolution"
              :codec="mainChannel.codec"
              :bitrate="mainChannel.bitrateKbps"
              :height="430"
            />
            <EmptyState v-else description="请选择要预览的通道" />
            <div v-if="mainChannel" class="vd__mainMeta">
              <span>{{ mainChannel.deviceName }}</span>
              <span class="vc-text-tertiary">·</span>
              <span class="vc-mono">{{ mainChannel.id }}</span>
              <StatusTag :status="mainChannel.onlineStatus" kind="online" dot />
              <div style="flex: 1" />
              <el-button size="small" :type="tourRunning ? 'danger' : 'default'" :icon="'Refresh'" @click="toggleTour">
                {{ tourRunning ? '停止轮巡' : '开始轮巡' }}
              </el-button>
            </div>
          </div>

          <div class="vc-card vd__side">
            <div class="vc-panel-title">通道列表</div>
            <el-input v-model="channelKeyword" placeholder="搜索通道 / 设备" clearable size="small" style="margin-bottom: 10px" />
            <div class="vd__chlist">
              <div
                v-for="c in filteredChannels"
                :key="c.id"
                class="vd__chitem"
                :class="{ 'is-active': mainChannel?.id === c.id }"
                @click="playChannel(c)"
              >
                <span class="vd__dot" :style="{ background: c.onlineStatus === 'online' ? '#52c41a' : '#8c8c8c' }" />
                <div class="vd__chbody">
                  <div class="vd__chname">{{ c.name }}</div>
                  <div class="vc-text-tertiary" style="font-size: 11px">{{ c.deviceName }}</div>
                </div>
              </div>
              <EmptyState v-if="!filteredChannels.length" description="没有匹配的通道" />
            </div>
          </div>
        </div>

        <div class="vc-card" style="margin-top: 12px; padding: 14px">
          <div class="vd__wallHead">
            <span class="vc-panel-title" style="margin: 0">多画面分割预览</span>
            <el-radio-group :model-value="gridLayout" size="small" @change="(v: any) => setGrid(Number(v) as 1 | 4 | 9)">
              <el-radio-button :value="1">单画面</el-radio-button>
              <el-radio-button :value="4">四画面</el-radio-button>
              <el-radio-button :value="9">九画面</el-radio-button>
            </el-radio-group>
          </div>
          <div :class="['vd__wall', `vd__wall--${gridLayout}`]">
            <VideoPlayer
              v-for="c in playingChannels"
              :key="c.id"
              :channel-id="c.id"
              :label="c.name"
              :online="c.onlineStatus === 'online'"
              :resolution="c.resolution"
              :codec="c.codec"
              :bitrate="c.bitrateKbps"
              :height="gridLayout === 1 ? 360 : gridLayout === 4 ? 190 : 140"
              :controls="false"
            />
          </div>
          <div class="vc-text-tertiary" style="font-size: 12px; margin-top: 8px">
            以上画面由本地 Canvas 实时合成，用于演示播放器交互（抓图、码流切换、全屏、云台联动），不代表真实监控画面。
          </div>
        </div>
      </el-tab-pane>

      <!-- 转码模板 -->
      <el-tab-pane label="转码模板" name="template">
        <div class="vc-card" style="padding: 14px; margin-bottom: 12px">
          <div class="vd__wallHead">
            <span class="vc-panel-title" style="margin: 0">转码模板（{{ templates.length }}）</span>
            <el-button type="primary" :icon="'Plus'" @click="openTplCreate">新建模板</el-button>
          </div>
          <el-table :data="templates" stripe>
            <el-table-column label="模板名称" min-width="180">
              <template #default="{ row }">
                <span style="font-weight: 500">{{ row.name }}</span>
                <el-tag v-if="row.isDefault" size="small" type="success" effect="plain" style="margin-left: 6px">默认</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="resolution" label="分辨率" width="130" />
            <el-table-column label="码率" width="120">
              <template #default="{ row }">{{ formatNumber(row.bitrateKbps) }} Kbps</template>
            </el-table-column>
            <el-table-column label="帧率" width="90">
              <template #default="{ row }">{{ row.frameRate }} fps</template>
            </el-table-column>
            <el-table-column prop="codec" label="编码" width="100" />
            <el-table-column prop="gop" label="GOP" width="90" />
            <el-table-column prop="audio" label="音频" min-width="180" show-overflow-tooltip />
            <el-table-column label="引用次数" width="100" prop="usageCount" />
            <el-table-column label="操作" width="190" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openTplEdit(row)">编辑</el-button>
                <el-button v-if="!row.isDefault" link type="primary" size="small" @click="setDefault(row)">设为默认</el-button>
                <el-button v-if="!row.isDefault" link type="danger" size="small" @click="removeTpl(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="暂无转码模板" action-text="新建模板" @action="openTplCreate" /></template>
          </el-table>
        </div>
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="模板用途说明"
          description="转码模板用于决定边缘节点回传与对外分享时的编码规格。主码流建议保留原始分辨率用于录像，子码流用于多画面预览与移动端查看。"
        />
      </el-tab-pane>

      <!-- 质量诊断 -->
      <el-tab-pane label="视频质量诊断" name="qc">
        <div class="vc-card vd__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="qcTable.baseParams.value.keyword" placeholder="设备名称" clearable style="width: 200px" @keyup.enter="qcTable.search" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="qcTable.baseParams.value.status" placeholder="全部" clearable style="width: 130px">
                <el-option label="诊断中" value="running" />
                <el-option label="已完成" value="completed" />
                <el-option label="失败" value="failed" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="qcTable.search">查询</el-button>
              <el-button type="primary" plain :icon="'Monitor'" @click="openQcDialog">发起诊断</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="vd__qcRow">
          <div class="vc-card" style="padding: 14px">
            <div class="vc-panel-title">当前页得分分布</div>
            <BaseChart :option="qcChart" :height="220" :empty="!(qcTable.list.value as any[]).length" />
          </div>
          <div class="vc-card vd__table">
            <el-table v-loading="qcTable.loading.value" :data="qcTable.list.value" stripe>
              <el-table-column label="任务 / 设备" min-width="220">
                <template #default="{ row }">
                  <div>{{ row.name }}</div>
                  <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.deviceId }} · CH{{ String(row.channelNo).padStart(2, '0') }}</div>
                </template>
              </el-table-column>
              <el-table-column label="诊断项" min-width="220">
                <template #default="{ row }">
                  <el-tag v-for="i in (row.items || []).slice(0, 4)" :key="i" size="small" effect="plain" style="margin: 1px 3px 1px 0">{{ i }}</el-tag>
                  <span v-if="(row.items || []).length > 4" class="vc-text-tertiary" style="font-size: 11px">+{{ row.items.length - 4 }}</span>
                </template>
              </el-table-column>
              <el-table-column label="得分" width="150">
                <template #default="{ row }">
                  <div class="vd__score">
                    <el-progress
                      :percentage="row.score"
                      :stroke-width="8"
                      :show-text="false"
                      :color="row.score >= 90 ? '#52c41a' : row.score >= 75 ? '#1677ff' : row.score >= 60 ? '#faad14' : '#ff4d4f'"
                    />
                    <span>{{ row.score || '-' }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="发现问题" min-width="200">
                <template #default="{ row }">
                  <el-tag v-for="p in row.problems" :key="p" size="small" type="danger" effect="plain" style="margin: 1px 3px 1px 0">{{ p }}</el-tag>
                  <span v-if="!row.problems?.length" class="vc-text-tertiary">无异常</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }"><StatusTag :status="row.status" kind="task" /></template>
              </el-table-column>
              <el-table-column prop="createTime" label="诊断时间" width="170" />
              <template #empty><EmptyState description="暂无诊断任务" action-text="发起诊断" @action="openQcDialog" /></template>
            </el-table>
            <div class="vd__pager">
              <el-pagination
                :current-page="qcTable.page.value"
                :page-size="qcTable.pageSize.value"
                :page-sizes="paginationSizes"
                :total="qcTable.total.value"
                :layout="paginationLayout"
                background
                @current-change="qcTable.onPageChange"
                @size-change="qcTable.onSizeChange"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 直播频道 -->
      <el-tab-pane label="直播频道" name="livechannel">
        <div class="vc-card vd__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="liveTable.baseParams.value.keyword" placeholder="频道名称" clearable style="width: 200px" @keyup.enter="liveTable.search" />
            </el-form-item>
            <el-form-item label="可见性">
              <el-select v-model="liveTable.baseParams.value.visibility" placeholder="全部" clearable style="width: 140px">
                <el-option label="公开" value="public" />
                <el-option label="私有（需密码）" value="private" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="liveTable.search">查询</el-button>
              <el-button type="primary" plain :icon="'Plus'" @click="openLiveDialog">创建频道</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card vd__table">
          <el-table v-loading="liveTable.loading.value" :data="liveTable.list.value" stripe>
            <el-table-column label="频道名称" min-width="200">
              <template #default="{ row }">
                <div style="font-weight: 500">{{ row.name }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.id }}</div>
              </template>
            </el-table-column>
            <el-table-column label="来源" min-width="180">
              <template #default="{ row }">
                <div>{{ row.deviceName }}</div>
                <div class="vc-text-tertiary" style="font-size: 11px">CH{{ String(row.channelNo).padStart(2, '0') }}</div>
              </template>
            </el-table-column>
            <el-table-column label="可见性" width="120">
              <template #default="{ row }">
                <el-tag size="small" :type="row.visibility === 'public' ? 'success' : 'warning'" effect="plain">
                  {{ row.visibility === 'public' ? '公开' : '私有' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="分享链接" min-width="250">
              <template #default="{ row }">
                <div class="vd__url">
                  <span class="vc-mono">{{ shareUrl(row) }}</span>
                  <el-button link type="primary" size="small" @click="copyText(shareUrl(row), '分享链接已复制')">复制</el-button>
                </div>
                <div class="vc-text-tertiary" style="font-size: 11px">有效期至 {{ formatDateTime(row.expiresAt) }}</div>
              </template>
            </el-table-column>
            <el-table-column label="观看次数" width="110" prop="viewCount" sortable :sort-method="(a: any, b: any) => a.viewCount - b.viewCount" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-switch :model-value="row.status === 1" @change="toggleLive(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="170" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="refreshToken(row)">刷新令牌</el-button>
                <el-button link type="danger" size="small" @click="removeLive(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="暂无直播频道" action-text="创建频道" @action="openLiveDialog" /></template>
          </el-table>
          <div class="vd__pager">
            <el-pagination
              :current-page="liveTable.page.value"
              :page-size="liveTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="liveTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="liveTable.onPageChange"
              @size-change="liveTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 转码模板弹窗 -->
    <el-dialog v-model="tplDialog" :title="tplEditing ? '编辑转码模板' : '新建转码模板'" width="600px">
      <el-form :model="tplForm" label-width="110px">
        <el-form-item label="模板名称">
          <el-input v-model="tplForm.name" placeholder="如：1080P 高清回传模板" />
        </el-form-item>
        <el-form-item label="分辨率">
          <el-select v-model="tplForm.resolution" style="width: 100%">
            <el-option v-for="r in RESOLUTIONS" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
        <el-form-item label="码率(Kbps)">
          <el-input-number v-model="tplForm.bitrateKbps" :min="64" :max="32768" :step="256" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="帧率(fps)">
          <el-input-number v-model="tplForm.frameRate" :min="1" :max="60" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="编码格式">
          <el-select v-model="tplForm.codec" style="width: 100%">
            <el-option label="H.265" value="H.265" />
            <el-option label="H.264" value="H.264" />
            <el-option label="SVAC 2.0" value="SVAC 2.0" />
          </el-select>
        </el-form-item>
        <el-form-item label="GOP 长度">
          <el-input-number v-model="tplForm.gop" :min="10" :max="250" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="音频编码">
          <el-select v-model="tplForm.audio" style="width: 100%">
            <el-option label="AAC 48kHz 立体声" value="AAC 48kHz 立体声" />
            <el-option label="AAC 16kHz 单声道" value="AAC 16kHz 单声道" />
            <el-option label="G.711 A-law" value="G.711 A-law" />
            <el-option label="无音频" value="无音频" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tplDialog = false">取消</el-button>
        <el-button type="primary" @click="submitTpl">{{ tplEditing ? '保存修改' : '确认创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 质量诊断弹窗 -->
    <el-dialog v-model="qcDialog" title="发起视频质量诊断" width="640px">
      <el-form :model="qcForm" label-width="100px">
        <el-form-item label="诊断设备">
          <el-select v-model="qcForm.deviceIds" multiple filterable collapse-tags collapse-tags-tooltip placeholder="选择设备（最多 20 台）" style="width: 100%">
            <el-option v-for="d in qcDevices" :key="d.id" :label="`${d.name}（${d.channelCount} 通道）`" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="诊断项">
          <el-checkbox-group v-model="qcForm.items">
            <el-checkbox v-for="i in QC_ITEMS" :key="i" :value="i">{{ i }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <el-alert type="info" :closable="false" show-icon title="诊断说明" description="诊断会抓取实时画面快照并分析，约 10~30 秒返回结果。异常项会自动生成告警（视频质量类）。" />
      <template #footer>
        <el-button @click="qcDialog = false">取消</el-button>
        <el-button type="primary" @click="submitQc">开始诊断</el-button>
      </template>
    </el-dialog>

    <!-- 直播频道弹窗 -->
    <el-dialog v-model="liveDialog" title="创建直播频道" width="600px">
      <el-form :model="liveForm" label-width="110px">
        <el-form-item label="频道名称">
          <el-input v-model="liveForm.name" placeholder="如：园区南门实时直播" />
        </el-form-item>
        <el-form-item label="来源设备">
          <el-select v-model="liveForm.deviceId" filterable placeholder="选择设备" style="width: 100%">
            <el-option v-for="d in liveDevices" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="通道号">
          <el-input-number v-model="liveForm.channelNo" :min="1" :max="128" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="可见性">
          <el-radio-group v-model="liveForm.visibility">
            <el-radio value="public">公开（无需密码）</el-radio>
            <el-radio value="private">私有（需密码）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="liveForm.visibility === 'private'" label="访问密码">
          <el-input v-model="liveForm.password" placeholder="设置 4-16 位访问密码" show-password />
        </el-form-item>
      </el-form>
      <el-alert type="warning" :closable="false" show-icon title="合规提示" description="对外分享的直播链接请确保已获得租户与相关方授权，涉及公共场所视频的分享需遵守当地数据合规要求。" />
      <template #footer>
        <el-button @click="liveDialog = false">取消</el-button>
        <el-button type="primary" @click="submitLive">创建并生成链接</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<style scoped>
.vd__live {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 12px;
}

.vd__main {
  padding: 12px;
  min-width: 0;
}

.vd__mainMeta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 13px;
  flex-wrap: wrap;
}

.vd__side {
  padding: 14px;
}

.vd__chlist {
  max-height: 420px;
  overflow: auto;
}

.vd__chitem {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.vd__chitem:hover {
  background: var(--el-fill-color-light);
}

.vd__chitem.is-active {
  background: var(--el-color-primary-light-9);
}

.vd__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.vd__chbody {
  min-width: 0;
}

.vd__chname {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vd__wallHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.vd__wall {
  display: grid;
  gap: 8px;
}

.vd__wall--1 {
  grid-template-columns: 1fr;
}

.vd__wall--4 {
  grid-template-columns: repeat(2, 1fr);
}

.vd__wall--9 {
  grid-template-columns: repeat(3, 1fr);
}

.vd__filter {
  padding: 14px 16px 4px;
  margin-bottom: 12px;
}

.vd__filter :deep(.el-form-item) {
  margin-bottom: 10px;
}

.vd__qcRow {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 12px;
}

.vd__table {
  padding: 0;
  overflow: hidden;
  min-width: 0;
}

.vd__pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.vd__score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vd__score :deep(.el-progress) {
  flex: 1;
}

.vd__score span {
  width: 26px;
  text-align: right;
  font-size: 12px;
}

.vd__url {
  display: flex;
  align-items: center;
  gap: 6px;
}

.vd__url span {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-regular);
}
</style>
