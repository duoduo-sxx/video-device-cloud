import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock, Paperclip, Send, Star, UserPlus } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Avatar, Badge, Button, KV, Panel, Progress, Select, Textarea } from '../components/ui'
import { PRIORITY_LABEL, PRIORITY_TONE, SLA_HOURS, TICKET_STATUS_LABEL, TICKET_STATUS_TONE } from '../lib/constants'
import { formatCountdown, formatDateTime, relativeTime } from '../lib/format'
import { cn } from '../lib/utils'

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ticket = useDataStore((s) => s.tickets.find((t) => t.id === id))
  const client = useDataStore((s) => (ticket ? s.clients.find((c) => c.id === ticket.clientId) : undefined))
  const project = useDataStore((s) => (ticket?.projectId ? s.projects.find((p) => p.id === ticket.projectId) : undefined))
  const job = useDataStore((s) => (ticket?.jobId ? s.jobs.find((j) => j.id === ticket.jobId) : undefined))
  const team = useDataStore((s) => s.team)
  const addReply = useDataStore((s) => s.addReply)
  const setTicketStatus = useDataStore((s) => s.setTicketStatus)
  const toast = useAppStore((s) => s.toast)
  const [reply, setReply] = useState('')

  if (!ticket) {
    return (
      <Panel className="p-10 text-center">
        <div className="text-[14px] text-ink">工单不存在</div>
        <Button className="mt-4" variant="primary" onClick={() => navigate('/tickets')}>
          返回技术服务
        </Button>
      </Panel>
    )
  }

  const remain = new Date(ticket.slaDueAt).getTime() - Date.now()
  const total = SLA_HOURS[ticket.priority] * 3600000
  const usedRatio = Math.min(100, Math.max(0, ((total - remain) / total) * 100))
  const overdue = remain < 0 && !['resolved', 'closed'].includes(ticket.status)
  const assignee = team.find((m) => m.id === ticket.assigneeId)
  const resolved = ['resolved', 'closed'].includes(ticket.status)

  const send = () => {
    if (!reply.trim()) return
    addReply(ticket.id, reply.trim())
    setReply('')
    toast('success', '回复已发送', '客户将收到邮件通知')
  }

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title={ticket.title}
        back={{ to: '/tickets', label: '返回技术服务' }}
        desc={
          <span className="flex flex-wrap items-center gap-2">
            <span className="mono text-[11.5px] text-dim">{ticket.code}</span>
            <span className="text-dim">·</span>
            <span>{ticket.type}</span>
            <span className="text-dim">·</span>
            <span>{client?.shortName}</span>
            <span className="text-dim">·</span>
            <span>创建于 {relativeTime(ticket.createdAt)}</span>
          </span>
        }
        meta={
          <>
            <Badge tone={PRIORITY_TONE[ticket.priority]}>{PRIORITY_LABEL[ticket.priority]}</Badge>
            <Badge tone={TICKET_STATUS_TONE[ticket.status]}>{TICKET_STATUS_LABEL[ticket.status]}</Badge>
            {overdue && <Badge tone="danger">SLA 已超时</Badge>}
          </>
        }
        actions={
          <>
            {ticket.status === 'new' && (
              <Button
                icon={<UserPlus className="h-3.5 w-3.5" />}
                onClick={() => {
                  setTicketStatus(ticket.id, 'accepted')
                  toast('success', '工单已受理', '已分配至沈暮，SLA 继续计时')
                }}
              >
                受理工单
              </Button>
            )}
            {!resolved && (
              <Button
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={() => {
                  setTicketStatus(ticket.id, 'resolved')
                  toast('success', '工单已解决', '等待客户确认后自动关闭')
                }}
              >
                标记已解决
              </Button>
            )}
            <Button
              variant="primary"
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              onClick={() => navigate(ticket.jobId ? `/jobs/${ticket.jobId}` : '/jobs/new')}
            >
              查看关联任务
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Panel className="p-4">
            <div className="flex items-center gap-2 text-[12px] text-muted">
              <Clock className={cn('h-3.5 w-3.5', overdue ? 'text-danger' : remain < 3600000 ? 'text-warning' : 'text-dim')} />
              SLA 剩余
              <span className={cn('mono', overdue ? 'text-danger' : 'text-ink')}>{formatCountdown(remain)}</span>
              <span className="text-dim">/ 总计 {SLA_HOURS[ticket.priority]} 小时</span>
              {ticket.slaPaused && <Badge tone="neutral">已暂停计时</Badge>}
            </div>
            <Progress value={usedRatio} className="mt-2" tone={overdue ? 'danger' : usedRatio > 75 ? 'warning' : 'primary'} />
            <div className="mt-1.5 flex justify-between text-[10px] text-dim">
              <span>创建 {formatDateTime(ticket.createdAt)}</span>
              <span>截止 {formatDateTime(ticket.slaDueAt)}</span>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[13px] text-ink">沟通记录</div>
              <span className="text-[11px] text-dim">{ticket.replies.length} 条</span>
            </div>
            <div className="space-y-4">
              {ticket.replies.map((r) => (
                <div key={r.id} className={cn('flex gap-3', !r.isClient && 'flex-row-reverse')}>
                  <Avatar name={r.authorName} hue={r.isClient ? 210 : 150} size={28} />
                  <div className={cn('max-w-[78%]', !r.isClient && 'text-right')}>
                    <div className={cn('flex items-center gap-2 text-[10.5px] text-dim', !r.isClient && 'flex-row-reverse')}>
                      <span className="text-muted">{r.authorName}</span>
                      <span>{r.isClient ? '客户' : 'SpaceScape'}</span>
                      <span>{relativeTime(r.createdAt)}</span>
                    </div>
                    <div
                      className={cn(
                        'mt-1.5 rounded-lg border px-3 py-2 text-left text-[12px] leading-6',
                        r.isClient ? 'border-line bg-[#141821] text-muted' : 'border-[rgba(61,125,255,0.22)] bg-[rgba(61,125,255,0.07)] text-[#c9d8f5]',
                      )}
                    >
                      {r.content}
                      {r.attachments?.length ? (
                        <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-dim">
                          <Paperclip className="h-3 w-3" />
                          {r.attachments.join(', ')}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              {ticket.replies.length === 0 && <div className="py-6 text-center text-[11.5px] text-dim">还没有沟通记录</div>}
            </div>

            <div className="mt-5 border-t border-line-subtle pt-4">
              <Textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="输入回复内容，发送后客户会收到邮件通知…"
              />
              <div className="mt-2 flex items-center justify-between">
                <button className="flex items-center gap-1 text-[11px] text-dim hover:text-muted">
                  <Paperclip className="h-3 w-3" /> 添加附件
                </button>
                <Button size="sm" variant="primary" icon={<Send className="h-3 w-3" />} disabled={!reply.trim()} onClick={send}>
                  发送回复
                </Button>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel className="p-5">
            <div className="mb-3 text-[13px] text-ink">工单信息</div>
            <div className="divide-y divide-[#1a1f29]">
              <KV label="工单号" mono>
                {ticket.code}
              </KV>
              <KV label="类型">{ticket.type}</KV>
              <KV label="客户端">
                <Link to={`/clients/${client?.id}`} className="text-primary hover:underline">
                  {client?.shortName}
                </Link>
              </KV>
              <KV label="关联项目">
                {project ? (
                  <Link to={`/projects/${project.id}`} className="text-primary hover:underline">
                    {project.name.length > 14 ? project.name.slice(0, 14) + '…' : project.name}
                  </Link>
                ) : (
                  '—'
                )}
              </KV>
              <KV label="关联任务">
                {job ? (
                  <Link to={`/jobs/${job.id}`} className="mono text-primary hover:underline">
                    {job.code}
                  </Link>
                ) : (
                  '—'
                )}
              </KV>
              <KV label="首次响应">{formatDateTime(ticket.firstResponseAt)}</KV>
              <KV label="解决时间">{formatDateTime(ticket.resolvedAt)}</KV>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="mb-3 text-[13px] text-ink">处理人</div>
            {assignee ? (
              <div className="flex items-center gap-2.5">
                <Avatar name={assignee.name} hue={assignee.avatarHue} size={32} />
                <div>
                  <div className="text-[12.5px] text-ink">{assignee.name}</div>
                  <div className="text-[10.5px] text-dim">
                    {assignee.role} · 今日处理 {assignee.jobsToday} 个任务
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[11.5px] text-dim">尚未分派</div>
            )}
            <Select
              className="mt-3"
              value={ticket.assigneeId ?? ''}
              onChange={() => toast('info', '处理人已更新', '已通知新的处理人')}
            >
              <option value="">未分派</option>
              {team
                .filter((m) => m.role !== '只读')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.role}
                  </option>
                ))}
            </Select>
          </Panel>

          {ticket.satisfaction ? (
            <Panel className="p-5">
              <div className="mb-2 text-[13px] text-ink">客户评价</div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn('h-3.5 w-3.5', i < (ticket.satisfaction?.score ?? 0) ? 'text-warning' : 'text-[#2a3140]')}
                    fill={i < (ticket.satisfaction?.score ?? 0) ? 'currentColor' : 'none'}
                  />
                ))}
                <span className="mono ml-1 text-[12px] text-ink">{ticket.satisfaction.score}.0</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ticket.satisfaction.tags.map((t) => (
                  <Badge key={t} tone="success">
                    {t}
                  </Badge>
                ))}
              </div>
              {ticket.satisfaction.comment && <p className="mt-2 text-[11.5px] leading-5 text-muted">“{ticket.satisfaction.comment}”</p>}
            </Panel>
          ) : (
            <Panel className="p-5">
              <div className="mb-2 text-[13px] text-ink">客户评价</div>
              <div className="text-[11.5px] text-dim">工单解决后客户可提交满意度评价。</div>
            </Panel>
          )}

          <div className="rounded-lg border border-line-subtle bg-[#0e1118] p-3 text-[10.5px] leading-5 text-dim">
            升级规则：P0 超时 15 分钟升级至制片，超时 1 小时升级至技术负责人；连续两次超时将由系统自动重排优先级。
          </div>
        </div>
      </div>
    </div>
  )
}
