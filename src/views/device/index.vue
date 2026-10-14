<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deviceApi, tenantApi } from '@/api'
import { useTable, paginationLayout, paginationSizes } from '@/composables/useTable'
import PageContainer from '@/components/PageContainer.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import DeviceFormDialog from './components/DeviceFormDialog.vue'
import { DEVICE_CATEGORY_OPTIONS, PROTOCOL_OPTIONS, VENDOR_OPTIONS, onlineStatusMeta } from '@/utils/dict'
import { formatDuration, formatNumber, relativeTimeText } from '@/utils/format'
import type { Device, DeviceGroup } from '@/types'

const router = useRouter()

const showSearch = ref(true)
const groups = ref<DeviceGroup[]>([])
const tenants = ref<any[]>([])
const stats = ref<any>({})
const activeGroup = ref('')
const dialogVisible = ref(false)
const editing = ref<Device | null>(null)

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
  api: deviceApi.list,
  syncQuery: true,
  defaultParams: {
    keyword: '',
    vendor: '',
    category: '',
    onlineStatus: '',
    protocol: '',
    tenantId: '',
    groupId: '',
    bannerTag: ''
  }
})

const tagOptions = ['重点监控', '高清', '室外', '防爆', '待验收', '临期维保']

const selectedIds = computed(() => selection.value.map((d: any) => d.id))

async function loadGroups() {
  const res = await deviceApi.groups()
  groups.value = res.list || []
}

async function loadStats() {
  stats.value = await deviceApi.stats()
}

async function loadTenants() {
  const res = await tenantApi.list({ page: 1, pageSize: 100 })
  tenants.value = res.list || []
}

function onGroupClick(node: DeviceGroup) {
  activeGroup.value = activeGroup.value === node.id ? '' : node.id
  baseParams.value.groupId = activeGroup.value
  search()
}

function openCreate() {
  editing.value = null
  dialogVisible.value = true
}

function openEdit(row: Device) {
  editing.value = row
  dialogVisible.value = true
}

async function onSaved() {
  dialogVisible.value = false
  await Promise.all([load(), loadGroups(), loadStats()])
}

async function removeOne(row: Device) {
  await ElMessageBox.confirm(
    `删除后该设备的 ${row.channelCount} 个通道、关联录像计划与 AI 任务绑定关系都会一并清理，且无法恢复。是否继续？`,
    `删除设备「${row.name}」`,
    { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }
  )
  await deviceApi.remove(row.id)
  ElMessage.success('设备已删除')
  await Promise.all([load(), loadGroups(), loadStats()])
}

async function batchDelete() {
  const box = await ElMessageBox.prompt(
    `已选择 ${selectedIds.value.length} 台设备，此操作不可恢复。请输入「确认删除」以继续：`,
    '批量删除设备',
    { type: 'error', confirmButtonText: '确认删除', inputPlaceholder: '确认删除' }
  ).catch(() => null)
  if (!box) return
  if (box.value !== '确认删除') {
    ElMessage.warning('输入内容不匹配，已取消操作')
    return
  }
  const res = await deviceApi.batchDelete(selectedIds.value)
  ElMessage.success(res.message)
  await Promise.all([load(), loadGroups(), loadStats()])
}

async function batchOp(action: string, label: string) {
  if (!selectedIds.value.length) return ElMessage.warning('请先选择设备')
  await ElMessageBox.confirm(`确认对选中的 ${selectedIds.value.length} 台设备执行「${label}」？`, label, { type: 'warning' })
  const res = await deviceApi.batchOperation(selectedIds.value, action, {})
  ElMessage.success(res.message)
  load()
}

async function rebootOne(row: Device) {
  if (row.onlineStatus !== 'online') {
    ElMessage.warning('设备当前离线，无法下发重启指令')
    return
  }
  await ElMessageBox.confirm(`确认远程重启设备「${row.name}」？重启过程约 60 秒，期间画面将中断。`, '远程重启', { type: 'warning' })
  await deviceApi.batchOperation([row.id], 'reboot')
  ElMessage.success('重启指令已下发')
  load()
}

function goDetail(row: Device) {
  router.push(`/device/detail/${row.id}`)
}

function healthColor(score: number): string {
  if (score >= 90) return '#52c41a'
  if (score >= 75) return '#1677ff'
  if (score >= 60) return '#faad14'
  return '#ff4d4f'
}

function exportList() {
  exportData(
    [
      { key: 'sn', label: '设备序列号' },
      { key: 'name', label: '设备名称' },
      { key: 'vendor', label: '厂商' },
      { key: 'model', label: '型号' },
      { key: 'category', label: '设备类型' },
      { key: 'protocol', label: '接入协议' },
      { key: 'ip', label: 'IP 地址' },
      { key: 'port', label: '端口' },
      { key: 'mac', label: 'MAC 地址' },
      { key: 'firmware', label: '固件版本' },
      { key: 'tenantName', label: '所属租户' },
      { key: 'groupPath', label: '所属分组' },
      { key: 'onlineStatus', label: '在线状态' },
      { key: 'channelCount', label: '通道数' },
      { key: 'resolution', label: '分辨率' },
      { key: 'codec', label: '编码格式' },
      { key: 'bitrateKbps', label: '码率(Kbps)' },
      { key: 'healthScore', label: '健康度' },
      { key: 'installAddress', label: '安装地址' },
      { key: 'installDate', label: '安装日期' },
      { key: 'warrantyEndDate', label: '质保到期' }
    ],
    `设备台账_${new Date().toISOString().slice(0, 10)}`
  )
}

onMounted(() => {
  loadGroups()
  loadStats()
  loadTenants()
})
</script>

<template>
  <PageContainer title="设备中心" subtitle="统一管理摄像机、录像机与边缘网关的接入、配置、健康度与生命周期">
    <template #header>
      <el-button :icon="'Refresh'" :loading="loading" @click="load">刷新</el-button>
      <el-button :icon="'Download'" @click="exportList">导出设备台账</el-button>
      <el-button type="primary" :icon="'Plus'" @click="openCreate">新增设备</el-button>
    </template>

    <div class="dev">
      <!-- 左侧分组树 -->
      <aside class="dev__tree vc-card">
        <div class="vc-panel-title">设备分组</div>
        <div class="dev__group" :class="{ 'is-active': !activeGroup }" @click="onGroupClick({ id: '', name: '', parentId: null, deviceCount: groups.reduce((a, g) => a + g.deviceCount, 0) } as any)">
          <el-icon><component :is="'Grid'" /></el-icon>
          <span>全部设备</span>
          <em>{{ formatNumber(groups.reduce((a, g) => a + g.deviceCount, 0)) }}</em>
        </div>
        <div v-for="g in groups" :key="g.id" class="dev__group-block">
          <div class="dev__group" :class="{ 'is-active': activeGroup === g.id }" @click="onGroupClick(g)">
            <el-icon><component :is="'Folder'" /></el-icon>
            <span>{{ g.name }}</span>
            <em>{{ g.deviceCount }}</em>
          </div>
          <div
            v-for="c in g.children"
            :key="c.id"
            class="dev__group dev__group--child"
            :class="{ 'is-active': activeGroup === c.id }"
            @click="onGroupClick(c)"
          >
            <span>{{ c.name }}</span>
            <em>{{ c.deviceCount }}</em>
          </div>
        </div>

        <div class="dev__stat">
          <div class="dev__stat-title">设备健康概览</div>
          <div v-for="b in stats.healthBuckets || []" :key="b.name" class="dev__stat-item">
            <span>{{ b.name }}</span>
            <div class="dev__stat-bar">
              <i :style="{ width: ((b.value / (stats.total || 1)) * 100).toFixed(1) + '%' }" />
            </div>
            <em>{{ b.value }}</em>
          </div>
        </div>
      </aside>

      <!-- 主区域 -->
      <div class="dev__main">
        <div class="vc-card dev__filter">
          <el-form :model="baseParams" inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="baseParams.keyword" placeholder="设备名称 / SN / IP / 型号" clearable style="width: 210px" @keyup.enter="search" />
            </el-form-item>
            <el-form-item label="厂商">
              <el-select v-model="baseParams.vendor" placeholder="全部厂商" clearable style="width: 140px">
                <el-option v-for="v in VENDOR_OPTIONS" :key="v.value" :label="v.label" :value="v.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="设备类型">
              <el-select v-model="baseParams.category" placeholder="全部类型" clearable style="width: 150px">
                <el-option v-for="c in DEVICE_CATEGORY_OPTIONS" :key="c.value" :label="c.label" :value="c.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="在线状态">
              <el-select v-model="baseParams.onlineStatus" placeholder="全部状态" clearable style="width: 130px">
                <el-option label="在线" value="online" />
                <el-option label="离线" value="offline" />
                <el-option label="未知" value="unknown" />
                <el-option label="待接入" value="pending" />
              </el-select>
            </el-form-item>
            <el-form-item label="接入协议">
              <el-select v-model="baseParams.protocol" placeholder="全部协议" clearable style="width: 160px">
                <el-option v-for="p in PROTOCOL_OPTIONS" :key="p.value" :label="p.label" :value="p.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="所属租户">
              <el-select v-model="baseParams.tenantId" placeholder="全部租户" clearable filterable style="width: 190px">
                <el-option v-for="t in tenants" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="标签">
              <el-select v-model="baseParams.bannerTag" placeholder="全部标签" clearable style="width: 130px">
                <el-option v-for="t in tagOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="search">查询</el-button>
              <el-button :icon="'RefreshLeft'" @click="reset">重置</el-button>
              <el-button link type="primary" @click="showSearch = !showSearch">{{ showSearch ? '收起' : '展开' }}</el-button>
            </el-form-item>
          </el-form>
          <div class="dev__summary">
            <span>共 <b>{{ formatNumber(total) }}</b> 台设备</span>
            <span>在线 {{ stats.online }} / 离线 {{ stats.offline }} / 待接入 {{ stats.unknown }}</span>
            <span>总码率 {{ stats.totalBitrateGbps }} Gbps</span>
            <span>需关注（健康度 &lt; 70）<b class="is-warn">{{ stats.attention }}</b> 台</span>
          </div>
        </div>

        <!-- 批量操作条 -->
        <div v-if="selectedIds.length" class="dev__batch">
          <span>已选择 <b>{{ selectedIds.length }}</b> 台设备</span>
          <el-button size="small" :icon="'RefreshRight'" @click="batchOp('reboot', '批量重启')">批量重启</el-button>
          <el-button size="small" :icon="'Upload'" @click="batchOp('upgrade', '批量固件升级')">批量升级</el-button>
          <el-button size="small" :icon="'Setting'" @click="batchOp('config', '批量下发配置')">下发配置</el-button>
          <el-button size="small" :icon="'PriceTag'" @click="batchOp('tags', '批量打标签')">批量打标签</el-button>
          <el-button size="small" type="danger" :icon="'Delete'" @click="batchDelete">批量删除</el-button>
        </div>

        <div class="vc-card dev__table">
          <el-table
            v-loading="loading"
            :data="list"
            row-key="id"
            stripe
            height="100%"
            @sort-change="onSortChange"
            @selection-change="onSelectionChange"
          >
            <el-table-column type="selection" width="42" fixed="left" />
            <el-table-column label="设备名称 / SN" min-width="220" fixed="left">
              <template #default="{ row }">
                <div class="dev__name" @click="goDetail(row)">
                  <span class="dev__dot" :style="{ background: onlineStatusMeta(row.onlineStatus).color }" />
                  <div>
                    <div class="dev__name-main">{{ row.name }}</div>
                    <div class="dev__name-sub vc-mono">{{ row.sn }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="厂商 / 型号" min-width="180">
              <template #default="{ row }">
                <div>{{ row.vendor }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.model }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="类型" width="120" />
            <el-table-column label="状态" width="96" sortable="custom" prop="onlineStatus">
              <template #default="{ row }">
                <StatusTag :status="row.onlineStatus" kind="online" dot />
              </template>
            </el-table-column>
            <el-table-column label="健康度" width="130" sortable="custom" prop="healthScore">
              <template #default="{ row }">
                <div class="dev__health">
                  <el-progress :percentage="row.healthScore" :stroke-width="6" :show-text="false" :color="healthColor(row.healthScore)" />
                  <span :style="{ color: healthColor(row.healthScore) }">{{ row.healthScore }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="网络" min-width="150">
              <template #default="{ row }">
                <div class="vc-mono" style="font-size: 12px">{{ row.ip }}:{{ row.port }}</div>
                <div class="vc-text-tertiary" style="font-size: 11px">{{ row.protocol }}</div>
              </template>
            </el-table-column>
            <el-table-column label="通道 / 码率" width="140">
              <template #default="{ row }">
                <div>{{ row.channelCount }} 路</div>
                <div class="vc-text-tertiary" style="font-size: 11px">{{ row.resolution }} · {{ row.bitrateKbps }}Kbps</div>
              </template>
            </el-table-column>
            <el-table-column label="所属租户" min-width="170" show-overflow-tooltip>
              <template #default="{ row }">
                <div>{{ row.tenantName }}</div>
                <div class="vc-text-tertiary" style="font-size: 11px">{{ row.groupPath }}</div>
              </template>
            </el-table-column>
            <el-table-column label="近 7 天告警" width="110" sortable="custom" prop="alarmsLast7d">
              <template #default="{ row }">
                <span :class="{ 'vc-danger-text': row.alarmsLast7d > 3 }">{{ row.alarmsLast7d }}</span>
              </template>
            </el-table-column>
            <el-table-column label="最后心跳" width="150" sortable="custom" prop="lastHeartbeat">
              <template #default="{ row }">
                <div>{{ relativeTimeText(row.lastHeartbeat) }}</div>
                <div class="vc-text-tertiary" style="font-size: 11px">{{ row.lastHeartbeat.slice(11) }}</div>
              </template>
            </el-table-column>
            <el-table-column label="标签" min-width="150">
              <template #default="{ row }">
                <el-tag v-for="t in row.tags" :key="t" size="small" effect="plain" style="margin: 1px 3px 1px 0">{{ t }}</el-tag>
                <span v-if="!row.tags?.length" class="vc-text-tertiary">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="190" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="goDetail(row)">详情</el-button>
                <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
                <el-button link type="primary" size="small" @click="rebootOne(row)">重启</el-button>
                <el-button link type="danger" size="small" @click="removeOne(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <EmptyState description="没有找到符合条件的设备" tips="可调整筛选条件，或新增设备" action-text="新增设备" @action="openCreate" />
            </template>
          </el-table>

          <div class="dev__pager">
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
      </div>
    </div>

    <DeviceFormDialog v-model="dialogVisible" :editing="editing" :tenants="tenants" :groups="groups" @saved="onSaved" />
  </PageContainer>
</template>

<style scoped>
.dev {
  display: flex;
  gap: 16px;
  height: calc(100vh - 168px);
  min-height: 560px;
}

.dev__tree {
  width: 232px;
  flex-shrink: 0;
  padding: 14px;
  overflow: auto;
}

.dev__group {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.dev__group span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dev__group em {
  font-style: normal;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.dev__group:hover {
  background: var(--el-fill-color-light);
}

.dev__group.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.dev__group--child {
  padding-left: 26px;
  color: var(--el-text-color-regular);
}

.dev__stat {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--el-border-color);
}

.dev__stat-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
}

.dev__stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  margin-bottom: 7px;
}

.dev__stat-item span {
  width: 92px;
  color: var(--el-text-color-secondary);
}

.dev__stat-bar {
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: var(--el-fill-color);
  overflow: hidden;
}

.dev__stat-bar i {
  display: block;
  height: 100%;
  background: var(--el-color-primary);
}

.dev__stat-item em {
  font-style: normal;
  width: 28px;
  text-align: right;
  color: var(--el-text-color-regular);
}

.dev__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dev__filter {
  padding: 14px 16px 6px;
}

.dev__filter :deep(.el-form-item) {
  margin-bottom: 10px;
}

.dev__summary {
  display: flex;
  gap: 20px;
  padding: 8px 0 10px;
  border-top: 1px dashed var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-wrap: wrap;
}

.dev__summary b {
  color: var(--el-text-color-primary);
}

.dev__summary b.is-warn {
  color: var(--vc-danger);
}

.dev__batch {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 8px;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  font-size: 13px;
}

.dev__table {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.dev__table :deep(.el-table) {
  flex: 1;
}

.dev__name {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.dev__name-main {
  font-size: 13px;
  font-weight: 500;
}

.dev__name-main:hover {
  color: var(--el-color-primary);
}

.dev__name-sub {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.dev__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dev__health {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dev__health :deep(.el-progress) {
  flex: 1;
}

.dev__health span {
  font-size: 12px;
  width: 22px;
  text-align: right;
}

.vc-danger-text {
  color: var(--vc-danger);
  font-weight: 500;
}

.dev__pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
