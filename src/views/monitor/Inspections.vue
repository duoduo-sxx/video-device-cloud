<template>
  <div class="page">
    <PageHeader title="巡检管理" desc="周期性健康检查，输出巡检报告与风险整改建议">
      <template #actions>
        <el-button :icon="Refresh" @click="load">刷新</el-button>
        <el-button type="primary" :icon="VideoPlay" @click="runInspection">立即执行巡检</el-button>
      </template>
    </PageHeader>

    <div class="kpi-grid">
      <StatCard label="巡检任务" :value="rows.length" unit="个" icon="Search" tone="primary" hint="周度 / 月度周期" />
      <StatCard label="平均通过率" :value="avgPass.toFixed(1)" unit="%" icon="CircleCheck" tone="success" :progress="avgPass" hint="检查项通过比例" />
      <StatCard label="待整改项" :value="warnItems" unit="项" icon="Warning" tone="warning" hint="结果为警告或失败的检查项" />
      <StatCard label="本月已执行" :value="monthCount" unit="次" icon="Calendar" tone="cyan" hint="按巡检执行时间统计" />
    </div>

    <div class="card flush">
      <el-table :data="rows" v-loading="loading" @row-click="(row: Inspection) => openReport(row)" row-class-name="clickable">
        <el-table-column label="巡检任务" min-width="240">
          <template #default="{ row }">
            <div class="i-name">{{ row.name }}</div>
            <div class="tiny muted">{{ row.id }} · {{ row.cycleName }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户" min-width="180" show-overflow-tooltip />
        <el-table-column prop="executor" label="执行人" width="100" />
        <el-table-column label="执行时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.executedAt) }}</template>
        </el-table-column>
        <el-table-column label="通过率" width="170">
          <template #default="{ row }">
            <div class="pass-cell">
              <CapacityBar :value="row.passRate" :height="5" :show-label="false" />
              <span class="tiny num">{{ row.passRate }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="问题项" width="90">
          <template #default="{ row }">
            <span :class="problemCount(row) ? 'warn-text' : ''">{{ problemCount(row) }} 项</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><StatusTag kind="inspection" :value="row.status" /></template>
        </el-table-column>
        <el-table-column label="操作" width="96" align="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="openReport(row)">巡检报告</el-button>
          </template>
        </el-table-column>
        <template #empty><EmptyState text="暂无巡检记录" /></template>
      </el-table>
    </div>

    <el-drawer v-model="reportVisible" title="巡检报告" size="620px">
      <div v-if="current" class="report">
        <div class="report-head">
          <div>
            <h3>{{ current.name }}</h3>
            <div class="tiny muted">{{ current.customerName }} · {{ formatDateTime(current.executedAt) }} · 执行人 {{ current.executor }}</div>
          </div>
          <div class="score">
            <div class="score-num">{{ current.passRate }}<span>%</span></div>
            <div class="tiny muted">通过率</div>
          </div>
        </div>

        <div class="report-summary">
          <div class="rs-item"><span>检查项</span><b>{{ current.items.length }}</b></div>
          <div class="rs-item"><span>通过</span><b class="ok">{{ current.items.filter((i) => i.result === 'pass').length }}</b></div>
          <div class="rs-item"><span>警告</span><b class="warn">{{ current.items.filter((i) => i.result === 'warn').length }}</b></div>
          <div class="rs-item"><span>失败</span><b class="bad">{{ current.items.filter((i) => i.result === 'fail').length }}</b></div>
        </div>

        <el-table :data="current.items" size="small" style="margin-top: 14px">
          <el-table-column prop="name" label="检查项" width="130" />
          <el-table-column label="结果" width="90">
            <template #default="{ row }">
              <StatusTag :tone="row.result === 'pass' ? 'success' : row.result === 'warn' ? 'warning' : 'danger'" :label="row.result === 'pass' ? '通过' : row.result === 'warn' ? '警告' : '失败'" />
            </template>
          </el-table-column>
          <el-table-column prop="detail" label="说明" min-width="220" />
        </el-table>

        <div class="section-title">整改建议</div>
        <div class="advice">
          <p v-for="(a, i) in advices" :key="i">· {{ a }}</p>
        </div>

        <div class="drawer-actions">
          <el-button type="primary" @click="ElMessage.success('巡检报告已导出（演示）')">导出报告</el-button>
          <el-button @click="ElMessage.success('已发起整改工单')">发起整改工单</el-button>
        </div>
      </div>
    </el-drawer>

    <el-dialog v-model="running" title="巡检执行中" width="380px" :close-on-click-modal="false" :show-close="false">
      <div class="run-box">
        <el-progress :percentage="progress" :stroke-width="8" color="#1668DC" />
        <div class="run-tip">正在执行容量、性能、硬件、复制与备份共 10 项检查…</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Calendar, Refresh, Search, VideoPlay } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import CapacityBar from '@/components/CapacityBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getInspections } from '@/api'
import type { Inspection } from '@/types'
import { dayjs, formatDateTime } from '@/utils/format'

const loading = ref(false)
const rows = ref<Inspection[]>([])
const reportVisible = ref(false)
const current = ref<Inspection>()
const running = ref(false)
const progress = ref(0)

const avgPass = computed(() => (rows.value.length ? rows.value.reduce((s, r) => s + r.passRate, 0) / rows.value.length : 0))
const warnItems = computed(() => rows.value.reduce((s, r) => s + problemCount(r), 0))
const monthCount = computed(() => rows.value.filter((r) => dayjs(r.executedAt).format('YYYY-MM') === dayjs().format('YYYY-MM')).length)

const advices = [
  'POOL-GOV-PRD-01 使用率 86.8%，建议 30 天内完成 40TB 扩容，同时将快照保留周期由 14 天调整为 7 天。',
  'BANK-CORE-01 有 1 块磁盘介质错误计数持续增长，建议申请备件更换并确认热备盘状态。',
  'HOSP-PRD-02 备份成功率 92%，失败任务集中在周末窗口，建议调整备份并发度与重试策略。',
  '部分设备固件版本低于推荐基线，建议在下个变更窗口统一升级。'
]

function problemCount(row: Inspection) {
  return row.items.filter((i) => i.result !== 'pass').length
}

function openReport(row: Inspection) {
  current.value = row
  reportVisible.value = true
}

async function runInspection() {
  running.value = true
  progress.value = 0
  const timer = window.setInterval(() => {
    progress.value += Math.random() * 18
    if (progress.value >= 100) {
      progress.value = 100
      window.clearInterval(timer)
      window.setTimeout(() => {
        running.value = false
        ElMessage.success('巡检完成，报告已生成：10 项检查全部执行，2 项需关注')
      }, 400)
    }
  }, 280)
}

async function load() {
  loading.value = true
  rows.value = await getInspections()
  loading.value = false
}

onMounted(load)
</script>

<style scoped>
.i-name {
  font-size: 13px;
  color: var(--neutral-900);
  line-height: 18px;
}

.pass-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.warn-text {
  color: #d97706;
  font-weight: 500;
}

.report-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--divider);
}

.report-head h3 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
}

.score {
  text-align: center;
  flex: none;
}

.score-num {
  font-size: 26px;
  font-weight: 600;
  color: #1668dc;
  line-height: 30px;
}

.score-num span {
  font-size: 12px;
  color: var(--neutral-400);
}

.report-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.rs-item {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rs-item span {
  font-size: 11.5px;
  color: var(--neutral-400);
}

.rs-item b {
  font-size: 18px;
  font-weight: 600;
  color: var(--neutral-900);
}

.rs-item b.ok {
  color: #16a34a;
}

.rs-item b.warn {
  color: #d97706;
}

.rs-item b.bad {
  color: #dc2626;
}

.advice {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 14px;
}

.advice p {
  margin: 5px 0;
  font-size: 12.5px;
  color: var(--neutral-600);
  line-height: 1.7;
}

.drawer-actions {
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px solid var(--divider);
  display: flex;
  gap: 8px;
}

.run-box {
  padding: 8px 0 4px;
}

.run-tip {
  margin-top: 14px;
  font-size: 12.5px;
  color: var(--neutral-600);
}

:deep(.clickable) {
  cursor: pointer;
}
</style>
