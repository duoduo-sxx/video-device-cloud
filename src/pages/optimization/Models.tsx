import { useState } from 'react';
import { Button, Progress, Table, Tag, message } from 'antd';
import { ExperimentOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { PageHeader, StatusTag } from '../../components/base';
import ChartCard from '../../components/ChartCard';
import EChart from '../../charts/EChart';
import { EXPERIMENTS, MODELS } from '../../mock/seed';
import type { Experiment } from '../../types';
import { fmtShortTime } from '../../utils/format';

const STATUS_MAP = {
  production: { label: '生产', color: '#16A34A' },
  gray: { label: '灰度', color: '#D97706' },
  offline: { label: '下线', color: '#64748B' },
};

export default function Models() {
  const [selected, setSelected] = useState<string | null>(null);

  const trendOption = {
    grid: { left: 4, right: 12, top: 30, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { right: 0, top: 0 },
    xAxis: { type: 'category', data: ['第 1 周', '第 2 周', '第 3 周', '第 4 周', '第 5 周', '第 6 周', '第 7 周', '第 8 周'] },
    yAxis: { type: 'value', min: 80, max: 100, name: '准确率 %', splitLine: { show: true } },
    series: [
      { name: '拥塞预测', type: 'line', smooth: true, data: [90.2, 91.4, 92.1, 92.8, 93.4, 93.9, 94.2, 94.6] },
      { name: '压缩比预测', type: 'line', smooth: true, data: [87.6, 88.2, 88.9, 89.4, 90.1, 90.4, 90.8, 91.2] },
      { name: '链路质量打分', type: 'line', smooth: true, data: [91.8, 92.6, 93.4, 94.2, 94.8, 95.2, 95.8, 96.1] },
    ],
  };

  const optionFor = (exp: Experiment) => ({
    grid: { left: 4, right: 8, top: 30, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { right: 0, top: 0, data: ['对照组', '实验组'] },
    xAxis: { type: 'category', data: exp.series.control.map((_, i) => `D${i + 1}`) },
    yAxis: { type: 'value', name: exp.metric, splitLine: { show: true }, scale: true },
    series: [
      { name: '对照组', type: 'line', smooth: true, data: exp.series.control },
      { name: '实验组', type: 'line', smooth: true, data: exp.series.treatment },
    ],
  });

  return (
    <div>
      <PageHeader
        title="模型与实验"
        desc="支撑智能选路、压缩决策与耗时预测的模型版本与 A/B 实验"
        actions={<Button icon={<ExperimentOutlined />} onClick={() => message.info('实验创建向导为演示入口')}>新建实验</Button>}
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        {MODELS.map((m) => (
          <div
            key={m.id}
            className="cf-card"
            style={{ cursor: 'pointer', borderColor: selected === m.id ? '#2563EB' : undefined }}
            onClick={() => setSelected(selected === m.id ? null : m.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</div>
              <StatusTag {...STATUS_MAP[m.status]} dot={false} />
            </div>
            <div className="muted" style={{ marginTop: 2 }}>{m.id} · {m.algo}</div>
            <div style={{ margin: '14px 0 4px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 600, color: '#2563EB' }}>{m.accuracy}%</span>
              <span className="muted">准确率</span>
            </div>
            <Progress percent={m.accuracy} size="small" showInfo={false} strokeColor="#2563EB" />
            <div className="muted" style={{ marginTop: 10 }}>
              训练样本 {m.samples} · 上线 {fmtShortTime(m.deployedAt)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8, lineHeight: 1.6 }}>{m.desc}</div>
          </div>
        ))}
      </div>

      <ChartCard title="模型效果趋势" desc="近 8 周准确率变化" extra={<span className="muted">按周聚合</span>} bodyStyle={{ marginBottom: 16 }}>
        <EChart option={trendOption} height={260} />
      </ChartCard>

      <div className="cf-card" style={{ padding: 16, marginTop: 16 }}>
        <div className="cf-card-title" style={{ marginBottom: 4 }}>A/B 实验</div>
        <div className="muted" style={{ marginBottom: 12 }}>点击行展开可查看对照组与实验组的指标对比曲线</div>
        <Table
          className="cf-table"
          rowKey="id"
          size="middle"
          dataSource={EXPERIMENTS}
          pagination={false}
          expandable={{
            expandedRowRender: (exp) => (
              <div style={{ padding: '8px 0' }}>
                <EChart option={optionFor(exp)} height={220} />
              </div>
            ),
          }}
          columns={[
            { title: '实验名称', dataIndex: 'name', width: 240 },
            { title: '核心指标', dataIndex: 'metric', width: 170 },
            { title: '对照组', dataIndex: 'control', width: 110 },
            { title: '实验组', dataIndex: 'treatment', width: 110 },
            {
              title: '提升',
              dataIndex: 'lift',
              width: 100,
              render: (v: number) => (
                <span style={{ color: v >= 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                  {v >= 0 ? '+' : ''}{v}%
                </span>
              ),
            },
            {
              title: '置信度',
              dataIndex: 'confidence',
              width: 110,
              render: (v: number) => (
                <span>
                  {v}% {v >= 95 ? <Tag color="green" bordered={false}>显著</Tag> : null}
                </span>
              ),
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (v: Experiment['status']) => (
                <StatusTag
                  label={v === 'running' ? '进行中' : '已结束'}
                  color={v === 'running' ? '#2563EB' : '#64748B'}
                />
              ),
            },
            { title: '开始时间', dataIndex: 'startedAt', width: 120, render: (v: string) => <span className="muted">{fmtShortTime(v)}</span> },
          ]}
        />
      </div>

      <div className="cf-card" style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <ThunderboltOutlined style={{ color: '#8B5CF6' }} />
        <span style={{ fontSize: 13 }}>模型每 6 小时增量训练一次；灰度模型仅对 10% 的任务生效，验证通过后全量发布。</span>
      </div>
    </div>
  );
}
