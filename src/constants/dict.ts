import type {
  AlertLevel,
  Approval,
  JobStatus,
  NodeType,
  PolicyType,
  Priority,
  StorageType,
} from '../types';

export const COLORS = {
  primary: '#2563EB',
  cyan: '#06B6D4',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  purple: '#8B5CF6',
  info: '#0EA5E9',
  gray: '#64748B',
};

export const CHART_PALETTE = [
  '#2563EB',
  '#06B6D4',
  '#16A34A',
  '#F59E0B',
  '#8B5CF6',
  '#EF4444',
  '#0EA5E9',
  '#64748B',
];

interface Meta {
  label: string;
  color: string;
}

export const JOB_STATUS: Record<JobStatus, Meta> = {
  queued: { label: '排队中', color: COLORS.warning },
  running: { label: '传输中', color: COLORS.primary },
  paused: { label: '已暂停', color: COLORS.gray },
  success: { label: '已完成', color: COLORS.success },
  failed: { label: '失败', color: COLORS.danger },
  retrying: { label: '重试中', color: COLORS.purple },
  canceled: { label: '已取消', color: COLORS.gray },
};

export const PRIORITY: Record<Priority, Meta> = {
  P0: { label: 'P0', color: COLORS.danger },
  P1: { label: 'P1', color: '#EA580C' },
  P2: { label: 'P2', color: COLORS.primary },
  P3: { label: 'P3', color: COLORS.gray },
};

export const NODE_STATUS: Record<'online' | 'degraded' | 'offline', Meta> = {
  online: { label: '在线', color: COLORS.success },
  degraded: { label: '降级', color: COLORS.warning },
  offline: { label: '离线', color: COLORS.danger },
};

export const NODE_TYPE: Record<NodeType, Meta> = {
  cloud: { label: '云端节点', color: COLORS.primary },
  edge: { label: '边缘节点', color: COLORS.cyan },
  idc: { label: '自建机房', color: COLORS.purple },
};

export const LINK_STATUS: Record<LinkItemStatus, Meta> = {
  excellent: { label: '优', color: COLORS.success },
  good: { label: '良', color: COLORS.primary },
  congested: { label: '拥塞', color: COLORS.warning },
  down: { label: '中断', color: COLORS.danger },
};

type LinkItemStatus = 'excellent' | 'good' | 'congested' | 'down';

export const ALERT_LEVEL: Record<AlertLevel, Meta> = {
  P0: { label: 'P0', color: COLORS.danger },
  P1: { label: 'P1', color: '#EA580C' },
  P2: { label: 'P2', color: COLORS.warning },
  P3: { label: 'P3', color: COLORS.gray },
};

export const ALERT_STATUS: Record<'firing' | 'acked' | 'resolved', Meta> = {
  firing: { label: '正在告警', color: COLORS.danger },
  acked: { label: '已确认', color: COLORS.warning },
  resolved: { label: '已恢复', color: COLORS.success },
};

export const POLICY_TYPE: Record<PolicyType, Meta> = {
  compression: { label: '压缩', color: COLORS.primary },
  dedup: { label: '去重', color: COLORS.cyan },
  concurrency: { label: '并发分片', color: COLORS.purple },
  routing: { label: '智能选路', color: COLORS.info },
  retry: { label: '差错重传', color: COLORS.warning },
  fec: { label: '前向纠错', color: COLORS.gray },
};

export const APPROVAL_TYPE: Record<Approval['type'], Meta> = {
  cross_region: { label: '跨域传输', color: COLORS.primary },
  sensitive_data: { label: '敏感数据', color: COLORS.danger },
  bandwidth_boost: { label: '带宽提升', color: COLORS.warning },
  new_connector: { label: '新连接器', color: COLORS.cyan },
};

export const APPROVAL_STATUS: Record<Approval['status'], Meta> = {
  pending: { label: '待审批', color: COLORS.warning },
  approved: { label: '已通过', color: COLORS.success },
  rejected: { label: '已驳回', color: COLORS.danger },
  expired: { label: '已过期', color: COLORS.gray },
};

export const RISK_LEVEL: Record<Approval['riskLevel'], Meta> = {
  high: { label: '高风险', color: COLORS.danger },
  medium: { label: '中风险', color: COLORS.warning },
  low: { label: '低风险', color: COLORS.success },
};

export const STORAGE_TYPE: Record<StorageType, Meta> = {
  OSS: { label: 'OSS', color: '#FF6A00' },
  OBS: { label: 'OBS', color: '#C7000B' },
  S3: { label: 'S3', color: '#FF9900' },
  MinIO: { label: 'MinIO', color: '#C72C48' },
  HDFS: { label: 'HDFS', color: '#66CCFF' },
  SFTP: { label: 'SFTP', color: '#6B7280' },
  NAS: { label: 'NAS', color: '#0EA5E9' },
  Kafka: { label: 'Kafka', color: '#231F20' },
};

export const CLASSIFICATION: Record<'public' | 'internal' | 'sensitive', Meta> = {
  public: { label: '公开', color: COLORS.success },
  internal: { label: '内部', color: COLORS.primary },
  sensitive: { label: '敏感', color: COLORS.danger },
};

export const USER_ROLE: Record<'admin' | 'operator' | 'viewer', Meta> = {
  admin: { label: '管理员', color: COLORS.purple },
  operator: { label: '操作员', color: COLORS.primary },
  viewer: { label: '访客', color: COLORS.gray },
};

export const DEPARTMENTS = [
  '数据平台部',
  '基础架构部',
  '风控科技部',
  '智能营销部',
  '供应链技术部',
  '财务共享中心',
  '客户服务中心',
  '安全合规部',
];

export const REGIONS = [
  '华北2（北京）',
  '华东1（上海）',
  '华南1（广州）',
  '西南1（成都）',
  '华中1（武汉）',
  '中国香港',
  '新加坡',
  '法兰克福',
  '硅谷',
];
