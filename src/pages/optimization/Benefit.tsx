import { useMemo } from 'react';
import { Table } from 'antd';
import { PageHeader } from '../../components/base';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard';
import EChart from '../../charts/EChart';
import { useDataStore } from '../../store/dataStore';
import { dailySeries, sparkSeries } from '../../mock/seed';
import { fmtMoney } from '../../utils/format';

export default function Benefit() {
  const policies = useDataStore((s) => s.policies);
  const series = useMemo(() => dailySeries(), []);

  const comboOption = {
    grid: { left: 4, right: 12, top: 34, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { right: 0, top: 0 },
    xAxis: { type: 'category', data: series.map((s) => s.date), axisLabel: { interval: 4 } },
    yAxis: [
      { type: 'value', name: 'TB', splitLine: { show: true } },
      { type: 'value', name: '节省率 %', min: 0, max: 60, splitLine: { show: false } },
    ],
    series: [
      { name: '原始流量', type: 'bar', stack: 'a', data: series.map((s) => Number((s.bytes * 1.62).toFixed(1))), itemStyle: { color: '#CBD5E1' } },
      { name: '优化后流量', type: 'bar', stack: 'a', data: series.map((s) => s.bytes), itemStyle: { color: '#2563EB' } },
      {
        name: '节省率',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        data: series.map((s) => Number((38 + Math.sin(s.bytes) * 4).toFixed(1))),
        itemStyle: { color: '#16A34A' },
      },
    ],
  };

  const radarOption = {
    tooltip: {},
    legend: { bottom: 0 },
    radar: {
      indicator: [
        { name: '压缩', max: 100 },
        { name: '去重', max: 100 },
        { name: '并发', max: 100 },
        { name: '选路', max: 100 },
        { name: '重传', max: 100 },
        { name: '调度', max: 100 },
      ],
      radius: '62%',
      axisName: { fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.28)' } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.28)' } },
    },
    series: [
      {
        type: 'radar',
        data: [
          { name: '启用前', value: [38, 26, 42, 45, 34, 30], areaStyle: { opacity: 0.1 }, itemStyle: { color: '#94A3B8' } },
          { name: '启用后', value: [82, 76, 88, 84, 72, 66], areaStyle: { opacity: 0.18 }, itemStyle: { color: '#2563EB' } },
        ],
      },
    ],
  };

  const sankeyOption = {
    tooltip: { trigger: 'item', triggerOn: 'mousemove' },
    series: [
      {
        type: 'sankey',
        left: 8,
        right: 120,
        top: 16,
        bottom: 16,
        nodeGap: 12,
        nodeWidth: 12,
        lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.28 },
        label: { fontSize: 11, color: '#64748B' },
        data: [
          { name: '源·华东1' }, { name: '源·华北2' }, { name: '源·华南1' }, { name: '源·西南1' }, { name: '源·海外' },
          { name: '压缩+去重' }, { name: '压缩+直传' }, { name: '多链路聚合' }, { name: '均衡调度' },
          { name: '目标·华北2' }, { name: '目标·华东1' }, { name: '目标·华南1' }, { name: '目标·海外归档' },
        ],
        links: [
          { source: '源·华东1', target: '压缩+去重', value: 860 },
          { source: '源·华东1', target: '多链路聚合', value: 420 },
          { source: '源·华北2', target: '压缩+直传', value: 380 },
          { source: '源·华北2', target: '均衡调度', value: 260 },
          { source: '源·华南1', target: '压缩+去重', value: 520 },
          { source: '源·华南1', target: '多链路聚合', value: 210 },
          { source: '源·西南1', target: '均衡调度', value: 180 },
          { source: '源·海外', target: '压缩+直传', value: 240 },
          { source: '压缩+去重', target: '目标·华北2', value: 720 },
          { source: '压缩+去重', target: '目标·华东1', value: 660 },
          { source: '压缩+直传', target: '目标·华东1', value: 320 },
          { source: '压缩+直传', target: '目标·海外归档', value: 300 },
          { source: '多链路聚合', target: '目标·华南1', value: 390 },
          { source: '多链路聚合', target: '目标·华北2', value: 240 },
          { source: '均衡调度', target: '目标·华东1', value: 280 },
          { source: '均衡调度', target: '目标·华南1', value: 160 },
        ],
      },
    ],
  };

  const contribution = useMemo(
    () =>
      policies
        .filter((p) => p.hitCount > 0)
        .sort((a, b) => b.hitCount * b.savePct - a.hitCount * a.savePct)
        .slice(0, 6),
    [policies],
  );

  const total = contribution.reduce((a, p) => a + p.hitCount * p.savePct, 0);

  return (
    <div>
      <PageHeader title="收益分析" desc="优化引擎带来的速度、流量与成本收益量化" />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard title="累计节省流量" value="1.86" unit="PB" change={21.7} spark={sparkSeries(11)} color="#2563EB" />
        <StatCard title="节省带宽成本" value="428,600" unit="元" change={18.4} spark={sparkSeries(12)} color="#16A34A" />
        <StatCard title="平均端到端提速" value="2.3" unit="×" change={12.1} spark={sparkSeries(13)} color="#8B5CF6" />
        <StatCard title="重传率下降" value="64" unit="%" change={9.6} spark={sparkSeries(14)} color="#06B6D4" invert />
      </div>

      <div className="grid grid-2-1" style={{ marginBottom: 16 }}>
        <ChartCard title="流量与成本节省" desc="近 30 天 · 原始流量 vs 优化后流量">
          <EChart option={comboOption} height={300} />
        </ChartCard>
        <ChartCard title="优化能力雷达" desc="启用前后六维能力对比">
          <EChart option={radarOption} height={300} />
        </ChartCard>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <ChartCard title="数据流向桑基图" desc="源区域 → 传输方式 → 目标区域（单位 TB）">
          <EChart option={sankeyOption} height={320} />
        </ChartCard>

        <ChartCard title="策略贡献排行" desc="按节省流量加权排序">
          <Table
            className="cf-table"
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={contribution}
            columns={[
              { title: '策略', dataIndex: 'name', ellipsis: true },
              { title: '命中次数', dataIndex: 'hitCount', width: 100, render: (v: number) => v.toLocaleString() },
              { title: '节省流量', dataIndex: 'savePct', width: 90, render: (v: number) => `${v}%` },
              {
                title: '节省成本',
                key: 'cost',
                width: 110,
                render: (_, r) => <span>{fmtMoney((r.hitCount * r.savePct * 0.86) / 10)}</span>,
              },
              {
                title: '贡献占比',
                key: 'ratio',
                width: 130,
                render: (_, r) => {
                  const pct = ((r.hitCount * r.savePct) / total) * 100;
                  return (
                    <div>
                      <div className="mini-bar">
                        <i style={{ width: `${pct}%`, background: '#2563EB' }} />
                      </div>
                      <span className="muted">{pct.toFixed(1)}%</span>
                    </div>
                  );
                },
              },
            ]}
          />
        </ChartCard>
      </div>
    </div>
  );
}
