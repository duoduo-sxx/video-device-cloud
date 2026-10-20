import { useMemo, useState } from 'react';
import { Button, Segmented, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AlertTriangle, CheckCircle2, Globe2, Package } from 'lucide-react';
import { CHANNELS } from '@/types/enums';
import type { ChannelId } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { BaseChart } from '@/components/BaseChart';
import { Progress, StatusTag } from '@/components/ui';
import { byChannel, releases } from '@/mock';
import { formatInt, formatMoney, formatPercent, formatSize } from '@/utils/format';

interface Row {
  channel: ChannelId;
  dau: number;
  revenue: number;
  share: number;
  arpu: number;
  releaseCount: number;
  onlineCount: number;
  rejectedCount: number;
  avgPackage: number;
}

export default function ChannelsPage() {
  const [range, setRange] = useState<'7' | '30' | '90'>('30');

  const rows = useMemo<Row[]>(() => {
    const list = byChannel(Number(range));
    const total = list.reduce((s, c) => s + c.dau, 0);
    return list.map((c) => {
      const rel = releases.filter((r) => r.channel === c.channel);
      return {
        channel: c.channel,
        dau: c.dau,
        revenue: c.revenue,
        share: c.dau / Math.max(1, total),
        arpu: c.revenue / Math.max(1, c.dau),
        releaseCount: rel.length,
        onlineCount: rel.filter((r) => r.status === 'online').length,
        rejectedCount: rel.filter((r) => r.status === 'rejected').length,
        avgPackage: rel.reduce((s, r) => s + r.packageSize, 0) / Math.max(1, rel.length),
      };
    });
  }, [range]);

  const barOption = useMemo(
    () => ({
      grid: { left: 8, right: 16, top: 12, bottom: 4, containLabel: true },
      tooltip: { trigger: 'axis' as const, valueFormatter: (v: unknown) => formatInt(Number(v)) },
      xAxis: { type: 'value' as const, axisLabel: { formatter: (v: number) => `${Math.round(v / 10000)}万` } },
      yAxis: { type: 'category' as const, data: [...rows].reverse().map((r) => CHANNELS[r.channel].short) },
      series: [
        {
          type: 'bar' as const,
          data: [...rows].reverse().map((r) => r.dau),
          barWidth: '54%',
          itemStyle: { color: '#4C8DFF', borderRadius: [0, 4, 4, 0] },
        },
      ],
    }),
    [rows],
  );

  const overLimit = rows.filter((r) => CHANNELS[r.channel].limitMB > 0 && r.avgPackage > CHANNELS[r.channel].limitMB * 1024 * 1024);

  const columns: ColumnsType<Row> = [
    {
      title: '渠道',
      dataIndex: 'channel',
      width: 200,
      render: (v: ChannelId) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
            {CHANNELS[v].name}
            {CHANNELS[v].overseas && <Globe2 size={11} style={{ color: 'var(--np-text-tertiary)' }} />}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>
            {CHANNELS[v].overseas ? '海外' : '国内'} · 审核约 {CHANNELS[v].reviewHours}h
          </div>
        </div>
      ),
    },
    {
      title: 'DAU 占比',
      dataIndex: 'share',
      width: 168,
      render: (v: number, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 60 }}>
            <Progress value={v * 100} height={4} />
          </div>
          <span className="np-num" style={{ fontSize: 11.5 }}>{formatPercent(v, 1)}</span>
          <span style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>{formatInt(r.dau)}</span>
        </div>
      ),
    },
    {
      title: '收入',
      dataIndex: 'revenue',
      width: 116,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{formatMoney(v, false)}</span>,
    },
    {
      title: 'ARPU',
      dataIndex: 'arpu',
      width: 82,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>¥{v.toFixed(2)}</span>,
    },
    {
      title: '首包合规',
      width: 168,
      render: (_: unknown, r) => {
        const limit = CHANNELS[r.channel].limitMB;
        if (limit === 0) return <StatusTag label="无限制" tone="default" dot={false} />;
        const ratio = r.avgPackage / (limit * 1024 * 1024);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Package size={12} style={{ color: ratio > 1 ? 'var(--np-danger)' : 'var(--np-text-tertiary)' }} />
            <div style={{ width: 52 }}>
              <Progress value={Math.min(100, ratio * 100)} height={4} color={ratio > 1 ? 'var(--np-danger)' : undefined} />
            </div>
            <span className="np-num" style={{ fontSize: 11, color: ratio > 1 ? 'var(--np-danger)' : undefined }}>
              {formatSize(r.avgPackage)} / {limit}MB
            </span>
          </div>
        );
      },
    },
    {
      title: '发布',
      dataIndex: 'releaseCount',
      width: 108,
      render: (v: number, r) => (
        <span style={{ fontSize: 11.5 }}>
          上线 {r.onlineCount}/{v}
          {r.rejectedCount > 0 && <span style={{ color: 'var(--np-danger)' }}> · 驳回 {r.rejectedCount}</span>}
        </span>
      ),
    },
  ];

  const totalDau = rows.reduce((s, r) => s + r.dau, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const domestic = rows.filter((r) => !CHANNELS[r.channel].overseas);
  const overseas = rows.filter((r) => CHANNELS[r.channel].overseas);

  return (
    <div className="np-page">
      <PageHeader
        title="渠道分析"
        desc={`${rows.length} 个渠道 · 国内 DAU 占比 ${formatPercent(domestic.reduce((s, r) => s + r.share, 0), 1)} · 海外 ${formatPercent(overseas.reduce((s, r) => s + r.share, 0), 1)}`}
        actions={
          <>
            <Segmented
              size="small"
              value={range}
              onChange={(v) => setRange(v as '7' | '30' | '90')}
              options={[
                { label: '近 7 天', value: '7' },
                { label: '近 30 天', value: '30' },
                { label: '近 90 天', value: '90' },
              ]}
            />
            <Button>渠道对比</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">总 DAU</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{formatInt(totalDau)}</div>
          <div className="np-stat-foot">{range} 天累计</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">总收入</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{formatMoney(totalRevenue, false)}</div>
          <div className="np-stat-foot">ARPU ¥{(totalRevenue / Math.max(1, totalDau)).toFixed(2)}</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">头部渠道</div>
          <div className="np-stat-value" style={{ fontSize: 18 }}>{CHANNELS[rows[0]?.channel ?? 'wechat'].short}</div>
          <div className="np-stat-foot">占比 {formatPercent(rows[0]?.share ?? 0, 1)}</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">包体超限</div>
          <div className="np-stat-value" style={{ color: overLimit.length > 0 ? 'var(--np-danger)' : undefined }}>
            {overLimit.length}
          </div>
          <div className="np-stat-foot">需要压缩后重新提审</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 16, alignItems: 'start', marginBottom: 16 }}>
        <SectionCard title="渠道明细" sub={`近 ${range} 天`} bodyStyle={{ paddingTop: 8 }}>
          <Table
            rowKey="channel"
            size="middle"
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: 900 }}
          />
        </SectionCard>

        <SectionCard title="DAU 对比" sub="按渠道">
          <BaseChart option={barOption} height={330} />
        </SectionCard>
      </div>

      <div className="np-grid-2">
        <SectionCard title="渠道合规检查" sub={`${overLimit.length} 项不合规`}>
          {overLimit.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--np-text-secondary)', padding: '10px 0' }}>
              <CheckCircle2 size={15} style={{ color: 'var(--np-success)' }} />
              所有渠道平均包体均在首包限制内
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {overLimit.map((r) => (
                <div key={r.channel} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <AlertTriangle size={14} style={{ color: 'var(--np-danger)', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12.5 }}>{CHANNELS[r.channel].name}</div>
                    <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>
                      平均包体 {formatSize(r.avgPackage)}，超出 {CHANNELS[r.channel].limitMB}MB 限制
                      {formatSize(r.avgPackage - CHANNELS[r.channel].limitMB * 1024 * 1024)}，需拆分或压缩纹理
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="审核效率" sub="提审到上线">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {rows.slice(0, 6).map((r) => (
              <div key={r.channel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{CHANNELS[r.channel].short}</span>
                  <span style={{ color: 'var(--np-text-tertiary)' }}>{CHANNELS[r.channel].reviewHours} 小时</span>
                </div>
                <Progress value={(CHANNELS[r.channel].reviewHours / 30) * 100} height={4} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
