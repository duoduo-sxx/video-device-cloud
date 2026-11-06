import {
  CONTRACT_TEMPLATES,
  DEPARTMENTS,
  EVIDENCE_TAGS,
  NODE_LIST,
  ORGS,
  PERSONS,
  RIGHT_SCOPES,
  SUB_CATEGORIES,
} from '@/utils/constants';
import { addressOf, didOf, hexHash } from '@/utils/hash';
import type {
  ApiKey,
  AuditLog,
  Block,
  ChainNode,
  Contract,
  ContractSigner,
  DataAsset,
  DisputeCase,
  Evidence,
  EvidencePackage,
  EvidenceStatus,
  EvidenceType,
  ForensicsTask,
  JudicialOrder,
  JudicialStatus,
  Member,
  MonitorHit,
  NotificationItem,
  RightsCategory,
  RightsEvent,
  RightsRecord,
  RightsStatus,
  RoleCode,
  Transaction,
  TxType,
} from '@/types';

/* ------------------------------------------------------------------ */
/* 基础随机                                                            */
/* ------------------------------------------------------------------ */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rand = mulberry32(20261019);

export const rint = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
export const chance = (p: number) => rand() < p;

export const NOW = Date.now();
export const BASE_HEIGHT = 2486921;
export const BLOCK_TIME = 2100; // ms

/** 由时间反推区块高度，保证全局一致 */
export function heightForDate(date: string | number): number {
  const diffMs = NOW - new Date(date).getTime();
  const blocks = Math.floor(diffMs / BLOCK_TIME);
  return Math.max(1, BASE_HEIGHT - blocks);
}

export function blockHashOf(height: number): string {
  return hexHash(`xh-block-${height}`);
}

function pad(n: number, len: number) {
  return String(n).padStart(len, '0');
}

/* ------------------------------------------------------------------ */
/* 素材池                                                              */
/* ------------------------------------------------------------------ */

const FILE_POOL: Record<EvidenceType, { name: string; size: number; mime: string }[]> = {
  document: [
    { name: '品牌授权合同_2026Q3.pdf', size: 2_412_000, mime: 'application/pdf' },
    { name: '《长夜将明》剧本杀剧本_定稿.docx', size: 1_284_000, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { name: '2026年度版权运营方案.pdf', size: 5_120_000, mime: 'application/pdf' },
    { name: '非遗纹样使用说明_第2版.pdf', size: 890_000, mime: 'application/pdf' },
    { name: '客户交付验收单_盖章版.pdf', size: 620_000, mime: 'application/pdf' },
    { name: '商标注册申请材料汇总.pdf', size: 3_760_000, mime: 'application/pdf' },
    { name: '影视项目投资意向书.docx', size: 486_000, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { name: '数据合规承诺书_签署版.pdf', size: 318_000, mime: 'application/pdf' },
  ],
  image: [
    { name: '青峦系列_杭州西湖_20260412_RAW.CR3', size: 24_800_000, mime: 'image/x-canon-cr3' },
    { name: '山海拾遗_第三辑_插图_01.png', size: 8_640_000, mime: 'image/png' },
    { name: '2026年度品牌KV_主视觉.jpg', size: 12_300_000, mime: 'image/jpeg' },
    { name: '非遗纹样_矢量转位图_第2批.png', size: 6_120_000, mime: 'image/png' },
    { name: '产品包装设计_展开图_v3.jpg', size: 9_450_000, mime: 'image/jpeg' },
    { name: '城市夜景系列_钱江新城_01.jpg', size: 15_200_000, mime: 'image/jpeg' },
    { name: '插画原稿_扫描件_300dpi.tif', size: 28_100_000, mime: 'image/tiff' },
    { name: '电商详情页_主图_第4版.png', size: 4_320_000, mime: 'image/png' },
  ],
  video: [
    { name: '潮汐_品牌短片_4K成片.mp4', size: 1_460_000_000, mime: 'video/mp4' },
    { name: '城南旧巷_纪录片_素材带_03.mov', size: 2_180_000_000, mime: 'video/quicktime' },
    { name: '产品发布动画_1080p_v2.mp4', size: 386_000_000, mime: 'video/mp4' },
    { name: '非遗技艺记录_龙泉青瓷_原始素材.mp4', size: 968_000_000, mime: 'video/mp4' },
    { name: '广告片_30s_横版_终版.mp4', size: 214_000_000, mime: 'video/mp4' },
    { name: '课程录播_第12讲_高清.mp4', size: 742_000_000, mime: 'video/mp4' },
  ],
  audio: [
    { name: '潮汐_配乐_母带.wav', size: 68_400_000, mime: 'audio/wav' },
    { name: '有声书_第一章_干音.wav', size: 124_000_000, mime: 'audio/wav' },
    { name: '品牌声音标识_终版.mp3', size: 3_240_000, mime: 'audio/mpeg' },
    { name: '播客_第28期_混音成品.mp3', size: 42_600_000, mime: 'audio/mpeg' },
  ],
  code: [
    { name: '客流预测模型_训练代码_v1.8.tar.gz', size: 86_400_000, mime: 'application/gzip' },
    { name: '前端组件库_源码_v2.4.1.zip', size: 12_800_000, mime: 'application/zip' },
    { name: '存证服务_SDK_Node.zip', size: 4_260_000, mime: 'application/zip' },
    { name: '数据清洗脚本_20260930.py', size: 186_000, mime: 'text/x-python' },
  ],
  webpage: [
    { name: '侵权页面快照_20261012_142233.html', size: 3_840_000, mime: 'text/html' },
    { name: '商品详情页_存档_20260928.html', size: 2_160_000, mime: 'text/html' },
    { name: '公众号文章_取证快照.html', size: 1_240_000, mime: 'text/html' },
  ],
  design: [
    { name: '2026年度品牌KV_终稿_v3.psd', size: 268_000_000, mime: 'image/vnd.adobe.photoshop' },
    { name: '非遗纹样_矢量化_第2批.ai', size: 48_600_000, mime: 'application/postscript' },
    { name: '产品原型_v4.2_交互标注.rp', size: 18_400_000, mime: 'application/octet-stream' },
    { name: '包装结构设计_刀版图.ai', size: 32_200_000, mime: 'application/postscript' },
    { name: 'UI设计规范_组件库_v1.6.fig', size: 56_800_000, mime: 'application/octet-stream' },
  ],
  dataset: [
    { name: '法律文书语料_清洗后_20260930.jsonl', size: 8_640_000_000, mime: 'application/jsonl' },
    { name: '城市轨道交通客流预测数据集.csv', size: 2_480_000_000, mime: 'text/csv' },
    { name: '中文客服对话语料_v2.3.parquet', size: 12_600_000_000, mime: 'application/octet-stream' },
    { name: '商品图像标注集_第4批.zip', size: 24_800_000_000, mime: 'application/zip' },
    { name: '语音唤醒词样本集_2026Q3.tar', size: 6_320_000_000, mime: 'application/x-tar' },
  ],
  text: [
    { name: '短篇《潮汐》正文_终稿.txt', size: 42_000, mime: 'text/plain' },
    { name: '品牌 Slogan 备选_第3轮.txt', size: 12_000, mime: 'text/plain' },
    { name: '课程大纲_知识产权实务.txt', size: 28_000, mime: 'text/plain' },
  ],
};

const TITLE_POOL: Record<EvidenceType, string[]> = {
  document: ['品牌授权合同', '剧本杀剧本《长夜将明》', '年度版权运营方案', '非遗纹样使用说明', '客户交付验收单', '商标注册申请材料'],
  image: ['《青峦》系列风光摄影', '《山海拾遗·第三辑》插画', '年度品牌主视觉', '非遗纹样矢量化图稿', '产品包装设计展开图', '城市夜景系列'],
  video: ['《潮汐》品牌短片', '《城南旧巷》纪录片素材', '产品发布动画', '非遗技艺纪录影像', '广告片 30s 横版', '课程录播'],
  audio: ['《潮汐》配乐母带', '有声书第一章干音', '品牌声音标识', '播客第 28 期混音'],
  code: ['客流预测模型训练代码', '前端组件库源码', '存证服务 Node SDK', '数据清洗脚本'],
  webpage: ['侵权页面快照', '商品详情页存档', '公众号文章取证快照'],
  design: ['年度品牌 KV 设计稿', '非遗纹样矢量源文件', '产品原型交互标注', '包装结构刀版图', 'UI 设计规范组件库'],
  dataset: ['中文法律文书语料集', '城市轨道交通客流预测数据集', '中文客服对话语料集', '商品图像标注集', '语音唤醒词样本集'],
  text: ['短篇小说《潮汐》', '品牌 Slogan 备选', '课程大纲'],
};

const SUFFIXES = ['', '（终稿）', ' v2', ' 第2批', '（修订版）', ' 归档件', ' 定稿', ' 2026Q3'];

const TYPE_WEIGHTS: [EvidenceType, number][] = [
  ['document', 22],
  ['image', 24],
  ['video', 11],
  ['design', 12],
  ['dataset', 9],
  ['code', 7],
  ['webpage', 6],
  ['audio', 4],
  ['text', 5],
];

function weightedType(): EvidenceType {
  const total = TYPE_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [t, w] of TYPE_WEIGHTS) {
    r -= w;
    if (r <= 0) return t;
  }
  return 'document';
}

function statusByWeight(): EvidenceStatus {
  const r = rand();
  if (r < 0.88) return 'confirmed';
  if (r < 0.91) return 'confirming';
  if (r < 0.93) return 'pending';
  if (r < 0.97) return 'failed';
  return 'revoked';
}

const FAIL_MSGS = [
  'ERR_NODE_TIMEOUT 节点响应超时，请稍后重试',
  'ERR_QUOTA_EXCEEDED 套餐存证额度不足',
  'ERR_HASH_MISMATCH 文件校验不一致，已终止上链',
];

/** 生成带作息分布的历史时间 */
function historyDate(): string {
  let base: number;
  if (chance(0.55)) {
    base = NOW - rand() * 90 * 86400000;
  } else {
    const start = new Date('2025-03-01T00:00:00+08:00').getTime();
    const end = NOW - 90 * 86400000;
    base = start + rand() * (end - start);
  }
  const d = new Date(base);
  const hourPool = [9, 10, 10, 11, 11, 14, 14, 15, 15, 16, 16, 17, 18, 20];
  d.setHours(pick(hourPool), rint(0, 59), rint(0, 59), 0);
  return d.toISOString();
}

/* ------------------------------------------------------------------ */
/* 存证                                                                */
/* ------------------------------------------------------------------ */

function makeEvidence(i: number): Evidence {
  const type = weightedType();
  const file = pick(FILE_POOL[type]);
  const title = `${pick(TITLE_POOL[type])}${pick(SUFFIXES)}`;
  const createdAt = historyDate();
  const status = statusByWeight();
  const confirmed = status === 'confirmed' || status === 'revoked';
  const height = heightForDate(createdAt);
  const id = `EV-${createdAt.slice(0, 10).replace(/-/g, '')}-${pad(1000 + (i % 8999), 4)}`;
  const orgName = pick(ORGS);
  const ownerName = pick(PERSONS);
  const txHash = hexHash(`ev-tx-${id}`);

  return {
    id,
    title,
    type,
    fileName: file.name,
    fileSize: Math.round(file.size * (0.85 + rand() * 0.3)),
    mimeType: file.mime,
    hash: hexHash(`file-${id}-${file.name}`),
    algorithm: 'SHA-256',
    status,
    blockHeight: height,
    blockHash: blockHashOf(height),
    txHash,
    confirmations: Math.max(0, BASE_HEIGHT - height),
    chainName: '星火联盟链',
    chainId: 'xh-mainnet',
    ownerId: `u-${(i % 24) + 1}`,
    ownerName,
    orgId: `org-${(ORGS.indexOf(orgName) % 8) + 1}`,
    orgName,
    tags: Array.from(new Set([pick(EVIDENCE_TAGS), pick(EVIDENCE_TAGS)])).slice(0, 2),
    remark: chance(0.35) ? '创作完成后即时存证，保留完整时间戳证据。' : undefined,
    privacy: chance(0.6) ? 'private' : chance(0.6) ? 'org' : 'public',
    source: chance(0.62) ? 'web' : chance(0.5) ? 'api' : chance(0.6) ? 'batch' : 'cli',
    certificateNo: confirmed ? `XH-EV-${createdAt.slice(0, 7)}-${pad(312 + i, 6)}` : undefined,
    createdAt,
    confirmedAt: confirmed ? new Date(new Date(createdAt).getTime() + rint(2000, 8000)).toISOString() : undefined,
    verifyCount: rint(0, 46),
    errorMsg: status === 'failed' ? pick(FAIL_MSGS) : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* 权属                                                                */
/* ------------------------------------------------------------------ */

const RIGHTS_TITLES: Record<RightsCategory, string[]> = {
  copyright: ['《山海拾遗·第三辑》插画集', '《青峦》系列风光摄影', '《潮汐》品牌短片', '《长夜将明》剧本杀剧本', '非遗纹样矢量图库', '《城南旧巷》纪录片'],
  patent: ['一种基于区块链的文件存证方法', '一种分布式哈希校验装置', '数据脱敏处理方法及系统', '一种多节点共识调度方法'],
  trademark: ['拾光文创（第 41 类）', '砚山（第 35 类）', '云枢数元（第 42 类）', '锦官城动漫（第 9 类）'],
  software: ['星火存证服务端系统 V2.4', '客流预测模型训练平台 V1.8', '版权台账管理系统 V1.2', '素材授权分发平台 V3.0'],
  data_asset: ['中文法律文书语料集（v2.3）', '城市轨道交通客流预测数据集', '"云栖"智能客服对话数据集', '商品图像标注集（第 4 批）'],
  trade_secret: ['推荐算法特征工程方案', '客户分层运营模型参数', '素材定价策略模型'],
};

const RIGHT_CAT_LIST: RightsCategory[] = ['copyright', 'patent', 'trademark', 'software', 'data_asset', 'trade_secret'];

function rightsStatusByWeight(): RightsStatus {
  const r = rand();
  if (r < 0.78) return 'registered';
  if (r < 0.88) return 'reviewing';
  if (r < 0.905) return 'disputed';
  if (r < 0.965) return 'transferred';
  if (r < 0.985) return 'draft';
  return 'revoked';
}

function makeRights(i: number, evidences: Evidence[]): RightsRecord {
  const category = RIGHT_CAT_LIST[i % RIGHT_CAT_LIST.length];
  const title = pick(RIGHTS_TITLES[category]);
  const status = rightsStatusByWeight();
  const createdAt = historyDate();
  const isPerson = chance(0.55);
  const name = isPerson ? pick(PERSONS) : pick(ORGS);
  const owner = {
    type: (isPerson ? 'person' : 'org') as 'person' | 'org',
    name,
    idNo: isPerson ? `3301${rint(10, 99)}19${rint(70, 99)}${rint(10, 12)}${rint(10, 28)}${pad(rint(1, 9999), 4)}` : `9133010${rint(1, 9)}MA2${pick(['A', 'B', 'C', 'D', 'E'])}${rint(1000, 9999)}X`,
    did: didOf(`owner-${name}`),
    shareRatio: 100,
  };
  const coOwners =
    chance(0.28)
      ? [
          {
            type: 'person' as const,
            name: pick(PERSONS),
            idNo: `33010${rint(100, 999)}19${rint(70, 99)}${rint(10, 12)}${rint(10, 28)}${pad(rint(1, 9999), 4)}`,
            did: didOf(`co-${i}`),
            shareRatio: 30,
          },
        ]
      : [];
  if (coOwners.length) owner.shareRatio = 70;

  const linked = Array.from({ length: rint(1, 3) }).map(() => pick(evidences).id);
  const height = heightForDate(createdAt);
  const txHash = hexHash(`rights-tx-RR-2026-${pad(i, 6)}`);
  const regDate = new Date(new Date(createdAt).getTime() + rint(3, 30) * 3600000).toISOString();

  const events: RightsEvent[] = [
    { id: `${i}-e1`, type: 'register', title: '提交权属登记申请', operator: name, time: createdAt },
    { id: `${i}-e2`, type: 'review', title: '材料初审通过', operator: '审核员 · 许清和', time: new Date(new Date(createdAt).getTime() + 3600000).toISOString() },
  ];
  if (status !== 'draft' && status !== 'reviewing') {
    events.push({ id: `${i}-e3`, type: 'confirm', title: '链上确权完成，证书已签发', operator: '系统', time: regDate, txHash });
  }
  if (status === 'transferred') {
    events.push({ id: `${i}-e4`, type: 'transfer', title: `权属转让至 ${pick(ORGS)}`, operator: name, time: new Date(new Date(regDate).getTime() + 86400000 * rint(3, 40)).toISOString() });
  }
  if (status === 'disputed') {
    events.push({ id: `${i}-e5`, type: 'dispute', title: '收到第三方权属异议，进入审理流程', operator: '平台运营', time: new Date(new Date(regDate).getTime() + 86400000 * rint(2, 20)).toISOString() });
  }

  return {
    id: `RR-2026-${pad(i, 6)}`,
    title,
    category,
    subCategory: pick(SUB_CATEGORIES[category]),
    owner,
    coOwners,
    rightScope: Array.from(new Set([pick(RIGHT_SCOPES), pick(RIGHT_SCOPES), pick(RIGHT_SCOPES)])),
    evidenceIds: linked,
    status,
    registeredAt: status === 'registered' || status === 'transferred' || status === 'disputed' ? regDate : undefined,
    validFrom: regDate.slice(0, 10),
    validTo: `${2026 + rint(1, 10)}-${pad(rint(1, 12), 2)}-${pad(rint(1, 28), 2)}`,
    region: chance(0.75) ? '中国大陆' : chance(0.6) ? '全球' : '中国港澳台地区',
    firstPublishAt: new Date(new Date(createdAt).getTime() - 86400000 * rint(5, 200)).toISOString(),
    certificateNo: status === 'registered' || status === 'transferred' ? `XH-RR-2026-${pad(3120 + i, 6)}` : undefined,
    blockHeight: height,
    txHash,
    events,
    disputeId: status === 'disputed' ? `DP-2026-${pad(100 + i, 4)}` : undefined,
    orgName: isPerson ? pick(ORGS) : name,
  };
}

/* ------------------------------------------------------------------ */
/* 区块与交易                                                          */
/* ------------------------------------------------------------------ */

const TX_PATTERN = [3, 4, 5, 4, 3, 5, 4, 4];

export function buildChain(evidences: Evidence[], rights: RightsRecord[], contracts: Contract[]) {
  const blocks: Block[] = [];
  const txs: Transaction[] = [];
  const latestTime = NOW - 3000;

  for (let offset = 0; offset < 2400; offset++) {
    const height = BASE_HEIGHT - offset;
    const timestamp = new Date(latestTime - offset * BLOCK_TIME).toISOString();
    const txCount = TX_PATTERN[offset % TX_PATTERN.length];
    const node = NODE_LIST[offset % 4].name;
    blocks.push({
      height,
      hash: blockHashOf(height),
      parentHash: blockHashOf(height - 1),
      txCount,
      node,
      consensus: 'PBFT',
      duration: 1600 + ((offset * 137) % 900),
      timestamp,
      size: 1200 + txCount * 486 + ((offset * 53) % 400),
    });

    for (let k = 0; k < txCount; k++) {
      const seed = offset * 10 + k;
      const typeRoll = seed % 100;
      let type: TxType = 'evidence';
      if (typeRoll < 59) type = 'evidence';
      else if (typeRoll < 80) type = 'rights';
      else if (typeRoll < 89) type = 'contract';
      else if (typeRoll < 95) type = 'license';
      else if (typeRoll < 98) type = 'asset';
      else type = 'other';

      let bizId = '';
      let bizTitle = '';
      if (type === 'evidence') {
        const ev = evidences[seed % evidences.length];
        bizId = ev.id;
        bizTitle = ev.title;
      } else if (type === 'rights') {
        const r = rights[seed % rights.length];
        bizId = r.id;
        bizTitle = r.title;
      } else if (type === 'contract' && contracts.length) {
        const c = contracts[seed % contracts.length];
        bizId = c.id;
        bizTitle = c.title;
      } else if (type === 'license') {
        bizId = `LC-2026-${pad(100 + (seed % 800), 4)}`;
        bizTitle = '作品信息网络传播权许可';
      } else if (type === 'asset') {
        bizId = `DA-2026-${pad(1 + (seed % 42), 4)}`;
        bizTitle = '数据资产登记凭证';
      } else {
        bizId = `OP-2026-${pad(1000 + (seed % 8000), 4)}`;
        bizTitle = '链上治理记录';
      }

      const hash = hexHash(`tx-${height}-${k}-${bizId}`);
      txs.push({
        hash,
        type,
        blockHeight: height,
        from: addressOf(`from-${bizId}-${k}`),
        to: addressOf('contract-xh-registry'),
        bizId,
        bizTitle,
        status: (seed % 97 === 0 ? 'failed' : 'success') as 'success' | 'failed',
        timestamp,
        confirmations: offset + 1,
        payload: {
          chainId: 'xh-mainnet',
          contract: 'EvidenceRegistry',
          method: type === 'evidence' ? 'attest' : type === 'rights' ? 'confirmRights' : 'anchor',
          bizId,
          bizType: type,
          operator: addressOf(`op-${bizId}`),
          timestamp: Math.floor(new Date(timestamp).getTime() / 1000),
        },
      });
    }
  }

  return { blocks, txs };
}

/* ------------------------------------------------------------------ */
/* 合同                                                                */
/* ------------------------------------------------------------------ */

const CONTRACT_TITLES = [
  '《山海拾遗·第三辑》著作权转让合同',
  '《青峦》系列摄影作品授权许可合同',
  '中文法律文书语料集数据授权使用协议',
  '品牌年度设计服务保密协议',
  '《潮汐》品牌短片委托创作合同',
  '非遗纹样图库独占许可合同',
  '素材侵权和解协议',
  '知识产权综合服务协议',
];

function contractBody(title: string, a: string, b: string) {
  return `鉴于甲方 ${a} 系本合同项下标的作品的合法权利人，乙方 ${b} 拟依据本合同约定使用该作品，双方经友好协商，就「${title}」相关事宜达成如下条款：

第一条  标的与权利范围
1.1 本合同标的为甲方依法享有著作权的原创作品，其权属证明已在星火联盟链完成存证与确权登记，存证编号与本合同第 6.2 条载明一致。
1.2 甲方授予乙方的权利范围为：复制权、发行权、信息网络传播权；不含改编权与转授权。

第二条  使用期限与地域
2.1 授权期限自 2026 年 11 月 1 日起至 2029 年 10 月 31 日止。
2.2 授权地域为中华人民共和国境内（不含香港、澳门、台湾地区）。

第三条  对价与支付
3.1 本合同许可使用费为人民币 86,000 元（大写：捌万陆仟元整）。
3.2 乙方应于合同签署生效后 10 个工作日内一次性支付至甲方指定账户。

第四条  权利保证与侵权责任
4.1 甲方保证对标的作品享有完整、合法、有效的著作权，且未设定任何质押或第三方权利负担。
4.2 任何第三方就标的作品提出权利主张的，由甲方负责处理并承担相应责任。

第五条  违约与争议解决
5.1 一方违反本合同约定的，应赔偿守约方因此遭受的直接经济损失。
5.2 因本合同产生的争议，双方应协商解决；协商不成的，提交杭州仲裁委员会仲裁。

第六条  电子签署与存证
6.1 本合同采用电子签名方式签署，各方签署行为均通过实名认证，签署时间以链上时间戳为准。
6.2 本合同全文哈希值将于签署完成后写入星火联盟链，任何一方均可通过平台验签功能核验合同完整性。

（以下无正文）`;
}

function makeContract(i: number, evidences: Evidence[]): Contract {
  const statusRoll = rand();
  let status: Contract['status'] = 'completed';
  if (statusRoll < 0.62) status = 'completed';
  else if (statusRoll < 0.8) status = 'signing';
  else if (statusRoll < 0.88) status = 'pending';
  else if (statusRoll < 0.94) status = 'draft';
  else if (statusRoll < 0.98) status = 'expired';
  else status = 'cancelled';

  const createdAt = historyDate();
  const count = rint(2, 3);
  const signers: ContractSigner[] = Array.from({ length: count }).map((_, idx) => {
    const isOrg = idx === 0 ? chance(0.6) : chance(0.4);
    const name = isOrg ? pick(ORGS) : pick(PERSONS);
    let sStatus: ContractSigner['status'] = 'pending';
    if (status === 'completed') sStatus = 'signed';
    else if (status === 'signing') sStatus = idx === 0 ? 'signed' : 'pending';
    else if (status === 'expired' && idx === 0) sStatus = 'signed';
    return {
      id: `s-${i}-${idx}`,
      name,
      org: isOrg ? name : '个人',
      phone: `1${pick(['3', '5', '7', '8', '9'])}${pad(rint(100000000, 999999999), 9)}`,
      status: sStatus,
      signedAt: sStatus === 'signed' ? new Date(new Date(createdAt).getTime() + 3600000 * rint(1, 30)).toISOString() : undefined,
      sealText: name.slice(0, 4),
    };
  });

  const title = pick(CONTRACT_TITLES);
  const content = contractBody(title, signers[0].name, signers[1]?.name ?? '乙方');
  const ev = pick(evidences);

  return {
    id: `CT-2026-${pad(i, 4)}`,
    title,
    templateId: CONTRACT_TEMPLATES[i % CONTRACT_TEMPLATES.length].id,
    category: CONTRACT_TEMPLATES[i % CONTRACT_TEMPLATES.length].category,
    status,
    signers,
    content,
    hash: hexHash(`contract-${i}-${title}`),
    evidenceId: status === 'completed' ? ev.id : undefined,
    txHash: status === 'completed' ? hexHash(`contract-tx-${i}`) : undefined,
    createdAt,
    expireAt: new Date(new Date(createdAt).getTime() + 86400000 * 30).toISOString(),
    createdBy: pick(PERSONS),
    amount: pick([86000, 120000, 28000, 156000, 32000, 460000]),
  };
}

/* ------------------------------------------------------------------ */
/* 取证 / 证据包 / 出证                                                 */
/* ------------------------------------------------------------------ */

const TARGET_URLS = [
  'https://shop.example-mall.com/item/8823661',
  'https://mp.weixin.qq.com/s/xh-2026-art-0912',
  'https://www.example-video.cn/watch/play_8821',
  'https://detail.example-books.com/product/338291',
  'https://www.example-news.com/article/20260928/8821',
  'https://space.example-blog.com/post/2026/art-03',
];

function makeForensics(i: number): ForensicsTask {
  const type = pick(['webpage', 'webpage', 'screen', 'mobile', 'app'] as const);
  const createdAt = historyDate();
  const success = chance(0.9);
  return {
    id: `FZ-${createdAt.slice(0, 10).replace(/-/g, '')}-${pad(1000 + i, 4)}`,
    name: `${pick(['侵权页面取证', '商品详情页取证', '公众号文章取证', '短视频平台取证', '竞品页面取证'])} · ${createdAt.slice(5, 10)}`,
    type,
    target: type === 'webpage' ? pick(TARGET_URLS) : type === 'screen' ? 'PC 全屏录屏' : type === 'mobile' ? 'iPhone 15 Pro · 应用内取证' : 'Android 应用容器',
    status: success ? 'success' : chance(0.6) ? 'failed' : 'running',
    region: pick(['北京', '上海', '广州', '杭州']),
    device: type === 'mobile' ? 'mobile' : 'pc',
    duration: rint(18, 186),
    fileSize: rint(24, 860) * 1024 * 1024,
    evidenceHash: hexHash(`fz-${i}`),
    createdBy: pick(PERSONS),
    createdAt,
  };
}

function makePackage(i: number, evidences: Evidence[], forensics: ForensicsTask[], rights: RightsRecord[]): EvidencePackage {
  const createdAt = historyDate();
  const n = rint(3, 8);
  const items = Array.from({ length: n }).map((_, k) => {
    if (k % 3 === 0) {
      const f = pick(forensics);
      return { type: '网页取证', refId: f.id, name: f.name, hash: f.evidenceHash };
    }
    if (k % 3 === 1) {
      const e = pick(evidences);
      return { type: '存证证据', refId: e.id, name: e.title, hash: e.hash };
    }
    const r = pick(rights);
    return { type: '权属证明', refId: r.id, name: r.title, hash: r.txHash };
  });
  return {
    id: `PK-2026-${pad(i, 4)}`,
    name: `${pick(['侵权维权', '版权纠纷', '合同争议', '商标异议'])}证据包 · ${createdAt.slice(0, 7)}`,
    itemCount: items.length,
    totalSize: rint(80, 2400) * 1024 * 1024,
    integrityOk: true,
    items,
    createdAt,
    createdBy: pick(PERSONS),
    status: chance(0.7) ? 'sealed' : 'draft',
  };
}

const INSTITUTIONS: Record<string, string> = {
  notary: '杭州市西湖公证处',
  appraisal: '中科司法鉴定中心',
  report: '星火链证技术服务中心',
};

function makeJudicial(i: number, packages: EvidencePackage[]): JudicialOrder {
  const type = pick(['notary', 'notary', 'report', 'appraisal'] as const);
  const statusRoll = rand();
  let status: JudicialStatus = 'issued';
  if (statusRoll < 0.4) status = 'issued';
  else if (statusRoll < 0.65) status = 'delivered';
  else if (statusRoll < 0.8) status = 'reviewing';
  else if (statusRoll < 0.92) status = 'accepted';
  else status = 'submitted';
  const createdAt = historyDate();
  const steps = ['提交申请', '材料初审', '机构受理', '出具文书', '寄送送达'];
  const doneCount = ['submitted', 'reviewing', 'accepted', 'issued', 'delivered'].indexOf(status) + 1;
  const timeline = steps.map((t, idx) => ({
    title: t,
    done: idx < doneCount,
    time: idx < doneCount ? new Date(new Date(createdAt).getTime() + idx * 86400000 * 1.4).toISOString() : undefined,
    remark: idx === 1 && doneCount > 1 ? '材料齐全，格式符合要求' : undefined,
  }));
  const pkg = pick(packages);
  return {
    id: `JD-2026-${pad(i, 4)}`,
    type,
    packageId: pkg.id,
    packageName: pkg.name,
    institution: INSTITUTIONS[type],
    status,
    applicant: pick(PERSONS),
    amount: type === 'notary' ? 1200 : type === 'appraisal' ? 3800 : 680,
    submittedAt: createdAt,
    expectedAt: new Date(new Date(createdAt).getTime() + 86400000 * (type === 'appraisal' ? 12 : 6)).toISOString(),
    timeline,
  };
}

/* ------------------------------------------------------------------ */
/* 数据资产                                                            */
/* ------------------------------------------------------------------ */

const ASSET_DEFS = [
  { name: '中文法律文书语料集（v2.3）', category: 'text' as const, scale: '128.6 万条', volume: '8.6 GB', freq: '季度更新' },
  { name: '城市轨道交通客流预测数据集', category: 'structured' as const, scale: '2,480 万行', volume: '2.4 GB', freq: '每日增量' },
  { name: '"云栖"智能客服对话数据集', category: 'text' as const, scale: '46.2 万轮', volume: '12.6 GB', freq: '月度更新' },
  { name: '商品图像标注集（第 4 批）', category: 'image' as const, scale: '18.4 万张', volume: '24.8 GB', freq: '一次性交付' },
  { name: '语音唤醒词样本集 2026Q3', category: 'audio' as const, scale: '6.2 万条', volume: '6.3 GB', freq: '季度更新' },
  { name: '短视频内容理解标注集', category: 'video' as const, scale: '3.8 万段', volume: '186 GB', freq: '半年度' },
  { name: '电商评论情感标注语料', category: 'text' as const, scale: '52.4 万条', volume: '3.1 GB', freq: '月度更新' },
  { name: '工业设备振动信号数据集', category: 'structured' as const, scale: '1,260 万点', volume: '14.2 GB', freq: '每日采集' },
];

const FIELD_DEFS = [
  { name: 'doc_id', type: 'string', desc: '文书唯一标识', masked: false },
  { name: 'case_type', type: 'enum', desc: '案件类型（民事/刑事/行政）', masked: false },
  { name: 'court_name', type: 'string', desc: '审理法院名称', masked: false },
  { name: 'judge_name', type: 'string', desc: '审判人员姓名', masked: true },
  { name: 'party_name', type: 'string', desc: '当事人名称（已脱敏）', masked: true },
  { name: 'id_number', type: 'string', desc: '身份证号（哈希后存储）', masked: true },
  { name: 'judgment_date', type: 'date', desc: '裁判日期', masked: false },
  { name: 'cause', type: 'string', desc: '案由', masked: false },
  { name: 'content', type: 'text', desc: '文书正文（分段）', masked: false },
  { name: 'label', type: 'enum', desc: '人工标注结果', masked: false },
];

function makeAsset(i: number, rights: RightsRecord[]): DataAsset {
  const def = ASSET_DEFS[i % ASSET_DEFS.length];
  const createdAt = historyDate();
  const rs = chance(0.7) ? 'registered' : chance(0.6) ? 'reviewing' : 'unregistered';
  const r = pick(rights);
  return {
    id: `DA-2026-${pad(i + 1, 4)}`,
    name: def.name,
    category: def.category,
    scale: def.scale,
    volume: def.volume,
    updateFreq: def.freq,
    rightStatus: rs,
    certNo: rs === 'registered' ? `XH-DA-2026-${pad(2600 + i, 6)}` : undefined,
    source: pick(['自有业务系统采集', '公开数据清洗', '合作方授权提供', '用户授权提交']),
    desc: '数据来源于业务系统脱敏导出，已完成去标识化处理，不含个人敏感信息。数据规模、字段口径与更新频率均在登记时完成校验，使用范围限定于模型训练与效果评估。',
    fields: FIELD_DEFS,
    licenses: Array.from({ length: rint(1, 3) }).map(() => ({
      licensee: pick(ORGS),
      scope: pick(['模型训练', '内部评测', '产品集成', '联合建模']),
      startAt: new Date(new Date(createdAt).getTime() + 86400000 * rint(1, 20)).toISOString().slice(0, 10),
      endAt: `2027-${pad(rint(1, 12), 2)}-${pad(rint(1, 28), 2)}`,
      status: chance(0.75) ? ('active' as const) : chance(0.5) ? ('expired' as const) : ('revoked' as const),
    })),
    usages: Array.from({ length: rint(3, 8) }).map(() => ({
      caller: pick(ORGS),
      purpose: pick(['模型训练', '效果评测', '数据标注', '算法调优']),
      time: new Date(NOW - rand() * 60 * 86400000).toISOString(),
      hash: hexHash(`usage-${i}-${rand()}`),
      status: chance(0.92) ? ('success' as const) : ('rejected' as const),
    })),
    createdAt,
    orgName: pick(ORGS),
    ...(r ? {} : {}),
  };
}

/* ------------------------------------------------------------------ */
/* 组织 / 日志 / 通知                                                   */
/* ------------------------------------------------------------------ */

const MEMBER_DEFS: { name: string; role: RoleCode; dep: string; color: string }[] = [
  { name: '沈亦舟', role: 'org_admin', dep: '内容中心', color: '#3D7DFF' },
  { name: '陈默', role: 'creator', dep: '内容中心', color: '#22D3EE' },
  { name: '林知远', role: 'creator', dep: '品牌市场部', color: '#8B5CF6' },
  { name: '苏念', role: 'legal', dep: '法务合规部', color: '#2DD4A7' },
  { name: '周砚', role: 'auditor', dep: '法务合规部', color: '#F5B544' },
  { name: '许清和', role: 'auditor', dep: '法务合规部', color: '#FF5C7A' },
  { name: '顾南枝', role: 'creator', dep: '内容中心', color: '#38BDF8' },
  { name: '程屿', role: 'creator', dep: '技术研发部', color: '#3D7DFF' },
  { name: '宋清野', role: 'legal', dep: '法务合规部', color: '#8B5CF6' },
  { name: '叶怀山', role: 'viewer', dep: '财务部', color: '#63718A' },
  { name: '方知白', role: 'creator', dep: '内容中心', color: '#22D3EE' },
  { name: '江砚秋', role: 'creator', dep: '品牌市场部', color: '#2DD4A7' },
  { name: '温故', role: 'viewer', dep: '数据运营部', color: '#F5B544' },
  { name: '陆停云', role: 'creator', dep: '技术研发部', color: '#38BDF8' },
  { name: '裴照', role: 'legal', dep: '法务合规部', color: '#FF5C7A' },
  { name: '元朗', role: 'creator', dep: '内容中心', color: '#3D7DFF' },
  { name: '祁连', role: 'auditor', dep: '法务合规部', color: '#8B5CF6' },
  { name: '钟晚', role: 'creator', dep: '品牌市场部', color: '#22D3EE' },
  { name: '商屿', role: 'creator', dep: '数据运营部', color: '#2DD4A7' },
  { name: '闻笛', role: 'viewer', dep: '财务部', color: '#63718A' },
  { name: '傅时', role: 'creator', dep: '技术研发部', color: '#F5B544' },
  { name: '简宁', role: 'legal', dep: '法务合规部', color: '#38BDF8' },
  { name: '沈砚白', role: 'platform_admin', dep: '技术研发部', color: '#FF5C7A' },
  { name: '苏折', role: 'creator', dep: '内容中心', color: '#8B5CF6' },
];

function makeMembers(): Member[] {
  return MEMBER_DEFS.map((m, i) => ({
    id: `u-${i + 1}`,
    name: m.name,
    avatarColor: m.color,
    phone: `1${pick(['3', '5', '7', '8', '9'])}${pad(rint(100000000, 999999999), 9)}`,
    email: `user${i + 1}@xh-chain.cn`,
    role: m.role,
    department: m.dep,
    status: i === 23 ? 'disabled' : 'active',
    lastLoginAt: new Date(NOW - rand() * 7 * 86400000).toISOString(),
    joinedAt: new Date(NOW - rand() * 500 * 86400000).toISOString(),
  }));
}

const AUDIT_ACTIONS = [
  { action: '登录系统', target: '—' },
  { action: '创建存证', target: 'EV-' },
  { action: '登记权属', target: 'RR-' },
  { action: '签署合同', target: 'CT-' },
  { action: '发起取证', target: 'FZ-' },
  { action: '申请出证', target: 'JD-' },
  { action: '导出数据', target: '存证记录' },
  { action: '邀请成员', target: '内容中心' },
  { action: '创建密钥', target: 'AK-' },
  { action: '审核权属', target: 'RR-' },
];

function makeAuditLogs(evidences: Evidence[], rights: RightsRecord[], contracts: Contract[]): AuditLog[] {
  return Array.from({ length: 1200 }).map((_, i) => {
    const a = pick(AUDIT_ACTIONS);
    let target = a.target;
    if (target === 'EV-') target = pick(evidences).id;
    else if (target === 'RR-') target = pick(rights).id;
    else if (target === 'CT-') target = pick(contracts).id;
    else if (target === 'FZ-') target = `FZ-20261012-00${rint(10, 99)}`;
    else if (target === 'JD-') target = `JD-2026-00${rint(10, 24)}`;
    else if (target === 'AK-') target = `AK${rint(100000, 999999)}`;
    return {
      id: `LOG-${pad(i + 1, 6)}`,
      operator: pick(MEMBER_DEFS).name,
      action: a.action,
      target,
      ip: `${pick([10, 58, 101, 114, 121, 223])}.${rint(0, 255)}.${rint(0, 255)}.${rint(1, 254)}`,
      result: (chance(0.96) ? 'success' : 'fail') as 'success' | 'fail',
      time: new Date(NOW - rand() * 30 * 86400000).toISOString(),
    };
  }).sort((a, b) => (a.time < b.time ? 1 : -1));
}

function makeNotifications(): NotificationItem[] {
  const defs = [
    { type: 'biz' as const, title: '权属登记审核通过', content: '您提交的「《山海拾遗·第三辑》插画集」权属登记已审核通过，证书已签发并上链。' },
    { type: 'biz' as const, title: '合同待签署', content: '《青峦》系列摄影作品授权许可合同等待您签署，请于 3 日内完成。' },
    { type: 'audit' as const, title: '出证材料需补充', content: '公证书申请 JD-2026-0018 缺少权利证明附件，请补充后重新提交。' },
    { type: 'system' as const, title: '平台版本更新', content: 'XH-CHAIN v2.4.1 已发布：新增数据资产登记模块，优化上链确认速度。' },
    { type: 'biz' as const, title: '侵权线索命中', content: '监测任务命中 3 条疑似侵权链接，相似度均超过 85%，建议尽快取证。' },
    { type: 'system' as const, title: '套餐额度提醒', content: '本月存证额度已使用 82%，剩余 1,080 条，可前往账单页升级套餐。' },
  ];
  return Array.from({ length: 36 }).map((_, i) => {
    const d = defs[i % defs.length];
    return {
      id: `NT-${pad(i + 1, 4)}`,
      type: d.type,
      title: d.title,
      content: d.content,
      read: i > 6,
      time: new Date(NOW - i * 3600000 * rint(2, 20)).toISOString(),
    };
  });
}

function makeDisputes(rights: RightsRecord[]): DisputeCase[] {
  const disputed = rights.filter((r) => r.status === 'disputed');
  const statuses: DisputeCase['status'][] = ['pending', 'hearing', 'mediated', 'rejected', 'judged'];
  return disputed.slice(0, 6).map((r, i) => {
    const createdAt = new Date(NOW - (i + 2) * 86400000 * 3).toISOString();
    const st = statuses[i % statuses.length];
    const doneCount = statuses.indexOf(st) + 1;
    const steps = ['异议提交', '平台受理', '双方举证', '调解或裁决'];
    return {
      id: `DP-2026-${pad(101 + i, 4)}`,
      rightsId: r.id,
      rightsTitle: r.title,
      claimant: pick(ORGS),
      reason: pick([
        '主张该作品系其委托创作成果，权属应归其所有，并提交了创作过程稿与聊天记录。',
        '认为登记作品与其已发表作品构成实质性相似，要求撤销登记。',
        '主张共有份额分配不实，实际出资比例与登记信息不符。',
      ]),
      status: st,
      createdAt,
      proofs: Array.from({ length: rint(2, 4) }).map((_, k) => ({
        name: pick(['创作过程稿.zip', '首发链接截图.png', '委托创作协议.pdf', '沟通记录导出.txt']),
        hash: hexHash(`proof-${i}-${k}`),
        size: rint(200, 8000) * 1024,
      })),
      timeline: steps.map((t, idx) => ({
        title: t,
        done: idx < doneCount,
        time: idx < doneCount ? new Date(new Date(createdAt).getTime() + idx * 86400000).toISOString() : undefined,
      })),
    };
  });
}

function makeMonitorHits(): MonitorHit[] {
  const platforms = ['淘宝', '拼多多', '微信公众号', '抖音', '小红书', 'B 站', '京东', '闲鱼'];
  return Array.from({ length: 14 }).map((_, i) => ({
    id: `MH-2026-${pad(100 + i, 4)}`,
    platform: pick(platforms),
    url: `https://item.${pick(['taobao', 'pdd', 'douyin', 'xiaohongshu'])}.com/${rint(1000000, 9999999)}`,
    similarity: rint(72, 98),
    foundAt: new Date(NOW - rand() * 14 * 86400000).toISOString(),
    status: i < 5 ? 'new' : i < 10 ? 'confirmed' : 'ignored',
    originalTitle: pick(['《山海拾遗·第三辑》插画集', '《青峦》系列风光摄影', '非遗纹样矢量图库']),
  }));
}

function makeApiKeys(): ApiKey[] {
  return [
    { id: 'k1', name: '生产环境 · 存证服务', accessKey: 'AK7F3A9C2E4B81D05C6A', secretKey: 'sk_live_9f2c8a71b3e64d0f5a1c', status: 'active', createdAt: '2026-03-12T09:20:00+08:00', lastUsedAt: new Date(NOW - 120000).toISOString(), callCount: 328416 },
    { id: 'k2', name: '测试环境 · 沙箱', accessKey: 'AK2B8E1F6C9D34A7E0B5', secretKey: 'sk_test_4d7e2b91c8f3a605d2e9', status: 'active', createdAt: '2026-05-08T14:02:00+08:00', lastUsedAt: new Date(NOW - 3600000 * 6).toISOString(), callCount: 42186 },
    { id: 'k3', name: '数据同步 · 只读', accessKey: 'AK9C4D2A7E1B85F30A6D', secretKey: 'sk_live_1a5f8c3e9b72d04a6f8c', status: 'disabled', createdAt: '2025-11-21T10:45:00+08:00', lastUsedAt: '2026-07-30T16:21:00+08:00', callCount: 120884 },
  ];
}

function makeNodes(): ChainNode[] {
  return NODE_LIST.map((n, i) => ({
    id: n.id,
    name: n.name,
    region: n.region,
    role: n.role,
    status: i === 6 ? 'syncing' : 'online',
    blocks: BASE_HEIGHT - rint(0, 40) - (i === 6 ? 128 : 0),
    cpu: rint(12, 68),
    memory: rint(28, 74),
    disk: rint(22, 61),
    latency: rint(8, 46),
    version: 'v2.4.1',
    address: addressOf(`node-${n.id}`),
  }));
}

/* ------------------------------------------------------------------ */
/* 组装                                                                */
/* ------------------------------------------------------------------ */

export interface MockDB {
  evidences: Evidence[];
  rights: RightsRecord[];
  contracts: Contract[];
  blocks: Block[];
  txs: Transaction[];
  nodes: ChainNode[];
  forensics: ForensicsTask[];
  packages: EvidencePackage[];
  judicial: JudicialOrder[];
  assets: DataAsset[];
  members: Member[];
  audits: AuditLog[];
  notifications: NotificationItem[];
  disputes: DisputeCase[];
  monitorHits: MonitorHit[];
  apiKeys: ApiKey[];
}

export function buildDB(): MockDB {
  const evidences = Array.from({ length: 480 }).map((_, i) => makeEvidence(i));
  const rights = Array.from({ length: 120 }).map((_, i) => makeRights(i + 1, evidences));
  const contracts = Array.from({ length: 86 }).map((_, i) => makeContract(i + 1, evidences));
  const { blocks, txs } = buildChain(evidences, rights, contracts);
  const forensics = Array.from({ length: 64 }).map((_, i) => makeForensics(i + 1));
  const packages = Array.from({ length: 38 }).map((_, i) => makePackage(i + 1, evidences, forensics, rights));
  const judicial = Array.from({ length: 24 }).map((_, i) => makeJudicial(i + 1, packages));
  const assets = Array.from({ length: 42 }).map((_, i) => makeAsset(i, rights));
  const members = makeMembers();
  const audits = makeAuditLogs(evidences, rights, contracts);
  const notifications = makeNotifications();
  const disputes = makeDisputes(rights);
  const monitorHits = makeMonitorHits();
  const apiKeys = makeApiKeys();
  const nodes = makeNodes();

  // 回填存证 → 权属关联
  const rightsByEvidence = new Map<string, string>();
  rights.forEach((r) => r.evidenceIds.forEach((eid) => rightsByEvidence.set(eid, r.id)));
  evidences.forEach((e) => {
    const rid = rightsByEvidence.get(e.id);
    if (rid) e.relatedRightsId = rid;
  });

  return {
    evidences,
    rights,
    contracts,
    blocks,
    txs,
    nodes,
    forensics,
    packages,
    judicial,
    assets,
    members,
    audits,
    notifications,
    disputes,
    monitorHits,
    apiKeys,
  };
}
