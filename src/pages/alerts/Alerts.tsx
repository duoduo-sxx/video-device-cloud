import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CheckCheck, Clock, FileText, Search, UserPlus } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader, Panel, StatusDot, ProgressBar, EmptyState } from '@/components/common'
import { Button, Input, Select, Tag, Tabs } from '@/components/ui/primitives'
import { Drawer } from '@/components/ui/overlay'
import { Table, type Column } from '@/components/ui/data'
import { AreaChart } from '@/components/charts'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { useAppStore } from '@/stores/appStore'
import {
  ALERT_LEVEL_COLOR,
  ALERT_LEVEL_LABEL,
  ALERT_STATUS_LABEL,
} from '@/constants/enums'
import { cn, fmtDuration } from '@/utils/misc'
import type { Alert, AlertLevel, AlertStatus } from '@/types'

const STATUS_ORDER: AlertStatus[] = ['open', 'acknowledged', 'processing', 'recovered', 'closed']

export default function Alerts() {
  const db = useDataStore((s) => s.db)
  const { ackAlert, processAlert, closeAlert, assignAlert, createTicket } = useDataStore()
  const toast = useUIStore((s) => s.toast)
  const user = useAppStore((s) => s.user)
  const navigate = useNavigate()

  const [level, setLevel] = useState<AlertLevel | 'all'>('all')
  const [statusTab, setStatusTab] = useState<'active' | 'closed'>('active')
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const counts = useMemo(() => {
    const active = db.alerts.filter((a) => a.status !== 'closed' && a.status !== 'recovered')
    return {
      P1: active.filter((a) => a.level === 'P1').length,
      P2: active.filter((a) => a.level === 'P2').length,
      P3: active.filter((a) => a.level === 'P3').length,
      recovered: db.alerts.filter((a) => a.status === 'recovered' || a.status === 'closed').length,
    }
  }, [db.alerts])

  const list = useMemo(
    () =>
      db.alerts.filter((a) => {
        if (statusTab === 'active' && (a.status === 'closed' || a.status === 'recovered')) return false
        if (statusTab === 'closed' && !(a.status === 'closed' || a.status === 'recovered')) return false
        if (level !== 'all' && a.level !== level) return false
        if (keyword && !a.title.includes(keyword) && !a.deviceName.includes(keyword) && !a.id.includes(keyword)) return false
        return true
      }),
    [db.alerts, level, statusTab, keyword],
  )

  const current = db.alerts.find((a) => a.id === selected) ?? null
  const currentDevice = db.devices.find((d) => d.id === current?.deviceId)

  const columns: Column<Alert>[] = [
    {
      key: 'level',
      title: '级别',
      width: 64,
      render: (a) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="w-[3px] h-6 rounded-full" style={{ background: ALERT_LEVEL_COLOR[a.level] }} />
          <span className="text-2xs" style={{ color: ALERT_LEVEL_COLOR[a.level] }}>{a.level}</span>
        </span>
      ),
    },
    {
      key: 'title',
      title: '告警内容',
      render: (a) => (
        <div className="min-w-0">
          <div className="text-sm text-ink truncate">{a.title}</div>
          <div className="text-2xs text-ink-mute num">{a.id}</div>
        </div>
      ),
    },
    { key: 'deviceName', title: '来源设备', width: 160, render: (a) => <span className="text-xs text-ink-soft truncate block">{a.deviceName}</span> },
    {
      key: 'value',
      title: '当前值 / 阈值',
      width: 130,
      render: (a) => (
        <span className="num text-xs">
          <span className="text-bad">{a.currentValue}</span>
          <span className="text-ink-mute"> / {a.threshold}{a.unit}</span>
        </span>
      ),
    },
    {
      key: 'triggeredAt',
      title: '触发时间',
      width: 130,
      render: (a) => <span className="num text-2xs text-ink-mute">{dayjs(a.triggeredAt).format('MM-DD HH:mm')}</span>,
    },
    {
      key: 'duration',
      title: '持续',
      width: 90,
      render: (a) => <span className="num text-2xs text-ink-soft">{fmtDuration(a.duration)}</span>,
    },
    {
      key: 'status',
      title: '状态',
      width: 90,
      render: (a) => (
        <Tag color={a.status === 'open' ? 'var(--danger)' : a.status === 'processing' ? 'var(--warning)' : a.status === 'recovered' ? 'var(--success)' : 'var(--text-secondary)'}>
          {ALERT_STATUS_LABEL[a.status]}
        </Tag>
      ),
    },
    { key: 'assignee', title: '责任人', width: 80, render: (a) => <span className="text-xs text-ink-soft">{a.assignee ?? '—'}</span> },
  ]

  return (
    <>
      <PageHeader
        title="告警与事件"
        sub="分级告警统一收口，处置过程全程留痕"
        actions={
          <>
            <Button size="md" variant="secondary" onClick={() => setSelectedIds(list.map((a) => a.id))}>
              全选当前
            </Button>
            <Button size="md" variant="primary" icon={<CheckCheck size={14} />} onClick={() => { selectedIds.forEach((id) => ackAlert(id, user?.name ?? '张启明')); toast('success', '已批量认领', `${selectedIds.length} 条告警`); setSelectedIds([]) }}>
              批量认领
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-3">
        {([
          ['P1', '紧急', counts.P1, 'var(--danger)'],
          ['P2', '重要', counts.P2, 'var(--warning)'],
          ['P3', '提示', counts.P3, 'var(--info)'],
          ['recovered', '已恢复', counts.recovered, 'var(--success)'],
        ] as const).map(([k, label, v, color]) => (
          <button
            key={k}
            onClick={() => setLevel(level === k ? 'all' : (k as AlertLevel))}
            className={cn(
              'panel px-4 py-3 h-[76px] flex items-center justify-between transition-all',
              level === k && 'border-brand/45 ring-1 ring-brand/20',
            )}
          >
            <div className="text-left">
              <div className="text-2xs text-ink-soft">{label}</div>
              <div className="num text-2xl mt-1" style={{ color }}>{v}</div>
            </div>
            <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `${color}15`, color }}>
              <AlertTriangle size={15} />
            </span>
          </button>
        ))}
      </div>

      <Panel className="flex-1 min-h-0" bodyClass="p-0 flex flex-col" title={undefined}>
        <div className="px-3 flex items-center justify-between border-b border-subtle shrink-0">
          <Tabs
            tabs={[
              { key: 'active', label: '未闭环', count: counts.P1 + counts.P2 + counts.P3 },
              { key: 'closed', label: '已恢复 / 已关闭', count: counts.recovered },
            ]}
            value={statusTab}
            onChange={setStatusTab}
            className="border-b-0"
          />
          <div className="flex items-center gap-2">
            <Input
              className="w-[220px]"
              icon={<Search size={13} />}
              placeholder="搜索告警、设备或编号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Select value={level} onChange={(e) => setLevel(e.target.value as AlertLevel | 'all')} className="w-[110px]">
              <option value="all">全部级别</option>
              <option value="P1">P1 紧急</option>
              <option value="P2">P2 重要</option>
              <option value="P3">P3 提示</option>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Table
            columns={columns}
            rows={list}
            onRowClick={(a) => setSelected(a.id)}
            selectedIds={selectedIds}
            onSelect={setSelectedIds}
            emptyText="当前筛选条件下没有告警"
          />
        </div>
      </Panel>

      <Drawer
        open={!!current}
        onClose={() => setSelected(null)}
        width={560}
        title={current ? current.title : ''}
        subtitle={
          current ? (
            <span className="flex items-center gap-2">
              <span className="num">{current.id}</span>
              <Tag color={ALERT_LEVEL_COLOR[current.level]}>{current.level} {ALERT_LEVEL_LABEL[current.level]}</Tag>
              <Tag color="var(--text-secondary)">{ALERT_STATUS_LABEL[current.status]}</Tag>
            </span>
          ) : null
        }
        footer={
          current ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                icon={<FileText size={13} />}
                onClick={() => {
                  const id = createTicket({
                    title: current.title,
                    serviceType: '现场支持',
                    priority: current.level === 'P1' ? 'urgent' : current.level === 'P2' ? 'high' : 'normal',
                    deviceId: current.deviceId,
                    deviceName: current.deviceName,
                    description: `由告警 ${current.id} 转入。${current.description}`,
                    creator: user?.name ?? '张启明',
                    slaMinutes: current.level === 'P1' ? 240 : 480,
                  })
                  toast('success', '工单已创建', `${id} 已进入待受理队列`)
                  setSelected(null)
                  navigate(`/service/tickets/${id}`)
                }}
              >
                转工单
              </Button>
              {current.status === 'open' && (
                <Button size="sm" variant="secondary" icon={<UserPlus size={13} />} onClick={() => { ackAlert(current.id, user?.name ?? '张启明'); toast('success', '已认领告警') }}>
                  认领
                </Button>
              )}
              {current.status !== 'closed' && current.status !== 'recovered' && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => { processAlert(current.id, user?.name ?? '张启明', '已核实告警有效性，开始处置'); toast('info', '已转处理中') }}>
                    转处理中
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => { closeAlert(current.id, user?.name ?? '张启明', '现场处置完成，指标恢复正常'); toast('success', '告警已关闭'); setSelected(null) }}>
                    关闭告警
                  </Button>
                </>
              )}
            </>
          ) : null
        }
      >
        {current && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-card border border-strong bg-panel2 p-3">
                <div className="text-2xs text-ink-mute">当前值</div>
                <div className="num text-lg text-bad mt-1">{current.currentValue}<span className="text-2xs text-ink-mute ml-0.5">{current.unit}</span></div>
              </div>
              <div className="rounded-card border border-strong bg-panel2 p-3">
                <div className="text-2xs text-ink-mute">告警阈值</div>
                <div className="num text-lg text-ink mt-1">{current.threshold}<span className="text-2xs text-ink-mute ml-0.5">{current.unit}</span></div>
              </div>
              <div className="rounded-card border border-strong bg-panel2 p-3">
                <div className="text-2xs text-ink-mute">持续时长</div>
                <div className="num text-lg text-ink mt-1">{fmtDuration(current.duration)}</div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-ink-soft">近 1 小时趋势</span>
                <span className="text-2xs text-ink-mute num">{current.metric}</span>
              </div>
              <AreaChart data={current.series.map((s) => ({ label: s.time, value: s.value }))} height={150} />
            </div>

            <div>
              <div className="text-xs text-ink-soft mb-1.5">告警描述</div>
              <p className="text-xs text-ink-soft leading-relaxed">{current.description}</p>
            </div>

            <div>
              <div className="text-xs text-ink-soft mb-2">建议处置步骤</div>
              <div className="space-y-1.5">
                {current.suggestions.map((s, i) => (
                  <div key={i} className="flex gap-2 text-2xs text-ink-soft leading-relaxed">
                    <span className="num shrink-0 w-4 h-4 rounded bg-brand/12 text-brand flex items-center justify-center text-[10px]">{i + 1}</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {currentDevice && (
              <div>
                <div className="text-xs text-ink-soft mb-2">关联设备</div>
                <div className="rounded-card border border-strong bg-panel2 px-3 py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-ink">{currentDevice.name}</div>
                    <div className="text-2xs text-ink-mute num mt-0.5">{currentDevice.code} · {currentDevice.ip}</div>
                  </div>
                  <div className="text-right">
                    <div className="num text-xs text-ink">{currentDevice.health}%</div>
                    <div className="text-[10px] text-ink-mute">健康度</div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-ink-soft mb-2">处置记录</div>
              <div className="relative pl-4">
                <div className="absolute left-[5px] top-1 bottom-1 w-px bg-[var(--border-strong)]" />
                <div className="space-y-3">
                  {current.records.map((r, i) => (
                    <div key={i} className="relative">
                      <span className="absolute -left-[13px] top-1 w-[7px] h-[7px] rounded-full border-2 bg-panel" style={{ borderColor: 'var(--brand)' }} />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-2xs text-ink">{r.action} · {r.operator}</span>
                        <span className="num text-[10px] text-ink-mute">{dayjs(r.time).format('MM-DD HH:mm')}</span>
                      </div>
                      {r.note && <div className="text-[10px] text-ink-mute mt-0.5 leading-relaxed">{r.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  )
}
