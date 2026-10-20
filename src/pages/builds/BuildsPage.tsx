import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { GitBranch, Search, Zap } from 'lucide-react';
import type { Build } from '@/types/models';
import { BUILD_STATUS } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { EmptyState, StatusTag } from '@/components/ui';
import { builds, projectName, projects, userName } from '@/mock';
import { formatDateTime, formatDuration, formatSize, fromNow } from '@/utils/format';

export default function BuildsPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [projectId, setProjectId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();

  const list = useMemo(
    () =>
      [...builds]
        .filter((b) => (projectId ? b.projectId === projectId : true))
        .filter((b) => (status ? b.status === status : true))
        .filter((b) => (keyword ? b.commitMessage.includes(keyword) || b.branch.includes(keyword) || String(b.buildNumber).includes(keyword) : true))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [projectId, status, keyword],
  );

  const stats = useMemo(() => {
    const total = builds.length;
    const success = builds.filter((b) => b.status === 'success').length;
    const failed = builds.filter((b) => b.status === 'failed').length;
    const running = builds.filter((b) => b.status === 'running').length;
    const avg = builds.reduce((s, b) => s + b.durationSec, 0) / Math.max(1, total);
    return { total, success, failed, running, avg, rate: success / Math.max(1, success + failed) };
  }, []);

  const slowest = useMemo(() => [...builds].sort((a, b) => b.durationSec - a.durationSec).slice(0, 5), []);

  const columns: ColumnsType<Build> = [
    {
      title: '构建',
      dataIndex: 'buildNumber',
      width: 132,
      render: (v: number, r) => (
        <div>
          <span className="np-mono-sm" style={{ color: 'var(--np-primary-600, var(--np-primary-500))' }}>
            #{v}
          </span>
          <div className="np-truncate" style={{ fontSize: 11, color: 'var(--np-text-tertiary)', maxWidth: 120 }}>
            {projectName(r.projectId)}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 92,
      render: (v: Build['status']) => <StatusTag label={BUILD_STATUS[v].label} tone={BUILD_STATUS[v].tone} />,
    },
    {
      title: '分支 / 提交信息',
      dataIndex: 'branch',
      render: (_: string, r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <GitBranch size={12} style={{ color: 'var(--np-text-tertiary)' }} />
            <span className="np-mono-sm">{r.branch}</span>
            <span className="np-mono-sm" style={{ color: 'var(--np-text-tertiary)' }}>
              {r.commitSha.slice(0, 7)}
            </span>
            <span style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>· {r.trigger === 'push' ? '推送触发' : r.trigger === 'manual' ? '手动触发' : r.trigger === 'schedule' ? '定时触发' : '打标触发'}</span>
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
      width: 90,
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
      width: 96,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{formatSize(v)}</span>,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 100,
      render: (v: string) => (
        <Tooltip title={formatDateTime(v)}>
          <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>{fromNow(v)}</span>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="np-page">
      <PageHeader
        title="构建中心"
        desc={`全站 ${projects.length} 个项目 · 近 30 天共 ${stats.total} 次构建 · 成功率 ${(stats.rate * 100).toFixed(1)}%`}
        actions={
          <>
            <Button icon={<Zap size={13} />}>配置流水线</Button>
            <Button type="primary">新建构建</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">构建总数</div>
          <div className="np-stat-value">{stats.total}</div>
          <div className="np-stat-foot">平均耗时 {formatDuration(Math.round(stats.avg))}</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">成功</div>
          <div className="np-stat-value" style={{ color: 'var(--np-success)' }}>
            {stats.success}
          </div>
          <div className="np-stat-foot">成功率 {(stats.rate * 100).toFixed(1)}%</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">失败</div>
          <div className="np-stat-value" style={{ color: stats.failed > 0 ? 'var(--np-danger)' : undefined }}>
            {stats.failed}
          </div>
          <div className="np-stat-foot">主要是包体超限与类型错误</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">运行中</div>
          <div className="np-stat-value">{stats.running}</div>
          <div className="np-stat-foot">并发上限 4 个任务</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
        <SectionCard
          title="构建记录"
          sub={`${list.length} 条`}
          extra={
            <>
              <Input
                size="small"
                allowClear
                prefix={<Search size={13} style={{ color: 'var(--np-text-tertiary)' }} />}
                placeholder="搜索分支或提交"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ width: 180 }}
              />
              <Select
                size="small"
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="项目"
                value={projectId}
                onChange={setProjectId}
                style={{ width: 150 }}
                options={projects.map((p) => ({ value: p.id, label: p.name }))}
              />
              <Select
                size="small"
                allowClear
                placeholder="状态"
                value={status}
                onChange={setStatus}
                style={{ width: 96 }}
                options={Object.entries(BUILD_STATUS).map(([k, v]) => ({ value: k, label: v.label }))}
              />
            </>
          }
          bodyStyle={{ paddingTop: 8 }}
        >
          {list.length === 0 ? (
            <EmptyState title="没有匹配的构建" desc="调整筛选条件后再试" />
          ) : (
            <Table
              rowKey="id"
              size="middle"
              columns={columns}
              dataSource={list}
              pagination={{ pageSize: 10, size: 'small', showTotal: (t) => `共 ${t} 次构建` }}
              scroll={{ x: 900 }}
              onRow={(r) => ({ onClick: () => navigate(`/builds/${r.id}`), style: { cursor: 'pointer' } })}
            />
          )}
        </SectionCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="耗时最长" sub="Top 5">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {slowest.map((b) => (
                <div
                  key={b.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/builds/${b.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
                    <span className="np-mono-sm">#{b.buildNumber}</span>
                    <span className="np-num" style={{ color: 'var(--np-text-tertiary)' }}>{formatDuration(b.durationSec)}</span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 2,
                      background: 'var(--np-bg-subtle)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${(b.durationSec / Math.max(1, slowest[0]?.durationSec ?? 1)) * 100}%`,
                        height: '100%',
                        background: 'var(--np-primary-500)',
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <div className="np-truncate" style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)', marginTop: 3 }}>
                    {projectName(b.projectId)} · {b.branch}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="流水线配置">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              {[
                { k: 'Node 版本', v: '20.11.1' },
                { k: '构建机', v: 'mac-mini-m2 × 4' },
                { k: '并发上限', v: '4' },
                { k: '缓存命中率', v: '78.4%' },
                { k: '制品保留', v: '30 天' },
              ].map((x) => (
                <div key={x.k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--np-text-tertiary)' }}>{x.k}</span>
                  <span className="np-mono-sm">{x.v}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
