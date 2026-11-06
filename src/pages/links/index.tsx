import { useMemo, useState } from 'react';
import { Button, Progress, Select, Table, message, type TableColumnsType } from 'antd';
import { AimOutlined } from '@ant-design/icons';
import { PageHeader, StatusTag } from '../../components/base';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard';
import EChart from '../../charts/EChart';
import { LINKS, NODES, heatmapSeries } from '../../mock/seed';
import { LINK_STATUS } from '../../constants/dict';
import type { LinkItem } from '../../types';
import { fmtShortTime, relTime } from '../../utils/format';
import { probeLinks } from '../../services/api';

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function Links() {
  const [status, setStatus] = useState<string | undefined>();
  const [probing, setProbing] = useState(false);
  const [probedAt, setProbedAt] = useState<Record<string, string>>({});

  const rows = useMemo(() => LINKS.filter((l) => !status || l.status === status), [status]);
  const stats = useMemo(() => {
    const c = { excellent: 0, good: 0, congested: 0, down: 0 };
    LINKS.forEach((l) => {
      c[l.status] += 1;
    });
    const avgRtt = LINKS.reduce((a, l) => a + l.rttMs, 0) / LINKS.length;
    const avgBw = LINKS.reduce((a, l) => a + l.availableBandwidthMbps, 0) / LINKS.length / 1000;
    return { ...c, avgRtt, avgBw };
  }, []);

  const doProbe = async () => {
    setProbing(true);
    const n = await probeLinks(LINKS.length);
    const now = new Date().toISOString();
    const map: Record<string, string> = {};
    LINKS.forEach((l) => {
      map[l.id] = now;
    });
    setProbedAt(map);
    setProbing(false);
    message.success(`已完成 ${n} 条链路探测`);
  };

  const columns: TableColumnsType<LinkItem> = [
    {
      title: '链路',
      dataIndex: 'name',
      key: 'name',
      width: 260,
      render: (v: string, r) => (
        <div>
          <div style={{ fontSize: 13 }}>{v}</div>
          <div className="muted mono" style={{ marginTop: 2 }}>{r.id}</div>
        </div>
      ),
    },
    {
      title: '协议',
      dataIndex: 'protocol',
      key: 'protocol',
      width: 80,
      render: (v: string) => <span className="chip">{v}</span>,
    },
    {
      title: 'RTT',
      dataIndex: 'rttMs',
      key: 'rttMs',
      width: 100,
      sorter: (a, b) => a.rttMs - b.rttMs,
      render: (v: number) => <span style={{ color: v > 60 ? '#DC2626' : v > 40 ? '#D97706' : 'inherit' }}>{v} ms</span>,
    },
    { title: '抖动', dataIndex: 'jitterMs', key: 'jitterMs', width: 90, render: (v: number) => `${v} ms` },
    {
      title: '丢包率',
      dataIndex: 'packetLossPct',
      key: 'packetLossPct',
      width: 96,
      render: (v: number) => <span style={{ color: v > 3 ? '#DC2626' : v > 1 ? '#D97706' : 'inherit' }}>{v}%</span>,
    },
    {
      title: '可用带宽',
      dataIndex: 'availableBandwidthMbps',
      key: 'availableBandwidthMbps',
      width: 110,
      render: (v: number) => `${(v / 1000).toFixed(2)} Gbps`,
    },
    {
      title: '利用率',
      dataIndex: 'utilizationPct',
      key: 'utilizationPct',
      width: 140,
      sorter: (a, b) => a.utilizationPct - b.utilizationPct,
      render: (v: number) => (
        <div>
          <Progress
            percent={v}
            size="small"
            showInfo={false}
            strokeColor={v > 85 ? '#DC2626' : v > 70 ? '#D97706' : '#2563EB'}
            style={{ margin: 0 }}
          />
          <span className="muted">{v}%</span>
        </div>
      ),
    },
    {
      title: '质量评分',
      dataIndex: 'score',
      key: 'score',
      width: 96,
      sorter: (a, b) => a.score - b.score,
      render: (v: number) => (
        <span style={{ fontWeight: 600, color: v >= 85 ? '#16A34A' : v >= 60 ? '#D97706' : '#DC2626' }}>{v}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 88,
      render: (v: LinkItem['status']) => <StatusTag {...LINK_STATUS[v]} />,
    },
    {
      title: '最近探测',
      dataIndex: 'lastProbeAt',
      key: 'lastProbeAt',
      width: 120,
      render: (v: string, r) => <span className="muted">{probedAt[r.id] ? '刚刚' : relTime(v)}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 2 }}>
          <Button type="link" size="small" style={{ paddingInline: 4 }} onClick={() => message.info(`已切换 ${r.name} 主备路由`)}>
            切换主备
          </Button>
          <Button type="link" size="small" style={{ paddingInline: 4 }} onClick={() => message.success(`已对 ${r.name} 限速至 4 Gbps`)}>
            限速
          </Button>
        </div>
      ),
    },
  ];

  const scatterOption = {
    grid: { left: 4, right: 16, top: 20, bottom: 0, containLabel: true },
    tooltip: {
      formatter: (p: { data: [number, number, number, number] }) =>
        `${NODES.length ? '' : ''}RTT ${p.data[0]}ms · 丢包 ${p.data[1]}% · 流量 ${p.data[2]} Gbps`,
    },
    xAxis: { type: 'value', name: 'RTT (ms)', splitLine: { show: true } },
    yAxis: { type: 'value', name: '丢包率 (%)', splitLine: { show: true } },
    series: [
      {
        type: 'scatter',
        symbolSize: (d: number[]) => 10 + d[2] * 3,
        data: LINKS.filter((l) => l.status !== 'down').map((l) => [
          l.rttMs,
          l.packetLossPct,
          Number(((l.availableBandwidthMbps * l.utilizationPct) / 100 / 1000).toFixed(2)),
          l.status,
        ]),
        itemStyle: {
          color: (p: { data: (string | number)[] }) => {
            const s = p.data[3] as LinkItem['status'];
            return s === 'congested' ? '#D97706' : s === 'good' ? '#2563EB' : '#16A34A';
          },
          opacity: 0.75,
        },
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
    tooltip: { formatter: (p: { value: [number, number, number] }) => `${DAYS[p.value[1]]} ${p.value[0]}:00 · 利用率 ${p.value[2]}%` },
    xAxis: { type: 'category', data: Array.from({ length: 24 }).map((_, i) => `${i}h`), splitArea: { show: true }, axisLabel: { interval: 2 } },
    yAxis: { type: 'category', data: DAYS, splitArea: { show: true } },
    visualMap: {
      min: 0,
      max: 100,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemWidth: 10,
      itemHeight: 80,
      textStyle: { fontSize: 10 },
      inRange: { color: ['#EFF4FF', '#93B4F5', '#2563EB', '#D97706', '#DC2626'] },
    },
    series: [
      {
        type: 'heatmap',
        data: heatData,
        label: { show: false },
        itemStyle: { borderColor: 'transparent', borderWidth: 2, borderRadius: 2 },
      },
    ],
  };

  return (
    <div>
      <PageHeader
        title="链路监控"
        desc="端到端质量、可用带宽与拥塞趋势"
        actions={
          <Button type="primary" icon={<AimOutlined />} loading={probing} onClick={doProbe}>
            发起探测
          </Button>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard
          title="链路总数"
          value={String(LINKS.length)}
          unit="条"
          footer={`优 ${stats.excellent} · 良 ${stats.good} · 拥塞 ${stats.congested} · 中断 ${stats.down}`}
          spark={[1, 2, 3, 2, 4, 3, 5, 4, 6]}
        />
        <StatCard title="平均 RTT" value={stats.avgRtt.toFixed(1)} unit="ms" color="#06B6D4" footer="所有链路加权平均" spark={[3, 4, 3, 5, 4, 6, 5, 4, 3]} />
        <StatCard title="平均可用带宽" value={stats.avgBw.toFixed(2)} unit="Gbps" color="#8B5CF6" footer="剔除中断链路" spark={[2, 3, 3, 4, 5, 4, 6, 5, 6]} />
        <StatCard title="中断链路" value={String(stats.down)} unit="条" color="#DC2626" footer="新加坡 → 法兰克福" spark={[0, 0, 1, 0, 0, 2, 1, 1, 1]} />
      </div>

      <div className="cf-card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <Select
              allowClear
              placeholder="链路状态"
              style={{ width: 140 }}
              value={status}
              onChange={setStatus}
              options={Object.entries(LINK_STATUS).map(([k, v]) => ({ value: k, label: v.label }))}
            />
            <span className="muted">共 {rows.length} 条链路，最近一次全量探测 3 分钟前</span>
          </div>
        </div>
        <Table
          className="cf-table"
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={rows}
          scroll={{ x: 1400 }}
          pagination={false}
        />
      </div>

      <div className="grid grid-2">
        <ChartCard title="链路质量矩阵" desc="X 轴 RTT，Y 轴丢包率，点大小表示承载流量">
          <EChart option={scatterOption} height={300} />
        </ChartCard>
        <ChartCard title="时段利用率热力图" desc="近 7 天 × 24 小时 · 颜色越深利用率越高">
          <EChart option={heatOption} height={300} />
        </ChartCard>
      </div>
    </div>
  );
}
