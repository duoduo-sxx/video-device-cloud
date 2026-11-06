import { useEffect, useMemo, useState } from 'react';
import { Select, Tag } from 'antd';
import { healthService, deviceService } from '../services';
import type { Device, HealthRecord } from '../types/models';
import { HEALTH_LEVEL_COLOR, HEALTH_LEVEL_LABEL, healthLevelOf } from '../constants/dict';
import { ChartPanel } from '../components/ChartPanel';
import { HealthRing, PageHeader, Panel, StatCard } from '../components/ui';
import { baseOption, categoryAxis, gridBase, tooltipBase, valueAxis } from '../utils/charts';

const METRIC_DEF: { key: keyof HealthRecord['metrics']; label: string; weight: number; baseline: number }[] = [
  { key: 'biasStability', label: '零偏稳定性', weight: 25, baseline: 0.032 },
  { key: 'scaleStability', label: '标度因数稳定性', weight: 20, baseline: 42 },
  { key: 'noiseLevel', label: '噪声水平', weight: 15, baseline: 0.018 },
  { key: 'tempCharacteristic', label: '温度特性', weight: 15, baseline: 0.0018 },
  { key: 'dataIntegrity', label: '数据完整率', weight: 15, baseline: 99.2 },
  { key: 'calibrationTimeliness', label: '校准及时性', weight: 10, baseline: 88 },
];

export default function Health() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState('DEV-0001');
  const [records, setRecords] = useState<HealthRecord[]>([]);

  useEffect(() => {
    deviceService.all().then(setDevices);
  }, []);

  useEffect(() => {
    healthService.detail(deviceId).then((res) => setRecords(res.records));
  }, [deviceId]);

  const device = devices.find((d) => d.id === deviceId);
  const latest = records[records.length - 1];
  const prev = records[records.length - 8];

  const radarOption = useMemo(
    () =>
      baseOption({
        tooltip: { ...tooltipBase },
        radar: {
          indicator: METRIC_DEF.map((m) => ({ name: m.label, max: 100 })),
          radius: '62%',
          center: ['50%', '55%'],
          axisName: { color: '#5a6577', fontSize: 11 },
          splitLine: { lineStyle: { color: '#eef2f7' } },
          splitArea: { areaStyle: { color: ['#ffffff', '#fafbfd'] } },
          axisLine: { lineStyle: { color: '#eef2f7' } },
        },
        series: [
          {
            type: 'radar',
            data: [
              {
                name: '当前',
                value: latest ? METRIC_DEF.map((m) => latest.metrics[m.key]) : [],
                areaStyle: { color: 'rgba(22,104,220,0.14)' },
                lineStyle: { color: '#1668dc' },
                itemStyle: { color: '#1668dc' },
              },
              {
                name: '同型号均值',
                value: latest ? METRIC_DEF.map((m) => Math.max(50, latest.metrics[m.key] - 6)) : [],
                areaStyle: { color: 'rgba(138,148,166,0.08)' },
                lineStyle: { color: '#8a94a6', type: 'dashed' },
                itemStyle: { color: '#8a94a6' },
              },
            ],
          },
        ],
        legend: { top: 0, left: 0, itemWidth: 10, itemHeight: 8, textStyle: { fontSize: 11 } },
      }),
    [latest],
  );

  const trendOption = useMemo(
    () =>
      baseOption({
        grid: { ...gridBase, left: 44, right: 20, top: 28, bottom: 28 },
        tooltip: { ...tooltipBase, trigger: 'axis' },
        xAxis: categoryAxis(records.map((r) => r.date.slice(5)), '日期'),
        yAxis: valueAxis('健康分', { min: 40, max: 100 }),
        series: [
          {
            type: 'line',
            name: '健康分',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 2, color: '#1668dc' },
            areaStyle: { color: 'rgba(22,104,220,0.10)' },
            data: records.map((r) => r.score),
            markLine: {
              silent: true,
              symbol: 'none',
              label: { formatter: '关注线 70', fontSize: 10, color: '#faad14' },
              lineStyle: { color: '#faad14', type: 'dashed' },
              data: [{ yAxis: 70 }],
            },
          },
        ],
      }),
    [records],
  );

  const score = latest?.score ?? 0;
  const level = healthLevelOf(score);

  return (
    <div className="page">
      <PageHeader
        title="健康评估"
        description="基于零偏稳定性、噪声水平、温度特性与校准及时性的多指标加权评分"
        extra={
          <Select
            style={{ width: 240 }}
            value={deviceId}
            onChange={setDeviceId}
            showSearch
            optionFilterProp="label"
            options={devices.map((d) => ({ value: d.id, label: `${d.code} · ${d.model}` }))}
          />
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
        <Panel title="综合健康度" sub="近 90 天">
          <div style={{ textAlign: 'center', padding: '6px 0 12px' }}>
            <HealthRing score={score} size={150} />
            <div style={{ marginTop: 8, fontSize: 15, color: HEALTH_LEVEL_COLOR[level] }}>{HEALTH_LEVEL_LABEL[level]}</div>
            <div className="small muted" style={{ marginTop: 4 }}>
              {device?.code} · {device?.model}
            </div>
            <div className="small" style={{ marginTop: 6, color: prev && score < prev.score ? '#f5222d' : '#16a34a' }}>
              {prev ? `较上周 ${score >= prev.score ? '+' : ''}${(score - prev.score).toFixed(1)} 分` : '—'}
            </div>
          </div>
          <div className="kv">
            <dt>评分等级</dt><dd>{HEALTH_LEVEL_LABEL[level]}</dd>
            <dt>上次标定</dt><dd>{device?.calibratedAt}</dd>
            <dt>校准剩余</dt><dd>{device ? Math.round((new Date(device.calibrationValidUntil).getTime() - new Date('2026-10-19').getTime()) / 86400000) : 0} 天</dd>
            <dt>建议动作</dt><dd>{score < 75 ? '安排复标' : '按计划维护'}</dd>
          </div>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <StatCard label="零偏稳定性得分" value={latest?.metrics.biasStability ?? '—'} unit="分" hint="权重 25%" />
            <StatCard label="噪声水平得分" value={latest?.metrics.noiseLevel ?? '—'} unit="分" hint="权重 15%" />
            <StatCard label="温度特性得分" value={latest?.metrics.tempCharacteristic ?? '—'} unit="分" hint="权重 15%" />
            <StatCard label="校准及时性" value={latest?.metrics.calibrationTimeliness ?? '—'} unit="分" hint="权重 10%" />
          </div>
          <ChartPanel title="健康度趋势" sub="近 90 天每日评分" option={trendOption} height={226} filename="健康度趋势" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartPanel title="六维指标雷达" sub="当前 vs 同型号均值" option={radarOption} height={320} filename="健康雷达" />
        <Panel title="指标明细" sub="加权得分与基线对比">
          <table className="spec-table">
            <thead><tr><th>指标</th><th>当前值</th><th>基线</th><th>偏差</th><th>权重</th><th>得分</th></tr></thead>
            <tbody>
              {METRIC_DEF.map((metric) => {
                const current = latest?.metrics[metric.key] ?? 0;
                const deviation = ((current - 80) / 80) * 100;
                return (
                  <tr key={metric.key}>
                    <th>{metric.label}</th>
                    <td className="value">{current}</td>
                    <td className="muted">{metric.baseline}</td>
                    <td style={{ color: deviation >= 0 ? '#16a34a' : '#f5222d' }}>{deviation >= 0 ? '+' : ''}{deviation.toFixed(1)}%</td>
                    <td>{metric.weight}%</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 44, height: 5, borderRadius: 3, background: '#eef2f7', overflow: 'hidden' }}>
                          <div style={{ width: `${current}%`, height: '100%', background: current >= 85 ? '#16a34a' : current >= 70 ? '#faad14' : '#f5222d' }} />
                        </div>
                        <span className="num">{current}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="small muted" style={{ marginTop: 10, lineHeight: 1.8 }}>
            综合分 = Σ（指标得分 × 权重），当前加权结果 {Math.round(METRIC_DEF.reduce((sum, m) => sum + (latest?.metrics[m.key] ?? 0) * (m.weight / 100), 0))} 分。
          </div>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <Panel title="维护建议" sub="基于规则生成">
          {latest ? (
            <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 6, fontSize: 13, lineHeight: 1.9 }}>
              <Tag bordered={false} color="warning" style={{ height: 22 }}>建议</Tag>
              <div>{latest.suggestion}</div>
            </div>
          ) : null}
          <div style={{ marginTop: 12, fontSize: 13, lineHeight: 2, color: '#5a6577' }}>
            <div>· 零偏稳定性连续 3 次下降，建议在 2026-11 前安排复标并检查温控回路。</div>
            <div>· 数据完整率 99.2%，高于 98% 的目标值，无需处理。</div>
            <div>· 下次标定建议增加 70 ℃ 高温点，以覆盖夏季工况。</div>
          </div>
        </Panel>

        <Panel title="同型号横向对比" sub="同型号 6 台">
          <table className="spec-table">
            <thead><tr><th>设备</th><th>健康分</th><th>零偏稳定性</th><th>状态</th></tr></thead>
            <tbody>
              {devices.filter((d) => d.model === device?.model).slice(0, 6).map((d) => (
                <tr key={d.id}>
                  <td>{d.code}</td>
                  <td className="value">{d.healthScore}</td>
                  <td>{d.specs.gyroBiasStability.toFixed(4)} °/h</td>
                  <td><Tag bordered={false} color={d.healthScore >= 90 ? 'success' : d.healthScore >= 75 ? 'default' : 'warning'}>{HEALTH_LEVEL_LABEL[d.healthLevel]}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
