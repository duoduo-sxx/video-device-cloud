import { useState } from 'react';
import { App, Avatar, Button, Form, Input, Modal, Progress, Select, Table, Tabs, Tag } from 'antd';
import { CheckOutlined, MinusOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { PageHeader, Panel, StatusBadge } from '@/components/ui';
import { USERS, ROLES, ROLE_MATRIX, GROUPS } from '@/mock/seed/people';
import { fmtNum, fmtRelative } from '@/utils/format';

export default function Team() {
  const { message } = App.useApp();
  const [members, setMembers] = useState(USERS);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  return (
    <div>
      <PageHeader
        title="团队与权限"
        subtitle={`${members.length} 名成员 · 5 种角色 · 3 个资源组 · 按角色控制 10 类资源的访问权限`}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            邀请成员
          </Button>
        }
      />

      <div className="grid g4" style={{ marginBottom: 14 }}>
        {[
          { label: '成员总数', value: String(members.length), sub: `${members.filter((m) => m.status === 'active').length} 人正常` },
          { label: '本月活跃', value: '11 人', sub: '活跃率 78.6%' },
          { label: '资源组', value: '3 个', sub: '内容中心 / 技术中台 / 外部客户' },
          { label: '配额使用', value: '42.9%', sub: '1,286 / 3,000 小时' },
        ].map((m) => (
          <div key={m.label} className="metric" style={{ cursor: 'default' }}>
            <div className="label">{m.label}</div>
            <div className="value">{m.value}</div>
            <div className="delta">{m.sub}</div>
          </div>
        ))}
      </div>

      <Panel noPad>
        <Tabs
          style={{ padding: '0 16px' }}
          items={[
            {
              key: 'members',
              label: '成员',
              children: (
                <Table
                  rowKey="id"
                  size="middle"
                  dataSource={members}
                  pagination={{ pageSize: 10, size: 'small' }}
                  columns={[
                    {
                      title: '成员',
                      render: (_, r) => (
                        <div className="row" style={{ gap: 9 }}>
                          <Avatar size={28} style={{ background: r.avatarColor, fontSize: 12 }}>
                            {r.name.slice(0, 1)}
                          </Avatar>
                          <div>
                            <div style={{ fontSize: 12.8 }}>{r.name}</div>
                            <div className="hint">{r.email}</div>
                          </div>
                        </div>
                      ),
                    },
                    { title: '角色', dataIndex: 'role', width: 110, render: (v) => <Tag style={{ marginInlineEnd: 0 }}>{v}</Tag> },
                    { title: '资源组', dataIndex: 'group', width: 100 },
                    {
                      title: '本月用量',
                      dataIndex: 'monthlyHours',
                      width: 160,
                      render: (v) => (
                        <div>
                          <div className="row between" style={{ fontSize: 11.5 }}>
                            <span>{v} 小时</span>
                            <span className="hint">{Math.round((v / 600) * 100)}%</span>
                          </div>
                          <Progress percent={Math.round((v / 600) * 100)} showInfo={false} size="small" strokeColor={v > 500 ? '#FBBF24' : '#5B6CFF'} />
                        </div>
                      ),
                    },
                    { title: '状态', dataIndex: 'status', width: 90, render: (v) => <StatusBadge status={v} /> },
                    { title: '最后活跃', dataIndex: 'lastActive', width: 100, render: (v) => <span className="hint">{fmtRelative(v)}</span> },
                    {
                      title: '',
                      width: 90,
                      render: (_, r) => (
                        <Button
                          size="small"
                          type="text"
                          onClick={() => {
                            setMembers((prev) => prev.map((m) => (m.id === r.id ? { ...m, status: m.status === 'active' ? 'disabled' : 'active' } : m)));
                            message.success(`${r.name} 已${r.status === 'active' ? '停用' : '启用'}`);
                          }}
                        >
                          {r.status === 'active' ? '停用' : '启用'}
                        </Button>
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: 'roles',
              label: '角色权限',
              children: (
                <div style={{ paddingBottom: 20, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-tertiary)', fontWeight: 400, borderBottom: '1px solid var(--border)' }}>资源 / 角色</th>
                        {ROLES.map((r) => (
                          <th key={r} style={{ padding: '10px 8px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{r}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(ROLE_MATRIX[ROLES[0]]).map((res) => (
                        <tr key={res}>
                          <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)' }}>{res}</td>
                          {ROLES.map((role) => (
                            <td key={role} style={{ textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                              {ROLE_MATRIX[role][res] ? <CheckOutlined style={{ color: 'var(--success)' }} /> : <MinusOutlined style={{ color: 'var(--text-tertiary)' }} />}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="hint" style={{ marginTop: 10 }}>
                    权限矩阵为只读展示，自定义角色能力将在企业版开放。
                  </div>
                </div>
              ),
            },
            {
              key: 'groups',
              label: '资源组',
              children: (
                <div className="grid g3" style={{ gap: 12, paddingBottom: 20 }}>
                  {GROUPS.map((g) => {
                    const membersIn = members.filter((m) => m.group === g);
                    const total = membersIn.reduce((s, m) => s + m.monthlyHours, 0);
                    return (
                      <div key={g} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                        <div className="row between">
                          <span className="row" style={{ gap: 7, fontSize: 13 }}>
                            <TeamOutlined /> {g}
                          </span>
                          <Tag style={{ marginInlineEnd: 0 }}>{membersIn.length} 人</Tag>
                        </div>
                        <div className="hint" style={{ margin: '8px 0 4px' }}>本月用量 {fmtNum(total)} 小时</div>
                        <Progress percent={Math.min(100, Math.round((total / 2000) * 100))} showInfo={false} size="small" strokeColor="#5B6CFF" />
                        <div className="hint" style={{ marginTop: 4 }}>配额 2,000 小时</div>
                        <div className="row wrap" style={{ gap: 4, marginTop: 10 }}>
                          {membersIn.slice(0, 6).map((m) => (
                            <Avatar key={m.id} size={22} style={{ background: m.avatarColor, fontSize: 10 }}>
                              {m.name.slice(0, 1)}
                            </Avatar>
                          ))}
                          {membersIn.length > 6 && <span className="hint">+{membersIn.length - 6}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ),
            },
          ]}
        />
      </Panel>

      <Modal
        title="邀请成员"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={async () => {
          const v = await form.validateFields();
          message.success(`邀请已发送至 ${v.emails?.join('、') || '指定邮箱'}`);
          setOpen(false);
          form.resetFields();
        }}
        okText="发送邀请"
      >
        <Form form={form} layout="vertical" initialValues={{ role: '内容运营', group: '内容中心' }}>
          <Form.Item name="emails" label="邮箱" rules={[{ required: true, message: '请输入至少一个邮箱' }]}>
            <Select mode="tags" placeholder="输入邮箱后回车，可填多个" />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select options={ROLES.map((r) => ({ value: r, label: r }))} />
          </Form.Item>
          <Form.Item name="group" label="资源组">
            <Select options={GROUPS.map((g) => ({ value: g, label: g }))} />
          </Form.Item>
          <Form.Item name="quota" label="月度配额（小时）">
            <Input type="number" defaultValue={100} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
