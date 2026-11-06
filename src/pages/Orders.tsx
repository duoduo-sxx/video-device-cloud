import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Receipt } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Badge, Button, Panel, SearchInput, Select, Tabs } from '../components/ui'
import { DataTable, type Column } from '../components/table'
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '../lib/constants'
import { formatDate, money } from '../lib/format'
import type { Order } from '../types'

type TabKey = 'all' | 'pending' | 'in_progress' | 'done'

export default function Orders() {
  const navigate = useNavigate()
  const orders = useDataStore((s) => s.orders)
  const clients = useDataStore((s) => s.clients)
  const projects = useDataStore((s) => s.projects)
  const toast = useAppStore((s) => s.toast)

  const [tab, setTab] = useState<TabKey>('all')
  const [query, setQuery] = useState('')
  const [clientId, setClientId] = useState('all')
  const [month, setMonth] = useState('all')

  const active = orders.filter((o) => o.status !== 'canceled')
  const received = orders.filter((o) => ['paid', 'in_production', 'delivered', 'completed'].includes(o.status))
  const pending = orders.filter((o) => o.status === 'pending_confirm')
  const overdue = orders.filter((o) => o.status === 'pending_confirm' && new Date(o.createdAt).getTime() < Date.now() - 30 * 86400000)

  const rows = useMemo(
    () =>
      orders.filter((o) => {
        if (tab === 'pending' && o.status !== 'pending_confirm') return false
        if (tab === 'in_progress' && !['paid', 'in_production'].includes(o.status)) return false
        if (tab === 'done' && !['delivered', 'completed'].includes(o.status)) return false
        if (clientId !== 'all' && o.clientId !== clientId) return false
        if (month !== 'all') {
          const d = new Date(o.createdAt)
          if (`${d.getFullYear()}-${d.getMonth() + 1}` !== month) return false
        }
        if (query) {
          const q = query.toLowerCase()
          const project = projects.find((p) => p.id === o.projectId)
          if (!o.code.toLowerCase().includes(q) && !(project?.name.toLowerCase().includes(q) ?? false)) return false
        }
        return true
      }),
    [orders, tab, clientId, month, query, projects],
  )

  const months = useMemo(() => {
    const set = new Set(orders.map((o) => {
      const d = new Date(o.createdAt)
      return `${d.getFullYear()}-${d.getMonth() + 1}`
    }))
    return Array.from(set).sort().reverse()
  }, [orders])

  const exportCsv = () => {
    const header = ['订单号', '客户', '项目', '服务项', '金额(元)', '状态', '下单时间', '开票状态']
    const lines = rows.map((o) =>
      [
        o.code,
        clients.find((c) => c.id === o.clientId)?.shortName ?? '',
        `"${projects.find((p) => p.id === o.projectId)?.name ?? ''}"`,
        `"${o.items.map((i) => i.service).join(' + ')}"`,
        o.totalCNY,
        ORDER_STATUS_LABEL[o.status],
        formatDate(o.createdAt),
        o.invoice.status === 'issued' ? '已开票' : o.invoice.status === 'requested' ? '申请中' : '未开票',
      ].join(','),
    )
    const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spacescape-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('success', '账单已导出', `${rows.length} 条记录 · CSV`)
  }

  const columns: Column<Order>[] = [
    { key: 'code', header: '订单号', sortValue: (o) => o.code, render: (o) => <span className="mono text-[11.5px] text-muted">{o.code}</span> },
    {
      key: 'client',
      header: '客户 / 项目',
      render: (o) => (
        <div className="min-w-0">
          <div className="text-[12.5px] text-ink">{clients.find((c) => c.id === o.clientId)?.shortName}</div>
          <div className="mt-0.5 truncate text-[10.5px] text-dim">{projects.find((p) => p.id === o.projectId)?.name}</div>
        </div>
      ),
    },
    {
      key: 'items',
      header: '服务项',
      render: (o) => (
        <div className="text-[11.5px] text-muted">
          {o.items.map((i, idx) => (
            <div key={idx} className="whitespace-nowrap">
              {i.service} · {i.minutes} min
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'total',
      header: '金额',
      align: 'right',
      sortValue: (o) => o.totalCNY,
      render: (o) => (
        <div>
          <div className="mono text-[12.5px] text-ink">{money(o.totalCNY)}</div>
          {o.rush && <div className="mt-0.5 text-[10px] text-warning">含加急</div>}
        </div>
      ),
    },
    { key: 'status', header: '状态', render: (o) => <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge> },
    { key: 'created', header: '下单时间', align: 'right', sortValue: (o) => o.createdAt, render: (o) => <span className="text-[11px] text-dim">{formatDate(o.createdAt)}</span> },
    {
      key: 'invoice',
      header: '开票',
      align: 'right',
      render: (o) => (
        <span className={o.invoice.status === 'issued' ? 'text-[11px] text-success' : o.invoice.status === 'requested' ? 'text-[11px] text-warning' : 'text-[11px] text-dim'}>
          {o.invoice.status === 'issued' ? '已开票' : o.invoice.status === 'requested' ? '申请中' : '未开票'}
        </span>
      ),
    },
  ]

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title="订单与账单"
        desc="按输出分钟计费，加急 ×1.5，精修单独计价。账单口径与交付记录一致。"
        actions={
          <Button icon={<Download className="h-3.5 w-3.5" />} onClick={exportCsv}>
            导出账单
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: '本月应收', value: money(active.reduce((s, o) => s + o.totalCNY, 0)), hint: `${active.length} 笔订单`, tone: 'text-ink' },
          { label: '已收', value: money(received.reduce((s, o) => s + o.totalCNY, 0)), hint: `${received.length} 笔已确认收款`, tone: 'text-success' },
          { label: '待收', value: money(pending.reduce((s, o) => s + o.totalCNY, 0)), hint: `${pending.length} 笔待确认`, tone: 'text-warning' },
          { label: '逾期', value: money(overdue.reduce((s, o) => s + o.totalCNY, 0)), hint: `${overdue.length} 笔超 30 天`, tone: 'text-danger' },
        ].map((c) => (
          <Panel key={c.label} className="p-4">
            <div className="text-[11px] text-dim">{c.label}</div>
            <div className={`mono mt-1.5 text-[20px] ${c.tone}`}>{c.value}</div>
            <div className="mt-0.5 text-[10.5px] text-dim">{c.hint}</div>
          </Panel>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          className="border-b-0"
          items={[
            { key: 'all', label: '全部', count: orders.length },
            { key: 'pending', label: '待确认', count: pending.length },
            { key: 'in_progress', label: '收款中', count: orders.filter((o) => ['paid', 'in_production'].includes(o.status)).length },
            { key: 'done', label: '已交付', count: orders.filter((o) => ['delivered', 'completed'].includes(o.status)).length },
          ]}
        />
        <div className="flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="搜索订单号或项目" className="w-[200px]" />
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-[140px]">
            <option value="all">全部客户</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName}
              </option>
            ))}
          </Select>
          <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-[120px]">
            <option value="all">全部月份</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m.replace('-', ' 年 ')} 月
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Panel className="overflow-hidden">
        <DataTable columns={columns} rows={rows} pageSize={12} onRowClick={(o) => navigate(`/orders/${o.id}`)} emptyTitle="没有匹配的订单" />
      </Panel>

      <div className="mt-3 flex items-center gap-2 text-[10.5px] text-dim">
        <Receipt className="h-3 w-3" />
        计费规则：标准转换 4K ¥120 / 8K ¥360 每分钟；精修 4K ¥600 / 8K ¥1,400；Vision Pro 交付适配 ¥60 每分钟；税额 6%。
      </div>
    </div>
  )
}
