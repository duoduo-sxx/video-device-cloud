import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, List, Segmented, Select, Switch, Table, Tabs, Tag, message } from 'antd';
import { PageHeader, StatusTag, UserAvatar } from '../../components/base';
import { useDataStore } from '../../store/dataStore';
import { useUiStore, ROLE_USER } from '../../store/uiStore';
import { ALERT_LEVEL, JOB_STATUS } from '../../constants/dict';
import { fmtBytes, fmtShortTime, relTime } from '../../utils/format';

export default function Profile() {
  const navigate = useNavigate();
  const role = useUiStore((s) => s.role);
  const notifications = useUiStore((s) => s.notifications);
  const markAllRead = useUiStore((s) => s.markAllRead);
  const jobs = useDataStore((s) => s.jobs);
  const approvals = useDataStore((s) => s.approvals);
  const user = ROLE_USER[role];
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const myJobs = jobs.slice(0, 8);
  const myApprovals = approvals.filter((a) => a.applicant === user.name || a.applicant === '周雨桐').slice(0, 6);
  const shown = notifications.filter((n) => filter === 'all' || !n.read);

  return (
    <div>
      <PageHeader title="个人中心" desc="账号信息、我的任务、消息与偏好设置" />

      <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        <div className="cf-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <UserAvatar name={user.name} color={user.color} size={64} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{user.name}</div>
          <div className="muted" style={{ marginTop: 4 }}>{user.dept}</div>
          <div style={{ marginTop: 10 }}>
            <Tag bordered={false} color="blue">{role === 'admin' ? '管理员' : role === 'operator' ? '操作员' : '访客'}</Tag>
          </div>
          <div style={{ marginTop: 18, textAlign: 'left' }}>
            <div className="list-row">
              <span className="muted">邮箱</span>
              <span style={{ fontSize: 13 }}>{role === 'admin' ? 'chenyu' : role === 'operator' ? 'linshuhe' : 'shenyz'}@cloudflow.cn</span>
            </div>
            <div className="list-row">
              <span className="muted">手机号</span>
              <span style={{ fontSize: 13 }}>138****2041</span>
            </div>
            <div className="list-row">
              <span className="muted">加入时间</span>
              <span style={{ fontSize: 13 }}>2023-04-18</span>
            </div>
            <div className="list-row">
              <span className="muted">最近登录</span>
              <span style={{ fontSize: 13 }}>刚刚</span>
            </div>
          </div>
          <Button block style={{ marginTop: 16 }} onClick={() => message.info('修改密码入口（演示）')}>
            修改密码
          </Button>
        </div>

        <div className="cf-card">
          <Tabs
            items={[
              {
                key: 'jobs',
                label: `我的任务 ${myJobs.length}`,
                children: (
                  <Table
                    className="cf-table"
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={myJobs}
                    onRow={(r) => ({ onClick: () => navigate(`/jobs/${r.id}`), style: { cursor: 'pointer' } })}
                    columns={[
                      { title: '任务名称', dataIndex: 'name', ellipsis: true },
                      { title: '数据量', dataIndex: 'totalBytes', width: 100, render: (v: number) => fmtBytes(v) },
                      {
                        title: '状态',
                        dataIndex: 'status',
                        width: 100,
                        render: (v: keyof typeof JOB_STATUS) => <StatusTag {...JOB_STATUS[v]} />,
                      },
                      { title: '创建时间', dataIndex: 'createdAt', width: 110, render: (v: string) => <span className="muted">{fmtShortTime(v)}</span> },
                    ]}
                  />
                ),
              },
              {
                key: 'approvals',
                label: `我的审批 ${myApprovals.length}`,
                children: (
                  <Table
                    className="cf-table"
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={myApprovals}
                    columns={[
                      { title: '申请事项', dataIndex: 'title', ellipsis: true },
                      { title: '申请人', dataIndex: 'applicant', width: 100 },
                      {
                        title: '状态',
                        dataIndex: 'status',
                        width: 100,
                        render: (v: string) => (
                          <Tag bordered={false} color={v === 'pending' ? 'orange' : v === 'approved' ? 'green' : 'red'}>
                            {v === 'pending' ? '审批中' : v === 'approved' ? '已通过' : '已驳回'}
                          </Tag>
                        ),
                      },
                      { title: '提交时间', dataIndex: 'createdAt', width: 110, render: (v: string) => <span className="muted">{relTime(v)}</span> },
                    ]}
                  />
                ),
              },
              {
                key: 'messages',
                label: `消息通知 ${notifications.filter((n) => !n.read).length}`,
                children: (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Segmented
                        value={filter}
                        onChange={(v) => setFilter(v as 'all' | 'unread')}
                        options={[{ value: 'all', label: '全部' }, { value: 'unread', label: '未读' }]}
                      />
                      <Button size="small" onClick={markAllRead}>全部标记已读</Button>
                    </div>
                    <List
                      dataSource={shown}
                      renderItem={(n) => (
                        <List.Item style={{ alignItems: 'flex-start' }}>
                          <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              {!n.read && <span className="live-dot" style={{ background: '#2563EB' }} />}
                              <span style={{ fontSize: 13, fontWeight: n.read ? 400 : 600 }}>{n.title}</span>
                              <StatusTag label={ALERT_LEVEL[n.level].label} color={ALERT_LEVEL[n.level].color} dot={false} />
                              <span className="muted" style={{ marginLeft: 'auto' }}>{relTime(n.time)}</span>
                            </div>
                            <div className="muted" style={{ marginTop: 4 }}>{n.desc}</div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </>
                ),
              },
              {
                key: 'prefs',
                label: '偏好设置',
                children: (
                  <div style={{ maxWidth: 480 }}>
                    <div className="list-row">
                      <span style={{ fontSize: 13 }}>默认首页</span>
                      <Select defaultValue="/dashboard" style={{ width: 180 }} options={[{ value: '/dashboard', label: '总览驾驶舱' }, { value: '/jobs', label: '传输任务' }]} />
                    </div>
                    <div className="list-row">
                      <span style={{ fontSize: 13 }}>表格密度</span>
                      <Select defaultValue="middle" style={{ width: 180 }} options={[{ value: 'small', label: '紧凑' }, { value: 'middle', label: '标准' }]} />
                    </div>
                    <div className="list-row">
                      <span style={{ fontSize: 13 }}>每页条数</span>
                      <Select defaultValue={20} style={{ width: 180 }} options={[10, 20, 50].map((v) => ({ value: v, label: `${v} 条` }))} />
                    </div>
                    <div className="list-row">
                      <span style={{ fontSize: 13 }}>任务完成通知</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="list-row">
                      <span style={{ fontSize: 13 }}>告警邮件订阅</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="list-row">
                      <span style={{ fontSize: 13 }}>周报推送</span>
                      <Switch />
                    </div>
                    <Button type="primary" style={{ marginTop: 16 }} onClick={() => message.success('偏好设置已保存')}>
                      保存偏好
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
