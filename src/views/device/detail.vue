<script setup lang="ts">
/**
 * 设备详情：概览 / 通道与云台 / 录像回放 / 告警 / 工单 / AI 任务 / 运行日志 / 健康诊断
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { channelApi, deviceApi } from '@/api'
import PageContainer from '@/components/PageContainer.vue'
import BaseChart from '@/components/BaseChart.vue'
import StatusTag from '@/components/StatusTag.vue'
import VideoPlayer from '@/components/VideoPlayer.vue'
import EmptyState from '@/components/EmptyState.vue'
import { copyText } from '@/utils/download'
import { onlineStatusMeta } from '@/utils/dict'
import { formatDuration, formatNumber, relativeTimeText } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const deviceId = computed(() => String(route.params.id))

const loading = ref(false)
const detail = ref<any>({})
const activeTab = ref('overview')

/* 通道 / 云台 */
const activeChannelId = ref('')
const streamInfo = ref<any>(null)
const recordings = ref<any[]>([])
const recordDate = ref(new Date(Date.now() - 86400000).toISOString().slice(0, 10))
const ptzSpeed = ref(4)
const snapshots = ref<string[]>([])

/* 日志 / 诊断 */
const logs = ref<any[]>([])
const diagnostics = ref<any>(null)

const activeChannel = computed(() => (detail.value.channels || []).find((c: any) => c.id === activeChannelId.value))

async function load() {
  loading.value = true
  try {
    detail.value = await deviceApi.detail(deviceId.value)
    if (!activeChannelId.value && detail.value.channels?.length) {
      activeChannelId.value = detail.value.channels[0].id
    }
  } finally {
    loading.value = false
  }
}

async function loadStream() {
  if (!activeChannelId.value) return
  streamInfo.value = await channelApi.stream(activeChannelId.value, { protocol: 'rtsp', streamType: 'main' }).catch(() => null)
  await Promise.all([loadRecordings(), loadLogs()])
}

async function loadRecordings() {
  if (!activeChannelId.value) return
  const res: any = await channelApi.recordings(activeChannelId.value, { date: recordDate.value }).catch(() => ({ list: [] }))
  recordings.value = res.list || []
}

async function loadLogs() {
  logs.value = await deviceApi.logs(deviceId.value, 40).catch(() => [])
}

async function loadDiagnostics() {
  diagnostics.value = await deviceApi.diagnostics(deviceId.value).catch(() => null)
}

async function ptz(command: string) {
  if (!activeChannel.value) return
  if (activeChannel.value.onlineStatus !== 'online') {
    ElMessage.warning('通道离线，云台指令无法下发')
    return
  }
  try {
    const res: any = await channelApi.ptz(activeChannelId.value, { command, speed: ptzSpeed.value })
    ElMessage.success(`${res.message}（指令 ${res.command}，速度 ${res.speed}）`)
  } catch {
    /* 已提示 */
  }
}

async function snapshot() {
  try {
    const res: any = await channelApi.snapshot(activeChannelId.value)
    snapshots.value.unshift(res.url)
    if (snapshots.value.length > 12) snapshots.value.pop()
    ElMessage.success(`抓图成功（${(res.size / 1024).toFixed(1)} KB），已加入下方图墙`)
  } catch {
    /* 已提示 */
  }
}

async function reboot() {
  await ElMessageBox.confirm(`确认远程重启设备「${detail.value.name}」？重启过程约 60 秒，期间画面将中断。`, '远程重启', { type: 'warning' })
  await deviceApi.batchOperation([deviceId.value], 'reboot')
  ElMessage.success('重启指令已下发，设备将在 60 秒内重新注册')
  load()
}

async function gotoAlarm(id: string) {
  router.push('/alarm')
  void id
}

/* 图表 */
const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: detail.value.alarmTrend?.dates || [] },
  yAxis: { type: 'value', name: '条' },
  series: [
    {
      name: '告警数',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.18 },
      data: detail.value.alarmTrend?.values || []
    }
  ]
}))

const radarOption = computed(() => ({
  tooltip: {},
  radar: {
    indicator: (detail.value.healthRadar || []).map((r: any) => ({ name: r.name, max: 100 })),
    radius: '66%'
  },
  series: [
    {
      type: 'radar',
      areaStyle: { opacity: 0.24 },
      data: [{ value: (detail.value.healthRadar || []).map((r: any) => r.value), name: '健康维度' }]
    }
  ]
}))

const healthColor = computed(() => {
  const s = detail.value.healthScore || 0
  if (s >= 90) return '#52c41a'
  if (s >= 75) return '#1677ff'
  if (s >= 60) return '#faad14'
  return '#ff4d4f'
})

watch(activeChannelId, () => loadStream())

onMounted(async () => {
  await load()
  await Promise.all([loadStream(), loadDiagnostics()])
})
</script>

<template>
  <PageContainer :title="detail.name || '设备详情'" :subtitle="`${detail.vendor || ''} ${detail.model || ''} · ${detail.sn || ''}`">
    <template #header>
      <el-button :icon="'Back'" @click="router.back()">返回</el-button>
      <el-button :icon="'Refresh'" :loading="loading" @click="load">刷新</el-button>
      <el-button type="warning" :icon="'RefreshRight'" @click="reboot">远程重启</el-button>
    </template>

    <div v-loading="loading">
      <!-- 顶部状态条 -->
      <div class="vc-card dd__head">
        <div class="dd__ident">
          <span class="dd__dot" :style="{ background: onlineStatusMeta(detail.onlineStatus).color }" />
          <div>
            <div class="dd__name">{{ detail.name }}</div>
            <div class="dd__sub vc-mono">{{ detail.sn }} · {{ detail.ip }}:{{ detail.port }}</div>
          </div>
          <StatusTag :status="detail.onlineStatus" kind="online" dot />
          <el-tag v-for="t in detail.tags || []" :key="t" size="small" effect="plain">{{ t }}</el-tag>
        </div>
        <div class="dd__metrics">
          <div class="dd__metric">
            <span>健康度</span>
            <b :style="{ color: healthColor }">{{ detail.healthScore }}</b>
          </div>
          <div class="dd__metric">
            <span>通道数</span>
            <b>{{ detail.channelCount }}</b>
          </div>
          <div class="dd__metric">
            <span>近 7 天告警</span>
            <b :class="{ 'is-danger': detail.alarmsLast7d > 3 }">{{ detail.alarmsLast7d }}</b>
          </div>
          <div class="dd__metric">
            <span>AI 任务</span>
            <b>{{ detail.aiTaskCount }}</b>
          </div>
          <div class="dd__metric">
            <span>最后心跳</span>
            <b class="is-small">{{ relativeTimeText(detail.lastHeartbeat) }}</b>
          </div>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="dd__tabs">
        <!-- 概览 -->
        <el-tab-pane label="概览" name="overview">
          <div class="dd__grid2">
            <div class="vc-card">
              <div class="vc-panel-title">基本信息</div>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="设备名称">{{ detail.name }}</el-descriptions-item>
                <el-descriptions-item label="序列号"><span class="vc-mono">{{ detail.sn }}</span></el-descriptions-item>
                <el-descriptions-item label="厂商 / 型号">{{ detail.vendor }} / {{ detail.model }}</el-descriptions-item>
                <el-descriptions-item label="设备类型">{{ detail.category }}</el-descriptions-item>
                <el-descriptions-item label="接入协议">{{ detail.protocol }}</el-descriptions-item>
                <el-descriptions-item label="MAC 地址"><span class="vc-mono">{{ detail.mac }}</span></el-descriptions-item>
                <el-descriptions-item label="固件版本"><span class="vc-mono">{{ detail.firmware }}</span></el-descriptions-item>
                <el-descriptions-item label="硬件版本"><span class="vc-mono">{{ detail.hardwareVersion }}</span></el-descriptions-item>
                <el-descriptions-item label="所属租户">{{ detail.tenantName }}</el-descriptions-item>
                <el-descriptions-item label="设备分组">{{ detail.groupPath }}</el-descriptions-item>
                <el-descriptions-item label="存储池">{{ detail.storagePoolName }}</el-descriptions-item>
                <el-descriptions-item label="分辨率 / 编码">{{ detail.resolution }} · {{ detail.codec }}</el-descriptions-item>
                <el-descriptions-item label="码率 / 帧率">{{ detail.bitrateKbps }} Kbps · {{ detail.frameRate }} fps</el-descriptions-item>
                <el-descriptions-item label="安装日期">{{ detail.installDate }}</el-descriptions-item>
                <el-descriptions-item label="质保到期">{{ detail.warrantyEndDate }}</el-descriptions-item>
                <el-descriptions-item label="经纬度">
                  <span class="vc-mono">{{ detail.longitude }}, {{ detail.latitude }}</span>
                  <el-button link type="primary" size="small" @click="copyText(`${detail.longitude},${detail.latitude}`, '坐标已复制')">复制</el-button>
                </el-descriptions-item>
                <el-descriptions-item label="安装地址" :span="2">{{ detail.installAddress }}</el-descriptions-item>
                <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="vc-card">
              <div class="vc-panel-title">健康度评估</div>
              <BaseChart :option="radarOption" :height="288" />
            </div>
          </div>

          <div class="dd__grid2" style="margin-top: 12px">
            <div class="vc-card">
              <div class="vc-panel-title">近 7 天告警趋势</div>
              <BaseChart :option="trendOption" :height="220" />
            </div>
            <div class="vc-card">
              <div class="vc-panel-title">当前画面（模拟）</div>
              <img v-if="detail.snapshot" :src="detail.snapshot" class="dd__snapshot" alt="设备画面" />
              <div class="vc-text-tertiary" style="font-size: 12px; margin-top: 6px">当前图像由本地算法合成，不代表真实监控画面</div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 通道与云台 -->
        <el-tab-pane label="通道与云台" name="channel">
          <div class="dd__channels">
            <div class="dd__chlist vc-card">
              <div class="vc-panel-title">通道列表（{{ (detail.channels || []).length }}）</div>
              <div
                v-for="c in detail.channels || []"
                :key="c.id"
                class="dd__chitem"
                :class="{ 'is-active': c.id === activeChannelId }"
                @click="activeChannelId = c.id"
              >
                <span class="dd__dot" :style="{ background: onlineStatusMeta(c.onlineStatus).color }" />
                <div>
                  <div class="dd__chName">{{ c.name }}</div>
                  <div class="vc-text-tertiary vc-mono" style="font-size: 11px">CH{{ String(c.channelNo).padStart(2, '0') }} · {{ c.resolution }}</div>
                </div>
              </div>
            </div>

            <div class="dd__chmain">
              <div class="vc-card" style="padding: 12px">
                <VideoPlayer
                  v-if="activeChannel"
                  :channel-id="activeChannel.id"
                  :label="activeChannel.name"
                  :online="activeChannel.onlineStatus === 'online'"
                  :resolution="activeChannel.resolution"
                  :codec="activeChannel.codec"
                  :bitrate="activeChannel.bitrateKbps"
                  :height="360"
                />
                <EmptyState v-else description="请选择通道" />
              </div>

              <div class="dd__grid2" style="margin-top: 12px">
                <div class="vc-card">
                  <div class="vc-panel-title">云台控制</div>
                  <div class="dd__ptz">
                    <el-button circle :icon="'Top'" @click="ptz('upLeft')" />
                    <el-button circle :icon="'Top'" @click="ptz('up')" />
                    <el-button circle :icon="'Top'" @click="ptz('upRight')" />
                  </div>
                  <div class="dd__ptz">
                    <el-button circle :icon="'Back'" @click="ptz('left')" />
                    <el-button circle :icon="'VideoCamera'" @click="ptz('stop')" />
                    <el-button circle :icon="'Right'" @click="ptz('right')" />
                  </div>
                  <div class="dd__ptz">
                    <el-button circle :icon="'Bottom'" @click="ptz('downLeft')" />
                    <el-button circle :icon="'Bottom'" @click="ptz('down')" />
                    <el-button circle :icon="'Bottom'" @click="ptz('downRight')" />
                  </div>
                  <div class="dd__ptz-row">
                    <el-button size="small" @click="ptz('zoomIn')">变倍 +</el-button>
                    <el-button size="small" @click="ptz('zoomOut')">变倍 -</el-button>
                    <el-button size="small" @click="ptz('focusNear')">聚焦近</el-button>
                    <el-button size="small" @click="ptz('focusFar')">聚焦远</el-button>
                  </div>
                  <div class="dd__ptz-row">
                    <el-button size="small" @click="ptz('gotoPreset')">调用预置位</el-button>
                    <el-button size="small" @click="ptz('setPreset')">设置预置位</el-button>
                    <el-button size="small" @click="ptz('startCruise')">开始巡航</el-button>
                  </div>
                  <div class="dd__speed">
                    <span>速度</span>
                    <el-slider v-model="ptzSpeed" :min="1" :max="8" style="flex: 1" />
                    <em>{{ ptzSpeed }}</em>
                  </div>
                  <el-button style="margin-top: 10px; width: 100%" :icon="'Camera'" @click="snapshot">抓图</el-button>
                </div>

                <div class="vc-card">
                  <div class="vc-panel-title">流地址（多协议）</div>
                  <template v-if="streamInfo">
                    <div v-for="p in streamInfo.allProtocols" :key="p.protocol" class="dd__stream">
                      <el-tag size="small" effect="plain">{{ p.protocol.toUpperCase() }}</el-tag>
                      <span class="vc-mono dd__url">{{ p.url }}</span>
                      <el-button link type="primary" size="small" @click="copyText(p.url, '流地址已复制')">复制</el-button>
                    </div>
                    <div class="vc-text-tertiary" style="font-size: 12px; margin-top: 8px">
                      Token 有效期 7200 秒，过期时间 {{ streamInfo.expiresAt }}
                    </div>
                  </template>
                  <EmptyState v-else description="通道离线或未获取到流地址" />
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 录像回放 -->
        <el-tab-pane label="录像回放" name="record">
          <div class="vc-card">
            <div class="dd__recHead">
              <span class="vc-panel-title" style="margin: 0">录像片段（{{ recordings.length }} 段，共 {{ formatDuration(Math.round(recordings.reduce((a, r) => a + r.duration, 0) / 60)) }}）</span>
              <el-date-picker v-model="recordDate" type="date" value-format="YYYY-MM-DD" :clearable="false" @change="loadRecordings" />
            </div>
            <el-table :data="recordings" size="small" stripe max-height="440">
              <el-table-column label="开始时间" width="180">
                <template #default="{ row }"><span class="vc-mono">{{ row.startTime }}</span></template>
              </el-table-column>
              <el-table-column label="结束时间" width="180">
                <template #default="{ row }"><span class="vc-mono">{{ row.endTime }}</span></template>
              </el-table-column>
              <el-table-column label="时长" width="100">
                <template #default="{ row }">{{ formatDuration(Math.round(row.duration / 60)) }}</template>
              </el-table-column>
              <el-table-column label="类型" width="100">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain">{{ row.type === 'schedule' ? '计划' : row.type === 'event' ? '事件' : 'AI' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="存储层" width="100">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.storageType === 'hot' ? 'primary' : row.storageType === 'ia' ? 'warning' : 'info'" effect="plain">
                    {{ row.storageType === 'hot' ? '标准' : row.storageType === 'ia' ? '低频' : '归档' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="文件大小" width="110">
                <template #default="{ row }">{{ (row.fileSize / 1024).toFixed(1) }} MB</template>
              </el-table-column>
              <el-table-column label="操作" min-width="160">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="copyText(row.streamUrl, '回放地址已复制')">复制回放地址</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 抓图墙 -->
        <el-tab-pane label="抓图墙" name="snapshot">
          <div v-if="!snapshots.length" class="vc-card">
            <EmptyState description="还没有抓图记录" tips="切换到「通道与云台」点击抓图按钮即可生成" />
          </div>
          <div v-else class="vc-card">
            <div class="vc-panel-title">本次会话抓图（{{ snapshots.length }}）</div>
            <div class="dd__wall">
              <img v-for="(s, i) in snapshots" :key="i" :src="s" class="dd__wallItem" alt="抓图" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 告警记录 -->
        <el-tab-pane :label="`告警记录（${(detail.alarms || []).length}）`" name="alarm">
          <div class="vc-card">
            <el-table :data="detail.alarms || []" size="small" stripe>
              <el-table-column prop="alarmNo" label="告警编号" width="180" />
              <el-table-column prop="title" label="告警标题" min-width="220" show-overflow-tooltip />
              <el-table-column label="等级" width="90">
                <template #default="{ row }"><StatusTag :status="row.level" kind="alarmLevel" /></template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }"><StatusTag :status="row.status" kind="alarmStatus" /></template>
              </el-table-column>
              <el-table-column prop="occurTime" label="发生时间" width="170" />
              <el-table-column prop="duration" label="持续(分钟)" width="110" />
              <el-table-column prop="handler" label="处理人" width="110" />
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="gotoAlarm(row.id)">去处理</el-button>
                </template>
              </el-table-column>
              <template #empty><EmptyState description="该设备近期没有告警" /></template>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 关联工单 -->
        <el-tab-pane :label="`关联工单（${(detail.workOrders || []).length}）`" name="order">
          <div class="vc-card">
            <el-table :data="detail.workOrders || []" size="small" stripe>
              <el-table-column prop="orderNo" label="工单号" width="160" />
              <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
              <el-table-column prop="type" label="类型" width="130" />
              <el-table-column label="优先级" width="90">
                <template #default="{ row }"><StatusTag :status="row.priority" kind="alarmLevel" /></template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }"><StatusTag :status="row.status" kind="workOrder" /></template>
              </el-table-column>
              <el-table-column prop="assignee" label="处理人" width="110" />
              <el-table-column prop="createTime" label="创建时间" width="170" />
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="router.push('/service')">查看工单</el-button>
                </template>
              </el-table-column>
              <template #empty><EmptyState description="暂无关联工单" /></template>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- AI 任务 -->
        <el-tab-pane :label="`AI 任务（${(detail.aiTasks || []).length}）`" name="ai">
          <div class="vc-card">
            <el-table :data="detail.aiTasks || []" size="small" stripe>
              <el-table-column prop="name" label="任务名称" min-width="200" show-overflow-tooltip />
              <el-table-column prop="algorithmName" label="算法" width="150" />
              <el-table-column prop="channelCount" label="通道数" width="90" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }"><StatusTag :status="row.status" kind="task" /></template>
              </el-table-column>
              <el-table-column prop="gpuUsage" label="GPU(%)" width="90" />
              <el-table-column prop="eventsToday" label="今日事件" width="100" />
              <el-table-column prop="accuracy" label="准确率(%)" width="110" />
              <template #empty><EmptyState description="该设备未绑定 AI 分析任务" /></template>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 运行日志 -->
        <el-tab-pane label="运行日志" name="log">
          <div class="vc-card">
            <div class="dd__logbox vc-mono">
              <div v-for="l in logs" :key="l.id" class="dd__logline">
                <span class="dd__logtime">{{ l.createTime }}</span>
                <StatusTag :status="l.level" kind="log" />
                <span class="dd__logtext">{{ l.content }}</span>
              </div>
              <EmptyState v-if="!logs.length" description="暂无日志" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 健康诊断 -->
        <el-tab-pane label="健康诊断" name="diag">
          <div class="vc-card">
            <div class="dd__diagHead">
              <span class="vc-panel-title" style="margin: 0">诊断结论</span>
              <el-tag :type="diagnostics?.overall === '正常' ? 'success' : diagnostics?.overall === '存在风险' ? 'warning' : 'danger'">
                {{ diagnostics?.overall || '-' }}
              </el-tag>
              <span class="vc-text-tertiary" style="font-size: 12px">检测时间 {{ diagnostics?.checkedAt }}</span>
              <el-button size="small" :icon="'Refresh'" @click="loadDiagnostics">重新检测</el-button>
            </div>
            <el-table :data="diagnostics?.items || []" size="small" stripe>
              <el-table-column prop="name" label="检测项" width="150" />
              <el-table-column prop="value" label="实测值" min-width="150" />
              <el-table-column prop="threshold" label="参考阈值" min-width="150" />
              <el-table-column label="结论" width="100">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.status === 'ok' ? 'success' : row.status === 'warn' ? 'warning' : 'danger'" effect="plain">
                    {{ row.status === 'ok' ? '正常' : row.status === 'warn' ? '偏差' : '异常' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </PageContainer>
</template>

<style scoped>
.dd__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  flex-wrap: wrap;
}

.dd__ident {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dd__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.dd__name {
  font-size: 15px;
  font-weight: 500;
}

.dd__sub {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.dd__metrics {
  display: flex;
  gap: 26px;
  flex-wrap: wrap;
}

.dd__metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dd__metric span {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.dd__metric b {
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}

.dd__metric b.is-small {
  font-size: 13px;
  font-weight: 400;
}

.dd__metric b.is-danger {
  color: var(--vc-danger);
}

.dd__tabs {
  margin-top: 12px;
}

.dd__grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dd__grid2 > .vc-card {
  padding: 14px;
  min-width: 0;
}

.dd__snapshot {
  width: 100%;
  border-radius: 6px;
  display: block;
}

.dd__channels {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.dd__chlist {
  width: 250px;
  flex-shrink: 0;
  padding: 14px;
  max-height: 620px;
  overflow: auto;
}

.dd__chitem {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
}

.dd__chitem:hover {
  background: var(--el-fill-color-light);
}

.dd__chitem.is-active {
  background: var(--el-color-primary-light-9);
}

.dd__chName {
  font-size: 13px;
}

.dd__chmain {
  flex: 1;
  min-width: 0;
}

.dd__ptz {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 6px;
}

.dd__ptz :deep(.el-button) {
  width: 34px;
  height: 34px;
}

.dd__ptz-row {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.dd__speed {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dd__speed em {
  font-style: normal;
  width: 16px;
  text-align: right;
}

.dd__stream {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.dd__url {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-regular);
}

.dd__recHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.dd__wall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.dd__wallItem {
  width: 100%;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.dd__logbox {
  max-height: 480px;
  overflow: auto;
  font-size: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  padding: 10px;
}

.dd__logline {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 3px 0;
}

.dd__logtime {
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}

.dd__logtext {
  color: var(--el-text-color-regular);
}

.dd__diagHead {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
</style>
