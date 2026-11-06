<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Eye,
  Gauge,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Star,
  ZoomIn
} from 'lucide-vue-next'
import DemoCanvas from '@/components/player/DemoCanvas.vue'
import BaseChart from '@/components/ui/BaseChart.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import { capabilityMap } from '@/mock/capabilities'
import { formatDuration, formatTimecode } from '@/composables/useFormat'

const route = useRoute()
const router = useRouter()
const data = useDataStore()
const app = useAppStore()

const task = computed(() => data.taskById(String(route.params.taskId)))
const asset = computed(() => (task.value ? data.assetById(task.value.assetId) : undefined))

type Mode = 'slider' | 'split' | 'ab'
const mode = ref<Mode>('slider')
const time = ref(0)
const playing = ref(true)
const rate = ref(1)
const zoom = ref(1)
const slider = ref(50)
const dragging = ref(false)
const showBefore = ref(false)
const stars = ref(4)
const tags = ref<string[]>([])
const note = ref('')

const fps = computed(() => asset.value?.fps ?? 25)
const duration = computed(() => task.value?.durationSec ?? 60)
const pct = computed(() => (time.value / duration.value) * 100)

let raf = 0
let last = 0

function loop(ts: number) {
  if (!last) last = ts
  const dt = (ts - last) / 1000
  last = ts
  if (playing.value) {
    time.value += dt * rate.value
    if (time.value >= duration.value) time.value = 0
  }
  raf = requestAnimationFrame(loop)
}

function seek(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  time.value = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * duration.value
}

function startSeek(e: MouseEvent) {
  dragging.value = true
  seek(e)
  const move = (ev: MouseEvent) => seek(ev)
  const up = () => {
    dragging.value = false
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

function seekSlider(e: MouseEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  slider.value = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))
}

function startSliderDrag(e: MouseEvent) {
  seekSlider(e)
  const move = (ev: MouseEvent) => seekSlider(ev)
  const up = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

function stepFrame(dir: number) {
  time.value = Math.min(duration.value, Math.max(0, time.value + dir / fps.value))
}

const metrics = computed(() => {
  const t = task.value
  if (!t?.qualityAfter) return []
  const b = t.qualityBefore
  const a = t.qualityAfter
  return [
    { key: 'PSNR', before: b.psnr, after: a.psnr, unit: 'dB', better: 'up', digits: 1 },
    { key: 'SSIM', before: b.ssim, after: a.ssim, unit: '', better: 'up', digits: 3 },
    { key: 'VMAF', before: b.vmaf, after: a.vmaf, unit: '', better: 'up', digits: 1 },
    { key: 'NIQE', before: b.niqe, after: a.niqe, unit: '', better: 'down', digits: 1 },
    { key: '综合分', before: b.score, after: a.score, unit: '', better: 'up', digits: 0 }
  ]
})

const vmafCurve = computed(() => {
  const t = task.value
  if (!t?.qualityAfter) return {}
  const labels = Array.from({ length: 11 }, (_, i) => `${i * 10}%`)
  const before = labels.map((_, i) => Math.round((t.qualityBefore.vmaf + Math.sin(i / 1.4) * 3.2 - i * 0.15) * 10) / 10)
  const after = labels.map((_, i) => Math.round((t.qualityAfter!.vmaf + Math.sin(i / 1.7) * 2.4 - i * 0.1) * 10) / 10)
  return {
    grid: { left: 2, right: 8, top: 22, bottom: 0, containLabel: true },
    legend: { data: ['增强前', '增强后'], right: 0, top: 0, itemWidth: 7, itemHeight: 7, textStyle: { fontSize: 10 } },
    xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 9, interval: 2 } },
    yAxis: { type: 'value', min: 30, max: 100, axisLabel: { fontSize: 9 } },
    series: [
      {
        name: '增强前',
        type: 'line',
        data: before,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 1.4, color: 'var(--text-3)', type: 'dashed' }
      },
      {
        name: '增强后',
        type: 'line',
        data: after,
        smooth: true,
        symbol: 'none',
        lineWidth: 2,
        lineStyle: { width: 2, color: '#22D3A6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34,211,166,0.22)' },
              { offset: 1, color: 'rgba(34,211,166,0)' }
            ]
          }
        }
      }
    ]
  }
})

function toggleTag(t: string) {
  tags.value = tags.value.includes(t) ? tags.value.filter((x) => x !== t) : [...tags.value, t]
}

function submitReview() {
  app.toast('success', '评审已提交', `${stars.value} 星 · ${tags.value.length} 个问题标签已记录到质量报告`)
}

onMounted(() => {
  raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div v-if="task" class="compare">
    <header class="cmp-head">
      <div class="left">
        <button class="btn btn-subtle btn-icon" aria-label="返回" @click="router.push(`/tasks/${task.id}`)">
          <ArrowLeft :size="16" />
        </button>
        <div class="head-text">
          <div class="h-title ellipsis">{{ task.assetName }}</div>
          <div class="h-sub mono">{{ task.id }} · {{ task.pipeline.map((p) => capabilityMap[p.capabilityId].shortName).join(' / ') }}</div>
        </div>
      </div>
      <div class="mode-switch">
        <button :class="{ on: mode === 'slider' }" @click="mode = 'slider'">
          <SlidersHorizontal :size="13" /> 滑杆对比
        </button>
        <button :class="{ on: mode === 'split' }" @click="mode = 'split'">
          <Columns2 :size="13" /> 左右分屏
        </button>
        <button :class="{ on: mode === 'ab' }" @click="mode = 'ab'">
          <Eye :size="13" /> A/B 闪烁
        </button>
      </div>
      <div class="right">
        <button class="zoom" :class="{ on: zoom === 1 }" @click="zoom = 1">适应</button>
        <button class="zoom" :class="{ on: zoom === 1.5 }" @click="zoom = 1.5">150%</button>
        <button class="zoom" :class="{ on: zoom === 2 }" @click="zoom = 2">200%</button>
        <button class="btn btn-ghost btn-icon btn-sm" aria-label="全屏" @click="(e) => (e as unknown) && null">
          <Maximize2 :size="13" />
        </button>
      </div>
    </header>

    <div class="body">
      <div class="stage-col">
        <div class="stage" :class="mode">
          <!-- 滑杆模式 -->
          <template v-if="mode === 'slider'">
            <div class="layer" :style="{ transform: `scale(${zoom})` }">
              <DemoCanvas :time="time" :degraded="false" :seed="Number(asset?.id.slice(-3) ?? 7)" />
            </div>
            <div
              class="layer before"
              :style="{ clipPath: `inset(0 ${100 - slider}% 0 0)`, transform: `scale(${zoom})` }"
            >
              <DemoCanvas :time="time" :degraded="true" :seed="Number(asset?.id.slice(-3) ?? 7)" />
            </div>
            <div class="divider-line" :style="{ left: slider + '%' }">
              <div class="handle" @mousedown.prevent="startSliderDrag">
                <ChevronLeft :size="12" />
                <ChevronRight :size="12" />
              </div>
            </div>
            <div class="tag-before" :style="{ opacity: slider > 12 ? 1 : 0 }">增强前</div>
            <div class="tag-after" :style="{ opacity: slider < 88 ? 1 : 0 }">增强后</div>
          </template>

          <!-- 分屏 -->
          <template v-else-if="mode === 'split'">
            <div class="half">
              <div class="half-label">增强前 · {{ asset?.width }}×{{ asset?.height }}</div>
              <DemoCanvas :time="time" :degraded="true" :seed="Number(asset?.id.slice(-3) ?? 7)" />
            </div>
            <div class="half">
              <div class="half-label after">
                增强后 · {{ task.output.width }}×{{ task.output.height }}
              </div>
              <DemoCanvas :time="time" :degraded="false" :seed="Number(asset?.id.slice(-3) ?? 7)" />
            </div>
          </template>

          <!-- A/B -->
          <template v-else>
            <div class="layer" :style="{ transform: `scale(${zoom})` }">
              <DemoCanvas :time="time" :degraded="false" :seed="Number(asset?.id.slice(-3) ?? 7)" />
            </div>
            <div v-if="showBefore" class="layer">
              <DemoCanvas :time="time" :degraded="true" :seed="Number(asset?.id.slice(-3) ?? 7)" />
            </div>
            <button
              class="ab-btn"
              @mousedown="showBefore = true"
              @mouseup="showBefore = false"
              @mouseleave="showBefore = false"
            >
              {{ showBefore ? '增强前' : '按住查看增强前' }}
            </button>
            <div class="ab-hint">按住鼠标左键对比，松开回到增强后</div>
          </template>

          <div class="stage-badge mono">{{ formatTimecode(time, fps) }}</div>
        </div>

        <div class="controls card">
          <div class="track" @mousedown.prevent="startSeek">
            <div class="fill" :style="{ width: pct + '%' }" />
            <div class="head-dot" :style="{ left: pct + '%' }" />
          </div>
          <div class="ctrl-bar">
            <div class="row gap-8">
              <button class="ctl primary" :aria-label="playing ? '暂停' : '播放'" @click="playing = !playing">
                <Pause v-if="playing" :size="15" />
                <Play v-else :size="15" />
              </button>
              <button class="ctl" aria-label="上一帧" @click="stepFrame(-1)"><ChevronLeft :size="15" /></button>
              <button class="ctl" aria-label="下一帧" @click="stepFrame(1)"><ChevronRight :size="15" /></button>
              <button class="ctl" aria-label="回到开头" @click="time = 0"><RotateCcw :size="13" /></button>
              <span class="tc mono">{{ formatTimecode(time, fps) }} <i>/</i> {{ formatDuration(duration) }}</span>
            </div>
            <div class="row gap-8">
              <button class="rate" @click="rate = rate >= 2 ? 0.5 : rate * 2">{{ rate }}x</button>
              <span class="sync-hint"><span class="dot" style="background: var(--success)" /> 双路同步</span>
            </div>
          </div>
        </div>
      </div>

      <aside class="metrics">
        <div class="m-head">
          <span class="m-title"><Gauge :size="13" /> 质量指标</span>
          <span class="tag tag-success">提升 +{{ ((task.qualityAfter?.score ?? 0) - task.qualityBefore.score).toFixed(0) }}</span>
        </div>

        <div class="m-list">
          <div v-for="m in metrics" :key="m.key" class="m-item">
            <div class="m-top">
              <span class="m-key">{{ m.key }}</span>
              <span class="m-chg" :class="m.better === 'up' ? 'up' : 'down'">
                {{ m.before.toFixed(m.digits) }}
                <span class="arrow">→</span>
                <b>{{ m.after.toFixed(m.digits) }}</b>
              </span>
            </div>
            <div class="m-bars">
              <div class="m-bar"><div class="m-before-fill" :style="{ width: Math.min(100, (m.before / 100) * 100) + '%' }" /></div>
              <div class="m-bar"><div class="m-after-fill" :style="{ width: Math.min(100, (m.after / 100) * 100) + '%' }" /></div>
            </div>
            <div class="m-foot">
              <span>{{ m.before.toFixed(m.digits) }}{{ m.unit }}</span>
              <span class="delta" :class="m.better === 'up' ? 'up' : 'down'">{{
                m.better === 'up' ? '+' : ''
              }}{{ (m.after - m.before).toFixed(m.digits) }}</span>
            </div>
          </div>
        </div>

        <div class="curve">
          <div class="m-title small">逐段 VMAF 对比</div>
          <BaseChart :option="vmafCurve" :height="150" />
        </div>

        <div class="review">
          <div class="review-title">主观评审</div>
          <div class="stars">
            <button v-for="i in 5" :key="i" @click="stars = i" :aria-label="`${i} 星`">
              <Star :size="17" :fill="i <= stars ? 'var(--warning)' : 'none'" :color="i <= stars ? 'var(--warning)' : 'var(--text-3)'" />
            </button>
            <span class="star-text">{{ stars }}.0</span>
          </div>
          <div class="tag-list">
            <button
              v-for="t in ['模糊残留', '过度锐化', '色彩偏移', '闪烁', '噪点残留', '边缘伪影']"
              :key="t"
              class="rt"
              :class="{ on: tags.includes(t) }"
              @click="toggleTag(t)"
            >
              {{ t }}
            </button>
          </div>
          <textarea v-model="note" class="input note" rows="2" placeholder="补充说明（可选）" />
          <button class="btn btn-primary btn-sm submit" @click="submitReview">提交评审</button>
        </div>
      </aside>
    </div>
  </div>

  <div v-else class="page">
    <EmptyState title="任务不存在" desc="无法加载对比画面">
      <button class="btn btn-primary" @click="router.push('/tasks/list')">返回任务列表</button>
    </EmptyState>
  </div>
</template>

<style scoped>
.compare {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 14px 20px 16px;
}
.cmp-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  flex: none;
}
.left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.head-text {
  min-width: 0;
}
.h-title {
  font-size: 14px;
  color: var(--text-1);
  font-weight: 500;
  max-width: 420px;
}
.h-sub {
  font-size: 10.5px;
  color: var(--text-3);
  margin-top: 2px;
}
.mode-switch {
  display: flex;
  gap: 2px;
  padding: 3px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin: 0 auto;
}
.mode-switch button {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 11px;
  border-radius: 6px;
  font-size: 11.5px;
  color: var(--text-3);
}
.mode-switch button:hover {
  color: var(--text-2);
}
.mode-switch button.on {
  background: var(--bg-elevated);
  color: var(--text-1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}
.right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
}
.zoom {
  height: 26px;
  padding: 0 8px;
  border-radius: 5px;
  font-size: 11px;
  color: var(--text-3);
  border: 1px solid transparent;
}
.zoom:hover {
  color: var(--text-2);
}
.zoom.on {
  border-color: var(--border);
  color: var(--text-1);
  background: var(--bg-card);
}
.body {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 14px;
  min-height: 0;
}
.stage-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
}
.stage {
  position: relative;
  flex: 1;
  min-height: 240px;
  border-radius: 10px;
  overflow: hidden;
  background: #05060c;
  border: 1px solid var(--border);
  cursor: crosshair;
}
.stage.split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--border-strong);
}
.layer {
  position: absolute;
  inset: 0;
  transition: transform 0.18s var(--ease);
  transform-origin: center;
}
.layer.before {
  z-index: 2;
}
.divider-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.85);
  z-index: 5;
  pointer-events: none;
}
.handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  color: #10151f;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
  cursor: ew-resize;
  pointer-events: auto;
}
.tag-before,
.tag-after {
  position: absolute;
  top: 12px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(6, 9, 15, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 2px 7px;
  z-index: 6;
  transition: opacity 0.16s;
  backdrop-filter: blur(4px);
}
.tag-before {
  left: 12px;
}
.tag-after {
  right: 12px;
  color: #7fe8c8;
  border-color: rgba(34, 211, 166, 0.3);
}
.half {
  position: relative;
  overflow: hidden;
}
.half-label {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 3;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.86);
  background: rgba(6, 9, 15, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}
.half-label.after {
  color: #7fe8c8;
  border-color: rgba(34, 211, 166, 0.3);
}
.ab-btn {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 6;
  height: 32px;
  padding: 0 16px;
  border-radius: 99px;
  background: rgba(10, 14, 22, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.9);
  font-size: 11.5px;
  backdrop-filter: blur(6px);
  user-select: none;
}
.ab-hint {
  position: absolute;
  bottom: 54px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  z-index: 6;
}
.stage-badge {
  position: absolute;
  bottom: 10px;
  right: 12px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.72);
  background: rgba(6, 9, 15, 0.5);
  border-radius: 4px;
  padding: 1px 6px;
  z-index: 6;
}
.controls {
  flex: none;
  padding: 10px 14px 8px;
}
.track {
  height: 4px;
  background: var(--border);
  border-radius: 99px;
  position: relative;
  cursor: pointer;
  margin-bottom: 8px;
}
.track::before {
  content: '';
  position: absolute;
  inset: -8px 0;
}
.fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--gradient);
  border-radius: 99px;
}
.head-dot {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 3px rgba(79, 124, 255, 0.3);
}
.ctrl-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ctl {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 5px;
  color: var(--text-2);
}
.ctl:hover {
  background: var(--bg-card-hover);
  color: var(--text-1);
}
.ctl.primary {
  background: var(--primary);
  color: #fff;
}
.ctl.primary:hover {
  background: var(--primary-hover);
}
.tc {
  font-size: 11px;
  color: var(--text-2);
  margin-left: 6px;
}
.tc i {
  font-style: normal;
  color: var(--text-3);
  margin: 0 2px;
}
.rate {
  font-size: 10.5px;
  color: var(--text-2);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 6px;
}
.sync-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: var(--text-3);
}

.metrics {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  padding: 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}
.m-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.m-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-1);
  font-weight: 500;
}
.m-title.small {
  font-size: 11.5px;
  color: var(--text-2);
}
.m-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.m-item {
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--border-subtle);
}
.m-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.m-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.m-key {
  font-size: 11px;
  color: var(--text-3);
  font-family: var(--font-mono);
}
.m-chg {
  font-size: 11px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}
.m-chg b {
  font-weight: 500;
}
.m-chg.up b {
  color: var(--success);
}
.m-chg.down b {
  color: var(--success);
}
.m-chg .arrow {
  color: var(--text-3);
  margin: 0 3px;
  opacity: 0.6;
}
.m-bars {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.m-bar {
  height: 3px;
  background: var(--border);
  border-radius: 99px;
  overflow: hidden;
}
.m-before-fill {
  height: 100%;
  background: var(--text-3);
  opacity: 0.45;
  border-radius: 99px;
}
.m-after-fill {
  height: 100%;
  background: var(--success);
  border-radius: 99px;
  transition: width 0.5s var(--ease);
}
.m-foot {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 9.5px;
  color: var(--text-3);
}
.delta.up {
  color: var(--success);
}
.delta.down {
  color: var(--success);
}
.curve {
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}
.review {
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}
.review-title {
  font-size: 11.5px;
  color: var(--text-2);
  margin-bottom: 8px;
  font-weight: 500;
}
.stars {
  display: flex;
  align-items: center;
  gap: 3px;
}
.stars button {
  padding: 1px;
}
.star-text {
  font-size: 11px;
  color: var(--text-3);
  margin-left: 5px;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 9px 0;
}
.rt {
  font-size: 10px;
  color: var(--text-3);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 7px;
}
.rt:hover {
  color: var(--text-2);
  border-color: var(--border-strong);
}
.rt.on {
  color: var(--primary);
  border-color: var(--primary-soft-2);
  background: var(--primary-soft);
}
.note {
  height: 56px;
  font-size: 11.5px;
  padding: 7px 9px;
}
.submit {
  width: 100%;
  margin-top: 8px;
}
@media (max-width: 1180px) {
  .body {
    grid-template-columns: minmax(0, 1fr) 280px;
  }
  .head-text {
    display: none;
  }
}
</style>
