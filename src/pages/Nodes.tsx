import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Cpu, HardDrive, RefreshCw, Server, Thermometer, Wrench } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Badge, Button, Modal, Panel } from '../components/ui'
import { Sparkline } from '../components/charts'
import { cn } from '../lib/utils'
import type { Node } from '../types'

const statusLabel: Record<Node['status'], string> = { idle: '空闲', busy: '忙碌', offline: '离线', maintenance: '维护' }
const statusTone: Record<Node['status'], 'success' | 'primary' | 'neutral' | 'warning'> = {
  idle: 'success',
  busy: 'primary',
  offline: 'neutral',
  maintenance: 'warning',
}

function Ring({ value, color }: { value: number; color: string }) {
  const r = 20
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-[52px] w-[52px]">
      <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#1c2230" strokeWidth="3.5" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="mono text-[11px] text-ink">{value}%</span>
      </div>
    </div>
  )
}

export default function Nodes() {
  const nodes = useDataStore((s) => s.nodes)
  const jobs = useDataStore((s) => s.jobs)
  const setNodeStatus = useDataStore((s) => s.setNodeStatus)
  const toast = useAppStore((s) => s.toast)
  const [confirm, setConfirm] = useState<{ node: Node; action: Node['status'] } | null>(null)

  const avg = Math.round(nodes.reduce((s, n) => s + n.utilization, 0) / nodes.length)
  const todayFrames = nodes.reduce((s, n) => s + n.todayFrames, 0)
  const queued = jobs.filter((j) => j.status === 'queued').length

  const color = (n: Node) =>
    n.status === 'maintenance' || n.status === 'offline' ? 'var(--text-dim)' : n.utilization > 85 ? 'var(--warning)' : 'var(--primary)'

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title="渲染节点"
        desc="GPU 集群的实时负载与任务分布。维护中的节点不参与调度。"
        actions={
          <Button
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => toast('info', '已刷新节点状态', '负载数据每 3 秒自动更新')}
          >
            刷新
          </Button>
        }
      />

      <Panel className="mb-4 flex flex-wrap items-center gap-x-10 gap-y-3 px-5 py-3.5">
        {[
          { icon: <Server className="h-3.5 w-3.5" />, label: '节点', value: `${nodes.length} 台` },
          { icon: <Cpu className="h-3.5 w-3.5" />, label: 'GPU', value: `${nodes.reduce((s, n) => s + n.gpuCount, 0)} 卡` },
          { icon: <HardDrive className="h-3.5 w-3.5" />, label: '平均利用率', value: `${avg}%` },
          { icon: <Thermometer className="h-3.5 w-3.5" />, label: '今日完成', value: `${todayFrames.toLocaleString('zh-CN')} 帧` },
          { icon: <Wrench className="h-3.5 w-3.5" />, label: '排队任务', value: `${queued} 个` },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-2">
            <span className="text-dim">{m.icon}</span>
            <span className="text-[11px] text-dim">{m.label}</span>
            <span className="mono text-[12px] text-ink">{m.value}</span>
          </div>
        ))}
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {nodes.map((n) => {
          const job = jobs.find((j) => j.id === n.currentJobId)
          return (
            <Panel key={n.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="mono text-[13px] text-ink">{n.hostname}</span>
                    <Badge tone={statusTone[n.status]} dot>
                      {statusLabel[n.status]}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[10.5px] text-dim">
                    {n.gpu} × {n.gpuCount} · {n.vramGB}GB
                  </div>
                </div>
                <Ring value={n.utilization} color={color(n)} />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-line-subtle bg-[#0e1118] p-2.5">
                <div>
                  <div className="text-[10px] text-dim">温度</div>
                  <div className={cn('mono mt-0.5 text-[12px]', n.temperatureC > 76 ? 'text-warning' : 'text-ink')}>{n.temperatureC}°C</div>
                </div>
                <div>
                  <div className="text-[10px] text-dim">显存</div>
                  <div className="mono mt-0.5 text-[12px] text-ink">{n.vramUsedPct}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-dim">帧率</div>
                  <div className="mono mt-0.5 text-[12px] text-ink">{n.throughputFps} fps</div>
                </div>
              </div>

              <div className="mt-2.5 flex items-end justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-dim">当前任务</div>
                  {job ? (
                    <Link to={`/jobs/${job.id}`} className="mt-0.5 block truncate text-[11px] text-primary hover:underline">
                      {job.name}
                    </Link>
                  ) : (
                    <div className="mt-0.5 text-[11px] text-dim">{n.status === 'maintenance' ? '维护中' : '空闲'}</div>
                  )}
                </div>
                <Sparkline values={n.sparkline} width={70} height={22} color={color(n)} />
              </div>

              <div className="mt-2.5 flex items-center justify-between border-t border-line-subtle pt-2.5">
                <span className="text-[10px] text-dim">已运行 {n.uptimeDays} 天 · 今日 {n.todayFrames.toLocaleString('zh-CN')} 帧</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirm({ node: n, action: n.status === 'maintenance' ? 'idle' : 'maintenance' })}
                >
                  {n.status === 'maintenance' ? '恢复调度' : '进入维护'}
                </Button>
              </div>
            </Panel>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10.5px] text-dim">
        <span>机房：上海 A 区 · 机柜 01-04</span>
        <span>驱动 550.54.14 · CUDA 12.4</span>
        <span>调度策略：短任务优先 + 峰值负载上限 95%</span>
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.action === 'maintenance' ? '进入维护模式' : '恢复调度'}
        desc={
          confirm?.action === 'maintenance'
            ? '节点将停止接受新任务，当前任务会在完成当前阶段后释放。'
            : '节点将重新加入调度池，可接受新任务。'
        }
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>取消</Button>
            <Button
              variant={confirm?.action === 'maintenance' ? 'danger' : 'primary'}
              onClick={() => {
                if (!confirm) return
                setNodeStatus(confirm.node.id, confirm.action)
                toast('success', confirm.action === 'maintenance' ? '节点已进入维护' : '节点已恢复调度', confirm.node.hostname)
                setConfirm(null)
              }}
            >
              确认
            </Button>
          </>
        }
      >
        {confirm && (
          <div className="space-y-1.5 text-[12px] text-muted">
            <div className="flex justify-between">
              <span className="text-dim">节点</span>
              <span className="mono">{confirm.node.hostname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dim">GPU</span>
              <span>
                {confirm.node.gpu} × {confirm.node.gpuCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dim">当前负载</span>
              <span className="mono">{confirm.node.utilization}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dim">运行任务</span>
              <span className="mono">{confirm.node.currentJobId ?? '无'}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
