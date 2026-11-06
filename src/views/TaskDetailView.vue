<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Ban,
  Check,
  ChevronDown,
  Copy,
  Cpu,
  Film,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Terminal,
  Zap
} from 'lucide-vue-next'
import SectionCard from '@/components/ui/SectionCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import Sparkline from '@/components/ui/Sparkline.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import { capabilityMap } from '@/mock/capabilities'
import { STAGES } from '@/mock/seed'
import {
  estimateText,
  formatClock,
  formatDateTime,
  formatDuration,
  resolutionLabel
} from '@/composables/useFormat'

const route = useRoute()
const router = useRouter()
const data = useDataStore()
const app = useAppStore()

const task = computed(() => data.taskById(String(route.params.taskId)))
const logFilter = ref<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL')
const autoScroll = ref(true)
const logBox = ref<HTMLElement | null>(null)
const showParams = ref(true)

const statusText = computed(() => {
  const t = task.value
  if (!t) return ''
  return { queued: '排队中', running: '处理中', paused: '已暂停', completed: '已完成', failed: '失败', canceled: '已取消' }[
    t.status
  ]
})

const logs = computed(() => {
  if (!task.value) return []
  return logFilter.value === 'ALL'
    ? task.value.logs
    : task.value.logs.filter((l) => l.level === logFilter.value)
})

const circumference = 2 * Math.PI * 52
const dashOffset = computed(() => circumference * (1 - (task.value?.progress ?? 0) / 100))

const stages = computed(() =>
  STAGES.map((s, i) => {
    const t = task.value
    const state = !t ? 'todo' : t.progress >= s.end ? 'done' : t.stageIndex === i ? 'current' : 'todo'
    return { name: s.name, state, index: i }
  })
)

const gain = computed(() => {
  const t = task.value
  if (!t?.qualityAfter) return null
  return Math.round((t.qualityAfter.score - t.qualityBefore.score) * 10) / 10
})

function copyLogs() {
  const text = logs.value.map((l) => `${l.time} ${l.level} ${l.message}`).join('\n')
  navigator.clipboard
    ?.writeText(text)
    .then(() => app.toast('success', '日志已复制', `${logs.value.length} 行`))
    .catch(() => app.toast('error', '复制失败', '当前环境不支持剪贴板'))
}

watch(
  () => task.value?.logs.length,
  async () => {
    if (!autoScroll.value) return
    await nextTick()
    if (logBox.value) logBox.value.scrollTop = logBox.value.scrollHeight
  }
)
</script>

<template>
  <div v-if="task" class="page detail-page">
    <div class="top">
      <button class="btn btn-subtle btn-icon" aria-label="返回" @click="router.push('/tasks/list')">
        <ArrowLeft :size="16" />
      </button>
      <div class="top-main">
        <div class="row gap-8">
          <span class="tid mono">{{ task.id }}</span>
          <StatusBadge :status="statusText" />
          <span class="tag" :class="task.priority === 1 ? 'tag-danger' : task.priority === 2 ? 'tag-primary' : ''">P{{ task.priority }}</span>
        </div>
        <div class="tname ellipsis">{{ task.assetName }}</div>
      </div>
      <div class="top-ops">
        <button class="btn btn-ghost btn-sm" @click="router.push(`/library/${task.assetId}`)">
          <Film :size="13" /> 源素材
        </button>
        <button
          v-if="task.status === 'running' || task.status === 'paused'"
          class="btn btn-ghost btn-sm"
          @click="task.status === 'paused' ? data.resumeTask(task.id) : data.pauseTask(task.id)"
        >
          <Play v-if="task.status === 'paused'" :size="13" />
          <Pause v-else :size="13" />
          {{ task.status === 'paused' ? '继续' : '暂停' }}
        </button>
        <button
          v-if="task.status === 'failed' || task.status === 'canceled'"
          class="btn btn-ghost btn-sm"
          @click="data.retryTask(task.id); app.toast('success', '已重新入队', task.id)"
        >
          <RotateCcw :size="13" /> 重试
        </button>
        <button
          v-if="['running', 'paused', 'queued'].includes(task.status)"
          class="btn btn-ghost btn-sm btn-danger"
          @click="data.cancelTask(task.id); app.toast('warning', '任务已取消', task.id)"
        >
          <Ban :size="13" /> 取消
        </button>
        <button v-if="task.status === 'completed'" class="btn btn-primary btn-sm" @click="router.push(`/tasks/${task.id}/compare`)">
          <Gauge :size="13" /> 对比审片
        </button>
      </div>
    </div>

    <div v-if="task.status === 'failed'" class="err-banner">
      <div class="err-code mono">{{ task.errorCode }}</div>
      <div class="err-msg">{{ task.errorMessage }}</div>
      <button class="btn btn-sm btn-ghost" @click="router.push('/service/tickets')">提交工单</button>
    </div>

    <div class="grid3">
      <div class="col">
        <SectionCard title="执行阶段" :desc="`${task.stageIndex + 1} / ${STAGES.length}`">
          <div class="timeline">
            <div v-for="s in stages" :key="s.name" class="tl-item" :class="s.state">
              <div class="tl-rail">
                <span class="tl-node">
                  <Check v-if="s.state === 'done'" :size="9" :stroke-width="3.5" />
                </span>
                <i v-if="s.index < stages.length - 1" class="tl-line" />
              </div>
              <div class="tl-text">
                <span class="tl-name">{{ s.name }}</span>
                <span v-if="s.state === 'current'" class="tl-badge">进行中</span>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="资源监控">
          <div class="metric">
            <div class="metric-top">
              <span>GPU 利用率</span>
              <span class="num">{{ task.status === 'queued' ? 0 : Math.round(62 + Math.sin(task.progress / 8) * 14) }}%</span>
            </div>
            <Sparkline :values="task.gpuTrace.length ? task.gpuTrace : [0, 0, 0]" color="var(--primary)" :width="240" :height="40" />
          </div>
          <div class="metric">
            <div class="metric-top">
              <span>显存占用</span>
              <span class="num">{{ task.vramUsed }} / 24 GB</span>
            </div>
            <div class="vram-bar">
              <div :style="{ width: (task.vramUsed / 24) * 100 + '%' }" />
            </div>
          </div>
          <div class="res-info">
            <div class="ri-row"><span>执行节点</span><span class="mono">{{ task.gpu }}</span></div>
            <div class="ri-row"><span>创建人</span><span>{{ task.createdBy }}</span></div>
            <div class="ri-row"><span>创建时间</span><span class="num">{{ formatDateTime(task.createdAt) }}</span></div>
          </div>
        </SectionCard>
      </div>

      <div class="col center-col">
        <div class="ring-card card">
          <div class="ring-wrap">
            <svg viewBox="0 0 120 120" class="ring">
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#4F7CFF" />
                  <stop offset="100%" stop-color="#22D3A6" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" stroke-width="7" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                :stroke="task.status === 'failed' ? 'var(--danger)' : 'url(#ringGrad)'"
                stroke-width="7"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="dashOffset"
                transform="rotate(-90 60 60)"
                class="ring-progress"
              />
            </svg>
            <div class="ring-center">
              <div class="ring-pct num">{{ task.progress.toFixed(0) }}<i>%</i></div>
              <div class="ring-stage">{{ task.stage }}</div>
            </div>
          </div>

          <div class="ring-meta">
            <div class="rm">
              <span class="rm-l">已用时间</span>
              <span class="rm-v num">{{ formatClock(task.elapsedSec) }}</span>
            </div>
            <div class="rm">
              <span class="rm-l">预计剩余</span>
              <span class="rm-v num">{{ estimateText(Math.max(0, task.estimatedSec - task.elapsedSec)) }}</span>
            </div>
            <div class="rm">
              <span class="rm-l">处理帧数</span>
              <span class="rm-v num">{{ Math.round((task.durationSec * task.progress) / 100 * (task.output.fps || 25)) }}</span>
            </div>
            <div class="rm">
              <span class="rm-l">素材时长</span>
              <span class="rm-v num">{{ formatDuration(task.durationSec) }}</span>
            </div>
          </div>

          <div v-if="gain !== null" class="gain-strip">
            <Zap :size="13" />
            质量提升 <b>+{{ gain }}</b> 分 · VMAF {{ task.qualityBefore.vmaf }} → {{ task.qualityAfter?.vmaf }}
          </div>
        </div>

        <div class="log-card card">
          <div class="log-head">
            <div class="row gap-8">
              <Terminal :size="14" class="t2" />
              <span class="log-title">实时日志</span>
              <span class="task-count">{{ logs.length }} 行</span>
            </div>
            <div class="log-tools">
              <button
                v-for="f in (['ALL', 'INFO', 'WARN', 'ERROR'] as const)"
                :key="f"
                class="lf"
                :class="{ on: logFilter === f }"
                @click="logFilter = f"
              >
                {{ f === 'ALL' ? '全部' : f }}
              </button>
              <button class="lf" :class="{ on: autoScroll }" @click="autoScroll = !autoScroll">自动滚动</button>
              <button class="btn btn-subtle btn-icon btn-sm" title="复制日志" @click="copyLogs">
                <Copy :size="12" />
              </button>
            </div>
          </div>
          <div ref="logBox" class="log-body">
            <div v-if="!logs.length" class="log-empty">暂无该级别日志</div>
            <div v-for="(l, i) in logs" :key="i" class="log-line">
              <span class="lt mono">{{ l.time }}</span>
              <span class="ll" :class="l.level">{{ l.level }}</span>
              <span class="lm">{{ l.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="col">
        <SectionCard title="参数快照">
          <template #actions>
            <button class="btn btn-subtle btn-sm" @click="showParams = !showParams">
              <ChevronDown :size="12" :style="{ transform: showParams ? 'rotate(180deg)' : 'none' }" />
              {{ showParams ? '收起' : '展开' }}
            </button>
          </template>
          <div v-if="showParams" class="params">
            <div v-for="(p, i) in task.pipeline" :key="p.capabilityId" class="param-group">
              <div class="pg-head">
                <span class="pg-idx">{{ i + 1 }}</span>
                <span class="pg-name">{{ capabilityMap[p.capabilityId].name }}</span>
              </div>
              <div class="pg-body">
                <div v-for="(v, k) in p.params" :key="k" class="pg-row">
                  <span class="pg-k">{{ k }}</span>
                  <span class="pg-v num">{{ typeof v === 'boolean' ? (v ? '开启' : '关闭') : v }}</span>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="输出设置">
          <div class="out-list">
            <div class="out-row"><span>分辨率</span><span class="num">{{ task.output.width }} × {{ task.output.height }}</span></div>
            <div class="out-row"><span>规格</span><span>{{ resolutionLabel(task.output.width, task.output.height) }} · {{ task.output.codec }}</span></div>
            <div class="out-row">
              <span>码率</span>
              <span class="num">{{ task.output.bitrateMode === 'CRF' ? `CRF ${task.output.crf}` : `${task.output.bitrate} kbps` }}</span>
            </div>
            <div class="out-row"><span>封装 / 帧率</span><span class="num">{{ task.output.container }} · {{ task.output.fps }}fps</span></div>
            <div class="out-row"><span>色彩空间</span><span>{{ task.output.colorSpace }}</span></div>
            <div class="out-row"><span>音频</span><span>{{ task.output.audioMode === 'copy' ? '直通' : task.output.audioMode === 'none' ? '移除' : 'AAC 192k' }}</span></div>
          </div>
        </SectionCard>

        <div class="tip-card">
          <Cpu :size="14" />
          <p>任务执行期间显存被独占，调整优先级会影响队列顺序但不中断当前任务。</p>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="page">
    <EmptyState title="任务不存在" desc="该任务可能已被删除">
      <button class="btn btn-primary" @click="router.push('/tasks/list')">返回任务列表</button>
    </EmptyState>
  </div>
</template>

<style scoped>
.detail-page {
  padding-bottom: 24px;
}
.top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.top-main {
  flex: 1;
  min-width: 0;
}
.tid {
  font-size: 12px;
  color: var(--text-2);
  letter-spacing: 0.01em;
}
.tname {
  font-size: 15px;
  color: var(--text-1);
  margin-top: 5px;
  font-weight: 500;
  max-width: 620px;
}
.top-ops {
  display: flex;
  gap: 8px;
  flex: none;
}
.err-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 16px;
  background: var(--danger-soft);
  border: 1px solid rgba(244, 82, 107, 0.28);
  border-radius: 9px;
  margin-bottom: 16px;
}
.err-code {
  font-size: 11.5px;
  color: var(--danger);
  font-weight: 500;
  flex: none;
}
.err-msg {
  flex: 1;
  font-size: 12px;
  color: var(--text-2);
}
.grid3 {
  display: grid;
  grid-template-columns: 268px minmax(0, 1fr) 296px;
  gap: 16px;
  align-items: start;
}
.col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.timeline {
  display: flex;
  flex-direction: column;
}
.tl-item {
  display: flex;
  gap: 10px;
  min-height: 34px;
}
.tl-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 14px;
  flex: none;
}
.tl-node {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1.5px solid var(--border-strong);
  background: var(--bg-card);
  display: grid;
  place-items: center;
  color: #fff;
  flex: none;
  margin-top: 3px;
  transition: all 0.2s;
}
.tl-line {
  flex: 1;
  width: 1px;
  background: var(--border);
  margin: 3px 0;
}
.tl-item.done .tl-node {
  background: var(--success);
  border-color: var(--success);
}
.tl-item.done .tl-line {
  background: var(--success);
  opacity: 0.4;
}
.tl-item.current .tl-node {
  background: var(--primary);
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
  animation: pulse 1.8s infinite;
}
@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px var(--primary-soft);
  }
  50% {
    box-shadow: 0 0 0 5px transparent;
  }
}
.tl-text {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 12px;
}
.tl-name {
  font-size: 12px;
  color: var(--text-3);
}
.tl-item.done .tl-name {
  color: var(--text-2);
}
.tl-item.current .tl-name {
  color: var(--text-1);
  font-weight: 500;
}
.tl-badge {
  font-size: 9.5px;
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: 3px;
  padding: 0 4px;
  line-height: 14px;
}
.metric {
  margin-bottom: 16px;
}
.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--text-2);
  margin-bottom: 4px;
}
.metric-top .num {
  color: var(--text-1);
}
.vram-bar {
  height: 4px;
  background: var(--border);
  border-radius: 99px;
  overflow: hidden;
}
.vram-bar div {
  height: 100%;
  background: linear-gradient(90deg, #4f7cff, #a78bfa);
  border-radius: 99px;
  transition: width 0.6s var(--ease);
}
.res-info {
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.ri-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-3);
}
.ri-row span:last-child {
  color: var(--text-2);
}
.center-col {
  gap: 16px;
}
.ring-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ring-wrap {
  position: relative;
  width: 168px;
  height: 168px;
}
.ring {
  width: 100%;
  height: 100%;
}
.ring-progress {
  transition: stroke-dashoffset 0.9s linear;
}
.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.ring-pct {
  font-size: 34px;
  font-weight: 500;
  color: var(--text-1);
  letter-spacing: -0.04em;
  line-height: 1;
}
.ring-pct i {
  font-style: normal;
  font-size: 15px;
  color: var(--text-3);
  margin-left: 1px;
}
.ring-stage {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 7px;
}
.ring-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}
.rm {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rm-l {
  font-size: 10.5px;
  color: var(--text-3);
}
.rm-v {
  font-size: 13px;
  color: var(--text-1);
}
.gain-strip {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin-top: 14px;
  padding: 9px 12px;
  background: var(--success-soft);
  border-radius: 7px;
  font-size: 11.5px;
  color: var(--success);
}
.gain-strip b {
  font-weight: 500;
}
.log-card {
  overflow: hidden;
}
.log-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
}
.log-title {
  font-size: 12.5px;
  color: var(--text-1);
  font-weight: 500;
}
.task-count {
  font-size: 10.5px;
  color: var(--text-3);
}
.log-tools {
  display: flex;
  align-items: center;
  gap: 3px;
}
.lf {
  height: 22px;
  padding: 0 7px;
  border-radius: 4px;
  font-size: 10.5px;
  color: var(--text-3);
}
.lf:hover {
  background: var(--bg-card-hover);
  color: var(--text-2);
}
.lf.on {
  background: var(--bg-inset);
  color: var(--text-1);
}
.log-body {
  height: 236px;
  overflow-y: auto;
  padding: 10px 14px;
  background: var(--bg-inset);
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.9;
}
.log-line {
  display: flex;
  gap: 9px;
  white-space: nowrap;
}
.lt {
  color: var(--text-3);
  flex: none;
  opacity: 0.8;
}
.ll {
  flex: none;
  width: 40px;
  font-size: 10px;
  font-weight: 500;
}
.ll.INFO {
  color: var(--primary);
}
.ll.WARN {
  color: var(--warning);
}
.ll.ERROR {
  color: var(--danger);
}
.ll.DEBUG {
  color: var(--text-3);
}
.lm {
  color: var(--text-2);
  white-space: normal;
  word-break: break-all;
}
.log-empty {
  color: var(--text-3);
  text-align: center;
  padding: 20px;
}
.params {
  display: flex;
  flex-direction: column;
  gap: 13px;
}
.param-group {
  border-left: 2px solid var(--border);
  padding-left: 10px;
}
.pg-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.pg-idx {
  width: 15px;
  height: 15px;
  border-radius: 4px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 9px;
  display: grid;
  place-items: center;
  font-weight: 600;
}
.pg-name {
  font-size: 11.5px;
  color: var(--text-1);
  font-weight: 500;
}
.pg-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.pg-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 10.5px;
}
.pg-k {
  color: var(--text-3);
  font-family: var(--font-mono);
}
.pg-v {
  color: var(--text-2);
}
.out-list {
  display: flex;
  flex-direction: column;
}
.out-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  font-size: 11px;
  border-bottom: 1px dashed var(--border-subtle);
}
.out-row:last-child {
  border-bottom: none;
}
.out-row span:first-child {
  color: var(--text-3);
}
.out-row span:last-child {
  color: var(--text-1);
  text-align: right;
}
.tip-card {
  display: flex;
  gap: 9px;
  padding: 12px 14px;
  border: 1px dashed var(--border-strong);
  border-radius: 9px;
  color: var(--text-3);
}
.tip-card p {
  font-size: 10.5px;
  line-height: 1.65;
}
@media (max-width: 1360px) {
  .grid3 {
    grid-template-columns: 250px minmax(0, 1fr);
  }
  .grid3 > .col:last-child {
    grid-column: span 2;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: start;
  }
}
@media (max-width: 1080px) {
  .grid3 {
    grid-template-columns: minmax(0, 1fr);
  }
  .grid3 > .col:last-child {
    grid-column: auto;
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
