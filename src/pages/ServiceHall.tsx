import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarClock, CheckCircle2, ClipboardList, FileSignature, Headphones, Minus, Plus, ShieldCheck, Sparkles, Wrench } from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { Badge, Button, Card, CardHeader, Divider, Input, Label, Modal, Select, Tabs } from '../components/ui'
import { PageHeader, Skeleton, Thumb } from '../components/common'
import { DIFFICULTY_OPTIONS, EXTRAS, URGENCY_OPTIONS, buildQuote, formatCny } from '../lib/pricing'
import { db } from '../mock/db'
import { MEMBERS } from '../mock/seed'
import { cn } from '../lib/cn'
import type { ServicePackage } from '../types'

const FLOW = ['需求提交', '评估报价', '签约确认', '素材接收', '排期处理', '内审质检', '交付验收', '结算归档']

export default function ServiceHall() {
  const navigate = useNavigate()
  const { data, loading } = useAsync(async () => ({ packages: db.packages, cases: await api.listCases(), orders: await api.listOrders() }), [])
  const packages = data?.packages ?? []
  const cases = data?.cases ?? []
  const orders = data?.orders ?? []

  const [pkgId, setPkgId] = useState('pk2')
  const [minutes, setMinutes] = useState(52)
  const [difficulty, setDifficulty] = useState(1)
  const [urgency, setUrgency] = useState(1)
  const [extras, setExtras] = useState<string[]>(['multiversion'])
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ customer: '云溪广播电视台', contact: '唐棠', title: '', engineer: 'm3' })
  const [tab, setTab] = useState('packages')

  const pkg = packages.find((p) => p.id === pkgId) as ServicePackage | undefined

  const quote = useMemo(
    () =>
      buildQuote({
        minutes,
        unitPrice: pkg?.unitPrice ?? 0,
        difficulty,
        urgency,
        extras,
        extraQty: { subtitle: Math.max(1, Math.round(minutes / 8)) },
      }),
    [minutes, pkg, difficulty, urgency, extras],
  )

  const activeOrders = orders.filter((o) => !['settled', 'canceled'].includes(o.status))

  async function submitOrder() {
    if (!pkg) return
    setSubmitting(true)
    const order = await api.createOrder({
      customerName: form.customer,
      contact: form.contact,
      packageId: pkg.id,
      title: form.title || `${pkg.name} · ${minutes} 分钟素材`,
      amount: quote.total,
      slaHours: pkg.slaHours,
      quoteLines: quote.lines,
      engineerId: form.engineer,
    })
    setSubmitting(false)
    setSubmitOpen(false)
    if (order) navigate(`/service/orders/${order.id}`)
  }

  return (
    <div>
      <PageHeader
        title="技术服务"
        desc="标准化服务包 + 定制报价。软件跑批量，人来做判断；重度损伤与验收节点由工程师兜底。"
        actions={
          <>
            <Button onClick={() => navigate('/service/orders')}>
              <ClipboardList size={14} /> 工单看板
            </Button>
            <Button variant="primary" onClick={() => setSubmitOpen(true)}>
              <Plus size={14} /> 提交需求
            </Button>
          </>
        }
      />

      {/* 流程条 */}
      <Card className="mb-4 px-5 py-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {FLOW.map((step, i) => (
            <div key={step} className="flex shrink-0 items-center gap-1">
              <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-2.5 py-1.5">
                <span className="mono flex h-4 w-4 items-center justify-center rounded bg-[var(--bg-3)] text-[10px] text-[var(--text-2)]">
                  {i + 1}
                </span>
                <span className="whitespace-nowrap text-[12px] text-[var(--text-2)]">{step}</span>
              </div>
              {i < FLOW.length - 1 && <ArrowRight size={11} className="shrink-0 text-[var(--text-3)]" />}
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3 border-t border-[var(--border)] pt-3">
          {[
            { icon: <ShieldCheck size={13} />, label: 'SLA 保障', value: '最短 6 小时交付', tone: 'var(--success)' },
            { icon: <Headphones size={13} />, label: '工程师兜底', value: '关键节点人工复核', tone: 'var(--primary)' },
            { icon: <FileSignature size={13} />, label: '合规报告', value: '每单附验收报告', tone: 'var(--purple)' },
            { icon: <CalendarClock size={13} />, label: '超时赔付', value: '合同额 3% / 天', tone: 'var(--accent)' },
          ].map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ color: m.tone, background: 'var(--bg-2)' }}>
                {m.icon}
              </span>
              <div>
                <div className="text-[11px] text-[var(--text-3)]">{m.label}</div>
                <div className="text-[12px] text-[var(--text-1)]">{m.value}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8 space-y-3">
          <Card>
            <div className="px-5 pt-3">
              <Tabs
                value={tab}
                onChange={setTab}
                items={[
                  { key: 'packages', label: '服务包', count: packages.length },
                  { key: 'cases', label: '交付案例', count: cases.length },
                  { key: 'orders', label: '进行中工单', count: activeOrders.length },
                ]}
              />
            </div>

            {loading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : tab === 'packages' ? (
              <div className="grid grid-cols-2 gap-3 p-4">
                {packages.map((p) => {
                  const active = p.id === pkgId
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPkgId(p.id)}
                      className={cn(
                        'rounded-xl border p-3.5 text-left transition-colors',
                        active
                          ? 'border-[var(--primary)] bg-[var(--primary-10)]'
                          : 'border-[var(--border)] bg-[var(--bg-2)] hover:border-[var(--border-str)]',
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-medium text-[var(--text-1)]">{p.name}</span>
                            {active && <CheckCircle2 size={13} className="text-[var(--primary)]" />}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[var(--text-3)]">{p.scenes}</div>
                        </div>
                        <div className="text-right">
                          <div className="mono text-[16px] font-medium text-[var(--text-1)]">¥{p.unitPrice}</div>
                          <div className="text-[10px] text-[var(--text-3)]">/ {p.unit}</div>
                        </div>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {p.includes.slice(0, 3).map((it) => (
                          <span key={it} className="rounded bg-[var(--bg-3)] px-1.5 py-0.5 text-[10px] text-[var(--text-2)]">
                            {it}
                          </span>
                        ))}
                      </div>
                      {p.slaHours > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-[10.5px] text-[var(--text-3)]">
                          <CalendarClock size={10} /> SLA {p.slaHours}h
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : tab === 'cases' ? (
              <div className="divide-y divide-[var(--border)]">
                {cases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/knowledge/${c.id}`)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-2)]"
                  >
                    <div className="w-[92px] shrink-0">
                      <Thumb seed={c.coverSeed} aspect="16/9" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] text-[var(--text-1)]">{c.title}</div>
                      <div className="mt-0.5 truncate text-[11px] text-[var(--text-3)]">{c.summary}</div>
                      <div className="mt-1 flex items-center gap-2 text-[10.5px] text-[var(--text-3)]">
                        <span>{c.client}</span>
                        <span>·</span>
                        <span>投入 {c.hours} 工时</span>
                        <span>·</span>
                        <span className="text-[var(--success)]">
                          VMAF {c.before.vmaf} → {c.after.vmaf}
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={13} className="text-[var(--text-3)]" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {activeOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => navigate(`/service/orders/${o.id}`)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-2)]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="mono text-[11px] text-[var(--text-3)]">{o.code}</span>
                        <span className="truncate text-[13px] text-[var(--text-1)]">{o.title}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-[var(--text-3)]">
                        {o.customerName} · {o.packageName} · {formatCny(o.amount)}
                      </div>
                    </div>
                    <Badge>{o.slaHours > 0 ? `SLA ${o.slaHours}h` : '按项目排期'}</Badge>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="服务边界" desc="哪些交给算法、哪些必须人来判断——写在合同里的边界" />
            <div className="grid grid-cols-2 gap-3 px-5 pb-4">
              <div className="rounded-lg border border-[rgba(52,211,153,.28)] bg-[rgba(52,211,153,.06)] p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[12px] text-[var(--success)]">
                  <Wrench size={13} /> 算法自动完成
                </div>
                <ul className="space-y-1 text-[11px] leading-5 text-[var(--text-2)]">
                  <li>· 逐帧缺陷检测与时间码定位</li>
                  <li>· 响度归一化、真峰值限制</li>
                  <li>· 去噪、闪烁抑制、划痕修补</li>
                  <li>· 封装 / 帧率 / 像素比规范化</li>
                  <li>· 复检与指标回归测量</li>
                </ul>
              </div>
              <div className="rounded-lg border border-[rgba(251,191,36,.28)] bg-[rgba(251,191,36,.06)] p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[12px] text-[var(--accent)]">
                  <Sparkles size={13} /> 工程师参与
                </div>
                <ul className="space-y-1 text-[11px] leading-5 text-[var(--text-2)]">
                  <li>· 结构性损伤（片基、丢帧）判断</li>
                  <li>· 艺术性取舍（颗粒保留程度）</li>
                  <li>· 修复方案编排与参数调优</li>
                  <li>· 客户验收沟通与返工</li>
                  <li>· 报告签署与合规背书</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* 报价计算器 */}
        <div className="col-span-4">
          <Card className="sticky top-[72px]">
            <CardHeader title="报价估算" desc="按分钟计价，系数与附加项透明可查" right={<Badge color="var(--primary)" bg="var(--primary-10)">实时</Badge>} />
            <div className="space-y-3 px-5 pb-4">
              <div>
                <Label>服务包</Label>
                <Select value={pkgId} onChange={(e) => setPkgId(e.target.value)}>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · ¥{p.unitPrice}/{p.unit}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>素材时长（分钟）</Label>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setMinutes((m) => Math.max(1, m - 5))}>
                    <Minus size={12} />
                  </Button>
                  <Input
                    type="number"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 1))}
                    className="text-center"
                  />
                  <Button size="sm" onClick={() => setMinutes((m) => m + 5)}>
                    <Plus size={12} />
                  </Button>
                </div>
                <div className="mt-1 text-[10.5px] text-[var(--text-3)]">50 分钟 ≈ 1 集电视剧；90 分钟 ≈ 1 部院线片</div>
              </div>

              <div>
                <Label>素材状态</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDifficulty(d.value)}
                      title={d.desc}
                      className={cn(
                        'rounded-md border px-1 py-1.5 text-[11px] transition-colors',
                        difficulty === d.value
                          ? 'border-[var(--primary)] bg-[var(--primary-10)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--bg-2)] text-[var(--text-3)] hover:text-[var(--text-2)]',
                      )}
                    >
                      {d.label}
                      <div className="text-[9.5px] opacity-70">×{d.value}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>交付时效</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {URGENCY_OPTIONS.map((u) => (
                    <button
                      key={u.value}
                      onClick={() => setUrgency(u.value)}
                      className={cn(
                        'rounded-md border px-1 py-1.5 text-[11px] transition-colors',
                        urgency === u.value
                          ? 'border-[var(--primary)] bg-[var(--primary-10)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--bg-2)] text-[var(--text-3)] hover:text-[var(--text-2)]',
                      )}
                    >
                      {u.label}
                      <div className="text-[9.5px] opacity-70">×{u.value}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>附加项</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {EXTRAS.map((x) => {
                    const on = extras.includes(x.key)
                    return (
                      <button
                        key={x.key}
                        onClick={() => setExtras((s) => (on ? s.filter((k) => k !== x.key) : [...s, x.key]))}
                        className={cn(
                          'flex items-center justify-between rounded-md border px-2 py-1.5 text-[11px] transition-colors',
                          on
                            ? 'border-[var(--primary)] bg-[var(--primary-10)] text-[var(--primary)]'
                            : 'border-[var(--border)] bg-[var(--bg-2)] text-[var(--text-3)]',
                        )}
                      >
                        <span>{x.label}</span>
                        <span className="mono text-[10px]">¥{x.price}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Divider />

              <div className="space-y-1.5">
                {quote.lines.map((l, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 text-[11px]">
                    <span className="text-[var(--text-3)]">
                      {l.label}
                      <span className="mono ml-1 opacity-70">
                        {l.qty} {l.unit}
                      </span>
                    </span>
                    <span className="mono shrink-0 text-[var(--text-2)]">¥{l.price.toLocaleString('zh-CN')}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-[var(--border)] pt-1.5 text-[11px]">
                  <span className="text-[var(--text-3)]">小计</span>
                  <span className="mono text-[var(--text-2)]">¥{quote.subtotal.toLocaleString('zh-CN')}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-3)]">增值税（6%）</span>
                  <span className="mono text-[var(--text-2)]">¥{quote.tax.toLocaleString('zh-CN')}</span>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--primary-20)] bg-[var(--primary-10)] px-3 py-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[12px] text-[var(--text-2)]">预估总额</span>
                  <span className="mono text-[20px] font-medium text-[var(--primary)]">{formatCny(quote.total)}</span>
                </div>
                {quote.minApplied && <div className="mt-0.5 text-[10px] text-[var(--text-3)]">已按最低起价 ¥800 计（含税）</div>}
                <div className="mt-0.5 text-[10px] text-[var(--text-3)]">
                  SLA：{pkg?.slaHours ? `${pkg.slaHours} 小时内交付` : '按项目排期'}
                </div>
              </div>

              <Button variant="primary" className="w-full" onClick={() => setSubmitOpen(true)}>
                提交需求并锁价
              </Button>
              <p className="text-center text-[10px] leading-4 text-[var(--text-3)]">
                报价有效期 7 天。最终价格以确认素材清单后的正式报价单为准。
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        title="提交技术服务需求"
        width={620}
        footer={
          <>
            <Button onClick={() => setSubmitOpen(false)}>取消</Button>
            <Button variant="primary" loading={submitting} onClick={submitOrder}>
              生成工单与报价单
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>客户名称</Label>
            <Input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
          </div>
          <div>
            <Label>联系人</Label>
            <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>需求标题</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={`例如：《澜沧江》第五集 ${pkg?.name ?? ''}`}
            />
          </div>
          <div>
            <Label>指定工程师</Label>
            <Select value={form.engineer} onChange={(e) => setForm({ ...form, engineer: e.target.value })}>
              {MEMBERS.filter((m) => m.role === 'engineer' || m.role === 'lead').map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.title}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>关联服务包</Label>
            <Input value={pkg?.name ?? ''} readOnly className="text-[var(--text-3)]" />
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-3">
          <div className="mb-2 flex items-center justify-between text-[12px]">
            <span className="text-[var(--text-2)]">报价摘要</span>
            <span className="mono text-[var(--primary)]">{formatCny(quote.total)}</span>
          </div>
          <div className="space-y-1 text-[11px] text-[var(--text-3)]">
            <div>· {minutes} 分钟 × ¥{pkg?.unitPrice}/{pkg?.unit} × 难度 {difficulty} × 时效 {urgency}</div>
            <div>· 附加项 {extras.length} 项</div>
            <div>· 提交后进入「已报价」，客户确认后转「已签约」</div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
