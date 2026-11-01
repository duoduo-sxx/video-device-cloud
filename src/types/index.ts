/* ============================================================
 * 投见 AdLens · 跨平台广告数据智能分析平台
 * 类型定义：全部围绕「投放数据处理 → 人群洞察 → 优化执行」闭环
 * ============================================================ */

export type ID = string;
export type DateStr = string; // YYYY-MM-DD
export type Period = string; // YYYY-MM

/* ---------------- 投放平台 ---------------- */
export type PlatformCode = 'oceanengine' | 'tencent' | 'kuaishou' | 'baidu' | 'xiaohongshu' | 'bilibili';

export interface Platform {
  code: PlatformCode;
  name: string; // 巨量引擎
  product: string; // 抖音信息流
  short: string; // 抖音
  color: string;
  /** 平台侧数据口径备注，体现「口径对齐」这一实际工程问题 */
  caliber: string;
}

export type AccountStatus = 'active' | 'paused' | 'auth_expired' | 'balance_low';

export interface AdAccount {
  id: ID;
  platform: PlatformCode;
  name: string;
  advertiserId: string;
  /** 投放目标 */
  objective: '成交' | '加购' | '种草' | '直播成交' | '线索';
  status: AccountStatus;
  balance: number;
  dailyBudget: number;
  lastSyncAt: string;
  owner: string;
  /** 基础投放参数（用于生成确定性数据） */
  base: {
    daily: number; // 基准日消耗
    cpm: number;
    ctr: number;
    cvr: number;
    aov: number;
  };
}

/* ---------------- 基础量（唯一数据源） ---------------- */
export interface Metrics {
  impressions: number; // 曝光
  clicks: number; // 点击
  spend: number; // 消耗（元）
  conversions: number; // 下单（转化）
  paidOrders: number; // 支付成功单
  gmv: number; // 成交金额（元）
  reach: number; // 触达人数
}

export interface DailyRow extends Metrics {
  date: DateStr;
  accountId: ID;
  platform: PlatformCode;
}

/* ---------------- 计划 / 创意 / 素材 ---------------- */
export type PlanStatus = 'delivering' | 'paused' | 'limited' | 'learn' | 'ended';

export interface AdPlan {
  id: ID;
  accountId: ID;
  name: string;
  objective: string;
  bidType: 'oCPM' | 'CPC' | 'CPM';
  bid: number;
  dailyBudget: number;
  status: PlanStatus;
  /** 计划在账户内的消耗权重，用于把账户月汇总拆分到计划（保证 Σ计划 = 账户） */
  weight: number;
  startDate: DateStr;
  /** 月汇总指标 */
  m: Metrics;
}

export type MaterialType = '短视频' | '图文' | '直播切片' | '达人视频' | '搜索图文';

export interface Creative {
  id: ID;
  planId: ID;
  accountId: ID;
  name: string; // 素材标题/文案
  materialType: MaterialType;
  materialId: ID;
  status: 'active' | 'paused' | 'rejected';
  /** 7 日 CTR 衰减曲线（用于判断素材疲劳） */
  decay: number[];
  m: Metrics;
}

export interface Material {
  id: ID;
  name: string;
  type: MaterialType;
  duration: number; // 秒，图文为 0
  angle: string; // 卖点角度
  fatigue: number; // 疲劳度 0-1
  planCount: number;
  m: Metrics;
}

/* ---------------- 人群洞察 ---------------- */
export type AudienceDim = 'gender' | 'age' | 'city' | 'interest' | 'device' | 'hour';

export interface AudienceSegment {
  dim: AudienceDim;
  label: string;
  /** 该人群占总转化比例 0-1（同维度内合计为 1） */
  convShare: number;
  /** 该人群占总消耗比例 0-1（同维度内合计为 1） */
  spendShare: number;
  /** 大盘基准占比（行业），用于算 TGI */
  benchmarkShare: number;
  /** 以下为聚合计算结果 */
  conversions: number;
  spend: number;
  gmv: number;
  cpa: number;
  roi: number;
  /** 转化占比 / 大盘占比 × 100 */
  tgi: number;
}

export interface LookalikePack {
  id: ID;
  name: string;
  seed: string; // 种子人群说明
  coverage: number; // 覆盖人数
  similarity: number; // 相似度
  status: 'ready' | 'building' | 'used';
  planCount: number;
  /** 使用该人群包的在投计划 */
  planIds: string[];
  roi: number;
  createdAt: string;
}

export interface TargetProfile {
  planId: string;
  title: string;
  summary: string;
  coreTags: string[];
  sizeEstimate: number;
  roi: number;
  cpa: number;
  cvrLift: number; // 相对大盘提升倍数
}

/**
 * 单个广告（计划）在投放后台设置的定向条件。
 * scope 为该维度允许命中的标签，缺省视为「不限」。
 */
export interface PlanTargeting {
  planId: string;
  scope: Record<AudienceDim, string[]>;
}

/**
 * 定向设定 vs 实际触达的偏差：同一个人群维度，设置的圈选范围与真实转化结构的差距。
 * hitRate = 定向范围内标签的转化占比；spill = 1 - hitRate，即「跑到圈外的人」。
 */
export interface TargetingHit {
  dim: AudienceDim;
  /** 定向设定的人类可读文案，由 scope 自动生成 */
  settingText: string;
  /** 定向范围内的转化占比 */
  hitRate: number;
  /** 定向外溢出占比 */
  spillShare: number;
  /** 该维度是否做了定向收窄（false = 全量投放，命中率无意义） */
  open: boolean;
  /** 定向内实际浓度 / 自然基准浓度，>1 说明定向起作用 */
  lift: number;
  /** 实际转化 Top1 标签 */
  actualTop: string;
  actualTopShare: number;
  /** 圈外占比最大的标签（跑偏的主要来源） */
  spillLabel: string;
  spillShareOfLabel: number;
  spillTgi: number;
  verdict: 'ok' | 'spill' | 'drift';
  note: string;
}

/** 一个广告的人群画像：六个维度各自独立分布，维度内合计 100% */
export type PlanAudience = Record<AudienceDim, AudienceSegment[]>;

/* ---------------- 归因 ---------------- */
export type AttributionModel = 'last' | 'first' | 'linear' | 'time_decay' | 'data_driven';

export interface AttributionRow {
  model: AttributionModel;
  /** 各平台归因转化数，合计必须等于总转化 */
  byPlatform: Record<PlatformCode, number>;
  total: number;
}

export interface TouchPath {
  path: string; // 巨量引擎 → 小红书 → 腾讯广告
  conversions: number;
  share: number;
  avgTouch: number;
  avgDays: number;
  roi: number;
}

/* ---------------- 漏斗 ---------------- */
export interface FunnelStage {
  key: string;
  label: string;
  count: number;
  /** 相对上一级转化率 */
  stepRate: number;
  /** 相对首环节转化率 */
  totalRate: number;
  benchmark: number; // 行业基准 stepRate
}

/* ---------------- 数据接入与数仓 ---------------- */
export type SyncStatus = 'success' | 'running' | 'failed' | 'waiting';

export interface SyncJob {
  id: ID;
  accountId: ID;
  platform: PlatformCode;
  type: 'incremental' | 'full';
  status: SyncStatus;
  startedAt: string;
  durationSec: number;
  rows: number;
  watermark: string; // 数据水位线
  retry: number;
  message?: string;
}

export interface QualityCheck {
  id: ID;
  table: string;
  rule: string;
  category: '完整性' | '唯一性' | '及时性' | '一致性' | '有效性';
  totalRows: number;
  affectedRows: number;
  severity: 'high' | 'medium' | 'low';
  status: 'passed' | 'warning' | 'failed';
  detail: string;
  checkedAt: string;
}

export type LayerCode = 'ODS' | 'DWD' | 'DWS' | 'ADS';

export interface DataField {
  name: string;
  type: string;
  desc: string;
  pii?: boolean;
}

export interface DataTable {
  id: ID;
  name: string;
  cnName: string;
  layer: LayerCode;
  rows: number;
  size: string;
  updateFreq: string;
  owner: string;
  updatedAt: string;
  upstream: ID[];
  downstream: ID[];
  fields: DataField[];
  desc: string;
  /** 样例数据，用于表详情展示，字段与 fields 对应 */
  sample: Record<string, string | number>[];
}

export interface MetricDef {
  key: string;
  name: string;
  en: string;
  formula: string;
  unit: string;
  desc: string;
  caliber: string;
  /** 与平台后台口径是否存在差异 */
  diff: string;
}

/* ---------------- 诊断与优化 ---------------- */
export type AnomalyType = 'cost_up' | 'cvr_down' | 'volume_drop' | 'material_fatigue' | 'budget_pace' | 'quality';

export interface Anomaly {
  id: ID;
  type: AnomalyType;
  target: string;
  accountId: ID;
  metric: string;
  current: string;
  baseline: string;
  changePct: number;
  level: 'high' | 'medium' | 'low';
  detectedAt: string;
  /** 归因链：逐层下钻找到的根因 */
  causeChain: { label: string; value: string; note: string }[];
  conclusion: string;
  suggestionId?: ID;
}

export type SuggestionType = 'budget' | 'bid' | 'targeting' | 'creative' | 'landing';
export type SuggestionStatus = 'pending' | 'adopted' | 'dispatched' | 'ignored';

export interface Suggestion {
  id: ID;
  type: SuggestionType;
  title: string;
  target: string;
  accountId: ID;
  /** 问题 */
  problem: string;
  /** 数据依据 */
  evidence: { label: string; value: string; compare?: string }[];
  /** 建议动作 */
  action: string;
  /** 预估影响 */
  impact: { conversions: number; cpa: number; roi: number; note: string };
  confidence: number; // 0-1
  status: SuggestionStatus;
  createdAt: string;
}

export type ChangeStatus = 'pending_approval' | 'dispatched' | 'effective' | 'failed';

export interface ChangeOrder {
  id: ID;
  suggestionId?: ID;
  accountId: ID;
  target: string;
  type: SuggestionType;
  before: string;
  after: string;
  status: ChangeStatus;
  createdAt: string;
  effectiveAt: string | null;
  operator: string;
  /** 7 日效果回收 */
  feedback?: {
    days: number;
    conversionsDelta: number;
    cpaDelta: number;
    roiDelta: number;
    note: string;
  };
}

export interface BudgetPlan {
  planId: ID;
  name: string;
  accountName: string;
  currentBudget: number;
  suggestedBudget: number;
  currentCpa: number;
  marginalRoi: number; // 边际 ROI
  /** 弹性系数：预算变化 1% 对应转化变化 % */
  elasticity: number;
}

/* ---------------- 对账 ---------------- */
export interface ReconcileRow {
  platform: PlatformCode;
  accountCount: number;
  platformSpend: number; // 平台后台
  ourSpend: number; // 我方采集
  platformConv: number;
  ourConv: number;
  diffRate: number;
  status: 'matched' | 'diff';
  note: string;
}

/* ---------------- 人 / 权限 ---------------- */
export type RoleCode = 'lead' | 'optimizer' | 'analyst';

export interface Role {
  code: RoleCode;
  name: string;
  desc: string;
  permissions: string[];
}

export interface User {
  id: ID;
  name: string;
  role: RoleCode;
  title: string;
  avatar: string;
}

/* ---------------- 中文标签 ---------------- */
export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  active: '投放中',
  paused: '已暂停',
  auth_expired: '授权过期',
  balance_low: '余额预警',
};

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  delivering: '投放中',
  paused: '已暂停',
  limited: '预算受限',
  learn: '学习期',
  ended: '已结束',
};

export const SYNC_STATUS_LABEL: Record<SyncStatus, string> = {
  success: '成功',
  running: '同步中',
  failed: '失败',
  waiting: '排队中',
};

export const SUGGESTION_TYPE_LABEL: Record<SuggestionType, string> = {
  budget: '预算调整',
  bid: '出价调整',
  targeting: '定向优化',
  creative: '素材优化',
  landing: '落地页',
};

export const SUGGESTION_STATUS_LABEL: Record<SuggestionStatus, string> = {
  pending: '待处理',
  adopted: '已采纳',
  dispatched: '已下发',
  ignored: '已忽略',
};

export const CHANGE_STATUS_LABEL: Record<ChangeStatus, string> = {
  pending_approval: '待审批',
  dispatched: '已下发',
  effective: '已生效',
  failed: '执行失败',
};

export const ANOMALY_TYPE_LABEL: Record<AnomalyType, string> = {
  cost_up: '成本上涨',
  cvr_down: '转化下滑',
  volume_drop: '掉量',
  material_fatigue: '素材疲劳',
  budget_pace: '预算节奏',
  quality: '数据异常',
};

export const ATTR_MODEL_LABEL: Record<AttributionModel, string> = {
  last: '末次点击',
  first: '首次点击',
  linear: '线性归因',
  time_decay: '时间衰减',
  data_driven: '数据驱动',
};

export const DIM_LABEL: Record<AudienceDim, string> = {
  gender: '性别',
  age: '年龄',
  city: '城市等级',
  interest: '兴趣标签',
  device: '设备',
  hour: '活跃时段',
};

export const LAYER_LABEL: Record<LayerCode, string> = {
  ODS: 'ODS 原始层',
  DWD: 'DWD 明细层',
  DWS: 'DWS 汇总层',
  ADS: 'ADS 应用层',
};
