<script setup lang="ts">
/**
 * 计费与账务：计费项配置、账单管理、充值记录与发票管理
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { billingApi, tenantApi } from '@/api'
import { useTable, paginationLayout, paginationSizes } from '@/composables/useTable'
import PageContainer from '@/components/PageContainer.vue'
import StatCard from '@/components/StatCard.vue'
import BaseChart from '@/components/BaseChart.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { formatDateTime, formatNumber } from '@/utils/format'
import { exportJson } from '@/utils/download'

const activeTab = ref('bill')

/* ---------- 计费项 ---------- */
const items = ref<any[]>([])
const itemDialog = ref(false)
const itemEditing = ref<any>(null)
const itemForm = reactive<any>({ id: '', code: '', name: '', unit: '', unitPrice: 0, billingCycle: '按月', description: '', status: 1, effectiveDate: '' })

async function loadItems() {
  items.value = (await billingApi.items()) || []
}

function openItemEdit(row: any) {
  itemEditing.value = row
  Object.assign(itemForm, JSON.parse(JSON.stringify(row)))
  itemDialog.value = true
}

async function submitItem() {
  if (itemForm.unitPrice < 0) return ElMessage.warning('单价不能为负数')
  await billingApi.updateItem(itemEditing.value.id, { ...itemForm })
  ElMessage.success('计费项已更新')
  itemDialog.value = false
  loadItems()
}

/* ---------- 账单 ---------- */
const billTable = useTable({
  api: billingApi.bills as any,
  syncQuery: true,
  defaultParams: { keyword: '', status: '', tenantId: '', period: '' }
})
const tenants = ref<any[]>([])

const billStats = computed(() => {
  const list = billTable.list.value as any[]
  const paid = list.filter((b) => b.status === 'paid')
  const pending = list.filter((b) => b.status === 'pending' || b.status === 'overdue')
  return {
    count: billTable.total.value,
    totalAmount: Number(list.reduce((a, b) => a + b.totalAmount, 0).toFixed(2)),
    paidAmount: Number(paid.reduce((a, b) => a + b.totalAmount, 0).toFixed(2)),
    unpaidAmount: Number(pending.reduce((a, b) => a + b.totalAmount, 0).toFixed(2)),
    overdue: list.filter((b) => b.status === 'overdue').length
  }
})

const billDrawer = ref(false)
const billDetail = ref<any>(null)

async function openBill(row: any) {
  billDetail.value = await billingApi.billDetail(row.id)
  billDrawer.value = true
}

async function voidBill(row: any) {
  try {
    await ElMessageBox.confirm(`作废后该账单不再参与结算，且不可恢复。确认作废账单 ${row.billNo}？`, '作废账单', { type: 'warning' })
    await billingApi.voidBill(row.id)
    ElMessage.success('账单已作废')
    billTable.load()
  } catch {
    /* 已提示 */
  }
}

function downloadBill() {
  exportJson(`账单_${billDetail.value.billNo}`, billDetail.value)
}

const billTrendOption = computed(() => {
  const list = (billTable.list.value as any[]).slice().sort((a, b) => (a.period > b.period ? 1 : -1))
  const periods = [...new Set(list.map((b) => b.period))]
  return {
    tooltip: { trigger: 'axis', axisTrigger: 'axis' },
    legend: { data: ['已支付金额', '待支付金额'], top: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
    grid: { left: 12, right: 20, top: 36, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: periods },
    yAxis: { type: 'value', name: '元' },
    series: [
      {
        name: '已支付金额',
        type: 'bar',
        stack: 'amount',
        barWidth: 22,
        itemStyle: { borderRadius: [0, 0, 0, 0] },
        data: periods.map((p) => Number(list.filter((b) => b.period === p && b.status === 'paid').reduce((a, b) => a + b.totalAmount, 0).toFixed(2)))
      },
      {
        name: '待支付金额',
        type: 'bar',
        stack: 'amount',
        barWidth: 22,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: '#faad14' },
        data: periods.map((p) => Number(list.filter((b) => b.period === p && b.status !== 'paid').reduce((a, b) => a + b.totalAmount, 0).toFixed(2)))
      }
    ]
  }
})

/* ---------- 充值 ---------- */
const rechargeTable = useTable({
  api: billingApi.recharges as any,
  defaultParams: { keyword: '', tenantId: '' }
})
const rechargeDialog = ref(false)
const rechargeForm = reactive<any>({ tenantId: '', amount: 10000, method: '在线支付' })

async function submitRecharge() {
  if (!rechargeForm.tenantId) return ElMessage.warning('请选择租户')
  if (!rechargeForm.amount || rechargeForm.amount <= 0) return ElMessage.warning('充值金额必须大于 0')
  try {
    const res: any = await billingApi.recharge({ ...rechargeForm })
    ElMessage.success(`充值成功，订单号 ${res.tradeNo}，账户余额 ¥${formatNumber(res.balanceAfter, 2)}`)
    rechargeDialog.value = false
    rechargeTable.load()
    billTable.load()
  } catch {
    /* 已提示 */
  }
}

/* ---------- 发票 ---------- */
const invoiceTable = useTable({
  api: billingApi.invoices as any,
  defaultParams: { keyword: '', status: '' }
})
const invoiceDialog = ref(false)
const invoiceForm = reactive<any>({ tenantId: '', titleType: 'company', title: '', taxNo: '', amount: 0, type: 'normal' })

async function submitInvoice() {
  if (!invoiceForm.tenantId) return ElMessage.warning('请选择租户')
  if (!invoiceForm.title) return ElMessage.warning('请输入发票抬头')
  if (!invoiceForm.amount || invoiceForm.amount <= 0) return ElMessage.warning('开票金额必须大于 0')
  if (invoiceForm.titleType === 'company' && !invoiceForm.taxNo) return ElMessage.warning('企业抬头必须填写税号')
  try {
    await billingApi.createInvoice({ ...invoiceForm })
    ElMessage.success('开票申请已提交，财务审核通过后将自动开具')
    invoiceDialog.value = false
    invoiceTable.load()
  } catch {
    /* 已提示 */
  }
}

async function issueInvoice(row: any) {
  const box = await ElMessageBox.prompt('请输入快递单号（可选，用于纸质发票寄送）：', '开具发票', {
    inputPlaceholder: '如顺丰 SF1234567890，电子发票可留空',
    confirmButtonText: '确认开票'
  }).catch(() => null)
  if (!box) return
  const res: any = await billingApi.updateInvoice(row.id, { status: 'issued' })
  ElMessage.success(`发票已开具，发票号 ${res.invoiceNo}`)
  invoiceTable.load()
}

async function rejectInvoice(row: any) {
  const box = await ElMessageBox.prompt('请输入驳回原因：', '驳回开票申请', { inputPlaceholder: '如：抬头与合同主体不一致' }).catch(() => null)
  if (!box) return
  await billingApi.updateInvoice(row.id, { status: 'rejected' })
  ElMessage.success('已驳回该开票申请')
  invoiceTable.load()
}

const invoiceStats = computed(() => {
  const list = invoiceTable.list.value as any[]
  return {
    total: invoiceTable.total.value,
    pending: list.filter((i) => i.status === 'pending').length,
    issued: list.filter((i) => i.status === 'issued').length,
    amount: Number(list.reduce((a, b) => a + b.amount, 0).toFixed(2))
  }
})

onMounted(async () => {
  await loadItems()
  const t = await tenantApi.list({ page: 1, pageSize: 100 })
  tenants.value = (t as any).list || []
})
</script>

<template>
  <PageContainer title="计费与账务" subtitle="计费项配置、账单结算、账户充值与发票管理">
    <template #header>
      <el-button :icon="'Refresh'" @click="() => { loadItems(); billTable.load() }">刷新</el-button>
      <el-button type="primary" :icon="'Wallet'" @click="rechargeDialog = true">账户充值</el-button>
    </template>

    <el-row :gutter="12">
      <el-col :span="4"><StatCard label="账单总数" :value="billStats.count" icon="Tickets" color="#1677ff" footer="当前筛选条件" /></el-col>
      <el-col :span="4"><StatCard label="账单总金额" :value="billStats.totalAmount" unit="元" :decimals="2" icon="Money" color="#722ed1" footer="含已作废" /></el-col>
      <el-col :span="4"><StatCard label="已回款金额" :value="billStats.paidAmount" unit="元" :decimals="2" icon="CircleCheck" color="#52c41a" footer="已支付账单" /></el-col>
      <el-col :span="4"><StatCard label="待回款金额" :value="billStats.unpaidAmount" unit="元" :decimals="2" icon="AlarmClock" color="#faad14" footer="待支付 + 已逾期" /></el-col>
      <el-col :span="4"><StatCard label="逾期账单" :value="billStats.overdue" icon="WarningFilled" color="#ff4d4f" footer="需催收跟进" /></el-col>
      <el-col :span="4"><StatCard label="计费项" :value="items.length" icon="Grid" color="#13c2c2" footer="生效中的计费规则" /></el-col>
    </el-row>

    <el-tabs v-model="activeTab" style="margin-top: 12px">
      <!-- 账单 -->
      <el-tab-pane label="账单管理" name="bill">
        <div class="vc-card bl__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="billTable.baseParams.value.keyword" placeholder="账单号 / 租户 / 账期" clearable style="width: 240px" @keyup.enter="billTable.search" />
            </el-form-item>
            <el-form-item label="租户">
              <el-select v-model="billTable.baseParams.value.tenantId" placeholder="全部租户" clearable filterable style="width: 200px">
                <el-option v-for="t in tenants" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="billTable.baseParams.value.status" placeholder="全部" clearable style="width: 140px">
                <el-option label="待支付" value="pending" />
                <el-option label="已支付" value="paid" />
                <el-option label="已逾期" value="overdue" />
                <el-option label="已作废" value="void" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="billTable.search">查询</el-button>
              <el-button :icon="'RefreshLeft'" @click="billTable.reset">重置</el-button>
              <el-button :icon="'Download'" @click="billTable.exportData([
                { key: 'billNo', label: '账单号' },
                { key: 'tenantName', label: '租户' },
                { key: 'period', label: '账期' },
                { key: 'totalAmount', label: '金额(元)' },
                { key: 'status', label: '状态' },
                { key: 'dueDate', label: '到期日' },
                { key: 'payTime', label: '支付时间' },
                { key: 'payMethod', label: '支付方式' }
              ], '账单台账')">导出账单</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="vc-card" style="padding: 14px; margin-bottom: 12px">
          <div class="vc-panel-title">各账期回款情况</div>
          <BaseChart :option="billTrendOption" :height="240" :empty="!(billTable.list.value as any[]).length" />
        </div>

        <div class="vc-card bl__table">
          <el-table v-loading="billTable.loading.value" :data="billTable.list.value" stripe>
            <el-table-column label="账单号" width="180">
              <template #default="{ row }">
                <span class="vc-mono" style="font-size: 12px">{{ row.billNo }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="tenantName" label="租户" min-width="200" show-overflow-tooltip />
            <el-table-column prop="period" label="账期" width="110" />
            <el-table-column label="计费明细" min-width="220">
              <template #default="{ row }">
                <div v-for="i in (row.items || []).slice(0, 2)" :key="i.billingCode" style="font-size: 12px">
                  {{ i.billingName }}：{{ formatNumber(i.quantity) }}{{ i.unit }} × ¥{{ i.unitPrice }}
                </div>
                <span v-if="(row.items || []).length > 2" class="vc-text-tertiary" style="font-size: 11px">等 {{ row.items.length }} 项</span>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="140" sortable :sort-method="(a: any, b: any) => a.totalAmount - b.totalAmount">
              <template #default="{ row }">
                <b style="font-size: 14px">¥{{ formatNumber(row.totalAmount, 2) }}</b>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }"><StatusTag :status="row.status" kind="bill" /></template>
            </el-table-column>
            <el-table-column prop="dueDate" label="到期日" width="120" />
            <el-table-column label="支付信息" min-width="180">
              <template #default="{ row }">
                <div v-if="row.payTime">{{ formatDateTime(row.payTime) }}</div>
                <div v-else class="vc-text-tertiary">未支付</div>
                <div v-if="row.payMethod" class="vc-text-tertiary" style="font-size: 11px">{{ row.payMethod }}</div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="130" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openBill(row)">明细</el-button>
                <el-button v-if="row.status !== 'paid' && row.status !== 'void'" link type="danger" size="small" @click="voidBill(row)">作废</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="没有符合条件的账单" /></template>
          </el-table>
          <div class="bl__pager">
            <el-pagination
              :current-page="billTable.page.value"
              :page-size="billTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="billTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="billTable.onPageChange"
              @size-change="billTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 计费项 -->
      <el-tab-pane label="计费项配置" name="item">
        <div class="vc-card bl__table">
          <el-table :data="items" stripe>
            <el-table-column label="计费项" min-width="220">
              <template #default="{ row }">
                <div style="font-weight: 500">{{ row.name }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.code }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="计费单位" width="120" />
            <el-table-column label="单价" width="150" sortable :sort-method="(a: any, b: any) => a.unitPrice - b.unitPrice">
              <template #default="{ row }">
                <b>¥{{ formatNumber(row.unitPrice, 4) }}</b>
              </template>
            </el-table-column>
            <el-table-column prop="billingCycle" label="结算周期" width="120" />
            <el-table-column prop="description" label="说明" min-width="280" show-overflow-tooltip />
            <el-table-column prop="effectiveDate" label="生效日期" width="120" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 1 ? 'success' : 'info'" effect="plain">{{ row.status === 1 ? '生效中' : '已停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openItemEdit(row)">编辑</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="暂无计费项" /></template>
          </el-table>
        </div>
        <el-alert
          style="margin-top: 12px"
          type="warning"
          :closable="false"
          show-icon
          title="调价影响提示"
          description="修改单价仅对生效日期之后的账期生效，已生成的账单不会重新计算。涉及存量客户的价格变更建议提前 30 天书面通知。"
        />
      </el-tab-pane>

      <!-- 充值记录 -->
      <el-tab-pane label="充值记录" name="recharge">
        <div class="vc-card bl__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="rechargeTable.baseParams.value.keyword" placeholder="租户 / 交易号" clearable style="width: 230px" @keyup.enter="rechargeTable.search" />
            </el-form-item>
            <el-form-item label="租户">
              <el-select v-model="rechargeTable.baseParams.value.tenantId" placeholder="全部租户" clearable filterable style="width: 200px">
                <el-option v-for="t in tenants" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="rechargeTable.search">查询</el-button>
              <el-button type="primary" plain :icon="'Wallet'" @click="rechargeDialog = true">发起充值</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card bl__table">
          <el-table v-loading="rechargeTable.loading.value" :data="rechargeTable.list.value" stripe>
            <el-table-column label="交易号" width="200">
              <template #default="{ row }"><span class="vc-mono" style="font-size: 12px">{{ row.tradeNo }}</span></template>
            </el-table-column>
            <el-table-column prop="tenantName" label="租户" min-width="200" show-overflow-tooltip />
            <el-table-column label="充值金额" width="140" sortable :sort-method="(a: any, b: any) => a.amount - b.amount">
              <template #default="{ row }"><b style="color: #52c41a">+¥{{ formatNumber(row.amount, 2) }}</b></template>
            </el-table-column>
            <el-table-column label="充值后余额" width="150">
              <template #default="{ row }">¥{{ formatNumber(row.balanceAfter, 2) }}</template>
            </el-table-column>
            <el-table-column prop="method" label="支付方式" width="130" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 'success' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'" effect="plain">
                  {{ row.status === 'success' ? '充值成功' : row.status === 'pending' ? '处理中' : '充值失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="120" />
            <el-table-column prop="createTime" label="充值时间" width="170" />
            <template #empty><EmptyState description="暂无充值记录" action-text="发起充值" @action="rechargeDialog = true" /></template>
          </el-table>
          <div class="bl__pager">
            <el-pagination
              :current-page="rechargeTable.page.value"
              :page-size="rechargeTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="rechargeTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="rechargeTable.onPageChange"
              @size-change="rechargeTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 发票管理 -->
      <el-tab-pane label="发票管理" name="invoice">
        <div class="vc-card bl__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model="invoiceTable.baseParams.value.keyword" placeholder="发票号 / 租户 / 抬头" clearable style="width: 240px" @keyup.enter="invoiceTable.search" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="invoiceTable.baseParams.value.status" placeholder="全部" clearable style="width: 140px">
                <el-option label="待开票" value="pending" />
                <el-option label="已开票" value="issued" />
                <el-option label="已驳回" value="rejected" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="'Search'" @click="invoiceTable.search">查询</el-button>
              <el-button type="primary" plain :icon="'Plus'" @click="invoiceDialog = true">新建开票申请</el-button>
              <span class="vc-text-tertiary" style="font-size: 12px">
                共 {{ invoiceStats.total }} 条，待开票 <b class="is-warn">{{ invoiceStats.pending }}</b>，已开票 {{ invoiceStats.issued }}，
                合计 ¥{{ formatNumber(invoiceStats.amount, 2) }}
              </span>
            </el-form-item>
          </el-form>
        </div>
        <div class="vc-card bl__table">
          <el-table v-loading="invoiceTable.loading.value" :data="invoiceTable.list.value" stripe>
            <el-table-column label="发票号" width="170">
              <template #default="{ row }">
                <span v-if="row.invoiceNo" class="vc-mono" style="font-size: 12px">{{ row.invoiceNo }}</span>
                <span v-else class="vc-text-tertiary">待生成</span>
              </template>
            </el-table-column>
            <el-table-column prop="tenantName" label="租户" min-width="190" show-overflow-tooltip />
            <el-table-column label="抬头" min-width="220">
              <template #default="{ row }">
                <div>{{ row.title }}</div>
                <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.taxNo || '个人抬头无税号' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="110">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ row.type === 'special' ? '增值税专用发票' : '增值税普通发票' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="140" sortable :sort-method="(a: any, b: any) => a.amount - b.amount">
              <template #default="{ row }"><b>¥{{ formatNumber(row.amount, 2) }}</b></template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }"><StatusTag :status="row.status" kind="invoice" /></template>
            </el-table-column>
            <el-table-column label="申请 / 开具时间" width="190">
              <template #default="{ row }">
                <div style="font-size: 12px">申请 {{ formatDateTime(row.applyTime) }}</div>
                <div class="vc-text-tertiary" style="font-size: 11px">{{ row.issueTime ? `开具 ${formatDateTime(row.issueTime)}` : '未开具' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === 'pending'" link type="primary" size="small" @click="issueInvoice(row)">开具</el-button>
                <el-button v-if="row.status === 'pending'" link type="danger" size="small" @click="rejectInvoice(row)">驳回</el-button>
                <el-button v-if="row.status === 'issued'" link type="primary" size="small" @click="exportJson(`发票_${row.invoiceNo}`, row)">下载</el-button>
              </template>
            </el-table-column>
            <template #empty><EmptyState description="暂无发票记录" action-text="新建开票申请" @action="invoiceDialog = true" /></template>
          </el-table>
          <div class="bl__pager">
            <el-pagination
              :current-page="invoiceTable.page.value"
              :page-size="invoiceTable.pageSize.value"
              :page-sizes="paginationSizes"
              :total="invoiceTable.total.value"
              :layout="paginationLayout"
              background
              @current-change="invoiceTable.onPageChange"
              @size-change="invoiceTable.onSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 计费项编辑 -->
    <el-dialog v-model="itemDialog" title="编辑计费项" width="560px">
      <el-form :model="itemForm" label-width="120px">
        <el-form-item label="计费项名称">
          <el-input v-model="itemForm.name" />
        </el-form-item>
        <el-form-item label="计费单位">
          <el-input v-model="itemForm.unit" placeholder="如：路/月、GB/月、TB/月" />
        </el-form-item>
        <el-form-item label="单价(元)">
          <el-input-number v-model="itemForm.unitPrice" :min="0" :max="100000" :precision="4" :step="0.1" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结算周期">
          <el-select v-model="itemForm.billingCycle" style="width: 100%">
            <el-option label="按月" value="按月" />
            <el-option label="按天" value="按天" />
            <el-option label="按次" value="按次" />
            <el-option label="一次性" value="一次性" />
          </el-select>
        </el-form-item>
        <el-form-item label="生效日期">
          <el-date-picker v-model="itemForm.effectiveDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="itemForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="itemForm.status" :active-value="1" :inactive-value="0" active-text="生效" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialog = false">取消</el-button>
        <el-button type="primary" @click="submitItem">保存</el-button>
      </template>
    </el-dialog>

    <!-- 账单明细 -->
    <el-drawer v-model="billDrawer" title="账单明细" size="620px">
      <div v-if="billDetail">
        <div class="bl__detailHead">
          <div>
            <div class="bl__detailNo vc-mono">{{ billDetail.billNo }}</div>
            <div class="vc-text-tertiary" style="font-size: 12px">账期 {{ billDetail.period }}</div>
          </div>
          <StatusTag :status="billDetail.status" kind="bill" size="default" />
          <div style="flex: 1" />
          <div class="bl__detailAmount">¥{{ formatNumber(billDetail.totalAmount, 2) }}</div>
        </div>

        <el-descriptions :column="2" border size="small" style="margin-top: 14px">
          <el-descriptions-item label="租户">{{ billDetail.tenantName }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ billDetail.payMethod }}</el-descriptions-item>
          <el-descriptions-item label="到期日">{{ billDetail.dueDate }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ billDetail.payTime ? formatDateTime(billDetail.payTime) : '未支付' }}</el-descriptions-item>
          <el-descriptions-item label="生成时间" :span="2">{{ formatDateTime(billDetail.createTime) }}</el-descriptions-item>
        </el-descriptions>

        <div class="vc-panel-title" style="margin-top: 16px">计费明细</div>
        <el-table :data="billDetail.items || []" size="small" border show-summary :summary-method="() => ['合计', '', '', '', `¥${formatNumber(billDetail.totalAmount, 2)}`]">
          <el-table-column prop="billingName" label="计费项" min-width="170" />
          <el-table-column prop="unit" label="单位" width="100" />
          <el-table-column label="单价(元)" width="110">
            <template #default="{ row }">{{ row.unitPrice }}</template>
          </el-table-column>
          <el-table-column label="用量" width="110">
            <template #default="{ row }">{{ formatNumber(row.quantity) }}</template>
          </el-table-column>
          <el-table-column label="金额(元)" width="130">
            <template #default="{ row }"><b>{{ formatNumber(row.amount, 2) }}</b></template>
          </el-table-column>
        </el-table>

        <div class="bl__detailFoot">
          <el-button :icon="'Download'" @click="downloadBill">下载账单</el-button>
          <el-button v-if="billDetail.status !== 'paid' && billDetail.status !== 'void'" type="danger" plain @click="voidBill(billDetail)">作废账单</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 充值 -->
    <el-dialog v-model="rechargeDialog" title="账户充值" width="520px">
      <el-form :model="rechargeForm" label-width="100px">
        <el-form-item label="租户" required>
          <el-select v-model="rechargeForm.tenantId" filterable placeholder="选择租户" style="width: 100%">
            <el-option v-for="t in tenants" :key="t.id" :label="`${t.name}（余额 ¥${formatNumber(t.balance, 2)}）`" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="充值金额" required>
          <el-input-number v-model="rechargeForm.amount" :min="1" :max="10000000" :step="1000" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="rechargeForm.method" style="width: 100%">
            <el-option label="在线支付" value="在线支付" />
            <el-option label="银行转账" value="银行转账" />
            <el-option label="对公汇款" value="对公汇款" />
            <el-option label="合同预付" value="合同预付" />
          </el-select>
        </el-form-item>
      </el-form>
      <el-alert type="info" :closable="false" show-icon title="充值说明" description="充值金额实时到账。若租户处于欠费状态，充值成功后账户状态将自动恢复为正常。" />
      <template #footer>
        <el-button @click="rechargeDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRecharge">确认充值</el-button>
      </template>
    </el-dialog>

    <!-- 开票申请 -->
    <el-dialog v-model="invoiceDialog" title="新建开票申请" width="580px">
      <el-form :model="invoiceForm" label-width="110px">
        <el-form-item label="租户" required>
          <el-select v-model="invoiceForm.tenantId" filterable placeholder="选择租户" style="width: 100%">
            <el-option v-for="t in tenants" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="抬头类型">
          <el-radio-group v-model="invoiceForm.titleType">
            <el-radio value="company">企业</el-radio>
            <el-radio value="personal">个人</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="发票抬头" required>
          <el-input v-model="invoiceForm.title" placeholder="填写开票抬头全称" />
        </el-form-item>
        <el-form-item v-if="invoiceForm.titleType === 'company'" label="税号" required>
          <el-input v-model="invoiceForm.taxNo" placeholder="纳税人识别号" class="vc-mono" />
        </el-form-item>
        <el-form-item label="发票类型">
          <el-select v-model="invoiceForm.type" style="width: 100%">
            <el-option label="增值税普通发票" value="normal" />
            <el-option label="增值税专用发票" value="special" />
          </el-select>
        </el-form-item>
        <el-form-item label="开票金额" required>
          <el-input-number v-model="invoiceForm.amount" :min="0" :max="100000000" :step="1000" :precision="2" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="invoiceDialog = false">取消</el-button>
        <el-button type="primary" @click="submitInvoice">提交申请</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<style scoped>
.bl__filter {
  padding: 14px 16px 4px;
  margin-bottom: 12px;
}

.bl__filter :deep(.el-form-item) {
  margin-bottom: 10px;
}

.bl__table {
  padding: 0;
  overflow: hidden;
}

.bl__pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.bl__detailHead {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bl__detailNo {
  font-size: 14px;
  font-weight: 500;
}

.bl__detailAmount {
  font-size: 24px;
  font-weight: 600;
  color: var(--vc-danger);
}

.bl__detailFoot {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
}

.is-warn {
  color: var(--vc-warning);
}
</style>
