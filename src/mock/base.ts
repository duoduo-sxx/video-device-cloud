import dayjs from 'dayjs';
import type { AppUser, Channel, CloudNode, Policy, Protocol } from '../types';

export const CURRENT_USER = {
  name: '陈默',
  role: '平台管理员',
  email: 'chenmo@xinglan-tech.com',
};

export const USERS = [
  '陈默',
  '林清',
  '周野',
  '苏芮',
  '许知远',
  '张沐',
  '李澈',
  '王砚',
  '赵岑',
  '钱屿',
  '孙禾',
  '吴桐',
];

export const REGIONS = [
  { name: '华东1（杭州）', short: '华东1', key: 'hz' },
  { name: '华北2（北京）', short: '华北2', key: 'bj' },
  { name: '华南1（深圳）', short: '华南1', key: 'sz' },
  { name: '西南1（成都）', short: '西南1', key: 'cd' },
  { name: '亚太东南1（新加坡）', short: '新加坡', key: 'sg' },
  { name: '欧洲中部1（法兰克福）', short: '法兰克福', key: 'fra' },
];

const hb = (minutesAgo: number) => dayjs().subtract(minutesAgo, 'minute').toISOString();

export const NODES: CloudNode[] = [
  { id: 'ND-hz-01', name: 'hz-prod-01', region: '华东1（杭州）', zone: '可用区B', type: 'source', ip: '10.12.3.21', capacityTB: 200, usedTB: 128, cpu: 62, mem: 71, online: true, version: 'v3.8.2', lastHeartbeat: hb(1), channelCount: 4 },
  { id: 'ND-hz-02', name: 'hz-relay-02', region: '华东1（杭州）', zone: '可用区C', type: 'relay', ip: '10.12.3.45', capacityTB: 160, usedTB: 92, cpu: 48, mem: 56, online: true, version: 'v3.8.2', lastHeartbeat: hb(1), channelCount: 6 },
  { id: 'ND-hz-03', name: 'hz-archive-03', region: '华东1（杭州）', zone: '可用区A', type: 'target', ip: '10.12.4.10', capacityTB: 320, usedTB: 210, cpu: 31, mem: 44, online: true, version: 'v3.7.9', lastHeartbeat: hb(2), channelCount: 3 },
  { id: 'ND-bj-01', name: 'bj-prod-01', region: '华北2（北京）', zone: '可用区A', type: 'source', ip: '10.20.1.11', capacityTB: 180, usedTB: 96, cpu: 55, mem: 63, online: true, version: 'v3.8.2', lastHeartbeat: hb(1), channelCount: 4 },
  { id: 'ND-bj-02', name: 'bj-relay-02', region: '华北2（北京）', zone: '可用区B', type: 'relay', ip: '10.20.1.30', capacityTB: 160, usedTB: 74, cpu: 42, mem: 51, online: true, version: 'v3.8.2', lastHeartbeat: hb(3), channelCount: 5 },
  { id: 'ND-bj-03', name: 'bj-compute-03', region: '华北2（北京）', zone: '可用区C', type: 'target', ip: '10.20.2.18', capacityTB: 240, usedTB: 138, cpu: 68, mem: 74, online: true, version: 'v3.6.4', lastHeartbeat: hb(2), channelCount: 4 },
  { id: 'ND-sz-01', name: 'sz-edge-07', region: '华南1（深圳）', zone: '可用区A', type: 'edge', ip: '10.30.7.7', capacityTB: 60, usedTB: 34, cpu: 71, mem: 58, online: true, version: 'v2.9.1', lastHeartbeat: hb(1), channelCount: 2 },
  { id: 'ND-sz-02', name: 'sz-prod-02', region: '华南1（深圳）', zone: '可用区B', type: 'source', ip: '10.30.1.22', capacityTB: 180, usedTB: 88, cpu: 39, mem: 47, online: true, version: 'v3.8.2', lastHeartbeat: hb(1), channelCount: 3 },
  { id: 'ND-sz-03', name: 'sz-hub-03', region: '华南1（深圳）', zone: '可用区C', type: 'relay', ip: '10.30.2.9', capacityTB: 140, usedTB: 66, cpu: 44, mem: 52, online: true, version: 'v3.8.0', lastHeartbeat: hb(2), channelCount: 5 },
  { id: 'ND-cd-01', name: 'cd-compute-03', region: '西南1（成都）', zone: '可用区A', type: 'target', ip: '10.40.3.13', capacityTB: 200, usedTB: 74, cpu: 27, mem: 36, online: true, version: 'v3.7.9', lastHeartbeat: hb(1), channelCount: 4 },
  { id: 'ND-cd-02', name: 'cd-edge-02', region: '西南1（成都）', zone: '可用区B', type: 'edge', ip: '10.40.4.5', capacityTB: 80, usedTB: 41, cpu: 0, mem: 0, online: false, version: 'v2.9.1', lastHeartbeat: hb(196), channelCount: 2 },
  { id: 'ND-sg-01', name: 'sg-gw-01', region: '亚太东南1（新加坡）', zone: '可用区A', type: 'target', ip: '10.50.1.8', capacityTB: 300, usedTB: 196, cpu: 57, mem: 62, online: true, version: 'v3.8.2', lastHeartbeat: hb(2), channelCount: 4 },
  { id: 'ND-sg-02', name: 'sg-relay-02', region: '亚太东南1（新加坡）', zone: '可用区B', type: 'relay', ip: '10.50.1.19', capacityTB: 160, usedTB: 88, cpu: 51, mem: 59, online: true, version: 'v3.8.2', lastHeartbeat: hb(1), channelCount: 3 },
  { id: 'ND-fra-01', name: 'fra-archive-01', region: '欧洲中部1（法兰克福）', zone: '可用区A', type: 'target', ip: '10.60.1.12', capacityTB: 400, usedTB: 262, cpu: 46, mem: 53, online: true, version: 'v3.7.9', lastHeartbeat: hb(3), channelCount: 4 },
  { id: 'ND-fra-02', name: 'fra-gw-02', region: '欧洲中部1（法兰克福）', zone: '可用区B', type: 'relay', ip: '10.60.1.33', capacityTB: 120, usedTB: 52, cpu: 33, mem: 41, online: true, version: 'v3.8.0', lastHeartbeat: hb(2), channelCount: 3 },
  { id: 'ND-fra-03', name: 'fra-edge-03', region: '欧洲中部1（法兰克福）', zone: '可用区C', type: 'edge', ip: '10.60.2.7', capacityTB: 80, usedTB: 39, cpu: 0, mem: 0, online: false, version: 'v2.8.6', lastHeartbeat: hb(428), channelCount: 1 },
];

export const CHANNELS: Channel[] = [
  { id: 'CH-01', name: '华东1 ↔ 新加坡 专线', protocol: 'S3', sourceNodeId: 'ND-hz-02', targetNodeId: 'ND-sg-01', bandwidthMbps: 1000, usedMbps: 612, latencyMs: 62, packetLoss: 0.02, status: 'healthy', qos: 'high', encryption: 'TLS 1.3', taskCount: 6, createdAt: dayjs().subtract(280, 'day').toISOString() },
  { id: 'CH-02', name: '华北2 ↔ 华东1 内网', protocol: 'OSS', sourceNodeId: 'ND-bj-02', targetNodeId: 'ND-hz-02', bandwidthMbps: 2000, usedMbps: 1180, latencyMs: 18, packetLoss: 0.01, status: 'healthy', qos: 'high', encryption: 'TLS 1.3', taskCount: 9, createdAt: dayjs().subtract(320, 'day').toISOString() },
  { id: 'CH-03', name: '深圳边缘 → 华南1 汇聚', protocol: 'SFTP', sourceNodeId: 'ND-sz-01', targetNodeId: 'ND-sz-03', bandwidthMbps: 500, usedMbps: 468, latencyMs: 24, packetLoss: 2.1, status: 'congested', qos: 'normal', encryption: 'SM4-GCM', taskCount: 4, createdAt: dayjs().subtract(190, 'day').toISOString() },
  { id: 'CH-04', name: '法兰克福 ↔ 华东1 跨境', protocol: 'HTTP', sourceNodeId: 'ND-fra-01', targetNodeId: 'ND-hz-02', bandwidthMbps: 300, usedMbps: 271, latencyMs: 186, packetLoss: 1.2, status: 'congested', qos: 'low', encryption: 'TLS 1.2', taskCount: 5, createdAt: dayjs().subtract(150, 'day').toISOString() },
  { id: 'CH-05', name: '华南1 → 新加坡 专线', protocol: 'S3', sourceNodeId: 'ND-sz-03', targetNodeId: 'ND-sg-02', bandwidthMbps: 1000, usedMbps: 486, latencyMs: 48, packetLoss: 0.03, status: 'healthy', qos: 'high', encryption: 'TLS 1.3', taskCount: 4, createdAt: dayjs().subtract(210, 'day').toISOString() },
  { id: 'CH-06', name: '华北2 → 法兰克福 跨境', protocol: 'OSS', sourceNodeId: 'ND-bj-03', targetNodeId: 'ND-fra-02', bandwidthMbps: 400, usedMbps: 214, latencyMs: 172, packetLoss: 0.42, status: 'healthy', qos: 'normal', encryption: 'TLS 1.3', taskCount: 3, createdAt: dayjs().subtract(175, 'day').toISOString() },
  { id: 'CH-07', name: '华东1 内网归档', protocol: 'S3', sourceNodeId: 'ND-hz-01', targetNodeId: 'ND-hz-03', bandwidthMbps: 1600, usedMbps: 724, latencyMs: 4, packetLoss: 0, status: 'healthy', qos: 'normal', encryption: 'TLS 1.3', taskCount: 8, createdAt: dayjs().subtract(360, 'day').toISOString() },
  { id: 'CH-08', name: '西南1 → 华东1 内网', protocol: 'HTTP', sourceNodeId: 'ND-cd-01', targetNodeId: 'ND-hz-02', bandwidthMbps: 800, usedMbps: 352, latencyMs: 36, packetLoss: 0.05, status: 'healthy', qos: 'normal', encryption: 'TLS 1.3', taskCount: 4, createdAt: dayjs().subtract(240, 'day').toISOString() },
  { id: 'CH-09', name: '西南1 边缘汇聚', protocol: 'SFTP', sourceNodeId: 'ND-cd-02', targetNodeId: 'ND-cd-01', bandwidthMbps: 300, usedMbps: 96, latencyMs: 12, packetLoss: 0.08, status: 'healthy', qos: 'low', encryption: 'SM4-GCM', taskCount: 2, createdAt: dayjs().subtract(120, 'day').toISOString() },
  { id: 'CH-10', name: '新加坡 → 法兰克福 跨境', protocol: 'S3', sourceNodeId: 'ND-sg-01', targetNodeId: 'ND-fra-01', bandwidthMbps: 600, usedMbps: 318, latencyMs: 168, packetLoss: 0.31, status: 'healthy', qos: 'normal', encryption: 'TLS 1.3', taskCount: 3, createdAt: dayjs().subtract(140, 'day').toISOString() },
  { id: 'CH-11', name: '华北2 分析集群总线', protocol: 'Kafka', sourceNodeId: 'ND-bj-01', targetNodeId: 'ND-bj-03', bandwidthMbps: 1200, usedMbps: 642, latencyMs: 3, packetLoss: 0, status: 'healthy', qos: 'high', encryption: 'TLS 1.3', taskCount: 5, createdAt: dayjs().subtract(300, 'day').toISOString() },
  { id: 'CH-12', name: '华南1 备份通道', protocol: 'NFS', sourceNodeId: 'ND-sz-02', targetNodeId: 'ND-sz-03', bandwidthMbps: 800, usedMbps: 0, latencyMs: 6, packetLoss: 0, status: 'disabled', qos: 'low', encryption: 'TLS 1.3', taskCount: 1, createdAt: dayjs().subtract(95, 'day').toISOString() },
];

export const POLICIES: Policy[] = [
  { id: 'PL-01', name: '极速传输', scene: '大文件跨区迁移', compression: 'zstd', level: 6, dedup: 'block', blockSizeMB: 8, chunkSizeMB: 64, concurrency: 32, rateLimitMbps: 0, retry: 3, resume: true, fec: false, checksum: 'SHA-256', refTaskCount: 14, savingPercent: 42, enabled: true },
  { id: 'PL-02', name: '均衡模式', scene: '日常增量同步', compression: 'lz4', level: 5, dedup: 'block', blockSizeMB: 8, chunkSizeMB: 64, concurrency: 16, rateLimitMbps: 800, retry: 3, resume: true, fec: false, checksum: 'SHA-256', refTaskCount: 12, savingPercent: 31, enabled: true },
  { id: 'PL-03', name: '省流量模式', scene: '带宽紧张链路', compression: 'zstd', level: 8, dedup: 'block', blockSizeMB: 16, chunkSizeMB: 128, concurrency: 8, rateLimitMbps: 400, retry: 5, resume: true, fec: false, checksum: 'MD5', refTaskCount: 7, savingPercent: 48, enabled: true },
  { id: 'PL-04', name: '跨境合规通道', scene: '跨境数据传输', compression: 'zstd', level: 7, dedup: 'block', blockSizeMB: 8, chunkSizeMB: 64, concurrency: 12, rateLimitMbps: 200, retry: 5, resume: true, fec: true, checksum: 'SHA-256', refTaskCount: 6, savingPercent: 39, enabled: true },
  { id: 'PL-05', name: '小文件聚合', scene: '海量小文件', compression: 'lz4', level: 4, dedup: 'file', blockSizeMB: 4, chunkSizeMB: 16, concurrency: 24, rateLimitMbps: 600, retry: 2, resume: true, fec: false, checksum: 'CRC32C', refTaskCount: 4, savingPercent: 26, enabled: true },
  { id: 'PL-06', name: '冷归档', scene: '长期保留归档', compression: 'zstd', level: 9, dedup: 'block', blockSizeMB: 16, chunkSizeMB: 128, concurrency: 8, rateLimitMbps: 300, retry: 3, resume: true, fec: false, checksum: 'SHA-256', refTaskCount: 3, savingPercent: 52, enabled: true },
  { id: 'PL-07', name: '实时流同步', scene: '消息队列消费', compression: 'none', level: 1, dedup: 'none', blockSizeMB: 4, chunkSizeMB: 32, concurrency: 16, rateLimitMbps: 0, retry: 8, resume: false, fec: false, checksum: 'none', refTaskCount: 2, savingPercent: 0, enabled: true },
  { id: 'PL-08', name: '弱网边缘回传', scene: '边缘节点回传', compression: 'lz4', level: 4, dedup: 'block', blockSizeMB: 4, chunkSizeMB: 32, concurrency: 8, rateLimitMbps: 150, retry: 6, resume: true, fec: true, checksum: 'MD5', refTaskCount: 0, savingPercent: 29, enabled: false },
];

export const PROTOCOL_FILES: Record<Protocol, string[]> = {
  S3: ['.parquet', '.orc', '.jsonl', '.tar.gz'],
  OSS: ['.parquet', '.csv', '.jsonl'],
  SFTP: ['.csv', '.dcm', '.tar.gz'],
  HTTP: ['.jsonl', '.csv', '.mp4'],
  Kafka: ['.jsonl'],
  HDFS: ['.parquet', '.orc'],
  NFS: ['.sql', '.tar.gz'],
};

export const APP_USERS: AppUser[] = [
  { id: 'U-001', name: '陈默', email: 'chenmo@xinglan-tech.com', role: 'admin', department: '数据平台部', status: '正常', lastLogin: hb(2), color: '#1668FF' },
  { id: 'U-002', name: '林清', email: 'linqing@xinglan-tech.com', role: 'ops', department: '基础架构部', status: '正常', lastLogin: hb(18), color: '#00B894' },
  { id: 'U-003', name: '周野', email: 'zhouye@xinglan-tech.com', role: 'member', department: '数据工程组', status: '正常', lastLogin: hb(56), color: '#7C5CFF' },
  { id: 'U-004', name: '苏芮', email: 'surui@xinglan-tech.com', role: 'ops', department: '安全合规部', status: '正常', lastLogin: hb(180), color: '#F59E0B' },
  { id: 'U-005', name: '许知远', email: 'xuzhiyuan@xinglan-tech.com', role: 'member', department: '业务分析组', status: '正常', lastLogin: hb(320), color: '#0EA5E9' },
  { id: 'U-006', name: '张沐', email: 'zhangmu@xinglan-tech.com', role: 'member', department: '算法平台组', status: '正常', lastLogin: hb(28), color: '#EF4444' },
  { id: 'U-007', name: '李澈', email: 'liche@xinglan-tech.com', role: 'member', department: '数据工程组', status: '正常', lastLogin: hb(92), color: '#1668FF' },
  { id: 'U-008', name: '王砚', email: 'wangyan@xinglan-tech.com', role: 'member', department: '财务共享中心', status: '已禁用', lastLogin: hb(2400), color: '#5A6B87' },
  { id: 'U-009', name: '赵岑', email: 'zhaocen@xinglan-tech.com', role: 'member', department: '供应链平台组', status: '正常', lastLogin: hb(420), color: '#00B894' },
  { id: 'U-010', name: '钱屿', email: 'qianyu@xinglan-tech.com', role: 'ops', department: '基础架构部', status: '正常', lastLogin: hb(6), color: '#7C5CFF' },
  { id: 'U-011', name: '孙禾', email: 'sunhe@xinglan-tech.com', role: 'member', department: '客服技术组', status: '正常', lastLogin: hb(1200), color: '#F59E0B' },
  { id: 'U-012', name: '吴桐', email: 'wutong@xinglan-tech.com', role: 'member', department: '数据平台部', status: '正常', lastLogin: hb(64), color: '#0EA5E9' },
];

export const nodeById = (id: string): CloudNode | undefined => NODES.find((n) => n.id === id);
export const channelById = (id: string): Channel | undefined => CHANNELS.find((c) => c.id === id);
export const policyById = (id: string): Policy | undefined => POLICIES.find((p) => p.id === id);
export const regionShort = (region: string): string =>
  REGIONS.find((r) => r.name === region)?.short ?? region;
