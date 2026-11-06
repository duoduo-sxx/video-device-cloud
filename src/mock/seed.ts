import dayjs from 'dayjs';
import type {
  AlertItem,
  AlertRule,
  Approval,
  AuditLog,
  Connector,
  Dataset,
  Endpoint,
  Experiment,
  LinkItem,
  ModelItem,
  NicItem,
  NodeItem,
  NotificationItem,
  Policy,
  Space,
  TransferJob,
  UserItem,
} from '../types';

/* ------------------------------------------------------------------ */
/* 确定性随机，保证每次加载数据一致                                     */
/* ------------------------------------------------------------------ */
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20261019);
const rand = (min: number, max: number) => min + rnd() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

const NOW = dayjs();
const ago = (minutes: number) => NOW.subtract(minutes, 'minute').toISOString();
const agoDay = (days: number) => NOW.subtract(days, 'day').toISOString();
export const SEED_DAY = NOW.format('YYYY-MM-DD');

/* ------------------------------------------------------------------ */
/* 节点                                                                */
/* ------------------------------------------------------------------ */
type NodeSeed = [
  string, string, NodeItem['type'], string, string, string, string,
  number, number, number, number, number, number, NodeItem['status'], string,
];

const nodeSeeds: NodeSeed[] = [
  ['NODE-BJ-01', '华北2-北京-接入节点', 'cloud', '华北2（北京）', '阿里云', '47.94.12.36', '10.20.1.11', 10000, 8640, 62, 71, 58, 96.4, 'online', 'v2.4.1'],
  ['NODE-BJ-02', '华北2-北京-汇聚节点', 'cloud', '华北2（北京）', '华为云', '123.60.88.14', '10.20.2.11', 10000, 9120, 74, 68, 63, 94.2, 'online', 'v2.4.1'],
  ['NODE-SH-01', '华东1-上海-接入节点', 'cloud', '华东1（上海）', '阿里云', '47.100.66.21', '10.21.1.11', 10000, 7860, 58, 64, 71, 97.1, 'online', 'v2.4.1'],
  ['NODE-SH-02', '华东1-上海-汇聚节点', 'cloud', '华东1（上海）', '腾讯云', '129.226.10.7', '10.21.2.11', 8000, 6240, 66, 73, 55, 93.8, 'online', 'v2.4.1'],
  ['NODE-GZ-01', '华南1-广州-接入节点', 'cloud', '华南1（广州）', '腾讯云', '119.29.32.88', '10.22.1.11', 8000, 5320, 54, 61, 49, 95.6, 'online', 'v2.3.8'],
  ['NODE-SZ-01', '华南1-深圳-备份节点', 'cloud', '华南1（广州）', '华为云', '121.36.44.9', '10.22.2.11', 6000, 2180, 41, 52, 82, 88.7, 'degraded', 'v2.3.8'],
  ['NODE-CD-01', '西南1-成都-接入节点', 'cloud', '西南1（成都）', '阿里云', '47.108.20.33', '10.23.1.11', 6000, 4760, 63, 58, 47, 84.6, 'degraded', 'v2.4.1'],
  ['NODE-WH-01', '华中1-武汉-接入节点', 'cloud', '华中1（武汉）', '腾讯云', '111.230.15.62', '10.23.2.11', 4000, 2840, 49, 55, 43, 94.9, 'online', 'v2.4.1'],
  ['NODE-HK-01', '中国香港-中转节点', 'cloud', '中国香港', 'AWS', '18.166.22.91', '10.24.1.11', 4000, 3160, 57, 62, 51, 92.5, 'online', 'v2.2.6'],
  ['NODE-SG-01', '新加坡-海外节点', 'cloud', '新加坡', 'AWS', '13.212.55.18', '10.25.1.11', 4000, 1980, 44, 48, 39, 90.8, 'online', 'v2.2.6'],
  ['NODE-FRA-01', '法兰克福-海外归档', 'cloud', '法兰克福', 'AWS', '18.194.7.24', '10.26.1.11', 2000, 0, 12, 18, 76, 62.3, 'offline', 'v2.1.9'],
  ['NODE-IDC-01', '北京-亦庄自建机房', 'idc', '华北2（北京）', '自建 IDC', '203.0.113.21', '172.16.8.11', 10000, 7420, 71, 79, 68, 91.2, 'online', 'v2.4.0'],
  ['NODE-IDC-02', '上海-外高桥自建机房', 'idc', '华东1（上海）', '自建 IDC', '203.0.113.35', '172.16.9.11', 8000, 5860, 68, 74, 72, 90.1, 'online', 'v2.4.0'],
  ['NODE-EDGE-001', '上海-门店边缘节点-001', 'edge', '华东1（上海）', '自建 IDC', '100.64.12.11', '192.168.10.11', 1000, 720, 52, 46, 61, 96.2, 'online', 'v2.4.1-edge'],
  ['NODE-EDGE-002', '广州-门店边缘节点-002', 'edge', '华南1（广州）', '自建 IDC', '100.64.12.12', '192.168.10.12', 1000, 640, 48, 44, 58, 95.1, 'online', 'v2.4.1-edge'],
  ['NODE-EDGE-003', '成都-门店边缘节点-003', 'edge', '西南1（成都）', '自建 IDC', '100.64.12.13', '192.168.10.13', 1000, 410, 39, 51, 66, 87.4, 'online', 'v2.4.0-edge'],
  ['NODE-EDGE-004', '杭州-门店边缘节点-004', 'edge', '华东1（上海）', '自建 IDC', '100.64.12.14', '192.168.10.14', 1000, 880, 57, 49, 54, 96.8, 'online', 'v2.4.1-edge'],
  ['NODE-EDGE-005', '西安-门店边缘节点-005', 'edge', '华北2（北京）', '自建 IDC', '100.64.12.15', '192.168.10.15', 1000, 240, 31, 37, 48, 92.3, 'online', 'v2.3.8-edge'],
];

const ispOf = (p: string) => (p === '阿里云' ? '中国电信' : p === '腾讯云' ? '中国联通' : p === '华为云' ? '中国移动' : 'BGP 多线');

export const NODES: NodeItem[] = nodeSeeds.map((s, i) => {
  const [id, name, type, region, provider, publicIp, privateIp, bw, tp, cpu, mem, disk, health, status, ver] = s;
  const nicList: NicItem[] = [
    { name: 'eth0', isp: ispOf(provider), ip: publicIp, bandwidthMbps: Math.round(bw * 0.6), packetLossPct: Number(rand(0, 0.4).toFixed(2)) },
    { name: 'eth1', isp: type === 'edge' ? '中国联通' : '中国移动', ip: privateIp, bandwidthMbps: Math.round(bw * 0.4), packetLossPct: Number(rand(0, 1.2).toFixed(2)) },
  ];
  return {
    id, name, type, region, provider, publicIp, privateIp,
    bandwidthMbps: bw, throughputMbps: tp,
    cpuUsage: cpu, memUsage: mem, diskUsage: disk, healthScore: health, status,
    agentVersion: ver,
    lastHeartbeat: status === 'offline' ? ago(214) : ago(i % 3),
    tags: type === 'edge' ? ['边缘', '门店', '小文件'] : type === 'idc' ? ['自建', '核心机房'] : ['云端', region.slice(0, 3)],
    nicList,
  };
});

const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]));

const storageOf = (path: string): Endpoint['storageType'] => {
  if (path.startsWith('oss')) return 'OSS';
  if (path.startsWith('obs')) return 'OBS';
  if (path.startsWith('s3')) return 'S3';
  if (path.startsWith('hdfs')) return 'HDFS';
  if (path.startsWith('sftp')) return 'SFTP';
  return 'NAS';
};

const ep = (nodeId: string, path: string): Endpoint => {
  const n = nodeMap[nodeId];
  return {
    nodeId,
    nodeName: n.name,
    region: n.region,
    provider: n.provider,
    storageType: storageOf(path),
    path,
  };
};

/* ------------------------------------------------------------------ */
/* 传输任务                                                            */
/* ------------------------------------------------------------------ */
type JobSeed = [string, string, string, string, string, TransferJob['priority'], number, number, number, TransferJob['status']];

const jobSeeds: JobSeed[] = [
  ['上海OSS→北京OBS 用户行为日志每日同步', 'NODE-SH-01', 'NODE-BJ-02', 'oss://datalake/dwd/user_behavior/dt=20261018/', 'obs://dw-archive/dwd/user_behavior/dt=20261018/', 'P1', 2639, 18432, 70.6, 'running'],
  ['广州门店视频片段回传-华南批次-1019', 'NODE-EDGE-002', 'NODE-GZ-01', 'sftp:///data/edge/video/20261019/', 'obs://retail-video/gz/20261019/', 'P1', 1480, 8604, 43.2, 'running'],
  ['HDFS 离线数仓 dwd_order_detail 跨集群同步', 'NODE-IDC-01', 'NODE-IDC-02', 'hdfs://nn1:8020/warehouse/dwd/order_detail/', 'hdfs://nn2:8020/warehouse/dwd/order_detail/', 'P0', 4800, 128640, 88.4, 'running'],
  ['模型训练样本集-新加坡→上海', 'NODE-SG-01', 'NODE-SH-01', 's3://ml-sample/ctr/v7/train/', 'oss://ml-platform/ctr/v7/train/', 'P2', 620, 3120, 61.8, 'running'],
  ['财务月结归档-冷备至法兰克福', 'NODE-BJ-01', 'NODE-FRA-01', 'oss://fin-archive/202609/', 's3://fin-cold/202609/', 'P2', 980, 12400, 12.4, 'running'],
  ['IoT 设备心跳数据边缘回传', 'NODE-EDGE-004', 'NODE-SH-02', 'nas:///iot/heartbeat/20261019/', 'obs://iot-lake/heartbeat/20261019/', 'P1', 210, 1520000, 96.1, 'running'],
  ['客服通话录音归档至低频存储', 'NODE-IDC-02', 'NODE-SH-02', 'nas:///call/record/202610/', 'obs://call-archive/202610/', 'P3', 760, 48000, 0, 'queued'],
  ['风控特征库增量同步（小时级）', 'NODE-SH-01', 'NODE-BJ-01', 'oss://risk/feature/hourly/2026101910/', 'oss://risk-dr/feature/2026101910/', 'P1', 86, 4200, 0, 'queued'],
  ['BI 报表快照分发至边缘节点', 'NODE-SH-02', 'NODE-EDGE-001', 'obs://bi/snapshot/daily/', 'nas:///bi/snapshot/', 'P2', 42, 1280, 0, 'queued'],
  ['医疗影像脱敏传输-影像中心', 'NODE-IDC-01', 'NODE-BJ-02', 'nas:///pacs/2026/10/19/', 'obs://imaging-desensitized/20261019/', 'P0', 1240, 96000, 0, 'queued'],
  ['供应链主数据全量同步', 'NODE-SH-02', 'NODE-GZ-01', 'obs://mdm/full/', 'obs://mdm-replica/full/', 'P2', 320, 6400, 0, 'queued'],
  ['营销活动埋点日志归集', 'NODE-BJ-01', 'NODE-BJ-02', 'oss://tracking/event/20261018/', 'obs://tracking-lake/event/dt=20261018/', 'P1', 1860, 268000, 100, 'success'],
  ['用户画像宽表日增量同步', 'NODE-IDC-02', 'NODE-SH-01', 'hdfs://nn2:8020/warehouse/dws/user_profile/', 'oss://profile/dws/user_profile/', 'P0', 2400, 4200, 100, 'success'],
  ['交易流水对账文件传输', 'NODE-IDC-01', 'NODE-BJ-01', 'sftp:///settle/20261018/', 'oss://settlement/20261018/', 'P0', 96, 288, 100, 'success'],
  ['商品图片素材同步至 CDN 源站', 'NODE-SH-02', 'NODE-EDGE-003', 'obs://goods/image/202610/', 'nas:///cdn-origin/goods/', 'P3', 380, 86400, 100, 'success'],
  ['客服工单附件归档', 'NODE-GZ-01', 'NODE-SH-02', 'oss://ticket/attach/202609/', 'obs://ticket-archive/202609/', 'P3', 210, 15600, 100, 'success'],
  ['财务凭证影像同步', 'NODE-IDC-02', 'NODE-BJ-02', 'nas:///voucher/202609/', 'obs://fin-voucher/202609/', 'P1', 640, 38400, 100, 'success'],
  ['日志冷数据下沉至对象存储', 'NODE-IDC-01', 'NODE-BJ-02', 'hdfs://nn1:8020/logs/app/202609/', 'obs://log-cold/202609/', 'P2', 3200, 1240000, 100, 'success'],
  ['三方征信数据接入', 'NODE-BJ-02', 'NODE-SH-01', 'sftp:///credit/inbound/20261018/', 'oss://risk/credit/20261018/', 'P0', 58, 12, 100, 'success'],
  ['门店 POS 日结数据回传', 'NODE-EDGE-001', 'NODE-SH-01', 'nas:///pos/settle/20261018/', 'oss://retail/pos/settle/dt=20261018/', 'P1', 74, 1920, 100, 'success'],
  ['广告投放报表同步', 'NODE-HK-01', 'NODE-SH-02', 's3://ad-report/20261018/', 'obs://ad-dw/report/20261018/', 'P2', 120, 3600, 100, 'success'],
  ['风控模型特征回灌', 'NODE-SH-01', 'NODE-IDC-02', 'oss://risk/feature/backfill/202610/', 'hdfs://nn2:8020/risk/feature/', 'P1', 460, 8800, 100, 'success'],
  ['主数据变更增量分发', 'NODE-BJ-01', 'NODE-GZ-01', 'oss://mdm/change/20261019/', 'obs://mdm-replica/change/20261019/', 'P2', 36, 720, 100, 'success'],
  ['历史订单归档至低频', 'NODE-IDC-02', 'NODE-SH-02', 'hdfs://nn2:8020/warehouse/ods/order/2025/', 'obs://order-archive/2025/', 'P3', 2800, 960000, 100, 'success'],
  ['视频监控集中存储迁移', 'NODE-EDGE-005', 'NODE-WH-01', 'nas:///camera/202609/', 'obs://video-center/wh/202609/', 'P1', 3600, 186000, 100, 'success'],
  ['数据湖元数据备份', 'NODE-SH-02', 'NODE-HK-01', 'obs://lake/meta/20261019/', 's3://lake-meta-backup/20261019/', 'P2', 88, 12400, 68.4, 'paused'],
  ['合作伙伴数据交换-华东', 'NODE-SH-01', 'NODE-SH-02', 'oss://partner/inbound/20261018/', 'obs://exchange/partner/20261018/', 'P2', 260, 4200, 72.1, 'failed'],
  ['HDFS 集群扩容数据再平衡', 'NODE-IDC-01', 'NODE-IDC-02', 'hdfs://nn1:8020/warehouse/', 'hdfs://nn2:8020/warehouse/', 'P1', 4200, 2640000, 54.8, 'failed'],
  ['门店视频回传-西南批次', 'NODE-EDGE-003', 'NODE-CD-01', 'sftp:///data/edge/video/20261019/', 'oss://retail-video/cd/20261019/', 'P2', 1320, 7200, 38.6, 'failed'],
  ['跨境数据出境备案包传输', 'NODE-SH-02', 'NODE-SG-01', 'obs://compliance/export/202610/', 's3://sg-compliance/202610/', 'P0', 240, 864, 91.2, 'failed'],
  ['报表快照分发-西北边缘', 'NODE-BJ-02', 'NODE-EDGE-005', 'obs://bi/snapshot/weekly/', 'nas:///bi/snapshot/', 'P3', 96, 2400, 46.3, 'paused'],
  ['训练样本集-历史版本回滚', 'NODE-SH-01', 'NODE-SG-01', 'oss://ml-platform/ctr/v6/train/', 's3://ml-sample/ctr/v6/train/', 'P2', 540, 2860, 66.7, 'retrying'],
];

const owners = ['陈屿', '林书禾', '赵启明', '周雨桐', '吴嘉树', '郑亦航', '孙梦琪', '何思远'];
const depts = ['数据平台部', '基础架构部', '风控科技部', '智能营销部', '供应链技术部', '财务共享中心', '客户服务中心', '安全合规部'];
const policyPool = ['POL-0031', 'POL-0032', 'POL-0012', 'POL-0021', 'POL-0008', 'POL-0051'];

export const JOBS: TransferJob[] = jobSeeds.map((s, i) => {
  const [name, srcId, dstId, srcPath, dstPath, priority, gb, fileCount, progress, status] = s;
  const totalBytes = Math.round(gb * 1024 ** 3);
  const transferredBytes = Math.round((totalBytes * progress) / 100);
  const speedBps =
    status === 'running' ? Math.round(rand(120, 980) * 1e6) : 0;
  const remainBytes = totalBytes - transferredBytes;
  const createdMinute = status === 'success' ? randInt(90, 7200) : status === 'running' ? randInt(120, 420) : randInt(3, 90);
  const createdAt = ago(createdMinute);
  const startedAt = status === 'queued' ? undefined : ago(Math.max(1, createdMinute - 1));
  const finishMinute = status === 'success' ? Math.max(1, createdMinute - randInt(30, 120)) : undefined;
  return {
    id: `JOB-20261019-${String(1042 - i).padStart(4, '0')}`,
    name,
    source: ep(srcId, srcPath),
    target: ep(dstId, dstPath),
    datasetId: i % 3 === 0 ? `DS-${1024 + i}` : undefined,
    totalBytes,
    transferredBytes,
    fileCount,
    priority,
    status,
    progress,
    speedBps,
    etaSeconds: status === 'running' ? Math.round(remainBytes / Math.max(speedBps, 1)) : 0,
    protocol: i % 3 === 0 ? 'QUIC' : 'TCP',
    encryption: i % 4 === 0 ? 'SM4' : i % 2 === 0 ? 'TLS1.3' : 'none',
    checksum: i % 3 === 0 ? 'CRC32C' : i % 2 === 0 ? 'SHA256' : 'MD5',
    policyIds: policyPool.filter((_, idx) => (i + idx) % 3 === 0).slice(0, 3),
    concurrency: [8, 16, 16, 32, 24][i % 5],
    schedule: i % 4 === 0 ? { mode: 'cron', cron: '0 2 * * *' } : { mode: 'now' },
    retryCount: status === 'failed' ? randInt(2, 5) : status === 'retrying' ? 3 : status === 'success' ? randInt(0, 2) : 0,
    errorCode: status === 'failed' ? pick(['E5031', 'E4210', 'E3012', 'E5007']) : undefined,
    errorMessage:
      status === 'failed'
        ? pick([
            '目标端写入超时，连续 3 次重试失败（connection reset by peer）',
            '源端读取限流触发，分片校验不一致',
            '证书校验失败：peer certificate has expired',
            '目标存储配额不足，写入被拒绝',
          ])
        : undefined,
    createdAt,
    startedAt,
    finishedAt: finishMinute ? ago(finishMinute) : undefined,
    owner: owners[i % owners.length],
    dept: depts[i % depts.length],
    tags: [
      status === 'running' ? '进行中' : status === 'failed' ? '需处理' : '例行',
      ['核心链路', '日志同步', '归档', '边缘回传', '跨云迁移'][i % 5],
    ],
    compressedRatio: Number(rand(1.4, 3.8).toFixed(1)),
  };
});

/* ------------------------------------------------------------------ */
/* 链路                                                                */
/* ------------------------------------------------------------------ */
type LinkSeed = [string, string, LinkItem['status'], number, number, number, number, number];

const linkSeeds: LinkSeed[] = [
  ['NODE-SH-01', 'NODE-BJ-02', 'excellent', 28.4, 1.8, 0.12, 8460, 72.6],
  ['NODE-BJ-01', 'NODE-BJ-02', 'excellent', 3.2, 0.4, 0.02, 9200, 64.1],
  ['NODE-SH-02', 'NODE-SH-01', 'excellent', 2.6, 0.3, 0.01, 6820, 58.4],
  ['NODE-WH-01', 'NODE-SH-02', 'excellent', 18.7, 1.1, 0.08, 3240, 61.2],
  ['NODE-BJ-01', 'NODE-HK-01', 'excellent', 34.6, 2.4, 0.26, 2860, 68.9],
  ['NODE-IDC-01', 'NODE-BJ-02', 'excellent', 4.8, 0.6, 0.03, 7180, 74.2],
  ['NODE-IDC-02', 'NODE-SH-01', 'excellent', 3.9, 0.5, 0.02, 5640, 69.8],
  ['NODE-EDGE-001', 'NODE-SH-01', 'excellent', 12.2, 1.4, 0.18, 760, 81.5],
  ['NODE-HK-01', 'NODE-SG-01', 'excellent', 41.3, 3.2, 0.34, 2140, 62.7],
  ['NODE-GZ-01', 'NODE-SH-02', 'good', 22.8, 3.6, 0.86, 4680, 79.4],
  ['NODE-SZ-01', 'NODE-GZ-01', 'good', 9.4, 2.1, 0.64, 1280, 84.6],
  ['NODE-WH-01', 'NODE-CD-01', 'good', 26.9, 4.8, 1.12, 1820, 71.3],
  ['NODE-CD-01', 'NODE-SH-02', 'congested', 46.2, 8.4, 3.26, 960, 91.8],
  ['NODE-SG-01', 'NODE-FRA-01', 'down', 186.4, 12.6, 100, 0, 100],
];

export const LINKS: LinkItem[] = linkSeeds.map((s, i) => {
  const [src, dst, status, rtt, jitter, loss, avail, util] = s;
  return {
    id: `LINK-${String(7 + i).padStart(4, '0')}`,
    name: `${nodeMap[src].name.split('-').slice(0, 2).join('-')} → ${nodeMap[dst].name.split('-').slice(0, 2).join('-')}`,
    sourceNodeId: src,
    targetNodeId: dst,
    protocol: i % 2 === 0 ? 'QUIC' : 'TCP',
    rttMs: rtt,
    jitterMs: jitter,
    packetLossPct: loss,
    availableBandwidthMbps: avail,
    utilizationPct: util,
    score: status === 'down' ? 0 : Math.max(38, Math.round(100 - rtt * 0.6 - loss * 4.2 - util * 0.12)),
    status,
    lastProbeAt: ago(randInt(1, 5)),
  };
});

/* ------------------------------------------------------------------ */
/* 优化策略                                                            */
/* ------------------------------------------------------------------ */
export const POLICIES: Policy[] = [
  {
    id: 'POL-0031', name: '大文件高压缩-Zstd19', type: 'compression',
    description: '针对 >1GB 的日志/文本类文件，使用 Zstandard 19 级压缩并加载预训练字典，兼顾压缩比与 CPU 开销。',
    params: { algorithm: 'zstd', level: 19, dictSize: '112KB', window: '8MB', minFileSize: '1GB' },
    scenes: ['日志同步', '归档冷备', '跨云迁移'], enabled: true, priority: 1,
    hitCount: 12486, speedupPct: 31.2, savePct: 42.3, updatedAt: agoDay(3), owner: '林书禾',
  },
  {
    id: 'POL-0032', name: '小文件聚合压缩-LZ4', type: 'compression',
    description: '针对平均体积 <512KB 的海量小文件，先聚合成大块再以 LZ4 快速压缩，降低单文件握手开销。',
    params: { algorithm: 'lz4', level: 3, blockSize: '4MB', aggregate: '开启', minFileSize: '0B' },
    scenes: ['边缘回传', '小文件归集'], enabled: true, priority: 2,
    hitCount: 9842, speedupPct: 26.8, savePct: 28.4, updatedAt: agoDay(5), owner: '赵启明',
  },
  {
    id: 'POL-0033', name: '归档冷备高压缩比', type: 'compression',
    description: '低频访问的归档数据优先使用 Gzip-9，允许较高 CPU 占用以换取更低出网流量成本。',
    params: { algorithm: 'gzip', level: 9, window: '32MB', minFileSize: '4GB' },
    scenes: ['归档冷备', '合规留存'], enabled: true, priority: 3,
    hitCount: 3260, speedupPct: 8.4, savePct: 51.6, updatedAt: agoDay(11), owner: '周雨桐',
  },
  {
    id: 'POL-0012', name: '日志类内容定义分块去重', type: 'dedup',
    description: '基于内容定义分块（CDC）识别重复日志片段，仅在源端与目标端均启用指纹索引时生效。',
    params: { chunker: 'CDC', avgChunk: '2MB', fingerprint: 'SHA256', index: '分布式索引' },
    scenes: ['日志同步', '重复备份'], enabled: true, priority: 1,
    hitCount: 8420, speedupPct: 22.4, savePct: 37.8, updatedAt: agoDay(2), owner: '陈屿',
  },
  {
    id: 'POL-0013', name: '全量同步块级去重', type: 'dedup',
    description: '全量同步场景下比对目标端历史指纹，仅传输差异块，适用于周期性全量覆盖任务。',
    params: { chunker: '固定分块', blockSize: '8MB', fingerprint: 'CRC32C', index: '目标端索引' },
    scenes: ['全量同步', '集群再平衡'], enabled: false, priority: 2,
    hitCount: 2140, speedupPct: 18.6, savePct: 44.2, updatedAt: agoDay(8), owner: '吴嘉树',
  },
  {
    id: 'POL-0021', name: '大文件并发分片-16WAY', type: 'concurrency',
    description: '单文件按 64MB 分片并发传输，配合动态窗口调整，在长肥管道上跑满带宽。',
    params: { concurrency: 16, chunkSize: '64MB', window: '动态', resume: '断点续传' },
    scenes: ['跨云迁移', '大数据集群同步'], enabled: true, priority: 1,
    hitCount: 18640, speedupPct: 46.2, savePct: 0, updatedAt: agoDay(1), owner: '郑亦航',
  },
  {
    id: 'POL-0022', name: '小文件并发流水线', type: 'concurrency',
    description: '按目录维度并发拉取，单目录内保序，避免海量小文件串行导致的握手放大。',
    params: { concurrency: 32, batchSize: '512', order: '目录内保序' },
    scenes: ['边缘回传', '素材同步'], enabled: true, priority: 2,
    hitCount: 6420, speedupPct: 38.4, savePct: 0, updatedAt: agoDay(6), owner: '孙梦琪',
  },
  {
    id: 'POL-0008', name: '跨域智能选路-最低时延', type: 'routing',
    description: '每 30 秒探测各链路质量，按时延、丢包与成本加权评分选择最优路径，支持主备秒级切换。',
    params: { probeInterval: '30s', weight: '时延 0.5 / 丢包 0.3 / 成本 0.2', failover: '自动主备' },
    scenes: ['跨域传输', '跨境同步'], enabled: true, priority: 1,
    hitCount: 15280, speedupPct: 28.6, savePct: 12.8, updatedAt: agoDay(2), owner: '何思远',
  },
  {
    id: 'POL-0009', name: '带宽成本优先选路', type: 'routing',
    description: '在满足时延 SLA 的前提下优先选择闲时计费链路，将非实时任务的出网成本压到最低。',
    params: { probeInterval: '60s', weight: '成本 0.6 / 时延 0.3 / 丢包 0.1', failover: '手动确认' },
    scenes: ['归档冷备', '离线同步'], enabled: true, priority: 2,
    hitCount: 5860, speedupPct: -4.2, savePct: 33.6, updatedAt: agoDay(9), owner: '沈亦舟',
  },
  {
    id: 'POL-0051', name: '指数退避重传', type: 'retry',
    description: '失败分片按 1s/2s/4s/8s 指数退避重试，最多 5 次；连续失败率超 20% 时自动降级并发数。',
    params: { maxRetry: 5, backoff: '指数退避', degradeThreshold: '20%' },
    scenes: ['弱网链路', '跨境传输'], enabled: true, priority: 1,
    hitCount: 22460, speedupPct: 6.4, savePct: 2.1, updatedAt: agoDay(4), owner: '唐婉清',
  },
];

/* ------------------------------------------------------------------ */
/* 告警                                                                */
/* ------------------------------------------------------------------ */
type AlertSeed = [AlertItem['level'], string, string, AlertItem['targetType'], string, string, string, string, AlertItem['status'], number, string];

const alertSeeds: AlertSeed[] = [
  ['P0', '跨境链路完全中断', '链路中断', 'link', 'LINK-0020', '新加坡-海外 → 法兰克福-海外', '连通性', '探测失败', 'firing', 26, '联系海外机房确认网络割接窗口，必要时切换至备用中转节点（中国香港）。'],
  ['P1', '链路丢包率持续超阈值', '链路质量劣化', 'link', 'LINK-0018', '成都-西南1 → 上海-华东1', '丢包率', '8.6%', 'firing', 1580, '建议将主链路切换至备用线路（电信 → 联通），并降低该链路并发分片数至 8。'],
  ['P1', '任务校验失败率超 5%', '校验失败', 'job', 'JOB-20261019-1013', 'HDFS 集群扩容数据再平衡', '校验失败率', '7.2%', 'firing', 640, '检查源端文件是否在传输过程中被改写，建议开启快照读并重跑校验。'],
  ['P2', '节点磁盘使用率超过 80%', '容量告警', 'node', 'NODE-SZ-01', '华南1-深圳-备份节点', '磁盘使用率', '82.4%', 'firing', 3200, '清理 7 天前的临时分片文件，或将归档任务调度至华东1节点。'],
  ['P2', '任务速率跌零超过 5 分钟', '速率跌零', 'job', 'JOB-20261019-1021', '财务月结归档-冷备至法兰克福', '传输速率', '0 MB/s', 'firing', 412, '目标端节点已离线，任务将在节点恢复后自动重试。'],
  ['P3', '并发分片队列积压', '队列积压', 'node', 'NODE-CD-01', '西南1-成都-接入节点', '排队分片数', '1,286', 'firing', 760, '适当降低新建任务的并发数，或扩容该节点 worker 数量。'],
  ['P1', '证书将于 7 天内过期', '证书过期', 'system', 'SYS-CERT-03', 'SFTP 接入证书（partner-gw）', '剩余有效期', '6 天', 'firing', 8640, '联系合作方更新证书并在连接器中重新上传，避免到期后连接中断。'],
  ['P2', '带宽峰值超过配额 90%', '带宽超限', 'node', 'NODE-SH-01', '华东1-上海-接入节点', '带宽利用率', '91.2%', 'acked', 2400, '将该节点上的 P2/P3 任务调度至 22:00 后执行。'],
  ['P1', '目标端写入超时连续重试', '写入超时', 'job', 'JOB-20261019-1016', '合作伙伴数据交换-华东', '重试次数', '5 次', 'acked', 1860, '确认目标 OBS 桶配额与 ACL 配置，必要时切换目标节点。'],
  ['P2', '边缘节点心跳延迟', '节点降级', 'node', 'NODE-EDGE-003', '成都-门店边缘节点-003', '心跳延迟', '8.4s', 'acked', 3200, '门店网络抖动，建议排查本地专线并临时降低回传并发。'],
  ['P3', '任务进度长时间无变化', '进度停滞', 'job', 'JOB-20261019-1031', '报表快照分发-西北边缘', '进度变化', '0% / 30min', 'acked', 5400, '任务已暂停，等待业务方确认窗口后恢复。'],
  ['P0', '核心链路 RTT 突增 4 倍', '链路质量劣化', 'link', 'LINK-0013', '上海-华东1 → 北京-华北2', 'RTT', '118ms', 'acked', 960, '已切换至备用链路（联通），正在观察恢复情况。'],
  ['P2', '节点 CPU 持续高于 85%', '资源告警', 'node', 'NODE-BJ-02', '华北2-北京-汇聚节点', 'CPU 使用率', '87.6%', 'acked', 4200, '压缩策略 Zstd-19 占用偏高，已临时下调至 12 级。'],
  ['P1', '分片指纹索引不一致', '校验失败', 'job', 'JOB-20261019-1009', '医疗影像脱敏传输-影像中心', '索引差异', '412 块', 'resolved', 7200, '重建目标端索引后重传差异块，已恢复正常。'],
  ['P3', '连接器连通性检测失败', '连接异常', 'system', 'CONN-004', 'MinIO 归档集群', '连通性', '超时 3s', 'resolved', 5400, '连接器凭证轮换导致，更新 AK/SK 后恢复。'],
  ['P2', '任务重试次数超阈值', '重传激增', 'job', 'JOB-20261019-1028', '门店视频回传-西南批次', '重试次数', '12 次', 'resolved', 6300, '门店侧网络恢复，任务已完成重传。'],
  ['P3', '对象存储 5xx 错误率升高', '上游异常', 'system', 'SYS-OSS-SH', '阿里云 OSS 华东1', '5xx 比例', '1.8%', 'resolved', 3600, '云厂商侧抖动，已自行恢复。'],
  ['P2', '传输任务队列积压超过 200', '队列积压', 'system', 'SYS-SCHEDULER', '全局调度器', '排队任务数', '236', 'resolved', 4800, '扩容 2 个 worker 后队列已消化。'],
  ['P1', '节点内存使用率超过 90%', '资源告警', 'node', 'NODE-IDC-02', '上海-外高桥自建机房', '内存使用率', '91.4%', 'resolved', 5100, '重启 agent 并调整 JVM 堆参数后恢复。'],
  ['P3', '低频归档任务超时未完成', '任务超时', 'job', 'JOB-20261019-1024', '历史订单归档至低频', '执行时长', '6.2h', 'resolved', 14400, '归档任务改为错峰执行，已完成。'],
  ['P2', '链路可用带宽低于 1Gbps', '带宽不足', 'link', 'LINK-0014', '广州-华南1 → 上海-华东1', '可用带宽', '860Mbps', 'resolved', 3900, '临时提升该链路 QoS 优先级后恢复。'],
  ['P3', '审计日志写入延迟', '系统告警', 'system', 'SYS-AUDIT', '审计日志服务', '写入延迟', '2.4s', 'resolved', 2600, '磁盘 IO 抖动，已迁移至独立磁盘。'],
  ['P0', '跨境数据出境任务被拦截', '合规拦截', 'job', 'JOB-20261019-1030', '跨境数据出境备案包传输', '策略命中', '未备案', 'resolved', 3300, '补齐备案编号后重新提交，已通过。'],
  ['P2', '压缩比低于预期阈值', '策略效果下降', 'job', 'JOB-20261019-1012', '营销活动埋点日志归集', '压缩比', '1.28:1', 'resolved', 5400, '该批次日志已为压缩格式，调整为不压缩直传。'],
  ['P3', '镜像节点版本落后', '版本告警', 'node', 'NODE-GZ-01', '华南1-广州-接入节点', 'Agent 版本', 'v2.3.8', 'resolved', 8640, '已纳入下次滚动升级窗口。'],
  ['P2', '告警通知渠道投递失败', '通知异常', 'system', 'SYS-WEBHOOK', 'Webhook 通知渠道', '投递成功率', '62%', 'resolved', 4200, '对方网关限流，已改为批量投递。'],
];

export const ALERTS: AlertItem[] = alertSeeds.map((s, i) => {
  const [level, title, type, targetType, targetId, targetName, metric, value, status, duration, suggestion] = s;
  return {
    id: `ALT-20261019-${String(118 - i).padStart(3, '0')}`,
    level, title, type, targetType, targetId, targetName, metric, value,
    threshold: metric === '丢包率' ? '5%' : metric === '校验失败率' ? '5%' : metric === '磁盘使用率' ? '80%' : metric === 'CPU 使用率' ? '85%' : metric === '内存使用率' ? '90%' : metric === '带宽利用率' ? '90%' : '—',
    status,
    firedAt: ago(duration),
    ackedBy: status === 'firing' ? undefined : pick(['陈屿', '林书禾', '赵启明', '周雨桐']),
    ackedAt: status === 'firing' ? undefined : ago(Math.round(duration * 0.4)),
    resolvedAt: status === 'resolved' ? ago(Math.round(duration * 0.15)) : undefined,
    durationSec: duration * 60,
    suggestion,
  };
});

/* ------------------------------------------------------------------ */
/* 审批                                                                */
/* ------------------------------------------------------------------ */
const approvalTitles: [string, Approval['type'], Approval['riskLevel'], string][] = [
  ['华东→华南 跨域数据同步申请', 'cross_region', 'medium', '营销活动明细需同步至广州分析集群，涉及跨域出网 1.8TB。'],
  ['医疗影像数据脱敏传输申请', 'sensitive_data', 'high', '影像中心原始 DICOM 需脱敏后传输至北京对象存储，涉及患者隐私字段 12 个。'],
  ['月末结账窗口带宽提升申请', 'bandwidth_boost', 'medium', '财务月结期间将归档链路带宽由 2Gbps 临时提升至 6Gbps，持续 6 小时。'],
  ['新增 MinIO 归档集群连接器', 'new_connector', 'low', '接入新建 MinIO 集群作为冷备目标，仅内网访问。'],
  ['跨境数据出境备案包传输', 'sensitive_data', 'high', '向新加坡节点传输已备案的合规数据包，涉及用户标识字段。'],
  ['双十一大促日志回传带宽保障', 'bandwidth_boost', 'medium', '大促期间边缘节点回传带宽提升至 4Gbps，保障实时看板。'],
  ['风控特征库跨部门共享', 'cross_region', 'medium', '风控特征需共享至智能营销部用于人群圈选，已做脱敏。'],
  ['历史订单数据归档至海外节点', 'cross_region', 'low', '2024 年历史订单归档至法兰克福冷备节点，仅归档不回流。'],
  ['客服录音数据合规调阅传输', 'sensitive_data', 'high', '质检部门调阅 300 小时录音，需脱敏并留存审计记录。'],
  ['新增合作伙伴 SFTP 接入', 'new_connector', 'medium', '合作方通过专线 SFTP 交换对账文件，需开通白名单。'],
  ['训练样本集跨境传输申请', 'cross_region', 'high', '模型训练样本需传输至新加坡训练集群，含脱敏用户行为特征。'],
  ['供应链主数据全量同步窗口', 'cross_region', 'low', '主数据由上海同步至广州，全量 320GB，夜间执行。'],
  ['日志冷数据下沉带宽申请', 'bandwidth_boost', 'low', '日志下沉任务占用带宽提升至 3Gbps，错峰执行。'],
  ['测试环境数据脱敏导出', 'sensitive_data', 'medium', '生产数据脱敏后导入测试环境，涉及 8 张核心表。'],
  ['新增 AWS S3 海外连接器', 'new_connector', 'low', '接入硅谷区域 S3 用于海外业务数据回传。'],
  ['BI 快照跨域分发申请', 'cross_region', 'low', '每日经营快照分发至 5 个边缘节点，数据量 42GB。'],
  ['风控模型特征回灌审批', 'sensitive_data', 'high', '特征回灌至离线数仓，涉及设备指纹等敏感字段。'],
  ['视频监控集中存储迁移申请', 'cross_region', 'medium', '门店监控视频集中迁移至武汉节点，涉及 3.6TB。'],
  ['临时提升单任务并发至 64', 'bandwidth_boost', 'low', '大文件迁移窗口内临时提升并发，预计占用 8Gbps。'],
  ['合作方数据交换通道开通', 'new_connector', 'medium', '与三方数据服务商建立专线通道，仅传输对账文件。'],
];

const approvalApplicants = ['周雨桐', '何思远', '孙梦琪', '吴嘉树', '郑亦航', '唐婉清', '许南星', '沈亦舟'];

export const APPROVALS: Approval[] = approvalTitles.map((t, i) => {
  const [title, type, risk, reason] = t;
  const status: Approval['status'] = i < 8 ? 'pending' : i < 16 ? 'approved' : i < 19 ? 'rejected' : 'expired';
  const createdMin = i < 8 ? randInt(30, 600) : randInt(1200, 9000);
  const slaLeft = randInt(40, 480);
  return {
    id: `APV-20261019-${String(21 + i).padStart(3, '0')}`,
    title,
    applicant: approvalApplicants[i % approvalApplicants.length],
    dept: depts[i % depts.length],
    type,
    jobRef: i % 3 === 0 ? `JOB-20261019-${String(1042 - i).padStart(4, '0')}` : undefined,
    reason,
    riskLevel: risk,
    status,
    currentNode: status === 'pending' ? ['直属主管审批', '数据安全审批', '平台管理员审批'][i % 3] : '流程结束',
    createdAt: ago(createdMin),
    slaDeadline: NOW.add(slaLeft, 'minute').toISOString(),
    impact: pick([
      '预计占用带宽 2.4 Gbps，持续约 3 小时',
      '预计传输 1.8 TB 数据，占用出网流量配额 12%',
      '预计占用带宽 6 Gbps，持续 6 小时（夜间窗口）',
      '预计传输 320 GB，占用内网带宽 18%',
    ]),
    history: [
      { node: '发起申请', approver: approvalApplicants[i % approvalApplicants.length], action: 'pass', time: ago(createdMin) },
      { node: '直属主管审批', approver: '赵启明', action: status === 'rejected' ? 'reject' : 'pass', comment: status === 'rejected' ? '数据范围过大，请拆分后重新提交' : '业务必要，同意', time: ago(Math.max(10, createdMin - 40)) },
      { node: '数据安全审批', approver: '林书禾', action: type === 'sensitive_data' ? (status === 'pending' ? 'pending' : 'pass') : 'pass', comment: type === 'sensitive_data' ? '已确认脱敏规则覆盖全部敏感字段' : undefined, time: status === 'pending' ? undefined : ago(Math.max(5, createdMin - 90)) },
      { node: '平台管理员审批', approver: '陈屿', action: status === 'pending' ? 'pending' : status === 'rejected' ? 'reject' : 'pass', time: status === 'pending' ? undefined : ago(Math.max(2, createdMin - 150)) },
    ],
  };
});

/* ------------------------------------------------------------------ */
/* 数据集                                                              */
/* ------------------------------------------------------------------ */
const datasetSeeds: [string, string, Dataset['type'], number, string, Dataset['classification']][] = [
  ['dwd_user_behavior', '用户', 'structured', 2639, '每日', 'internal'],
  ['dws_user_profile', '用户', 'structured', 2400, '每日', 'sensitive'],
  ['dwd_order_detail', '交易', 'structured', 4800, '每小时', 'internal'],
  ['ods_order_raw', '交易', 'structured', 6200, '每小时', 'internal'],
  ['dwd_payment_flow', '交易', 'structured', 860, '每日', 'sensitive'],
  ['dim_product', '交易', 'structured', 42, '每周', 'public'],
  ['dwd_tracking_event', '营销', 'structured', 1860, '每日', 'internal'],
  ['ads_campaign_report', '营销', 'structured', 120, '每日', 'internal'],
  ['dwd_ad_click_log', '营销', 'file', 940, '每小时', 'internal'],
  ['dim_customer_segment', '营销', 'structured', 36, '每日', 'sensitive'],
  ['dwd_supply_chain_order', '供应链', 'structured', 320, '每日', 'internal'],
  ['dim_supplier', '供应链', 'structured', 18, '每周', 'public'],
  ['ods_inventory_snapshot', '供应链', 'structured', 780, '每日', 'internal'],
  ['dwd_risk_feature', '风控', 'structured', 86, '每小时', 'sensitive'],
  ['dws_risk_score', '风控', 'structured', 240, '每日', 'sensitive'],
  ['ods_device_fingerprint', '风控', 'structured', 460, '每日', 'sensitive'],
  ['dwd_credit_report', '风控', 'file', 58, '每日', 'sensitive'],
  ['ods_fin_voucher', '财务', 'file', 640, '每月', 'internal'],
  ['dwd_settlement', '财务', 'structured', 96, '每日', 'sensitive'],
  ['ads_fin_report', '财务', 'structured', 12, '每月', 'internal'],
  ['pacs_imaging_2026', '其他', 'file', 1240, '每日', 'sensitive'],
  ['retail_store_video', '其他', 'file', 3600, '每日', 'internal'],
  ['ml_ctr_train_v7', '其他', 'file', 620, '每周', 'internal'],
  ['app_log_cold_202609', '其他', 'file', 3200, '每月', 'internal'],
];

export const DATASETS: Dataset[] = datasetSeeds.map((s, i) => {
  const [name, domain, type, gb, freq, cls] = s;
  return {
    id: `DS-${1024 + i}`,
    name,
    domain,
    type,
    sizeBytes: Math.round(gb * 1024 ** 3),
    fileCount: type === 'file' ? randInt(2000, 480000) : randInt(12, 4200),
    updateFreq: freq,
    owner: owners[i % owners.length],
    classification: cls,
    location: `oss://datalake/${name}/`,
    referencedJobs: randInt(0, 9),
    fields:
      type === 'structured'
        ? [
            { name: 'id', type: 'bigint', cnName: '主键', sensitive: false },
            { name: 'user_id', type: 'bigint', cnName: '用户ID', sensitive: true },
            { name: 'mobile', type: 'varchar(32)', cnName: '手机号', sensitive: true },
            { name: 'event_type', type: 'varchar(64)', cnName: '事件类型', sensitive: false },
            { name: 'amount', type: 'decimal(18,2)', cnName: '金额', sensitive: false },
            { name: 'dt', type: 'date', cnName: '分区日期', sensitive: false },
          ]
        : undefined,
  };
});

/* ------------------------------------------------------------------ */
/* 连接器 / 用户 / 审计 / 空间 / 模型 / 规则                            */
/* ------------------------------------------------------------------ */
export const CONNECTORS: Connector[] = [
  { id: 'CONN-001', name: '阿里云 OSS - 华东1', type: 'OSS', endpoint: 'oss-cn-shanghai.aliyuncs.com', region: '华东1（上海）', status: 'normal', lastCheckedAt: ago(12), throughputMbps: 8460 },
  { id: 'CONN-002', name: '华为云 OBS - 华北2', type: 'OBS', endpoint: 'obs.cn-north-4.myhuaweicloud.com', region: '华北2（北京）', status: 'normal', lastCheckedAt: ago(8), throughputMbps: 9120 },
  { id: 'CONN-003', name: 'AWS S3 - 新加坡', type: 'S3', endpoint: 's3.ap-southeast-1.amazonaws.com', region: '新加坡', status: 'normal', lastCheckedAt: ago(26), throughputMbps: 2140 },
  { id: 'CONN-004', name: 'MinIO 归档集群', type: 'MinIO', endpoint: 'minio-archive.idc.internal:9000', region: '华北2（北京）', status: 'error', lastCheckedAt: ago(46), throughputMbps: 0 },
  { id: 'CONN-005', name: 'HDFS 离线数仓', type: 'HDFS', endpoint: 'hdfs://nn1.idc.internal:8020', region: '华北2（北京）', status: 'normal', lastCheckedAt: ago(5), throughputMbps: 7180 },
  { id: 'CONN-006', name: '合作方 SFTP 接入', type: 'SFTP', endpoint: 'sftp.partner-gw.com:22', region: '华东1（上海）', status: 'unverified', lastCheckedAt: ago(180), throughputMbps: 480 },
];

export const USERS: UserItem[] = [
  { id: 'U-001', name: '陈屿', account: 'chenyu', dept: '数据平台部', role: 'admin', email: 'chenyu@cloudflow.cn', phone: '138****2041', status: 'active', lastLoginAt: ago(4), avatarColor: '#2563EB' },
  { id: 'U-002', name: '林书禾', account: 'linshuhe', dept: '基础架构部', role: 'admin', email: 'linshuhe@cloudflow.cn', phone: '139****7712', status: 'active', lastLoginAt: ago(26), avatarColor: '#06B6D4' },
  { id: 'U-003', name: '赵启明', account: 'zhaoqiming', dept: '数据平台部', role: 'admin', email: 'zhaoqm@cloudflow.cn', phone: '137****3388', status: 'active', lastLoginAt: ago(58), avatarColor: '#16A34A' },
  { id: 'U-004', name: '周雨桐', account: 'zhouyutong', dept: '财务共享中心', role: 'operator', email: 'zhouyt@cloudflow.cn', phone: '186****9021', status: 'active', lastLoginAt: ago(12), avatarColor: '#8B5CF6' },
  { id: 'U-005', name: '吴嘉树', account: 'wujiashu', dept: '风控科技部', role: 'operator', email: 'wujs@cloudflow.cn', phone: '135****4412', status: 'active', lastLoginAt: ago(90), avatarColor: '#F59E0B' },
  { id: 'U-006', name: '郑亦航', account: 'zhengyihang', dept: '基础架构部', role: 'operator', email: 'zhengyh@cloudflow.cn', phone: '150****6677', status: 'active', lastLoginAt: ago(6), avatarColor: '#EF4444' },
  { id: 'U-007', name: '孙梦琪', account: 'sunmengqi', dept: '智能营销部', role: 'operator', email: 'sunmq@cloudflow.cn', phone: '188****1234', status: 'active', lastLoginAt: ago(240), avatarColor: '#0EA5E9' },
  { id: 'U-008', name: '何思远', account: 'hesiyuan', dept: '供应链技术部', role: 'operator', email: 'hesy@cloudflow.cn', phone: '133****8899', status: 'active', lastLoginAt: ago(420), avatarColor: '#64748B' },
  { id: 'U-009', name: '郭子谦', account: 'guoziqian', dept: '客户服务中心', role: 'operator', email: 'guozq@cloudflow.cn', phone: '155****3366', status: 'disabled', lastLoginAt: agoDay(32), avatarColor: '#DB2777' },
  { id: 'U-010', name: '唐婉清', account: 'tangwanqing', dept: '安全合规部', role: 'operator', email: 'tangwq@cloudflow.cn', phone: '182****5521', status: 'active', lastLoginAt: ago(150), avatarColor: '#7C3AED' },
  { id: 'U-011', name: '沈亦舟', account: 'shenyizhou', dept: '数据平台部', role: 'viewer', email: 'shenyz@cloudflow.cn', phone: '176****7788', status: 'active', lastLoginAt: ago(300), avatarColor: '#0891B2' },
  { id: 'U-012', name: '许南星', account: 'xunanxing', dept: '智能营销部', role: 'viewer', email: 'xunx@cloudflow.cn', phone: '131****2244', status: 'active', lastLoginAt: ago(600), avatarColor: '#65A30D' },
];

const auditActions: [string, string][] = [
  ['创建传输任务', 'JOB-20261019-1042'],
  ['暂停传输任务', 'JOB-20261019-1031'],
  ['重试传输任务', 'JOB-20261019-1016'],
  ['删除优化策略', 'POL-0013'],
  ['启用优化策略', 'POL-0031'],
  ['修改告警规则', 'RULE-004'],
  ['审批通过', 'APV-20261019-009'],
  ['审批驳回', 'APV-20261019-019'],
  ['新增连接器', 'CONN-006'],
  ['修改用户角色', 'U-009'],
  ['导出报表', 'REPORT-202610'],
  ['轮换访问密钥', 'CONN-004'],
];

export const AUDIT_LOGS: AuditLog[] = Array.from({ length: 60 }).map((_, i) => {
  const [action, obj] = auditActions[i % auditActions.length];
  return {
    id: `LOG-${String(9021 - i)}`,
    time: ago(i * 37 + randInt(0, 20)),
    user: USERS[i % USERS.length].name,
    action,
    object: obj,
    ip: `10.${20 + (i % 6)}.${randInt(1, 20)}.${randInt(10, 240)}`,
    result: i % 17 === 0 ? 'failed' : 'success',
    detail:
      action.includes('修改') || action.includes('轮换')
        ? { before: { value: '旧配置', updatedAt: agoDay(30) }, after: { value: '新配置', updatedAt: ago(i * 37) } }
        : { requestId: `req-${randInt(100000, 999999)}`, operator: USERS[i % USERS.length].account },
  };
});

const spaceSeeds: Omit<Space, 'members'>[] = [
  { id: 'SP-01', name: '数据平台部', dept: '数据平台部', owner: '陈屿', datasetCount: 9, monthlyBytes: 42.8 * 1024 ** 3 * 1024, quotaPct: 68, myRole: '所有者' },
  { id: 'SP-02', name: '风控科技部', dept: '风控科技部', owner: '吴嘉树', datasetCount: 6, monthlyBytes: 6.2 * 1024 ** 3 * 1024, quotaPct: 34, myRole: '编辑者' },
  { id: 'SP-03', name: '智能营销部', dept: '智能营销部', owner: '孙梦琪', datasetCount: 5, monthlyBytes: 12.4 * 1024 ** 3 * 1024, quotaPct: 52, myRole: '编辑者' },
  { id: 'SP-04', name: '供应链专班', dept: '供应链技术部', owner: '何思远', datasetCount: 4, monthlyBytes: 4.8 * 1024 ** 3 * 1024, quotaPct: 27, myRole: '查看者' },
  { id: 'SP-05', name: '安全合规组', dept: '安全合规部', owner: '唐婉清', datasetCount: 3, monthlyBytes: 1.6 * 1024 ** 3 * 1024, quotaPct: 19, myRole: '编辑者' },
];

export const SPACES: Space[] = spaceSeeds.map((s, i): Space => ({
  ...s,
  members: USERS.slice(i, i + 4).map((u, idx) => ({
    name: u.name,
    role: idx === 0 ? '所有者' : idx === 1 ? '编辑者' : '查看者',
    dept: u.dept,
    activeAt: u.lastLoginAt,
  })),
}));

export const MODELS: ModelItem[] = [
  { id: 'M-01', name: '拥塞预测模型', algo: 'XGBoost', samples: '2,846 万', accuracy: 94.6, deployedAt: agoDay(9), status: 'production', desc: '基于链路历史 RTT/丢包/利用率预测未来 5 分钟拥塞概率，用于提前切换路径。' },
  { id: 'M-02', name: '压缩比预测模型', algo: 'LightGBM', samples: '1,284 万', accuracy: 91.2, deployedAt: agoDay(21), status: 'production', desc: '根据文件类型、熵值、历史压缩结果预测最优压缩级别，避免无效压缩开销。' },
  { id: 'M-03', name: '链路质量打分模型', algo: 'LSTM', samples: '3,620 万', accuracy: 96.1, deployedAt: agoDay(4), status: 'gray', desc: '时序模型对每条链路做 0–100 质量评分，驱动智能选路决策。' },
  { id: 'M-04', name: '任务耗时预测模型', algo: 'XGBoost', samples: '860 万', accuracy: 88.4, deployedAt: agoDay(46), status: 'production', desc: '预测任务完成时间，用于 ETA 展示与调度窗口规划。' },
];

export const EXPERIMENTS: Experiment[] = [
  { id: 'EXP-01', name: 'Zstd 级别 12 vs 19', metric: '有效吞吐(MB/s)', control: '412.6', treatment: '438.2', lift: 6.2, confidence: 97.4, status: 'done', startedAt: agoDay(12), series: { control: [408, 412, 410, 415, 412, 418, 414, 412], treatment: [430, 436, 433, 441, 438, 442, 436, 438] } },
  { id: 'EXP-02', name: '并发 16 vs 32 分片', metric: '平均传输速率(MB/s)', control: '486.3', treatment: '548.7', lift: 12.8, confidence: 99.1, status: 'running', startedAt: agoDay(5), series: { control: [470, 482, 478, 490, 486, 492, 484, 486], treatment: [520, 534, 541, 552, 546, 558, 549, 549] } },
  { id: 'EXP-03', name: 'CDC 分块 2MB vs 4MB', metric: '去重节省率(%)', control: '37.8', treatment: '41.2', lift: 9.0, confidence: 94.8, status: 'done', startedAt: agoDay(28), series: { control: [36, 38, 37, 39, 38, 38, 37, 38], treatment: [40, 41, 40, 42, 41, 42, 41, 41] } },
  { id: 'EXP-04', name: '智能选路 30s vs 60s 探测', metric: '平均 RTT(ms)', control: '34.2', treatment: '31.6', lift: 7.6, confidence: 92.3, status: 'done', startedAt: agoDay(35), series: { control: [35, 34, 34, 35, 34, 34, 34, 34], treatment: [32, 31, 32, 31, 32, 31, 32, 32] } },
  { id: 'EXP-05', name: '退避重传 3 vs 5 次', metric: '任务成功率(%)', control: '98.1', treatment: '98.6', lift: 0.5, confidence: 88.6, status: 'running', startedAt: agoDay(8), series: { control: [97.9, 98.0, 98.1, 98.2, 98.0, 98.1, 98.1, 98.1], treatment: [98.4, 98.5, 98.6, 98.6, 98.7, 98.6, 98.5, 98.6] } },
];

export const RULES: AlertRule[] = [
  { id: 'RULE-001', name: '链路丢包率超阈值', targetType: '链路', metric: '丢包率', operator: '>', threshold: '5 %', duration: '连续 3 分钟', level: 'P1', channels: ['邮件', 'Webhook'], enabled: true, updatedAt: agoDay(2) },
  { id: 'RULE-002', name: '链路完全中断', targetType: '链路', metric: '连通性', operator: '=', threshold: '探测失败', duration: '连续 1 分钟', level: 'P0', channels: ['邮件', '短信', 'Webhook'], enabled: true, updatedAt: agoDay(6) },
  { id: 'RULE-003', name: '节点离线', targetType: '节点', metric: '心跳', operator: '>', threshold: '90 s', duration: '连续 1 分钟', level: 'P0', channels: ['短信', 'Webhook'], enabled: true, updatedAt: agoDay(6) },
  { id: 'RULE-004', name: '节点磁盘使用率过高', targetType: '节点', metric: '磁盘使用率', operator: '>', threshold: '80 %', duration: '连续 5 分钟', level: 'P2', channels: ['邮件'], enabled: true, updatedAt: agoDay(15) },
  { id: 'RULE-005', name: '任务校验失败率过高', targetType: '任务', metric: '校验失败率', operator: '>', threshold: '5 %', duration: '连续 3 分钟', level: 'P1', channels: ['邮件', 'Webhook'], enabled: true, updatedAt: agoDay(9) },
  { id: 'RULE-006', name: '任务速率跌零', targetType: '任务', metric: '传输速率', operator: '=', threshold: '0 MB/s', duration: '连续 5 分钟', level: 'P2', channels: ['邮件'], enabled: true, updatedAt: agoDay(19) },
  { id: 'RULE-007', name: '调度队列积压', targetType: '系统', metric: '排队任务数', operator: '>', threshold: '200', duration: '连续 10 分钟', level: 'P2', channels: ['Webhook'], enabled: false, updatedAt: agoDay(26) },
  { id: 'RULE-008', name: '证书 7 天内到期', targetType: '系统', metric: '证书剩余有效期', operator: '<', threshold: '7 天', duration: '立即', level: 'P1', channels: ['邮件', '短信'], enabled: true, updatedAt: agoDay(31) },
];

export const NOTIFICATIONS: NotificationItem[] = [
  { id: 'N-01', title: '跨境链路完全中断', desc: '新加坡-海外 → 法兰克福-海外 探测失败，已持续 26 分钟', time: ago(4), read: false, level: 'P0' },
  { id: 'N-02', title: '审批待办：医疗影像数据脱敏传输', desc: '周雨桐 提交的敏感数据申请等待你审批，剩余 3 小时 12 分', time: ago(18), read: false, level: 'P1' },
  { id: 'N-03', title: '任务已完成', desc: '视频监控集中存储迁移 已完成，共传输 3.6 TB', time: ago(52), read: false, level: 'P3' },
  { id: 'N-04', title: '节点已恢复', desc: '华东1-上海-接入节点 带宽利用率回落至 62%', time: ago(96), read: true, level: 'P3' },
  { id: 'N-05', title: '策略已更新', desc: '大文件高压缩-Zstd19 已由 林书禾 更新至 v3', time: ago(180), read: true, level: 'P3' },
  { id: 'N-06', title: '容量提醒', desc: '华南1-深圳-备份节点 磁盘使用率 82.4%，建议清理', time: ago(240), read: true, level: 'P2' },
];

/* ------------------------------------------------------------------ */
/* 时间序列生成                                                        */
/* ------------------------------------------------------------------ */
export const throughputSeries = (): { time: string; up: number; down: number }[] => {
  const points: { time: string; up: number; down: number }[] = [];
  for (let i = 287; i >= 0; i -= 1) {
    const t = NOW.subtract(i * 5, 'minute');
    const hour = t.hour() + t.minute() / 60;
    const wave = 0.62 + 0.38 * Math.sin(((hour - 8) / 24) * Math.PI * 2) + (hour > 1 && hour < 5 ? 0.18 : 0);
    const up = Math.max(80, 420 * wave + Math.sin(i / 7) * 26 + (i % 23 === 0 ? 60 : 0));
    const down = Math.max(60, 300 * wave + Math.cos(i / 9) * 22 + (i % 31 === 0 ? 42 : 0));
    points.push({ time: t.format('HH:mm'), up: Number(up.toFixed(1)), down: Number(down.toFixed(1)) });
  }
  return points;
};

export const dailySeries = (): { date: string; jobs: number; bytes: number; successRate: number; cost: number }[] =>
  Array.from({ length: 30 }).map((_, idx) => {
    const i = 29 - idx;
    const d = NOW.subtract(i, 'day');
    const weekend = d.day() === 0 || d.day() === 6;
    const base = weekend ? 0.72 : 1;
    return {
      date: d.format('MM-DD'),
      jobs: Math.round((980 + rand(-140, 220)) * base),
      bytes: Number(((9.4 + rand(-1.6, 3.2)) * base).toFixed(2)),
      successRate: Number((97.2 + rand(0, 2.1)).toFixed(1)),
      cost: Math.round((16800 + rand(-2400, 4200)) * base),
    };
  });

export const heatmapSeries = (): number[][] =>
  Array.from({ length: 7 }).map((_, d) =>
    Array.from({ length: 24 }).map((__, h) => {
      const work = h >= 9 && h <= 20 ? 1 : 0.35;
      const night = h >= 1 && h <= 5 ? 0.5 : 1;
      return Math.round((rand(20, 70) * work + (d >= 5 ? -12 : 0)) * night + rand(0, 18));
    }),
  );

export const sparkSeries = (seed: number): number[] => {
  const r = mulberry32(seed);
  return Array.from({ length: 24 }).map((_, i) => 30 + r() * 40 + Math.sin(i / 3) * 12);
};
