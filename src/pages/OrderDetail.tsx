import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Clock,
  Download,
  FileText,
  MessageSquare,
  Package,
  Send,
  Star,
  Upload,
  Users,
} from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { Badge, Button, Card, CardHeader, Divider, Input, Modal, Progress, Textarea } from '../components/ui'
import { KV, PageHeader, Skeleton, SlaBar, StatusPill } from '../components/common'
import { Avatar } from '../components/ui'
import { ORDER_STATUS_META } from '../lib/constants'
import { formatCny, overduePenalty } from '../lib/pricing'
import { dateTime, gb } from '../lib/format'
import { slaState } from '../lib/sla'
import { db } from '../mock/db'
import { cn } from '../lib/cn'
import type { OrderStatus, ServiceOrder } from '../types'

const FLOW: OrderStatus[] = ['submitted', 'quoted', 'signed', 'receiving', 'scheduled', 'processing', 'internal_qc', 'delivered', 'accepted', 'settled']

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading } = useAsync(async () => {
    const order = await api.getOrder(id!)
    const assets = order ? await api.assetsByIds(order.assetIds) : []
    const tasks = await api.listTasks()
    const reports = await api.listReports()
    return { order, assets, tasks, reports }
  }, [id])

  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const current = order ?? data?.order
  const assets = data?.assets ?? []
  const [msg, setMsg] = useState('')
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [deliverOpen, setDeliverOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const linkedTasks = useMemo(() => {
    if (!current) return []
    return (data?.tasks ?? []).filter((t) => current.assetIds.includes(t.assetId))
  }, [current, data])

  const linkedReports = useMemo(() => {
    if (!current) return []
    const taskIds = linkedTasks.map((t) => t.id)
    return (data?.reports ?? []).filter((r) => taskIds.includes(r.taskId))
  }, [current, linkedTasks, data])

  if (loading || !current) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-[520px]" />
      </div>
    )
  }

  const meta = ORDER_STATUS_META[current.status]
  const eng = db.members.find((m) => m.id === current.engineerId)
  const s = slaState(current.createdAt, current.slaHours || 240)
  const statusIdx = FLOW.indexOf(current.status)
  const next = statusIdx >= 0 && statusIdx < FLOW.length - 1 ? FLOW[statusIdx + 1] : null
  const overdueDays = Math.max(0, Math.floor((Date.now() - new Date(current.slaDeadline).getTime()) / 86400000))
  const remainHours = Math.round(s.remainingMs / 3600000)

  async function advance(to?: OrderStatus) {
    if (!to) return
    setBusy(true)
    const updated = await api.updateOrderStatus(current!.id, to)
    setOrder(updated ?? null)
    setBusy(false)
  }

  async function send() {
    if (!msg.trim()) return
    const updated = await api.appendOrderMessage(current!.id, msg.trim())
    setOrder(updated ?? null)
    setMsg('')
  }

  return (
    <div>
      <PageHeader
        crumbs={[{ label: '技术服务', to: '/service' }, { label: '工单看板', to: '/service/orders' }, { label: current.code }]}
        title={current.title}
        meta={<StatusPill label={meta.label} color={meta.color} bg={meta.bg} />}
        desc={`${current.customerName} · ${current.packageName} · 创建于 ${dateTime(current.createdAt)}`}
        actions={
          <>
            <Button onClick={() => setDeliverOpen(true)}>
              <Upload size={14} /> 上传交付物
            </Button>
            <Button onClick={() => setQuoteOpen(true)}>
              <FileText size={14} /> 报价单
            </Button>
            {next && (
              <Button variant="primary" loading={busy} onClick={() => advance(next)}>
                推进至「{ORDER_STATUS_META[next].label}」 <ArrowRight size={13} />
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8 space-y-3">
          {/* 里程碑 */}
          <Card>
            <CardHeader
              title="服务流程"
              desc={`共 10 个里程碑，当前处于第 ${statusIdx + 1} 步`}
              right={<Badge color="var(--primary)" bg="var(--primary-10)">{Math.round(((statusIdx + 1) / 10) * 100)}%</Badge>}
            />
            <div className="px-5 pb-4">
              <div className="relative flex items-start justify-between">
                <div className="absolute left-0 right-0 top-[9px] h-px bg-[var(--border)]" />
                <div
                  className="absolute left-0 top-[9px] h-px bg-[var(--primary)]"
                  style={{ width: `${(statusIdx / 9) * 100}%` }}
                />
                {current.milestones.map((m, i) => (
                  <div key={m.key} className="relative z-10 flex flex-1 flex-col items-center">
                    <span
                      className={cn(
                        'flex h-[18px] w-[18px] items-center justify-center rounded-full border text-[9px]',
                        m.done
                          ? 'border-[var(--primary)] bg-[var(--primary)] text-[#04161c]'
                          : 'border-[var(--border-str)] bg-[var(--bg-1)] text-[var(--text-3)]',
                      )}
                    >
                      {m.done ? <Check size={10} /> : i + 1}
                    </span>
                    <span className={cn('mt-1.5 whitespace-nowrap text-[10.5px]', m.done ? 'text-[var(--text-2)]' : 'text-[var(--text-3)]')}>
                      {m.label}
                    </span>
                    <span className="mono mt-0.5 text-[9px] text-[var(--text-3)]">{m.at ? dateTime(m.at).slice(5) : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* 报价 */}
          <Card>
            <CardHeader
              title="报价明细"
              desc={`报价有效期至 ${dateTime(current.quote.validUntil)}`}
              right={
                <Badge
                  color={current.quote.status === 'accepted' ? 'var(--success)' : 'var(--accent)'}
                  bg={current.quote.status === 'accepted' ? 'rgba(52,211,153,.12)' : 'rgba(251,191,36,.12)'}
                >
                  {current.quote.status === 'accepted' ? '客户已确认' : '待客户确认'}
                </Badge>
              }
            />
            <div className="px-5 pb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-y border-[var(--border)] bg-[var(--bg-2)] text-[11px] text-[var(--text-3)]">
                    <th className="px-2 py-2 text-left font-normal">项目</th>
                    <th className="px-2 py-2 text-right font-normal">数量</th>
                    <th className="px-2 py-2 text-left font-normal">单位</th>
                    <th className="px-2 py-2 text-right font-normal">金额</th>
                  </tr>
                </thead>
                <tbody>
                  {current.quote.lines.map((l, i) => (
                    <tr key={i} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-2 py-2 text-[12px] text-[var(--text-1)]">{l.label}</td>
                      <td className="mono px-2 py-2 text-right text-[12px] text-[var(--text-2)]">{l.qty}</td>
                      <td className="px-2 py-2 text-[11px] text-[var(--text-3)]">{l.unit}</td>
                      <td className="mono px-2 py-2 text-right text-[12px] text-[var(--text-1)]">¥{l.price.toLocaleString('zh-CN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2.5">
                <span className="text-[12px] text-[var(--text-3)]">含税总额（增值税 6%）</span>
                <span className="mono text-[18px] font-medium text-[var(--primary)]">{formatCny(current.amount)}</span>
              </div>
              {current.quote.status !== 'accepted' && (
                <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border px-3 py-2" style={{ borderColor: 'rgba(251,191,36,.3)', background: 'rgba(251,191,36,.06)' }}>
                  <span className="text-[11px] text-[var(--text-2)]">客户尚未确认报价，确认后自动进入签约环节</span>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={async () => {
                      setBusy(true)
                      const updated = await api.acceptQuote(current.id)
                      setOrder(updated ?? null)
                      setBusy(false)
                    }}
                  >
                    <Check size={12} /> 客户确认
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* 关联素材与检测 */}
          <Card>
            <CardHeader
              title="关联素材与检测记录"
              desc="A 线的检测结果可直接作为 B 线的服务依据，报告同步归档"
              right={<Badge>{assets.length} 个素材</Badge>}
            />
            <div className="divide-y divide-[var(--border)]">
              {assets.length === 0 && <div className="px-5 py-6 text-center text-[12px] text-[var(--text-3)]">尚未关联素材，签约后由客户上传</div>}
              {assets.map((a) => {
                const t = linkedTasks.find((x) => x.assetId === a.id)
                return (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                    <Package size={14} className="text-[var(--text-3)]" />
                    <div className="min-w-0 flex-1">
                      <button onClick={() => navigate(`/media/${a.id}`)} className="truncate text-[12px] text-[var(--text-1)] hover:text-[var(--primary)]">
                        {a.name}
                      </button>
                      <div className="mono text-[10px] text-[var(--text-3)]">
                        {a.container} · {a.width}×{a.height} · {gb(a.sizeGB)}
                      </div>
                    </div>
                    {t ? (
                      <button
                        onClick={() => navigate(`/detection/${t.id}`)}
                        className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-2)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                      >
                        检测 {t.score} 分 <ArrowRight size={10} />
                      </button>
                    ) : (
                      <span className="text-[11px] text-[var(--text-3)]">未检测</span>
                    )}
                  </div>
                )
              })}
            </div>
            {linkedReports.length > 0 && (
              <div className="border-t border-[var(--border)] px-5 py-2.5">
                <div className="mb-1.5 text-[11px] text-[var(--text-3)]">关联报告</div>
                <div className="flex flex-wrap gap-1.5">
                  {linkedReports.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => navigate(`/reports/${r.id}`)}
                      className="mono rounded border border-[var(--border)] px-2 py-1 text-[10.5px] text-[var(--text-2)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    >
                      {r.no}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* 交付物 */}
          <Card>
            <CardHeader title="交付物" desc="按版本归档，客户可下载或在线预览" right={<Badge>{current.deliverables.length} 个版本</Badge>} />
            {current.deliverables.length === 0 ? (
              <div className="px-5 pb-5 text-center text-[12px] text-[var(--text-3)]">
                暂无交付物。完成修复与内审后上传，自动同步至客户工单。
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {current.deliverables.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                    <FileText size={14} className="text-[var(--primary)]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] text-[var(--text-1)]">{d.name}</div>
                      <div className="mono text-[10px] text-[var(--text-3)]">
                        {d.format} · {gb(d.sizeGB)} · {dateTime(d.at)}
                      </div>
                    </div>
                    <Badge color="var(--purple)" bg="rgba(167,139,250,.12)">
                      {d.version}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      <Download size={12} /> 下载
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* 右列 */}
        <div className="col-span-4 space-y-3">
          <Card>
            <CardHeader title="SLA 与计时" desc={current.slaHours ? `承诺 ${current.slaHours} 小时内交付` : '按项目排期'} />
            <div className="px-4 pb-4">
              <div className="mb-3">
                <SlaBar createdAt={current.createdAt} slaHours={current.slaHours || 240} />
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-3)]">截止</span>
                  <span className="mono text-[var(--text-2)]">{dateTime(current.slaDeadline)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-3)]">剩余</span>
                  <span className="mono" style={{ color: s.level === 'danger' ? 'var(--danger)' : 'var(--text-2)' }}>
                    {remainHours > 0 ? `${remainHours} 小时` : `超时 ${Math.abs(remainHours)} 小时`}
                  </span>
                </div>
              </div>
              <Divider />
              <div className="mt-2.5 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-3)]">超时赔付（合同额 3%/天）</span>
                  <span className="mono text-[var(--danger)]">{overdueDays > 0 ? formatCny(overduePenalty(current.amount, overdueDays)) : '¥0'}</span>
                </div>
                <div className="flex items-center gap-1 text-[10.5px] text-[var(--text-3)]">
                  <Clock size={10} /> 赔付上限为合同额的 20%
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="客户与负责人" />
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2.5">
                <Avatar name={current.contact} seed={21} size={32} />
                <div className="min-w-0">
                  <div className="text-[12px] text-[var(--text-1)]">{current.contact}</div>
                  <div className="text-[11px] text-[var(--text-3)]">{current.customerName}</div>
                </div>
              </div>
              <Divider className="my-3" />
              <div className="flex items-center gap-2.5">
                <Avatar name={eng?.name ?? '未分配'} seed={eng?.avatarSeed ?? 3} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] text-[var(--text-1)]">{eng?.name}</div>
                  <div className="text-[11px] text-[var(--text-3)]">{eng?.title}</div>
                </div>
                <Button size="sm" variant="ghost">
                  <Users size={12} /> 变更
                </Button>
              </div>
              <div className="mt-3">
                <KV k="服务包" v={current.packageName} />
                <KV k="工单号" v={current.code} mono />
                <KV k="创建时间" v={dateTime(current.createdAt)} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="结算" desc="开票与回款状态" right={<CircleDollarSign size={14} className="text-[var(--text-3)]" />} />
            <div className="px-4 pb-4">
              <KV k="合同金额" v={formatCny(current.amount)} mono />
              <KV k="发票号" v={current.invoice.no} mono />
              <KV
                k="开票状态"
                v={
                  <span
                    style={{
                      color:
                        current.invoice.status === 'paid'
                          ? 'var(--success)'
                          : current.invoice.status === 'issued'
                            ? 'var(--primary)'
                            : 'var(--text-3)',
                    }}
                  >
                    {{ none: '未申请', pending: '申请中', issued: '已开票', paid: '已回款' }[current.invoice.status]}
                  </span>
                }
              />
              {current.rating && (
                <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-2.5">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < (current.rating?.stars ?? 0) ? 'text-[var(--accent)]' : 'text-[var(--text-3)]'}
                        fill={i < (current.rating?.stars ?? 0) ? 'var(--accent)' : 'none'}
                      />
                    ))}
                    <span className="mono ml-1 text-[11px] text-[var(--text-2)]">{current.rating.stars}.0</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {current.rating.tags.map((t) => (
                      <span key={t} className="rounded bg-[var(--bg-3)] px-1.5 py-0.5 text-[10px] text-[var(--text-2)]">
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-5 text-[var(--text-3)]">“{current.rating.comment}”</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="沟通记录" desc="所有对话留痕，交付争议可回溯" right={<MessageSquare size={14} className="text-[var(--text-3)]" />} />
            <div className="max-h-[260px] space-y-2 overflow-y-auto px-4 pb-2">
              {current.messages.map((m) => (
                <div key={m.id} className={cn('flex', m.from === 'engineer' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[86%] rounded-lg px-2.5 py-1.5 text-[11.5px] leading-5',
                      m.from === 'engineer'
                        ? 'bg-[var(--primary-10)] text-[var(--text-1)]'
                        : 'border border-[var(--border)] bg-[var(--bg-2)] text-[var(--text-2)]',
                    )}
                  >
                    <div className="mb-0.5 flex items-center gap-1.5 text-[9.5px] text-[var(--text-3)]">
                      <span>{m.from === 'engineer' ? eng?.name ?? '工程师' : current.contact}</span>
                      <span className="mono">{dateTime(m.at).slice(5)}</span>
                    </div>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2.5">
              <Input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send()
                }}
                placeholder="回复客户…"
                className="h-8 text-[12px]"
              />
              <Button size="sm" variant="primary" onClick={send}>
                <Send size={12} />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* 报价单 modal */}
      <Modal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        title={`报价单 · ${current.code}`}
        width={620}
        footer={
          <>
            <Button onClick={() => setQuoteOpen(false)}>关闭</Button>
            <Button variant="primary" onClick={() => window.print()}>
              导出 PDF
            </Button>
          </>
        }
      >
        <div className="text-[12px]">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="text-[14px] font-medium">AV Repair Studio 技术服务报价单</div>
              <div className="mono mt-0.5 text-[11px] text-[var(--text-3)]">{current.code} · 有效期至 {dateTime(current.quote.validUntil)}</div>
            </div>
            <div className="text-right text-[11px] text-[var(--text-3)]">
              客户：{current.customerName}
              <br />
              联系人：{current.contact}
            </div>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--bg-2)] text-[11px] text-[var(--text-3)]">
                <th className="border border-[var(--border)] px-2 py-1.5 text-left font-normal">项目</th>
                <th className="border border-[var(--border)] px-2 py-1.5 text-right font-normal">数量</th>
                <th className="border border-[var(--border)] px-2 py-1.5 text-left font-normal">单位</th>
                <th className="border border-[var(--border)] px-2 py-1.5 text-right font-normal">金额</th>
              </tr>
            </thead>
            <tbody>
              {current.quote.lines.map((l, i) => (
                <tr key={i}>
                  <td className="border border-[var(--border)] px-2 py-1.5">{l.label}</td>
                  <td className="mono border border-[var(--border)] px-2 py-1.5 text-right">{l.qty}</td>
                  <td className="border border-[var(--border)] px-2 py-1.5 text-[var(--text-3)]">{l.unit}</td>
                  <td className="mono border border-[var(--border)] px-2 py-1.5 text-right">¥{l.price.toLocaleString('zh-CN')}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} className="border border-[var(--border)] px-2 py-1.5 text-right text-[var(--text-3)]">
                  合计（含税）
                </td>
                <td className="mono border border-[var(--border)] px-2 py-1.5 text-right text-[var(--primary)]">{formatCny(current.amount)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 space-y-1 text-[11px] leading-5 text-[var(--text-3)]">
            <div>· 计价方式：按素材时长计价，难度与时效系数已在明细中单列。</div>
            <div>· 交付标准：{current.packageName}，SLA {current.slaHours} 小时。</div>
            <div>· 超时赔付：每超时一天按合同额 3% 赔付，上限 20%。</div>
            <div>· 报价有效期 7 天，逾期需重新评估。</div>
          </div>
        </div>
      </Modal>

      {/* 交付物 modal */}
      <Modal
        open={deliverOpen}
        onClose={() => setDeliverOpen(false)}
        title="上传交付物"
        footer={
          <>
            <Button onClick={() => setDeliverOpen(false)}>取消</Button>
            <Button variant="primary" onClick={() => setDeliverOpen(false)}>
              确认上传
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-dashed border-[var(--border-str)] px-4 py-8 text-center">
            <Upload size={20} className="mx-auto mb-2 text-[var(--text-3)]" />
            <div className="text-[12px] text-[var(--text-2)]">拖拽成片到此处，或点击选择文件</div>
            <div className="mt-1 text-[11px] text-[var(--text-3)]">支持 MOV / MP4 / MXF，单文件 ≤ 200 GB</div>
          </div>
          <div>
            <div className="mb-1.5 text-[12px] text-[var(--text-2)]">版本说明</div>
            <Textarea rows={2} placeholder="例如：v1 交付版，按反馈修正了第 12 分钟的响度" />
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-2.5 text-[11px] leading-5 text-[var(--text-3)]">
            上传后自动进入内审队列：先跑复检，再由质检员签署，通过后才会同步至客户。
          </div>
          <Progress value={0} />
        </div>
      </Modal>
    </div>
  )
}
