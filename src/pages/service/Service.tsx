import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ClipboardCheck,
  Code2,
  GraduationCap,
  LifeBuoy,
  MonitorSmartphone,
  Plus,
  Search,
  ShieldAlert,
  Wrench,
  Star,
  ThumbsUp,
  Eye,
} from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader, Panel, ProgressBar, EmptyState } from '@/components/common'
import { Button, Input, Tabs, Tag } from '@/components/ui/primitives'
import { Table, type Column } from '@/components/ui/data'
import { TicketWizard } from '@/components/biz/TicketWizard'
import { RemoteSession } from '@/components/biz/RemoteSession'
import { useDataStore } from '@/stores/dataStore'
import { ARTICLE_CATEGORIES, SERVICE_CATALOG, TICKET_PRIORITY_COLOR, TICKET_PRIORITY_LABEL, TICKET_STATUS_LABEL } from '@/constants/enums'
import { useUIStore } from '@/stores/uiStore'
import { cn, fmtDuration } from '@/utils/misc'
import type { Ticket, TicketStatus } from '@/types'

const SERVICE_ICONS: Record<string, typeof Wrench> = {
  MonitorSmartphone,
  Wrench,
  ClipboardCheck,
  GraduationCap,
  Code2,
  ShieldAlert,
}

const CATS = ARTICLE_CATEGORIES

const STATUS_COLOR: Record<TicketStatus, string> = {
  pending: 'var(--danger)',
  assigned: 'var(--info)',
  processing: 'var(--warning)',
  verifying: 'var(--accent)',
  done: 'var(--success)',
  closed: 'var(--text-secondary)',
}

function Markdown({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1.5">
      {lines.map((raw, i) => {
        const line = raw.trimEnd()
        if (!line.trim()) return <div key={i} className="h-1.5" />
        if (line.startsWith('## ')) {
          return (
            <h4 key={i} className="text-sm font-medium text-ink pt-2 pb-0.5">
              {line.slice(3)}
            </h4>
          )
        }
        if (line.startsWith('> ')) {
          return (
            <div key={i} className="border-l-2 border-brand/50 pl-2.5 py-1 text-2xs text-ink-soft bg-brand/[0.04] rounded-r">
              {line.slice(2)}
            </div>
          )
        }
        if (/^\d+\.\s/.test(line)) {
          return (
            <div key={i} className="flex gap-2 text-xs text-ink-soft leading-relaxed">
              <span className="num text-brand shrink-0">{line.match(/^\d+/)?.[0]}</span>
              <span>{line.replace(/^\d+\.\s/, '')}</span>
            </div>
          )
        }
        if (line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2 text-xs text-ink-soft leading-relaxed">
              <span className="text-ink-mute shrink-0">·</span>
              <span>{line.slice(2)}</span>
            </div>
          )
        }
        if (line.startsWith('|')) {
          return (
            <div key={i} className="num text-2xs text-ink-mute">
              {line.replace(/\|/g, ' ').trim()}
            </div>
          )
        }
        return (
          <p key={i} className="text-xs text-ink-soft leading-relaxed">
            {line}
          </p>
        )
      })}
    </div>
  )
}

export default function Service() {
  const db = useDataStore((s) => s.db)
  const toast = useUIStore((s) => s.toast)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as 'tickets' | 'catalog' | 'kb' | 'remote') ?? 'tickets'
  const setTab = (v: string) => {
    const next = new URLSearchParams(params)
    next.set('tab', v)
    setParams(next, { replace: true })
  }

  const [wizard, setWizard] = useState(false)
  const [kw, setKw] = useState('')
  const [kbCat, setKbCat] = useState<string>(ARTICLE_CATEGORIES[0])
  const [articleId, setArticleId] = useState<string | null>(null)

  const tickets = db.tickets.filter((t) => !kw || t.title.includes(kw) || t.id.includes(kw))
  const done = db.tickets.filter((t) => t.status === 'done' || t.status === 'closed')
  const onTime = done.filter((t) => t.slaRemainMinutes >= 0).length
  const avgResponse = 42
  const article = db.articles.find((a) => a.id === articleId) ?? db.articles.find((a) => a.category === kbCat) ?? db.articles[0]
  const kbList = db.articles.filter((a) => a.category === kbCat)

  const columns: Column<Ticket>[] = [
    { key: 'id', title: '工单号', width: 150, render: (t) => <span className="num text-2xs text-ink-soft">{t.id}</span> },
    {
      key: 'title',
      title: '标题',
      render: (t) => (
        <div className="min-w-0">
          <div className="text-sm text-ink truncate">{t.title}</div>
          <div className="text-2xs text-ink-mute">{t.serviceType} · {t.deviceName ?? '未指定设备'}</div>
        </div>
      ),
    },
    {
      key: 'priority',
      title: '优先级',
      width: 80,
      render: (t) => <Tag color={TICKET_PRIORITY_COLOR[t.priority]}>{TICKET_PRIORITY_LABEL[t.priority]}</Tag>,
    },
    {
      key: 'status',
      title: '状态',
      width: 92,
      render: (t) => <Tag color={STATUS_COLOR[t.status]}>{TICKET_STATUS_LABEL[t.status]}</Tag>,
    },
    { key: 'assignee', title: '处理人', width: 80, render: (t) => <span className="text-xs text-ink-soft">{t.assignee ?? '待分配'}</span> },
    {
      key: 'sla',
      title: 'SLA',
      width: 120,
      render: (t) => {
        const pct = Math.max(0, Math.min(100, (t.slaRemainMinutes / t.slaMinutes) * 100))
        const urgent = pct < 20
        return (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className={cn('num text-2xs', urgent ? 'text-bad' : 'text-ink-mute')}>{fmtDuration(t.slaRemainMinutes)}</span>
              <span className="text-[10px] text-ink-mute">剩余</span>
            </div>
            <ProgressBar value={pct} height={3} color={urgent ? 'var(--danger)' : 'var(--brand)'} />
          </div>
        )
      },
    },
    { key: 'createdAt', title: '提交时间', width: 110, render: (t) => <span className="num text-2xs text-ink-mute">{dayjs(t.createdAt).format('MM-DD HH:mm')}</span> },
  ]

  return (
    <>
      <PageHeader
        title="技术服务"
        sub="工单受理、远程协助与知识沉淀，形成服务闭环"
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setWizard(true)}>
            提交工单
          </Button>
        }
      />

      <div className="mb-3 shrink-0">
        <Tabs
          tabs={[
            { key: 'tickets', label: '工单', count: db.tickets.filter((t) => t.status !== 'closed' && t.status !== 'done').length },
            { key: 'catalog', label: '服务目录' },
            { key: 'kb', label: '知识库', count: db.articles.length },
            { key: 'remote', label: '远程协助' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'tickets' && (
        <div className="flex-1 flex flex-col min-h-0 gap-3">
          <div className="grid grid-cols-3 gap-3 shrink-0">
            {[
              ['平均响应时长', `${avgResponse} 分钟`, '较上月缩短 8 分钟', 'var(--brand)'],
              ['今日新增工单', `${db.tickets.filter((t) => dayjs(t.createdAt).isSame(dayjs(), 'day')).length} 单`, '其中紧急 1 单', 'var(--warning)'],
              ['SLA 按时完成率', `${((onTime / Math.max(1, done.length)) * 100).toFixed(1)}%`, `已完成 ${done.length} 单`, 'var(--success)'],
            ].map(([label, value, sub, color]) => (
              <div key={label} className="panel px-4 py-3 h-[80px] flex flex-col justify-between">
                <span className="text-2xs text-ink-soft">{label}</span>
                <div className="flex items-end justify-between">
                  <span className="num text-xl" style={{ color }}>{value}</span>
                  <span className="text-[10px] text-ink-mute">{sub}</span>
                </div>
              </div>
            ))}
          </div>

          <Panel className="flex-1 min-h-0" bodyClass="p-0 flex flex-col" title={undefined}>
            <div className="h-12 px-3 flex items-center justify-between border-b border-subtle shrink-0">
              <span className="text-xs text-ink">我的工单</span>
              <Input className="w-[240px]" icon={<Search size={13} />} placeholder="搜索标题或工单号" value={kw} onChange={(e) => setKw(e.target.value)} />
            </div>
            <div className="flex-1 overflow-auto">
              <Table columns={columns} rows={tickets} onRowClick={(t) => navigate(`/service/tickets/${t.id}`)} emptyText="没有符合条件的工单" />
            </div>
          </Panel>
        </div>
      )}

      {tab === 'catalog' && (
        <div className="grid grid-cols-3 gap-3">
          {SERVICE_CATALOG.map((s) => {
            const Icon = SERVICE_ICONS[s.icon] ?? Wrench
            return (
              <div key={s.key} className="panel p-4 flex flex-col">
                <div className="flex items-start justify-between">
                  <span className="w-9 h-9 rounded-card bg-brand/[0.1] border border-brand/25 flex items-center justify-center text-brand">
                    <Icon size={16} />
                  </span>
                  <div className="flex gap-1">
                    {s.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-ink mt-3">{s.name}</div>
                <p className="text-2xs text-ink-mute mt-1.5 leading-relaxed flex-1">{s.desc}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-subtle">
                  <span className="text-2xs text-brand">{s.sla}</span>
                  <Button size="sm" variant="ghost" onClick={() => setWizard(true)}>
                    申请服务
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'kb' && (
        <div className="grid grid-cols-12 gap-3 flex-1 min-h-0" style={{ height: 'calc(100vh - 230px)' }}>
          <div className="col-span-2 panel p-2 overflow-auto">
            <div className="text-2xs text-ink-mute px-2 py-1.5">分类</div>
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setKbCat(c)
                  setArticleId(null)
                }}
                className={cn(
                  'w-full text-left px-2.5 h-8 rounded-ctrl text-xs transition-colors flex items-center justify-between',
                  kbCat === c ? 'bg-brand/[0.1] text-brand' : 'text-ink-soft hover:bg-panel2',
                )}
              >
                {c}
                <span className="num text-2xs text-ink-mute">{db.articles.filter((a) => a.category === c).length}</span>
              </button>
            ))}
          </div>

          <div className="col-span-4 panel flex flex-col overflow-hidden">
            <div className="p-2 border-b border-subtle shrink-0">
              <Input icon={<Search size={13} />} placeholder="搜索知识条目" />
            </div>
            <div className="flex-1 overflow-auto p-1.5 space-y-1">
              {kbList.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setArticleId(a.id)}
                  className={cn(
                    'w-full text-left px-2.5 py-2 rounded-ctrl transition-colors',
                    article?.id === a.id ? 'bg-brand/[0.08]' : 'hover:bg-panel2',
                  )}
                >
                  <div className={cn('text-xs leading-snug', article?.id === a.id ? 'text-brand' : 'text-ink')}>{a.title}</div>
                  <div className="flex items-center gap-2 text-[10px] text-ink-mute mt-1">
                    <span className="flex items-center gap-0.5"><Eye size={9} />{a.views}</span>
                    <span className="flex items-center gap-0.5"><ThumbsUp size={9} />{a.helpful}</span>
                    <span>{dayjs(a.updatedAt).format('MM-DD')}</span>
                  </div>
                </button>
              ))}
              {kbList.length === 0 && <EmptyState title="该分类暂无内容" />}
            </div>
          </div>

          <div className="col-span-6 panel flex flex-col overflow-hidden">
            {article ? (
              <>
                <div className="px-5 py-4 border-b border-subtle shrink-0">
                  <h3 className="text-base font-medium text-ink leading-snug">{article.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-2xs text-ink-mute">
                    <span>{article.author}</span>
                    <span>·</span>
                    <span>更新于 {dayjs(article.updatedAt).format('YYYY-MM-DD')}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Eye size={10} />{article.views}</span>
                  </div>
                  <div className="flex gap-1.5 mt-2.5">
                    {article.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-5">
                  <div className="rounded-card bg-panel2/60 border border-strong px-3 py-2.5 mb-4">
                    <div className="text-2xs text-ink-mute mb-1">摘要</div>
                    <p className="text-xs text-ink-soft leading-relaxed">{article.summary}</p>
                  </div>
                  <Markdown text={article.content} />
                  <div className="flex items-center gap-2 mt-6 pt-4 border-t border-subtle">
                    <span className="text-2xs text-ink-mute">这篇内容对你有帮助吗？</span>
                    <Button size="sm" variant="ghost" icon={<ThumbsUp size={12} />} onClick={() => toast('success', '感谢反馈', '已记录你的评价')}>
                      有帮助
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState title="选择左侧条目查看详情" />
            )}
          </div>
        </div>
      )}

      {tab === 'remote' && (
        <Panel className="flex-1" bodyClass="p-4" title="远程协助会话">
          <RemoteSession />
        </Panel>
      )}

      <TicketWizard open={wizard} onClose={() => setWizard(false)} />
    </>
  )
}
