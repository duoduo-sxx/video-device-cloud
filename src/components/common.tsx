import React from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Grade, Severity } from '../types'
import { GRADE_META, SEVERITY_META } from '../lib/constants'
import { cn } from '../lib/cn'
import { slaState } from '../lib/sla'

export function PageHeader({
  title,
  desc,
  crumbs,
  actions,
  meta,
}: {
  title: React.ReactNode
  desc?: React.ReactNode
  crumbs?: { label: string; to?: string }[]
  actions?: React.ReactNode
  meta?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-6">
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 && (
          <div className="mb-1.5 flex items-center gap-1 text-[12px] text-[var(--text-3)]">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={11} className="text-[var(--text-3)]" />}
                {c.to ? (
                  <Link to={c.to} className="hover:text-[var(--text-2)]">
                    {c.label}
                  </Link>
                ) : (
                  <span>{c.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-[20px] font-medium leading-7 text-[var(--text-1)]">{title}</h1>
          {meta}
        </div>
        {desc && <p className="mt-1 max-w-[860px] text-[13px] text-[var(--text-3)]">{desc}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export function ScoreRing({
  score,
  grade,
  size = 64,
  stroke = 5,
  showGrade = true,
}: {
  score: number
  grade?: Grade
  size?: number
  stroke?: number
  showGrade?: boolean
}) {
  const color = grade ? GRADE_META[grade].color : score >= 90 ? '#34D399' : score >= 75 ? '#22D3EE' : score >= 60 ? '#FBBF24' : '#F87171'
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(100, Math.max(0, score)) / 100)
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .6s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="mono font-medium" style={{ fontSize: size > 56 ? 16 : 13, color }}>
          {score.toFixed(1)}
        </span>
        {showGrade && grade && (
          <span className="mt-0.5 text-[10px]" style={{ color }}>
            {grade}
          </span>
        )}
      </div>
    </div>
  )
}

export function SeverityTag({ severity, count }: { severity: Severity; count?: number }) {
  const meta = SEVERITY_META[severity]
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-[1px] text-[11px] leading-4"
      style={{ color: meta.color, background: meta.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-sm" style={{ background: meta.color }} />
      {meta.label}
      {count !== undefined && <span className="tnum opacity-80">{count}</span>}
    </span>
  )
}

export function StatusPill({
  label,
  color,
  bg,
  dot = true,
}: {
  label: string
  color: string
  bg: string
  dot?: boolean
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-[1px] text-[12px] leading-5"
      style={{ color, background: bg }}
    >
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />}
      {label}
    </span>
  )
}

export function KpiCard({
  label,
  value,
  unit,
  delta,
  hint,
  values,
  color = 'var(--primary)',
}: {
  label: string
  value: string
  unit?: string
  delta?: number
  hint?: string
  values?: number[]
  color?: string
}) {
  return (
    <div className="card px-5 py-4">
      <div className="flex items-start justify-between">
        <span className="text-[12px] text-[var(--text-3)]">{label}</span>
        {values && <Sparkline values={values} color={color} width={64} height={20} />}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="mono text-[28px] font-medium leading-none text-[var(--text-1)]">{value}</span>
        {unit && <span className="text-[12px] text-[var(--text-3)]">{unit}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[12px]">
        {delta !== undefined && (
          <span className="tnum" style={{ color: delta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-[var(--text-3)]">{hint}</span>}
      </div>
    </div>
  )
}

export function Sparkline({
  values,
  color = 'var(--primary)',
  width = 80,
  height = 24,
}: {
  values: number[]
  color?: string
  width?: number
  height?: number
}) {
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / span) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity={0.9} />
    </svg>
  )
}

export function TrendChart({
  data,
  height = 190,
}: {
  data: { date: string; detect: number; repair: number }[]
  height?: number
}) {
  const w = 720
  const h = height
  const padL = 32
  const padB = 22
  const padT = 10
  const max = Math.max(...data.flatMap((d) => [d.detect, d.repair]), 4) + 1
  const stepX = (w - padL - 8) / Math.max(1, data.length - 1)
  const y = (v: number) => padT + (1 - v / max) * (h - padT - padB)
  const line = (key: 'detect' | 'repair') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${padL + i * stepX},${y(d[key])}`).join(' ')
  const labels = data.filter((_, i) => i % 6 === 0 || i === data.length - 1)

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={padL} x2={w - 8} y1={padT + t * (h - padT - padB)} y2={padT + t * (h - padT - padB)} stroke="var(--border)" strokeWidth="0.5" />
            <text x={padL - 6} y={padT + t * (h - padT - padB) + 3} textAnchor="end" fontSize="10" fill="var(--text-3)" className="mono">
              {Math.round(max * (1 - t))}
            </text>
          </g>
        ))}
        <path d={line('detect')} fill="none" stroke="#22D3EE" strokeWidth="1.8" />
        <path d={line('repair')} fill="none" stroke="#A78BFA" strokeWidth="1.8" />
        {labels.map((d, i) => (
          <text
            key={d.date}
            x={padL + data.indexOf(d) * stepX}
            y={h - 6}
            textAnchor={i === 0 ? 'start' : 'middle'}
            fontSize="10"
            fill="var(--text-3)"
            className="mono"
          >
            {d.date.slice(5)}
          </text>
        ))}
      </svg>
      <div className="mt-1 flex items-center gap-4 px-1 text-[11px] text-[var(--text-3)]">
        <span className="flex items-center gap-1.5"><span className="h-[2px] w-3 bg-[#22D3EE]" />检测任务</span>
        <span className="flex items-center gap-1.5"><span className="h-[2px] w-3 bg-[#A78BFA]" />修复任务</span>
      </div>
    </div>
  )
}

export function StackedBars({
  data,
  height = 150,
}: {
  data: { channel: string; fatal: number; severe: number; moderate: number; info: number }[]
  height?: number
}) {
  const max = Math.max(...data.map((d) => d.fatal + d.severe + d.moderate + d.info), 1)
  const colors = ['#F87171', '#FB923C', '#FBBF24', '#60A5FA']
  const keys = ['fatal', 'severe', 'moderate', 'info'] as const
  return (
    <div>
      <div className="flex items-end justify-around gap-4" style={{ height }}>
        {data.map((d) => {
          const total = d.fatal + d.severe + d.moderate + d.info
          return (
            <div key={d.channel} className="flex w-full max-w-[86px] flex-col items-center gap-2">
              <span className="mono text-[11px] text-[var(--text-2)]">{total}</span>
              <div className="flex w-full flex-col-reverse" style={{ height: (total / max) * (height - 40) }}>
                {keys.map((k, i) => (
                  <div
                    key={k}
                    style={{
                      height: `${(d[k] / Math.max(1, total)) * 100}%`,
                      background: colors[i],
                      opacity: 0.85,
                    }}
                    title={`${k}: ${d[k]}`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-[var(--text-3)]">{d.channel}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-3)]">
        {['致命', '严重', '一般', '提示'].map((l, i) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: colors[i], opacity: 0.85 }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon?: React.ReactNode
  title: string
  desc?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-2)] text-[var(--text-3)]">
        {icon}
      </div>
      <p className="text-[14px] text-[var(--text-2)]">{title}</p>
      {desc && <p className="mt-1 max-w-[380px] text-[12px] text-[var(--text-3)]">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((__, j) => (
            <Skeleton key={j} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

const THUMB_PALETTE = [
  ['#0d2b33', '#1c4b52', '#e0a45b'],
  ['#1a2030', '#2f3a52', '#7fa7c7'],
  ['#211827', '#3a2a3f', '#c98c6b'],
  ['#0f241c', '#204034', '#9fbf8a'],
  ['#2a1f18', '#463127', '#d8b48c'],
  ['#161c2c', '#26314a', '#8fa2d8'],
  ['#241a1a', '#3d2b2b', '#d08b7a'],
  ['#122028', '#203844', '#84b6c0'],
]

export function Thumb({
  seed,
  label,
  className,
  aspect = '16/9',
}: {
  seed: number
  label?: string
  className?: string
  aspect?: string
}) {
  const p = THUMB_PALETTE[seed % THUMB_PALETTE.length]
  const horizon = 46 + ((seed * 7) % 22)
  const sunX = 22 + ((seed * 13) % 56)
  const blocks = 3 + (seed % 3)
  return (
    <div className={cn('relative overflow-hidden rounded-md border border-[var(--border)]', className)} style={{ aspectRatio: aspect, background: p[0] }}>
      <svg viewBox="0 0 160 90" className="h-full w-full">
        <rect width="160" height="90" fill={p[0]} />
        <rect width="160" height={horizon} fill={p[1]} opacity="0.55" />
        <circle cx={sunX} cy={horizon - 16} r={7 + (seed % 4)} fill={p[2]} opacity="0.9" />
        <path d={`M0 ${horizon} L30 ${horizon - 12} L58 ${horizon - 4} L92 ${horizon - 18} L128 ${horizon - 6} L160 ${horizon - 10} L160 90 L0 90 Z`} fill={p[1]} opacity="0.85" />
        {Array.from({ length: blocks }).map((_, i) => (
          <rect
            key={i}
            x={8 + i * 26 + ((seed * 5) % 9)}
            y={horizon + 6 + ((i * 7) % 8)}
            width={10 + ((seed + i * 3) % 14)}
            height={6 + ((seed + i) % 10)}
            fill={p[2]}
            opacity={0.18 + (i % 3) * 0.08}
          />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,.16) 0 1px, transparent 1px 3px)' }} />
      {label && (
        <span className="mono absolute bottom-1 right-1 rounded bg-black/55 px-1 text-[10px] text-white/85">{label}</span>
      )}
    </div>
  )
}

export function MetricDelta({
  label,
  before,
  after,
  unit = '',
  better = 'up',
  digits = 1,
}: {
  label: string
  before: number
  after: number
  unit?: string
  better?: 'up' | 'down' | 'neutral'
  digits?: number
}) {
  const diff = after - before
  const good = better === 'neutral' ? true : better === 'up' ? diff > 0 : diff < 0
  const color = Math.abs(diff) < 0.001 ? 'var(--text-2)' : good ? 'var(--success)' : 'var(--danger)'
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2.5">
      <div className="text-[11px] text-[var(--text-3)]">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="mono text-[13px] text-[var(--text-3)]">{before.toFixed(digits)}</span>
        <span className="text-[11px] text-[var(--text-3)]">→</span>
        <span className="mono text-[17px] font-medium" style={{ color }}>
          {after.toFixed(digits)}
        </span>
        <span className="text-[11px] text-[var(--text-3)]">{unit}</span>
      </div>
      <div className="mono mt-0.5 text-[11px]" style={{ color }}>
        {diff > 0 ? '+' : ''}
        {diff.toFixed(digits)} {unit}
      </div>
    </div>
  )
}

export function SlaBar({ createdAt, slaHours, compact }: { createdAt: string; slaHours: number; compact?: boolean }) {
  const s = slaState(createdAt, slaHours || 240)
  const color = s.level === 'danger' ? 'var(--danger)' : s.level === 'warn' ? 'var(--accent)' : 'var(--success)'
  return (
    <div className={compact ? 'w-[110px]' : 'w-full'}>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span style={{ color }}>{s.label}</span>
        {!compact && <span className="mono text-[var(--text-3)]">{Math.min(100, Math.round(s.percent * 100))}%</span>}
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--bg-3)]">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.percent * 100)}%`, background: color }} />
      </div>
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="mb-1.5 text-[12px] text-[var(--text-2)]">{label}</div>
      {children}
      {hint && <div className="mt-1 text-[11px] text-[var(--text-3)]">{hint}</div>}
    </div>
  )
}

export function KV({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] py-2 last:border-0">
      <span className="shrink-0 text-[12px] text-[var(--text-3)]">{k}</span>
      <span className={cn('text-right text-[12px] text-[var(--text-1)]', mono && 'mono')}>{v}</span>
    </div>
  )
}
