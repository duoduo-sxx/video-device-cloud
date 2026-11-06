import { useEffect, useMemo, useRef } from 'react'
import { timecode } from '../lib/format'
import { cn } from '../lib/cn'

const PALETTES = [
  { sky: '#0b2230', far: '#123542', mid: '#17404a', near: '#0a1c24', sun: '#c9a26a' },
  { sky: '#131b2c', far: '#1d2942', mid: '#26344f', near: '#0d1420', sun: '#9fb6d4' },
  { sky: '#221a20', far: '#33262c', mid: '#3f3036', near: '#1a1316', sun: '#d18f6a' },
  { sky: '#0e2420', far: '#163a30', mid: '#1d4638', near: '#0a1c18', sun: '#a9c98a' },
]

export function MockVideoCanvas({
  seed,
  time,
  duration,
  mode = 'after',
  showSafeArea = true,
  className,
}: {
  seed: number
  time: number
  duration: number
  mode?: 'before' | 'after'
  showSafeArea?: boolean
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = 640
    const H = 360
    const palette = PALETTES[(seed + Math.floor(time / 14)) % PALETTES.length]
    const progress = Math.min(1, time / Math.max(1, duration))
    const sceneT = (time % 14) / 14

    ctx.clearRect(0, 0, W, H)
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, palette.sky)
    grad.addColorStop(1, palette.near)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    const horizon = 190 + Math.sin(seed + sceneT * 0.4) * 14
    const sunX = 110 + ((seed * 37) % 420) + sceneT * 8
    ctx.beginPath()
    ctx.arc(sunX, horizon - 46, 20 + (seed % 8), 0, Math.PI * 2)
    ctx.fillStyle = palette.sun
    ctx.globalAlpha = 0.75
    ctx.fill()
    ctx.globalAlpha = 1

    const ridge = (offset: number, amp: number, color: string, alpha: number) => {
      ctx.beginPath()
      ctx.moveTo(0, H)
      for (let x = 0; x <= W; x += 16) {
        const y =
          horizon +
          offset +
          Math.sin((x + seed * 13 + sceneT * 26) * 0.012) * amp +
          Math.sin((x + seed * 5) * 0.031) * (amp * 0.42)
        ctx.lineTo(x, y)
      }
      ctx.lineTo(W, H)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.globalAlpha = alpha
      ctx.fill()
      ctx.globalAlpha = 1
    }
    ridge(-6, 16, palette.far, 0.85)
    ridge(24, 12, palette.mid, 0.9)
    ridge(66, 8, palette.near, 1)

    for (let i = 0; i < 5; i++) {
      const bw = 26 + ((seed + i * 17) % 46)
      const bh = 10 + ((seed + i * 11) % 26)
      const bx = ((seed * 23 + i * 97 + sceneT * 40) % (W + 80)) - 40
      ctx.fillStyle = palette.near
      ctx.globalAlpha = 0.55
      ctx.fillRect(bx, horizon + 70 - bh, bw, bh)
      ctx.globalAlpha = 1
    }

    ctx.strokeStyle = 'rgba(255,255,255,.055)'
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }

    if (mode === 'before') {
      const rnd = (n: number) => {
        const x = Math.sin(seed * 12.9898 + n * 78.233 + Math.floor(time * 25) * 3.71) * 43758.5453
        return x - Math.floor(x)
      }
      for (let i = 0; i < 260; i++) {
        const x = rnd(i) * W
        const y = rnd(i + 99) * H
        const a = 0.03 + rnd(i + 7) * 0.12
        ctx.fillStyle = `rgba(${180 + Math.floor(rnd(i) * 60)},${180 + Math.floor(rnd(i + 1) * 60)},${180 + Math.floor(rnd(i + 2) * 60)},${a})`
        ctx.fillRect(x, y, 1.4, 1.4)
      }
      for (let i = 0; i < 14; i++) {
        const bx = Math.floor(rnd(i + 31) * (W / 32)) * 32
        const by = Math.floor(rnd(i + 61) * (H / 32)) * 32
        ctx.fillStyle = `rgba(${140 + Math.floor(rnd(i) * 90)},${120 + Math.floor(rnd(i + 3) * 70)},${110 + Math.floor(rnd(i + 9) * 60)},0.16)`
        ctx.fillRect(bx, by, 32, 32)
      }
      const cast = ctx.createLinearGradient(0, 0, W, 0)
      cast.addColorStop(0, 'rgba(90,40,20,.16)')
      cast.addColorStop(1, 'rgba(20,40,90,.12)')
      ctx.fillStyle = cast
      ctx.fillRect(0, 0, W, H)
    } else {
      ctx.fillStyle = 'rgba(34,211,238,.05)'
      ctx.fillRect(0, 0, W, H)
    }

    ctx.fillStyle = 'rgba(0,0,0,.22)'
    for (let y = 0; y < H; y += 3) {
      ctx.fillRect(0, y, W, 1)
    }
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.92)
    vig.addColorStop(0, 'rgba(0,0,0,0)')
    vig.addColorStop(1, 'rgba(0,0,0,.45)')
    ctx.fillStyle = vig
    ctx.fillRect(0, 0, W, H)

    if (showSafeArea) {
      ctx.setLineDash([5, 4])
      ctx.strokeStyle = 'rgba(255,255,255,.22)'
      ctx.lineWidth = 1
      ctx.strokeRect(W * 0.05, H * 0.05, W * 0.9, H * 0.9)
      ctx.strokeRect(W * 0.1, H * 0.1, W * 0.8, H * 0.8)
      ctx.setLineDash([])
    }

    const frame = Math.floor(time * 25)
    ctx.font = '600 14px "JetBrains Mono", ui-monospace, monospace'
    ctx.fillStyle = 'rgba(230,237,245,.9)'
    ctx.fillText(timecode(time), W - 108, H - 14)
    ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace'
    ctx.fillStyle = 'rgba(160,176,196,.85)'
    ctx.fillText(`F ${String(frame).padStart(6, '0')}`, 14, 22)
    ctx.fillText(`${mode === 'before' ? 'SOURCE' : 'REPAIRED'} · TC 25p`, 14, H - 14)
    ctx.fillStyle = 'rgba(34,211,238,.9)'
    ctx.fillRect(14, 30, 46, 2)
    ctx.fillRect(14, 30, 46 * progress, 3)
  }, [seed, time, duration, mode, showSafeArea])

  return <canvas ref={ref} width={640} height={360} className={cn('h-full w-full bg-black', className)} />
}

export function Waveform({
  seed,
  duration,
  currentTime,
  height = 96,
  progressColor = 'var(--primary)',
  dim = false,
  selection,
  className,
}: {
  seed: number
  duration: number
  currentTime?: number
  height?: number
  progressColor?: string
  dim?: boolean
  selection?: [number, number] | null
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const peaks = useMemo(() => {
    const n = 420
    const arr: number[] = []
    for (let i = 0; i < n; i++) {
      const a = Math.sin(i * 0.11 + seed) * 0.32
      const b = Math.sin(i * 0.037 + seed * 2.3) * 0.28
      const c = Math.sin(i * 0.61 + seed * 0.7) * 0.14
      const envelope = 0.55 + 0.45 * Math.sin(i * 0.019 + seed)
      arr.push(Math.min(1, Math.abs(a + b + c) * envelope + 0.12))
    }
    return arr
  }, [seed])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const W = Math.max(1, Math.floor(rect.width))
    const H = height
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const barW = W / peaks.length
    const mid = H / 2
    const playedX = currentTime !== undefined && duration > 0 ? (currentTime / duration) * W : W

    if (selection) {
      const x1 = (selection[0] / Math.max(1, duration)) * W
      const x2 = (selection[1] / Math.max(1, duration)) * W
      ctx.fillStyle = 'rgba(34,211,238,.10)'
      ctx.fillRect(x1, 0, x2 - x1, H)
    }

    peaks.forEach((p, i) => {
      const x = i * barW
      const h = Math.max(1.5, p * (H - 8))
      const played = x <= playedX
      ctx.fillStyle = played ? progressColor : dim ? 'rgba(110,125,144,.35)' : 'rgba(110,125,144,.55)'
      ctx.globalAlpha = played ? 0.9 : 0.75
      ctx.fillRect(x, mid - h / 2, Math.max(1, barW - 0.8), h)
    })
    ctx.globalAlpha = 1

    ctx.strokeStyle = 'rgba(255,255,255,.08)'
    ctx.beginPath()
    ctx.moveTo(0, mid)
    ctx.lineTo(W, mid)
    ctx.stroke()
  }, [peaks, height, currentTime, duration, progressColor, dim, selection])

  return <canvas ref={ref} style={{ height, width: '100%', display: 'block' }} className={className} />
}
