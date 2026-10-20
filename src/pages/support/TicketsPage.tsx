import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Segmented, Select, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AlertOctagon, Clock, MessageSquare, Paperclip, Search, Send } from 'lucide-react';
import type { Ticket } from '@/types/models';
import { TICKET_CATEGORY, TICKET_LEVEL, TICKET_STATUS } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { Avatar, EmptyState, Progress, StatusTag } from '@/components/ui';
import { clientName } from '@/mock';
import { tickets, projectName, userName } from '@/mock';
import { formatMinutes, fromNow } from '@/utils/format';

const SLA_BASE = new Date('2026-10-19T10:32:00').getTime();

export default function TicketsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scope, setScope] = useState<'open' | 'mine' | 'breached' | 'all'>('open');
  const [level, setLevel] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [reply, setReply] = useState('');

  const list = useMemo(() => {
    let arr = [...tickets];
    if (scope === 'open') arr = arr.filter((t) => !['closed', 'resolved'].includes(t.status));
    if (scope === 'breached') arr = arr.filter((t) => t.sla.breached);
    if (scope === 'mine') arr = arr.filter((t) => t.assigneeId === 'U-026' || t.assigneeId === 'U-005');
    if (level) arr = arr.filter((t) => t.level === level);
    if (keyword) arr = arr.filter((t) => t.title.includes(keyword) || t.id.includes(keyword) || t.creatorName.includes(keyword));
    return arr.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [scope, level, keyword]);

  const active = id ? tickets.find((t) => t.id === id) : undefined;

  const breached = tickets.filter((t) => t.sla.breached);
  const pending = tickets.filter((t) => t.status === 'new');
  const avgSatisfaction =
    tickets.filter((t) => t.satisfaction).reduce((s, t) => s + (t.satisfaction ?? 0), 0) /
    Math.max(1, tickets.filter((t) => t.satisfaction).length);

  const columns: ColumnsType<Ticket> = [
    {
      title: '工单',
      dataIndex: 'title',
      render: (v: string, r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusTag label={r.level} tone={TICKET_LEVEL[r.level].tone} dot={false} />
            <span style={{ fontSize: 12, fontWeight: 500 }} className="np-truncate">
              {v}
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)', marginTop: 2 }}>
            {r.id} · {clientName(r.clientId)} · {projectName(r.projectId)}
          </div>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 96,
      render: (v: Ticket['category']) => <span style={{ fontSize: 11.5 }}>{TICKET_CATEGORY[v]}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 96,
      render: (v: Ticket['status']) => <StatusTag label={TICKET_STATUS[v].label} tone={TICKET_STATUS[v].tone} />,
    },
    {
      title: 'SLA',
      width: 132,
      render: (_: unknown, r) => {
        if (['closed', 'resolved'].includes(r.status)) return <span style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>已结束</span>;
        if (r.sla.breached)
          return (
            <span style={{ fontSize: 11, color: 'var(--np-danger)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <AlertOctagon size={11} /> 已超时
            </span>
          );
        const left = (new Date(r.sla.resolveDeadline).getTime() - SLA_BASE) / 60000;
        return (
          <Tooltip title={`解决时限 ${r.sla.resolveDeadline.slice(5, 16)}`}>
            <span style={{ fontSize: 11, color: left < 120 ? 'var(--np-warning)' : 'var(--np-text-secondary)' }}>
              剩余 {formatMinutes(Math.max(0, left))}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '处理人',
      dataIndex: 'assigneeId',
      width: 96,
      render: (v: string | null) =>
        v ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }}>
            <Avatar name={userName(v)} size={18} />
            {userName(v)}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--np-danger)' }}>未指派</span>
        ),
    },
    {
      title: '更新',
      dataIndex: 'updatedAt',
      width: 86,
      render: (v: string) => <span style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>{fromNow(v)}</span>,
    },
  ];

  return (
    <div className="np-page">
      <PageHeader
        title="工单服务"
        desc={`待受理 ${pending.length} 个 · SLA 超时 ${breached.length} 个 · 满意度 ${avgSatisfaction.toFixed(1)} / 5`}
        actions={
          <>
            <Button>服务报表</Button>
            <Button type="primary">新建工单</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">未关闭</div>
          <div className="np-stat-value">{tickets.filter((t) => !['closed', 'resolved'].includes(t.status)).length}</div>
          <div className="np-stat-foot">共 {tickets.length} 个工单</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">待受理</div>
          <div className="np-stat-value" style={{ color: pending.length > 0 ? 'var(--np-danger)' : undefined }}>
            {pending.length}
          </div>
          <div className="np-stat-foot">P0 需 15 分钟内响应</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">SLA 超时</div>
          <div className="np-stat-value" style={{ color: 'var(--np-danger)' }}>{breached.length}</div>
          <div className="np-stat-foot">纳入月度服务考核</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">平均满意度</div>
          <div className="np-stat-value">{avgSatisfaction.toFixed(1)}</div>
          <div className="np-stat-foot">来自 {tickets.filter((t) => t.satisfaction).length} 条评价</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: active ? '1fr 460px' : '1fr', gap: 16, alignItems: 'start' }}>
        <SectionCard
          title="工单队列"
          sub={`${list.length} 个`}
          extra={
            <>
              <Segmented
                size="small"
                value={scope}
                onChange={(v) => setScope(v as 'open' | 'mine' | 'breached' | 'all')}
                options={[
                  { label: '未关闭', value: 'open' },
                  { label: '我负责', value: 'mine' },
                  { label: '已超时', value: 'breached' },
                  { label: '全部', value: 'all' },
                ]}
              />
              <Input
                size="small"
                allowClear
                prefix={<Search size={13} style={{ color: 'var(--np-text-tertiary)' }} />}
                placeholder="搜索工单"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ width: 150 }}
              />
              <Select
                size="small"
                allowClear
                placeholder="级别"
                value={level}
                onChange={setLevel}
                style={{ width: 96 }}
                options={Object.entries(TICKET_LEVEL).map(([k, v]) => ({ value: k, label: v.label }))}
              />
            </>
          }
          bodyStyle={{ paddingTop: 8 }}
        >
          {list.length === 0 ? (
            <EmptyState title="没有匹配的工单" desc="调整筛选条件后再试" />
          ) : (
            <Table
              rowKey="id"
              size="middle"
              columns={columns}
              dataSource={list}
              pagination={{ pageSize: 10, size: 'small', showTotal: (t) => `共 ${t} 个工单` }}
              scroll={{ x: 880 }}
              onRow={(r) => ({ onClick: () => navigate(`/support/tickets/${r.id}`), style: { cursor: 'pointer' } })}
              rowClassName={(r) => (r.id === id ? 'np-row-active' : '')}
            />
          )}
        </SectionCard>

        {active && (
          <SectionCard
            title={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <StatusTag label={active.level} tone={TICKET_LEVEL[active.level].tone} dot={false} />
                {active.id}
              </span>
            }
            extra={<Button size="small" onClick={() => navigate('/support/tickets')}>关闭</Button>}
            bodyStyle={{ maxHeight: 620, overflowY: 'auto' }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, marginBottom: 10 }}>{active.title}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11.5, marginBottom: 14 }}>
              <Field k="客户" v={clientName(active.clientId)} />
              <Field k="项目" v={projectName(active.projectId)} />
              <Field k="分类" v={TICKET_CATEGORY[active.category]} />
              <Field k="状态" v={TICKET_STATUS[active.status].label} />
              <Field k="响应时限" v={active.sla.respondDeadline.slice(5, 16)} />
              <Field k="解决时限" v={active.sla.resolveDeadline.slice(5, 16)} />
            </div>

            {active.environment && (
              <div
                style={{
                  fontSize: 11.5,
                  padding: '8px 10px',
                  background: 'var(--np-bg-subtle)',
                  borderRadius: 6,
                  marginBottom: 14,
                  color: 'var(--np-text-secondary)',
                }}
              >
                环境：{active.environment}
                {active.relatedVersion && ` · 版本 ${active.relatedVersion}`}
              </div>
            )}

            {active.sla.breached && (
              <div
                style={{
                  fontSize: 11.5,
                  padding: '8px 10px',
                  borderRadius: 6,
                  marginBottom: 14,
                  background: 'rgba(240,68,56,.07)',
                  color: 'var(--np-danger)',
                }}
              >
                <Clock size={11} style={{ marginRight: 4 }} />
                该工单已超出 SLA 时限，请优先处理并说明原因
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
              {active.messages.map((m) => (
                <div key={m.id} style={{ display: 'flex', gap: 8 }}>
                  <Avatar name={m.authorName} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
                      <span style={{ fontWeight: 500 }}>{m.authorName}</span>
                      <span style={{ color: 'var(--np-text-tertiary)' }}>
                        {m.authorType === 'client' ? '客户' : '我方'} · {fromNow(m.createdAt)}
                      </span>
                      {m.internal && <StatusTag label="内部" tone="warning" dot={false} />}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        padding: '8px 10px',
                        borderRadius: 6,
                        fontSize: 12.5,
                        lineHeight: 1.75,
                        background: m.authorType === 'client' ? 'var(--np-bg-subtle)' : 'var(--np-primary-50)',
                        color: 'var(--np-text-secondary)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.content}
                    </div>
                    {m.attachments.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                        {m.attachments.map((a) => (
                          <span
                            key={a.name}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: 10.5,
                              color: 'var(--np-text-tertiary)',
                              border: '1px solid var(--np-border)',
                              borderRadius: 3,
                              padding: '1px 5px',
                            }}
                          >
                            <Paperclip size={9} />
                            {a.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
              <Input.TextArea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="输入回复，Shift + Enter 换行"
                autoSize={{ minRows: 2, maxRows: 4 }}
                style={{ fontSize: 12.5 }}
              />
              <Button type="primary" icon={<Send size={13} />} disabled={!reply.trim()} onClick={() => setReply('')}>
                发送
              </Button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12, fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>
              <MessageSquare size={12} />
              共 {active.messages.length} 条沟通记录
            </div>

            {active.satisfaction && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)', marginBottom: 4 }}>
                  客户满意度 {active.satisfaction} / 5
                </div>
                <Progress value={(active.satisfaction / 5) * 100} height={5} />
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div style={{ color: 'var(--np-text-tertiary)', marginBottom: 1 }}>{k}</div>
      <div>{v}</div>
    </div>
  );
}
