import { useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, Pause } from 'lucide-react'
import type { Job, JobLog, JobStage, JobStatus, OutputSpec } from '../types'
import { JOB_STATUS_LABEL, JOB_STATUS_TONE, FORMAT_LABEL } from '../lib/constants'
import { cn } from '../lib/utils'
import { Badge } from './ui'
import { timeOfDay } from '../lib/format'

export function JobStatusBadge({ status, dot = true }: { status: JobStatus; dot?: boolean }) {
  const animated = ['analyzing', 'depth', 'disparity', 'temporal', 'rendering', 'encoding'].includes(status)
  return (
    <Badge tone={JOB_STATUS_TONE[status]} dot={dot}>
      <span className={cn(animated && 'animate-pulseSoft')}>{JOB_STATUS_LABEL[status]}</span>
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: Job['priority'] }) {
  return priority === 'rush' ? <Badge tone="warning">加急 ×1.5</Badge> : <span className="text-[12px] text-dim">标准</span>
}

export function OutputSpecText({ output }: { output: OutputSpec }) {
  const res = output.resolution === 'source' ? '原分辨率' : output.resolution === '7680x4320' ? '8K' : '4K'
  return (
    <span className="text-[12px] text-muted">
      {FORMAT_LABEL[output.format]} · {res} · {output.fps === 'source' ? '原帧率' : `${output.fps}fps`}
      {output.hdr !== 'SDR' ? ` · ${output.hdr}` : ''}
    </span>
  )
}

export function StageTimeline({ stages, showLabels = true }: { stages: JobStage[]; showLabels?: boolean }) {
  return (
    <div>
      <div className="flex gap-1">
        {stages.map((s) => {
          const done = s.progress >= 100
          const active = s.progress > 0 && s.progress < 100
          return (
            <div key={s.key} className="flex-1" title={`${s.label} ${Math.round(s.progress)}%`}>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-[#1c2230]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, s.progress)}%`,
                    background: done ? 'var(--primary)' : active ? 'var(--accent)' : 'transparent',
                    opacity: done ? 0.75 : 1,
                  }}
                />
                {active && <span className="absolute inset-0 animate-pulseSoft bg-accent/20" />}
              </div>
            </div>
          )
        })}
      </div>
      {showLabels && (
        <div className="mt-2 flex gap-1">
          {stages.map((s) => (
            <div
              key={s.key}
              className={cn(
                'flex-1 truncate text-[10px]',
                s.progress >= 100 ? 'text-muted' : s.progress > 0 ? 'text-accent' : 'text-dim',
              )}
            >
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function LogStream({ logs, height = 240 }: { logs: JobLog[]; height?: number }) {
  const [follow, setFollow] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (follow && ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [logs, follow])

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-[#0b0e13]">
      <div className="flex items-center justify-between border-b border-line-subtle px-3 py-2">
        <span className="text-[11px] text-dim">运行日志 · {logs.length} 条</span>
        <button
          onClick={() => setFollow(!follow)}
          className={cn('flex items-center gap-1 text-[11px]', follow ? 'text-primary' : 'text-dim')}
        >
          {follow ? <ArrowDownToLine className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          {follow ? '自动滚动' : '已暂停'}
        </button>
      </div>
      <div ref={ref} className="scroll-thin overflow-auto px-3 py-2" style={{ height }}>
        {logs.map((l, i) => (
          <div key={i} className="flex gap-2 py-0.5 font-mono text-[11px] leading-5">
            <span className="shrink-0 text-dim">{timeOfDay(l.ts)}</span>
            <span
              className={cn(
                'w-11 shrink-0',
                l.level === 'ERROR' ? 'text-danger' : l.level === 'WARN' ? 'text-warning' : 'text-dim',
              )}
            >
              {l.level}
            </span>
            <span className={cn('text-muted', l.level === 'ERROR' && 'text-[#ff9a9f]', l.level === 'WARN' && 'text-[#f7c97a]')}>
              {l.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProgressCell({ job }: { job: Job }) {
  const tone = job.status === 'failed' ? 'danger' : job.status === 'completed' ? 'success' : job.status === 'paused' ? 'muted' : 'primary'
  const animated = ['analyzing', 'depth', 'disparity', 'temporal', 'rendering', 'encoding'].includes(job.status)
  return (
    <div className="flex items-center gap-2">
      <div className="w-16">
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#1c2230]">
          <div
            className="relative h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${job.progress}%`,
              background:
                tone === 'danger' ? 'var(--danger)' : tone === 'success' ? 'var(--success)' : tone === 'muted' ? 'var(--text-dim)' : 'var(--primary)',
            }}
          >
            {animated && (
              <span className="absolute inset-0 overflow-hidden rounded-full">
                <span className="absolute inset-y-0 w-6 animate-shimmer bg-gradient-to-r from-transparent via-white/45 to-transparent" />
              </span>
            )}
          </div>
        </div>
      </div>
      <span className="mono w-8 text-right text-[11px] text-muted">{Math.round(job.progress)}%</span>
    </div>
  )
}
