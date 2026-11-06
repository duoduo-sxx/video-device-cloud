import { useState } from 'react';
import { Button, Form, Input, Modal, Select, Tag, message } from 'antd';
import { ApiOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { PageHeader, StatusTag } from '../../components/base';
import { CONNECTORS } from '../../mock/seed';
import { STORAGE_TYPE } from '../../constants/dict';
import type { Connector } from '../../types';
import { relTime } from '../../utils/format';
import { testConnector } from '../../services/api';

const STATUS: Record<Connector['status'], { label: string; color: string }> = {
  normal: { label: '正常', color: '#16A34A' },
  error: { label: '异常', color: '#DC2626' },
  unverified: { label: '未验证', color: '#94A3B8' },
};

export default function Connectors() {
  const [rows, setRows] = useState<Connector[]>(CONNECTORS);
  const [testing, setTesting] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const test = async (c: Connector) => {
    setTesting(c.id);
    const res = await testConnector(c.name);
    setTesting(null);
    setRows((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: res.ok ? 'normal' : 'error', lastCheckedAt: new Date().toISOString() } : x)));
    if (res.ok) message.success(`${c.name}：${res.message}`);
    else message.error(`${c.name}：${res.message}`);
  };

  return (
    <div>
      <PageHeader
        title="连接器管理"
        desc="对象存储、文件系统与消息队列的接入凭证与连通性"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            新增连接器
          </Button>
        }
      />

      <div className="grid grid-3">
        {rows.map((c) => (
          <div key={c.id} className="cf-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${STORAGE_TYPE[c.type].color}14`,
                    color: STORAGE_TYPE[c.type].color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                >
                  {c.type}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                  <div className="muted">{c.id} · {c.region}</div>
                </div>
              </div>
              <StatusTag {...STATUS[c.status]} />
            </div>

            <div style={{ margin: '14px 0 10px' }}>
              <div className="muted">Endpoint</div>
              <div className="mono ellipsis" style={{ fontSize: 12 }}>{c.endpoint}</div>
            </div>

            <div className="grid grid-2" style={{ gap: 8 }}>
              <div>
                <div className="muted">吞吐能力</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {c.throughputMbps ? `${(c.throughputMbps / 1000).toFixed(2)} Gbps` : '—'}
                </div>
              </div>
              <div>
                <div className="muted">最近检测</div>
                <div style={{ fontSize: 13 }}>{relTime(c.lastCheckedAt)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 14, borderTop: '1px dashed var(--border)', paddingTop: 12 }}>
              <Button size="small" icon={<ApiOutlined />} loading={testing === c.id} onClick={() => test(c)}>
                测试连接
              </Button>
              <Button size="small" icon={<EditOutlined />} onClick={() => message.info('编辑连接器（演示）')}>
                编辑
              </Button>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  setRows((prev) => prev.filter((x) => x.id !== c.id));
                  message.success('连接器已删除');
                }}
              >
                删除
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="cf-card" style={{ marginTop: 16 }}>
        <div className="cf-card-title" style={{ marginBottom: 8 }}>接入说明</div>
        <div className="muted" style={{ lineHeight: 1.9, fontSize: 13 }}>
          1. 连接器凭证使用 AES-256 加密存储，仅在传输进程内解密；<br />
          2. 新增连接器后需先通过连通性检测，才能被任务引用；<br />
          3. 跨域连接器需额外配置白名单与专线标识，否则任务会命中合规拦截。
        </div>
      </div>

      <Modal
        open={open}
        title="新增连接器"
        okText="创建并测试"
        onCancel={() => setOpen(false)}
        onOk={async () => {
          const v = await form.validateFields();
          setRows((prev) => [
            {
              id: `CONN-${String(prev.length + 1).padStart(3, '0')}`,
              name: v.name,
              type: v.type,
              endpoint: v.endpoint,
              region: v.region,
              status: 'unverified',
              lastCheckedAt: new Date().toISOString(),
              throughputMbps: 0,
            },
            ...prev,
          ]);
          setOpen(false);
          form.resetFields();
          message.success('连接器已创建，请执行连通性检测');
        }}
      >
        <Form form={form} layout="vertical" initialValues={{ type: 'OSS', region: '华东1（上海）' }}>
          <Form.Item name="name" label="连接器名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：阿里云 OSS - 华南1" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={Object.keys(STORAGE_TYPE).map((k) => ({ value: k, label: k }))} />
          </Form.Item>
          <Form.Item name="endpoint" label="Endpoint" rules={[{ required: true, message: '请输入 Endpoint' }]}>
            <Input placeholder="oss-cn-shenzhen.aliyuncs.com" />
          </Form.Item>
          <Form.Item name="region" label="区域">
            <Select options={['华东1（上海）', '华北2（北京）', '华南1（广州）', '新加坡'].map((r) => ({ value: r, label: r }))} />
          </Form.Item>
          <Form.Item name="ak" label="Access Key">
            <Input.Password placeholder="加密存储，不回显" />
          </Form.Item>
          <div>
            <Tag bordered={false} color="orange">安全提示</Tag>
            <span className="muted">建议使用最小权限的专用子账号，禁止使用主账号密钥。</span>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
