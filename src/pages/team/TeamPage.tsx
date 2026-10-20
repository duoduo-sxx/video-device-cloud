import { useMemo, useState } from 'react';
import { Button, Input, Segmented, Select, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Mail, Search, UserPlus, Users } from 'lucide-react';
import type { User } from '@/types/models';
import { ROLES } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { Avatar, Progress, StatusTag } from '@/components/ui';
import { projects, tasks, users } from '@/mock';
import { formatDate, formatInt } from '@/utils/format';

interface MemberRow extends User {
  projectCount: number;
  openTasks: number;
  utilization: number;
}

export default function TeamPage() {
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState<string | undefined>();
  const [status, setStatus] = useState<'all' | 'active' | 'leave'>('all');

  const rows = useMemo<MemberRow[]>(
    () =>
      users
        .filter((u) => (role ? u.role === role : true))
        .filter((u) => (status === 'all' ? true : status === 'active' ? u.status === 'active' : u.status !== 'active'))
        .filter((u) => (keyword ? u.name.includes(keyword) || u.enName.toLowerCase().includes(keyword.toLowerCase()) || u.email.includes(keyword) : true))
        .map((u) => {
          const projectCount = projects.filter((p) => p.memberIds.includes(u.id)).length;
          const openTasks = tasks.filter((t) => t.assigneeId === u.id && t.status !== 'done').length;
          return { ...u, projectCount, openTasks, utilization: u.workload };
        })
        .sort((a, b) => b.utilization - a.utilization),
    [keyword, role, status],
  );

  const avgUtil = users.reduce((s, u) => s + u.workload, 0) / Math.max(1, users.length);
  const overloaded = users.filter((u) => u.workload > 95);
  const idle = users.filter((u) => u.workload < 60);
  const onLeave = users.filter((u) => u.status !== 'active');

  const roleStats = useMemo(() => {
    const map = new Map<string, { count: number; hours: number }>();
    users.forEach((u) => {
      const cur = map.get(u.role) ?? { count: 0, hours: 0 };
      cur.count += 1;
      cur.hours += u.monthlyHours;
      map.set(u.role, cur);
    });
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
  }, []);

  const columns: ColumnsType<MemberRow> = [
    {
      title: '成员',
      dataIndex: 'name',
      width: 200,
      render: (v: string, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar name={v} size={30} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontWeight: 500 }}>{v}</span>
              {r.status === 'leave' && <StatusTag label="休假" tone="warning" dot={false} />}
              {r.status === 'resigned' && <StatusTag label="已离职" tone="default" dot={false} />}
            </div>
            <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>{r.enName} · {r.level}</div>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 132,
      render: (v: User['role']) => (
        <Tooltip title={ROLES[v].desc}>
          <span style={{ fontSize: 12, cursor: 'help' }}>{ROLES[v].label}</span>
        </Tooltip>
      ),
    },
    {
      title: '技能',
      dataIndex: 'skills',
      render: (v: string[]) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {v.slice(0, 4).map((s) => (
            <span
              key={s}
              style={{ fontSize: 10.5, padding: '1px 6px', borderRadius: 3, background: 'var(--np-bg-subtle)', color: 'var(--np-text-secondary)' }}
            >
              {s}
            </span>
          ))}
        </div>
      ),
    },
    {
      title: '在项项目',
      dataIndex: 'projectCount',
      width: 92,
      align: 'right',
      render: (v: number) => <span className="np-num">{v}</span>,
    },
    {
      title: '未完成任务',
      dataIndex: 'openTasks',
      width: 108,
      align: 'right',
      render: (v: number) => (
        <span className="np-num" style={{ color: v > 6 ? 'var(--np-warning)' : undefined }}>{v}</span>
      ),
    },
    {
      title: '月度工时',
      dataIndex: 'monthlyHours',
      width: 96,
      align: 'right',
      render: (v: number) => <span className="np-num">{v}h</span>,
    },
    {
      title: '负载',
      dataIndex: 'utilization',
      width: 140,
      render: (v: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 70 }}>
            <Progress value={v} height={5} color={v > 95 ? 'var(--np-danger)' : v < 60 ? 'var(--np-info)' : undefined} />
          </div>
          <span className="np-num" style={{ fontSize: 11.5, color: v > 95 ? 'var(--np-danger)' : undefined }}>{v}%</span>
        </div>
      ),
    },
    {
      title: '入职',
      dataIndex: 'joinDate',
      width: 96,
      render: (v: string) => <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>{formatDate(v)}</span>,
    },
    {
      title: '',
      width: 50,
      render: () => <Button type="text" size="small" icon={<Mail size={13} />} />,
    },
  ];

  return (
    <div className="np-page">
      <PageHeader
        title="团队管理"
        desc={`${users.length} 名成员 · 平均负载 ${Math.round(avgUtil)}% · ${overloaded.length} 人超负荷 · ${onLeave.length} 人休假中`}
        actions={
          <>
            <Button>导出花名册</Button>
            <Button type="primary" icon={<UserPlus size={13} />}>邀请成员</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">在册人数</div>
          <div className="np-stat-value">{users.filter((u) => u.status === 'active').length}</div>
          <div className="np-stat-foot">含 {onLeave.length} 人非在岗</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">月度总工时</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{formatInt(users.reduce((s, u) => s + u.monthlyHours, 0))}<small>h</small></div>
          <div className="np-stat-foot">人均 {Math.round(users.reduce((s, u) => s + u.monthlyHours, 0) / Math.max(1, users.length))}h</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">超负荷</div>
          <div className="np-stat-value" style={{ color: overloaded.length > 0 ? 'var(--np-danger)' : undefined }}>{overloaded.length}</div>
          <div className="np-stat-foot">负载 &gt; 95%</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">可调配</div>
          <div className="np-stat-value">{idle.length}</div>
          <div className="np-stat-foot">负载 &lt; 60%，可接新需求</div>
        </div>
      </div>

      <SectionCard
        title="成员列表"
        sub={`${rows.length} 人`}
        extra={
          <>
            <Input
              size="small"
              allowClear
              prefix={<Search size={13} style={{ color: 'var(--np-text-tertiary)' }} />}
              placeholder="搜索姓名或邮箱"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 170 }}
            />
            <Select
              size="small"
              allowClear
              placeholder="角色"
              value={role}
              onChange={setRole}
              style={{ width: 132 }}
              options={Object.entries(ROLES).map(([k, v]) => ({ value: k, label: v.label }))}
            />
            <Segmented
              size="small"
              value={status}
              onChange={(v) => setStatus(v as 'all' | 'active' | 'leave')}
              options={[
                { label: '全部', value: 'all' },
                { label: '在岗', value: 'active' },
                { label: '非在岗', value: 'leave' },
              ]}
            />
          </>
        }
        bodyStyle={{ paddingTop: 8 }}
      >
        <Table
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 12, size: 'small', showTotal: (t) => `共 ${t} 人` }}
          scroll={{ x: 1080 }}
        />
      </SectionCard>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard title="角色构成" extra={<Users size={14} style={{ color: 'var(--np-text-tertiary)' }} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {roleStats.map(([r, s]) => (
              <div key={r}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{ROLES[r as User['role']].label}</span>
                  <span style={{ color: 'var(--np-text-tertiary)' }}>
                    {s.count} 人 · {s.hours}h
                  </span>
                </div>
                <Progress value={(s.count / users.length) * 100} height={4} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="能力缺口" sub="按在建项目需求评估">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { r: 'Cocos 客户端', need: 6, have: 5, note: '深海迷航二期需要补 1 人' },
              { r: '性能优化', need: 3, have: 2, note: '低端机适配是当前瓶颈' },
              { r: '渠道合规', need: 2, have: 2, note: '满足当前节奏' },
              { r: 'TA / 渲染', need: 2, have: 1, note: '海外项目着色器改造缺人' },
            ].map((x) => (
              <div key={x.r}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span>{x.r}</span>
                  <span style={{ color: x.have < x.need ? 'var(--np-danger)' : 'var(--np-text-tertiary)' }}>
                    {x.have} / {x.need} 人
                  </span>
                </div>
                <Progress value={(x.have / x.need) * 100} height={4} color={x.have < x.need ? 'var(--np-danger)' : 'var(--np-success)'} />
                <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)', marginTop: 2 }}>{x.note}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
