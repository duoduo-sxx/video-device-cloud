import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal, Progress, Steps, Tag, message } from 'antd';
import { ArrowLeftOutlined, CaretRightOutlined, PauseOutlined, ReloadOutlined, StepForwardOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { calibrationService, planService } from '../services';
import type { CalibrationPlan, CalibrationTask } from '../types/models';
import { CALIB_STATUS_COLOR, CALIB_STATUS_LABEL } from '../constants/dict';
import { ChartPanel } from '../components/ChartPanel';
import { PageHeader, Panel, StatusTag } from '../components/ui';
import { baseOption, gridBase, tooltipBase, valueAxis } from '../utils/charts';

export default function CalibrationWizard() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<CalibrationTask | null>(null);
  const [plan, setPlan] = useState<CalibrationPlan | null>(null);
  const [positions, setPositions] = useState<CalibrationTask['positions']>([]);
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [solving, setSolving] = useState(false);
  const [series, setSeries] = useState<number[]>([]);
  const indexRef = useRef(0);

  useEffect(() => {
    calibrationService.detail(id).then(async (res) => {
      if (!res) return;
      setTask(res);
      setPositions(res.positions);
      const current = res.positions.findIndex((p) => p.status === 'RUNNING');
      const solved = res.positions.filter((p) => p.status === 'DONE').length;
      const idx = current >= 0 ? current : solved;
      setIndex(idx);
      indexRef.current = idx;
      setSeconds(res.positions[idx]?.duration ?? 0);
      setRunning(res.status === 'RUNNING');
      const plans = await planService.list();
      setPlan(plans.find((p) => p.id === res.planId) ?? null);
    });
  }, [id]);

  const dwell = plan?.dwellSeconds ?? 60;
  const total = positions.length || 6;

  useEffect(() => {
    if (!running || solving) return undefined;
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
      setSeries((prev) => {
        const base = 0.004;
        const noise = Math.max(0.0012, 0.02 - seconds * 0.0004);
        return [...prev.slice(-120), base + (Math.random() - 0.5) * noise];
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, solving, seconds]);

  const stability = useMemo(() => Math.max(0.0042, 0.062 - seconds * 0.0009), [seconds]);
  const stable = stability <= (plan?.stabilityThreshold ?? 0.02);

  const finishPosition = () => {
    const nextPositions = positions.map((p, i) => {
      if (i === index) return { ...p, status: 'DONE' as const, duration: seconds || dwell, stability: Number(stability.toFixed(4)) };
      if (i === index + 1) return { ...p, status: 'RUNNING' as const };
      return p;
    });
    setPositions(nextPositions);
    const done = nextPositions.filter((p) => p.status === 'DONE').length;
    const newProgress = Math.round((done / total) * 100);
    calibrationService.advance(id, newProgress, index + 1).then((updated) => {
      if (updated) setTask(updated);
    });
    if (index + 1 >= total) {
      setRunning(false);
      setSolving(true);
      setTimeout(() => {
        message.success('参数解算完成，正在打开结果页');
        navigate(`/calibration/${id}/result`);
      }, 1600);
    } else {
      setIndex(index + 1);
      indexRef.current = index + 1;
      setSeconds(0);
      setSeries([]);
    }
  };

  useEffect(() => {
    if (running && seconds >= dwell + 3) {
      const timer = setTimeout(finishPosition, 700);
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, running]);

  const step = solving ? 3 : task?.status === 'COMPLETED' ? 5 : task?.status === 'REVIEWING' ? 4 : 2;

  const chartOption = useMemo(
    () =>
      baseOption({
        grid: { ...gridBase, left: 50, right: 16, top: 20, bottom: 26 },
        tooltip: { ...tooltipBase, trigger: 'axis', valueFormatter: (v: unknown) => `${Number(v).toFixed(4)} °/h` },
        xAxis: { type: 'category', boundaryGap: false, data: series.map((_, i) => `${i}`), axisLabel: { show: false }, axisLine: { lineStyle: { color: '#dfe5ee' } }, axisTick: { show: false } },
        yAxis: valueAxis('°/h', { scale: true }),
        series: [
          {
            type: 'line',
            showSymbol: false,
            smooth: true,
            lineStyle: { width: 1.6, color: '#1668dc' },
            areaStyle: { color: 'rgba(22,104,220,0.08)' },
            data: series,
            markLine: {
              silent: true,
              symbol: 'none',
              label: { formatter: '判稳阈值 0.020', fontSize: 10, color: '#faad14' },
              lineStyle: { color: '#faad14', type: 'dashed' },
              data: [{ yAxis: plan?.stabilityThreshold ?? 0.02 }],
            },
          },
        ],
      }),
    [series, plan],
  );

  if (!task) {
    return (
      <div className="page">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/calibration')}>返回</Button>
        <Panel><span className="muted">正在加载标定任务…</span></Panel>
      </div>
    );
  }

  const currentLabel = positions[index]?.label ?? '—';

  return (
    <div className="page">
      <PageHeader
        title={`标定执行 · ${task.code}`}
        description={`${task.deviceCode} ${task.deviceModel} · ${task.planName} · ${task.stationName}`}
        extra={
          <>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/calibration')}>返回列表</Button>
            <StatusTag text={CALIB_STATUS_LABEL[task.status]} color={CALIB_STATUS_COLOR[task.status]} />
          </>
        }
      />

      <Panel>
        <Steps
          size="small"
          current={step}
          items={[
            { title: '准备', description: '检查工装与环境' },
            { title: '安装', description: '水平度复检' },
            { title: '采集', description: `${positions.filter((p) => p.status === 'DONE').length}/${total} 位置` },
            { title: '解算', description: '零偏与标度因数' },
            { title: '审核', description: '参数复核' },
            { title: '归档', description: '生成报告' },
          ]}
        />
      </Panel>

      <div className="wizard-grid">
        <Panel title="位置序列" sub={plan?.name}>
          <div className="position-list">
            {positions.map((position, i) => (
              <div
                key={position.index}
                className={`position-item ${position.status === 'RUNNING' ? 'running' : position.status === 'DONE' ? 'done' : position.status === 'FAILED' ? 'failed' : ''}`}
              >
                <span className="position-idx">{position.status === 'DONE' ? '✓' : position.index}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: i === index ? 500 : 400 }}>{position.label}</div>
                  <div className="small muted">
                    {position.status === 'DONE' ? `${position.duration} s · 稳定度 ${position.stability.toFixed(4)}` : position.status === 'RUNNING' ? `采集中 ${seconds}s` : '待采集'}
                  </div>
                </div>
                {position.status === 'RUNNING' ? <Tag color="processing" bordered={false}>当前</Tag> : null}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: 10, background: '#fafbfd', borderRadius: 6, fontSize: 12, color: '#5a6577', lineHeight: 1.8 }}>
            判稳阈值 {plan?.stabilityThreshold ?? 0.02} °/h，驻留 {dwell} s；连续 10 s 低于阈值即自动切换下一位置。
          </div>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="当前位置" sub={`${index + 1} / ${total}`}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <svg width="150" height="132" viewBox="0 0 150 132">
                <g transform="translate(75 66)">
                  <polygon points="0,-46 52,-20 52,26 0,52 -52,26 -52,-20" fill="#f4f8ff" stroke="#85b7eb" strokeWidth="1.2" />
                  <polygon points="0,-46 52,-20 0,6 -52,-20" fill="#e8f1fe" stroke="#85b7eb" strokeWidth="1.2" />
                  <polygon points="-52,-20 0,6 0,52 -52,26" fill="#f7fbff" stroke="#85b7eb" strokeWidth="1.2" />
                  <polygon points="52,-20 0,6 0,52 52,26" fill="#eef5ff" stroke="#85b7eb" strokeWidth="1.2" />
                  <text x="0" y="-8" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1668dc">{currentLabel}</text>
                  <circle cx="0" cy="6" r="3" fill="#f5222d" />
                </g>
                <text x="75" y="126" textAnchor="middle" fontSize="10" fill="#8a94a6">器件姿态示意（+Z 面朝上为基准）</text>
              </svg>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div className="small muted">本位置稳定度</div>
                <div style={{ fontSize: 26, fontWeight: 600 }} className={stable ? '' : 'num'}>
                  <span style={{ color: stable ? '#16a34a' : '#fa8c16' }}>{stability.toFixed(4)}</span>
                  <span className="stat-unit">°/h</span>
                </div>
                <div className="small" style={{ marginTop: 2, color: stable ? '#16a34a' : '#fa8c16' }}>
                  {stable ? '已稳定，可切换下一位置' : '收敛中，请保持静止'}
                </div>
                <div style={{ marginTop: 10 }}>
                  <Progress
                    percent={Math.min(100, Math.round((seconds / dwell) * 100))}
                    size="small"
                    strokeColor={stable ? '#16a34a' : '#1668dc'}
                  />
                  <div className="small muted">已驻留 {seconds} s / 目标 {dwell} s</div>
                </div>
              </div>
            </div>
          </Panel>

          <ChartPanel title="当前位置采集曲线" sub="零偏估计（°/h）" option={chartOption} height={200} filename="位置采集曲线" empty={series.length === 0} />

          <Panel title="环境与工装" sub="实时监测">
            <div className="metric-row">
              <div className="metric-mini"><div className="label">环境温度</div><div className="value">23.4<span className="stat-unit">℃</span></div></div>
              <div className="metric-mini"><div className="label">工装水平度</div><div className="value">4.2<span className="stat-unit">″</span></div></div>
              <div className="metric-mini"><div className="label">转台速率</div><div className="value">0.000<span className="stat-unit">°/s</span></div></div>
            </div>
          </Panel>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="任务信息">
            <div className="kv">
              <dt>任务号</dt><dd className="mono">{task.code}</dd>
              <dt>设备</dt><dd>{task.deviceCode}</dd>
              <dt>方案</dt><dd>{task.planName}</dd>
              <dt>台位</dt><dd>{task.stationName}</dd>
              <dt>执行人</dt><dd>{task.operator}</dd>
              <dt>审核人</dt><dd>{task.reviewer}</dd>
              <dt>温度点</dt><dd>{task.tempPoints.join(' / ')} ℃</dd>
            </div>
          </Panel>

          <Panel title="执行控制">
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <Progress
                type="dashboard"
                percent={Math.round((positions.filter((p) => p.status === 'DONE').length / total) * 100)}
                size={120}
                strokeColor={{ '0%': '#1668dc', '100%': '#13c2c2' }}
              />
              <div className="small muted">整体进度</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!running ? (
                <Button type="primary" icon={<CaretRightOutlined />} onClick={() => setRunning(true)} block>
                  开始本位置
                </Button>
              ) : (
                <Button icon={<PauseOutlined />} onClick={() => setRunning(false)} block>暂停</Button>
              )}
              <Button icon={<StepForwardOutlined />} onClick={finishPosition} disabled={!running} block>完成并切换</Button>
              <Button
                icon={<ReloadOutlined />}
                block
                onClick={() => {
                  setSeconds(0);
                  setSeries([]);
                  message.success('已重置本位置采集数据');
                }}
              >
                重采本位置
              </Button>
              <Button
                danger
                type="text"
                block
                onClick={() =>
                  Modal.confirm({
                    title: '确认终止本次标定？',
                    content: '已采集的数据将保留，任务状态置为异常，可在列表中重新发起。',
                    okText: '终止任务',
                    cancelText: '取消',
                    onOk: () => {
                      setRunning(false);
                      message.warning('任务已终止，记录已保存');
                      navigate('/calibration');
                    },
                  })
                }
              >
                终止任务
              </Button>
            </div>
            <div className="small muted" style={{ marginTop: 10, lineHeight: 1.8 }}>
              提示：换位后需等待 10 s 再开始采样，避免换位冲击引入振荡。
            </div>
          </Panel>

          <Panel title="预计剩余">
            <div style={{ fontSize: 22, fontWeight: 600 }} className="num">
              {Math.max(0, plan ? plan.estimatedMinutes - Math.round((index / total) * plan.estimatedMinutes) : 0)}
              <span className="stat-unit">min</span>
            </div>
            <div className="small muted">基于当前进度线性估算</div>
          </Panel>
        </div>
      </div>

      {solving ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,27,44,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '28px 40px', textAlign: 'center' }}>
            <Progress type="circle" percent={100} status="active" size={72} />
            <div style={{ marginTop: 14, fontSize: 15 }}>正在解算标定参数…</div>
            <div className="small muted" style={{ marginTop: 4 }}>最小二乘拟合 · 残差分析 · 安装误差矩阵</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
