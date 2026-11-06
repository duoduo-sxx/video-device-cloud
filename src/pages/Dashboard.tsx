import { useEffect, useMemo, useState } from 'react';
import { Button, Select, Tabs, Tag } from 'antd';
import {
  AlertOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  HddOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services';
import type { Device } from '../types/models';
import { ALARM_LEVEL_COLOR, ALARM_LEVEL_LABEL, DEVICE_STATUS_LABEL } from '../constants/dict';
import { ChartPanel } from '../components/ChartPanel';
import { EChart } from '../components/EChart';
import { HealthRing, PageHeader, Panel, StatCard, StatusTag } from '../components/ui';
import { baseOption, categoryAxis, CHART_COLORS, gridBase, tooltipBase, valueAxis } from '../utils/charts';
import { generateTelemetry } from '../utils/signal';
import { fromNow } from '../utils/format';

interface Overview {
  metric: {
    online: number;
    total: number;
    calibrating: number;
    todayHours: number;
    monthCompletion: number;
    passRate: number;
    openAlarms: number;
  };
  statusDistribution: { status: string; count: number }[];
  trend: { date: string; count: number; rate: number }[];
  healthTop: Device[];
  healthBottom: Device[];
  alarms: {
    id: string;
    code: string;
    level: keyof typeof ALARM_LEVEL_LABEL;
    title: string;
    deviceCode: string;
    triggeredAt: string;
  }[];
  todayTasks: { id: string; code: string; title: string; owner: string; plannedStart: string; status: string }[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [rtDevice, setRtDevice] = useState('IMU-2023-0017');
  const [tick, setTick] = useState(0);

  const load = () => {
    setLoading(true);
    dashboardService.overview().then((res) => {
      setData(res as unknown as Overview);
      setLoading(false);
    });
  };

  useEffect(load, []);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(timer);
  }, []);

  const telemetry = useMemo(() => generateTelemetry({ seed: 1000 + tick, count: 60, seconds: 60 }), [tick, rtDevice]);

  const trendOption = useMemo(
    () =>
      baseOption({
        grid: { ...gridBase, right: 44 },
        legend: { data: ['标定任务数', '一次合格率'], top: 0, left: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11, color: '#5a6577' } },
        xAxis: categoryAxis(data?.trend.map((t) => t.date) ?? []),
        yAxis: [valueAxis('任务数', { minInterval: 1 }), valueAxis('合格率 (%)', { min: 80, max: 100, splitLine: { show: false } })],
        series: [
          {
            name: '标定任务数',
            type: 'bar',
            barWidth: 10,
            itemStyle: { color: '#b5d4f4', borderRadius: [2, 2, 0, 0] },
            data: data?.trend.map((t) => t.count) ?? [],
          },
          {
            name: '一次合格率',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            symbol: 'none',
            lineStyle: { width: 2, color: '#1668dc' },
            data: data?.trend.map((t) => t.rate) ?? [],
          },
        ],
      }),
    [data],
  );

  const donutOption = useMemo(() => {
    const colors: Record<string, string> = {
      IN_USE: '#16a34a',
      IDLE: '#8c8c8c',
      CALIBRATING: '#1677ff',
      REPAIRING: '#722ed1',
      RETIRED: '#c3ccda',
    };
    return baseOption({
      tooltip: { ...tooltipBase, trigger: 'item', formatter: '{b}：{c} 台（{d}%）' },
      legend: { orient: 'vertical', right: 0, top: 'middle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11, color: '#5a6577' } },
      series: [
        {
          type: 'pie',
          radius: ['58%', '78%'],
          center: ['36%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          data:
            data?.statusDistribution.map((s) => ({
              value: s.count,
              name: DEVICE_STATUS_LABEL[s.status as keyof typeof DEVICE_STATUS_LABEL],
              itemStyle: { color: colors[s.status] },
            })) ?? [],
        },
      ],
      graphic: [
        {
          type: 'text',
          left: '29%',
          top: '43%',
          style: { text: `${data?.metric.total ?? 0}`, fontSize: 22, fontWeight: 600, fill: '#1f2733' },
        },
        { type: 'text', left: '29%', top: '57%', style: { text: '在册设备', fontSize: 11, fill: '#8a94a6' } },
      ],
    });
  }, [data]);

  const rtOption = useMemo(
    () =>
      baseOption({
        grid: { left: 46, right: 16, top: 26, bottom: 24 },
        tooltip: { ...tooltipBase, trigger: 'axis', valueFormatter: (v: unknown) => `${Number(v).toFixed(3)} °/s` },
        legend: { data: ['Gx', 'Gy', 'Gz'], top: 0, left: 0, itemWidth: 10, itemHeight: 8, textStyle: { fontSize: 11 } },
        xAxis: { type: 'category', boundaryGap: false, data: telemetry.t.map((t) => t.toFixed(0)), axisLabel: { show: false }, axisLine: { lineStyle: { color: '#dfe5ee' } }, axisTick: { show: false } },
        yAxis: valueAxis('°/s', { scale: true }),
        series: (['gx', 'gy', 'gz'] as const).map((key, index) => ({
          name: key.toUpperCase(),
          type: 'line' as const,
          showSymbol: false,
          lineStyle: { width: 1.4, color: CHART_COLORS[index] },
          data: telemetry[key],
        })),
      }),
    [telemetry],
  );

  return (
    <div className="page">
      <PageHeader
        title="总览驾驶舱"
        description="数据截至 2026-10-19 10:27，指标按 30 天滚动窗口统计"
        extra={
          <>
            <Tag color="processing" bordered={false}>实时刷新中</Tag>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(176px, 1fr))', gap: 12 }}>
        <StatCard
          label="在线设备"
          value={`${data?.metric.online ?? '—'}`}
          unit={`/ ${data?.metric.total ?? '—'} 台`}
          delta={2.4}
          spark={[24, 26, 25, 28, 30, 29, 31, 30, 32, 32]}
          hint="在线率 66.7%"
          onClick={() => navigate('/devices?status=IN_USE')}
        />
        <StatCard
          label="校准中"
          value={data?.metric.calibrating ?? '—'}
          unit="台"
          hint="占用转台与温箱 5 台位"
          color="#1677ff"
          spark={[3, 4, 3, 5, 4, 5, 5, 4, 5, 5]}
          onClick={() => navigate('/devices?status=CALIBRATING')}
        />
        <StatCard
          label="今日采集时长"
          value={data?.metric.todayHours ?? '—'}
          unit="h"
          delta={8.1}
          spark={[12, 14, 13, 16, 15, 17, 18, 17, 18, 18.6]}
          onClick={() => navigate('/acquisition')}
        />
        <StatCard
          label="本月标定完成率"
          value={data?.metric.monthCompletion ?? '—'}
          unit="%"
          delta={-1.6}
          spark={[78, 80, 82, 81, 84, 85, 84, 86, 85, 86]}
          onClick={() => navigate('/calibration')}
        />
        <StatCard
          label="一次合格率"
          value={data?.metric.passRate ?? '—'}
          unit="%"
          delta={1.2}
          color="#16a34a"
          spark={[90, 91, 92, 91, 93, 92, 94, 93, 94, 93.5]}
          onClick={() => navigate('/calibration')}
        />
        <StatCard
          label="未闭环告警"
          value={data?.metric.openAlarms ?? '—'}
          unit="条"
          delta={-12.5}
          color="#f5222d"
          hint="含 2 条紧急告警"
          spark={[14, 13, 15, 12, 11, 12, 10, 9, 8, 7]}
          onClick={() => navigate('/alarms')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <ChartPanel title="标定任务趋势" sub="近 30 天" option={trendOption} height={268} loading={loading} filename="标定任务趋势" unitHint="柱：任务数 / 线：合格率" />
        <ChartPanel title="设备状态分布" sub="按状态统计" option={donutOption} height={268} loading={loading} filename="设备状态分布" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr 1fr', gap: 16 }}>
        <Panel
          title="实时指标流"
          sub="2 秒刷新 · 60 点滚动"
          extra={
            <>
              <Select
                size="small"
                value={rtDevice}
                style={{ width: 158 }}
                onChange={setRtDevice}
                options={[
                  { value: 'IMU-2023-0017', label: 'IMU-2023-0017' },
                  { value: 'IMU-2024-0042', label: 'IMU-2024-0042' },
                  { value: 'INS-2025-0003', label: 'INS-2025-0003' },
                ]}
              />
              <Button size="small" type="link" onClick={() => navigate('/acquisition')}>进入采集</Button>
            </>
          }
        >
          <div className="metric-row" style={{ marginBottom: 8 }}>
            <div className="metric-mini">
              <div className="label">Gx 当前值</div>
              <div className="value">{telemetry.gx[telemetry.gx.length - 1].toFixed(3)}<span className="stat-unit">°/s</span></div>
            </div>
            <div className="metric-mini">
              <div className="label">合角速度</div>
              <div className="value">
                {Math.hypot(
                  telemetry.gx[telemetry.gx.length - 1],
                  telemetry.gy[telemetry.gy.length - 1],
                  telemetry.gz[telemetry.gz.length - 1],
                ).toFixed(3)}
                <span className="stat-unit">°/s</span>
              </div>
            </div>
            <div className="metric-mini">
              <div className="label">器件温度</div>
              <div className="value">{telemetry.temp[telemetry.temp.length - 1].toFixed(1)}<span className="stat-unit">℃</span></div>
            </div>
          </div>
          <EChart option={rtOption} height={184} />
        </Panel>

        <Panel
          title="待处理告警"
          sub={`${data?.alarms.length ?? 0} 条`}
          extra={<Button size="small" type="link" onClick={() => navigate('/alarms')}>全部</Button>}
        >
          <div>
            {data?.alarms.slice(0, 6).map((alarm) => (
              <div className="alarm-row" key={alarm.id} onClick={() => navigate('/alarms')}>
                <span className="alarm-bar" style={{ background: ALARM_LEVEL_COLOR[alarm.level] }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ color: ALARM_LEVEL_COLOR[alarm.level], fontSize: 11 }}>{ALARM_LEVEL_LABEL[alarm.level]}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alarm.title}</span>
                  </div>
                  <div className="small muted" style={{ marginTop: 2 }}>
                    {alarm.deviceCode} · {fromNow(alarm.triggeredAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="健康度排行" sub="综合评分">
          <Tabs
            size="small"
            items={[
              {
                key: 'low',
                label: '需关注',
                children: (
                  <div>
                    {data?.healthBottom.map((device) => (
                      <div
                        key={device.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', cursor: 'pointer' }}
                        onClick={() => navigate(`/devices/${device.id}`)}
                      >
                        <HealthRing score={device.healthScore} size={38} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13 }}>{device.code}</div>
                          <div className="small muted">{device.model}</div>
                        </div>
                        <Tag bordered={false} color={device.healthScore < 60 ? 'error' : 'warning'} style={{ marginInlineEnd: 0 }}>
                          {device.healthScore < 60 ? '故障' : '预警'}
                        </Tag>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: 'high',
                label: '状态良好',
                children: (
                  <div>
                    {data?.healthTop.map((device) => (
                      <div
                        key={device.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', cursor: 'pointer' }}
                        onClick={() => navigate(`/devices/${device.id}`)}
                      >
                        <HealthRing score={device.healthScore} size={38} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13 }}>{device.code}</div>
                          <div className="small muted">{device.model}</div>
                        </div>
                        <StatusTag text="优良" color="success" />
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 16 }}>
        <Panel title="今日任务" sub="按计划开始时间排序" extra={<Button size="small" type="link" onClick={() => navigate('/tasks')}>任务看板</Button>}>
          <div>
            {data?.todayTasks.map((task) => (
              <div key={task.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px dashed #eef2f7', alignItems: 'center' }}>
                <div style={{ width: 4, height: 28, borderRadius: 2, background: task.status === 'DOING' ? '#1677ff' : '#d9d9d9' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>{task.title}</div>
                  <div className="small muted">{task.code} · {task.owner}</div>
                </div>
                <span className="small muted">{task.plannedStart.slice(5, 16)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="快捷入口">
          <div className="quick-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="quick-item" onClick={() => navigate('/acquisition')}>
              <span className="quick-icon"><ThunderboltOutlined /></span>
              <div><div>开始采集</div><div className="small muted">实时波形监控</div></div>
            </div>
            <div className="quick-item" onClick={() => navigate('/calibration')}>
              <span className="quick-icon"><ExperimentOutlined /></span>
              <div><div>新建标定</div><div className="small muted">六位置 / 速率法</div></div>
            </div>
            <div className="quick-item" onClick={() => navigate('/reports')}>
              <span className="quick-icon"><FileTextOutlined /></span>
              <div><div>生成报告</div><div className="small muted">标定 / 性能报告</div></div>
            </div>
            <div className="quick-item" onClick={() => navigate('/devices')}>
              <span className="quick-icon"><HddOutlined /></span>
              <div><div>设备台账</div><div className="small muted">48 台在册</div></div>
            </div>
            <div className="quick-item" onClick={() => navigate('/alarms')}>
              <span className="quick-icon" style={{ background: '#fff1f0', color: '#f5222d' }}><AlertOutlined /></span>
              <div><div>告警处置</div><div className="small muted">12 条未闭环</div></div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
