import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Descriptions,
  Modal,
  Progress,
  Result,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  StopOutlined,
} from '@ant-design/icons';
import ChartCard from '../../components/ChartCard';
import StatusTag from '../../components/StatusTag';
import { taskService } from '../../services';
import type { TransferTask } from '../../types';
import { genSpeedSeries } from '../../mock/charts';
import { axisLabelStyle, chartTooltip, splitLineStyle } from '../../theme/chart';
import {
  copyText,
  formatBytes,
  formatDateTime,
  formatDuration,
  formatSpeed,
} from '../../utils/format';
import { toast } from '../../utils/feedback';

interface FileRow {
  key: string;
  name: string;
  size: number;
  status: '已完成' | '传输中' | '待传输' | '校验失败';
  checksum: string;
  cost: string;
}

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<TransferTask | undefined>();
  const [loading, setLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [logLevel, setLogLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');

  useEffect(() => {
    if (!id) return;
    void taskService.get(id).then((data) => {
      setTask(data);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!task || task.status !== 'running') return;
    const timer = setInterval(() => {
      setTask((prev) => {
        if (!prev) return prev;
        const nextProgress = Math.min(100, prev.progress + (0.3 + Math.random() * 0.7));
        const speed = Math.round(prev.speedBps * (0.9 + Math.random() * 0.2));
        const transferred = Math.round((prev.totalSize * nextProgress) / 100);
        if (nextProgress >= 100) {
          return {
            ...prev,
            progress: 100,
            transferredSize: prev.totalSize,
            speedBps: 0,
            status: 'success',
            finishedAt: new Date().toISOString(),
          };
        }
        return {
          ...prev,
          progress: Number(nextProgress.toFixed(1)),
          transferredSize: transferred,
          speedBps: speed,
          etaSec: speed > 0 ? Math.round((prev.totalSize - transferred) / speed) : prev.etaSec,
        };
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [task?.status, task?.id]);

  const files: FileRow[] = useMemo(() => {
    if (!task) return [];
    const suffixes = ['.parquet', '.csv', '.jsonl', '.tar.gz', '.orc'];
    return Array.from({ length: 12 }).map((_, i) => {
      const size = Math.round((task.totalSize / 14) * (0.4 + ((i * 13) % 9) / 10));
      const ratio = task.progress / 100;
      const status: FileRow['status'] =
        ratio >= 1
          ? '已完成'
          : (i + 1) / 12 < ratio
            ? '已完成'
            : (i + 1) / 12 - 1 / 12 < ratio
              ? '传输中'
              : task.status === 'failed' && i === 7
                ? '校验失败'
                : '待传输';
      return {
        key: `${task.id}-${i}`,
        name: `part-${String(i).padStart(5, '0')}${suffixes[i % suffixes.length]}`,
        size,
        status,
        checksum: `${task.id.slice(-4)}a9f${i}c${Math.random().toString(16).slice(2, 10)}`,
        cost: status === '已完成' ? `${(size / 1024 ** 2 / 80).toFixed(1)}s` : '—',
      };
    });
  }, [task?.id, task?.progress, task?.status]);

  const logs = useMemo(() => {
    if (!task) return [];
    const base = [
      { level: 'INFO', msg: `任务 ${task.id} 初始化完成，加载策略 ${task.policyName}` },
      { level: 'INFO', msg: `建立通道 ${task.channelId} 连接，协议 ${task.source.protocol}，加密 TLS 1.3` },
      { level: 'INFO', msg: `源路径 ${task.source.path} 扫描到 ${task.fileCount} 个待传输对象` },
      { level: 'INFO', msg: `分片大小 ${64}MB，并发 ${16}，已启用断点续传` },
      { level: 'WARN', msg: '目标节点瞬时写入延迟升高至 186ms，已自动降低并发至 12' },
      { level: 'INFO', msg: '断点续传检查点已写入，offset=48.2%' },
      { level: 'INFO', msg: `已传输 ${formatBytes(task.transferredSize)}，平均速率 ${formatSpeed(task.speedBps || 320 * 1024 * 1024)}` },
      { level: task.status === 'failed' ? 'ERROR' : 'INFO', msg: task.errorMessage ?? '分片校验通过，SHA-256 与源端一致' },
    ];
    return base.filter((l) => logLevel === 'ALL' || l.level === logLevel);
  }, [task?.id, logLevel, task?.status]);

  if (!loading && !task) {
    return (
      <div className="page">
        <Result
          status="404"
          title="任务不存在"
          subTitle="该任务可能已被删除，或链接已失效。"
          extra={
            <Button type="primary" onClick={() => navigate('/tasks')}>
              返回任务列表
            </Button>
          }
        />
      </div>
    );
  }

  const change = async (status: TransferTask['status'], label: string) => {
    if (!task) return;
    const updated = await taskService.setStatus(task.id, status);
    if (updated) setTask(updated);
    toast.success(`任务已${label}`);
  };

  const speedChart = genSpeedSeries(60, Math.max(120, Math.round((task?.speedBps ?? 320 * 1024 * 1024) / 1024 / 1024)));

  const lineOption = {
    grid: { left: 6, right: 12, top: 20, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis' as const, ...chartTooltip, valueFormatter: (v: unknown) => `${v} MB/s` },
    xAxis: {
      type: 'category' as const,
      data: speedChart.labels,
      boundaryGap: false,
      axisLabel: { ...axisLabelStyle, interval: 9 },
      axisLine: { lineStyle: { color: '#E9EEF6' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { ...axisLabelStyle, formatter: '{value} MB/s' },
      splitLine: splitLineStyle,
      axisLine: { show: false },
    },
    series: [
      {
        type: 'line' as const,
        data: speedChart.values,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: '#1668FF' },
        areaStyle: { color: 'rgba(22,104,255,0.10)' },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#F59E0B', type: 'dashed' as const },
          label: { formatter: '平均速率', color: '#F59E0B', fontSize: 11 },
          data: [{ yAxis: Math.round(speedChart.values.reduce((a, b) => a + b, 0) / speedChart.values.length) }],
        },
      },
    ],
  };

  const fileColumns: ColumnsType<FileRow> = [
    { title: '文件名', dataIndex: 'name', render: (v) => <span className="mono">{v}</span> },
    { title: '大小', dataIndex: 'size', width: 120, render: (v) => <span className="num">{formatBytes(v)}</span> },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (v: string) => {
        const color = v === '已完成' ? '#00B894' : v === '传输中' ? '#1668FF' : v === '校验失败' ? '#EF4444' : '#8A99B0';
        return <Tag style={{ color, background: `${color}14`, borderColor: `${color}33`, marginInlineEnd: 0 }}>{v}</Tag>;
      },
    },
    { title: 'SHA-256', dataIndex: 'checksum', width: 220, render: (v) => <span className="mono" style={{ color: '#8A99B0' }}>{v}</span> },
    { title: '耗时', dataIndex: 'cost', width: 90 },
  ];

  return (
    <div className="page">
      <div style={{ marginBottom: 14 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')} style={{ paddingLeft: 0 }}>
          返回任务列表
        </Button>
      </div>

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="page-title">{task?.name ?? '加载中…'}</h1>
            {task ? <StatusTag status={task.status} /> : null}
            <span className="mono" style={{ fontSize: 12, color: '#8A99B0' }}>
              {task?.id}
              <CopyOutlined
                style={{ marginLeft: 6, cursor: 'pointer' }}
                onClick={() => {
                  if (task) void copyText(task.id).then((ok) => (ok ? toast.success('任务 ID 已复制') : toast.error('复制失败')));
                }}
              />
            </span>
          </div>
          <div className="page-desc">
            创建于 {formatDateTime(task?.createdAt)} · 创建人 {task?.creator} · 通道 {task?.channelName}
          </div>
        </div>
        <div className="page-extra">
          {task?.status === 'running' ? (
            <Button icon={<PauseCircleOutlined />} onClick={() => change('paused', '暂停')}>
              暂停
            </Button>
          ) : null}
          {task?.status === 'paused' ? (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => change('running', '恢复')}>
              恢复
            </Button>
          ) : null}
          {task?.status === 'failed' ? (
            <Button type="primary" icon={<RedoOutlined />} onClick={() => change('running', '重新投递')}>
              立即重试
            </Button>
          ) : null}
          <Button icon={<CopyOutlined />} onClick={() => navigate('/tasks/new')}>
            复制新建
          </Button>
          <Button
            danger
            icon={<StopOutlined />}
            onClick={() =>
              Modal.confirm({
                title: '取消该任务？',
                content: '已传输的分片会保留，可稍后重新投递。',
                okText: '确认取消',
                cancelText: '再想想',
                onOk: () => change('canceled', '取消'),
              })
            }
          >
            取消
          </Button>
        </div>
      </div>

      {task?.status === 'failed' ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={`传输失败 · ${task.errorCode}`}
          description={
            <div className="flex-between">
              <span>{task.errorMessage}。建议检查通道健康度，或切换至备用通道后重试。</span>
              <Button size="small" type="primary" danger onClick={() => change('running', '重新投递')}>
                重试
              </Button>
            </div>
          }
        />
      ) : null}

      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
          <Progress
            type="circle"
            percent={task?.progress ?? 0}
            size={132}
            strokeWidth={9}
            strokeColor={task?.status === 'failed' ? '#EF4444' : task?.status === 'success' ? '#00B894' : '#1668FF'}
            format={(p) => (
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#0F172A' }}>{p}%</div>
                <div style={{ fontSize: 11, color: '#8A99B0', marginTop: 2 }}>传输进度</div>
              </div>
            )}
          />
          <div style={{ flex: 1, minWidth: 480 }}>
            <div className="grid grid-4" style={{ gap: 20 }}>
              {[
                { label: '已传数据', value: formatBytes(task?.transferredSize ?? 0) },
                { label: '数据总量', value: formatBytes(task?.totalSize ?? 0) },
                { label: '文件数', value: `${(task?.fileCount ?? 0).toLocaleString()} 个` },
                { label: '平均速率', value: formatSpeed(task?.speedBps ?? 0) },
                { label: '已用时长', value: formatDuration(task?.durationSec) },
                { label: '预计剩余', value: formatDuration(task?.etaSec) },
                { label: '重试次数', value: `${task?.retryCount ?? 0} 次` },
                { label: '校验方式', value: task?.checksum ?? '—' },
              ].map((m) => (
                <div key={m.label}>
                  <div style={{ fontSize: 11.5, color: '#8A99B0' }}>{m.label}</div>
                  <div className="num" style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-main-3" style={{ marginBottom: 16 }}>
        <ChartCard title="实时传输速率" sub="近 60 分钟 · 每 10 秒采样" option={lineOption} height={260} />
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">任务配置快照</div>
          </div>
          <Descriptions column={1} size="small" labelStyle={{ color: '#8A99B0', width: 84 }} contentStyle={{ fontSize: 12.5 }}>
            <Descriptions.Item label="策略">{task?.policyName}</Descriptions.Item>
            <Descriptions.Item label="调度">
              {task?.schedule === 'cron' ? '周期执行' : task?.schedule === 'scheduled' ? '定时执行' : '立即执行'}
            </Descriptions.Item>
            <Descriptions.Item label="优先级">{task?.priority === 'high' ? '高' : task?.priority === 'low' ? '低' : '中'}</Descriptions.Item>
            <Descriptions.Item label="标签">
              {(task?.tags ?? []).map((t) => (
                <Tag key={t} style={{ marginInlineEnd: 4, fontSize: 10.5 }}>
                  {t}
                </Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="源路径">
              <span className="mono" style={{ fontSize: 11.5 }}>
                {task?.source.path}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="目标路径">
              <span className="mono" style={{ fontSize: 11.5 }}>
                {task?.target.path}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>

      <div className="panel" style={{ paddingTop: 8 }}>
        <Tabs
          items={[
            {
              key: 'files',
              label: `文件列表（${files.length}）`,
              children: (
                <Table<FileRow>
                  rowKey="key"
                  size="small"
                  columns={fileColumns}
                  dataSource={files}
                  pagination={{ pageSize: 8, size: 'small' }}
                />
              ),
            },
            {
              key: 'logs',
              label: '传输日志',
              children: (
                <div>
                  <div className="toolbar" style={{ marginBottom: 12 }}>
                    <Space size={4}>
                      {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((lv) => (
                        <Tag
                          key={lv}
                          onClick={() => setLogLevel(lv)}
                          style={{
                            cursor: 'pointer',
                            marginInlineEnd: 0,
                            color: logLevel === lv ? '#1668FF' : '#5A6B87',
                            borderColor: logLevel === lv ? '#1668FF' : '#E9EEF6',
                            background: logLevel === lv ? '#F0F6FF' : '#fff',
                          }}
                        >
                          {lv}
                        </Tag>
                      ))}
                    </Space>
                    <div className="toolbar-right">
                      <span style={{ fontSize: 12, color: '#8A99B0' }}>自动滚动</span>
                      <Switch size="small" checked={autoScroll} onChange={setAutoScroll} />
                      <Button
                        size="small"
                        onClick={() => {
                          void copyText(logs.map((l) => `[${l.level}] ${l.msg}`).join('\n')).then((ok) =>
                            ok ? toast.success('日志已复制') : toast.error('复制失败'),
                          );
                        }}
                      >
                        复制全部
                      </Button>
                    </div>
                  </div>
                  <div className="log-view" style={{ height: 320 }}>
                    {logs.map((l, i) => (
                      <div className="log-line" key={i}>
                        <span className="log-time">{new Date(Date.now() - (logs.length - i) * 60000).toLocaleTimeString('zh-CN', { hour12: false })}</span>
                        <span className={`log-level ${l.level}`}>{l.level}</span>
                        <span>{l.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              key: 'config',
              label: '配置信息',
              children: (
                <Descriptions column={2} bordered size="small" labelStyle={{ width: 140, background: '#FAFBFD', color: '#5A6B87' }}>
                  <Descriptions.Item label="源节点">
                    {task?.source.nodeName}（{task?.source.region}）
                  </Descriptions.Item>
                  <Descriptions.Item label="目标节点">
                    {task?.target.nodeName}（{task?.target.region}）
                  </Descriptions.Item>
                  <Descriptions.Item label="协议">{task?.source.protocol}</Descriptions.Item>
                  <Descriptions.Item label="通道">{task?.channelName}</Descriptions.Item>
                  <Descriptions.Item label="源路径" span={2}>
                    <span className="mono">{task?.source.path}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="目标路径" span={2}>
                    <span className="mono">{task?.target.path}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="开始时间">{formatDateTime(task?.startedAt)}</Descriptions.Item>
                  <Descriptions.Item label="完成时间">{formatDateTime(task?.finishedAt)}</Descriptions.Item>
                  <Descriptions.Item label="校验方式">{task?.checksum}</Descriptions.Item>
                  <Descriptions.Item label="所属空间">{task?.workspaceId ?? '未归属'}</Descriptions.Item>
                </Descriptions>
              ),
            },
          ]}
        />
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: '#A3B0C4', display: 'flex', alignItems: 'center', gap: 6 }}>
        <CheckCircleOutlined style={{ color: '#00B894' }} />
        页面每 2 秒同步一次任务进度，离开页面后停止刷新。
      </div>
    </div>
  );
}
