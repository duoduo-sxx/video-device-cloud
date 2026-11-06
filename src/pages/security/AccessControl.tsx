import { useState } from 'react';
import { Button, Input, Modal, Select, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { KeyOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import { toast } from '../../utils/feedback';

interface KeyRow {
  id: string;
  algorithm: string;
  createdAt: string;
  status: '生效中' | '已轮换';
  owner: string;
}

const INITIAL_KEYS: KeyRow[] = [
  { id: 'KEY-2026-09', algorithm: 'AES-256-GCM', createdAt: '2026-09-01 02:00', status: '生效中', owner: '系统托管' },
  { id: 'KEY-2026-06', algorithm: 'AES-256-GCM', createdAt: '2026-06-01 02:00', status: '已轮换', owner: '系统托管' },
  { id: 'KEY-SM4-01', algorithm: 'SM4-GCM', createdAt: '2026-03-12 10:24', status: '生效中', owner: '苏芮' },
  { id: 'KEY-2025-12', algorithm: 'AES-256-GCM', createdAt: '2025-12-01 02:00', status: '已轮换', owner: '系统托管' },
];

export default function AccessControl() {
  const [forceEncrypt, setForceEncrypt] = useState(true);
  const [mfa, setMfa] = useState(true);
  const [watermark, setWatermark] = useState(false);
  const [algorithm, setAlgorithm] = useState('TLS 1.3');
  const [whitelist, setWhitelist] = useState('10.12.0.0/16\n10.20.0.0/16\n10.30.0.0/16');
  const [keys, setKeys] = useState<KeyRow[]>(INITIAL_KEYS);
  const [rotateTarget, setRotateTarget] = useState<KeyRow | undefined>();

  const columns: ColumnsType<KeyRow> = [
    { title: '密钥 ID', dataIndex: 'id', render: (v) => <span className="mono" style={{ fontSize: 12 }}>{v}</span> },
    { title: '算法', dataIndex: 'algorithm', width: 150 },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, render: (v) => <span className="num" style={{ fontSize: 12 }}>{v}</span> },
    { title: '托管人', dataIndex: 'owner', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => (
        <Tag color={v === '生效中' ? 'success' : 'default'} style={{ marginInlineEnd: 0 }}>
          {v}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'act',
      width: 90,
      render: (_, r) =>
        r.status === '生效中' ? (
          <span className="link" style={{ fontSize: 12.5 }} onClick={() => setRotateTarget(r)}>
            轮换
          </span>
        ) : (
          <span style={{ fontSize: 12, color: '#B0BCCD' }}>—</span>
        ),
    },
  ];

  return (
    <div className="page" style={{ maxWidth: 1180 }}>
      <PageHeader
        title="加密与访问控制"
        description="统一管理传输加密算法、密钥轮换与访问边界，所有变更都会写入审计日志"
        extra={
          <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={() => toast.success('安全策略已保存')}>
            保存全部设置
          </Button>
        }
      />

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head">
          <div className="panel-title">
            <LockOutlined style={{ color: '#1668FF' }} />
            传输加密
          </div>
          <Tag color={forceEncrypt ? 'success' : 'default'} style={{ marginInlineEnd: 0 }}>
            {forceEncrypt ? '已强制加密' : '允许明文传输'}
          </Tag>
        </div>
        <div className="grid grid-3" style={{ gap: 24 }}>
          <div>
            <div style={{ fontSize: 12.5, color: '#5A6B87', marginBottom: 8 }}>加密协议</div>
            <Select
              style={{ width: '100%' }}
              value={algorithm}
              onChange={setAlgorithm}
              options={[
                { value: 'TLS 1.3', label: 'TLS 1.3（推荐）' },
                { value: 'TLS 1.2', label: 'TLS 1.2' },
                { value: 'SM4-GCM', label: 'SM4-GCM（国密）' },
              ]}
            />
          </div>
          <div>
            <div style={{ fontSize: 12.5, color: '#5A6B87', marginBottom: 8 }}>强制加密传输</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 34 }}>
              <Switch checked={forceEncrypt} onChange={setForceEncrypt} />
              <span style={{ fontSize: 12, color: '#8A99B0' }}>关闭后允许 HTTP/FTP 明文通道</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12.5, color: '#5A6B87', marginBottom: 8 }}>合规水印</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 34 }}>
              <Switch checked={watermark} onChange={setWatermark} />
              <span style={{ fontSize: 12, color: '#8A99B0' }}>下载数据集时叠加用户水印</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head">
          <div className="panel-title">
            <KeyOutlined style={{ color: '#F59E0B' }} />
            密钥管理
            <span className="panel-sub">默认 90 天自动轮换</span>
          </div>
        </div>
        <Table<KeyRow> rowKey="id" size="middle" columns={columns} dataSource={keys} pagination={false} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">
            <SafetyCertificateOutlined style={{ color: '#00B894' }} />
            访问控制
          </div>
        </div>
        <div className="grid grid-2" style={{ gap: 28 }}>
          <div>
            <div style={{ fontSize: 12.5, color: '#5A6B87', marginBottom: 8 }}>IP 白名单（每行一个 CIDR）</div>
            <Input.TextArea
              rows={6}
              value={whitelist}
              onChange={(e) => setWhitelist(e.target.value)}
              style={{ fontFamily: 'SFMono-Regular, Consolas, monospace', fontSize: 12.5 }}
            />
            <div style={{ fontSize: 11.5, color: '#8A99B0', marginTop: 6 }}>
              不在白名单内的 IP 将无法访问控制台与 API，当前共 {whitelist.split('\n').filter(Boolean).length} 条规则。
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12.5, color: '#5A6B87', marginBottom: 8 }}>允许访问时间段</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <Input defaultValue="08:00" addonBefore="开始" />
              <Input defaultValue="22:00" addonBefore="结束" />
            </div>
            <div className="flex-between" style={{ padding: '12px 0', borderTop: '1px dashed #EEF2F8' }}>
              <div>
                <div style={{ fontSize: 12.5 }}>强制多因素认证</div>
                <div style={{ fontSize: 11.5, color: '#8A99B0', marginTop: 2 }}>管理员与运维角色必须开启</div>
              </div>
              <Switch checked={mfa} onChange={setMfa} />
            </div>
            <div className="flex-between" style={{ padding: '12px 0', borderTop: '1px dashed #EEF2F8' }}>
              <div>
                <div style={{ fontSize: 12.5 }}>异地登录拦截</div>
                <div style={{ fontSize: 11.5, color: '#8A99B0', marginTop: 2 }}>检测到非常用地区登录时要求二次验证</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex-between" style={{ padding: '12px 0', borderTop: '1px dashed #EEF2F8' }}>
              <div>
                <div style={{ fontSize: 12.5 }}>下载需审批</div>
                <div style={{ fontSize: 11.5, color: '#8A99B0', marginTop: 2 }}>涉敏数据集的下载操作进入审批流</div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
      </div>

      <Modal
        title={`轮换密钥 ${rotateTarget?.id ?? ''}`}
        open={!!rotateTarget}
        onCancel={() => setRotateTarget(undefined)}
        onOk={() => {
          if (rotateTarget) {
            setKeys((prev) => {
              const rotated = prev.map((k) => (k.id === rotateTarget.id ? { ...k, status: '已轮换' as const } : k));
              const created: KeyRow = {
                id: `KEY-${new Date().toISOString().slice(0, 7)}`,
                algorithm: rotateTarget.algorithm,
                createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
                status: '生效中',
                owner: '系统托管',
              };
              return [created, ...rotated];
            });
            toast.success('密钥已轮换，旧密钥进入 30 天只读期');
          }
          setRotateTarget(undefined);
        }}
        okText="确认轮换"
        width={440}
      >
        <div style={{ fontSize: 12.5, color: '#5A6B87', lineHeight: 1.9, margin: '12px 0' }}>
          轮换后将生成新的数据加密密钥，历史数据仍可用旧密钥解密，30 天后旧密钥自动销毁。
          该操作不可撤销，请确认业务低峰期执行。
        </div>
      </Modal>
    </div>
  );
}
