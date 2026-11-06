<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  ArrowUpRight,
  CircleCheck,
  Clock,
  Database,
  Film,
  Gauge,
  Pause,
  Plus,
  Sparkles,
  Upload,
  X
} from 'lucide-vue-next'
import SectionCard from '@/components/ui/SectionCard.vue'
import BaseChart from '@/components/ui/BaseChart.vue'
import Sparkline from '@/components/ui/Sparkline.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import { capabilities } from '@/mock/capabilities'
import { estimateText, formatDate, formatGB, fromNow, resolutionLabel } from '@/composables/useFormat'

const data = useDataStore()
const app = useAppStore()
const router = useRouter()

const range = ref<7 | 14 | 30>(30)

const hours = computed(() => data.stats.hours)
const storagePct = computed(() => Math.round((data.stats.storage / data.currentUser.storageTotal) * 100))

const cards = computed(() => [
  {
    label: '本月处理时长',
    value: hours.value.toFixed(1),
    unit: '小时',
    delta: '+12.4%',
    icon: Clock,
    color: 'var(--primary)',
    spark: data.trend.slice(-12).map((p) => p.hours)
  },
  {
    label: '已完成任务',
    value: String(data.stats.completed),
    unit: '个',
    delta: '+8.1%',
    icon: CircleCheck,
    color: 'var(--success)',
    spark: data.trend.slice(-12).map((p) => p.tasks)
  },
  {
    label: '平均质量提升',
    value: `+${data.stats.avgGain.toFixed(1)}`,
    unit: '分',
    delta: '+2.3',
    icon: Sparkles,
    color: 'var(--purple)',
    spark: data.trend.slice(-12).map((p) => p.vmaf - 60)
  },
  {
    label: '存储占用',
    value: formatGB(data.stats.storage),
    unit: `/ ${data.currentUser.storageTotal} TB`,
    delta: `${storagePct.value}%`,
    icon: Database,
    color: 'var(--warning)',
    spark: data.trend.slice(-12).map((p) => p.hours + 30)
  }
])

const trendOption = computed(() => {
  const points = data.trend.slice(-range.value)
  return {
    grid: { left: 4, right: 8, top: 30, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['处理时长', '平均 VMAF'],
      top: 0,
      right: 0,
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 11 }
    },
    xAxis: {
      type: 'category',
      data: points.map((p) => p.date),
      axisLine: { lineStyle: { color: 'var(--border)' } },
      axisLabel: { interval: range.value === 30 ? 4 : 1, fontSize: 10 }
    },
    yAxis: [
      {
        type: 'value',
        name: '小时',
        nameTextStyle: { fontSize: 10, color: 'var(--text-3)', padding: [0, 0, 0, -20] },
        splitLine: { show: true },
        axisLabel: { fontSize: 10 }
      },
      {
        type: 'value',
        name: 'VMAF',
        nameTextStyle: { fontSize: 10, color: 'var(--text-3)' },
        min: 50,
        max: 100,
        splitLine: { show: false },
        axisLabel: { fontSize: 10 }
      }
    ],
    series: [
      {
        name: '处理时长',
        type: 'bar',
        data: points.map((p) => p.hours),
        barMaxWidth: 14,
        itemStyle: {
          borderRadius: [3, 3, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(79,124,255,0.95)' },
              { offset: 1, color: 'rgba(79,124,255,0.18)' }
            ]
          }
        }
      },
      {
        name: '平均 VMAF',
        type: 'line',
        yAxisIndex: 1,
        data: points.map((p) => p.vmaf),
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: false,
        lineStyle: { width: 2, color: '#22D3A6' },
        itemStyle: { color: '#22D3A6' }
      }
    ]
  }
})

const palette = ['#4F7CFF', '#22D3A6', '#A78BFA', '#F5A524', '#38BDF8', '#F4526B', '#34D399', '#818CF8']

const usage = computed(() => {
  const counts: Record<string, number> = {}
  data.tasks.forEach((t) =>
    t.pipeline.forEach((p) => {
      counts[p.capabilityId] = (counts[p.capabilityId] || 0) + 1
    })
  )
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return capabilities
    .map((c) => ({ name: c.shortName, value: counts[c.id] || 0 }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((c, i) => ({ ...c, pct: Math.round((c.value / total) * 100), color: palette[i % palette.length] }))
})

const usageOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}：{c} 次（{d}%）' },
  series: [
    {
      type: 'pie',
      radius: ['63%', '86%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: 'var(--bg-card)', borderWidth: 2 },
      label: { show: false },
      labelLine: { show: false },
      data: usage.value.map((u) => ({ value: u.value, name: u.name, itemStyle: { color: u.color } }))
    }
  ]
}))

const running = computed(() => data.runningTasks)

const recent = computed(() =>
  data.completedTasks
    .slice()
    .sort((a, b) => new Date(b.finishedAt ?? b.createdAt).getTime() - new Date(a.finishedAt ?? a.createdAt).getTime())
    .slice(0, 4)
)

const announcements = [
  { date: '2026-10-17', title: 'v2.8.1 发布', desc: '新增分块推理开关，修复老片去闪烁在 GOP 边界的横纹问题。' },
  { date: '2026-10-12', title: '模型更新', desc: 'VID-SR v3.2 上线，4K 输出显存占用下降 12%，帧间一致性提升。' },
  { date: '2026-10-08', title: '服务通知', desc: '华东节点将于 10 月 22 日 02:00–04:00 进行存储扩容维护。' }
]
</script>

<template>
  <div class="page">
    <section class="hero">
      <div class="hero-l">
        <div class="greet">下午好，{{ data.currentUser.name }}</div>
        <p class="hero-desc">
          本月已完成 <b>{{ data.stats.completed }}</b> 个增强任务，平均质量提升
          <b class="up">+{{ data.stats.avgGain.toFixed(1) }}</b> 分。当前
          <b>{{ running.length }}</b> 个任务处理中，<b>{{ data.queuedTasks.length }}</b> 个在队列等待。
        </p>
        <div class="hero-meta">
          <span class="tag tag-primary">{{ data.currentUser.plan }}</span>
          <span>剩余 {{ data.currentUser.remainingHours }} 小时</span>
          <i class="sep" />
          <span>存储 {{ formatGB(data.stats.storage) }} / {{ data.currentUser.storageTotal }} TB</span>
          <i class="sep" />
          <span>到期 {{ data.currentUser.planExpire }}</span>
        </div>
      </div>
      <div class="hero-art">
        <svg viewBox="0 0 420 120" preserveAspectRatio="none" width="100%" height="100%">
          <defs>
            <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#4F7CFF" stop-opacity="0.1" />
              <stop offset="55%" stop-color="#4F7CFF" stop-opacity="0.85" />
              <stop offset="100%" stop-color="#22D3A6" stop-opacity="0.9" />
            </linearGradient>
          </defs>
          <g>
            <rect
              v-for="i in 56"
              :key="i"
              :x="i * 7.4"
              :y="60 - (12 + Math.abs(Math.sin(i * 0.55)) * 34 + (i % 5) * 3)"
              width="2.6"
              :height="24 + Math.abs(Math.sin(i * 0.55)) * 68 + (i % 5) * 6"
              rx="1.3"
              fill="url(#waveGrad)"
              :opacity="0.35 + Math.abs(Math.sin(i * 0.55)) * 0.65"
            />
          </g>
        </svg>
      </div>
    </section>

    <section class="stat-grid">
      <div v-for="c in cards" :key="c.label" class="stat card card-hover">
        <div class="stat-top">
          <div class="stat-icon" :style="{ color: c.color, background: 'var(--bg-inset)' }">
            <component :is="c.icon" :size="15" />
          </div>
          <span class="stat-label">{{ c.label }}</span>
        </div>
        <div class="stat-value">
          <span class="v num">{{ c.value }}</span>
          <span class="u">{{ c.unit }}</span>
        </div>
        <div class="stat-foot">
          <span class="delta"><ArrowUpRight :size="11" />{{ c.delta }}</span>
          <Sparkline :values="c.spark" :color="c.color" :width="78" :height="26" />
        </div>
      </div>
    </section>

    <div class="main-grid">
      <div class="col-main">
        <SectionCard title="处理趋势">
          <template #actions>
            <div class="seg">
              <button v-for="r in [7, 14, 30]" :key="r" :class="{ on: range === r }" @click="range = r as 7 | 14 | 30">
                {{ r }} 天
              </button>
            </div>
          </template>
          <BaseChart :option="trendOption" :height="252" />
        </SectionCard>

        <SectionCard title="进行中任务" :desc="`${running.length} 个任务占用 GPU`" no-pad>
          <template #actions>
            <button class="btn btn-subtle btn-sm" @click="router.push('/tasks/list')">
              全部任务 <ArrowRight :size="12" />
            </button>
          </template>
          <div v-if="running.length" class="run-list">
            <div v-for="t in running" :key="t.id" class="run-item">
              <div class="run-thumb" :style="{ background: `linear-gradient(135deg, ${data.assetById(t.assetId)?.thumbnailColor[0] ?? '#1b2a4a'}, ${data.assetById(t.assetId)?.thumbnailColor[1] ?? '#0d1526'})` }">
                <Film :size="14" />
              </div>
              <div class="run-main">
                <div class="row between gap-8">
                  <span class="run-name ellipsis">{{ t.assetName }}</span>
                  <span class="run-pct num">{{ t.progress.toFixed(1) }}%</span>
                </div>
                <div class="bar">
                  <div class="bar-fill" :style="{ width: t.progress + '%' }" />
                </div>
                <div class="run-meta">
                  <span>{{ t.stage }}</span>
                  <i class="sep" />
                  <span class="mono">{{ t.id }}</span>
                  <i class="sep" />
                  <span>{{ estimateText(t.estimatedSec - t.elapsedSec) }}后完成</span>
                </div>
              </div>
              <div class="run-ops">
                <button class="btn btn-subtle btn-icon btn-sm" title="暂停" @click="data.pauseTask(t.id); app.toast('info', '任务已暂停', t.assetName)">
                  <Pause :size="13" />
                </button>
                <button class="btn btn-subtle btn-icon btn-sm" title="取消" @click="data.cancelTask(t.id); app.toast('warning', '任务已取消', t.assetName)">
                  <X :size="13" />
                </button>
              </div>
            </div>
          </div>
          <EmptyState v-else title="当前没有处理中的任务" desc="GPU 节点空闲，可以提交新的增强任务">
            <button class="btn btn-primary" @click="router.push('/tasks/new')">
              <Plus :size="14" /> 新建任务
            </button>
          </EmptyState>
        </SectionCard>
      </div>

      <div class="col-side">
        <SectionCard title="能力使用分布">
          <div class="donut-wrap">
            <BaseChart :option="usageOption" :height="180" />
            <div class="donut-center">
              <span class="dc-v num">{{ data.tasks.length }}</span>
              <span class="dc-l">任务总数</span>
            </div>
          </div>
          <div class="legend">
            <div v-for="u in usage" :key="u.name" class="legend-item">
              <i class="sw" :style="{ background: u.color }" />
              <span class="lg-name">{{ u.name }}</span>
              <span class="lg-val num">{{ u.pct }}%</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="最近成片">
          <template #actions>
            <button class="btn btn-subtle btn-sm" @click="router.push('/quality')">
              <Gauge :size="12" /> 评估
            </button>
          </template>
          <div class="recent">
            <button
              v-for="t in recent"
              :key="t.id"
              class="recent-item"
              @click="router.push(`/tasks/${t.id}/compare`)"
            >
              <div class="recent-thumb" :style="{ background: `linear-gradient(135deg, ${data.assetById(t.assetId)?.thumbnailColor[0] ?? '#1b2a4a'}, ${data.assetById(t.assetId)?.thumbnailColor[1] ?? '#0d1526'})` }">
                <span class="res">{{ resolutionLabel(t.output.width, t.output.height) }}</span>
              </div>
              <div class="recent-main">
                <div class="recent-name ellipsis">{{ t.assetName }}</div>
                <div class="recent-meta">
                  <span>{{ formatDate(t.createdAt) }}</span>
                  <i class="sep" />
                  <span class="gain num">+{{ ((t.qualityAfter?.score ?? 0) - t.qualityBefore.score).toFixed(0) }} 分</span>
                </div>
              </div>
              <ArrowRight :size="13" class="recent-arrow" />
            </button>
          </div>
        </SectionCard>

        <SectionCard title="服务与公告">
          <div class="status-strip">
            <span class="dot" style="background: var(--success)" />
            <span>所有服务运行正常</span>
            <span class="slash">/</span>
            <span class="mono">可用率 99.97%</span>
          </div>
          <div class="ann">
            <div v-for="a in announcements" :key="a.date" class="ann-item">
              <div class="ann-dot" />
              <div>
                <div class="ann-title">{{ a.title }}</div>
                <div class="ann-desc">{{ a.desc }}</div>
                <div class="ann-date">{{ a.date }}</div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 24px;
  border-radius: var(--r-card);
  border: 1px solid var(--border);
  background:
    radial-gradient(120% 140% at 88% 10%, rgba(79, 124, 255, 0.12), transparent 60%),
    radial-gradient(90% 120% at 100% 100%, rgba(34, 211, 166, 0.08), transparent 60%),
    var(--bg-card);
  position: relative;
  overflow: hidden;
  margin-bottom: 16px;
}
.hero-l {
  min-width: 0;
  z-index: 1;
}
.greet {
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--text-1);
}
.hero-desc {
  margin-top: 7px;
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.65;
}
.hero-desc b {
  color: var(--text-1);
  font-weight: 500;
}
.hero-desc .up {
  color: var(--success);
}
.hero-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  font-size: 11.5px;
  color: var(--text-3);
  flex-wrap: wrap;
}
.sep {
  width: 1px;
  height: 10px;
  background: var(--border-strong);
  display: inline-block;
}
.hero-art {
  width: 380px;
  height: 100px;
  flex: none;
  opacity: 0.75;
  mask-image: linear-gradient(to right, transparent, #000 22%);
  -webkit-mask-image: linear-gradient(to right, transparent, #000 22%);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.stat {
  padding: 16px 18px 14px;
}
.stat-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.stat-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: grid;
  place-items: center;
  flex: none;
}
.stat-label {
  font-size: 12px;
  color: var(--text-2);
}
.stat-value {
  margin-top: 12px;
  display: flex;
  align-items: baseline;
  gap: 5px;
}
.stat-value .v {
  font-size: 27px;
  font-weight: 500;
  letter-spacing: -0.03em;
  color: var(--text-1);
  line-height: 1.1;
}
.stat-value .u {
  font-size: 11.5px;
  color: var(--text-3);
}
.stat-foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 8px;
  gap: 8px;
}
.delta {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: var(--success);
  font-variant-numeric: tabular-nums;
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 344px;
  gap: 16px;
  align-items: start;
}
.col-main,
.col-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.seg {
  display: flex;
  gap: 2px;
  padding: 2px;
  background: var(--bg-inset);
  border-radius: 6px;
  border: 1px solid var(--border);
}
.seg button {
  padding: 3px 9px;
  font-size: 11px;
  color: var(--text-3);
  border-radius: 4px;
}
.seg button.on {
  background: var(--bg-card);
  color: var(--text-1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
}

.run-list {
  display: flex;
  flex-direction: column;
}
.run-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-subtle);
}
.run-item:last-child {
  border-bottom: none;
}
.run-thumb {
  width: 48px;
  height: 30px;
  border-radius: 5px;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.66);
  flex: none;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.run-main {
  flex: 1;
  min-width: 0;
}
.run-name {
  font-size: 12.5px;
  color: var(--text-1);
}
.run-pct {
  font-size: 12.5px;
  color: var(--primary);
  font-weight: 500;
  flex: none;
}
.bar {
  height: 3px;
  background: var(--border);
  border-radius: 99px;
  margin: 7px 0 6px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: var(--gradient);
  border-radius: 99px;
  transition: width 0.8s linear;
}
.run-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10.5px;
  color: var(--text-3);
}
.run-ops {
  display: flex;
  gap: 2px;
  flex: none;
}

.donut-wrap {
  position: relative;
}
.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  padding-bottom: 4px;
}
.dc-v {
  font-size: 24px;
  font-weight: 500;
  color: var(--text-1);
  line-height: 1;
}
.dc-l {
  font-size: 10.5px;
  color: var(--text-3);
  margin-top: 4px;
}
.legend {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 14px;
  margin-top: 8px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.sw {
  width: 7px;
  height: 7px;
  border-radius: 2px;
  flex: none;
}
.lg-name {
  font-size: 11.5px;
  color: var(--text-2);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lg-val {
  font-size: 11px;
  color: var(--text-3);
  flex: none;
}

.recent {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 7px;
  text-align: left;
  transition: background 0.14s;
}
.recent-item:hover {
  background: var(--bg-card-hover);
}
.recent-thumb {
  width: 52px;
  height: 32px;
  border-radius: 5px;
  position: relative;
  flex: none;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.res {
  position: absolute;
  right: 3px;
  bottom: 3px;
  font-size: 8px;
  color: rgba(255, 255, 255, 0.82);
  background: rgba(0, 0, 0, 0.45);
  border-radius: 3px;
  padding: 0 3px;
  font-weight: 500;
}
.recent-main {
  flex: 1;
  min-width: 0;
}
.recent-name {
  font-size: 12px;
  color: var(--text-1);
}
.recent-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  color: var(--text-3);
  margin-top: 2px;
}
.gain {
  color: var(--success);
}
.recent-arrow {
  color: var(--text-3);
  flex: none;
  opacity: 0;
  transition: opacity 0.14s;
}
.recent-item:hover .recent-arrow {
  opacity: 1;
}

.status-strip {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  color: var(--text-2);
  padding: 9px 11px;
  background: var(--success-soft);
  border-radius: 7px;
  margin-bottom: 14px;
}
.slash {
  color: var(--text-3);
}
.ann {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ann-item {
  display: flex;
  gap: 10px;
  position: relative;
  padding-left: 2px;
}
.ann-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--border-strong);
  margin-top: 7px;
  flex: none;
}
.ann-title {
  font-size: 12px;
  color: var(--text-1);
  font-weight: 500;
}
.ann-desc {
  font-size: 11px;
  color: var(--text-3);
  line-height: 1.55;
  margin-top: 2px;
}
.ann-date {
  font-size: 10px;
  color: var(--text-3);
  opacity: 0.7;
  margin-top: 3px;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1320px) {
  .main-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .hero-art {
    display: none;
  }
}
@media (max-width: 1080px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
