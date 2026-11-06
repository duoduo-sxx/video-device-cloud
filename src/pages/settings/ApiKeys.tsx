import { useEffect, useState } from 'react';
import { Alert, Button, Form, Input, Modal, Select, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined, KeyOutlined, PlusOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import { keyService } from '../../services';
import type { ApiKey } from '../../types';
import { copyText, formatDateTime, formatRelative } from '../../utils/format';
import { toast } from '../../utils/feedback';

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string>();
  const [form] = Form.useForm();

  const load = async () => {
    const data = await keyService.list();
    setKeys(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const columns: ColumnsType<ApiKey> = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (v, r) => (
        <div className="stack">
          <span style={{ fontSize: 13 }}>{v}</span>
          <span className="mono" style={{ fontSize: 11, color: '#8A99B0' }}>{r.prefix}••••••••</span>
        </div>
      ),
    },
    { title: '权限范围', dataIndex: 'scope', width: 200 },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, render: (v) => <span className="num" style={{ fontSize: 12 }}>{formatDateTime(v)}</span> },
    { title: '最后使用', dataIndex: 'lastUsedAt', width: 120, render: (v) => <span style={{ fontSize: 12 }}>{formatRelative(v)}</span> },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => (
        <Tag color={v === '启用' ? 'success' : 'default'} style={{ marginInlineEnd: 0 }}>
          {v}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'act',
      width: 120,
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 10 }}>
          <span
            className="link"
            style={{ fontSize: 12.5 }}
            onClick={() =>
              void copyText(`${r.prefix}${'x'.repeat(24)}`).then((ok) =>
                ok ? toast.success('密钥前缀已复制（完整密钥仅在创建时展示）') : toast.error('复制失败'),
              )
            }
          >
            复制
          </span>
          {r.status === '启用' ? (
            <span
              className="link"
              style={{ fontSize: 12.5, color: '#EF4444' }}
              onClick={() =>
                Modal.confirm({
                  title: `吊销密钥「${r.name}」？`,
                  content: '吊销后使用该密钥的集成将立即失效，且不可恢复。',
                  okText: '确认吊销',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: () => {
                    setKeys((prev) => prev.map((k) => (k.id === r.id ? { ...k, status: '已吊销' } : k)));
                    toast.success('密钥已吊销');
                  },
                })
              }
            >
              吊销
            </span>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="API 密钥"
        description="为外部系统签发访问凭证，按最小权限原则分配 scope，密钥仅在创建时展示一次"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCreatedKey(undefined);
              form.resetFields();
              setOpen(true);
            }}
          >
            新建密钥
          </Button>
        }
      />

      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="密钥等同于账号密码"
        description="请勿将密钥写入前端代码或提交至代码仓库。建议每 90 天轮换一次，并为不同系统分配独立密钥。"
      />

      <div className="panel flush">
        <Table<ApiKey> rowKey="id" loading={loading} columns={columns} dataSource={keys} pagination={false} />
      </div>

      <Modal
        title={createdKey ? '密钥已创建' : '新建 API 密钥'}
        open={open}
        onCancel={() => setOpen(false)}
        footer={
          createdKey ? (
            <Button
              type="primary"
              onClick={() => {
                setOpen(false);
                setCreatedKey(undefined);
              }}
            >
              我已保存
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={() => {
                const values = form.getFieldsValue();
                if (!values.name) {
                  toast.warning('请填写密钥名称');
                  return;
                }
                const raw = `sk-live-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
                setCreatedKey(raw);
                setKeys((prev) => [
                  {
                    id: `KEY-0${prev.length + 1}`,
                    name: values.name,
                    prefix: raw.slice(0, 12),
                    scope: values.scope?.join(' / ') ?? '任务只读',
                    createdAt: new Date().toISOString(),
                    lastUsedAt: new Date().toISOString(),
                    status: '启用',
                  },
                  ...prev,
                ]);
              }}
            >
              生成密钥
            </Button>
          )
        }
        okText="生成密钥"
        width={520}
      >
        {createdKey ? (
          <>
            <Alert
              type="error"
              showIcon
              message="请立即复制并妥善保存"
              description="关闭此窗口后将无法再次查看完整密钥。"
              style={{ margin: '12px 0 16px' }}
            />
            <div className="code-block" style={{ fontSize: 13, letterSpacing: 0.2 }}>{createdKey}</div>
            <Button
              block
              icon={<CopyOutlined />}
              style={{ marginTop: 12 }}
              onClick={() =>
                void copyText(createdKey).then((ok) => (ok ? toast.success('完整密钥已复制') : toast.error('复制失败')))
              }
            >
              复制密钥
            </Button>
          </>
        ) : (
          <Form form={form} layout="vertical" style={{ marginTop: 16 }} initialValues={{ scope: ['任务只读'] }}>
            <Form.Item name="name" label="密钥名称" rules={[{ required: true, message: '请输入密钥名称' }]}>
              <Input placeholder="例如：数据同步服务" />
            </Form.Item>
            <Form.Item name="scope" label="权限范围">
              <Select
                mode="multiple"
                options={[
                  { value: '任务只读', label: '任务只读' },
                  { value: '任务读写', label: '任务读写' },
                  { value: '通道只读', label: '通道只读' },
                  { value: '报表只读', label: '报表只读' },
                  { value: '告警只读', label: '告警只读' },
                ]}
              />
            </Form.Item>
            <Form.Item label="有效期">
              <Select defaultValue="90" options={[
                { value: '30', label: '30 天' },
                { value: '90', label: '90 天' },
                { value: '365', label: '1 年' },
                { value: '0', label: '长期有效' },
              ]} />
            </Form.Item>
            <div style={{ fontSize: 11.5, color: '#8A99B0', lineHeight: 1.8 }}>
              <KeyOutlined /> 密钥将继承创建者的部分权限，若创建者被禁用，密钥同时失效。
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
}
