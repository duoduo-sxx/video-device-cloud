import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Descriptions, Progress, Table, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageHeader, Ring, StatusTag } from '../../components/base';
import ChartCard from '../../components/ChartCard';
import EChart from '../../charts/EChart';
import { NODES } from '../../mock/seed';
import { useDataStore } from '../../store/dataStore';
import { JOB_STATUS, NODE_STATUS, NODE_TYPE, STORAGE_TYPE } from '../../constants/dict';
import { fmtBytes, fmtShortTime, relTime } from '../../utils/format';

export default function NodeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobs = useDataStore((s) => s.jobs);
  const node = NODES.find((n) => n.id === id);

  const series = useMemo(() => {
    if (!node) return [];
    return Array.from({ length: 24 }).map((_, i) => ({
      time: `${String(i).padStart(2, '0')}:00`,
      in: Number(((node.throughputMbps * (0.7 + Math.sin(i / 3) * 0.25)) / 1000).toFixed(2)),
      out: Number(((node.throughputMbps * (0.45 + Math.cos(i / 4) * 0.18)) / 1000).toFixed(2)),
    }));
  }, [node]);

  if (!node) {
    return (
      <div className="cf-card">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/nodes')}>
          返回节点列表
        </Button>
        <div style={{ padding: 40, textAlign: 'center' }} className="muted">
          节点不存在
        </div>
      </div>
    );
  }

  const relatedJobs = jobs.filter((j) => j.source.nodeId === node.id || j.target.nodeId === node.id).slice(0, 5);
  const siblings = NODES.filter((n) => n.region === node.region && n.id !== node.id).slice(0, 3);

  const trafficOption = {
    grid: { left: 4, right: 8, top: 30, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { right: 0, top: 0 },
    xAxis: { type: 'category', boundaryGap: false, data: series.map((s) => s.time), axisLabel: { interval: 3 } },
    yAxis: { type: 'value', name: 'Gbps', splitLine: { show: true } },
    series: [
      { name: '入向', type: 'line', smooth: true, showSymbol: false, data: series.map((s) => s.in), areaStyle: { opacity: 0.12 } },
      { name: '出向', type: 'line', smooth: true, showSymbol: false, data: series.map((s) => s.out), areaStyle: { opacity: 0.08 } },
    ],
  };

  const qualityOption = {
    grid: { left: 4, right: 4, top: 10, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', boundaryGap: false, data: Array.from({ length: 12 }).map((_, i) => `${i * 5}m`), axisLabel: { show: false } },
    yAxis: { type: 'value', splitLine: { show: true }, axisLabel: { show: false } },
    series: [{ type: 'line', smooth: true, showSymbol: false, data: Array.from({ length: 12 }).map((_, i) => 20 + Math.sin(i / 2) * 4 + (i % 5 === 0 ? 6 : 0)) }],
  };

  return (
    <div>
      <PageHeader
        title={node.name}
        desc={`${node.id} · ${node.region} · ${node.provider} · Agent ${node.agentVersion}`}
        actions={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/nodes')}>
            返回列表
          </Button>
        }
      />

      <div className="grid grid-2-1" style={{ marginBottom: 16 }}>
        <div className="cf-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <StatusTag {...NODE_STATUS[node.status]} />
            <StatusTag {...NODE_TYPE[node.type]} dot={false} />
            {node.tags.map((t) => (
              <Tag key={t} bordered={false}>
                {t}
              </Tag>
            ))}
            <span className="muted" style={{ marginLeft: 'auto' }}>最后心跳 {relTime(node.lastHeartbeat)}</span>
          </div>
          <Descriptions column={3} size="small" colon={false}>
            <Descriptions.Item label="公网 IP">{node.publicIp}</Descriptions.Item>
            <Descriptions.Item label="内网 IP">{node.privateIp}</Descriptions.Item>
            <Descriptions.Item label="带宽上限">{(node.bandwidthMbps / 1000).toFixed(1)} Gbps</Descriptions.Item>
            <Descriptions.Item label="当前吞吐">{fmtBytes((node.throughputMbps * 1e6) / 8)}/s</Descriptions.Item>
            <Descriptions.Item label="健康分">
              <span style={{ color: node.healthScore >= 90 ? '#16A34A' : '#D97706', fontWeight: 600 }}>{node.healthScore}</span>
            </Descriptions.Item>
            <Descriptions.Item label="承载任务">{relatedJobs.length} 个</Descriptions.Item>
          </Descriptions>
        </div>

        <div className="cf-card">
          <div className="cf-card-title" style={{ marginBottom: 14 }}>资源使用</div>
          <div className="grid grid-2" style={{ gap: 12 }}>
            {[
              { label: 'CPU', value: node.cpuUsage },
              { label: '内存', value: node.memUsage },
              { label: '磁盘', value: node.diskUsage },
              { label: '网络', value: Math.round((node.throughputMbps / node.bandwidthMbps) * 100) },
            ].map((r) => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Ring percent={r.value} size={48} stroke={5} color={r.value > 85 ? '#DC2626' : '#2563EB'} />
                <div>
                  <div className="muted">{r.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{r.value}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <ChartCard title="流量趋势" desc="近 24 小时 · 入向 / 出向">
          <EChart option={trafficOption} height={240} />
        </ChartCard>
        <ChartCard title="多网卡链路" desc="按网卡维度的带宽与质量">
          <Table
            className="cf-table"
            rowKey="name"
            size="small"
            pagination={false}
            dataSource={node.nicList}
            columns={[
              { title: '网卡', dataIndex: 'name', width: 80, render: (v) => <span className="mono">{v}</span> },
              { title: '运营商', dataIndex: 'isp', width: 100 },
              { title: 'IP', dataIndex: 'ip', width: 130, render: (v) => <span className="mono">{v}</span> },
              { title: '带宽', dataIndex: 'bandwidthMbps', width: 90, render: (v: number) => `${v / 1000} Gbps` },
              {
                title: '丢包率',
                dataIndex: 'packetLossPct',
                width: 90,
                render: (v: number) => <span style={{ color: v > 1 ? '#DC2626' : 'inherit' }}>{v}%</span>,
              },
            ]}
          />
        </ChartCard>
      </div>

      <div className="grid grid-3">
        <ChartCard title="质量探测" desc="RTT / 抖动 / 丢包（近 1 小时）">
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <div>
              <div className="muted">RTT</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{node.nicList[0]?.packetLossPct ? 28 : 22} ms</div>
            </div>
            <div>
              <div className="muted">抖动</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>2.4 ms</div>
            </div>
            <div>
              <div className="muted">丢包</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{node.nicList[0]?.packetLossPct ?? 0}%</div>
            </div>
          </div>
          <EChart option={qualityOption} height={120} />
        </ChartCard>

        <ChartCard title="承载任务" desc="该节点相关的最近任务">
          {relatedJobs.length === 0 && <div className="muted">暂无关联任务</div>}
          {relatedJobs.map((j) => (
            <div key={j.id} className="list-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${j.id}`)}>
              <div style={{ minWidth: 0 }}>
                <div className="ellipsis" style={{ fontSize: 13 }}>{j.name}</div>
                <div style={{ marginTop: 4 }}>
                  <StatusTag {...JOB_STATUS[j.status]} />
                  <Tag bordered={false} color={STORAGE_TYPE[j.source.storageType].color} style={{ marginLeft: 6 }}>
                    {j.source.storageType}
                  </Tag>
                </div>
              </div>
              <span className="muted">{fmtShortTime(j.createdAt)}</span>
            </div>
          ))}
        </ChartCard>

        <ChartCard title="同区域节点" desc="便于对比与调度">
          {siblings.length === 0 && <div className="muted">该区域无其他节点</div>}
          {siblings.map((n) => (
            <div key={n.id} className="list-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/nodes/${n.id}`)}>
              <div>
                <div style={{ fontSize: 13 }}>{n.name}</div>
                <div className="muted">{n.provider} · {n.status}</div>
              </div>
              <div style={{ width: 80 }}>
                <Progress percent={n.healthScore} size="small" showInfo={false} strokeColor="#16A34A" />
                <div className="muted" style={{ textAlign: 'right' }}>{n.healthScore}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <Button block onClick={() => navigate('/topology')}>查看网络拓扑</Button>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
