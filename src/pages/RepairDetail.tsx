import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  Columns2,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { Badge, Button, Card, CardHeader, Progress, Segmented, Select, Switch, Tabs } from '../components/ui'
import { EmptyState, PageHeader, Skeleton, StatusPill } from '../components/common'
import { REPAIR_STATUS_META, SEVERITY_META } from '../lib/constants'
import { ALGORITHM_MAP, ALGORITHMS } from '../lib/algorithmCatalog'
import { duration, minutesToHms, timecode } from '../lib/format'
import { MEMBER_MAP } from '../mock/build'
import { cn } from '../lib/cn'
import type { PlanStep } from '../types'

const RISK_META = {
  low: { label: '低风险', color: '#34D399' },
  mid: { label: '中风险', color: '#FBBF24' },
  high: { label: '高风险', color: '#F87171' },
}

export default function RepairDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading } = useAsync(async () => {
    const repair = await api.getRepair(id!)
    const plan = await api.getPlanByRepair(id!)
    const defects = await api.taskDefects(repair!.detectionTaskId)
    return { repair, plan, defects }
  }, [id])

  const [tab, setTab] = useState('plan')
  const [steps, setSteps] = useState<PlanStep[] | null>(null)
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)

  const plan = data?.plan
  const repair = data?.repair
  const defects = data?.defects ?? []

  const currentSteps = steps ?? plan?.steps ?? []
  const stepMap = useMemo(() => new Map(currentSteps.map((s) => [s.id, s])), [currentSteps])
  const currentStatus = status ?? repair?.status ?? 'draft'
  const currentProgress = progress ?? repair?.progress ?? 0
  const meta = REPAIR_STATUS_META[currentStatus] ?? REPAIR_STATUS_META.draft

  const grouped = useMemo(() => {
    const map = new Map<string, typeof defects>()
    defects.forEach((d) => {
      if (!map.has(d.code)) map.set(d.code, [])
      map.get(d.code)!.push(d)
    })
    return Array.from(map.entries())
  }, [defects])

  const enabledSteps = currentSteps.filter((s) => s.enabled)
  const estMinutes = Math.round(enabledSteps.reduce((s, st) => s + st.estMinutes, 0))
  const maxRisk = enabledSteps.some((s) => s.risk === 'high') ? 'high' : enabledSteps.some((s) => s.risk === 'mid') ? 'mid' : 'low'

  const updateStep = (stepId: string, patch: Partial<PlanStep>) => {
    setSteps((prev) => (prev ?? plan?.steps ?? []).map((s) => (s.id === stepId ? { ...s, ...patch } : s)))
  }

  const move = (index: number, dir: -1 | 1) => {
    const arr = [...currentSteps]
    const target = index + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    setSteps(arr.map((s, i) => ({ ...s, order: i + 1 })))
  }

  const remove = (stepId: string) => {
    setSteps(currentSteps.filter((s) => s.id !== stepId).map((s, i) => ({ ...s, order: i + 1 })))
    if (activeStep === stepId) setActiveStep(null)
  }

  const addStep = (algorithmId: string) => {
    const alg = ALGORITHM_MAP[algorithmId]
    if (!alg) return
    const newStep: PlanStep = {
      id: `ps-new-${Date.now()}`,
      algorithmId: alg.id,
      algorithmName: alg.name,
      targetDefectIds: [],
      order: currentSteps.length + 1,
      enabled: true,
      params: Object.fromEntries(alg.params.map((p) => [p.key, p.default])),
      estMinutes: Math.max(2, Math.round((repair?.defectTotal ?? 10) * 0.6)),
      risk: alg.risk,
    }
    setSteps([...currentSteps, newStep])
    setActiveStep(newStep.id)
  }

  const run = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    setPlaying(true)
    setStatus('running')
    const timer = window.setInterval(() => {
      setProgress((p) => {
        const base = p ?? 0
        const next = Math.min(100, base + 6)
        if (next >= 100) {
          window.clearInterval(timer)
          setPlaying(false)
          setStatus('review')
          return 100
        }
        return next
      })
    }, 420)
  }

  if (loading || !repair || !plan) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
        </div>
      </div>
    )
  }

  const active = activeStep ? stepMap.get(activeStep) : undefined

  return (
    <div>
      <PageHeader
        crumbs={[{ label: '修复中心', to: '/repair' }, { label: repair.code }]}
        title={repair.assetName}
        meta={<StatusPill label={meta.label} color={meta.color} bg={meta.bg} />}
        desc={
          <span className="flex flex-wrap items-center gap-2">
            <span className="mono">{repair.code}</span>
            <span>·</span>
            <span>{repair.version}</span>
            <span>·</span>
            <span>检测任务 <Link to={`/detection/${repair.detectionTaskId}`} className="text-[var(--primary)]">{repair.detectionTaskId.toUpperCase()}</Link></span>
            <span>·</span>
            <span>{MEMBER_MAP[repair.operatorId]?.name}</span>
            <span>·</span>
            <span className="mono">{duration(repair.defectTotal * 0 + 62)} 预估</span>
          </span>
        }
        actions={
          <>
            <Button onClick={() => navigate('/repair')}>返回列表</Button>
            <Button onClick={() => navigate(`/review/${repair.id}`)}>
              <Columns2 size={14} /> 对比验收
            </Button>
            <Button variant="primary" onClick={run}>
              {playing ? <><Pause size={14} /> 暂停</> : <><Play size={14} /> {currentStatus === 'review' ? '重新执行' : '执行修复'}</>}
            </Button>
          </>
        }
      />

      <div className="mb-3 flex items-center justify-between">
        <Tabs
          items={[
            { key: 'plan', label: '方案编排' },
            { key: 'monitor', label: '执行监控' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--text-3)]">方案模板</span>
          <Select className="h-8 w-[120px]" defaultValue={plan.template === '保守' ? 'cons' : plan.template === '激进' ? 'agg' : 'std'}>
            <option value="cons">保守</option>
            <option value="std">标准</option>
            <option value="agg">激进</option>
          </Select>
        </div>
      </div>

      {tab === 'plan' ? (
        <>
          {plan.conflicts.length > 0 && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-[rgba(251,191,36,.35)] bg-[rgba(251,191,36,.08)] px-3 py-2">
              <AlertTriangle size={14} className="mt-0.5 text-[var(--accent)]" />
              <div className="text-[12px] leading-5 text-[var(--accent)]">
                <span className="font-medium">冲突检测：</span>
                {plan.conflicts.join('；')}
              </div>
            </div>
          )}

          <div className="grid grid-cols-12 gap-3">
            <Card className="col-span-3 overflow-hidden">
              <CardHeader title="待修复缺陷" desc={`${defects.length} 条 · 按类型分组`} />
              <div className="max-h-[540px] overflow-y-auto px-3 pb-3">
                {grouped.map(([code, list]) => (
                  <div key={code} className="mb-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-2)]">
                    <div className="flex items-center justify-between px-2.5 py-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-sm" style={{ background: SEVERITY_META[list[0].severity].color }} />
                        <span className="text-[12px] text-[var(--text-1)]">{list[0].name}</span>
                        <span className="mono text-[10px] text-[var(--text-3)]">{code}</span>
                      </span>
                      <span className="mono text-[11px] text-[var(--text-2)]">{list.length}</span>
                    </div>
                    <div className="border-t border-[var(--border)] px-2.5 py-1">
                      {list.slice(0, 3).map((d) => (
                        <div key={d.id} className="flex items-center justify-between py-0.5">
                          <span className="mono text-[10px] text-[var(--text-3)]">{timecode(d.startSec)}</span>
                          <span className="mono text-[10px] text-[var(--text-3)]">{d.metricValue} {d.unit}</span>
                        </div>
                      ))}
                      {list.length > 3 && <div className="py-0.5 text-[10px] text-[var(--text-3)]">还有 {list.length - 3} 条…</div>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="col-span-6 space-y-2">
              {currentSteps.map((s, i) => {
                const alg = ALGORITHM_MAP[s.algorithmId]
                const risk = RISK_META[s.risk]
                return (
                  <div
                    key={s.id}
                    onClick={() => setActiveStep(s.id)}
                    className={cn(
                      'cursor-pointer rounded-xl border bg-[var(--bg-1)] p-3 transition-colors',
                      activeStep === s.id ? 'border-[var(--primary)]' : 'border-[var(--border)] hover:border-[var(--border-str)]',
                      !s.enabled && 'opacity-50',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="mono flex h-5 w-5 items-center justify-center rounded bg-[var(--bg-3)] text-[10px] text-[var(--text-3)]">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] text-[var(--text-1)]">{s.algorithmName}</span>
                          <span className="mono text-[10px] text-[var(--text-3)]">{s.algorithmId}</span>
                          <Badge color={risk.color} bg="transparent">{risk.label}</Badge>
                        </div>
                        <div className="mt-0.5 text-[11px] text-[var(--text-3)]">
                          处理 {s.targetDefectIds.length} 条缺陷 · 预计 {s.estMinutes} 分钟 · {alg?.vendor}
                        </div>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => move(i, -1)} className="rounded p-1 text-[var(--text-3)] hover:bg-[var(--bg-3)] hover:text-[var(--text-1)]">
                          <ArrowUp size={12} />
                        </button>
                        <button onClick={() => move(i, 1)} className="rounded p-1 text-[var(--text-3)] hover:bg-[var(--bg-3)] hover:text-[var(--text-1)]">
                          <ArrowDown size={12} />
                        </button>
                        <button onClick={() => remove(s.id)} className="rounded p-1 text-[var(--text-3)] hover:bg-[rgba(248,113,113,.15)] hover:text-[var(--danger)]">
                          <Trash2 size={12} />
                        </button>
                        <Switch checked={s.enabled} onChange={(v) => updateStep(s.id, { enabled: v })} />
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(s.params).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="mono rounded bg-[var(--bg-2)] px-1.5 py-0.5 text-[10px] text-[var(--text-3)]">
                          {k}={String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}

              <div className="rounded-xl border border-dashed border-[var(--border-str)] p-3">
                <div className="mb-2 text-[11px] text-[var(--text-3)]">插入算法步骤</div>
                <div className="flex flex-wrap gap-1.5">
                  {ALGORITHMS.slice(0, 8).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => addStep(a.id)}
                      className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-2)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    >
                      + {a.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-3 space-y-3">
              <Card>
                <CardHeader title="参数" desc={active ? active.algorithmName : '选择一个算法步骤'} />
                <div className="px-4 pb-4">
                  {!active && <div className="py-8 text-center text-[12px] text-[var(--text-3)]">点击左侧算法卡片调整参数</div>}
                  {active && (
                    <div className="space-y-3">
                      {(ALGORITHM_MAP[active.algorithmId]?.params ?? []).map((p) => (
                        <div key={p.key}>
                          <div className="mb-1 flex items-center justify-between text-[11px]">
                            <span className="text-[var(--text-2)]">{p.label}</span>
                            <span className="mono text-[var(--text-3)]">{String(active.params[p.key])}{p.unit ?? ''}</span>
                          </div>
                          {p.type === 'range' && (
                            <input
                              type="range"
                              min={p.min}
                              max={p.max}
                              step={p.step}
                              value={Number(active.params[p.key])}
                              onChange={(e) => updateStep(active.id, { params: { ...active.params, [p.key]: Number(e.target.value) } })}
                              className="w-full accent-[var(--primary)]"
                            />
                          )}
                          {p.type === 'select' && (
                            <Select
                              value={String(active.params[p.key])}
                              onChange={(e) => updateStep(active.id, { params: { ...active.params, [p.key]: e.target.value } })}
                              className="h-8"
                            >
                              {p.options?.map((o) => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </Select>
                          )}
                          {p.type === 'switch' && (
                            <Switch
                              checked={Boolean(active.params[p.key])}
                              onChange={(v) => updateStep(active.id, { params: { ...active.params, [p.key]: v } })}
                            />
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const alg = ALGORITHM_MAP[active.algorithmId]
                          if (!alg) return
                          updateStep(active.id, { params: Object.fromEntries(alg.params.map((p) => [p.key, p.default])) })
                        }}
                        className="flex items-center gap-1 text-[11px] text-[var(--text-3)] hover:text-[var(--text-1)]"
                      >
                        <RotateCcw size={11} /> 恢复默认
                      </button>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader title="影响预估" />
                <div className="space-y-2 px-4 pb-4 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-3)]">算法步骤</span>
                    <span className="mono">{enabledSteps.length} 个</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-3)]">预计耗时</span>
                    <span className="mono text-[var(--primary)]">{minutesToHms(estMinutes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-3)]">算力占用</span>
                    <span className="mono">{(estMinutes / 60 * 2.4).toFixed(1)} GPU·h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-3)]">画质风险</span>
                    <span style={{ color: RISK_META[maxRisk].color }}>{RISK_META[maxRisk].label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-3)]">体积变化</span>
                    <span className="mono">+{(enabledSteps.length * 1.4).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--border)] pt-2">
                    <span className="text-[var(--text-3)]">预估费用</span>
                    <span className="mono">¥{Math.round(estMinutes * 1.6).toLocaleString()}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-start gap-2">
                  <Sparkles size={13} className="mt-0.5 text-[var(--purple)]" />
                  <p className="text-[11px] leading-5 text-[var(--text-3)]">
                    建议先执行降噪与陷波，再做响度归一化，最后限幅。顺序颠倒会导致二次失真。
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-12 gap-3">
          <Card className="col-span-8 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] text-[var(--text-1)]">执行进度</div>
                <div className="mt-0.5 text-[11px] text-[var(--text-3)]">
                  节点 {repair.nodeId.toUpperCase()} · 8 分片并行 · 2.4x 实时
                </div>
              </div>
              <StatusPill label={meta.label} color={meta.color} bg={meta.bg} />
            </div>
            <div className="mt-4 flex items-center gap-5">
              <div className="relative flex h-[104px] w-[104px] items-center justify-center">
                <svg width="104" height="104" className="-rotate-90">
                  <circle cx="52" cy="52" r="46" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="7" />
                  <circle
                    cx="52"
                    cy="52"
                    r="46"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - currentProgress / 100)}
                    style={{ transition: 'stroke-dashoffset .4s linear' }}
                  />
                </svg>
                <span className="mono absolute text-[20px]">{currentProgress}%</span>
              </div>
              <div className="grid flex-1 grid-cols-4 gap-2">
                {repair.segments.map((s) => {
                  const segProgress = Math.max(0, Math.min(100, currentProgress * 8 - s.index * 100))
                  const done = segProgress >= 100
                  return (
                    <div
                      key={s.index}
                      className="rounded-md border px-2 py-1.5"
                      style={{
                        borderColor: done ? 'rgba(52,211,153,.4)' : segProgress > 0 ? 'rgba(34,211,238,.4)' : 'var(--border)',
                        background: done ? 'rgba(52,211,153,.08)' : segProgress > 0 ? 'rgba(34,211,238,.08)' : 'var(--bg-2)',
                      }}
                    >
                      <div className="mono flex items-center justify-between text-[10px] text-[var(--text-3)]">
                        <span>#{s.index + 1}</span>
                        {done ? <CheckCircle2 size={10} className="text-[var(--success)]" /> : <span>{Math.round(segProgress)}%</span>}
                      </div>
                      <Progress value={segProgress} height={3} className="mt-1.5" color={done ? 'var(--success)' : 'var(--primary)'} />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-3">
              {[
                { label: '已用时', value: '00:18:42' },
                { label: '剩余', value: minutesToHms(Math.max(0, estMinutes - 18)) },
                { label: '处理速度', value: '2.4x' },
                { label: 'GPU 占用', value: '87%' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2">
                  <div className="text-[10px] text-[var(--text-3)]">{s.label}</div>
                  <div className="mono mt-0.5 text-[14px]">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-3)]">执行日志</span>
                <span className="mono text-[10px] text-[var(--text-3)]">auto-scroll</span>
              </div>
              <div className="h-[180px] overflow-y-auto rounded-lg border border-[var(--border)] bg-[#080c12] p-2.5 font-mono text-[11px] leading-5">
                {[
                  ['09:42:11', 'info', '加载方案 rp1，共 6 个算法步骤'],
                  ['09:42:12', 'info', '分配节点 GPU-01，分片数 8'],
                  ['09:42:31', 'info', 'shard-01 开始：光流插帧 → 12 条冻帧目标'],
                  ['09:43:02', 'info', 'shard-02 完成 34%'],
                  ['09:44:18', 'warn', 'shard-05 检测到场景切换，已强制断点避免拖影'],
                  ['09:45:40', 'info', 'shard-03 完成，耗时 3m12s'],
                  ['09:47:05', 'info', '响度归一化：-18.4 → -24.1 LKFS'],
                  ['09:48:22', 'info', `复检即将开始，残留缺陷预计 ${Math.max(0, 3 - Math.floor(currentProgress / 40))} 条`],
                ].map(([t, level, msg], i) => (
                  <div key={i} className="flex gap-2">
                    <span className="shrink-0 text-[var(--text-3)]">{t}</span>
                    <span className="w-9 shrink-0" style={{ color: level === 'warn' ? 'var(--accent)' : 'var(--text-3)' }}>{level}</span>
                    <span className="text-[var(--text-2)]">{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="col-span-4 space-y-3">
            <Card>
              <CardHeader title="修复统计" />
              <div className="grid grid-cols-3 gap-2 px-4 pb-4">
                {[
                  { label: '原始缺陷', value: repair.defectTotal, color: 'var(--text-1)' },
                  { label: '已修复', value: Math.round((repair.defectTotal * currentProgress) / 100), color: 'var(--success)' },
                  { label: '残留', value: repair.defectResidual, color: 'var(--danger)' },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-2 py-2 text-center">
                    <div className="text-[10px] text-[var(--text-3)]">{s.label}</div>
                    <div className="mono mt-1 text-[16px]" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="输出交付物" desc="执行完成后生成" />
              <div className="space-y-2 px-4 pb-4">
                {(repair.outputs.length ? repair.outputs : [{ format: '待生成', sizeGB: 0, bitrateMbps: 0 }]).map((o, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-2.5 py-2">
                    <div>
                      <div className="text-[12px] text-[var(--text-2)]">{o.format}</div>
                      <div className="mono text-[10px] text-[var(--text-3)]">{o.sizeGB ? `${o.sizeGB} GB · ${o.bitrateMbps} Mbps` : '尚未生成'}</div>
                    </div>
                    <ChevronRight size={13} className="text-[var(--text-3)]" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-[12px] text-[var(--text-2)]">
                <Gauge size={13} /> 下一步
              </div>
              <p className="mt-1.5 text-[11px] leading-5 text-[var(--text-3)]">
                修复完成后系统会自动重跑同一规则集复检。通过后进入对比验收，可逐条确认修复效果。
              </p>
              <Button className="mt-2 w-full" onClick={() => navigate(`/review/${repair.id}`)}>
                <Columns2 size={13} /> 进入对比验收
              </Button>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-[12px] text-[var(--text-2)]">
                <Zap size={13} className="text-[var(--accent)]" /> 复检口径
              </div>
              <ul className="mt-1.5 space-y-1 text-[11px] leading-5 text-[var(--text-3)]">
                <li>· 致命 / 严重残留必须为 0</li>
                <li>· 一般残留 ≤ 原数量 10%</li>
                <li>· 响度落在目标 ±1 LKFS</li>
                <li>· VMAF ≥ 原片 -1.5</li>
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
