import { useMemo, useState } from 'react';
import { Button, Segmented, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard';
import { CHANNEL_QUALITY, genHeatmap, genTrend } from '../../mock/charts';
import { axisLabelStyle, chartTooltip, legendStyle, splitLineStyle } from '../../theme/chart';
import { formatRelative } from '../../utils/format';
import { toast } from '../../utils/feedback';

interface QualityRow {
  id: string;
  name: string;
  latency: number;
  loss: number;
  success: number;
  score: string;
}

export default function Monitor() {
  const [metric, setMetric] = useState<'both' | 'bandwidth' | 'latency'>('both');
  const [loading, setLoading] = useState(false);
  const trend = useMemo(() => genTrend('24h'), []);
  const heat = useMemo(() => genHeatmap(), []);

  const lineOption = useMemo(() => {
    const latency = trend.volume.map((v, i) => Math.round(28 + (v % 17) + (i % 5) * 3));
    return {
      grid: { left: 6, right: 10, top: 34, bottom: 0, containLabel: true },
      tooltip: { trigger: 'axis' as const, ...chartTooltip },
      legend: { ...legendStyle, top: 0, right: 0 },
      xAxis: {
        type: 'category' as const,
        data: trend.labels,
        axisLabel: axisLabelStyle,
        axisLine: { lineStyle: { color: '#E9EEF6' } },
        axisTick: { show: false },
      },
      yAxis: [
        { type: 'value' as const, name: 'Gbps', nameTextStyle: { fontSize: 10, color: '#8A99B0' }, axisLabel: axisLabelStyle, splitLine: splitLineStyle },
        { type: 'value' as const, name: 'ms', nameTextStyle: { fontSize: 10, color: '#8A99B0' }, axisLabel: axisLabelStyle, splitLine: { show: false } },
      ],
      series: [
        ...(metric !== 'latency'
          ? [{
              name: '带宽',
              type: 'line' as const,
              smooth: true,
              symbol: 'none',
              data: trend.volume.map((v) => Number((v / 8 + 5.2).toFixed(2))),
              lineStyle: { width: 2, color: '#1668FF' },
              areaStyle: { color: 'rgba(22,104,255,0.10)' },
            }]
          : []),
        ...(metric !== 'bandwidth'
          ? [{
              name: '延迟',
              type: 'line' as const,
              smooth: true,
              symbol: 'none',
              yAxisIndex: 1,
              data: latency,
              lineStyle: { width: 1.8, color: '#F59E0B', type: 'dashed' as const },
            }]
          : []),
      ],
    };
  }, [trend, metric]);

  const heatOption = {
    grid: { left: 84, right: 16, top: 12, bottom: 52 },
    tooltip: {
      ...chartTooltip,
      position: 'top' as const,
      formatter: (p: any) =>
        `${heat.nodes[p.value[1]]}<br/>${heat.hours[p.value[0]]} · 负载 ${p.value[2]}%`,
    },
    xAxis: {
      type: 'category' as const,
      data: heat.hours,
      splitArea: { show: true },
      axisLabel: { ...axisLabelStyle, interval: 2 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category' as const,
      data: heat.nodes,
      splitArea: { show: true },
      axisLabel: axisLabelStyle,
      axisLine: { show: false },
      axisTick: { show: false },
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: false,
      orient: 'horizontal' as const,
      left: 'center' as const,
      bottom: 0,
      itemWidth: 10,
      itemHeight: 90,
      textStyle: { fontSize: 10, color: '#8A99B0' },
      inRange: { color: ['#E6F1FB', '#85B7EB', '#1668FF', '#F59E0B', '#EF4444'] },
    },
    series: [
      {
        type: 'heatmap' as const,
        data: heat.data,
        itemStyle: { borderColor: '#fff', borderWidth: 1, borderRadius: 2 },
        emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.2)' } },
      },
    ],
  };

  const columns: ColumnsType<QualityRow> = [
    { title: '通道', dataIndex: 'name', render: (v, r) => <span>{v} <span className="mono" style={{ color: '#8A99B0', fontSize: 11 }}>{r.id}</span></span> },
    { title: '延迟', dataIndex: 'latency', width: 100, sorter: (a, b) => a.latency - b.latency, render: (v) => <span className="num">{v} ms</span> },
    { title: '丢包率', dataIndex: 'loss', width: 110, sorter: (a, b) => a.loss - b.loss, render: (v) => <span className="num">{v}%</span> },
    { title: '成功率', dataIndex: 'success', width: 110, render: (v) => <span className="num">{v}%</span> },
    {
      title: '质量评分',
      dataIndex: 'score',
      width: 100,
      render: (v: string) => {
        const color = v === 'A' ? '#00B894' : v === 'B' ? '#F59E0B' : '#EF4444';
        return <Tag style={{ color, background: `${color}14`, borderColor: `${color}33`, marginInlineEnd: 0, fontWeight: 600 }}>{v}</Tag>;
      },
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="实时监控"
        description="聚合通道、节点与任务的运行时指标，异常链路会在质量排行中自动降级"
        extra={
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                setLoading(false);
                toast.success('监控数据已刷新');
              }, 800);
            }}
          >
            刷新
          </Button>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard title="总带宽" value="7.8" unit="Gbps" delta={6.2} deltaLabel="较 1 小时前" />
        <StatCard title="平均延迟" value="42" unit="ms" delta={-1.8} deltaLabel="较 1 小时前" iconColor="#00B894" iconBg="#E6F8F3" />
        <StatCard title="丢包率" value="0.06" unit="%" deltaLabel="阈值 1.0%" iconColor="#F59E0B" iconBg="#FFF6E6" />
        <StatCard title="任务成功率" value="99.2" unit="%" deltaLabel="近 24 小时" iconColor="#7C5CFF" iconBg="#F1EEFF" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <ChartCard
          title="带宽与延迟趋势"
          sub="近 24 小时"
          option={lineOption}
          height={300}
          extra={
            <Segmented
              size="small"
              value={metric}
              onChange={(v) => setMetric(v as 'both' | 'bandwidth' | 'latency')}
              options={[
                { value: 'both', label: '全部' },
                { value: 'bandwidth', label: '带宽' },
                { value: 'latency', label: '延迟' },
              ]}
            />
          }
        />
      </div>

      <div className="grid grid-main-3">
        <ChartCard title="节点负载热力图" sub="行=节点，列=小时" option={heatOption} height={330} />
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">
              通道质量排行
              <span className="panel-sub">按评分与丢包</span>
            </div>
          </div>
          <Table<QualityRow>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={CHANNEL_QUALITY}
            pagination={false}
            scroll={{ y: 268 }}
            rowClassName={(r) => (r.score === 'C' ? 'row-danger' : '')}
          />
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: '#A3B0C4' }}>
        指标采集周期 10 秒，聚合展示延迟约 1 分钟 · 最后更新 {formatRelative(new Date(Date.now() - 30_000).toISOString())}
      </div>
    </div>
  );
}
