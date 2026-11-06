import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AudioLines,
  Captions,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Flag,
  Package,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Video,
  Wand2,
} from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { usePlayer } from '../hooks/usePlayer'
import { Badge, Button, Card, CardHeader, Drawer, Input, Progress, Segmented, Select } from '../components/ui'
import { EmptyState, PageHeader, ScoreRing, SeverityTag, Skeleton, StatusPill, KV } from '../components/common'
import { MockVideoCanvas, Waveform } from '../components/media'
import { Timeline } from '../components/Timeline'
import { CHANNEL_META, SEVERITY_META, SEVERITY_ORDER, TASK_STATUS_META } from '../lib/constants'
import { dateTime, duration, timecode } from '../lib/format'
import { MEMBER_MAP } from '../mock/build'
import { cn } from '../lib/cn'
import type { Channel, Defect, Severity } from '../types'

const CHANNEL_ICON = {
  video: Video,
  audio: AudioLines,
  container: Package,
  subtitle: Captions,
}

export default function DetectionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading } = useAsync(async () => {
    const task = await api.getTask(id!)
    const defects = await api.taskDefects(id!)
    return { task, defects }
  }, [id])

  const task = data?.task
  const allDefects = data?.defects ?? []
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [severity, setSeverity] = useState<'all' | Severity>('all')
  const [channel, setChannel] = useState<'all' | Channel>('all')
  const [q, setQ] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [checked, setChecked] = useState<string[]>([])

  const durationSec = task?.durationSec ?? 100
  const player = usePlayer(durationSec)

  const visible = useMemo(() => {
    return allDefects
      .filter((d) => (severity === 'all' ? true : d.severity === severity))
      .filter((d) => (channel === 'all' ? true : d.channel === channel))
      .filter((d) => (!q ? true : d.name.includes(q) || d.code.toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => a.startSec - b.startSec)
  }, [allDefects, severity, channel, q])

  const selected = allDefects.find((d) => d.id === selectedId)

  const pick = (d: Defect) => {
    setSelectedId(d.id)
    player.seek(d.startSec)
    player.setLoop([d.startSec, Math.max(d.startSec + 0.4, d.endSec)])
    player.setPlaying(true)
    setDrawerOpen(true)
  }

  const jump = (dir: 1 | -1) => {
    const list = visible
    if (!list.length) return
    const idx = list.findIndex((d) => d.id === selectedId)
    const next = list[Math.max(0, Math.min(list.length - 1, (idx === -1 ? 0 : idx) + dir))]
    pick(next)
  }

  if (loading || !task) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-[420px]" />
        <Skeleton className="h-[160px]" />
      </div>
    )
  }

  const meta = TASK_STATUS_META[task.status]
  const total = task.counts.fatal + task.counts.severe + task.counts.moderate + task.counts.info
  const isDone = task.status === 'done'

  return (
    <div>
      <PageHeader
        crumbs={[{ label: '检测中心', to: '/detection' }, { label: task.code }]}
        title={task.assetName}
        meta={<StatusPill label={meta.label} color={meta.color} bg={meta.bg} />}
        desc={
          <span className="flex flex-wrap items-center gap-2">
            <span className="mono">{task.code}</span>
            <span>·</span>
            <span>{task.ruleSetName}</span>
            <span>·</span>
            <span>{MEMBER_MAP[task.operatorId]?.name}</span>
            <span>·</span>
            <span className="mono">{dateTime(task.startedAt)}</span>
            <span>·</span>
            <span className="mono">{duration(task.durationSec)}</span>
          </span>
        }
        actions={
          <>
            <Button onClick={() => navigate('/detection')}>
              <ChevronLeft size={14} /> 返回列表
            </Button>
            <Button disabled={!isDone} onClick={() => navigate('/reports/rp1')}>
              <FileText size={14} /> 生成报告
            </Button>
            <Button variant="primary" disabled={!isDone} onClick={() => navigate('/repair/rt1')}>
              <Wand2 size={14} /> 发起修复
            </Button>
          </>
        }
      />

      {!isDone && (
        <Card className="mb-4 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px] text-[var(--text-2)]">
              <StatusPill label={meta.label} color={meta.color} bg={meta.bg} />
              正在执行 {task.ruleSetName} · 节点 {task.nodeId.toUpperCase()}
            </div>
            <span className="mono text-[12px] text-[var(--text-2)]">
              {task.progress}% {task.etaSec ? `· ETA ${Math.round(task.etaSec / 60)} min` : ''}
            </span>
          </div>
          <Progress value={task.progress} className="mt-2.5" />
          <div className="mt-3 grid grid-cols-4 gap-3 text-[11px] text-[var(--text-3)]">
            {['探针解析', '分轨', '并行检测', '聚合评分'].map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={cn('h-1.5 w-1.5 rounded-full', task.progress > i * 25 ? 'bg-[var(--primary)]' : 'bg-[var(--bg-3)]')} />
                {s}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-3 grid grid-cols-5 gap-3">
        <Card className="flex items-center gap-3 px-4 py-3">
          <ScoreRing score={task.score} grade={task.grade} size={52} stroke={4} />
          <div>
            <div className="text-[11px] text-[var(--text-3)]">质检评分</div>
            <div className="text-[12px] text-[var(--text-2)]">{task.grade} 级 · {task.score >= 90 ? '优良' : task.score >= 75 ? '合格' : task.score >= 60 ? '待修复' : '不合格'}</div>
          </div>
        </Card>
        <Card className="px-4 py-3">
          <div className="text-[11px] text-[var(--text-3)]">缺陷总数</div>
          <div className="mono mt-1 text-[22px] leading-none">{total}</div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {SEVERITY_ORDER.map((s) => task.counts[s] > 0 && <SeverityTag key={s} severity={s} count={task.counts[s]} />)}
          </div>
        </Card>
        <Card className="px-4 py-3">
          <div className="text-[11px] text-[var(--text-3)]">积分响度</div>
          <div className="mono mt-1 text-[22px] leading-none">{task.counts ? '' : ''}{'-18.4'}</div>
          <div className="mt-1 text-[11px] text-[var(--accent)]">目标 -24 ±2 LKFS</div>
        </Card>
        <Card className="px-4 py-3">
          <div className="text-[11px] text-[var(--text-3)]">音画偏差</div>
          <div className="mono mt-1 text-[22px] leading-none">+120<span className="ml-1 text-[11px] text-[var(--text-3)]">ms</span></div>
          <div className="mt-1 text-[11px] text-[var(--danger)]">超阈值 80ms</div>
        </Card>
        <Card className="px-4 py-3">
          <div className="text-[11px] text-[var(--text-3)]">严重度权重扣分</div>
          <div className="mono mt-1 text-[22px] leading-none">{Math.max(0, 100 - task.score).toFixed(1)}</div>
          <div className="mt-1 text-[11px] text-[var(--text-3)]">按 8 / 4 / 1.5 / 0.5 加权</div>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8 space-y-3">
          <Card className="overflow-hidden">
            <div className="relative bg-black">
              <div className="aspect-[16/9] w-full">
                <MockVideoCanvas seed={task.assetName.length * 17} time={player.time} duration={task.durationSec} mode="after" />
              </div>
              <div className="absolute left-3 top-3 flex items-center gap-2">
                <Badge color="#fff" bg="rgba(0,0,0,.45)">PA 修复预览</Badge>
                <Badge color="#fff" bg="rgba(0,0,0,.45)">{task.ruleSetName}</Badge>
              </div>
            </div>
            <div className="px-4 py-2.5">
              <Waveform seed={task.assetName.length * 17} duration={task.durationSec} currentTime={player.time} height={52} />
              <div className="mt-2 flex items-center gap-3">
                <button onClick={player.toggle} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-[#04161c]">
                  {player.playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>
                <button onClick={() => jump(-1)} title="上一缺陷" className="text-[var(--text-2)] hover:text-[var(--text-1)]">
                  <SkipBack size={15} />
                </button>
                <button onClick={() => player.step(-1)} title="上一帧" className="text-[var(--text-2)] hover:text-[var(--text-1)]">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => player.step(1)} title="下一帧" className="text-[var(--text-2)] hover:text-[var(--text-1)]">
                  <ChevronRight size={15} />
                </button>
                <button onClick={() => jump(1)} title="下一缺陷" className="text-[var(--text-2)] hover:text-[var(--text-1)]">
                  <SkipForward size={15} />
                </button>
                <span className="mono text-[12px] text-[var(--text-2)]">
                  {timecode(player.time)} <span className="text-[var(--text-3)]">/ {timecode(task.durationSec)}</span>
                </span>
                <button
                  onClick={() => {
                    if (selected) player.setLoop([selected.startSec, selected.endSec])
                    else player.setLoop(null)
                  }}
                  className={cn('flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px]', selected ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-[var(--border)] text-[var(--text-3)]')}
                >
                  <Repeat size={11} /> 区间循环
                </button>
                <div className="ml-auto flex items-center gap-1">
                  <Segmented
                    size="sm"
                    value={String(player.rate)}
                    onChange={(v) => player.setRate(Number(v))}
                    items={[
                      { key: '0.5', label: '0.5x' },
                      { key: '1', label: '1x' },
                      { key: '2', label: '2x' },
                      { key: '4', label: '4x' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="px-4 py-3">
            <Timeline
              duration={task.durationSec}
              time={player.time}
              defects={visible}
              seed={task.assetName.length * 17}
              onSeek={player.seek}
              selectedId={selectedId ?? undefined}
              onSelectDefect={(did) => {
                const d = allDefects.find((x) => x.id === did)
                if (d) pick(d)
              }}
            />
          </Card>
        </div>

        <div className="col-span-4">
          <Card className="flex h-full flex-col overflow-hidden">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--text-1)]">缺陷列表</span>
                <span className="mono text-[11px] text-[var(--text-3)]">{visible.length} / {allDefects.length}</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索缺陷" className="h-7 flex-1 text-[12px]" />
                <Select
                  className="h-7 w-[86px] text-[12px]"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as 'all' | Severity)}
                >
                  <option value="all">全部级别</option>
                  <option value="fatal">致命</option>
                  <option value="severe">严重</option>
                  <option value="moderate">一般</option>
                  <option value="info">提示</option>
                </Select>
              </div>
              <div className="mt-1.5 flex items-center gap-1">
                {[
                  { key: 'all', label: '全部通道' },
                  { key: 'video', label: '视频' },
                  { key: 'audio', label: '音频' },
                  { key: 'container', label: '容器' },
                  { key: 'subtitle', label: '字幕' },
                ].map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setChannel(c.key as 'all' | Channel)}
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[11px]',
                      channel === c.key ? 'bg-[var(--bg-3)] text-[var(--text-1)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 560 }}>
              {visible.length === 0 ? (
                <EmptyState title="没有符合条件的缺陷" desc="调整筛选条件试试" />
              ) : (
                visible.map((d) => {
                  const Icon = CHANNEL_ICON[d.channel]
                  const active = d.id === selectedId
                  return (
                    <div
                      key={d.id}
                      onClick={() => pick(d)}
                      className={cn(
                        'cursor-pointer border-b border-[var(--border)] px-3 py-2 transition-colors',
                        active ? 'bg-[var(--bg-3)]' : 'hover:bg-[var(--bg-2)]',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked.includes(d.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => setChecked((s) => (s.includes(d.id) ? s.filter((x) => x !== d.id) : [...s, d.id]))}
                          className="accent-[var(--primary)]"
                        />
                        <Icon size={12} style={{ color: CHANNEL_META[d.channel].color }} />
                        <span className="flex-1 truncate text-[12px] text-[var(--text-1)]">{d.name}</span>
                        <SeverityTag severity={d.severity} />
                      </div>
                      <div className="mt-1 flex items-center gap-2 pl-5">
                        <span className="mono text-[10px] text-[var(--text-3)]">{timecode(d.startSec)}</span>
                        <span className="mono text-[10px] text-[var(--text-3)]">
                          {d.metricValue} {d.unit}
                        </span>
                        <span className="ml-auto flex items-center gap-1">
                          <span className="h-1 w-8 overflow-hidden rounded-full bg-[var(--bg-3)]">
                            <span className="block h-full rounded-full bg-[var(--primary)]" style={{ width: `${d.confidence * 100}%` }} />
                          </span>
                          <span className="mono text-[10px] text-[var(--text-3)]">{(d.confidence * 100).toFixed(0)}%</span>
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="border-t border-[var(--border)] px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-3)]">已选 {checked.length} 条</span>
                <Button size="sm" variant="primary" disabled={!checked.length && !selectedId} onClick={() => navigate('/repair/rt1')}>
                  <Wand2 size={12} /> 加入修复方案
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-3">
        <CardHeader
          title="检测日志"
          desc="按时间顺序记录探针、分轨、检测与聚合阶段"
          right={<span className="mono text-[11px] text-[var(--text-3)]">{task.logs.length} 条</span>}
        />
        <div className="max-h-[180px] overflow-y-auto px-5 pb-4">
          {task.logs.map((l, i) => (
            <div key={i} className="flex gap-3 border-b border-[var(--border)] py-1.5 text-[11px] last:border-0">
              <span className="mono shrink-0 text-[var(--text-3)]">{l.t}</span>
              <span
                className="w-10 shrink-0 uppercase"
                style={{ color: l.level === 'error' ? 'var(--danger)' : l.level === 'warn' ? 'var(--accent)' : 'var(--text-3)' }}
              >
                {l.level}
              </span>
              <span className="text-[var(--text-2)]">{l.msg}</span>
            </div>
          ))}
        </div>
      </Card>

      <Drawer
        open={drawerOpen && !!selected}
        onClose={() => setDrawerOpen(false)}
        title={selected?.name}
        desc={selected ? `${selected.code} · ${CHANNEL_META[selected.channel].label} · 置信度 ${(selected.confidence * 100).toFixed(1)}%` : ''}
        width={480}
        footer={
          <div className="flex items-center justify-between">
            <Button onClick={() => selected && setChecked((s) => (s.includes(selected.id) ? s : [...s, selected.id]))}>
              <Flag size={13} /> 标记为误报
            </Button>
            <Button variant="primary" onClick={() => navigate('/repair/rt1')}>
              <Wand2 size={13} /> 加入修复方案
            </Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg border border-[var(--border)] bg-black">
              <div className="aspect-video">
                <MockVideoCanvas seed={selected.id.length * 23} time={selected.startSec} duration={task.durationSec} mode="before" showSafeArea={false} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-2.5">
                <div className="text-[10px] text-[var(--text-3)]">实测值</div>
                <div className="mono mt-1 text-[15px]" style={{ color: SEVERITY_META[selected.severity].color }}>
                  {selected.metricValue}
                </div>
                <div className="text-[10px] text-[var(--text-3)]">{selected.unit}</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-2.5">
                <div className="text-[10px] text-[var(--text-3)]">判定阈值</div>
                <div className="mono mt-1 text-[15px] text-[var(--text-2)]">{selected.threshold}</div>
                <div className="text-[10px] text-[var(--text-3)]">{selected.unit}</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-2.5">
                <div className="text-[10px] text-[var(--text-3)]">持续时长</div>
                <div className="mono mt-1 text-[15px] text-[var(--text-2)]">{(selected.endSec - selected.startSec).toFixed(1)}</div>
                <div className="text-[10px] text-[var(--text-3)]">秒</div>
              </div>
            </div>

            <div>
              <div className="mb-1 text-[11px] text-[var(--text-3)]">{selected.metricLabel} 波形片段</div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-2 py-1">
                <Waveform seed={selected.id.length * 13} duration={12} currentTime={6} height={54} />
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-[11px] text-[var(--text-3)]">判定与建议</div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-3">
                <div className="flex items-center gap-2">
                  <SeverityTag severity={selected.severity} />
                  <span className="mono text-[11px] text-[var(--text-3)]">
                    {timecode(selected.startSec)} → {timecode(selected.endSec)}
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[var(--text-2)]">{selected.suggestion}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selected.algorithmIds.map((a) => (
                    <span key={a} className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-3)]">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-[11px] text-[var(--text-3)]">同项目历史同类缺陷</div>
              <div className="space-y-1">
                {allDefects
                  .filter((d) => d.code === selected.code && d.id !== selected.id)
                  .slice(0, 4)
                  .map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded border border-[var(--border)] px-2 py-1.5">
                      <span className="mono text-[11px] text-[var(--text-2)]">{timecode(d.startSec)}</span>
                      <span className="mono text-[11px] text-[var(--text-3)]">{d.metricValue} {d.unit}</span>
                      <SeverityTag severity={d.severity} />
                    </div>
                  ))}
                {allDefects.filter((d) => d.code === selected.code && d.id !== selected.id).length === 0 && (
                  <div className="text-[11px] text-[var(--text-3)]">本次检测中无其他同类缺陷</div>
                )}
              </div>
            </div>

            <div>
              <KV k="缺陷 ID" v={selected.id} mono />
              <KV k="所属任务" v={<Link to={`/detection/${task.id}`} className="text-[var(--primary)]">{task.code}</Link>} mono />
              <KV k="状态" v={selected.status === 'open' ? '待处理' : selected.status === 'ignored' ? '已忽略' : '已修复'} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
