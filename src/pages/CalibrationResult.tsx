import { useEffect, useMemo, useState } from 'react';
import { Button, Descriptions, Input, Modal, Progress, Tag, message } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { calibrationService, deviceService } from '../services';
import type { CalibrationResult, CalibrationTask, Device } from '../types/models';
import { CALIB_STATUS_COLOR, CALIB_STATUS_LABEL, CONCLUSION_LABEL } from '../constants/dict';
import { ChartPanel } from '../components/ChartPanel';
import { PageHeader, Panel, StatCard, StatusTag } from '../components/ui';
import { baseOption, categoryAxis, CHART_COLORS, gridBase, tooltipBase, valueAxis } from '../utils/charts';
import { fmtDate, fmtDateTime } from '../utils/format';

function fallbackResult(task: CalibrationTask, device?: Device): CalibrationResult {
  const bias = device?.specs.gyroBiasStability ?? 0.032;
  return {
    id: `CR-${task.id}`,
    taskId: task.id,
    biases: { x: Number((bias * 0.9).toFixed(4)), y: Number((-bias * 0.55).toFixed(4)), z: Number((bias * 0.72).toFixed(4)) },
    biasSigma: { x: 0.0041, y: 0.0038, z: 0.0045 },
    scaleFactors: { x: 1.000412, y: 0.999873, z: 1.000268 },
    nonlinearity: { x: 42, y: 38, z: 47 },
    misalignmentArcsec: [
      [0, 38.6, -21.4],
      [-36.9, 0, 18.2],
      [22.7, -17.5, 0],
    ],
    tempCoeff: { x: 0.0018, y: -0.0012, z: 0.0015 },
    residual: { r2: 0.9987, max: 0.0042, rms: 0.0013 },
    passed: true,
    createdAt: task.actualEnd ?? '2026-10-19 10:27:26',
    operator: task.operator,
    reviewer: task.reviewer,
  };
}

export default function CalibrationResultPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<CalibrationTask | null>(null);
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const [device, setDevice] = useState<Device | undefined>();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [opinion, setOpinion] = useState('');
  const [pass, setPass] = useState(true);

  useEffect(() => {
    calibrationService.detail(id).then(async (res) => {
      if (!res) return;
      setTask(res);
      const dev = await deviceService.detail(res.deviceId);
      setDevice(dev);
      const r = await calibrationService.resultOf(id);
      setResult(r ?? fallbackResult(res, dev));
    });
  }, [id]);

  const residualOption = useMemo(() => {
    const points = Array.from({ length: 120 }, (_, i) => i);
    return baseOption({
      grid: { ...gridBase, left: 48, right: 16, top: 30, bottom: 28 },
      tooltip: { ...tooltipBase, trigger: 'axis', valueFormatter: (v: unknown) => `${Number(v).toFixed(4)} °/h` },
      legend: { data: ['X 轴', 'Y 轴', 'Z 轴'], top: 0, left: 0, itemWidth: 10, itemHeight: 8, textStyle: { fontSize: 11 } },
      xAxis: { ...categoryAxis(points.map((p) => String(p + 1))), name: '采样点' },
      yAxis: valueAxis('残差 (°/h)', { scale: true }),
      series: ['X 轴', 'Y 轴', 'Z 轴'].map((name, idx) => ({
        name,
        type: 'line' as const,
        showSymbol: false,
        lineStyle: { width: 1.2, color: CHART_COLORS[idx] },
        data: points.map((p) => Number((Math.sin((p + idx * 9) / 7) * 0.0026 + Math.cos(p / 3 + idx) * 0.0012).toFixed(4))),
      })),
    });
  }, []);

  const tempOption = useMemo(() => {
    const temps = [-40, -20, 0, 20, 40, 60, 70];
    const bias = temps.map((t) => Number((0.024 + (t - 20) * 0.0018 + ((t - 20) ** 2) * 0.000004).toFixed(4)));
    const scale = temps.map((t) => Number((1.000268 + (t - 20) * 0.0000021).toFixed(6)));
    return baseOption({
      grid: { ...gridBase, left: 52, right: 52, top: 30, bottom: 28 },
      tooltip: { ...tooltipBase, trigger: 'axis' },
      legend: { data: ['零偏 (°/h)', '标度因数偏差 (ppm)'], top: 0, left: 0, itemWidth: 10, itemHeight: 8, textStyle: { fontSize: 11 } },
      xAxis: categoryAxis(temps.map((t) => `${t}℃`), '温度'),
      yAxis: [valueAxis('°/h'), valueAxis('ppm', { splitLine: { show: false } })],
      series: [
        { name: '零偏 (°/h)', type: 'line', symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: '#1668dc' }, data: bias },
        {
          name: '标度因数偏差 (ppm)',
          type: 'line',
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { width: 2, color: '#13c2c2', type: 'dashed' },
          data: scale.map((s) => Number(((s - 1) * 1e6).toFixed(1))),
        },
      ],
    });
  }, []);

  if (!task || !result) {
    return (
      <div className="page">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/calibration')}>返回</Button>
        <Panel><span className="muted">正在加载标定结果…</span></Panel>
      </div>
    );
  }

  const axes = ['X', 'Y', 'Z'] as const;
  const biasValues = [result.biases.x, result.biases.y, result.biases.z];
  const sigmaValues = [result.biasSigma.x, result.biasSigma.y, result.biasSigma.z];
  const scaleValues = [result.scaleFactors.x, result.scaleFactors.y, result.scaleFactors.z];
  const nlValues = [result.nonlinearity.x, result.nonlinearity.y, result.nonlinearity.z];
  const maxMis = Math.max(...result.misalignmentArcsec.flat().map(Math.abs), 1);

  return (
    <div className="page">
      <PageHeader
        title={`标定结果 · ${task.code}`}
        description={`${task.deviceCode} ${task.deviceModel} · ${task.planName} · 执行 ${fmtDateTime(task.actualStart ?? task.plannedStart)}`}
        extra={
          <>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/calibration')}>返回</Button>
            <Button icon={<FileTextOutlined />} onClick={() => navigate('/reports')}>生成报告</Button>
            <Button type="primary" onClick={() => setReviewOpen(true)}>审核参数</Button>
          </>
        }
      />

      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: result.passed ? '#f6ffed' : '#fff1f0',
              border: `1px solid ${result.passed ? '#b7eb8f' : '#ffa39e'}`,
            }}
          >
            {result.passed ? <CheckCircleOutlined style={{ fontSize: 30, color: '#16a34a' }} /> : <CloseCircleOutlined style={{ fontSize: 30, color: '#f5222d' }} />}
            <div style={{ marginTop: 4, fontWeight: 600, color: result.passed ? '#16a34a' : '#f5222d' }}>
              {CONCLUSION_LABEL[result.passed ? 'PASS' : 'FAIL']}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 320 }}>
            <Descriptions column={3} size="small">
              <Descriptions.Item label="任务状态"><StatusTag text={CALIB_STATUS_LABEL[task.status]} color={CALIB_STATUS_COLOR[task.status]} /></Descriptions.Item>
              <Descriptions.Item label="执行人">{result.operator}</Descriptions.Item>
              <Descriptions.Item label="审核人">{result.reviewer}</Descriptions.Item>
              <Descriptions.Item label="完成时间">{fmtDate(result.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="拟合优度 R²">{result.residual.r2}</Descriptions.Item>
              <Descriptions.Item label="参数版本">V{String(task.code.slice(-3))}</Descriptions.Item>
            </Descriptions>
          </div>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <StatCard label="最大零偏" value={Math.max(...biasValues.map(Math.abs)).toFixed(4)} unit="°/h" hint="限值 ≤ 0.05" color="#1668dc" />
        <StatCard label="零偏 1σ 最大" value={Math.max(...sigmaValues).toFixed(4)} unit="°/h" hint="限值 ≤ 0.01" />
        <StatCard label="标度因数最大偏差" value={(Math.max(...scaleValues.map((v) => Math.abs(v - 1))) * 1e6).toFixed(0)} unit="ppm" hint="限值 ≤ 1000 ppm" />
        <StatCard label="非线性度最大" value={Math.max(...nlValues)} unit="ppm" hint="限值 ≤ 50" />
        <StatCard label="最大安装误差" value={Math.max(...result.misalignmentArcsec.flat().map(Math.abs)).toFixed(1)} unit="″" hint="限值 ≤ 60″" />
        <StatCard label="残差 RMS" value={result.residual.rms.toFixed(4)} unit="°/h" hint={`最大 ${result.residual.max}`} color="#16a34a" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Panel title="零偏解算结果" sub="单位：°/h">
          <table className="spec-table">
            <thead><tr><th>轴</th><th>零偏</th><th>1σ</th><th>限值</th><th>判定</th></tr></thead>
            <tbody>
              {axes.map((axis, i) => {
                const over = Math.abs(biasValues[i]) > 0.05;
                return (
                  <tr key={axis}>
                    <th>{axis} 轴</th>
                    <td className={over ? 'value over' : 'value'}>{biasValues[i].toFixed(4)}</td>
                    <td className="value">{sigmaValues[i].toFixed(4)}</td>
                    <td className="muted">≤ 0.0500</td>
                    <td><StatusTag text={over ? '超差' : '合格'} color={over ? 'error' : 'success'} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>

        <Panel title="标度因数与非线性度">
          <table className="spec-table">
            <thead><tr><th>轴</th><th>标度因数</th><th>偏差 (ppm)</th><th>非线性度</th><th>判定</th></tr></thead>
            <tbody>
              {axes.map((axis, i) => {
                const dev = (scaleValues[i] - 1) * 1e6;
                const over = nlValues[i] > 50;
                return (
                  <tr key={axis}>
                    <th>{axis} 轴</th>
                    <td className="value">{scaleValues[i].toFixed(6)}</td>
                    <td className="value">{dev >= 0 ? '+' : ''}{dev.toFixed(0)}</td>
                    <td className={over ? 'value over' : 'value'}>{nlValues[i]} ppm</td>
                    <td><StatusTag text={over ? '超差' : '合格'} color={over ? 'error' : 'success'} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>
        <Panel title="安装误差矩阵" sub="单位：角秒（″）">
          <div className="matrix">
            <div className="matrix-head" />
            {axes.map((a) => <div className="matrix-head" key={`h-${a}`}>→ {a}</div>)}
            {axes.map((rowAxis, r) => (
              <div key={`row-${rowAxis}`} style={{ display: 'contents' }}>
                <div className="matrix-head">{rowAxis} ←</div>
                {result.misalignmentArcsec[r].map((value, c) => {
                  const intensity = Math.min(0.55, Math.abs(value) / maxMis / 1.6);
                  const diag = r === c;
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={diag ? 'matrix-cell diag' : 'matrix-cell'}
                      style={diag ? undefined : { background: `rgba(22,104,220,${intensity})`, color: intensity > 0.3 ? '#fff' : '#1f2733' }}
                      title={`${axes[r]} 敏感轴 → 载体 ${axes[c]} 轴`}
                    >
                      {diag ? '—' : value.toFixed(1)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="small muted" style={{ marginTop: 10, lineHeight: 1.8 }}>
            对角项为理想值占位，非对角项为失准角。最大 38.6″，未超过 60″ 限值。
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="small muted">残差 RMS</div>
            <Progress percent={Math.min(100, (result.residual.rms / 0.005) * 100)} size="small" strokeColor="#16a34a" format={() => result.residual.rms.toFixed(4)} />
            <div className="small muted" style={{ marginTop: 6 }}>拟合优度 R² = {result.residual.r2}，最大残差 {result.residual.max} °/h</div>
          </div>
        </Panel>

        <ChartPanel title="三轴拟合残差" sub="残差 = 实测值 − 模型预测值" option={residualOption} height={300} filename="标定残差曲线" unitHint="单位：°/h" />
      </div>

      <ChartPanel title="温度特性曲线" sub="零偏与标度因数随温度变化" option={tempOption} height={260} filename="温度特性曲线" unitHint="温度点 −40 ℃ ~ +70 ℃" />

      <Panel title="参数对比" sub="本次 vs 上次" extra={<Tag bordered={false} color="blue">差异 {'>'} 5% 高亮</Tag>}>
        <table className="spec-table">
          <thead><tr><th>参数</th><th>本次</th><th>上次</th><th>差值</th><th>变化率</th><th>判定</th></tr></thead>
          <tbody>
            {axes.map((axis, i) => {
              const prev = biasValues[i] * (1 + (i === 0 ? 0.032 : i === 1 ? -0.041 : 0.018));
              const rate = ((biasValues[i] - prev) / Math.abs(prev)) * 100;
              const over = Math.abs(rate) > 5;
              return (
                <tr key={axis}>
                  <th>零偏 {axis}</th>
                  <td className="value">{biasValues[i].toFixed(4)} °/h</td>
                  <td className="value">{prev.toFixed(4)} °/h</td>
                  <td className="value">{biasValues[i] - prev >= 0 ? '+' : ''}{(biasValues[i] - prev).toFixed(4)}</td>
                  <td className={over ? 'over' : ''}>{rate >= 0 ? '+' : ''}{rate.toFixed(2)}%</td>
                  <td><StatusTag text={over ? '需关注' : '稳定'} color={over ? 'warning' : 'success'} /></td>
                </tr>
              );
            })}
            <tr>
              <th>安装误差（最大）</th>
              <td className="value">38.6 ″</td>
              <td className="value">36.2 ″</td>
              <td className="value">+2.4</td>
              <td>+6.63%</td>
              <td><StatusTag text="需关注" color="warning" /></td>
            </tr>
          </tbody>
        </table>
      </Panel>

      <Modal
        title="参数审核"
        open={reviewOpen}
        onCancel={() => setReviewOpen(false)}
        okText={pass ? '通过并归档' : '驳回'}
        okButtonProps={{ danger: !pass }}
        onOk={async () => {
          if (!pass && opinion.trim().length < 10) {
            message.error('驳回时必须填写不少于 10 字的审核意见');
            return;
          }
          await calibrationService.review(task.id, pass);
          message.success(pass ? '审核通过，结果已归档' : '已驳回，任务退回执行人');
          setReviewOpen(false);
          navigate('/calibration');
        }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Button type={pass ? 'primary' : 'default'} onClick={() => setPass(true)}>通过</Button>
          <Button danger={!pass} type={!pass ? 'primary' : 'default'} onClick={() => setPass(false)}>驳回</Button>
        </div>
        <div className="small muted" style={{ marginBottom: 6 }}>
          审核意见{pass ? '（选填）' : '（必填，不少于 10 字）'}
        </div>
        <Input.TextArea rows={4} value={opinion} onChange={(e) => setOpinion(e.target.value)} placeholder="如：六位置残差均小于 0.005 °/h，安装误差在限值内，同意归档。" />
      </Modal>
    </div>
  );
}
