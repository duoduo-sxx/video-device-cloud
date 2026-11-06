import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Badge, Button, Modal, Panel, SearchInput, Select } from '../components/ui'
import { DataTable, type Column } from '../components/table'
import { formatFullDateTime } from '../lib/format'
import type { AuditLog } from '../types'

const actionLabel: Record<string, string> = {
  'job.create': '创建转换任务',
  'job.retry': '重试任务',
  'job.cancel': '取消任务',
  'job.qa.pass': '质检放行',
  'job.qa.reject': '质检退回',
  'preset.update': '更新预设',
  'project.update': '更新项目',
  'project.create': '创建项目',
  'order.update': '更新订单',
  'ticket.reply': '回复工单',
  'ticket.create': '创建工单',
  'node.maintenance': '节点维护',
  'member.invite': '邀请成员',
  'apikey.rotate': '轮换密钥',
}

export default function Logs() {
  const logs = useDataStore((s) => s.logs)
  const team = useDataStore((s) => s.team)
  const toast = useAppStore((s) => s.toast)
  const [query, setQuery] = useState('')
  const [actor, setActor] = useState('all')
  const [action, setAction] = useState('all')
  const [range, setRange] = useState('7')
  const [detail, setDetail] = useState<AuditLog | null>(null)

  const rows = useMemo(
    () =>
      logs.filter((l) => {
        if (actor !== 'all' && l.actorId !== actor) return false
        if (action !== 'all' && l.action !== action) return false
        const days = Number(range)
        if (days > 0 && new Date(l.ts).getTime() < Date.now() - days * 86400000) return false
        if (query && !l.target.includes(query) && !l.actorName.includes(query)) return false
        return true
      }),
    [logs, actor, action, range, query],
  )

  const columns: Column<AuditLog>[] = [
    {
      key: 'ts',
      header: '时间',
      sortValue: (l) => l.ts,
      render: (l) => <span className="mono text-[11px] text-muted">{formatFullDateTime(l.ts)}</span>,
    },
    {
      key: 'actor',
      header: '操作人',
      render: (l) => (
        <div>
          <div className="text-[12px] text-ink">{l.actorName}</div>
          <div className="mono text-[10px] text-dim">{l.actorId}</div>
        </div>
      ),
    },
    {
      key: 'action',
      header: '动作',
      render: (l) => (
        <span className="inline-flex items-center gap-2">
          <Badge tone={l.action.includes('cancel') || l.action.includes('reject') ? 'warning' : l.action.includes('create') ? 'primary' : 'neutral'}>
            {actionLabel[l.action] ?? l.action}
          </Badge>
        </span>
      ),
    },
    { key: 'target', header: '对象', render: (l) => <span className="mono text-[11.5px] text-ink">{l.target}</span> },
    { key: 'ip', header: 'IP', render: (l) => <span className="mono text-[11px] text-dim">{l.ip}</span> },
    {
      key: 'result',
      header: '结果',
      align: 'right',
      render: () => <span className="text-[11px] text-success">成功</span>,
    },
    {
      key: 'detail',
      header: '',
      align: 'right',
      render: (l) => (
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetail(l) }}>
          详情
        </Button>
      ),
    },
  ]

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title="审计日志"
        desc="所有写操作留痕：谁、在什么时候、对哪个对象做了什么。日志不可篡改。"
        actions={
          <Button
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={() => toast('success', '日志已导出', `${rows.length} 条记录 · CSV`)}
          >
            导出日志
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder="搜索对象或操作人" className="w-[240px]" />
        <Select value={actor} onChange={(e) => setActor(e.target.value)} className="w-[150px]">
          <option value="all">全部操作人</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
        <Select value={action} onChange={(e) => setAction(e.target.value)} className="w-[160px]">
          <option value="all">全部动作</option>
          {Object.entries(actionLabel).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select value={range} onChange={(e) => setRange(e.target.value)} className="w-[130px]">
          <option value="1">今天</option>
          <option value="7">近 7 天</option>
          <option value="30">近 30 天</option>
          <option value="0">全部时间</option>
        </Select>
        <span className="ml-auto text-[11px] text-dim">
          命中 <span className="mono text-muted">{rows.length}</span> 条
        </span>
      </div>

      <Panel className="overflow-hidden">
        <DataTable columns={columns} rows={rows} pageSize={20} onRowClick={setDetail} emptyTitle="没有匹配的日志" />
      </Panel>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="操作详情" desc="原始记录（JSON）">
        {detail && (
          <div>
            <div className="mb-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-dim">时间</span>
                <span className="mono text-muted">{formatFullDateTime(detail.ts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">操作人</span>
                <span className="text-muted">{detail.actorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">动作</span>
                <span className="text-muted">{actionLabel[detail.action] ?? detail.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">对象</span>
                <span className="mono text-muted">{detail.target}</span>
              </div>
            </div>
            <pre className="scroll-thin overflow-auto rounded-lg border border-line bg-[#0b0e13] p-3 font-mono text-[11px] leading-5 text-[#9fb0c8]">
              {JSON.stringify({ id: detail.id, action: detail.action, actor: detail.actorId, target: detail.target, ip: detail.ip, detail: detail.detail }, null, 2)}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  )
}
