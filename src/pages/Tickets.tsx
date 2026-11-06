import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Clock, Headphones, Plus, ShieldCheck } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Avatar, Badge, Button, Input, Modal, Panel, SearchInput, Select, Tabs, Textarea } from '../components/ui'
import { PRIORITY_LABEL, PRIORITY_TONE, TICKET_STATUS_LABEL, TICKET_STATUS_TONE } from '../lib/constants'
import { formatCountdown, relativeTime } from '../lib/format'
import type { Ticket, TicketPriority, TicketStatus } from '../types'
import { cn } from '../lib/utils'

type ViewKey = 'board' | 'catalog'

const columns: { key: string; label: string; statuses: TicketStatus[]; target: TicketStatus }[] = [
  { key: 'new', label: '待受理', statuses: ['new'], target: 'new' },
  { key: 'doing', label: '处理中', statuses: ['accepted', 'in_progress', 'reopened'], target: 'in_progress' },
  { key: 'waiting', label: '待客户确认', statuses: ['waiting_client'], target: 'waiting_client' },
  { key: 'done', label: '已解决', statuses: ['resolved', 'closed'], target: 'resolved' },
]

const services = [
  { name: '标准转换', price: '¥120 / 分钟起', cycle: '24-72 小时', sla: 'P2 · 24h', desc: '标准深度估计与视差生成，输出 MV-HEVC / SBS，含自动质检。' },
  { name: '精修转换', price: '¥600 / 分钟', cycle: '3-5 个工作日', sla: 'P1 · 8h', desc: '逐帧修正深度与视差，人工处理发丝、栅栏、反光等高频边缘。' },
  { name: 'Vision Pro 交付适配', price: '¥60 / 分钟', cycle: '48 小时', sla: 'P2 · 24h', desc: '封装空间元数据、音频空间化，按 Vision Pro 播放规范校验。' },
  { name: '驻场技术支援', price: '¥3,200 / 人天', cycle: '按排期', sla: 'P0 · 2h', desc: '展馆 / 剧场现场调试，含投影融合、播放器适配与应急处理。' },
  { name: '团队培训', price: '¥12,000 / 场', cycle: '2 天', sla: 'P3 · 72h', desc: '立体影像基础、参数调优与质检方法，含实操与考核。' },
]

export default function Tickets() {
  const navigate = useNavigate()
  const tickets = useDataStore((s) => s.tickets)
  const clients = useDataStore((s) => s.clients)
  const projects = useDataStore((s) => s.projects)
  const team = useDataStore((s) => s.team)
  const setTicketStatus = useDataStore((s) => s.setTicketStatus)
  const createTicket = useDataStore((s) => s.createTicket)
  const toast = useAppStore((s) => s.toast)

  const [view, setView] = useState<ViewKey>('board')
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState('all')
  const [creating, setCreating] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', type: '技术咨询', priority: 'P2' as TicketPriority, clientId: 'cli_001', projectId: '', description: '' })

  const filtered = useMemo(
    () =>
      tickets.filter((t) => {
        if (priority !== 'all' && t.priority !== priority) return false
        if (query && !t.title.includes(query) && !t.code.includes(query)) return false
        return true
      }),
    [tickets, priority, query],
  )

  const clientName = (id: string) => clients.find((c) => c.id === id)?.shortName ?? '—'

  const overdue = tickets.filter((t) => !['resolved', 'closed'].includes(t.status) && new Date(t.slaDueAt).getTime() < Date.now())

  const submit = () => {
    if (!form.title.trim()) {
      toast('error', '请填写工单标题')
      return
    }
    const t = createTicket({
      title: form.title,
      type: form.type as Ticket['type'],
      priority: form.priority,
      clientId: form.clientId,
      projectId: form.projectId || undefined,
      description: form.description,
    })
    toast('success', '工单已创建', `${t.code} · ${PRIORITY_LABEL[t.priority]}，SLA 计时已开始`)
    setCreating(false)
    setForm({ ...form, title: '', description: '' })
  }

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title="技术服务"
        desc="客户的技术咨询、故障与精修需求。SLA 按优先级计时，超时会升级到制片。"
        actions={
          <Button variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreating(true)}>
            新建工单
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: '待受理', value: tickets.filter((t) => t.status === 'new').length, hint: '需要立即分派', tone: 'text-danger' },
          { label: '处理中', value: tickets.filter((t) => ['accepted', 'in_progress', 'reopened'].includes(t.status)).length, hint: '平均响应 46 分钟', tone: 'text-ink' },
          { label: 'SLA 超时', value: overdue.length, hint: overdue.length ? '已升级至制片' : '暂无超时', tone: overdue.length ? 'text-danger' : 'text-success' },
          { label: '本月解决', value: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length, hint: '满意度 4.6 / 5', tone: 'text-ink' },
        ].map((s) => (
          <Panel key={s.label} className="p-4">
            <div className="text-[11px] text-dim">{s.label}</div>
            <div className={`mono mt-1.5 text-[20px] ${s.tone}`}>{s.value}</div>
            <div className="mt-0.5 text-[10.5px] text-dim">{s.hint}</div>
          </Panel>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={view}
          onChange={setView}
          className="border-b-0"
          items={[
            { key: 'board', label: '工单看板', count: tickets.length },
            { key: 'catalog', label: '服务目录' },
          ]}
        />
        {view === 'board' && (
          <div className="flex items-center gap-2">
            <SearchInput value={query} onChange={setQuery} placeholder="搜索标题或工单号" className="w-[200px]" />
            <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-[120px]">
              <option value="all">全部优先级</option>
              <option value="P0">P0 紧急</option>
              <option value="P1">P1 高</option>
              <option value="P2">P2 中</option>
              <option value="P3">P3 低</option>
            </Select>
          </div>
        )}
      </div>

      {view === 'board' ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-4">
          {columns.map((col) => {
            const items = filtered.filter((t) => col.statuses.includes(t.status))
            return (
              <div
                key={col.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) {
                    setTicketStatus(dragId, col.target)
                    toast('success', '工单状态已更新', TICKET_STATUS_LABEL[col.target])
                  }
                  setDragId(null)
                }}
                className="rounded-xl border border-line bg-[#0d1017] p-2.5"
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-[12px] text-muted">{col.label}</span>
                  <span className="mono text-[11px] text-dim">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t) => {
                    const remain = new Date(t.slaDueAt).getTime() - Date.now()
                    const isOverdue = remain < 0 && !t.slaPaused
                    const isUrgent = remain > 0 && remain < 20 * 60 * 1000
                    const assignee = team.find((m) => m.id === t.assigneeId)
                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={() => setDragId(t.id)}
                        onClick={() => navigate(`/tickets/${t.id}`)}
                        className={cn(
                          'cursor-pointer rounded-lg border border-line bg-surface p-3 transition-colors hover:border-[#333c4c]',
                          dragId === t.id && 'opacity-40',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
                          <span className="mono text-[10px] text-dim">{t.code}</span>
                        </div>
                        <div className="mt-2 line-clamp-2 text-[12px] leading-5 text-ink">{t.title}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="truncate text-[10.5px] text-dim">{clientName(t.clientId)}</span>
                          {assignee && <Avatar name={assignee.name} hue={assignee.avatarHue} size={20} />}
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-line-subtle pt-2">
                          <span className={cn('flex items-center gap-1 text-[10px]', isOverdue ? 'text-danger' : isUrgent ? 'text-warning' : 'text-dim')}>
                            <Clock className="h-3 w-3" />
                            {isOverdue ? '超时 ' : t.slaPaused ? '已暂停 ' : 'SLA '}
                            {formatCountdown(remain)}
                          </span>
                          <span className="text-[10px] text-dim">{relativeTime(t.createdAt)}</span>
                        </div>
                      </div>
                    )
                  })}
                  {items.length === 0 && <div className="py-8 text-center text-[11px] text-dim">暂无工单</div>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {services.map((s) => (
            <Panel key={s.name} className="flex flex-col p-4">
              <div className="flex items-start justify-between">
                <div className="text-[14px] text-ink">{s.name}</div>
                <Badge tone="info">{s.sla}</Badge>
              </div>
              <div className="mono mt-2 text-[16px] text-ink">{s.price}</div>
              <div className="mt-1 text-[10.5px] text-dim">交付周期 {s.cycle}</div>
              <p className="mt-2.5 flex-1 text-[11.5px] leading-5 text-muted">{s.desc}</p>
              <Button
                className="mt-3 w-full"
                size="sm"
                icon={<ArrowUpRight className="h-3 w-3" />}
                onClick={() => {
                  setForm({ ...form, type: s.name === '精修转换' ? '精修需求' : s.name === '驻场技术支援' ? '交付支持' : '技术咨询', priority: s.sla.startsWith('P1') ? 'P1' : s.sla.startsWith('P0') ? 'P0' : 'P2' })
                  setCreating(true)
                }}
              >
                基于此下单
              </Button>
            </Panel>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[10.5px] text-dim">
        <span className="flex items-center gap-1">
          <Headphones className="h-3 w-3" /> 拖拽卡片可变更状态
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> SLA：P0 2h / P1 8h / P2 24h / P3 72h
        </span>
        <span>客户回复期间（待客户确认）暂停计时</span>
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="新建工单"
        desc="创建后立即开始 SLA 计时，请选择正确的优先级。"
        footer={
          <>
            <Button onClick={() => setCreating(false)}>取消</Button>
            <Button variant="primary" onClick={submit}>
              创建工单
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[11.5px] text-muted">标题</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="一句话描述问题" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-[11.5px] text-muted">类型</label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {['技术咨询', '转换故障', '精修需求', '交付支持', '账号与权限'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] text-muted">优先级</label>
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}>
                <option value="P0">P0 紧急（2h）</option>
                <option value="P1">P1 高（8h）</option>
                <option value="P2">P2 中（24h）</option>
                <option value="P3">P3 低（72h）</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] text-muted">客户</label>
              <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, projectId: '' })}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shortName}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11.5px] text-muted">关联项目（可选）</label>
            <Select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
              <option value="">不关联</option>
              {projects
                .filter((p) => p.clientId === form.clientId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11.5px] text-muted">问题描述</label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="补充现象、发生时间、已尝试的操作。" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
