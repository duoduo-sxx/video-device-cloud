import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { useDataStore } from '../store/data'
import { PageHeader } from '../components/layout'
import { Badge, Panel, SearchInput, Select } from '../components/ui'
import { DataTable, type Column } from '../components/table'
import { CLIENT_LEVEL_LABEL, CLIENT_LEVEL_TONE } from '../lib/constants'
import { formatDate, money, num } from '../lib/format'
import type { Client } from '../types'

export default function Clients() {
  const navigate = useNavigate()
  const clients = useDataStore((s) => s.clients)
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [industry, setIndustry] = useState('all')

  const rows = useMemo(
    () =>
      clients.filter((c) => {
        if (level !== 'all' && c.level !== level) return false
        if (industry !== 'all' && c.industry !== industry) return false
        if (query && !c.name.includes(query) && !c.shortName.includes(query)) return false
        return true
      }),
    [clients, level, industry, query],
  )

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: '客户',
      sortValue: (c) => c.shortName,
      render: (c) => (
        <div>
          <div className="text-[12.5px] text-ink">{c.shortName}</div>
          <div className="mt-0.5 truncate text-[10.5px] text-dim">{c.name}</div>
        </div>
      ),
    },
    { key: 'level', header: '等级', render: (c) => <Badge tone={CLIENT_LEVEL_TONE[c.level]}>{CLIENT_LEVEL_LABEL[c.level]}</Badge> },
    { key: 'industry', header: '行业', render: (c) => <span className="text-[12px] text-muted">{c.industry}</span> },
    {
      key: 'projects',
      header: '项目',
      align: 'right',
      sortValue: (c) => c.stats.projects,
      render: (c) => <span className="mono text-[12px] text-muted">{c.stats.projects}</span>,
    },
    {
      key: 'minutes',
      header: '交付时长',
      align: 'right',
      sortValue: (c) => c.stats.deliveredMinutes,
      render: (c) => <span className="mono text-[12px] text-muted">{c.stats.deliveredMinutes} min</span>,
    },
    {
      key: 'spend',
      header: '累计消费',
      align: 'right',
      sortValue: (c) => c.stats.totalSpendCNY,
      render: (c) => <span className="mono text-[12px] text-ink">{money(c.stats.totalSpendCNY)}</span>,
    },
    {
      key: 'tickets',
      header: '未结工单',
      align: 'right',
      sortValue: (c) => c.stats.openTickets,
      render: (c) => (
        <span className={c.stats.openTickets > 2 ? 'mono text-[12px] text-warning' : 'mono text-[12px] text-muted'}>
          {c.stats.openTickets}
        </span>
      ),
    },
    { key: 'contact', header: '联系人', render: (c) => <span className="text-[12px] text-muted">{c.contact.name} · {c.contact.title}</span> },
    {
      key: 'since',
      header: '合作起始',
      align: 'right',
      sortValue: (c) => c.since,
      render: (c) => <span className="text-[11px] text-dim">{formatDate(c.since)}</span>,
    },
  ]

  const totalSpend = clients.reduce((s, c) => s + c.stats.totalSpendCNY, 0)

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title="客户管理"
        desc="客户的合作历史、消费与未结工单。等级决定 SLA 与结算账期。"
        actions={
          <div className="flex items-center gap-2 text-[11px] text-dim">
            <Users className="h-3.5 w-3.5" />
            {clients.filter((c) => c.level === 'strategic').length} 家战略客户
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ['客户总数', String(clients.length), '本月新增 1 家'],
          ['累计交付', `${num(clients.reduce((s, c) => s + c.stats.deliveredMinutes, 0))} 分钟`, '含归档项目'],
          ['累计消费', money(totalSpend), '已开票口径'],
          ['未结工单', String(clients.reduce((s, c) => s + c.stats.openTickets, 0)), '需本周跟进'],
        ].map(([label, value, hint]) => (
          <Panel key={label} className="p-4">
            <div className="text-[11px] text-dim">{label}</div>
            <div className="mono mt-1.5 text-[20px] text-ink">{value}</div>
            <div className="mt-0.5 text-[10.5px] text-dim">{hint}</div>
          </Panel>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder="搜索客户名称" className="w-[240px]" />
        <Select value={level} onChange={(e) => setLevel(e.target.value)} className="w-[120px]">
          <option value="all">全部等级</option>
          <option value="strategic">战略</option>
          <option value="key">重点</option>
          <option value="normal">普通</option>
        </Select>
        <Select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-[120px]">
          <option value="all">全部行业</option>
          {['纪录片', '广告', '展陈', '文旅', '教育', '演出'].map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </Select>
        <span className="ml-auto text-[11px] text-dim">
          命中 <span className="mono text-muted">{rows.length}</span> 家
        </span>
      </div>

      <Panel className="overflow-hidden">
        <DataTable columns={columns} rows={rows} pageSize={12} onRowClick={(c) => navigate(`/clients/${c.id}`)} emptyTitle="没有匹配的客户" />
      </Panel>
    </div>
  )
}
