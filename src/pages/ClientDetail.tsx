import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { useDataStore } from '../store/data'
import { PageHeader } from '../components/layout'
import { Badge, Button, EmptyState, KV, Panel, Progress, Tabs } from '../components/ui'
import { DataTable, type Column } from '../components/table'
import { MiniBars } from '../components/charts'
import { CLIENT_LEVEL_LABEL, CLIENT_LEVEL_TONE, ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PRIORITY_TONE, PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE, TICKET_STATUS_LABEL, TICKET_STATUS_TONE } from '../lib/constants'
import { formatDate, formatDateTime, money } from '../lib/format'
import type { Order, Project, Ticket } from '../types'

type TabKey = 'overview' | 'projects' | 'orders' | 'tickets'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const client = useDataStore((s) => s.clients.find((c) => c.id === id))
  const projects = useDataStore((s) => s.projects.filter((p) => p.clientId === id))
  const orders = useDataStore((s) => s.orders.filter((o) => o.clientId === id))
  const tickets = useDataStore((s) => s.tickets.filter((t) => t.clientId === id))
  const team = useDataStore((s) => s.team)
  const [tab, setTab] = useState<TabKey>('overview')

  const monthly = useMemo(() => {
    const map = new Map<string, number>()
    orders.forEach((o) => {
      const d = new Date(o.createdAt)
      const key = `${d.getMonth() + 1}月`
      map.set(key, (map.get(key) ?? 0) + o.totalCNY)
    })
    return Array.from(map.entries())
      .slice(-6)
      .map(([label, value]) => ({ label, value: Math.round(value / 1000) }))
  }, [orders])

  if (!client) {
    return (
      <Panel className="p-10 text-center">
        <div className="text-[14px] text-ink">客户不存在</div>
        <Button className="mt-4" variant="primary" onClick={() => navigate('/clients')}>
          返回客户列表
        </Button>
      </Panel>
    )
  }

  const projectColumns: Column<Project>[] = [
    { key: 'code', header: '编号', render: (p) => <span className="mono text-[11px] text-dim">{p.code}</span> },
    {
      key: 'name',
      header: '项目',
      render: (p) => (
        <div>
          <div className="text-[12.5px] text-ink">{p.name}</div>
          <div className="mt-0.5 text-[10.5px] text-dim">{p.type} · {p.totalMinutes} 分钟</div>
        </div>
      ),
    },
    { key: 'status', header: '状态', render: (p) => <Badge tone={PROJECT_STATUS_TONE[p.status]}>{PROJECT_STATUS_LABEL[p.status]}</Badge> },
    {
      key: 'progress',
      header: '进度',
      render: (p) => (
        <div className="flex items-center gap-2">
          <div className="w-20">
            <Progress value={p.progress} />
          </div>
          <span className="mono text-[11px] text-muted">{p.progress}%</span>
        </div>
      ),
    },
    { key: 'budget', header: '预算', align: 'right', render: (p) => <span className="mono text-[11.5px] text-muted">{money(p.budgetCNY)}</span> },
    { key: 'due', header: '交期', align: 'right', render: (p) => <span className="text-[11px] text-dim">{formatDate(p.dueDate)}</span> },
  ]

  const orderColumns: Column<Order>[] = [
    { key: 'code', header: '订单号', render: (o) => <span className="mono text-[11px] text-muted">{o.code}</span> },
    { key: 'service', header: '服务项', render: (o) => <span className="text-[12px] text-ink">{o.items.map((i) => i.service).join(' + ')}</span> },
    { key: 'status', header: '状态', render: (o) => <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge> },
    { key: 'total', header: '金额', align: 'right', render: (o) => <span className="mono text-[12px] text-ink">{money(o.totalCNY)}</span> },
    { key: 'created', header: '下单时间', align: 'right', render: (o) => <span className="text-[11px] text-dim">{formatDate(o.createdAt)}</span> },
  ]

  const ticketColumns: Column<Ticket>[] = [
    { key: 'code', header: '工单号', render: (t) => <span className="mono text-[11px] text-muted">{t.code}</span> },
    { key: 'title', header: '标题', render: (t) => <span className="line-clamp-1 text-[12px] text-ink">{t.title}</span> },
    { key: 'priority', header: '优先级', render: (t) => <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge> },
    { key: 'status', header: '状态', render: (t) => <Badge tone={TICKET_STATUS_TONE[t.status]}>{TICKET_STATUS_LABEL[t.status]}</Badge> },
    { key: 'created', header: '创建时间', align: 'right', render: (t) => <span className="text-[11px] text-dim">{formatDateTime(t.createdAt)}</span> },
  ]

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title={client.name}
        back={{ to: '/clients', label: '返回客户列表' }}
        desc={
          <span className="flex flex-wrap items-center gap-2">
            <span>{client.industry}</span>
            <span className="text-dim">·</span>
            <span>合作始于 {formatDate(client.since)}</span>
            <span className="text-dim">·</span>
            <span>账期 {client.paymentTermDays} 天</span>
          </span>
        }
        meta={
          <>
            <Badge tone={CLIENT_LEVEL_TONE[client.level]}>{CLIENT_LEVEL_LABEL[client.level]}客户</Badge>
            {client.tags.map((t) => (
              <Badge key={t} tone="neutral">
                {t}
              </Badge>
            ))}
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ['项目数', String(client.stats.projects), `${projects.filter((p) => p.status === 'active').length} 个进行中`],
          ['已交付时长', `${client.stats.deliveredMinutes} 分钟`, '含归档项目'],
          ['累计消费', money(client.stats.totalSpendCNY), '已完成订单口径'],
          ['未结工单', String(client.stats.openTickets), client.stats.openTickets > 0 ? '需客户成功跟进' : '暂无待处理'],
        ].map(([label, value, hint]) => (
          <Panel key={label} className="p-4">
            <div className="text-[11px] text-dim">{label}</div>
            <div className="mono mt-1.5 text-[20px] text-ink">{value}</div>
            <div className="mt-0.5 text-[10.5px] text-dim">{hint}</div>
          </Panel>
        ))}
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { key: 'overview', label: '概览' },
          { key: 'projects', label: '项目', count: projects.length },
          { key: 'orders', label: '订单', count: orders.length },
          { key: 'tickets', label: '工单', count: tickets.length },
        ]}
        className="mb-4"
      />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Panel className="p-5 xl:col-span-2">
            <div className="mb-1 text-[13px] text-ink">近 6 个月消费</div>
            <div className="mb-2 text-[10.5px] text-dim">单位：千元</div>
            {monthly.length ? (
              <MiniBars data={monthly} height={180} />
            ) : (
              <div className="py-10 text-center text-[11.5px] text-dim">暂无订单记录</div>
            )}
          </Panel>

          <Panel className="p-5">
            <div className="mb-3 text-[13px] text-ink">联系人</div>
            <div className="text-[13px] text-ink">{client.contact.name}</div>
            <div className="mt-0.5 text-[11px] text-dim">{client.contact.title}</div>
            <div className="mt-3 space-y-2 text-[11.5px] text-muted">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-dim" />
                {client.contact.phone}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-dim" />
                {client.contact.email}
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dim" />
                <span className="leading-5">{client.address}</span>
              </div>
            </div>
            <div className="mt-4 border-t border-line-subtle pt-3">
              <KV label="税号" mono>
                {client.taxNo}
              </KV>
              <KV label="结算账期">{client.paymentTermDays} 天</KV>
              <KV label="负责制片">{team.find((t) => t.id === projects[0]?.ownerId)?.name ?? '—'}</KV>
            </div>
          </Panel>

          <Panel className="p-5 xl:col-span-2">
            <div className="mb-3 text-[13px] text-ink">合作备注</div>
            <p className="text-[12px] leading-6 text-muted">{client.note ?? '暂无特别约定。常规交付包含 MV-HEVC 母版与质检报告，修改轮次不超过 2 轮。'}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {client.tags.map((t) => (
                <span key={t} className="rounded border border-line-subtle px-2 py-1 text-[10.5px] text-dim">
                  {t}
                </span>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'projects' && (
        <Panel className="overflow-hidden">
          {projects.length ? (
            <DataTable columns={projectColumns} rows={projects} pageSize={10} onRowClick={(p) => navigate(`/projects/${p.id}`)} />
          ) : (
            <EmptyState title="暂无项目" desc="该客户还没有创建项目。" />
          )}
        </Panel>
      )}

      {tab === 'orders' && (
        <Panel className="overflow-hidden">
          {orders.length ? (
            <DataTable columns={orderColumns} rows={orders} pageSize={10} onRowClick={(o) => navigate(`/orders/${o.id}`)} />
          ) : (
            <EmptyState title="暂无订单" desc="该客户还没有产生订单。" />
          )}
        </Panel>
      )}

      {tab === 'tickets' && (
        <Panel className="overflow-hidden">
          {tickets.length ? (
            <DataTable columns={ticketColumns} rows={tickets} pageSize={10} onRowClick={(t) => navigate(`/tickets/${t.id}`)} />
          ) : (
            <EmptyState title="暂无工单" desc="该客户没有技术咨询或故障记录。" />
          )}
        </Panel>
      )}
    </div>
  )
}
