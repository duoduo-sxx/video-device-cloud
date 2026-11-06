import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ChevronRight,
  Download,
  Grid2x2,
  List,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader, Panel, StatusDot, Sparkline, EmptyState, ProgressBar } from '@/components/common'
import { Button, IconButton, Input, Select, Segmented, Tag } from '@/components/ui/primitives'
import { Table, Pagination, type Column } from '@/components/ui/data'
import { DeviceDrawer } from '@/components/biz/DeviceDrawer'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { DEVICE_CATEGORY_LABEL, DEVICE_STATUS_COLOR, DEVICE_STATUS_LABEL } from '@/constants/enums'
import { cn, downloadCsv } from '@/utils/misc'
import type { Device, DeviceStatus } from '@/types'

const STATUS_OPTIONS: DeviceStatus[] = ['online', 'warning', 'offline', 'maintenance']

export default function Devices() {
  const db = useDataStore((s) => s.db)
  const toast = useUIStore((s) => s.toast)
  const [params, setParams] = useSearchParams()
  const [treeMode, setTreeMode] = useState<'space' | 'category'>('space')
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [status, setStatus] = useState<DeviceStatus[]>([])
  const [keyword, setKeyword] = useState('')
  const [view, setView] = useState<'table' | 'card'>('table')
  const [sort, setSort] = useState<'name' | 'health' | 'status'>('status')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState<string[]>([])
  const [focusId, setFocusId] = useState<string | null>(params.get('focus'))

  useEffect(() => {
    const f = params.get('focus')
    if (f) {
      setFocusId(f)
      const next = new URLSearchParams(params)
      next.delete('focus')
      setParams(next, { replace: true })
    }
  }, [params, setParams])

  useEffect(() => setPage(1), [spaceId, category, status, keyword, pageSize])

  const filtered = useMemo(() => {
    let list = db.devices.filter((d) => {
      if (spaceId && d.spaceId !== spaceId) return false
      if (category && d.category !== category) return false
      if (status.length && !status.includes(d.status)) return false
      if (keyword) {
        const k = keyword.toLowerCase()
        if (!d.name.toLowerCase().includes(k) && !d.code.toLowerCase().includes(k) && !d.ip.includes(k)) return false
      }
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'zh')
      if (sort === 'health') return a.health - b.health
      const order = { warning: 0, offline: 1, maintenance: 2, online: 3 }
      return order[a.status] - order[b.status]
    })
    return list
  }, [db.devices, spaceId, category, status, keyword, sort])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const columns: Column<Device>[] = [
    {
      key: 'name',
      title: '设备名称',
      render: (d) => (
        <div className="min-w-0">
          <div className="text-sm text-ink truncate">{d.name}</div>
          <div className="text-2xs text-ink-mute num">{d.code}</div>
        </div>
      ),
    },
    { key: 'type', title: '类型', width: 130, render: (d) => <span className="text-xs text-ink-soft">{DEVICE_CATEGORY_LABEL[d.category]}</span> },
    {
      key: 'space',
      title: '所属空间',
      width: 150,
      render: (d) => {
        const s = db.spaces.find((x) => x.id === d.spaceId)
        return <span className="text-xs text-ink-soft">{s?.building} {s && s.floor > 0 ? `${s.floor}F` : 'B1'} {s?.name}</span>
      },
    },
    {
      key: 'status',
      title: '状态',
      width: 96,
      render: (d) => (
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: d.status === 'online' ? 'var(--text-secondary)' : DEVICE_STATUS_COLOR[d.status] }}>
          <StatusDot color={DEVICE_STATUS_COLOR[d.status]} pulse={d.status === 'warning'} size={6} />
          {DEVICE_STATUS_LABEL[d.status]}
        </span>
      ),
    },
    {
      key: 'health',
      title: '健康度',
      width: 110,
      render: (d) => (
        <div className="flex items-center gap-2">
          <div className="w-12">
            <ProgressBar value={d.health} height={3} color={d.health < 60 ? 'var(--danger)' : d.health < 80 ? 'var(--warning)' : 'var(--success)'} />
          </div>
          <span className="num text-2xs text-ink-soft">{d.health}%</span>
        </div>
      ),
    },
    {
      key: 'lastReportAt',
      title: '最近上报',
      width: 100,
      render: (d) => <span className="num text-2xs text-ink-mute">{dayjs(d.lastReportAt).format('HH:mm:ss')}</span>,
    },
    {
      key: 'op',
      title: '',
      width: 60,
      align: 'right',
      render: (d) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setFocusId(d.id)
          }}
          className="text-2xs text-brand hover:text-brand-deep"
        >
          详情
        </button>
      ),
    },
  ]

  const toggleStatus = (s: DeviceStatus) =>
    setStatus((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  return (
    <>
      <PageHeader
        title="设备与空间"
        sub={`共 ${db.devices.length} 台在管设备 · 在线 ${db.devices.filter((d) => d.status === 'online').length} 台`}
        actions={
          <>
            <Button
              size="md"
              variant="secondary"
              icon={<Download size={14} />}
              onClick={() => {
                downloadCsv(
                  `设备台账_${dayjs().format('YYYYMMDD')}.csv`,
                  filtered.map((d) => ({
                    编号: d.id,
                    名称: d.name,
                    设备码: d.code,
                    类型: DEVICE_CATEGORY_LABEL[d.category],
                    型号: `${d.vendor} ${d.model}`,
                    空间: db.spaces.find((s) => s.id === d.spaceId)?.name ?? '',
                    IP: d.ip,
                    状态: DEVICE_STATUS_LABEL[d.status],
                    健康度: d.health,
                    责任人: d.owner,
                  })),
                )
                toast('success', '台账已导出', `共 ${filtered.length} 条记录`)
              }}
            >
              导出台账
            </Button>
            <Segmented
              options={[
                { label: '表格', value: 'table' },
                { label: '卡片', value: 'card' },
              ]}
              value={view}
              onChange={(v) => setView(v as 'table' | 'card')}
            />
          </>
        }
      />

      <div className="flex gap-3 flex-1 min-h-0">
        <aside className="w-[228px] shrink-0 panel flex flex-col overflow-hidden">
          <div className="p-2 border-b border-subtle">
            <Segmented
              className="w-full"
              size="sm"
              options={[
                { label: '按空间', value: 'space' },
                { label: '按类型', value: 'category' },
              ]}
              value={treeMode}
              onChange={(v) => {
                setTreeMode(v as 'space' | 'category')
                setSpaceId(null)
                setCategory(null)
              }}
            />
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-0.5">
            <button
              onClick={() => {
                setSpaceId(null)
                setCategory(null)
              }}
              className={cn(
                'w-full flex items-center justify-between h-8 px-2 rounded-ctrl text-xs transition-colors',
                !spaceId && !category ? 'bg-brand/[0.1] text-brand' : 'text-ink-soft hover:bg-panel2',
              )}
            >
              <span className="flex items-center gap-1.5">
                <MapPin size={12} />
                全部设备
              </span>
              <span className="num text-2xs text-ink-mute">{db.devices.length}</span>
            </button>

            {treeMode === 'space' &&
              db.spaces.map((s) => {
                const count = db.devices.filter((d) => d.spaceId === s.id).length
                const active = spaceId === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setSpaceId(active ? null : s.id)}
                    className={cn(
                      'w-full flex items-center justify-between h-8 px-2 rounded-ctrl text-xs transition-colors',
                      active ? 'bg-brand/[0.1] text-brand' : 'text-ink-soft hover:bg-panel2',
                    )}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <ChevronRight size={11} className={cn('transition-transform', active && 'rotate-90')} />
                      {s.building} {s.floor > 0 ? `${s.floor}F` : 'B1'} {s.name}
                    </span>
                    <span className="num text-2xs text-ink-mute shrink-0">{count}</span>
                  </button>
                )
              })}

            {treeMode === 'category' &&
              (Object.keys(DEVICE_CATEGORY_LABEL) as Array<keyof typeof DEVICE_CATEGORY_LABEL>).map((k) => {
                const count = db.devices.filter((d) => d.category === k).length
                const active = category === k
                return (
                  <button
                    key={k}
                    onClick={() => setCategory(active ? null : k)}
                    className={cn(
                      'w-full flex items-center justify-between h-8 px-2 rounded-ctrl text-xs transition-colors',
                      active ? 'bg-brand/[0.1] text-brand' : 'text-ink-soft hover:bg-panel2',
                    )}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <ChevronRight size={11} className={cn('transition-transform', active && 'rotate-90')} />
                      {DEVICE_CATEGORY_LABEL[k]}
                    </span>
                    <span className="num text-2xs text-ink-mute shrink-0">{count}</span>
                  </button>
                )
              })}
          </div>
          <div className="p-2 border-t border-subtle text-2xs text-ink-mute space-y-1">
            <div className="flex items-center justify-between">
              <span>在线率</span>
              <span className="num">{((db.devices.filter((d) => d.status === 'online').length / db.devices.length) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>告警设备</span>
              <span className="num text-bad">{db.devices.filter((d) => d.status === 'warning').length}</span>
            </div>
          </div>
        </aside>

        <Panel className="flex-1 min-w-0 relative" bodyClass="p-0 flex flex-col" title={undefined}>
          <div className="p-3 border-b border-subtle space-y-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <Input
                className="flex-1 max-w-[280px]"
                icon={<Search size={13} />}
                placeholder="搜索设备名称、编号或 IP"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="w-[130px]">
                <option value="status">按状态排序</option>
                <option value="health">按健康度排序</option>
                <option value="name">按名称排序</option>
              </Select>
              <div className="flex-1" />
              <span className="text-2xs text-ink-mute">共 {filtered.length} 台</span>
              <IconButton label="刷新" onClick={() => toast('success', '已刷新设备状态')}>
                <SlidersHorizontal size={14} />
              </IconButton>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-2xs text-ink-mute mr-1">状态</span>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={cn(
                    'h-6 px-2 rounded-full border text-2xs transition-colors',
                    status.includes(s)
                      ? 'border-brand/45 bg-brand/[0.1] text-brand'
                      : 'border-strong bg-panel2 text-ink-soft hover:text-ink',
                  )}
                >
                  {DEVICE_STATUS_LABEL[s]}
                </button>
              ))}
              {(status.length > 0 || keyword || spaceId || category) && (
                <button
                  onClick={() => {
                    setStatus([])
                    setKeyword('')
                    setSpaceId(null)
                    setCategory(null)
                  }}
                  className="h-6 px-2 rounded-full text-2xs text-ink-mute hover:text-bad flex items-center gap-1"
                >
                  <X size={10} />
                  清除筛选
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {view === 'table' ? (
              <>
                <Table
                  columns={columns}
                  rows={paged}
                  selectedIds={selected}
                  onSelect={setSelected}
                  onRowClick={(d) => setFocusId(d.id)}
                  emptyText="没有符合条件的设备"
                />
                <div className="h-0" />
              </>
            ) : (
              <div className="p-3 grid grid-cols-3 gap-2.5">
                {paged.map((d) => {
                  const s = db.spaces.find((x) => x.id === d.spaceId)
                  return (
                    <button
                      key={d.id}
                      onClick={() => setFocusId(d.id)}
                      className="text-left rounded-card border border-strong bg-panel2/50 hover:border-brand/40 hover:bg-brand/[0.03] transition-all p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm text-ink truncate">{d.name}</div>
                          <div className="text-2xs text-ink-mute num mt-0.5">{d.code}</div>
                        </div>
                        <StatusDot color={DEVICE_STATUS_COLOR[d.status]} pulse={d.status === 'warning'} />
                      </div>
                      <div className="flex items-center gap-1 text-2xs text-ink-mute mt-2">
                        <MapPin size={10} />
                        {s?.building} {s && s.floor > 0 ? `${s.floor}F` : 'B1'} {s?.name}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2.5">
                        {d.metrics.slice(0, 2).map((m) => (
                          <div key={m.key}>
                            <div className="text-[10px] text-ink-mute">{m.label}</div>
                            <div className="num text-xs text-ink">{m.value}{m.unit}</div>
                          </div>
                        ))}
                      </div>
                      {d.metrics[0]?.trend && (
                        <div className="mt-1.5">
                          <Sparkline data={d.metrics[0].trend} width={150} height={18} color={DEVICE_STATUS_COLOR[d.status]} />
                        </div>
                      )}
                    </button>
                  )
                })}
                {paged.length === 0 && <div className="col-span-3"><EmptyState title="没有符合条件的设备" /></div>}
              </div>
            )}
          </div>

          {selected.length > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 h-11 rounded-full bg-elevated border border-strong shadow-float z-20">
              <span className="text-xs text-ink">已选 {selected.length} 台</span>
              <div className="w-px h-4 bg-[var(--border-strong)]" />
              <button className="text-xs text-brand hover:text-brand-deep" onClick={() => toast('success', '已批量开启', `${selected.length} 台设备`)}>
                批量开启
              </button>
              <button className="text-xs text-warn hover:brightness-110" onClick={() => toast('success', '已批量关闭', `${selected.length} 台设备`)}>
                批量关闭
              </button>
              <button className="text-xs text-ink-mute hover:text-ink" onClick={() => setSelected([])}>
                取消
              </button>
            </div>
          )}

          <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} onSizeChange={setPageSize} />
        </Panel>
      </div>

      <DeviceDrawer deviceId={focusId} onClose={() => setFocusId(null)} />
    </>
  )
}
