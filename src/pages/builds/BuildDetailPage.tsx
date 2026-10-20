import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Table, Tabs, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  GitBranch,
  Play,
  RotateCcw,
  Terminal,
  XCircle,
} from 'lucide-react';
import type { Build } from '@/types/models';
import { BUILD_STATUS } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { BaseChart } from '@/components/BaseChart';
import { EmptyState, Progress, StatusTag } from '@/components/ui';
import { builds, projectName, userName } from '@/mock';
import { formatDateTime, formatDuration, formatSize } from '@/utils/format';

const STAGE_ICON = {
  pending: Clock,
  running: Play,
  success: CheckCircle2,
  failed: XCircle,
} as const;

export default function BuildDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const build = builds.find((b) => b.id === id) ?? builds[0];
  const [logTab, setLogTab] = useState(build.stages[0]?.name ?? '');

  const activeStage = useMemo(() => build.stages.find((s) => s.name === logTab) ?? build.stages[0], [build, logTab]);

  const pie = useMemo(
    () => ({
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} KB ({d}%)' },
      legend: { orient: 'vertical' as const, right: 0, top: 'center', itemGap: 10 },
      series: [
        {
          type: 'pie' as const,
          radius: ['52%', '74%'],
          center: ['34%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderWidth: 2, borderColor: 'transparent' },
          label: { show: false },
          data: build.composition.map((c) => ({ name: c.name, value: c.size, itemStyle: { color: c.color } })),
        },
      ],
    }),
    [build],
  );

  const assetColumns: ColumnsType<Build['topAssets'][number]> = [
    { title: '资源', dataIndex: 'name', render: (v: string) => <span className="np-mono-sm">{v}</span> },
    { title: '类型', dataIndex: 'type', width: 80, render: (v: string) => <span style={{ fontSize: 11.5 }}>{v}</span> },
    {
      title: '原始大小',
      dataIndex: 'rawSize',
      width: 100,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{formatSize(v)}</span>,
    },
    {
      title: '压缩后',
      dataIndex: 'gzipSize',
      width: 100,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{formatSize(v)}</span>,
    },
    {
      title: '压缩率',
      dataIndex: 'ratio',
      width: 120,
      render: (v: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 56 }}>
            <Progress value={v * 100} height={4} color={v > 0.6 ? 'var(--np-success)' : 'var(--np-warning)'} />
          </div>
          <span className="np-num" style={{ fontSize: 11 }}>{(v * 100).toFixed(0)}%</span>
        </div>
      ),
    },
  ];

  if (!build) {
    return (
      <div className="np-page">
        <EmptyState title="构建不存在" desc="该记录可能已被清理（制品保留 30 天）" />
      </div>
    );
  }

  return (
    <div className="np-page">
      <PageHeader
        breadcrumb={
          <div className="np-hstack" style={{ marginBottom: 6 }}>
            <span
              style={{ fontSize: 12, color: 'var(--np-text-tertiary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={() => navigate('/builds')}
            >
              <ArrowLeft size={12} /> 构建中心
            </span>
          </div>
        }
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span className="np-mono">#{build.buildNumber}</span>
            <StatusTag label={BUILD_STATUS[build.status].label} tone={BUILD_STATUS[build.status].tone} />
          </span>
        }
        desc={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span>{projectName(build.projectId)}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <GitBranch size={12} />
              {build.branch}
            </span>
            <span className="np-mono-sm">{build.commitSha.slice(0, 8)}</span>
            <span>{userName(build.author)} 触发</span>
            <span>{formatDateTime(build.createdAt)}</span>
          </span>
        }
        actions={
          <>
            <Button icon={<Download size={13} />}>下载制品</Button>
            <Button icon={<RotateCcw size={13} />}>重新构建</Button>
            {build.status === 'failed' && <Button type="primary">查看失败原因</Button>}
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">总耗时</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>
            {formatDuration(build.durationSec)}
          </div>
          <div className="np-stat-foot">
            {build.stages.filter((s) => s.status === 'success').length}/{build.stages.length} 阶段完成
          </div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">制品大小</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>
            {formatSize(build.artifactSize)}
          </div>
          <div className="np-stat-foot" style={{ color: build.sizeDelta > 0 ? 'var(--np-danger)' : 'var(--np-success)' }}>
            较上次 {build.sizeDelta > 0 ? '+' : ''}
            {build.sizeDelta.toFixed(1)}%
          </div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">质量门禁</div>
          <div className="np-stat-value">
            {build.qualityGates.filter((g) => g.passed).length}
            <small>/ {build.qualityGates.length}</small>
          </div>
          <div className="np-stat-foot">
            {build.qualityGates.some((g) => !g.passed) ? '存在未通过项' : '全部通过'}
          </div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">触发方式</div>
          <div className="np-stat-value" style={{ fontSize: 20 }}>
            {build.trigger === 'push' ? '推送' : build.trigger === 'manual' ? '手动' : build.trigger === 'schedule' ? '定时' : '打标'}
          </div>
          <div className="np-stat-foot">环境 Node {build.env.node}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <SectionCard title="构建阶段" sub={`${build.stages.length} 个阶段`}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {build.stages.map((s) => {
                const Icon = STAGE_ICON[s.status];
                const color =
                  s.status === 'success'
                    ? 'var(--np-success)'
                    : s.status === 'failed'
                      ? 'var(--np-danger)'
                      : s.status === 'running'
                        ? 'var(--np-info)'
                        : 'var(--np-text-disabled)';
                return (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0' }}>
                    <Icon size={15} style={{ color, flexShrink: 0 }} />
                    <span style={{ width: 132, fontSize: 12.5 }}>{s.name}</span>
                    <div style={{ flex: 1 }}>
                      <Progress
                        value={s.status === 'success' ? 100 : s.status === 'running' ? 55 : s.status === 'failed' ? 100 : 0}
                        height={5}
                        color={color}
                      />
                    </div>
                    <span className="np-num" style={{ width: 58, textAlign: 'right', fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>
                      {s.durationSec > 0 ? formatDuration(s.durationSec) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="构建日志"
            extra={
              <span style={{ fontSize: 11, color: 'var(--np-text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Terminal size={12} /> 仅保留本次构建
              </span>
            }
            flush
          >
            <Tabs
              size="small"
              activeKey={logTab}
              onChange={setLogTab}
              style={{ padding: '0 14px' }}
              items={build.stages.map((s) => ({ key: s.name, label: s.name }))}
            />
            <pre
              style={{
                margin: 0,
                padding: '12px 16px 16px',
                background: 'var(--np-bg-subtle)',
                fontSize: 11.5,
                lineHeight: 1.9,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                color: 'var(--np-text-secondary)',
                maxHeight: 320,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {activeStage?.log.length ? activeStage.log.join('\n') : '该阶段暂无日志输出'}
            </pre>
          </SectionCard>

          <SectionCard title="包体 Top 资源" sub="按压缩后大小排序" bodyStyle={{ paddingTop: 8 }}>
            <Table
              rowKey="name"
              size="middle"
              columns={assetColumns}
              dataSource={build.topAssets}
              pagination={false}
              scroll={{ x: 560 }}
            />
          </SectionCard>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="质量门禁">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {build.qualityGates.map((g) => (
                <Tooltip key={g.name} title={g.hint}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    {g.passed ? (
                      <CheckCircle2 size={14} style={{ color: 'var(--np-success)', marginTop: 2, flexShrink: 0 }} />
                    ) : (
                      <XCircle size={14} style={{ color: 'var(--np-danger)', marginTop: 2, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5 }}>{g.name}</div>
                      <div className="np-mono-sm" style={{ fontSize: 11, color: g.passed ? 'var(--np-text-tertiary)' : 'var(--np-danger)' }}>
                        {g.value}
                      </div>
                    </div>
                  </div>
                </Tooltip>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="包体构成" sub={formatSize(build.artifactSize)}>
            <BaseChart option={pie} height={200} />
          </SectionCard>

          <SectionCard title="构建环境">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              {[
                { k: 'Node', v: build.env.node },
                { k: '引擎', v: build.env.engine },
                { k: '打包器', v: build.env.builder },
                { k: '提交', v: build.commitSha.slice(0, 10) },
                { k: '完成时间', v: build.finishedAt ? formatDateTime(build.finishedAt) : '未完成' },
              ].map((x) => (
                <div key={x.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ color: 'var(--np-text-tertiary)', flexShrink: 0 }}>{x.k}</span>
                  <span className="np-mono-sm np-truncate" style={{ textAlign: 'right' }}>
                    {x.v}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
