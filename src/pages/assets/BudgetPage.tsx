import { useMemo, useState } from 'react';
import { Button, Segmented, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AlertTriangle, Wallet } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/layout';
import { BaseChart } from '@/components/BaseChart';
import { Progress, StatusTag } from '@/components/ui';
import { projects, users } from '@/mock';
import { formatMoney, formatPercent } from '@/utils/format';

interface Row {
  id: string;
  name: string;
  code: string;
  contractAmount: number;
  cost: number;
  margin: number;
  marginRate: number;
  manDays: number;
  budgetManDays: number;
  status: 'healthy' | 'watch' | 'over';
}

const DAY_RATE = 1350;

export default function BudgetPage() {
  const [scope, setScope] = useState<'all' | 'active' | 'risk'>('all');

  const rows = useMemo<Row[]>(() => {
    const list = projects.map((p) => {
      const team = p.memberIds.length || 3;
      const months = Math.max(
        1,
        Math.round((new Date(p.plannedEndDate).getTime() - new Date(p.startDate).getTime()) / (86400000 * 30)),
      );
      const manDays = Math.round(team * months * 21 * (p.progress / 100) * 1.12);
      const budgetManDays = Math.round(team * months * 21);
      const cost = manDays * DAY_RATE;
      const margin = p.contractAmount - cost;
      const rate = margin / Math.max(1, p.contractAmount);
      return {
        id: p.id,
        name: p.name,
        code: p.code,
        contractAmount: p.contractAmount,
        cost,
        margin,
        marginRate: rate,
        manDays,
        budgetManDays,
        status: (rate < 0.12 ? 'over' : rate < 0.3 ? 'watch' : 'healthy') as Row['status'],
      };
    });
    if (scope === 'active') return list.filter((r) => r.margin > 0);
    if (scope === 'risk') return list.filter((r) => r.status !== 'healthy');
    return list;
  }, [scope]);

  const totalContract = rows.reduce((s, r) => s + r.contractAmount, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalMargin = totalContract - totalCost;
  const avgRate = totalMargin / Math.max(1, totalContract);
  const riskCount = projects.filter((p) => {
    const r = rows.find((x) => x.id === p.id);
    return r && r.status === 'over';
  }).length;

  const monthlyOption = useMemo(() => {
    const months = ['05', '06', '07', '08', '09', '10'];
    const revenue = months.map((_, i) => Math.round((totalContract / 9) * (0.55 + ((i * 3) % 5) / 14)));
    const cost = revenue.map((v, i) => Math.round(v * (0.58 + ((i * 2) % 4) / 22)));
    return {
      legend: { data: ['确认收入', '人力成本'] },
      grid: { left: 4, right: 8, top: 30, bottom: 4, containLabel: true },
      xAxis: { type: 'category' as const, data: months.map((m) => `${m} 月`) },
      yAxis: { type: 'value' as const, axisLabel: { formatter: (v: number) => `${Math.round(v / 10000)}万` } },
      tooltip: { trigger: 'axis' as const, valueFormatter: (v: unknown) => formatMoney(Number(v)) },
      series: [
        { name: '确认收入', type: 'bar' as const, data: revenue, barWidth: '32%', itemStyle: { color: '#4C8DFF', borderRadius: [3, 3, 0, 0] } },
        { name: '人力成本', type: 'bar' as const, data: cost, barWidth: '32%', itemStyle: { color: '#98A2B3', borderRadius: [3, 3, 0, 0] } },
      ],
    };
  }, [totalContract]);

  const columns: ColumnsType<Row> = [
    {
      title: '项目',
      dataIndex: 'name',
      render: (v: string, r) => (
        <div>
          <div style={{ fontSize: 12.5 }}>{v}</div>
          <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>{r.code}</div>
        </div>
      ),
    },
    {
      title: '合同额',
      dataIndex: 'contractAmount',
      width: 108,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{formatMoney(v, false)}</span>,
    },
    {
      title: '人力成本',
      dataIndex: 'cost',
      width: 108,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{formatMoney(v, false)}</span>,
    },
    {
      title: '毛利',
      dataIndex: 'margin',
      width: 108,
      align: 'right',
      render: (v: number) => (
        <span className="np-num" style={{ fontSize: 11.5, color: v < 0 ? 'var(--np-danger)' : 'var(--np-success)' }}>
          {formatMoney(v, false)}
        </span>
      ),
    },
    {
      title: '毛利率',
      dataIndex: 'marginRate',
      width: 132,
      render: (v: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 56 }}>
            <Progress value={Math.max(0, v * 100)} height={4} color={v < 0.12 ? 'var(--np-danger)' : v < 0.3 ? 'var(--np-warning)' : 'var(--np-success)'} />
          </div>
          <span className="np-num" style={{ fontSize: 11.5 }}>{formatPercent(v, 1)}</span>
        </div>
      ),
    },
    {
      title: '人天消耗',
      width: 150,
      render: (_: unknown, r) => (
        <div>
          <div style={{ fontSize: 11.5 }}>
            {r.manDays} / {r.budgetManDays} 人天
          </div>
          <div style={{ marginTop: 3, width: 96 }}>
            <Progress value={(r.manDays / Math.max(1, r.budgetManDays)) * 100} height={3} />
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 96,
      render: (v: Row['status']) => (
        <StatusTag
          label={v === 'healthy' ? '健康' : v === 'watch' ? '关注' : '亏损风险'}
          tone={v === 'healthy' ? 'success' : v === 'watch' ? 'warning' : 'danger'}
        />
      ),
    },
  ];

  return (
    <div className="np-page">
      <PageHeader
        title="成本与预算"
        desc={`人天单价 ¥${DAY_RATE} · 团队在册 ${users.length} 人 · 数据为近似估算，用于经营决策参考`}
        actions={
          <>
            <Segmented
              size="small"
              value={scope}
              onChange={(v) => setScope(v as 'all' | 'active' | 'risk')}
              options={[
                { label: '全部项目', value: 'all' },
                { label: '盈利项目', value: 'active' },
                { label: '需关注', value: 'risk' },
              ]}
            />
            <Button icon={<Wallet size={13} />}>录入成本</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">合同总额</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{formatMoney(totalContract, false)}</div>
          <div className="np-stat-foot">{rows.length} 个项目</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">人力成本</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{formatMoney(totalCost, false)}</div>
          <div className="np-stat-foot">按已投入人天折算</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">预估毛利</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{formatMoney(totalMargin, false)}</div>
          <div className="np-stat-foot">毛利率 {formatPercent(avgRate, 1)}</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">亏损风险</div>
          <div className="np-stat-value" style={{ color: riskCount > 0 ? 'var(--np-danger)' : undefined }}>
            {riskCount}
          </div>
          <div className="np-stat-foot" style={{ color: riskCount > 0 ? 'var(--np-danger)' : undefined }}>
            {riskCount > 0 ? '毛利率低于 12%' : '整体健康'}
          </div>
        </div>
      </div>

      <SectionCard title="收支趋势" sub="近 6 个月" style={{ marginBottom: 16 }}>
        <BaseChart option={monthlyOption} height={250} />
      </SectionCard>

      <SectionCard title="项目预算执行" sub={`${rows.length} 个项目`} bodyStyle={{ paddingTop: 8 }}>
        <Table
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10, size: 'small', showTotal: (t) => `共 ${t} 个项目` }}
          scroll={{ x: 980 }}
        />
      </SectionCard>

      {riskCount > 0 && (
        <div style={{ marginTop: 16 }}>
          <SectionCard title="经营预警" extra={<StatusTag label={`${riskCount} 个项目`} tone="danger" />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rows
                .filter((r) => r.status === 'over')
                .map((r) => (
                  <div key={r.id} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <AlertTriangle size={14} style={{ color: 'var(--np-danger)', marginTop: 2, flexShrink: 0 }} />
                    <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--np-text-secondary)' }}>
                      <b style={{ fontWeight: 500 }}>{r.name}</b> 毛利率仅 {formatPercent(r.marginRate, 1)}，已消耗{' '}
                      {r.manDays} 人天（预算 {r.budgetManDays}）。建议压缩非核心需求范围，或与客户协商变更工作量。
                    </div>
                  </div>
                ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
