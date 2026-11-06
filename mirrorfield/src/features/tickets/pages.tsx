import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Input, Modal, Select, Tag, message } from 'antd'
import {
  ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, EnvironmentOutlined,
  PlusOutlined, SwapOutlined, UserOutlined,
} from '@ant-design/icons'
import { EmptyState, Field, MetricRow, PageHeader, SectionCard, StatusTag } from '@/components/ui'
import { api } from '@/services'
import { PRIORITY_COLOR, TICKET_STATUS, fmtDateTime, fromNow } from '@/utils'
import type { Ticket, TicketStatus } from '@/types'

const COLUMNS: TicketStatus[] = ['PENDING', 'ASSIGNED', 'PROCESSING', 'VERIFYING', 'DONE']

export function Board() {
  const nav = useNavigate()
  const [tick, setTick] = useState(0)
  const tickets = useMemo(() => api.tickets.all(), [tick])
  const [dragId, setDragId] = useState<string | null>(null)
  const [move, setMove] = useState<{ id: string; to: TicketStatus } | null>(null)
  const [note, setNote] = useState('')

  const byStatus = (s: TicketStatus) => tickets.filter((t) => t.status === s)

  const doMove = () => {
    if (!move) return
    api.tickets.move(move.id, move.to, note || '看板流转')
    setMove(null)
    setNote('')
    setTick((t) => t + 1)
    message.success('工单状态已更新')
  }

  return (
    <div>
      <PageHeader
        title="工单中心"
        desc="巡检异常、三维标注与客户反馈统一进入工单池，按 SLA 时限流转。拖拽卡片可变更状态，流转需填写处理说明。"
        extra={
          <>
            <Select size="small" defaultValue="all" style={{ width: 120 }} options={[{ value: 'all', label: '全部项目' }, { value: 'p1', label: '滨江园区一期' }]} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { api.tickets.create({ title: '新建工单（手工）', description: '由工单中心手工创建' }); setTick((t) => t + 1); message.success('工单已创建') }}>新建工单</Button>
          </>
        }
      />

      <div className="grid grid-cols-5 gap-3" style={{ marginBottom: 12 }}>
        <MetricRow items={[
          { label: '工单总数', value: tickets.length },
          { label: '待派单', value: byStatus('PENDING').length, color: 'var(--warn)' },
          { label: '处理中', value: byStatus('PROCESSING').length, color: 'var(--brand)' },
          { label: '超时预警', value: tickets.filter((t) => t.status !== 'DONE' && new Date(t.sla).getTime() < Date.now()).length, color: 'var(--danger)' },
        ]} />
        <SectionCard padding={12}>
          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>SLA 达成率</div>
          <div className="num" style={{ fontSize: 24, fontWeight: 600, color: 'var(--ok)', marginTop: 4 }}>93.7%</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>近 30 天 212 单</div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {COLUMNS.map((c) => (
          <div
            key={c}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId) {
                const t = tickets.find((x) => x.id === dragId)
                if (t && t.status !== c) setMove({ id: dragId, to: c })
                setDragId(null)
              }
            }}
            style={{ minHeight: 400 }}
          >
            <div className="flex items-center justify-between" style={{ padding: '0 2px 8px' }}>
              <StatusTag map={TICKET_STATUS} value={c} />
              <span className="num" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{byStatus(c).length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {byStatus(c).slice(0, 7).map((t) => {
                const late = t.status !== 'DONE' && new Date(t.sla).getTime() < Date.now()
                return (
                  <div
                    key={t.id}
                    className="card"
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    onClick={() => nav(`/tickets/${t.id}`)}
                    style={{ padding: 11, cursor: 'pointer', borderLeft: `3px solid ${PRIORITY_COLOR[t.priority]}` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="num" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{t.id}</span>
                      <Tag color={t.priority === '高' ? 'red' : t.priority === '中' ? 'gold' : 'default'} style={{ fontSize: 9, marginInlineEnd: 0, lineHeight: '15px', paddingInline: 4 }}>
                        {t.priority}
                      </Tag>
                    </div>
                    <div style={{ fontSize: 12.2, lineHeight: 1.55, marginTop: 6, height: 38, overflow: 'hidden' }}>{t.title}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <EnvironmentOutlined style={{ fontSize: 9 }} /> {t.location}
                    </div>
                    <div className="flex items-center justify-between" style={{ marginTop: 8, fontSize: 10 }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>{t.assignee || '未指派'}</span>
                      <span style={{ color: late ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                        {late ? '已超时 ' : 'SLA '}{fromNow(t.sla).replace('后', '')}
                      </span>
                    </div>
                  </div>
                )
              })}
              {byStatus(c).length === 0 && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', padding: '30px 0', border: '1px dashed var(--border)', borderRadius: 8 }}>暂无工单</div>}
            </div>
          </div>
        ))}
      </div>

      <Modal title="流转工单" open={!!move} onCancel={() => setMove(null)} onOk={doMove} okText="确认流转" width={440}>
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 10 }}>
          {move && `${move.id} → ${TICKET_STATUS[move.to].label}，请填写处理说明`}
        </div>
        <Input.TextArea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="如：已到达现场，确认渗漏点位置，安排防水班组处理" />
      </Modal>
    </div>
  )
}

export function Detail() {
  const { id } = useParams()
  const nav = useNavigate()
  const ticket = api.tickets.get(id ?? '')
  const [tick, setTick] = useState(0)
  void tick
  if (!ticket) return <EmptyState text="工单不存在" action={<Button onClick={() => nav('/tickets')}>返回看板</Button>} />
  const t: Ticket = api.tickets.get(id ?? '') ?? ticket
  const late = t.status !== 'DONE' && new Date(t.sla).getTime() < Date.now()

  const advance = () => {
    const next: Record<TicketStatus, TicketStatus> = {
      PENDING: 'ASSIGNED', ASSIGNED: 'PROCESSING', PROCESSING: 'VERIFYING', VERIFYING: 'DONE', DONE: 'DONE',
    }
    api.tickets.move(t.id, next[t.status], '详情页操作流转')
    setTick((x) => x + 1)
    message.success('已流转至' + TICKET_STATUS[next[t.status]].label)
  }

  return (
    <div>
      <PageHeader
        title={t.title}
        desc={`${t.id} · 来源 ${t.source} · 创建于 ${fmtDateTime(t.createdAt)} · 创建人 ${t.createdBy}`}
        tags={
          <>
            <StatusTag map={TICKET_STATUS} value={t.status} />
            <Tag color={t.priority === '高' ? 'red' : t.priority === '中' ? 'gold' : 'default'}>优先级 {t.priority}</Tag>
            {late && <Tag color="red">SLA 已超时</Tag>}
          </>
        }
        extra={
          <>
            <Button icon={<ArrowLeftOutlined />} onClick={() => nav('/tickets')}>返回</Button>
            <Button icon={<SwapOutlined />} onClick={() => nav('/inspect/defects')}>查看缺陷</Button>
            <Button type="primary" icon={<CheckCircleOutlined />} disabled={t.status === 'DONE'} onClick={advance}>
              {t.status === 'PENDING' ? '派单' : t.status === 'VERIFYING' ? '验收通过' : '进入下一状态'}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8">
          <SectionCard title="工单描述">
            <div style={{ fontSize: 12.5, lineHeight: 1.9, color: 'var(--text-secondary)' }}>{t.description}</div>
            <div className="grid grid-cols-3 gap-3" style={{ marginTop: 14 }}>
              {['现场照片 1', '现场照片 2', '缺陷截图'].map((x) => (
                <div key={x} style={{ height: 96, borderRadius: 6, border: '1px solid var(--border)', background: 'linear-gradient(135deg,#101d2e,#0a1421)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, color: 'var(--text-tertiary)' }}>{x}</div>
              ))}
            </div>
          </SectionCard>

          <div style={{ marginTop: 12 }}>
            <SectionCard title="处理时间线">
              {t.events.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 130, fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }} className="num">{fmtDateTime(e.at)}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ width: 7, height: 7, borderRadius: 4, background: i === t.events.length - 1 ? 'var(--brand)' : 'var(--border-strong)', marginTop: 5 }} />
                    {i !== t.events.length - 1 && <span style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 3 }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 16 }}>
                    <div style={{ fontSize: 12.3 }}>{e.actor} · {e.action}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>{e.note}</div>
                  </div>
                </div>
              ))}
            </SectionCard>
          </div>
        </div>

        <div className="col-span-4">
          <SectionCard title="属性">
            <div className="grid grid-cols-1 gap-1">
              <Field label="工单号">{t.id}</Field>
              <Field label="状态"><StatusTag map={TICKET_STATUS} value={t.status} /></Field>
              <Field label="来源">{t.source}</Field>
              <Field label="处理人">{t.assignee || '待指派'}</Field>
              <Field label="所属位置">{t.location}</Field>
              <Field label="关联建筑">{t.buildingCode}</Field>
              <Field label="SLA 截止"><span style={{ color: late ? 'var(--danger)' : undefined }}>{fmtDateTime(t.sla)}</span></Field>
            </div>
            <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: late ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.06)', border: `1px solid ${late ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.2)'}`, fontSize: 11.5, lineHeight: 1.7 }}>
              <ClockCircleOutlined style={{ marginRight: 5 }} />
              {late ? `已超出 SLA ${Math.round((Date.now() - new Date(t.sla).getTime()) / 3600000)} 小时，请尽快处理` : `距离 SLA 截止还有 ${Math.round((new Date(t.sla).getTime() - Date.now()) / 3600000)} 小时`}
            </div>
          </SectionCard>

          <div style={{ marginTop: 12 }}>
            <SectionCard title="三维定位">
              <div style={{ height: 150, borderRadius: 6, background: 'radial-gradient(ellipse at 50% 40%, #13324d 0%, #070b14 78%)', position: 'relative', overflow: 'hidden' }}>
                <svg viewBox="0 0 300 150" style={{ width: '100%', height: '100%' }}>
                  <rect x="60" y="50" width="90" height="60" fill="rgba(34,211,238,0.1)" stroke="rgba(34,211,238,0.4)" />
                  <rect x="170" y="62" width="60" height="48" fill="rgba(148,163,184,0.08)" stroke="rgba(148,163,184,0.3)" />
                  <circle cx="105" cy="40" r="5" fill="#F87171" />
                  <circle cx="105" cy="40" r="12" fill="none" stroke="#F87171" strokeWidth="1" opacity="0.5" />
                  <text x="115" y="44" fontSize="9" fill="#F87171">{t.buildingCode}</text>
                </svg>
              </div>
              <Button block size="small" style={{ marginTop: 10 }} onClick={() => nav(`/recon/viewer?focus=${t.buildingCode}`)}>在三维中定位</Button>
            </SectionCard>
          </div>

          <div style={{ marginTop: 12 }}>
            <SectionCard title="指派">
              <Select size="small" style={{ width: '100%' }} defaultValue={t.assignee || undefined} placeholder="选择处理人" onChange={() => message.success('已重新指派')} options={['赵敏', '韩雪', '曹磊', '邓超'].map((x) => ({ value: x, label: x }))} suffixIcon={<UserOutlined />} />
              <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 8 }}>转派后会通知新处理人，并重置响应计时。</div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}

export default { Board, Detail }
