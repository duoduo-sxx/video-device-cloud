import { useMemo, useState } from 'react';
import { Button, Input, Select, Table, Tag, message } from 'antd';
import { CheckOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { PageHeader, StatusTag, UserAvatar } from '../../components/base';
import { USERS } from '../../mock/seed';
import { USER_ROLE } from '../../constants/dict';
import type { UserItem } from '../../types';
import { relTime } from '../../utils/format';

const PERMISSIONS = [
  { module: '总览 / 报表', view: [1, 1, 1], edit: [0, 0, 0], approve: [0, 0, 0], del: [0, 0, 0] },
  { module: '传输任务', view: [1, 1, 1], edit: [1, 1, 0], approve: [1, 0, 0], del: [1, 0, 0] },
  { module: '链路与节点', view: [1, 1, 1], edit: [1, 1, 0], approve: [0, 0, 0], del: [1, 0, 0] },
  { module: '优化策略', view: [1, 1, 1], edit: [1, 1, 0], approve: [1, 0, 0], del: [1, 1, 0] },
  { module: '协同与审批', view: [1, 1, 1], edit: [1, 1, 0], approve: [1, 1, 0], del: [1, 0, 0] },
  { module: '数据资产', view: [1, 1, 1], edit: [1, 0, 0], approve: [0, 0, 0], del: [0, 0, 0] },
  { module: '系统管理', view: [1, 0, 0], edit: [1, 0, 0], approve: [1, 0, 0], del: [1, 0, 0] },
];

const Tick = ({ v }: { v: number }) =>
  v ? <CheckOutlined style={{ color: '#16A34A' }} /> : <CloseOutlined style={{ color: '#CBD5E1' }} />;

export default function Users() {
  const [role, setRole] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [rows, setRows] = useState<UserItem[]>(USERS);

  const filtered = useMemo(
    () => rows.filter((u) => (!role || u.role === role) && (!keyword || u.name.includes(keyword) || u.account.includes(keyword))),
    [rows, role, keyword],
  );

  const cards = [
    { key: 'admin', label: '管理员', desc: '全部权限，可管理用户与系统设置' },
    { key: 'operator', label: '操作员', desc: '可创建与管理任务、策略、告警' },
    { key: 'viewer', label: '访客', desc: '只读访问，无任何写操作' },
  ];

  return (
    <div>
      <PageHeader
        title="用户与角色"
        desc="基于 RBAC 的账号、角色与权限矩阵"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('邀请成员入口（演示）')}>
            添加成员
          </Button>
        }
      />

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        {cards.map((c) => {
          const count = rows.filter((u) => u.role === c.key).length;
          const active = role === c.key;
          return (
            <div
              key={c.key}
              className="cf-card"
              style={{ cursor: 'pointer', borderColor: active ? '#2563EB' : undefined, padding: 16 }}
              onClick={() => setRole(active ? undefined : c.key)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{c.label}</div>
                <span style={{ fontSize: 22, fontWeight: 600, color: USER_ROLE[c.key as 'admin'].color }}>{count}</span>
              </div>
              <div className="muted" style={{ marginTop: 6 }}>{c.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="cf-card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <Input.Search allowClear placeholder="搜索姓名或账号" style={{ width: 240 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            <Select
              allowClear
              placeholder="角色"
              style={{ width: 120 }}
              value={role}
              onChange={setRole}
              options={Object.entries(USER_ROLE).map(([k, v]) => ({ value: k, label: v.label }))}
            />
          </div>
          <span className="muted">共 {filtered.length} 人</span>
        </div>

        <Table
          className="cf-table"
          rowKey="id"
          size="middle"
          dataSource={filtered}
          pagination={false}
          columns={[
            {
              title: '成员',
              key: 'name',
              width: 220,
              render: (_, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserAvatar name={r.name} color={r.avatarColor} size={30} />
                  <div>
                    <div style={{ fontSize: 13 }}>{r.name}</div>
                    <div className="muted mono">{r.account}</div>
                  </div>
                </div>
              ),
            },
            { title: '部门', dataIndex: 'dept', width: 150 },
            {
              title: '角色',
              dataIndex: 'role',
              width: 110,
              render: (v: UserItem['role']) => <StatusTag {...USER_ROLE[v]} dot={false} />,
            },
            { title: '邮箱', dataIndex: 'email', width: 220 },
            { title: '手机号', dataIndex: 'phone', width: 130 },
            {
              title: '状态',
              dataIndex: 'status',
              width: 90,
              render: (v: UserItem['status']) => (
                <span style={{ color: v === 'active' ? '#16A34A' : '#94A3B8' }}>{v === 'active' ? '正常' : '已禁用'}</span>
              ),
            },
            { title: '最后登录', dataIndex: 'lastLoginAt', width: 120, render: (v: string) => <span className="muted">{relTime(v)}</span> },
            {
              title: '操作',
              key: 'action',
              width: 190,
              fixed: 'right',
              render: (_, r) => (
                <div style={{ display: 'flex', gap: 2 }}>
                  <Button type="link" size="small" style={{ paddingInline: 4 }} onClick={() => message.success(`已向 ${r.name} 发送密码重置邮件`)}>
                    重置密码
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    style={{ paddingInline: 4 }}
                    onClick={() => {
                      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: x.status === 'active' ? 'disabled' : 'active' } : x)));
                      message.success('用户状态已更新');
                    }}
                  >
                    {r.status === 'active' ? '禁用' : '启用'}
                  </Button>
                  <Select
                    size="small"
                    value={r.role}
                    style={{ width: 84 }}
                    onChange={(v) => {
                      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, role: v } : x)));
                      message.success('角色已更新');
                    }}
                    options={Object.entries(USER_ROLE).map(([k, v]) => ({ value: k, label: v.label }))}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      <div className="cf-card" style={{ padding: 16 }}>
        <div className="cf-card-title" style={{ marginBottom: 4 }}>权限矩阵</div>
        <div className="muted" style={{ marginBottom: 12 }}>仅展示，权限由角色统一授予，不支持逐人自定义</div>
        <Table
          className="cf-table"
          rowKey="module"
          size="small"
          pagination={false}
          dataSource={PERMISSIONS}
          columns={[
            { title: '模块', dataIndex: 'module', width: 180 },
            {
              title: '管理员',
              children: [
                { title: '查看', dataIndex: ['view', 0], width: 70, render: (v: number) => <Tick v={v} /> },
                { title: '编辑', dataIndex: ['edit', 0], width: 70, render: (v: number) => <Tick v={v} /> },
                { title: '审批', dataIndex: ['approve', 0], width: 70, render: (v: number) => <Tick v={v} /> },
                { title: '删除', dataIndex: ['del', 0], width: 70, render: (v: number) => <Tick v={v} /> },
              ],
            },
            {
              title: '操作员',
              children: [
                { title: '查看', dataIndex: ['view', 1], width: 70, render: (v: number) => <Tick v={v} /> },
                { title: '编辑', dataIndex: ['edit', 1], width: 70, render: (v: number) => <Tick v={v} /> },
                { title: '审批', dataIndex: ['approve', 1], width: 70, render: (v: number) => <Tick v={v} /> },
                { title: '删除', dataIndex: ['del', 1], width: 70, render: (v: number) => <Tick v={v} /> },
              ],
            },
            {
              title: '访客',
              children: [
                { title: '查看', dataIndex: ['view', 2], width: 70, render: (v: number) => <Tick v={v} /> },
                { title: '编辑', dataIndex: ['edit', 2], width: 70, render: (v: number) => <Tick v={v} /> },
                { title: '审批', dataIndex: ['approve', 2], width: 70, render: (v: number) => <Tick v={v} /> },
                { title: '删除', dataIndex: ['del', 2], width: 70, render: (v: number) => <Tick v={v} /> },
              ],
            },
          ]}
        />
        <div style={{ marginTop: 10 }}>
          <Tag bordered={false} color="blue">提示</Tag>
          <span className="muted">可在右上角用户菜单切换角色，实时验证权限差异。</span>
        </div>
      </div>
    </div>
  );
}
