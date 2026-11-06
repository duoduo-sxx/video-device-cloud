import { useState } from 'react';
import { Button, Drawer, Form, InputNumber, Modal, Progress, Select, Table, Tag, message } from 'antd';
import { PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { PageHeader, UserAvatar } from '../../components/base';
import { SPACES } from '../../mock/seed';
import { useDataStore } from '../../store/dataStore';
import { fmtBytes, relTime } from '../../utils/format';
import type { Space } from '../../types';

const ROLE_COLOR: Record<string, string> = { 所有者: '#8B5CF6', 编辑者: '#2563EB', 查看者: '#64748B' };

export default function Spaces() {
  const jobs = useDataStore((s) => s.jobs);
  const [active, setActive] = useState<Space | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form] = Form.useForm();

  return (
    <div>
      <PageHeader
        title="协同空间"
        desc="按部门划分的数据协作空间，统一管理成员、共享数据集与传输配额"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('新建空间为演示入口')}>
            新建空间
          </Button>
        }
      />

      <div className="grid grid-3">
        {SPACES.map((s) => (
          <div key={s.id} className="cf-card" style={{ cursor: 'pointer' }} onClick={() => setActive(s)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg,#2563EB22,#06B6D422)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563EB',
                    fontSize: 16,
                  }}
                >
                  <TeamOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</div>
                  <div className="muted">{s.id} · 负责人 {s.owner}</div>
                </div>
              </div>
              <Tag bordered={false} color="blue">{s.myRole}</Tag>
            </div>

            <div style={{ display: 'flex', gap: -8, margin: '14px 0 6px' }}>
              {s.members.map((m, i) => (
                <span key={m.name} style={{ marginLeft: i === 0 ? 0 : -8, border: '2px solid var(--card)', borderRadius: '50%' }}>
                  <UserAvatar name={m.name} size={26} />
                </span>
              ))}
              <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-3)', alignSelf: 'center' }}>
                等 {s.members.length} 人
              </span>
            </div>

            <div className="grid grid-2" style={{ gap: 8, marginTop: 10 }}>
              <div>
                <div className="muted">共享数据集</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{s.datasetCount}</div>
              </div>
              <div>
                <div className="muted">本月传输量</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{fmtBytes(s.monthlyBytes)}</div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span className="muted">配额使用</span>
                <span style={{ color: s.quotaPct > 80 ? '#DC2626' : 'var(--text-2)' }}>{s.quotaPct}%</span>
              </div>
              <Progress
                percent={s.quotaPct}
                size="small"
                showInfo={false}
                strokeColor={s.quotaPct > 80 ? '#DC2626' : '#2563EB'}
              />
            </div>
          </div>
        ))}
      </div>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        width={640}
        title={active?.name}
        extra={
          <Button type="primary" size="small" onClick={() => setInviteOpen(true)}>
            邀请成员
          </Button>
        }
      >
        {active && (
          <>
            <div className="grid grid-3" style={{ marginBottom: 20 }}>
              <div className="cf-card" style={{ padding: 14 }}>
                <div className="muted">共享数据集</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{active.datasetCount}</div>
              </div>
              <div className="cf-card" style={{ padding: 14 }}>
                <div className="muted">本月传输量</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{fmtBytes(active.monthlyBytes)}</div>
              </div>
              <div className="cf-card" style={{ padding: 14 }}>
                <div className="muted">空间内任务</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{jobs.filter((j) => j.dept === active.dept).length}</div>
              </div>
            </div>

            <div className="section-title">成员（{active.members.length}）</div>
            <Table
              className="cf-table"
              rowKey="name"
              size="small"
              pagination={false}
              dataSource={active.members}
              columns={[
                {
                  title: '成员',
                  dataIndex: 'name',
                  render: (v: string) => (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <UserAvatar name={v} size={24} />
                      {v}
                    </span>
                  ),
                },
                { title: '部门', dataIndex: 'dept' },
                {
                  title: '角色',
                  dataIndex: 'role',
                  render: (v: string) => <span style={{ color: ROLE_COLOR[v], fontWeight: 500 }}>{v}</span>,
                },
                { title: '最近活跃', dataIndex: 'activeAt', render: (v: string) => <span className="muted">{relTime(v)}</span> },
              ]}
            />

            <div className="section-title" style={{ marginTop: 24 }}>配额设置</div>
            <div className="cf-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13 }}>月度传输配额</span>
                <span className="muted">已用 {active.quotaPct}% · 剩余 {100 - active.quotaPct}%</span>
              </div>
              <Progress percent={active.quotaPct} strokeColor="#2563EB" />
              <div className="muted" style={{ marginTop: 8 }}>
                配额按部门月度结算，超出后任务自动降速至 200 MB/s。
              </div>
            </div>
          </>
        )}
      </Drawer>

      <Modal
        open={inviteOpen}
        title="邀请成员"
        onCancel={() => setInviteOpen(false)}
        onOk={async () => {
          const v = await form.validateFields();
          setInviteOpen(false);
          form.resetFields();
          message.success(`已向 ${v.account} 发送空间邀请`);
        }}
      >
        <Form form={form} layout="vertical" initialValues={{ role: '编辑者' }}>
          <Form.Item name="account" label="成员账号" rules={[{ required: true, message: '请输入账号或邮箱' }]}>
            <Select
              mode="tags"
              maxCount={1}
              placeholder="输入账号或邮箱，回车确认"
              tokenSeparators={[',', ' ']}
              options={['linshuhe', 'zhaoqiming', 'zhouyutong', 'wujiashu', 'zhengyihang'].map((a) => ({ value: a, label: a }))}
            />
          </Form.Item>
          <Form.Item name="role" label="空间角色">
            <Select options={['所有者', '编辑者', '查看者'].map((r) => ({ value: r, label: r }))} />
          </Form.Item>
          <Form.Item name="quota" label="附加配额（TB）">
            <InputNumber min={1} max={100} style={{ width: '100%' }} defaultValue={10} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
