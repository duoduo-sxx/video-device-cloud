import React, { useEffect, useState } from 'react';
import {
  Card, Tabs, Table, Tag, Button, Space, Input, Select, Modal, Form, Tree, Popconfirm,
  DatePicker, message, Typography, InputNumber,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, TeamOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons';
import * as api from '@/api';
import { MENUS, ROLE_LABELS } from '@/constants';
import type { LogRecord, RoleKey, User } from '@/types';
import { USER_NAMES } from '@/mock/generators';

const emptyUser = (): User => ({
  id: '', workNo: '', name: '', role: 'agent', dept: '客服一部', status: 'enabled', lastLogin: '',
});

// ---------------- 用户管理 ----------------
const UserTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [form] = Form.useForm();

  const load = async () => (await api.listUsers().then((r) => setUsers(r.data)));
  useEffect(() => { void load(); }, []);

  const save = async () => {
    const values = await form.validateFields();
    await api.saveUser({ ...editing!, ...values, id: editing!.id || `u${Date.now()}`, status: editing!.status });
    message.success('保存成功');
    setEditing(null);
    await load();
  };

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 12 }} onClick={() => { setEditing(emptyUser()); form.setFieldsValue(emptyUser()); }}>新增用户</Button>
      <Table
        size="small"
        rowKey="id"
        dataSource={users}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: '工号', dataIndex: 'workNo', width: 90 },
          { title: '姓名', dataIndex: 'name', width: 100, render: (v) => <span><UserOutlined style={{ marginRight: 6 }} />{v}</span> },
          { title: '角色', dataIndex: 'role', width: 130, render: (v: RoleKey) => <Tag color="blue">{ROLE_LABELS[v]}</Tag> },
          { title: '部门', dataIndex: 'dept', width: 120 },
          { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={v === 'enabled' ? 'green' : 'default'}>{v === 'enabled' ? '启用' : '停用'}</Tag> },
          { title: '最近登录', dataIndex: 'lastLogin', width: 160 },
          {
            title: '操作', width: 140,
            render: (_: unknown, r: User) => (
              <Space>
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); }}>编辑</Button>
                <Popconfirm title="确认删除该用户？"><Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={async () => { await api.deleteUser(r.id); await load(); }}>删除</Button></Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal open={!!editing} title={editing?.id ? '编辑用户' : '新增用户'} onOk={save} onCancel={() => setEditing(null)}>
        <Form form={form} layout="vertical">
          <Form.Item name="workNo" label="工号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="dept" label="部门">
            <Select options={['客服一部', '客服二部', '数据运营部', '产品部', '技术支持部', '商务部'].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

// ---------------- 角色权限 ----------------
const toTreeData = () =>
  MENUS.map((m) => ({
    title: m.label,
    key: m.key,
    children: m.children?.map((c) => ({ title: c.label, key: c.key })),
  }));

const RoleTab: React.FC = () => {
  const [checked, setChecked] = useState<React.Key[]>([]);
  const [role, setRole] = useState<RoleKey>('agent');
  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <Card size="small" title="角色列表" style={{ width: 240 }}>
        {Object.entries(ROLE_LABELS).map(([key, label]) => (
          <div key={key} onClick={() => setRole(key as RoleKey)}
            style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: role === key ? 'rgba(37,99,235,.12)' : 'transparent' }}>
            <TeamOutlined style={{ marginRight: 8 }} />{label}
          </div>
        ))}
      </Card>
      <Card
        size="small" title={`权限配置：${ROLE_LABELS[role]}`}
        extra={<Button type="primary" size="small" onClick={() => message.success('权限已保存（内存生效）')}>保存</Button>}
        style={{ flex: 1 }}
      >
        <Tree
          checkable
          defaultExpandAll
          treeData={toTreeData()}
          checkedKeys={checked}
          onCheck={(keys) => setChecked(keys as React.Key[])}
        />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>勾选即授权（演示：不与路由守卫实时联动）</Typography.Text>
      </Card>
    </div>
  );
};

// ---------------- 操作日志 ----------------
const LogTab: React.FC = () => {
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [userF, setUserF] = useState<string | undefined>();
  const [moduleF, setModuleF] = useState<string | undefined>();

  const load = async () => (await api.listLogs({ user: userF, module: moduleF }).then((r) => setLogs(r.data)));
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [userF, moduleF]);

  return (
    <>
      <Space style={{ marginBottom: 12 }} wrap>
        <Select allowClear style={{ width: 140 }} placeholder="操作人" value={userF} onChange={setUserF}
          options={[...new Set(USER_NAMES)].map((u) => ({ value: u, label: u }))} />
        <Select allowClear style={{ width: 140 }} placeholder="模块" value={moduleF} onChange={setModuleF}
          options={['知识库', '对话中心', '语义理解', '系统管理', '场景配置', '质量评测', '数据分析'].map((u) => ({ value: u, label: u }))} />
        <DatePicker.RangePicker />
      </Space>
      <Table
        size="small"
        rowKey="id"
        dataSource={logs}
        pagination={{ pageSize: 12, showTotal: (t) => `共 ${t} 条` }}
        columns={[
          { title: '时间', dataIndex: 'time', width: 170 },
          { title: '操作人', dataIndex: 'user', width: 100 },
          { title: '模块', dataIndex: 'module', width: 110, render: (v) => <Tag>{v}</Tag> },
          { title: '动作', dataIndex: 'action', width: 80, render: (v) => <Tag color={v === '删除' ? 'red' : v === '新增' ? 'green' : 'blue'}>{v}</Tag> },
          { title: '详情', dataIndex: 'detail', ellipsis: true },
        ]}
      />
    </>
  );
};

// ---------------- 参数配置 ----------------
const ParamTab: React.FC = () => {
  const [params, setParams] = useState<{ sessionTimeout: number; fallbackText: string; sensitiveWords: string[]; transferThreshold: number } | null>(null);
  useEffect(() => { api.getParams().then((r) => setParams(r.data)); }, []);
  if (!params) return null;
  return (
    <div style={{ maxWidth: 640 }}>
      <Card size="small" title={<span><SettingOutlined /> 系统参数</span>}>
        <Form layout="vertical" initialValues={params}
          onFinish={async (v) => { await api.saveParams(v); message.success('参数已保存'); }}>
          <Form.Item name="sessionTimeout" label="会话超时时间（分钟）" rules={[{ required: true }]}>
            <InputNumber style={{ width: 160 }} min={1} max={120} />
          </Form.Item>
          <Form.Item name="fallbackText" label="兜底话术" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="sensitiveWords" label="敏感词列表（tag 模式）">
            <Select mode="tags" open={false} suffixIcon={null} />
          </Form.Item>
          <Form.Item name="transferThreshold" label="转人工置信度阈值（%）" rules={[{ required: true }]}>
            <InputNumber style={{ width: 160 }} min={0} max={100} />
          </Form.Item>
          <Button type="primary" htmlType="submit">保存配置</Button>
        </Form>
      </Card>
    </div>
  );
};

const SystemAdmin: React.FC = () => (
  <Card size="small">
    <Tabs
      items={[
        { key: 'users', label: <span><UserOutlined /> 用户管理</span>, children: <UserTab /> },
        { key: 'roles', label: <span><TeamOutlined /> 角色权限</span>, children: <RoleTab /> },
        { key: 'logs', label: <span><FileTextOutlined /> 操作日志</span>, children: <LogTab /> },
        { key: 'params', label: <span><SettingOutlined /> 参数配置</span>, children: <ParamTab /> },
      ]}
    />
  </Card>
);

export default SystemAdmin;
