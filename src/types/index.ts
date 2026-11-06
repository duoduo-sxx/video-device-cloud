export type JobStatus =
  | 'queued'
  | 'running'
  | 'paused'
  | 'success'
  | 'failed'
  | 'retrying'
  | 'canceled';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type StorageType = 'OSS' | 'OBS' | 'S3' | 'MinIO' | 'HDFS' | 'SFTP' | 'NAS' | 'Kafka';

export type NodeType = 'cloud' | 'edge' | 'idc';

export interface Endpoint {
  nodeId: string;
  nodeName: string;
  region: string;
  provider: string;
  storageType: StorageType;
  path: string;
}

export interface TransferJob {
  id: string;
  name: string;
  source: Endpoint;
  target: Endpoint;
  datasetId?: string;
  totalBytes: number;
  transferredBytes: number;
  fileCount: number;
  priority: Priority;
  status: JobStatus;
  progress: number;
  speedBps: number;
  etaSeconds: number;
  protocol: 'TCP' | 'QUIC';
  encryption: 'none' | 'TLS1.3' | 'SM4';
  checksum: 'MD5' | 'CRC32C' | 'SHA256';
  policyIds: string[];
  concurrency: number;
  schedule: { mode: 'now' | 'once' | 'cron'; cron?: string; runAt?: string };
  retryCount: number;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  owner: string;
  dept: string;
  tags: string[];
  compressedRatio?: number;
}

export interface NicItem {
  name: string;
  isp: string;
  ip: string;
  bandwidthMbps: number;
  packetLossPct: number;
}

export interface NodeItem {
  id: string;
  name: string;
  type: NodeType;
  region: string;
  provider: string;
  publicIp: string;
  privateIp: string;
  bandwidthMbps: number;
  throughputMbps: number;
  cpuUsage: number;
  memUsage: number;
  diskUsage: number;
  healthScore: number;
  status: 'online' | 'degraded' | 'offline';
  agentVersion: string;
  lastHeartbeat: string;
  tags: string[];
  nicList: NicItem[];
}

export interface LinkItem {
  id: string;
  name: string;
  sourceNodeId: string;
  targetNodeId: string;
  protocol: 'TCP' | 'QUIC';
  rttMs: number;
  jitterMs: number;
  packetLossPct: number;
  availableBandwidthMbps: number;
  utilizationPct: number;
  score: number;
  status: 'excellent' | 'good' | 'congested' | 'down';
  lastProbeAt: string;
}

export type PolicyType = 'compression' | 'dedup' | 'concurrency' | 'routing' | 'retry' | 'fec';

export interface Policy {
  id: string;
  name: string;
  type: PolicyType;
  description: string;
  params: Record<string, string | number>;
  scenes: string[];
  enabled: boolean;
  priority: number;
  hitCount: number;
  speedupPct: number;
  savePct: number;
  updatedAt: string;
  owner: string;
}

export type AlertLevel = 'P0' | 'P1' | 'P2' | 'P3';
export type AlertStatus = 'firing' | 'acked' | 'resolved';

export interface AlertItem {
  id: string;
  level: AlertLevel;
  title: string;
  type: string;
  targetType: 'node' | 'link' | 'job' | 'system';
  targetId: string;
  targetName: string;
  metric: string;
  value: string;
  threshold: string;
  status: AlertStatus;
  firedAt: string;
  ackedBy?: string;
  ackedAt?: string;
  resolvedAt?: string;
  durationSec: number;
  suggestion: string;
}

export interface ApprovalStep {
  node: string;
  approver: string;
  action: 'pass' | 'reject' | 'pending';
  comment?: string;
  time?: string;
}

export interface Approval {
  id: string;
  title: string;
  applicant: string;
  dept: string;
  type: 'cross_region' | 'sensitive_data' | 'bandwidth_boost' | 'new_connector';
  jobRef?: string;
  reason: string;
  riskLevel: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  currentNode: string;
  createdAt: string;
  slaDeadline: string;
  impact: string;
  history: ApprovalStep[];
}

export interface DatasetField {
  name: string;
  type: string;
  cnName: string;
  sensitive: boolean;
}

export interface Dataset {
  id: string;
  name: string;
  domain: string;
  type: 'structured' | 'file' | 'object';
  sizeBytes: number;
  fileCount: number;
  updateFreq: string;
  owner: string;
  classification: 'public' | 'internal' | 'sensitive';
  location: string;
  referencedJobs: number;
  fields?: DatasetField[];
}

export interface Connector {
  id: string;
  name: string;
  type: StorageType;
  endpoint: string;
  region: string;
  status: 'normal' | 'error' | 'unverified';
  lastCheckedAt: string;
  throughputMbps: number;
}

export interface UserItem {
  id: string;
  name: string;
  account: string;
  dept: string;
  role: 'admin' | 'operator' | 'viewer';
  email: string;
  phone: string;
  status: 'active' | 'disabled';
  lastLoginAt: string;
  avatarColor: string;
}

export interface AuditLog {
  id: string;
  time: string;
  user: string;
  action: string;
  object: string;
  ip: string;
  result: 'success' | 'failed';
  detail: Record<string, unknown>;
}

export interface Space {
  id: string;
  name: string;
  dept: string;
  owner: string;
  members: { name: string; role: '所有者' | '编辑者' | '查看者'; dept: string; activeAt: string }[];
  datasetCount: number;
  monthlyBytes: number;
  quotaPct: number;
  myRole: '所有者' | '编辑者' | '查看者';
}

export interface ModelItem {
  id: string;
  name: string;
  algo: string;
  samples: string;
  accuracy: number;
  deployedAt: string;
  status: 'production' | 'gray' | 'offline';
  desc: string;
}

export interface Experiment {
  id: string;
  name: string;
  metric: string;
  control: string;
  treatment: string;
  lift: number;
  confidence: number;
  status: 'running' | 'done';
  startedAt: string;
  series: { control: number[]; treatment: number[] };
}

export interface AlertRule {
  id: string;
  name: string;
  targetType: string;
  metric: string;
  operator: string;
  threshold: string;
  duration: string;
  level: AlertLevel;
  channels: string[];
  enabled: boolean;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  level: AlertLevel;
}
