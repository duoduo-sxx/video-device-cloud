<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{ time: number; degraded?: boolean; seed?: number; fps?: number }>(),
  { degraded: false, seed: 7, fps: 25 }
)

const host = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
let off: HTMLCanvasElement | null = null
let ro: ResizeObserver | null = null
let dpr = 1

interface Building {
  x: number
  w: number
  h: number
  lit: number
  tone: number
  cols: number
  rows: number
}

let buildings: Building[] = []

function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453
  return x - Math.floor(x)
}

function buildScene() {
  const rng = mulberry(props.seed * 977 + 13)
  buildings = []
  let x = -0.04
  while (x < 1.06) {
    const w = 0.022 + rng() * 0.055
    const h = 0.16 + rng() * 0.44
    buildings.push({
      x,
      w,
      h,
      lit: 0.2 + rng() * 0.45,
      tone: rng(),
      cols: Math.max(2, Math.round((w * 1200) / 13)),
      rows: Math.max(3, Math.round((h * 700) / 15))
    })
    x += w + 0.004 + rng() * 0.008
  }
}

function resize() {
  const el = host.value
  if (!el || !canvas.value) return
  const rect = el.getBoundingClientRect()
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.max(2, Math.round(rect.width * dpr))
  const h = Math.max(2, Math.round(rect.height * dpr))
  canvas.value.width = w
  canvas.value.height = h
  if (!off) off = document.createElement('canvas')
  off.width = Math.max(2, Math.round(w / 4))
  off.height = Math.max(2, Math.round(h / 4))
  draw()
}

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, lowDetail = false) {
  const horizon = h * 0.68

  const sky = ctx.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, '#05060f')
  sky.addColorStop(0.42, '#0d1330')
  sky.addColorStop(0.76, '#1d1c46')
  sky.addColorStop(1, '#3a2444')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  const glow = ctx.createRadialGradient(w * 0.62, horizon, 0, w * 0.62, horizon, w * 0.55)
  glow.addColorStop(0, 'rgba(255,138,74,0.24)')
  glow.addColorStop(0.45, 'rgba(198,84,96,0.1)')
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, horizon)

  for (let i = 0; i < 60; i++) {
    const sx = hash(i * 3.1) * w
    const sy = hash(i * 7.7) * horizon * 0.62
    const tw = 0.25 + 0.55 * Math.abs(Math.sin(t * 0.7 + hash(i) * 6.28))
    ctx.fillStyle = `rgba(210,225,255,${0.18 * tw})`
    ctx.fillRect(sx, sy, 1.2, 1.2)
  }

  for (let b = 0; b < buildings.length; b++) {
    const bd = buildings[b]
    const bx = bd.x * w
    const bw = bd.w * w
    const bh = bd.h * h
    const by = horizon - bh
    const base = 5 + bd.tone * 8
    ctx.fillStyle = `rgb(${base + 2},${base + 4},${base + 12})`
    ctx.fillRect(bx, by, bw, bh)

    if (lowDetail) continue

    const cw = bw / bd.cols
    const ch = bh / bd.rows
    for (let c = 0; c < bd.cols; c++) {
      for (let r = 0; r < bd.rows; r++) {
        const idx = b * 977 + c * 31 + r * 7
        const litP = hash(idx)
        if (litP > 0.44 + bd.lit * 0.2) continue
        const flick = 0.55 + 0.45 * Math.sin(t * 0.9 + hash(idx + 1) * 6.28)
        const warm = hash(idx + 2) > 0.28
        const alpha = (0.24 + litP * 0.5) * flick
        ctx.fillStyle = warm ? `rgba(255,206,138,${alpha})` : `rgba(150,205,255,${alpha})`
        ctx.fillRect(bx + c * cw + cw * 0.24, by + r * ch + ch * 0.26, Math.max(1, cw * 0.44), Math.max(1, ch * 0.4))
      }
    }

    if (hash(b * 5.3) > 0.86) {
      const rx = bx + bw * 0.5
      ctx.fillStyle = 'rgba(255,72,72,0.85)'
      ctx.beginPath()
      ctx.arc(rx, by - 2, 1.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(255,60,60,${0.18 + 0.16 * Math.sin(t * 2.2 + b)})`
      ctx.beginPath()
      ctx.arc(rx, by - 2, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const road = ctx.createLinearGradient(0, horizon, 0, h)
  road.addColorStop(0, '#0a0c16')
  road.addColorStop(1, '#04050a')
  ctx.fillStyle = road
  ctx.fillRect(0, horizon, w, h - horizon)

  ctx.strokeStyle = 'rgba(120,140,190,0.16)'
  ctx.lineWidth = Math.max(1, h * 0.0016)
  ctx.beginPath()
  ctx.moveTo(0, horizon + (h - horizon) * 0.34)
  ctx.lineTo(w, horizon + (h - horizon) * 0.34)
  ctx.stroke()

  const laneY = horizon + (h - horizon) * 0.62
  for (let i = 0; i < 14; i++) {
    const speed = 0.055 + hash(i * 2.7) * 0.11
    const dir = i % 2 === 0 ? 1 : -1
    let px = ((t * speed * dir + hash(i * 1.3)) % 1.3 + 1.3) % 1.3
    px = px * 1.3 - 0.15
    const x = px * w
    const y = laneY + (hash(i * 4.4) - 0.5) * (h - horizon) * 0.28
    const head = dir > 0
    const color = head ? '255,244,214' : '255,74,86'
    const tail = Math.max(8, w * 0.035)
    const g = ctx.createLinearGradient(x - (dir > 0 ? tail : 0), y, x + (dir > 0 ? 0 : tail), y)
    g.addColorStop(0, `rgba(${color},0)`)
    g.addColorStop(1, `rgba(${color},0.55)`)
    ctx.fillStyle = g
    ctx.fillRect(dir > 0 ? x - tail : x, y - h * 0.0016, tail, Math.max(1.4, h * 0.0032))
    ctx.fillStyle = `rgba(${color},0.95)`
    ctx.beginPath()
    ctx.arc(x, y, Math.max(1.4, h * 0.0035), 0, Math.PI * 2)
    ctx.fill()
  }

  const lampX = w * 0.235
  const lampY = h * 0.42
  const halo = ctx.createRadialGradient(lampX, lampY, 0, lampX, lampY, w * 0.2)
  halo.addColorStop(0, 'rgba(255,208,150,0.16)')
  halo.addColorStop(1, 'rgba(255,208,150,0)')
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, w, h)

  const vig = ctx.createRadialGradient(w * 0.5, h * 0.48, h * 0.2, w * 0.5, h * 0.48, h * 0.92)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)
}

function draw() {
  const cv = canvas.value
  if (!cv) return
  const ctx = cv.getContext('2d')
  if (!ctx) return
  const w = cv.width
  const h = cv.height

  if (props.degraded && off) {
    const octx = off.getContext('2d')
    if (octx) {
      paint(octx, off.width, off.height, props.time, true)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'low'
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(off, 0, 0, w, h)
      return
    }
  }
  paint(ctx, w, h, props.time, false)
}

onMounted(() => {
  buildScene()
  resize()
  ro = new ResizeObserver(resize)
  if (host.value) ro.observe(host.value)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})

watch(
  () => [props.time, props.degraded, props.seed],
  () => draw()
)
watch(
  () => props.seed,
  () => {
    buildScene()
    draw()
  }
)
</script>

<template>
  <div ref="host" class="demo-stage">
    <canvas ref="canvas" />
  </div>
</template>

<style scoped>
.demo-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #05060f;
}
canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
