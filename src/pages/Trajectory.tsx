import { useEffect, useMemo, useState } from 'react';
import { Button, Select, Slider, Tag } from 'antd';
import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { deviceService } from '../services';
import type { Device } from '../types/models';
import { generateTrajectory } from '../utils/signal';
import { ChartPanel } from '../components/ChartPanel';
import { PageHeader, Panel, StatCard } from '../components/ui';
import { baseOption, categoryAxis, CHART_COLORS, gridBase, tooltipBase, valueAxis } from '../utils/charts';

function AttitudeBall({ roll, pitch, yaw }: { roll: number; pitch: number; yaw: number }) {
  const offset = Math.max(-36, Math.min(36, pitch * 2.2));
  return (
    <svg width="188" height="188" viewBox="0 0 188 188">
      <defs>
        <clipPath id="ballClip"><circle cx="94" cy="94" r="78" /></clipPath>
      </defs>
      <circle cx="94" cy="94" r="84" fill="#f7fbff" stroke="#dbe8fb" strokeWidth="1" />
      <g clipPath="url(#ballClip)" transform={`rotate(${-roll} 94 94) translate(0 ${offset})`}>
        <rect x="0" y="0" width="188" height="94" fill="#dbeafe" />
        <rect x="0" y="94" width="188" height="94" fill="#e8eef5" />
        <line x1="0" y1="94" x2="188" y2="94" stroke="#1668dc" strokeWidth="2" />
        {[-60, -40, -20, 20, 40, 60].map((deg) => (
          <g key={deg}>
            <line x1={deg % 40 === 0 ? 58 : 74} y1={94 + deg * 1.2} x2={deg % 40 === 0 ? 130 : 114} y2={94 + deg * 1.2} stroke="#93a5bd" strokeWidth="0.8" />
            <text x="136" y={94 + deg * 1.2 + 3} fontSize="8" fill="#93a5bd">{deg}</text>
          </g>
        ))}
        <line x1="94" y1="20" x2="94" y2="168" stroke="#c3ccda" strokeWidth="0.6" strokeDasharray="3 3" />
      </g>
      <circle cx="94" cy="94" r="78" fill="none" stroke="#c3ccda" strokeWidth="1.6" />
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x1 = 94 + Math.cos(angle) * 78;
        const y1 = 94 + Math.sin(angle) * 78;
        const x2 = 94 + Math.cos(angle) * 72;
        const y2 = 94 + Math.sin(angle) * 72;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8a94a6" strokeWidth="1" />;
      })}
      <g transform={`translate(94 94) rotate(${yaw})`}>
        <path d="M0 -66 L6 -52 L0 -56 L-6 -52 Z" fill="#722ed1" />
      </g>
      <text x="94" y="14" textAnchor="middle" fontSize="10" fill="#722ed1">{yaw.toFixed(0)}°</text>
      <path d="M94 94 L82 104 L94 98 L106 104 Z" fill="#f5222d" />
      <circle cx="94" cy="94" r="3" fill="#f5222d" />
    </svg>
  );
}

export default function Trajectory() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState('DEV-0001');
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(180);

  useEffect(() => {
    deviceService.all().then((list) => setDevices(list));
  }, []);

  const points = useMemo(() => generateTrajectory(20261019, 900), []);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => setPos((p) => (p >= points.length - 1 ? 0 : p + 3)), 60);
    return () => clearInterval(timer);
  }, [playing, points.length]);

  const current = points[Math.min(points.length - 1, Math.max(0, pos))];

  const pathOption = useMemo(
    () =>
      baseOption({
        grid: { ...gridBase, left: 56, right: 28, top: 30, bottom: 40 },
        tooltip: {
          ...tooltipBase,
          trigger: 'item',
          formatter: (params: unknown) => {
            const p = params as { data: { value: [number, number, number] } };
            const [east, north, alt] = p.data.value;
            return `东向 ${east.toFixed(0)} m<br/>北向 ${north.toFixed(0)} m<br/>高度 ${alt.toFixed(1)} m`;
          },
        },
        xAxis: valueAxis('东向 (m)', { scale: true, splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } } }),
        yAxis: valueAxis('北向 (m)', { scale: true, splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } } }),
        visualMap: {
          show: true,
          dimension: 2,
          min: 40,
          max: 60,
          orient: 'horizontal',
          left: 'center',
          bottom: 0,
          itemWidth: 10,
          itemHeight: 70,
          text: ['高度', ''],
          textStyle: { fontSize: 10, color: '#8a94a6' },
          inRange: { color: ['#85b7eb', '#1668dc', '#722ed1', '#f5222d'] },
        },
        series: [
          {
            type: 'line',
            data: points.map((p) => [p.east, p.north]),
            showSymbol: false,
            lineStyle: { width: 1.4, color: '#d6e4fb' },
            silent: true,
          },
          {
            type: 'scatter',
            data: points.map((p) => ({ value: [p.east, p.north, p.alt] })),
            symbolSize: 3,
            itemStyle: { opacity: 0.9 },
          },
          {
            type: 'scatter',
            data: [{ value: [points[0].east, points[0].north, points[0].alt] }],
            symbolSize: 12,
            itemStyle: { color: '#16a34a', borderColor: '#fff', borderWidth: 2 },
            label: { show: true, formatter: '起点', position: 'right', fontSize: 10, color: '#16a34a' },
          },
          {
            type: 'scatter',
            data: [{ value: [points[points.length - 1].east, points[points.length - 1].north, points[points.length - 1].alt] }],
            symbol: 'rect',
            symbolSize: 11,
            itemStyle: { color: '#f5222d', borderColor: '#fff', borderWidth: 2 },
            label: { show: true, formatter: '终点', position: 'right', fontSize: 10, color: '#f5222d' },
          },
          {
            type: 'scatter',
            data: [{ value: [current.east, current.north, current.alt] }],
            symbolSize: 10,
            itemStyle: { color: '#faad14', borderColor: '#fff', borderWidth: 2 },
          },
        ],
      }),
    [points, current],
  );

  const attitudeOption = useMemo(
    () =>
      baseOption({
        grid: { ...gridBase, left: 50, right: 20, top: 30, bottom: 28 },
        tooltip: { ...tooltipBase, trigger: 'axis', valueFormatter: (v: unknown) => `${Number(v).toFixed(2)} °` },
        legend: { data: ['横滚', '俯仰', '航向'], top: 0, left: 0, itemWidth: 10, itemHeight: 8, textStyle: { fontSize: 11 } },
        xAxis: { type: 'category', boundaryGap: false, data: points.map((p) => String(p.t)), axisLabel: { color: '#8a94a6', fontSize: 10, interval: 149 }, axisLine: { lineStyle: { color: '#dfe5ee' } }, axisTick: { show: false } },
        yAxis: valueAxis('角度 (°)', { scale: true }),
        series: [
          { name: '横滚', type: 'line', showSymbol: false, lineStyle: { width: 1.4, color: CHART_COLORS[0] }, data: points.map((p) => p.roll) },
          { name: '俯仰', type: 'line', showSymbol: false, lineStyle: { width: 1.4, color: CHART_COLORS[1] }, data: points.map((p) => p.pitch) },
          { name: '航向', type: 'line', showSymbol: false, lineStyle: { width: 1.4, color: CHART_COLORS[2] }, data: points.map((p) => p.yaw) },
          {
            type: 'line',
            data: [],
            markLine: { silent: true, symbol: 'none', lineStyle: { color: '#f5222d', width: 1.2, type: 'dashed' }, label: { show: false }, data: [{ xAxis: String(current.t) }] },
          },
        ],
      }),
    [points, current],
  );

  return (
    <div className="page">
      <PageHeader
        title="姿态与轨迹"
        description="基于惯性解算的载体姿态与轨迹可视化，支持时间轴联动回放"
        extra={
          <>
            <Select
              style={{ width: 220 }}
              value={deviceId}
              onChange={setDeviceId}
              options={devices.slice(0, 10).map((d) => ({ value: d.id, label: `${d.code} · ${d.model}` }))}
            />
            <Tag bordered={false} color="blue">轨迹点 900</Tag>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <ChartPanel title="北-东平面轨迹" sub="颜色映射高度" option={pathOption} height={400} filename="轨迹图" unitHint="起点绿 / 终点红 / 黄点为当前时刻" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="姿态球" sub={`航向 ${current.yaw.toFixed(1)}°`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <AttitudeBall roll={current.roll} pitch={current.pitch} yaw={current.yaw} />
              <div style={{ flex: 1, minWidth: 130 }}>
                <div className="metric-mini"><div className="label">横滚 ROLL</div><div className="value">{current.roll.toFixed(2)}<span className="stat-unit">°</span></div></div>
                <div className="metric-mini" style={{ marginTop: 8 }}><div className="label">俯仰 PITCH</div><div className="value">{current.pitch.toFixed(2)}<span className="stat-unit">°</span></div></div>
                <div className="metric-mini" style={{ marginTop: 8 }}><div className="label">航向 YAW</div><div className="value">{current.yaw.toFixed(2)}<span className="stat-unit">°</span></div></div>
              </div>
            </div>
          </Panel>

          <Panel title="回放控制">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Button type={playing ? 'default' : 'primary'} icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={() => setPlaying((p) => !p)}>
                {playing ? '暂停' : '播放'}
              </Button>
              <span className="small muted">t = {current.t.toFixed(1)} s</span>
            </div>
            <Slider min={0} max={points.length - 1} value={pos} onChange={setPos} tooltip={{ formatter: () => `${current.t.toFixed(1)} s` }} />
            <div className="small muted">拖动时间轴，姿态球与轨迹当前点同步更新</div>
          </Panel>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <StatCard label="当前高度" value={current.alt.toFixed(1)} unit="m" />
        <StatCard label="北向速度" value={current.vN.toFixed(2)} unit="m/s" />
        <StatCard label="东向速度" value={current.vE.toFixed(2)} unit="m/s" />
        <StatCard label="合成速度" value={Math.hypot(current.vN, current.vE).toFixed(2)} unit="m/s" />
        <StatCard label="累计里程" value={(current.north * 1.02).toFixed(0)} unit="m" />
        <StatCard label="纬度" value={current.lat.toFixed(5)} unit="°" />
        <StatCard label="经度" value={current.lon.toFixed(5)} unit="°" />
      </div>

      <ChartPanel title="姿态角时间序列" sub="横滚 / 俯仰 / 航向" option={attitudeOption} height={240} filename="姿态角曲线" unitHint="单位：°" />

      <Panel title="数据说明">
        <div className="small" style={{ lineHeight: 2, color: '#5a6577' }}>
          <div>· 轨迹由惯性解算结果推算，10 Hz 输出，共 900 点，覆盖 90 s 动态过程（静止 → 加速 → 转弯 → 减速 → 静止）。</div>
          <div>· 航向角已做 unwrap 处理，跨越 0°/360° 时曲线连续，不会出现突跳。</div>
          <div>· 高度着色范围 40 ~ 60 m，颜色越暖表示高度越高。</div>
        </div>
      </Panel>
    </div>
  );
}
