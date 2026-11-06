import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Pause, Play, Plus, RotateCcw, X, GripVertical, ListFilter } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Badge, Button, IconButton, Panel, SearchInput, Select, Tabs } from '../components/ui'
import { DataTable, type Column } from '../components/table'
import { JobStatusBadge, OutputSpecText, ProgressCell } from '../components/job'
import { formatDateTime, formatMinutes, money } from '../lib/format'
import type { Job } from '../types'
import { JOB_STATUS_LABEL } from '../lib/constants'
import { cn } from '../lib/utils'

type TabKey = 'all' | 'active' | 'queued' | 'done' | 'error'

function elapsed(job: Job): string {
  if (!job.startedAt) return '—'
  const end = job.finishedAt ? new Date(job.finishedAt).getTime() : Date.now()
  const mins = Math.max(1, Math.round((end - new Date(job.startedAt).getTime()) / 60000))
  return formatMinutes(mins)
}

export default function Jobs() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const jobs = useDataStore((s) => s.jobs)
  const clients = useDataStore((s) => s.clients)
  const nodes = useDataStore((s) => s.nodes)
  const setJobStatus = useDataStore((s) => s.setJobStatus)
  const retryJob = useDataStore((s) => s.retryJob)
  const toast = useAppStore((s) => s.toast)

  const [tab, setTab] = useState<TabKey>((params.get('view') === 'queue' ? 'queued' : 'all') as TabKey)
  const [query, setQuery] = useState('')
  const [clientId, setClientId] = useState('all')
  const [format, setFormat] = useState('all')
  const [priority, setPriority] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [queue, setQueue] = useState<string[] | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  const clientName = (id: string) => clients.find((c) => c.id === id)?.shortName ?? '—'
  const nodeName = (id?: string) => nodes.find((n) => n.id === id)?.hostname ?? '—'

  const counts = {
    all: jobs.length,
    active: jobs.filter((j) => ['analyzing', 'depth', 'disparity', 'temporal', 'rendering', 'encoding', 'qa'].includes(j.status)).length,
    queued: jobs.filter((j) => j.status === 'queued').length,
    done: jobs.filter((j) => j.status === 'completed').length,
    error: jobs.filter((j) => ['failed', 'paused', 'canceled'].includes(j.status)).length,
  }

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (tab === 'active' && !['analyzing', 'depth', 'disparity', 'temporal', 'rendering', 'encoding', 'qa'].includes(j.status)) return false
      if (tab === 'queued' && j.status !== 'queued') return false
      if (tab === 'done' && j.status !== 'completed') return false
      if (tab === 'error' && !['failed', 'paused', 'canceled'].includes(j.status)) return false
      if (query) {
        const q = query.toLowerCase()
        if (!j.name.toLowerCase().includes(q) && !j.code.toLowerCase().includes(q)) return false
      }
      if (clientId !== 'all' && j.clientId !== clientId) return false
      if (format !== 'all' && j.output.format !== format) return false
      if (priority !== 'all' && j.priority !== priority) return false
      return true
    })
  }, [jobs, tab, query, clientId, format, priority])

  const ordered = useMemo(() => {
    if (!queue) return filtered
    const map = new Map(filtered.map((j) => [j.id, j]))
    return [...queue.map((id) => map.get(id)).filter(Boolean) as Job[], ...filtered.filter((j) => !queue.includes(j.id))]
  }, [filtered, queue])

  const exportCsv = (rows: Job[]) => {
    const header = ['任务编号', '任务名称', '客户', '输出格式', '分辨率', '状态', '进度', '节点', '计费分钟', '费用(元)', '创建时间']
    const lines = rows.map((j) =>
      [
        j.code,
        `"${j.name}"`,
        clientName(j.clientId),
        j.output.format,
        j.output.resolution,
        JOB_STATUS_LABEL[j.status],
        `${Math.round(j.progress)}%`,
        nodeName(j.nodeId),
        j.billedMinutes,
        j.costCNY,
        formatDateTime(j.createdAt),
      ].join(','),
    )
    const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spacescape-jobs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('success', '任务清单已导出', `${rows.length} 条记录 · CSV`)
  }

  const columns: Column<Job>[] = [
    {
      key: 'name',
      header: '任务',
      sortValue: (j) => j.createdAt,
      render: (j) => (
        <div className="min-w-0">
          <div className="truncate text-[12.5px] text-ink">{j.name}</div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="mono text-[10.5px] text-dim">{j.code}</span>
            <span className="text-[10.5px] text-dim">·</span>
            <span className="text-[10.5px] text-dim">{clientName(j.clientId)}</span>
            {j.version > 1 && <Badge tone="neutral">v{j.version}</Badge>}
          </div>
        </div>
      ),
    },
    {
      key: 'output',
      header: '输出规格',
      render: (j) => <OutputSpecText output={j.output} />,
    },
    { key: 'status', header: '状态', render: (j) => <JobStatusBadge status={j.status} /> },
    { key: 'progress', header: '进度', render: (j) => <ProgressCell job={j} /> },
    {
      key: 'node',
      header: '节点',
      render: (j) => <span className="mono text-[11.5px] text-muted">{j.nodeId ? nodeName(j.nodeId) : '—'}</span>,
    },
    {
      key: 'elapsed',
      header: '耗时',
      align: 'right',
      sortValue: (j) => (j.startedAt ? new Date(j.startedAt).getTime() : 0),
      render: (j) => <span className="text-[11.5px] text-muted">{elapsed(j)}</span>,
    },
    {
      key: 'cost',
      header: '费用',
      align: 'right',
      sortValue: (j) => j.costCNY,
      render: (j) => <span className="mono text-[11.5px] text-muted">{money(j.costCNY)}</span>,
    },
    {
      key: 'priority',
      header: '优先级',
      render: (j) => (j.priority === 'rush' ? <Badge tone="warning">加急</Badge> : <span className="text-[11.5px] text-dim">标准</span>),
    },
    {
      key: 'created',
      header: '创建时间',
      align: 'right',
      sortValue: (j) => j.createdAt,
      render: (j) => <span className="text-[11.5px] text-dim">{formatDateTime(j.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (j) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          {['analyzing', 'depth', 'disparity', 'temporal', 'rendering', 'encoding'].includes(j.status) && (
            <IconButton
              className="h-7 w-7"
              title="暂停任务"
              onClick={() => {
                setJobStatus(j.id, 'paused')
                toast('warning', '任务已暂停', `${j.code} 将在当前阶段保留进度`)
              }}
            >
              <Pause className="h-3.5 w-3.5" />
            </IconButton>
          )}
          {j.status === 'paused' && (
            <IconButton
              className="h-7 w-7"
              title="继续任务"
              onClick={() => {
                setJobStatus(j.id, 'rendering')
                toast('success', '任务已继续', `${j.code} 已重新分配节点`)
              }}
            >
              <Play className="h-3.5 w-3.5" />
            </IconButton>
          )}
          {['failed', 'canceled'].includes(j.status) && (
            <IconButton
              className="h-7 w-7"
              title="重试任务"
              onClick={() => {
                retryJob(j.id)
                toast('info', '任务已重新入队', `${j.code} 将在 1 分钟内调度`)
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </IconButton>
          )}
          {!['completed', 'canceled'].includes(j.status) && (
            <IconButton
              className="h-7 w-7"
              title="取消任务"
              onClick={() => {
                setJobStatus(j.id, 'canceled')
                toast('warning', '任务已取消', `${j.code} 已释放节点资源`)
              }}
            >
              <X className="h-3.5 w-3.5" />
            </IconButton>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title="转换任务"
        desc="从队列到交付的完整追踪：7 个处理阶段的实时进度、节点分配与费用结算。"
        actions={
          <>
            <Button icon={<Download className="h-3.5 w-3.5" />} onClick={() => exportCsv(filtered)}>
              导出清单
            </Button>
            <Button variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => navigate('/jobs/new')}>
              新建任务
            </Button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={(v) => {
            setTab(v)
            setSelected([])
          }}
          items={[
            { key: 'all', label: '全部', count: counts.all },
            { key: 'active', label: '进行中', count: counts.active },
            { key: 'queued', label: '排队', count: counts.queued },
            { key: 'done', label: '已完成', count: counts.done },
            { key: 'error', label: '异常', count: counts.error },
          ]}
          className="border-b-0"
        />
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="搜索任务名或编号" className="w-[220px]" />
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-[140px]">
            <option value="all">全部客户</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName}
              </option>
            ))}
          </Select>
          <Select value={format} onChange={(e) => setFormat(e.target.value)} className="w-[128px]">
            <option value="all">全部格式</option>
            <option value="MV-HEVC">MV-HEVC</option>
            <option value="SBS-Full">SBS 全宽</option>
            <option value="SBS-Half">SBS 半宽</option>
            <option value="OU">上下 3D</option>
            <option value="Anaglyph">红蓝立体</option>
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-[110px]">
            <option value="all">全部优先级</option>
            <option value="rush">加急</option>
            <option value="standard">标准</option>
          </Select>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-line bg-[#141a26] px-3 py-2">
          <span className="text-[12px] text-ink">已选 {selected.length} 个任务</span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              icon={<Pause className="h-3.5 w-3.5" />}
              onClick={() => {
                selected.forEach((id) => setJobStatus(id, 'paused'))
                toast('warning', `已暂停 ${selected.length} 个任务`)
                setSelected([])
              }}
            >
              暂停
            </Button>
            <Button
              size="sm"
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              onClick={() => {
                selected.forEach((id) => retryJob(id))
                toast('info', `已将 ${selected.length} 个任务重新入队`)
                setSelected([])
              }}
            >
              重试
            </Button>
            <Button size="sm" variant="danger" onClick={() => {
              selected.forEach((id) => setJobStatus(id, 'canceled'))
              toast('warning', `已取消 ${selected.length} 个任务`)
              setSelected([])
            }}>
              取消
            </Button>
            <Button size="sm" variant="ghost" onClick={() => exportCsv(jobs.filter((j) => selected.includes(j.id)))}>
              导出所选
            </Button>
          </div>
        </div>
      )}

      {tab === 'queued' ? (
        <Panel className="p-3">
          <div className="mb-2 flex items-center gap-2 px-2 text-[11px] text-dim">
            <ListFilter className="h-3.5 w-3.5" />
            队列顺序（拖拽调整优先级，仅本地生效）
          </div>
          <div className="space-y-1">
            {ordered.length === 0 && <div className="py-10 text-center text-[12px] text-dim">队列为空</div>}
            {ordered.map((j, i) => (
              <div
                key={j.id}
                draggable
                onDragStart={() => setDragId(j.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!dragId || dragId === j.id) return
                  const ids = ordered.map((o) => o.id)
                  const from = ids.indexOf(dragId)
                  const to = ids.indexOf(j.id)
                  const next = [...ids]
                  next.splice(from, 1)
                  next.splice(to, 0, dragId)
                  setQueue(next)
                  setDragId(null)
                  toast('info', '队列顺序已更新', '下次调度将按新顺序分配节点')
                }}
                onClick={() => navigate(`/jobs/${j.id}`)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-md border border-transparent px-2 py-2.5 hover:border-line hover:bg-[#151a23]',
                  dragId === j.id && 'opacity-40',
                )}
              >
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-dim" />
                <span className="mono w-6 text-[11px] text-dim">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] text-ink">{j.name}</div>
                  <div className="mt-0.5 text-[10.5px] text-dim">
                    {j.code} · {clientName(j.clientId)}
                  </div>
                </div>
                <OutputSpecText output={j.output} />
                {j.priority === 'rush' ? <Badge tone="warning">加急</Badge> : <span className="w-10 text-right text-[11px] text-dim">标准</span>}
                <span className="w-20 text-right text-[11px] text-dim">
                  {formatMinutes((j.etaSec ?? 3600) / 60)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <DataTable
            columns={columns}
            rows={ordered}
            pageSize={15}
            selectable
            selected={selected}
            onSelectedChange={setSelected}
            onRowClick={(j) => navigate(`/jobs/${j.id}`)}
            emptyTitle="没有符合条件的任务"
            emptyDesc="调整筛选条件，或新建一个转换任务。"
          />
        </Panel>
      )}
    </div>
  )
}
