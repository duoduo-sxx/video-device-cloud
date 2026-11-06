<template>
  <div class="page">
    <PageHeader title="告警中心" desc="汇聚容量、性能、硬件、链路与复制告警，支持一键转工单">
      <template #actions>
        <el-button :icon="Download" @click="onExport">导出</el-button>
        <el-button :disabled="!selection.length" :icon="CircleCheck" @click="batchAck">批量确认（{{ selection.length }}）</el-button>
      </template>
    </PageHeader>

    <div class="level-row">
      <div v-for="lv in levels" :key="lv.key" class="level-card" :class="[lv.key.toLowerCase(), { active: query.level === lv.key }]" @click="filterLevel(lv.key)">
        <div class="level-top">
          <span class="level-name">{{ lv.key }}</span>
          <span class="level-desc">{{ lv.desc }}</span>
        </div>
        <div class="level-count num">{{ levelCount[lv.key] ?? 0 }}</div>
        <div class="level-foot">活跃告警 · 点击筛选</div>
      </div>
    </div>

    <div class="card flush">
      <div class="filters-bar">
        <div class="filters">
          <el-input v-model="query.keyword" placeholder="告警内容 / 对象 / 客户" :prefix-icon="Search" clearable @keyup.enter="search" />
          <el-select v-model="query.status" placeholder="全部状态" clearable>
            <el-option label="活跃" value="active" />
            <el-option label="已确认" value="acked" />
            <el-option label="已恢复" value="recovered" />
            <el-option label="已关闭" value="closed" />
          </el-select>
          <el-select v-model="query.type" placeholder="全部类型" clearable>
            <el-option v-for="t in types" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
          <el-select v-model="query.days" placeholder="时间范围" clearable style="width: 140px">
            <el-option label="最近 24 小时" :value="1" />
            <el-option label="最近 7 天" :value="7" />
            <el-option label="最近 30 天" :value="30" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button :icon="Refresh" @click="reset">重置</el-button>
        </div>
        <span class="tiny muted">共 {{ total }} 条告警</span>
      </div>

      <el-table :data="rows" v-loading="loading" @selection-change="(v: Alarm[]) => (selection = v)" row-class-name="alarm-row">
        <el-table-column type="selection" width="42" />
        <el-table-column label="等级" width="78">
          <template #default="{ row }"><StatusTag kind="alarmLevel" :value="row.level" /></template>
        </el-table-column>
        <el-table-column label="告警内容" min-width="320">
          <template #default="{ row }">
            <div class="alarm-title" @click="openDetail(row)">{{ row.title }}</div>
            <div class="tiny muted">{{ row.typeName }} · {{ row.id }}</div>
          </template>
        </el-table-column>
        <el-table-column label="告警对象" min-width="190">
          <template #default="{ row }">
            <div class="mono tiny">{{ row.objectName }}</div>
            <div class="tiny muted">{{ row.customerName }}</div>
          </template>
        </el-table-column>
        <el-table-column label="当前值 / 阈值" width="150">
          <template #default="{ row }">
            <span class="danger-text">{{ row.value }}</span>
            <span class="tiny muted"> / {{ row.threshold }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发生时间" width="150">
          <template #default="{ row }">
            <div>{{ formatDateTime(row.occurredAt) }}</div>
            <div class="tiny muted">持续 {{ durationText(row.durationMinutes) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="94">
          <template #default="{ row }"><StatusTag kind="alarmStatus" :value="row.status" /></template>
        </el-table-column>
        <el-table-column prop="handler" label="处理人" width="86">
          <template #default="{ row }">{{ row.handler || '--' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right" align="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'active'" link type="primary" size="small" @click="ack(row)">确认</el-button>
            <el-button v-if="!row.ticketId" link type="success" size="small" @click="toTicket(row)">转工单</el-button>
            <el-button v-else link type="success" size="small" @click="router.push(`/service/tickets/${row.ticketId}`)">工单</el-button>
          </template>
        </el-table-column>
        <template #empty><EmptyState text="没有匹配的告警" desc="调整筛选条件试试" /></template>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="load"
          @size-change="search"
        />
      </div>
    </div>

    <el-drawer v-model="detailVisible" title="告警详情" size="520px">
      <div v-if="current" class="detail">
        <div class="detail-head">
          <StatusTag kind="alarmLevel" :value="current.level" />
          <StatusTag kind="alarmStatus" :value="current.status" />
          <span class="mono tiny muted">{{ current.id }}</span>
        </div>
        <h3>{{ current.title }}</h3>

        <div class="detail-grid">
          <div class="dg-item"><span>告警对象</span><b class="mono">{{ current.objectName }}</b></div>
          <div class="dg-item"><span>所属客户</span><b>{{ current.customerName }}</b></div>
          <div class="dg-item"><span>发生时间</span><b>{{ formatDateTime(current.occurredAt) }}</b></div>
          <div class="dg-item"><span>持续时长</span><b>{{ durationText(current.durationMinutes) }}</b></div>
          <div class="dg-item"><span>当前值</span><b class="danger-text">{{ current.value }}</b></div>
          <div class="dg-item"><span>告警阈值</span><b>{{ current.threshold }}</b></div>
          <div class="dg-item"><span>告警类型</span><b>{{ current.typeName }}</b></div>
          <div class="dg-item"><span>处理人</span><b>{{ current.handler || '未分配' }}</b></div>
        </div>

        <div class="section-title">影响评估</div>
        <p class="para">
          该告警影响 {{ current.customerName }} 的 {{ current.objectName }}。若不处理，可能导致容量写满或业务时延进一步升高，
          建议在 {{ current.level === 'P1' ? '30 分钟内' : current.level === 'P2' ? '2 小时内' : '当日内' }} 完成处置。
        </p>

        <div class="section-title">处理建议</div>
        <div class="suggestion">{{ current.suggestion }}</div>

        <div class="section-title">处理记录</div>
        <el-timeline>
          <el-timeline-item :timestamp="formatDateTime(current.occurredAt)" color="#E5484D">系统检测到指标越界，生成 {{ current.level }} 告警</el-timeline-item>
          <el-timeline-item v-if="current.handler" :timestamp="formatDateTime(current.occurredAt)" color="#1668DC">{{ current.handler }} 确认告警</el-timeline-item>
          <el-timeline-item v-if="current.ticketId" :timestamp="formatDateTime(current.occurredAt)" color="#13C2C2">
            已转工单 <span class="link" @click="router.push(`/service/tickets/${current.ticketId}`)">{{ current.ticketId }}</span>
          </el-timeline-item>
        </el-timeline>

        <div class="detail-actions">
          <el-button v-if="current.status === 'active'" type="primary" @click="ack(current)">确认告警</el-button>
          <el-button v-if="!current.ticketId" type="success" plain @click="toTicket(current)">转工单</el-button>
          <el-button @click="ElMessage.success('已屏蔽该告警 2 小时')">屏蔽 2 小时</el-button>
          <el-button @click="closeAlarmItem">关闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck, Download, Refresh, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ackAlarm, closeAlarm, convertAlarmToTicket, getAlarms } from '@/api'
import type { Alarm } from '@/types'
import { formatDateTime, durationText } from '@/utils/format'
import { exportCsv } from '@/utils/export'

const router = useRouter()
const loading = ref(false)
const rows = ref<Alarm[]>([])
const allAlarms = ref<Alarm[]>([])
const total = ref(0)
const selection = ref<Alarm[]>([])
const detailVisible = ref(false)
const current = ref<Alarm>()

const query = reactive({ keyword: '', level: '', status: '', type: '', days: 7 as number | '', page: 1, pageSize: 10 })

const levels = [
  { key: 'P1', desc: '业务中断' },
  { key: 'P2', desc: '性能严重下降' },
  { key: 'P3', desc: '指标越界' },
  { key: 'P4', desc: '提示信息' }
]

const types = [
  { label: '容量', value: 'capacity' },
  { label: '性能', value: 'performance' },
  { label: '硬件', value: 'hardware' },
  { label: '链路', value: 'link' },
  { label: '复制', value: 'replication' }
]

const levelCount = ref<Record<string, number>>({})

async function load() {
  loading.value = true
  const res = await getAlarms({ ...query, days: query.days || undefined })
  rows.value = res.list
  total.value = res.total
  loading.value = false
}

async function loadStats() {
  const res = await getAlarms({ page: 1, pageSize: 999, status: 'active' })
  allAlarms.value = res.list
  const map: Record<string, number> = { P1: 0, P2: 0, P3: 0, P4: 0 }
  res.list.forEach((a) => (map[a.level] += 1))
  levelCount.value = map
}

function search() {
  query.page = 1
  load()
}

function reset() {
  query.keyword = ''
  query.level = ''
  query.status = ''
  query.type = ''
  query.days = 7
  search()
}

function filterLevel(level: string) {
  query.level = query.level === level ? '' : level
  search()
}

function openDetail(row: Alarm) {
  current.value = row
  detailVisible.value = true
}

async function ack(row: Alarm) {
  await ackAlarm(row.id)
  ElMessage.success('告警已确认')
  await Promise.all([load(), loadStats()])
  if (current.value?.id === row.id) current.value = { ...row, status: 'acked', handler: '陈立' }
}

async function batchAck() {
  for (const a of selection.value) {
    if (a.status === 'active') await ackAlarm(a.id)
  }
  ElMessage.success(`已确认 ${selection.value.length} 条告警`)
  await Promise.all([load(), loadStats()])
}

async function toTicket(row: Alarm) {
  const ticket = await convertAlarmToTicket(row.id)
  ElMessage.success(`已生成工单 ${ticket?.id}`)
  detailVisible.value = false
  await Promise.all([load(), loadStats()])
  if (ticket) router.push(`/service/tickets/${ticket.id}`)
}

async function closeAlarmItem() {
  if (!current.value) return
  const ok = await ElMessageBox.confirm('确认关闭该告警？关闭后将不再计入活跃告警统计。', '关闭告警', { type: 'warning' }).catch(() => null)
  if (!ok) return
  await closeAlarm(current.value.id)
  ElMessage.success('告警已关闭')
  detailVisible.value = false
  await Promise.all([load(), loadStats()])
}

function onExport() {
  exportCsv(
    '告警清单.csv',
    ['告警ID', '等级', '类型', '内容', '对象', '客户', '当前值', '阈值', '发生时间', '状态', '处理人'],
    rows.value.map((a) => [a.id, a.level, a.typeName, a.title, a.objectName, a.customerName, a.value, a.threshold, a.occurredAt, a.status, a.handler])
  )
  ElMessage.success('已导出当前页数据')
}

onMounted(async () => {
  await Promise.all([load(), loadStats()])
})
</script>

<style scoped>
.level-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.level-card {
  background: #fff;
  border: 1px solid var(--border);
  border-left: 3px solid #94a3b8;
  border-radius: 8px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.14s ease;
}

.level-card:hover {
  box-shadow: 0 4px 12px rgba(16, 24, 40, 0.06);
}

.level-card.p1 {
  border-left-color: #e5484d;
}

.level-card.p2 {
  border-left-color: #f59e0b;
}

.level-card.p3 {
  border-left-color: #1668dc;
}

.level-card.p4 {
  border-left-color: #94a3b8;
}

.level-card.active {
  background: #f7faff;
  box-shadow: inset 0 0 0 1px #cfe0fa;
}

.level-top {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.level-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-900);
}

.level-desc {
  font-size: 11.5px;
  color: var(--neutral-400);
}

.level-count {
  font-size: 26px;
  font-weight: 600;
  color: var(--neutral-900);
  margin: 4px 0 2px;
}

.level-foot {
  font-size: 11px;
  color: var(--neutral-400);
}

.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--divider);
  flex-wrap: wrap;
}

.alarm-title {
  font-size: 13px;
  color: var(--neutral-900);
  cursor: pointer;
  line-height: 18px;
}

.alarm-title:hover {
  color: var(--brand-600);
}

.danger-text {
  color: #dc2626;
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 12px 0 16px;
  line-height: 1.5;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 14px 16px;
}

.dg-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
}

.dg-item span {
  color: var(--neutral-400);
}

.dg-item b {
  font-weight: 500;
  color: var(--neutral-900);
  font-size: 12.5px;
}

.para {
  font-size: 13px;
  line-height: 1.75;
  color: var(--neutral-600);
  margin: 0;
}

.suggestion {
  background: #f0f7ff;
  border: 1px solid #d6e6fb;
  border-radius: 6px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.7;
  color: #2d4a6b;
}

.detail-actions {
  display: flex;
  gap: 8px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--divider);
}
</style>
