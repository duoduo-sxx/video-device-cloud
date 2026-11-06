import { useEffect, useState } from 'react';
import { Avatar, Button, Form, Input, Modal, Select, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, UserAddOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import { userService } from '../../services';
import type { AppUser, Role } from '../../types';
import { formatRelative } from '../../utils/format';
import { toast } from '../../utils/feedback';

const ROLE_LABEL: Record<Role, string> = { admin: '平台管理员', ops: '运维工程师', member: '业务成员' };
const ROLE_COLOR: Record<Role, string> = { admin: '#1668FF', ops: '#7C5CFF', member: '#5A6B87' };

export default function Users() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | undefined>();
  const [form] = Form.useForm();

  const load = async () => {
    const data = await userService.list();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const columns: ColumnsType<AppUser> = [
    {
      title: '用户',
      dataIndex: 'name',
      render: (v, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={30} style={{ background: r.color, fontSize: 12 }}>
            {v.slice(0, 1)}
          </Avatar>
          <div className="stack">
            <span style={{ fontSize: 13 }}>{v}</span>
            <span style={{ fontSize: 11, color: '#8A99B0' }}>{r.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 130,
      render: (v: Role) => (
        <Tag style={{ color: ROLE_COLOR[v], background: `${ROLE_COLOR[v]}12`, borderColor: `${ROLE_COLOR[v]}2A`, marginInlineEnd: 0 }}>
          {ROLE_LABEL[v]}
        </Tag>
      ),
    },
    { title: '部门', dataIndex: 'department', width: 140 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => (
        <Tag color={v === '正常' ? 'success' : 'default'} style={{ marginInlineEnd: 0 }}>
          {v}
        </Tag>
      ),
    },
    { title: '最后登录', dataIndex: 'lastLogin', width: 120, render: (v) => <span style={{ fontSize: 12 }}>{formatRelative(v)}</span> },
    {
      title: '操作',
      key: 'act',
      width: 200,
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 10 }}>
          <span
            className="link"
            style={{ fontSize: 12.5 }}
            onClick={() => {
              setEditing(r);
              form.setFieldsValue(r);
              setOpen(true);
            }}
          >
            编辑
          </span>
          <span
            className="link"
            style={{ fontSize: 12.5, color: r.status === '正常' ? '#EF4444' : '#00B894' }}
            onClick={() => {
              Modal.confirm({
                title: r.status === '正常' ? `禁用用户 ${r.name}？` : `启用用户 ${r.name}？`,
                content: r.status === '正常' ? '禁用后该用户将立即退出登录，且无法再访问平台。' : '启用后该用户可重新登录。',
                okText: '确认',
                okButtonProps: { danger: r.status === '正常' },
                cancelText: '取消',
                onOk: () => {
                  setUsers((prev) => prev.map((u) => (u.id === r.id ? { ...u, status: u.status === '正常' ? '已禁用' : '正常' } : u)));
                  toast.success(r.status === '正常' ? '用户已禁用' : '用户已启用');
                },
              });
            }}
          >
            {r.status === '正常' ? '禁用' : '启用'}
          </span>
          <span className="link" style={{ fontSize: 12.5 }} onClick={() => toast.success(`重置密码邮件已发送至 ${r.email}`)}>
            重置密码
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="用户与角色"
        description="管理平台账号、角色与组织归属，角色决定可访问的菜单与操作范围"
        extra={
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => {
              setEditing(undefined);
              form.resetFields();
              setOpen(true);
            }}
          >
            新增用户
          </Button>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        {[
          { label: '用户总数', value: users.length, color: '#1668FF' },
          { label: '管理员', value: users.filter((u) => u.role === 'admin').length, color: '#1668FF' },
          { label: '运维工程师', value: users.filter((u) => u.role === 'ops').length, color: '#7C5CFF' },
          { label: '已禁用', value: users.filter((u) => u.status === '已禁用').length, color: '#8A99B0' },
        ].map((s) => (
          <div className="panel" key={s.label}>
            <div style={{ fontSize: 12.5, color: '#7B8AA3' }}>{s.label}</div>
            <div className="num" style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="panel flush">
        <Table<AppUser> rowKey="id" loading={loading} columns={columns} dataSource={users} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 位用户` }} />
      </div>

      <Modal
        title={editing ? `编辑用户 · ${editing.name}` : '新增用户'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => {
          const values = form.getFieldsValue();
          if (!values.name || !values.email) {
            toast.warning('请填写姓名与邮箱');
            return;
          }
          if (editing) {
            setUsers((prev) => prev.map((u) => (u.id === editing.id ? { ...u, ...values } : u)));
            toast.success('用户信息已更新');
          } else {
            setUsers((prev) => [
              {
                id: `U-0${prev.length + 1}`,
                name: values.name,
                email: values.email,
                role: values.role,
                department: values.department ?? '未分配',
                status: '正常',
                lastLogin: new Date().toISOString(),
                color: '#1668FF',
              },
              ...prev,
            ]);
            toast.success('用户已创建，初始密码已发送至邮箱');
          }
          setOpen(false);
        }}
        okText={editing ? '保存' : '创建'}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} initialValues={{ role: 'member', department: '数据平台部' }}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item name="email" label="企业邮箱" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input placeholder="name@xinglan-tech.com" />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select options={[{ value: 'admin', label: '平台管理员' }, { value: 'ops', label: '运维工程师' }, { value: 'member', label: '业务成员' }]} />
          </Form.Item>
          <Form.Item name="department" label="部门">
            <Input placeholder="例如：数据平台部" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
