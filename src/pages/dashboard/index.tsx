import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Progress, Segmented, Tag } from 'antd';
import { ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard';
import EChart from '../../charts/EChart';
import { PageHeader as Header, StatusTag } from '../../components/base';
import { useDataStore } from '../../store/dataStore';
import { throughputSeries, sparkSeries, LINKS } from '../../mock/seed';
import { ALERT_LEVEL, JOB_STATUS } from '../../constants/dict';
import { fmtBytes, fmtSpeed, relTime } from '../../utils/format';

export default function Dashboard() {
  const navigate = useNavigate();
  const jobs = useDataStore((s) => s.jobs);
  const alerts = useDataStore((s) => s.alerts);

  const points = useMemo(() => throughputSeries(), []);
  const running = jobs.filter((j) => j.status === 'running').slice(0, 5);
  const firing = alerts.filter((a) => a.status === 'firing').slice(0, 5);

  const statusCount = useMemo(() => {
    const map: Record<string, number> = {};
    jobs.forEach((j) => {
      map[j.status] = (map[j.status] ?? 0) + 1;
    });
    return map;
  }, [jobs]);

  const throughputOption = {
    grid: { left: 4, right: 8, top: 34, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { right: 0, top: 0, data: ['上传', '下载'] },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: points.map((p) => p.time),
      axisLabel: { interval: 47 },
    },
    yAxis: { type: 'value', name: 'MB/s', nameTextStyle: { fontSize: 11 }, splitLine: { show: true } },
    series: [
      {
        name: '上传',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: points.map((p) => p.up),
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37,99,235,0.28)' },
              { offset: 1, color: 'rgba(37,99,235,0.01)' },
            ],
          },
        },
      },
      {
        name: '下载',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: points.map((p) => p.down),
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(6,182,212,0.24)' },
              { offset: 1, color: 'rgba(6,182,212,0.01)' },
            ],
          },
        },
      },
    ],
  };

  const donutOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} 个 ({d}%)' },
    legend: { orient: 'vertical', right: 0, top: 'middle', itemGap: 12 },
    title: {
      text: String(jobs.length),
      subtext: '当前任务',
      left: '34%',
      top: '40%',
      textAlign: 'center',
      textStyle: { fontSize: 26, fontWeight: 600 },
      subtextStyle: { fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['58%', '80%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: { borderWidth: 3, borderColor: 'transparent', borderRadius: 4 },
        data: Object.entries(statusCount).map(([k, v]) => ({
          name: JOB_STATUS[k as keyof typeof JOB_STATUS].label,
          value: v,
          itemStyle: { color: JOB_STATUS[k as keyof typeof JOB_STATUS].color },
        })),
      },
    ],
  };

  const topLinks = useMemo(() => [...LINKS].filter((l) => l.status !== 'down').sort((a, b) => b.utilizationPct - a.utilizationPct).slice(0, 5), []);

  const linkOption = {
    grid: { left: 4, right: 40, top: 8, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'value', splitLine: { show: true }, axisLabel: { formatter: '{value} Gbps' } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: topLinks.map((l) => l.name),
      axisLabel: { fontSize: 11, width: 120, overflow: 'truncate' },
    },
    series: [
      {
        type: 'bar',
        data: topLinks.map((l) => Number((l.availableBandwidthMbps * (l.utilizationPct / 100) / 1000).toFixed(2))),
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#2563EB' },
              { offset: 1, color: '#06B6D4' },
            ],
          },
        },
        label: { show: true, position: 'right', fontSize: 11, formatter: '{c} Gbps' },
      },
    ],
  };

  return (
    <div>
      <Header
        title="总览驾驶舱"
        desc="全平台传输态势、优化收益与异常事件一览"
        actions={
          <>
            <Segmented options={['今日', '近 7 天', '近 30 天']} defaultValue="今日" />
            <Button icon={<ReloadOutlined />}>刷新</Button>
            <span
              className="chip"
              style={{ borderColor: '#8B5CF633', background: '#8B5CF614', color: '#8B5CF6', height: 32, padding: '0 10px', cursor: 'pointer' }}
              title="当前生效策略 6 条，今日累计提速 23.8%"
            >
              <ThunderboltOutlined style={{ marginRight: 6 }} />
              优化引擎运行中
            </span>
          </>
        }
      />

      <div className="grid grid-6" style={{ marginBottom: 16 }}>
        <StatCard title="今日传输任务" value="1,284" unit="个" change={12.4} spark={sparkSeries(1)} />
        <StatCard title="传输数据量" value="12.86" unit="TB" change={8.2} spark={sparkSeries(2)} color="#06B6D4" />
        <StatCard title="平均传输速率" value="486.3" unit="MB/s" change={15.1} spark={sparkSeries(3)} color="#8B5CF6" />
        <StatCard title="任务成功率" value="98.6" unit="%" change={0.4} spark={sparkSeries(4)} color="#16A34A" />
        <StatCard title="平均端到端时延" value="42" unit="ms" change={-6.3} spark={sparkSeries(5)} color="#0EA5E9" invert />
        <StatCard title="节省带宽成本" value="18,420" unit="元" change={21.7} spark={sparkSeries(6)} color="#D97706" />
      </div>

      <div className="grid grid-2-1" style={{ marginBottom: 16 }}>
        <ChartCard
          title="实时吞吐趋势"
          desc="近 24 小时 · 5 分钟粒度"
          extra={<span className="muted">10 秒前更新</span>}
        >
          <EChart option={throughputOption} height={300} />
        </ChartCard>
        <ChartCard title="任务状态分布" desc="按当前任务状态统计">
          <EChart option={donutOption} height={300} />
        </ChartCard>
      </div>

      <div className="grid grid-3">
        <ChartCard title="链路吞吐 Top5" desc="按当前利用率排序">
          <EChart option={linkOption} height={260} />
        </ChartCard>

        <ChartCard
          title="最近告警"
          desc="仅显示未恢复告警"
          extra={<Button type="link" size="small" onClick={() => navigate('/alerts')}>查看全部</Button>}
        >
          <div>
            {firing.map((a) => (
              <div key={a.id} className="list-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/alerts')}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusTag label={ALERT_LEVEL[a.level].label} color={ALERT_LEVEL[a.level].color} dot={false} />
                    <span style={{ fontSize: 13 }} className="ellipsis">{a.title}</span>
                  </div>
                  <div className="muted" style={{ marginTop: 3 }}>{a.targetName}</div>
                </div>
                <span className="muted" style={{ flex: '0 0 auto' }}>{relTime(a.firedAt)}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="正在传输"
          desc="实时进度"
          extra={<Button type="link" size="small" onClick={() => navigate('/jobs')}>任务列表</Button>}
        >
          <div>
            {running.map((j) => (
              <div key={j.id} className="list-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${j.id}`)}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="ellipsis" style={{ fontSize: 13 }}>{j.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Progress percent={j.progress} size="small" showInfo={false} strokeColor="#2563EB" style={{ flex: 1, margin: 0 }} />
                    <span className="muted">{j.progress.toFixed(1)}%</span>
                  </div>
                </div>
                <div style={{ flex: '0 0 84px', textAlign: 'right' }}>
                  <div style={{ fontSize: 12 }}>{fmtSpeed(j.speedBps)}</div>
                  <div className="muted">{fmtBytes(j.transferredBytes)}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <Tag bordered={false} color="green">优化引擎今日累计提速 23.8%</Tag>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
