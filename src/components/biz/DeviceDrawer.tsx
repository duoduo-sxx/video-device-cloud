import { useMemo, useState } from 'react'
import { Cpu, Power, RefreshCw, Wrench } from 'lucide-react'
import dayjs from 'dayjs'
import { Drawer } from '@/components/ui/overlay'
import { Button, Segmented, Slider, Switch, Tabs, Tag } from '@/components/ui/primitives'
import { MetaItem, ProgressBar, Sparkline, StatusDot } from '@/components/common'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { DEVICE_CATEGORY_LABEL, DEVICE_STATUS_COLOR, DEVICE_STATUS_LABEL } from '@/constants/enums'
import { cn } from '@/utils/misc'

export function DeviceDrawer({ deviceId, onClose }: { deviceId: string | null; onClose: () => void }) {
  const db = useDataStore((s) => s.db)
  const togglePower = useDataStore((s) => s.toggleDevicePower)
  const setValue = useDataStore((s) => s.setDeviceValue)
  const setMode = useDataStore((s) => s.setDeviceMode)
  const toast = useUIStore((s) => s.toast)
  const [tab, setTab] = useState<'overview' | 'control' | 'events' | 'logs'>('overview')

  const device = db.devices.find((d) => d.id === deviceId) ?? null
  const space = db.spaces.find((s) => s.id === device?.spaceId)
  const relatedAlerts = useMemo(
    () => db.alerts.filter((a) => a.deviceId === deviceId).slice(0, 8),
    [db.alerts, deviceId],
  )
  const relatedTickets = db.tickets.filter((t) => t.deviceId === deviceId).slice(0, 3)

  const logs = useMemo(() => {
    if (!device) return []
    const base = [
      ['信息', '状态上报正常', '心跳包已接收，指标在阈值范围内'],
      ['信息', '配置同步完成', '已从控制中心拉取最新参数'],
      ['警告', '指标短时波动', `${device.metrics[0]?.label ?? '读数'}偏离基线 8%，已自动回调`],
      ['信息', '指令执行成功', '场景动作下发后 1.2s 返回确认'],
      ['信息', '固件版本校验通过', `当前版本 ${device.firmware}`],
      ['错误', '通信超时', '与中控主机通信超过 3s 未响应，已自动重连'],
    ]
    return base.map((l, i) => ({
      id: `log-${i}`,
      level: l[0],
      action: l[1],
      detail: l[2],
      time: dayjs().subtract(i * 37 + 3, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    }))
  }, [device])

  if (!device) return null

  const color = DEVICE_STATUS_COLOR[device.status]

  return (
    <Drawer
      open={!!deviceId}
      onClose={onClose}
      width={540}
      title={
        <span className="flex items-center gap-2">
          <StatusDot color={color} pulse={device.status === 'warning'} />
          {device.name}
        </span>
      }
      subtitle={
        <span className="flex items-center gap-2">
          <span className="num">{device.code}</span>
          <span>·</span>
          <span>{space?.building} {space && space.floor > 0 ? `${space.floor}F` : 'B1'} {space?.name}</span>
          <Tag color={color}>{DEVICE_STATUS_LABEL[device.status]}</Tag>
        </span>
      }
      footer={
        <>
          <Button size="sm" variant="secondary" icon={<RefreshCw size={13} />} onClick={() => toast('success', '已下发状态查询', `${device.name} 将在 2 秒内回传最新读数`)}>
            状态查询
          </Button>
          <Button size="sm" variant="secondary" icon={<Wrench size={13} />} onClick={() => toast('info', '已生成工单草稿', '请前往技术服务完成填写')}>
            报修
          </Button>
        </>
      }
    >
      <div className="px-5">
        <Tabs
          tabs={[
            { key: 'overview', label: '概览' },
            { key: 'control', label: '控制' },
            { key: 'events', label: '事件', count: relatedAlerts.length },
            { key: 'logs', label: '日志' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div className="p-5">
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2.5">
              {device.metrics.slice(0, 3).map((m) => {
                const over = m.threshold?.max !== undefined && m.value > m.threshold.max
                const under = m.threshold?.min !== undefined && m.value < m.threshold.min
                return (
                  <div key={m.key} className="rounded-card border border-strong bg-panel2 p-3">
                    <div className="text-2xs text-ink-mute">{m.label}</div>
                    <div className={cn('num text-lg mt-1', over || under ? 'text-bad' : 'text-ink')}>
                      {m.value}
                      <span className="text-2xs text-ink-mute ml-0.5">{m.unit}</span>
                    </div>
                    {m.trend && m.trend.length > 1 && (
                      <div className="mt-1.5 -mb-1">
                        <Sparkline data={m.trend} width={96} height={20} color={over || under ? 'var(--danger)' : 'var(--brand)'} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-ink-soft">健康度</span>
                <span className="num text-xs text-ink">{device.health}%</span>
              </div>
              <ProgressBar value={device.health} color={device.health < 60 ? 'var(--danger)' : device.health < 80 ? 'var(--warning)' : 'var(--success)'} />
            </div>

            <div className="rounded-card border border-strong bg-panel2/60 px-3 py-1">
              <MetaItem label="设备类型" value={`${device.type}`} />
              <MetaItem label="品类" value={DEVICE_CATEGORY_LABEL[device.category]} />
              <MetaItem label="厂商型号" value={`${device.vendor} ${device.model}`} />
              <MetaItem label="固件版本" value={<span className="num">{device.firmware}</span>} />
              <MetaItem label="IP 地址" value={<span className="num">{device.ip}</span>} />
              <MetaItem label="安装日期" value={device.installedAt} />
              <MetaItem label="责任人" value={device.owner} />
              <MetaItem label="最近上报" value={dayjs(device.lastReportAt).format('MM-DD HH:mm:ss')} />
            </div>

            {relatedTickets.length > 0 && (
              <div>
                <div className="text-xs text-ink-soft mb-2">关联工单</div>
                <div className="space-y-1.5">
                  {relatedTickets.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-ctrl border border-strong bg-panel2 px-2.5 py-2">
                      <span className="text-xs text-ink truncate">{t.title}</span>
                      <span className="num text-2xs text-ink-mute shrink-0 ml-2">{t.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'control' && (
          <div className="space-y-6">
            {device.controlType === 'readonly' ? (
              <div className="rounded-card border border-strong bg-panel2 p-4 flex items-start gap-2.5">
                <Cpu size={15} className="text-ink-mute mt-0.5" />
                <div>
                  <div className="text-xs text-ink">该设备为只读监控项</div>
                  <div className="text-2xs text-ink-mute mt-1">仅支持状态与指标查看，参数需在厂商平台调整。</div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3.5 rounded-card border border-strong bg-panel2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn('w-8 h-8 rounded-md flex items-center justify-center', device.power ? 'bg-ok/12 text-ok' : 'bg-panel text-ink-mute')}
                    >
                      <Power size={15} />
                    </span>
                    <div>
                      <div className="text-xs text-ink">电源</div>
                      <div className="text-2xs text-ink-mute">{device.power ? '当前已开启' : '当前已关闭'}</div>
                    </div>
                  </div>
                  <Switch
                    checked={device.power}
                    label="电源开关"
                    onChange={(v) => {
                      togglePower(device.id)
                      toast('success', v ? '设备已开启' : '设备已关闭', device.name)
                    }}
                  />
                </div>

                {device.controlType === 'range' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-ink-soft">{device.metrics[0]?.label ?? '调节'}</span>
                      <span className="num text-sm text-ink">
                        {device.value ?? 0}
                        {device.unit}
                      </span>
                    </div>
                    <Slider
                      value={device.value ?? 0}
                      onChange={(v) => setValue(device.id, v)}
                      accent="var(--brand)"
                    />
                    <div className="flex justify-between text-[10px] text-ink-mute mt-1">
                      <span>0{device.unit}</span>
                      <span>100{device.unit}</span>
                    </div>
                  </div>
                )}

                {device.controlType === 'level' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-ink-soft">运行档位</span>
                      <span className="num text-sm text-ink">{device.value ?? 1} 档</span>
                    </div>
                    <Segmented
                      className="w-full"
                      options={[1, 2, 3, 4, 5].map((n) => ({ label: `${n} 档`, value: n }))}
                      value={device.value ?? 1}
                      onChange={(v) => setValue(device.id, v)}
                    />
                    <p className="text-2xs text-ink-mute mt-2">档位越高，机组出力越大，能耗相应上升。</p>
                  </div>
                )}

                {device.controlType === 'mode' && device.modes && (
                  <div>
                    <div className="text-xs text-ink-soft mb-2">工作模式</div>
                    <div className="grid grid-cols-2 gap-2">
                      {device.modes.map((m) => (
                        <button
                          key={m}
                          onClick={() => setMode(device.id, m)}
                          className={cn(
                            'h-9 rounded-ctrl border text-xs transition-colors',
                            device.mode === m
                              ? 'border-brand/50 bg-brand/[0.1] text-brand'
                              : 'border-strong bg-panel2 text-ink-soft hover:text-ink',
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-card border border-strong bg-panel2/60 px-3 py-2">
                  <MetaItem label="控制方式" value={device.controlType === 'switch' ? '开关量' : device.controlType === 'range' ? '连续量调节' : device.controlType === 'level' ? '分档控制' : '模式选择'} />
                  <MetaItem label="指令通道" value="中控主机 → TCP 2001" />
                  <MetaItem label="超时时间" value="5000 ms" />
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'events' && (
          <div className="space-y-2">
            {relatedAlerts.length === 0 && <div className="py-10 text-center text-xs text-ink-mute">该设备近 3 天无告警记录</div>}
            {relatedAlerts.map((a) => (
              <div key={a.id} className="rounded-ctrl border border-strong bg-panel2 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-ink truncate">{a.title}</span>
                  <Tag color={a.level === 'P1' ? 'var(--danger)' : a.level === 'P2' ? 'var(--warning)' : 'var(--info)'}>{a.level}</Tag>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-2xs text-ink-mute">{dayjs(a.triggeredAt).format('MM-DD HH:mm')} · {a.currentValue}{a.unit}</span>
                  <span className="num text-2xs text-ink-mute">{a.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'logs' && (
          <div className="space-y-0">
            {logs.map((l) => (
              <div key={l.id} className="flex gap-2.5 py-2.5 border-b border-subtle last:border-0">
                <span
                  className="text-2xs shrink-0 w-8"
                  style={{ color: l.level === '错误' ? 'var(--danger)' : l.level === '警告' ? 'var(--warning)' : 'var(--text-muted)' }}
                >
                  {l.level}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-ink">{l.action}</div>
                  <div className="text-2xs text-ink-mute mt-0.5">{l.detail}</div>
                </div>
                <span className="num text-[10px] text-ink-mute shrink-0">{l.time.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  )
}
