import { useMemo, useState } from 'react'
import { ChevronDown, Download, Search } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader, Panel } from '@/components/common'
import { Button, Input, Select, Tag } from '@/components/ui/primitives'
import { Table, Pagination, type Column } from '@/components/ui/data'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { downloadCsv } from '@/utils/misc'
import type { AuditLog } from '@/types'

const TYPE_LABEL: Record<string, string> = {
  device: '设备',
  scene: '场景',
  task: '任务',
  alert: '告警',
  ticket: '工单',
  user: '用户',
  system: '系统',
}

export default function Audit() {
  const db = useDataStore((s) => s.db)
  const toast = useUIStore((s) => s.toast)
  const [kw, setKw] = useState('')
  const [type, setType] = useState('all')
  const [result, setResult] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const list = useMemo(
    () =>
      db.audits.filter((a) => {
        if (kw && !a.operator.includes(kw) && !a.target.includes(kw) && !a.action.includes(kw)) return false
        if (type !== 'all' && a.targetType !== type) return false
        if (result !== 'all' && a.result !== result) return false
        return true
      }),
    [db.audits, kw, type, result],
  )

  const paged = list.slice((page - 1) * pageSize, page * pageSize)

  const columns: Column<AuditLog>[] = [
    { key: 'time', title: '时间', width: 160, render: (a) => <span className="num text-2xs text-ink-soft">{dayjs(a.time).format('MM-DD HH:mm:ss')}</span> },
    { key: 'operator', title: '操作人', width: 90, render: (a) => <span className="text-xs text-ink">{a.operator}</span> },
    { key: 'action', title: '操作', width: 120, render: (a) => <span className="text-xs text-ink-soft">{a.action}</span> },
    { key: 'targetType', title: '对象类型', width: 90, render: (a) => <Tag>{TYPE_LABEL[a.targetType]}</Tag> },
    { key: 'target', title: '对象', render: (a) => <span className="text-xs text-ink truncate block">{a.target}</span> },
    {
      key: 'result',
      title: '结果',
      width: 80,
      render: (a) => <Tag color={a.result === 'success' ? 'var(--success)' : 'var(--danger)'}>{a.result === 'success' ? '成功' : '失败'}</Tag>,
    },
    { key: 'ip', title: 'IP', width: 130, render: (a) => <span className="num text-2xs text-ink-mute">{a.ip}</span> },
    {
      key: 'detail',
      title: '',
      width: 50,
      align: 'right',
      render: (a) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(expanded === a.id ? null : a.id)
          }}
          aria-label="展开详情"
          className="text-ink-mute hover:text-ink"
        >
          <ChevronDown size={13} className={expanded === a.id ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="审计日志"
        sub={`近 7 天共 ${db.audits.length} 条操作记录`}
        actions={
          <Button
            variant="secondary"
            icon={<Download size={14} />}
            onClick={() => {
              downloadCsv(
                `审计日志_${dayjs().format('YYYYMMDD')}.csv`,
                list.map((a) => ({
                  时间: dayjs(a.time).format('YYYY-MM-DD HH:mm:ss'),
                  操作人: a.operator,
                  操作: a.action,
                  对象类型: TYPE_LABEL[a.targetType],
                  对象: a.target,
                  结果: a.result === 'success' ? '成功' : '失败',
                  IP: a.ip,
                })),
              )
              toast('success', '已导出审计日志', `${list.length} 条记录`)
            }}
          >
            导出 CSV
          </Button>
        }
      />

      <Panel className="flex-1 min-h-0" bodyClass="p-0 flex flex-col" title={undefined}>
        <div className="h-12 px-3 flex items-center gap-2 border-b border-subtle shrink-0">
          <Input className="w-[240px]" icon={<Search size={13} />} placeholder="搜索操作人、操作或对象" value={kw} onChange={(e) => { setKw(e.target.value); setPage(1) }} />
          <Select value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} className="w-[120px]">
            <option value="all">全部类型</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select value={result} onChange={(e) => { setResult(e.target.value); setPage(1) }} className="w-[110px]">
            <option value="all">全部结果</option>
            <option value="success">成功</option>
            <option value="fail">失败</option>
          </Select>
          <div className="flex-1" />
          <span className="text-2xs text-ink-mute num">筛选结果 {list.length} 条</span>
        </div>

        <div className="flex-1 overflow-auto">
          <Table columns={columns} rows={paged} />
          {expanded && (
            <div className="mx-3 mb-3 rounded-card border border-strong bg-panel2 p-3">
              <div className="text-2xs text-ink-mute mb-1.5">操作详情</div>
              <pre className="text-[11px] text-ink-soft font-mono leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(db.audits.find((a) => a.id === expanded)?.detail ?? {}, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <Pagination page={page} pageSize={pageSize} total={list.length} onChange={setPage} onSizeChange={setPageSize} />
      </Panel>
    </>
  )
}
