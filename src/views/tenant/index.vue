<script setup lang="ts">
/**
 * 租户与权限：租户管理（配额）、用户管理、角色权限、组织架构、操作审计
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tenantApi, userApi } from '@/api'
import { useTable, paginationLayout, paginationSizes } from '@/composables/useTable'
import PageContainer from '@/components/PageContainer.vue'
import StatCard from '@/components/StatCard.vue'
import BaseChart from '@/components/BaseChart.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { TENANT_STATUS_OPTIONS } from '@/utils/dict'
import { formatDateTime, formatDuration, formatNumber, formatPercent, formatStorage } from '@/utils/format'

const activeTab = ref('tenant')

/* ---------- 租户 ---------- */
const tenantTable = useTable({
  api: tenantApi.list as any,
  syncQuery: true,
  defaultParams: { keyword: '', status: '' }
})

const tenantDialog = ref(false)
const tenantEditing = ref<any>(null)
const tenantForm = reactive<any>({
  name: '',
  code: '',
  industry: '政府',
  contact: '',
  phone: '',
  email: '',
  province: '',
  city: '',
  planName: '专业版',
  deviceQuota: 200,
  storageQuotaTB: 200,
  aiChannelQuota: 50,
  expireDate: '',
  status: 'normal'
})

const quotaDialog = ref(false)
const quotaForm = reactive<any>({ id: '', name: '', deviceQuota: 0, deviceUsed: 0, storageQuotaTB: 0, storageUsedTB: 0, aiChannelQuota: 0, aiChannelUsed: 0 })

const INDUSTRIES = ['政府', '交通', '能源', '教育', '医疗', '园区', '金融', '制造', '零售', '其他']
const PLANS = [
  { label: '基础版', value: '基础版' },
  { label: '专业版', value: '专业版' },
  { label: '旗舰版', value: '旗舰版' }
]

const tenantStats = computed(() => {
  const list = tenantTable.list.value as any[]
  return {
    total: tenantTable.total.value,
    normal: list.filter((t) => t.status === 'normal').length,
    arrears: list.filter((t) => t.status === 'arrears').length,
    deviceUsed: list.reduce((a, t) => a + t.deviceUsed, 0),
    storageUsed: Number(list.reduce((a, t) => a + t.storageUsedTB, 0).toFixed(1)),
    balance: Number(list.reduce((a, t) => a + t.balance, 0).toFixed(2))
  }
})

function openTenantCreate() {
  tenantEditing.value = null
  Object.assign(tenantForm, {
    name: '',
    code: '',
    industry: '政府',
    contact: '',
    phone: '',
    email: '',
    province: '浙江省',
    city: '杭州市',
    planName: '专业版',
    deviceQuota: 200,
    storageQuotaTB: 200,
    aiChannelQuota: 50,
    expireDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    status: 'normal'
  })
  tenantDialog.value = true
}

function openTenantEdit(row: any) {
  tenantEditing.value = row
  Object.assign(tenantForm, JSON.parse(JSON.stringify(row)))
  tenantDialog.value = true
}

async function submitTenant() {
  if (!tenantForm.name) return ElMessage.warning('请输入租户名称')
  if (!tenantForm.code) return ElMessage.warning('请输入租户编码')
  if (tenantEditing.value) {
    await tenantApi.update(tenantEditing.value.id, { ...tenantForm })
    ElMessage.success('租户信息已更新')
  } else {
    await tenantApi.create({ ...tenantForm })
    ElMessage.success('租户已创建')
  }
  tenantDialog.value = false
  tenantTable.load()
}

async function removeTenant(row: any) {
  try {
    await ElMessageBox.confirm(`删除租户「${row.name}」后其账号将无法登录。确认删除？`, '删除租户', { type: 'warning' })
    await tenantApi.remove(row.id)
    ElMessage.success('租户已删除')
    tenantTable.load()
  } catch {
    /* 已提示 */
  }
}

function openQuota(row: any) {
  Object.assign(quotaForm, {
    id: row.id,
    name: row.name,
    deviceQuota: row.deviceQuota,
    deviceUsed: row.deviceUsed,
    storageQuotaTB: row.storageQuotaTB,
    storageUsedTB: row.storageUsedTB,
    aiChannelQuota: row.aiChannelQuota,
    aiChannelUsed: row.aiChannelUsed
  })
  quotaDialog.value = true
}

async function submitQuota() {
  try {
    await tenantApi.updateQuota(quotaForm.id, {
      deviceQuota: quotaForm.deviceQuota,
      storageQuotaTB: quotaForm.storageQuotaTB,
      aiChannelQuota: quotaForm.aiChannelQuota
    })
    ElMessage.success('配额已更新')
    quotaDialog.value = false
    tenantTable.load()
  } catch {
    /* 已提示 */
  }
}

/* ---------- 用户 ---------- */
const userTable = useTable({
  api: userApi.list as any,
  defaultParams: { keyword: '', roleId: '', tenantId: '', status: '' }
})
const roles = ref<any[]>([])
const tenants = ref<any[]>([])
const depts = ref<any[]>([])

const userDialog = ref(false)
const userEditing = ref<any>(null)
const userForm = reactive<any>({ username: '', nickname: '', phone: '', email: '', roleIds: [] as string[], deptId: '', tenantId: '', status: 1 })

function openUserCreate() {
  userEditing.value = null
  Object.assign(userForm, { username: '', nickname: '', phone: '', email: '', roleIds: [], deptId: '', tenantId: '', status: 1 })
  userDialog.value = true
}

function openUserEdit(row: any) {
  userEditing.value = row
  Object.assign(userForm, {
    username: row.username,
    nickname: row.nickname,
    phone: row.phone,
    email: row.email,
    roleIds: [...(row.roleIds || [])],
    deptId: row.deptId,
    tenantId: row.tenantId,
    status: row.status
  })
  userDialog.value = true
}

async function submitUser() {
  if (!userForm.username) return ElMessage.warning('请输入登录账号')
  if (!userForm.nickname) return ElMessage.warning('请输入姓名')
  if (!userForm.roleIds.length) return ElMessage.warning('请至少分配一个角色')
  try {
    if (userEditing.value) {
      await userApi.update(userEditing.value.id, { ...userForm })
      ElMessage.success('用户信息已更新')
    } else {
      await userApi.create({ ...userForm, password: '123456' })
      ElMessage.success('用户已创建，初始密码 123456')
    }
    userDialog.value = false
    userTable.load()
  } catch {
    /* 已提示 */
  }
}

async function toggleUser(row: any) {
  await userApi.update(row.id, { status: row.status === 1 ? 0 : 1 })
  row.status = row.status === 1 ? 0 : 1
  ElMessage.success(row.status === 1 ? '账号已启用' : '账号已停用')
}

async function removeUser(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除用户「${row.nickname}（${row.username}）」？`, '删除用户', { type: 'warning' })
    await userApi.remove(row.id)
    ElMessage.success('用户已删除')
    userTable.load()
  } catch {
    /* 已提示 */
  }
}

async function resetPwd(row: any) {
  await ElMessageBox.confirm(`确认将用户「${row.nickname}」的密码重置为初始密码 123456？`, '重置密码', { type: 'warning' })
  ElMessage.success('密码已重置为 123456，请提醒用户首次登录后修改')
}

/* ---------- 角色 ---------- */
const roleTable = useTable({
  api: userApi.roles as any,
  defaultParams: { keyword: '' }
})
const roleDrawer = ref(false)
const roleCurrent = ref<any>(null)
const rolePerm = reactive<any>({ menuPermissions: [] as string[], buttonPermissions: [] as string[], dataScope: 'self' })

const ALL_MENUS = [
  { value: 'dashboard', label: '数据驾驶舱' },
  { value: 'device', label: '设备中心' },
  { value: 'alarm', label: '告警与事件中心' },
  { value: 'storage', label: '云存储服务' },
  { value: 'video', label: '视频与流媒体' },
  { value: 'ai', label: 'AI 智能分析' },
  { value: 'service', label: '技术服务与工单' },
  { value: 'monitor', label: '运维监控' },
  { value: 'openapi', label: '数据服务与开放平台' },
  { value: 'tenant', label: '租户与权限' },
  { value: 'billing', label: '计费与账务' },
  { value: 'system', label: '系统设置' }
]

const ALL_BUTTONS = [
  'device:create', 'device:update', 'device:delete', 'device:reboot',
  'alarm:handle', 'alarm:transfer', 'alarm:rule',
  'storage:pool', 'storage:plan', 'storage:archive',
  'ai:task', 'ai:algorithm',
  'order:create', 'order:assign', 'order:complete', 'order:visit',
  'openapi:app', 'openapi:webhook',
  'tenant:manage', 'user:manage', 'billing:manage', 'system:manage'
]

const DATA_SCOPES = [
  { value: 'self', label: '仅本人数据' },
  { value: 'dept', label: '本部门数据' },
  { value: 'deptAndChild', label: '本部门及下级' },
  { value: 'tenant', label: '本租户全部' },
  { value: 'all', label: '全部数据（跨租户）' }
]

function openRole(row: any) {
  roleCurrent.value = row
  rolePerm.menuPermissions = [...(row.menuPermissions || [])]
  rolePerm.buttonPermissions = [...(row.buttonPermissions || [])]
  rolePerm.dataScope = row.dataScope
  roleDrawer.value = true
}

async function submitRole() {
  try {
    await userApi.updateRolePermissions(roleCurrent.value.id, { ...rolePerm })
    ElMessage.success('角色权限已保存，相关用户下次登录生效')
    roleDrawer.value = false
    roleTable.load()
  } catch {
    /* 已提示 */
  }
}

/* ---------- 操作日志 ---------- */
const logTable = useTable({
  api: userApi.operationLogs as any,
  defaultParams: { keyword: '', result: '' }
})
const logTimeRange = ref<[string, string] | null>(null)
const logDrawer = ref(false)
const logDetail = ref<any>(null)

function openLog(row: any) {
  logDetail.value = row
  logDrawer.value = true
}

/* ---------- 部门 ---------- */
function flattenDept(list: any[], prefix = ''): any[] {
  const out: any[] = []
  list.forEach((d) => {
    out.push({ id: d.id, label: prefix + d.name, leader: d.leader, phone: d.phone, tenantId: d.tenantId })
    if (d.children?.length) out.push(...flattenDept(d.children, `${prefix}${d.name} / `))
  })
  return out
}
const flatDepts = computed(() => flattenDept(depts.value))

/* 租户配额使用率分布 */
const quotaOption = computed(() => {
  const list = (tenantTable.list.value as any[]).slice(0, 8).reverse()
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['设备配额使用率', '存储配额使用率', 'AI 通道使用率'], top: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
    grid: { left: 12, right: 30, top: 40, bottom: 8, containLabel: true },
    xAxis: { type: 'value', max: 100, name: '%' },
    yAxis: { type: 'category', data: list.map((t) => t.name), axisLabel: { fontSize: 11, width: 110, overflow: 'truncate' } },
    series: [
      { name: '设备配额使用率', type: 'bar', barWidth: 8, itemStyle: { borderRadius: [0, 3, 3, 0] }, data: list.map((t) => Number(((t.deviceUsed / Math.max(1, t.deviceQuota)) * 100).toFixed(1))) },
      { name: '存储配额使用率', type: 'bar', barWidth: 8, itemStyle: { borderRadius: [0, 3, 3, 0] }, data: list.map((t) => Number(((t.storageUsedTB / Math.max(1, t.storageQuotaTB)) * 100).toFixed(1))) },
      { name: 'AI 通道使用率', type: 'bar', barWidth: 8, itemStyle: { borderRadius: [0, 3, 3, 0] }, data: list.map((t) => Number(((t.aiChannelUsed / Math.max(1, t.aiChannelQuota)) * 100).toFixed(1))) }
    ]
  }
})

function quotaColor(rate: number) {
  if (rate >= 95) return '#ff4d4f'
  if (rate >= 80) return '#faad14'
  return '#52c41a'
}

onMounted(async () => {
  const [r, t, d] = await Promise.all([
    userApi.roles({ page: 1, pageSize: 100 }),
    tenantApi.list({ page: 1, pageSize: 100 }),
    userApi.deptTree()
  ])
  roles.value = (r as any).list || []
  tenants.value = (t as any).list || []
  depts.value = (d as any) || []
})
</script>

<template>
  <PageContainer title="租户与权限" subtitle="租户配额、账号角色、组织架构与操作审计">
    <template #header>
      <el-button :icon="'Refresh'" @click="tenantTable.load">刷新</el-button>
      <el-button type="primary" :icon="'Plus'" @click="openTenantCreate">新建租户</el-button>
    </template>

    <el-row :gutter="12">
      <el-col :span="4"><StatCard label="租户总数" :value="tenantStats.total" icon="OfficeBuilding" color="#1677ff" footer="当前筛选条件" /></el-col>
      <el-col :span="4"><StatCard label="正常租户" :value="tenantStats.normal" icon="CircleCheck" color="#52c41a" footer="服务正常" /></el-col>
      <el-col :span="4"><StatCard label="欠费 / 停用" :value="tenantStats.arrears" icon="WarningFilled" color="#ff4d4f" footer="需跟进处理" /></el-col>
      <el-col :span="4"><StatCard label="已接入设备" :value="tenantStats.deviceUsed" icon="VideoCamera" color="#722ed1" footer="当前页口径" /></el-col>
      <el-col :span="4"><StatCard label="已用存储" :value="tenantStats.storageUsed" unit="TB" :decimals="1" icon="FolderOpened" color="#13c2c2" footer="当前页口径" /></el-col>
      <el-col :span="4"><StatCard label="账户余额合计" :value="tenantStats.balance" unit="元" :decimals="2" icon="Money" color="#fa8c16" footer="当前页口径" /></el-col>
    </el-row>

    <el-tabs v-model="activeTab" style="margin-top: 12px">
      <!-- 租户管理 -->
      <el-tab-pane label="租户管理" name="tenant">
        <div class="vc-card tn__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="tenantTable.baseParams.value.keyword" placeholder="租户名称 / 编码 / 联系人 / 城市" clearable style="width: 260px" @keyup.enter="tenantTable.search" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="tenantTable.baseParams.value.status" placeholder="全部" clearable style="width: 140px">
                <el-option v-for="s in TENANT_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="tenantTable.search">查询</el-button>
              <el-button :icon="'RefreshLeft'" @click="tenantTable.reset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="vc-card" style="padding: 14px; margin-bottom: 12px">
          <div class="vc-panel-title">各租户配额使用率</div>
          <BaseChart :option="quotaOption" :height="260" :empty="!(tenantTable.list.value as any[]).length" />
        </div>

        <div class="vc-card tn__table">
          <el-table v-loading="tenantTable.loading.value" :data="tenantTable.list.value" stripe>
            <el-table-column label="租户名称" min-width="220">
              <template #default="{ row }">
                <div style="font-weight: 500">{{ row.name }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.code }}</div>
              </template>
            </el-table-column>
            <el-table-column label="行业 / 地区" width="160">
              <template #default="{ row }">
                <div>{{ row.industry }}</div>
                <div class="vc-text-tertiary" style="font-size: 11px">{{ row.province }} {{ row.city }}</div>
              </template>
            </el-table-column>
            <el-table-column label="联系人" width="160">
              <template #default="{ row }">
                <div>{{ row.contact }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.phone }}</div>
              </template>
            </el-table-column>
            <el-table-column label="套餐" width="100">
              <template #default="{ row }">
                <el-tag size="small" effect="plain" :type="row.planName === '旗舰版' ? 'danger' : row.planName === '专业版' ? 'primary' : 'info'">{{ row.planName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="设备配额" min-width="170">
              <template #default="{ row }">
                <div class="tn__rate">
                  <el-progress :percentage="Math.min(100, Math.round((row.deviceUsed / Math.max(1, row.deviceQuota)) * 100))" :stroke-width="8" :show-text="false" :color="quotaColor((row.deviceUsed / Math.max(1, row.deviceQuota)) * 100)" />
                  <span>{{ row.deviceUsed }}/{{ row.deviceQuota }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="存储配额" min-width="180">
              <template #default="{ row }">
                <div class="tn__rate">
                  <el-progress :percentage="Math.min(100, Math.round((row.storageUsedTB / Math.max(1, row.storageQuotaTB)) * 100))" :stroke-width="8" :show-text="false" :color="quotaColor((row.storageUsedTB / Math.max(1, row.storageQuotaTB)) * 100)" />
                  <span>{{ row.storageUsedTB }}/{{ row.storageQuotaTB }} TB</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="AI 通道" min-width="160">
              <template #default="{ row }">
                <div class="tn__rate">
                  <el-progress :percentage="Math.min(100, Math.round((row.aiChannelUsed / Math.max(1, row.aiChannelQuota)) * 100))" :stroke-width="8" :show-text="false" :color="quotaColor((row.aiChannelUsed / Math.max(1, row.aiChannelQuota)) * 100)" />
                  <span>{{ row.aiChannelUsed }}/{{ row.aiChannelQuota }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="余额" width="130" sortable :sort-method="(a: any, b: any) => a.balance - b.balance">
              <template #default="{ row }">
                <span :style="{ color: row.balance <= 0 ? '#ff4d4f' : '#52c41a' }">¥{{ formatNumber(row.balance, 2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="到期日" width="120" prop="expireDate" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }"><StatusTag :status="row.status" kind="tenant" /></template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openTenantEdit(row)">编辑</el-button>
                <el-button link type="warning" size="small" @click="openQuota(row)">配额</el-button>
                <el-button link type="danger" size="small" @click="removeTenant(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="没有符合条件的租户" action-text="新建租户" @action="openTenantCreate" /></template>
          </el-table>
          <div class="tn__pager">
            <el-pagination
              :current-page="tenantTable.page.value"
              :page-size="tenantTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="tenantTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="tenantTable.onPageChange"
              @size-change="tenantTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 用户管理 -->
      <el-tab-pane label="用户管理" name="user">
        <div class="vc-card tn__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="userTable.baseParams.value.keyword" placeholder="账号 / 姓名 / 手机 / 邮箱" clearable style="width: 240px" @keyup.enter="userTable.search" />
            </el-form-item>
            <el-form-item label="角色">
              <el-select v-model="userTable.baseParams.value.roleId" placeholder="全部角色" clearable style="width: 170px">
                <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="租户">
              <el-select v-model="userTable.baseParams.value.tenantId" placeholder="全部租户" clearable filterable style="width: 190px">
                <el-option v-for="t in tenants" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="userTable.baseParams.value.status" placeholder="全部" clearable style="width: 130px">
                <el-option label="启用" value="1" />
                <el-option label="停用" value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="userTable.search">查询</el-button>
              <el-button type="primary" plain :icon="'Plus'" @click="openUserCreate">新增用户</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card tn__table">
          <el-table v-loading="userTable.loading.value" :data="userTable.list.value" stripe>
            <el-table-column label="用户" min-width="200">
              <template #default="{ row }">
                <div class="tn__user">
                  <img :src="row.avatar" class="tn__avatar" alt="头像" />
                  <div>
                    <div style="font-weight: 500">{{ row.nickname }}</div>
                    <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.username }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="联系方式" min-width="190">
              <template #default="{ row }">
                <div class="vc-mono" style="font-size: 12px">{{ row.phone }}</div>
                <div class="vc-text-tertiary" style="font-size: 11px">{{ row.email }}</div>
              </template>
            </el-table-column>
            <el-table-column label="角色" min-width="190">
              <template #default="{ row }">
                <el-tag v-for="r in row.roleNames" :key="r" size="small" effect="plain" style="margin: 1px 3px 1px 0">{{ r }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deptName" label="部门" width="140" />
            <el-table-column prop="tenantName" label="所属租户" min-width="170" show-overflow-tooltip />
            <el-table-column label="最后登录" width="180">
              <template #default="{ row }">
                <div v-if="row.lastLoginTime">{{ formatDateTime(row.lastLoginTime) }}</div>
                <div v-else class="vc-text-tertiary">从未登录</div>
                <div v-if="row.lastLoginIp" class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.lastLoginIp }}</div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-switch :model-value="row.status === 1" @change="toggleUser(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openUserEdit(row)">编辑</el-button>
                <el-button link type="warning" size="small" @click="resetPwd(row)">重置密码</el-button>
                <el-button link type="danger" size="small" @click="removeUser(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="暂无用户" action-text="新增用户" @action="openUserCreate" /></template>
          </el-table>
          <div class="tn__pager">
            <el-pagination
              :current-page="userTable.page.value"
              :page-size="userTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="userTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="userTable.onPageChange"
              @size-change="userTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 角色权限 -->
      <el-tab-pane label="角色权限" name="role">
        <div class="vc-card tn__table">
          <el-table v-loading="roleTable.loading.value" :data="roleTable.list.value" stripe>
            <el-table-column label="角色名称" min-width="180">
              <template #default="{ row }">
                <div style="font-weight: 500">{{ row.name }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.code }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="角色说明" min-width="240" show-overflow-tooltip />
            <el-table-column label="数据范围" width="160">
              <template #default="{ row }">{{ DATA_SCOPES.find((s) => s.value === row.dataScope)?.label || row.dataScope }}</template>
            </el-table-column>
            <el-table-column label="菜单权限" width="120">
              <template #default="{ row }">{{ (row.menuPermissions || []).length }} / {{ ALL_MENUS.length }}</template>
            </el-table-column>
            <el-table-column label="按钮权限" width="120">
              <template #default="{ row }">{{ (row.buttonPermissions || []).length }} / {{ ALL_BUTTONS.length }}</template>
            </el-table-column>
            <el-table-column label="用户数" width="100" prop="userCount" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 1 ? 'success' : 'info'" effect="plain">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openRole(row)">配置权限</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="暂无角色" /></template>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 组织架构 -->
      <el-tab-pane label="组织架构" name="dept">
        <div class="vc-card">
          <el-table :data="flatDepts" stripe>
            <el-table-column prop="label" label="组织 / 部门" min-width="280" />
            <el-table-column prop="leader" label="负责人" width="140" />
            <el-table-column prop="phone" label="联系电话" width="170">
              <template #default="{ row }"><span class="vc-mono">{{ row.phone }}</span></template>
            </el-table-column>
            <el-table-column label="所属租户" min-width="200">
              <template #default="{ row }">{{ tenants.find((t) => t.id === row.tenantId)?.name || '-' }}</template>
            </el-table-column>
            <template #empty><EmptyState description="暂无部门数据" /></template>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 操作日志 -->
      <el-tab-pane label="操作审计" name="log">
        <div class="vc-card tn__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="logTable.baseParams.value.keyword" placeholder="操作人 / 模块 / 动作 / 接口" clearable style="width: 240px" @keyup.enter="logTable.search" />
            </el-form-item>
            <el-form-item label="结果">
              <el-select v-model="logTable.baseParams.value.result" placeholder="全部" clearable style="width: 130px">
                <el-option label="成功" value="success" />
                <el-option label="失败" value="fail" />
              </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="logTimeRange"
                type="datetimerange"
                value-format="YYYY-MM-DD HH:mm:ss"
                start-placeholder="开始"
                end-placeholder="结束"
                style="width: 330px"
                @change="(v: any) => { logTable.baseParams.value.startTime = v?.[0] || ''; logTable.baseParams.value.endTime = v?.[1] || ''; logTable.search() }"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="logTable.search">查询</el-button>
              <el-button :icon="'RefreshLeft'" @click="() => { logTimeRange = null; logTable.reset() }">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card tn__table">
          <el-table v-loading="logTable.loading.value" :data="logTable.list.value" stripe size="small">
            <el-table-column prop="createTime" label="操作时间" width="170" />
            <el-table-column prop="operator" label="操作人" width="120" />
            <el-table-column prop="module" label="模块" width="130" />
            <el-table-column prop="action" label="动作" width="130" />
            <el-table-column prop="target" label="操作对象" min-width="200" show-overflow-tooltip />
            <el-table-column label="请求" min-width="260">
              <template #default="{ row }">
                <span class="vc-mono" style="font-size: 11px">{{ row.method }} {{ row.url }}</span>
              </template>
            </el-table-column>
            <el-table-column label="结果" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.result === 'success' ? 'success' : 'danger'" effect="plain">{{ row.result === 'success' ? '成功' : '失败' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="耗时" width="100" sortable :sort-method="(a: any, b: any) => a.duration - b.duration">
              <template #default="{ row }">{{ row.duration }} ms</template>
            </el-table-column>
            <el-table-column prop="ip" label="来源 IP" width="140">
              <template #default="{ row }"><span class="vc-mono" style="font-size: 11px">{{ row.ip }}</span></template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openLog(row)">详情</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="暂无操作日志" /></template>
          </el-table>
          <div class="tn__pager">
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
    </el-tabs>

    <!-- 租户表单 -->
    <el-dialog v-model="tenantDialog" :title="tenantEditing ? '编辑租户' : '新建租户'" width="720px" top="7vh">
      <el-form :model="tenantForm" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="租户名称" required>
              <el-input v-model="tenantForm.name" placeholder="如：某某市公共安全管理平台" maxlength="40" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租户编码" required>
              <el-input v-model="tenantForm.code" placeholder="如：TENANT-HZ-001" class="vc-mono" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="行业">
              <el-select v-model="tenantForm.industry" style="width: 100%">
                <el-option v-for="i in INDUSTRIES" :key="i" :label="i" :value="i" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="套餐版本">
              <el-select v-model="tenantForm.planName" style="width: 100%">
                <el-option v-for="p in PLANS" :key="p.value" :label="p.label" :value="p.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人">
              <el-input v-model="tenantForm.contact" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="tenantForm.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="tenantForm.email" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="省份">
              <el-input v-model="tenantForm.province" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="城市">
              <el-input v-model="tenantForm.city" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="设备配额">
              <el-input-number v-model="tenantForm.deviceQuota" :min="1" :max="100000" :step="50" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="存储配额(TB)">
              <el-input-number v-model="tenantForm.storageQuotaTB" :min="1" :max="1000000" :step="100" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="AI 通道配额">
              <el-input-number v-model="tenantForm.aiChannelQuota" :min="0" :max="10000" :step="10" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务到期">
              <el-date-picker v-model="tenantForm.expireDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租户状态">
              <el-select v-model="tenantForm.status" style="width: 100%">
                <el-option v-for="s in TENANT_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="tenantDialog = false">取消</el-button>
        <el-button type="primary" @click="submitTenant">{{ tenantEditing ? '保存修改' : '确认创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 配额调整 -->
    <el-dialog v-model="quotaDialog" :title="`调整配额 - ${quotaForm.name}`" width="560px">
      <el-form :model="quotaForm" label-width="140px">
        <el-form-item label="设备配额">
          <el-input-number v-model="quotaForm.deviceQuota" :min="quotaForm.deviceUsed" :max="100000" controls-position="right" style="width: 100%" />
          <div class="vc-text-tertiary" style="font-size: 11px">当前已用 {{ quotaForm.deviceUsed }} 台，配额不能小于已用数量</div>
        </el-form-item>
        <el-form-item label="存储配额(TB)">
          <el-input-number v-model="quotaForm.storageQuotaTB" :min="Math.ceil(quotaForm.storageUsedTB)" :max="1000000" controls-position="right" style="width: 100%" />
          <div class="vc-text-tertiary" style="font-size: 11px">当前已用 {{ quotaForm.storageUsedTB }} TB</div>
        </el-form-item>
        <el-form-item label="AI 通道配额">
          <el-input-number v-model="quotaForm.aiChannelQuota" :min="quotaForm.aiChannelUsed" :max="10000" controls-position="right" style="width: 100%" />
          <div class="vc-text-tertiary" style="font-size: 11px">当前已用 {{ quotaForm.aiChannelUsed }} 路</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quotaDialog = false">取消</el-button>
        <el-button type="primary" @click="submitQuota">保存配额</el-button>
      </template>
    </el-dialog>

    <!-- 用户表单 -->
    <el-dialog v-model="userDialog" :title="userEditing ? '编辑用户' : '新增用户'" width="640px">
      <el-form :model="userForm" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="登录账号" required>
              <el-input v-model="userForm.username" :disabled="!!userEditing" placeholder="字母数字组合" class="vc-mono" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" required>
              <el-input v-model="userForm.nickname" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="userForm.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="userForm.email" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="分配角色" required>
              <el-select v-model="userForm.roleIds" multiple placeholder="选择一个或多个角色" style="width: 100%">
                <el-option v-for="r in roles" :key="r.id" :label="`${r.name}（${r.code}）`" :value="r.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属租户">
              <el-select v-model="userForm.tenantId" clearable filterable placeholder="平台级账号可留空" style="width: 100%">
                <el-option v-for="t in tenants" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属部门">
              <el-select v-model="userForm.deptId" clearable filterable placeholder="选择部门" style="width: 100%">
                <el-option v-for="d in flatDepts" :key="d.id" :label="d.label" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账号状态">
              <el-switch v-model="userForm.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="userDialog = false">取消</el-button>
        <el-button type="primary" @click="submitUser">{{ userEditing ? '保存修改' : '确认创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 角色权限 -->
    <el-drawer v-model="roleDrawer" :title="`配置权限 - ${roleCurrent?.name || ''}`" size="620px">
      <div v-if="roleCurrent">
        <el-alert type="info" :closable="false" show-icon :title="`角色编码：${roleCurrent.code}`" :description="roleCurrent.description" />
        <div class="vc-panel-title" style="margin-top: 16px">数据范围</div>
        <el-radio-group v-model="rolePerm.dataScope">
          <el-radio v-for="s in DATA_SCOPES" :key="s.value" :value="s.value" style="display: block; margin: 6px 0">{{ s.label }}</el-radio>
        </el-radio-group>

        <div class="vc-panel-title" style="margin-top: 16px">菜单权限（{{ rolePerm.menuPermissions.length }}/{{ ALL_MENUS.length }}）</div>
        <el-checkbox-group v-model="rolePerm.menuPermissions">
          <div class="tn__permGrid">
            <el-checkbox v-for="m in ALL_MENUS" :key="m.value" :value="m.value">{{ m.label }}</el-checkbox>
          </div>
        </el-checkbox-group>

        <div class="vc-panel-title" style="margin-top: 16px">按钮权限（{{ rolePerm.buttonPermissions.length }}/{{ ALL_BUTTONS.length }}）</div>
        <el-checkbox-group v-model="rolePerm.buttonPermissions">
          <div class="tn__permGrid">
            <el-checkbox v-for="b in ALL_BUTTONS" :key="b" :value="b">
              <span class="vc-mono" style="font-size: 12px">{{ b }}</span>
            </el-checkbox>
          </div>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="roleDrawer = false">取消</el-button>
        <el-button type="primary" @click="submitRole">保存权限</el-button>
      </template>
    </el-drawer>

    <!-- 日志详情 -->
    <el-drawer v-model="logDrawer" title="操作日志详情" size="560px">
      <el-descriptions v-if="logDetail" :column="1" border size="small">
        <el-descriptions-item label="操作时间">{{ formatDateTime(logDetail.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ logDetail.operator }}（{{ logDetail.operatorId }}）</el-descriptions-item>
        <el-descriptions-item label="来源 IP"><span class="vc-mono">{{ logDetail.ip }}</span></el-descriptions-item>
        <el-descriptions-item label="模块">{{ logDetail.module }}</el-descriptions-item>
        <el-descriptions-item label="动作">{{ logDetail.action }}</el-descriptions-item>
        <el-descriptions-item label="操作对象">{{ logDetail.target }}</el-descriptions-item>
        <el-descriptions-item label="请求方法">{{ logDetail.method }}</el-descriptions-item>
        <el-descriptions-item label="请求地址"><span class="vc-mono" style="font-size: 12px">{{ logDetail.url }}</span></el-descriptions-item>
        <el-descriptions-item label="请求参数"><span class="vc-mono" style="font-size: 12px">{{ logDetail.params }}</span></el-descriptions-item>
        <el-descriptions-item label="执行结果">
          <el-tag size="small" :type="logDetail.result === 'success' ? 'success' : 'danger'" effect="plain">{{ logDetail.result === 'success' ? '成功' : '失败' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="执行耗时">{{ logDetail.duration }} ms</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </PageContainer>
</template>

<style scoped>
.tn__filter {
  padding: 14px 16px 4px;
  margin-bottom: 12px;
}

.tn__filter :deep(.el-form-item) {
  margin-bottom: 10px;
}

.tn__table {
  padding: 0;
  overflow: hidden;
}

.tn__pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.tn__rate {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tn__rate :deep(.el-progress) {
  flex: 1;
}

.tn__rate span {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  width: 78px;
  text-align: right;
  flex-shrink: 0;
}

.tn__user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tn__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tn__permGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}
</style>
