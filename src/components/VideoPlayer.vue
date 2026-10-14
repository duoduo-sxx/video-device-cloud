<script setup lang="ts">
/**
 * 模拟视频播放器
 * 本项目不接入真实流媒体，使用 Canvas 逐帧绘制模拟监控画面：
 * 动态噪点 + 移动目标框 + 扫描线 + OSD 水印，交互与真实播放器保持一致。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { copyText, downloadBlob } from '@/utils/download'

interface Props {
  channelId?: string
  label?: string
  online?: boolean
  /** 画面占比标识，如 1080P */
  resolution?: string
  codec?: string
  bitrate?: number
  height?: number
  /** 是否显示底部工具栏 */
  controls?: boolean
  /** 是否显示左上角通道名 */
  osd?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  channelId: 'CH000001',
  label: '未命名通道',
  online: true,
  resolution: '1920×1080',
  codec: 'H.265',
  bitrate: 4096,
  height: 180,
  controls: true,
  osd: true
})

const emit = defineEmits<{ (e: 'fullscreen'): void }>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const wrapRef = ref<HTMLElement | null>(null)
const playing = ref(true)
const fps = ref(15)
const currentTime = ref(new Date())
const streamType = ref<'main' | 'sub' | 'third'>('main')

let raf = 0
let lastDraw = 0
let observer: ResizeObserver | null = null

interface Target {
  x: number
  y: number
  vx: number
  w: number
  h: number
  label: string
  conf: number
}
let targets: Target[] = []
let noiseSeed = 1

function seedTargets() {
  const seed = (props.channelId || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rnd = mulberry(seed)
  const count = props.online ? 1 + Math.floor(rnd() * 3) : 0
  targets = Array.from({ length: count }, (_, i) => {
    const h = 34 + rnd() * 26
    return {
      x: 40 + rnd() * 600,
      y: 60 + rnd() * 80,
      vx: (rnd() > 0.5 ? 1 : -1) * (0.25 + rnd() * 0.7),
      w: h * 0.42,
      h,
      label: rnd() > 0.35 ? 'PERSON' : 'VEHICLE',
      conf: Number((0.72 + rnd() * 0.27).toFixed(2))
    }
  })
  noiseSeed = seed
}

function mulberry(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function resize() {
  const canvas = canvasRef.value
  const wrap = wrapRef.value
  if (!canvas || !wrap) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const w = wrap.clientWidth
  const h = wrap.clientHeight
  canvas.width = Math.max(1, Math.floor(w * dpr))
  canvas.height = Math.max(1, Math.floor(h * dpr))
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.clientWidth
  const h = canvas.clientHeight

  // 背景
  ctx.fillStyle = props.online ? '#161a20' : '#0d0f12'
  ctx.fillRect(0, 0, w, h)

  if (props.online) {
    drawScene(ctx, w, h)
  } else {
    drawNoSignal(ctx, w, h)
  }

  drawOsd(ctx, w, h)
}

function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const horizon = h * 0.5
  // 远景建筑
  ctx.fillStyle = '#1e242c'
  for (let i = 0; i < 5; i++) {
    const bw = w * (0.12 + ((noiseSeed + i * 37) % 10) / 60)
    const bh = h * (0.18 + ((noiseSeed + i * 53) % 12) / 60)
    ctx.fillRect((i * w) / 5 + 6, horizon - bh, bw, bh)
  }
  // 地面
  ctx.fillStyle = '#12161b'
  ctx.beginPath()
  ctx.moveTo(0, horizon)
  ctx.lineTo(w, horizon)
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fill()

  // 地面透视线
  ctx.strokeStyle = 'rgba(120,140,160,0.16)'
  ctx.lineWidth = 1
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath()
    ctx.moveTo(w / 2 + i * (w / 12), horizon)
    ctx.lineTo(w / 2 + i * (w / 3), h)
    ctx.stroke()
  }

  // 移动目标 + 识别框
  const scale = w / 720
  targets.forEach((t) => {
    t.x += t.vx
    if (t.x < 20) {
      t.x = 20
      t.vx = Math.abs(t.vx)
    }
    if (t.x > 700 - t.w) {
      t.x = 700 - t.w
      t.vx = -Math.abs(t.vx)
    }
    const x = t.x * scale
    const y = horizon + (t.y / 200) * (h - horizon) * 0.5
    const bw = t.w * scale
    const bh = t.h * scale

    // 目标本体
    ctx.fillStyle = '#8b93a0'
    ctx.beginPath()
    ctx.ellipse(x + bw / 2, y + bh * 0.12, bw * 0.42, bh * 0.12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(x + bw * 0.12, y + bh * 0.2, bw * 0.76, bh * 0.5)
    ctx.fillRect(x + bw * 0.24, y + bh * 0.7, bw * 0.18, bh * 0.3)
    ctx.fillRect(x + bw * 0.58, y + bh * 0.7, bw * 0.18, bh * 0.3)

    // 识别框
    ctx.strokeStyle = '#3ddc84'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, bw, bh)
    ctx.fillStyle = 'rgba(61,220,132,0.9)'
    ctx.font = '9px ui-monospace, monospace'
    ctx.fillText(`${t.label} ${t.conf}`, x, y - 3)
  })
}

function drawNoSignal(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = 'rgba(255,255,255,0.035)'
  for (let i = 0; i < 240; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    ctx.fillRect(x, y, 2, 2)
  }
  ctx.fillStyle = 'rgba(220,220,220,0.75)'
  ctx.font = '13px -apple-system, PingFang SC, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('无视频信号', w / 2, h / 2 - 6)
  ctx.font = '11px ui-monospace, monospace'
  ctx.fillStyle = 'rgba(180,180,180,0.7)'
  ctx.fillText('DEVICE OFFLINE', w / 2, h / 2 + 12)
  ctx.textAlign = 'left'
}

function drawOsd(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 扫描线
  ctx.strokeStyle = 'rgba(255,255,255,0.028)'
  ctx.lineWidth = 1
  for (let y = 0; y < h; y += 3) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  const time = currentTime.value
  const timeStr = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())} ${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`

  if (props.osd) {
    // 左上通道名
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    const label = `${props.label}`
    ctx.font = '10px ui-monospace, monospace'
    const lw = ctx.measureText(label).width + 12
    ctx.fillRect(6, 6, lw, 16)
    ctx.fillStyle = '#e8e8e8'
    ctx.fillText(label, 12, 18)

    // 右上时间
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.font = '10px ui-monospace, monospace'
    const tw = ctx.measureText(timeStr).width + 12
    ctx.fillRect(w - tw - 6, 6, tw, 16)
    ctx.fillStyle = '#e8e8e8'
    ctx.fillText(timeStr, w - tw, 18)
  }

  // 左下码流信息
  ctx.fillStyle = 'rgba(232,232,232,0.72)'
  ctx.font = '9px ui-monospace, monospace'
  const streamName = streamType.value === 'main' ? '主码流' : streamType.value === 'sub' ? '子码流' : '第三码流'
  const bitrate = streamType.value === 'main' ? props.bitrate : streamType.value === 'sub' ? Math.round(props.bitrate / 4) : Math.round(props.bitrate / 8)
  ctx.fillText(`${props.resolution} ${props.codec} ${bitrate}Kbps ${streamName}`, 8, h - 7)

  // 右下录制点
  if (playing.value && props.online) {
    ctx.fillStyle = '#ff4d4f'
    ctx.beginPath()
    ctx.arc(w - 12, h - 11, 3.4, 0, Math.PI * 2)
    ctx.fill()
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function loop(t: number) {
  raf = requestAnimationFrame(loop)
  const interval = 1000 / fps.value
  if (t - lastDraw < interval) return
  lastDraw = t
  if (playing.value && props.online) currentTime.value = new Date()
  draw()
}

/* ------- 交互 ------- */
function togglePlay() {
  playing.value = !playing.value
  if (!playing.value) ElMessage.info('已暂停画面')
}

function cycleSpeed() {
  const speeds = [15, 8, 25]
  const idx = speeds.indexOf(fps.value)
  fps.value = speeds[(idx + 1) % speeds.length]
  ElMessage.success(`播放帧率切换为 ${fps.value} fps`)
}

function switchStream() {
  const order: ('main' | 'sub' | 'third')[] = ['main', 'sub', 'third']
  const idx = order.indexOf(streamType.value)
  streamType.value = order[(idx + 1) % order.length]
}

function snapshot() {
  const canvas = canvasRef.value
  if (!canvas) return
  if (!props.online) {
    ElMessage.warning('通道离线，无法抓图')
    return
  }
  canvas.toBlob((blob) => {
    if (!blob) return
    const name = `${props.channelId}_${Date.now()}.png`
    downloadBlob(blob, name, 'image/png')
    ElMessage.success(`已抓图并保存：${name}`)
  })
}

function toggleFullscreen() {
  const el = wrapRef.value
  if (!el) return
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    el.requestFullscreen?.().catch(() => ElMessage.warning('当前环境不支持全屏'))
  }
  emit('fullscreen')
}

function copyStreamUrl() {
  copyText(`rtsp://media.videocloud.com:554/live/${props.channelId}_${streamType.value}?token=mock`, '已复制模拟流地址')
}

const bitrateNow = computed(() => {
  const base = streamType.value === 'main' ? props.bitrate! : streamType.value === 'sub' ? props.bitrate! / 4 : props.bitrate! / 8
  return Math.round(base + (Math.random() * 120 - 60))
})

onMounted(() => {
  seedTargets()
  resize()
  observer = new ResizeObserver(() => resize())
  if (wrapRef.value) observer.observe(wrapRef.value)
  raf = requestAnimationFrame(loop)
})

watch(
  () => props.channelId,
  () => {
    seedTargets()
    currentTime.value = new Date()
  }
)

watch(
  () => props.online,
  () => {
    seedTargets()
  }
)

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
})
</script>

<template>
  <div ref="wrapRef" class="vp" :style="{ height: height + 'px' }">
    <canvas ref="canvasRef" class="vp__canvas" />
    <div v-if="controls" class="vp__bar">
      <el-icon class="vp__btn" @click="togglePlay"><component :is="playing ? 'VideoPause' : 'VideoPlay'" /></el-icon>
      <el-icon class="vp__btn" @click="cycleSpeed"><component :is="'Refresh'" /></el-icon>
      <span class="vp__speed">{{ fps }}fps</span>
      <span class="vp__divider" />
      <el-icon class="vp__btn" @click="switchStream"><component :is="'Switch'" /></el-icon>
      <span class="vp__speed">{{ streamType === 'main' ? '主码流' : streamType === 'sub' ? '子码流' : '第三码流' }}</span>
      <span class="vp__spacer" />
      <span v-if="online" class="vp__bitrate">{{ bitrateNow }} Kbps</span>
      <span v-else class="vp__offline">离线</span>
      <el-tooltip content="抓图" placement="top">
        <el-icon class="vp__btn" @click="snapshot"><component :is="'Camera'" /></el-icon>
      </el-tooltip>
      <el-tooltip content="复制流地址" placement="top">
        <el-icon class="vp__btn" @click="copyStreamUrl"><component :is="'Link'" /></el-icon>
      </el-tooltip>
      <el-tooltip content="全屏" placement="top">
        <el-icon class="vp__btn" @click="toggleFullscreen"><component :is="'FullScreen'" /></el-icon>
      </el-tooltip>
    </div>
  </div>
</template>

<style scoped>
.vp {
  position: relative;
  width: 100%;
  background: #0b0d10;
  border-radius: 6px;
  overflow: hidden;
}

.vp__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.vp__bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 28px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.15));
  color: #e8e8e8;
  font-size: 11px;
  opacity: 0;
  transition: opacity 0.2s;
}

.vp:hover .vp__bar {
  opacity: 1;
}

.vp__btn {
  cursor: pointer;
  font-size: 13px;
}

.vp__btn:hover {
  color: #fff;
}

.vp__speed {
  font-size: 10px;
  color: rgba(232, 232, 232, 0.75);
}

.vp__divider {
  width: 1px;
  height: 12px;
  background: rgba(232, 232, 232, 0.25);
}

.vp__spacer {
  flex: 1;
}

.vp__bitrate {
  font-size: 10px;
  color: #3ddc84;
  font-variant-numeric: tabular-nums;
}

.vp__offline {
  font-size: 10px;
  color: #ff7875;
}
</style>
