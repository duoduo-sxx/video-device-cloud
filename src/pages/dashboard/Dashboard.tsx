import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Cpu,
  Gauge,
  ListChecks,
  MousePointerClick,
  Sparkles,
  Users,
} from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader, Panel, ProgressBar, Sparkline, StatusDot, NumberTicker, EmptyState } from '@/components/common'
import { AreaChart, DonutChart } from '@/components/charts'
import { Button, Segmented, Tag } from '@/components/ui/primitives'
import { SpaceMap } from '@/components/biz/SpaceMap'
import { DeviceDrawer } from '@/components/biz/DeviceDrawer'
import { ConfirmDialog } from '@/components/ui/overlay'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { useAppStore } from '@/stores/appStore'
import { commandVolume24h, weekVolume } from '@/mock/generators'
import { ALERT_LEVEL_COLOR, ALERT_STATUS_LABEL, TASK_STATUS_COLOR, TASK_STATUS_LABEL } from '@/constants/enums'
import { cn } from '@/utils/misc'
import type { ExecResult } from '@/types'

function KpiCard({
  label,
  value,
  digits = 0,
  suffix,
  delta,
  up,
  icon,
  spark,
  onClick,
}: {
  label: string
  value: number
  digits?: number
  suffix?: string
  delta?: string
  up?: boolean
  icon: ReactNode
  spark?: number[]
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="panel p-3.5 text-left hover:border-brand/35 transition-all duration-150 group relative overflow-hidden h-[104px] flex flex-col justify-between focus-ring"
    >
      <div className="flex items-start justify-between">
        <span className="text-2xs text-ink-soft">{label}</span>
        <span className="text-ink-mute group-hover:text-brand transition-colors">{icon}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="num text-[26px] leading-none text-ink">
          <NumberTicker value={value} digits={digits} />
          {suffix && <span className="text-xs text-ink-mute ml-0.5 font-sans">{suffix}</span>}
        </div>
        {spark && <Sparkline data={spark} width={54} height={22} color="var(--brand)" />}
      </div>
      {delta && (
        <div className="flex items-center gap-1 text-[10px]">
          {up ? <ArrowUpRight size={10} className="text-ok" /> : <ArrowDownRight size={10} className="text-bad" />}
          <span className={up ? 'text-ok' : 'text-bad'}>{delta}</span>
          <span className="text-ink-mute">较昨日</span>
        </div>
      )}
    </button>
  )
}

interface FeedItem {
  id: string
  input: string
  userName: string
  status: 'success' | 'partial' | 'failed'
  cost: number
  createdAt: string
}

export default function Dashboard() {
  const db = useDataStore((s) => s.db)
  const runScene = useDataStore((s) => s.runScene)
  const toast = useUIStore((s) => s.toast)
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const [range, setRange] = useState<'24h' | '7d'>('24h')
  const [focusId, setFocusId] = useState<string | null>(null)
  const [confirmScene, setConfirmScene] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<ExecResult | null>(null)
  const [feed, setFeed] = useState<FeedItem[]>(() =>
    db.commands.slice(0, 9).map((c) => ({
      id: c.id,
      input: c.input,
      userName: c.userName,
      status: c.status,
      cost: c.cost,
      createdAt: c.createdAt,
    })),
  )

  const online = db.devices.filter((d) => d.status === 'online').length
  const openAlerts = db.alerts.filter((a) => a.status !== 'closed' && a.status !== 'recovered')
  const todayCommands = db.commands.filter((c) => dayjs(c.createdAt).isSame(dayjs(), 'day'))
  const avgCost = todayCommands.length
    ? todayCommands.reduce((s, c) => s + c.cost, 0) / todayCommands.length / 1000
    : 3.2
  const doneTasks = db.tasks.filter((t) => t.status === 'done').length
  const failTasks = db.tasks.filter((t) => t.status === 'failed').length
  const taskRate = doneTasks + failTasks ? (doneTasks / (doneTasks + failTasks)) * 100 : 94.6

  const env = db.devices.find((d) => d.id === 'DEV-0124')
  const envMetrics = env?.metrics ?? []

  const weakDevices = useMemo(
    () => [...db.devices].sort((a, b) => a.health - b.health).slice(0, 5),
    [db.devices],
  )

  const hourData = useMemo(() => commandVolume24h(), [])
  const weekData = useMemo(() => weekVolume(), [])

  const trend = useMemo(() => {
    if (range === '7d') return weekData.map((w) => ({ label: w.label, value: w.value, value2: Math.round(w.value * 0.94) }))
    const upto = hourData.filter((h) => h.now)
    return upto.map((h) => ({ label: h.hour.slice(0, 5), value: h.value, value2: Math.round(h.value * 0.93) }))
  }, [range, hourData, weekData])

  const typeDist = useMemo(() => {
    const m: Record<string, number> = {}
    db.commands.forEach((c) => {
      const k =
        c.intentLabel.startsWith('scene') ? '场景控制'
          : c.intentLabel.startsWith('device') ? '设备调节'
            : c.intentLabel.startsWith('alert') || c.intentLabel.startsWith('analytics') ? '查询问答'
              : c.intentLabel.startsWith('task') ? '任务调度'
                : '服务请求'
      m[k] = (m[k] ?? 0) + 1
    })
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [db.commands])

  const timeline = useMemo(() => {
    const items = [
      ...db.alerts.slice(0, 6).map((a) => ({
        id: a.id,
        time: a.triggeredAt,
        type: 'alert' as const,
        title: `${a.level} ${a.title}`,
        sub: a.deviceName,
      })),
      ...db.tasks.slice(0, 5).map((t) => ({
        id: t.id,
        time: t.plannedAt,
        type: 'task' as const,
        title: t.name,
        sub: `${t.assignee} · ${TASK_STATUS_LABEL[t.status]}`,
      })),
      ...db.tickets.slice(0, 4).map((t) => ({
        id: t.id,
        time: t.createdAt,
        type: 'ticket' as const,
        title: t.title,
        sub: `${t.serviceType} · ${t.creator}`,
      })),
    ]
    return items.sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf()).slice(0, 8)
  }, [db.alerts, db.tasks, db.tickets])

  const sessions = useMemo(() => {
    const map = new Map<string, { name: string; color: string; page: string; since: string }>()
    db.commands.slice(0, 40).forEach((c) => {
      if (!map.has(c.userName)) {
        map.set(c.userName, {
          name: c.userName,
          color: db.users.find((u) => u.name === c.userName)?.avatarColor ?? '#22D3EE',
          page: ['/interaction', '/devices', '/alerts', '/tasks'][map.size % 4],
          since: c.createdAt,
        })
      }
    })
    return Array.from(map.values()).slice(0, 5)
  }, [db.commands, db.users])

  useEffect(() => {
    const t = window.setInterval(() => {
      const pool = ['启动晨间迎宾', '查看 A 座 1F 设备状态', '把展厅亮度调高一点', '关闭所有投影', '现在有哪些告警', '启动会议演示模式']
      const names = ['张启明', '孙梦祺', '赵炜', '吴天文', '李静文']
      setFeed((prev) =>
        [
          {
            id: `live-${Date.now()}`,
            input: pool[Math.floor(Math.random() * pool.length)],
            userName: names[Math.floor(Math.random() * names.length)],
            status: 'success' as const,
            cost: 800 + Math.round(Math.random() * 4000),
            createdAt: dayjs().format('YYYY-MM-DDTHH:mm:ssZ'),
          },
          ...prev,
        ].slice(0, 9),
      )
    }, 4000)
    return () => window.clearInterval(t)
  }, [])

  const doRun = (id: string) => {
    const scene = db.scenes.find((s) => s.id === id)!
    const result = runScene(id)
    setLastResult(result)
    toast(result.status === 'success' ? 'success' : 'warning', `「${scene.name}」${result.status === 'success' ? '执行完成' : '部分完成'}`, `影响 ${result.devices} 台设备 · 耗时 ${(result.cost / 1000).toFixed(1)}s`)
  }

  return (
    <>
      <PageHeader
        title={`${user?.name ?? ''}，${dayjs().hour() < 12 ? '上午好' : dayjs().hour() < 18 ? '下午好' : '晚上好'}`}
        sub={`今天是 ${dayjs().format('YYYY 年 M 月 D 日')} · 全域设备与服务运行正常`}
        actions={
          <>
            <Segmented
              options={[
                { label: '今日', value: '24h' },
                { label: '近 7 天', value: '7d' },
              ]}
              value={range}
              onChange={(v) => setRange(v as '24h' | '7d')}
            />
            <Button variant="primary" size="md" icon={<Sparkles size={14} />} onClick={() => navigate('/interaction')}>
              发起交互
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-5 gap-3 mb-3">
        <KpiCard label="在线设备" value={online} suffix={`/ ${db.devices.length}`} icon={<Cpu size={14} />} delta="2.1%" up onClick={() => navigate('/devices')} />
        <KpiCard label="今日指令" value={todayCommands.length || 1284} icon={<MousePointerClick size={14} />} delta="8.4%" up spark={[12, 18, 15, 24, 22, 30, 28]} onClick={() => navigate('/interaction')} />
        <KpiCard label="平均响应" value={avgCost} digits={1} suffix="s" icon={<Clock size={14} />} delta="0.4s" up />
        <KpiCard label="未处置告警" value={openAlerts.length} icon={<AlertTriangle size={14} />} onClick={() => navigate('/alerts')} />
        <KpiCard label="任务完成率" value={taskRate} digits={1} suffix="%" icon={<CheckCircle2 size={14} />} delta="1.2%" up onClick={() => navigate('/tasks')} />
      </div>

      <div className="grid grid-cols-12 gap-3 mb-3">
        <Panel
          title="实时态势图"
          className="col-span-8 h-[358px]"
          bodyClass="p-2"
          extra={
            <div className="flex items-center gap-3 text-2xs text-ink-mute">
              <span className="flex items-center gap-1"><StatusDot color="var(--success)" /> 在线</span>
              <span className="flex items-center gap-1"><StatusDot color="var(--danger)" /> 告警</span>
              <span className="flex items-center gap-1"><StatusDot color="#64748B" /> 离线</span>
              <Button size="sm" variant="ghost" onClick={() => navigate('/devices')}>
                查看全部
              </Button>
            </div>
          }
        >
          <SpaceMap spaces={db.spaces} devices={db.devices} onSelect={setFocusId} />
        </Panel>

        <div className="col-span-4 flex flex-col gap-3">
          <Panel title="环境参数" className="h-[172px]" bodyClass="p-3">
            <div className="grid grid-cols-2 gap-2">
              {envMetrics.slice(0, 4).map((m) => {
                const over = m.threshold?.max !== undefined && m.value > m.threshold.max
                return (
                  <div key={m.key} className="rounded-ctrl bg-panel2 px-2.5 py-2">
                    <div className="text-[10px] text-ink-mute">{m.label}</div>
                    <div className={cn('num text-md mt-0.5', over ? 'text-warn' : 'text-ink')}>
                      {m.value}
                      <span className="text-2xs text-ink-mute ml-0.5">{m.unit}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel title="设备健康度" className="h-[174px]" bodyClass="p-3" extra={<span className="text-2xs text-ink-mute">最低 5 台</span>}>
            <div className="space-y-2">
              {weakDevices.map((d) => (
                <button key={d.id} onClick={() => setFocusId(d.id)} className="w-full text-left group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xs text-ink-soft group-hover:text-ink truncate">{d.name}</span>
                    <span className="num text-2xs text-ink-mute">{d.health}%</span>
                  </div>
                  <ProgressBar value={d.health} height={3} color={d.health < 60 ? 'var(--danger)' : d.health < 80 ? 'var(--warning)' : 'var(--success)'} />
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 mb-3">
        <Panel title="交互趋势" className="col-span-5 h-[286px]" bodyClass="p-3 pt-2" extra={<span className="text-2xs text-ink-mute">{range === '7d' ? '按日' : '按小时'} · 指令量 / 成功量</span>}>
          <AreaChart data={trend} height={228} />
        </Panel>

        <Panel title="指令类型分布" className="col-span-4 h-[286px]" bodyClass="p-3" extra={<span className="num text-2xs text-ink-mute">{db.commands.length} 条</span>}>
          <DonutChart data={typeDist} height={228} centerValue={String(db.commands.length)} centerLabel="指令总数" />
        </Panel>

        <Panel title="实时指令流" className="col-span-3 h-[286px]" bodyClass="p-0" extra={<span className="flex items-center gap-1 text-2xs text-ink-mute"><Activity size={11} className="text-ok" /> 实时</span>}>
          <div className="px-3 py-2 space-y-0.5">
            {feed.map((c, i) => (
              <motion.div
                key={c.id}
                initial={i === 0 ? { opacity: 0, y: -6 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-2 py-1.5 border-b border-subtle last:border-0"
              >
                <span className="mt-1 shrink-0">
                  <StatusDot color={c.status === 'success' ? 'var(--success)' : c.status === 'partial' ? 'var(--warning)' : 'var(--danger)'} size={6} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-2xs text-ink truncate">{c.input}</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-ink-mute mt-0.5">
                    <span>{c.userName}</span>
                    <span>·</span>
                    <span className="num">{(c.cost / 1000).toFixed(1)}s</span>
                    <span>·</span>
                    <span>{dayjs(c.createdAt).format('HH:mm')}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <Panel title="今日事件" className="col-span-5 h-[268px]" bodyClass="p-3 pt-2" extra={<Button size="sm" variant="ghost" onClick={() => navigate('/alerts')}>全部</Button>}>
          <div className="relative pl-4">
            <div className="absolute left-[5px] top-1 bottom-1 w-px bg-[var(--border-strong)]" />
            <div className="space-y-2.5">
              {timeline.map((it) => {
                const color = it.type === 'alert' ? 'var(--danger)' : it.type === 'task' ? 'var(--brand)' : 'var(--warning)'
                return (
                  <div key={it.id} className="relative">
                    <span className="absolute -left-[13px] top-1 w-[7px] h-[7px] rounded-full border-2" style={{ background: 'var(--bg-panel)', borderColor: color }} />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-2xs text-ink truncate">{it.title}</span>
                      <span className="num text-[10px] text-ink-mute shrink-0">{dayjs(it.time).format('HH:mm')}</span>
                    </div>
                    <div className="text-[10px] text-ink-mute mt-0.5">{it.sub}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </Panel>

        <Panel title="活跃会话" className="col-span-3 h-[268px]" bodyClass="p-3" extra={<span className="text-2xs text-ink-mute">{sessions.length} 人在线</span>}>
          <div className="space-y-2.5">
            {sessions.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] shrink-0"
                  style={{ background: `${s.color}22`, color: s.color, border: `1px solid ${s.color}44` }}
                >
                  {s.name.slice(-1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-2xs text-ink truncate">{s.name}</div>
                  <div className="text-[10px] text-ink-mute truncate num">{s.page}</div>
                </div>
                <span className="text-[10px] text-ink-mute shrink-0">{dayjs(s.since).fromNow()}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="场景快捷执行"
          className="col-span-4 h-[268px]"
          bodyClass="p-2.5"
          extra={<Button size="sm" variant="ghost" onClick={() => navigate('/scenes')}>管理</Button>}
        >
          <div className="grid grid-cols-2 gap-2">
            {db.scenes.slice(0, 6).map((s) => (
              <button
                key={s.id}
                onClick={() => setConfirmScene(s.id)}
                className="group text-left rounded-ctrl border border-strong bg-panel2/70 hover:border-brand/45 hover:bg-brand/[0.05] transition-all p-2"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles size={11} className="text-brand shrink-0" />
                  <span className="text-2xs text-ink truncate">{s.name}</span>
                </div>
                <div className="text-[10px] text-ink-mute mt-0.5 num">{s.deviceCount} 台 · {s.steps.length} 步</div>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <DeviceDrawer deviceId={focusId} onClose={() => setFocusId(null)} />
      <ConfirmDialog
        open={!!confirmScene}
        onClose={() => setConfirmScene(null)}
        onConfirm={() => confirmScene && doRun(confirmScene)}
        title="执行场景"
        desc={
          confirmScene
            ? `即将执行「${db.scenes.find((s) => s.id === confirmScene)?.name}」，将影响 ${db.scenes.find((s) => s.id === confirmScene)?.deviceCount} 台设备。执行过程可在场景详情页查看。`
            : ''
        }
        confirmText="立即执行"
      />
      {lastResult && (
        <div className="sr-only" role="status">
          场景执行结果：{lastResult.status}，影响 {lastResult.devices} 台设备
        </div>
      )}
    </>
  )
}
