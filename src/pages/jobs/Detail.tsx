import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Descriptions,
  Empty,
  Progress,
  Space,
  Table,
  Tag,
  Timeline,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { PageHeader, StatusTag } from '../../components/base';
import ChartCard from '../../components/ChartCard';
import EChart from '../../charts/EChart';
import AuthGuard from '../../components/AuthGuard';
import { useDataStore } from '../../store/dataStore';
import { JOB_STATUS, PRIORITY, STORAGE_TYPE } from '../../constants/dict';
import { fmtBytes, fmtCountdown, fmtSpeed, fmtTime } from '../../utils/format';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const job = useDataStore((s) => s.jobs.find((j) => j.id === id));
  const policies = useDataStore((s) => s.policies);
  const updateJob = useDataStore((s) => s.updateJob);

  const rateSeries = useMemo(() => {
    if (!job) return [];
    return Array.from({ length: 60 }).map((_, i) => ({
      time: `${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
      value: Math.max(0, job.speedBps / 1e6 * (0.86 + Math.sin(i / 4) * 0.1 + (i % 11 === 0 ? -0.08 : 0))),
    }));
  }, [job]);

  if (!job) {
    return (
      <div className="cf-card" style={{ padding: 60 }}>
        <Empty description="任务不存在或已被删除" />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="primary" onClick={() => navigate('/jobs')}>
            返回任务列表
          </Button>
        </div>
      </div>
    );
  }

  const rateOption = {
    grid: { left: 4, right: 8, top: 24, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', boundaryGap: false, data: rateSeries.map((p) => p.time), axisLabel: { interval: 9 } },
    yAxis: { type: 'value', name: 'MB/s', splitLine: { show: true } },
    series: [
      {
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: rateSeries.map((p) => Number(p.value.toFixed(1))),
        areaStyle: { opacity: 0.12 },
      },
    ],
  };

  const shardBuckets = Array.from({ length: 12 }).map((_, i) => ({
    label: `${String(i * 5).padStart(2, '0')}m`,
    done: 40 + Math.round(Math.sin(i) * 12) + i * 2,
    running: 4 + (i % 4),
    failed: i === 3 ? 6 : i === 8 ? 3 : i % 5 === 0 ? 1 : 0,
  }));

  const shardOption = {
    grid: { left: 4, right: 8, top: 30, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { right: 0, top: 0 },
    xAxis: { type: 'category', data: shardBuckets.map((b) => b.label) },
    yAxis: { type: 'value', name: '分片数', splitLine: { show: true } },
    series: [
      { name: '已完成', type: 'bar', stack: 's', data: shardBuckets.map((b) => b.done), itemStyle: { color: '#16A34A' } },
      { name: '传输中', type: 'bar', stack: 's', data: shardBuckets.map((b) => b.running), itemStyle: { color: '#2563EB' } },
      { name: '失败重试', type: 'bar', stack: 's', data: shardBuckets.map((b) => b.failed), itemStyle: { color: '#DC2626' } },
    ],
  };

  const stages = [
    { name: '排队等待', done: true, cost: '38 秒' },
    { name: '建立连接', done: true, cost: '1.2 秒' },
    { name: '元数据扫描', done: true, cost: '2 分 14 秒' },
    { name: '数据分片', done: job.progress > 5, cost: '46 秒' },
    { name: '并行传输', done: job.progress >= 100, cost: '进行中' },
    { name: '完整性校验', done: job.progress >= 100, cost: '—' },
    { name: '任务完成', done: job.status === 'success', cost: '—' },
  ];

  const failedShards = [
    { key: '1', shard: 'SH-0281', size: 64 * 1024 ** 2, retry: 3, code: 'E5031', msg: '连接被对端重置（connection reset by peer）' },
    { key: '2', shard: 'SH-0642', size: 64 * 1024 ** 2, retry: 2, code: 'E4210', msg: '分片校验不一致，已触发重新分片' },
    { key: '3', shard: 'SH-1108', size: 32 * 1024 ** 2, retry: 1, code: 'E3012', msg: '目标端写入超时（timeout after 30s）' },
  ];

  return (
    <div>
      <PageHeader
        title={job.name}
        desc={`${job.id} · ${job.owner} · 创建于 ${fmtTime(job.createdAt)}`}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/jobs')}>
              返回
            </Button>
            <AuthGuard>
              {job.status === 'running' ? (
                <Button
                  icon={<PauseCircleOutlined />}
                  onClick={() => {
                    updateJob(job.id, { status: 'paused', speedBps: 0 });
                    message.success('任务已暂停');
                  }}
                >
                  暂停
                </Button>
              ) : (
                <Button
                  icon={<PlayCircleOutlined />}
                  onClick={() => {
                    updateJob(job.id, { status: 'running' });
                    message.success('任务已恢复');
                  }}
                >
                  恢复
                </Button>
              )}
              <Button
                icon={<RedoOutlined />}
                onClick={() => {
                  updateJob(job.id, { status: 'retrying' });
                  message.success('已提交重试');
                  setTimeout(() => updateJob(job.id, { status: 'running' }), 1200);
                }}
              >
                重试
              </Button>
            </AuthGuard>
          </Space>
        }
      />

      <div className="cf-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <StatusTag {...JOB_STATUS[job.status]} />
              <span style={{ color: PRIORITY[job.priority].color, fontWeight: 600 }}>{job.priority}</span>
              {job.tags.map((t) => (
                <Tag key={t} bordered={false}>
                  {t}
                </Tag>
              ))}
            </div>
            <Progress
              percent={Number(job.progress.toFixed(1))}
              strokeColor={job.status === 'failed' ? '#DC2626' : job.status === 'paused' ? '#94A3B8' : '#2563EB'}
              status={job.status === 'failed' ? 'exception' : undefined}
            />
            <div style={{ display: 'flex', gap: 40, marginTop: 16, flexWrap: 'wrap' }}>
              <div>
                <div className="kv-label">已传输 / 总量</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {fmtBytes(job.transferredBytes)} / {fmtBytes(job.totalBytes)}
                </div>
              </div>
              <div>
                <div className="kv-label">当前速率</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#2563EB' }}>{fmtSpeed(job.speedBps)}</div>
              </div>
              <div>
                <div className="kv-label">剩余时间</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{fmtCountdown(job.etaSeconds)}</div>
              </div>
              <div>
                <div className="kv-label">并发分片</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{job.concurrency}</div>
              </div>
              <div>
                <div className="kv-label">重试次数</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{job.retryCount}</div>
              </div>
              <div>
                <div className="kv-label">校验通过率</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#16A34A' }}>99.98%</div>
              </div>
              <div>
                <div className="kv-label">压缩比</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{job.compressedRatio}:1</div>
              </div>
            </div>
          </div>
          <div style={{ flex: '0 0 260px' }}>
            <div className="muted" style={{ marginBottom: 8 }}>传输路径</div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 13 }}>{job.source.nodeName}</div>
              <div className="muted" style={{ margin: '2px 0 8px' }}>
                {job.source.region} · {job.source.provider}
                <Tag bordered={false} color={STORAGE_TYPE[job.source.storageType].color} style={{ marginLeft: 6 }}>
                  {job.source.storageType}
                </Tag>
              </div>
              <div style={{ borderLeft: '2px dashed var(--border-strong)', marginLeft: 4, paddingLeft: 12, fontSize: 12, color: 'var(--text-3)' }}>
                {job.protocol} · {job.encryption} · {job.checksum}
              </div>
              <div style={{ fontSize: 13, marginTop: 8 }}>{job.target.nodeName}</div>
              <div className="muted" style={{ marginTop: 2 }}>
                {job.target.region} · {job.target.provider}
                <Tag bordered={false} color={STORAGE_TYPE[job.target.storageType].color} style={{ marginLeft: 6 }}>
                  {job.target.storageType}
                </Tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <ChartCard title="实时传输速率" desc="最近 60 分钟 · 1 分钟粒度">
          <EChart option={rateOption} height={240} />
        </ChartCard>
        <ChartCard title="分片执行情况" desc="按 5 分钟窗口统计分片状态">
          <EChart option={shardOption} height={240} />
        </ChartCard>
      </div>

      <div className="grid grid-2-1" style={{ marginBottom: 16 }}>
        <ChartCard title="失败分片 Top5" desc="按重试次数排序，可直接重跑">
          <Table
            className="cf-table"
            rowKey="key"
            size="small"
            pagination={false}
            dataSource={failedShards}
            columns={[
              { title: '分片号', dataIndex: 'shard', width: 110, render: (v) => <span className="mono">{v}</span> },
              { title: '大小', dataIndex: 'size', width: 90, render: (v: number) => fmtBytes(v) },
              { title: '重试', dataIndex: 'retry', width: 70 },
              { title: '错误码', dataIndex: 'code', width: 90, render: (v) => <span className="chip">{v}</span> },
              { title: '错误信息', dataIndex: 'msg', ellipsis: true },
            ]}
          />
        </ChartCard>

        <ChartCard title="传输阶段" desc="端到端各阶段耗时">
          <Timeline
            items={stages.map((s) => ({
              color: s.done ? 'green' : 'gray',
              dot: s.done ? <CheckCircleFilled style={{ color: '#16A34A' }} /> : undefined,
              children: (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 13 }}>{s.name}</span>
                  <span className="muted">{s.cost}</span>
                </div>
              ),
            }))}
          />
        </ChartCard>
      </div>

      <div className="grid grid-2">
        <ChartCard title="配置与策略" desc="任务级参数">
          <Descriptions column={2} size="small" colon={false}>
            <Descriptions.Item label="源路径">{job.source.path}</Descriptions.Item>
            <Descriptions.Item label="目标路径">{job.target.path}</Descriptions.Item>
            <Descriptions.Item label="协议">{job.protocol}</Descriptions.Item>
            <Descriptions.Item label="加密">{job.encryption}</Descriptions.Item>
            <Descriptions.Item label="校验">{job.checksum}</Descriptions.Item>
            <Descriptions.Item label="调度">
              {job.schedule.mode === 'cron' ? `Cron ${job.schedule.cron}` : job.schedule.mode === 'once' ? '定时一次' : '立即执行'}
            </Descriptions.Item>
            <Descriptions.Item label="文件数">{job.fileCount.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="创建人">{job.owner}（{job.dept}）</Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 12, borderTop: '1px dashed var(--border)', paddingTop: 12 }}>
            <div className="muted" style={{ marginBottom: 8 }}>策略生效明细</div>
            {policies
              .filter((p) => job.policyIds.includes(p.id))
              .map((p) => (
                <div key={p.id} className="list-row">
                  <div>
                    <div style={{ fontSize: 13 }}>{p.name}</div>
                    <div className="muted">{p.description.slice(0, 34)}…</div>
                  </div>
                  <span style={{ color: p.speedupPct > 0 ? '#16A34A' : 'var(--text-3)', fontSize: 12 }}>
                    {p.speedupPct > 0 ? `+${p.speedupPct}%` : '—'}
                  </span>
                </div>
              ))}
          </div>
        </ChartCard>

        <ChartCard title="事件日志" desc="任务生命周期关键事件">
          <Timeline
            items={[
              { color: 'blue', children: <><div style={{ fontSize: 13 }}>任务创建，进入调度队列</div><div className="muted">{fmtTime(job.createdAt)} · 陈屿</div></> },
              { color: 'blue', children: <><div style={{ fontSize: 13 }}>分配节点 {job.source.nodeName}，建立 {job.protocol} 连接</div><div className="muted">{fmtTime(job.startedAt)} · 调度器</div></> },
              { color: job.retryCount > 0 ? 'red' : 'gray', children: <><div style={{ fontSize: 13 }}>{job.retryCount > 0 ? `分片 SH-0281 传输失败（${job.errorCode ?? 'E5031'}），触发第 1 次重试` : '元数据扫描完成，共识别 18,432 个对象'}</div><div className="muted">{fmtTime(job.startedAt)} · 传输引擎</div></> },
              { color: 'green', children: <><div style={{ fontSize: 13 }}>压缩策略 Zstd-19 生效，压缩比 2.7:1</div><div className="muted">10 分钟前 · 优化引擎</div></> },
              { color: 'blue', children: <><div style={{ fontSize: 13 }}>当前进度 {job.progress.toFixed(1)}%，速率 {fmtSpeed(job.speedBps)}</div><div className="muted">刚刚 · 传输引擎</div></> },
            ]}
          />
        </ChartCard>
      </div>
    </div>
  );
}
