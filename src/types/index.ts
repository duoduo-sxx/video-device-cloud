export type Role = 'admin' | 'ops' | 'member';

export type TaskStatus =
  | 'draft'
  | 'queued'
  | 'running'
  | 'paused'
  | 'verifying'
  | 'success'
  | 'failed'
  | 'canceled';

export type Priority = 'high' | 'medium' | 'low';

export type Protocol = 'S3' | 'OSS' | 'SFTP' | 'HTTP' | 'Kafka' | 'HDFS' | 'NFS';

export type NodeType = 'source' | 'relay' | 'target' | 'edge';

export interface Endpoint {
  nodeId: string;
  nodeName: string;
  region: string;
  protocol: Protocol;
  path: string;
}

export interface TransferTask {
  id: string;
  name: string;
  status: TaskStatus;
  priority: Priority;
  progress: number;
  totalSize: number;
  transferredSize: number;
  fileCount: number;
  speedBps: number;
  source: Endpoint;
  target: Endpoint;
  channelId: string;
  channelName: string;
  policyId: string;
  policyName: string;
  workspaceId?: string;
  tags: string[];
  creator: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  durationSec?: number;
  etaSec?: number;
  retryCount: number;
  checksum: 'MD5' | 'SHA-256' | 'CRC32C' | 'none';
  errorCode?: string;
  errorMessage?: string;
  schedule: 'immediate' | 'scheduled' | 'cron';
}

export interface CloudNode {
  id: string;
  name: string;
  region: string;
  zone: string;
  type: NodeType;
  ip: string;
  capacityTB: number;
  usedTB: number;
  cpu: number;
  mem: number;
  online: boolean;
  version: string;
  lastHeartbeat: string;
  channelCount: number;
}

export type ChannelStatus = 'healthy' | 'congested' | 'disabled';

export interface Channel {
  id: string;
  name: string;
  protocol: Protocol;
  sourceNodeId: string;
  targetNodeId: string;
  bandwidthMbps: number;
  usedMbps: number;
  latencyMs: number;
  packetLoss: number;
  status: ChannelStatus;
  qos: 'high' | 'normal' | 'low';
  encryption: string;
  taskCount: number;
  createdAt: string;
}

export interface Policy {
  id: string;
  name: string;
  scene: string;
  compression: 'none' | 'gzip' | 'lz4' | 'zstd';
  level: number;
  dedup: 'none' | 'file' | 'block';
  blockSizeMB: number;
  chunkSizeMB: number;
  concurrency: number;
  rateLimitMbps: number;
  retry: number;
  resume: boolean;
  fec: boolean;
  checksum: 'MD5' | 'SHA-256' | 'CRC32C' | 'none';
  refTaskCount: number;
  savingPercent: number;
  enabled: boolean;
}

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export interface Member {
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  visibility: 'public' | 'private';
  owner: string;
  members: Member[];
  datasetCount: number;
  usedGB: number;
  quotaGB: number;
  updatedAt: string;
}

export interface Dataset {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  sourceNode: string;
  sizeGB: number;
  version: string;
  updatedAt: string;
  taskId?: string;
  sensitive: boolean;
}

export type AlertLevel = 'critical' | 'warning' | 'info';
export type AlertStatus = 'pending' | 'processing' | 'resolved';

export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  target: string;
  metric: string;
  value: string;
  threshold: string;
  status: AlertStatus;
  triggeredAt: string;
  durationMin: number;
  assignee?: string;
  ruleId: string;
  silenced?: boolean;
  description: string;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: string;
  threshold: string;
  duration: string;
  level: AlertLevel;
  channels: string[];
  enabled: boolean;
}

export interface AuditLog {
  id: string;
  time: string;
  user: string;
  action: string;
  object: string;
  ip: string;
  result: 'success' | 'failed';
  detail: { before: Record<string, string | number | boolean>; after: Record<string, string | number | boolean> };
}

export interface SensitiveHit {
  id: string;
  datasource: string;
  path: string;
  rule: string;
  level: 'high' | 'medium' | 'low';
  sample: string;
  scannedAt: string;
  status: '待处理' | '已处置' | '已忽略';
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scope: string;
  createdAt: string;
  lastUsedAt: string;
  status: '启用' | '已吊销';
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  status: '正常' | '已禁用';
  lastLogin: string;
  color: string;
}

export interface TrendData {
  labels: string[];
  volume: number[];
  rate: number[];
}
