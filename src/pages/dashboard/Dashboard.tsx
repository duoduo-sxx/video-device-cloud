import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Drawer, Progress, Segmented, Tag } from 'antd';
import {
  AlertOutlined,
  ArrowRightOutlined,
  CloudDownloadOutlined,
  DollarOutlined,
  ReloadOutlined,
  RocketOutlined,
  SwapOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard';
import StatusTag from '../../components/StatusTag';
import { CHANNELS, REGIONS } from '../../mock/base';
import { TASKS, TASK_STATUS_META } from '../../mock/tasks';
import { ALERTS } from '../../mock/ops';
import { genSpark, genTrend } from '../../mock/charts';
import { axisLabelStyle, chartTooltip, legendStyle, splitLineStyle } from '../../theme/chart';
import { formatRelative, formatSpeed } from '../../utils/format';
import { toast } from '../../utils/feedback';
import { useAuthStore } from '../../store/useAuthStore';

type Range = '24h' | '7d' | '30d';

const SUGGESTIONS = [
  {
    title: 'CH-03 丢包率 2.1%，建议切换至 CH-05',
    desc: '深圳边缘回传任务近 1 小时重传 14 次，切换后预计提速 24%，影响 4 个进行中任务。',
    impact: '预计节省 38 分钟',
  },
  {
    title: '3 个任务的压缩策略可升级为 zstd',
    desc: '当前使用 lz4 的 3 个归档任务文本占比超过 70%，切换 zstd 可再压缩 18% 流量。',
    impact: '预计节省流量 412 GB',
  },
  {
    title: '法兰克福归档任务建议改为夜间执行',
    desc: '跨境链路在 09:00-12:00 处于拥塞状态，调整到 02:00 执行可避开峰值。',
    impact: '预计提速 2.1x',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { name } = useAuthStore();
  const [range, setRange] = useState<Range>('24h');
  const [loading, setLoading] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  const trend = useMemo(() => genTrend(range), [range]);
  const running = useMemo(() => TASKS.filter((t) => t.status === 'running').slice(0, 5), []);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    TASKS.forEach((t) => {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    });
    const total = TASKS.length;
    return Object.entries(counts).map(([key, value]) => ({
      name: TASK_STATUS_META[key as keyof typeof TASK_STATUS_META].label,
      value: Math.round((value / total) * 328),
      raw: value,
      color: TASK_STATUS_META[key as keyof typeof TASK_STATUS_META].badge,
    }));
  }, []);

  const topChannels = useMemo(
    () =>
      [...CHANNELS]
        .sort((a, b) => b.usedMbps - a.usedMbps)
        .slice(0, 5)
        .reverse(),
    [],
  );

  const hour = new Date().getHours();
  const greeting = hour < 6 ? '凌晨好' : hour < 12 ? '上午好' : hour < 14 ? '午间好' : hour < 19 ? '下午好' : '晚上好';

  const trendOption = {
    grid: { left: 6, right: 8, top: 34, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis' as const, ...chartTooltip },
    legend: { ...legendStyle, right: 0, top: 0 },
    xAxis: {
      type: 'category' as const,
      data: trend.labels,
      boundaryGap: false,
      axisLabel: axisLabelStyle,
      axisLine: { lineStyle: { color: '#E9EEF6' } },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value' as const,
        name: 'TB',
        nameTextStyle: { color: '#8A99B0', fontSize: 11 },
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
        axisLine: { show: false },
        axisTick: { show: false },
      },
      {
        type: 'value' as const,
        name: '%',
        min: 96,
        max: 100,
        nameTextStyle: { color: '#8A99B0', fontSize: 11 },
        axisLabel: axisLabelStyle,
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
      },
    ],
    series: [
      {
        name: '传输量',
        type: 'line' as const,
        smooth: true,
        symbol: 'none',
        data: trend.volume,
        lineStyle: { width: 2, color: '#1668FF' },
        areaStyle: { color: 'rgba(22,104,255,0.10)' },
        itemStyle: { color: '#1668FF' },
      },
      {
        name: '成功率',
        type: 'line' as const,
        smooth: true,
        symbol: 'none',
        yAxisIndex: 1,
        data: trend.rate,
        lineStyle: { width: 1.6, color: '#00B894', type: 'dashed' as const },
        itemStyle: { color: '#00B894' },
      },
    ],
  };

  const donutOption = {
    tooltip: { trigger: 'item' as const, ...chartTooltip, formatter: '{b}: {c} 个 ({d}%)' },
    legend: {
      ...legendStyle,
      bottom: 0,
      left: 'center',
      itemGap: 14,
    },
    title: {
      text: '328',
      subtext: '任务总数',
      left: 'center',
      top: '33%',
      textStyle: { fontSize: 26, fontWeight: 700, color: '#0F172A' },
      subtextStyle: { fontSize: 11, color: '#8A99B0' },
    },
    series: [
      {
        type: 'pie' as const,
        radius: ['58%', '76%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        label: { show: false },
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        data: statusData.map((s) => ({ name: s.name, value: s.value, itemStyle: { color: s.color } })),
      },
    ],
  };

  const barOption = {
    grid: { left: 4, right: 52, top: 8, bottom: 4, containLabel: true },
    tooltip: { trigger: 'axis' as const, ...chartTooltip, axisPointer: { type: 'shadow' as const } },
    xAxis: {
      type: 'value' as const,
      axisLabel: { ...axisLabelStyle, formatter: '{value} Mbps' },
      splitLine: splitLineStyle,
      axisLine: { show: false },
    },
    yAxis: {
      type: 'category' as const,
      data: topChannels.map((c) => c.name.replace(/[（(].*?[)）]/g, '')),
      axisLabel: { ...axisLabelStyle, width: 132, overflow: 'truncate' as const },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar' as const,
        data: topChannels.map((c) => c.usedMbps),
        barWidth: 12,
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: '#1668FF',
        },
        label: {
          show: true,
          position: 'right' as const,
          color: '#5A6B87',
          fontSize: 11,
          formatter: '{c}',
        },
      },
    ],
  };

  const refresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setTick((t) => t + 1);
      toast.success('数据已刷新');
    }, 900);
  };

  return (
    <div className="page">
      <PageHeader
        title={`${greeting}，${name}`}
        description={`数据更新于 ${new Date().toLocaleTimeString('zh-CN', { hour12: false })} · 当前共 ${TASKS.length} 个传输任务，${CHANNELS.length} 条数据通道`}
        extra={
          <>
            <Segmented
              value={range}
              onChange={(v) => setRange(v as Range)}
              options={[
                { label: '近 24 小时', value: '24h' },
                { label: '近 7 天', value: '7d' },
                { label: '近 30 天', value: '30d' },
              ]}
            />
            <Button icon={<ReloadOutlined spin={loading} />} onClick={refresh}>
              刷新
            </Button>
          </>
        }
      />

      <div className="grid grid-6" style={{ marginBottom: 16 }}>
        <StatCard
          title="今日传输量"
          value="8.42"
          unit="TB"
          delta={12.3}
          icon={<CloudDownloadOutlined />}
          spark={genSpark(11, 12, 60)}
        />
        <StatCard
          title="任务成功率"
          value="99.2"
          unit="%"
          delta={0.4}
          icon={<RocketOutlined />}
          iconColor="#00B894"
          iconBg="#E6F8F3"
          spark={genSpark(22, 12, 50)}
        />
        <StatCard
          title="平均传输速率"
          value="486"
          unit="MB/s"
          delta={-3.1}
          icon={<ThunderboltOutlined />}
          iconColor="#7C5CFF"
          iconBg="#F1EEFF"
          spark={genSpark(33, 12, 44)}
        />
        <StatCard
          title="本月节省成本"
          value="12,480"
          unit="元"
          delta={18.6}
          icon={<DollarOutlined />}
          iconColor="#F59E0B"
          iconBg="#FFF6E6"
          spark={genSpark(44, 12, 56)}
        />
        <StatCard
          title="进行中任务"
          value="23"
          unit="个"
          deltaLabel="其中 1 个异常"
          icon={<SwapOutlined />}
          iconColor="#0EA5E9"
          iconBg="#E8F6FD"
        />
        <StatCard
          title="待处理告警"
          value="5"
          unit="条"
          deltaLabel="严重 1 · 警告 3"
          goodDirection="down"
          icon={<AlertOutlined />}
          iconColor="#EF4444"
          iconBg="#FDECEC"
        />
      </div>

      <div className="grid grid-main" style={{ marginBottom: 16 }}>
        <ChartCard
          title="传输量与成功率趋势"
          sub={`近 ${range === '24h' ? '24 小时' : range === '7d' ? '7 天' : '30 天'}`}
          option={trendOption}
          height={300}
        />
        <ChartCard title="任务状态分布" sub="点击查看明细" option={donutOption} height={300} />
      </div>

      <div className="grid grid-main" style={{ marginBottom: 16 }}>
        <ChartCard title="Top 5 通道流量" sub="单位 Mbps" option={barOption} height={244} />
        <div className="panel">
          <div className="panel-head" style={{ marginBottom: 12 }}>
            <div className="panel-title">
              本月优化收益
              <span className="panel-sub">由压缩与去重贡献</span>
            </div>
            <Tag color="success" style={{ marginInlineEnd: 0 }}>
              较上月 +18.6%
            </Tag>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="estimate-num">3.6</span>
            <span style={{ fontSize: 13, color: '#5A6B87' }}>TB 流量被节省</span>
          </div>
          <div style={{ marginTop: 18 }}>
            {[
              { label: '压缩节省', value: 68, text: '2.45 TB', color: '#1668FF' },
              { label: '去重命中', value: 27, text: '0.97 TB', color: '#00B894' },
              { label: '秒传跳过', value: 5, text: '0.18 TB', color: '#7C5CFF' },
            ].map((row) => (
              <div key={row.label} style={{ marginBottom: 14 }}>
                <div className="flex-between" style={{ fontSize: 12, color: '#5A6B87' }}>
                  <span>{row.label}</span>
                  <span className="num">{row.text}</span>
                </div>
                <div className="compare-bar">
                  <i style={{ width: `${row.value}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: '#8A99B0', lineHeight: 1.7 }}>
            本月共节省带宽成本 <b style={{ color: '#0F172A' }}>¥12,480</b>，等效减少 3 个专线扩容需求。
          </div>
        </div>
      </div>

      <div className="grid grid-main">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">
              实时任务
              <span className="panel-sub">每 5 秒刷新</span>
            </div>
            <span className="link" style={{ fontSize: 12.5 }} onClick={() => navigate('/tasks')}>
              全部任务 <ArrowRightOutlined style={{ fontSize: 10 }} />
            </span>
          </div>
          {running.map((task, idx) => {
            const progress = Math.min(97, task.progress + (tick % 20) * 0.6 + idx * 0.4);
            return (
              <div key={task.id} className="task-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="task-row-name" title={task.name}>
                    {task.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#8A99B0', marginTop: 3 }}>
                    {task.id} · {task.channelName}
                  </div>
                </div>
                <div style={{ width: 150 }}>
                  <Progress
                    percent={Number(progress.toFixed(1))}
                    size="small"
                    strokeColor="#1668FF"
                    trailColor="#EEF2F8"
                    format={(p) => <span style={{ fontSize: 11, color: '#5A6B87' }}>{p}%</span>}
                  />
                </div>
                <div style={{ width: 78, textAlign: 'right', fontSize: 12, color: '#0F172A' }} className="num">
                  {formatSpeed(task.speedBps)}
                </div>
                <StatusTag status={task.status} />
              </div>
            );
          })}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">
              最新告警
              <span className="panel-sub">近 24 小时</span>
            </div>
            <span className="link" style={{ fontSize: 12.5 }} onClick={() => navigate('/alerts')}>
              告警中心 <ArrowRightOutlined style={{ fontSize: 10 }} />
            </span>
          </div>
          {ALERTS.slice(0, 4).map((alert) => (
            <div key={alert.id} className="alert-item" onClick={() => navigate('/alerts')}>
              <span
                className="dot"
                style={{
                  marginTop: 6,
                  background: alert.level === 'critical' ? '#EF4444' : alert.level === 'warning' ? '#F59E0B' : '#1668FF',
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div className="alert-title">{alert.title}</div>
                <div className="alert-meta">
                  {alert.target} · {formatRelative(alert.triggeredAt)}
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: '10px 12px', background: '#F7F9FD', borderRadius: 8, fontSize: 12, color: '#5A6B87' }}>
            本周告警总量较上周下降 <b style={{ color: '#00B894' }}>18%</b>，跨境链路仍是主要来源。
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }} className="panel">
        <div className="panel-head" style={{ marginBottom: 8 }}>
          <div className="panel-title">
            区域流量分布
            <span className="panel-sub">华东1 仍为主要出入口</span>
          </div>
        </div>
        <div className="grid grid-4" style={{ gap: 12 }}>
          {REGIONS.map((r, i) => {
            const value = [128.4, 82.1, 56.8, 24.6, 28.2, 13.0][i];
            const max = 128.4;
            return (
              <div key={r.key}>
                <div className="flex-between" style={{ fontSize: 12, color: '#5A6B87', marginBottom: 6 }}>
                  <span>{r.name}</span>
                  <span className="num">{value} TB</span>
                </div>
                <div className="compare-bar" style={{ marginTop: 0 }}>
                  <i style={{ width: `${(value / max) * 100}%`, background: i === 0 ? '#1668FF' : '#B9D0FF' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="suggestion-fab" title="优化建议" onClick={() => setSuggestOpen(true)}>
        <ThunderboltOutlined />
      </button>

      <Drawer title="智能优化建议" open={suggestOpen} onClose={() => setSuggestOpen(false)} width={420}>
        <div style={{ fontSize: 12.5, color: '#8A99B0', marginBottom: 16, lineHeight: 1.7 }}>
          基于近 24 小时的通道质量、任务特征与策略参数生成，每条建议都可直接落地为一次配置变更。
        </div>
        {SUGGESTIONS.map((s) => (
          <div
            key={s.title}
            style={{ border: '1px solid #E9EEF6', borderRadius: 10, padding: 16, marginBottom: 12 }}
          >
            <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6 }}>{s.title}</div>
            <div style={{ fontSize: 12, color: '#7B8AA3', marginTop: 6, lineHeight: 1.7 }}>{s.desc}</div>
            <div className="flex-between" style={{ marginTop: 12 }}>
              <Tag color="success" style={{ marginInlineEnd: 0, fontSize: 11 }}>
                {s.impact}
              </Tag>
              <span className="link" style={{ fontSize: 12 }} onClick={() => toast.success('建议已加入待办')}>
                应用建议
              </span>
            </div>
          </div>
        ))}
        <Button block onClick={() => setSuggestOpen(false)}>
          稍后处理
        </Button>
      </Drawer>
    </div>
  );
}
