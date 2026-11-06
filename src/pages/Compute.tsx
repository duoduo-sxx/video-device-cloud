import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Cpu, Gauge, HardDrive, Pause, Play, Server, Thermometer, Zap } from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { Badge, Button, Card, CardHeader, Progress, Segmented, Tabs } from '../components/ui'
import { KpiCard, PageHeader, Skeleton } from '../components/common'
import { TASK_STATUS_META } from '../lib/constants'
import { duration } from '../lib/format'
import { cn } from '../lib/cn'
import type { ComputeNode } from '../types'

const NODE_STATUS: Record<ComputeNode['status'], { label: string; color: string; bg: string }> = {
  idle: { label: '空闲', color: '#34D399', bg: 'rgba(52,211,153,.12)' },
  busy: { label: '运行中', color: '#22D3EE', bg: 'rgba(34,211,238,.12)' },
  maintenance: { label: '维护中', color: '#FBBF24', bg: 'rgba(251,191,36,.12)' },
  offline: { label: '离线', color: '#6E7D90', bg: 'rgba(110,125,144,.12)' },
}

export default function Compute() {
  const navigate = useNavigate()
  const { data, loading } = useAsync(async () => ({ nodes: await api.listNodes(), tasks: await api.listTasks(), repairs: await api.listRepairs() }), [])
  const [tab, setTab] = useState('nodes')
  const [filter, setFilter] = useState('all')

  const nodes = data?.nodes ?? []
  const tasks = data?.tasks ?? []
  const repairs = data?.repairs ?? []

  const running = tasks.filter((t) => ['probing', 'detecting', 'aggregating'].includes(t.status))
  const queued = tasks.filter((t) => t.status === 'queued')
  const runningRepairs = repairs.filter((r) => r.status === 'running' || r.status === 'rechecking')

  const stats = useMemo(() => {
    const gpus = nodes.filter((n) => n.type === 'GPU')
    const util = gpus.reduce((s, n) => s + n.gpuUtil, 0) / Math.max(1, gpus.length)
    const doneToday = nodes.reduce((s, n) => s + n.doneToday, 0)
    const idle = nodes.filter((n) => n.status === 'idle').length
    return { util, doneToday, idle, total: nodes.length }
  }, [nodes])

  const filteredNodes = filter === 'all' ? nodes : nodes.filter((n) => n.type.toLowerCase() === filter)

  const hourly = [38, 46, 61, 72, 68, 81, 88, 76, 71, 84, 79, 63]

  return (
    <div>
      <PageHeader
        title="算力调度"
        desc="检测与修复任务按优先级排队，GPU 节点按显存与算子兼容性分配。任务可暂停与迁移。"
        actions={
          <>
            <Button>
              <Pause size={14} /> 全部暂停
            </Button>
            <Button variant="primary">
              <Zap size={14} /> 手动调度
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        <KpiCard label="GPU 平均利用率" value={`${stats.util.toFixed(0)}%`} hint={`${nodes.filter((n) => n.type === 'GPU').length} 张卡`} values={hourly.slice(4)} color="#22D3EE" />
        <KpiCard label="今日完成任务" value={String(stats.doneToday)} unit="个" hint="检测 + 修复" values={[8, 12, 15, 18, 22, 26, 31]} color="#34D399" />
        <KpiCard label="队列等待" value={String(queued.length + runningRepairs.length)} unit="个" hint={`运行中 ${running.length + runningRepairs.length}`} values={[6, 4, 5, 3, 4, 2, 3]} color="#FBBF24" />
        <KpiCard label="空闲节点" value={String(stats.idle)} unit={`/ ${stats.total}`} hint="可立即接单" values={[2, 3, 2, 1, 2, 3, 2]} color="#A78BFA" />
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8">
          <Card>
            <div className="flex items-center justify-between px-5 pt-3">
              <Tabs
                value={tab}
                onChange={setTab}
                items={[
                  { key: 'nodes', label: '节点', count: nodes.length },
                  { key: 'queue', label: '任务队列', count: running.length + queued.length + runningRepairs.length },
                ]}
                className="flex-1"
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 p-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : tab === 'nodes' ? (
              <>
                <div className="px-5 py-3">
                  <Segmented
                    value={filter}
                    onChange={setFilter}
                    items={[
                      { key: 'all', label: '全部' },
                      { key: 'gpu', label: 'GPU' },
                      { key: 'cpu', label: 'CPU' },
                    ]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 px-4 pb-4">
                  {filteredNodes.map((n) => {
                    const st = NODE_STATUS[n.status]
                    const tempHigh = n.tempC >= 70
                    return (
                      <div key={n.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-3)] text-[var(--text-2)]">
                              {n.type === 'GPU' ? <Zap size={13} /> : <Cpu size={13} />}
                            </span>
                            <div>
                              <div className="text-[12.5px] text-[var(--text-1)]">{n.name}</div>
                              <div className="mono text-[10px] text-[var(--text-3)]">
                                {n.vram} · {n.type}
                              </div>
                            </div>
                          </div>
                          <Badge color={st.color} bg={st.bg} dot>
                            {st.label}
                          </Badge>
                        </div>

                        <div className="mt-2.5 space-y-1.5">
                          <div>
                            <div className="flex justify-between text-[10.5px]">
                              <span className="text-[var(--text-3)]">算力占用</span>
                              <span className="mono text-[var(--text-2)]">{n.gpuUtil}%</span>
                            </div>
                            <Progress value={n.gpuUtil} height={4} color={n.gpuUtil > 85 ? 'var(--danger)' : 'var(--primary)'} />
                          </div>
                          <div>
                            <div className="flex justify-between text-[10.5px]">
                              <span className="text-[var(--text-3)]">显存</span>
                              <span className="mono text-[var(--text-2)]">{n.memUtil}%</span>
                            </div>
                            <Progress value={n.memUtil} height={4} color="var(--purple)" />
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between border-t border-[var(--border)] pt-2 text-[10.5px]">
                          <span className="flex items-center gap-1" style={{ color: tempHigh ? 'var(--danger)' : 'var(--text-3)' }}>
                            <Thermometer size={10} /> {n.tempC}°C
                          </span>
                          <span className="text-[var(--text-3)]">今日 {n.doneToday} 个任务</span>
                          {n.currentTaskId ? (
                            <button onClick={() => navigate(`/repair/${n.currentTaskId}`)} className="text-[var(--primary)] hover:underline">
                              查看任务
                            </button>
                          ) : (
                            <span className="text-[var(--text-3)]">—</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-y border-[var(--border)] bg-[var(--bg-2)] text-[11px] text-[var(--text-3)]">
                    <th className="px-5 py-2 text-left font-normal">任务</th>
                    <th className="px-2 py-2 text-left font-normal">类型</th>
                    <th className="px-2 py-2 text-left font-normal">状态</th>
                    <th className="px-2 py-2 text-left font-normal">节点</th>
                    <th className="px-2 py-2 text-left font-normal">进度</th>
                    <th className="px-5 py-2 text-right font-normal">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {[...queued, ...running].map((t) => {
                    const meta = TASK_STATUS_META[t.status]
                    return (
                      <tr key={t.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-2)]">
                        <td className="px-5 py-2.5">
                          <div className="mono text-[11px] text-[var(--text-3)]">{t.code}</div>
                          <div className="max-w-[240px] truncate text-[12px] text-[var(--text-1)]">{t.assetName}</div>
                        </td>
                        <td className="px-2 py-2.5 text-[11.5px] text-[var(--text-2)]">检测</td>
                        <td className="px-2 py-2.5">
                          <Badge color={meta.color} bg={meta.bg} dot>
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="mono px-2 py-2.5 text-[11px] text-[var(--text-2)]">{t.nodeId}</td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2">
                            <Progress value={t.progress} height={4} className="w-[80px]" />
                            <span className="mono text-[10.5px] text-[var(--text-3)]">{t.progress}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/detection/${t.id}`)}>
                            详情
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                  {runningRepairs.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-2)]">
                      <td className="px-5 py-2.5">
                        <div className="mono text-[11px] text-[var(--text-3)]">{r.code}</div>
                        <div className="max-w-[240px] truncate text-[12px] text-[var(--text-1)]">{r.assetName}</div>
                      </td>
                      <td className="px-2 py-2.5 text-[11.5px] text-[var(--text-2)]">修复</td>
                      <td className="px-2 py-2.5">
                        <Badge color="var(--primary)" bg="var(--primary-10)" dot>
                          {r.status === 'running' ? '修复中' : '复检中'}
                        </Badge>
                      </td>
                      <td className="mono px-2 py-2.5 text-[11px] text-[var(--text-2)]">{r.nodeId}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          <Progress value={r.progress} height={4} className="w-[80px]" color="var(--purple)" />
                          <span className="mono text-[10.5px] text-[var(--text-3)]">{r.progress}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/repair/${r.id}`)}>
                          详情
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div className="col-span-4 space-y-3">
          <Card>
            <CardHeader title="负载曲线" desc="最近 12 小时 GPU 平均占用" right={<Activity size={14} className="text-[var(--text-3)]" />} />
            <div className="px-4 pb-4">
              <div className="flex h-[110px] items-end gap-1.5">
                {hourly.map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm"
                      style={{
                        height: `${(v / 100) * 92}px`,
                        background: v > 85 ? 'var(--danger)' : v > 65 ? 'var(--primary)' : 'var(--bg-3)',
                        opacity: v > 65 ? 0.85 : 1,
                      }}
                      title={`${v}%`}
                    />
                    <span className="mono text-[8.5px] text-[var(--text-3)]">{String(9 + i).padStart(2, '0')}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10.5px] text-[var(--text-3)]">
                <span>峰值 88%（14:00）</span>
                <span>均值 {Math.round(hourly.reduce((s, v) => s + v, 0) / hourly.length)}%</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="调度策略" desc="当前生效的规则" right={<Server size={14} className="text-[var(--text-3)]" />} />
            <div className="space-y-2 px-4 pb-4">
              {[
                { k: '优先级', v: 'urgent > high > normal', icon: <Gauge size={11} /> },
                { k: '亲和性', v: '同素材任务优先同节点', icon: <HardDrive size={11} /> },
                { k: '显存门槛', v: '4K 修复需 ≥ 40 GB', icon: <Zap size={11} /> },
                { k: '抢占', v: 'urgent 可抢占低优先级', icon: <Play size={11} /> },
                { k: '失败重试', v: '最多 2 次，换节点执行', icon: <Activity size={11} /> },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-2.5 py-1.5">
                  <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-3)]">
                    {r.icon} {r.k}
                  </span>
                  <span className="mono text-[10.5px] text-[var(--text-2)]">{r.v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="今日吞吐" desc="按任务类型" />
            <div className="px-4 pb-4">
              {[
                { label: '检测', value: tasks.filter((t) => t.status === 'done').length, color: 'var(--primary)' },
                { label: '修复', value: repairs.filter((r) => r.status === 'passed').length, color: 'var(--purple)' },
                { label: '复检', value: repairs.filter((r) => r.status === 'rechecking').length, color: 'var(--accent)' },
              ].map((r) => (
                <div key={r.label} className={cn('mb-2.5 last:mb-0')}>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--text-3)]">{r.label}</span>
                    <span className="mono text-[var(--text-2)]">{r.value} 个</span>
                  </div>
                  <Progress value={(r.value / 20) * 100} height={4} color={r.color} className="mt-1" />
                </div>
              ))}
              <div className="mt-2 text-[10.5px] text-[var(--text-3)]">
                总 GPU 时长 {duration(6 * 3600 + 42 * 60)} · 折合节省人工 {Math.round(stats.doneToday * 0.8)} 小时
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
