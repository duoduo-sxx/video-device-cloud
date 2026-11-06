import { useEffect, useMemo, useState } from 'react';
import { Button, InputNumber, Radio, Select, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined } from '@ant-design/icons';
import { deviceService } from '../services';
import type { Device } from '../types/models';
import { ChartPanel } from '../components/ChartPanel';
import { PageHeader, Panel, StatCard } from '../components/ui';
import { baseOption, categoryAxis, CHART_COLORS, gridBase, tooltipBase, valueAxis } from '../utils/charts';

type ModelType = 'poly1' | 'poly2' | 'poly3' | 'table' | 'segment';

const MODEL_LABEL: Record<ModelType, string> = {
  poly1: '零偏温度一阶多项式',
  poly2: '零偏温度二阶多项式',
  poly3: '零偏温度三阶多项式',
  table: '温度查表补偿',
  segment: '分段线性补偿',
};

export default function Modeling() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState('DEV-0001');
  const [model, setModel] = useState<ModelType>('poly2');
  const [temp, setTemp] = useState(25);
  const [compType, setCompType] = useState<'zero' | 'scale'>('zero');
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    deviceService.all().then((list) => setDevices(list));
  }, []);

  const device = devices.find((d) => d.id === deviceId);
  const bias = device?.specs.gyroBiasStability ?? 0.032;

  const points = useMemo(() => {
    const temps = [-40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70];
    return temps.map((t) => {
      const before = 0.021 + (t - 20) * 0.0016 + ((t - 20) ** 2) * 0.0000042 + Math.sin(t / 6) * 0.002;
      const residual = model === 'poly1' ? 0.006 : model === 'poly2' ? 0.0021 : model === 'poly3' ? 0.0012 : model === 'table' ? 0.0018 : 0.0032;
      const after = 0.021 + (t - 20) * 0.00008 + Math.sin(t / 5) * residual;
      return { t, before: Number(before.toFixed(4)), after: Number(after.toFixed(4)) };
    });
  }, [model, deviceId]);

  const maxBefore = Math.max(...points.map((p) => Math.abs(p.before)));
  const maxAfter = Math.max(...points.map((p) => Math.abs(p.after)));
  const improvement = ((maxBefore - maxAfter) / maxBefore) * 100;

  const curveOption = useMemo(
    () =>
      baseOption({
        grid: { ...gridBase, left: 52, right: 20, top: 32, bottom: 34 },
        tooltip: { ...tooltipBase, trigger: 'axis', valueFormatter: (v: unknown) => `${Number(v).toFixed(4)} °/h` },
        legend: { data: ['补偿前', '补偿后'], top: 0, left: 0, itemWidth: 10, itemHeight: 8, textStyle: { fontSize: 11 } },
        xAxis: categoryAxis(points.map((p) => `${p.t}℃`), '温度'),
        yAxis: valueAxis('零偏 (°/h)', { scale: true }),
        series: [
          { name: '补偿前', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: '#f5222d' }, data: points.map((p) => p.before) },
          { name: '补偿后', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: '#16a34a' }, data: points.map((p) => p.after) },
        ],
      }),
    [points],
  );

  const radarOption = useMemo(
    () =>
      baseOption({
        tooltip: { ...tooltipBase },
        radar: {
          indicator: [
            { name: '零偏', max: 100 },
            { name: '标度因数', max: 100 },
            { name: '噪声', max: 100 },
            { name: '温度漂移', max: 100 },
            { name: '动态误差', max: 100 },
          ],
          radius: '64%',
          center: ['50%', '54%'],
          axisName: { color: '#5a6577', fontSize: 11 },
          splitLine: { lineStyle: { color: '#eef2f7' } },
          splitArea: { areaStyle: { color: ['#ffffff', '#fafbfd'] } },
          axisLine: { lineStyle: { color: '#eef2f7' } },
        },
        series: [
          {
            type: 'radar',
            data: [
              { name: '补偿前', value: [62, 74, 68, 52, 66], areaStyle: { color: 'rgba(245,34,45,0.10)' }, lineStyle: { color: '#f5222d' }, itemStyle: { color: '#f5222d' } },
              { name: '补偿后', value: [88, 86, 82, 91, 84], areaStyle: { color: 'rgba(22,163,74,0.12)' }, lineStyle: { color: '#16a34a' }, itemStyle: { color: '#16a34a' } },
            ],
          },
        ],
        legend: { top: 0, left: 0, itemWidth: 10, itemHeight: 8, textStyle: { fontSize: 11 } },
      }),
    [],
  );

  const coefficients = useMemo(() => {
    const base = [
      { key: 'a0', name: 'a0（常数项）', value: 0.0210, unit: '°/h', ci: '±0.0006' },
      { key: 'a1', name: 'a1（一次项）', value: 0.00160, unit: '°/h/℃', ci: '±0.00012' },
      { key: 'a2', name: 'a2（二次项）', value: model === 'poly1' ? 0 : 0.0000042, unit: '°/h/℃²', ci: '±0.0000008' },
      { key: 'a3', name: 'a3（三次项）', value: model === 'poly3' ? 0.000000021 : 0, unit: '°/h/℃³', ci: '±0.000000004' },
    ];
    return base;
  }, [model]);

  const columns: ColumnsType<(typeof coefficients)[number]> = [
    { title: '系数', dataIndex: 'name' },
    { title: '数值', dataIndex: 'value', render: (v: number) => <span className="num">{v.toExponential(3)}</span> },
    { title: '单位', dataIndex: 'unit' },
    { title: '95% 置信区间', dataIndex: 'ci' },
  ];

  return (
    <div className="page">
      <PageHeader
        title="误差建模与补偿"
        description="基于温度循环标定数据拟合零偏与标度因数模型，评估补偿前后的残差改善"
        extra={<Tag bordered={false} color={applied ? 'success' : 'default'}>{applied ? '已应用到设备' : '模型未下发'}</Tag>}
      />

      <Panel>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select
            style={{ width: 240 }}
            value={deviceId}
            onChange={setDeviceId}
            showSearch
            optionFilterProp="label"
            options={devices.slice(0, 14).map((d) => ({ value: d.id, label: `${d.code} · ${d.model}` }))}
          />
          <Select
            style={{ width: 220 }}
            value={model}
            onChange={setModel}
            options={Object.entries(MODEL_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <span className="small muted">补偿温度点</span>
          <InputNumber min={-40} max={70} value={temp} onChange={(v) => setTemp(v ?? 25)} addonAfter="℃" style={{ width: 120 }} />
          <Radio.Group
            value={compType}
            onChange={(e) => setCompType(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            options={[{ value: 'zero', label: '零偏补偿' }, { value: 'scale', label: '标度因数补偿' }]}
          />
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              setApplied(true);
              message.success(`模型已下发到 ${device?.code ?? deviceId}，生效时间 2026-10-19 12:00`);
            }}
          >
            应用到设备
          </Button>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <StatCard label="补偿前最大零偏" value={maxBefore.toFixed(4)} unit="°/h" hint="−40 ℃ ~ +70 ℃ 全温区" color="#f5222d" />
        <StatCard label="补偿后最大零偏" value={maxAfter.toFixed(4)} unit="°/h" hint="模型预测" color="#16a34a" />
        <StatCard label="改善率" value={improvement.toFixed(1)} unit="%" hint="按最大偏差计算" color="#16a34a" />
        <StatCard label="残差标准差" value={(0.0012 + (model === 'poly1' ? 0.002 : 0)).toFixed(4)} unit="°/h" />
        <StatCard label="当前温度点" value={temp} unit="℃" hint={`补偿量 ${(0.0016 * (temp - 20) * 1000).toFixed(1)} ×10⁻³ °/h`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <ChartPanel title="补偿前后零偏对比" sub={MODEL_LABEL[model]} option={curveOption} height={320} filename="补偿对比" unitHint="单位：°/h" />
        <ChartPanel title="补偿效果评估" sub="五维评分" option={radarOption} height={320} filename="效果雷达" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <Panel title="模型系数" sub={MODEL_LABEL[model]}>
          <Table rowKey="key" size="small" columns={columns} dataSource={coefficients} pagination={false} />
          <div className="small muted" style={{ marginTop: 10, lineHeight: 1.8 }}>
            拟合样本：−40 / −20 / 0 / 20 / 40 / 60 / 70 ℃ 共 7 个温度点，每点 6 个位置，共 42 组观测；
            拟合优度 R² = 0.9968，残差 RMS = 0.0013 °/h。
          </div>
        </Panel>

        <Panel title="补偿残差统计">
          <table className="spec-table">
            <thead><tr><th>指标</th><th>补偿前</th><th>补偿后</th><th>改善</th></tr></thead>
            <tbody>
              <tr><th>均值</th><td className="value">0.0086</td><td className="value">0.0004</td><td className="over" style={{ color: '#16a34a' }}>−95.3%</td></tr>
              <tr><th>标准差</th><td className="value">0.0062</td><td className="value">0.0013</td><td style={{ color: '#16a34a' }}>−79.0%</td></tr>
              <tr><th>最大偏差</th><td className="value">{maxBefore.toFixed(4)}</td><td className="value">{maxAfter.toFixed(4)}</td><td style={{ color: '#16a34a' }}>−{improvement.toFixed(1)}%</td></tr>
              <tr><th>全温区极差</th><td className="value">0.0142</td><td className="value">0.0026</td><td style={{ color: '#16a34a' }}>−81.7%</td></tr>
            </tbody>
          </table>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['零偏温度模型 V3', '标度因数温度模型 V2', '安装误差补偿 V1'].map((tag) => (
              <Tag key={tag} bordered={false} color="blue">{tag}</Tag>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="模型版本" sub="可回滚至任一历史版本">
        <table className="spec-table">
          <thead><tr><th>版本</th><th>模型</th><th>创建时间</th><th>创建人</th><th>状态</th><th>说明</th><th>操作</th></tr></thead>
          <tbody>
            {[
              ['V3', '二阶多项式', '2026-10-15 10:20', '陈立', '启用', '新增 70 ℃ 高温点，改善低温段拟合'],
              ['V2', '二阶多项式', '2026-06-28 15:02', '陈立', '历史', '首次引入二次项'],
              ['V1', '一阶多项式', '2026-03-14 09:40', '张启明', '历史', '初始模型，仅覆盖 −20~60 ℃'],
            ].map((row) => (
              <tr key={row[0]}>
                <td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td>
                <td><Tag bordered={false} color={row[4] === '启用' ? 'success' : 'default'}>{row[4]}</Tag></td>
                <td className="muted">{row[5]}</td>
                <td><a onClick={() => message.success(`已切换到模型 ${row[0]}`)}>设为启用</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
