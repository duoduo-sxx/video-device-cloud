import { useEffect, useMemo, useState } from 'react';
import { Button, Descriptions, Drawer, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import { auditService } from '../../services';
import type { AuditLog } from '../../types';
import { USERS } from '../../mock/base';
import { downloadCsv, formatDateTime } from '../../utils/format';
import { toast } from '../../utils/feedback';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [user, setUser] = useState<string>();
  const [result, setResult] = useState<string>();
  const [detail, setDetail] = useState<AuditLog | undefined>();

  const load = async () => {
    const data = await auditService.list();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () =>
      logs.filter((l) => {
        if (keyword && !`${l.action}${l.object}${l.ip}`.toLowerCase().includes(keyword.toLowerCase())) return false;
        if (user && l.user !== user) return false;
        if (result && l.result !== result) return false;
        return true;
      }),
    [logs, keyword, user, result],
  );

  const columns: ColumnsType<AuditLog> = [
    { title: '时间', dataIndex: 'time', width: 170, render: (v) => <span className="num" style={{ fontSize: 12 }}>{formatDateTime(v)}</span> },
    { title: '操作人', dataIndex: 'user', width: 100 },
    { title: '操作动作', dataIndex: 'action', width: 150, render: (v) => <span style={{ fontSize: 12.5 }}>{v}</span> },
    {
      title: '操作对象',
      dataIndex: 'object',
      render: (v) => <span style={{ fontSize: 12.5 }}>{v}</span>,
    },
    { title: '来源 IP', dataIndex: 'ip', width: 140, render: (v) => <span className="mono" style={{ color: '#5A6B87' }}>{v}</span> },
    {
      title: '结果',
      dataIndex: 'result',
      width: 90,
      render: (v: string) => (
        <Tag
          style={{
            color: v === 'success' ? '#00B894' : '#EF4444',
            background: v === 'success' ? '#00B89414' : '#EF444414',
            borderColor: v === 'success' ? '#00B89433' : '#EF444433',
            marginInlineEnd: 0,
          }}
        >
          {v === 'success' ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '详情',
      key: 'act',
      width: 80,
      render: (_, r) => (
        <span className="link" style={{ fontSize: 12.5 }} onClick={() => setDetail(r)}>
          查看
        </span>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="审计日志"
        description="记录所有关键操作，支持按操作人、动作与结果追溯，日志默认保留 180 天"
        extra={
          <>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => {
                downloadCsv(`审计日志_${new Date().toISOString().slice(0, 10)}.csv`, [
                  ['时间', '操作人', '动作', '对象', '来源IP', '结果'],
                  ...filtered.map((l) => [formatDateTime(l.time), l.user, l.action, l.object, l.ip, l.result === 'success' ? '成功' : '失败']),
                ]);
                toast.success('审计日志已导出');
              }}
            >
              导出
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => void load()}>
              刷新
            </Button>
          </>
        }
      />

      <div className="filter-bar">
        <Space wrap size={[12, 12]} style={{ paddingBottom: 12 }}>
          <Input
            allowClear
            placeholder="搜索动作、对象或 IP"
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            allowClear
            placeholder="操作人"
            style={{ width: 130 }}
            value={user}
            onChange={setUser}
            options={USERS.map((u) => ({ value: u, label: u }))}
          />
          <Select
            allowClear
            placeholder="结果"
            style={{ width: 110 }}
            value={result}
            onChange={setResult}
            options={[
              { value: 'success', label: '成功' },
              { value: 'failed', label: '失败' },
            ]}
          />
          <span style={{ fontSize: 12.5, color: '#8A99B0' }}>共 {filtered.length} 条记录</span>
        </Space>
      </div>

      <div className="panel flush">
        <Table<AuditLog>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 15, showTotal: (t) => `共 ${t} 条` }}
        />
      </div>

      <Drawer title={detail ? `操作详情 · ${detail.id}` : ''} open={!!detail} onClose={() => setDetail(undefined)} width={560}>
        {detail ? (
          <>
            <Descriptions column={1} size="small" labelStyle={{ color: '#8A99B0', width: 88 }}>
              <Descriptions.Item label="操作时间">{formatDateTime(detail.time)}</Descriptions.Item>
              <Descriptions.Item label="操作人">{detail.user}</Descriptions.Item>
              <Descriptions.Item label="操作动作">{detail.action}</Descriptions.Item>
              <Descriptions.Item label="操作对象">{detail.object}</Descriptions.Item>
              <Descriptions.Item label="来源 IP">{detail.ip}</Descriptions.Item>
              <Descriptions.Item label="执行结果">{detail.result === 'success' ? '成功' : '失败'}</Descriptions.Item>
            </Descriptions>

            <div className="section-title" style={{ marginTop: 22 }}>
              变更前
            </div>
            <div className="code-block">{JSON.stringify(detail.detail.before, null, 2)}</div>

            <div className="section-title" style={{ marginTop: 18 }}>
              变更后
            </div>
            <div className="code-block" style={{ background: '#F3FBF8', borderColor: '#D7F0E7' }}>
              {JSON.stringify(detail.detail.after, null, 2)}
            </div>
          </>
        ) : null}
      </Drawer>
    </div>
  );
}
