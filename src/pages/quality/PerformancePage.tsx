import { useMemo, useState } from 'react';
import { Button, Segmented, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Activity, Cpu, Gauge, MemoryStick } from 'lucide-react';
import type { PerformanceRow } from '@/types/models';
import { CHANNELS } from '@/types/enums';
import type { ChannelId } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { BaseChart } from '@/components/BaseChart';
import { Progress, StatusTag } from '@/components/ui';
import { perfTrend, performanceRows, projects, projectName } from '@/mock';
import { formatInt, formatPercent } from '@/utils/format';

const TIER_LABEL: Record<PerformanceRow['deviceTier'], string> = { high: '高端机', mid: '中端机', low: '低端机' };

export default function PerformancePage() {
  const [metric, setMetric] = useState<'fp50' | 'fps' | 'crash'>('fp50');
  const [channel, setChannel] = useState<ChannelId>('wechat');
  const [projectId, setProjectId] = useState<string | undefined>();

  const rows = useMemo(
    () => performanceRows.filter((r) => (projectId ? r.projectId === projectId : true)),
    [projectId],
  );

  const trend = useMemo(() => perfTrend(channel, metric), [channel, metric]);
  const latest = trend[trend.length - 1]?.value ?? 0;
  const first = trend[0]?.value ?? 0;
  const delta = first ? (latest - first) / first : 0;

  const avgFp50 = rows.reduce((s, r) => s + r.fp50, 0) / Math.max(1, rows.length);
  const avgFps = rows.reduce((s, r) => s + r.fps, 0) / Math.max(1, rows.length);
  const avgCrash = rows.reduce((s, r) => s + r.crashRate, 0) / Math.max(1, rows.length);
  const badRows = rows.filter((r) => r.lowFpsRate > 0.05 || r.crashRate > 0.005);

  const chartOption = useMemo(() => {
    const unit = metric === 'fp50' ? 'ms' : metric === 'fps' ? 'fps' : '%';
    return {
      grid: { left: 4, right: 12, top: 20, bottom: 4, containLabel: true },
      tooltip: {
        trigger: 'axis' as const,
        valueFormatter: (v: unknown) =>
          metric === 'crash' ? `${(Number(v) * 100).toFixed(2)}%` : `${Math.round(Number(v))} ${unit}`,
      },
      xAxis: { type: 'category' as const, data: trend.map((t) => t.date.slice(5)) },
      yAxis: { type: 'value' as const, scale: true },
      series: [
        {
          type: 'line' as const,
          data: trend.map((t) => t.value),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: metric === 'crash' ? '#F04438' : '#4C8DFF' },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: metric === 'crash' ? 'rgba(240,68,56,.16)' : 'rgba(76,141,255,.16)' },
                { offset: 1, color: 'rgba(76,141,255,0)' },
              ],
            },
          },
        },
      ],
    };
  }, [trend, metric]);

  const columns: ColumnsType<PerformanceRow> = [
    {
      title: '项目',
      dataIndex: 'projectId',
      width: 160,
      render: (v: string) => <span style={{ fontSize: 12 }}>{projectName(v)}</span>,
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      width: 100,
      render: (v: ChannelId) => <span style={{ fontSize: 12 }}>{CHANNELS[v].short}</span>,
    },
    { title: '版本', dataIndex: 'version', width: 82, render: (v: string) => <span className="np-mono-sm">{v}</span> },
    {
      title: '机型档位',
      dataIndex: 'deviceTier',
      width: 90,
      render: (v: PerformanceRow['deviceTier']) => (
        <StatusTag label={TIER_LABEL[v]} tone={v === 'low' ? 'warning' : v === 'high' ? 'success' : 'info'} dot={false} />
      ),
    },
    {
      title: 'FP50',
      dataIndex: 'fp50',
      width: 86,
      align: 'right',
      render: (v: number) => (
        <span className="np-num" style={{ fontSize: 11.5, color: v > 2400 ? 'var(--np-danger)' : v > 1800 ? 'var(--np-warning)' : undefined }}>
          {formatInt(v)} ms
        </span>
      ),
    },
    {
      title: 'FP95',
      dataIndex: 'fp95',
      width: 86,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{formatInt(v)} ms</span>,
    },
    {
      title: 'FPS',
      dataIndex: 'fps',
      width: 70,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{v.toFixed(1)}</span>,
    },
    {
      title: '低帧率占比',
      dataIndex: 'lowFpsRate',
      width: 124,
      render: (v: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 58 }}>
            <Progress value={Math.min(100, v * 800)} height={4} color={v > 0.05 ? 'var(--np-danger)' : undefined} />
          </div>
          <span className="np-num" style={{ fontSize: 11 }}>{formatPercent(v, 1)}</span>
        </div>
      ),
    },
    {
      title: '内存峰值',
      dataIndex: 'memoryPeak',
      width: 96,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{v} MB</span>,
    },
    {
      title: '崩溃率',
      dataIndex: 'crashRate',
      width: 84,
      align: 'right',
      render: (v: number) => (
        <span className="np-num" style={{ fontSize: 11.5, color: v > 0.005 ? 'var(--np-danger)' : 'var(--np-success)' }}>
          {formatPercent(v, 2)}
        </span>
      ),
    },
    {
      title: '样本',
      dataIndex: 'samples',
      width: 78,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11 }}>{formatInt(v)}</span>,
    },
  ];

  return (
    <div className="np-page">
      <PageHeader
        title="性能监控"
        desc={`今日采集 ${formatInt(rows.reduce((s, r) => s + r.samples, 0))} 个样本 · ${badRows.length} 个组合需要优化`}
        actions={
          <>
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
            <Button>导出报告</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Gauge size={13} /> 平均 FP50
            </span>
          </div>
          <div className="np-stat-value">{formatInt(avgFp50)}<small>ms</small></div>
          <div className="np-stat-foot">首帧时间，越低越好</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Activity size={13} /> 平均帧率
            </span>
          </div>
          <div className="np-stat-value">{avgFps.toFixed(1)}<small>fps</small></div>
          <div className="np-stat-foot">目标 ≥ 55 fps</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <MemoryStick size={13} /> 崩溃率
            </span>
          </div>
          <div className="np-stat-value">{formatPercent(avgCrash, 2)}</div>
          <div className="np-stat-foot">红线 0.50%</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Cpu size={13} /> 待优化组合
            </span>
          </div>
          <div className="np-stat-value" style={{ color: badRows.length > 0 ? 'var(--np-warning)' : undefined }}>
            {badRows.length}
          </div>
          <div className="np-stat-foot">低帧率或崩溃率超标</div>
        </div>
      </div>

      <SectionCard
        title="性能趋势"
        sub="近 30 天"
        extra={
          <>
            <Select
              size="small"
              value={channel}
              onChange={setChannel}
              style={{ width: 132 }}
              options={(Object.keys(CHANNELS) as ChannelId[]).map((c) => ({ value: c, label: CHANNELS[c].name }))}
            />
            <Segmented
              size="small"
              value={metric}
              onChange={(v) => setMetric(v as 'fp50' | 'fps' | 'crash')}
              options={[
                { label: 'FP50', value: 'fp50' },
                { label: '帧率', value: 'fps' },
                { label: '崩溃率', value: 'crash' },
              ]}
            />
          </>
        }
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
            {metric === 'crash' ? `${(latest * 100).toFixed(2)}%` : formatInt(latest)}
          </span>
          <span style={{ fontSize: 11.5, color: delta > 0 ? 'var(--np-danger)' : 'var(--np-success)' }}>
            {delta > 0 ? '+' : ''}
            {(delta * 100).toFixed(1)}% 较 30 天前
          </span>
        </div>
        <BaseChart option={chartOption} height={240} />
      </SectionCard>

      <div style={{ marginTop: 16 }}>
        <SectionCard title="分机型明细" sub={`${rows.length} 条`} bodyStyle={{ paddingTop: 8 }}>
          <Table
            rowKey={(r) => `${r.projectId}-${r.channel}-${r.deviceTier}`}
            size="middle"
            columns={columns}
            dataSource={rows}
            pagination={{ pageSize: 10, size: 'small' }}
            scroll={{ x: 1080 }}
          />
        </SectionCard>
      </div>
    </div>
  );
}
