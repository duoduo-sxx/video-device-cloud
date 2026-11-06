import { useEffect, useMemo, useState } from 'react';
import { Button, Descriptions, Divider, Progress, Select, Space, Table, Tabs, Tag, Timeline, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowLeftOutlined, DownloadOutlined, ExperimentOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { calibrationService, deviceService, healthService } from '../services';
import type { CalibrationResult, CalibrationTask, Device, HealthRecord } from '../types/models';
import {
  CALIB_STATUS_COLOR,
  CALIB_STATUS_LABEL,
  CONCLUSION_LABEL,
  DEVICE_STATUS_COLOR,
  DEVICE_STATUS_LABEL,
  DEVICE_TYPE_LABEL,
  HEALTH_LEVEL_COLOR,
  HEALTH_LEVEL_LABEL,
} from '../constants/dict';
import { EChart } from '../components/EChart';
import { HealthRing, KeyValue, PageHeader, Panel, StatusTag } from '../components/ui';
import { baseOption, categoryAxis, gridBase, valueAxis } from '../utils/charts';
import { calibRemainDays, fmtDate, fmtDateTime } from '../utils/format';

const DOCUMENTS = [
  { name: '产品合格证.pdf', type: '合格证', size: '1.2 MB', date: '2025-03-14' },
  { name: 'IMU 使用说明书 V3.2.pdf', type: '说明书', size: '8.6 MB', date: '2025-03-14' },
  { name: '校准证书_2026.pdf', type: '校准证书', size: '2.4 MB', date: '2026-03-14' },
  { name: '上位机软件版本说明.txt', type: '软件说明', size: '18 KB', date: '2026-07-02' },
];

export default function DeviceDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [tasks, setTasks] = useState<CalibrationTask[]>([]);
  const [results, setResults] = useState<CalibrationResult[]>([]);
  const [health, setHealth] = useState<{ records: HealthRecord[] }>({ records: [] });
  const [compare, setCompare] = useState<string[]>([]);

  useEffect(() => {
    deviceService.detail(id).then((res) => setDevice(res ?? null));
    calibrationService.tasksOfDevice(id).then(setTasks);
    calibrationService.resultsOfDevice(id).then(setResults);
    healthService.detail(id).then((res) => setHealth({ records: res.records }));
  }, [id]);

  const remain = device ? calibRemainDays(device.calibrationValidUntil) : 0;

  const healthOption = useMemo(
    () =>
      baseOption({
        grid: { ...gridBase, left: 42, right: 16, top: 20, bottom: 26 },
        tooltip: { trigger: 'axis' },
        xAxis: categoryAxis(health.records.map((r) => r.date.slice(5)), ''),
        yAxis: valueAxis('健康分', { min: 40, max: 100 }),
        series: [
          {
            type: 'line',
            name: '健康分',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 2, color: '#1668dc' },
            areaStyle: { color: 'rgba(22,104,220,0.10)' },
            data: health.records.map((r) => r.score),
          },
        ],
      }),
    [health],
  );

  const specRows: { label: string; value: string; limit?: string; over?: boolean }[] = device
    ? [
        { label: '陀螺量程', value: `±${device.specs.gyroRange} °/s` },
        { label: '陀螺零偏稳定性', value: `${device.specs.gyroBiasStability.toFixed(4)} °/h`, limit: '≤ 0.05 °/h', over: device.specs.gyroBiasStability > 0.05 },
        { label: '陀螺零偏重复性', value: `${device.specs.gyroBiasRepeatability.toFixed(4)} °/h` },
        { label: '标度因数非线性', value: `${device.specs.gyroScaleNonlinearity} ppm`, limit: '≤ 50 ppm', over: device.specs.gyroScaleNonlinearity > 50 },
        { label: '角度随机游走', value: `${device.specs.arw.toFixed(4)} °/√h`, limit: '≤ 0.05 °/√h', over: device.specs.arw > 0.05 },
        { label: '加速度量程', value: `±${device.specs.accRange} g` },
        { label: '加速度零偏', value: `${device.specs.accBias.toFixed(2)} mg`, limit: '≤ 1.0 mg', over: device.specs.accBias > 1 },
        { label: '加速度非线性', value: `${device.specs.accScaleNonlinearity} ppm` },
        { label: '速度随机游走', value: `${device.specs.vrw.toFixed(3)} m/s/√h` },
        { label: '带宽', value: `${device.specs.bandwidth} Hz` },
        { label: '输出频率', value: `${device.specs.outputRate} Hz` },
        { label: '工作温度', value: `${device.specs.tempRange[0]} ℃ ~ +${device.specs.tempRange[1]} ℃` },
        { label: '供电 / 功耗', value: `${device.specs.voltage} V / ${device.specs.power} W` },
        { label: '重量 / 尺寸', value: `${device.specs.weight} kg / ${device.specs.dimensions}` },
      ]
    : [];

  const compareRows = useMemo(() => {
    if (compare.length !== 2) return [];
    const a = results.find((r) => r.id === compare[0]);
    const b = results.find((r) => r.id === compare[1]);
    if (!a || !b) return [];
    const rows = [
      { key: 'bx', name: '零偏 X', unit: '°/h', av: a.biases.x, bv: b.biases.x, digits: 4 },
      { key: 'by', name: '零偏 Y', unit: '°/h', av: a.biases.y, bv: b.biases.y, digits: 4 },
      { key: 'bz', name: '零偏 Z', unit: '°/h', av: a.biases.z, bv: b.biases.z, digits: 4 },
      { key: 'sx', name: '标度因数 X', unit: '', av: a.scaleFactors.x, bv: b.scaleFactors.x, digits: 6 },
      { key: 'sy', name: '标度因数 Y', unit: '', av: a.scaleFactors.y, bv: b.scaleFactors.y, digits: 6 },
      { key: 'sz', name: '标度因数 Z', unit: '', av: a.scaleFactors.z, bv: b.scaleFactors.z, digits: 6 },
      { key: 'r2', name: '拟合 R²', unit: '', av: a.residual.r2, bv: b.residual.r2, digits: 4 },
    ];
    return rows.map((row) => {
      const diff = row.bv - row.av;
      const rate = row.av === 0 ? 0 : (diff / Math.abs(row.av)) * 100;
      return { ...row, diff, rate };
    });
  }, [compare, results]);

  if (!device) {
    return (
      <div className="page">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/devices')}>返回列表</Button>
        <Panel><div className="muted">正在加载设备档案…</div></Panel>
      </div>
    );
  }

  const channelColumns: ColumnsType<Device['channels'][number]> = [
    { title: '通道', dataIndex: 'name', width: 80 },
    { title: '类型', dataIndex: 'type', render: (v) => ({ gyro: '陀螺', acc: '加速度计', temp: '温度', mag: '磁强计' }[v as string]) },
    { title: '敏感轴', dataIndex: 'axis', width: 80 },
    { title: '单位', dataIndex: 'unit', width: 80 },
    { title: '量程', dataIndex: 'range', width: 90, render: (v, r) => `±${v} ${r.unit}` },
    { title: '极性', dataIndex: 'polarity', width: 70, render: (v) => (v === 1 ? '正向' : '反向') },
    { title: '采样率', dataIndex: 'sampleRate', width: 90, render: (v) => `${v} Hz` },
  ];

  return (
    <div className="page">
      <PageHeader
        title={`${device.code} · ${device.model}`}
        description={`${device.name} · ${DEVICE_TYPE_LABEL[device.type]} · ${device.vendor}`}
        extra={
          <>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/devices')}>返回</Button>
            <Button icon={<ThunderboltOutlined />} onClick={() => navigate('/acquisition')}>开始采集</Button>
            <Button type="primary" icon={<ExperimentOutlined />} onClick={() => navigate('/calibration')}>新建标定</Button>
          </>
        }
      />

      <Panel>
        <div className="device-hero">
          <div className="device-thumb">
            <svg width="72" height="60" viewBox="0 0 72 60">
              <rect x="6" y="10" width="60" height="40" rx="4" fill="#e8f1fe" stroke="#85b7eb" strokeWidth="1.2" />
              <circle cx="20" cy="22" r="5" fill="none" stroke="#1668dc" strokeWidth="1.2" />
              <circle cx="20" cy="38" r="5" fill="none" stroke="#13c2c2" strokeWidth="1.2" />
              <circle cx="36" cy="30" r="5" fill="none" stroke="#722ed1" strokeWidth="1.2" />
              <path d="M46 20h14M46 30h14M46 40h14" stroke="#85b7eb" strokeWidth="1.2" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Space size={10} wrap>
              <StatusTag text={DEVICE_STATUS_LABEL[device.status]} color={DEVICE_STATUS_COLOR[device.status]} />
              <Tag bordered={false}>{device.grade} 级精度</Tag>
              {device.tags.map((tag) => <Tag key={tag} bordered={false} color="blue">{tag}</Tag>)}
            </Space>
            <div className="kv" style={{ marginTop: 12 }}>
              <dt>出厂编号</dt><dd className="mono">{device.serialNo}</dd>
              <dt>所在台位</dt><dd>{device.stationName ?? '库房'}</dd>
              <dt>责任人</dt><dd>{device.owner}</dd>
              <dt>入库日期</dt><dd>{device.inServiceAt}</dd>
            </div>
          </div>
          <div style={{ width: 220 }}>
            <div className="small muted">校准有效期</div>
            <div style={{ fontSize: 15, marginTop: 2 }} className="num">{device.calibrationValidUntil}</div>
            <Progress
              percent={Math.max(0, Math.min(100, (remain / 365) * 100))}
              size="small"
              showInfo={false}
              strokeColor={remain < 0 ? '#f5222d' : remain <= 30 ? '#faad14' : '#16a34a'}
              style={{ marginTop: 6 }}
            />
            <div className="small" style={{ color: remain < 0 ? '#f5222d' : remain <= 30 ? '#faad14' : '#8a94a6' }}>
              {remain < 0 ? `已过期 ${Math.abs(remain)} 天，请尽快安排复标` : `剩余 ${remain} 天`}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <HealthRing score={device.healthScore} size={78} />
            <div className="small" style={{ color: HEALTH_LEVEL_COLOR[device.healthLevel] }}>
              {HEALTH_LEVEL_LABEL[device.healthLevel]}
            </div>
          </div>
        </div>
      </Panel>

      <Panel flush>
        <Tabs
          style={{ padding: '4px 16px 16px' }}
          items={[
            {
              key: 'overview',
              label: '概览',
              children: (
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20 }}>
                  <div>
                    <Divider orientation="left" plain style={{ marginTop: 4 }}>关键指标</Divider>
                    <table className="spec-table">
                      <tbody>
                        {specRows.slice(0, 6).map((row) => (
                          <tr key={row.label}>
                            <th style={{ width: 160 }}>{row.label}</th>
                            <td className={row.over ? 'value over' : 'value'}>{row.value}{row.limit ? <span className="small muted">（{row.limit}）</span> : null}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <Divider orientation="left" plain>健康趋势</Divider>
                    <EChart option={healthOption} height={150} />
                  </div>
                  <div>
                    <Divider orientation="left" plain style={{ marginTop: 4 }}>最近标定</Divider>
                    {tasks.slice(0, 3).map((task) => (
                      <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px dashed #eef2f7' }}>
                        <div>
                          <div style={{ fontSize: 13 }}>{task.planName}</div>
                          <div className="small muted">{task.code} · {task.operator}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <StatusTag text={CALIB_STATUS_LABEL[task.status]} color={CALIB_STATUS_COLOR[task.status]} />
                          <div className="small muted" style={{ marginTop: 4 }}>{fmtDate(task.plannedStart)}</div>
                        </div>
                      </div>
                    ))}
                    <Divider orientation="left" plain>文档</Divider>
                    {DOCUMENTS.slice(0, 3).map((doc) => (
                      <div key={doc.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13 }}>
                        <span>{doc.name}</span>
                        <a onClick={() => message.success(`已开始下载 ${doc.name}`)}><DownloadOutlined /></a>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              key: 'specs',
              label: '技术指标',
              children: (
                <table className="spec-table">
                  <thead>
                    <tr><th style={{ width: 200 }}>指标项</th><th style={{ width: 220 }}>实测值</th><th>限值要求</th><th style={{ width: 120 }}>判定</th></tr>
                  </thead>
                  <tbody>
                    {specRows.map((row) => (
                      <tr key={row.label}>
                        <th>{row.label}</th>
                        <td className={row.over ? 'value over' : 'value'}>{row.value}</td>
                        <td className="muted">{row.limit ?? '—'}</td>
                        <td>{row.limit ? <StatusTag text={row.over ? '超差' : '合格'} color={row.over ? 'error' : 'success'} /> : <span className="muted">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ),
            },
            {
              key: 'channels',
              label: '通道配置',
              children: (
                <Table rowKey="id" size="small" pagination={false} columns={channelColumns} dataSource={device.channels} />
              ),
            },
            {
              key: 'history',
              label: `标定历史（${tasks.length}）`,
              children: (
                <div>
                  <div className="row-gap" style={{ marginBottom: 12 }}>
                    <span className="small muted">选择两次标定结果进行参数对比</span>
                    <Select
                      mode="multiple"
                      maxCount={2}
                      style={{ minWidth: 360 }}
                      placeholder="选择两条记录"
                      value={compare}
                      onChange={setCompare}
                      options={results.map((r) => ({
                        value: r.id,
                        label: `${fmtDate(r.createdAt)} · ${r.passed ? '合格' : '超差'}`,
                      }))}
                    />
                    <Button disabled={compare.length !== 2} type="primary" ghost>对比参数</Button>
                  </div>
                  {compare.length === 2 ? (
                    <table className="spec-table" style={{ marginBottom: 20 }}>
                      <thead>
                        <tr><th>参数</th><th>本次</th><th>上次</th><th>差值</th><th>变化率</th></tr>
                      </thead>
                      <tbody>
                        {compareRows.map((row) => {
                          const over = Math.abs(row.rate) > 5;
                          return (
                            <tr key={row.key}>
                              <th>{row.name}</th>
                              <td className="value">{row.bv.toFixed(row.digits)} {row.unit}</td>
                              <td className="value">{row.av.toFixed(row.digits)} {row.unit}</td>
                              <td className={over ? 'value over' : 'value'}>{row.diff >= 0 ? '+' : ''}{row.diff.toFixed(row.digits)}</td>
                              <td className={over ? 'over' : ''}>{row.rate >= 0 ? '+' : ''}{row.rate.toFixed(2)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : null}
                  <Timeline
                    items={tasks.map((task) => ({
                      color: task.conclusion === 'PASS' ? 'green' : task.conclusion === 'FAIL' ? 'red' : 'blue',
                      children: (
                        <div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: 13 }}>{task.code}</strong>
                            <StatusTag text={CALIB_STATUS_LABEL[task.status]} color={CALIB_STATUS_COLOR[task.status]} />
                            <StatusTag text={CONCLUSION_LABEL[task.conclusion]} color={task.conclusion === 'PASS' ? 'success' : task.conclusion === 'FAIL' ? 'error' : 'default'} />
                            <span className="small muted">{task.planName}</span>
                          </div>
                          <div className="small muted" style={{ marginTop: 4 }}>
                            执行人 {task.operator} · 审核人 {task.reviewer} · {fmtDateTime(task.plannedStart)}
                          </div>
                          {task.remark ? <div className="small" style={{ color: '#a8071a', marginTop: 2 }}>备注：{task.remark}</div> : null}
                          {task.resultId ? (
                            <Button type="link" size="small" style={{ paddingLeft: 0 }} onClick={() => navigate(`/calibration/${task.id}/result`)}>查看结果</Button>
                          ) : null}
                        </div>
                      ),
                    }))}
                  />
                </div>
              ),
            },
            {
              key: 'trials',
              label: '试验记录',
              children: (
                <table className="spec-table">
                  <thead><tr><th>任务号</th><th>方案</th><th>台位</th><th>执行人</th><th>计划时间</th><th>进度</th><th>状态</th></tr></thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id}>
                        <td>{task.code}</td>
                        <td>{task.planName}</td>
                        <td>{task.stationName}</td>
                        <td>{task.operator}</td>
                        <td>{fmtDateTime(task.plannedStart)}</td>
                        <td style={{ width: 140 }}><Progress percent={task.progress} size="small" /></td>
                        <td><StatusTag text={CALIB_STATUS_LABEL[task.status]} color={CALIB_STATUS_COLOR[task.status]} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ),
            },
            {
              key: 'docs',
              label: '文档',
              children: (
                <table className="spec-table">
                  <thead><tr><th>文件名</th><th>类型</th><th>大小</th><th>上传日期</th><th>操作</th></tr></thead>
                  <tbody>
                    {DOCUMENTS.map((doc) => (
                      <tr key={doc.name}>
                        <td>{doc.name}</td>
                        <td>{doc.type}</td>
                        <td>{doc.size}</td>
                        <td>{doc.date}</td>
                        <td><a onClick={() => message.success(`已开始下载 ${doc.name}`)}>下载</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ),
            },
            {
              key: 'lifecycle',
              label: '生命周期',
              children: (
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="入库">{device.inServiceAt}</Descriptions.Item>
                  <Descriptions.Item label="首次标定">{device.calibratedAt}</Descriptions.Item>
                  <Descriptions.Item label="最近标定">
                    {results[0] ? fmtDate(results[0].createdAt) : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="累计标定次数">{tasks.filter((t) => t.status === 'COMPLETED').length} 次</Descriptions.Item>
                  <Descriptions.Item label="累计运行时长">3,842 h</Descriptions.Item>
                  <Descriptions.Item label="维修记录">1 次（2026-05 更换电源模块）</Descriptions.Item>
                  <Descriptions.Item label="当前状态" span={2}>
                    <StatusTag text={DEVICE_STATUS_LABEL[device.status]} color={DEVICE_STATUS_COLOR[device.status]} />
                    <span className="muted" style={{ marginLeft: 8 }}>最近更新 2026-10-18 16:20</span>
                  </Descriptions.Item>
                </Descriptions>
              ),
            },
          ]}
        />
      </Panel>

      <Panel title="设备档案信息" sub="基础信息与责任人">
        <KeyValue
          columns={2}
          items={[
            { label: '设备编号', value: device.code },
            { label: '设备类型', value: DEVICE_TYPE_LABEL[device.type] },
            { label: '型号', value: device.model },
            { label: '厂家', value: device.vendor },
            { label: '出厂日期', value: device.manufacturedAt },
            { label: '精度等级', value: `${device.grade} 级` },
            { label: '备注', value: device.remark ?? '—' },
            { label: '标签', value: device.tags.join('、') },
          ]}
        />
      </Panel>
    </div>
  );
}
