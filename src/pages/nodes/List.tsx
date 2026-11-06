import { useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Select, Table, Tag, message, type TableColumnsType } from 'antd';
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { PageHeader, Ring, StatusTag } from '../../components/base';
import StatCard from '../../components/StatCard';
import TableToolbar, { useColumnSetting } from '../../components/TableToolbar';
import AuthGuard from '../../components/AuthGuard';
import { NODES } from '../../mock/seed';
import { NODE_STATUS, NODE_TYPE, REGIONS } from '../../constants/dict';
import type { NodeItem } from '../../types';
import { exportCsv, fmtBytes, relTime } from '../../utils/format';
import { useNavigate } from 'react-router-dom';

const healthColor = (v: number) => (v >= 90 ? '#16A34A' : v >= 80 ? '#D97706' : '#DC2626');

export default function NodeList() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [region, setRegion] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<NodeItem[]>(NODES);
  const [form] = Form.useForm();

  const filtered = useMemo(
    () =>
      rows.filter((n) => {
        if (keyword && !n.name.includes(keyword) && !n.id.toLowerCase().includes(keyword.toLowerCase())) return false;
        if (type && n.type !== type) return false;
        if (status && n.status !== status) return false;
        if (region && n.region !== region) return false;
        return true;
      }),
    [rows, keyword, type, status, region],
  );

  const stats = useMemo(() => {
    const online = rows.filter((n) => n.status === 'online').length;
    const degraded = rows.filter((n) => n.status === 'degraded').length;
    const offline = rows.filter((n) => n.status === 'offline').length;
    const bw = rows.reduce((a, n) => a + n.bandwidthMbps, 0) / 1000;
    const tp = rows.reduce((a, n) => a + n.throughputMbps, 0) / 1000;
    const avg = rows.reduce((a, n) => a + n.healthScore, 0) / rows.length;
    return { online, degraded, offline, bw, tp, avg };
  }, [rows]);

  const columns: TableColumnsType<NodeItem> = [
    {
      title: '节点',
      key: 'name',
      width: 240,
      render: (_, r) => (
        <div>
          <div className="link-text" onClick={() => navigate(`/nodes/${r.id}`)}>{r.name}</div>
          <div className="muted mono" style={{ marginTop: 2 }}>{r.id}</div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (v: NodeItem['type']) => <StatusTag {...NODE_TYPE[v]} dot={false} />,
    },
    { title: '区域', dataIndex: 'region', key: 'region', width: 140 },
    { title: '云厂商', dataIndex: 'provider', key: 'provider', width: 110 },
    { title: '公网 IP', dataIndex: 'publicIp', key: 'publicIp', width: 130, render: (v) => <span className="mono">{v}</span> },
    {
      title: '带宽上限',
      dataIndex: 'bandwidthMbps',
      key: 'bandwidthMbps',
      width: 100,
      render: (v: number) => `${(v / 1000).toFixed(1)} Gbps`,
    },
    {
      title: '当前吞吐',
      dataIndex: 'throughputMbps',
      key: 'throughputMbps',
      width: 168,
      sorter: (a, b) => a.throughputMbps - b.throughputMbps,
      render: (v: number, r) => {
        const pct = (v / r.bandwidthMbps) * 100;
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>{fmtBytes((v * 1e6) / 8)}/s</span>
              <span className="muted">{pct.toFixed(0)}%</span>
            </div>
            <div className="mini-bar" style={{ marginTop: 4 }}>
              <i style={{ width: `${pct}%`, background: pct > 85 ? '#DC2626' : pct > 70 ? '#D97706' : '#2563EB' }} />
            </div>
          </div>
        );
      },
    },
    {
      title: 'CPU',
      dataIndex: 'cpuUsage',
      key: 'cpuUsage',
      width: 100,
      render: (v: number) => <Ring percent={v} size={30} stroke={3} color={v > 85 ? '#DC2626' : '#2563EB'} label={`${v}%`} />,
    },
    {
      title: '健康分',
      dataIndex: 'healthScore',
      key: 'healthScore',
      width: 100,
      sorter: (a, b) => a.healthScore - b.healthScore,
      render: (v: number) => (
        <span style={{ fontWeight: 600, color: healthColor(v) }}>{v.toFixed(1)}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 92,
      render: (v: NodeItem['status']) => <StatusTag {...NODE_STATUS[v]} />,
    },
    { title: 'Agent', dataIndex: 'agentVersion', key: 'agentVersion', width: 110, render: (v) => <span className="chip">{v}</span> },
    {
      title: '最后心跳',
      dataIndex: 'lastHeartbeat',
      key: 'lastHeartbeat',
      width: 110,
      render: (v: string) => <span className="muted">{relTime(v)}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="link" size="small" style={{ paddingInline: 4 }} onClick={() => navigate(`/nodes/${r.id}`)}>
            详情
          </Button>
          <AuthGuard>
            <Button
              type="link"
              size="small"
              style={{ paddingInline: 4 }}
              onClick={() => {
                if (r.status === 'offline') {
                  message.error('节点已离线，无法下发指令');
                  return;
                }
                message.success(`已向 ${r.name} 下发重启 Agent 指令`);
              }}
            >
              重启
            </Button>
            <Button
              type="link"
              size="small"
              danger
              style={{ paddingInline: 4 }}
              onClick={() => {
                setRows((prev) => prev.filter((x) => x.id !== r.id));
                message.success('节点已下线');
              }}
            >
              下线
            </Button>
          </AuthGuard>
        </div>
      ),
    },
  ];

  const { columns: visibleColumns, node: columnSetting } = useColumnSetting(columns);

  const exportRows = filtered.map((n) => ({
    节点ID: n.id,
    节点名称: n.name,
    类型: NODE_TYPE[n.type].label,
    区域: n.region,
    云厂商: n.provider,
    公网IP: n.publicIp,
    带宽上限Gbps: (n.bandwidthMbps / 1000).toFixed(1),
    健康分: n.healthScore,
    状态: NODE_STATUS[n.status].label,
    Agent版本: n.agentVersion,
  }));

  return (
    <div>
      <PageHeader
        title="节点管理"
        desc="云上 Region 节点、边缘节点与自建机房的统一视图"
        actions={
          <AuthGuard>
            <Button icon={<DownloadOutlined />} onClick={() => exportCsv('节点列表.csv', exportRows)}>
              导出
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
              注册节点
            </Button>
          </AuthGuard>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard
          title="节点总数"
          value={String(rows.length)}
          unit="个"
          footer={`在线 ${stats.online} · 降级 ${stats.degraded} · 离线 ${stats.offline}`}
        />
        <StatCard title="总带宽" value={stats.bw.toFixed(1)} unit="Gbps" color="#06B6D4" footer="含公网与专线出口" />
        <StatCard title="当前总吞吐" value={stats.tp.toFixed(1)} unit="Gbps" color="#8B5CF6" footer="所有节点实时汇总" />
        <StatCard title="平均健康分" value={stats.avg.toFixed(1)} color="#16A34A" footer="基于心跳、丢包与资源水位" />
      </div>

      <div className="cf-card" style={{ padding: 16 }}>
        <TableToolbar
          search={keyword}
          onSearch={setKeyword}
          placeholder="搜索节点名称或 ID"
          filters={
            <>
              <Select
                allowClear
                placeholder="节点类型"
                style={{ width: 130 }}
                value={type}
                onChange={setType}
                options={Object.entries(NODE_TYPE).map(([k, v]) => ({ value: k, label: v.label }))}
              />
              <Select
                allowClear
                placeholder="状态"
                style={{ width: 110 }}
                value={status}
                onChange={setStatus}
                options={Object.entries(NODE_STATUS).map(([k, v]) => ({ value: k, label: v.label }))}
              />
              <Select
                allowClear
                showSearch
                placeholder="区域"
                style={{ width: 150 }}
                value={region}
                onChange={setRegion}
                options={REGIONS.map((r) => ({ value: r, label: r }))}
              />
            </>
          }
          extra={columnSetting}
          exportRows={exportRows}
          exportName="节点列表.csv"
          onRefresh={() => message.success('节点状态已刷新')}
        />
        <Table
          className="cf-table"
          rowKey="id"
          size="middle"
          columns={visibleColumns}
          dataSource={filtered}
          scroll={{ x: 1560 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 个节点` }}
        />
      </div>

      <Modal
        open={open}
        title="注册节点"
        okText="提交注册"
        onCancel={() => setOpen(false)}
        onOk={async () => {
          const v = await form.validateFields();
          const newNode: NodeItem = {
            id: `NODE-${v.name.slice(0, 2).toUpperCase()}-${String(rows.length + 1).padStart(2, '0')}`,
            name: v.name,
            type: v.type,
            region: v.region,
            provider: v.provider,
            publicIp: v.publicIp,
            privateIp: '10.30.1.11',
            bandwidthMbps: Number(v.bandwidth) * 1000,
            throughputMbps: 0,
            cpuUsage: 6,
            memUsage: 12,
            diskUsage: 4,
            healthScore: 99.2,
            status: 'online',
            agentVersion: 'v2.4.1',
            lastHeartbeat: new Date().toISOString(),
            tags: ['新注册'],
            nicList: [],
          };
          setRows((prev) => [newNode, ...prev]);
          setOpen(false);
          form.resetFields();
          message.success('节点注册成功，Agent 正在接入');
        }}
      >
        <Form form={form} layout="vertical" initialValues={{ type: 'cloud', region: REGIONS[0], bandwidth: 10 }}>
          <Form.Item name="name" label="节点名称" rules={[{ required: true, message: '请输入节点名称' }]}>
            <Input placeholder="如：华北2-北京-接入节点" />
          </Form.Item>
          <Form.Item name="type" label="节点类型" rules={[{ required: true }]}>
            <Select options={Object.entries(NODE_TYPE).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Form.Item>
          <Form.Item name="region" label="区域" rules={[{ required: true }]}>
            <Select options={REGIONS.map((r) => ({ value: r, label: r }))} />
          </Form.Item>
          <Form.Item name="provider" label="云厂商" rules={[{ required: true, message: '请选择云厂商' }]}>
            <Select options={['阿里云', '腾讯云', '华为云', 'AWS', '自建 IDC'].map((p) => ({ value: p, label: p }))} />
          </Form.Item>
          <Form.Item name="publicIp" label="公网 IP" rules={[{ required: true, message: '请输入公网 IP' }]}>
            <Input placeholder="47.94.12.36" />
          </Form.Item>
          <Form.Item name="bandwidth" label="带宽上限（Gbps）">
            <Select options={[1, 2, 4, 6, 8, 10].map((b) => ({ value: b, label: `${b} Gbps` }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
