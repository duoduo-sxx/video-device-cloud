import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Building2, FileText, X } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Badge, Button, KV, Panel } from '../components/ui'
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, TAX_RATE } from '../lib/constants'
import { formatDate, formatDateTime, money } from '../lib/format'
import type { OrderStatus } from '../types'

const flow: OrderStatus[] = ['pending_confirm', 'paid', 'in_production', 'delivered', 'completed']

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const order = useDataStore((s) => s.orders.find((o) => o.id === id))
  const client = useDataStore((s) => (order ? s.clients.find((c) => c.id === order.clientId) : undefined))
  const project = useDataStore((s) => (order ? s.projects.find((p) => p.id === order.projectId) : undefined))
  const setOrderStatus = useDataStore((s) => s.setOrderStatus)
  const addLog = useDataStore((s) => s.addLog)
  const toast = useAppStore((s) => s.toast)

  if (!order) {
    return (
      <Panel className="p-10 text-center">
        <div className="text-[14px] text-ink">订单不存在</div>
        <Button className="mt-4" variant="primary" onClick={() => navigate('/orders')}>
          返回订单列表
        </Button>
      </Panel>
    )
  }

  const subtotal = order.subtotalCNY
  const rushFee = order.rush ? subtotal * 0.5 : 0
  const taxable = subtotal + rushFee - order.discountCNY
  const tax = taxable * TAX_RATE
  const total = taxable + tax

  const nextStatus = (() => {
    const idx = flow.indexOf(order.status)
    if (idx >= 0 && idx < flow.length - 1) return flow[idx + 1]
    return undefined
  })()

  const advance = (to: OrderStatus) => {
    setOrderStatus(order.id, to)
    addLog('order.update', order.code, { to })
    toast('success', '订单状态已更新', `${ORDER_STATUS_LABEL[to]} · ${money(order.totalCNY)}`)
  }

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title={`订单 ${order.code}`}
        back={{ to: '/orders', label: '返回订单列表' }}
        desc={
          <span className="flex flex-wrap items-center gap-2">
            <span>{client?.shortName}</span>
            <span className="text-dim">·</span>
            <span>{project?.name}</span>
            <span className="text-dim">·</span>
            <span>下单于 {formatDateTime(order.createdAt)}</span>
          </span>
        }
        meta={
          <>
            <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
            {order.rush && <Badge tone="warning">加急 ×1.5</Badge>}
            <Badge tone={order.invoice.status === 'issued' ? 'success' : 'neutral'}>
              {order.invoice.status === 'issued' ? '已开票' : order.invoice.status === 'requested' ? '开票申请中' : '未开票'}
            </Badge>
          </>
        }
        actions={
          <>
            {order.status !== 'canceled' && order.status !== 'completed' && (
              <Button
                variant="ghost"
                icon={<X className="h-3.5 w-3.5" />}
                onClick={() => advance('canceled')}
              >
                取消订单
              </Button>
            )}
            {nextStatus && (
              <Button variant="primary" icon={<ArrowRight className="h-3.5 w-3.5" />} onClick={() => advance(nextStatus)}>
                {nextStatus === 'paid' ? '确认收款' : nextStatus === 'in_production' ? '开始制作' : nextStatus === 'delivered' ? '标记已交付' : '完成订单'}
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        {flow.map((s, i) => {
          const idx = flow.indexOf(order.status)
          const done = idx >= i && order.status !== 'canceled'
          return (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full border text-[10px]"
                  style={{
                    borderColor: done ? 'var(--primary)' : 'var(--border)',
                    background: done ? 'rgba(61,125,255,0.14)' : 'transparent',
                    color: done ? '#8db3ff' : 'var(--text-dim)',
                  }}
                >
                  {i + 1}
                </span>
                <span className={`text-[11.5px] ${done ? 'text-ink' : 'text-dim'}`}>{ORDER_STATUS_LABEL[s]}</span>
              </div>
              {i < flow.length - 1 && <div className="h-px flex-1" style={{ background: idx > i ? 'rgba(61,125,255,0.5)' : 'var(--border)' }} />}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <div className="border-b border-line-subtle px-4 py-3 text-[13px] text-ink">计费明细</div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-line-subtle text-[10.5px] text-dim">
                  <th className="px-4 py-2 text-left font-normal">服务项</th>
                  <th className="px-4 py-2 text-right font-normal">分钟数</th>
                  <th className="px-4 py-2 text-right font-normal">单价</th>
                  <th className="px-4 py-2 text-right font-normal">小计</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it, i) => (
                  <tr key={i} className="border-b border-line-subtle">
                    <td className="px-4 py-2.5 text-[12px] text-ink">{it.service}</td>
                    <td className="mono px-4 py-2.5 text-right text-[12px] text-muted">{it.minutes}</td>
                    <td className="mono px-4 py-2.5 text-right text-[12px] text-muted">{money(it.unitPriceCNY)}</td>
                    <td className="mono px-4 py-2.5 text-right text-[12px] text-ink">{money(it.minutes * it.unitPriceCNY)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 text-[10.5px] leading-5 text-dim">
              计费以输出分钟为单位，不足 1 分钟按 1 分钟计。8K 输出按 8K 单价结算，混分辨率批次分别计价。
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="mb-2 text-[13px] text-ink">订单说明</div>
            <p className="text-[12px] leading-6 text-muted">
              {project?.description ?? '按客户要求完成空间视频转制，含 MV-HEVC 母版、SBS 备份版本与质检报告。修改轮次不超过 2 轮，超出按精修计价。'}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line-subtle pt-4">
              <KV label="客户">{client?.name}</KV>
              <KV label="税号" mono>
                {client?.taxNo}
              </KV>
              <KV label="账期">{client?.paymentTermDays} 天</KV>
              <KV label="负责制片">{project?.ownerId ? '陈知远' : '—'}</KV>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="mb-3 flex items-center gap-2 text-[13px] text-ink">
              <Building2 className="h-3.5 w-3.5 text-dim" /> 发票信息
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <KV label="开票状态">
                  {order.invoice.status === 'issued' ? '已开具' : order.invoice.status === 'requested' ? '申请中' : '未开票'}
                </KV>
                <KV label="发票号" mono>
                  {order.invoice.no ?? '—'}
                </KV>
              </div>
              <div>
                <KV label="抬头">{order.invoice.title ?? client?.name}</KV>
                <KV label="开票日期">{formatDate(order.invoice.issuedAt)}</KV>
              </div>
            </div>
            {order.invoice.status === 'none' && (
              <Button
                className="mt-3"
                size="sm"
                icon={<FileText className="h-3 w-3" />}
                onClick={() => toast('info', '开票申请已提交', '财务将在 2 个工作日内处理')}
              >
                申请开票
              </Button>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel className="p-5">
            <div className="mb-3 text-[13px] text-ink">金额汇总</div>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-dim">服务小计</span>
                <span className="mono text-ink">{money(subtotal)}</span>
              </div>
              {order.rush && (
                <div className="flex justify-between">
                  <span className="text-dim">加急附加（×1.5）</span>
                  <span className="mono text-[#f7b95a]">+{money(rushFee)}</span>
                </div>
              )}
              {order.discountCNY > 0 && (
                <div className="flex justify-between">
                  <span className="text-dim">优惠</span>
                  <span className="mono text-success">-{money(order.discountCNY)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-dim">税额（6%）</span>
                <span className="mono text-muted">{money(tax)}</span>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between border-t border-line-subtle pt-3">
              <span className="text-[12px] text-dim">合计</span>
              <span className="mono text-[24px] text-ink">{money(total)}</span>
            </div>
            <div className="mt-1 text-right text-[10px] text-dim">含税价 · 人民币</div>
          </Panel>

          <Panel className="p-5">
            <div className="mb-3 text-[13px] text-ink">时间线</div>
            <div className="space-y-3">
              {[
                { label: '订单创建', ts: order.createdAt },
                ...(order.paidAt ? [{ label: '确认收款', ts: order.paidAt }] : []),
                ...(order.deliveredAt ? [{ label: '交付完成', ts: order.deliveredAt }] : []),
                ...(order.invoice.issuedAt ? [{ label: '发票开具', ts: order.invoice.issuedAt }] : []),
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div className="flex-1">
                    <div className="text-[11.5px] text-ink">{t.label}</div>
                    <div className="text-[10.5px] text-dim">{formatDateTime(t.ts)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="mb-2 text-[13px] text-ink">关联</div>
            <button onClick={() => navigate(`/projects/${project?.id}`)} className="flex w-full items-center gap-2 rounded-md border border-line-subtle px-3 py-2 text-left hover:bg-[#151a23]">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11.5px] text-ink">{project?.name}</div>
                <div className="mono mt-0.5 text-[10px] text-dim">{project?.code}</div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-dim" />
            </button>
          </Panel>
        </div>
      </div>
    </div>
  )
}
