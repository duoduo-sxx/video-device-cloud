import dayjs from 'dayjs';
import type { Endpoint, Priority, TaskStatus, TransferTask } from '../types';
import { CHANNELS, POLICIES, USERS, nodeById, regionShort } from './base';

const GB = 1024 ** 3;

const OBJECTS = [
  '订单库',
  '用户画像特征',
  '影像资料',
  '研发数据集',
  '日志文件',
  '财务月结数据',
  '模型训练样本',
  '风控事件流',
  '埋点明细',
  '供应链主数据',
  '客服录音',
  '质检报告',
];

const ACTIONS = ['增量同步', '全量迁移', '归档', '跨区分发', '回传', '汇聚', '备份', '下发', '校验重传', '冷备转存'];

const pathByProtocol: Record<string, string> = {
  S3: 's3://prod-datalake/',
  OSS: 'oss://bj-analytics/',
  SFTP: '/data/edge/',
  HTTP: 'https://gw.xinglan.tech/',
  Kafka: 'kafka://bj-bus/',
  HDFS: 'hdfs://cd-cluster/',
  NFS: '/mnt/backup/',
};

const ERROR_SCENARIOS = [
  { code: 'ERR_CHANNEL_TIMEOUT', message: '目标节点响应超时，连续 3 次心跳无应答' },
  { code: 'ERR_CHECKSUM_MISMATCH', message: '分片校验失败，SHA-256 与源端不一致' },
  { code: 'ERR_SOURCE_UNREACHABLE', message: '源节点网络不可达，请检查安全组策略' },
  { code: 'ERR_DISK_FULL', message: '目标节点可用空间不足，剩余 12 GB' },
];

function statusAt(i: number): TaskStatus {
  if (i < 12) return 'running';
  if (i < 18) return 'paused';
  if (i < 22) return 'queued';
  if (i < 24) return 'verifying';
  if (i < 45) return 'success';
  if (i < 47) return 'failed';
  return 'canceled';
}

const progressAt = (i: number, status: TaskStatus): number => {
  if (status === 'success' || status === 'verifying') return 100;
  if (status === 'queued' || status === 'canceled' || status === 'draft') return 0;
  if (status === 'paused') return 34 + ((i * 9) % 48);
  if (status === 'failed') return 22 + ((i * 7) % 56);
  return 16 + ((i * 11) % 62);
};

function buildTasks(): TransferTask[] {
  const list: TransferTask[] = [];
  const now = dayjs();

  for (let i = 0; i < 48; i += 1) {
    const channel = CHANNELS[i % CHANNELS.length];
    const policy = POLICIES[i % 7];
    const sourceNode = nodeById(channel.sourceNodeId)!;
    const targetNode = nodeById(channel.targetNodeId)!;
    const status = statusAt(i);
    const progress = progressAt(i, status);
    const slug = `ds_${String(1024 + i * 17)}`;
    const baseGb = 40 + ((i * 53) % 180);
    const totalGb = i % 7 === 0 ? baseGb * 4 : baseGb;
    const totalSize = totalGb * GB;
    const transferredSize = Math.round((totalSize * progress) / 100);
    const speedBps =
      status === 'running' || status === 'verifying'
        ? Math.round(channel.bandwidthMbps * 125000 * (0.32 + (i % 5) * 0.09))
        : 0;
    const createdAt = now.subtract(i * 2 + 1, 'hour').subtract(i * 7, 'minute');
    const started = status !== 'queued' && status !== 'draft';
    const startedAt = started ? createdAt.add(2, 'minute') : undefined;
    const durationSec = speedBps > 0 ? Math.round(transferredSize / speedBps) : undefined;
    const etaSec = speedBps > 0 ? Math.round((totalSize - transferredSize) / speedBps) : undefined;
    const finishedAt =
      status === 'success' && durationSec ? (startedAt ?? createdAt).add(durationSec, 'second') : undefined;

    const source: Endpoint = {
      nodeId: sourceNode.id,
      nodeName: sourceNode.name,
      region: sourceNode.region,
      protocol: channel.protocol,
      path: `${pathByProtocol[channel.protocol]}${slug}/`,
    };
    const target: Endpoint = {
      nodeId: targetNode.id,
      nodeName: targetNode.name,
      region: targetNode.region,
      protocol: channel.protocol,
      path: `${pathByProtocol[channel.protocol]}${slug}-dst/`,
    };

    const priority: Priority = i % 9 === 0 ? 'high' : i % 4 === 0 ? 'low' : 'medium';
    const error = status === 'failed' ? ERROR_SCENARIOS[i % ERROR_SCENARIOS.length] : undefined;

    list.push({
      id: `TSK-${createdAt.format('YYYYMMDD')}-${String(1000 + i * 7)}`,
      name: `${regionShort(sourceNode.region)}-${regionShort(targetNode.region)} ${OBJECTS[i % 12]}${ACTIONS[Math.floor(i / 12)]}`,
      status,
      priority,
      progress,
      totalSize,
      transferredSize,
      fileCount: 1200 + ((i * 977) % 46000),
      speedBps,
      source,
      target,
      channelId: channel.id,
      channelName: channel.name,
      policyId: policy.id,
      policyName: policy.name,
      workspaceId: i % 3 === 0 ? `WS-0${(i % 8) + 1}` : undefined,
      tags: i % 5 === 0 ? ['核心业务', 'T+1'] : i % 3 === 0 ? ['研发'] : ['常规'],
      creator: USERS[(i * 3) % USERS.length],
      createdAt: createdAt.toISOString(),
      startedAt: startedAt?.toISOString(),
      finishedAt: finishedAt?.toISOString(),
      durationSec,
      etaSec,
      retryCount: status === 'failed' ? 2 + (i % 2) : i % 11 === 0 ? 1 : 0,
      checksum: policy.checksum,
      errorCode: error?.code,
      errorMessage: error?.message,
      schedule: i % 5 === 0 ? 'cron' : i % 7 === 0 ? 'scheduled' : 'immediate',
    });
  }

  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export const TASKS: TransferTask[] = buildTasks();

export const TASK_STATUS_META: Record<TaskStatus, { label: string; color: string; badge: string }> = {
  draft: { label: '草稿', color: 'default', badge: '#8A99B0' },
  queued: { label: '排队中', color: 'default', badge: '#8A99B0' },
  running: { label: '传输中', color: 'processing', badge: '#1668FF' },
  paused: { label: '已暂停', color: 'warning', badge: '#F59E0B' },
  verifying: { label: '校验中', color: 'cyan', badge: '#0EA5E9' },
  success: { label: '已完成', color: 'success', badge: '#00B894' },
  failed: { label: '失败', color: 'error', badge: '#EF4444' },
  canceled: { label: '已取消', color: 'default', badge: '#8A99B0' },
};
