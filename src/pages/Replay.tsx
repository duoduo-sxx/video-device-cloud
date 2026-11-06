import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Select, Slider, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PauseCircleOutlined, PlayCircleOutlined, StepBackwardOutlined, StepForwardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { dataFileService } from '../services';
import type { DataFile } from '../types/models';
import { ChartPanel } from '../components/ChartPanel';
import { PageHeader, Panel, StatusTag } from '../components/ui';
import { baseOption, CHART_COLORS, gridBase, tooltipBase, valueAxis } from '../utils/charts';
import { generateTelemetry } from '../utils/signal';
import { fileSize, fmtDateTime } from '../utils/format';

export default function Replay() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<DataFile[]>([]);
  const [keyword, setKeyword] = useState('');
  const [fileId, setFileId] = useState<string>();
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    dataFileService.all().then((list) => {
      setFiles(list);
      setFileId(list[0]?.id);
    });
  }, []);

  const file = files.find((f) => f.id === fileId);
  const filtered = files.filter((f) => !keyword || f.code.includes(keyword) || f.deviceCode.includes(keyword));

  const telemetry = useMemo(() => generateTelemetry({ seed: 777, count: 900, seconds: file?.duration ?? 600 }), [file]);
  const duration = Math.round((file?.duration ?? 600));
  const current = Math.floor((position / 100) * (telemetry.t.length - 1));
  const currentTime = telemetry.t[current] ?? 0;

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      setPosition((p) => {
        const next = p + 0.45 * speed;
        return next >= 100 ? 0 : next;
      });
    }, 200);
    return () => clearInterval(timer);
  }, [playing, speed]);

  const gyroOption = useMemo(
    () =>
      baseOption({
        grid: { ...gridBase, left: 50, right: 20, top: 30, bottom: 28 },
        tooltip: { ...tooltipBase, trigger: 'axis', valueFormatter: (v: unknown) => `${Number(v).toFixed(3)} °/s` },
        legend: { data: ['Gx', 'Gy', 'Gz'], top: 0, left: 0, itemWidth: 10, itemHeight: 8, textStyle: { fontSize: 11 } },
        xAxis: { type: 'category', boundaryGap: false, data: telemetry.t.map((t) => t.toFixed(0)), axisLabel: { color: '#8a94a6', fontSize: 10, interval: 120 }, axisLine: { lineStyle: { color: '#dfe5ee' } }, axisTick: { show: false } },
        yAxis: valueAxis('°/s', { scale: true }),
        series: (['gx', 'gy', 'gz'] as const).map((key, i) => ({
          name: key.toUpperCase(),
          type: 'line' as const,
          showSymbol: false,
          lineStyle: { width: 1.1, color: CHART_COLORS[i] },
          data: telemetry[key],
          markLine: i === 0 ? { silent: true, symbol: 'none', lineStyle: { color: '#f5222d', width: 1.4 }, label: { show: false }, data: [{ xAxis: String(Math.round(currentTime)) }] } : undefined,
        })),
      }),
    [telemetry, currentTime],
  );

  const accOption = useMemo(
    () =>
      baseOption({
        grid: { ...gridBase, left: 50, right: 20, top: 30, bottom: 28 },
        tooltip: { ...tooltipBase, trigger: 'axis', valueFormatter: (v: unknown) => `${Number(v).toFixed(4)} g` },
        legend: { data: ['Ax', 'Ay', 'Az'], top: 0, left: 0, itemWidth: 10, itemHeight: 8, textStyle: { fontSize: 11 } },
        xAxis: { type: 'category', boundaryGap: false, data: telemetry.t.map((t) => t.toFixed(0)), axisLabel: { color: '#8a94a6', fontSize: 10, interval: 120 }, axisLine: { lineStyle: { color: '#dfe5ee' } }, axisTick: { show: false } },
        yAxis: valueAxis('g', { scale: true }),
        series: (['ax', 'ay', 'az'] as const).map((key, i) => ({
          name: key.toUpperCase(),
          type: 'line' as const,
          showSymbol: false,
          lineStyle: { width: 1.1, color: CHART_COLORS[i + 1] },
          data: telemetry[key],
        })),
      }),
    [telemetry],
  );

  const columns: ColumnsType<DataFile> = [
    { title: '文件编号', dataIndex: 'code', width: 168, render: (v: string) => <span className="mono small">{v}</span> },
    { title: '设备', dataIndex: 'deviceCode', width: 132 },
    { title: '采集时间', dataIndex: 'startedAt', width: 160, render: (v: string) => fmtDateTime(v) },
    { title: '时长', dataIndex: 'duration', width: 88, render: (v: number) => `${Math.round(v / 60)} min` },
    { title: '采样率', dataIndex: 'sampleRate', width: 88, render: (v: number) => `${v} Hz` },
    { title: '大小', dataIndex: 'sizeMB', width: 92, render: (v: number) => fileSize(v) },
    { title: '标签', dataIndex: 'tags', render: (v: string[]) => <>{v.map((t) => <Tag key={t} bordered={false}>{t}</Tag>)}</> },
    {
      title: '操作',
      width: 90,
      render: (_, record) => <Button type="link" size="small" onClick={() => { setFileId(record.id); setPosition(0); setPlaying(false); }}>回放</Button>,
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="数据回放"
        description="按时间轴还原采集现场，支持多通道联动、倍速播放与事件标记跳转"
        extra={<Button onClick={() => navigate('/analysis')}>转入分析</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500 }} className="mono">{file?.code ?? '未选择文件'}</div>
                <div className="small muted" style={{ marginTop: 2 }}>
                  {file ? `${file.deviceCode} · ${fmtDateTime(file.startedAt)} · ${Math.round(file.duration / 60)} min · ${file.sampleRate} Hz · ${file.channels} 通道` : '请选择左侧数据文件'}
                </div>
              </div>
              <div className="row-gap">
                <StatusTag text={playing ? '回放中' : '已暂停'} color={playing ? 'processing' : 'default'} />
                <Tag bordered={false}>{speed}×</Tag>
                <Button icon={<StepBackwardOutlined />} onClick={() => setPosition(Math.max(0, position - 2))} />
                <Button
                  type="primary"
                  icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={() => setPlaying((p) => !p)}
                >
                  {playing ? '暂停' : '播放'}
                </Button>
                <Button icon={<StepForwardOutlined />} onClick={() => setPosition(Math.min(100, position + 2))} />
                <Select
                  size="middle"
                  value={speed}
                  onChange={setSpeed}
                  style={{ width: 88 }}
                  options={[0.5, 1, 2, 4, 8].map((v) => ({ value: v, label: `${v}×` }))}
                />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <Slider
                value={position}
                onChange={setPosition}
                tooltip={{ formatter: () => `${((position / 100) * duration).toFixed(1)} s` }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8a94a6' }} className="num">
                <span>{currentTime.toFixed(1)} s</span>
                <span>总时长 {duration} s</span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {file?.events.map((event) => (
                  <Tag
                    key={`${event.t}-${event.label}`}
                    color={event.type === 'ALARM' ? 'red' : 'blue'}
                    bordered={false}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setPosition((event.t / (file.duration || 1)) * 100)}
                  >
                    {event.label} @ {event.t}s
                  </Tag>
                ))}
              </div>
            </div>
          </Panel>

          <ChartPanel title="陀螺三轴" sub="共享时间轴 · 红线为当前时刻" option={gyroOption} height={230} filename="回放-陀螺" unitHint="单位：°/s" />
          <ChartPanel title="加速度三轴" sub="共享时间轴" option={accOption} height={210} filename="回放-加速度" unitHint="单位：g" />

          <Panel title="当前时刻读数" sub={`t = ${currentTime.toFixed(1)} s`}>
            <div className="metric-row">
              <div className="metric-mini"><div className="label">Gx</div><div className="value">{telemetry.gx[current]?.toFixed(3)}</div></div>
              <div className="metric-mini"><div className="label">Gy</div><div className="value">{telemetry.gy[current]?.toFixed(3)}</div></div>
              <div className="metric-mini"><div className="label">Gz</div><div className="value">{telemetry.gz[current]?.toFixed(3)}</div></div>
              <div className="metric-mini"><div className="label">Ax</div><div className="value">{telemetry.ax[current]?.toFixed(4)}</div></div>
              <div className="metric-mini"><div className="label">Ay</div><div className="value">{telemetry.ay[current]?.toFixed(4)}</div></div>
              <div className="metric-mini"><div className="label">Az</div><div className="value">{telemetry.az[current]?.toFixed(4)}</div></div>
            </div>
          </Panel>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="数据文件" sub={`${files.length} 个`}>
            <Input.Search placeholder="文件号 / 设备编号" allowClear value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ marginBottom: 10 }} />
            <div style={{ maxHeight: 380, overflow: 'auto' }}>
              {filtered.slice(0, 40).map((f) => (
                <div
                  key={f.id}
                  onClick={() => { setFileId(f.id); setPosition(0); setPlaying(false); }}
                  style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: f.id === fileId ? '#f0f8ff' : undefined, marginBottom: 2 }}
                >
                  <div className="mono small">{f.code}</div>
                  <div className="small muted">{f.deviceCode} · {Math.round(f.duration / 60)} min · {fileSize(f.sizeMB)}</div>
                </div>
              ))}
            </div>
            <Button block style={{ marginTop: 8 }} onClick={() => message.success('已导出选中片段（模拟）')}>导出当前片段</Button>
          </Panel>

          <Panel title="文件元数据">
            <div className="kv">
              <dt>文件编号</dt><dd className="mono small">{file?.code ?? '—'}</dd>
              <dt>关联任务</dt><dd className="mono small">{file?.taskId ?? '—'}</dd>
              <dt>通道数</dt><dd>{file?.channels ?? 0} 路</dd>
              <dt>文件格式</dt><dd>{file?.format ?? '—'}</dd>
              <dt>文件大小</dt><dd>{file ? fileSize(file.sizeMB) : '—'}</dd>
              <dt>标签</dt><dd>{file?.tags.join('、') ?? '—'}</dd>
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="全部数据文件" sub="按采集时间倒序" flush>
        <Table
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={filtered.slice(0, 20)}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          onRow={(record) => ({ onClick: () => { setFileId(record.id); setPosition(0); setPlaying(false); } })}
        />
      </Panel>
    </div>
  );
}
