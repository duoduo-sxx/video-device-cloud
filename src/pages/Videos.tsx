import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Upload,
  Grid2X2,
  List,
  Trash2,
  Film,
  CheckSquare,
  Square,
  Link2,
  Radio,
  Plug,
  HardDrive,
  Info,
  X,
  FileVideo,
  Sparkles,
} from 'lucide-react'
import type { VideoCategory, VideoItem, VideoStatus } from '../types'
import { addVideos, deleteVideos, fetchAllVideos, fetchVideos } from '../services'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  EmptyState,
  Field,
  Pagination,
  PageHeader,
  Progress,
  SearchInput,
  Segmented,
  Select,
  SkeletonTable,
  StatusBadge,
  Switch,
  TagInput,
  toast,
} from '../components/ui'
import { CATEGORY_LIST, DURATION_RANGES } from '../constants'
import { cn, formatDuration, formatFileSize, formatNumber, relativeTime } from '../lib/utils'

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'completed', label: '已完成' },
  { key: 'analyzing', label: '解析中' },
  { key: 'pending', label: '待解析' },
  { key: 'failed', label: '失败' },
]

const SORTS = [
  { value: 'uploadedAt', label: '上传时间' },
  { value: 'duration', label: '时长' },
  { value: 'playCount', label: '播放量' },
  { value: 'progress', label: '解析进度' },
  { value: 'title', label: '标题' },
]

export default function Videos() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [list, setList] = useState<VideoItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [selected, setSelected] = useState<string[]>([])
  const [uploadOpen, setUploadOpen] = useState(params.get('upload') === '1')
  const [confirmDel, setConfirmDel] = useState(false)

  const [q, setQ] = useState(params.get('q') ?? '')
  const [status, setStatus] = useState(params.get('status') ?? 'all')
  const [category, setCategory] = useState(params.get('category') ?? 'all')
  const [duration, setDuration] = useState('all')
  const [sort, setSort] = useState('uploadedAt')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const tag = params.get('tag') ?? ''

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetchVideos({ keyword: q, status, category, duration, sort, order, page, pageSize, tag })
    setList(res.list)
    setTotal(res.total)
    setLoading(false)
  }, [q, status, category, duration, sort, order, page, pageSize, tag])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (params.get('upload') === '1') {
      setUploadOpen(true)
      const next = new URLSearchParams(params)
      next.delete('upload')
      setParams(next, { replace: true })
    }
  }, [params, setParams])

  const allChecked = list.length > 0 && selected.length === list.length

  const toggleAll = () => setSelected(allChecked ? [] : list.map((v) => v.id))
  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const resetFilters = () => {
    setQ('')
    setStatus('all')
    setCategory('all')
    setDuration('all')
    setSort('uploadedAt')
    setOrder('desc')
    setPage(1)
    const next = new URLSearchParams(params)
    next.delete('tag')
    setParams(next, { replace: true })
  }

  const doDelete = async () => {
    await deleteVideos(selected)
    toast(`已删除 ${selected.length} 个视频`)
    setSelected([])
    setConfirmDel(false)
    load()
  }

  const stats = useMemo(() => {
    const byStatus = (s: VideoStatus) => list.filter((v) => v.status === s).length
    return {
      completed: byStatus('completed'),
      analyzing: byStatus('analyzing'),
      pending: byStatus('pending'),
      failed: byStatus('failed'),
    }
  }, [list])

  return (
    <div className="p-6">
      <PageHeader
        title="视频资产库"
        desc="统一管理接入的视频素材，支持批量解析、标签治理与空间隔离"
        extra={
          <>
            <Button icon={<Sparkles size={13} />} onClick={() => navigate('/search')}>
              以内容找视频
            </Button>
            <Button variant="primary" icon={<Upload size={13} />} onClick={() => setUploadOpen(true)}>
              上传视频
            </Button>
          </>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          { label: '已完成解析', value: stats.completed, color: 'var(--success)' },
          { label: '解析中', value: stats.analyzing, color: 'var(--brand)' },
          { label: '待解析', value: stats.pending, color: 'var(--text-tertiary)' },
          { label: '解析失败', value: stats.failed, color: 'var(--danger)' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center justify-between px-3 py-2.5">
            <span className="text-xs text-t2">{s.label}</span>
            <span className="num text-lg font-medium" style={{ color: s.color }}>
              {s.value}
            </span>
          </Card>
        ))}
      </div>

      <Card className="mb-3 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v)
              setPage(1)
            }}
            placeholder="搜索标题、简介或标签…"
            className="w-[260px]"
          />
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setStatus(t.key)
                  setPage(1)
                }}
                className={cn(
                  'whitespace-nowrap rounded-full px-2.5 py-1 text-xs transition-colors',
                  status === t.key
                    ? 'bg-brand-soft font-medium text-brand'
                    : 'text-t2 hover:bg-hover hover:text-t1',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(1)
              }}
              className="w-[104px]"
            >
              <option value="all">全部题材</option>
              {CATEGORY_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value)
                setPage(1)
              }}
              className="w-[112px]"
            >
              <option value="all">全部时长</option>
              {DURATION_RANGES.map((d) => (
                <option key={d.label} value={`${d.min}-${d.max}`}>
                  {d.label}
                </option>
              ))}
            </Select>
            <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-[104px]">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  按{s.label}
                </option>
              ))}
            </Select>
            <Button
              size="icon"
              variant="secondary"
              title={order === 'desc' ? '降序' : '升序'}
              onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
            >
              <span className="text-[11px] text-t2">{order === 'desc' ? '↓' : '↑'}</span>
            </Button>
            <div className="h-5 w-px bg-line" />
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'grid', label: <Grid2X2 size={13} /> },
                { value: 'table', label: <List size={13} /> },
              ]}
            />
          </div>
        </div>

        {(tag || q || status !== 'all' || category !== 'all' || duration !== 'all') && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-line pt-2.5">
            <span className="text-[11px] text-t3">当前筛选：</span>
            {tag && (
              <button
                onClick={() => {
                  const next = new URLSearchParams(params)
                  next.delete('tag')
                  setParams(next, { replace: true })
                }}
                className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] text-brand"
              >
                标签「{tag}」 <X size={10} />
              </button>
            )}
            {q && <Badge color="var(--brand)" bg="var(--brand-soft)">关键词「{q}」</Badge>}
            {status !== 'all' && <Badge>状态：{STATUS_TABS.find((t) => t.key === status)?.label}</Badge>}
            {category !== 'all' && <Badge>题材：{category}</Badge>}
            {duration !== 'all' && <Badge>时长已限定</Badge>}
            <button onClick={resetFilters} className="ml-1 text-[11px] text-t3 underline hover:text-t1">
              清空
            </button>
          </div>
        )}
      </Card>

      {selected.length > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-ctl border border-brand/30 bg-brand-soft px-3 py-2">
          <span className="text-xs text-brand">
            已选择 <span className="num font-medium">{selected.length}</span> 项
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" icon={<Sparkles size={12} />} onClick={() => toast('已将选中视频加入解析队列', 'info')}>
              批量解析
            </Button>
            <Button size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={() => setConfirmDel(true)}>
              删除
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
              取消选择
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={6} />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Film size={20} />}
            title="没有符合条件的视频"
            desc="调整筛选条件，或上传新的视频素材开始解析。"
            action={
              <div className="flex gap-2">
                <Button onClick={resetFilters}>清空筛选</Button>
                <Button variant="primary" icon={<Upload size={13} />} onClick={() => setUploadOpen(true)}>
                  上传视频
                </Button>
              </div>
            }
          />
        </Card>
      ) : view === 'grid' ? (
        <>
          <div className="mb-2 flex items-center gap-2 px-1">
            <button onClick={toggleAll} className="flex items-center gap-1.5 text-[11px] text-t3 hover:text-t1">
              {allChecked ? <CheckSquare size={13} className="text-brand" /> : <Square size={13} />}
              全选本页
            </button>
            <span className="text-[11px] text-t3">共 {total} 个视频</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {list.map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                checked={selected.includes(v.id)}
                onCheck={() => toggleOne(v.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <VideoTable list={list} selected={selected} onToggle={toggleOne} onToggleAll={toggleAll} allChecked={allChecked} />
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPage={setPage}
        onPageSize={(s) => {
          setPageSize(s)
          setPage(1)
        }}
      />

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onDone={async (items, autoAnalyzeId) => {
          setUploadOpen(false)
          await load()
          if (autoAnalyzeId) navigate(`/videos/${autoAnalyzeId}/analysis`)
          else toast(`已导入 ${items} 个视频`)
        }}
      />

      <Dialog
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        title="确认删除视频"
        desc={`将删除 ${selected.length} 个视频及其解析结果，该操作不可撤销。`}
        footer={
          <>
            <Button onClick={() => setConfirmDel(false)}>取消</Button>
            <Button variant="danger" onClick={doDelete}>
              确认删除
            </Button>
          </>
        }
      >
        <div className="rounded-ctl border border-danger/25 bg-danger/5 p-3">
          <div className="flex items-start gap-2 text-xs leading-5 text-t2">
            <Info size={14} className="mt-0.5 shrink-0 text-danger" />
            <div>
              删除后，关联的转写文本、场景切分、实体索引与审核记录会一并移除。如果只是需要释放存储空间，建议先导出解析结果为 JSON。
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

function VideoCard({
  video,
  checked,
  onCheck,
}: {
  video: VideoItem
  checked: boolean
  onCheck: () => void
}) {
  return (
    <Card className="group overflow-hidden transition-colors hover:border-line-strong" hover>
      <div className="relative aspect-video overflow-hidden bg-subtle">
        <img
          src={video.coverUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <button
          onClick={onCheck}
          className={cn(
            'absolute right-2 top-2 rounded-md p-1 backdrop-blur transition-opacity',
            checked ? 'bg-brand text-white' : 'bg-black/35 text-white/80 opacity-0 group-hover:opacity-100',
          )}
        >
          {checked ? <CheckSquare size={13} /> : <Square size={13} />}
        </button>
        <div className="absolute left-2 top-2 flex items-center gap-1.5">
          <StatusBadge status={video.status} />
          {video.source !== '本地上传' && (
            <span className="rounded bg-black/45 px-1.5 py-0.5 text-[10px] text-white/80">{video.source}</span>
          )}
        </div>
        <div className="absolute bottom-2 right-2 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] text-white/90">
          {formatDuration(video.duration, true)}
        </div>
        {video.status === 'analyzing' && (
          <div className="absolute inset-x-0 bottom-0 px-0">
            <Progress value={video.progress} height={3} color="var(--brand)" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Link
            to={`/videos/${video.id}/analysis`}
            className="rounded-ctl bg-white/95 px-2.5 py-1 text-[11px] font-medium text-[#111827] hover:bg-white"
          >
            打开解析
          </Link>
          <Link
            to={`/videos/${video.id}`}
            className="rounded-ctl bg-black/50 px-2.5 py-1 text-[11px] text-white backdrop-blur hover:bg-black/65"
          >
            详情
          </Link>
        </div>
      </div>

      <div className="p-2.5">
        <Link to={`/videos/${video.id}`} className="line-clamp-1 text-xs font-medium text-t1 hover:text-brand">
          {video.title}
        </Link>
        <p className="mt-1 line-clamp-2 h-8 text-[11px] leading-4 text-t3">{video.description}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {video.tags.slice(0, 3).map((t) => (
            <Link
              key={t}
              to={`/videos?tag=${encodeURIComponent(t)}`}
              className="rounded bg-subtle px-1.5 py-0.5 text-[10px] text-t2 hover:text-brand"
            >
              {t}
            </Link>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-[10px] text-t3">
          <span className="truncate">
            {video.category} · {video.uploaderName}
          </span>
          <span className="shrink-0">{relativeTime(video.uploadedAt)}</span>
        </div>
      </div>
    </Card>
  )
}

function VideoTable({
  list,
  selected,
  onToggle,
  onToggleAll,
  allChecked,
}: {
  list: VideoItem[]
  selected: string[]
  onToggle: (id: string) => void
  onToggleAll: () => void
  allChecked: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-line bg-subtle/60 text-left text-[11px] text-t3">
              <th className="w-9 px-3 py-2">
                <button onClick={onToggleAll}>
                  {allChecked ? <CheckSquare size={13} className="text-brand" /> : <Square size={13} />}
                </button>
              </th>
              <th className="px-2 py-2 font-normal">视频</th>
              <th className="px-2 py-2 font-normal">题材</th>
              <th className="px-2 py-2 font-normal">规格</th>
              <th className="px-2 py-2 font-normal">解析状态</th>
              <th className="px-2 py-2 font-normal">上传者</th>
              <th className="px-2 py-2 font-normal">上传时间</th>
              <th className="px-2 py-2 text-right font-normal">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-hover">
                <td className="px-3 py-2">
                  <button onClick={() => onToggle(v.id)}>
                    {selected.includes(v.id) ? (
                      <CheckSquare size={13} className="text-brand" />
                    ) : (
                      <Square size={13} className="text-t3" />
                    )}
                  </button>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-9 w-16 shrink-0 overflow-hidden rounded bg-subtle">
                      <img src={v.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                      <span className="absolute bottom-0 right-0 rounded-tl bg-black/60 px-1 font-mono text-[9px] text-white">
                        {formatDuration(v.duration)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <Link to={`/videos/${v.id}`} className="line-clamp-1 text-t1 hover:text-brand">
                        {v.title}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-t3">
                        <span>{formatFileSize(v.fileSize)}</span>
                        <span>·</span>
                        <span className="num">播放 {formatNumber(v.playCount)}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <Badge>{v.category}</Badge>
                </td>
                <td className="num px-2 py-2 text-[11px] text-t2">
                  {v.width}×{v.height} · {v.fps}fps
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={v.status} />
                    {v.status === 'analyzing' && (
                      <div className="w-14">
                        <Progress value={v.progress} height={3} />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2 text-[11px] text-t2">{v.uploaderName}</td>
                <td className="px-2 py-2 text-[11px] text-t3">{relativeTime(v.uploadedAt)}</td>
                <td className="px-2 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <Link to={`/videos/${v.id}/analysis`} className="rounded px-1.5 py-0.5 text-[11px] text-brand hover:bg-brand-soft">
                      解析
                    </Link>
                    <Link to={`/videos/${v.id}`} className="rounded px-1.5 py-0.5 text-[11px] text-t2 hover:bg-hover">
                      详情
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

interface PendingFile {
  name: string
  size: number
  duration: number
  title: string
}

function UploadDialog({
  open,
  onClose,
  onDone,
}: {
  open: boolean
  onClose: () => void
  onDone: (count: number, autoAnalyzeId?: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(0)
  const [files, setFiles] = useState<PendingFile[]>([])
  const [category, setCategory] = useState<VideoCategory>('新闻资讯')
  const [tags, setTags] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [copyright, setCopyright] = useState('台内原创')
  const [autoAnalyze, setAutoAnalyze] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [mode, setMode] = useState<'local' | 'link' | 'live' | 'api'>('local')
  const [link, setLink] = useState('')

  useEffect(() => {
    if (open) {
      setStep(0)
      setFiles([])
      setTags([])
      setCategory('新闻资讯')
      setLocation('')
      setAutoAnalyze(true)
      setMode('local')
      setLink('')
    }
  }, [open])

  const addFiles = (names: { name: string; size: number }[]) => {
    setFiles((prev) => [
      ...prev,
      ...names.map((f, i) => ({
        name: f.name,
        size: f.size,
        duration: 120 + ((f.name.length * 37 + i * 61) % 1200),
        title: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
      })),
    ])
  }

  const submit = async () => {
    if (!files.length) {
      toast('请先选择至少一个视频文件', 'error')
      return
    }
    setSubmitting(true)
    const created = await addVideos(
      files.map((f) => ({
        title: f.title,
        category,
        tags: tags.length ? tags : ['待标注'],
        duration: f.duration,
        location: location || '—',
        copyright,
      })),
    )
    setSubmitting(false)
    onDone(created.length, autoAnalyze ? created[0]?.id : undefined)
  }

  const steps = ['选择来源', '视频信息', '提交解析']

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="上传视频"
      desc="文件仅在本机完成登记，演示环境不会真实上传"
      width={640}
      footer={
        <>
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              上一步
            </Button>
          )}
          <Button onClick={onClose}>取消</Button>
          {step < 2 ? (
            <Button variant="primary" onClick={() => setStep((s) => s + 1)} disabled={mode === 'local' && !files.length}>
              下一步
            </Button>
          ) : (
            <Button variant="primary" loading={submitting} onClick={submit}>
              提交并解析
            </Button>
          )}
        </>
      }
    >
      <div className="mb-4 flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-1">
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]',
                i <= step ? 'bg-brand text-white' : 'bg-subtle text-t3',
              )}
            >
              {i + 1}
            </span>
            <span className={cn('whitespace-nowrap text-[11px]', i <= step ? 'text-t1' : 'text-t3')}>{s}</span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-line" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { key: 'local', icon: HardDrive, label: '本地上传' },
              { key: 'link', icon: Link2, label: '链接导入' },
              { key: 'live', icon: Radio, label: '直播回放' },
              { key: 'api', icon: Plug, label: '接口同步' },
            ].map((m) => {
              const Icon = m.icon
              return (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key as typeof mode)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-ctl border px-2 py-3 text-[11px] transition-colors',
                    mode === m.key ? 'border-brand bg-brand-soft text-brand' : 'border-line text-t2 hover:bg-hover',
                  )}
                >
                  <Icon size={16} />
                  {m.label}
                </button>
              )
            })}
          </div>

          {mode === 'local' && (
            <>
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const fs = Array.from(e.dataTransfer.files).map((f) => ({ name: f.name, size: f.size }))
                  if (fs.length) addFiles(fs)
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line-strong bg-subtle/40 py-8 transition-colors hover:border-brand hover:bg-brand-soft/40"
              >
                <Upload size={20} className="text-t3" />
                <div className="text-xs text-t1">拖拽视频文件到此处，或点击选择</div>
                <div className="text-[10px] text-t3">支持 MP4 / MOV / MKV / FLV，单文件不超过 8 GB</div>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const fs = Array.from(e.target.files ?? []).map((f) => ({ name: f.name, size: f.size }))
                  if (fs.length) addFiles(fs)
                  e.currentTarget.value = ''
                }}
              />
            </>
          )}

          {mode === 'link' && (
            <div className="space-y-2">
              <Field label="视频链接" hint="支持直链 MP4 与 HLS（m3u8）地址，演示环境仅做格式校验">
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com/media/xxx.m3u8"
                  className="h-8 w-full rounded-ctl border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
                />
              </Field>
              <Button
                onClick={() => {
                  if (!/^https?:\/\//.test(link)) return toast('链接格式不正确', 'error')
                  const name = link.split('/').pop() || 'remote_video.m3u8'
                  addFiles([{ name, size: 1024 ** 3 }])
                  toast('链接已解析，可继续下一步')
                }}
              >
                解析链接
              </Button>
            </div>
          )}

          {mode === 'live' && (
            <div className="rounded-ctl border border-line bg-subtle/50 p-3 text-[11px] leading-5 text-t2">
              从直播回放列表中选择场次。当前账号下可用的回放共 <span className="num text-t1">7</span> 场，
              <button
                className="text-brand underline"
                onClick={() =>
                  addFiles([
                    { name: '直播回放_双十一预热_场次2.mp4', size: 4.2 * 1024 ** 3 },
                    { name: '直播回放_秋季新品服饰专场.mp4', size: 3.6 * 1024 ** 3 },
                  ])
                }
              >
                一键导入最近两场
              </button>
              。
            </div>
          )}

          {mode === 'api' && (
            <div className="rounded-ctl border border-line bg-subtle/50 p-3 text-[11px] leading-5 text-t2">
              通过开放接口 <code className="rounded bg-surface px-1 text-[10px]">POST /open/v1/videos</code> 推送视频，
              接口密钥在「系统设置 · API 密钥」中管理。演示环境可模拟一次推送：
              <button
                className="ml-1 text-brand underline"
                onClick={() => addFiles([{ name: 'api_push_20261019_093012.mp4', size: 1.8 * 1024 ** 3 }])}
              >
                模拟接收
              </button>
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-t3">
                <span>待上传 {files.length} 个文件</span>
                <button onClick={() => setFiles([])} className="text-t3 hover:text-danger">
                  清空
                </button>
              </div>
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 rounded-ctl border border-line bg-surface px-2 py-1.5">
                  <FileVideo size={14} className="shrink-0 text-brand" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] text-t1">{f.name}</div>
                    <div className="num text-[10px] text-t3">
                      {formatFileSize(f.size)} · 预计 {formatDuration(f.duration)}
                    </div>
                  </div>
                  <button onClick={() => setFiles((s) => s.filter((_, j) => j !== i))} className="text-t3 hover:text-danger">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <Field label="标题" hint="默认取自文件名，可在上传后单独修改">
            <div className="space-y-1.5">
              {files.map((f, i) => (
                <input
                  key={i}
                  value={f.title}
                  onChange={(e) =>
                    setFiles((s) => s.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                  }
                  className="h-8 w-full rounded-ctl border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
                />
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="题材分类" required>
              <Select value={category} onChange={(e) => setCategory(e.target.value as VideoCategory)} className="w-full">
                {CATEGORY_LIST.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="版权归属">
              <Select value={copyright} onChange={(e) => setCopyright(e.target.value)} className="w-full">
                {['台内原创', '联合摄制', '已授权', '企业自有', '知识共享', '个人原创', '内部资料'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="拍摄地点">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例如 北京市 · 东城区"
              className="h-8 w-full rounded-ctl border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
            />
          </Field>
          <Field label="内容标签" hint="回车添加，标签会参与检索与聚类">
            <TagInput value={tags} onChange={setTags} />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="rounded-card border border-line p-3">
            <div className="mb-2 text-[11px] font-medium text-t2">本次导入</div>
            <div className="space-y-1 text-[11px] text-t2">
              <Row label="文件数量" value={`${files.length} 个`} />
              <Row label="总大小" value={formatFileSize(files.reduce((s, f) => s + f.size, 0))} />
              <Row label="总时长" value={formatDuration(files.reduce((s, f) => s + f.duration, 0))} />
              <Row label="题材" value={category} />
              <Row label="版权" value={copyright} />
            </div>
          </div>
          <div className="flex items-start justify-between gap-4 rounded-card border border-line p-3">
            <div>
              <div className="text-xs text-t1">上传后立即解析</div>
              <p className="mt-0.5 text-[11px] leading-4 text-t3">
                自动执行抽帧、转写、场景切分与语义索引，预计耗时 {Math.max(1, Math.round(files.reduce((s, f) => s + f.duration, 0) / 90))} 分钟。
              </p>
            </div>
            <Switch checked={autoAnalyze} onChange={setAutoAnalyze} />
          </div>
          <div className="rounded-ctl bg-subtle px-3 py-2 text-[10px] leading-4 text-t3">
            演示环境使用虚拟播放引擎，视频文件不会离开本机；解析结果由内置样本生成，用于展示完整交互链路。
          </div>
        </div>
      )}
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-t3">{label}</span>
      <span className="num text-t1">{value}</span>
    </div>
  )
}
