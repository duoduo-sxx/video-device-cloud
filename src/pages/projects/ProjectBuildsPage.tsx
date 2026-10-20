import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button, Segmented, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowDown, ArrowUp, GitBranch, Play, RotateCcw } from 'lucide-react';
import type { Build, Project } from '@/types/models';
import { BUILD_STATUS } from '@/types/enums';
import { SectionCard } from '@/components/layout';
import { EmptyState, StatusTag } from '@/components/ui';
import { builds, userName } from '@/mock';
import { formatDateTime, formatDuration, formatSize, fromNow } from '@/utils/format';

export default function ProjectBuildsPage() {
  const { project } = useOutletContext<{ project: Project }>();
  const navigate = useNavigate();
  const [scope, setScope] = useState<'all' | 'success' | 'failed'>('all');

  const all = useMemo(
    () => builds.filter((b) => b.projectId === project.id).sort((a, b) => b.buildNumber - a.buildNumber),
    [project.id],
  );

  const list = useMemo(
    () => (scope === 'all' ? all : all.filter((b) => b.status === scope)),
    [all, scope],
  );

  const successCount = all.filter((b) => b.status === 'success').length;
  const failedCount = all.filter((b) => b.status === 'failed').length;
  const avgDuration = all.reduce((s, b) => s + b.durationSec, 0) / Math.max(1, all.length);
  const latest = all[0];

  const columns: ColumnsType<Build> = [
    {
      title: '#',
      dataIndex: 'buildNumber',
      width: 82,
      render: (v: number, r) => (
        <span
          className="np-mono-sm"
          style={{ cursor: 'pointer', color: 'var(--np-primary-600, var(--np-primary-500))' }}
          onClick={() => navigate(`/builds/${r.id}`)}
        >
          #{v}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 92,
      render: (v: Build['status']) => <StatusTag label={BUILD_STATUS[v].label} tone={BUILD_STATUS[v].tone} />,
    },
    {
      title: '分支 / 提交',
      dataIndex: 'branch',
      render: (_: string, r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
            <GitBranch size={12} style={{ color: 'var(--np-text-tertiary)' }} />
            <span className="np-mono-sm">{r.branch}</span>
            <span className="np-mono-sm" style={{ color: 'var(--np-text-tertiary)' }}>
              {r.commitSha.slice(0, 7)}
            </span>
          </div>
          <div className="np-truncate" style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)', marginTop: 2 }}>
            {r.commitMessage}
          </div>
        </div>
      ),
    },
    {
      title: '触发人',
      dataIndex: 'author',
      width: 96,
      render: (v: string) => <span style={{ fontSize: 12 }}>{userName(v)}</span>,
    },
    {
      title: '耗时',
      dataIndex: 'durationSec',
      width: 84,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{formatDuration(v)}</span>,
    },
    {
      title: '包体',
      dataIndex: 'artifactSize',
      width: 108,
      align: 'right',
      render: (v: number, r) => (
        <span className="np-num" style={{ fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          {formatSize(v)}
          {r.sizeDelta !== 0 && (
            <span style={{ color: r.sizeDelta > 0 ? 'var(--np-danger)' : 'var(--np-success)', display: 'inline-flex', alignItems: 'center' }}>
              {r.sizeDelta > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
              {Math.abs(r.sizeDelta).toFixed(1)}%
            </span>
          )}
        </span>
      ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 104,
      render: (v: string) => (
        <Tooltip title={formatDateTime(v)}>
          <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>{fromNow(v)}</span>
        </Tooltip>
      ),
    },
    {
      title: '',
      width: 62,
      align: 'right',
      render: (_: unknown, r) => (
        <Button size="small" type="text" icon={<RotateCcw size={12} />} onClick={() => navigate(`/builds/${r.id}`)} />
      ),
    },
  ];

  return (
    <div className="np-page" style={{ paddingTop: 16 }}>
      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">累计构建</div>
          <div className="np-stat-value">{all.length}</div>
          <div className="np-stat-foot">平均 {formatDuration(Math.round(avgDuration))}</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">成功率</div>
          <div className="np-stat-value">{Math.round((successCount / Math.max(1, all.length)) * 100)}%</div>
          <div className="np-stat-foot">
            成功 {successCount} · 失败 {failedCount}
          </div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">最新包体</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>
            {latest ? formatSize(latest.artifactSize) : '—'}
          </div>
          <div className="np-stat-foot">{latest ? `#${latest.buildNumber} · ${latest.branch}` : '暂无构建'}</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">当前版本</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>
            {project.currentVersion}
          </div>
          <div className="np-stat-foot">{project.currentSprint}</div>
        </div>
      </div>

      <SectionCard
        title="构建记录"
        sub={`${list.length} 条`}
        extra={
          <>
            <Segmented
              size="small"
              value={scope}
              onChange={(v) => setScope(v as 'all' | 'success' | 'failed')}
              options={[
                { label: '全部', value: 'all' },
                { label: '成功', value: 'success' },
                { label: '失败', value: 'failed' },
              ]}
            />
            <Button size="small" type="primary" icon={<Play size={12} />}>
              新建构建
            </Button>
          </>
        }
        bodyStyle={{ paddingTop: 8 }}
      >
        {list.length === 0 ? (
          <EmptyState title="暂无构建记录" desc="触发一次构建后，记录会出现在这里" />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={list}
            pagination={{ pageSize: 10, size: 'small', showTotal: (t) => `共 ${t} 次构建` }}
            scroll={{ x: 880 }}
            onRow={(r) => ({ onClick: () => navigate(`/builds/${r.id}`), style: { cursor: 'pointer' } })}
          />
        )}
      </SectionCard>
    </div>
  );
}
