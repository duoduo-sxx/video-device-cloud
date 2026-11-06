import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Progress, Segmented } from 'antd';
import { ArrowRightOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { PageHeader, Panel, MetricCard, StatusBadge } from '@/components/ui';
import { Chart, baseAxis, tooltipStyle } from '@/components/Chart';
import { useTaskStore } from '@/stores/tasks';
import { useCurrentUser } from '@/stores/app';
import { summary as assetSummary } from '@/mock/db';
import { TODAY_HOURS, CAP_DISTRIBUTION, GPU_NODES, REVIEW_QUEUE_IDS } from '@/mock/seed/misc';
import { CAP_NAMES } from '@/mock/seed/capabilities';
import { fmtNum, fmtRelative } from '@/utils/format';
import type { EChartsOption } from 'echarts';

const TODO = [
  { id: 't1', title: '内容审核待处理 12 条', desc: '其中 3 条为高风险，需 2 小时内完成', tag: '待审核', path: '/tools/review', level: 'warning' },
  { id: 't2', title: '失败任务 5 个待重试', desc: '主要集中在 4K 超分能力（显存不足）', tag: '任务', path: '/tasks?status=failed', level: 'failed' },
  { id: 't3', title: '本月配额已用 42.9%', desc: '按当前速率预计月底达 92%，建议提前扩容', tag: '用量', path: '/usage', level: 'brand' },
  { id: 't4', title: '2 个 API Key 将于 7 天内过期', desc: '「内容中台-生产」到期时间 2026-10-26', tag: '安全', path: '/developer', level: 'queued' },
];

export default function Dashboard() {
  const nav = useNavigate();
  const user = useCurrentUser();
  const tasks = useTaskStore((s) => s.tasks);
  const [range, setRange] = useState<number>(14);

  const stats = useMemo(() => {
    const running = tasks.filter((t) => t.status === 'running').length;
    const queued = tasks.filter((t) => t.status === 'queued').length;
    const success = tasks.filter((t) => t.status === 'succeeded').length;
    const failed = tasks.filter((t) => t.status === 'failed').length;
    const rate = success + failed > 0 ? (success / (success + failed)) * 100 : 0;
    const today = tasks.filter((t) => t.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
    return { running, queued, rate, today, failed };
  }, [tasks]);

  const sum = assetSummary();
  const hours = 1286.4;

  const data = TODAY_HOURS.slice(-range);

  const lineOption: EChartsOption = {
    grid: { left: 44, right: 44, top: 24, bottom: 26 },
    tooltip: { trigger: 'axis', ...tooltipStyle() },
    legend: { show: false },
    xAxis: { type: 'category', boundaryGap: false, data: data.map((d) => d.date), ...baseAxis() },
    yAxis: [
      { type: 'value', name: '小时', nameTextStyle: { color: 'var(--text-tertiary)', fontSize: 10 }, ...baseAxis() },
      { type: 'value', name: '任务', nameTextStyle: { color: 'var(--text-tertiary)', fontSize: 10 }, ...baseAxis(), splitLine: { show: false } },
    ],
    series: [
      {
        name: '处理时长',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: data.map((d) => d.hours),
        lineStyle: { width: 2, color: '#5B6CFF' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(91,108,255,.28)' },
              { offset: 1, color: 'rgba(91,108,255,0)' },
            ],
          },
        },
      },
      {
        name: '任务数',
        type: 'line',
        smooth: true,
        symbol: 'none',
        yAxisIndex: 1,
        data: data.map((d) => d.tasks),
        lineStyle: { width: 1.5, color: '#22D3EE', type: 'dashed' },
      },
    ],
  };

  const pieOption: EChartsOption = {
    tooltip: { trigger: 'item', ...tooltipStyle() },
    legend: {
      bottom: 0,
      icon: 'circle',
      itemWidth: 7,
      itemHeight: 7,
      textStyle: { color: 'var(--text-secondary)', fontSize: 11 },
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '72%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: 'var(--bg-panel)', borderWidth: 2 },
        label: { show: false },
        data: CAP_DISTRIBUTION.map((c) => ({ name: c.name, value: c.value, itemStyle: { color: c.color } })),
      },
    ],
  };

  const recent = tasks.slice(0, 6);

  return (
    <div>
      <PageHeader
        title={`早上好，${user.name}`}
        subtitle={`${user.role} · ${user.group} · 本月已处理 ${hours} 小时，配额使用 42.9%`}
        actions={
          <>
            <Button icon={<ThunderboltOutlined />} onClick={() => nav('/tools')}>
              发起智能处理
            </Button>
            <Button type="primary" onClick={() => nav('/upload')}>
              上传素材
            </Button>
          </>
        }
      />

      <div className="grid g4" style={{ marginBottom: 14 }}>
        <MetricCard label="本月处理时长" value="1,286.4" unit="小时" delta="18.2%" deltaUp seed={11} hint="较上月" onClick={() => nav('/usage')} />
        <MetricCard
          label="运行中任务"
          value={stats.running}
          unit={`/ ${stats.running + stats.queued} 个`}
          hint={`${stats.queued} 个排队中`}
          seed={23}
          color="var(--accent)"
          onClick={() => nav('/tasks?status=running')}
        />
        <MetricCard label="任务成功率" value={stats.rate.toFixed(1)} unit="%" delta="0.6%" deltaUp={false} hint="近 30 天" seed={37} color="var(--success)" onClick={() => nav('/tasks')} />
        <MetricCard label="存储用量" value="12.4" unit="TB / 20 TB" hint="62% 已使用" seed={41} color="var(--purple)" onClick={() => nav('/settings')} />
      </div>

      <div className="grid split-2-1" style={{ marginBottom: 14 }}>
        <Panel
          title="处理趋势"
          extra={
            <Segmented
              size="small"
              value={range}
              onChange={(v) => setRange(v as number)}
              options={[
                { label: '7 天', value: 7 },
                { label: '14 天', value: 14 },
              ]}
            />
          }
        >
          <Chart option={lineOption} height={244} />
          <div className="row" style={{ gap: 20, marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span className="row" style={{ gap: 6 }}>
              <i style={{ width: 14, height: 2, background: '#5B6CFF', display: 'inline-block' }} /> 处理时长（小时）
            </span>
            <span className="row" style={{ gap: 6 }}>
              <i style={{ width: 14, height: 2, background: '#22D3EE', display: 'inline-block' }} /> 任务数
            </span>
            <span style={{ marginLeft: 'auto' }} className="hint">
              合计 {fmtNum(data.reduce((s, d) => s + d.hours, 0))} 小时 · {fmtNum(data.reduce((s, d) => s + d.tasks, 0))} 个任务
            </span>
          </div>
        </Panel>
        <Panel title="能力调用分布" extra={<span className="hint">近 30 天</span>}>
          <Chart option={pieOption} height={244} />
        </Panel>
      </div>

      <div className="grid split-2-1">
        <Panel
          title="GPU 队列实时看板"
          extra={
            <span className="row" style={{ gap: 6, fontSize: 12 }}>
              <span className="badge running pulse">
                <span className="dot" />
                3 个节点运行中
              </span>
            </span>
          }
        >
          <div className="grid g4" style={{ gap: 10 }}>
            {GPU_NODES.map((n) => (
              <div key={n.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--bg-elevated)' }}>
                <div className="row between" style={{ marginBottom: 8 }}>
                  <span className="row" style={{ gap: 6, fontSize: 12.5, fontWeight: 500 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        background: n.progress > 0 ? 'var(--accent)' : 'var(--text-tertiary)',
                      }}
                    />
                    {n.id}
                  </span>
                  <span className="hint">{n.mem}</span>
                </div>
                <div style={{ fontSize: 12, height: 34, color: n.task === '空闲' ? 'var(--text-tertiary)' : 'var(--text-primary)', lineHeight: 1.4 }}>
                  {n.task}
                </div>
                <Progress percent={n.progress} size="small" showInfo={false} strokeColor={n.progress > 0 ? '#22D3EE' : '#2F3949'} />
                <div className="row between" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  <span>占用 {n.util}%</span>
                  <span>剩余 {n.eta}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="row between" style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
            <span>
              队列总长度 <b style={{ color: 'var(--text-primary)' }}>{stats.queued}</b> · 预计等待 <b style={{ color: 'var(--text-primary)' }}>4 分 20 秒</b>
            </span>
            <a onClick={() => nav('/tasks')}>
              查看任务中心 <ArrowRightOutlined />
            </a>
          </div>
        </Panel>

        <Panel title="待办与风险提醒" extra={<span className="hint">4 项</span>}>
          <div className="col" style={{ gap: 4 }}>
            {TODO.map((t) => (
              <div
                key={t.id}
                className="clickable"
                onClick={() => nav(t.path)}
                style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="row between" style={{ gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</span>
                  <span className={`badge ${t.level === 'failed' ? 'failed' : t.level === 'warning' ? 'warning' : t.level === 'brand' ? 'brand' : 'queued'}`} style={{ flex: '0 0 auto' }}>
                    {t.tag}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3 }}>{t.desc}</div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="hint" style={{ marginBottom: 8 }}>
            审核队列（{REVIEW_QUEUE_IDS.length} 个素材待处理）
          </div>
          <div className="row" style={{ gap: 6 }}>
            {REVIEW_QUEUE_IDS.map((id) => (
              <span key={id} className="chip">
                {id}
              </span>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="最近任务" style={{ marginTop: 14 }} extra={<a onClick={() => nav('/tasks')}>全部任务 →</a>} noPad>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ color: 'var(--text-tertiary)', textAlign: 'left' }}>
              <th style={{ padding: '8px 16px', fontWeight: 400 }}>任务</th>
              <th style={{ padding: '8px 8px', fontWeight: 400 }}>能力</th>
              <th style={{ padding: '8px 8px', fontWeight: 400 }}>状态</th>
              <th style={{ padding: '8px 8px', fontWeight: 400 }}>进度</th>
              <th style={{ padding: '8px 8px', fontWeight: 400 }}>创建人</th>
              <th style={{ padding: '8px 16px', fontWeight: 400 }}>时间</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((t) => (
              <tr
                key={t.id}
                className="clickable"
                onClick={() => nav(`/tasks/${t.id}`)}
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <td style={{ padding: '10px 16px' }}>{t.name}</td>
                <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{CAP_NAMES[t.capability]}</td>
                <td style={{ padding: '10px 8px' }}>
                  <StatusBadge status={t.status} />
                </td>
                <td style={{ padding: '10px 8px', width: 110 }}>
                  <Progress percent={t.progress} size="small" showInfo={false} strokeColor={t.status === 'failed' ? '#F87171' : '#5B6CFF'} />
                </td>
                <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{t.createdBy.replace('u_', 'U')}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text-tertiary)' }}>{fmtRelative(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <div style={{ height: 8 }} />
      <div className="hint" style={{ textAlign: 'center', marginTop: 8 }}>
        数据为演示样例，全部由本地 Mock 生成 · 存储用量 {(sum.totalBytes / 1024 ** 4).toFixed(1)} TB
      </div>
    </div>
  );
}
