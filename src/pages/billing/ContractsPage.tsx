import { useMemo, useState } from 'react';
import { Button, Drawer, Segmented, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AlertTriangle, CheckCircle2, Clock, Wallet } from 'lucide-react';
import type { Contract } from '@/types/models';
import { PageHeader, SectionCard } from '@/components/layout';
import { Progress, StatusTag } from '@/components/ui';
import { clientName, contracts, contractsById, projectName } from '@/mock';
import { formatDate, formatMoney, formatPercent } from '@/utils/format';

const TYPE_LABEL: Record<Contract['type'], string> = {
  fixed: '固定总价',
  man_day: '人天计费',
  revenue_share: '流水分成',
};

const STATUS_MAP = {
  draft: { label: '草稿', tone: 'default' as const },
  active: { label: '履行中', tone: 'info' as const },
  renewing: { label: '续约中', tone: 'warning' as const },
  closed: { label: '已结束', tone: 'success' as const },
};

const MS_MAP = {
  pending: { label: '待开票', tone: 'default' as const },
  invoiced: { label: '已开票', tone: 'info' as const },
  received: { label: '已回款', tone: 'success' as const },
  overdue: { label: '已逾期', tone: 'danger' as const },
};

export default function ContractsPage() {
  const [scope, setScope] = useState<'all' | 'active' | 'overdue'>('all');
  const [activeId, setActiveId] = useState<string | null>(null);

  const list = useMemo(() => {
    if (scope === 'active') return contracts.filter((c) => c.status === 'active' || c.status === 'renewing');
    if (scope === 'overdue') return contracts.filter((c) => c.milestones.some((m) => m.status === 'overdue'));
    return contracts;
  }, [scope]);

  const totalAmount = contracts.reduce((s, c) => s + c.amount, 0);
  const totalReceived = contracts.reduce((s, c) => s + c.received, 0);
  const overdueAmount = contracts
    .flatMap((c) => c.milestones.filter((m) => m.status === 'overdue'))
    .reduce((s, m) => s + m.amount, 0);
  const active = activeId ? contractsById.get(activeId) : undefined;

  const columns: ColumnsType<Contract> = [
    {
      title: '合同',
      dataIndex: 'id',
      width: 168,
      render: (v: string, r) => (
        <div>
          <div className="np-mono-sm" style={{ fontSize: 11.5 }}>{v}</div>
          <div style={{ fontSize: 12.5, marginTop: 1 }}>{clientName(r.clientId)}</div>
        </div>
      ),
    },
    {
      title: '关联项目',
      dataIndex: 'projectIds',
      render: (v: string[]) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {v.slice(0, 2).map((p) => (
            <span key={p} style={{ fontSize: 11.5, color: 'var(--np-text-secondary)' }}>
              {projectName(p)}
            </span>
          ))}
          {v.length > 2 && <span style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>+{v.length - 2} 个</span>}
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 96,
      render: (v: Contract['type']) => <span style={{ fontSize: 11.5 }}>{TYPE_LABEL[v]}</span>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 110,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{formatMoney(v, false)}</span>,
    },
    {
      title: '回款进度',
      dataIndex: 'received',
      width: 168,
      render: (v: number, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 66 }}>
            <Progress value={(v / Math.max(1, r.amount)) * 100} height={4} />
          </div>
          <span className="np-num" style={{ fontSize: 11 }}>
            {formatPercent(v / Math.max(1, r.amount), 0)}
          </span>
          <span style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>{formatMoney(v, false)}</span>
        </div>
      ),
    },
    {
      title: '有效期',
      dataIndex: 'signDate',
      width: 152,
      render: (v: string, r) => (
        <span style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>
          {formatDate(v)} → {formatDate(r.expireDate)}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 96,
      render: (v: Contract['status']) => <StatusTag label={STATUS_MAP[v].label} tone={STATUS_MAP[v].tone} />,
    },
    {
      title: '',
      width: 54,
      render: (_: unknown, r) => (
        <Button type="link" size="small" onClick={() => setActiveId(r.id)}>
          明细
        </Button>
      ),
    },
  ];

  return (
    <div className="np-page">
      <PageHeader
        title="合同与回款"
        desc={`${contracts.length} 份合同 · 累计签约 ${formatMoney(totalAmount)} · 已回款 ${formatMoney(totalReceived)}`}
        actions={
          <>
            <Segmented
              size="small"
              value={scope}
              onChange={(v) => setScope(v as 'all' | 'active' | 'overdue')}
              options={[
                { label: '全部', value: 'all' },
                { label: '履行中', value: 'active' },
                { label: '有逾期', value: 'overdue' },
              ]}
            />
            <Button icon={<Wallet size={13} />}>登记回款</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">合同总额</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{formatMoney(totalAmount, false)}</div>
          <div className="np-stat-foot">覆盖 {contracts.reduce((s, c) => s + c.projectIds.length, 0)} 个项目</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">已回款</div>
          <div className="np-stat-value" style={{ fontSize: 22, color: 'var(--np-success)' }}>
            {formatMoney(totalReceived, false)}
          </div>
          <div className="np-stat-foot">回款率 {formatPercent(totalReceived / Math.max(1, totalAmount), 1)}</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">待回款</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{formatMoney(totalAmount - totalReceived, false)}</div>
          <div className="np-stat-foot">按合同节点分批收取</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">逾期金额</div>
          <div className="np-stat-value" style={{ fontSize: 22, color: overdueAmount > 0 ? 'var(--np-danger)' : undefined }}>
            {formatMoney(overdueAmount, false)}
          </div>
          <div className="np-stat-foot" style={{ color: overdueAmount > 0 ? 'var(--np-danger)' : undefined }}>
            {overdueAmount > 0 ? '需商务跟进催收' : '暂无逾期'}
          </div>
        </div>
      </div>

      <SectionCard title="合同列表" sub={`${list.length} 份`} bodyStyle={{ paddingTop: 8 }}>
        <Table
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={list}
          pagination={{ pageSize: 10, size: 'small', showTotal: (t) => `共 ${t} 份合同` }}
          scroll={{ x: 1000 }}
          onRow={(r) => ({ onClick: () => setActiveId(r.id), style: { cursor: 'pointer' } })}
        />
      </SectionCard>

      <Drawer
        open={!!active}
        width={560}
        onClose={() => setActiveId(null)}
        title={active && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span className="np-mono-sm">{active.id}</span>
          <StatusTag label={STATUS_MAP[active.status].label} tone={STATUS_MAP[active.status].tone} />
        </span>}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setActiveId(null)}>关闭</Button>
            <Button type="primary">开票</Button>
          </div>
        }
      >
        {active && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
              <Field k="客户" v={clientName(active.clientId)} />
              <Field k="计费方式" v={TYPE_LABEL[active.type]} />
              <Field k="合同金额" v={formatMoney(active.amount)} />
              <Field k="已回款" v={formatMoney(active.received)} />
              <Field k="签署日期" v={active.signDate} />
              <Field k="到期日期" v={active.expireDate} />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>关联项目</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12, color: 'var(--np-text-secondary)' }}>
                {active.projectIds.map((p) => (
                  <span key={p}>{projectName(p)}</span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>付款节点</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {active.milestones.map((m, i) => {
                  const Icon = m.status === 'received' ? CheckCircle2 : m.status === 'overdue' ? AlertTriangle : Clock;
                  const color =
                    m.status === 'received' ? 'var(--np-success)' : m.status === 'overdue' ? 'var(--np-danger)' : 'var(--np-text-disabled)';
                  return (
                    <div key={m.name} style={{ display: 'flex', gap: 10 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
                        <Icon size={14} style={{ color, flexShrink: 0 }} />
                        {i < active.milestones.length - 1 && (
                          <div style={{ width: 1.5, flex: 1, minHeight: 26, background: 'var(--np-border)' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, paddingBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12.5 }}>{m.name}</span>
                          <StatusTag label={MS_MAP[m.status].label} tone={MS_MAP[m.status].tone} dot={false} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)', marginTop: 2 }}>
                          {formatPercent(m.ratio, 0)} · {formatMoney(m.amount)} · 计划 {m.plannedDate}
                          {m.receivedDate && ` · 实收 ${m.receivedDate}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>回款进度</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <Progress value={(active.received / Math.max(1, active.amount)) * 100} height={7} />
                </div>
                <span className="np-num" style={{ fontSize: 12 }}>
                  {formatPercent(active.received / Math.max(1, active.amount), 1)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)', marginBottom: 2 }}>{k}</div>
      <div>{v}</div>
    </div>
  );
}
