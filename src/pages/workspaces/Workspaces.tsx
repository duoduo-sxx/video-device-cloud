import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Form, Input, Modal, Radio, Select, Tag } from 'antd';
import { LockOutlined, PlusOutlined, TeamOutlined, UnlockOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import { workspaceService } from '../../services';
import type { Workspace } from '../../types';
import { formatRelative } from '../../utils/format';
import { toast } from '../../utils/feedback';

const AVATAR_COLORS = ['#1668FF', '#00B894', '#7C5CFF', '#F59E0B', '#0EA5E9', '#EF4444'];

export default function Workspaces() {
  const navigate = useNavigate();
  const [list, setList] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    const data = await workspaceService.list();
    setList(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    const values = await form.validateFields();
    const ws: Workspace = {
      id: `WS-0${list.length + 1}`,
      name: values.name,
      description: values.description ?? '',
      visibility: values.visibility,
      owner: '陈默',
      members: [
        { name: '陈默', email: 'chenmo@xinglan-tech.com', role: 'owner', joinedAt: new Date().toISOString() },
      ],
      datasetCount: 0,
      usedGB: 0,
      quotaGB: values.quotaGB ?? 1024,
      updatedAt: new Date().toISOString(),
    };
    setList([ws, ...list]);
    setOpen(false);
    form.resetFields();
    toast.success('协同空间已创建');
  };

  return (
    <div className="page">
      <PageHeader
        title="协同空间"
        description="以空间为单位组织数据资产与成员权限，让同一份数据被多个团队复用"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            新建空间
          </Button>
        }
      />

      <div className="grid grid-3">
        {list.map((w) => (
          <div
            key={w.id}
            className="panel"
            style={{ cursor: 'pointer', transition: 'all .16s' }}
            onClick={() => navigate(`/workspaces/${w.id}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,24,40,0.07)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div className="flex-between" style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {w.visibility === 'public' ? (
                  <UnlockOutlined style={{ color: '#00B894', fontSize: 13 }} />
                ) : (
                  <LockOutlined style={{ color: '#F59E0B', fontSize: 13 }} />
                )}
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>{w.name}</span>
              </div>
              <Tag style={{ marginInlineEnd: 0, fontSize: 10.5 }}>
                {w.visibility === 'public' ? '公开' : '私有'}
              </Tag>
            </div>

            <div style={{ fontSize: 12.5, color: '#7B8AA3', lineHeight: 1.7, minHeight: 42 }}>{w.description}</div>

            <div style={{ display: 'flex', alignItems: 'center', marginTop: 14 }}>
              {w.members.slice(0, 4).map((m, i) => (
                <Avatar
                  key={m.email}
                  className="avatar-chip"
                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  size={26}
                >
                  {m.name.slice(0, 1)}
                </Avatar>
              ))}
              {w.members.length > 4 ? (
                <span style={{ fontSize: 11.5, color: '#8A99B0', marginLeft: 8 }}>+{w.members.length - 4}</span>
              ) : null}
              <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#8A99B0' }}>
                <TeamOutlined /> {w.members.length} 人
              </span>
            </div>

            <div className="flex-between" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #EEF2F8', fontSize: 11.5, color: '#8A99B0' }}>
              <span>
                {w.datasetCount} 个数据集 · {(w.usedGB / 1024).toFixed(2)} TB / {(w.quotaGB / 1024).toFixed(0)} TB
              </span>
              <span>更新于 {formatRelative(w.updatedAt)}</span>
            </div>
          </div>
        ))}
      </div>

      <Modal title="新建协同空间" open={open} onCancel={() => setOpen(false)} onOk={create} okText="创建" destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} initialValues={{ visibility: 'private', quotaGB: 1024 }}>
          <Form.Item name="name" label="空间名称" rules={[{ required: true, message: '请输入空间名称' }]}>
            <Input placeholder="例如：华东区域数据共享" />
          </Form.Item>
          <Form.Item name="description" label="空间描述">
            <Input.TextArea rows={3} placeholder="说明该空间的数据范围、使用方与访问规则" />
          </Form.Item>
          <Form.Item name="visibility" label="可见性">
            <Radio.Group>
              <Radio value="public">公开（全员可见）</Radio>
              <Radio value="private">私有（仅成员可见）</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="quotaGB" label="容量配额（GB）">
            <Select options={[512, 1024, 2048, 5120, 8192].map((v) => ({ value: v, label: `${v} GB` }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
