import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Switch,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AppstoreOutlined,
  BarsOutlined,
  PlusOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard';
import { ProtocolTag } from '../../components/StatusTag';
import { channelService } from '../../services';
import type { Channel } from '../../types';
import { NODES, nodeById, regionShort } from '../../mock/base';
import { genSpeedSeries } from '../../mock/charts';
import { axisLabelStyle, chartTooltip, splitLineStyle } from '../../theme/chart';
import { formatRelative } from '../../utils/format';
import { toast } from '../../utils/feedback';

const STATUS_META: Record<string, { label: string; color: string }> = {
  healthy: { label: '正常', color: '#00B894' },
  congested: { label: '拥塞', color: '#F59E0B' },
  disabled: { label: '停用', color: '#8A99B0' },
};

export default function Channels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'card' | 'table'>('card');
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Channel | undefined>();
  const [probes, setProbes] = useState<{ time: string; latency: number; loss: number }[]>([]);
  const [probing, setProbing] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    const data = await channelService.list();
    setChannels(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    const healthy = channels.filter((c) => c.status === 'healthy').length;
    const congested = channels.filter((c) => c.status === 'congested').length;
    const disabled = channels.filter((c) => c.status === 'disabled').length;
    return { healthy, congested, disabled };
  }, [channels]);

  const openDetail = (c: Channel) => {
    setDetail(c);
    setProbes([
      { time: new Date(Date.now() - 3600_000).toISOString(), latency: c.latencyMs, loss: c.packetLoss },
      { time: new Date(Date.now() - 1800_000).toISOString(), latency: c.latencyMs + 3, loss: c.packetLoss + 0.02 },
    ]);
  };

  const probe = async () => {
    if (!detail) return;
    setProbing(true);
    const result = await channelService.probe(detail.id);
    setProbing(false);
    setProbes((prev) => [{ time: new Date().toISOString(), latency: result.latencyMs, loss: result.packetLoss }, ...prev]);
    toast.success(`探测完成：延迟 ${result.latencyMs}ms，丢包 ${result.packetLoss}%`);
  };

  const create = async () => {
    const values = await form.validateFields();
    await channelService.create(values);
    setCreateOpen(false);
    form.resetFields();
    await load();
    toast.success('通道已创建，等待首次心跳');
  };

  const drawerChart = useMemo(() => {
    if (!detail) return null;
    const series = genSpeedSeries(24, Math.round(detail.usedMbps / 2));
    return {
      grid: { left: 6, right: 10, top: 26, bottom: 0, containLabel: true },
      tooltip: { trigger: 'axis' as const, ...chartTooltip },
      legend: { right: 0, top: 0, icon: 'roundRect', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11, color: '#5A6B87' } },
      xAxis: {
        type: 'category' as const,
        data: series.labels.map((_, i) => `${i}h`),
        axisLabel: axisLabelStyle,
        axisLine: { lineStyle: { color: '#E9EEF6' } },
        axisTick: { show: false },
      },
      yAxis: [
        { type: 'value' as const, name: 'Mbps', nameTextStyle: { fontSize: 10, color: '#8A99B0' }, axisLabel: axisLabelStyle, splitLine: splitLineStyle },
        { type: 'value' as const, name: 'ms', nameTextStyle: { fontSize: 10, color: '#8A99B0' }, axisLabel: axisLabelStyle, splitLine: { show: false } },
      ],
      series: [
        { name: '吞吐', type: 'line' as const, smooth: true, symbol: 'none', data: series.values, lineStyle: { color: '#1668FF', width: 2 }, areaStyle: { color: 'rgba(22,104,255,0.10)' } },
        { name: '延迟', type: 'line' as const, smooth: true, symbol: 'none', yAxisIndex: 1, data: series.values.map((v) => Math.round(detail.latencyMs + (v % 11))), lineStyle: { color: '#F59E0B', width: 1.5, type: 'dashed' as const } },
      ],
    };
  }, [detail]);

  const columns: ColumnsType<Channel> = [
    {
      title: '通道',
      dataIndex: 'name',
      render: (v, r) => (
        <div className="stack">
          <span className="link" onClick={() => openDetail(r)}>
            {v}
          </span>
          <span style={{ fontSize: 11, color: '#8A99B0' }} className="mono">
            {r.id}
          </span>
        </div>
      ),
    },
    { title: '协议', dataIndex: 'protocol', width: 80, render: (v) => <ProtocolTag protocol={v} /> },
    {
      title: '链路',
      key: 'route',
      width: 220,
      render: (_, r) => (
        <span style={{ fontSize: 12.5 }}>
          {nodeById(r.sourceNodeId)?.name} <span className="muted">→</span> {nodeById(r.targetNodeId)?.name}
        </span>
      ),
    },
    {
      title: '带宽水位',
      key: 'water',
      width: 180,
      render: (_, r) => {
        const ratio = r.bandwidthMbps ? (r.usedMbps / r.bandwidthMbps) * 100 : 0;
        const color = ratio > 90 ? '#EF4444' : ratio > 80 ? '#F59E0B' : '#1668FF';
        return (
          <div>
            <div className="num" style={{ fontSize: 11.5, color: '#5A6B87' }}>
              {r.usedMbps} / {r.bandwidthMbps} Mbps
            </div>
            <div className="channel-water" style={{ margin: '5px 0 0' }}>
              <i style={{ width: `${ratio}%`, background: color }} />
            </div>
          </div>
        );
      },
    },
    { title: '延迟', dataIndex: 'latencyMs', width: 90, render: (v) => <span className="num">{v} ms</span> },
    { title: '丢包', dataIndex: 'packetLoss', width: 90, render: (v) => <span className="num">{v}%</span> },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: string) => {
        const meta = STATUS_META[v];
        return <Tag style={{ color: meta.color, background: `${meta.color}14`, borderColor: `${meta.color}33`, marginInlineEnd: 0 }}>{meta.label}</Tag>;
      },
    },
    { title: '承载任务', dataIndex: 'taskCount', width: 90, render: (v) => <span className="num">{v} 个</span> },
    {
      title: '操作',
      key: 'act',
      width: 100,
      render: (_, r) => (
        <span className="link" style={{ fontSize: 12.5 }} onClick={() => openDetail(r)}>
          查看详情
        </span>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="数据通道"
        description="维护节点之间的逻辑链路，监控带宽水位、延迟与丢包，拥塞链路会直接影响任务速率"
        extra={
          <>
            <Segmented
              value={view}
              onChange={(v) => setView(v as 'card' | 'table')}
              options={[
                { value: 'card', icon: <AppstoreOutlined /> },
                { value: 'table', icon: <BarsOutlined /> },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={() => void load()}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              新建通道
            </Button>
          </>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard title="通道总数" value={String(channels.length)} unit="条" deltaLabel="含停用通道" icon={<ThunderboltOutlined />} />
        <StatCard title="健康通道" value={String(stats.healthy)} unit="条" deltaLabel="可承载新任务" icon={<ThunderboltOutlined />} iconColor="#00B894" iconBg="#E6F8F3" />
        <StatCard title="拥塞通道" value={String(stats.congested)} unit="条" deltaLabel="建议错峰或分流" icon={<ThunderboltOutlined />} iconColor="#F59E0B" iconBg="#FFF6E6" />
        <StatCard title="停用通道" value={String(stats.disabled)} unit="条" deltaLabel="不参与调度" icon={<ThunderboltOutlined />} iconColor="#8A99B0" iconBg="#F1F5FB" />
      </div>

      {view === 'card' ? (
        <div className="grid grid-3">
          {channels.map((c) => {
            const ratio = c.bandwidthMbps ? (c.usedMbps / c.bandwidthMbps) * 100 : 0;
            const color = ratio > 90 ? '#EF4444' : ratio > 80 ? '#F59E0B' : '#1668FF';
            const meta = STATUS_META[c.status];
            return (
              <div className="channel-card" key={c.id} onClick={() => openDetail(c)}>
                <div className="flex-between">
                  <div className="flex-center">
                    <span className="dot" style={{ background: meta.color }} />
                    <span style={{ fontSize: 13.5, fontWeight: 500 }}>{c.name}</span>
                  </div>
                  <ProtocolTag protocol={c.protocol} />
                </div>
                <div style={{ fontSize: 12, color: '#7B8AA3', marginTop: 8 }}>
                  {nodeById(c.sourceNodeId)?.name} <span style={{ color: '#B0BCCD' }}>→</span> {nodeById(c.targetNodeId)?.name}
                </div>
                <div className="channel-water">
                  <i style={{ width: `${ratio}%`, background: color }} />
                </div>
                <div className="flex-between" style={{ fontSize: 11.5, color: '#8A99B0' }}>
                  <span className="num">
                    {c.usedMbps} / {c.bandwidthMbps} Mbps
                  </span>
                  <span>{ratio.toFixed(0)}% 水位</span>
                </div>
                <div style={{ display: 'flex', gap: 18, marginTop: 14, paddingTop: 12, borderTop: '1px dashed #EEF2F8' }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#8A99B0' }}>延迟</div>
                    <div className="num" style={{ fontSize: 13, fontWeight: 500 }}>{c.latencyMs} ms</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#8A99B0' }}>丢包</div>
                    <div className="num" style={{ fontSize: 13, fontWeight: 500 }}>{c.packetLoss}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#8A99B0' }}>加密</div>
                    <div style={{ fontSize: 12.5 }}>{c.encryption}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: 10.5, color: '#8A99B0' }}>QoS</div>
                    <div style={{ fontSize: 12.5 }}>{c.qos === 'high' ? '高' : c.qos === 'normal' ? '普通' : '低'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="panel flush">
          <Table<Channel> rowKey="id" loading={loading} columns={columns} dataSource={channels} pagination={{ pageSize: 10 }} />
        </div>
      )}

      <Modal
        title="新建数据通道"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={create}
        okText="创建通道"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} initialValues={{ protocol: 'S3', bandwidthMbps: 800, qos: 'normal', encryption: 'TLS 1.3', enabled: true }}>
          <Form.Item name="name" label="通道名称" rules={[{ required: true, message: '请输入通道名称' }]}>
            <Input placeholder="例如：华东1 ↔ 新加坡 备用专线" />
          </Form.Item>
          <div className="grid grid-2" style={{ gap: 16 }}>
            <Form.Item name="protocol" label="传输协议">
              <Select options={['S3', 'OSS', 'SFTP', 'HTTP', 'Kafka', 'HDFS', 'NFS'].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item name="bandwidthMbps" label="带宽上限（Mbps）">
              <InputNumber min={10} max={10000} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="sourceNodeId" label="源节点" rules={[{ required: true, message: '请选择源节点' }]} initialValue="ND-hz-01">
              <Select options={NODES.map((n) => ({ value: n.id, label: `${n.name} · ${regionShort(n.region)}` }))} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item name="targetNodeId" label="目标节点" rules={[{ required: true, message: '请选择目标节点' }]} initialValue="ND-bj-03">
              <Select options={NODES.map((n) => ({ value: n.id, label: `${n.name} · ${regionShort(n.region)}` }))} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item name="qos" label="QoS 优先级">
              <Select options={[{ value: 'high', label: '高' }, { value: 'normal', label: '普通' }, { value: 'low', label: '低' }]} />
            </Form.Item>
            <Form.Item name="encryption" label="加密方式">
              <Select options={[{ value: 'TLS 1.3' }, { value: 'TLS 1.2' }, { value: 'SM4-GCM' }]} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="说明该通道的用途、维护窗口或注意事项" />
          </Form.Item>
          <Form.Item name="enabled" label="创建后立即启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={detail ? `${detail.name} · ${detail.id}` : ''}
        open={!!detail}
        onClose={() => setDetail(undefined)}
        width={680}
      >
        {detail && drawerChart ? (
          <>
            <Descriptions column={2} size="small" labelStyle={{ color: '#8A99B0', width: 88 }}>
              <Descriptions.Item label="协议">{detail.protocol}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag style={{ color: STATUS_META[detail.status].color, background: `${STATUS_META[detail.status].color}14`, borderColor: `${STATUS_META[detail.status].color}33`, marginInlineEnd: 0 }}>
                  {STATUS_META[detail.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="源节点">{nodeById(detail.sourceNodeId)?.name}</Descriptions.Item>
              <Descriptions.Item label="目标节点">{nodeById(detail.targetNodeId)?.name}</Descriptions.Item>
              <Descriptions.Item label="带宽">{detail.bandwidthMbps} Mbps</Descriptions.Item>
              <Descriptions.Item label="加密">{detail.encryption}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatRelative(detail.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="承载任务">{detail.taskCount} 个</Descriptions.Item>
            </Descriptions>

            <div className="section-title" style={{ marginTop: 24 }}>
              近 24 小时吞吐与延迟
            </div>
            <ChartCard option={drawerChart} height={220} flush />

            <div className="flex-between" style={{ marginTop: 24, marginBottom: 10 }}>
              <div className="section-title" style={{ margin: 0 }}>
                健康检测记录
              </div>
              <Button size="small" icon={<ThunderboltOutlined />} loading={probing} onClick={probe}>
                立即检测
              </Button>
            </div>
            <div className="panel" style={{ padding: '4px 16px' }}>
              {probes.map((p, i) => (
                <div key={i} className="flex-between" style={{ padding: '10px 0', borderBottom: i === probes.length - 1 ? 'none' : '1px dashed #EEF2F8', fontSize: 12.5 }}>
                  <span style={{ color: '#5A6B87' }}>{new Date(p.time).toLocaleString('zh-CN', { hour12: false })}</span>
                  <span className="num">延迟 {p.latency} ms</span>
                  <span className="num">丢包 {p.loss}%</span>
                  <Tag color="success" style={{ marginInlineEnd: 0 }}>
                    通过
                  </Tag>
                </div>
              ))}
            </div>

            <div className="section-title" style={{ marginTop: 24 }}>
              QoS 与调度建议
            </div>
            <div style={{ background: '#F7F9FD', borderRadius: 8, padding: 14, fontSize: 12.5, color: '#5A6B87', lineHeight: 1.9 }}>
              当前 QoS 为「{detail.qos === 'high' ? '高' : detail.qos === 'normal' ? '普通' : '低'}」，
              水位 {((detail.usedMbps / detail.bandwidthMbps) * 100).toFixed(0)}%。建议将大文件归档任务调度至 02:00-06:00，
              并为该通道保留 15% 的突发带宽，避免与在线业务争抢。
            </div>
          </>
        ) : null}
      </Drawer>
    </div>
  );
}
