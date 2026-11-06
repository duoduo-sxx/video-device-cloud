import { useMemo, useState } from 'react';
import { Button, Segmented, Select, Table } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { PageHeader } from '../../components/base';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard';
import EChart from '../../charts/EChart';
import { dailySeries, heatmapSeries, sparkSeries } from '../../mock/seed';
import { exportCsv, fmtMoney, fmtNum } from '../../utils/format';

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function Reports() {
  const [dim, setDim] = useState('区域');
  const data = useMemo(() => dailySeries(), []);

  const stackOption = {
    grid: { left: 4, right: 8, top: 34, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { right: 0, top: 0, data: ['OSS', 'OBS', 'S3', 'HDFS'] },
    xAxis: { type: 'category', data: data.map((d) => d.date), axisLabel: { interval: 4 } },
    yAxis: { type: 'value', name: 'TB', splitLine: { show: true } },
    series: [
      { name: 'OSS', type: 'line', stack: 'total', smooth: true, areaStyle: { opacity: 0.5 }, data: data.map((d) => Number((d.bytes * 0.38).toFixed(2))) },
      { name: 'OBS', type: 'line', stack: 'total', smooth: true, areaStyle: { opacity: 0.5 }, data: data.map((d) => Number((d.bytes * 0.27).toFixed(2))) },
      { name: 'S3', type: 'line', stack: 'total', smooth: true, areaStyle: { opacity: 0.5 }, data: data.map((d) => Number((d.bytes * 0.2).toFixed(2))) },
      { name: 'HDFS', type: 'line', stack: 'total', smooth: true, areaStyle: { opacity: 0.5 }, data: data.map((d) => Number((d.bytes * 0.15).toFixed(2))) },
    ],
  };

  const deptOption = {
    grid: { left: 4, right: 40, top: 8, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'value', splitLine: { show: true }, axisLabel: { formatter: '{value} TB' } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: ['数据平台部', '风控科技部', '智能营销部', '供应链技术部', '财务共享中心', '客户服务中心', '基础架构部', '安全合规部'],
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: [42.8, 18.6, 15.2, 9.4, 7.8, 5.2, 3.6, 1.8],
        itemStyle: { borderRadius: [0, 4, 4, 0], color: '#2563EB' },
        label: { show: true, position: 'right', formatter: '{c} TB', fontSize: 11 },
      },
    ],
  };

  const heat = useMemo(() => heatmapSeries(), []);
  const heatData = useMemo(() => {
    const arr: [number, number, number][] = [];
    heat.forEach((row, y) => row.forEach((v, x) => arr.push([x, y, v])));
    return arr;
  }, [heat]);

  const heatOption = {
    grid: { left: 4, right: 8, top: 12, bottom: 40, containLabel: true },
    tooltip: { formatter: (p: { value: [number, number, number] }) => `${DAYS[p.value[1]]} ${p.value[0]}:00 · ${p.value[2]} 个任务` },
    xAxis: { type: 'category', data: Array.from({ length: 24 }).map((_, i) => `${i}h`), splitArea: { show: true }, axisLabel: { interval: 2 } },
    yAxis: { type: 'category', data: DAYS, splitArea: { show: true } },
    visualMap: {
      min: 0,
      max: 100,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemWidth: 10,
      itemHeight: 80,
      textStyle: { fontSize: 10 },
      inRange: { color: ['#EFF4FF', '#93B4F5', '#2563EB', '#D97706'] },
    },
    series: [{ type: 'heatmap', data: heatData, itemStyle: { borderColor: 'transparent', borderWidth: 2, borderRadius: 2 } }],
  };

  const funnelOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} 个' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'funnel',
        left: '8%',
        right: '8%',
        top: 10,
        bottom: 40,
        minSize: '22%',
        label: { position: 'inside', fontSize: 12, color: '#fff' },
        itemStyle: { borderWidth: 0 },
        data: [
          { name: '创建任务', value: 1284 },
          { name: '进入排队', value: 1276 },
          { name: '开始传输', value: 1268 },
          { name: '校验通过', value: 1246 },
          { name: '任务完成', value: 1266 },
        ],
      },
    ],
  };

  const tableData = data.slice(-10).map((d, i) => ({
    key: `${d.date}-${i}`,
    date: d.date,
    jobs: d.jobs,
    bytes: d.bytes,
    successRate: d.successRate,
    speed: Math.round(420 + d.bytes * 6),
    cost: d.cost,
    ratio: Number(((d.bytes - data[i].bytes) / data[i].bytes * 100).toFixed(1)),
  }));

  const exportRows = data.map((d) => ({
    日期: d.date,
    任务数: d.jobs,
    数据量TB: d.bytes,
    成功率: `${d.successRate}%`,
    成本: d.cost,
  }));

  return (
    <div>
      <PageHeader
        title="报表分析"
        desc="传输量、成本、成功率与时段分布的多维分析"
        actions={
          <>
            <Segmented options={['近 7 天', '近 30 天', '本季度']} defaultValue="近 30 天" />
            <Select value={dim} onChange={setDim} options={['区域', '部门', '存储类型'].map((v) => ({ value: v, label: v }))} style={{ width: 120 }} />
            <Button icon={<DownloadOutlined />} onClick={() => exportCsv('传输报表.csv', exportRows)}>
              导出
            </Button>
          </>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard title="总传输量" value="382.6" unit="TB" change={9.4} spark={sparkSeries(31)} />
        <StatCard title="总成本" value="562,400" unit="元" change={-4.2} spark={sparkSeries(32)} color="#16A34A" invert />
        <StatCard title="平均成功率" value="98.4" unit="%" change={0.6} spark={sparkSeries(33)} color="#8B5CF6" />
        <StatCard title="峰值带宽" value="8.62" unit="Gbps" change={11.8} spark={sparkSeries(34)} color="#06B6D4" />
      </div>

      <div className="grid grid-2-1" style={{ marginBottom: 16 }}>
        <ChartCard title="传输量趋势" desc="按存储类型堆叠 · 近 30 天">
          <EChart option={stackOption} height={300} />
        </ChartCard>
        <ChartCard title="部门用量排行" desc={`按${dim}维度 · Top 8`}>
          <EChart option={deptOption} height={300} />
        </ChartCard>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <ChartCard title="任务密度热力图" desc="7 天 × 24 小时任务分布">
          <EChart option={heatOption} height={280} />
        </ChartCard>
        <ChartCard title="任务阶段漏斗" desc="从创建到完成的转化">
          <EChart option={funnelOption} height={280} />
        </ChartCard>
      </div>

      <div className="cf-card" style={{ padding: 16 }}>
        <div className="cf-card-title" style={{ marginBottom: 12 }}>明细数据</div>
        <Table
          className="cf-table"
          rowKey="key"
          size="middle"
          pagination={false}
          dataSource={tableData}
          columns={[
            { title: '日期', dataIndex: 'date', width: 110 },
            { title: '任务数', dataIndex: 'jobs', width: 110, render: (v: number) => fmtNum(v) },
            { title: '数据量', dataIndex: 'bytes', width: 110, render: (v: number) => `${v} TB` },
            { title: '成功率', dataIndex: 'successRate', width: 110, render: (v: number) => `${v}%` },
            { title: '平均速率', dataIndex: 'speed', width: 130, render: (v: number) => `${v} MB/s` },
            { title: '成本', dataIndex: 'cost', width: 130, render: (v: number) => fmtMoney(v) },
            {
              title: '环比',
              dataIndex: 'ratio',
              width: 100,
              render: (v: number) => <span style={{ color: v >= 0 ? '#16A34A' : '#DC2626' }}>{v >= 0 ? '+' : ''}{v}%</span>,
            },
          ]}
        />
      </div>
    </div>
  );
}
