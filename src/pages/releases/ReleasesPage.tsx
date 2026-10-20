import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Segmented, Select, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AlertTriangle, Clock, Rocket } from 'lucide-react';
import type { Release } from '@/types/models';
import { CHANNELS, RELEASE_STATUS } from '@/types/enums';
import type { ChannelId } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { EmptyState, StatusTag } from '@/components/ui';
import { releases, projectName, projects, userName } from '@/mock';
import { formatDate, formatSize, fromNow } from '@/utils/format';

export default function ReleasesPage() {
  const navigate = useNavigate();
  const [scope, setScope] = useState<'all' | 'risk' | 'online'>('all');
  const [channel, setChannel] = useState<ChannelId | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>();

  const base = useMemo(
    () =>
      releases
        .filter((r) => (channel ? r.channel === channel : true))
        .filter((r) => (projectId ? r.projectId === projectId : true)),
    [channel, projectId],
  );

  const list = useMemo(() => {
    const filtered =
      scope === 'risk'
        ? base.filter((r) => ['rejected', 'reviewing', 'grayscale'].includes(r.status))
        : scope === 'online'
          ? base.filter((r) => r.status === 'online')
          : base;
    return [...filtered].sort((a, b) => ((a.publishAt ?? a.submitAt ?? '') < (b.publishAt ?? b.submitAt ?? '') ? 1 : -1));
  }, [base, scope]);

  const channelStats = useMemo(() => {
    const map = new Map<ChannelId, { total: number; online: number; rejected: number }>();
    base.forEach((r) => {
      const cur = map.get(r.channel) ?? { total: 0, online: 0, rejected: 0 };
      cur.total += 1;
      if (r.status === 'online') cur.online += 1;
      if (r.status === 'rejected') cur.rejected += 1;
      map.set(r.channel, cur);
    });
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [base]);

  const reviewing = base.filter((r) => r.status === 'reviewing');
  const rejected = base.filter((r) => r.status === 'rejected');
  const online = base.filter((r) => r.status === 'online');

  const columns: ColumnsType<Release> = [
    {
      title: '版本',
      dataIndex: 'version',
      width: 150,
      render: (v: string, r) => (
        <div>
          <span className="np-mono-sm">{v}</span>
          <div
            className="np-truncate"
            style={{ fontSize: 11, color: 'var(--np-text-tertiary)', cursor: 'pointer' }}
            onClick={() => navigate(`/projects/${r.projectId}/releases`)}
          >
            {projectName(r.projectId)}
          </div>
        </div>
      ),
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      width: 140,
      render: (v: ChannelId) => (
        <span style={{ fontSize: 12 }}>
          {CHANNELS[v].name}
          <span style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)', marginLeft: 5 }}>
            {CHANNELS[v].overseas ? '海外' : '国内'}
          </span>
        </span>
      ),
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
      title: '审核耗时',
      dataIndex: 'reviewDurationHours',
      width: 96,
      align: 'right',
      render: (v: number | null) => (
        <span className="np-num" style={{ fontSize: 11.5, color: v && v > 24 ? 'var(--np-warning)' : undefined }}>
          {v ? `${v}h` : '—'}
        </span>
      ),
    },
    {
      title: '包体',
      dataIndex: 'packageSize',
      width: 92,
      align: 'right',
      render: (v: number, r) => {
        const limit = CHANNELS[r.channel].limitMB;
        const over = limit > 0 && v > limit * 1024 * 1024;
        return (
          <span className="np-num" style={{ fontSize: 11.5, color: over ? 'var(--np-danger)' : undefined }}>
            {formatSize(v)}
            {over && ' ⚠'}
          </span>
        );
      },
    },
    {
      title: '提审 / 发布',
      dataIndex: 'submitAt',
      width: 140,
      render: (v: string | null, r) => (
        <div style={{ fontSize: 11.5 }}>
          <div style={{ color: 'var(--np-text-secondary)' }}>提审 {v ? formatDate(v, 'MM-DD HH:mm') : '—'}</div>
          <div style={{ color: 'var(--np-text-tertiary)' }}>发布 {r.publishAt ? formatDate(r.publishAt, 'MM-DD HH:mm') : '—'}</div>
        </div>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operatorId',
      width: 92,
      render: (v: string) => <span style={{ fontSize: 12 }}>{userName(v)}</span>,
    },
  ];

  return (
    <div className="np-page">
      <PageHeader
        title="发布管理"
        desc={`覆盖 ${channelStats.length} 个渠道 · 待审 ${reviewing.length} 个 · 被驳回 ${rejected.length} 个 · 已上线 ${online.length} 个`}
        actions={
          <>
            <Button onClick={() => navigate('/releases/calendar')}>发布日历</Button>
            <Button type="primary" icon={<Rocket size={13} />}>
              新建发布单
            </Button>
          </>
        }
      />

      <div className="np-grid-3" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">审核中</div>
          <div className="np-stat-value">{reviewing.length}</div>
          <div className="np-stat-foot">
            {reviewing.length > 0
              ? `最早一单已等 ${Math.max(...reviewing.map((r) => r.reviewDurationHours ?? 0))} 小时`
              : '无排队任务'}
          </div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">被驳回</div>
          <div className="np-stat-value" style={{ color: rejected.length > 0 ? 'var(--np-danger)' : undefined }}>
            {rejected.length}
          </div>
          <div className="np-stat-foot">驳回后 24 小时内需重新提审</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">本周期上线</div>
          <div className="np-stat-value">{online.filter((r) => (r.publishAt ?? '') >= '2026-10-01').length}</div>
          <div className="np-stat-foot">平均审核时长 {Math.round(base.reduce((s, r) => s + (r.reviewDurationHours ?? 0), 0) / Math.max(1, base.length))} 小时</div>
        </div>
      </div>

      <SectionCard
        title="发布单"
        sub={`${list.length} 条`}
        extra={
          <>
            <Segmented
              size="small"
              value={scope}
              onChange={(v) => setScope(v as 'all' | 'risk' | 'online')}
              options={[
                { label: '全部', value: 'all' },
                { label: '需要关注', value: 'risk' },
                { label: '已上线', value: 'online' },
              ]}
            />
            <Select
              size="small"
              allowClear
              placeholder="渠道"
              value={channel}
              onChange={setChannel}
              style={{ width: 130 }}
              options={(Object.keys(CHANNELS) as ChannelId[]).map((c) => ({ value: c, label: CHANNELS[c].name }))}
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
          </>
        }
        bodyStyle={{ paddingTop: 8 }}
      >
        {list.length === 0 ? (
          <EmptyState title="没有匹配的发布单" desc="调整筛选条件后再试" />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={list}
            pagination={{ pageSize: 10, size: 'small', showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 980 }}
          />
        )}
      </SectionCard>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard title="渠道分布" sub="按发布单数量">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {channelStats.slice(0, 6).map(([ch, s]) => (
              <div key={ch}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{CHANNELS[ch].name}</span>
                  <span style={{ color: 'var(--np-text-tertiary)' }}>
                    {s.total} 单 · 上线 {s.online}
                    {s.rejected > 0 && <span style={{ color: 'var(--np-danger)' }}> · 驳回 {s.rejected}</span>}
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'var(--np-bg-subtle)', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${(s.online / s.total) * 100}%`, background: 'var(--np-success)' }} />
                  <div style={{ width: `${(s.rejected / s.total) * 100}%`, background: 'var(--np-danger)' }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="驳回与风险" sub={rejected.length + reviewing.length > 0 ? '需处理' : '暂无'}>
          {rejected.length + reviewing.length === 0 ? (
            <EmptyState title="没有风险项" desc="所有发布单状态正常" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...rejected, ...reviewing].slice(0, 6).map((r) => (
                <div key={r.id} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  {r.status === 'rejected' ? (
                    <AlertTriangle size={14} style={{ color: 'var(--np-danger)', marginTop: 2, flexShrink: 0 }} />
                  ) : (
                    <Clock size={14} style={{ color: 'var(--np-info)', marginTop: 2, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5 }}>
                      {projectName(r.projectId)} · {r.version} · {CHANNELS[r.channel].short}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>
                      {r.status === 'rejected' ? r.reviewNote ?? '审核未通过' : `已提审 ${fromNow(r.submitAt)}`}
                    </div>
                  </div>
                  <Tooltip title="打开项目发布页">
                    <Button size="small" type="link" onClick={() => navigate(`/projects/${r.projectId}/releases`)}>
                      处理
                    </Button>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
