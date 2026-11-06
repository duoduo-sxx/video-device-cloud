import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Filter, LayoutGrid, List, Plus, Search } from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { Badge, Button, Card, Input, Segmented, Select } from '../components/ui'
import { EmptyState, PageHeader, SlaBar, Skeleton } from '../components/common'
import { Avatar } from '../components/ui'
import { ORDER_BOARD_COLUMNS, ORDER_STATUS_META } from '../lib/constants'
import { formatCny } from '../lib/pricing'
import { dateOnly } from '../lib/format'
import { db } from '../mock/db'
import { cn } from '../lib/cn'
import type { OrderStatus, ServiceOrder } from '../types'

export default function OrderBoard() {
  const navigate = useNavigate()
  const { data, loading } = useAsync(() => api.listOrders(), [])
  const [orders, setOrders] = useState<ServiceOrder[] | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<string | null>(null)
  const [view, setView] = useState('board')
  const [keyword, setKeyword] = useState('')
  const [customer, setCustomer] = useState('all')

  const list = orders ?? data ?? []

  const customers = useMemo(() => Array.from(new Set(list.map((o) => o.customerName))), [list])

  const filtered = list.filter((o) => {
    if (customer !== 'all' && o.customerName !== customer) return false
    if (keyword) {
      const k = keyword.toLowerCase()
      return o.title.toLowerCase().includes(k) || o.code.toLowerCase().includes(k) || o.customerName.includes(keyword)
    }
    return true
  })

  async function move(id: string, status: OrderStatus) {
    const target = list.find((o) => o.id === id)
    if (!target || target.status === status) return
    setOrders(list.map((o) => (o.id === id ? { ...o, status } : o)))
    await api.updateOrderStatus(id, status)
  }

  const overdue = list.filter((o) => {
    if (['settled', 'canceled', 'accepted'].includes(o.status)) return false
    return new Date(o.slaDeadline).getTime() < Date.now()
  })

  return (
    <div>
      <PageHeader
        title="工单看板"
        desc="从需求到结算的十段式流程。拖拽卡片即可推进状态，SLA 倒计时实时计算。"
        actions={
          <>
            <Button onClick={() => navigate('/service')}>
              <Plus size={14} /> 新建需求
            </Button>
            <Button variant="primary" onClick={() => navigate('/service/orders/' + (list[0]?.id ?? ''))} disabled={!list.length}>
              打开首个工单
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-5 gap-3">
        {[
          { label: '进行中', value: list.filter((o) => !['settled', 'canceled'].includes(o.status)).length, unit: '单', tone: 'var(--primary)' },
          { label: '待客户确认', value: list.filter((o) => ['quoted', 'delivered'].includes(o.status)).length, unit: '单', tone: 'var(--accent)' },
          { label: '合同总额', value: formatCny(list.reduce((s, o) => s + o.amount, 0)), unit: '', tone: 'var(--purple)' },
          { label: 'SLA 超时', value: overdue.length, unit: '单', tone: 'var(--danger)' },
          { label: '平均评分', value: (list.filter((o) => o.rating).reduce((s, o) => s + (o.rating?.stars ?? 0), 0) / Math.max(1, list.filter((o) => o.rating).length)).toFixed(1), unit: '星', tone: 'var(--success)' },
        ].map((k) => (
          <Card key={k.label} className="px-4 py-3">
            <div className="text-[11px] text-[var(--text-3)]">{k.label}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="mono text-[20px] font-medium" style={{ color: k.tone }}>
                {k.value}
              </span>
              <span className="text-[11px] text-[var(--text-3)]">{k.unit}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative w-[300px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索工单号、标题、客户" className="pl-8" />
        </div>
        <div className="w-[180px]">
          <Select value={customer} onChange={(e) => setCustomer(e.target.value)}>
            <option value="all">全部客户</option>
            {customers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="ghost">
          <Filter size={13} /> 更多筛选
        </Button>
        <div className="ml-auto">
          <Segmented
            value={view}
            onChange={setView}
            items={[
              { key: 'board', label: <span className="flex items-center gap-1"><LayoutGrid size={12} />看板</span> },
              { key: 'list', label: <span className="flex items-center gap-1"><List size={12} />列表</span> },
            ]}
          />
        </div>
      </div>

      {loading && !orders ? (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-[420px]" />
          ))}
        </div>
      ) : view === 'board' ? (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {ORDER_BOARD_COLUMNS.map((col) => {
            const meta = ORDER_STATUS_META[col]
            const items = filtered.filter((o) => o.status === col)
            const isOver = overCol === col
            return (
              <div
                key={col}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverCol(col)
                }}
                onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
                onDrop={() => {
                  if (dragId) move(dragId, col)
                  setDragId(null)
                  setOverCol(null)
                }}
                className={cn(
                  'flex w-[214px] shrink-0 flex-col rounded-xl border transition-colors',
                  isOver ? 'border-[var(--primary)] bg-[var(--primary-10)]' : 'border-[var(--border)] bg-[var(--bg-1)]',
                )}
              >
                <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                    <span className="text-[12px] text-[var(--text-1)]">{meta.label}</span>
                  </div>
                  <span className="mono rounded bg-[var(--bg-3)] px-1 text-[10px] text-[var(--text-3)]">{items.length}</span>
                </div>
                <div className="min-h-[120px] flex-1 space-y-2 p-2">
                  {items.map((o) => {
                    const eng = db.members.find((m) => m.id === o.engineerId)
                    const late = new Date(o.slaDeadline).getTime() < Date.now() && !['settled', 'canceled', 'accepted'].includes(o.status)
                    return (
                      <div
                        key={o.id}
                        draggable
                        onDragStart={() => setDragId(o.id)}
                        onDragEnd={() => {
                          setDragId(null)
                          setOverCol(null)
                        }}
                        onClick={() => navigate(`/service/orders/${o.id}`)}
                        className={cn(
                          'cursor-grab rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-2.5 transition-all hover:border-[var(--border-str)] active:cursor-grabbing',
                          dragId === o.id && 'opacity-40',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="mono text-[10px] text-[var(--text-3)]">{o.code}</span>
                          {late && <AlertTriangle size={11} className="text-[var(--danger)]" />}
                        </div>
                        <div className="mt-1 line-clamp-2 text-[12px] leading-4 text-[var(--text-1)]">{o.title}</div>
                        <div className="mt-1.5 flex items-center gap-1">
                          <Badge color="var(--text-2)" bg="rgba(167,180,196,.12)">
                            {o.packageName}
                          </Badge>
                          {o.slaHours > 0 && <span className="mono text-[10px] text-[var(--text-3)]">{o.slaHours}h</span>}
                        </div>
                        <div className="mt-2">
                          <SlaBar createdAt={o.createdAt} slaHours={o.slaHours || 240} compact />
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-1.5">
                          <span className="mono text-[11px] text-[var(--text-2)]">{formatCny(o.amount)}</span>
                          {eng && <Avatar name={eng.name} seed={eng.avatarSeed} size={18} />}
                        </div>
                      </div>
                    )
                  })}
                  {items.length === 0 && (
                    <div className="rounded-lg border border-dashed border-[var(--border)] py-6 text-center text-[11px] text-[var(--text-3)]">
                      拖拽至此
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card>
          {filtered.length === 0 ? (
            <EmptyState title="没有匹配的工单" desc="调整搜索或客户筛选条件" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-2)] text-[11px] text-[var(--text-3)]">
                  <th className="px-4 py-2 text-left font-normal">工单号</th>
                  <th className="px-2 py-2 text-left font-normal">标题</th>
                  <th className="px-2 py-2 text-left font-normal">客户</th>
                  <th className="px-2 py-2 text-left font-normal">服务包</th>
                  <th className="px-2 py-2 text-left font-normal">状态</th>
                  <th className="px-2 py-2 text-left font-normal">SLA</th>
                  <th className="px-2 py-2 text-right font-normal">金额</th>
                  <th className="px-4 py-2 text-left font-normal">创建</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const meta = ORDER_STATUS_META[o.status]
                  return (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/service/orders/${o.id}`)}
                      className="cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-2)]"
                    >
                      <td className="mono px-4 py-2.5 text-[11px] text-[var(--text-2)]">{o.code}</td>
                      <td className="max-w-[260px] truncate px-2 py-2.5 text-[12px] text-[var(--text-1)]">{o.title}</td>
                      <td className="px-2 py-2.5 text-[12px] text-[var(--text-2)]">{o.customerName}</td>
                      <td className="px-2 py-2.5 text-[12px] text-[var(--text-3)]">{o.packageName}</td>
                      <td className="px-2 py-2.5">
                        <Badge color={meta.color} bg={meta.bg} dot>
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-2 py-2.5">
                        <SlaBar createdAt={o.createdAt} slaHours={o.slaHours || 240} compact />
                      </td>
                      <td className="mono px-2 py-2.5 text-right text-[12px] text-[var(--text-1)]">{formatCny(o.amount)}</td>
                      <td className="mono px-4 py-2.5 text-[11px] text-[var(--text-3)]">{dateOnly(o.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  )
}
