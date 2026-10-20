import { useMemo, useState } from 'react';
import { Button, Segmented, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowDown } from 'lucide-react';
import { CHANNELS } from '@/types/enums';
import type { ChannelId } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { BaseChart } from '@/components/BaseChart';
import { Progress } from '@/components/ui';
import { byChannel, todayMetrics } from '@/mock';
import { formatInt, formatPercent } from '@/utils/format';

interface Step {
  key: string;
  label: string;
  desc: string;
  base: number;
  drop: string;
}

export default function FunnelPage() {
  const [channel, setChannel] = useState<'all' | ChannelId>('all');
  const [range, setRange] = useState<'7' | '30'>('7');

  const baseDau = todayMetrics().dau;

  const steps = useMemo<Step[]>(() => {
    const factor = channel === 'all' ? 1 : 0.18;
    const exposure = Math.round(baseDau * 4.6 * factor);
    const click = Math.round(exposure * 0.284);
    const load = Math.round(click * 0.812);
    const login = Math.round(load * 0.906);
    const tutorial = Math.round(login * 0.771);
    const firstGame = Math.round(tutorial * 0.884);
    const d1 = Math.round(firstGame * 0.416);
    const pay = Math.round(d1 * 0.0348);

    return [
      { key: 'exposure', label: '广告曝光', desc: '渠道推荐位与买量素材', base: exposure, drop: '—' },
      { key: 'click', label: '点击进入', desc: '点击图标或素材', base: click, drop: '素材与图标吸引力' },
      { key: 'load', label: '加载完成', desc: '首包下载与资源加载', base: load, drop: '包体过大 / 弱网超时' },
      { key: 'login', label: '授权登录', desc: '渠道账号授权', base: login, drop: '授权弹窗被拒' },
      { key: 'tutorial', label: '完成引导', desc: '新手教程全流程', base: tutorial, drop: '教程过长 / 卡关' },
      { key: 'firstGame', label: '完成首局', desc: '打完第一局', base: firstGame, drop: '匹配失败 / 卡顿' },
      { key: 'd1', label: '次日回访', desc: 'T+1 再次进入', base: d1, drop: '缺乏留存钩子' },
      { key: 'pay', label: '首次付费', desc: '完成任意金额支付', base: pay, drop: '付费点设计 / 支付失败' },
    ];
  }, [baseDau, channel]);

  const top = steps[0]?.base ?? 1;

  const funnelOption = useMemo(
    () => ({
      grid: { left: 8, right: 24, top: 12, bottom: 8, containLabel: true },
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const }, valueFormatter: (v: unknown) => formatInt(Number(v)) },
      xAxis: { type: 'value' as const, axisLabel: { formatter: (v: number) => `${Math.round(v / 10000)}万` } },
      yAxis: { type: 'category' as const, data: [...steps].reverse().map((s) => s.label) },
      series: [
        {
          type: 'bar' as const,
          data: [...steps].reverse().map((s, i) => ({
            value: s.base,
            itemStyle: { color: `rgba(76,141,255,${0.9 - i * 0.08})`, borderRadius: [0, 4, 4, 0] },
          })),
          barWidth: '58%',
          label: { show: true, position: 'right' as const, fontSize: 10.5, formatter: (p: { value?: unknown }) => formatInt(Number(p.value ?? 0)) },
        },
      ],
    }),
    [steps],
  );

  const channelRows = useMemo(() => {
    const list = byChannel(Number(range) * 3);
    return list.map((c) => {
      const ratio = c.dau / Math.max(1, list.reduce((s, x) => s + x.dau, 0));
      return {
        channel: c.channel,
        enters: Math.round(c.dau * 4.6),
        registered: Math.round(c.dau * 1.08),
        firstGame: Math.round(c.dau * 0.71),
        paid: Math.round(c.dau * 0.0312),
        payRate: 0.0312 + ratio * 0.004,
        arpu: c.revenue / Math.max(1, c.dau),
      };
    });
  }, [range]);

  const columns: ColumnsType<(typeof channelRows)[number]> = [
    {
      title: '渠道',
      dataIndex: 'channel',
      render: (v: ChannelId) => <span style={{ fontSize: 12 }}>{CHANNELS[v].name}</span>,
    },
    {
      title: '进入→首局',
      width: 150,
      render: (_: unknown, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 66 }}>
            <Progress value={(r.firstGame / Math.max(1, r.enters)) * 100 * 4} height={4} />
          </div>
          <span className="np-num" style={{ fontSize: 11.5 }}>{formatPercent(r.firstGame / Math.max(1, r.enters), 1)}</span>
        </div>
      ),
    },
    {
      title: '首局→付费',
      width: 130,
      align: 'right',
      render: (_: unknown, r) => <span className="np-num" style={{ fontSize: 11.5 }}>{formatPercent(r.payRate, 2)}</span>,
    },
    {
      title: 'ARPU',
      dataIndex: 'arpu',
      width: 92,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>¥{v.toFixed(2)}</span>,
    },
  ];

  return (
    <div className="np-page">
      <PageHeader
        title="转化漏斗"
        desc={`曝光到付费共 8 个环节 · 整体转化 ${formatPercent((steps[7]?.base ?? 0) / Math.max(1, steps[0]?.base ?? 1), 2)}`}
        actions={
          <>
            <Segmented
              size="small"
              value={range}
              onChange={(v) => setRange(v as '7' | '30')}
              options={[
                { label: '近 7 天', value: '7' },
                { label: '近 30 天', value: '30' },
              ]}
            />
            <Select
              size="small"
              value={channel}
              onChange={setChannel}
              style={{ width: 150 }}
              options={[{ value: 'all', label: '全渠道' }, ...(Object.keys(CHANNELS) as ChannelId[]).map((c) => ({ value: c, label: CHANNELS[c].name }))]}
            />
            <Button>导出漏斗</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">曝光量</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{formatInt(steps[0]?.base ?? 0)}</div>
          <div className="np-stat-foot">点击率 {formatPercent((steps[1]?.base ?? 0) / Math.max(1, steps[0]?.base ?? 1), 1)}</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">进入游戏</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{formatInt(steps[2]?.base ?? 0)}</div>
          <div className="np-stat-foot">加载成功率 {formatPercent((steps[2]?.base ?? 0) / Math.max(1, steps[1]?.base ?? 1), 1)}</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">完成首局</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{formatInt(steps[5]?.base ?? 0)}</div>
          <div className="np-stat-foot">新手引导完成率 {formatPercent((steps[5]?.base ?? 0) / Math.max(1, steps[3]?.base ?? 1), 1)}</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">首次付费</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{formatInt(steps[7]?.base ?? 0)}</div>
          <div className="np-stat-foot">付费转化 {formatPercent((steps[7]?.base ?? 0) / Math.max(1, steps[5]?.base ?? 1), 2)}</div>
        </div>
      </div>

      <SectionCard title="漏斗明细" sub="每环节的绝对量与流失">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {steps.map((s, i) => {
            const width = (s.base / top) * 100;
            const prevStep = i > 0 ? steps[i - 1] : undefined;
            const conv = prevStep ? s.base / Math.max(1, prevStep.base) : 1;
            return (
              <div key={s.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                  <div style={{ width: 96, fontSize: 12.5, flexShrink: 0 }}>{s.label}</div>
                  <div style={{ flex: 1, position: 'relative', height: 34 }}>
                    <div
                      style={{
                        width: `${Math.max(width, 4)}%`,
                        height: '100%',
                        borderRadius: 5,
                        background: `linear-gradient(90deg, rgba(76,141,255,${0.9 - i * 0.075}), rgba(76,141,255,${0.55 - i * 0.06}))`,
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: 10,
                        minWidth: 76,
                      }}
                    >
                      <span style={{ fontSize: 11.5, color: '#fff', fontWeight: 500 }}>{formatInt(s.base)}</span>
                    </div>
                  </div>
                  <div style={{ width: 96, textAlign: 'right', fontSize: 11.5, flexShrink: 0 }}>
                    <span className="np-num">{i === 0 ? '100%' : formatPercent(conv, 1)}</span>
                  </div>
                  <div style={{ width: 168, fontSize: 11, color: 'var(--np-text-tertiary)', flexShrink: 0 }} className="np-truncate">
                    {s.drop}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 108, height: 12 }}>
                    <ArrowDown size={10} style={{ color: 'var(--np-text-disabled)' }} />
                    <span style={{ fontSize: 10, color: 'var(--np-text-tertiary)' }}>
                      流失 {formatInt(s.base - (steps[i + 1]?.base ?? 0))}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard title="漏斗对比图" sub="绝对值">
          <BaseChart option={funnelOption} height={280} />
        </SectionCard>

        <SectionCard title="渠道转化对比" bodyStyle={{ paddingTop: 8 }}>
          <Table
            rowKey="channel"
            size="middle"
            columns={columns}
            dataSource={channelRows}
            pagination={false}
            scroll={{ x: 520 }}
          />
        </SectionCard>
      </div>
    </div>
  );
}
