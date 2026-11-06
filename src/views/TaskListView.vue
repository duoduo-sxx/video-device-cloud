<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  Copy,
  Film,
  ListChecks,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Trash2
} from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import { capabilityMap } from '@/mock/capabilities'
import type { Task, TaskStatus } from '@/types'
import { formatDateTime, formatDuration, fromNow, resolutionLabel } from '@/composables/useFormat'

const data = useDataStore()
const app = useAppStore()
const router = useRouter()

const tab = ref<'all' | TaskStatus>('all')
const keyword = ref('')
const confirmId = ref<string | null>(null)

const tabs = computed(() => [
  { key: 'all' as const, label: '全部', count: data.tasks.length },
  { key: 'running' as const, label: '处理中', count: data.runningTasks.length },
  { key: 'queued' as const, label: '排队中', count: data.queuedTasks.length },
  { key: 'completed' as const, label: '已完成', count: data.completedTasks.length },
  { key: 'failed' as const, label: '失败', count: data.failedTasks.length },
  { key: 'canceled' as const, label: '已取消', count: data.tasks.filter((t) => t.status === 'canceled').length }
])

const statusText = (s: TaskStatus): string =>
  ({ queued: '排队中', running: '处理中', paused: '已暂停', completed: '已完成', failed: '失败', canceled: '已取消' }[s])

const list = computed(() => {
  let arr = data.tasks.slice()
  if (tab.value !== 'all') {
    arr = arr.filter((t) => (tab.value === 'paused' ? t.status === 'paused' : t.status === tab.value))
  }
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    arr = arr.filter((t) => t.assetName.toLowerCase().includes(kw) || t.id.toLowerCase().includes(kw))
  }
  return arr
})

const todayDone = computed(() => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return data.tasks.filter((t) => t.status === 'completed' && new Date(t.finishedAt ?? 0).getTime() >= start.getTime()).length
})

function gainOf(t: Task): number | null {
  return t.qualityAfter ? Math.round((t.qualityAfter.score - t.qualityBefore.score) * 10) / 10 : null
}

function confirmDelete(id: string) {
  confirmId.value = id
}

function doDelete() {
  if (!confirmId.value) return
  data.deleteTask(confirmId.value)
  app.toast('success', '任务已删除', confirmId.value)
  confirmId.value = null
}

function duplicate(t: Task) {
  router.push({ path: '/tasks/new', query: { assets: t.assetId } })
}

function pause(t: Task) {
  if (t.status === 'paused') {
    data.resumeTask(t.id)
    app.toast('success', '任务已恢复', t.assetName)
  } else {
    data.pauseTask(t.id)
    app.toast('info', '任务已暂停', t.assetName)
  }
}

function retry(t: Task) {
  data.retryTask(t.id)
  app.toast('success', '任务已重新入队', t.id)
}
</script>

<template>
  <div class="page">
    <PageHeader title="增强任务" desc="管理增强流水线的提交、排队与执行">
      <button class="btn btn-ghost" @click="router.push('/tasks/list')">
        <ListChecks :size="14" /> 队列视图
      </button>
      <button class="btn btn-primary" @click="router.push('/tasks/new')">
        <Plus :size="14" /> 新建任务
      </button>
    </PageHeader>

    <div class="summary">
      <div class="sum-item">
        <span class="dot" style="background: var(--primary)" />
        <span class="l">处理中</span>
        <span class="v num">{{ data.runningTasks.length }}</span>
      </div>
      <div class="sum-item">
        <span class="dot" style="background: var(--text-3)" />
        <span class="l">排队中</span>
        <span class="v num">{{ data.queuedTasks.length }}</span>
      </div>
      <div class="sum-item">
        <span class="dot" style="background: var(--success)" />
        <span class="l">今日完成</span>
        <span class="v num">{{ todayDone }}</span>
      </div>
      <div class="sum-item">
        <span class="dot" style="background: var(--danger)" />
        <span class="l">失败待处理</span>
        <span class="v num">{{ data.failedTasks.length }}</span>
      </div>
      <div class="sum-spacer" />
      <div class="search-wrap">
        <Search :size="13" class="s-ic" />
        <input v-model="keyword" class="search-input" placeholder="搜索任务 ID 或素材名" />
      </div>
    </div>

    <div class="tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="tab"
        :class="{ on: tab === t.key }"
        @click="tab = t.key"
      >
        {{ t.label }}
        <span class="tab-cnt">{{ t.count }}</span>
      </button>
    </div>

    <div v-if="!list.length" class="card">
      <EmptyState
        title="这里还没有任务"
        :desc="tab === 'all' ? '从素材库选择素材，或直接新建一个增强任务' : '当前筛选条件下没有任务，切换其他状态看看'"
      >
        <button class="btn btn-primary" @click="router.push('/tasks/new')"><Plus :size="14" /> 新建任务</button>
      </EmptyState>
    </div>

    <div v-else class="card table-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th style="width: 176px">任务 ID</th>
            <th>素材</th>
            <th style="width: 210px">增强流水线</th>
            <th style="width: 100px">状态</th>
            <th style="width: 172px">进度</th>
            <th style="width: 84px">耗时</th>
            <th style="width: 92px">质量提升</th>
            <th style="width: 132px">创建时间</th>
            <th style="width: 148px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in list" :key="t.id">
            <td class="mono tid" @click="router.push(`/tasks/${t.id}`)">{{ t.id }}</td>
            <td @click="router.push(`/tasks/${t.id}`)">
              <div class="cell-media">
                <div
                  class="mini-thumb"
                  :style="{ background: `linear-gradient(140deg, ${data.assetById(t.assetId)?.thumbnailColor[0] ?? '#1b2a4a'}, ${data.assetById(t.assetId)?.thumbnailColor[1] ?? '#0d1526'})` }"
                >
                  <Film :size="11" />
                </div>
                <div class="cell-text">
                  <div class="cell-name ellipsis">{{ t.assetName }}</div>
                  <div class="cell-sub">
                    {{ resolutionLabel(t.output.width, t.output.height) }} · {{ t.output.codec }} · {{ t.createdBy }}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <div class="pipe">
                <span v-for="p in t.pipeline.slice(0, 3)" :key="p.capabilityId" class="pipe-tag">
                  {{ capabilityMap[p.capabilityId].shortName }}
                </span>
                <span v-if="t.pipeline.length > 3" class="pipe-more">+{{ t.pipeline.length - 3 }}</span>
              </div>
            </td>
            <td><StatusBadge :status="statusText(t.status)" /></td>
            <td>
              <div v-if="t.status === 'running' || t.status === 'paused'" class="prog">
                <div class="prog-top">
                  <span class="prog-stage">{{ t.stage }}</span>
                  <span class="prog-pct num">{{ t.progress.toFixed(1) }}%</span>
                </div>
                <div class="prog-bar">
                  <div class="prog-fill" :style="{ width: t.progress + '%' }" />
                </div>
              </div>
              <div v-else-if="t.status === 'completed'" class="prog">
                <div class="prog-bar">
                  <div class="prog-fill done" style="width: 100%" />
                </div>
                <span class="prog-sub">已完成全部 {{ t.stageIndex + 1 }} 个阶段</span>
              </div>
              <div v-else-if="t.status === 'failed'" class="prog">
                <div class="prog-bar">
                  <div class="prog-fill err" :style="{ width: t.progress + '%' }" />
                </div>
                <span class="prog-sub err">{{ t.errorCode }}</span>
              </div>
              <span v-else class="t3 f12">—</span>
            </td>
            <td class="num t2">{{ formatDuration(t.elapsedSec) }}</td>
            <td>
              <span v-if="gainOf(t) !== null" class="gain num">+{{ gainOf(t) }}</span>
              <span v-else class="t3">—</span>
            </td>
            <td class="num t2 f12" :title="formatDateTime(t.createdAt)">{{ fromNow(t.createdAt) }}</td>
            <td>
              <div class="ops">
                <button
                  v-if="t.status === 'completed'"
                  class="op primary"
                  @click="router.push(`/tasks/${t.id}/compare`)"
                >
                  审片
                </button>
                <button v-else class="op" @click="router.push(`/tasks/${t.id}`)">查看</button>

                <button
                  v-if="t.status === 'running' || t.status === 'paused'"
                  class="op-icon"
                  :title="t.status === 'paused' ? '继续' : '暂停'"
                  @click="pause(t)"
                >
                  <Play v-if="t.status === 'paused'" :size="13" />
                  <Pause v-else :size="13" />
                </button>
                <button
                  v-if="t.status === 'running' || t.status === 'paused' || t.status === 'queued'"
                  class="op-icon danger"
                  title="取消"
                  @click="data.cancelTask(t.id); app.toast('warning', '任务已取消', t.id)"
                >
                  <Ban :size="13" />
                </button>
                <button v-if="t.status === 'failed'" class="op-icon" title="重试" @click="retry(t)">
                  <RotateCcw :size="13" />
                </button>
                <button v-if="t.status === 'completed'" class="op-icon" title="复用参数" @click="duplicate(t)">
                  <Copy :size="13" />
                </button>
                <button
                  v-if="t.status === 'completed' || t.status === 'canceled' || t.status === 'failed'"
                  class="op-icon danger"
                  title="删除"
                  @click="confirmDelete(t.id)"
                >
                  <Trash2 :size="13" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="foot-note">
      <Clock :size="12" />
      任务进度每 0.9 秒刷新一次，刷新页面后会从上次进度继续
      <span class="spacer" />
      <CheckCircle2 :size="12" />
      近 30 天任务成功率
      <b>{{ Math.round((data.completedTasks.length / (data.completedTasks.length + data.failedTasks.length)) * 100) }}%</b>
    </div>

    <BaseModal :model-value="!!confirmId" title="删除任务" :width="420" @update:model-value="confirmId = null">
      <p style="font-size: 13px; color: var(--text-2); line-height: 1.7">
        删除后任务记录与日志将被移除，成片文件保留在输出目录中。此操作不可撤销。
      </p>
      <template #footer>
        <button class="btn btn-ghost" @click="confirmId = null">取消</button>
        <button class="btn btn-danger" @click="doDelete">确认删除</button>
      </template>
    </BaseModal>

    <div class="hint-link">
      <button class="btn btn-subtle btn-sm" @click="router.push('/quality')">
        查看质量评估报告 <ArrowRight :size="12" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.summary {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 11px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.sum-item {
  display: flex;
  align-items: center;
  gap: 7px;
}
.sum-item .l {
  font-size: 11.5px;
  color: var(--text-3);
}
.sum-item .v {
  font-size: 13px;
  color: var(--text-1);
  font-weight: 500;
}
.sum-spacer {
  flex: 1;
}
.search-wrap {
  position: relative;
  width: 240px;
}
.s-ic {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
}
.search-input {
  width: 100%;
  height: 30px;
  padding: 0 10px 0 30px;
  background: var(--bg-inset);
  border: 1px solid var(--border);
  border-radius: 7px;
  font-size: 12px;
  color: var(--text-1);
  outline: none;
}
.search-input:focus {
  border-color: var(--primary);
}
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 14px;
}
.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 11px;
  border-radius: 7px;
  font-size: 12.5px;
  color: var(--text-2);
  border: 1px solid transparent;
}
.tab:hover {
  background: var(--bg-card);
  color: var(--text-1);
}
.tab.on {
  background: var(--bg-card);
  border-color: var(--border);
  color: var(--text-1);
}
.tab-cnt {
  font-size: 10.5px;
  color: var(--text-3);
  background: var(--bg-inset);
  border-radius: 4px;
  padding: 0 5px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
}
.tab.on .tab-cnt {
  background: var(--primary-soft);
  color: var(--primary);
}
.table-wrap {
  overflow: hidden;
}
.tid {
  font-size: 11.5px;
  color: var(--text-2);
  cursor: pointer;
}
.tid:hover {
  color: var(--primary);
}
.cell-media {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  min-width: 0;
}
.mini-thumb {
  width: 48px;
  height: 28px;
  border-radius: 4px;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.6);
  flex: none;
}
.cell-text {
  min-width: 0;
}
.cell-name {
  font-size: 12.5px;
  color: var(--text-1);
  max-width: 320px;
}
.cell-sub {
  font-size: 10.5px;
  color: var(--text-3);
  margin-top: 2px;
}
.pipe {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.pipe-tag {
  font-size: 10px;
  color: var(--text-2);
  background: var(--bg-inset);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 5px;
  white-space: nowrap;
}
.pipe-more {
  font-size: 10px;
  color: var(--text-3);
  padding: 1px 3px;
}
.prog-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 5px;
}
.prog-stage {
  font-size: 10.5px;
  color: var(--text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.prog-pct {
  font-size: 11px;
  color: var(--primary);
  flex: none;
}
.prog-bar {
  height: 3px;
  background: var(--border);
  border-radius: 99px;
  overflow: hidden;
}
.prog-fill {
  height: 100%;
  background: var(--gradient);
  border-radius: 99px;
  transition: width 0.8s linear;
}
.prog-fill.done {
  background: var(--success);
}
.prog-fill.err {
  background: var(--danger);
}
.prog-sub {
  display: block;
  font-size: 10px;
  color: var(--text-3);
  margin-top: 4px;
}
.prog-sub.err {
  color: var(--danger);
  font-family: var(--font-mono);
}
.gain {
  color: var(--success);
  font-size: 12.5px;
  font-weight: 500;
}
.ops {
  display: flex;
  align-items: center;
  gap: 2px;
}
.op {
  height: 24px;
  padding: 0 8px;
  border-radius: 5px;
  font-size: 11.5px;
  color: var(--text-2);
  border: 1px solid var(--border);
}
.op:hover {
  color: var(--text-1);
  border-color: var(--border-strong);
}
.op.primary {
  color: var(--primary);
  border-color: var(--primary-soft-2);
  background: var(--primary-soft);
}
.op-icon {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 5px;
  color: var(--text-3);
}
.op-icon:hover {
  background: var(--bg-card-hover);
  color: var(--text-1);
}
.op-icon.danger:hover {
  background: var(--danger-soft);
  color: var(--danger);
}
.foot-note {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 12px;
  font-size: 11px;
  color: var(--text-3);
}
.foot-note b {
  color: var(--text-1);
  font-weight: 500;
}
.spacer {
  flex: 1;
}
.hint-link {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}
</style>
