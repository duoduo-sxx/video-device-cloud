import { useMemo, useState } from 'react';
import { Button, Select, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ChevronDown, ChevronUp, Smartphone } from 'lucide-react';
import type { CrashGroup } from '@/mock';
import { CHANNELS } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { EmptyState, Progress, StatusTag, Avatar } from '@/components/ui';
import { crashGroups, projectName, projects } from '@/mock';
import { formatInt, fromNow } from '@/utils/format';

const STATUS_MAP = {
  open: { label: '待处理', tone: 'danger' as const },
  fixing: { label: '修复中', tone: 'warning' as const },
  fixed: { label: '已修复', tone: 'success' as const },
  ignored: { label: '已忽略', tone: 'default' as const },
};

const TAG_MAP = { TypeError: 'danger', RangeError: 'warning', AbortError: 'info', WebGLError: 'purple', NetworkError: 'default' } as const;

export default function CrashesPage() {
  const [status, setStatus] = useState<string | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>();
  const [expanded, setExpanded] = useState<string | null>(null);

  const list = useMemo(
    () =>
      [...crashGroups]
        .filter((c) => (status ? c.status === status : true))
        .filter((c) => (projectId ? c.projectId === projectId : true))
        .sort((a, b) => b.count - a.count),
    [status, projectId],
  );

  const totalCount = crashGroups.reduce((s, c) => s + c.count, 0);
  const totalUsers = crashGroups.reduce((s, c) => s + c.users, 0);
  const newGroups = crashGroups.filter((c) => c.isNew);

  const columns: ColumnsType<CrashGroup> = [
    {
      title: '异常',
      dataIndex: 'message',
      render: (v: string, r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusTag label={r.type} tone={TAG_MAP[r.type as keyof typeof TAG_MAP] ?? 'default'} dot={false} />
            {r.isNew && <StatusTag label="新增" tone="danger" dot={false} />}
            <span style={{ fontSize: 12, fontWeight: 500 }} className="np-truncate">
              {v}
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)', marginTop: 2 }}>
            {projectName(r.projectId)} · {CHANNELS[r.channel].short} {r.version}
          </div>
        </div>
      ),
    },
    {
      title: '影响',
      dataIndex: 'count',
      width: 128,
      render: (v: number, r) => (
        <div>
          <div style={{ fontSize: 12 }} className="np-num">
            {formatInt(v)} 次
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>{formatInt(r.users)} 用户</div>
        </div>
      ),
    },
    {
      title: '设备分布',
      dataIndex: 'devices',
      width: 168,
      render: (v: CrashGroup['devices']) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {v.slice(0, 2).map((d) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5 }}>
              <span style={{ width: 58, color: 'var(--np-text-tertiary)' }} className="np-truncate">
                {d.name}
              </span>
              <div style={{ flex: 1 }}>
                <Progress value={d.ratio} height={3} />
              </div>
              <span className="np-num" style={{ width: 24, textAlign: 'right', color: 'var(--np-text-tertiary)' }}>
                {d.ratio}%
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '首次出现',
      dataIndex: 'firstSeen',
      width: 92,
      render: (v: string) => <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>{fromNow(v)}</span>,
    },
    {
      title: '最近出现',
      dataIndex: 'lastSeen',
      width: 92,
      render: (v: string) => <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>{fromNow(v)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 92,
      render: (v: CrashGroup['status']) => <StatusTag label={STATUS_MAP[v].label} tone={STATUS_MAP[v].tone} />,
    },
    {
      title: '',
      width: 44,
      render: (_: unknown, r) => (
        <Button
          type="text"
          size="small"
          icon={expanded === r.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(expanded === r.id ? null : r.id);
          }}
        />
      ),
    },
  ];

  return (
    <div className="np-page">
      <PageHeader
        title="崩溃与异常"
        desc={`近 7 天共 ${formatInt(totalCount)} 次异常，影响 ${formatInt(totalUsers)} 位用户 · 新增 ${newGroups.length} 类`}
        actions={
          <>
            <Select
              size="small"
              allowClear
              placeholder="全部状态"
              value={status}
              onChange={setStatus}
              style={{ width: 116 }}
              options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
            />
            <Select
              size="small"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="全部项目"
              value={projectId}
              onChange={setProjectId}
              style={{ width: 160 }}
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
            <Button type="primary">导出堆栈</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">异常总数</div>
          <div className="np-stat-value">{formatInt(totalCount)}</div>
          <div className="np-stat-foot">{crashGroups.length} 个聚合分组</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">受影响用户</div>
          <div className="np-stat-value">{formatInt(totalUsers)}</div>
          <div className="np-stat-foot">占日活约 0.42%</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">新增异常</div>
          <div className="np-stat-value" style={{ color: newGroups.length > 0 ? 'var(--np-danger)' : undefined }}>
            {newGroups.length}
          </div>
          <div className="np-stat-foot">近 48 小时首次出现</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">待处理</div>
          <div className="np-stat-value">{crashGroups.filter((c) => c.status === 'open').length}</div>
          <div className="np-stat-foot">修复中 {crashGroups.filter((c) => c.status === 'fixing').length} 个</div>
        </div>
      </div>

      <SectionCard title="异常分组" sub={`${list.length} 个`} bodyStyle={{ paddingTop: 8 }}>
        {list.length === 0 ? (
          <EmptyState title="没有匹配的异常" desc="调整筛选条件后再试" />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={list}
            pagination={{ pageSize: 10, size: 'small', showTotal: (t) => `共 ${t} 组` }}
            scroll={{ x: 1000 }}
            expandable={{
              expandedRowKeys: expanded ? [expanded] : [],
              expandedRowRender: (r) => (
                <div style={{ padding: '4px 0 10px' }}>
                  <div style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)', marginBottom: 6 }}>调用堆栈</div>
                  <pre
                    style={{
                      margin: 0,
                      padding: '10px 12px',
                      background: 'var(--np-bg-subtle)',
                      borderRadius: 6,
                      fontSize: 11.5,
                      lineHeight: 1.85,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      color: 'var(--np-text-secondary)',
                      overflowX: 'auto',
                    }}
                  >
                    {r.stack.join('\n')}
                  </pre>
                  <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>
                    <span>签名：<span className="np-mono-sm" style={{ fontSize: 11 }}>{r.signature}</span></span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Smartphone size={11} />
                      {r.devices.map((d) => d.name).join(' / ')}
                    </span>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <Button size="small">创建缺陷</Button>
                    <Button size="small">指派处理</Button>
                    <Button size="small">标记忽略</Button>
                  </div>
                </div>
              ),
              rowExpandable: () => true,
              onExpand: (_, r) => setExpanded(expanded === r.id ? null : r.id),
            }}
          />
        )}
      </SectionCard>

      <div style={{ marginTop: 16 }} className="np-grid-2">
        <SectionCard title="异常类型分布">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {Object.entries(TAG_MAP).map(([type]) => {
              const groups = crashGroups.filter((c) => c.type === type);
              const count = groups.reduce((s, c) => s + c.count, 0);
              return (
                <div key={type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span className="np-mono-sm" style={{ fontSize: 11.5 }}>{type}</span>
                    <span style={{ color: 'var(--np-text-tertiary)' }}>
                      {formatInt(count)} 次 · {groups.length} 组
                    </span>
                  </div>
                  <Progress value={(count / Math.max(1, totalCount)) * 100} height={5} />
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="新增异常待认领" extra={<StatusTag label={`${newGroups.length} 个`} tone="danger" dot={false} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {newGroups.slice(0, 4).map((g) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <Avatar name={g.type} size={24} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="np-truncate" style={{ fontSize: 12.5 }}>
                    {g.message}
                  </div>
                  <Tooltip title={`${g.count} 次 · ${g.users} 用户`}>
                    <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>
                      {projectName(g.projectId)} · {fromNow(g.firstSeen)}首次出现
                    </div>
                  </Tooltip>
                </div>
                <Button size="small" type="link">
                  认领
                </Button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
