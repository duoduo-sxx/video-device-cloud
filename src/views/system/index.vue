<script setup lang="ts">
/**
 * 系统设置：平台基础参数、数据字典、消息中心、运行状态与区域数据
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { dashboardApi, systemApi } from '@/api'
import { getSettings, saveSettings, type MockSettings } from '@/mock/utils'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import PageContainer from '@/components/PageContainer.vue'
import StatCard from '@/components/StatCard.vue'
import BaseChart from '@/components/BaseChart.vue'
import EmptyState from '@/components/EmptyState.vue'
import StatusTag from '@/components/StatusTag.vue'
import { formatDateTime, formatNumber } from '@/utils/format'
import { exportJson } from '@/utils/download'

const app = useAppStore()
const user = useUserStore()
const activeTab = ref('base')

/* ---------------- 基础设置 ---------------- */
const mockSettings = reactive<MockSettings>({ ...getSettings() })

function applyMockSettings() {
  saveSettings({ ...mockSettings })
  ElMessage.success('已保存数据服务参数，下次请求生效')
}

function resetMockSettings() {
  Object.assign(mockSettings, { delay: true, errorInject: false, onlineRate: 0.87 })
  applyMockSettings()
}

async function resetDemoData() {
  try {
    await ElMessageBox.confirm(
      '重置后将清空本机新增/修改/删除的所有数据，恢复到系统初始数据集（设备、告警、工单等），且不可撤销。确认继续？',
      '恢复初始数据',
      { type: 'warning', confirmButtonText: '确认重置' }
    )
  } catch {
    return
  }
  const res: any = await systemApi.resetDemo()
  ElMessage.success(res?.message || '本地数据已恢复至初始状态')
  setTimeout(() => window.location.reload(), 800)
}

async function clearLocalCache() {
  try {
    await ElMessageBox.confirm('将清除本机缓存（登录态、界面偏好、本地数据变更记录），确认继续？', '清除本地缓存', { type: 'warning' })
  } catch {
    return
  }
  const keep = new Set<string>()
  Object.keys(localStorage)
    .filter((k) => k.startsWith('vc_') || k.startsWith('mock_'))
    .forEach((k) => keep.add(k))
  keep.forEach((k) => localStorage.removeItem(k))
  ElMessage.success('本地缓存已清除，即将刷新')
  setTimeout(() => window.location.reload(), 800)
}

/* ---------------- 数据字典 ---------------- */
const dictList = ref<any[]>([])
const dictLoading = ref(false)
const dictDialog = ref(false)
const dictEditing = ref<any>(null)
const dictForm = reactive<any>({ id: '', name: '', code: '', remark: '', items: [] as any[] })

async function loadDicts() {
  dictLoading.value = true
  try {
    dictList.value = (await systemApi.dicts()) || []
  } finally {
    dictLoading.value = false
  }
}

function openDictEdit(row: any) {
  dictEditing.value = row
  dictForm.id = row.id
  dictForm.name = row.name
  dictForm.code = row.code
  dictForm.remark = row.remark
  dictForm.items = JSON.parse(JSON.stringify(row.items || []))
  dictDialog.value = true
}

function addDictItem() {
  dictForm.items.push({ label: '', value: '', color: '', sort: dictForm.items.length + 1, status: 1 })
}

function removeDictItem(index: number) {
  dictForm.items.splice(index, 1)
}

async function submitDict() {
  if (!dictForm.name) return ElMessage.warning('字典名称不能为空')
  const empty = dictForm.items.find((i: any) => !i.label || !i.value)
  if (empty) return ElMessage.warning('字典项的名称与键值不能为空')
  await systemApi.updateDict(dictEditing.value.id, {
    name: dictForm.name,
    code: dictForm.code,
    remark: dictForm.remark,
    items: dictForm.items
  })
  ElMessage.success('数据字典已更新')
  dictDialog.value = false
  loadDicts()
}

function exportDict() {
  exportJson('数据字典', dictList.value)
}

/* ---------------- 消息中心 ---------------- */
const messages = ref<any[]>([])
const unreadCount = ref(0)
const msgType = ref('')
const msgLoading = ref(false)

const messageTypeOptions = [
  { label: '全部消息', value: '' },
  { label: '告警通知', value: 'alarm' },
  { label: '工单动态', value: 'workorder' },
  { label: '系统消息', value: 'system' }
]

async function loadMessages() {
  msgLoading.value = true
  try {
    const res: any = await systemApi.messages({ limit: 60, ...(msgType.value ? { type: msgType.value } : {}) })
    messages.value = res?.list || []
    unreadCount.value = res?.unread || 0
  } finally {
    msgLoading.value = false
  }
}

async function readOne(row: any) {
  if (row.read) return
  await systemApi.readMessages([row.id])
  row.read = true
  unreadCount.value = Math.max(0, unreadCount.value - 1)
}

async function readAll() {
  await systemApi.readMessages([])
  ElMessage.success('已全部标记为已读')
  loadMessages()
}

const msgTypeMeta: Record<string, { label: string; type: any }> = {
  alarm: { label: '告警通知', type: 'danger' },
  workorder: { label: '工单动态', type: 'warning' },
  system: { label: '系统消息', type: 'primary' }
}

/* ---------------- 运行统计 ---------------- */
const stats = ref<any>(null)
const statsLoading = ref(false)

async function loadStats() {
  statsLoading.value = true
  try {
    stats.value = await systemApi.stats()
  } finally {
    statsLoading.value = false
  }
}

const collectionLabels: Record<string, string> = {
  devices: '设备',
  channels: '通道',
  alarms: '告警',
  workOrders: '工单',
  users: '用户',
  tenants: '租户',
  apiCallLogs: 'API 调用日志',
  operationLogs: '操作审计'
}

const collectionChartOption = computed(() => {
  const collections = stats.value?.collections || {}
  const keys = Object.keys(collections)
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 12, right: 24, top: 20, bottom: 8, containLabel: true },
    xAxis: { type: 'value', name: '条' },
    yAxis: {
      type: 'category',
      data: keys.map((k) => collectionLabels[k] || k),
      axisLabel: { fontSize: 12 }
    },
    series: [
      {
        type: 'bar',
        barWidth: 14,
        itemStyle: { borderRadius: [0, 6, 6, 0], color: '#1677FF' },
        label: { show: true, position: 'right', fontSize: 11, formatter: (p: any) => formatNumber(p.value) },
        data: keys.map((k) => collections[k])
      }
    ]
  }
})

const patchRows = computed(() => {
  const p = stats.value?.patches || {}
  return [
    { label: '本地新增', key: 'created', value: p.created || 0, color: '#52C41A' },
    { label: '本地修改', key: 'updated', value: p.updated || 0, color: '#1677FF' },
    { label: '本地删除', key: 'deleted', value: p.deleted || 0, color: '#FF4D4F' }
  ]
})

/* ---------------- 区域数据 ---------------- */
const regions = ref<any[]>([])
const regionDistribution = ref<any[]>([])
const regionLoading = ref(false)

async function loadRegions() {
  regionLoading.value = true
  try {
    const [r, d] = await Promise.all([systemApi.regions(), dashboardApi.regionDistribution()])
    regions.value = r || []
    regionDistribution.value = (d || []) as any[]
  } finally {
    regionLoading.value = false
  }
}

function deviceCountOf(city: string) {
  return regionDistribution.value.find((r) => r.city === city)?.total || 0
}

const regionChartOption = computed(() => {
  const top = regionDistribution.value.slice(0, 12)
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['设备总数', '在线设备', '近 7 日告警'], top: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
    grid: { left: 12, right: 20, top: 36, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: top.map((r) => r.city), axisLabel: { rotate: 30, fontSize: 11 } },
    yAxis: [{ type: 'value', name: '台' }, { type: 'value', name: '次', splitLine: { show: false } }],
    series: [
      { name: '设备总数', type: 'bar', barWidth: 14, itemStyle: { borderRadius: [4, 4, 0, 0], color: '#1677FF' }, data: top.map((r) => r.total) },
      { name: '在线设备', type: 'bar', barWidth: 14, itemStyle: { borderRadius: [4, 4, 0, 0], color: '#52C41A' }, data: top.map((r) => r.online) },
      { name: '近 7 日告警', type: 'line', yAxisIndex: 1, smooth: true, symbolSize: 6, itemStyle: { color: '#FAAD14' }, data: top.map((r) => r.alarm) }
    ]
  }
})

/* ---------------- 关于系统 ---------------- */
const aboutRows = computed(() => [
  { label: '系统名称', value: '视频设备云数据服务系统' },
  { label: '系统版本', value: 'V1.0.0（正式版 · Build 20261014）' },
  { label: '前端技术栈', value: 'Vue 3.4 + TypeScript 5.6 + Vite 5 + Pinia + Element Plus + ECharts 5' },
  { label: '数据方案', value: '本地数据服务 + 本地增量存储，接口层统一封装为 /api/v1/*' },
  { label: '运行形态', value: 'Web 版（浏览器访问）与 Windows 桌面版（免安装客户端）' },
  { label: '地图合规', value: '仅使用国家地理信息公共服务平台（天地图）标准底图，坐标系 CGCS2000 / GCJ-02' },
  { label: '技术服务', value: '云视科技有限公司 · support@videocloud.com · 400-800-1000' },
  { label: '登录账号', value: `${user.nickname}（${user.roleName}）` },
  { label: '当前时间', value: formatDateTime(new Date()) }
])

onMounted(() => {
  loadDicts()
  loadMessages()
  loadStats()
  loadRegions()
})
</script>

<template>
  <PageContainer title="系统设置" subtitle="平台基础参数、数据字典、消息通知与运行状态">
    <template #header>
      <el-button plain :icon="'Refresh'" @click="loadStats(); loadDicts(); loadMessages(); loadRegions()">刷新</el-button>
    </template>

    <el-tabs v-model="activeTab">
      <!-- 基础设置 -->
      <el-tab-pane label="基础设置" name="base">
        <div class="setting-grid">
          <el-card shadow="never">
            <template #header><span class="card-title">外观与交互</span></template>
            <el-form label-width="120px" label-position="left">
              <el-form-item label="界面主题">
                <el-radio-group :model-value="app.theme" @change="(v: any) => app.setTheme(v)">
                  <el-radio-button value="light">浅色</el-radio-button>
                  <el-radio-button value="dark">深色</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="多标签页">
                <el-switch v-model="app.showTabs" />
                <span class="form-tip">开启后在顶部显示已访问页面标签</span>
              </el-form-item>
              <el-form-item label="页面水印">
                <el-switch v-model="app.watermark" />
                <span class="form-tip">在内容区叠加账号水印，满足数据安全要求</span>
              </el-form-item>
              <el-form-item label="界面密度">
                <el-radio-group v-model="app.density">
                  <el-radio-button value="default">默认</el-radio-button>
                  <el-radio-button value="small">紧凑</el-radio-button>
                  <el-radio-button value="large">宽松</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="侧边栏">
                <el-button plain @click="app.toggleSidebar()">
                  {{ app.sidebarCollapsed ? '展开侧边栏' : '收起侧边栏' }}
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>

          <el-card shadow="never">
            <template #header><span class="card-title">数据服务参数</span></template>
            <el-form label-width="120px" label-position="left">
              <el-form-item label="接口延迟">
                <el-switch v-model="mockSettings.delay" />
                <span class="form-tip">模拟真实网络往返延迟（列表 300~600ms）</span>
              </el-form-item>
              <el-form-item label="故障注入">
                <el-switch v-model="mockSettings.errorInject" />
                <span class="form-tip">开启后按 5% 概率随机返回业务错误，用于验证异常分支</span>
              </el-form-item>
              <el-form-item label="设备在线率">
                <el-slider v-model="mockSettings.onlineRate" :min="0.5" :max="1" :step="0.01" show-input :format-tooltip="(v: number) => `${(v * 100).toFixed(0)}%`" style="width: 320px" />
              </el-form-item>
              <el-form-item label=" ">
                <el-button type="primary" @click="applyMockSettings">保存参数</el-button>
                <el-button plain @click="resetMockSettings">恢复默认</el-button>
              </el-form-item>
            </el-form>
            <el-alert type="info" :closable="false" show-icon title="以上参数保存在本机，仅影响本地数据服务行为，不会写入业务数据。" />
          </el-card>

          <el-card shadow="never">
            <template #header><span class="card-title">数据维护</span></template>
            <div class="maintain-list">
              <div class="maintain-item">
                <div>
                  <p class="maintain-item__title">恢复初始数据</p>
                  <p class="maintain-item__desc">清空本机全部增删改记录，恢复到系统交付时的初始数据集（设备 860 台、告警 6000+、工单 1500+）。</p>
                </div>
                <el-button type="danger" plain @click="resetDemoData">恢复数据</el-button>
              </div>
              <el-divider />
              <div class="maintain-item">
                <div>
                  <p class="maintain-item__title">清除本地缓存</p>
                  <p class="maintain-item__desc">清除登录态、界面偏好与本地数据变更记录，清除后需要重新登录。</p>
                </div>
                <el-button plain @click="clearLocalCache">清除缓存</el-button>
              </div>
              <el-divider />
              <div class="maintain-item">
                <div>
                  <p class="maintain-item__title">导出数据字典</p>
                  <p class="maintain-item__desc">将当前全部字典类型与字典项导出为 JSON 文件，便于交付与对账。</p>
                </div>
                <el-button plain @click="exportDict">导出 JSON</el-button>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 数据字典 -->
      <el-tab-pane label="数据字典" name="dict">
        <el-table v-loading="dictLoading" :data="dictList" border stripe row-key="id">
          <el-table-column type="expand">
            <template #default="{ row }">
              <el-table :data="row.items" size="small" border class="dict-sub-table">
                <el-table-column type="index" label="#" width="60" />
                <el-table-column prop="label" label="字典标签" min-width="160" />
                <el-table-column prop="value" label="字典键值" min-width="160" />
                <el-table-column prop="color" label="颜色" width="120">
                  <template #default="{ row: item }">
                    <span v-if="item.color" class="color-chip">
                      <i :style="{ background: item.color }" />
                      {{ item.color }}
                    </span>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column prop="sort" label="排序" width="80" />
                <el-table-column label="状态" width="90">
                  <template #default="{ row: item }">
                    <el-tag :type="item.status === 1 ? 'success' : 'info'" size="small" effect="plain">
                      {{ item.status === 1 ? '启用' : '停用' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="字典名称" min-width="180" />
          <el-table-column prop="code" label="字典编码" min-width="180" />
          <el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip />
          <el-table-column label="字典项" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" effect="plain" type="info">{{ (row.items || []).length }} 项</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDictEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 消息中心 -->
      <el-tab-pane name="message">
        <template #label>
          <span>消息中心</span>
          <el-badge v-if="unreadCount" :value="unreadCount" class="tab-badge" />
        </template>
        <div class="msg-toolbar">
          <el-radio-group v-model="msgType" @change="loadMessages">
            <el-radio-button v-for="o in messageTypeOptions" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
          </el-radio-group>
          <div>
            <span class="unread-tip">未读 {{ unreadCount }} 条</span>
            <el-button plain :icon="'Select'" :disabled="!unreadCount" @click="readAll">全部已读</el-button>
          </div>
        </div>
        <div v-loading="msgLoading" class="msg-list">
          <EmptyState v-if="!messages.length" description="暂无消息" tips="系统与业务通知将在此汇总展示" />
          <div
            v-for="m in messages"
            :key="m.id"
            :class="['msg-item', { 'is-unread': !m.read }]"
            @click="readOne(m)"
          >
            <div class="msg-item__left">
              <el-tag :type="msgTypeMeta[m.type]?.type || 'info'" size="small" effect="plain">
                {{ msgTypeMeta[m.type]?.label || m.type }}
              </el-tag>
              <span v-if="!m.read" class="msg-item__dot" />
            </div>
            <div class="msg-item__body">
              <p class="msg-item__title">{{ m.title }}</p>
              <p class="msg-item__content">{{ m.content }}</p>
            </div>
            <div class="msg-item__time">{{ formatDateTime(m.createTime) }}</div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 运行统计 -->
      <el-tab-pane label="运行统计" name="stats">
        <el-row :gutter="12" class="stat-row">
          <el-col :span="6">
            <StatCard label="已注册接口路由" :value="stats?.routeCount || 0" unit="条" icon="Connection" color="#1677FF" />
          </el-col>
          <el-col :span="6">
            <StatCard label="本地新增记录" :value="stats?.patches?.created || 0" unit="条" icon="Plus" color="#52C41A" :animate="false" />
          </el-col>
          <el-col :span="6">
            <StatCard label="本地修改记录" :value="stats?.patches?.updated || 0" unit="条" icon="EditPen" color="#FAAD14" :animate="false" />
          </el-col>
          <el-col :span="6">
            <StatCard label="本地删除记录" :value="stats?.patches?.deleted || 0" unit="条" icon="Delete" color="#FF4D4F" :animate="false" />
          </el-col>
        </el-row>

        <el-row :gutter="12" class="stat-row">
          <el-col :span="16">
            <el-card shadow="never" v-loading="statsLoading">
              <template #header><span class="card-title">数据集规模</span></template>
              <BaseChart :option="collectionChartOption" height="320px" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never">
              <template #header><span class="card-title">变更补丁统计</span></template>
              <div v-for="p in patchRows" :key="p.key" class="patch-row">
                <span class="patch-row__label">{{ p.label }}</span>
                <span class="patch-row__value" :style="{ color: p.color }">{{ formatNumber(p.value) }}</span>
              </div>
              <el-divider />
              <div class="patch-row">
                <span class="patch-row__label">变更总量</span>
                <span class="patch-row__value">{{ formatNumber(patchRows.reduce((a, p) => a + p.value, 0)) }}</span>
              </div>
              <el-alert
                type="info"
                :closable="false"
                show-icon
                title="所有写操作以增量记录形式保存在本机，执行「恢复初始数据」会清空这些变更。"
                style="margin-top: 12px"
              />
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 区域数据 -->
      <el-tab-pane label="区域数据" name="region">
        <el-card shadow="never" class="stat-row">
          <template #header><span class="card-title">重点城市设备与告警分布</span></template>
          <BaseChart :option="regionChartOption" height="320px" />
        </el-card>
        <el-table v-loading="regionLoading" :data="regions" border stripe>
          <el-table-column type="index" label="#" width="60" />
          <el-table-column prop="province" label="所属省份" width="140" />
          <el-table-column prop="city" label="城市" width="140" />
          <el-table-column label="行政区划" min-width="320">
            <template #default="{ row }">
              <el-tag v-for="d in row.districts" :key="d" size="small" effect="plain" class="district-tag">{{ d }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="设备总数" width="120" align="right">
            <template #default="{ row }">{{ formatNumber(deviceCountOf(row.city)) }}</template>
          </el-table-column>
          <el-table-column label="在线设备" width="120" align="right">
            <template #default="{ row }">
              {{ formatNumber(regionDistribution.find((r) => r.city === row.city)?.online || 0) }}
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 关于系统 -->
      <el-tab-pane label="关于系统" name="about">
        <el-card shadow="never">
          <template #header><span class="card-title">系统信息</span></template>
          <el-descriptions :column="2" border>
            <el-descriptions-item v-for="r in aboutRows" :key="r.label" :label="r.label">{{ r.value }}</el-descriptions-item>
          </el-descriptions>
          <el-divider />
          <div class="about-footer">
            <p>视频设备云数据服务系统由云视科技有限公司提供，面向视频设备接入、云存储管理、告警处置与运维服务一体化场景。</p>
            <p>本机为离线部署实例，业务数据由内置数据服务生成并保存在本机，不会上传至任何服务器；如需对接生产环境，仅需将 <code>/api/v1/*</code> 请求指向平台网关，页面与业务逻辑无需改动。</p>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </PageContainer>
</template>

<style scoped>
.setting-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.maintain-list {
  display: flex;
  flex-direction: column;
}

.maintain-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.maintain-item__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

.maintain-item__desc {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.dict-sub-table {
  margin: 6px 0 6px 48px;
  width: calc(100% - 48px);
}

.color-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.color-chip i {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}

.tab-badge {
  margin-left: 6px;
  margin-top: -2px;
}

.msg-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.unread-tip {
  margin-right: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.msg-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 200px;
}

.msg-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.msg-item:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.msg-item.is-unread {
  background: var(--el-color-primary-light-9);
}

.msg-item__left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding-top: 2px;
}

.msg-item__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-danger);
}

.msg-item__body {
  flex: 1;
  min-width: 0;
}

.msg-item__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

.msg-item__content {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.msg-item__time {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.stat-row {
  margin-bottom: 12px;
}

.patch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.patch-row:last-child {
  border-bottom: none;
}

.patch-row__label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.patch-row__value {
  font-size: 18px;
  font-weight: 600;
  font-family: 'DIN Alternate', 'Roboto Mono', monospace;
}

.district-tag {
  margin: 2px 4px 2px 0;
}

.about-footer {
  font-size: 12px;
  line-height: 1.9;
  color: var(--el-text-color-secondary);
}

.about-footer code {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  font-family: 'Roboto Mono', monospace;
}
</style>
