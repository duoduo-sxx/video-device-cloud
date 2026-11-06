import { useMemo, useRef, useState } from 'react'
import { MessageSquare, Film, Users, Zap, Activity, ShieldAlert, Minus, Plus, Eye, EyeOff } from 'lucide-react'
import type { EventItem, PersonTrack, ReviewItem, SceneSegment, TranscriptSegment } from '../types'
import { usePlayer } from '../stores'
import { cn, formatDuration } from '../lib/utils'

const TRACK_META = [
  { key: 'transcript', label: '语音转写', icon: MessageSquare },
  { key: 'scene', label: '场景镜头', icon: Film },
  { key: 'person', label: '人物轨迹', icon: Users },
  { key: 'event', label: '事件标记', icon: Zap },
  { key: 'emotion', label: '情绪曲线', icon: Activity },
  { key: 'review', label: '风险区间', icon: ShieldAlert },
]

export default function Timeline({
  duration,
  transcript,
  scenes,
  persons,
  events,
  reviews = [],
}: {
  duration: number
  transcript: TranscriptSegment[]
  scenes: SceneSegment[]
  persons: PersonTrack[]
  events: EventItem[]
  reviews?: ReviewItem[]
}) {
  const { currentTime, seek } = usePlayer()
  const [zoom, setZoom] = useState(1)
  const [hidden, setHidden] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hoverT, setHoverT] = useState<number | null>(null)

  const pct = (t: number) => `${(t / duration) * 100}%`
  const width = (s: number, e: number) => `${((e - s) / duration) * 100}%`

  const emotionPath = useMemo(() => {
    const pts: string[] = []
    const n = 60
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * duration
      const base = 0.35 + 0.25 * Math.sin(i * 0.7) + 0.18 * Math.cos(i * 1.9)
      const boost = events.some((ev) => Math.abs((ev.start + ev.end) / 2 - t) < 60) ? 0.22 : 0
      const v = Math.min(0.96, Math.max(0.12, base + boost))
      pts.push(`${(i / n) * 1000},${40 - v * 34}`)
    }
    return `M${pts.join(' L')}`
  }, [duration, events])

  const handleSeekAt = (clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    seek(ratio * duration)
  }

  const ticks = useMemo(() => {
    const step = duration > 3600 ? 600 : duration > 1200 ? 180 : duration > 300 ? 60 : 30
    const arr: number[] = []
    for (let t = 0; t <= duration; t += step) arr.push(t)
    return arr
  }, [duration])

  return (
    <div className="flex flex-col rounded-card border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <div className="flex items-center gap-2 text-[11px] text-t3">
          <span className="font-medium text-t2">多轨时间轴</span>
          <span>·</span>
          <span>{TRACK_META.length} 条轨道</span>
          <span>·</span>
          <span>点击任意位置可定位</span>
        </div>
        <div className="flex items-center gap-1">
          {hoverT !== null && (
            <span className="num mr-2 rounded bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-t2">
              {formatDuration(hoverT, true)}
            </span>
          )}
          <button
            onClick={() => setZoom((z) => Math.max(1, +(z - 1).toFixed(1)))}
            className="rounded p-1 text-t3 hover:bg-hover hover:text-t1"
            title="缩小"
          >
            <Minus size={13} />
          </button>
          <span className="num w-8 text-center text-[10px] text-t3">{zoom}x</span>
          <button
            onClick={() => setZoom((z) => Math.min(10, +(z + 1).toFixed(1)))}
            className="rounded p-1 text-t3 hover:bg-hover hover:text-t1"
            title="放大"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0">
        <div className="w-[88px] shrink-0 border-r border-line bg-subtle/40">
          <div className="h-6 border-b border-line" />
          {TRACK_META.map((t) => {
            const Icon = t.icon
            const off = hidden.includes(t.key)
            return (
              <div
                key={t.key}
                className="flex items-center justify-between gap-1 border-b border-line/60 px-2 py-1.5"
                style={{ height: t.key === 'person' ? 26 * Math.max(2, persons.length) : t.key === 'scene' ? 42 : 26 }}
              >
                <span className={cn('flex items-center gap-1 truncate text-[10px]', off ? 'text-t3/60' : 'text-t2')}>
                  <Icon size={11} className="shrink-0" />
                  <span className="truncate">{t.label}</span>
                </span>
                <button
                  onClick={() => setHidden((h) => (off ? h.filter((k) => k !== t.key) : [...h, t.key]))}
                  className="shrink-0 text-t3 hover:text-t1"
                >
                  {off ? <EyeOff size={10} /> : <Eye size={10} />}
                </button>
              </div>
            )
          })}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-x-auto no-scrollbar">
          <div style={{ width: `${zoom * 100}%`, minWidth: '100%' }} className="relative">
            <div
              className="sticky top-0 z-10 h-6 cursor-pointer select-none border-b border-line bg-surface"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                setHoverT(((e.clientX - r.left) / r.width) * duration)
              }}
              onMouseLeave={() => setHoverT(null)}
              onClick={(e) => handleSeekAt(e.clientX, e.currentTarget)}
            >
              {ticks.map((t) => (
                <div key={t} className="absolute top-0 h-full" style={{ left: pct(t) }}>
                  <div className="h-2 w-px bg-line-strong" />
                  <span className="num absolute left-1 top-1.5 whitespace-nowrap font-mono text-[9px] text-t3">
                    {formatDuration(t, true)}
                  </span>
                </div>
              ))}
            </div>

            {!hidden.includes('transcript') && (
              <div className="relative border-b border-line/60" style={{ height: 26 }}>
                {transcript.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => seek(s.start)}
                    title={`${s.speakerName}：${s.text}`}
                    className="absolute top-[3px] h-[20px] overflow-hidden rounded-[3px] px-1 text-left text-[9px] leading-[20px] text-white/95 transition-opacity hover:opacity-85"
                    style={{
                      left: pct(s.start),
                      width: width(s.start, s.end),
                      background: speakerColor(s.speakerId),
                      opacity: currentTime >= s.start && currentTime < s.end ? 1 : 0.82,
                    }}
                  >
                    <span className="truncate">{s.text}</span>
                  </button>
                ))}
              </div>
            )}

            {!hidden.includes('scene') && (
              <div className="relative border-b border-line/60" style={{ height: 42 }}>
                {scenes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => seek(s.start)}
                    title={`镜头 ${s.index} · ${s.shotType} · ${s.cameraMove}\n${s.description}`}
                    className="absolute top-[3px] h-[36px] overflow-hidden border-r border-black/20"
                    style={{ left: pct(s.start), width: width(s.start, s.end) }}
                  >
                    <img src={s.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {!hidden.includes('person') && (
              <div className="relative border-b border-line/60" style={{ height: 26 * Math.max(2, persons.length) }}>
                {persons.map((p, i) => (
                  <div key={p.id} className="relative" style={{ height: 26 }}>
                    <div className="absolute left-0 top-1/2 h-px w-full bg-line/40" />
                    {p.appearances.map((a, j) => (
                      <button
                        key={j}
                        onClick={() => seek(a.start)}
                        title={`${p.name}（${p.role}） 出场 ${formatDuration(a.start)} - ${formatDuration(a.end)}`}
                        className="absolute top-[5px] h-[16px] rounded-full border text-[9px] leading-[14px] text-white"
                        style={{
                          left: pct(a.start),
                          width: width(a.start, a.end),
                          minWidth: 8,
                          background: p.color,
                          borderColor: 'rgba(255,255,255,.35)',
                          opacity: 0.86,
                        }}
                      >
                        <span className="truncate px-1">{i === 0 ? p.name : ''}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {!hidden.includes('event') && (
              <div className="relative border-b border-line/60" style={{ height: 26 }}>
                {events.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => seek(e.start)}
                    title={`${e.type}｜${e.title}\n${e.description}`}
                    className="absolute top-1/2 -translate-y-1/2 -rotate-45 border border-warning bg-warning/25 transition-transform hover:scale-125"
                    style={{
                      left: `calc(${pct(e.start)} - 5px)`,
                      width: 6 + e.importance * 2,
                      height: 6 + e.importance * 2,
                    }}
                  />
                ))}
              </div>
            )}

            {!hidden.includes('emotion') && (
              <div className="relative border-b border-line/60" style={{ height: 26 }}>
                <svg viewBox="0 0 1000 40" preserveAspectRatio="none" className="h-full w-full">
                  <defs>
                    <linearGradient id="emo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--ai-purple)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--ai-purple)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={`${emotionPath} L1000,40 L0,40 Z`} fill="url(#emo)" />
                  <path d={emotionPath} fill="none" stroke="var(--ai-purple)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            )}

            {!hidden.includes('review') && (
              <div className="relative" style={{ height: 26 }}>
                {reviews.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => seek(r.start)}
                    title={`${r.category}（${r.level}风险） ${formatDuration(r.start)} - ${formatDuration(r.end)}\n${r.description}`}
                    className="absolute top-[4px] h-[18px] rounded-[3px] border border-danger/60 bg-danger/25"
                    style={{ left: pct(r.start), width: width(r.start, r.end), minWidth: 4 }}
                  />
                ))}
              </div>
            )}

            <div
              className="pointer-events-none absolute top-0 z-20 h-full w-px bg-brand"
              style={{ left: pct(currentTime) }}
            >
              <div className="absolute -left-[5px] top-0 h-0 w-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-brand" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function speakerColor(id: string) {
  const map: Record<string, string> = {
    spk_n: '#4B5563',
    spk_c: '#2563EB',
    spk_l: '#7C3AED',
    spk_w: '#0F766E',
  }
  return map[id] ?? '#2563EB'
}
