import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { Defect } from '../types'
import { SEVERITY_META } from '../lib/constants'
import { timecode } from '../lib/format'

const RULER = 22
const VIDEO = 44
const WAVE = 58
const DEFECT = 22
const SUB = 16
const HEIGHT = RULER + VIDEO + WAVE + DEFECT + SUB

export function Timeline({
  duration,
  time,
  defects,
  seed,
  onSeek,
  selectedId,
  onSelectDefect,
  showSubtitle = true,
}: {
  duration: number
  time: number
  defects: Defect[]
  seed: number
  onSeek: (t: number) => void
  selectedId?: string
  onSelectDefect?: (id: string) => void
  showSubtitle?: boolean
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [width, setWidth] = useState(800)
  const [view, setView] = useState(() => Math.min(duration, 300))
  const [viewStart, setViewStart] = useState(0)
  const [hover, setHover] = useState<{ x: number; y: number; defect: Defect } | null>(null)
  const dragging = useRef(false)

  const peaks = useMemo(() => {
    const n = 900
    return Array.from({ length: n }).map((_, i) => {
      const a = Math.sin(i * 0.09 + seed) * 0.34
      const b = Math.sin(i * 0.031 + seed * 2.1) * 0.26
      const c = Math.sin(i * 0.53 + seed * 0.6) * 0.12
      return Math.min(1, Math.abs(a + b + c) * (0.6 + 0.4 * Math.sin(i * 0.014 + seed)) + 0.1)
    })
  }, [seed])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (time < viewStart || time > viewStart + view) {
      setViewStart(Math.max(0, Math.min(duration - view, time - view * 0.4)))
    }
  }, [time, view, viewStart, duration])

  const xOf = useCallback((t: number) => ((t - viewStart) / view) * width, [viewStart, view, width])
  const tOf = useCallback((x: number) => viewStart + (x / width) * view, [viewStart, view, width])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = HEIGHT * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, HEIGHT)

    ctx.fillStyle = '#0A0F16'
    ctx.fillRect(0, 0, width, HEIGHT)

    const tickSteps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600]
    const targetTicks = Math.max(4, Math.floor(width / 110))
    const step = tickSteps.find((s) => view / s <= targetTicks) ?? 600

    ctx.font = '10px "JetBrains Mono", ui-monospace, monospace'
    const firstTick = Math.floor(viewStart / step) * step
    for (let t = firstTick; t <= viewStart + view; t += step) {
      const x = xOf(t)
      if (x < -20 || x > width + 20) continue
      ctx.strokeStyle = 'rgba(255,255,255,.1)'
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, HEIGHT)
      ctx.stroke()
      ctx.fillStyle = '#6E7D90'
      ctx.fillText(timecode(t), x + 3, 14)
    }

    const videoTop = RULER
    ctx.fillStyle = '#0D141D'
    ctx.fillRect(0, videoTop, width, VIDEO)
    const blockW = 26
    for (let x = 0; x < width; x += blockW) {
      const t = tOf(x)
      const v = Math.sin(t * 0.021 + seed) * 0.5 + 0.5
      const v2 = Math.sin(t * 0.11 + seed * 3) * 0.5 + 0.5
      const r = Math.floor(18 + v * 30)
      const g = Math.floor(30 + v * 34 + v2 * 12)
      const b = Math.floor(40 + v2 * 30)
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(x, videoTop + 2, blockW - 2, VIDEO - 4)
      ctx.fillStyle = 'rgba(255,255,255,.04)'
      ctx.fillRect(x, videoTop + 2, blockW - 2, 1)
    }

    const waveTop = RULER + VIDEO
    ctx.fillStyle = '#0B1119'
    ctx.fillRect(0, waveTop, width, WAVE)
    const mid = waveTop + WAVE / 2
    const barW = 3
    for (let x = 0; x < width; x += barW) {
      const t = tOf(x)
      const idx = Math.floor((t / Math.max(1, duration)) * peaks.length)
      const p = peaks[Math.max(0, Math.min(peaks.length - 1, idx))]
      const h = Math.max(1, p * (WAVE - 8))
      ctx.fillStyle = t <= time ? 'rgba(34,211,238,.75)' : 'rgba(110,125,144,.5)'
      ctx.fillRect(x, mid - h / 2, barW - 1, h)
    }

    const defTop = waveTop + WAVE
    ctx.fillStyle = '#0C1219'
    ctx.fillRect(0, defTop, width, DEFECT)
    defects.forEach((d) => {
      const x1 = Math.max(0, xOf(d.startSec))
      const x2 = Math.min(width, xOf(d.endSec))
      if (x2 < 0 || x1 > width) return
      const w = Math.max(4, x2 - x1)
      const color = SEVERITY_META[d.severity].color
      ctx.fillStyle = color
      ctx.globalAlpha = 0.75
      ctx.fillRect(x1, defTop + 4, w, DEFECT - 8)
      ctx.globalAlpha = 1
      if (d.id === selectedId) {
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 1.5
        ctx.strokeRect(x1 - 0.5, defTop + 3.5, w + 1, DEFECT - 7)
      }
    })

    if (showSubtitle) {
      const subTop = defTop + DEFECT
      ctx.fillStyle = '#0A0F16'
      ctx.fillRect(0, subTop, width, SUB)
      for (let t = 4; t < duration; t += 7) {
        const x = xOf(t)
        const w = (4.2 / view) * width
        if (x + w < 0 || x > width) continue
        ctx.fillStyle = 'rgba(52,211,153,.35)'
        ctx.fillRect(x, subTop + 4, Math.max(2, w), 4)
      }
    }

    const px = xOf(time)
    if (px >= 0 && px <= width) {
      ctx.strokeStyle = '#22D3EE'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(px, 0)
      ctx.lineTo(px, HEIGHT)
      ctx.stroke()
      ctx.fillStyle = '#22D3EE'
      ctx.beginPath()
      ctx.moveTo(px - 5, 0)
      ctx.lineTo(px + 5, 0)
      ctx.lineTo(px, 7)
      ctx.closePath()
      ctx.fill()
    }
  }, [width, view, viewStart, duration, time, defects, selectedId, peaks, xOf, tOf, showSubtitle])

  const defectAt = (x: number): Defect | null => {
    const t = tOf(x)
    return (
      defects.find((d) => t >= d.startSec && t <= d.endSec) ??
      defects.find((d) => Math.abs(xOf(d.startSec) - x) < 4) ??
      null
    )
  }

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>, isDown?: boolean) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const defTop = RULER + VIDEO + WAVE
    if (y >= defTop && y <= defTop + DEFECT) {
      const d = defectAt(x)
      if (d) {
        setHover({ x, y, defect: d })
        if (isDown) {
          onSelectDefect?.(d.id)
          onSeek(d.startSec)
        }
        return
      }
    }
    setHover(null)
    if (isDown || dragging.current) {
      onSeek(Math.max(0, Math.min(duration, tOf(x))))
    }
  }

  return (
    <div className="select-none">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-3)]">
          <span className="mono text-[12px] text-[var(--text-2)]">{timecode(time)}</span>
          <span className="text-[var(--text-3)]">/</span>
          <span className="mono">{timecode(duration)}</span>
          <span className="ml-2 flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#F87171]" />致命</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#FB923C]" />严重</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#FBBF24]" />一般</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#60A5FA]" />提示</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="rounded p-1 text-[var(--text-3)] hover:bg-[var(--bg-3)] hover:text-[var(--text-1)]"
            onClick={() => {
              const next = Math.min(duration, view * 1.8)
              setView(next)
              setViewStart(Math.max(0, Math.min(duration - next, time - next / 2)))
            }}
          >
            <Minus size={13} />
          </button>
          <span className="mono w-[52px] text-center text-[11px] text-[var(--text-3)]">
            {view < 60 ? `${Math.round(view)}s` : `${Math.round(view / 60)}min`}
          </span>
          <button
            className="rounded p-1 text-[var(--text-3)] hover:bg-[var(--bg-3)] hover:text-[var(--text-1)]"
            onClick={() => {
              const next = Math.max(4, view / 1.8)
              setView(next)
              setViewStart(Math.max(0, Math.min(duration - next, time - next / 2)))
            }}
          >
            <Plus size={13} />
          </button>
          <button
            className="ml-1 rounded border border-[var(--border)] px-1.5 py-0.5 text-[11px] text-[var(--text-3)] hover:text-[var(--text-1)]"
            onClick={() => {
              setView(Math.min(duration, 300))
              setViewStart(Math.max(0, Math.min(duration - 300, time - 150)))
            }}
          >
            全片
          </button>
        </div>
      </div>
      <div ref={wrapRef} className="relative overflow-hidden rounded-lg border border-[var(--border)]">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: HEIGHT, display: 'block', cursor: 'crosshair' }}
          onPointerDown={(e) => {
            dragging.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            handlePointer(e, true)
          }}
          onPointerMove={(e) => handlePointer(e)}
          onPointerUp={() => {
            dragging.current = false
          }}
          onPointerLeave={() => {
            dragging.current = false
            setHover(null)
          }}
          onWheel={(e) => {
            e.preventDefault()
            const next = Math.max(4, Math.min(duration, view * (e.deltaY > 0 ? 1.15 : 0.87)))
            const rect = e.currentTarget.getBoundingClientRect()
            const anchor = tOf(e.clientX - rect.left)
            setView(next)
            setViewStart(Math.max(0, Math.min(duration - next, anchor - (anchor - viewStart) * (next / view))))
          }}
        />
        {hover && (
          <div
            className="pointer-events-none absolute z-20 max-w-[240px] rounded-md border border-[var(--border)] bg-[var(--bg-3)] px-2 py-1.5 text-[11px] shadow-layer"
            style={{ left: Math.min(hover.x + 10, width - 250), top: 26 }}
          >
            <div className="flex items-center gap-1.5 font-medium" style={{ color: SEVERITY_META[hover.defect.severity].color }}>
              {hover.defect.name}
              <span className="mono text-[10px] text-[var(--text-3)]">{hover.defect.code}</span>
            </div>
            <div className="mono mt-0.5 text-[var(--text-2)]">
              {timecode(hover.defect.startSec)} → {timecode(hover.defect.endSec)}
            </div>
            <div className="mt-0.5 text-[var(--text-3)]">
              {hover.defect.metricLabel} {hover.defect.metricValue} {hover.defect.unit}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
