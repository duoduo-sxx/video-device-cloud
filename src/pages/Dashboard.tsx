import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Clock, FileVideo, Film, FolderKanban, Headphones, Plus, Upload } from 'lucide-react'
import { useDataStore } from '../store/data'
import { PageHeader, StatCard } from '../components/layout'
import { Button, Badge, Panel, Progress } from '../components/ui'
import { DonutChart, Sparkline, TrendArea } from '../components/charts'
import { JobStatusBadge } from '../components/job'
import { daysLeft, formatDateTime, formatMinutes, money } from '../lib/format'
import { PRIORITY_TONE, PRIORITY_LABEL, PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE } from '../lib/constants'
import { mulberry32 } from '../mock/seed'
import { cn } from '../lib/utils'

export default function Dashboard() {
  const navigate = useNavigate()
  const jobs = useDataStore((s) => s.jobs)
  const projects = useDataStore((s) => s.projects)
  const tickets = useDataStore((s) => s.tickets)
  const nodes = useDataStore((s) => s.nodes)
  const orders = useDataStore((s) => s.orders)
  const clients = useDataStore((s) => s.clients)

  const running = jobs.filter((j) => ['analyzing', 'depth', 'disparity', 'temporal', 'rendering', 'encoding'].includes(j.status))
  const queued = jobs.filter((j) => j.status === 'queued')
  const qaJobs = jobs.filter((j) => j.status === 'qa')
  const completed = jobs.filter((j) => j.status === 'completed')
  const failed = jobs.filter((j) => j.status === 'failed')
  const passRate = completed.length + failed.length > 0 ? (completed.length / (completed.length + failed.length)) * 100 : 0
  const revenue = orders.filter((o) => o.status === 'completed').reduce((s, o) => s + o.totalCNY, 0)
  const totalMinutes = jobs.reduce((s, j) => s + j.billedMinutes, 0)
  const gpuLoad = Math.round(nodes.reduce((s, n) => s + n.utilization, 0) / nodes.length)

  const trend = useMemo(() => {
    const rnd = mulberry32(77)
    const points = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(2026, 8, 20 + i)
      const base = 26 + Math.sin(i / 3.1) * 12 + i * 0.55 + rnd() * 14
      return {
        label: `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        value: Math.round(base),
      }
    })
    const last7 = points.slice(-7).reduce((s, p) => s + p.value, 0)
    const prev7 = points.slice(-14, -7).reduce((s, p) => s + p.value, 0)
    return { points, delta: ((last7 - prev7) / prev7) * 100 }
  }, [])

  const formatDist = useMemo(() => {
    const map = new Map<string, number>()
    jobs.forEach((j) => map.set(j.output.format, (map.get(j.output.format) ?? 0) + 1))
    const label: Record<string, string> = {
      'MV-HEVC': 'MV-HEVC',
      'SBS-Full': 'SBS 全宽',
      'SBS-Half': 'SBS 半宽',
      OU: '上下 3D',
      Anaglyph: '红蓝立体',
    }
    return Array.from(map.entries())
      .map(([k, v]) => ({ name: label[k] ?? k, value: Math.round((v / jobs.length) * 100) }))
      .sort((a, b) => b.value - a.value)
  }, [jobs])

  const openTickets = tickets
    .filter((t) => !['resolved', 'closed'].includes(t.status))
    .sort((a, b) => (a.slaDueAt < b.slaDueAt ? -1 : 1))
    .slice(0, 5)

  const upcoming = projects
    .filter((p) => ['active', 'pending_acceptance'].includes(p.status))
    .sort((a, b) => daysLeft(a.dueDate) - daysLeft(b.dueDate))
    .slice(0, 3)

  const clientName = (id: string) => clients.find((c) => c.id === id)?.shortName ?? '—'

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title="工作台"
        desc="生产、质检与交付的实时概览。数据每 900 毫秒随任务推进刷新。"
        actions={
          <>
            <Button icon={<Upload className="h-3.5 w-3.5" />} onClick={() => navigate('/assets')}>
              导入素材
            </Button>
            <Button variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => navigate('/jobs/new')}>
              新建转换任务
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="近 30 天空间化时长"
          value={totalMinutes.toLocaleString('zh-CN')}
          unit="分钟"
          delta={`+${trend.delta.toFixed(1)}%`}
          deltaLabel="环比"
          spark={trend.points.slice(-12).map((p) => p.value)}
        />
        <StatCard
          label="进行中任务"
          value={String(running.length + qaJobs.length)}
          unit={`个 · 队列 ${queued.length}`}
          delta={`+${Math.max(1, running.length - 2)}`}
          deltaLabel="较昨日"
          tone="accent"
          spark={[3, 5, 4, 6, 7, 6, 8, 7, 9, 8, 9, 10]}
        />
        <StatCard
          label="一次通过率"
          value={passRate.toFixed(1)}
          unit="%"
          delta={passRate >= 90 ? '+1.4pt' : '-2.1pt'}
          deltaLabel="目标 95%"
          tone={passRate >= 90 ? 'success' : 'danger'}
          spark={[87, 88, 90, 89, 91, 90, 92, 91, 93, 92, 92, 92]}
        />
        <StatCard
          label="近 30 天营收"
          value={money(revenue).replace('¥', '')}
          unit="元"
          delta="+12.4%"
          deltaLabel="环比"
          tone="success"
          spark={[42, 48, 45, 52, 58, 55, 61, 64, 60, 68, 72, 76]}
        />
      </div>

      <Panel className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-3.5">
        {[
          { label: '队列等待', value: `${queued.length} 个任务`, icon: <Clock className="h-3.5 w-3.5" /> },
          { label: 'GPU 集群负载', value: `${gpuLoad}%`, icon: <FileVideo className="h-3.5 w-3.5" /> },
          { label: '平均单分钟处理耗时', value: '2.4 min', icon: <Film className="h-3.5 w-3.5" /> },
          { label: '准时交付率', value: '96.2%', icon: <FolderKanban className="h-3.5 w-3.5" /> },
          { label: '待处理工单', value: `${openTickets.length + 8} 条`, icon: <Headphones className="h-3.5 w-3.5" /> },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-2">
            <span className="text-dim">{m.icon}</span>
            <span className="text-[11px] text-dim">{m.label}</span>
            <span className="mono text-[12px] text-ink">{m.value}</span>
          </div>
        ))}
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="text-[14px] text-ink">转换量趋势</div>
              <div className="mt-1 text-[11px] text-dim">近 30 天每日完成的空间化分钟数</div>
            </div>
            <Badge tone="primary" dot>
              日均 {Math.round(trend.points.reduce((s, p) => s + p.value, 0) / 30)} 分钟
            </Badge>
          </div>
          <TrendArea data={trend.points} name="空间化分钟" suffix=" 分钟" height={228} />
        </Panel>

        <Panel className="p-5">
          <div className="mb-3 text-[14px] text-ink">输出格式分布</div>
          <div className="mt-2">
            <DonutChart data={formatDist} height={168} centerValue={String(jobs.length)} centerLabel="任务总数" />
          </div>
          <div className="mt-4 border-t border-line-subtle pt-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-dim">Vision Pro 交付占比</span>
              <span className="mono text-ink">{formatDist.find((f) => f.name === 'MV-HEVC')?.value ?? 0}%</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-dim">平均输出码率</span>
              <span className="mono text-ink">182 Mbps</span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel className="p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[14px] text-ink">进行中的任务</div>
              <div className="mt-1 text-[11px] text-dim">按创建时间排序，进度实时推进</div>
            </div>
            <Link to="/jobs" className="flex items-center gap-1 text-[11px] text-primary hover:underline">
              查看全部 <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-0.5">
            {[...running, ...queued].slice(0, 5).map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-[#151a23]"
              >
                <div className="w-[38%] min-w-0">
                  <div className="truncate text-[12.5px] text-ink">{job.name}</div>
                  <div className="mt-0.5 truncate text-[11px] text-dim">
                    {clientName(job.clientId)} · {job.code}
                  </div>
                </div>
                <div className="w-[90px]">
                  <JobStatusBadge status={job.status} />
                </div>
                <div className="flex-1">
                  <Progress value={job.progress} animated={running.includes(job)} />
                </div>
                <span className="mono w-9 text-right text-[11px] text-muted">{Math.round(job.progress)}%</span>
                <span className="w-16 text-right text-[11px] text-dim">
                  {job.etaSec ? formatMinutes(job.etaSec / 60) : job.status === 'queued' ? '等待调度' : '—'}
                </span>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[14px] text-ink">待处理工单</div>
            <Link to="/tickets" className="text-[11px] text-primary hover:underline">
              服务台
            </Link>
          </div>
          <div className="space-y-2.5">
            {openTickets.map((t) => {
              const remain = new Date(t.slaDueAt).getTime() - Date.now()
              const overdue = remain < 0
              const urgent = remain < 20 * 60 * 1000
              return (
                <Link key={t.id} to={`/tickets/${t.id}`} className="block rounded-md px-2 py-2 hover:bg-[#151a23]">
                  <div className="flex items-start gap-2">
                    <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
                    <span className="line-clamp-2 flex-1 text-[12px] leading-5 text-ink">{t.title}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between pl-0.5">
                    <span className="text-[10.5px] text-dim">
                      {t.code} · {clientName(t.clientId)}
                    </span>
                    <span className={cn('mono text-[10.5px]', overdue ? 'text-danger' : urgent ? 'text-warning' : 'text-dim')}>
                      {overdue ? '已超时 ' : 'SLA '}
                      {Math.abs(remain) > 3600000
                        ? `${Math.round(Math.abs(remain) / 3600000)}h`
                        : `${Math.round(Math.abs(remain) / 60000)}m`}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel className="p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[14px] text-ink">临近交期的项目</div>
            <Link to="/projects" className="text-[11px] text-primary hover:underline">
              项目管理
            </Link>
          </div>
          <div className="space-y-2">
            {upcoming.map((p) => {
              const left = daysLeft(p.dueDate)
              return (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-[#151a23]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] text-ink">{p.name}</div>
                    <div className="mt-0.5 text-[11px] text-dim">
                      {p.code} · {clientName(p.clientId)}
                    </div>
                  </div>
                  <Badge tone={PROJECT_STATUS_TONE[p.status]}>{PROJECT_STATUS_LABEL[p.status]}</Badge>
                  <div className="w-24">
                    <Progress value={p.progress} tone={left <= 3 ? 'warning' : 'primary'} />
                  </div>
                  <span className="mono w-9 text-right text-[11px] text-muted">{p.progress}%</span>
                  <span className={cn('w-16 text-right text-[11px]', left <= 3 ? 'text-warning' : 'text-dim')}>
                    {left} 天
                  </span>
                </Link>
              )
            })}
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[14px] text-ink">节点负载</div>
            <Link to="/nodes" className="text-[11px] text-primary hover:underline">
              集群
            </Link>
          </div>
          <div className="space-y-2.5">
            {nodes.map((n) => (
              <div key={n.id} className="flex items-center gap-2">
                <span className="mono w-16 text-[11px] text-muted">{n.hostname}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1c2230]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${n.utilization}%`,
                      background: n.status === 'maintenance' ? 'var(--text-dim)' : n.utilization > 85 ? 'var(--warning)' : 'var(--primary)',
                    }}
                  />
                </div>
                <span className="mono w-8 text-right text-[10.5px] text-dim">{n.utilization}%</span>
                <span className="mono w-9 text-right text-[10.5px] text-dim">{n.temperatureC}°</span>
                <Sparkline values={n.sparkline.slice(-12)} width={44} height={16} color={n.status === 'maintenance' ? 'var(--text-dim)' : 'var(--accent)'} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-5 flex items-center justify-between text-[11px] text-dim">
        <span>
          数据截至 {formatDateTime(new Date().toISOString())} · 共 {jobs.length} 个任务 / {projects.length} 个项目 / {tickets.length} 条工单
        </span>
        <span className="mono">SpaceScape v1.0.0</span>
      </div>
    </div>
  )
}
