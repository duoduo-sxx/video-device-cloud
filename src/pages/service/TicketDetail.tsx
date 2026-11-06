import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Send, Star, UserCheck } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader, Panel, ProgressBar, StatusDot, Avatar, EmptyState } from '@/components/common'
import { Button, Input, Tag, Textarea } from '@/components/ui/primitives'
import { Modal } from '@/components/ui/overlay'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { useAppStore } from '@/stores/appStore'
import { TICKET_PRIORITY_COLOR, TICKET_PRIORITY_LABEL, TICKET_STATUS_LABEL } from '@/constants/enums'
import { cn, fmtDuration } from '@/utils/misc'
import type { TicketStatus } from '@/types'

const FLOW: Array<{ key: TicketStatus; label: string }> = [
  { key: 'pending', label: '待受理' },
  { key: 'assigned', label: '已指派' },
  { key: 'processing', label: '处理中' },
  { key: 'verifying', label: '待验证' },
  { key: 'done', label: '已完成' },
]

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const db = useDataStore((s) => s.db)
  const { advanceTicket, addTicketComment, rateTicket } = useDataStore()
  const toast = useUIStore((s) => s.toast)
  const user = useAppStore((s) => s.user)
  const [reply, setReply] = useState('')
  const [rating, setRating] = useState(false)
  const [scores, setScores] = useState({ speed: 5, professional: 5, effect: 4 })
  const [tags, setTags] = useState<string[]>(['响应及时'])
  const [comment, setComment] = useState('')

  const ticket = db.tickets.find((t) => t.id === id)
  const device = db.devices.find((d) => d.id === ticket?.deviceId)
  const space = db.spaces.find((s) => s.id === ticket?.spaceId)

  if (!ticket) {
    return (
      <Panel className="flex-1">
        <EmptyState title="工单不存在" desc="该工单可能已被删除或编号有误" action={<Button size="sm" onClick={() => navigate('/service')}>返回工单列表</Button>} />
      </Panel>
    )
  }

  const currentIdx = FLOW.findIndex((f) => f.key === ticket.status)
  const idx = ticket.status === 'closed' ? FLOW.length : currentIdx
  const slaPct = Math.max(0, Math.min(100, (ticket.slaRemainMinutes / ticket.slaMinutes) * 100))

  return (
    <>
      <PageHeader
        title={ticket.title}
        sub={`${ticket.id} · ${ticket.serviceType} · 提交于 ${dayjs(ticket.createdAt).format('YYYY-MM-DD HH:mm')}`}
        actions={
          <Button variant="secondary" icon={<ArrowLeft size={14} />} onClick={() => navigate('/service')}>
            返回列表
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        <div className="col-span-8 flex flex-col gap-3 min-h-0 overflow-auto">
          <Panel bodyClass="p-4">
            <div className="flex items-center">
              {FLOW.map((f, i) => {
                const active = i <= idx
                const isCurrent = i === idx
                return (
                  <div key={f.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-[10px] num border',
                          active ? 'bg-brand border-brand text-canvas' : 'bg-panel2 border-strong text-ink-mute',
                        )}
                      >
                        {i < idx ? <Check size={10} /> : i + 1}
                      </span>
                      <span className={cn('text-2xs', isCurrent ? 'text-brand' : active ? 'text-ink' : 'text-ink-mute')}>{f.label}</span>
                    </div>
                    {i < FLOW.length - 1 && (
                      <div className={cn('flex-1 h-px mx-2', i < idx ? 'bg-brand/50' : 'bg-[var(--border-strong)]')} />
                    )}
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel title="问题描述" bodyClass="p-4">
            <p className="text-xs text-ink-soft leading-relaxed">{ticket.description}</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-ctrl border border-strong bg-panel2/60 px-3 py-2">
                <div className="text-[10px] text-ink-mute">所属空间</div>
                <div className="text-xs text-ink mt-0.5">{space ? `${space.building} ${space.floor > 0 ? `${space.floor}F` : 'B1'} ${space.name}` : '—'}</div>
              </div>
              <div className="rounded-ctrl border border-strong bg-panel2/60 px-3 py-2">
                <div className="text-[10px] text-ink-mute">关联设备</div>
                <div className="text-xs text-ink mt-0.5 truncate">{ticket.deviceName ?? '未指定'}{device ? ` · ${device.code}` : ''}</div>
              </div>
            </div>
          </Panel>

          <Panel title={`处理记录 · ${ticket.comments.length}`} bodyClass="p-4">
            <div className="space-y-3.5">
              {ticket.comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar name={c.author} color={c.avatarColor} size={26} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink">{c.author}</span>
                      <span className="num text-[10px] text-ink-mute">{dayjs(c.time).format('MM-DD HH:mm')}</span>
                      {c.statusChange && <Tag color="var(--brand)">{c.statusChange}</Tag>}
                    </div>
                    <p className="text-xs text-ink-soft leading-relaxed mt-1">{c.content}</p>
                  </div>
                </div>
              ))}
              {ticket.status !== 'closed' && ticket.status !== 'done' && (
                <div className="flex gap-2 pt-2 border-t border-subtle">
                  <Avatar name={user?.name ?? '我'} color={user?.avatarColor ?? '#22D3EE'} size={26} />
                  <div className="flex-1">
                    <Textarea
                      rows={2}
                      placeholder="补充说明或回复处理进展…"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />
                    <div className="flex justify-end mt-1.5">
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Send size={12} />}
                        onClick={() => {
                          if (!reply.trim()) return
                          addTicketComment(ticket.id, user?.name ?? '张启明', reply)
                          setReply('')
                          toast('success', '已添加回复')
                        }}
                      >
                        发送
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="col-span-4 flex flex-col gap-3">
          <Panel title="工单信息" bodyClass="p-4">
            <div className="space-y-0">
              {[
                ['工单号', <span className="num" key="id">{ticket.id}</span>],
                ['服务类型', ticket.serviceType],
                ['优先级', <Tag key="p" color={TICKET_PRIORITY_COLOR[ticket.priority]}>{TICKET_PRIORITY_LABEL[ticket.priority]}</Tag>],
                ['当前状态', <Tag key="s" color="var(--brand)">{TICKET_STATUS_LABEL[ticket.status]}</Tag>],
                ['提交人', ticket.creator],
                ['处理人', ticket.assignee ?? '待分配'],
                ['提交时间', dayjs(ticket.createdAt).format('MM-DD HH:mm')],
                ['期望完成', dayjs(ticket.expectedAt).format('MM-DD HH:mm')],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-center justify-between py-2 border-b border-subtle last:border-0 gap-3">
                  <span className="text-2xs text-ink-soft shrink-0">{k}</span>
                  <span className="text-xs text-ink text-right truncate">{v}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="SLA 进度" bodyClass="p-4">
            <div className="flex items-end justify-between mb-2">
              <span className={cn('num text-xl', slaPct < 20 ? 'text-bad' : 'text-ink')}>{fmtDuration(ticket.slaRemainMinutes)}</span>
              <span className="text-2xs text-ink-mute">剩余 / 共 {fmtDuration(ticket.slaMinutes)}</span>
            </div>
            <ProgressBar value={slaPct} color={slaPct < 20 ? 'var(--danger)' : 'var(--brand)'} height={5} />
            <div className="flex items-center gap-1.5 mt-3 text-2xs text-ink-mute">
              <StatusDot color={slaPct < 20 ? 'var(--danger)' : 'var(--success)'} size={6} />
              {slaPct < 20 ? '即将超时，建议加快处理' : '当前处理进度正常'}
            </div>
          </Panel>

          <Panel title="操作" bodyClass="p-4 space-y-2">
            {ticket.status === 'pending' && (
              <Button
                variant="primary"
                className="w-full"
                icon={<UserCheck size={14} />}
                onClick={() => {
                  advanceTicket(ticket.id, user?.name ?? '张启明', '已接单，正在安排处理')
                  toast('success', '已受理工单')
                }}
              >
                受理并开始处理
              </Button>
            )}
            {ticket.status !== 'pending' && ticket.status !== 'done' && ticket.status !== 'closed' && (
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  advanceTicket(ticket.id, user?.name ?? '张启明', '当前阶段处理完成，请使用方验证')
                  toast('success', '已推进到下一阶段')
                }}
              >
                推进到下一阶段
              </Button>
            )}
            {(ticket.status === 'done' || ticket.status === 'closed') && !ticket.rating && (
              <Button variant="primary" className="w-full" icon={<Star size={14} />} onClick={() => setRating(true)}>
                评价本次服务
              </Button>
            )}
            {ticket.rating && (
              <div className="rounded-card border border-strong bg-panel2 p-3">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={12} className={n <= ticket.rating!.effect ? 'text-warn' : 'text-ink-mute'} fill={n <= ticket.rating!.effect ? 'currentColor' : 'none'} />
                  ))}
                  <span className="num text-2xs text-ink-mute ml-1">已评价</span>
                </div>
                <p className="text-2xs text-ink-soft leading-relaxed">{ticket.rating.comment}</p>
              </div>
            )}
            <Button variant="ghost" className="w-full" onClick={() => navigate('/service')}>
              返回工单列表
            </Button>
          </Panel>
        </div>
      </div>

      <Modal
        open={rating}
        onClose={() => setRating(false)}
        title="评价本次服务"
        desc="你的反馈会用于服务质量的持续改进"
        width={460}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRating(false)}>
              稍后再说
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                rateTicket(ticket.id, { ...scores, tags, comment: comment || '处理及时，问题已解决。' })
                setRating(false)
                toast('success', '感谢评价', '已记录你的反馈')
              }}
            >
              提交评价
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {([
            ['speed', '响应速度'],
            ['professional', '专业程度'],
            ['effect', '解决效果'],
          ] as const).map(([k, label]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-xs text-ink-soft">{label}</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setScores({ ...scores, [k]: n })} aria-label={`${label} ${n} 星`}>
                    <Star
                      size={16}
                      className={n <= scores[k] ? 'text-warn' : 'text-ink-mute'}
                      fill={n <= scores[k] ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <div className="text-xs text-ink-soft mb-2">印象标签</div>
            <div className="flex flex-wrap gap-1.5">
              {['响应及时', '处理专业', '沟通顺畅', '一次解决', '需要加强'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}
                  className={cn(
                    'h-6 px-2 rounded-full border text-2xs transition-colors',
                    tags.includes(t) ? 'border-brand/45 bg-brand/[0.1] text-brand' : 'border-strong bg-panel2 text-ink-soft',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-ink-soft mb-1.5">补充说明</div>
            <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="说说这次服务的感受" />
          </div>
        </div>
      </Modal>
    </>
  )
}
