import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Sparkles,
  Play,
  ShieldAlert,
  RefreshCw,
  Download,
  Trash2,
  Film,
  Clock,
  Users,
  Zap,
  MessageSquare,
  Layers,
  MapPin,
  Copyright,
  Calendar,
  HardDrive,
  type LucideIcon,
} from 'lucide-react'
import type { AnalysisSummary, ReviewItem, SceneSegment, VideoItem } from '../types'
import { fetchAnalysis, fetchVideo, fetchAllVideos, reviewReviewsByVideo, updateVideo } from '../services'
import VideoPlayer from '../components/VideoPlayer'
import {
  Badge,
  Button,
  Card,
  ConfidenceBar,
  Dialog,
  EmptyState,
  PageHeader,
  Progress,
  SectionTitle,
  Skeleton,
  StatusBadge,
  toast,
} from '../components/ui'
import { cn, formatDate, formatDuration, formatFileSize, formatNumber, relativeTime } from '../lib/utils'

const META_FIELDS: { key: keyof VideoItem; label: string; icon: LucideIcon }[] = [
  { key: 'duration', label: '时长', icon: Clock },
  { key: 'fileSize', label: '文件大小', icon: HardDrive },
  { key: 'uploadedAt', label: '上传时间', icon: Calendar },
  { key: 'location', label: '拍摄地点', icon: MapPin },
  { key: 'copyright', label: '版权归属', icon: Copyright },
]

export default function VideoDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [video, setVideo] = useState<VideoItem | null>(null)
  const [analysis, setAnalysis] = useState<{
    transcript: { id: string }[]
    scenes: SceneSegment[]
    persons: { id: string }[]
    events: { id: string }[]
    summary: AnalysisSummary
  } | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [all, setAll] = useState<VideoItem[]>([])
  const [reanalyze, setReanalyze] = useState(false)
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    fetchVideo(id).then((v) => setVideo(v ?? null))
    reviewReviewsByVideo(id).then(setReviews)
    fetchAllVideos().then(setAll)
    fetchAnalysis(id).then((a) => setAnalysis(a))
  }, [id])

  const similar = useMemo(
    () => all.filter((v) => v.id !== id && v.category === video?.category).slice(0, 4),
    [all, id, video],
  )

  const startReanalyze = () => {
    setReanalyze(false)
    setRunning(true)
    setProgress(0)
    const timer = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          window.clearInterval(timer)
          setRunning(false)
          toast('重新解析完成，结果已更新')
          updateVideo(id, { status: 'completed', progress: 100, analyzedAt: new Date().toISOString() })
          setVideo((v) => (v ? { ...v, status: 'completed', progress: 100 } : v))
          return 100
        }
        return p + 4 + Math.random() * 6
      })
    }, 220)
  }

  if (!video) {
    return (
      <div className="p-6">
        <Skeleton className="mb-4 h-8 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="aspect-video lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  const s = analysis?.summary

  return (
    <div className="p-6">
      <PageHeader
        title={video.title}
        desc={video.description}
        back={
          <Link to="/videos" className="mt-1 rounded-ctl border border-line p-1.5 text-t2 hover:bg-hover">
            <ArrowLeft size={15} />
          </Link>
        }
        extra={
          <>
            <Button icon={<RefreshCw size={13} />} onClick={() => setReanalyze(true)}>
              重新解析
            </Button>
            <Button
              variant="primary"
              icon={<Sparkles size={13} />}
              onClick={() => navigate(`/videos/${video.id}/analysis`)}
            >
              打开解析工作台
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="overflow-hidden p-0">
            <VideoPlayer video={video} scenes={analysis?.scenes} />
            <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2">
              <StatusBadge status={video.status} />
              {running ? (
                <div className="flex flex-1 items-center gap-2">
                  <Progress value={progress} height={4} className="max-w-[200px]" />
                  <span className="text-[11px] text-t3">正在重新解析…</span>
                </div>
              ) : (
                <>
                  <span className="num text-[11px] text-t3">
                    {video.width}×{video.height} · {video.fps}fps · {(video.bitrate / 1000).toFixed(1)} Mbps ·{' '}
                    {video.format.toUpperCase()}
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Download size={12} />}
                      onClick={() => toast('解析结果已导出为 JSON', 'success')}
                    >
                      导出结果
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 size={12} />}
                      onClick={() => toast('演示环境不执行真实删除', 'info')}
                    >
                      删除
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle title="视频信息" desc="接入时自动提取的元数据" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {META_FIELDS.map((f) => {
                const Icon = f.icon
                const raw = video[f.key]
                const value =
                  f.key === 'duration'
                    ? formatDuration(video.duration, true)
                    : f.key === 'fileSize'
                      ? formatFileSize(video.fileSize)
                      : f.key === 'uploadedAt'
                        ? formatDate(video.uploadedAt)
                        : String(raw ?? '—')
                return (
                  <div key={f.key}>
                    <div className="flex items-center gap-1 text-[10px] text-t3">
                      <Icon size={10} /> {f.label}
                    </div>
                    <div className="num mt-0.5 truncate text-xs text-t1">{value}</div>
                  </div>
                )
              })}
              <div>
                <div className="text-[10px] text-t3">题材分类</div>
                <div className="mt-0.5">
                  <Badge>{video.category}</Badge>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-t3">接入来源</div>
                <div className="mt-0.5 text-xs text-t1">{video.source}</div>
              </div>
              <div>
                <div className="text-[10px] text-t3">所属空间</div>
                <div className="mt-0.5 text-xs text-t1">
                  {video.spaceId === 'sp_news' ? '新闻中心' : video.spaceId === 'sp_brand' ? '品牌空间' : '教育培训'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-t3">上传者</div>
                <div className="mt-0.5 text-xs text-t1">{video.uploaderName}</div>
              </div>
              <div>
                <div className="text-[10px] text-t3">播放次数</div>
                <div className="num mt-0.5 text-xs text-t1">{formatNumber(video.playCount)}</div>
              </div>
              <div>
                <div className="text-[10px] text-t3">解析耗时</div>
                <div className="num mt-0.5 text-xs text-t1">
                  {video.analysisCost ? formatDuration(video.analysisCost) : '—'}
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <div className="mb-1.5 text-[10px] text-t3">内容标签</div>
              <div className="flex flex-wrap gap-1.5">
                {video.tags.map((t) => (
                  <Link
                    key={t}
                    to={`/videos?tag=${encodeURIComponent(t)}`}
                    className="rounded-full bg-subtle px-2 py-0.5 text-[11px] text-t2 hover:text-brand"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle
              title="场景切分"
              desc={analysis ? `共 ${analysis.scenes.length} 个镜头，按时间顺序排列` : '尚未解析'}
              extra={
                analysis && (
                  <Link to={`/videos/${video.id}/analysis`} className="text-[11px] text-brand hover:underline">
                    在时间轴中查看
                  </Link>
                )
              }
            />
            {analysis ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {analysis.scenes.slice(0, 9).map((sc) => (
                  <Link
                    key={sc.id}
                    to={`/videos/${video.id}/analysis`}
                    className="group overflow-hidden rounded-ctl border border-line"
                  >
                    <div className="relative aspect-video bg-subtle">
                      <img
                        src={sc.thumbnailUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 font-mono text-[9px] text-white">
                        {formatDuration(sc.start)}
                      </span>
                      <span className="absolute left-1 top-1 rounded bg-black/55 px-1 text-[9px] text-white/85">
                        #{sc.index} {sc.shotType}
                      </span>
                    </div>
                    <div className="line-clamp-2 px-1.5 py-1 text-[10px] leading-4 text-t2">{sc.description}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Layers size={18} />}
                title="该视频还没有解析结果"
                desc="提交解析任务后，这里会展示镜头切分、场景描述与画面质量评分。"
                action={
                  <Button variant="primary" size="sm" onClick={() => navigate(`/videos/${video.id}/analysis`)}>
                    去解析
                  </Button>
                }
              />
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {s ? (
            <Card className="p-4">
              <SectionTitle title="解析概览" desc={`解析于 ${relativeTime(video.analyzedAt ?? video.uploadedAt)}`} />
              <div className="rounded-ctl border border-ai/25 bg-ai/[0.04] p-2.5">
                <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-ai">
                  <Sparkles size={11} /> 一句话摘要
                </div>
                <p className="text-[11px] leading-5 text-t1">{s.oneLiner}</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  { icon: Film, label: '场景', value: analysis?.scenes.length ?? 0 },
                  { icon: MessageSquare, label: '转写句', value: analysis?.transcript.length ?? 0 },
                  { icon: Users, label: '人物', value: analysis?.persons.length ?? 0 },
                  { icon: Zap, label: '事件', value: analysis?.events.length ?? 0 },
                ].map((m) => {
                  const Icon = m.icon
                  return (
                    <div key={m.label} className="rounded-ctl border border-line px-2 py-1.5">
                      <div className="flex items-center gap-1 text-[10px] text-t3">
                        <Icon size={10} /> {m.label}
                      </div>
                      <div className="num mt-0.5 text-base font-medium text-t1">{m.value}</div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-t2">画面综合评分</span>
                  <span className="num text-t1">
                    {Math.round(
                      (s.quality.composition + s.quality.lighting + s.quality.color + s.quality.clarity + s.quality.stability) / 5,
                    )}
                  </span>
                </div>
                {[
                  { label: '构图', v: s.quality.composition },
                  { label: '光照', v: s.quality.lighting },
                  { label: '色彩', v: s.quality.color },
                  { label: '清晰度', v: s.quality.clarity },
                  { label: '稳定性', v: s.quality.stability },
                ].map((q) => (
                  <div key={q.label} className="mb-1 flex items-center gap-2">
                    <span className="w-10 shrink-0 text-[10px] text-t3">{q.label}</span>
                    <Progress value={q.v} height={3} className="flex-1" />
                    <span className="num w-6 text-right text-[10px] text-t2">{q.v}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 border-t border-line pt-2.5">
                <div className="mb-1.5 text-[11px] text-t2">自动章节</div>
                <div className="space-y-0.5">
                  {s.chapters.slice(0, 5).map((c) => (
                    <Link
                      key={c.title}
                      to={`/videos/${video.id}/analysis`}
                      className="flex items-center gap-1.5 rounded px-1 py-1 text-[10px] text-t2 hover:bg-hover hover:text-t1"
                    >
                      <span className="num w-9 shrink-0 font-mono text-t3">{formatDuration(c.start)}</span>
                      <span className="truncate">{c.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4">
              <SectionTitle title="解析状态" />
              <div className="py-3 text-center">
                <div className="mb-2 text-xs text-t2">
                  {video.status === 'analyzing' ? '正在解析中' : video.status === 'failed' ? '解析失败' : '尚未提交解析'}
                </div>
                <Progress value={video.progress} showLabel />
                <p className="mt-2 text-[10px] leading-4 text-t3">
                  {video.status === 'failed'
                    ? '失败原因：源文件时长超过单任务上限（2 小时），建议分段后重试。'
                    : '可提交多模态解析任务，自动完成转写、场景切分与语义索引。'}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  icon={<Play size={12} />}
                  onClick={() => navigate(`/videos/${video.id}/analysis`)}
                >
                  进入解析工作台
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <SectionTitle
              title="审核记录"
              desc={`共 ${reviews.length} 条`}
              extra={
                <Link to="/review" className="text-[11px] text-brand hover:underline">
                  审核台
                </Link>
              }
            />
            {reviews.length === 0 ? (
              <div className="flex items-center gap-2 rounded-ctl bg-success/5 px-2.5 py-2 text-[11px] text-success">
                <ShieldAlert size={12} /> 未检测到违规片段
              </div>
            ) : (
              <div className="space-y-2">
                {reviews.slice(0, 4).map((r) => (
                  <Link
                    key={r.id}
                    to={`/review/${r.id}`}
                    className="block rounded-ctl border border-line p-2 transition-colors hover:bg-hover"
                  >
                    <div className="flex items-center gap-1.5">
                      <Badge
                        color={r.level === '高' ? 'var(--danger)' : r.level === '中' ? 'var(--warning)' : 'var(--info)'}
                        bg={r.level === '高' ? 'rgba(220,38,38,.1)' : r.level === '中' ? 'rgba(217,119,6,.1)' : 'rgba(8,145,178,.1)'}
                      >
                        {r.category}
                      </Badge>
                      <span className="num font-mono text-[10px] text-t3">{formatDuration(r.start)}</span>
                      <span className="ml-auto text-[10px] text-t3">
                        {r.status === 'pending' ? '待审' : r.status === 'passed' ? '已通过' : r.status === 'rejected' ? '已驳回' : '存疑'}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-t2">{r.description}</p>
                    <div className="mt-1">
                      <ConfidenceBar value={r.confidence} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <SectionTitle title="同题材视频" desc={`${video.category} · 其他素材`} />
            <div className="space-y-2">
              {similar.length === 0 && <div className="py-4 text-center text-[11px] text-t3">暂无同题材视频</div>}
              {similar.map((v) => (
                <Link key={v.id} to={`/videos/${v.id}`} className="flex gap-2 rounded-ctl p-1 hover:bg-hover">
                  <div className="relative h-10 w-[70px] shrink-0 overflow-hidden rounded bg-subtle">
                    <img src={v.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-[11px] text-t1">{v.title}</div>
                    <div className="num mt-0.5 text-[10px] text-t3">{formatDuration(v.duration)} · {v.uploaderName}</div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Dialog
        open={reanalyze}
        onClose={() => setReanalyze(false)}
        title="重新解析该视频"
        desc="将使用当前最新的模型版本重新执行全部解析环节"
        footer={
          <>
            <Button onClick={() => setReanalyze(false)}>取消</Button>
            <Button variant="primary" onClick={startReanalyze}>
              开始解析
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-[11px] text-t2">
          <div className="flex items-center justify-between rounded-ctl border border-line px-2.5 py-2">
            <span>解析模型</span>
            <span className="text-t1">Insight-MM 2.1</span>
          </div>
          <div className="flex items-center justify-between rounded-ctl border border-line px-2.5 py-2">
            <span>抽帧密度</span>
            <span className="text-t1">1 fps（关键帧自适应）</span>
          </div>
          <div className="flex items-center justify-between rounded-ctl border border-line px-2.5 py-2">
            <span>预计耗时</span>
            <span className="num text-t1">{formatDuration(Math.round(video.duration / 22))}</span>
          </div>
          <div className={cn('rounded-ctl px-2.5 py-2', 'bg-warning/5 text-warning')}>
            重新解析会覆盖现有结果，已人工修正的实体与审核结论将保留。
          </div>
        </div>
      </Dialog>
    </div>
  )
}
