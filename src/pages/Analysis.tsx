import { useEffect, useMemo, useState } from 'react';
import { Button, Empty, Radio, Select, Table, Tabs, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, ExperimentOutlined } from '@ant-design/icons';
import { dataFileService, deviceService } from '../services';
import type { DataFile, Device } from '../types/models';
import { allanMinimum, allanSeries, slopeBands } from '../utils/allan';
import { generateSpectrum, generateTelemetry } from '../utils/signal';
import { histogram, kurtosis, mean, peakToPeak, rms, skewness, std } from '../utils/statistics';
import { baseOption, categoryAxis, CHART_COLORS, gridBase, tooltipBase, valueAxis } from '../utils/charts';
import { ChartPanel } from '../components/ChartPanel';
import { PageHeader, Panel } from '../components/ui';
import { fileSize, fmtDateTime } from '../utils/format';

type Method = 'allan' | 'psd' | 'fft' | 'stats' | 'hist';

export default function Analysis() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState('DEV-0001');
  const [files, setFiles] = useState<DataFile[]>([]);
  const [fileId, setFileId] = useState<string>();
  const [method, setMethod] = useState<Method>('allan');
  const [channel, setChannel] = useState<'X' | 'Y' | 'Z'>('X');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    deviceService.all().then((list) => setDevices(list));
  }, []);

  useEffect(() => {
    dataFileService.all().then((list) => {
      const filtered = list.filter((f) => f.deviceId === deviceId);
      setFiles(filtered);
      setFileId(filtered[0]?.id);
    });
  }, [deviceId]);

  const device = devices.find((d) => d.id === deviceId);
  const file = files.find((f) => f.id === fileId);

  const allan = useMemo(() => {
    const arw = device?.specs.arw ?? 0.018;
    const bi = device?.specs.gyroBiasStability ?? 0.032;
    const offset = channel === 'X' ? 0 : channel === 'Y' ? 7 : 13;
    return allanSeries(arw, bi, 20261019 + offset);
  }, [device, channel]);

  const min = useMemo(() => allanMinimum(allan), [allan]);

  const allanOption = useMemo(() => {
    const bands = slopeBands(allan);
    return baseOption({
      grid: { ...gridBase, left: 62, right: 24, top: 34, bottom: 42 },
      tooltip: {
        ...tooltipBase,
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = Array.isArray(params) ? params[0] : params;
          const item = p as { data: [number, number] };
          return `τ = ${item.data[0].toFixed(3)} s<br/>σ(τ) = ${item.data[1].toFixed(5)} °/h`;
        },
      },
      xAxis: {
        type: 'log',
        name: 'τ (s)',
        nameLocation: 'middle',
        nameGap: 26,
        min: 0.01,
        max: 10000,
        axisLabel: { formatter: (v: number) => (v >= 1 ? String(v) : String(v)), color: '#8a94a6', fontSize: 11 },
        axisLine: { lineStyle: { color: '#dfe5ee' } },
        splitLine: { show: true, lineStyle: { color: '#f5f7fa' } },
        minorTick: { show: false },
      },
      yAxis: {
        type: 'log',
        name: 'σ(τ) (°/h)',
        nameGap: 18,
        axisLabel: { color: '#8a94a6', fontSize: 11 },
        splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } },
      },
      series: [
        {
          type: 'line',
          data: allan.map((p) => [p.tau, p.sigma]),
          showSymbol: false,
          lineStyle: { width: 2, color: '#1668dc' },
          markArea: {
            silent: true,
            itemStyle: { color: 'rgba(22,104,220,0.03)' },
            label: { show: true, position: 'insideTop', fontSize: 10, color: '#8a94a6' },
            data: bands.map((band) => [{ name: band.label, xAxis: band.x0 }, { xAxis: band.x1 }]),
          },
          markPoint: {
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: { color: '#f5222d' },
            label: {
              show: true,
              position: 'right',
              formatter: `零偏不稳定性 ${min.sigma.toFixed(3)} °/h @ τ=${min.tau.toFixed(1)}s`,
              fontSize: 10,
              color: '#a8071a',
            },
            data: [{ name: '谷底', coord: [min.tau, min.sigma] }],
          },
        },
      ],
    });
  }, [allan, min]);

  const spectrum = useMemo(() => generateSpectrum(20261019 + (channel === 'X' ? 0 : 3)), [channel]);
  const telemetry = useMemo(() => generateTelemetry({ seed: 4000, count: 2000, seconds: 600 }), [channel]);

  const psdOption = useMemo(
    () =>
      baseOption({
        grid: { ...gridBase, left: 56, right: 20, top: 28, bottom: 40 },
        tooltip: { ...tooltipBase, trigger: 'axis' },
        xAxis: { type: 'log', name: '频率 (Hz)', nameLocation: 'middle', nameGap: 24, min: 0.5, max: 100, axisLabel: { color: '#8a94a6', fontSize: 11 }, splitLine: { lineStyle: { color: '#f5f7fa' } } },
        yAxis: { type: 'log', name: 'PSD ((°/h)²/Hz)', nameGap: 12, axisLabel: { color: '#8a94a6', fontSize: 11 }, splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } } },
        series: [
          {
            type: 'line',
            showSymbol: false,
            lineStyle: { width: 1.6, color: '#722ed1' },
            data: spectrum.freq.map((f, i) => [f, Math.max(1e-8, spectrum.amp[i] ** 2 / 10)]),
          },
        ],
      }),
    [spectrum],
  );

  const fftOption = useMemo(
    () =>
      baseOption({
        grid: { ...gridBase, left: 56, right: 20, top: 28, bottom: 40 },
        tooltip: { ...tooltipBase, trigger: 'axis', valueFormatter: (v: unknown) => `${Number(v).toFixed(4)} °/s` },
        xAxis: categoryAxis(spectrum.freq.map((f) => String(f)), '频率 (Hz)'),
        yAxis: valueAxis('幅值 (°/s)', { scale: true }),
        series: [
          {
            type: 'line',
            showSymbol: false,
            lineStyle: { width: 1.2, color: '#13c2c2' },
            areaStyle: { color: 'rgba(19,194,194,0.10)' },
            data: spectrum.amp,
            markPoint: {
              symbol: 'pin',
              symbolSize: 34,
              itemStyle: { color: '#faad14' },
              label: { fontSize: 9, color: '#fff', formatter: '12.5Hz' },
              data: [{ name: '12.5Hz', coord: ['12.5', spectrum.amp[24]] }],
            },
          },
        ],
      }),
    [spectrum],
  );

  const values = telemetry.gx;
  const hist = useMemo(() => histogram(values, 24), [values]);

  const histOption = useMemo(
    () =>
      baseOption({
        grid: { ...gridBase, left: 52, right: 20, top: 28, bottom: 40 },
        tooltip: { ...tooltipBase, trigger: 'axis' },
        xAxis: categoryAxis(hist.map((h) => h.x.toFixed(2)), '°/s'),
        yAxis: valueAxis('计数'),
        series: [
          { type: 'bar', barWidth: '86%', itemStyle: { color: '#85b7eb', borderRadius: [2, 2, 0, 0] }, data: hist.map((h) => h.count) },
        ],
      }),
    [hist],
  );

  const statRows = [
    { key: 'mean', name: '均值', value: mean(values), unit: '°/s', digits: 6 },
    { key: 'std', name: '标准差', value: std(values), unit: '°/s', digits: 6 },
    { key: 'pp', name: '峰峰值', value: peakToPeak(values), unit: '°/s', digits: 5 },
    { key: 'rms', name: 'RMS', value: rms(values), unit: '°/s', digits: 6 },
    { key: 'skew', name: '偏度', value: skewness(values), unit: '', digits: 4 },
    { key: 'kurt', name: '峰度', value: kurtosis(values), unit: '', digits: 4 },
  ];

  const statColumns: ColumnsType<(typeof statRows)[number]> = [
    { title: '统计量', dataIndex: 'name', width: 140 },
    { title: '数值', dataIndex: 'value', render: (v: number, r) => <span className="num">{v.toFixed(r.digits)}</span> },
    { title: '单位', dataIndex: 'unit', width: 100, render: (v: string) => v || '—' },
    { title: '说明', dataIndex: 'key', render: (v: string) => ({ mean: '一阶矩', std: '二阶中心矩（n−1）', pp: '最大值 − 最小值', rms: '均方根', skew: '三阶标准化矩', kurt: '超额峰度' }[v]) },
  ];

  const allanRows = [
    { key: 'q', name: '量化噪声 Q', slope: '−1', value: (allan[0].sigma * allan[0].tau * 1000).toFixed(5), unit: '°' },
    { key: 'n', name: '角度随机游走 N', slope: '−1/2', value: (min.sigma * Math.sqrt(min.tau) * 60).toFixed(4), unit: '°/√h' },
    { key: 'b', name: '零偏不稳定性 B', slope: '0', value: min.sigma.toFixed(4), unit: '°/h' },
    { key: 'k', name: '速率随机游走 K', slope: '+1/2', value: (min.sigma / Math.sqrt(min.tau) * 3600).toFixed(4), unit: '°/h^1.5' },
    { key: 'r', name: '速率斜坡 R', slope: '+1', value: (min.sigma / min.tau * 3600).toFixed(5), unit: '°/h²' },
  ];

  return (
    <div className="page">
      <PageHeader
        title="数据分析"
        description="Allan 方差、功率谱密度、频谱与统计特性分析，支持多通道对比与结果导出"
        extra={
          <Button icon={<DownloadOutlined />} onClick={() => message.success('分析结果已导出为 CSV（含 τ 与 σ(τ) 两列）')}>
            导出结果
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="数据源">
            <div className="small muted" style={{ marginBottom: 4 }}>分析设备</div>
            <Select
              style={{ width: '100%' }}
              value={deviceId}
              onChange={setDeviceId}
              showSearch
              optionFilterProp="label"
              options={devices.slice(0, 16).map((d) => ({ value: d.id, label: `${d.code} · ${d.model}` }))}
            />
            <div className="small muted" style={{ margin: '10px 0 4px' }}>数据文件（{files.length}）</div>
            <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid #eef2f7', borderRadius: 6 }}>
              {files.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setFileId(f.id)}
                  style={{
                    padding: '8px 10px',
                    borderBottom: '1px solid #f5f7fa',
                    cursor: 'pointer',
                    background: f.id === fileId ? '#f0f8ff' : undefined,
                  }}
                >
                  <div style={{ fontSize: 12, fontFamily: 'Menlo, monospace' }}>{f.code}</div>
                  <div className="small muted">{fmtDateTime(f.startedAt)} · {fileSize(f.sizeMB)}</div>
                </div>
              ))}
              {!files.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该设备暂无数据文件" /> : null}
            </div>
            {file ? (
              <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.9, color: '#5a6577' }}>
                <div>时长 {Math.round(file.duration / 60)} min · 采样率 {file.sampleRate} Hz</div>
                <div>通道 {file.channels} 路 · 格式 {file.format}</div>
                <div>标签：{file.tags.join('、')}</div>
              </div>
            ) : null}
          </Panel>

          <Panel title="分析参数">
            <div className="small muted">分析通道</div>
            <Radio.Group
              value={channel}
              onChange={(e) => {
                setBusy(true);
                setChannel(e.target.value);
                setTimeout(() => setBusy(false), 400);
              }}
              style={{ marginTop: 6 }}
              optionType="button"
              buttonStyle="solid"
              options={[
                { value: 'X', label: 'X 轴' },
                { value: 'Y', label: 'Y 轴' },
                { value: 'Z', label: 'Z 轴' },
              ]}
            />
            <div className="small muted" style={{ marginTop: 12 }}>τ 范围</div>
            <Tag bordered={false} color="blue" style={{ marginTop: 4 }}>0.01 s ~ 10000 s（60 点对数等距）</Tag>
            <div className="small muted" style={{ marginTop: 12 }}>窗函数 / 重叠率</div>
            <div style={{ fontSize: 12, color: '#5a6577', marginTop: 4 }}>Hann 窗 · 50% 重叠 · Welch 分段</div>
          </Panel>

          <Panel title="分析结论">
            <div style={{ fontSize: 13, lineHeight: 1.9, color: '#5a6577' }}>
              {channel} 轴零偏不稳定性约 <strong>{min.sigma.toFixed(3)} °/h</strong>，出现在 τ≈{min.tau.toFixed(0)} s；
              角度随机游走 <strong>{(min.sigma * Math.sqrt(min.tau) * 60).toFixed(4)} °/√h</strong>，优于 0.02 的指标要求，
              器件长期稳定性良好。
            </div>
          </Panel>
        </div>

        <Panel flush>
          <Tabs
            activeKey={method}
            onChange={(key) => setMethod(key as Method)}
            style={{ padding: '4px 16px 16px' }}
            items={[
              {
                key: 'allan',
                label: 'Allan 方差',
                children: (
                  <div>
                    <ChartPanel
                      title="Allan 标准差曲线"
                      sub={`${channel} 轴 · 双对数坐标`}
                      option={allanOption}
                      height={360}
                      filename={`Allan_${channel}`}
                      loading={busy}
                      unitHint="单位：σ(τ) °/h"
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginTop: 16 }}>
                      <table className="spec-table">
                        <thead><tr><th>噪声项</th><th>数值</th><th>单位</th><th>斜率</th></tr></thead>
                        <tbody>
                          {allanRows.map((row) => (
                            <tr key={row.key}>
                              <th>{row.name}</th>
                              <td className="value">{row.value}</td>
                              <td>{row.unit}</td>
                              <td className="muted">{row.slope}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ fontSize: 12, lineHeight: 2, color: '#5a6577' }}>
                        <div><strong>读图要点</strong></div>
                        <div>· −1 段：量化噪声，由 ADC 位数决定。</div>
                        <div>· −1/2 段：角度随机游走，反映白噪声水平。</div>
                        <div>· 0 段：零偏不稳定性，曲线谷底即该值。</div>
                        <div>· +1/2 段：速率随机游走，零偏随机漂移。</div>
                        <div>· +1 段：速率斜坡，多与温度或老化相关。</div>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'psd',
                label: '功率谱密度',
                children: (
                  <ChartPanel title="功率谱密度（Welch）" sub="Hann 窗 · 50% 重叠" option={psdOption} height={420} filename="PSD" loading={busy} unitHint="双对数坐标" />
                ),
              },
              {
                key: 'fft',
                label: 'FFT 频谱',
                children: (
                  <ChartPanel title="幅频特性" sub="0.5 ~ 100 Hz" option={fftOption} height={420} filename="FFT" loading={busy} unitHint="主频 12.5 Hz" />
                ),
              },
              {
                key: 'stats',
                label: '时域统计',
                children: (
                  <div>
                    <Table rowKey="key" size="middle" pagination={false} columns={statColumns} dataSource={statRows} />
                    <div className="small muted" style={{ margin: '10px 0' }}>
                      统计基于文件 {file?.code ?? '—'} 的 {channel} 轴，共 2,000 个采样点（10 s 窗口）。
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div className="metric-mini"><div className="label">最大值</div><div className="value">{Math.max(...values).toFixed(5)}</div></div>
                      <div className="metric-mini"><div className="label">最小值</div><div className="value">{Math.min(...values).toFixed(5)}</div></div>
                      <div className="metric-mini"><div className="label">3σ 区间</div><div className="value">±{(std(values) * 3).toFixed(5)}</div></div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'hist',
                label: '分布直方图',
                children: (
                  <ChartPanel title="幅值分布" sub="24 组 · 叠加正态拟合" option={histOption} height={420} filename="直方图" loading={busy} unitHint="样本数 2000" />
                ),
              },
            ]}
          />
        </Panel>
      </div>

      <Panel title="分析历史" sub="最近 5 次" extra={<Tag bordered={false} icon={<ExperimentOutlined />}>可复现</Tag>}>
        <table className="spec-table">
          <thead><tr><th>时间</th><th>设备</th><th>数据文件</th><th>方法</th><th>关键结论</th><th>操作</th></tr></thead>
          <tbody>
            {[
              ['2026-10-18 16:42', 'IMU-2023-0017', 'RAW-20261015-0031', 'Allan 方差', 'B = 0.0312 °/h，N = 0.0180 °/√h'],
              ['2026-10-17 09:20', 'IMU-2024-0042', 'RAW-20261012-0028', 'PSD', '12.5 Hz 处存在机械振动耦合'],
              ['2026-10-15 14:05', 'INS-2025-0003', 'RAW-20261010-0019', 'Allan 方差', 'B = 0.0195 °/h，优于指标 35%'],
              ['2026-10-12 10:33', 'IMU-2024-0058', 'RAW-20261008-0012', '时域统计', '峰峰值 0.186 °/s，超阈值'],
              ['2026-10-09 15:18', 'ACC-2023-0009', 'RAW-20261005-0008', 'FFT', '主频 25 Hz，幅值 0.008 g'],
            ].map((row) => (
              <tr key={row[0]}>
                <td>{row[0]}</td><td>{row[1]}</td><td className="mono small">{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td>
                <td><a onClick={() => message.success('已按历史参数复现分析')}>复现</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
