import { useMemo, useState } from 'react';
import { Button, Progress, Segmented, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import ChartCard from '../../components/ChartCard';
import { REGION_COST, REPORT_ROWS } from '../../mock/charts';
import { axisLabelStyle, chartTooltip, legendStyle, splitLineStyle } from '../../theme/chart';
import { downloadCsv, formatMoney } from '../../utils/format';
import { toast } from '../../utils/feedback';

interface Row {
  region: string;
  volume: number;
  tasks: number;
  speed: number;
  cost: number;
  price: number;
  delta: number;
}

export default function Reports() {
  const [range, setRange] = useState<'7d' | '30d'>('30d');
  const [dimension, setDimension] = useState<'region' | 'channel'>('region');

  const rows = useMemo(
    () => REPORT_ROWS.map((r) => ({ ...r, volume: Number((r.volume * (range === '7d' ? 0.24 : 1)).toFixed(1)), cost: Math.round(r.cost * (range === '7d' ? 0.24 : 1)) })),
    [range],
  );

  const trendOption = {
    grid: { left: 6, right: 12, top: 34, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis' as const, ...chartTooltip, axisPointer: { type: 'shadow' as const } },
    legend: { ...legendStyle, top: 0, right: 0 },
    xAxis: {
      type: 'category' as const,
      data: rows.map((r) => r.region),
      axisLabel: axisLabelStyle,
      axisLine: { lineStyle: { color: '#E9EEF6' } },
      axisTick: { show: false },
    },
    yAxis: [
      { type: 'value' as const, name: 'TB', nameTextStyle: { fontSize: 10, color: '#8A99B0' }, axisLabel: axisLabelStyle, splitLine: splitLineStyle },
      { type: 'value' as const, name: '元', nameTextStyle: { fontSize: 10, color: '#8A99B0' }, axisLabel: axisLabelStyle, splitLine: { show: false } },
    ],
    series: [
      {
        name: '传输量',
        type: 'bar' as const,
        data: rows.map((r) => r.volume),
        barWidth: 26,
        itemStyle: { color: '#1668FF', borderRadius: [6, 6, 0, 0] },
      },
      {
        name: '成本',
        type: 'line' as const,
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: rows.map((r) => r.cost),
        lineStyle: { color: '#F59E0B', width: 2 },
        itemStyle: { color: '#F59E0B' },
      },
    ],
  };

  const pieOption = {
    tooltip: { trigger: 'item' as const, ...chartTooltip, formatter: '{b}: {d}%' },
    legend: { ...legendStyle, bottom: 0, left: 'center' },
    series: [
      {
        type: 'pie' as const,
        radius: ['52%', '72%'],
        center: ['50%', '44%'],
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: REGION_COST.map((r, i) => ({
          name: r.name,
          value: Math.round(r.amount * (range === '7d' ? 0.24 : 1)),
          itemStyle: { color: ['#1668FF', '#00B894', '#F59E0B', '#7C5CFF'][i] },
        })),
      },
    ],
  };

  const columns: ColumnsType<Row> = [
    { title: '区域', dataIndex: 'region' },
    { title: '传输量', dataIndex: 'volume', width: 110, render: (v) => <span className="num">{v} TB</span> },
    { title: '任务数', dataIndex: 'tasks', width: 100, render: (v) => <span className="num">{v} 个</span> },
    { title: '平均速率', dataIndex: 'speed', width: 120, render: (v) => <span className="num">{v} MB/s</span> },
    { title: '成本', dataIndex: 'cost', width: 120, render: (v) => <span className="num">{formatMoney(v)}</span> },
    { title: '单价', dataIndex: 'price', width: 100, render: (v) => <span className="num">¥{v}/GB</span> },
    {
      title: '环比',
      dataIndex: 'delta',
      width: 100,
      render: (v: number) => (
        <span style={{ color: v >= 0 ? '#EF4444' : '#00B894' }} className="num">
          {v >= 0 ? '+' : ''}
          {v}%
        </span>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="报表与成本"
        description="按区域、通道与空间拆解流量与费用，支撑带宽采购与成本分摊决策"
        extra={
          <>
            <Segmented
              value={range}
              onChange={(v) => setRange(v as '7d' | '30d')}
              options={[
                { value: '7d', label: '近 7 天' },
                { value: '30d', label: '近 30 天' },
              ]}
            />
            <Segmented
              value={dimension}
              onChange={(v) => setDimension(v as 'region' | 'channel')}
              options={[
                { value: 'region', label: '按区域' },
                { value: 'channel', label: '按通道' },
              ]}
            />
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => {
                const data: (string | number)[][] = [
                  ['区域', '传输量(TB)', '任务数', '平均速率(MB/s)', '成本(元)', '单价(元/GB)', '环比(%)'],
                  ...rows.map((r) => [r.region, r.volume, r.tasks, r.speed, r.cost, r.price, r.delta]),
                ];
                downloadCsv(`成本报表_${range}_${new Date().toISOString().slice(0, 10)}.csv`, data);
                toast.success('报表已导出');
              }}
            >
              导出 CSV
            </Button>
          </>
        }
      />

      <div className="grid grid-main" style={{ marginBottom: 16 }}>
        <ChartCard title="流量与成本趋势" sub={dimension === 'region' ? '按区域' : '按通道'} option={trendOption} height={300} />
        <ChartCard title="成本构成" sub={`近 ${range === '7d' ? '7' : '30'} 天`} option={pieOption} height={300} />
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="panel">
          <div className="panel-title" style={{ marginBottom: 12 }}>
            SLA 达成
          </div>
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <Progress
              type="dashboard"
              percent={99.96}
              size={150}
              strokeColor="#00B894"
              trailColor="#EEF2F8"
              format={(p) => (
                <div>
                  <div className="sla-big">{p}%</div>
                  <div style={{ fontSize: 11, color: '#8A99B0' }}>目标 99.95%</div>
                </div>
              )}
            />
          </div>
          <div style={{ fontSize: 12, color: '#5A6B87', textAlign: 'center', marginTop: 10 }}>本月 3 天未达标，已完成复盘</div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 3' }}>
          <div className="panel-head">
            <div className="panel-title">
              流量与成本明细
              <span className="panel-sub">单位：TB / 元</span>
            </div>
            <span style={{ fontSize: 12, color: '#8A99B0' }}>共 {rows.length} 个区域</span>
          </div>
          <Table<Row>
            rowKey="region"
            size="small"
            columns={columns}
            dataSource={rows}
            pagination={false}
          />
          <div className="flex-between" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #EEF2F8', fontSize: 12.5 }}>
            <span style={{ color: '#5A6B87' }}>
              合计：{rows.reduce((s, r) => s + r.volume, 0).toFixed(1)} TB · {rows.reduce((s, r) => s + r.tasks, 0)} 个任务
            </span>
            <b>总成本 {formatMoney(rows.reduce((s, r) => s + r.cost, 0))}</b>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">成本优化建议</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { title: '欧洲中部1 单价最高', desc: '单价 ¥1.10/GB，是华东1 的 2.7 倍。建议将非实时归档任务改为夜间批量执行，并启用 zstd 压缩。', tag: '预计节省 ¥3,200/月' },
            { title: '华南1 流量环比下降 2.4%', desc: '边缘采集任务改为增量同步后流量下降，可将备份通道 CH-12 的带宽下调一档。', tag: '预计节省 ¥1,800/月' },
            { title: '去重命中率仍有提升空间', desc: '订单库每日全量备份重复分片占比 31%，启用块级去重后可进一步降低流量。', tag: '预计节省 412 GB/月' },
          ].map((s) => (
            <div key={s.title} style={{ border: '1px solid #E9EEF6', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: '#7B8AA3', marginTop: 6, lineHeight: 1.8 }}>{s.desc}</div>
              <div style={{ marginTop: 10, fontSize: 11.5, color: '#00B894' }}>{s.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
