import dayjs from 'dayjs';
import type { Dataset, Member, Workspace, WorkspaceRole } from '../types';
import { USERS } from './base';

interface Seed {
  name: string;
  description: string;
  visibility: 'public' | 'private';
  owner: string;
  usedGB: number;
  quotaGB: number;
}

const SEEDS: Seed[] = [
  { name: '数据中台共享空间', description: '面向全公司的指标口径、维表与公共数据资产，统一出口。', visibility: 'public', owner: '周野', usedGB: 1840, quotaGB: 5120 },
  { name: 'AI 训练语料库', description: '大模型与推荐算法的训练语料、标注集与评测集。', visibility: 'private', owner: '张沐', usedGB: 3260, quotaGB: 4096 },
  { name: '财务数据专区', description: '月结、对账与经营分析数据，仅财务与审计角色可访问。', visibility: 'private', owner: '王砚', usedGB: 428, quotaGB: 1024 },
  { name: '影像资料归档', description: '医疗影像与质检影像的长期归档，冷存储优先。', visibility: 'public', owner: '吴桐', usedGB: 2480, quotaGB: 8192 },
  { name: '风控数据实验室', description: '风控事件流、设备指纹与黑名单样本的沙箱环境。', visibility: 'private', owner: '苏芮', usedGB: 612, quotaGB: 2048 },
  { name: '供应链主数据', description: '物料、供应商与库存主数据，供上下游系统分发。', visibility: 'public', owner: '赵岑', usedGB: 286, quotaGB: 1024 },
  { name: '客服语音分析', description: '通话录音、转写文本与情绪标签，用于质检模型训练。', visibility: 'private', owner: '孙禾', usedGB: 934, quotaGB: 2048 },
  { name: '合规审查隔离区', description: '涉敏数据的隔离审查空间，出入均需审批与留痕。', visibility: 'private', owner: '苏芮', usedGB: 168, quotaGB: 512 },
];

const DATASET_POOL = [
  ['订单事实表', 'dwd_order_fact', 'Parquet 数据集'],
  ['用户画像宽表', 'ads_user_profile', 'Parquet 数据集'],
  ['商品维表', 'dim_product', 'CSV 数据集'],
  ['门店维表', 'dim_store', 'CSV 数据集'],
  ['埋点事件明细', 'dwd_event_log', 'JSONL 数据集'],
  ['风控事件流', 'rt_risk_event', 'Kafka Topic'],
  ['模型特征快照', 'fct_model_feature', 'Parquet 数据集'],
  ['客服录音归档', 'ods_call_audio', '对象存储'],
  ['质检影像样本', 'ods_qc_image', '对象存储'],
  ['财务月结凭证', 'dwd_finance_voucher', '数据库表'],
  ['供应链主数据', 'dim_supply_master', 'CSV 数据集'],
  ['标注语料集', 'corpus_labeled_v3', 'JSONL 数据集'],
  ['评测基准集', 'benchmark_eval', 'Parquet 数据集'],
  ['日志归档包', 'ods_app_log', '压缩包'],
  ['设备指纹库', 'dim_device_fp', 'Parquet 数据集'],
  ['黑名单样本', 'ods_blacklist', 'CSV 数据集'],
  ['商品主数据', 'dim_item_master', 'CSV 数据集'],
  ['库存快照', 'dwd_inventory_snapshot', 'Parquet 数据集'],
  ['对账明细', 'dwd_recon_detail', '数据库表'],
  ['经营指标汇总', 'ads_biz_summary', 'Parquet 数据集'],
  ['通话转写文本', 'ods_asr_text', 'JSONL 数据集'],
  ['情绪标签集', 'ads_emotion_label', 'CSV 数据集'],
  ['影像元数据', 'dim_image_meta', 'Parquet 数据集'],
  ['审计快照', 'ods_audit_snapshot', 'JSONL 数据集'],
];

const ROLES: WorkspaceRole[] = ['editor', 'editor', 'viewer', 'viewer', 'editor'];

function buildMembers(owner: string, idx: number): Member[] {
  const others = USERS.filter((u) => u !== owner).slice(idx % 4, (idx % 4) + 5);
  const list: Member[] = [
    { name: owner, email: `${owner}@xinglan-tech.com`, role: 'owner', joinedAt: dayjs().subtract(300 - idx * 12, 'day').toISOString() },
  ];
  others.forEach((name, i) => {
    list.push({
      name,
      email: `${name}@xinglan-tech.com`,
      role: ROLES[i % ROLES.length],
      joinedAt: dayjs().subtract(180 - idx * 8 - i * 3, 'day').toISOString(),
    });
  });
  return list;
}

export const WORKSPACES: Workspace[] = SEEDS.map((seed, idx) => ({
  id: `WS-0${idx + 1}`,
  name: seed.name,
  description: seed.description,
  visibility: seed.visibility,
  owner: seed.owner,
  members: buildMembers(seed.owner, idx),
  datasetCount: 6,
  usedGB: seed.usedGB,
  quotaGB: seed.quotaGB,
  updatedAt: dayjs().subtract(idx * 5 + 1, 'hour').toISOString(),
}));

const NODE_BY_REGION = ['hz-prod-01', 'bj-prod-01', 'sz-hub-03', 'cd-compute-03', 'sg-gw-01', 'fra-archive-01'];

export const DATASETS: Dataset[] = WORKSPACES.flatMap((ws, wi) =>
  Array.from({ length: 6 }).map((_, di) => {
    const entry = DATASET_POOL[(wi * 3 + di) % DATASET_POOL.length];
    return {
      id: `DS-${wi + 1}${String(di + 1).padStart(2, '0')}`,
      workspaceId: ws.id,
      name: entry[0],
      type: entry[2],
      sourceNode: NODE_BY_REGION[(wi + di) % NODE_BY_REGION.length],
      sizeGB: 12 + ((wi * 37 + di * 59) % 480),
      version: `v${2 + ((wi + di) % 3)}.${(di * 3) % 10}`,
      updatedAt: dayjs().subtract(wi * 6 + di * 2 + 1, 'hour').toISOString(),
      taskId: `TSK-${dayjs().subtract(wi + di, 'day').format('YYYYMMDD')}-${1000 + wi * 70 + di * 7}`,
      sensitive: (wi + di) % 5 === 0,
    };
  }),
);
