import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Sparkles,
  Image as ImageIcon,
  Type,
  SlidersHorizontal,
  Play,
  Scissors,
  ArrowUpRight,
  Loader2,
  Check,
  Clock,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react'
import type { SearchHit, VideoItem } from '../types'
import { fetchVideo, searchVideos } from '../services'
import { searchExamples } from '../mock/search'
import VideoPlayer from '../components/VideoPlayer'
import {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  PageHeader,
  Progress,
  SectionTitle,
  Segmented,
  Select,
  Skeleton,
  toast,
} from '../components/ui'
import { cn, formatDuration, percent } from '../lib/utils'
import { usePlayer } from '../stores'

const STEPS = ['解析查询意图', '多模态并行召回', '跨模态重排序', '生成结果解释']
const MODES = [
  { value: 'text', label: '自然语言', icon: Sparkles },
  { value: 'image', label: '以图搜视频', icon: ImageIcon },
  { value: 'ocr', label: '画面文字', icon: Type },
] as const

export default function SearchPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [mode, setMode] = useState<'text' | 'image' | 'ocr'>('text')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [touched, setTouched] = useState(false)
  const [sort, setSort] = useState<'score' | 'time'>('score')
  const [typeFilter, setTypeFilter] = useState('all')
  const [active, setActive] = useState<SearchHit | null>(null)
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null)
  const seek = usePlayer((s) => s.seek)

  const run = async (query: string, m = mode) => {
    if (!query.trim()) return
    setQ(query)
    setTouched(true)
    setLoading(true)
    setStep(0)
    setHits([])
    const tick = window.setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 340)
    const prefix = m === 'image' ? `以图搜视频：${query}` : m === 'ocr' ? `画面文字：${query}` : query
    const res = await searchVideos(prefix)
    window.clearInterval(tick)
    setStep(STEPS.length - 1)
    setHits(res)
    setLoading(false)
  }

  useEffect(() => {
    if (active) {
      fetchVideo(active.videoId).then((v) => {
        setActiveVideo(v ?? null)
        setTimeout(() => seek(active.start), 120)
      })
    }
  }, [active, seek])

  const list = useMemo(() => {
    let l = [...hits]
    if (typeFilter !== 'all') l = l.filter((h) => h.matchType === typeFilter)
    l.sort((a, b) => (sort === 'score' ? b.score - a.score : a.start - b.start))
    return l
  }, [hits, typeFilter, sort])

  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {}
    hits.forEach((h) => (m[h.matchType] = (m[h.matchType] ?? 0) + 1))
    return m
  }, [hits])

  return (
    <div className="p-6">
      <PageHeader
        title="智能检索"
        desc="用一句话描述画面、台词或情绪，检索结果精确到秒，并给出命中依据"
        extra={
          <Button icon={<Info size={13} />} onClick={() => toast('检索基于多模态向量索引，支持自然语言与图像两种查询形态', 'info')}>
            检索能力说明
          </Button>
        }
      />

      <Card className="mb-4 p-4">
        <div className="mb-2.5 flex items-center gap-2">
          <Segmented
            value={mode}
            onChange={(m) => setMode(m)}
            options={MODES.map((m) => ({
              value: m.value,
              label: (
                <span className="flex items-center gap-1">
                  <m.icon size={11} /> {m.label}
                </span>
              ),
            }))}
          />
          <span className="text-[10px] text-t3">
            {mode === 'image' ? '输入参考画面的描述，或从素材中选择一张截图' : '支持「谁 + 做了什么 + 在哪里」的自然语言描述'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run(q)}
              placeholder={
                mode === 'image'
                  ? '例如：一个穿红色外套的人在雨天骑车'
                  : mode === 'ocr'
                    ? '例如：出现「疏散集合点」标牌的画面'
                    : '描述你要找的画面，例如：有人提到"供应链"这个词的片段'
              }
              className="h-11 w-full rounded-ctl border border-line bg-surface pl-9 pr-3 text-sm text-t1 outline-none transition-colors placeholder:text-t3 focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </div>
          <Button variant="primary" size="lg" loading={loading} icon={<Sparkles size={14} />} onClick={() => run(q)}>
            检索
          </Button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-t3">试试：</span>
          {searchExamples.slice(0, 5).map((e) => (
            <button
              key={e}
              onClick={() => run(e)}
              className="rounded-full border border-line px-2 py-0.5 text-[10px] text-t2 transition-colors hover:border-brand hover:text-brand"
            >
              {e}
            </button>
          ))}
        </div>
      </Card>

      {loading && (
        <Card className="mb-4 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-t2">
            <Loader2 size={13} className="animate-spin text-brand" />
            正在多模态召回…
          </div>
          <div className="space-y-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 text-[11px]">
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full',
                    i < step ? 'bg-success/10 text-success' : i === step ? 'bg-brand-soft text-brand' : 'bg-subtle text-t3',
                  )}
                >
                  {i < step ? <Check size={10} /> : i === step ? <Loader2 size={9} className="animate-spin" /> : i + 1}
                </span>
                <span className={i <= step ? 'text-t1' : 'text-t3'}>{s}</span>
                {i === step && <span className="text-[10px] text-t3">处理中</span>}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Progress value={((step + 1) / STEPS.length) * 100} height={3} />
          </div>
        </Card>
      )}

      {!touched && !loading && (
        <div className="grid gap-3 lg:grid-cols-3">
          <Card className="p-4 lg:col-span-2">
            <SectionTitle title="检索示例" desc="点击任意示例可直接查看效果" />
            <div className="space-y-2">
              {searchExamples.map((e, i) => (
                <button
                  key={e}
                  onClick={() => run(e)}
                  className="flex w-full items-center gap-2.5 rounded-ctl border border-line px-3 py-2 text-left transition-colors hover:border-brand hover:bg-brand-soft/40"
                >
                  <span className="num flex h-5 w-5 shrink-0 items-center justify-center rounded bg-subtle text-[10px] text-t2">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-xs text-t1">{e}</span>
                  <ArrowUpRight size={12} className="text-t3" />
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <SectionTitle title="检索是怎么工作的" />
            <div className="space-y-3">
              {[
                { title: '多通道召回', desc: '语音转写、画面语义、OCR 文字三路并行召回候选片段。' },
                { title: '跨模态对齐', desc: '把查询与片段映射到同一向量空间，计算相似度。' },
                { title: '重排序与解释', desc: '结合时间连续性与实体一致性重排，并生成命中依据。' },
              ].map((s, i) => (
                <div key={s.title} className="flex gap-2">
                  <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-medium text-brand">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-[11px] font-medium text-t1">{s.title}</div>
                    <p className="mt-0.5 text-[10px] leading-4 text-t3">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-ctl bg-subtle px-2.5 py-2 text-[10px] leading-4 text-t3">
              当前索引覆盖 <span className="num text-t2">36</span> 个视频、
              <span className="num text-t2">1 284</span> 个片段、<span className="num text-t2">7.6 万</span> 条向量。
            </div>
          </Card>
        </div>
      )}

      {(touched || loading) && (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-t2">
                找到 <span className="num font-medium text-t1">{hits.length}</span> 个相关片段
                {q && <span className="text-t3"> · 「{q}」</span>}
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <Segmented
                  value={sort}
                  onChange={setSort}
                  options={[
                    { value: 'score', label: '相关度' },
                    { value: 'time', label: '时间序' },
                  ]}
                />
                <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-7 text-[11px]">
                  <option value="all">全部类型</option>
                  <option value="多模态">多模态</option>
                  <option value="语音">语音</option>
                  <option value="画面">画面</option>
                  <option value="文字">文字</option>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="flex gap-3 p-3">
                    <Skeleton className="h-[74px] w-[132px]" />
                    <div className="flex-1 space-y-2 py-1">
                      <Skeleton className="h-3 w-2/5" />
                      <Skeleton className="h-3 w-4/5" />
                      <Skeleton className="h-3 w-3/5" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : list.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Search size={18} />}
                  title="没有命中片段"
                  desc="尝试换一种描述方式，或减少限定条件。语义检索对动作、场景与情绪的召回效果更好。"
                  action={<Button onClick={() => run(searchExamples[0])}>用示例查询</Button>}
                />
              </Card>
            ) : (
              <div className="space-y-2">
                {list.map((h) => (
                  <HitCard key={h.id} hit={h} onOpen={() => setActive(h)} onClip={() => navigate('/editing')} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Card className="p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-t2">
                <SlidersHorizontal size={11} /> 命中类型
              </div>
              <div className="space-y-1.5">
                {[
                  { key: 'all', label: '全部', count: hits.length },
                  { key: '多模态', label: '多模态', count: typeCounts['多模态'] ?? 0 },
                  { key: '语音', label: '语音', count: typeCounts['语音'] ?? 0 },
                  { key: '画面', label: '画面', count: typeCounts['画面'] ?? 0 },
                  { key: '文字', label: '画面文字', count: typeCounts['文字'] ?? 0 },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTypeFilter(t.key)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-ctl px-2 py-1 text-[11px] transition-colors',
                      typeFilter === t.key ? 'bg-brand-soft text-brand' : 'text-t2 hover:bg-hover',
                    )}
                  >
                    <span>{t.label}</span>
                    <span className="num text-t3">{t.count}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-t2">
                <Layers size={11} /> 结果分布
              </div>
              {[...new Set(hits.map((h) => h.videoTitle))].slice(0, 6).map((title) => {
                const n = hits.filter((h) => h.videoTitle === title).length
                return (
                  <div key={title} className="mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="line-clamp-1 flex-1 text-[10px] text-t2">{title}</span>
                      <span className="num shrink-0 text-[10px] text-t3">{n}</span>
                    </div>
                    <Progress value={(n / Math.max(1, hits.length)) * 100} height={2} className="mt-0.5" />
                  </div>
                )
              })}
            </Card>

            <Card className="p-3">
              <div className="text-[10px] leading-5 text-t3">
                检索耗时 <span className="num text-t2">1.5s</span>，其中向量召回{' '}
                <span className="num text-t2">0.4s</span>，重排 <span className="num text-t2">0.9s</span>。
              </div>
            </Card>
          </div>
        </div>
      )}

      <Drawer
        open={!!active}
        onClose={() => {
          setActive(null)
          setActiveVideo(null)
        }}
        title={active?.videoTitle}
        width={640}
        footer={
          <div className="flex items-center justify-between">
            <span className="num font-mono text-[10px] text-t3">
              {active ? `${formatDuration(active.start)} - ${formatDuration(active.end)}` : ''}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                icon={<Scissors size={12} />}
                onClick={() => {
                  toast('已加入剪辑素材箱', 'info')
                  navigate('/editing')
                }}
              >
                加入剪辑
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={<ArrowUpRight size={12} />}
                onClick={() => active && navigate(`/videos/${active.videoId}/analysis`)}
              >
                打开解析
              </Button>
            </div>
          </div>
        }
      >
        {activeVideo ? (
          <div className="p-3">
            <VideoPlayer video={activeVideo} />
            <div className="mt-3 rounded-card border border-line p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <Badge color="var(--brand)" bg="var(--brand-soft)">
                  {active?.matchType}
                </Badge>
                <span className="num text-[10px] text-t3">相关度 {percent(active?.score ?? 0, 0)}</span>
              </div>
              <p className="text-xs leading-6 text-t1">
                {active?.snippet.split(q || '\u0000').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && <mark className="rounded bg-warning/30 px-0.5 text-inherit">{q}</mark>}
                  </span>
                ))}
              </p>
            </div>
            <div className="mt-2.5 space-y-1.5">
              {active?.reasons.map((r) => (
                <div key={r.type} className="rounded-ctl bg-subtle px-2.5 py-2">
                  <div className="text-[10px] text-t3">{r.type}</div>
                  <div className="mt-0.5 text-[11px] leading-5 text-t2">{r.content}</div>
                </div>
              ))}
            </div>
            <div className="mt-2.5 flex items-start gap-1.5 text-[10px] leading-4 text-t3">
              <Clock size={10} className="mt-0.5 shrink-0" />
              已自动定位到命中时间点，可拖动进度条查看上下文。
            </div>
          </div>
        ) : (
          <div className="p-6">
            <Skeleton className="aspect-video w-full" />
          </div>
        )}
      </Drawer>
    </div>
  )
}

function HitCard({ hit, onOpen, onClip }: { hit: SearchHit; onOpen: () => void; onClip: () => void }) {
  const [expand, setExpand] = useState(false)
  const color =
    hit.matchType === '多模态'
      ? 'var(--ai-purple)'
      : hit.matchType === '语音'
        ? 'var(--brand)'
        : hit.matchType === '画面'
          ? 'var(--info)'
          : 'var(--warning)'

  return (
    <Card className="overflow-hidden transition-colors hover:border-line-strong">
      <div className="flex gap-3 p-3">
        <button onClick={onOpen} className="group relative h-[74px] w-[132px] shrink-0 overflow-hidden rounded-ctl bg-subtle">
          <img src={hit.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
            <Play size={18} className="text-white" fill="currentColor" />
          </span>
          <span className="absolute bottom-1 right-1 rounded bg-black/65 px-1 font-mono text-[9px] text-white">
            {formatDuration(hit.start)}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              to={`/videos/${hit.videoId}`}
              className="line-clamp-1 text-xs font-medium text-t1 hover:text-brand"
            >
              {hit.videoTitle}
            </Link>
            <span className="num ml-auto shrink-0 text-[10px] text-t3">{percent(hit.score, 0)}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <Badge color={color} bg="var(--bg-subtle)">
              {hit.matchType}
            </Badge>
            <span className="num font-mono text-[10px] text-t3">
              {formatDuration(hit.start)} - {formatDuration(hit.end)}
            </span>
            <span className="text-[10px] text-t3">· 时长 {Math.round(hit.end - hit.start)} 秒</span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-t2">{hit.snippet}</p>

          <div className="mt-1.5 flex items-center gap-2">
            <button
              onClick={() => setExpand((v) => !v)}
              className="flex items-center gap-0.5 text-[10px] text-brand hover:underline"
            >
              命中依据 <ChevronDown size={10} className={cn('transition-transform', expand && 'rotate-180')} />
            </button>
            <div className="ml-auto flex items-center gap-1">
              <Button size="sm" variant="ghost" icon={<Scissors size={11} />} onClick={onClip}>
                剪辑
              </Button>
              <Button size="sm" variant="soft" icon={<Play size={11} />} onClick={onOpen}>
                定位播放
              </Button>
            </div>
          </div>
        </div>
      </div>

      {expand && (
        <div className="space-y-1 border-t border-line bg-subtle/40 px-3 py-2">
          {hit.reasons.map((r) => (
            <div key={r.type} className="flex gap-2 text-[10px] leading-4">
              <span className="w-16 shrink-0 text-t3">{r.type}</span>
              <span className="flex-1 text-t2">{r.content}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
