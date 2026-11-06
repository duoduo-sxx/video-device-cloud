import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Sparkles,
  Download,
  RefreshCw,
  Columns2,
  Maximize2,
  MessageSquare,
  FileText,
  Boxes,
  BarChart3,
  ShieldCheck,
  MessagesSquare,
  Play,
  Cpu,
  Keyboard,
  Copy,
  Check,
} from 'lucide-react'
import type { AnalysisSummary, EntityItem, EventItem, PersonTrack, ReviewItem, SceneSegment, TranscriptSegment, VideoItem } from '../types'
import { fetchAnalysis, fetchVideo, reviewReviewsByVideo, updateVideo } from '../services'
import { pipelineTemplates } from '../mock/data'
import VideoPlayer from '../components/VideoPlayer'
import Timeline from '../components/Timeline'
import {
  ContentScorePanel,
  PipelineBar,
  EntityPanel,
  ReviewPanel,
  SummaryPanel,
  TranscriptPanel,
  VideoChat,
} from '../components/AnalysisPanels'
import {
  Badge,
  Button,
  Card,
  Dialog,
  Progress,
  Select,
  Skeleton,
  StatusBadge,
  Tooltip,
  toast,
} from '../components/ui'
import { cn, downloadText, formatDuration, formatTimecode } from '../lib/utils'
import { usePlayer } from '../stores'

interface AnalysisData {
  transcript: TranscriptSegment[]
  scenes: SceneSegment[]
  persons: PersonTrack[]
  events: EventItem[]
  entities: EntityItem[]
  summary: AnalysisSummary
}

type Stage = { name: string; status: 'waiting' | 'running' | 'done' | 'failed'; duration: number; detail: string }

const TABS = [
  { key: 'transcript', label: '转写', icon: MessageSquare },
  { key: 'summary', label: '摘要', icon: FileText },
  { key: 'entity', label: '实体', icon: Boxes },
  { key: 'score', label: '画面', icon: BarChart3 },
  { key: 'review', label: '审核', icon: ShieldCheck },
  { key: 'chat', label: '问答', icon: MessagesSquare },
]

export default function Analysis() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [video, setVideo] = useState<VideoItem | null>(null)
  const [data, setData] = useState<AnalysisData | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [tab, setTab] = useState('transcript')
  const [immersive, setImmersive] = useState(false)
  const [runOpen, setRunOpen] = useState(false)
  const [stages, setStages] = useState<Stage[]>([])
  const [running, setRunning] = useState(false)
  const [pct, setPct] = useState(0)
  const [model, setModel] = useState('Insight-MM 2.1')
  const [shortcutOpen, setShortcutOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)
  const seek = usePlayer((s) => s.seek)
  const toggle = usePlayer((s) => s.toggle)
  const currentTime = usePlayer((s) => s.currentTime)

  const initStages = useCallback(
    (done: boolean): Stage[] =>
      pipelineTemplates.map((p, i) => ({
        name: p.name,
        duration: p.duration,
        detail: p.detail,
        status: done ? 'done' : i === 0 ? 'running' : 'waiting',
      })),
    [],
  )

  useEffect(() => {
    let alive = true
    Promise.all([fetchVideo(id), fetchAnalysis(id), reviewReviewsByVideo(id)]).then(([v, a, r]) => {
      if (!alive) return
      setVideo(v ?? null)
      setData(a as AnalysisData | null)
      setReviews(r)
      const done = v?.status === 'completed'
      setStages(initStages(done))
      setPct(done ? 100 : (v?.progress ?? 0))
      if (v && (v.status === 'pending' || v.status === 'analyzing')) setRunOpen(true)
    })
    return () => {
      alive = false
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [id, initStages])

  const startRun = () => {
    setRunOpen(false)
    setRunning(true)
    setStages(initStages(false))
    setPct(0)
    let stageIdx = 0
    timer.current = window.setInterval(() => {
      setPct((p) => {
        const next = p + 2 + Math.random() * 3
        const stageProgress = Math.min(5, Math.floor(next / (100 / pipelineTemplates.length)))
        if (stageProgress > stageIdx) {
          stageIdx = stageProgress
          setStages((st) =>
            st.map((s, i) => ({
              ...s,
              status: i < stageIdx ? 'done' : i === stageIdx ? 'running' : 'waiting',
            })),
          )
        }
        if (next >= 100) {
          if (timer.current) window.clearInterval(timer.current)
          setRunning(false)
          setStages((st) => st.map((s) => ({ ...s, status: 'done' })))
          updateVideo(id, { status: 'completed', progress: 100, analyzedAt: new Date().toISOString() })
          setVideo((v) => (v ? { ...v, status: 'completed', progress: 100 } : v))
          toast('解析完成，已生成全部结构化结果')
          return 100
        }
        return next
      })
    }, 160)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return
      if (e.code === 'Space') {
        e.preventDefault()
        toggle()
      }
      if (e.key === '?') setShortcutOpen(true)
      const idx = Number(e.key)
      if (idx >= 1 && idx <= 6) setTab(TABS[idx - 1].key)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [toggle])

  const totalSpeech = useMemo(
    () => (data ? data.transcript.reduce((s, t) => s + (t.end - t.start), 0) : 0),
    [data],
  )

  if (!video) {
    return (
      <div className="flex h-full flex-col gap-3 p-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid flex-1 gap-3 lg:grid-cols-[1fr_400px]">
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
        </div>
      </div>
    )
  }

  const exportAll = () => {
    if (!data) return
    const payload = {
      video: { id: video.id, title: video.title, duration: video.duration },
      summary: data.summary,
      transcript: data.transcript,
      scenes: data.scenes,
      persons: data.persons,
      events: data.events,
      entities: data.entities,
      reviews,
    }
    downloadText(`${video.id}_analysis.json`, JSON.stringify(payload, null, 2), 'application/json')
    toast('解析结果已导出')
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-2">
        <Link to={`/videos/${video.id}`} className="rounded-ctl border border-line p-1.5 text-t2 hover:bg-hover">
          <ArrowLeft size={14} />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-medium text-t1">{video.title}</h1>
            <StatusBadge status={video.status} />
          </div>
          <div className="num mt-0.5 flex items-center gap-2 text-[10px] text-t3">
            <span>{formatDuration(video.duration, true)}</span>
            <span>·</span>
            <span>
              {video.width}×{video.height} / {video.fps}fps
            </span>
            {data && (
              <>
                <span>·</span>
                <span>{data.scenes.length} 镜头</span>
                <span>·</span>
                <span>{data.transcript.length} 句转写</span>
              </>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Select value={model} onChange={(e) => setModel(e.target.value)} className="h-7 w-[148px] text-[11px]">
            <option>Insight-MM 2.1</option>
            <option>Insight-MM 2.0</option>
            <option>Insight-MM Lite</option>
          </Select>
          <Button size="sm" icon={<RefreshCw size={12} />} disabled={running} onClick={() => setRunOpen(true)}>
            重新解析
          </Button>
          <Button size="sm" icon={<Download size={12} />} disabled={!data} onClick={exportAll}>
            导出
          </Button>
          <Button
            size="icon"
            variant="secondary"
            title={immersive ? '退出沉浸模式' : '沉浸模式'}
            onClick={() => setImmersive((v) => !v)}
          >
            {immersive ? <Columns2 size={13} /> : <Maximize2 size={13} />}
          </Button>
          <Button size="icon" variant="secondary" title="快捷键" onClick={() => setShortcutOpen(true)}>
            <Keyboard size={13} />
          </Button>
        </div>
      </div>

      <div className={cn('grid min-h-0 flex-1 gap-3 overflow-auto p-3', immersive ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1fr)_400px]')}>
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          <VideoPlayer video={video} scenes={data?.scenes} className="shrink-0" />

          {data ? (
            <Timeline
              duration={video.duration}
              transcript={data.transcript}
              scenes={data.scenes}
              persons={data.persons}
              events={data.events}
              reviews={reviews}
            />
          ) : (
            <Card className="p-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium text-t1">还没有解析结果</div>
                  <p className="mt-1 max-w-md text-xs leading-5 text-t3">
                    提交解析任务后，系统会完成抽帧采样、语音转写、文字识别、视觉理解与语义索引，并在时间轴上呈现六条分析轨道。
                  </p>
                </div>
                <Button variant="primary" icon={<Play size={13} />} onClick={() => setRunOpen(true)}>
                  提交解析任务
                </Button>
              </div>
            </Card>
          )}

          {data && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: '场景切分', value: `${data.scenes.length}`, hint: `${data.summary.stats.sceneCount} 个有效场景` },
                {
                  label: '语音占比',
                  value: `${Math.round((totalSpeech / Math.max(1, video.duration)) * 100)}%`,
                  hint: `${data.transcript.length} 句 · ${data.summary.stats.speakerCount} 人`,
                },
                {
                  label: '识别实体',
                  value: `${data.entities.length}`,
                  hint: `${new Set(data.entities.map((e) => e.type)).size} 个类型`,
                },
                {
                  label: '风险片段',
                  value: `${reviews.length}`,
                  hint: reviews.length ? `${reviews.filter((r) => r.level === '高').length} 条高风险` : '未检测到违规',
                },
              ].map((s) => (
                <Card key={s.label} className="px-3 py-2">
                  <div className="text-[10px] text-t3">{s.label}</div>
                  <div className="num mt-0.5 text-lg font-medium text-t1">{s.value}</div>
                  <div className="mt-0.5 truncate text-[10px] text-t3">{s.hint}</div>
                </Card>
              ))}
            </div>
          )}

          {data && (
            <Card className="p-0">
              <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
                <span className="text-[11px] font-medium text-t2">解析结果</span>
                <button
                  onClick={() => {
                    const text = JSON.stringify({ summary: data.summary, transcript: data.transcript }, null, 2)
                    navigator.clipboard?.writeText(text).then(
                      () => {
                        setCopied(true)
                        setTimeout(() => setCopied(false), 1600)
                      },
                      () => toast('当前环境不支持剪贴板', 'error'),
                    )
                  }}
                  className="flex items-center gap-1 text-[10px] text-t3 hover:text-t1"
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? '已复制' : '复制结构化数据'}
                </button>
              </div>
              <pre className="max-h-[200px] overflow-auto px-3 py-2 font-mono text-[10px] leading-5 text-t2">
{JSON.stringify(
  {
    oneLiner: data.summary.oneLiner,
    keywords: data.summary.keywords,
    chapters: data.summary.chapters.map((c) => `${formatDuration(c.start)}  ${c.title}`),
    stats: data.summary.stats,
  },
  null,
  2,
)}
              </pre>
            </Card>
          )}
        </div>

        {!immersive && (
          <Card className="flex min-h-[540px] flex-col overflow-hidden p-0">
            <div className="flex items-center gap-0.5 overflow-x-auto border-b border-line px-1.5 py-1 no-scrollbar">
              {TABS.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      'flex shrink-0 items-center gap-1 rounded-ctl px-2 py-1 text-[11px] transition-colors',
                      tab === t.key ? 'bg-brand-soft font-medium text-brand' : 'text-t2 hover:bg-hover hover:text-t1',
                    )}
                  >
                    <Icon size={12} />
                    {t.label}
                  </button>
                )
              })}
              {tab === 'review' && reviews.length > 0 && (
                <Badge className="ml-auto shrink-0" color="var(--danger)" bg="rgba(220,38,38,.1)">
                  {reviews.length}
                </Badge>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {!data ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                  <Cpu size={20} className="text-t3" />
                  <p className="text-xs text-t3">解析完成后可查看转写、摘要与实体</p>
                </div>
              ) : tab === 'transcript' ? (
                <TranscriptPanel transcript={data.transcript} />
              ) : tab === 'summary' ? (
                <div className="h-full overflow-y-auto">
                  <SummaryPanel summary={data.summary} />
                </div>
              ) : tab === 'entity' ? (
                <div className="h-full overflow-y-auto">
                  <EntityPanel entities={data.entities} />
                </div>
              ) : tab === 'score' ? (
                <div className="h-full overflow-y-auto">
                  <ContentScorePanel summary={data.summary} scenes={data.scenes} />
                </div>
              ) : tab === 'review' ? (
                <div className="h-full overflow-y-auto">
                  <ReviewPanel reviews={reviews} />
                </div>
              ) : (
                <VideoChat transcript={data.transcript} />
              )}
            </div>
          </Card>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-line bg-surface pr-3">
        <div className="min-w-0 flex-1">
          <PipelineBar stages={stages} />
        </div>
        {running ? (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[10px] text-t3">解析中</span>
            <Progress value={pct} height={4} className="w-24" showLabel />
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-3 text-[10px] text-t3">
            <span>
              模型 <span className="text-t2">{model}</span>
            </span>
            <span>
              耗时 <span className="num text-t2">{video.analysisCost ? formatDuration(video.analysisCost) : '—'}</span>
            </span>
            <span className="num">
              <Tooltip content="当前播放位置">
                <span className="font-mono text-t2">{formatTimecode(currentTime)}</span>
              </Tooltip>
            </span>
          </div>
        )}
      </div>

      <Dialog
        open={runOpen}
        onClose={() => setRunOpen(false)}
        title="提交解析任务"
        desc="选择模型与解析范围，任务会在本地虚拟流水线中执行"
        width={560}
        footer={
          <>
            <Button onClick={() => setRunOpen(false)}>取消</Button>
            <Button variant="primary" onClick={startRun}>
              开始解析
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-[11px] text-t2">解析模型</div>
              <Select value={model} onChange={(e) => setModel(e.target.value)} className="w-full">
                <option>Insight-MM 2.1</option>
                <option>Insight-MM 2.0</option>
                <option>Insight-MM Lite</option>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-[11px] text-t2">抽帧密度</div>
              <Select defaultValue="1" className="w-full">
                <option value="1">1 fps（推荐）</option>
                <option value="2">2 fps（高精度）</option>
                <option value="0.5">0.5 fps（快速）</option>
              </Select>
            </div>
          </div>
          <div className="rounded-card border border-line p-2.5">
            <div className="mb-2 text-[11px] text-t2">能力项</div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-t2">
              {['语音转写与说话人分离', '画面文字识别', '场景切分与景别判定', '人物检测与轨迹', '事件抽取与摘要', '违规内容审核'].map(
                (c) => (
                  <div key={c} className="flex items-center gap-1.5">
                    <Check size={11} className="text-success" /> {c}
                  </div>
                ),
              )}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-card border border-line px-2.5 py-2">
            <span className="text-[11px] text-t2">预计耗时</span>
            <span className="num text-xs text-t1">{formatDuration(Math.round(video.duration / 24))}</span>
          </div>
          <p className="text-[10px] leading-4 text-t3">
            演示环境中流水线为模拟执行，用于呈现各阶段的耗时与产物；实际部署时会调用本地推理服务。
          </p>
        </div>
      </Dialog>

      <Dialog open={shortcutOpen} onClose={() => setShortcutOpen(false)} title="快捷键" width={440}>
        <div className="space-y-1.5 text-[11px]">
          {[
            ['空格', '播放 / 暂停'],
            ['← / →', '后退 / 前进 5 秒'],
            ['1 - 6', '切换右侧面板'],
            ['?', '打开快捷键说明'],
            ['Esc', '关闭弹窗'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-line/60 py-1.5 last:border-0">
              <span className="text-t2">{v}</span>
              <kbd className="rounded border border-line bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-t1">{k}</kbd>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  )
}
