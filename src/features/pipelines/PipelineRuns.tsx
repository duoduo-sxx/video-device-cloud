import { useNavigate, useParams } from 'react-router-dom';
import { Button, Table, Progress } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { PageHeader, Panel, StatusBadge } from '@/components/ui';
import { PIPELINES, PIPELINE_RUNS } from '@/mock/seed/pipelines';
import { fmtDateTime, fmtDuration } from '@/utils/format';
import type { PipelineRun } from '@/types';

export default function PipelineRuns() {
  const { pipelineId = 'pl_01' } = useParams();
  const nav = useNavigate();
  const pipeline = PIPELINES.find((p) => p.id === pipelineId) || PIPELINES[0];
  const runs = PIPELINE_RUNS.filter((r) => r.pipelineId === pipelineId).slice().sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));

  return (
    <div>
      <PageHeader
        title={
          <span className="row" style={{ gap: 10 }}>
            <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={() => nav(`/pipelines/${pipelineId}`)} />
            {pipeline.name} · 运行记录
          </span>
        }
        subtitle={`共 ${runs.length} 条记录 · 近 7 日运行 ${pipeline.runs7d} 次 · 成功率 ${pipeline.successRate}%`}
        actions={
          <>
            <Button icon={<ReloadOutlined />}>刷新</Button>
            <Button type="primary" onClick={() => nav(`/pipelines/${pipelineId}`)}>
              返回编排
            </Button>
          </>
        }
      />

      <div className="grid g4" style={{ marginBottom: 14 }}>
        {[
          { label: '总运行次数', value: String(runs.length) },
          { label: '成功', value: String(runs.filter((r) => r.status === 'succeeded').length) },
          { label: '失败', value: String(runs.filter((r) => r.status === 'failed').length) },
          { label: '平均耗时', value: `${Math.round(runs.reduce((s, r) => s + r.durationSec, 0) / Math.max(1, runs.length) / 60)} 分钟` },
        ].map((m) => (
          <div key={m.label} className="metric" style={{ cursor: 'default' }}>
            <div className="label">{m.label}</div>
            <div className="value">{m.value}</div>
          </div>
        ))}
      </div>

      <Panel noPad>
        <Table<PipelineRun>
          rowKey="id"
          size="middle"
          dataSource={runs}
          pagination={{ pageSize: 10, size: 'small' }}
          columns={[
            { title: '运行 ID', dataIndex: 'id', width: 150, render: (v) => <span className="mono" style={{ fontSize: 11.5 }}>{v}</span> },
            { title: '状态', dataIndex: 'status', width: 90, render: (v) => <StatusBadge status={v} /> },
            { title: '触发方式', dataIndex: 'triggeredBy', width: 110 },
            { title: '处理素材', dataIndex: 'assetTitle', render: (v) => <span style={{ fontSize: 12.5 }}>{v}</span> },
            { title: '开始时间', dataIndex: 'startedAt', width: 150, render: (v) => fmtDateTime(v) },
            { title: '耗时', dataIndex: 'durationSec', width: 100, render: (v) => fmtDuration(v) },
            {
              title: '进度',
              width: 120,
              render: (_, r) => (
                <Progress percent={r.status === 'failed' ? 68 : 100} size="small" showInfo={false} strokeColor={r.status === 'failed' ? '#F87171' : '#34D399'} />
              ),
            },
            {
              title: '',
              width: 100,
              render: () => (
                <Button size="small" type="text" onClick={() => nav('/tasks')}>
                  查看任务
                </Button>
              ),
            },
          ]}
        />
      </Panel>
    </div>
  );
}
