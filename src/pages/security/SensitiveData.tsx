import { useEffect, useMemo, useState } from 'react';
import { Button, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { LevelTag } from '../../components/StatusTag';
import { sensitiveService } from '../../services';
import type { SensitiveHit } from '../../types';
import { formatRelative } from '../../utils/format';
import { toast } from '../../utils/feedback';

export default function SensitiveData() {
  const [hits, setHits] = useState<SensitiveHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = async () => {
    const data = await sensitiveService.list();
    setHits(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(
    () => ({
      high: hits.filter((h) => h.level === 'high').length,
      pending: hits.filter((h) => h.status === '待处理').length,
      sources: new Set(hits.map((h) => h.datasource)).size,
    }),
    [hits],
  );

  const columns: ColumnsType<SensitiveHit> = [
    { title: '数据源', dataIndex: 'datasource', width: 150 },
    {
      title: '路径',
      dataIndex: 'path',
      render: (v) => (
        <span className="mono" style={{ fontSize: 11.5, color: '#5A6B87' }}>
          {v}
        </span>
      ),
    },
    {
      title: '命中规则',
      dataIndex: 'rule',
      width: 110,
      render: (v) => (
        <Tag color="error" style={{ marginInlineEnd: 0 }}>
          {v}
        </Tag>
      ),
    },
    { title: '敏感级别', dataIndex: 'level', width: 100, render: (v) => <LevelTag level={v} /> },
    {
      title: '脱敏样本',
      dataIndex: 'sample',
      width: 190,
      render: (v) => <span className="mono" style={{ fontSize: 11.5 }}>{v}</span>,
    },
    { title: '扫描时间', dataIndex: 'scannedAt', width: 120, render: (v) => <span style={{ fontSize: 12 }}>{formatRelative(v)}</span> },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => {
        const color = v === '待处理' ? '#F59E0B' : v === '已处置' ? '#00B894' : '#8A99B0';
        return <Tag style={{ color, background: `${color}14`, borderColor: `${color}33`, marginInlineEnd: 0 }}>{v}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'act',
      width: 90,
      render: (_, r) => (
        <span
          className="link"
          style={{ fontSize: 12.5 }}
          onClick={() => {
            if (r.status !== '待处理') {
              toast.info('该记录已处理');
              return;
            }
            setHits((prev) => prev.map((h) => (h.id === r.id ? { ...h, status: '已处置' } : h)));
            toast.success('已标记为已处置');
          }}
        >
          处置
        </span>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="敏感数据"
        description="对数据源进行周期性扫描，识别身份证号、手机号、银行卡等敏感字段并输出脱敏样本"
        extra={
          <Button
            type="primary"
            icon={<ReloadOutlined spin={scanning} />}
            loading={scanning}
            onClick={() => {
              setScanning(true);
              setTimeout(() => {
                setScanning(false);
                toast.success('扫描完成，新增 2 条命中记录');
              }, 1800);
            }}
          >
            重新扫描
          </Button>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard title="扫描数据源" value={String(stats.sources)} unit="个" deltaLabel="覆盖核心库与对象存储" icon={<SafetyCertificateOutlined />} />
        <StatCard title="命中记录" value={String(hits.length)} unit="条" deltaLabel="近 7 天" icon={<SafetyCertificateOutlined />} iconColor="#F59E0B" iconBg="#FFF6E6" />
        <StatCard title="高危命中" value={String(stats.high)} unit="条" deltaLabel="需 24 小时内处置" icon={<SafetyCertificateOutlined />} iconColor="#EF4444" iconBg="#FDECEC" />
        <StatCard title="待处理" value={String(stats.pending)} unit="条" deltaLabel="含 2 条跨境传输" icon={<SafetyCertificateOutlined />} iconColor="#7C5CFF" iconBg="#F1EEFF" />
      </div>

      <div className="panel flush">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEF2F8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13 }}>
            扫描结果 <span className="muted" style={{ fontSize: 12 }}>规则库版本 2026.09 · 共 42 条识别规则</span>
          </span>
          <span style={{ fontSize: 12, color: '#8A99B0' }}>下次自动扫描：明日 02:00</span>
        </div>
        <Table<SensitiveHit>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={hits}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        />
      </div>
    </div>
  );
}
