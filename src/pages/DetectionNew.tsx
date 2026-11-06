import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Cpu, FileVideo, Layers, ShieldCheck } from 'lucide-react'
import { Badge, Button, Card, Input, Label, Segmented, Select, Switch } from '../components/ui'
import { PageHeader, Thumb } from '../components/common'
import { db } from '../mock/db'
import { cn } from '../lib/cn'
import { duration, gb, lufs } from '../lib/format'
import { SEVERITY_META } from '../lib/constants'
import type { RuleSet, Severity } from '../types'

const STEPS = ['选择素材', '选择规则集', '执行配置']

export default function DetectionNew() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<string[]>(params.get('asset') ? [params.get('asset')!] : [])
  const [ruleSetId, setRuleSetId] = useState('rs1')
  const [priority, setPriority] = useState('normal')
  const [node, setNode] = useState('auto')
  const [shards, setShards] = useState('8')
  const [autoRecheck, setAutoRecheck] = useState(true)
  const [creating, setCreating] = useState(false)
  const [q, setQ] = useState('')

  const assets = useMemo(() => db.assets.filter((a) => !q || a.name.includes(q)), [q])
  const ruleSets = db.ruleSets
  const currentSet: RuleSet = ruleSets.find((r) => r.id === ruleSetId)!
  const setRules = db.rules.filter((r) => currentSet.ruleIds.includes(r.id))

  const selectedAssets = db.assets.filter((a) => selected.includes(a.id))
  const totalDuration = selectedAssets.reduce((s, a) => s + a.durationSec, 0)
  const estMinutes = Math.round((totalDuration / 60) * (ruleSetId === 'rs4' ? 0.18 : ruleSetId === 'rs3' ? 0.42 : 0.32))

  const create = () => {
    setCreating(true)
    window.setTimeout(() => navigate('/detection/dt3'), 900)
  }

  return (
    <div>
      <PageHeader
        crumbs={[{ label: '检测中心', to: '/detection' }, { label: '新建检测' }]}
        title="新建检测"
        desc="选择素材与规则集，系统会自动分轨并行检测并生成缺陷时间轴。"
        actions={<Button onClick={() => navigate('/detection')}>取消</Button>}
      />

      <div className="mb-4 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-6 items-center gap-2 rounded-full px-2.5 text-[12px]',
                i === step
                  ? 'bg-[var(--primary-10)] text-[var(--primary)]'
                  : i < step
                    ? 'text-[var(--success)]'
                    : 'text-[var(--text-3)]',
              )}
            >
              <span
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full border text-[10px]',
                  i === step ? 'border-[var(--primary)]' : i < step ? 'border-[var(--success)] bg-[var(--success)] text-[#04161c]' : 'border-[var(--current)] border-[var(--border-str)]',
                )}
              >
                {i < step ? <Check size={10} /> : i + 1}
              </span>
              {s}
            </div>
            {i < STEPS.length - 1 && <div className="h-px w-8 bg-[var(--border)]" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2 overflow-hidden">
          {step === 0 && (
            <div>
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索素材名称" className="h-8 w-[240px]" />
                <Select className="h-8 w-[200px]" defaultValue="all">
                  <option value="all">全部项目</option>
                  {db.projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
                <span className="ml-auto text-[11px] text-[var(--text-3)]">
                  已选 <span className="mono text-[var(--text-1)]">{selected.length}</span> 个
                </span>
              </div>
              <div className="max-h-[460px] overflow-y-auto">
                {assets.map((a) => {
                  const checked = selected.includes(a.id)
                  return (
                    <label
                      key={a.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 last:border-0',
                        checked ? 'bg-[var(--primary-10)]' : 'hover:bg-[var(--bg-2)]',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="accent-[var(--primary)]"
                        checked={checked}
                        onChange={() => setSelected((s) => (checked ? s.filter((x) => x !== a.id) : [...s, a.id]))}
                      />
                      <div className="w-14 shrink-0">
                        <Thumb seed={a.thumbSeed} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] text-[var(--text-1)]">{a.name}</div>
                        <div className="truncate text-[11px] text-[var(--text-3)]">
                          {a.projectName} · <span className="mono">{a.width}×{a.height} · {a.fps}{a.scan}</span>
                        </div>
                      </div>
                      <div className="mono shrink-0 text-right text-[11px] text-[var(--text-3)]">
                        <div>{duration(a.durationSec)}</div>
                        <div>{gb(a.sizeGB)}</div>
                      </div>
                      <div className="mono w-[86px] shrink-0 text-right text-[11px] text-[var(--text-3)]">{lufs(a.loudnessLufs)}</div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {ruleSets.map((rs) => {
                  const active = rs.id === ruleSetId
                  const rules = db.rules.filter((r) => rs.ruleIds.includes(r.id))
                  const fatal = rules.filter((r) => r.severity === 'fatal').length
                  return (
                    <button
                      key={rs.id}
                      onClick={() => setRuleSetId(rs.id)}
                      className={cn(
                        'rounded-xl border p-3 text-left transition-colors',
                        active ? 'border-[var(--primary)] bg-[var(--primary-10)]' : 'border-[var(--border)] bg-[var(--bg-2)] hover:border-[var(--border-str)]',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-[13px] text-[var(--text-1)]">
                          <ShieldCheck size={14} className={active ? 'text-[var(--primary)]' : 'text-[var(--text-3)]'} />
                          {rs.name}
                        </span>
                        {active && <Check size={14} className="text-[var(--primary)]" />}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-[var(--text-3)]">{rs.desc}</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--text-3)]">
                        <span className="mono">{rules.length} 条规则</span>
                        <span>·</span>
                        <span className="text-[var(--danger)]">致命 {fatal}</span>
                        <span>·</span>
                        <span>用过 {rs.usedCount} 次</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 rounded-lg border border-[var(--border)]">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
                  <span className="text-[12px] text-[var(--text-2)]">将启用的规则（{setRules.filter((r) => r.enabled).length} 条）</span>
                  <span className="text-[11px] text-[var(--text-3)]">阈值可在规则库中调整</span>
                </div>
                <div className="grid max-h-[240px] grid-cols-2 gap-x-4 overflow-y-auto p-3">
                  {setRules.map((r) => (
                    <div key={r.id} className="flex items-center justify-between border-b border-[var(--border)] py-1.5 last:border-0">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="mono shrink-0 text-[10px] text-[var(--text-3)]">{r.code}</span>
                        <span className="truncate text-[12px] text-[var(--text-2)]">{r.name}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="mono text-[10px] text-[var(--text-3)]">{r.threshold.op} {r.threshold.value}</span>
                        <span className="rounded px-1 text-[10px]" style={{ color: SEVERITY_META[r.severity].color, background: SEVERITY_META[r.severity].bg }}>
                          {SEVERITY_META[r.severity].label}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4 p-4">
              <div>
                <Label>优先级</Label>
                <Segmented
                  value={priority}
                  onChange={setPriority}
                  items={[
                    { key: 'normal', label: '普通' },
                    { key: 'high', label: '高' },
                    { key: 'urgent', label: '加急' },
                  ]}
                />
                <p className="mt-2 text-[11px] leading-4 text-[var(--text-3)]">加急任务会抢占队列，预计排队时间 &lt; 2 分钟。</p>
              </div>
              <div>
                <Label>执行节点</Label>
                <Select value={node} onChange={(e) => setNode(e.target.value)}>
                  <option value="auto">自动调度（推荐）</option>
                  {db.nodes.filter((n) => n.status !== 'offline').map((n) => (
                    <option key={n.id} value={n.id}>{n.name} · {n.gpuUtil}% 占用</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>并行分片</Label>
                <Select value={shards} onChange={(e) => setShards(e.target.value)}>
                  {['4', '8', '12', '16'].map((s) => (
                    <option key={s} value={s}>{s} 分片</option>
                  ))}
                </Select>
                <p className="mt-2 text-[11px] text-[var(--text-3)]">分片越多速度越快，但会占用更多显存。</p>
              </div>
              <div>
                <Label>修复后自动复检</Label>
                <div className="flex h-9 items-center gap-2">
                  <Switch checked={autoRecheck} onChange={setAutoRecheck} />
                  <span className="text-[12px] text-[var(--text-2)]">{autoRecheck ? '开启，修复完成即重跑本规则集' : '关闭，需手动发起复检'}</span>
                </div>
              </div>
              <div className="col-span-2 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[12px] text-[var(--text-2)]">
                  <Layers size={13} /> 本次任务的执行计划
                </div>
                <ol className="space-y-1.5 text-[12px] text-[var(--text-3)]">
                  <li>1. 探针解析 {selectedAssets.length} 个素材，校验容器与流结构</li>
                  <li>2. 按 {shards} 个分片并行执行 {setRules.filter((r) => r.enabled).length} 条规则</li>
                  <li>3. 缺陷去重、聚类，按严重度加权计算质检评分</li>
                  <li>4. {autoRecheck ? '生成修复方案建议，修复完成后自动复检' : '生成修复方案建议'}</li>
                </ol>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft size={14} /> 上一步
            </Button>
            {step < 2 ? (
              <Button variant="primary" disabled={selected.length === 0} onClick={() => setStep((s) => s + 1)}>
                下一步 <ChevronRight size={14} />
              </Button>
            ) : (
              <Button variant="primary" loading={creating} onClick={create}>
                {creating ? '正在创建任务…' : `创建检测任务（${selected.length}）`}
              </Button>
            )}
          </div>
        </Card>

        <div className="space-y-3">
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-1.5 text-[12px] text-[var(--text-2)]">
              <FileVideo size={13} /> 已选素材
            </div>
            {selectedAssets.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-[var(--text-3)]">尚未选择素材</div>
            ) : (
              <div className="space-y-2">
                {selectedAssets.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <div className="w-10 shrink-0">
                      <Thumb seed={a.thumbSeed} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] text-[var(--text-2)]">{a.name}</div>
                      <div className="mono text-[10px] text-[var(--text-3)]">{duration(a.durationSec)} · {gb(a.sizeGB)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-1.5 text-[12px] text-[var(--text-2)]">
              <Cpu size={13} /> 预估
            </div>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[var(--text-3)]">总时长</span>
                <span className="mono">{duration(totalDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-3)]">规则数</span>
                <span className="mono">{setRules.filter((r) => r.enabled).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-3)]">预计耗时</span>
                <span className="mono text-[var(--primary)]">{estMinutes} 分钟</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-3)]">算力消耗</span>
                <span className="mono">{(totalDuration / 3600 * 0.8).toFixed(1)} GPU·h</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-2">
                <span className="text-[var(--text-3)]">费用</span>
                <span className="mono">已含在套餐内</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-[12px] text-[var(--text-2)]">规范提示</div>
            <p className="mt-1.5 text-[11px] leading-5 text-[var(--text-3)]">
              当前规则集为「{currentSet.name}」。若目标平台为流媒体，请改选「流媒体上线」，其响度目标为 -14 LUFS ±1。
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(['fatal', 'severe', 'moderate', 'info'] as Severity[]).map((s) => (
                <Badge key={s} color={SEVERITY_META[s].color} bg={SEVERITY_META[s].bg}>
                  {SEVERITY_META[s].label} {setRules.filter((r) => r.severity === s).length}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
