import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Scissors,
  Plus,
  Sparkles,
  Trash2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Download,
  Film,
  Clock,
  Wand2,
  Check,
  Loader2,
  Type,
  Music,
  Maximize,
} from 'lucide-react'
import type { EventItem, HighlightClip, ProjectItem, VideoItem } from '../types'
import { createProject, fetchAllVideos, fetchAnalysis, fetchProject, fetchProjects, fetchVideo, updateProject } from '../services'
import VideoPlayer from '../components/VideoPlayer'
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  Field,
  PageHeader,
  Progress,
  SectionTitle,
  Segmented,
  Select,
  Skeleton,
  StatusBadge,
  Switch,
  Textarea,
  toast,
} from '../components/ui'
import { cn, formatDate, formatDuration, relativeTime } from '../lib/utils'
import { usePlayer } from '../stores'

function clipsFromEvents(events: EventItem[]): HighlightClip[] {
  return [...events]
    .sort((a, b) => b.importance * 0.5 + b.confidence - (a.importance * 0.5 + a.confidence))
    .map((e, i) => ({
      id: `clip_${e.id}_${i}`,
      start: e.start,
      end: Math.min(e.end + 6, e.start + 24),
      score: Math.round((e.confidence * 0.7 + e.importance / 5 * 0.3) * 1000) / 1000,
      reason: `${e.type}｜${e.title}：${e.description.slice(0, 34)}`,
      thumbnailUrl: e.thumbnailUrl,
    }))
}

export default function Editing() {
  const { id } = useParams()
  const navigate = useNavigate()

  if (id) return <Editor key={id} id={id} />
  return <ProjectList onOpen={(pid) => navigate(`/editing/${pid}`)} />
}

function ProjectList({ onOpen }: { onOpen: (id: string) => void }) {
  const [list, setList] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [picked, setPicked] = useState('vid_003')
  const [name, setName] = useState('')

  useEffect(() => {
    fetchProjects().then((r) => {
      setList(r)
      setLoading(false)
    })
    fetchAllVideos().then((vs) => setVideos(vs.filter((v) => v.status === 'completed')))
  }, [])

  const create = async () => {
    const v = videos.find((x) => x.id === picked)
    if (!v) return
    const p = await createProject({
      name: name.trim() || `${v.title.slice(0, 12)} · 集锦`,
      videoId: v.id,
      coverUrl: v.coverUrl,
      duration: 0,
      clipCount: 0,
      status: '草稿',
    })
    setCreating(false)
    toast('项目已创建，正在生成推荐片段')
    onOpen(p.id)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="智能剪辑"
        desc="从长视频中自动挑选高光片段，按目标时长拼装为竖版或横版成片"
        extra={
          <Button variant="primary" icon={<Plus size={13} />} onClick={() => setCreating(true)}>
            新建项目
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px]" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-medium text-t1">我的项目</span>
            <span className="text-[11px] text-t3">共 {list.length} 个</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => (
              <Card key={p.id} hover className="group overflow-hidden">
                <button onClick={() => onOpen(p.id)} className="block w-full text-left">
                  <div className="relative aspect-video overflow-hidden bg-subtle">
                    <img
                      src={p.coverUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span
                      className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] text-white"
                      style={{
                        background:
                          p.status === '已完成' ? 'rgba(22,163,74,.85)' : p.status === '导出中' ? 'rgba(37,99,235,.85)' : 'rgba(0,0,0,.5)',
                      }}
                    >
                      {p.status}
                    </span>
                    <span className="num absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
                      {formatDuration(p.duration, true)}
                    </span>
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="rounded-full bg-white/95 p-2 text-[#111827]">
                        <Scissors size={15} />
                      </span>
                    </span>
                  </div>
                  <div className="p-2.5">
                    <div className="line-clamp-1 text-xs font-medium text-t1">{p.name}</div>
                    <div className="num mt-1 flex items-center gap-2 text-[10px] text-t3">
                      <span>{p.clipCount} 个片段</span>
                      <span>·</span>
                      <span>{formatDuration(p.duration)}</span>
                      <span className="ml-auto">{relativeTime(p.updatedAt)}</span>
                    </div>
                  </div>
                </button>
              </Card>
            ))}

            <button
              onClick={() => setCreating(true)}
              className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line-strong text-t3 transition-colors hover:border-brand hover:text-brand"
            >
              <Plus size={20} />
              <span className="text-xs">新建剪辑项目</span>
            </button>
          </div>
        </>
      )}

      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="新建剪辑项目"
        desc="选择源视频后，系统会自动生成一批候选高光片段"
        footer={
          <>
            <Button onClick={() => setCreating(false)}>取消</Button>
            <Button variant="primary" onClick={create}>
              创建并生成片段
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="项目名称">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="留空则使用视频标题"
              className="h-8 w-full rounded-ctl border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
            />
          </Field>
          <Field label="源视频" required hint="仅列出已完成解析的视频">
            <Select value={picked} onChange={(e) => setPicked(e.target.value)} className="w-full">
              {videos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}（{formatDuration(v.duration)}）
                </option>
              ))}
            </Select>
          </Field>
          <div className="rounded-ctl bg-subtle px-2.5 py-2 text-[10px] leading-4 text-t3">
            片段生成依据：事件显著度、语音情绪强度、画面质量与镜头完整性。生成后可逐条增删，也可调整顺序。
          </div>
        </div>
      </Dialog>
    </div>
  )
}

function Editor({ id }: { id: string }) {
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectItem | null>(null)
  const [video, setVideo] = useState<VideoItem | null>(null)
  const [clips, setClips] = useState<HighlightClip[]>([])
  const [used, setUsed] = useState<HighlightClip[]>([])
  const [target, setTarget] = useState('60')
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [expPct, setExpPct] = useState(0)
  const [ratio, setRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16')
  const [resolution, setResolution] = useState('1080p')
  const [subtitle, setSubtitle] = useState(true)
  const [bgm, setBgm] = useState('轻静钢琴')
  const [loading, setLoading] = useState(true)
  const seek = usePlayer((s) => s.seek)

  useEffect(() => {
    Promise.all([fetchProject(id), fetchProjects()]).then(async ([p]) => {
      if (!p) {
        setLoading(false)
        return
      }
      setProject(p)
      const v = await fetchVideo(p.videoId)
      setVideo(v ?? null)
      const a = await fetchAnalysis(p.videoId)
      const generated = a ? clipsFromEvents(a.events) : []
      setClips(generated)
      setUsed(generated.slice(0, Math.max(p.clipCount, 3)))
      setLoading(false)
    })
  }, [id])

  const total = useMemo(() => used.reduce((s, c) => s + (c.end - c.start), 0), [used])
  const targetSec = Number(target)

  const add = (c: HighlightClip) => {
    if (used.find((u) => u.id === c.id)) return
    setUsed((u) => [...u, c])
  }
  const remove = (cid: string) => setUsed((u) => u.filter((c) => c.id !== cid))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= used.length) return
    const next = [...used]
    ;[next[i], next[j]] = [next[j], next[i]]
    setUsed(next)
  }

  const doExport = () => {
    setExporting(true)
    setExpPct(0)
    const timer = window.setInterval(() => {
      setExpPct((p) => {
        if (p >= 100) {
          window.clearInterval(timer)
          setExporting(false)
          setExportOpen(false)
          updateProject(id, { status: '已完成', clipCount: used.length, duration: total })
          setProject((pr) => (pr ? { ...pr, status: '已完成', clipCount: used.length, duration: total } : pr))
          toast('成片已导出，可在项目列表中查看')
          return 100
        }
        return p + 3 + Math.random() * 5
      })
    }, 180)
  }

  if (loading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-[420px]" />
          <Skeleton className="h-[420px]" />
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6">
        <Card>
          <EmptyState
            title="项目不存在"
            desc="该项目可能已被删除，请返回列表重新创建。"
            action={<Button onClick={() => navigate('/editing')}>返回列表</Button>}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        title={project.name}
        desc={`源视频：${video?.title ?? '—'} · 更新于 ${formatDate(project.updatedAt)}`}
        back={
          <Link to="/editing" className="mt-1 rounded-ctl border border-line p-1.5 text-t2 hover:bg-hover">
            <ArrowLeft size={15} />
          </Link>
        }
        extra={
          <>
            <Button
              icon={<Sparkles size={13} />}
              onClick={() => {
                setClips((c) => [...c].sort(() => Math.random() - 0.5))
                toast('已重新生成候选片段', 'info')
              }}
            >
              重新生成
            </Button>
            <Button variant="primary" icon={<Download size={13} />} onClick={() => setExportOpen(true)}>
              导出成片
            </Button>
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {video && (
            <Card className="overflow-hidden p-0">
              <VideoPlayer video={video} />
            </Card>
          )}

          <Card className="p-3">
            <SectionTitle
              title="AI 推荐片段"
              desc={`根据事件显著度与画面质量排序，共 ${clips.length} 条`}
              extra={
                <Button
                  size="sm"
                  variant="soft"
                  icon={<Wand2 size={11} />}
                  onClick={() => {
                    let acc = 0
                    const picked: HighlightClip[] = []
                    for (const c of clips) {
                      if (acc >= targetSec) break
                      picked.push(c)
                      acc += c.end - c.start
                    }
                    setUsed(picked)
                    toast(`已按 ${targetSec} 秒目标自动拼装 ${picked.length} 个片段`)
                  }}
                >
                  按目标时长自动拼装
                </Button>
              }
            />
            <div className="space-y-1.5">
              {clips.map((c) => {
                const added = !!used.find((u) => u.id === c.id)
                return (
                  <div
                    key={c.id}
                    className={cn(
                      'flex items-center gap-2.5 rounded-ctl border p-1.5 transition-colors',
                      added ? 'border-brand/40 bg-brand-soft/40' : 'border-line hover:bg-hover',
                    )}
                  >
                    <button onClick={() => seek(c.start)} className="relative h-[52px] w-[92px] shrink-0 overflow-hidden rounded bg-subtle">
                      <img src={c.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                      <span className="absolute bottom-0.5 right-0.5 rounded bg-black/65 px-1 font-mono text-[8px] text-white">
                        {formatDuration(c.start)}
                      </span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="num text-[10px] font-medium text-brand">{Math.round(c.score * 100)}</span>
                        <span className="truncate text-[11px] text-t1">{c.reason}</span>
                      </div>
                      <div className="num mt-0.5 text-[10px] text-t3">
                        {formatDuration(c.start)} - {formatDuration(c.end)} · {Math.round(c.end - c.start)} 秒
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={added ? 'secondary' : 'soft'}
                      icon={added ? <Check size={11} /> : <Plus size={11} />}
                      onClick={() => (added ? remove(c.id) : add(c))}
                    >
                      {added ? '已加入' : '加入'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <Card className="p-3">
            <SectionTitle title="输出设置" />
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 text-[11px] text-t2">画面比例</div>
                <Segmented
                  value={ratio}
                  onChange={setRatio}
                  options={[
                    { value: '9:16', label: '9:16' },
                    { value: '16:9', label: '16:9' },
                    { value: '1:1', label: '1:1' },
                  ]}
                />
              </div>
              <Field label="分辨率">
                <Select value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full">
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                  <option value="4K">4K</option>
                </Select>
              </Field>
              <Field label="目标时长">
                <Select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full">
                  <option value="30">30 秒（短视频）</option>
                  <option value="60">60 秒（标准）</option>
                  <option value="90">90 秒（详细）</option>
                  <option value="180">180 秒（长版）</option>
                </Select>
              </Field>
              <Field label="背景音乐">
                <Select value={bgm} onChange={(e) => setBgm(e.target.value)} className="w-full">
                  <option>轻静钢琴</option>
                  <option>电子律动</option>
                  <option>无音乐（保留同期声）</option>
                </Select>
              </Field>
              <div className="flex items-center justify-between rounded-ctl border border-line px-2.5 py-2">
                <div className="flex items-center gap-1.5 text-[11px] text-t1">
                  <Type size={12} className="text-t3" /> 自动生成字幕
                </div>
                <Switch checked={subtitle} onChange={setSubtitle} size="sm" />
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <SectionTitle
              title="时间轴"
              desc={`${used.length} 个片段 · 共 ${formatDuration(total)}`}
              extra={
                used.length > 0 && (
                  <button onClick={() => setUsed([])} className="text-[10px] text-t3 hover:text-danger">
                    清空
                  </button>
                )
              }
            />
            <div className="mb-2">
              <Progress
                value={Math.min(100, (total / Math.max(1, targetSec)) * 100)}
                color={total > targetSec ? 'var(--warning)' : 'var(--brand)'}
                height={4}
                showLabel
              />
              <div className="mt-1 flex justify-between text-[10px] text-t3">
                <span>目标 {targetSec} 秒</span>
                <span className={total > targetSec ? 'text-warning' : ''}>
                  {total > targetSec ? `超出 ${total - targetSec} 秒` : `剩余 ${targetSec - total} 秒`}
                </span>
              </div>
            </div>

            {used.length === 0 ? (
              <div className="rounded-ctl border border-dashed border-line-strong py-6 text-center text-[11px] text-t3">
                还没有片段，从左侧推荐中点选加入
              </div>
            ) : (
              <div className="space-y-1.5">
                {used.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-1.5 rounded-ctl border border-line px-1.5 py-1">
                    <span className="num w-4 shrink-0 text-center text-[10px] text-t3">{i + 1}</span>
                    <img src={c.thumbnailUrl} alt="" className="h-7 w-12 shrink-0 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[10px] text-t1">{formatDuration(c.start)} 起</div>
                      <div className="num text-[9px] text-t3">{Math.round(c.end - c.start)} 秒</div>
                    </div>
                    <button onClick={() => move(i, -1)} className="rounded p-0.5 text-t3 hover:text-t1" disabled={i === 0}>
                      <ArrowUp size={11} className={i === 0 ? 'opacity-30' : ''} />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      className="rounded p-0.5 text-t3 hover:text-t1"
                      disabled={i === used.length - 1}
                    >
                      <ArrowDown size={11} className={i === used.length - 1 ? 'opacity-30' : ''} />
                    </button>
                    <button onClick={() => remove(c.id)} className="rounded p-0.5 text-t3 hover:text-danger">
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="primary"
              className="mt-3 w-full justify-center"
              icon={<Download size={13} />}
              disabled={used.length === 0}
              onClick={() => setExportOpen(true)}
            >
              导出 {ratio} · {resolution}
            </Button>
          </Card>

          <Card className="p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-t2">
              <Film size={11} /> 项目信息
            </div>
            <div className="space-y-1 text-[10px] text-t2">
              <div className="flex justify-between">
                <span className="text-t3">状态</span>
                <span>{project.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-t3">片段数</span>
                <span className="num">{used.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-t3">成片时长</span>
                <span className="num">{formatDuration(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-t3">更新时间</span>
                <span>{relativeTime(project.updatedAt)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog
        open={exportOpen}
        onClose={() => !exporting && setExportOpen(false)}
        title="导出成片"
        desc="演示环境仅模拟渲染与打包流程"
        width={520}
        footer={
          <>
            <Button onClick={() => setExportOpen(false)} disabled={exporting}>
              取消
            </Button>
            <Button variant="primary" loading={exporting} onClick={doExport}>
              开始导出
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {[
              { icon: Maximize, label: '画面', value: `${ratio} · ${resolution}` },
              { icon: Clock, label: '时长', value: formatDuration(total) },
              { icon: Type, label: '字幕', value: subtitle ? '自动生成' : '关闭' },
              { icon: Music, label: '音乐', value: bgm },
            ].map((r) => {
              const Icon = r.icon
              return (
                <div key={r.label} className="rounded-ctl border border-line px-2.5 py-2">
                  <div className="flex items-center gap-1 text-[10px] text-t3">
                    <Icon size={10} /> {r.label}
                  </div>
                  <div className="mt-0.5 text-t1">{r.value}</div>
                </div>
              )
            })}
          </div>

          <Field label="成片备注">
            <Textarea rows={2} placeholder="例如：用于抖音首发，片尾保留工坊招牌镜头" />
          </Field>

          {exporting && (
            <div className="rounded-ctl border border-line p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] text-t2">
                <Loader2 size={12} className="animate-spin text-brand" />
                正在渲染 {used.length} 个片段…
              </div>
              <Progress value={expPct} showLabel />
              <div className="mt-2 space-y-0.5 text-[10px] text-t3">
                <div className={expPct > 20 ? 'text-success' : ''}>· 片段拼接与转场</div>
                <div className={expPct > 55 ? 'text-success' : ''}>· 字幕对齐与样式渲染</div>
                <div className={expPct > 80 ? 'text-success' : ''}>· 编码与封装（H.264 / AAC）</div>
              </div>
            </div>
          )}

          {!exporting && (
            <div className="rounded-ctl bg-subtle px-2.5 py-2 text-[10px] leading-4 text-t3">
              导出完成后可在项目列表中下载 MP4 文件，同时会生成一版 SRT 字幕。
            </div>
          )}
        </div>
      </Dialog>
    </div>
  )
}
