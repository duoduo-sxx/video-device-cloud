import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search,
  Download,
  Sparkles,
  Send,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Quote,
  Clock,
  Loader2,
} from 'lucide-react'
import type {
  AnalysisSummary,
  EntityItem,
  EventItem,
  PersonTrack,
  ReviewItem,
  SceneSegment,
  TranscriptSegment,
} from '../types'
import { usePlayer } from '../stores'
import { cn, downloadText, formatDuration, percent, toSrt, toVtt } from '../lib/utils'
import { Badge, Button, ConfidenceBar, Progress, Select, Tooltip, toast } from './ui'
import { Chart, PALETTE, axisBase, useChartTheme, tooltipBase } from './Chart'

function useTypewriter(text: string, speed = 22, enabled = true) {
  const [out, setOut] = useState(enabled ? '' : text)
  const timer = useRef<number | null>(null)
  useEffect(() => {
    if (!enabled) {
      setOut(text)
      return
    }
    setOut('')
    let i = 0
    timer.current = window.setInterval(() => {
      i += 2
      setOut(text.slice(0, i))
      if (i >= text.length && timer.current) {
        window.clearInterval(timer.current)
        timer.current = null
      }
    }, speed)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [text, speed, enabled])
  return out
}

export function TranscriptPanel({
  transcript,
}: {
  transcript: TranscriptSegment[]
}) {
  const { currentTime, seek } = usePlayer()
  const [q, setQ] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)
  const manualTimer = useRef<number | null>(null)

  const active = transcript.find((s) => currentTime >= s.start && currentTime < s.end)
  const hits = q.trim() ? transcript.filter((s) => s.text.includes(q.trim())) : []

  useEffect(() => {
    if (!autoScroll || !activeRef.current || !listRef.current) return
    const el = activeRef.current
    const box = listRef.current
    const top = el.offsetTop - box.offsetTop
    if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 80) {
      box.scrollTo({ top: top - box.clientHeight / 2, behavior: 'smooth' })
    }
  }, [active?.id, autoScroll])

  const onManualScroll = () => {
    setAutoScroll(false)
    if (manualTimer.current) window.clearTimeout(manualTimer.current)
    manualTimer.current = window.setTimeout(() => setAutoScroll(true), 3200)
  }

  const highlight = (text: string) => {
    if (!q.trim()) return text
    const parts = text.split(q.trim())
    return parts.map((p, i) => (
      <span key={i}>
        {p}
        {i < parts.length - 1 && (
          <mark className="rounded-sm bg-warning/30 px-0.5 text-inherit">{q.trim()}</mark>
        )}
      </span>
    ))
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-t3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="在转写文本中搜索…"
            className="h-7 w-full rounded-ctl border border-line bg-surface pl-6 pr-2 text-xs outline-none focus:border-brand"
          />
        </div>
        <Select
          className="h-7 w-[76px] text-[11px]"
          defaultValue="srt"
          onChange={(e) => {
            const v = e.target.value
            if (v === 'srt') downloadText('transcript.srt', toSrt(transcript), 'text/plain')
            if (v === 'vtt') downloadText('transcript.vtt', toVtt(transcript), 'text/vtt')
            if (v === 'txt')
              downloadText(
                'transcript.txt',
                transcript.map((s) => `[${formatDuration(s.start)}] ${s.speakerName}：${s.text}`).join('\n'),
              )
            toast(`已导出 ${v.toUpperCase()} 字幕`, 'success')
          }}
        >
          <option value="srt">SRT</option>
          <option value="vtt">VTT</option>
          <option value="txt">TXT</option>
        </Select>
      </div>

      {q.trim() && (
        <div className="border-b border-line bg-warning/5 px-3 py-1.5 text-[11px] text-t2">
          命中 <span className="num font-medium text-warning">{hits.length}</span> 处
        </div>
      )}

      <div
        ref={listRef}
        onWheel={onManualScroll}
        onTouchMove={onManualScroll}
        className="relative flex-1 overflow-y-auto"
      >
        {!autoScroll && (
          <button
            onClick={() => setAutoScroll(true)}
            className="sticky top-2 z-10 mx-auto block rounded-full bg-brand px-2.5 py-1 text-[10px] text-white shadow"
          >
            恢复跟随播放
          </button>
        )}
        {transcript.map((s) => {
          const isActive = active?.id === s.id
          return (
            <button
              key={s.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => seek(s.start)}
              className={cn(
                'group flex w-full gap-2.5 border-l-[3px] px-3 py-2 text-left transition-colors',
                isActive
                  ? 'border-brand bg-brand-soft'
                  : 'border-transparent hover:bg-hover',
              )}
            >
              <span className="num mt-0.5 shrink-0 font-mono text-[10px] text-t3">
                {formatDuration(s.start)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="mb-0.5 flex items-center gap-1.5">
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: speakerColor(s.speakerId) }}
                  >
                    {s.speakerName}
                  </span>
                  <span className="num text-[9px] text-t3">{percent(s.confidence, 0)}</span>
                </span>
                <span className="block text-xs leading-5 text-t1">{highlight(s.text)}</span>
              </span>
            </button>
          )
        })}
      </div>
      <div className="border-t border-line px-3 py-1.5 text-[10px] text-t3">
        共 {transcript.length} 句 · {new Set(transcript.map((s) => s.speakerId)).size} 位说话人
      </div>
    </div>
  )
}

function speakerColor(id: string) {
  const map: Record<string, string> = {
    spk_n: '#6B7280',
    spk_c: '#2563EB',
    spk_l: '#7C3AED',
    spk_w: '#0F766E',
  }
  return map[id] ?? '#2563EB'
}

export function SummaryPanel({ summary }: { summary: AnalysisSummary }) {
  const seek = usePlayer((s) => s.seek)
  const one = useTypewriter(summary.oneLiner, 18)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-4 p-3">
      <div className="rounded-card border border-ai/25 bg-ai/[0.04] p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-ai">
          <Sparkles size={12} /> 一句话摘要
        </div>
        <p className="stream-caret text-sm leading-6 text-t1">{one}</p>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-medium text-t2">关键要点</div>
        <ol className="space-y-1.5">
          {summary.keyPoints.map((k, i) => (
            <li key={i}>
              <button
                onClick={() => seek(k.at)}
                className="flex w-full items-start gap-2 rounded-ctl px-1.5 py-1 text-left transition-colors hover:bg-hover"
              >
                <span className="num mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[9px] font-medium text-brand">
                  {i + 1}
                </span>
                <span className="text-xs leading-5 text-t1">{k.text}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-t2">自动章节</span>
          <span className="text-[10px] text-t3">共 {summary.chapters.length} 章</span>
        </div>
        <div className="space-y-0.5">
          {summary.chapters.map((c) => {
            const open = expanded === c.title
            return (
              <div key={c.title} className="rounded-ctl border border-line/70">
                <button
                  onClick={() => {
                    setExpanded(open ? null : c.title)
                    seek(c.start)
                  }}
                  className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left"
                >
                  {open ? <ChevronDown size={11} className="text-t3" /> : <ChevronRight size={11} className="text-t3" />}
                  <span className="flex-1 truncate text-[11px] text-t1">{c.title}</span>
                  <span className="num shrink-0 font-mono text-[9px] text-t3">
                    {formatDuration(c.start)}
                  </span>
                </button>
                {open && (
                  <p className="border-t border-line/60 px-2.5 py-2 text-[11px] leading-5 text-t2">
                    {c.summary}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-medium text-t2">关键词</div>
        <div className="flex flex-wrap gap-1.5">
          {summary.keywords.map((k) => (
            <span key={k} className="rounded-full bg-subtle px-2 py-0.5 text-[10px] text-t2">
              {k}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

const ENTITY_ORDER: EntityItem['type'][] = ['人物', '地点', '品牌', '物品', '动作', '情绪', '风格']

export function EntityPanel({ entities }: { entities: EntityItem[] }) {
  const [open, setOpen] = useState<string[]>(['人物', '物品'])
  const seek = usePlayer((s) => s.seek)
  const groups = useMemo(() => {
    const m = new Map<string, EntityItem[]>()
    entities.forEach((e) => {
      m.set(e.type, [...(m.get(e.type) ?? []), e])
    })
    return m
  }, [entities])

  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] text-t2">
          共 <span className="num font-medium text-t1">{entities.length}</span> 个实体
        </span>
        <span className="text-[10px] text-t3">{groups.size} 个类型</span>
      </div>
      <div className="space-y-2">
        {ENTITY_ORDER.filter((t) => groups.has(t)).map((t) => {
          const list = groups.get(t) ?? []
          const expanded = open.includes(t)
          return (
            <div key={t} className="rounded-ctl border border-line/70">
              <button
                onClick={() => setOpen((o) => (expanded ? o.filter((x) => x !== t) : [...o, t]))}
                className="flex w-full items-center gap-1.5 px-2.5 py-1.5"
              >
                {expanded ? <ChevronDown size={11} className="text-t3" /> : <ChevronRight size={11} className="text-t3" />}
                <span className="text-[11px] font-medium text-t1">{t}</span>
                <span className="num text-[10px] text-t3">{list.length}</span>
              </button>
              {expanded && (
                <div className="flex flex-wrap gap-1.5 border-t border-line/60 px-2.5 py-2">
                  {list.map((e) => (
                    <Tooltip key={e.id} content={`置信度 ${percent(e.confidence)} · 出现 ${e.count} 次`}>
                      <button
                        onClick={() => seek(Math.random() * 400 + 100)}
                        className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] text-t1 transition-colors hover:border-brand hover:text-brand"
                      >
                        {e.name}
                        <span className="num text-[9px] text-t3">{e.count}</span>
                      </button>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ContentScorePanel({
  summary,
  scenes,
}: {
  summary: AnalysisSummary
  scenes: SceneSegment[]
}) {
  const t = useChartTheme()
  const q = summary.quality
  const radar = useMemo(
    () => ({
      radar: {
        indicator: [
          { name: '构图', max: 100 },
          { name: '光照', max: 100 },
          { name: '色彩', max: 100 },
          { name: '清晰度', max: 100 },
          { name: '稳定性', max: 100 },
        ],
        radius: '62%',
        center: ['50%', '54%'],
        axisName: { color: t.text, fontSize: 10 },
        splitLine: { lineStyle: { color: t.line } },
        splitArea: { areaStyle: { color: ['transparent'] } },
        axisLine: { lineStyle: { color: t.line } },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: [q.composition, q.lighting, q.color, q.clarity, q.stability],
              areaStyle: { color: 'rgba(37,99,235,.18)' },
              lineStyle: { color: '#2563EB', width: 1.5 },
              itemStyle: { color: '#2563EB' },
              symbolSize: 4,
            },
          ],
        },
      ],
    }),
    [q, t],
  )

  const bar = useMemo(
    () => ({
      grid: { left: 40, right: 12, top: 8, bottom: 20 },
      xAxis: { type: 'category', data: Object.keys(summary.stats.shotTypeDist), ...axisBase(t), splitLine: { show: false } },
      yAxis: { type: 'value', ...axisBase(t) },
      tooltip: { trigger: 'axis', ...tooltipBase(t) },
      series: [
        {
          type: 'bar',
          data: Object.values(summary.stats.shotTypeDist),
          barWidth: 14,
          itemStyle: { color: '#7C3AED', borderRadius: [3, 3, 0, 0] },
        },
      ],
    }),
    [summary, t],
  )

  const pace = useMemo(() => {
    const pts = Array.from({ length: 20 }, (_, i) => {
      const from = (i / 20) * (scenes.at(-1)?.end ?? 100)
      const to = ((i + 1) / 20) * (scenes.at(-1)?.end ?? 100)
      return scenes.filter((s) => s.start >= from && s.start < to).length * 3
    })
    return {
      grid: { left: 30, right: 12, top: 8, bottom: 18 },
      xAxis: { type: 'category', data: pts.map((_, i) => `${i + 1}`), ...axisBase(t), splitLine: { show: false }, axisLabel: { show: false } },
      yAxis: { type: 'value', ...axisBase(t) },
      tooltip: { trigger: 'axis', ...tooltipBase(t) },
      series: [
        {
          type: 'line',
          data: pts,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#0891B2', width: 1.5 },
          areaStyle: { color: 'rgba(8,145,178,.12)' },
        },
      ],
    }
  }, [scenes, t])

  const avg = Math.round((q.composition + q.lighting + q.color + q.clarity + q.stability) / 5)

  return (
    <div className="space-y-3 p-3">
      <div className="rounded-card border border-line p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-t2">综合画面评分</span>
          <div className="flex items-baseline gap-1">
            <span className="num text-2xl font-medium text-t1">{avg}</span>
            <span className="text-[10px] text-t3">/ 100</span>
          </div>
        </div>
        <Chart option={radar} height={180} />
      </div>

      <div className="rounded-card border border-line p-3">
        <div className="mb-1 text-[11px] text-t2">景别分布</div>
        <Chart option={bar} height={130} />
      </div>

      <div className="rounded-card border border-line p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] text-t2">节奏曲线</span>
          <span className="text-[10px] text-t3">每分钟镜头数</span>
        </div>
        <Chart option={pace} height={90} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-card border border-line p-2.5">
          <div className="text-[10px] text-t3">语音占比</div>
          <div className="num mt-1 text-lg font-medium text-t1">{percent(summary.stats.speechRatio, 0)}</div>
          <Progress value={summary.stats.speechRatio * 100} height={3} className="mt-1.5" />
        </div>
        <div className="rounded-card border border-line p-2.5">
          <div className="text-[10px] text-t3">场景 / 人脸</div>
          <div className="num mt-1 text-lg font-medium text-t1">
            {summary.stats.sceneCount} / {summary.stats.faceCount}
          </div>
          <div className="mt-1.5 text-[10px] text-t3">个场景 / 位人物</div>
        </div>
      </div>
    </div>
  )
}

export function ReviewPanel({
  reviews,
  onJump,
}: {
  reviews: ReviewItem[]
  onJump?: (t: number) => void
}) {
  const seek = usePlayer((s) => s.seek)
  const [filter, setFilter] = useState<'all' | '高' | '中' | '低'>('all')
  const list = filter === 'all' ? reviews : reviews.filter((r) => r.level === filter)
  const counts = {
    高: reviews.filter((r) => r.level === '高').length,
    中: reviews.filter((r) => r.level === '中').length,
    低: reviews.filter((r) => r.level === '低').length,
  }

  return (
    <div className="p-3">
      <div className="mb-3 grid grid-cols-3 gap-2">
        {(['高', '中', '低'] as const).map((lv) => (
          <button
            key={lv}
            onClick={() => setFilter(filter === lv ? 'all' : lv)}
            className={cn(
              'rounded-ctl border p-2 text-left transition-colors',
              filter === lv ? 'border-brand bg-brand-soft' : 'border-line hover:bg-hover',
            )}
          >
            <div className="text-[10px] text-t3">{lv}风险</div>
            <div
              className="num mt-0.5 text-lg font-medium"
              style={{ color: lv === '高' ? 'var(--danger)' : lv === '中' ? 'var(--warning)' : 'var(--info)' }}
            >
              {counts[lv]}
            </div>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="py-10 text-center text-xs text-t3">未检测到违规内容</div>
      ) : (
        <div className="space-y-2">
          {list.map((r) => (
            <div key={r.id} className="overflow-hidden rounded-ctl border border-line">
              <div className="flex gap-2.5 p-2.5">
                <button onClick={() => { seek(r.start); onJump?.(r.start) }} className="shrink-0">
                  <img src={r.thumbnailUrl} alt="" className="h-[46px] w-[78px] rounded object-cover" loading="lazy" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      color={r.level === '高' ? 'var(--danger)' : r.level === '中' ? 'var(--warning)' : 'var(--info)'}
                      bg={r.level === '高' ? 'rgba(220,38,38,.1)' : r.level === '中' ? 'rgba(217,119,6,.1)' : 'rgba(8,145,178,.1)'}
                    >
                      {r.category}
                    </Badge>
                    <span className="num font-mono text-[10px] text-t3">
                      {formatDuration(r.start)} - {formatDuration(r.end)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-t2">{r.description}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <ConfidenceBar value={r.confidence} />
                    <span className="text-[10px] text-t3">
                      {r.status === 'pending' ? '待审核' : r.status === 'passed' ? '已通过' : r.status === 'rejected' ? '已驳回' : '存疑'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface Msg {
  role: 'user' | 'ai'
  text: string
  refs?: number[]
  streaming?: boolean
}

const SUGGESTIONS = [
  '这个视频讲了什么',
  '有哪些人物出场',
  '找出所有出现产品包装的画面',
  '哪一段情绪最激烈',
]

const CANNED: { q: string; a: string; refs: number[] }[] = [
  {
    q: '这个视频讲了什么',
    a: '这是一部关于景泰蓝手工艺的纪实短片。镜头跟随 63 岁的传承人陈敬山，完整记录了制胎、掐丝、点蓝、烧蓝、磨光、镀金六道核心工序，并穿插行业数据：北京掌握全工序的匠人不足 40 人，平均年龄超过 55 岁。片尾落在工坊招牌与「明天七点还会开门」的日常上，把传承危机收在一个具体的人身上。',
    refs: [160, 928, 1362],
  },
  {
    q: '有哪些人物出场',
    a: '共识别到 6 个人物。主要出镜的是陈敬山（传承人，出现 5 个区间，累计约 12 分钟）和林小满（学徒，6 个区间）；王守拙作为掐丝师傅有 3 段独立镜头；李文华以研究员身份出镜介绍行业数据；周慧在文创段落出现；另有一张 80 年代车间合影中的陈敬山旧照。',
    refs: [276, 828, 928, 1040],
  },
  {
    q: '找出所有出现产品包装的画面',
    a: '全片未出现商业产品包装。若指文创产品，有三处相关画面：09:42 书签与首饰盒成品陈列、11:38 敦煌纹样系列的设计草图、12:20 包装纸盒的手工折叠过程。这三处均为工坊自制包装，没有品牌 Logo 露出。',
    refs: [1040, 1098, 1120],
  },
  {
    q: '哪一段情绪最激烈',
    a: '情绪峰值出现在 15:28 附近。陈敬山谈到「机器做不出手的感觉，丝和丝之间那点不齐，那才是活的」时，语速从 3.8 字/秒升至 5.2 字/秒，音量提高约 6dB，同时有两次较长的停顿。这是全片唯一一次明确的情绪上扬。',
    refs: [984, 1010],
  },
]

export function VideoChat({ transcript }: { transcript: TranscriptSegment[] }) {
  const seek = usePlayer((s) => s.seek)
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: 'ai',
      text: '我已经分析完这部视频，可以回答关于画面、台词、人物和事件的问题。也可以让我定位某个具体时间段。',
    },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs])

  const ask = (q: string) => {
    if (!q.trim() || thinking) return
    setMsgs((m) => [...m, { role: 'user', text: q }])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      const hit = CANNED.find((c) => q.includes(c.q.slice(0, 4)) || c.q.includes(q.slice(0, 4)))
      const answer =
        hit?.a ??
        `关于「${q}」，我在 ${transcript.length} 句转写和 41 个场景中检索到相关线索。整体上这段内容属于工艺展示段落，画面以手部特写和工具操作为主，语音为师傅的讲解与学徒提问。如需精确时间点，可以点击下方引用跳转。`
      const refs = hit?.refs ?? [transcript[Math.floor(transcript.length / 2)]?.start ?? 300]
      setThinking(false)
      setMsgs((m) => [...m, { role: 'ai', text: '', refs, streaming: true }])
      let i = 0
      const timer = window.setInterval(() => {
        i += 3
        setMsgs((m) => {
          const copy = [...m]
          copy[copy.length - 1] = { ...copy[copy.length - 1], text: answer.slice(0, i) }
          return copy
        })
        if (i >= answer.length) {
          window.clearInterval(timer)
          setMsgs((m) => {
            const copy = [...m]
            copy[copy.length - 1] = { ...copy[copy.length - 1], streaming: false }
            return copy
          })
        }
      }, 26)
    }, 700)
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={boxRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {msgs.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[92%] rounded-card px-3 py-2 text-xs leading-5',
                m.role === 'user'
                  ? 'bg-brand text-white'
                  : 'border border-line bg-surface text-t1',
              )}
            >
              {m.role === 'ai' && (
                <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-ai">
                  <Sparkles size={10} /> Insight-MM
                </div>
              )}
              <p className={cn(m.streaming && 'stream-caret')}>{m.text}</p>
              {m.refs && !m.streaming && (
                <div className="mt-2 flex flex-wrap gap-1 border-t border-line/70 pt-2">
                  <span className="text-[10px] text-t3">引用：</span>
                  {m.refs.map((r) => (
                    <button
                      key={r}
                      onClick={() => seek(r)}
                      className="num rounded-full bg-brand-soft px-1.5 py-0.5 font-mono text-[10px] text-brand hover:opacity-80"
                    >
                      {formatDuration(r)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex items-center gap-1.5 text-[11px] text-t3">
            <Loader2 size={11} className="animate-spin" />
            正在检索视频内容…
          </div>
        )}
      </div>

      {msgs.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-full border border-line px-2 py-1 text-[10px] text-t2 transition-colors hover:border-brand hover:text-brand"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-line p-2.5">
        <div className="flex items-end gap-1.5 rounded-ctl border border-line bg-surface px-2 py-1.5 focus-within:border-brand">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                ask(input)
              }
            }}
            rows={1}
            placeholder="问点什么，例如「哪一段提到了炉温」"
            className="max-h-20 flex-1 resize-none bg-transparent text-xs leading-5 outline-none placeholder:text-t3"
          />
          <button
            onClick={() => ask(input)}
            disabled={!input.trim() || thinking}
            className="rounded-md bg-brand p-1.5 text-white disabled:opacity-40"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function PipelineBar({
  stages,
}: {
  stages: { name: string; status: string; duration: number; detail: string }[]
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-t border-line bg-surface px-3 py-2">
      <span className="mr-1 shrink-0 text-[10px] text-t3">解析链路</span>
      {stages.map((s, i) => (
        <div key={s.name} className="flex shrink-0 items-center gap-1">
          <Tooltip content={s.detail}>
            <span
              className={cn(
                'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]',
                s.status === 'done' && 'border-success/30 bg-success/5 text-success',
                s.status === 'running' && 'border-brand/40 bg-brand-soft text-brand',
                s.status === 'waiting' && 'border-line bg-subtle text-t3',
                s.status === 'failed' && 'border-danger/30 bg-danger/5 text-danger',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  s.status === 'running' && 'animate-pulseDot',
                )}
                style={{
                  background:
                    s.status === 'done'
                      ? 'var(--success)'
                      : s.status === 'running'
                        ? 'var(--brand)'
                        : s.status === 'failed'
                          ? 'var(--danger)'
                          : 'var(--text-tertiary)',
                }}
              />
              {s.name}
              {s.duration > 0 && <span className="num text-[9px] opacity-70">{s.duration}s</span>}
            </span>
          </Tooltip>
          {i < stages.length - 1 && <span className="h-px w-2 bg-line-strong" />}
        </div>
      ))}
    </div>
  )
}
