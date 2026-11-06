import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Download, FileCheck2, Flag, Wallet } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Avatar, Badge, Button, EmptyState, KV, Panel, Progress, Tabs } from '../components/ui'
import { DataTable, type Column } from '../components/table'
import { JobStatusBadge, OutputSpecText, ProgressCell } from '../components/job'
import { daysLeft, formatDate, formatDateTime, formatMinutes, money } from '../lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE, TICKET_STATUS_LABEL, TICKET_STATUS_TONE } from '../lib/constants'
import type { Job, Order, Ticket } from '../types'
import { cn } from '../lib/utils'

type TabKey = 'overview' | 'jobs' | 'deliverables' | 'orders' | 'tickets' | 'activity'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const project = useDataStore((s) => s.projects.find((p) => p.id === id))
  const client = useDataStore((s) => (project ? s.clients.find((c) => c.id === project.clientId) : undefined))
  const owner = useDataStore((s) => (project ? s.team.find((t) => t.id === project.ownerId) : undefined))
  const jobs = useDataStore((s) => s.jobs.filter((j) => j.projectId === id))
  const orders = useDataStore((s) => s.orders.filter((o) => o.projectId === id))
  const tickets = useDataStore((s) => s.tickets.filter((t) => t.projectId === id))
  const setProjectStatus = useDataStore((s) => s.setProjectStatus)
  const toast = useAppStore((s) => s.toast)
  const [tab, setTab] = useState<TabKey>('overview')

  if (!project) {
    return (
      <Panel className="p-10 text-center">
        <div className="text-[14px] text-ink">项目不存在</div>
        <Button className="mt-4" variant="primary" onClick={() => navigate('/projects')}>
          返回项目列表
        </Button>
      </Panel>
    )
  }

  const left = daysLeft(project.dueDate)
  const budgetRatio = project.budgetCNY ? (project.spentCNY / project.budgetCNY) * 100 : 0
  const nextStatus: Record<string, { to: 'active' | 'pending_acceptance' | 'delivered'; label: string } | undefined> = {
    draft: { to: 'active', label: '启动项目' },
    active: { to: 'pending_acceptance', label: '提交验收' },
    pending_acceptance: { to: 'delivered', label: '确认交付' },
  }
  const next = nextStatus[project.status]

  const jobColumns: Column<Job>[] = [
    {
      key: 'name',
      header: '任务',
      render: (j) => (
        <div>
          <div className="truncate text-[12.5px] text-ink">{j.name}</div>
          <div className="mono mt-0.5 text-[10.5px] text-dim">{j.code}</div>
        </div>
      ),
    },
    { key: 'output', header: '输出规格', render: (j) => <OutputSpecText output={j.output} /> },
    { key: 'status', header: '状态', render: (j) => <JobStatusBadge status={j.status} /> },
    { key: 'progress', header: '进度', render: (j) => <ProgressCell job={j} /> },
    {
      key: 'cost',
      header: '费用',
      align: 'right',
      render: (j) => <span className="mono text-[11.5px] text-muted">{money(j.costCNY)}</span>,
    },
  ]

  const orderColumns: Column<Order>[] = [
    { key: 'code', header: '订单号', render: (o) => <span className="mono text-[11.5px] text-muted">{o.code}</span> },
    { key: 'items', header: '服务项', render: (o) => <span className="text-[12px] text-ink">{o.items.map((i) => i.service).join(' + ')}</span> },
    { key: 'status', header: '状态', render: (o) => <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge> },
    { key: 'total', header: '金额', align: 'right', render: (o) => <span className="mono text-[12px] text-ink">{money(o.totalCNY)}</span> },
    { key: 'created', header: '下单时间', align: 'right', render: (o) => <span className="text-[11px] text-dim">{formatDate(o.createdAt)}</span> },
  ]

  const ticketColumns: Column<Ticket>[] = [
    { key: 'code', header: '工单号', render: (t) => <span className="mono text-[11.5px] text-muted">{t.code}</span> },
    { key: 'title', header: '标题', render: (t) => <span className="line-clamp-1 text-[12px] text-ink">{t.title}</span> },
    { key: 'priority', header: '优先级', render: (t) => <Badge tone={t.priority === 'P0' ? 'danger' : t.priority === 'P1' ? 'warning' : 'neutral'}>{t.priority}</Badge> },
    { key: 'status', header: '状态', render: (t) => <Badge tone={TICKET_STATUS_TONE[t.status]}>{TICKET_STATUS_LABEL[t.status]}</Badge> },
    { key: 'created', header: '创建时间', align: 'right', render: (t) => <span className="text-[11px] text-dim">{formatDateTime(t.createdAt)}</span> },
  ]

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title={project.name}
        back={{ to: '/projects', label: '返回项目列表' }}
        desc={
          <span className="flex flex-wrap items-center gap-2">
            <span className="mono text-[11.5px] text-dim">{project.code}</span>
            <span className="text-dim">·</span>
            <span>{client?.shortName}</span>
            <span className="text-dim">·</span>
            <span>{project.type}</span>
            <span className="text-dim">·</span>
            <span>
              {formatDate(project.startDate)} → {formatDate(project.dueDate)}
            </span>
          </span>
        }
        meta={
          <>
            <Badge tone={PROJECT_STATUS_TONE[project.status]}>{PROJECT_STATUS_LABEL[project.status]}</Badge>
            <Badge tone={left <= 5 && project.progress < 90 ? 'warning' : 'neutral'}>
              {left >= 0 ? `剩余 ${left} 天` : `逾期 ${-left} 天`}
            </Badge>
            {owner && (
              <span className="flex items-center gap-1.5 text-[11px] text-dim">
                <Avatar name={owner.name} hue={owner.avatarHue} size={20} /> {owner.name}
              </span>
            )}
          </>
        }
        actions={
          next ? (
            <Button
              variant="primary"
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              onClick={() => {
                setProjectStatus(project.id, next.to)
                toast('success', `项目状态已更新`, `${PROJECT_STATUS_LABEL[next.to]}`)
              }}
            >
              {next.label}
            </Button>
          ) : (
            <Button
              onClick={() => {
                navigate(`/jobs/new?assets=`)
              }}
            >
              新建转换任务
            </Button>
          )
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { key: 'overview', label: '概览' },
          { key: 'jobs', label: '任务', count: jobs.length },
          { key: 'deliverables', label: '交付物', count: project.deliverables.length },
          { key: 'orders', label: '订单', count: orders.length },
          { key: 'tickets', label: '工单', count: tickets.length },
          { key: 'activity', label: '动态' },
        ]}
        className="mb-4"
      />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <Panel className="p-5">
              <div className="mb-2 text-[13px] text-ink">项目说明</div>
              <p className="text-[12px] leading-6 text-muted">{project.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line-subtle pt-4 md:grid-cols-4">
                {[
                  ['素材数', `${project.assetCount} 条`],
                  ['总时长', `${project.totalMinutes} 分钟`],
                  ['任务数', `${jobs.length} 个`],
                  ['交付物', `${project.deliverables.length} 项`],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div className="text-[10.5px] text-dim">{l}</div>
                    <div className="mono mt-1 text-[15px] text-ink">{v}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[13px] text-ink">里程碑</div>
                <span className="text-[10.5px] text-dim">
                  已完成 {project.milestones.filter((m) => m.done).length} / {project.milestones.length}
                </span>
              </div>
              <div className="space-y-3">
                {project.milestones.map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full border text-[10px]',
                          m.done ? 'border-primary bg-[rgba(61,125,255,0.16)] text-[#8db3ff]' : 'border-line text-dim',
                        )}
                      >
                        {m.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Flag className="h-3 w-3" />}
                      </span>
                      {i < project.milestones.length - 1 && <span className="mt-1 h-8 w-px bg-line" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className={cn('text-[12.5px]', m.done ? 'text-ink' : 'text-muted')}>{m.name}</div>
                      <div className="mt-0.5 text-[10.5px] text-dim">
                        {m.date} {m.done ? '· 已完成' : '· 待完成'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-5">
              <div className="mb-3 text-[13px] text-ink">交付物</div>
              {project.deliverables.length === 0 ? (
                <div className="py-4 text-[11.5px] text-dim">尚未生成交付物。完成渲染并通过质检后自动生成。</div>
              ) : (
                <div className="space-y-2">
                  {project.deliverables.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-md border border-line-subtle px-3 py-2">
                      <FileCheck2 className="h-4 w-4 shrink-0 text-success" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono text-[11.5px] text-ink">{d.name}</div>
                        <div className="mt-0.5 text-[10.5px] text-dim">
                          {d.format} · {d.minutes} 分钟 · {d.version} · {formatDate(d.createdAt)}
                        </div>
                      </div>
                      <Badge tone={d.accepted ? 'success' : 'warning'}>{d.accepted ? '已验收' : '待验收'}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => toast('info', '开始下载', `${d.name}（演示环境不产生真实文件）`)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel className="p-5">
              <div className="mb-3 text-[13px] text-ink">整体进度</div>
              <div className="flex items-end gap-2">
                <span className="mono text-[30px] leading-none text-ink">{project.progress}%</span>
                <span className="mb-1 text-[10.5px] text-dim">完成度</span>
              </div>
              <Progress value={project.progress} className="mt-3 h-2" tone={project.progress === 100 ? 'success' : 'primary'} />
              <div className="mt-3 divide-y divide-[#1a1f29]">
                <KV label="开始日期">{formatDate(project.startDate)}</KV>
                <KV label="计划交期">{formatDate(project.dueDate)}</KV>
                <KV label="实际交付">{formatDate(project.deliveredAt)}</KV>
              </div>
            </Panel>

            <Panel className="p-5">
              <div className="mb-3 flex items-center gap-1.5 text-[13px] text-ink">
                <Wallet className="h-3.5 w-3.5 text-dim" /> 预算
              </div>
              <div className="flex items-end justify-between">
                <span className="mono text-[20px] text-ink">{money(project.spentCNY)}</span>
                <span className="text-[11px] text-dim">/ {money(project.budgetCNY)}</span>
              </div>
              <Progress value={budgetRatio} className="mt-2" tone={budgetRatio > 90 ? 'danger' : budgetRatio > 70 ? 'warning' : 'success'} />
              <div className="mt-2 text-[10.5px] text-dim">
                已使用 {budgetRatio.toFixed(1)}%，剩余 {money(Math.max(0, project.budgetCNY - project.spentCNY))}
              </div>
            </Panel>

            <Panel className="p-5">
              <div className="mb-3 text-[13px] text-ink">风险提示</div>
              <div className="space-y-2">
                {left <= 7 && project.progress < 90 && (
                  <div className="rounded-md border border-[rgba(245,165,36,0.25)] bg-[rgba(245,165,36,0.06)] px-3 py-2 text-[11px] leading-5 text-[#f0c07a]">
                    距交期仅 {left} 天，当前完成度 {project.progress}%，建议增配节点或拆分批次。
                  </div>
                )}
                {budgetRatio > 85 && (
                  <div className="rounded-md border border-[rgba(244,82,92,0.25)] bg-[rgba(244,82,92,0.06)] px-3 py-2 text-[11px] leading-5 text-[#ff9a9f]">
                    预算使用已达 {budgetRatio.toFixed(0)}%，继续加工需商务确认。
                  </div>
                )}
                {left > 7 && budgetRatio <= 85 && (
                  <div className="rounded-md border border-line-subtle bg-[#0e1118] px-3 py-2 text-[11px] leading-5 text-dim">
                    暂无风险项。所有任务进度正常。
                  </div>
                )}
              </div>
            </Panel>

            <Panel className="p-5">
              <div className="mb-2 text-[13px] text-ink">客户</div>
              <div className="text-[12px] text-ink">{client?.name}</div>
              <div className="mt-1 text-[11px] text-dim">
                {client?.contact.name} · {client?.contact.title}
              </div>
              <div className="mt-1 text-[11px] text-dim">{client?.contact.phone}</div>
              <Link to={`/clients/${client?.id}`} className="mt-2 inline-block text-[11px] text-primary hover:underline">
                查看客户档案
              </Link>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'jobs' && (
        <Panel className="overflow-hidden">
          {jobs.length ? (
            <DataTable columns={jobColumns} rows={jobs} pageSize={12} onRowClick={(j) => navigate(`/jobs/${j.id}`)} />
          ) : (
            <EmptyState title="还没有转换任务" desc="从素材库选择素材，创建一个转换任务。" action={<Button variant="primary" onClick={() => navigate('/jobs/new')}>新建任务</Button>} />
          )}
        </Panel>
      )}

      {tab === 'deliverables' && (
        <Panel className="overflow-hidden">
          {project.deliverables.length ? (
            <div className="divide-y divide-[#1a1f29]">
              {project.deliverables.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                  <FileCheck2 className="h-4 w-4 text-success" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-[12px] text-ink">{d.name}</div>
                    <div className="mt-0.5 text-[10.5px] text-dim">
                      {d.format} · {d.minutes} 分钟 · {d.version} · 生成于 {formatDateTime(d.createdAt)}
                    </div>
                  </div>
                  <Badge tone={d.accepted ? 'success' : 'warning'}>{d.accepted ? '已验收' : '待验收'}</Badge>
                  <Button size="sm" icon={<Download className="h-3 w-3" />} onClick={() => toast('info', '开始下载', d.name)}>
                    下载
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="暂无交付物" desc="完成渲染并通过质检后，系统会自动生成交付物记录。" />
          )}
        </Panel>
      )}

      {tab === 'orders' && (
        <Panel className="overflow-hidden">
          {orders.length ? (
            <DataTable columns={orderColumns} rows={orders} pageSize={10} onRowClick={(o) => navigate(`/orders/${o.id}`)} />
          ) : (
            <EmptyState title="暂无订单" desc="该项目的订单尚未创建。" />
          )}
        </Panel>
      )}

      {tab === 'tickets' && (
        <Panel className="overflow-hidden">
          {tickets.length ? (
            <DataTable columns={ticketColumns} rows={tickets} pageSize={10} onRowClick={(t) => navigate(`/tickets/${t.id}`)} />
          ) : (
            <EmptyState title="暂无工单" desc="该项目没有技术咨询或故障记录。" />
          )}
        </Panel>
      )}

      {tab === 'activity' && (
        <Panel className="p-5">
          <div className="space-y-4">
            {[
              { ts: project.startDate, title: '项目创建', desc: `由 ${owner?.name ?? '制片'} 创建，预算 ${money(project.budgetCNY)}` },
              { ts: project.milestones[0]?.date ?? project.startDate, title: '素材接收与技审', desc: `共 ${project.assetCount} 条素材，总时长 ${project.totalMinutes} 分钟` },
              ...(jobs.length ? [{ ts: jobs[0].createdAt, title: '首批任务进入队列', desc: `${jobs.length} 个转换任务，其中 ${jobs.filter((j) => j.status === 'completed').length} 个已完成` }] : []),
              ...(project.deliverables.length ? [{ ts: project.deliverables[0].createdAt, title: '生成交付物', desc: `${project.deliverables.length} 项交付物，等待客户验收` }] : []),
              ...(project.deliveredAt ? [{ ts: project.deliveredAt, title: '项目已交付', desc: '客户确认验收，项目进入归档流程' }] : []),
            ]
              .sort((a, b) => (a.ts < b.ts ? 1 : -1))
              .map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <span className="mt-1 w-px flex-1 bg-line" />
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] text-ink">{a.title}</span>
                      <span className="text-[10.5px] text-dim">{formatDateTime(a.ts)}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-dim">{a.desc}</div>
                  </div>
                </div>
              ))}
          </div>
        </Panel>
      )}

      <div className="mt-4 text-[10.5px] text-dim">
        计划交期 {formatDate(project.dueDate)} · 已投入 {formatMinutes(project.totalMinutes)} 内容 · 关联 {jobs.length} 个任务 / {orders.length} 笔订单
      </div>
    </div>
  )
}
