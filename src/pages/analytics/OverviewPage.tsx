import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Segmented, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Download } from 'lucide-react';
import { CHANNELS } from '@/types/enums';
import type { ChannelId } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { BaseChart } from '@/components/BaseChart';
import { Delta, Progress, Sparkline, StatusTag } from '@/components/ui';
import { StatCard } from '@/components/StatCard';
import { byChannel, dailyMetrics, dailyTotals, projects, projectMetric } from '@/mock';
import { formatInt, formatMoney, formatPercent } from '@/utils/format';

export default function OverviewPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const days = useMemo(() => dailyTotals.slice(-range), [range]);
  const prev = useMemo(() => dailyTotals.slice(-range * 2, -range), [range]);

  const sum = (arr: typeof days, key: 'dau' | 'revenue' | 'newUsers') => arr.reduce((s, d) => s + d[key], 0);
  const avg = sum(days, 'dau') / Math.max(1, days.length);
  const prevAvg = sum(prev, 'dau') / Math.max(1, prev.length);
  const revenue = sum(days, 'revenue');
  const prevRevenue = sum(prev, 'revenue');
  const newUsers = sum(days, 'newUsers');
  const arpu = revenue / Math.max(1, avg);

  const retention = useMemo(() => {
    const slice = dailyMetrics.slice(-range * 10);
    const f = (k: 'retention1' | 'retention3' | 'retention7' | 'retention30') =>
      slice.reduce((s, m) => s + m[k], 0) / Math.max(1, slice.length);
    return { d1: f('retention1'), d3: f('retention3'), d7: f('retention7'), d30: f('retention30') };
  }, [range]);

  const payRate = useMemo(() => {
    const slice = dailyMetrics.slice(-range * 10);
    return slice.reduce((s, m) => s + m.payRate, 0) / Math.max(1, slice.length);
  }, [range]);

  const trendOption = useMemo(
    () => ({
      legend: { data: ['DAU', '收入'] },
      grid: { left: 4, right: 8, top: 30, bottom: 4, containLabel: true },
      xAxis: { type: 'category' as const, data: days.map((d) => d.date.slice(5)), boundaryGap: false },
      yAxis: [
        { type: 'value' as const, name: 'DAU', nameTextStyle: { fontSize: 10 }, axisLabel: { formatter: (v: number) => `${Math.round(v / 10000)}万` } },
        { type: 'value' as const, name: '收入', nameTextStyle: { fontSize: 10 }, axisLabel: { formatter: (v: number) => `${Math.round(v / 10000)}万` }, splitLine: { show: false } },
      ],
      tooltip: {
        trigger: 'axis' as const,
        valueFormatter: (v: unknown) => formatInt(Number(v)),
      },
      series: [
        {
          name: 'DAU',
          type: 'line' as const,
          data: days.map((d) => d.dau),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#4C8DFF' },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(76,141,255,.18)' },
                { offset: 1, color: 'rgba(76,141,255,0)' },
              ],
            },
          },
        },
        {
          name: '收入',
          type: 'line' as const,
          yAxisIndex: 1,
          data: days.map((d) => d.revenue),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1.8, color: '#17B26A', type: 'dashed' as const },
        },
      ],
    }),
    [days],
  );

  const channelRows = useMemo(() => {
    const list = byChannel(range);
    const totalDau = list.reduce((s, c) => s + c.dau, 0);
    return list.map((c) => ({ ...c, share: c.dau / Math.max(1, totalDau) }));
  }, [range]);

  const channelColumns: ColumnsType<(typeof channelRows)[number]> = [
    {
      title: '渠道',
      dataIndex: 'channel',
      render: (v: ChannelId) => <span style={{ fontSize: 12 }}>{CHANNELS[v].name}</span>,
    },
    {
      title: 'DAU 贡献',
      dataIndex: 'dau',
      width: 160,
      render: (v: number, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 70 }}>
            <Progress value={r.share * 100} height={4} />
          </div>
          <span className="np-num" style={{ fontSize: 11.5 }}>{formatInt(v)}</span>
          <span style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>{formatPercent(r.share, 1)}</span>
        </div>
      ),
    },
    {
      title: '收入',
      dataIndex: 'revenue',
      width: 110,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{formatMoney(v, false)}</span>,
    },
    {
      title: 'ARPU',
      width: 90,
      align: 'right',
      render: (_: unknown, r) => (
        <span className="np-num" style={{ fontSize: 11.5 }}>¥{(r.revenue / Math.max(1, r.dau)).toFixed(2)}</span>
      ),
    },
    {
      title: '审核时长',
      dataIndex: 'channel',
      width: 92,
      render: (v: ChannelId) => <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>{CHANNELS[v].reviewHours}h</span>,
    },
    {
      title: '包体上限',
      dataIndex: 'channel',
      width: 92,
      render: (v: ChannelId) =>
        CHANNELS[v].limitMB > 0 ? (
          <span style={{ fontSize: 11.5 }}>{CHANNELS[v].limitMB} MB</span>
        ) : (
          <StatusTag label="无限制" tone="default" dot={false} />
        ),
    },
  ];

  const projectRows = useMemo(
    () =>
      projects
        .map((p) => {
          const m = projectMetric(p.id, range);
          return { ...p, dau: m.dau, revenue: m.revenue };
        })
        .filter((p) => p.dau > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
    [range],
  );

  const projectColumns: ColumnsType<(typeof projectRows)[number]> = [
    {
      title: '项目',
      dataIndex: 'name',
      render: (v: string, r) => (
        <div>
          <div style={{ fontSize: 12.5 }}>{v}</div>
          <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>
            {r.code} · {r.currentVersion}
          </div>
        </div>
      ),
    },
    {
      title: 'DAU',
      dataIndex: 'dau',
      width: 100,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{formatInt(v)}</span>,
    },
    {
      title: '收入',
      dataIndex: 'revenue',
      width: 110,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{formatMoney(v, false)}</span>,
    },
    {
      title: '趋势',
      width: 100,
      render: (_: unknown, r) => {
        const spark = Array.from({ length: 12 }, (_, i) => Math.round(r.dau * (0.86 + ((i * 7 + r.name.length) % 20) / 90)));
        return <Sparkline data={spark} width={80} height={24} />;
      },
    },
    {
      title: '',
      width: 54,
      render: (_: unknown, r) => (
        <Button type="link" size="small" onClick={() => navigate(`/projects/${r.id}`)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="np-page">
      <PageHeader
        title="数据分析"
        desc={`全站 ${projects.length} 个项目 · ${channelRows.length} 个渠道 · 数据截至 2026-10-19 13:30`}
        actions={
          <>
            <Segmented
              size="small"
              value={String(range)}
              onChange={(v) => setRange(Number(v) as 7 | 30 | 90)}
              options={[
                { label: '近 7 天', value: '7' },
                { label: '近 30 天', value: '30' },
                { label: '近 90 天', value: '90' },
              ]}
            />
            <Button icon={<Download size={13} />}>导出</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <StatCard
          label="日均活跃"
          value={formatInt(avg)}
          delta={(avg - prevAvg) / Math.max(1, prevAvg)}
          spark={days.slice(-14).map((d) => d.dau)}
          foot={<span>对比上一个 {range} 天</span>}
        />
        <StatCard
          label="周期收入"
          value={formatMoney(revenue, false)}
          delta={(revenue - prevRevenue) / Math.max(1, prevRevenue)}
          spark={days.slice(-14).map((d) => d.revenue)}
          sparkColor="#17B26A"
          foot={<span>ARPU ¥{arpu.toFixed(2)}</span>}
        />
        <StatCard
          label="新增用户"
          value={formatInt(newUsers)}
          delta={(newUsers - sum(prev, 'newUsers')) / Math.max(1, sum(prev, 'newUsers'))}
          spark={days.slice(-14).map((d) => d.newUsers)}
          sparkColor="#8B5CF6"
          foot={<span>日均 {formatInt(newUsers / Math.max(1, range))}</span>}
        />
        <StatCard
          label="付费率"
          value={formatPercent(payRate, 2)}
          delta={0.031}
          foot={<span>行业均值 3.2%</span>}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start', marginBottom: 16 }}>
        <SectionCard title="活跃与收入趋势" sub={`近 ${range} 天`}>
          <BaseChart option={trendOption} height={280} />
        </SectionCard>

        <SectionCard title="留存漏斗" sub="新用户次日到 30 日">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { k: '次日留存', v: retention.d1, base: 1 },
              { k: '3 日留存', v: retention.d3, base: retention.d1 },
              { k: '7 日留存', v: retention.d7, base: retention.d3 },
              { k: '30 日留存', v: retention.d30, base: retention.d7 },
            ].map((r) => (
              <div key={r.k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{r.k}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span className="np-num">{formatPercent(r.v, 1)}</span>
                    <Delta value={r.v - 0.001} />
                  </span>
                </div>
                <Progress value={(r.v / 0.5) * 100} height={6} />
                <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)', marginTop: 2 }}>
                  阶段转化 {formatPercent(r.v / Math.max(0.0001, r.base), 0)}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard title="渠道表现" sub={`近 ${range} 天`} bodyStyle={{ paddingTop: 8 }}>
          <Table
            rowKey="channel"
            size="middle"
            columns={channelColumns}
            dataSource={channelRows}
            pagination={false}
            scroll={{ x: 620 }}
          />
        </SectionCard>

        <SectionCard title="项目排行" sub="按周期收入" bodyStyle={{ paddingTop: 8 }}>
          <Table
            rowKey="id"
            size="middle"
            columns={projectColumns}
            dataSource={projectRows}
            pagination={false}
            scroll={{ x: 520 }}
          />
        </SectionCard>
      </div>
    </div>
  );
}
