import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, Drawer, Input, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Monitor, Search, Smartphone } from 'lucide-react';
import type { Bug, Project } from '@/types/models';
import { BUG_SEVERITY, BUG_STATUS, CHANNELS, PRIORITY, REPRO_RATE } from '@/types/enums';
import { SectionCard } from '@/components/layout';
import { Avatar, EmptyState, StatusTag } from '@/components/ui';
import { bugs, userName } from '@/mock';
import { formatDate, fromNow } from '@/utils/format';

export default function BugsPage() {
  const { project } = useOutletContext<{ project: Project }>();
  const [keyword, setKeyword] = useState('');
  const [severity, setSeverity] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [active, setActive] = useState<Bug | null>(null);

  const all = useMemo(() => bugs.filter((b) => b.projectId === project.id), [project.id]);
  const open = all.filter((b) => !['closed', 'rejected', 'verified'].includes(b.status));

  const list = useMemo(
    () =>
      all
        .filter((b) => (severity ? b.severity === severity : true))
        .filter((b) => (status ? b.status === status : true))
        .filter((b) => (keyword ? b.title.includes(keyword) || b.id.includes(keyword) : true))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [all, severity, status, keyword],
  );

  const bySeverity = (s: Bug['severity']) => all.filter((b) => b.severity === s && !['closed', 'rejected'].includes(b.status)).length;

  const columns: ColumnsType<Bug> = [
    { title: '编号', dataIndex: 'id', width: 118, render: (v: string) => <span className="np-mono-sm">{v}</span> },
    {
      title: '缺陷标题',
      dataIndex: 'title',
      render: (v: string, r) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ cursor: 'pointer' }} onClick={() => setActive(r)}>
              {v}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)', marginTop: 2 }}>
            {r.module} · {CHANNELS[r.environment.channel].short} {r.environment.version} · {r.environment.device}
          </div>
        </div>
      ),
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      width: 88,
      render: (v: Bug['severity']) => <StatusTag label={BUG_SEVERITY[v].label} tone={BUG_SEVERITY[v].tone} dot={false} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: Bug['status']) => <StatusTag label={BUG_STATUS[v].label} tone={BUG_STATUS[v].tone} />,
    },
    {
      title: '复现率',
      dataIndex: 'reproduceRate',
      width: 78,
      render: (v: Bug['reproduceRate']) => <span style={{ fontSize: 11.5, color: 'var(--np-text-secondary)' }}>{REPRO_RATE[v]}</span>,
    },
    {
      title: '指派',
      dataIndex: 'assigneeId',
      width: 104,
      render: (v: string) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Avatar name={userName(v)} size={20} />
          {userName(v)}
        </span>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      width: 96,
      render: (v: string) => <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>{fromNow(v)}</span>,
    },
  ];

  return (
    <div className="np-page" style={{ paddingTop: 16 }}>
      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">未关闭缺陷</div>
          <div className="np-stat-value">{open.length}</div>
          <div className="np-stat-foot">累计 {all.length} 条</div>
        </div>
        {(['blocker', 'critical', 'major'] as Bug['severity'][]).map((s) => (
          <div className="np-stat" key={s}>
            <div className="np-stat-label">{BUG_SEVERITY[s].label}及以上</div>
            <div className="np-stat-value" style={{ color: bySeverity(s) > 0 ? 'var(--np-danger)' : undefined }}>
              {bySeverity(s)}
            </div>
            <div className="np-stat-foot">需在当日站会认领</div>
          </div>
        ))}
      </div>

      <SectionCard
        title="缺陷列表"
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
              style={{ width: 180 }}
            />
            <Select
              size="small"
              allowClear
              placeholder="严重程度"
              value={severity}
              onChange={setSeverity}
              style={{ width: 104 }}
              options={Object.entries(BUG_SEVERITY).map(([k, v]) => ({ value: k, label: v.label }))}
            />
            <Select
              size="small"
              allowClear
              placeholder="状态"
              value={status}
              onChange={setStatus}
              style={{ width: 100 }}
              options={Object.entries(BUG_STATUS).map(([k, v]) => ({ value: k, label: v.label }))}
            />
            <Button size="small" type="primary">
              提交缺陷
            </Button>
          </>
        }
        bodyStyle={{ paddingTop: 8 }}
      >
        {list.length === 0 ? (
          <EmptyState title="暂无匹配缺陷" desc="当前筛选条件下没有记录" />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={list}
            pagination={{ pageSize: 12, size: 'small', showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 880 }}
            onRow={(r) => ({ onClick: () => setActive(r), style: { cursor: 'pointer' } })}
          />
        )}
      </SectionCard>

      <Drawer
        open={!!active}
        width={580}
        onClose={() => setActive(null)}
        title={
          active && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="np-mono-sm">{active.id}</span>
              <StatusTag label={BUG_SEVERITY[active.severity].label} tone={BUG_SEVERITY[active.severity].tone} dot={false} />
              <StatusTag label={BUG_STATUS[active.status].label} tone={BUG_STATUS[active.status].tone} />
            </div>
          )
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setActive(null)}>关闭</Button>
            <Button onClick={() => setActive(null)}>标记重复</Button>
            <Button type="primary" onClick={() => setActive(null)}>
              流转状态
            </Button>
          </div>
        }
      >
        {active && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5 }}>{active.title}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
              <Meta label="所属模块" value={active.module} />
              <Meta label="优先级" value={PRIORITY[active.priority].full} />
              <Meta label="提交人" value={userName(active.reporterId)} />
              <Meta label="指派给" value={userName(active.assigneeId)} />
              <Meta label="提交时间" value={formatDate(active.createdAt, 'YYYY-MM-DD HH:mm')} />
              <Meta label="复现率" value={REPRO_RATE[active.reproduceRate]} />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--np-text-secondary)' }}>环境信息</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '6px 14px',
                  fontSize: 12,
                  padding: '10px 12px',
                  background: 'var(--np-bg-subtle)',
                  borderRadius: 6,
                }}
              >
                <span style={{ color: 'var(--np-text-tertiary)' }}>渠道 / 版本</span>
                <span>
                  {CHANNELS[active.environment.channel].name} · {active.environment.version}
                </span>
                <span style={{ color: 'var(--np-text-tertiary)' }}>机型 / 系统</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Smartphone size={12} />
                  {active.environment.device} · {active.environment.os}
                </span>
                <span style={{ color: 'var(--np-text-tertiary)' }}>运行环境</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Monitor size={12} />
                  {active.environment.browser}
                </span>
                <span style={{ color: 'var(--np-text-tertiary)' }}>关联构建</span>
                <span className="np-mono-sm">{active.buildId ?? '—'}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--np-text-secondary)' }}>复现步骤</div>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12.5, lineHeight: 2, color: 'var(--np-text-secondary)' }}>
                {active.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--np-text-secondary)' }}>预期结果</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--np-text-secondary)' }}>{active.expected}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--np-danger)' }}>实际结果</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--np-text-secondary)' }}>{active.actual}</div>
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>
              附件 {active.attachmentCount} 个 · {active.closedAt ? `关闭于 ${formatDate(active.closedAt)}` : '尚未关闭'}
            </div>
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
