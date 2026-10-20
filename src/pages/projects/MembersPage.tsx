import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, Progress as AntProgress, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Mail, UserPlus } from 'lucide-react';
import type { Project, User } from '@/types/models';
import { ROLES } from '@/types/enums';
import { SectionCard } from '@/components/layout';
import { Avatar, Progress, StatusTag } from '@/components/ui';
import { tasks, users } from '@/mock';
import { formatDate } from '@/utils/format';

export default function MembersPage() {
  const { project } = useOutletContext<{ project: Project }>();

  const members = useMemo(
    () =>
      project.memberIds
        .map((id) => users.find((u) => u.id === id))
        .filter((u): u is User => !!u)
        .map((u) => {
          const mine = tasks.filter((t) => t.projectId === project.id && t.assigneeId === u.id);
          const done = mine.filter((t) => t.status === 'done').length;
          const hours = mine.reduce((s, t) => s + t.spentHours, 0);
          return { ...u, taskCount: mine.length, done, hours };
        }),
    [project],
  );

  const totalHours = members.reduce((s, m) => s + m.hours, 0);
  const avgLoad = members.reduce((s, m) => s + m.workload, 0) / Math.max(1, members.length);
  const overloaded = members.filter((m) => m.workload > 95);

  const roleGroups = useMemo(() => {
    const map = new Map<string, number>();
    members.forEach((m) => map.set(m.role, (map.get(m.role) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [members]);

  const columns: ColumnsType<(typeof members)[number]> = [
    {
      title: '成员',
      dataIndex: 'name',
      width: 190,
      render: (v: string, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar name={v} size={30} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 500 }}>{v}</span>
              {r.id === project.managerId && <StatusTag label="PM" tone="info" dot={false} />}
            </div>
            <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>{r.enName}</div>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 132,
      render: (v: User['role']) => <span style={{ fontSize: 12 }}>{ROLES[v].label}</span>,
    },
    { title: '职级', dataIndex: 'level', width: 68, render: (v: string) => <span className="np-mono-sm">{v}</span> },
    {
      title: '技能',
      dataIndex: 'skills',
      render: (v: string[]) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {v.slice(0, 3).map((s) => (
            <span
              key={s}
              style={{
                fontSize: 10.5,
                padding: '1px 6px',
                borderRadius: 3,
                background: 'var(--np-bg-subtle)',
                color: 'var(--np-text-secondary)',
              }}
            >
              {s}
            </span>
          ))}
        </div>
      ),
    },
    {
      title: '本项目任务',
      dataIndex: 'taskCount',
      width: 116,
      render: (v: number, r) => (
        <span style={{ fontSize: 12 }}>
          <span className="np-num">{r.done}</span>
          <span style={{ color: 'var(--np-text-tertiary)' }}> / {v}</span>
        </span>
      ),
    },
    {
      title: '投入工时',
      dataIndex: 'hours',
      width: 96,
      align: 'right',
      render: (v: number) => <span className="np-num">{v}h</span>,
    },
    {
      title: '当前负载',
      dataIndex: 'workload',
      width: 150,
      render: (v: number) => (
        <Tooltip title={v > 95 ? '已超负荷，建议调配' : undefined}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 78 }}>
              <Progress value={v} height={5} color={v > 95 ? 'var(--np-danger)' : v > 80 ? 'var(--np-warning)' : undefined} />
            </div>
            <span className="np-num" style={{ fontSize: 11.5, color: v > 95 ? 'var(--np-danger)' : undefined }}>
              {v}%
            </span>
          </div>
        </Tooltip>
      ),
    },
    {
      title: '入职时间',
      dataIndex: 'joinDate',
      width: 104,
      render: (v: string) => <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>{formatDate(v)}</span>,
    },
    {
      title: '',
      width: 54,
      render: () => <Button type="text" size="small" icon={<Mail size={13} />} />,
    },
  ];

  return (
    <div className="np-page" style={{ paddingTop: 16 }}>
      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">项目成员</div>
          <div className="np-stat-value">
            {members.length}
            <small>人</small>
          </div>
          <div className="np-stat-foot">{roleGroups.length} 种角色</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">累计投入</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>
            {totalHours}
            <small>h</small>
          </div>
          <div className="np-stat-foot">人均 {Math.round(totalHours / Math.max(1, members.length))}h</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">平均负载</div>
          <div className="np-stat-value">{Math.round(avgLoad)}%</div>
          <div className="np-stat-foot">
            {overloaded.length > 0 ? `${overloaded.length} 人超 95%` : '负载均衡'}
          </div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">角色分布</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8 }}>
            {roleGroups.slice(0, 3).map(([role, n]) => (
              <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <span style={{ width: 62, color: 'var(--np-text-tertiary)' }}>{ROLES[role as User['role']].label}</span>
                <div style={{ flex: 1 }}>
                  <Progress value={(n / members.length) * 100} height={4} />
                </div>
                <span className="np-num">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionCard
        title="项目成员"
        sub={`共 ${members.length} 人`}
        extra={
          <Button size="small" type="primary" icon={<UserPlus size={13} />}>
            添加成员
          </Button>
        }
        bodyStyle={{ paddingTop: 8 }}
      >
        <Table
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={members}
          pagination={false}
          scroll={{ x: 1000 }}
        />
      </SectionCard>

      <div style={{ marginTop: 16 }} className="np-grid-2">
        <SectionCard title="角色配置" sub="按本项目实际投入">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {roleGroups.map(([role, n]) => (
              <div key={role}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{ROLES[role as User['role']].label}</span>
                  <span className="np-num" style={{ color: 'var(--np-text-tertiary)' }}>
                    {n} 人
                  </span>
                </div>
                <AntProgress
                  percent={Math.round((n / members.length) * 100)}
                  showInfo={false}
                  size="small"
                  strokeColor="var(--np-primary-500)"
                  trailColor="var(--np-bg-subtle)"
                />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="负载预警" sub={overloaded.length > 0 ? `${overloaded.length} 人需要调配` : '暂无预警'}>
          {overloaded.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--np-text-tertiary)', padding: '14px 0' }}>
              所有成员负载均在 95% 以下，排期健康。
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {overloaded.map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={m.name} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5 }}>
                      {m.name} · {ROLES[m.role].label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--np-danger)' }}>
                      负载 {m.workload}%，本周排入 {m.taskCount} 项任务
                    </div>
                  </div>
                  <Button size="small">调配</Button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
