import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Flag,
  Clock,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react'
import type { ReviewItem, VideoItem } from '../types'
import { fetchReviews, fetchVideo, updateReview } from '../services'
import VideoPlayer from '../components/VideoPlayer'
import {
  Badge,
  Button,
  Card,
  ConfidenceBar,
  EmptyState,
  PageHeader,
  Progress,
  SearchInput,
  Select,
  Skeleton,
  Textarea,
  Tooltip,
  toast,
} from '../components/ui'
import { VIOLATION_LIST, VIOLATION_LEVEL_COLOR } from '../constants'
import { cn, formatDate, formatDuration, percent } from '../lib/utils'
import { usePlayer } from '../stores'

const STATUS_TABS = [
  { key: 'pending', label: '待审核' },
  { key: 'doubt', label: '存疑' },
  { key: 'passed', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
  { key: 'all', label: '全部' },
]

const STATUS_LABEL: Record<ReviewItem['status'], string> = {
  pending: '待审核',
  passed: '已通过',
  rejected: '已驳回',
  doubt: '存疑',
}

export default function Review() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [list, setList] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [level, setLevel] = useState('all')
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(id ?? null)
  const [video, setVideo] = useState<VideoItem | null>(null)
  const [remark, setRemark] = useState('')
  const seek = usePlayer((s) => s.seek)

  useEffect(() => {
    fetchReviews().then((r) => {
      setList(r)
      setLoading(false)
      if (!id) {
        const first = r.find((x) => x.status === 'pending')
        if (first) setSelectedId(first.id)
      }
    })
  }, [id])

  const filtered = useMemo(() => {
    let l = [...list]
    if (tab !== 'all') l = l.filter((r) => r.status === tab)
    if (level !== 'all') l = l.filter((r) => r.level === level)
    if (cat !== 'all') l = l.filter((r) => r.category === cat)
    if (q.trim()) l = l.filter((r) => r.videoTitle.includes(q.trim()) || r.description.includes(q.trim()))
    return l
  }, [list, tab, level, cat, q])

  const selected = list.find((r) => r.id === selectedId) ?? null

  useEffect(() => {
    if (selected) {
      setRemark(selected.remark ?? '')
      fetchVideo(selected.videoId).then((v) => {
        setVideo(v ?? null)
        setTimeout(() => seek(selected.start), 100)
      })
    }
  }, [selected, seek])

  const counts = useMemo(
    () => ({
      pending: list.filter((r) => r.status === 'pending').length,
      doubt: list.filter((r) => r.status === 'doubt').length,
      passed: list.filter((r) => r.status === 'passed').length,
      rejected: list.filter((r) => r.status === 'rejected').length,
      high: list.filter((r) => r.level === '高' && r.status === 'pending').length,
      avgConf: list.length ? list.reduce((s, r) => s + r.confidence, 0) / list.length : 0,
    }),
    [list],
  )

  const act = async (status: ReviewItem['status']) => {
    if (!selected) return
    const idx = filtered.findIndex((r) => r.id === selected.id)
    await updateReview(selected.id, {
      status,
      reviewer: '周慕白',
      reviewedAt: new Date().toISOString(),
      remark: remark.trim() || undefined,
    })
    setList((l) =>
      l.map((r) =>
        r.id === selected.id
          ? { ...r, status, reviewer: '周慕白', reviewedAt: new Date().toISOString(), remark: remark.trim() || undefined }
          : r,
      ),
    )
    toast(`已标记为「${STATUS_LABEL[status]}」`)
    const next = filtered[idx + 1] ?? filtered.find((r) => r.status === 'pending' && r.id !== selected.id)
    if (next) setSelectedId(next.id)
    else setSelectedId(null)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA'].includes(el.tagName)) return
      if (!selected) return
      if (e.key.toLowerCase() === 'a') act('passed')
      if (e.key.toLowerCase() === 'd') act('rejected')
      if (e.key.toLowerCase() === 's') act('doubt')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, remark, filtered])

  const step = (dir: 1 | -1) => {
    const i = filtered.findIndex((r) => r.id === selectedId)
    const next = filtered[i + dir]
    if (next) setSelectedId(next.id)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="内容审核"
        desc="基于多模态检测的违规片段进入人工复核队列，处置结论会回流为模型训练样本"
        extra={
          <>
            <Button icon={<Filter size={13} />} onClick={() => toast('可在左侧按风险等级与违规类型筛选', 'info')}>
              筛选条件
            </Button>
            <Button variant="primary" icon={<ShieldCheck size={13} />} onClick={() => navigate('/analytics')}>
              审核报表
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          { label: '待审核', value: counts.pending, hint: `${counts.high} 条高风险`, color: 'var(--warning)' },
          { label: '存疑待定', value: counts.doubt, hint: '需要更多上下文', color: 'var(--info)' },
          { label: '已通过', value: counts.passed, hint: '判定为合规', color: 'var(--success)' },
          { label: '已驳回', value: counts.rejected, hint: '需修改后重审', color: 'var(--danger)' },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <div className="text-[11px] text-t2">{s.label}</div>
            <div className="num mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-medium" style={{ color: s.color }}>
                {s.value}
              </span>
              <span className="text-[10px] text-t3">条</span>
            </div>
            <div className="mt-0.5 text-[10px] text-t3">{s.hint}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="min-w-0">
          <Card className="mb-2 p-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-0.5">
                {STATUS_TABS.map((t) => {
                  const n = t.key === 'all' ? list.length : list.filter((r) => r.status === t.key).length
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={cn(
                        'rounded-ctl px-2 py-1 text-[11px] transition-colors',
                        tab === t.key ? 'bg-brand-soft font-medium text-brand' : 'text-t2 hover:bg-hover',
                      )}
                    >
                      {t.label}
                      <span className="num ml-1 text-[10px] text-t3">{n}</span>
                    </button>
                  )
                })}
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <Select value={level} onChange={(e) => setLevel(e.target.value)} className="h-7 text-[11px]">
                  <option value="all">全部等级</option>
                  <option value="高">高风险</option>
                  <option value="中">中风险</option>
                  <option value="低">低风险</option>
                </Select>
                <Select value={cat} onChange={(e) => setCat(e.target.value)} className="h-7 text-[11px]">
                  <option value="all">全部类型</option>
                  {VIOLATION_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <SearchInput value={q} onChange={setQ} placeholder="搜索视频或描述…" className="w-[180px]" />
              </div>
            </div>
          </Card>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[86px] w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon={<ShieldCheck size={18} />}
                title="当前队列已清空"
                desc="没有符合筛选条件的待审记录。切换状态标签可以查看历史处置结果。"
              />
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    'flex w-full gap-3 rounded-card border p-2.5 text-left transition-colors',
                    selectedId === r.id
                      ? 'border-brand bg-brand-soft/50'
                      : 'border-line bg-surface hover:border-line-strong',
                  )}
                >
                  <div className="relative h-[62px] w-[110px] shrink-0 overflow-hidden rounded-ctl bg-subtle">
                    <img src={r.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 right-1 rounded bg-black/65 px-1 font-mono text-[9px] text-white">
                      {formatDuration(r.start)}
                    </span>
                    <span
                      className="absolute left-1 top-1 rounded px-1 text-[9px] font-medium text-white"
                      style={{ background: VIOLATION_LEVEL_COLOR[r.level] }}
                    >
                      {r.level}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="line-clamp-1 text-xs font-medium text-t1">{r.videoTitle}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-t3">{formatDate(r.reviewedAt ?? '', false) || '待处理'}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge color={VIOLATION_LEVEL_COLOR[r.level]} bg="var(--bg-subtle)">
                        {r.category}
                      </Badge>
                      <span className="num font-mono text-[10px] text-t3">
                        {formatDuration(r.start)} - {formatDuration(r.end)}
                      </span>
                      <ConfidenceBar value={r.confidence} />
                    </div>
                    <p className="mt-1 line-clamp-1 text-[10px] leading-4 text-t2">{r.description}</p>
                  </div>
                  <div className="flex w-[52px] shrink-0 items-center justify-end">
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px]"
                      style={{
                        color:
                          r.status === 'pending'
                            ? 'var(--warning)'
                            : r.status === 'passed'
                              ? 'var(--success)'
                              : r.status === 'rejected'
                                ? 'var(--danger)'
                                : 'var(--info)',
                        background: 'var(--bg-subtle)',
                      }}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-3 lg:self-start">
          {selected ? (
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="num text-[11px] text-t3">{selected.id}</span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px]"
                    style={{ color: VIOLATION_LEVEL_COLOR[selected.level], background: 'var(--bg-subtle)' }}
                  >
                    {selected.level}风险
                  </span>
                  <span className="rounded bg-subtle px-1.5 py-0.5 text-[10px] text-t2">{selected.category}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => step(-1)} className="rounded p-1 text-t3 hover:bg-hover hover:text-t1">
                    <ChevronLeft size={13} />
                  </button>
                  <button onClick={() => step(1)} className="rounded p-1 text-t3 hover:bg-hover hover:text-t1">
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {video ? <VideoPlayer video={video} /> : <Skeleton className="aspect-video w-full" />}

              <div className="space-y-3 p-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-t2">命中片段</span>
                    <span className="num font-mono text-[10px] text-t3">
                      {formatDuration(selected.start, true)} - {formatDuration(selected.end, true)}
                    </span>
                  </div>
                  <div className="mt-1 rounded-ctl border border-line bg-subtle/50 p-2.5">
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0 text-warning" />
                      <p className="text-[11px] leading-5 text-t1">{selected.description}</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-t3">模型置信度</span>
                      <Progress
                        value={selected.confidence * 100}
                        color={VIOLATION_LEVEL_COLOR[selected.level]}
                        height={3}
                        className="flex-1"
                      />
                      <span className="num text-[10px] text-t2">{percent(selected.confidence, 0)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-t2">关联画面</span>
                    <span className="text-[10px] text-t3">命中前后 3 秒</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <button
                        key={i}
                        onClick={() => seek(selected.start - 3 + i * 3)}
                        className="group relative aspect-video overflow-hidden rounded bg-subtle"
                      >
                        <img
                          src={`https://picsum.photos/seed/${selected.id}_f${i}/240/136`}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                        />
                        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 font-mono text-[8px] text-white">
                          {i === 1 ? '命中帧' : `${i === 0 ? '-3' : '+3'}s`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-[11px] font-medium text-t2">处置备注</div>
                  <Textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    rows={2}
                    placeholder="填写处置理由，会记录在审核日志中…"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Check size={12} />}
                    onClick={() => act('passed')}
                    className="justify-center"
                  >
                    通过
                  </Button>
                  <Button variant="danger" size="sm" icon={<X size={12} />} onClick={() => act('rejected')} className="justify-center">
                    驳回
                  </Button>
                  <Button size="sm" icon={<HelpCircle size={12} />} onClick={() => act('doubt')} className="justify-center">
                    存疑
                  </Button>
                </div>

                <div className="flex items-center justify-between border-t border-line pt-2 text-[10px] text-t3">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {selected.reviewedAt ? `处置于 ${formatDate(selected.reviewedAt)}` : '尚未处置'}
                  </span>
                  <Link
                    to={`/videos/${selected.videoId}/analysis`}
                    className="flex items-center gap-0.5 text-brand hover:underline"
                  >
                    查看解析 <ArrowUpRight size={10} />
                  </Link>
                </div>

                <div className="rounded-ctl bg-subtle px-2 py-1.5 text-[10px] leading-4 text-t3">
                  <span className="text-t2">快捷键</span> · A 通过 / D 驳回 / S 存疑，处置后自动跳到下一条。
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon={<ShieldCheck size={18} />}
                title="选择一条记录开始复核"
                desc={`当前筛选下共 ${filtered.length} 条记录，左侧列表点击任意条目即可在右侧查看命中画面与上下文。`}
              />
            </Card>
          )}

          <Card className="mt-3 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-t2">
              <ShieldAlert size={11} /> 质检提示
            </div>
            <div className="space-y-1.5 text-[10px] leading-4 text-t3">
              <div className="flex gap-1.5">
                <Flag size={10} className="mt-0.5 shrink-0 text-warning" />
                平均置信度 {percent(counts.avgConf, 0)}，低于 0.60 的记录建议标记为存疑。
              </div>
              <div className="flex gap-1.5">
                <Flag size={10} className="mt-0.5 shrink-0 text-warning" />
                连续 3 次误报的同类样本会自动进入模型微调队列。
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
