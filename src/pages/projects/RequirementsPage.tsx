import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, Drawer, Input, Segmented, Select, Table, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ChevronRight, CircleDot, Search } from 'lucide-react';
import type { Project, Requirement } from '@/types/models';
import { PRIORITY, REQ_STATUS, REQ_TYPE } from '@/types/enums';
import { SectionCard } from '@/components/layout';
import { Avatar, EmptyState, Progress, StatusTag } from '@/components/ui';
import { requirements, userName } from '@/mock';
import { formatDate, fromNow } from '@/utils/format';

export default function RequirementsPage() {
  const { project } = useOutletContext<{ project: Project }>();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [type, setType] = useState<string | undefined>();
  const [priority, setPriority] = useState<string | undefined>();
  const [active, setActive] = useState<Requirement | null>(null);

  const all = useMemo(() => requirements.filter((r) => r.projectId === project.id), [project.id]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length };
    all.forEach((r) => {
      c[r.status] = (c[r.status] ?? 0) + 1;
    });
    return c;
  }, [all]);

  const list = useMemo(
    () =>
      all
        .filter((r) => (status === 'all' ? true : r.status === status))
        .filter((r) => (type ? r.type === type : true))
        .filter((r) => (priority ? r.priority === priority : true))
        .filter((r) => (keyword ? r.title.includes(keyword) || r.id.includes(keyword) : true))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [all, status, type, priority, keyword],
  );

  const points = all.reduce((s, r) => s + r.storyPoints, 0);
  const donePoints = all.filter((r) => r.status === 'done').reduce((s, r) => s + r.storyPoints, 0);

  const columns: ColumnsType<Requirement> = [
    {
      title: '编号',
      dataIndex: 'id',
      width: 132,
      render: (v: string) => <span className="np-mono-sm">{v.replace('REQ-2026-', 'R-')}</span>,
    },
    {
      title: '需求标题',
      dataIndex: 'title',
      render: (v: string, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)', border: '1px solid var(--np-border)', borderRadius: 3, padding: '0 4px' }}>
            {REQ_TYPE[r.type]}
          </span>
          <span style={{ cursor: 'pointer' }} onClick={() => setActive(r)}>
            {v}
          </span>
        </div>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 78,
      render: (v: Requirement['priority']) => <StatusTag label={PRIORITY[v].label} tone={PRIORITY[v].tone} dot={false} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 96,
      render: (v: Requirement['status']) => <StatusTag label={REQ_STATUS[v].label} tone={REQ_STATUS[v].tone} />,
    },
    {
      title: '负责人',
      dataIndex: 'ownerId',
      width: 108,
      render: (v: string) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Avatar name={userName(v)} size={20} />
          {userName(v)}
        </span>
      ),
    },
    {
      title: '故事点',
      dataIndex: 'storyPoints',
      width: 72,
      align: 'right',
      render: (v: number) => <span className="np-num">{v}</span>,
    },
    {
      title: '迭代',
      dataIndex: 'sprint',
      width: 108,
      render: (v: string | null) => (v ? <span style={{ fontSize: 11.5 }}>{v}</span> : <span style={{ color: 'var(--np-text-disabled)' }}>未排期</span>),
    },
    {
      title: '更新',
      dataIndex: 'updatedAt',
      width: 92,
      render: (v: string) => <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>{fromNow(v)}</span>,
    },
  ];

  return (
    <div className="np-page" style={{ paddingTop: 16 }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="np-stat" style={{ flex: 1, minWidth: 150 }}>
          <div className="np-stat-label">需求总数</div>
          <div className="np-stat-value">{all.length}</div>
          <div className="np-stat-foot">共 {points} 故事点</div>
        </div>
        <div className="np-stat" style={{ flex: 1, minWidth: 150 }}>
          <div className="np-stat-label">已交付</div>
          <div className="np-stat-value">{counts.done ?? 0}</div>
          <div className="np-stat-foot">覆盖率 {Math.round((donePoints / Math.max(1, points)) * 100)}%</div>
        </div>
        <div className="np-stat" style={{ flex: 1, minWidth: 150 }}>
          <div className="np-stat-label">开发中</div>
          <div className="np-stat-value">{counts.developing ?? 0}</div>
          <div className="np-stat-foot">待验收 {counts.pending_accept ?? 0} 项</div>
        </div>
        <div className="np-stat" style={{ flex: 1, minWidth: 150 }}>
          <div className="np-stat-label">待评审</div>
          <div className="np-stat-value">{counts.pending_review ?? 0}</div>
          <div className="np-stat-foot">本周新增 {all.filter((r) => r.createdAt >= '2026-10-12').length} 项</div>
        </div>
      </div>

      <SectionCard
        title="需求池"
        sub={`${list.length} / ${all.length} 条`}
        extra={
          <>
            <Input
              size="small"
              allowClear
              prefix={<Search size={13} style={{ color: 'var(--np-text-tertiary)' }} />}
              placeholder="搜索标题或编号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 190 }}
            />
            <Select
              size="small"
              allowClear
              placeholder="类型"
              value={type}
              onChange={setType}
              style={{ width: 96 }}
              options={Object.entries(REQ_TYPE).map(([k, v]) => ({ value: k, label: v }))}
            />
            <Select
              size="small"
              allowClear
              placeholder="优先级"
              value={priority}
              onChange={setPriority}
              style={{ width: 96 }}
              options={Object.entries(PRIORITY).map(([k, v]) => ({ value: k, label: v.full }))}
            />
            <Button size="small" type="primary" onClick={() => message.success('已创建需求草稿')}>
              新建需求
            </Button>
          </>
        }
        bodyStyle={{ paddingTop: 0 }}
      >
        <div style={{ marginBottom: 12 }}>
          <Segmented
            size="small"
            value={status}
            onChange={(v) => setStatus(String(v))}
            options={[
              { label: `全部 ${counts.all ?? 0}`, value: 'all' },
              { label: `待评审 ${counts.pending_review ?? 0}`, value: 'pending_review' },
              { label: `已确认 ${counts.confirmed ?? 0}`, value: 'confirmed' },
              { label: `开发中 ${counts.developing ?? 0}`, value: 'developing' },
              { label: `待验收 ${counts.pending_accept ?? 0}`, value: 'pending_accept' },
              { label: `已完成 ${counts.done ?? 0}`, value: 'done' },
              { label: `已拒绝 ${counts.rejected ?? 0}`, value: 'rejected' },
            ]}
          />
        </div>

        {list.length === 0 ? (
          <EmptyState
            title="没有匹配的需求"
            desc="试试调整筛选条件，或新建一条需求"
            action={
              <Button size="small" style={{ marginTop: 10 }} onClick={() => { setStatus('all'); setType(undefined); setPriority(undefined); setKeyword(''); }}>
                清除筛选
              </Button>
            }
          />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={list}
            pagination={{ pageSize: 12, size: 'small', showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 900 }}
            onRow={(r) => ({ onClick: () => setActive(r), style: { cursor: 'pointer' } })}
          />
        )}
      </SectionCard>

      <Drawer
        open={!!active}
        width={560}
        onClose={() => setActive(null)}
        title={
          active && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="np-mono-sm">{active.id}</span>
              <StatusTag label={REQ_STATUS[active.status].label} tone={REQ_STATUS[active.status].tone} />
            </div>
          )
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setActive(null)}>关闭</Button>
            <Button type="primary" onClick={() => { message.success('已流转到下一状态'); setActive(null); }}>
              推进状态
            </Button>
          </div>
        }
      >
        {active && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, marginBottom: 8 }}>{active.title}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <StatusTag label={REQ_TYPE[active.type]} tone="info" dot={false} />
                <StatusTag label={`${PRIORITY[active.priority].full}优先级`} tone={PRIORITY[active.priority].tone} dot={false} />
                <StatusTag label={`${active.storyPoints} 点`} tone="purple" dot={false} />
                {active.sprint && <StatusTag label={active.sprint} tone="default" dot={false} />}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
              <Meta label="提出人" value={userName(active.proposerId)} />
              <Meta label="负责人" value={userName(active.ownerId)} />
              <Meta label="创建时间" value={formatDate(active.createdAt)} />
              <Meta label="最近更新" value={fromNow(active.updatedAt)} />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--np-text-secondary)' }}>需求描述</div>
              <div style={{ fontSize: 13, lineHeight: 1.85, color: 'var(--np-text-secondary)', whiteSpace: 'pre-wrap' }}>{active.description}</div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--np-text-secondary)' }}>验收标准</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {active.acceptanceCriteria.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, lineHeight: 1.7 }}>
                    <span style={{ color: 'var(--np-success)', marginTop: 2, flexShrink: 0 }}>
                      <CircleDot size={13} />
                    </span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--np-text-secondary)' }}>关联任务进度</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <Progress value={active.status === 'done' ? 100 : active.status === 'developing' ? 55 : 12} height={6} />
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>
                  {active.status === 'done' ? '全部完成' : active.status === 'developing' ? '3/6 子任务' : '尚未拆分'}
                </span>
              </div>
            </div>

            <Tooltip title="演示环境：流转不会写入后端">
              <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                需求流转：待评审 <ChevronRight size={11} /> 已确认 <ChevronRight size={11} /> 开发中 <ChevronRight size={11} /> 待验收 <ChevronRight size={11} /> 已完成
              </span>
            </Tooltip>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)', marginBottom: 2 }}>{label}</div>
      <div>{value}</div>
    </div>
  );
}
