import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Descriptions, InputNumber, Modal, Select, Slider, Space, Switch, Tag, message } from 'antd';
import {
  CaretRightOutlined,
  PauseOutlined,
  SaveOutlined,
  StopOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { deviceService } from '../services';
import type { Device } from '../types/models';
import { ChartPanel } from '../components/ChartPanel';
import { PageHeader, Panel, StatCard, StatusTag } from '../components/ui';
import { baseOption, CHART_COLORS, gridBase, tooltipBase, valueAxis } from '../utils/charts';

interface Buffer {
  gx: number[];
  gy: number[];
  gz: number[];
  ax: number[];
  ay: number[];
  az: number[];
  temp: number[];
  t: number[];
}

const EMPTY: Buffer = { gx: [], gy: [], gz: [], ax: [], ay: [], az: [], temp: [], t: [] };

function AttitudeIndicator({ roll, pitch, yaw }: { roll: number; pitch: number; yaw: number }) {
  const offset = Math.max(-40, Math.min(40, pitch * 2.4));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <svg width="132" height="132" viewBox="0 0 132 132">
        <defs>
          <clipPath id="ball"><circle cx="66" cy="66" r="56" /></clipPath>
        </defs>
        <circle cx="66" cy="66" r="58" fill="#f7fbff" stroke="#dbe8fb" strokeWidth="1" />
        <g clipPath="url(#ball)" transform={`rotate(${-roll} 66 66) translate(0 ${offset})`}>
          <rect x="0" y="0" width="132" height="66" fill="#dbeafe" />
          <rect x="0" y="66" width="132" height="66" fill="#e8eef5" />
          <line x1="0" y1="66" x2="132" y2="66" stroke="#1668dc" strokeWidth="1.6" />
          {[-30, -20, -10, 10, 20, 30].map((deg) => (
            <line key={deg} x1={deg % 20 === 0 ? 42 : 52} y1={66 + deg * 1.6} x2={deg % 20 === 0 ? 90 : 80} y2={66 + deg * 1.6} stroke="#93a5bd" strokeWidth="0.7" />
          ))}
        </g>
        <circle cx="66" cy="66" r="56" fill="none" stroke="#c3ccda" strokeWidth="1.4" />
        <path d="M66 66 L56 74 L66 69 L76 74 Z" fill="#f5222d" />
        <circle cx="66" cy="66" r="2.4" fill="#f5222d" />
        <text x="66" y="16" textAnchor="middle" fontSize="10" fill="#8a94a6">{yaw.toFixed(0)}°</text>
      </svg>
      <div>
        <div className="metric-mini" style={{ minWidth: 132 }}>
          <div className="label">横滚 ROLL</div>
          <div className="value" style={{ color: '#1668dc' }}>{roll.toFixed(2)}<span className="stat-unit">°</span></div>
        </div>
        <div className="metric-mini" style={{ minWidth: 132, marginTop: 8 }}>
          <div className="label">俯仰 PITCH</div>
          <div className="value" style={{ color: '#13c2c2' }}>{pitch.toFixed(2)}<span className="stat-unit">°</span></div>
        </div>
        <div className="metric-mini" style={{ minWidth: 132, marginTop: 8 }}>
          <div className="label">航向 YAW</div>
          <div className="value" style={{ color: '#722ed1' }}>{yaw.toFixed(2)}<span className="stat-unit">°</span></div>
        </div>
      </div>
    </div>
  );
}

export default function Acquisition() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState('DEV-0001');
  const [sampleRate, setSampleRate] = useState(200);
  const [filter, setFilter] = useState('none');
  const [duration, setDuration] = useState(600);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [buffer, setBuffer] = useState<Buffer>(EMPTY);
  const [logs, setLogs] = useState<string[]>(['[10:24:02] 系统就绪，等待采集指令。']);
  const [marks, setMarks] = useState<number[]>([]);
  const [lossRate, setLossRate] = useState(0.02);
  const bufferRef = useRef<Buffer>(EMPTY);
  const simRef = useRef({ walk: 0, markov: 0, phase: 0, sample: 0 });

  useEffect(() => {
    deviceService.all().then((list) => setDevices(list));
  }, []);

  const device = devices.find((d) => d.id === deviceId);

  const appendLog = (text: string) => {
    const time = new Date();
    const stamp = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`;
    setLogs((prev) => [...prev.slice(-60), `[${stamp}] ${text}`]);
  };

  useEffect(() => {
    if (!running || paused) return undefined;
    const timer = setInterval(() => {
      const sim = simRef.current;
      sim.sample += 1;
      const next: Buffer = {
        gx: [...bufferRef.current.gx],
        gy: [...bufferRef.current.gy],
        gz: [...bufferRef.current.gz],
        ax: [...bufferRef.current.ax],
        ay: [...bufferRef.current.ay],
        az: [...bufferRef.current.az],
        temp: [...bufferRef.current.temp],
        t: [...bufferRef.current.t],
      };
      for (let i = 0; i < 5; i += 1) {
        sim.phase += 0.05;
        sim.markov = sim.markov * 0.995 + (Math.random() - 0.5) * 0.004;
        sim.walk += (Math.random() - 0.5) * 0.0006;
        const drift = 0.05 * Math.sin(sim.phase / 40) + 0.012 * Math.sin(sim.phase / 3);
        next.gx.push(0.0021 + drift + sim.markov + sim.walk + (Math.random() - 0.5) * 0.024);
        next.gy.push(-0.0014 + drift * 0.72 + sim.markov * 0.08 + (Math.random() - 0.5) * 0.022);
        next.gz.push(0.0032 + drift * 0.41 + sim.markov * -0.06 + (Math.random() - 0.5) * 0.026);
        next.ax.push(0.0042 + (Math.random() - 0.5) * 0.004);
        next.ay.push(-0.0031 + (Math.random() - 0.5) * 0.004);
        next.az.push(1 + 0.0018 + (Math.random() - 0.5) * 0.003);
        next.temp.push(23.4 + 0.8 * Math.sin(sim.phase / 600) + (Math.random() - 0.5) * 0.04);
        next.t.push(Number((sim.sample * 0.2 + i * 0.04).toFixed(2)));
      }
      if (next.gx.length > 400) {
        next.gx = next.gx.slice(-400);
        next.gy = next.gy.slice(-400);
        next.gz = next.gz.slice(-400);
        next.ax = next.ax.slice(-400);
        next.ay = next.ay.slice(-400);
        next.az = next.az.slice(-400);
        next.temp = next.temp.slice(-400);
        next.t = next.t.slice(-400);
      }
      bufferRef.current = next;
      setBuffer(next);
      setElapsed((e) => e + 1);
    }, 200);
    return () => clearInterval(timer);
  }, [running, paused]);


  const start = () => {
    simRef.current = { walk: 0, markov: 0, phase: 0, sample: 0 };
    setBuffer(EMPTY);
    setElapsed(0);
    setMarks([]);
    setRunning(true);
    setPaused(false);
    setLossRate(0.02);
    appendLog(`采集开始：${device?.code ?? deviceId}，采样率 ${sampleRate} Hz，滤波 ${filter === 'none' ? '关闭' : filter === 'butter' ? '巴特沃斯' : '滑动平均'}`);
  };

  const pause = () => {
    setPaused((p) => !p);
    appendLog(paused ? '采集继续' : '采集暂停');
  };

  const stop = () => {
    Modal.confirm({
      title: '确认停止采集？',
      content: `已采集 ${elapsed} 个数据块（约 ${(elapsed * 0.2).toFixed(1)} s），停止后将保存为数据文件。`,
      okText: '停止并保存',
      cancelText: '继续采集',
      onOk: () => {
        setRunning(false);
        setPaused(false);
        appendLog('采集结束，数据已落盘为 RAW-20261019-0121（128.4 MB）');
        message.success('已保存为数据文件 RAW-20261019-0121');
      },
    });
  };

  const mark = () => {
    setMarks((m) => [...m, elapsed]);
    appendLog(`事件打标 @ ${(elapsed * 0.2).toFixed(1)} s`);
  };

  const last = (arr: number[]) => arr[arr.length - 1] ?? 0;
  const roll = 12 * Math.sin(elapsed / 18);
  const pitch = 6 * Math.sin(elapsed / 29);
  const yaw = (elapsed * 0.9) % 360;

  const gyroOption = useMemo(
    () =>
      baseOption({
        grid: { ...gridBase, left: 46, right: 12, top: 26, bottom: 24 },
        tooltip: { ...tooltipBase, trigger: 'axis', valueFormatter: (v: unknown) => `${Number(v).toFixed(3)} °/s` },
        legend: { data: ['Gx', 'Gy', 'Gz'], top: 0, left: 0, itemWidth: 10, itemHeight: 8, textStyle: { fontSize: 11 } },
        xAxis: { type: 'category', boundaryGap: false, data: buffer.t.map((t) => t.toFixed(1)), axisLabel: { show: false }, axisLine: { lineStyle: { color: '#dfe5ee' } }, axisTick: { show: false } },
        yAxis: valueAxis('°/s', { scale: true }),
        series: (['gx', 'gy', 'gz'] as const).map((key, index) => ({
          name: key.toUpperCase(),
          type: 'line' as const,
          showSymbol: false,
          animation: false,
          lineStyle: { width: 1.2, color: CHART_COLORS[index] },
          data: buffer[key],
        })),
      }),
    [buffer],
  );

  const accOption = useMemo(
    () =>
      baseOption({
        grid: { ...gridBase, left: 46, right: 12, top: 26, bottom: 24 },
        tooltip: { ...tooltipBase, trigger: 'axis', valueFormatter: (v: unknown) => `${Number(v).toFixed(4)} g` },
        legend: { data: ['Ax', 'Ay', 'Az'], top: 0, left: 0, itemWidth: 10, itemHeight: 8, textStyle: { fontSize: 11 } },
        xAxis: { type: 'category', boundaryGap: false, data: buffer.t.map((t) => t.toFixed(1)), axisLabel: { show: false }, axisLine: { lineStyle: { color: '#dfe5ee' } }, axisTick: { show: false } },
        yAxis: valueAxis('g', { scale: true }),
        series: (['ax', 'ay', 'az'] as const).map((key, index) => ({
          name: key.toUpperCase(),
          type: 'line' as const,
          showSymbol: false,
          animation: false,
          lineStyle: { width: 1.2, color: CHART_COLORS[index + 1] },
          data: buffer[key],
        })),
      }),
    [buffer],
  );

  return (
    <div className="page">
      <PageHeader
        title="实时采集监控"
        description="惯性器件多通道实时波形、姿态解算与数据质量监测（仿真数据源）"
        extra={
          <>
            <StatusTag text={running ? (paused ? '已暂停' : '采集中') : '未开始'} color={running ? (paused ? 'warning' : 'processing') : 'default'} />
            <Tag bordered={false}>采样率 {sampleRate} Hz</Tag>
          </>
        }
      />

      <Panel>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select
            style={{ width: 230 }}
            value={deviceId}
            onChange={setDeviceId}
            disabled={running}
            options={devices.slice(0, 12).map((d) => ({ value: d.id, label: `${d.code} · ${d.model}` }))}
            showSearch
            optionFilterProp="label"
          />
          <Select
            style={{ width: 130 }}
            value={sampleRate}
            onChange={setSampleRate}
            disabled={running}
            options={[100, 200, 400].map((v) => ({ value: v, label: `${v} Hz` }))}
          />
          <Select
            style={{ width: 150 }}
            value={filter}
            onChange={setFilter}
            disabled={running}
            options={[
              { value: 'none', label: '滤波：关闭' },
              { value: 'butter', label: '滤波：巴特沃斯' },
              { value: 'moving', label: '滤波：滑动平均' },
            ]}
          />
          <Space.Compact>
            <InputNumber min={10} max={3600} value={duration} onChange={(v) => setDuration(v ?? 600)} disabled={running} style={{ width: 96 }} />
            <span style={{ padding: '0 10px', lineHeight: '32px', background: '#fafbfd', border: '1px solid #d9d9d9', borderLeft: 'none' }} className="small muted">秒</span>
          </Space.Compact>
          {!running ? (
            <Button type="primary" icon={<CaretRightOutlined />} onClick={start}>开始采集</Button>
          ) : (
            <>
              <Button icon={<PauseOutlined />} onClick={pause}>{paused ? '继续' : '暂停'}</Button>
              <Button icon={<TagOutlined />} onClick={mark}>打标</Button>
              <Button danger icon={<StopOutlined />} onClick={stop}>停止</Button>
            </>
          )}
          <div style={{ flex: 1 }} />
          <Switch size="small" defaultChecked checkedChildren="Y 轴自适应" unCheckedChildren="Y 轴固定" />
          <Button icon={<SaveOutlined />} onClick={() => message.success('当前配置已保存为采集模板')}>保存模板</Button>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <StatCard label="连接状态" value={running ? '已连接' : '待连接'} hint={running ? `切换 ${sampleRate} Hz` : '设备在线'} />
        <StatCard label="实测采样率" value={running ? (sampleRate - 0.0).toFixed(1) : '0.0'} unit="Hz" hint="标称 200 ± 0.5 Hz" />
        <StatCard label="丢包率" value={lossRate.toFixed(2)} unit="%" hint="阈值 0.1%" color="#16a34a" />
        <StatCard label="传输时延" value={running ? '12' : '—'} unit="ms" hint="链路正常" />
        <StatCard label="已采集点数" value={(elapsed * 1000).toLocaleString('zh-CN')} hint={`运行 ${Math.floor(elapsed / 5)} 分 ${elapsed % 5} 秒`} />
        <StatCard label="器件温度" value={last(buffer.temp).toFixed(1)} unit="℃" hint="温补通道 T1" />
      </div>

      <div className="wave-grid">
        <ChartPanel title="陀螺三轴角速度" sub="Gx / Gy / Gz" option={gyroOption} height={230} filename="陀螺波形" unitHint="单位：°/s" empty={!running} />
        <ChartPanel title="加速度三轴" sub="Ax / Ay / Az" option={accOption} height={230} filename="加速度波形" unitHint="单位：g" empty={!running} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.1fr', gap: 16 }}>
        <Panel title="实时姿态" sub="Z-Y-X 旋转顺序">
          <AttitudeIndicator roll={roll} pitch={pitch} yaw={yaw} />
        </Panel>

        <Panel title="实时指标" sub="最近一次采样">
          <div className="metric-row">
            <div className="metric-mini"><div className="label">Gx</div><div className="value">{last(buffer.gx).toFixed(3)}</div></div>
            <div className="metric-mini"><div className="label">Gy</div><div className="value">{last(buffer.gy).toFixed(3)}</div></div>
            <div className="metric-mini"><div className="label">Gz</div><div className="value">{last(buffer.gz).toFixed(3)}</div></div>
            <div className="metric-mini"><div className="label">Ax (g)</div><div className="value">{last(buffer.ax).toFixed(4)}</div></div>
            <div className="metric-mini"><div className="label">Ay (g)</div><div className="value">{last(buffer.ay).toFixed(4)}</div></div>
            <div className="metric-mini"><div className="label">Az (g)</div><div className="value">{last(buffer.az).toFixed(4)}</div></div>
            <div className="metric-mini"><div className="label">合角速度 (°/s)</div><div className="value">{Math.hypot(last(buffer.gx), last(buffer.gy), last(buffer.gz)).toFixed(3)}</div></div>
            <div className="metric-mini"><div className="label">模值 (g)</div><div className="value">{Math.hypot(last(buffer.ax), last(buffer.ay), last(buffer.az)).toFixed(4)}</div></div>
            <div className="metric-mini"><div className="label">零偏估计 (°/h)</div><div className="value">{(last(buffer.gx) * 3600).toFixed(2)}</div></div>
          </div>
        </Panel>

        <Panel title="数据质量" sub="实时判据">
          <table className="spec-table">
            <tbody>
              <tr><th>饱和计数</th><td className="value">0</td><td><StatusTag text="正常" color="success" /></td></tr>
              <tr><th>跳变次数</th><td className="value">2</td><td><StatusTag text="正常" color="success" /></td></tr>
              <tr><th>缺失点</th><td className="value">0</td><td><StatusTag text="正常" color="success" /></td></tr>
              <tr><th>噪声 RMS</th><td className="value">0.0142 °/s</td><td><StatusTag text="正常" color="success" /></td></tr>
              <tr><th>事件标记</th><td className="value">{marks.length} 个</td><td><span className="small muted">最近：{(marks[marks.length - 1] ?? 0) * 0.2}s</span></td></tr>
            </tbody>
          </table>
          <div style={{ marginTop: 8 }}>
            <Slider
              min={0}
              max={100}
              value={(elapsed * 0.2 * 100) / duration}
              tooltip={{ formatter: () => `${(elapsed * 0.2).toFixed(1)} s / ${duration} s` }}
              disabled
            />
          </div>
        </Panel>
      </div>

      <Panel title="采集日志" sub="最近 60 条" extra={<span className="small muted">自动滚动</span>}>
        <div style={{ height: 132, overflow: 'auto', background: '#0e1b2c', borderRadius: 6, padding: '10px 14px', fontSize: 12, lineHeight: 1.9, color: '#9fb2c9', fontFamily: 'Menlo, monospace' }}>
          {logs.map((log, index) => (
            <div key={`${log}-${index}`} style={{ color: log.includes('打标') ? '#fadb14' : log.includes('暂停') ? '#fa8c16' : '#9fb2c9' }}>{log}</div>
          ))}
        </div>
      </Panel>

      <Panel title="采集配置摘要">
        <Descriptions size="small" column={3} bordered>
          <Descriptions.Item label="设备">{device ? `${device.code}（${device.model}）` : '—'}</Descriptions.Item>
          <Descriptions.Item label="通道数">{device?.channels.length ?? 0} 路</Descriptions.Item>
          <Descriptions.Item label="量程">±{device?.specs.gyroRange ?? 300} °/s / ±{device?.specs.accRange ?? 10} g</Descriptions.Item>
          <Descriptions.Item label="采样率">{sampleRate} Hz</Descriptions.Item>
          <Descriptions.Item label="滤波方式">{filter === 'none' ? '关闭' : filter === 'butter' ? '巴特沃斯（截止 80 Hz）' : '滑动平均（窗口 8）'}</Descriptions.Item>
          <Descriptions.Item label="计划时长">{duration} s</Descriptions.Item>
        </Descriptions>
      </Panel>
    </div>
  );
}
