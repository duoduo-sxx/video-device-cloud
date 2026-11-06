import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, FileQuestion, Loader2 } from 'lucide-react'
import { cn, clamp } from '@/utils/misc'
import { Button } from '@/components/ui/primitives'

export function Panel({
  title,
  extra,
  children,
  className,
  bodyClass,
  noPad,
}: {
  title?: React.ReactNode
  extra?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClass?: string
  noPad?: boolean
}) {
  return (
    <section className={cn('panel flex flex-col min-h-0 overflow-hidden', className)}>
      {title && (
        <header className="panel-hd shrink-0">
          <div className="panel-hd-title">
            <span className="panel-hd-bar" />
            {title}
          </div>
          {extra}
        </header>
      )}
      <div className={cn('flex-1 min-h-0', !noPad && !bodyClass && 'p-4', bodyClass)}>{children}</div>
    </section>
  )
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4 shrink-0">
      <div className="min-w-0">
        <h1 className="text-xl font-medium text-ink tracking-tight">{title}</h1>
        {sub && <p className="text-xs text-ink-soft mt-1">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

export function Skeleton({ className, lines = 1 }: { className?: string; lines?: number }) {
  if (lines === 1) return <div className={cn('skeleton h-4', className)} />
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn('skeleton h-4', className)} style={{ width: `${100 - i * 12}%` }} />
      ))}
    </div>
  )
}

export function EmptyState({
  title = '暂无数据',
  desc,
  action,
  icon,
}: {
  title?: string
  desc?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="text-ink-mute opacity-40">{icon ?? <FileQuestion size={56} strokeWidth={1.2} />}</div>
      <div className="text-center">
        <div className="text-sm text-ink">{title}</div>
        {desc && <div className="text-xs text-ink-mute mt-1">{desc}</div>}
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ desc = '数据加载失败，请检查后重试。', onRetry }: { desc?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <AlertCircle size={48} strokeWidth={1.2} style={{ color: 'var(--danger)' }} className="opacity-70" />
      <div className="text-center">
        <div className="text-sm text-ink">加载失败</div>
        <div className="text-xs text-ink-mute mt-1">{desc}</div>
      </div>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          重试
        </Button>
      )}
    </div>
  )
}

export function LoadingBlock({ label = '正在加载' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-xs text-ink-mute">
      <Loader2 size={14} className="animate-spin" />
      {label}
    </div>
  )
}

export function StatusDot({ color, pulse, size = 8 }: { color: string; pulse?: boolean; size?: number }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full" style={{ background: color }} />
      <span
        className="absolute rounded-full"
        style={{ background: color, opacity: 0.18, inset: -3 }}
      />
      {pulse && <span className="absolute inset-0 rounded-full animate-softPulse" style={{ background: color, opacity: 0.5 }} />}
    </span>
  )
}

export function NumberTicker({
  value,
  digits = 0,
  prefix,
  suffix,
  className,
  duration = 800,
}: {
  value: number
  digits?: number
  prefix?: string
  suffix?: string
  className?: string
  duration?: number
}) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const raf = useRef<number>()

  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    const tick = (t: number) => {
      const p = clamp((t - start) / duration, 0, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(from + (value - from) * eased)
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      fromRef.current = value
    }
  }, [value, duration])

  return (
    <span className={cn('num tabular-nums', className)}>
      {prefix}
      {display.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}
      {suffix}
    </span>
  )
}

export function Countdown({ to, onEnd, className }: { to: number; onEnd?: () => void; className?: string }) {
  const [left, setLeft] = useState(Math.max(0, Math.ceil((to - Date.now()) / 1000)))
  const endRef = useRef(onEnd)
  endRef.current = onEnd
  useEffect(() => {
    setLeft(Math.max(0, Math.ceil((to - Date.now()) / 1000)))
    const timer = window.setInterval(() => {
      const v = Math.max(0, Math.ceil((to - Date.now()) / 1000))
      setLeft(v)
      if (v === 0) {
        window.clearInterval(timer)
        endRef.current?.()
      }
    }, 200)
    return () => window.clearInterval(timer)
  }, [to])
  return <span className={cn('num', className)}>{left}s</span>
}

export function Sparkline({
  data,
  color = 'var(--brand)',
  width = 96,
  height = 28,
  fill = true,
}: {
  data: number[]
  color?: string
  width?: number
  height?: number
  fill?: boolean
}) {
  if (!data.length) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / span) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const id = `sp-${color.replace(/[^a-z0-9]/gi, '')}-${data.length}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && (
        <polygon
          points={`0,${height} ${pts.join(' ')} ${width},${height}`}
          fill={`url(#${id})`}
        />
      )}
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function GaugeRing({
  value,
  size = 64,
  stroke = 6,
  color = 'var(--brand)',
  label,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  label?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-panel-2)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * clamp(value, 0, 100)) / 100 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-sm font-medium text-ink">{Math.round(value)}%</span>
        {label && <span className="text-2xs text-ink-mute">{label}</span>}
      </div>
    </div>
  )
}

export function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-subtle last:border-0 gap-4">
      <span className="text-xs text-ink-soft shrink-0">{label}</span>
      <span className="text-xs text-ink text-right truncate">{value}</span>
    </div>
  )
}

export function ProgressBar({ value, color = 'var(--brand)', height = 4 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'var(--bg-panel-2)' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamp(value, 0, 100)}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{ height, background: color, borderRadius: 999 }}
      />
    </div>
  )
}

export function Avatar({ name, color, size = 28 }: { name: string; color: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-md font-medium shrink-0"
      style={{ width: size, height: size, background: `${color}22`, color, fontSize: size * 0.38, border: `1px solid ${color}44` }}
    >
      {name.slice(-2)}
    </span>
  )
}
