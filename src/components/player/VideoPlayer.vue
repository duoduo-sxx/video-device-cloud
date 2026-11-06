<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Maximize2, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-vue-next'
import DemoCanvas from './DemoCanvas.vue'
import { formatDuration, formatTimecode } from '@/composables/useFormat'

const props = withDefaults(
  defineProps<{ name: string; duration: number; seed?: number; fps?: number; autoplay?: boolean; compact?: boolean }>(),
  { seed: 7, fps: 25, autoplay: false, compact: false }
)

const time = ref(0)
const playing = ref(props.autoplay)
const rate = ref(1)
const muted = ref(false)
const root = ref<HTMLElement | null>(null)
const dragging = ref(false)
let raf = 0
let last = 0

const pct = computed(() => (props.duration ? Math.min(100, (time.value / props.duration) * 100) : 0))

function loop(ts: number) {
  if (!last) last = ts
  const dt = (ts - last) / 1000
  last = ts
  if (playing.value && !dragging.value) {
    time.value += dt * rate.value
    if (time.value >= props.duration) {
      time.value = 0
    }
  }
  raf = requestAnimationFrame(loop)
}

function toggle() {
  playing.value = !playing.value
}

function seekFromEvent(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  time.value = ratio * props.duration
}

function startDrag(e: MouseEvent) {
  dragging.value = true
  seekFromEvent(e)
  const move = (ev: MouseEvent) => seekFromEvent(ev)
  const up = () => {
    dragging.value = false
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

function toggleFullscreen() {
  const el = root.value
  if (!el) return
  if (document.fullscreenElement) document.exitFullscreen()
  else el.requestFullscreen?.()
}

function onKey(e: KeyboardEvent) {
  if (e.key === ' ') {
    e.preventDefault()
    toggle()
  }
  if (e.key === 'ArrowRight') time.value = Math.min(props.duration, time.value + 1 / props.fps)
  if (e.key === 'ArrowLeft') time.value = Math.max(0, time.value - 1 / props.fps)
}

onMounted(() => {
  raf = requestAnimationFrame(loop)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('keydown', onKey)
})
watch(
  () => props.duration,
  () => {
    time.value = 0
  }
)
</script>

<template>
  <div ref="root" class="player" :class="{ compact }">
    <div class="stage" @click="toggle">
      <DemoCanvas :time="time" :seed="seed" />
      <div class="stage-top">
        <span class="chip mono">{{ formatTimecode(time, fps) }}</span>
        <span class="chip">{{ name }}</span>
      </div>
      <button v-if="!playing" class="big-play" aria-label="播放">
        <Play :size="26" fill="currentColor" />
      </button>
      <div class="vignette" />
    </div>

    <div class="controls">
      <div class="track" @mousedown.prevent="startDrag">
        <div class="buffered" />
        <div class="fill" :style="{ width: pct + '%' }" />
        <div class="thumb" :style="{ left: pct + '%' }" />
      </div>
      <div class="bar">
        <div class="row gap-8">
          <button class="ctl" :aria-label="playing ? '暂停' : '播放'" @click="toggle">
            <Pause v-if="playing" :size="16" />
            <Play v-else :size="16" />
          </button>
          <button class="ctl" aria-label="回到开头" @click="time = 0">
            <RotateCcw :size="14" />
          </button>
          <span class="tc mono">{{ formatDuration(time) }} <i>/</i> {{ formatDuration(duration) }}</span>
        </div>
        <div class="row gap-8">
          <button class="ctl" :aria-label="muted ? '取消静音' : '静音'" @click="muted = !muted">
            <VolumeX v-if="muted" :size="15" />
            <Volume2 v-else :size="15" />
          </button>
          <button class="rate" @click="rate = rate >= 2 ? 0.5 : rate * 2">{{ rate }}x</button>
          <button class="ctl" aria-label="全屏" @click="toggleFullscreen">
            <Maximize2 :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player {
  background: #05060c;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}
.stage {
  position: relative;
  aspect-ratio: 16 / 9;
  cursor: pointer;
}
.stage-top {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 2;
  pointer-events: none;
}
.chip {
  font-size: 10.5px;
  color: rgba(232, 236, 244, 0.82);
  background: rgba(8, 11, 18, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2px 7px;
  border-radius: 4px;
  backdrop-filter: blur(6px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}
.big-play {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(10, 14, 22, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #fff;
  display: grid;
  place-items: center;
  backdrop-filter: blur(4px);
  z-index: 2;
  transition: transform 0.16s var(--ease), background 0.16s;
}
.big-play:hover {
  transform: scale(1.05);
  background: rgba(20, 28, 44, 0.78);
}
.vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.45), transparent 28%);
}
.controls {
  padding: 0 12px 10px;
  background: #05060c;
}
.track {
  position: relative;
  height: 4px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 99px;
  cursor: pointer;
  margin-bottom: 6px;
}
.track::before {
  content: '';
  position: absolute;
  inset: -8px 0;
}
.buffered {
  position: absolute;
  inset: 0;
  width: 72%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 99px;
}
.fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: var(--primary);
  border-radius: 99px;
}
.thumb {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 3px rgba(79, 124, 255, 0.28);
  opacity: 0;
  transition: opacity 0.12s;
}
.player:hover .thumb {
  opacity: 1;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ctl {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 5px;
  color: rgba(232, 236, 244, 0.78);
  transition: background 0.12s, color 0.12s;
}
.ctl:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.tc {
  font-size: 11.5px;
  color: rgba(232, 236, 244, 0.6);
  margin-left: 4px;
}
.tc i {
  font-style: normal;
  opacity: 0.4;
  margin: 0 2px;
}
.rate {
  font-size: 11px;
  color: rgba(232, 236, 244, 0.7);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.rate:hover {
  background: rgba(255, 255, 255, 0.08);
}
</style>
