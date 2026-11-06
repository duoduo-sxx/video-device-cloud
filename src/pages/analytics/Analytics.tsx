import { useMemo, useState } from 'react'
import { Clock, Download, MousePointerClick, Sparkles, TrendingUp } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader, Panel, NumberTicker } from '@/components/common'
import { AreaChart, BarChart, DonutChart, HeatmapChart, RadarChart } from '@/components/charts'
import { Button, Segmented } from '@/components/ui/primitives'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { commandVolume24h, heatmapData, responseDistribution, weekVolume } from '@/mock/generators'
import { downloadCsv } from '@/utils/misc'

const RANGES = [
  { label: '今日', value: 'today' },
  { label: '近 7 天', value: '7d' },
  { label: '近 30 天', value: '30d' },
]

export default function Analytics() {
  const db = useDataStore((s) => s.db)
  const toast = useUIStore((s) => s.toast)
  const [range, setRange] = useState('7d')

  const hour = useMemo(() => commandVolume24h(), [])
  const week = useMemo(() => weekVolume(), [])
  const heat = useMemo(() => heatmapData(), [])
  const resp = useMemo(() => responseDistribution(), [])

  const trend = useMemo(() => {
    if (range === 'today') {
      return hour.filter((h) => h.now).map((h) => ({ label: h.hour.slice(0, 5), value: h.value, value2: Math.round(h.value * 0.94) }))
    }
    return week.map((w) => ({ label: w.label, value: w.value, value2: Math.round(w.value * 0.94) }))
  }, [range, hour, week])

  const total = range === 'today' ? hour.reduce((s, h) => s + (h.now ? h.value : 0), 0) : week.reduce((s, w) => s + w.value, 0)

  const sceneTop = useMemo(() => [...db.scenes].sort((a, b) => b.usedCount - a.usedCount).slice(0, 6).map((s) => ({ label: s.name.replace('模式', ''), value: s.usedCount })), [db.scenes])
  const deviceFault = useMemo(
    () =>
      db.devices
        .map((d) => ({ label: d.name.slice(0, 8), value: db.alerts.filter((a) => a.deviceId === d.id).length }))
        .filter((x) => x.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    [db.devices, db.alerts],
  )

  const typeDist = useMemo(() => {
    const m: Record<string, number> = {}
    db.commands.forEach((c) => {
      const k = c.intentLabel.startsWith('scene') ? '场景控制' : c.intentLabel.startsWith('device') ? '设备调节' : c.intentLabel.startsWith('alert') || c.intentLabel.startsWith('analytics') ? '查询问答' : c.intentLabel.startsWith('task') ? '任务调度' : '服务请求'
      m[k] = (m[k] ?? 0) + 1
    })
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [db.commands])

  const successRate = (db.commands.filter((c) => c.status === 'success').length / db.commands.length) * 100
  const avgCost = db.commands.reduce((s, c) => s + c.cost, 0) / db.commands.length / 1000

  return (
    <>
      <PageHeader
        title="数据分析"
        sub="交互、设备与服务效能的多维分析"
        actions={
          <>
            <Segmented options={RANGES} value={range} onChange={setRange} />
            <Button
              variant="secondary"
              icon={<Download size={14} />}
              onClick={() => {
                downloadCsv(
                  `交互分析_${range}_${dayjs().format('YYYYMMDD')}.csv`,
                  trend.map((t) => ({ 时间: t.label, 指令量: t.value, 成功量: t.value2 })),
                )
                toast('success', '报表已导出', 'CSV 已开始下载')
              }}
            >
              导出
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-3">
        {[
          { label: '指令总量', value: total, icon: MousePointerClick, suffix: '', color: 'var(--brand)' },
          { label: '成功率', value: successRate, icon: TrendingUp, suffix: '%', digits: 1, color: 'var(--success)' },
          { label: '平均响应', value: avgCost, icon: Clock, suffix: 's', digits: 1, color: 'var(--info)' },
          { label: '场景执行', value: db.scenes.reduce((s, x) => s + x.usedCount, 0), icon: Sparkles, suffix: '次', color: 'var(--accent)' },
        ].map((k) => (
          <div key={k.label} className="panel px-4 py-3 h-[86px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-2xs text-ink-soft">{k.label}</span>
              <k.icon size={14} style={{ color: k.color }} />
            </div>
            <div className="num text-[26px] leading-none" style={{ color: k.color }}>
              <NumberTicker value={k.value} digits={k.digits ?? 0} />
              <span className="text-xs text-ink-mute ml-1 font-sans">{k.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-3 mb-3">
        <Panel title="指令趋势" className="col-span-7 h-[300px]" bodyClass="p-3" extra={<span className="text-2xs text-ink-mute">指令量 / 成功量</span>}>
          <AreaChart data={trend} height={246} />
        </Panel>
        <Panel title="指令类型分布" className="col-span-5 h-[300px]" bodyClass="p-3" extra={<span className="num text-2xs text-ink-mute">{db.commands.length} 条</span>}>
          <DonutChart data={typeDist} height={246} centerValue={String(db.commands.length)} centerLabel="指令" />
        </Panel>
      </div>

      <div className="grid grid-cols-12 gap-3 mb-3">
        <Panel title="时段热力分布" className="col-span-8 h-[300px]" bodyClass="p-3" extra={<span className="text-2xs text-ink-mute">近 7 天 · 按小时</span>}>
          <HeatmapChart data={heat} height={246} />
        </Panel>
        <Panel title="响应时长分布" className="col-span-4 h-[300px]" bodyClass="p-3" extra={<span className="text-2xs text-ink-mute">毫秒级</span>}>
          <BarChart data={resp} height={246} />
        </Panel>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <Panel title="场景使用排行" className="col-span-4 h-[300px]" bodyClass="p-3">
          <BarChart data={sceneTop} height={246} horizontal />
        </Panel>
        <Panel title="设备告警次数 Top 8" className="col-span-4 h-[300px]" bodyClass="p-3">
          <BarChart data={deviceFault} height={246} horizontal color="var(--warning)" />
        </Panel>
        <Panel title="服务满意度" className="col-span-4 h-[300px]" bodyClass="p-3">
          <RadarChart
            height={246}
            indicators={[
              { name: '响应速度', max: 100 },
              { name: '专业程度', max: 100 },
              { name: '解决效果', max: 100 },
              { name: '沟通体验', max: 100 },
              { name: '按时完成', max: 100 },
            ]}
            values={[92, 88, 85, 90, 87]}
          />
        </Panel>
      </div>
    </>
  )
}
