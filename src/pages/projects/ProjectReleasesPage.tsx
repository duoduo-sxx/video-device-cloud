import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AlertTriangle, Check, Clock, Rocket, X } from 'lucide-react';
import type { Project, Release } from '@/types/models';
import { CHANNELS, RELEASE_STATUS } from '@/types/enums';
import type { ChannelId } from '@/types/enums';
import { SectionCard } from '@/components/layout';
import { EmptyState, StatusTag } from '@/components/ui';
import { releases, userName, versionColumns } from '@/mock';
import { formatDate, formatSize, fromNow } from '@/utils/format';

export default function ProjectReleasesPage() {
  const { project } = useOutletContext<{ project: Project }>();
  const [activeCell, setActiveCell] = useState<{ channel: ChannelId; version: string } | null>(null);

  const all = useMemo(() => releases.filter((r) => r.projectId === project.id), [project.id]);
  const versions = useMemo(() => versionColumns(project.id), [project.id]);
  const channels = useMemo(() => {
    const set = new Set(all.map((r) => r.channel));
    return [...set] as ChannelId[];
  }, [all]);

  const find = (channel: ChannelId, version: string) => all.find((r) => r.channel === channel && r.version === version);

  const online = all.filter((r) => r.status === 'online').length;
  const reviewing = all.filter((r) => r.status === 'reviewing').length;
  const rejected = all.filter((r) => r.status === 'rejected').length;

  const cellIcon = (r?: Release) => {
    if (!r) return <span style={{ color: 'var(--np-text-disabled)', fontSize: 11 }}>—</span>;
    if (r.status === 'online')
      return (
        <span className="np-cell" style={{ color: 'var(--np-success)' }}>
          <Check size={12} strokeWidth={2.6} />
        </span>
      );
    if (r.status === 'rejected')
      return (
        <span className="np-cell" style={{ color: 'var(--np-danger)' }}>
          <X size={12} strokeWidth={2.6} />
        </span>
      );
    if (r.status === 'reviewing')
      return (
        <span className="np-cell" style={{ color: 'var(--np-info)' }}>
          <Clock size={12} strokeWidth={2.4} />
        </span>
      );
    if (r.status === 'grayscale')
      return (
        <span className="np-cell" style={{ color: 'var(--np-warning)' }}>
          <AlertTriangle size={12} strokeWidth={2.4} />
        </span>
      );
    return (
      <span className="np-cell" style={{ color: 'var(--np-text-tertiary)' }}>
        <Rocket size={12} />
      </span>
    );
  };

  const columns: ColumnsType<Release> = [
    { title: '版本', dataIndex: 'version', width: 88, render: (v: string) => <span className="np-mono-sm">{v}</span> },
    {
      title: '渠道',
      dataIndex: 'channel',
      width: 128,
      render: (v: ChannelId) => <span style={{ fontSize: 12 }}>{CHANNELS[v].name}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: Release['status']) => <StatusTag label={RELEASE_STATUS[v].label} tone={RELEASE_STATUS[v].tone} />,
    },
    {
      title: '灰度',
      dataIndex: 'grayscalePercent',
      width: 74,
      align: 'right',
      render: (v: number) => <span className="np-num">{v}%</span>,
    },
    {
      title: '提审时间',
      dataIndex: 'submitAt',
      width: 106,
      render: (v: string | null) => <span style={{ fontSize: 11.5 }}>{v ? formatDate(v, 'MM-DD HH:mm') : '—'}</span>,
    },
    {
      title: '审核耗时',
      dataIndex: 'reviewDurationHours',
      width: 96,
      align: 'right',
      render: (v: number | null) => <span className="np-num" style={{ fontSize: 11.5 }}>{v ? `${v}h` : '—'}</span>,
    },
    {
      title: '包体',
      dataIndex: 'packageSize',
      width: 92,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{formatSize(v)}</span>,
    },
    {
      title: '操作人',
      dataIndex: 'operatorId',
      width: 92,
      render: (v: string) => <span style={{ fontSize: 12 }}>{userName(v)}</span>,
    },
    {
      title: '更新时间',
      dataIndex: 'publishAt',
      width: 96,
      render: (v: string | null, r) => (
        <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>{fromNow(v ?? r.submitAt)}</span>
      ),
    },
  ];

  return (
    <div className="np-page" style={{ paddingTop: 16 }}>
      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">已上线</div>
          <div className="np-stat-value">{online}</div>
          <div className="np-stat-foot">覆盖 {channels.length} 个渠道</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">审核中</div>
          <div className="np-stat-value">{reviewing}</div>
          <div className="np-stat-foot">平均审核 18 小时</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">被驳回</div>
          <div className="np-stat-value" style={{ color: rejected > 0 ? 'var(--np-danger)' : undefined }}>
            {rejected}
          </div>
          <div className="np-stat-foot">{rejected > 0 ? '查看驳回原因后重新提审' : '暂无驳回'}</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">当前版本</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>
            {project.currentVersion}
          </div>
          <div className="np-stat-foot">{versions.length} 个版本记录</div>
        </div>
      </div>

      <SectionCard title="发布矩阵" sub="行=渠道，列=版本，点击格子查看详情" bodyStyle={{ overflowX: 'auto' }}>
        <table className="np-matrix">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', minWidth: 140 }}>渠道</th>
              {versions.map((v) => (
                <th key={v} className="np-mono-sm">
                  {v}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {channels.map((ch) => (
              <tr key={ch}>
                <td>
                  <div style={{ fontSize: 12.5 }}>{CHANNELS[ch].name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>
                    {CHANNELS[ch].limitMB > 0 ? `首包上限 ${CHANNELS[ch].limitMB}MB` : '无包体限制'}
                  </div>
                </td>
                {versions.map((v) => {
                  const rel = find(ch, v);
                  return (
                    <td
                      key={v}
                      className={rel ? 'np-cell-td np-cell-td--active' : 'np-cell-td'}
                      onClick={() => rel && setActiveCell({ channel: ch, version: v })}
                    >
                      <Tooltip
                        title={
                          rel
                            ? `${CHANNELS[ch].short} ${v} · ${RELEASE_STATUS[rel.status].label}${
                                rel.reviewNote ? ` · ${rel.reviewNote}` : ''
                              }`
                            : '该渠道此版本无发布记录'
                        }
                      >
                        {cellIcon(rel)}
                      </Tooltip>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>
          <Legend color="var(--np-success)" label="已上线" />
          <Legend color="var(--np-warning)" label="灰度 / 预下载" />
          <Legend color="var(--np-info)" label="审核中" />
          <Legend color="var(--np-danger)" label="已驳回" />
          <Legend color="var(--np-text-tertiary)" label="其他状态" />
        </div>
      </SectionCard>

      {activeCell && (
        <div style={{ marginTop: 16 }}>
          <ReleaseDetail
            release={find(activeCell.channel, activeCell.version)}
            channel={activeCell.channel}
            onClose={() => setActiveCell(null)}
          />
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <SectionCard title="发布记录" sub={`${all.length} 条`} bodyStyle={{ paddingTop: 8 }}>
          {all.length === 0 ? (
            <EmptyState title="暂无发布记录" desc="构建成功后可发起渠道发布" />
          ) : (
            <Table
              rowKey="id"
              size="middle"
              columns={columns}
              dataSource={[...all].sort((a, b) => (a.version < b.version ? 1 : -1))}
              pagination={{ pageSize: 8, size: 'small', showTotal: (t) => `共 ${t} 条` }}
              scroll={{ x: 940 }}
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, opacity: 0.85 }} />
      {label}
    </span>
  );
}

function ReleaseDetail({ release, channel, onClose }: { release?: Release; channel: ChannelId; onClose: () => void }) {
  if (!release) return null;
  return (
    <SectionCard
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {CHANNELS[channel].name} · {release.version}
          <StatusTag label={RELEASE_STATUS[release.status].label} tone={RELEASE_STATUS[release.status].tone} />
        </span>
      }
      extra={
        <Button size="small" onClick={onClose}>
          收起
        </Button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, fontSize: 12.5 }}>
        <Field label="灰度比例" value={`${release.grayscalePercent}%`} />
        <Field label="包体大小" value={formatSize(release.packageSize)} />
        <Field label="提审时间" value={release.submitAt ? formatDate(release.submitAt, 'YYYY-MM-DD HH:mm') : '—'} />
        <Field label="审核耗时" value={release.reviewDurationHours ? `${release.reviewDurationHours} 小时` : '—'} />
        <Field label="操盘人" value={userName(release.operatorId)} />
        <Field label="关联构建" value={release.buildId || '—'} />
        <Field label="回滚来源" value={release.rollbackFrom ?? '—'} />
        <Field label="发布时间" value={release.publishAt ? formatDate(release.publishAt, 'YYYY-MM-DD HH:mm') : '—'} />
      </div>
      {release.reviewNote && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 6,
            background: 'var(--np-danger-50, rgba(240,68,56,.06))',
            fontSize: 12.5,
            color: 'var(--np-danger)',
          }}
        >
          驳回原因：{release.reviewNote}
        </div>
      )}
      <div style={{ marginTop: 14, fontSize: 12.5, lineHeight: 1.85, color: 'var(--np-text-secondary)' }}>
        <b style={{ fontWeight: 500 }}>版本说明：</b>
        {release.releaseNote}
      </div>
    </SectionCard>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)', marginBottom: 3 }}>{label}</div>
      <div className="np-mono-sm" style={{ fontSize: 12.5, color: 'var(--np-text-primary)' }}>
        {value}
      </div>
    </div>
  );
}
