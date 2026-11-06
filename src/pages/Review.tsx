import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanEye } from 'lucide-react'
import { useDataStore } from '../store/data'
import { PageHeader } from '../components/layout'
import { Badge, Button, Panel, SearchInput, Select, Tabs } from '../components/ui'
import { DataTable, type Column } from '../components/table'
import { JobStatusBadge } from '../components/job'
import { comfortLevel } from '../lib/calc'
import { formatDuration } from '../lib/format'
import type { Job } from '../types'
import { cn } from '../lib/utils'

type TabKey = 'pending' | 'passed' | 'rejected'

export default function Review() {
  const navigate = useNavigate()
  const jobs = useDataStore((s) => s.jobs)
  const clients = useDataStore((s) => s.clients)
  const assets = useDataStore((s) => s.assets)
  const [tab, setTab] = useState<TabKey>('pending')
  const [query, setQuery] = useState('')
  const [clientId, setClientId] = useState('all')
  const [score, setScore] = useState('all')

  const pending = jobs.filter((j) => j.status === 'qa')
  const passed = jobs.filter((j) => j.status === 'completed' && j.metrics)
  const rejected = jobs.filter((j) => j.version > 1 && ['queued', 'rendering', 'depth', 'disparity', 'temporal', 'encoding', 'analyzing'].includes(j.status))

  const rows = useMemo(() => {
    const base = tab === 'pending' ? pending : tab === 'passed' ? passed : rejected
    return base.filter((j) => {
      if (query && !j.name.toLowerCase().includes(query.toLowerCase()) && !j.code.includes(query)) return false
      if (clientId !== 'all' && j.clientId !== clientId) return false
      if (score !== 'all' && j.metrics) {
        if (score === 'high' && j.metrics.comfortScore < 85) return false
        if (score === 'mid' && (j.metrics.comfortScore < 75 || j.metrics.comfortScore >= 85)) return false
        if (score === 'low' && j.metrics.comfortScore >= 75) return false
      }
      return true
    })
  }, [tab, pending, passed, rejected, query, clientId, score])

  const clientName = (id: string) => clients.find((c) => c.id === id)?.shortName ?? '—'

  const columns: Column<Job>[] = [
    {
      key: 'name',
      header: '任务',
      sortValue: (j) => j.name,
      render: (j) => (
        <div className="min-w-0">
          <div className="truncate text-[12.5px] text-ink">{j.name}</div>
          <div className="mt-0.5 text-[10.5px] text-dim">
            {j.code} · {clientName(j.clientId)} · {assets.find((a) => a.id === j.assetId)?.durationSec
              ? formatDuration(assets.find((a) => a.id === j.assetId)!.durationSec)
              : '—'}
          </div>
        </div>
      ),
    },
    { key: 'status', header: '状态', render: (j) => <JobStatusBadge status={j.status} /> },
    {
      key: 'comfort',
      header: '舒适度',
      align: 'right',
      sortValue: (j) => j.metrics?.comfortScore ?? 0,
      render: (j) => {
        if (!j.metrics) return <span className="text-[11px] text-dim">待评估</span>
        const lv = comfortLevel(j.metrics.comfortScore)
        return (
          <span className="inline-flex items-center gap-1.5">
            <span className="mono text-[13px]" style={{ color: lv.tone === 'success' ? 'var(--success)' : lv.tone === 'warning' ? 'var(--warning)' : 'var(--danger)' }}>
              {j.metrics.comfortScore}
            </span>
            <span className="text-[10.5px] text-dim">{lv.label}</span>
          </span>
        )
      },
    },
    {
      key: 'jitter',
      header: '时域抖动',
      align: 'right',
      sortValue: (j) => j.metrics?.temporalJitter ?? 0,
      render: (j) => <span className="mono text-[11.5px] text-muted">{j.metrics ? j.metrics.temporalJitter.toFixed(3) : '—'}</span>,
    },
    {
      key: 'edge',
      header: '边缘伪影',
      align: 'right',
      render: (j) => <span className="mono text-[11.5px] text-muted">{j.metrics ? `${j.metrics.edgeArtifactRate.toFixed(1)}%` : '—'}</span>,
    },
    {
      key: 'window',
      header: '窗口违规',
      align: 'right',
      render: (j) => {
        const v = j.metrics?.windowViolationFrames
        return (
          <span className={cn('mono text-[11.5px]', v === 0 ? 'text-success' : v && v > 3 ? 'text-danger' : 'text-warning')}>
            {v === undefined ? '—' : `${v} 帧`}
          </span>
        )
      },
    },
    {
      key: 'issues',
      header: '问题帧',
      align: 'right',
      render: (j) => <span className="mono text-[11.5px] text-muted">{j.issueFrames?.length ?? 0}</span>,
    },
    {
      key: 'version',
      header: '版本',
      align: 'center',
      render: (j) => <span className="mono text-[11px] text-dim">v{j.version}</span>,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (j) => (
        <Button size="sm" variant={j.status === 'qa' ? 'primary' : 'secondary'} onClick={() => navigate(`/jobs/${j.id}/review`)}>
          {j.status === 'qa' ? '开始质检' : '查看报告'}
        </Button>
      ),
    },
  ]

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title="质检中心"
        desc="逐帧评估空间视频的观看舒适度。指标全部可量化，问题帧可定位到时间码。"
        actions={
          <div className="flex items-center gap-2 text-[11px] text-dim">
            <ScanEye className="h-3.5 w-3.5" />
            阈值：舒适度 ≥85 · 抖动 ≤0.12 · 窗口违规 0 帧
          </div>
        }
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          className="border-b-0"
          items={[
            { key: 'pending', label: '待质检', count: pending.length },
            { key: 'passed', label: '已通过', count: passed.length },
            { key: 'rejected', label: '已退回', count: rejected.length },
          ]}
        />
        <div className="flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="搜索任务" className="w-[200px]" />
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-[140px]">
            <option value="all">全部客户</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName}
              </option>
            ))}
          </Select>
          <Select value={score} onChange={(e) => setScore(e.target.value)} className="w-[130px]">
            <option value="all">全部评分</option>
            <option value="high">优（≥85）</option>
            <option value="mid">良（75-84）</option>
            <option value="low">需修正（&lt;75）</option>
          </Select>
        </div>
      </div>

      <Panel className="mb-4 grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
        {[
          { label: '待质检', value: pending.length, hint: '平均等待 2.4 小时' },
          { label: '本月通过', value: passed.length, hint: '一次通过率 84.6%' },
          { label: '退回重制', value: rejected.length, hint: '主要原因为窗口违规' },
          { label: '平均舒适度', value: passed.length ? (passed.reduce((s, j) => s + (j.metrics?.comfortScore ?? 0), 0) / passed.length).toFixed(1) : '—', hint: '目标 ≥ 85' },
        ].map((s) => (
          <div key={s.label}>
            <div className="text-[11px] text-dim">{s.label}</div>
            <div className="mono mt-1 text-[20px] text-ink">{s.value}</div>
            <div className="mt-0.5 text-[10.5px] text-dim">{s.hint}</div>
          </div>
        ))}
      </Panel>

      <Panel className="overflow-hidden">
        <DataTable
          columns={columns}
          rows={rows}
          pageSize={15}
          onRowClick={(j) => navigate(`/jobs/${j.id}/review`)}
          emptyTitle={tab === 'pending' ? '没有待质检的任务' : '没有符合条件的记录'}
          emptyDesc={tab === 'pending' ? '所有已完成渲染的任务都已通过质检。' : '调整筛选条件后重试。'}
        />
      </Panel>

      <div className="mt-3 flex items-center gap-2 text-[10.5px] text-dim">
        <Badge tone="neutral">注</Badge>
        退回后任务版本号自动 +1 并重新进入队列，同时生成 P2 技术服务工单。
      </div>
    </div>
  )
}
