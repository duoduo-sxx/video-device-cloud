import { useMemo, useState } from 'react'
import { AlertTriangle, Boxes, Cpu, Gauge, Search, Settings2, SlidersHorizontal, Zap } from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { Badge, Button, Card, CardHeader, Input, Label, Modal, Segmented, Select, Switch, Tabs } from '../components/ui'
import { EmptyState, PageHeader, SeverityTag, Skeleton } from '../components/common'
import { ALGORITHMS } from '../lib/algorithmCatalog'
import { CHANNEL_META, LOUDNESS_STANDARDS, SEVERITY_META, SEVERITY_ORDER } from '../lib/constants'
import { dateOnly } from '../lib/format'
import { cn } from '../lib/cn'
import type { Rule } from '../types'

export default function Rules() {
  const { data, loading } = useAsync(async () => ({ rules: await api.listRules(), sets: await api.listRuleSets() }), [])
  const [tab, setTab] = useState('rules')
  const [rules, setRules] = useState<Rule[] | null>(null)
  const [keyword, setKeyword] = useState('')
  const [channel, setChannel] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [editing, setEditing] = useState<Rule | null>(null)
  const [draftValue, setDraftValue] = useState(0)
  const [algCat, setAlgCat] = useState('all')

  const list = rules ?? data?.rules ?? []
  const sets = data?.sets ?? []

  const filtered = useMemo(
    () =>
      list.filter((r) => {
        if (channel !== 'all' && r.channel !== channel) return false
        if (severity !== 'all' && r.severity !== severity) return false
        if (keyword) return r.name.includes(keyword) || r.code.toLowerCase().includes(keyword.toLowerCase())
        return true
      }),
    [list, channel, severity, keyword],
  )

  const cats = useMemo(() => Array.from(new Set(ALGORITHMS.map((a) => a.category))), [])
  const algorithms = algCat === 'all' ? ALGORITHMS : ALGORITHMS.filter((a) => a.category === algCat)

  async function toggle(rule: Rule, enabled: boolean) {
    setRules(list.map((r) => (r.id === rule.id ? { ...r, enabled, updatedAt: new Date().toISOString() } : r)))
    await api.toggleRule(rule.id, enabled)
  }

  async function saveThreshold() {
    if (!editing) return
    const updated = await api.updateRuleThreshold(editing.id, draftValue)
    if (updated) setRules(list.map((r) => (r.id === editing.id ? { ...r, threshold: { ...r.threshold, value: draftValue } } : r)))
    setEditing(null)
  }

  const enabledCount = list.filter((r) => r.enabled).length
  const hitTotal = list.reduce((s, r) => s + r.hitCount, 0)

  return (
    <div>
      <PageHeader
        title="规则与算法"
        desc="规则决定「判什么不合格」，算法决定「怎么修」。两者解耦，规则可随规范升级独立发布。"
        actions={
          <>
            <Button>
              <Boxes size={14} /> 导入规则包
            </Button>
            <Button variant="primary">
              <SlidersHorizontal size={14} /> 新建规则
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        {[
          { label: '规则总数', value: String(list.length), hint: `启用 ${enabledCount} 条`, icon: <SlidersHorizontal size={14} /> },
          { label: '规则集', value: String(sets.length), hint: '按场景组合', icon: <Boxes size={14} /> },
          { label: '算法能力', value: String(ALGORITHMS.length), hint: `覆盖 ${cats.length} 类缺陷`, icon: <Cpu size={14} /> },
          { label: '近 30 天命中', value: String(hitTotal), hint: '按规则累计', icon: <Gauge size={14} /> },
        ].map((k) => (
          <Card key={k.label} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-2)] text-[var(--text-2)]">{k.icon}</span>
            <div>
              <div className="text-[11px] text-[var(--text-3)]">{k.label}</div>
              <div className="flex items-baseline gap-1.5">
                <span className="mono text-[18px] font-medium text-[var(--text-1)]">{k.value}</span>
                <span className="text-[10.5px] text-[var(--text-3)]">{k.hint}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="px-5 pt-3">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { key: 'rules', label: '规则库', count: list.length },
              { key: 'sets', label: '规则集', count: sets.length },
              { key: 'algorithms', label: '算法库', count: ALGORITHMS.length },
              { key: 'loudness', label: '响度标准' },
            ]}
          />
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-8" />
            <Skeleton className="h-40" />
          </div>
        ) : tab === 'rules' ? (
          <>
            <div className="flex items-center gap-2 px-5 py-3">
              <div className="relative w-[280px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
                <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索规则名称或编码" className="pl-8" />
              </div>
              <div className="w-[130px]">
                <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
                  <option value="all">全部通道</option>
                  {Object.entries(CHANNEL_META).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-[130px]">
                <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  <option value="all">全部等级</option>
                  {SEVERITY_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {SEVERITY_META[s].label}
                    </option>
                  ))}
                </Select>
              </div>
              <span className="ml-auto text-[11px] text-[var(--text-3)]">
                共 {filtered.length} 条 · 启用 {filtered.filter((r) => r.enabled).length} 条
              </span>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-y border-[var(--border)] bg-[var(--bg-2)] text-[11px] text-[var(--text-3)]">
                  <th className="px-5 py-2 text-left font-normal">规则</th>
                  <th className="px-2 py-2 text-left font-normal">通道</th>
                  <th className="px-2 py-2 text-left font-normal">等级</th>
                  <th className="px-2 py-2 text-left font-normal">判定条件</th>
                  <th className="px-2 py-2 text-right font-normal">命中</th>
                  <th className="px-2 py-2 text-left font-normal">版本</th>
                  <th className="px-5 py-2 text-right font-normal">启用</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="group border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-2)]">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="mono rounded bg-[var(--bg-3)] px-1 text-[10px] text-[var(--text-3)]">{r.code}</span>
                        <span className="text-[12px] text-[var(--text-1)]">{r.name}</span>
                      </div>
                      <div className="mt-0.5 max-w-[420px] truncate text-[11px] text-[var(--text-3)]">{r.description}</div>
                    </td>
                    <td className="px-2 py-2.5 text-[12px]" style={{ color: CHANNEL_META[r.channel].color }}>
                      {CHANNEL_META[r.channel].label}
                    </td>
                    <td className="px-2 py-2.5">
                      <SeverityTag severity={r.severity} />
                    </td>
                    <td className="px-2 py-2.5">
                      <button
                        onClick={() => {
                          setEditing(r)
                          setDraftValue(r.threshold.value)
                        }}
                        className="mono flex items-center gap-1 rounded border border-transparent px-1.5 py-0.5 text-[11.5px] text-[var(--text-2)] hover:border-[var(--border)] hover:bg-[var(--bg-3)]"
                      >
                        {r.threshold.op} {r.threshold.value} {r.threshold.unit}
                        <Settings2 size={10} className="opacity-0 transition-opacity group-hover:opacity-60" />
                      </button>
                    </td>
                    <td className="mono px-2 py-2.5 text-right text-[11.5px] text-[var(--text-2)]">{r.hitCount}</td>
                    <td className="px-2 py-2.5">
                      <div className="mono text-[11px] text-[var(--text-3)]">{r.version}</div>
                      <div className="text-[10px] text-[var(--text-3)]">{dateOnly(r.updatedAt)}</div>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <Switch checked={r.enabled} onChange={(v) => toggle(r, v)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : tab === 'sets' ? (
          <div className="grid grid-cols-2 gap-3 p-4">
            {sets.map((s) => (
              <div key={s.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-3.5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-[var(--text-1)]">{s.name}</div>
                    <div className="mt-0.5 text-[11px] text-[var(--text-3)]">{s.desc}</div>
                  </div>
                  <Badge color="var(--primary)" bg="var(--primary-10)">
                    {s.ruleIds.length} 条规则
                  </Badge>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {s.ruleIds.slice(0, 6).map((rid) => {
                    const rule = list.find((r) => r.id === rid)
                    return (
                      <span key={rid} className="mono rounded bg-[var(--bg-3)] px-1.5 py-0.5 text-[10px] text-[var(--text-2)]">
                        {rule?.code ?? rid}
                      </span>
                    )
                  })}
                  {s.ruleIds.length > 6 && (
                    <span className="rounded px-1 text-[10px] text-[var(--text-3)]">+{s.ruleIds.length - 6}</span>
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-[var(--border)] pt-2 text-[11px] text-[var(--text-3)]">
                  <span>适用场景：{s.scene}</span>
                  <span className="mono">已用于 {s.usedCount} 个任务</span>
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'algorithms' ? (
          <>
            <div className="flex items-center gap-2 px-5 py-3">
              <div className="flex flex-wrap gap-1.5">
                {['all', ...cats].map((c) => (
                  <button
                    key={c}
                    onClick={() => setAlgCat(c)}
                    className={cn(
                      'rounded-md border px-2 py-1 text-[11px] transition-colors',
                      algCat === c
                        ? 'border-[var(--primary)] bg-[var(--primary-10)] text-[var(--primary)]'
                        : 'border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text-2)]',
                    )}
                  >
                    {c === 'all' ? '全部' : c}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-[11px] text-[var(--text-3)]">{algorithms.length} 个算法</span>
            </div>
            <div className="grid grid-cols-3 gap-3 px-4 pb-4">
              {algorithms.map((a) => (
                <div key={a.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[12.5px] font-medium text-[var(--text-1)]">{a.name}</div>
                      <div className="mono text-[10px] text-[var(--text-3)]">
                        {a.vendor} · {a.version}
                      </div>
                    </div>
                    {a.gpu && (
                      <Badge color="var(--purple)" bg="rgba(167,139,250,.12)">
                        <Zap size={9} /> GPU
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-[var(--text-3)]">{a.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {a.targets.slice(0, 3).map((t) => (
                      <span key={t} className="mono rounded bg-[var(--bg-3)] px-1.5 py-0.5 text-[10px] text-[var(--text-2)]">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-1.5 border-t border-[var(--border)] pt-2 text-[10px]">
                    <div>
                      <div className="text-[var(--text-3)]">速度</div>
                      <div className="mono text-[var(--text-2)]">{a.speed}× 实时</div>
                    </div>
                    <div>
                      <div className="text-[var(--text-3)]">风险</div>
                      <div
                        className="mono"
                        style={{ color: a.risk === 'low' ? 'var(--success)' : a.risk === 'mid' ? 'var(--accent)' : 'var(--danger)' }}
                      >
                        {a.risk === 'low' ? '低' : a.risk === 'mid' ? '中' : '高'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--text-3)]">参数</div>
                      <div className="mono text-[var(--text-2)]">{a.params.length} 项</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-2)] text-[11px] text-[var(--text-3)]">
                  <th className="px-3 py-2 text-left font-normal">适用场景</th>
                  <th className="px-3 py-2 text-left font-normal">目标响度</th>
                  <th className="px-3 py-2 text-left font-normal">容差</th>
                  <th className="px-3 py-2 text-left font-normal">真峰值上限</th>
                  <th className="px-3 py-2 text-left font-normal">声道</th>
                  <th className="px-3 py-2 text-left font-normal">依据</th>
                </tr>
              </thead>
              <tbody>
                {LOUDNESS_STANDARDS.map((l) => (
                  <tr key={l.scene} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-3 py-2.5 text-[12px] text-[var(--text-1)]">{l.scene}</td>
                    <td className="mono px-3 py-2.5 text-[12px] text-[var(--primary)]">{l.target} LKFS</td>
                    <td className="mono px-3 py-2.5 text-[11.5px] text-[var(--text-2)]">± {l.tolerance} LU</td>
                    <td className="mono px-3 py-2.5 text-[11.5px] text-[var(--text-2)]">{l.peak} dBTP</td>
                    <td className="px-3 py-2.5 text-[11.5px] text-[var(--text-2)]">{l.channels}</td>
                    <td className="px-3 py-2.5 text-[11px] text-[var(--text-3)]">{l.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-[11px] leading-5 text-[var(--text-3)]">
              <AlertTriangle size={13} className="mt-0.5 shrink-0 text-[var(--accent)]" />
              响度以 ITU-R BS.1770 积分测量为准，测量窗口覆盖全片；短时响度超限超过 3 秒亦计为缺陷。
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`调整阈值 · ${editing?.name ?? ''}`}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>取消</Button>
            <Button variant="primary" onClick={saveThreshold}>
              保存并发布
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-3 text-[11.5px] leading-6 text-[var(--text-2)]">
              {editing.description}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>判定符</Label>
                <Input value={editing.threshold.op} readOnly className="mono" />
              </div>
              <div>
                <Label>阈值（{editing.threshold.unit}）</Label>
                <Input type="number" value={draftValue} onChange={(e) => setDraftValue(Number(e.target.value))} className="mono" />
              </div>
            </div>
            <div className="rounded-lg border border-[rgba(251,191,36,.28)] bg-[rgba(251,191,36,.06)] px-3 py-2 text-[11px] leading-5 text-[var(--text-2)]">
              修改后对新任务立即生效，历史任务的判定结果不回溯。当前版本 {editing.version} → 将发布为 {editing.version.replace(/(\d+)$/, (m) => String(Number(m) + 1))}
            </div>
            <div>
              <div className="mb-1.5 text-[11px] text-[var(--text-3)]">同通道受影响规则（联动检查）</div>
              <div className="space-y-1">
                {list
                  .filter((r) => r.channel === editing.channel && r.enabled && r.id !== editing.id)
                  .slice(0, 4)
                  .map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded border border-[var(--border)] px-2 py-1 text-[11px]">
                      <span className="text-[var(--text-2)]">{r.name}</span>
                      <span className="mono text-[var(--text-3)]">
                        {r.threshold.op} {r.threshold.value} {r.threshold.unit}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="mt-2 text-[10.5px] text-[var(--text-3)]">新阈值 {draftValue} {editing.threshold.unit} — 与同通道规则不冲突时可直接发布。</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
